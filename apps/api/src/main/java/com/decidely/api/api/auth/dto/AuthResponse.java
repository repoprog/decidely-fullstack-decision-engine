package com.decidely.api.api.auth.dto;

public record AuthResponse(
        String accessToken,
        UserDTO user
) {
}
