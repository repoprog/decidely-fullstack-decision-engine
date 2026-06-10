package com.decidely.api.api.snapshot.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SnapshotDetailDTO(
        UUID id,
        String label,
        JsonNode content,
        Instant createdAt,
        List<String> smartTags
) {
}