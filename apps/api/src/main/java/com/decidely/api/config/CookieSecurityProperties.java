package com.decidely.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security.cookies")
public record CookieSecurityProperties(
        boolean secure,
        String sameSite
) {
    public CookieSecurityProperties {
        if (sameSite == null || sameSite.isBlank()) {
            sameSite = "Lax";
        }
    }
}
