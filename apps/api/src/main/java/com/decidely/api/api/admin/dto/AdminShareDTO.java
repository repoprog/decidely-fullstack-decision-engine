package com.decidely.api.api.admin.dto;

import java.time.Instant;
import java.util.UUID;

public record AdminShareDTO(
        UUID id,
        String projectId,
        String projectTitle,
        String maskedToken,
        Instant expiresAt,
        String sharedByEmail
) {
}