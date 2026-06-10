package com.decidely.api.api.analysis.dto.table;

public record AlternativeAnalysisDTO(
        boolean isComplete,
        boolean isWinner,
        DominationDTO domination
) {
}