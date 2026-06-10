package com.decidely.api.api.analysis.dto.tree;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TreeEdgeDTO(
        @NotBlank(message = "Edge id is required")
        @Size(max = 64, message = "Edge id must be at most 64 characters")
        String id,

        @NotBlank(message = "Edge source is required")
        @Size(max = 64, message = "Edge source must be at most 64 characters")
        String source,

        @NotBlank(message = "Edge target is required")
        @Size(max = 64, message = "Edge target must be at most 64 characters")
        String target,

        @Valid
        EdgeData data
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record EdgeData(
            @DecimalMin(value = "-1000000000.0", message = "Cost is too small")
            @DecimalMax(value = "1000000000.0", message = "Cost is too large")
            Double cost,

            @DecimalMin(value = "0.0", message = "Probability cannot be negative")
            @DecimalMax(value = "1.0", message = "Probability cannot exceed 1")
            Double probability
    ) {
    }
}
