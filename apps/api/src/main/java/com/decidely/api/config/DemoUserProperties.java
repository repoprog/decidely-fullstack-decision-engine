package com.decidely.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.demo")
public record DemoUserProperties(
        boolean enabled,
        String email,
        String password,
        String name
) {
}
