package com.decidely.api.api.snapshot.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SnapshotSummaryDTO(
        UUID id,
        String label,
        Instant createdAt,
        List<String> smartTags
) {
}