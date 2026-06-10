package com.decidely.api.api.auth.dto;

import com.decidely.api.domain.user.UserRole;

import java.util.UUID;

public record UserDTO(
        UUID id,
        String name,
        String email,
        UserRole role
) {
}