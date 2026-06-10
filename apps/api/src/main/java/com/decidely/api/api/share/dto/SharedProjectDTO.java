package com.decidely.api.api.share.dto;

import com.decidely.api.domain.project.ProjectType;
import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.UUID;

public record SharedProjectDTO(
        UUID id,
        String title,
        ProjectType type,
        JsonNode content,
        Instant updatedAt
) {
}