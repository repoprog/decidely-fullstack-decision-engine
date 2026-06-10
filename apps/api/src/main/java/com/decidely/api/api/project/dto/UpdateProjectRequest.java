package com.decidely.api.api.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record UpdateProjectRequest(
        @Size(min = 1, max = 120, message = "Title must be between 1 and 120 characters")
        String title,

        @Size(max = 20, message = "Maximum 20 tags are allowed")
        Set<@NotBlank(message = "Tag cannot be blank")
        @Size(max = 32, message = "Tag must be at most 32 characters") String> tags,

        @Size(max = 64, message = "Category must be at most 64 characters")
        String category,

        @Size(max = 5000, message = "Notes must be at most 5000 characters")
        String notes
) {
}