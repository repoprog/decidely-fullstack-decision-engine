package com.decidely.api.api.analysis.dto.tree;

import java.util.List;
import java.util.Map;

public record TreeAnalysisResultDTO(
        Map<String, NodeEvaluationDTO> evaluationMap,
        List<String> winningPath,
        List<String> warnings
) {
}