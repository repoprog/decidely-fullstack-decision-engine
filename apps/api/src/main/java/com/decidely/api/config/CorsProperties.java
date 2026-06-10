package com.decidely.api.config;

import jakarta.validation.constraints.NotEmpty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@ConfigurationProperties(prefix = "cors")
public record CorsProperties(
        @NotEmpty(message = "At least one CORS allowed origin must be configured")
        List<String> allowedOrigins
) {

    public CorsProperties {
        allowedOrigins = List.copyOf(allowedOrigins);
    }
}