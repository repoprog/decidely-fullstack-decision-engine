package com.decidely.api.api.analysis.dto.table;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Map;

public record TableAnalysisRequest(

        @NotNull @Size(
                min = 1, max = 20, message = "Liczba alternatyw musi wynosić od 1 do 20"
        ) @Valid List<AlternativeDTO> alternatives,

        @NotNull @Size(
                min = 1, max = 20, message = "Liczba kryteriów musi wynosić od 1 do 20"
        ) @Valid List<CriterionDTO> criteria,


        @NotNull @Size(
                max = 400, message = "Zbyt duża macierz danych"
        ) Map<String, Double> resolvedMatrix,

        @NotNull List<Integer> rejectedAlternativeIndices,

        @NotNull List<Integer> equalizedCriterionIndices

) {
}