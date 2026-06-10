package com.decidely.api.api.user.dto;

import com.decidely.api.domain.user.UserRole;

import java.util.UUID;

public record UserProfileDTO(
        UUID id,
        String name,
        String email,
        UserRole role
) {
}