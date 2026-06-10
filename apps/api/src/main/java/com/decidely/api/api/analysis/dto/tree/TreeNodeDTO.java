package com.decidely.api.api.analysis.dto.tree;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TreeNodeDTO(
        @NotBlank(message = "Node id is required")
        @Size(max = 64, message = "Node id must be at most 64 characters")
        String id,

        @NotBlank(message = "Node type is required")
        @Pattern(regexp = "^(decision|chance|terminal)$", message = "Invalid node type")
        String type,

        @Valid
        NodeData data
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record NodeData(
            @DecimalMin(value = "-1000000000.0", message = "Payoff is too small")
            @DecimalMax(value = "1000000000.0", message = "Payoff is too large")
            Double payoff,

            @DecimalMin(value = "0.0", message = "Probability cannot be negative")
            @DecimalMax(value = "1.0", message = "Probability cannot exceed 1")
            Double probability
    ) {
    }
}
