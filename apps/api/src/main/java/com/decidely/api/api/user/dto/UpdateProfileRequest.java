package com.decidely.api.api.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "Imię nie może być puste")
        @Size(min = 2, message = "Imię musi mieć co najmniej 2 znaki")
        String name,

        @NotBlank(message = "Email nie może być pusty")
        @Email(message = "Nieprawidłowy format adresu email")
        String email
) {
}