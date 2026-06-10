package com.decidely.api.api.analysis;

import com.decidely.api.api.analysis.dto.tree.TreeAnalysisRequest;
import com.decidely.api.api.analysis.dto.tree.TreeAnalysisResultDTO;
import com.decidely.api.api.analysis.dto.tree.TreeEdgeDTO;
import com.decidely.api.api.analysis.dto.tree.TreeNodeDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import com.decidely.api.exception.ValidationException;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TreeEvaluationServiceTest {

    private TreeEvaluationService treeService;

    @BeforeEach
    void setUp() {
        treeService = new TreeEvaluationService();
    }

    @Test
    void shouldCalculateStandardExpectedMonetaryValue() {
        List<TreeNodeDTO> nodes = List.of(
                node("A", "decision", null),
                node("B", "chance", null),
                node("C", "terminal", 100.0),
                node("D", "terminal", 50.0)
        );

        List<TreeEdgeDTO> edges = List.of(
                edge("E1", "A", "B", 10.0, null),
                edge("E2", "B", "C", 0.0, 0.6),
                edge("E3", "B", "D", 0.0, 0.4)
        );

        TreeAnalysisResultDTO result = treeService.evaluate(request(nodes, edges, "MAX"));

        assertEquals(80.0, result.evaluationMap().get("B").emv());
        assertEquals(90.0, result.evaluationMap().get("A").emv());
        assertEquals("E1", result.evaluationMap().get("A").bestChoiceEdgeId());
        assertTrue(result.warnings().isEmpty(), "Valid graph should not produce warnings");
    }

    @Test
    void shouldPreventStackOverflowOnCyclicGraphs() {
        List<TreeNodeDTO> nodes = List.of(
                node("A", "decision", null),
                node("B", "chance", null)
        );

        List<TreeEdgeDTO> edges = List.of(
                edge("E1", "A", "B", 0.0, null),
                edge("E2", "B", "A", 0.0, 1.0)
        );

        TreeAnalysisResultDTO result = treeService.evaluate(request(nodes, edges, "MAX"));

        assertEquals(0.0, result.evaluationMap().get("B").emv());

        List<String> warnings = result.warnings();
        assertEquals(1, warnings.size(), "Cycle should produce exactly one warning");

        String warning = warnings.get(0);
        assertTrue(warning.contains("Wykryto zapętlenie grafu"), "Warning should mention a graph cycle");
        assertTrue(warning.contains("węźle 'A'"), "Warning should identify the node where the cycle was detected");
    }

    @Test
    void shouldTolerateFloatingPointImprecisionForProbabilities() {
        List<TreeNodeDTO> nodes = List.of(
                node("A", "chance", null),
                node("B", "terminal", 10.0),
                node("C", "terminal", 10.0),
                node("D", "terminal", 10.0)
        );

        List<TreeEdgeDTO> edges = List.of(
                edge("E1", "A", "B", 0.0, 0.333),
                edge("E2", "A", "C", 0.0, 0.333),
                edge("E3", "A", "D", 0.0, 0.334)
        );

        TreeAnalysisResultDTO result = treeService.evaluate(request(nodes, edges, "MAX"));

        assertTrue(result.warnings().isEmpty(), "Small floating-point deviations should be tolerated");
    }

    @Test
    void shouldGenerateWarningWhenProbabilitiesDoNotSumTo100() {
        List<TreeNodeDTO> nodes = List.of(
                node("A", "chance", null),
                node("B", "terminal", 10.0)
        );

        List<TreeEdgeDTO> edges = List.of(
                edge("E1", "A", "B", 0.0, 0.5)
        );

        TreeAnalysisResultDTO result = treeService.evaluate(request(nodes, edges, "MAX"));

        List<String> warnings = result.warnings();
        assertEquals(1, warnings.size(), "Invalid probability sum should produce exactly one warning");

        String warning = warnings.get(0);
        assertTrue(warning.contains("nie wynosi 100%"), "Warning should mention invalid probability sum");
        assertTrue(warning.contains("węzła losowego 'A'"), "Warning should identify the affected chance node");
    }

    @Test
    void shouldHandleOrphanNodesAndNullDataSafely() {
        List<TreeNodeDTO> nodes = List.of(
                new TreeNodeDTO("A", "decision", null),
                new TreeNodeDTO("B", "terminal", new TreeNodeDTO.NodeData(null, null))
        );

        List<TreeEdgeDTO> edges = List.of(
                new TreeEdgeDTO("E1", "A", "B", null)
        );

        TreeAnalysisResultDTO result = treeService.evaluate(request(nodes, edges, "MAX"));

        assertEquals(0.0, result.evaluationMap().get("B").emv());
        assertEquals(0.0, result.evaluationMap().get("A").emv());
    }

    @Test
    void shouldOptimizeForMinimization() {
        List<TreeNodeDTO> nodes = List.of(
                node("Root", "decision", null),
                node("Path1", "terminal", 100.0),
                node("Path2", "terminal", 20.0)
        );

        List<TreeEdgeDTO> edges = List.of(
                edge("E1", "Root", "Path1", 0.0, null),
                edge("E2", "Root", "Path2", 0.0, null)
        );

        TreeAnalysisResultDTO result = treeService.evaluate(request(nodes, edges, "MIN"));

        assertEquals(20.0, result.evaluationMap().get("Root").emv());
        assertEquals("E2", result.evaluationMap().get("Root").bestChoiceEdgeId());
    }

    @Test
    void shouldCalculateCorrectEMVWithNegativePayoffsAndCosts() {
        List<TreeNodeDTO> nodes = List.of(
                node("D", "decision", null),
                node("C", "chance", null),
                node("Win", "terminal", 1000.0),
                node("Lose", "terminal", -200.0)
        );

        List<TreeEdgeDTO> edges = List.of(
                edge("E1", "D", "C", -500.0, null),
                edge("E2", "C", "Win", 0.0, 0.6),
                edge("E3", "C", "Lose", 0.0, 0.4)
        );

        TreeAnalysisResultDTO result = treeService.evaluate(request(nodes, edges, "MAX"));

        assertEquals(520.0, result.evaluationMap().get("C").emv(), 0.001);
        assertEquals(20.0, result.evaluationMap().get("D").emv(), 0.001);
        assertTrue(result.warnings().isEmpty());
    }

    @Test
    void shouldHandleOrphanNodeInDisconnectedGraph() {
        List<TreeNodeDTO> nodes = List.of(
                node("Root", "decision", null),
                node("Child", "terminal", 100.0),
                node("Orphan", "terminal", 999.0)
        );

        List<TreeEdgeDTO> edges = List.of(
                edge("E1", "Root", "Child", 0.0, null)
        );

        TreeAnalysisResultDTO result = assertDoesNotThrow(
                () -> treeService.evaluate(request(nodes, edges, "MAX"))
        );

        assertEquals(100.0, result.evaluationMap().get("Root").emv(), 0.001);
    }

    @Test
    void shouldNotCrashOnSelfLoop() {
        List<TreeNodeDTO> nodes = List.of(
                node("A", "chance", null)
        );

        List<TreeEdgeDTO> edges = List.of(
                edge("E1", "A", "A", 0.0, 1.0)
        );

        TreeAnalysisResultDTO result = assertDoesNotThrow(
                () -> treeService.evaluate(request(nodes, edges, "MAX"))
        );

        assertFalse(result.warnings().isEmpty(), "Self-loop should produce a warning");
    }

    private TreeAnalysisRequest request(
            List<TreeNodeDTO> nodes,
            List<TreeEdgeDTO> edges,
            String evaluationMode
    ) {
        return new TreeAnalysisRequest(nodes, edges, evaluationMode);
    }

    private TreeNodeDTO node(String id, String type, Double payoff) {
        return new TreeNodeDTO(id, type, new TreeNodeDTO.NodeData(payoff, null));
    }

    private TreeEdgeDTO edge(
            String id,
            String source,
            String target,
            Double cost,
            Double probability
    ) {
        return new TreeEdgeDTO(
                id,
                source,
                target,
                new TreeEdgeDTO.EdgeData(cost, probability)
        );
    }

    @Test
    void shouldRejectDuplicateTreeNodeIds() {
        List<TreeNodeDTO> nodes = List.of(
                node("A", "decision", null),
                node("A", "terminal", 10.0)
        );

        List<TreeEdgeDTO> edges = List.of();

        assertThrows(
                ValidationException.class,
                () -> treeService.evaluate(request(nodes, edges, "MAX"))
        );
    }

    @Test
    void shouldRejectDuplicateTreeEdgeIds() {
        List<TreeNodeDTO> nodes = List.of(
                node("A", "decision", null),
                node("B", "terminal", 10.0),
                node("C", "terminal", 20.0)
        );

        List<TreeEdgeDTO> edges = List.of(
                edge("E1", "A", "B", 0.0, null),
                edge("E1", "A", "C", 0.0, null)
        );

        assertThrows(
                ValidationException.class,
                () -> treeService.evaluate(request(nodes, edges, "MAX"))
        );
    }

    @Test
    void shouldRejectEdgePointingToMissingNode() {
        List<TreeNodeDTO> nodes = List.of(
                node("A", "decision", null)
        );

        List<TreeEdgeDTO> edges = List.of(
                edge("E1", "A", "B", 0.0, null)
        );

        assertThrows(
                ValidationException.class,
                () -> treeService.evaluate(request(nodes, edges, "MAX"))
        );
    }
}