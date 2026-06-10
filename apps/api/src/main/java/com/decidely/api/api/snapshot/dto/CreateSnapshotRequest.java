package com.decidely.api.api.snapshot.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateSnapshotRequest(
        @NotBlank(message = "Label is required")
        String label
) {
}