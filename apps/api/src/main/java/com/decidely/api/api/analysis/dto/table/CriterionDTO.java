package com.decidely.api.api.analysis.dto.table;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CriterionDTO(
        int index,

        @NotBlank(message = "Nazwa kryterium nie może być pusta") String name,

        @NotBlank(message = "sortDirection nie może być puste") @Pattern(
                regexp = "^(HIGHER|LOWER)$", message = "sortDirection musi wynosić HIGHER lub LOWER"
        ) String sortDirection
) {
}