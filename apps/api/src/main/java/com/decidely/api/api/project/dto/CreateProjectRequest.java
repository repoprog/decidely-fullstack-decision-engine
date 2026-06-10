package com.decidely.api.api.project.dto;

import com.decidely.api.domain.project.ProjectType;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record CreateProjectRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 120, message = "Title must be at most 120 characters")
        String title,

        @NotNull(message = "Project type is required")
        ProjectType type,

        JsonNode content,

        @Size(max = 20, message = "Maximum 20 tags are allowed")
        Set<@NotBlank(message = "Tag cannot be blank")
        @Size(max = 32, message = "Tag must be at most 32 characters") String> tags,

        @Size(max = 64, message = "Category must be at most 64 characters")
        String category,

        @Size(max = 5000, message = "Notes must be at most 5000 characters")
        String notes
) {
}