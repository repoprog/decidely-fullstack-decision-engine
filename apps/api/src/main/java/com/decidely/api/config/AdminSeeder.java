package com.decidely.api.config;

import com.decidely.api.domain.user.User;
import com.decidely.api.domain.user.UserRepository;
import com.decidely.api.domain.user.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private static final String DEFAULT_ADMIN_NAME = "Administrator";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminSetupProperties adminSetupProperties;

    @Override
    public void run(String... args) {
        if (!adminSetupProperties.enabled()) {
            log.debug("Admin seeder is disabled.");
            return;
        }

        if (isBlank(adminSetupProperties.email()) || isBlank(adminSetupProperties.password())) {
            log.warn("Admin seeder is enabled, but admin email or password is missing. Skipping admin creation.");
            return;
        }

        String normalizedEmail = normalizeEmail(adminSetupProperties.email());

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            log.debug("Admin account ({}) already exists. Skipping admin creation.", normalizedEmail);
            return;
        }

        User adminUser = User.builder()
                .name(resolveAdminName())
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(adminSetupProperties.password()))
                .role(UserRole.ADMIN)
                .isActive(true)
                .createdAt(Instant.now())
                .build();

        userRepository.save(adminUser);

        log.info("Admin account has been created: {}", normalizedEmail);
    }

    private String resolveAdminName() {
        if (isBlank(adminSetupProperties.name())) {
            return DEFAULT_ADMIN_NAME;
        }

        return adminSetupProperties.name().trim();
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}