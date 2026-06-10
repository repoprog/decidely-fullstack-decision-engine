package com.decidely.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.setup.admin")
public record AdminSetupProperties(
        boolean enabled,
        String email,
        String password,
        String name
) {
}