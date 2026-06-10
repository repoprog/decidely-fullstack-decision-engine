package com.decidely.api.api.analysis;

import com.decidely.api.api.analysis.dto.table.AlternativeAnalysisDTO;
import com.decidely.api.api.analysis.dto.table.AlternativeDTO;
import com.decidely.api.api.analysis.dto.table.CriterionDTO;
import com.decidely.api.api.analysis.dto.table.TableAnalysisRequest;
import com.decidely.api.api.analysis.dto.table.TableAnalysisResultDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TableEvaluationServiceTest {

    private TableEvaluationService tableService;

    @BeforeEach
    void setUp() {
        tableService = new TableEvaluationService();
    }

    @Test
    void shouldFindStrictDominationAndWinner() {
        List<AlternativeDTO> alts = List.of(
                new AlternativeDTO(0, "Alt0"),
                new AlternativeDTO(1, "Alt1")
        );

        List<CriterionDTO> crits = List.of(
                new CriterionDTO(0, "Crit0", "HIGHER"),
                new CriterionDTO(1, "Crit1", "LOWER")
        );

        Map<String, Double> matrix = new HashMap<>();
        matrix.put("0-0", 10.0);
        matrix.put("0-1", 20.0);
        matrix.put("1-0", 50.0);
        matrix.put("1-1", 10.0);

        TableAnalysisResultDTO result = tableService.evaluate(
                request(alts, crits, matrix, List.of(), List.of())
        );

        assertEquals(1, result.winnerIndex());

        AlternativeAnalysisDTO alt0Result = result.results().get(0);

        assertNotNull(alt0Result.domination());
        assertEquals("STRICT", alt0Result.domination().type());
        assertEquals("Alt1", alt0Result.domination().dominatedByName());
        assertTrue(result.warnings().isEmpty());
    }

    @Test
    void shouldKeepStrictDominationAsymmetric() {
        List<AlternativeDTO> alts = List.of(
                new AlternativeDTO(0, "Alt0"),
                new AlternativeDTO(1, "Alt1")
        );

        List<CriterionDTO> crits = List.of(
                new CriterionDTO(0, "Crit0", "HIGHER"),
                new CriterionDTO(1, "Crit1", "HIGHER")
        );

        Map<String, Double> matrix = new HashMap<>();
        matrix.put("0-0", 10.0);
        matrix.put("0-1", 100.0);
        matrix.put("1-0", 10.0);
        matrix.put("1-1", 100.0);

        TableAnalysisResultDTO result = tableService.evaluate(
                request(alts, crits, matrix, List.of(), List.of())
        );

        AlternativeAnalysisDTO alt0 = result.results().get(0);
        AlternativeAnalysisDTO alt1 = result.results().get(1);

        assertNotNull(alt0.domination(), "Alt0 should be dominated by Alt1");
        assertEquals("Alt1", alt0.domination().dominatedByName());
        assertNull(alt1.domination(), "Alt1 must not be dominated by Alt0");
    }

    @Test
    void shouldFindPracticalDomination() {
        List<AlternativeDTO> alts = List.of(
                new AlternativeDTO(0, "Alt0"),
                new AlternativeDTO(1, "Alt1")
        );

        List<CriterionDTO> crits = List.of(
                new CriterionDTO(0, "Crit0", "HIGHER"),
                new CriterionDTO(1, "Crit1", "HIGHER")
        );

        Map<String, Double> matrix = new HashMap<>();
        matrix.put("0-0", 10.0);
        matrix.put("0-1", 90.0);
        matrix.put("1-0", 55.0);
        matrix.put("1-1", 50.0);

        TableAnalysisResultDTO result = tableService.evaluate(
                request(alts, crits, matrix, List.of(), List.of())
        );

        assertNull(result.winnerIndex());

        AlternativeAnalysisDTO alt0Result = result.results().get(0);

        assertNotNull(alt0Result.domination());
        assertEquals("PRACTICAL", alt0Result.domination().type());
        assertEquals("Alt1", alt0Result.domination().dominatedByName());
        assertEquals("Crit1", alt0Result.domination().exceptionalCriterionName());
    }

    @Test
    void shouldNotTriggerPracticalDominationWhenRankDifferenceIsMoreThanOne() {
        List<AlternativeDTO> alts = List.of(
                new AlternativeDTO(0, "Alt0"),
                new AlternativeDTO(1, "Alt1"),
                new AlternativeDTO(2, "Alt2")
        );

        List<CriterionDTO> crits = List.of(
                new CriterionDTO(0, "Crit0", "HIGHER"),
                new CriterionDTO(1, "Crit1", "HIGHER")
        );

        Map<String, Double> matrix = new HashMap<>();
        matrix.put("0-0", 100.0);
        matrix.put("0-1", 10.0);
        matrix.put("0-2", 50.0);
        matrix.put("1-0", 50.0);
        matrix.put("1-1", 100.0);
        matrix.put("1-2", 10.0);

        TableAnalysisResultDTO result = tableService.evaluate(
                request(alts, crits, matrix, List.of(), List.of())
        );

        assertNull(
                result.results().get(0).domination(),
                "Rank difference greater than one must not allow practical domination"
        );
    }

    @Test
    void shouldIgnoreRejectedAlternativesAndEqualizedCriteria() {
        List<AlternativeDTO> alts = List.of(
                new AlternativeDTO(0, "Alt0"),
                new AlternativeDTO(1, "Alt1"),
                new AlternativeDTO(2, "Alt2")
        );

        List<CriterionDTO> crits = List.of(
                new CriterionDTO(0, "Crit0", "HIGHER"),
                new CriterionDTO(1, "Crit1", "HIGHER")
        );

        Map<String, Double> matrix = new HashMap<>();
        matrix.put("0-0", 100.0);
        matrix.put("0-1", 200.0);
        matrix.put("0-2", 300.0);
        matrix.put("1-0", 10.0);
        matrix.put("1-1", 90.0);
        matrix.put("1-2", 20.0);

        TableAnalysisResultDTO result = tableService.evaluate(
                request(alts, crits, matrix, List.of(1), List.of(0))
        );

        assertEquals(2, result.winnerIndex());
        assertFalse(result.results().containsKey(1), "Rejected alternative must not be included in results");
    }

    @Test
    void shouldGenerateWarningsForMissingDataAndZeroVariance() {
        List<AlternativeDTO> alts = List.of(
                new AlternativeDTO(0, "Alt0"),
                new AlternativeDTO(1, "Alt1")
        );

        List<CriterionDTO> crits = List.of(
                new CriterionDTO(0, "Crit0", "HIGHER"),
                new CriterionDTO(1, "Crit1", "HIGHER")
        );

        Map<String, Double> matrix = new HashMap<>();
        matrix.put("0-0", 10.0);
        matrix.put("1-0", 50.0);
        matrix.put("1-1", 50.0);

        TableAnalysisResultDTO result = tableService.evaluate(
                request(alts, crits, matrix, List.of(), List.of())
        );

        List<String> warnings = result.warnings();

        assertEquals(2, warnings.size());
        assertTrue(warnings.stream().anyMatch(warning -> warning.contains("puste komórki")));
        assertTrue(warnings.stream().anyMatch(warning -> warning.contains("identyczne wartości")));
        assertFalse(result.results().get(1).isComplete());
    }

    @Test
    void shouldAssignRank1ToAllWhenAllValuesAreIdentical() {
        List<AlternativeDTO> alts = List.of(
                new AlternativeDTO(0, "A"),
                new AlternativeDTO(1, "B"),
                new AlternativeDTO(2, "C")
        );

        List<CriterionDTO> crits = List.of(
                new CriterionDTO(0, "C0", "HIGHER")
        );

        Map<String, Double> matrix = Map.of(
                "0-0", 50.0,
                "0-1", 50.0,
                "0-2", 50.0
        );

        TableAnalysisResultDTO result = tableService.evaluate(
                request(alts, crits, matrix, List.of(), List.of())
        );

        assertNull(result.winnerIndex(), "There should be no winner when all alternatives are tied");

        result.results()
                .values()
                .forEach(resultItem -> assertNull(
                        resultItem.domination(),
                        "No alternative should dominate another when all values are identical"
                ));
    }

    private TableAnalysisRequest request(
            List<AlternativeDTO> alternatives,
            List<CriterionDTO> criteria,
            Map<String, Double> matrix,
            List<Integer> rejectedAlternativeIndices,
            List<Integer> equalizedCriterionIndices
    ) {
        return new TableAnalysisRequest(
                alternatives,
                criteria,
                matrix,
                rejectedAlternativeIndices,
                equalizedCriterionIndices
        );
    }
}