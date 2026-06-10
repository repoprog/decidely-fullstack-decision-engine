package com.decidely.api.api.snapshot.dto;

import jakarta.validation.constraints.NotNull;

public record RestoreSnapshotRequest(
        @NotNull(message = "Version is required")
        Long version
) {
}