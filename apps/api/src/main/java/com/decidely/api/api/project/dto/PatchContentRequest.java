package com.decidely.api.api.project.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;

public record PatchContentRequest(
        @NotNull(message = "Project version is required")
        Long version,

        @NotNull(message = "Content is required")
        JsonNode content
) {
}
