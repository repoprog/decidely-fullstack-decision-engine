package com.decidely.api.api.analysis.dto.tree;

public record NodeEvaluationDTO(
        double emv,
        String bestChoiceEdgeId,
        String equation
) {
}