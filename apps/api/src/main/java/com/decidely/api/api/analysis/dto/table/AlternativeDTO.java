package com.decidely.api.api.analysis.dto.table;

import jakarta.validation.constraints.NotBlank;

public record AlternativeDTO(
        int index,
        @NotBlank String name
) {
}