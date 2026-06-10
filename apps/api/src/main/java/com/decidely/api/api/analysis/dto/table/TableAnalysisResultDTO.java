package com.decidely.api.api.analysis.dto.table;

import java.util.List;
import java.util.Map;

public record TableAnalysisResultDTO(
        Map<Integer, AlternativeAnalysisDTO> results,
        Integer winnerIndex,
        List<String> warnings
) {
}