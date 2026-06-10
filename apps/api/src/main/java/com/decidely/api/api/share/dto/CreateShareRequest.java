package com.decidely.api.api.share.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Future;

import java.time.Instant;

public record CreateShareRequest(
        @Email(message = "Invalid email format")
        String sharedWithEmail,

        @Future(message = "Expiration date must be in the future")
        Instant expiresAt
) {
}