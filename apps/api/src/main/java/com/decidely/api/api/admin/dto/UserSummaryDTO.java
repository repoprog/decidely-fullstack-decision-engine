package com.decidely.api.api.admin.dto;

import java.time.Instant;
import java.util.UUID;

public record UserSummaryDTO(
        UUID id,
        String name,
        String email,
        String role,
        boolean isActive,
        Instant createdAt
) {
}