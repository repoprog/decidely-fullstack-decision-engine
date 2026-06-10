package com.decidely.api.api.project.dto;

import com.decidely.api.domain.project.ProjectType;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record ProjectSummaryDTO(
        UUID id,
        String title,
        ProjectType type,
        Set<String> tags,
        String category,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        Integer snapshotCount
) {
}