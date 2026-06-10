package com.decidely.api.api.analysis;

import com.decidely.api.api.analysis.dto.tree.NodeEvaluationDTO;
import com.decidely.api.api.analysis.dto.tree.TreeAnalysisRequest;
import com.decidely.api.api.analysis.dto.tree.TreeAnalysisResultDTO;
import com.decidely.api.api.analysis.dto.tree.TreeEdgeDTO;
import com.decidely.api.api.analysis.dto.tree.TreeNodeDTO;
import com.decidely.api.exception.ValidationException;
import org.springframework.stereotype.Service;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Queue;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class TreeEvaluationService {

    private static final String NODE_TYPE_DECISION = "decision";
    private static final String NODE_TYPE_CHANCE = "chance";
    private static final String NODE_TYPE_TERMINAL = "terminal";
    private static final String OPTIMIZATION_MODE_MIN = "MIN";

    private static final double PROBABILITY_EPSILON = 0.001;

    private static final ThreadLocal<DecimalFormat> DECIMAL_FORMATTER = ThreadLocal.withInitial(() ->
            new DecimalFormat("0.##", new DecimalFormatSymbols(Locale.US))
    );

    public TreeAnalysisResultDTO evaluate(TreeAnalysisRequest request) {
        if (request.nodes() == null || request.nodes().isEmpty()) {
            return new TreeAnalysisResultDTO(
                    Collections.emptyMap(),
                    Collections.emptyList(),
                    List.of("Brak węzłów do analizy.")
            );
        }

        List<TreeEdgeDTO> safeEdges = request.edges() != null
                ? request.edges()
                : Collections.emptyList();

        validateGraphStructure(request.nodes(), safeEdges);

        Map<String, TreeNodeDTO> nodesMap = request.nodes()
                .stream()
                .collect(Collectors.toMap(TreeNodeDTO::id, Function.identity()));

        Map<String, List<TreeEdgeDTO>> outgoingEdges = safeEdges.stream()
                .collect(Collectors.groupingBy(TreeEdgeDTO::source));

        List<String> warnings = validateProbabilities(request.nodes(), outgoingEdges);

        Map<String, NodeEvaluationDTO> evaluationMap = new HashMap<>();
        Set<String> visiting = new HashSet<>();

        for (TreeNodeDTO node : request.nodes()) {
            if (!evaluationMap.containsKey(node.id())) {
                calculateEmv(
                        node.id(),
                        nodesMap,
                        outgoingEdges,
                        request.evaluationMode(),
                        evaluationMap,
                        visiting,
                        warnings
                );
            }
        }

        List<String> winningPath = traceWinningPath(
                request.nodes(),
                safeEdges,
                nodesMap,
                evaluationMap
        );

        return new TreeAnalysisResultDTO(evaluationMap, winningPath, warnings);
    }

    private void validateGraphStructure(
            List<TreeNodeDTO> nodes,
            List<TreeEdgeDTO> edges
    ) {
        Set<String> nodeIds = new HashSet<>();

        for (TreeNodeDTO node : nodes) {
            if (!nodeIds.add(node.id())) {
                throw new ValidationException("Duplicate tree node id: " + node.id());
            }
        }

        Set<String> edgeIds = new HashSet<>();

        for (TreeEdgeDTO edge : edges) {
            if (!edgeIds.add(edge.id())) {
                throw new ValidationException("Duplicate tree edge id: " + edge.id());
            }

            if (!nodeIds.contains(edge.source())) {
                throw new ValidationException("Edge source does not exist: " + edge.source());
            }

            if (!nodeIds.contains(edge.target())) {
                throw new ValidationException("Edge target does not exist: " + edge.target());
            }
        }
    }

    private NodeEvaluationDTO calculateEmv(
            String nodeId,
            Map<String, TreeNodeDTO> nodesMap,
            Map<String, List<TreeEdgeDTO>> outgoingEdges,
            String optimizationMode,
            Map<String, NodeEvaluationDTO> memo,
            Set<String> visiting,
            List<String> warnings
    ) {
        if (memo.containsKey(nodeId)) {
            return memo.get(nodeId);
        }

        if (visiting.contains(nodeId)) {
            warnings.add(
                    "Wykryto zapętlenie grafu (cykl) przy węźle '" + nodeId
                            + "'. Wartość oczekiwana została wymuszona na 0."
            );

            return new NodeEvaluationDTO(0.0, null, "BŁĄD: CYKL");
        }

        visiting.add(nodeId);

        TreeNodeDTO node = nodesMap.get(nodeId);
        if (node == null) {
            visiting.remove(nodeId);
            return new NodeEvaluationDTO(0, null, "0");
        }

        List<TreeEdgeDTO> childrenEdges = outgoingEdges.getOrDefault(
                nodeId,
                Collections.emptyList()
        );

        NodeEvaluationDTO result;

        if (NODE_TYPE_TERMINAL.equals(node.type()) || childrenEdges.isEmpty()) {
            double payoff = node.data() != null && node.data().payoff() != null
                    ? node.data().payoff()
                    : 0.0;

            result = new NodeEvaluationDTO(payoff, null, formatEqNum(payoff));
        } else if (NODE_TYPE_CHANCE.equals(node.type())) {
            result = evaluateChanceNode(
                    childrenEdges,
                    nodesMap,
                    outgoingEdges,
                    optimizationMode,
                    memo,
                    visiting,
                    warnings
            );
        } else if (NODE_TYPE_DECISION.equals(node.type())) {
            result = evaluateDecisionNode(
                    childrenEdges,
                    nodesMap,
                    outgoingEdges,
                    optimizationMode,
                    memo,
                    visiting,
                    warnings
            );
        } else {
            result = new NodeEvaluationDTO(0, null, "0");
        }

        memo.put(nodeId, result);
        visiting.remove(nodeId);

        return result;
    }

    private NodeEvaluationDTO evaluateChanceNode(
            List<TreeEdgeDTO> childrenEdges,
            Map<String, TreeNodeDTO> nodesMap,
            Map<String, List<TreeEdgeDTO>> outgoingEdges,
            String optimizationMode,
            Map<String, NodeEvaluationDTO> memo,
            Set<String> visiting,
            List<String> warnings
    ) {
        double expectedValue = 0.0;
        List<String> equationParts = new ArrayList<>();

        for (TreeEdgeDTO edge : childrenEdges) {
            double probability = edge.data() != null && edge.data().probability() != null
                    ? edge.data().probability()
                    : 0.0;

            double edgeCost = edge.data() != null && edge.data().cost() != null
                    ? edge.data().cost()
                    : 0.0;

            NodeEvaluationDTO childResult = calculateEmv(
                    edge.target(),
                    nodesMap,
                    outgoingEdges,
                    optimizationMode,
                    memo,
                    visiting,
                    warnings
            );

            double branchValue = childResult.emv() + edgeCost;
            expectedValue += branchValue * probability;

            equationParts.add(
                    "(" + formatEqNum(probability) + " × " + formatEqNum(branchValue) + ")"
            );
        }

        return new NodeEvaluationDTO(expectedValue, null, String.join(" + ", equationParts));
    }

    private NodeEvaluationDTO evaluateDecisionNode(
            List<TreeEdgeDTO> childrenEdges,
            Map<String, TreeNodeDTO> nodesMap,
            Map<String, List<TreeEdgeDTO>> outgoingEdges,
            String optimizationMode,
            Map<String, NodeEvaluationDTO> memo,
            Set<String> visiting,
            List<String> warnings
    ) {
        boolean isMinimization = OPTIMIZATION_MODE_MIN.equalsIgnoreCase(optimizationMode);
        double bestValue = isMinimization
                ? Double.POSITIVE_INFINITY
                : Double.NEGATIVE_INFINITY;

        String bestEdgeId = null;
        List<String> equationParts = new ArrayList<>();

        for (TreeEdgeDTO edge : childrenEdges) {
            double edgeCost = edge.data() != null && edge.data().cost() != null
                    ? edge.data().cost()
                    : 0.0;

            NodeEvaluationDTO childResult = calculateEmv(
                    edge.target(),
                    nodesMap,
                    outgoingEdges,
                    optimizationMode,
                    memo,
                    visiting,
                    warnings
            );

            double currentBranchValue = childResult.emv() + edgeCost;
            equationParts.add(formatEqNum(currentBranchValue));

            boolean isBetter = isMinimization
                    ? currentBranchValue < bestValue
                    : currentBranchValue > bestValue;

            if (isBetter) {
                bestValue = currentBranchValue;
                bestEdgeId = edge.id();
            }
        }

        String operator = isMinimization ? "MIN" : "MAX";

        return new NodeEvaluationDTO(
                bestValue,
                bestEdgeId,
                operator + "(" + String.join(", ", equationParts) + ")"
        );
    }

    private List<String> validateProbabilities(
            List<TreeNodeDTO> nodes,
            Map<String, List<TreeEdgeDTO>> outgoingEdges
    ) {
        List<String> warnings = new ArrayList<>();

        for (TreeNodeDTO node : nodes) {
            if (!NODE_TYPE_CHANCE.equals(node.type())) {
                continue;
            }

            List<TreeEdgeDTO> childrenEdges = outgoingEdges.getOrDefault(
                    node.id(),
                    Collections.emptyList()
            );

            if (childrenEdges.isEmpty()) {
                continue;
            }

            double sum = childrenEdges.stream()
                    .mapToDouble(edge -> edge.data() != null && edge.data().probability() != null
                            ? edge.data().probability()
                            : 0.0)
                    .sum();

            if (Math.abs(sum - 1.0) > PROBABILITY_EPSILON) {
                warnings.add(
                        "Suma prawdopodobieństw dla węzła losowego '" + node.id()
                                + "' nie wynosi 100%."
                );
            }
        }

        return warnings;
    }

    private List<String> traceWinningPath(
            List<TreeNodeDTO> nodes,
            List<TreeEdgeDTO> edges,
            Map<String, TreeNodeDTO> nodesMap,
            Map<String, NodeEvaluationDTO> evaluationMap
    ) {
        Set<String> winningPathSet = new LinkedHashSet<>();
        Set<String> visitedNodes = new HashSet<>();

        Set<String> targetNodes = edges.stream()
                .map(TreeEdgeDTO::target)
                .collect(Collectors.toSet());

        Optional<TreeNodeDTO> rootNodeOpt = nodes.stream()
                .filter(node -> (NODE_TYPE_DECISION.equals(node.type())
                        || NODE_TYPE_CHANCE.equals(node.type()))
                        && !targetNodes.contains(node.id()))
                .findFirst();

        if (rootNodeOpt.isEmpty()) {
            return new ArrayList<>(winningPathSet);
        }

        Queue<String> queue = new LinkedList<>();
        queue.add(rootNodeOpt.get().id());

        while (!queue.isEmpty()) {
            String currentNodeId = queue.poll();

            if (!visitedNodes.add(currentNodeId)) {
                continue;
            }

            winningPathSet.add(currentNodeId);

            NodeEvaluationDTO evaluation = evaluationMap.get(currentNodeId);
            TreeNodeDTO currentNode = nodesMap.get(currentNodeId);

            if (currentNode == null) {
                continue;
            }

            if (NODE_TYPE_DECISION.equals(currentNode.type())
                    && evaluation != null
                    && evaluation.bestChoiceEdgeId() != null) {
                edges.stream()
                        .filter(edge -> edge.id().equals(evaluation.bestChoiceEdgeId()))
                        .findFirst()
                        .ifPresent(optimalEdge -> {
                            winningPathSet.add(optimalEdge.id());

                            if (!visitedNodes.contains(optimalEdge.target())) {
                                queue.add(optimalEdge.target());
                            }
                        });
            } else if (NODE_TYPE_CHANCE.equals(currentNode.type())) {
                edges.stream()
                        .filter(edge -> edge.source().equals(currentNodeId))
                        .forEach(edge -> {
                            winningPathSet.add(edge.id());

                            if (!visitedNodes.contains(edge.target())) {
                                queue.add(edge.target());
                            }
                        });
            }
        }

        return new ArrayList<>(winningPathSet);
    }

    private String formatEqNum(double num) {
        return DECIMAL_FORMATTER.get().format(num);
    }
}