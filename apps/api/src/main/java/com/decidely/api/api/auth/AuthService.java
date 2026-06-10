package com.decidely.api.api.auth;

import com.decidely.api.api.auth.dto.LoginRequest;
import com.decidely.api.api.auth.dto.RegisterRequest;
import com.decidely.api.api.auth.dto.UserDTO;
import com.decidely.api.config.DemoUserProperties;
import com.decidely.api.domain.user.User;
import com.decidely.api.domain.user.UserRepository;
import com.decidely.api.domain.user.UserRole;
import com.decidely.api.exception.ValidationException;
import com.decidely.api.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final DemoUserProperties demoUserProperties;

    @Transactional
    public AuthTokens register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.email());

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new ValidationException("Email is already in use");
        }

        User user = User.builder()
                .name(request.name())
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(UserRole.USER)
                .build();

        userRepository.save(user);

        return buildAuthTokens(user);
    }

    public AuthTokens login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.email());

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.password())
        );

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ValidationException("User not found"));

        return buildAuthTokens(user);
    }

    @Transactional
    public AuthTokens loginAsDemoUser() {
        if (!demoUserProperties.enabled()) {
            throw new ValidationException("Demo login is disabled");
        }

        String demoEmail = normalizeEmail(demoUserProperties.email());

        User user = userRepository.findByEmail(demoEmail)
                .orElseGet(() -> createDemoUser(demoEmail));

        return buildAuthTokens(user);
    }

    private AuthTokens buildAuthTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user.getId());
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        return new AuthTokens(
                accessToken,
                refreshToken,
                new UserDTO(
                        user.getId(),
                        user.getName(),
                        user.getEmail(),
                        user.getRole()
                )
        );
    }

    private User createDemoUser(String demoEmail) {
        String demoPassword = demoUserProperties.password();

        if (demoPassword == null || demoPassword.isBlank()) {
            demoPassword = UUID.randomUUID().toString();
        }

        User user = User.builder()
                .name(resolveDemoName())
                .email(demoEmail)
                .passwordHash(passwordEncoder.encode(demoPassword))
                .role(UserRole.USER)
                .isActive(true)
                .build();

        return userRepository.save(user);
    }

    private String resolveDemoName() {
        String demoName = demoUserProperties.name();

        return demoName == null || demoName.isBlank()
                ? "Demo User"
                : demoName;
    }

    @Transactional(readOnly = true)
    public Optional<String> refreshAccessToken(UUID userId) {
        return userRepository.findById(userId)
                .filter(User::isActive)
                .map(user -> jwtService.generateAccessToken(user.getId()));
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    public record AuthTokens(
            String accessToken,
            String refreshToken,
            UserDTO user
    ) {
    }
}