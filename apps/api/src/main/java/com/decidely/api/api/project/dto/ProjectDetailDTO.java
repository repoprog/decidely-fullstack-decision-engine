package com.decidely.api.api.project.dto;

import com.decidely.api.domain.project.ProjectType;
import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record ProjectDetailDTO(
        UUID id,
        Long version,
        String title,
        ProjectType type,

        JsonNode content,
        Set<String> tags,
        String category,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        Integer snapshotCount
) {
}
