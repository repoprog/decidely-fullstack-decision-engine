package com.decidely.api.api.analysis.dto.tree;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record TreeAnalysisRequest(
        @NotNull(message = "Nodes are required")
        @Size(min = 1, max = 200, message = "Tree must contain between 1 and 200 nodes")
        List<@Valid TreeNodeDTO> nodes,

        @NotNull(message = "Edges are required")
        @Size(max = 400, message = "Tree can contain at most 400 edges")
        List<@Valid TreeEdgeDTO> edges,

        @NotNull(message = "Evaluation mode is required")
        @Pattern(regexp = "^(MAX|MIN)$", message = "Evaluation mode must be exactly MAX or MIN")
        String evaluationMode
) {
}
