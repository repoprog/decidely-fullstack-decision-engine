package com.decidely.api.api.auth;

import com.decidely.api.api.auth.dto.AuthResponse;
import com.decidely.api.api.auth.dto.LoginRequest;
import com.decidely.api.api.auth.dto.RegisterRequest;
import com.decidely.api.api.auth.dto.TokenRefreshResponse;
import com.decidely.api.config.CookieSecurityProperties;
import com.decidely.api.config.JwtConfig;
import com.decidely.api.security.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.WebUtils;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String REFRESH_TOKEN_COOKIE_NAME = "refresh_token";
    private final AuthService authService;
    private final JwtService jwtService;
    private final JwtConfig jwtConfig;
    private final CookieSecurityProperties cookieSecurityProperties;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid
            @RequestBody
            RegisterRequest request,
            HttpServletResponse response
    ) {
        AuthService.AuthTokens tokens = authService.register(request);
        setRefreshTokenCookie(response, tokens.refreshToken());
        return ResponseEntity.ok(new AuthResponse(tokens.accessToken(), tokens.user()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid
            @RequestBody
            LoginRequest request,
            HttpServletResponse response
    ) {
        AuthService.AuthTokens tokens = authService.login(request);
        setRefreshTokenCookie(response, tokens.refreshToken());
        return ResponseEntity.ok(new AuthResponse(tokens.accessToken(), tokens.user()));
    }

    @PostMapping("/demo-login")
    public ResponseEntity<AuthResponse> demoLogin(HttpServletResponse response) {
        AuthService.AuthTokens tokens = authService.loginAsDemoUser();
        setRefreshTokenCookie(response, tokens.refreshToken());
        return ResponseEntity.ok(new AuthResponse(tokens.accessToken(), tokens.user()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenRefreshResponse> refresh(HttpServletRequest request) {
        Cookie refreshTokenCookie = WebUtils.getCookie(request, REFRESH_TOKEN_COOKIE_NAME);

        if (refreshTokenCookie == null) {
            return ResponseEntity.status(401).build();
        }

        String refreshToken = refreshTokenCookie.getValue();
        UUID userId = jwtService.validateRefreshTokenAndGetUserId(refreshToken);

        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        return authService.refreshAccessToken(userId)
                .map(accessToken -> ResponseEntity.ok(new TokenRefreshResponse(accessToken)))
                .orElseGet(() -> ResponseEntity.status(401).build());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        clearRefreshTokenCookie(response);
        return ResponseEntity.noContent().build();
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, refreshToken)
                .httpOnly(true)
                .secure(cookieSecurityProperties.secure())
                .path("/api/v1/auth/refresh")
                .maxAge(jwtConfig.getRefreshTokenExpiration() / 1000)
                .sameSite(cookieSecurityProperties.sameSite())
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(cookieSecurityProperties.secure())
                .path("/api/v1/auth/refresh")
                .maxAge(0)
                .sameSite(cookieSecurityProperties.sameSite())
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
