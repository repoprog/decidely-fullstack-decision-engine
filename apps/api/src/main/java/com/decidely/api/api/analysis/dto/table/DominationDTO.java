package com.decidely.api.api.analysis.dto.table;

public record DominationDTO(
        String type,
        String dominatedByName,
        String exceptionalCriterionName
) {
}