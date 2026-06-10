package com.decidely.api.api.analysis;

import com.decidely.api.api.analysis.dto.table.AlternativeAnalysisDTO;
import com.decidely.api.api.analysis.dto.table.AlternativeDTO;
import com.decidely.api.api.analysis.dto.table.CriterionDTO;
import com.decidely.api.api.analysis.dto.table.DominationDTO;
import com.decidely.api.api.analysis.dto.table.TableAnalysisRequest;
import com.decidely.api.api.analysis.dto.table.TableAnalysisResultDTO;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
public class TableEvaluationService {

    private static final String DIRECTION_HIGHER = "HIGHER";
    private static final String DOM_STRICT = "STRICT";
    private static final String DOM_PRACTICAL = "PRACTICAL";

    private static final String MISSING_DATA_WARNING =
            "Alternatywy zawierające puste komórki zostały pominięte w zaawansowanej analizie dominacji.";

    public TableAnalysisResultDTO evaluate(TableAnalysisRequest request) {
        int altCount = request.alternatives().size();
        int objCount = request.criteria().size();

        Set<Integer> rejectedSet = new HashSet<>(request.rejectedAlternativeIndices());

        List<Integer> activeAlts = IntStream.range(0, altCount)
                .filter(c -> !rejectedSet.contains(c))
                .filter(c -> IntStream.range(0, objCount)
                        .anyMatch(r -> resolvedValue(request, r, c) != null))
                .boxed()
                .collect(Collectors.toList());

        List<Integer> detectedEqualizedCriteria = detectEqualizedCriteria(
                request,
                objCount,
                activeAlts
        );

        Set<Integer> equalizedSet = new HashSet<>(request.equalizedCriterionIndices());
        equalizedSet.addAll(detectedEqualizedCriteria);

        List<Integer> activeCriteria = IntStream.range(0, objCount)
                .filter(r -> !equalizedSet.contains(r))
                .filter(r -> activeAlts.stream()
                        .anyMatch(c -> resolvedValue(request, r, c) != null))
                .boxed()
                .collect(Collectors.toList());

        List<Integer> completeAlts = activeAlts.stream()
                .filter(c -> activeCriteria.stream()
                        .allMatch(r -> resolvedValue(request, r, c) != null))
                .collect(Collectors.toList());

        Map<Integer, Map<Integer, Integer>> rankMatrix =
                computeRankMatrix(request, activeCriteria, activeAlts);

        List<String> altNames = request.alternatives().stream()
                .map(AlternativeDTO::name)
                .collect(Collectors.toList());

        List<String> critNames = request.criteria().stream()
                .map(CriterionDTO::name)
                .collect(Collectors.toList());

        Map<Integer, DominationDTO> dominationResults =
                computeDomination(activeCriteria, completeAlts, rankMatrix, altNames, critNames);

        Integer winnerIndex = determineWinner(
                completeAlts,
                activeAlts,
                activeCriteria,
                rankMatrix,
                dominationResults
        );

        Map<Integer, AlternativeAnalysisDTO> results = new HashMap<>();
        for (int c = 0; c < altCount; c++) {
            if (rejectedSet.contains(c)) {
                continue;
            }

            results.put(
                    c,
                    new AlternativeAnalysisDTO(
                            completeAlts.contains(c),
                            Integer.valueOf(c).equals(winnerIndex),
                            dominationResults.get(c)
                    )
            );
        }

        List<String> warnings = new ArrayList<>();

        if (completeAlts.size() < activeAlts.size()) {
            warnings.add(MISSING_DATA_WARNING);
        }
        for (int r : detectedEqualizedCriteria) {
            String critName = request.criteria().get(r).name();
            warnings.add(
                    "Cel '" + critName + "' posiada identyczne wartości dla wszystkich aktywnych alternatyw, przez co nie wpływa na ranking. Został automatycznie pominięty w trybie kompromisów i rankingu."
            );
        }

        return new TableAnalysisResultDTO(results, winnerIndex, warnings);
    }

    /**
     * Detects criteria that have identical resolved values for all active alternatives.
     */
    private List<Integer> detectEqualizedCriteria(
            TableAnalysisRequest request,
            int objCount,
            List<Integer> activeAlts
    ) {
        if (activeAlts.size() <= 1) {
            return List.of();
        }

        List<Integer> equalizedCriteria = new ArrayList<>();

        for (int r = 0; r < objCount; r++) {
            Double firstValue = null;
            boolean allEqual = true;

            for (int c : activeAlts) {
                Double value = resolvedValue(request, r, c);

                if (value == null) {
                    allEqual = false;
                    break;
                }

                if (firstValue == null) {
                    firstValue = value;
                    continue;
                }

                if (Double.compare(firstValue, value) != 0) {
                    allEqual = false;
                    break;
                }
            }

            if (allEqual && firstValue != null) {
                equalizedCriteria.add(r);
            }
        }

        return equalizedCriteria;
    }

    /**
     * Computes dense rankings per active criterion. Equal values receive the same rank.
     */
    private Map<Integer, Map<Integer, Integer>> computeRankMatrix(
            TableAnalysisRequest request,
            List<Integer> activeCriteria,
            List<Integer> activeAlts
    ) {
        Map<Integer, Map<Integer, Integer>> rankMatrix = new HashMap<>();

        for (int r : activeCriteria) {
            boolean higherIsBetter = DIRECTION_HIGHER.equalsIgnoreCase(
                    request.criteria().get(r).sortDirection()
            );

            List<Map.Entry<Integer, Double>> entries = new ArrayList<>();
            for (int c : activeAlts) {
                Double value = resolvedValue(request, r, c);

                if (value != null && Double.isFinite(value)) {
                    entries.add(Map.entry(c, value));
                }
            }

            entries.sort((a, b) -> higherIsBetter
                    ? Double.compare(b.getValue(), a.getValue())
                    : Double.compare(a.getValue(), b.getValue()));

            Map<Integer, Integer> rowRanks = new HashMap<>();
            int currentRank = 1;

            for (int i = 0; i < entries.size(); i++) {
                if (i > 0 && Double.compare(
                        entries.get(i).getValue(),
                        entries.get(i - 1).getValue()
                ) != 0) {
                    currentRank++;
                }

                rowRanks.put(entries.get(i).getKey(), currentRank);
            }

            rankMatrix.put(r, rowRanks);
        }

        return rankMatrix;
    }

    /**
     * Detects strict Pareto domination and practical domination between complete alternatives.
     */
    private Map<Integer, DominationDTO> computeDomination(
            List<Integer> activeCriteria,
            List<Integer> completeAlts,
            Map<Integer, Map<Integer, Integer>> rankMatrix,
            List<String> altNames,
            List<String> critNames
    ) {
        Map<Integer, DominationDTO> results = new HashMap<>();

        for (int a : completeAlts) {
            DominationDTO strictDom = null;
            DominationDTO practicalDom = null;

            for (int b : completeAlts) {
                if (a == b) {
                    continue;
                }

                boolean bAlwaysBetterOrEqual = true;
                boolean bStrictlyBetterAtLeastOnce = false;
                int aExceptionsCount = 0;
                int aExceptionCritIdx = -1;
                int aExceptionRankDiff = 0;

                for (int r : activeCriteria) {
                    Map<Integer, Integer> rowRanks = rankMatrix.get(r);

                    if (rowRanks == null) {
                        continue;
                    }

                    Integer rankA = rowRanks.get(a);
                    Integer rankB = rowRanks.get(b);

                    if (rankA == null || rankB == null) {
                        continue;
                    }

                    if (rankB < rankA) {
                        bStrictlyBetterAtLeastOnce = true;
                    } else if (rankB > rankA) {
                        bAlwaysBetterOrEqual = false;
                        aExceptionsCount++;
                        aExceptionCritIdx = r;
                        aExceptionRankDiff = rankB - rankA;
                    }
                }

                if (bAlwaysBetterOrEqual && bStrictlyBetterAtLeastOnce) {
                    strictDom = new DominationDTO(DOM_STRICT, altNames.get(b), null);
                    break;
                }

                if (aExceptionsCount == 1
                        && aExceptionRankDiff == 1
                        && bStrictlyBetterAtLeastOnce
                        && practicalDom == null) {
                    String exCritName = aExceptionCritIdx >= 0 && aExceptionCritIdx < critNames.size()
                            ? critNames.get(aExceptionCritIdx)
                            : null;

                    practicalDom = new DominationDTO(DOM_PRACTICAL, altNames.get(b), exCritName);
                }
            }

            if (strictDom != null) {
                results.put(a, strictDom);
            } else if (practicalDom != null) {
                results.put(a, practicalDom);
            }
        }

        return results;
    }

    /**
     * Returns a winner only when the result is unambiguous.
     */
    private Integer determineWinner(
            List<Integer> completeAlts,
            List<Integer> activeAlts,
            List<Integer> activeCriteria,
            Map<Integer, Map<Integer, Integer>> rankMatrix,
            Map<Integer, DominationDTO> dominationResults
    ) {
        if (completeAlts.isEmpty() || activeCriteria.isEmpty()) {
            return null;
        }

        if (completeAlts.size() != activeAlts.size()) {
            return null;
        }

        if (completeAlts.size() == 1) {
            return completeAlts.get(0);
        }

        List<Integer> perfectAlts = completeAlts.stream()
                .filter(c -> activeCriteria.stream().allMatch(r -> {
                    Map<Integer, Integer> rowRanks = rankMatrix.get(r);
                    return rowRanks != null && Integer.valueOf(1).equals(rowRanks.get(c));
                }))
                .collect(Collectors.toList());

        if (perfectAlts.size() == 1) {
            return perfectAlts.get(0);
        }

        List<Integer> contenders = completeAlts.stream()
                .filter(c -> {
                    DominationDTO dom = dominationResults.get(c);
                    return dom == null || !DOM_STRICT.equals(dom.type());
                })
                .collect(Collectors.toList());

        return contenders.size() == 1 ? contenders.get(0) : null;
    }

    private Double resolvedValue(TableAnalysisRequest request, int row, int col) {
        Double value = request.resolvedMatrix().get(row + "-" + col);
        return value == null || !Double.isFinite(value) ? null : value;
    }
}