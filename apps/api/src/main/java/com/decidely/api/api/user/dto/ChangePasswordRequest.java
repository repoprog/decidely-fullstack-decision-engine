package com.decidely.api.api.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "Obecne hasło jest wymagane")
        String currentPassword,

        @NotBlank(message = "Nowe hasło nie może być puste")
        @Size(min = 8, message = "Nowe hasło musi mieć minimum 8 znaków")
        String newPassword
) {
}