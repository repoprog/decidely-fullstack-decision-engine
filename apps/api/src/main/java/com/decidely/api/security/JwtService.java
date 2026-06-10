package com.decidely.api.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.decidely.api.config.JwtConfig;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private static final String ISSUER = "decidely-api";
    private static final String CLAIM_TOKEN_TYPE = "typ";

    private final JwtConfig jwtConfig;
    private final Algorithm algorithm;
    private final JWTVerifier verifier;

    public JwtService(JwtConfig jwtConfig) {
        this.jwtConfig = jwtConfig;
        this.algorithm = Algorithm.HMAC256(jwtConfig.getSecret());
        this.verifier = JWT.require(algorithm)
                .withIssuer(ISSUER)
                .build();
    }

    public String generateAccessToken(UUID userId) {
        return createToken(
                userId,
                TokenType.ACCESS,
                jwtConfig.getAccessTokenExpiration()
        );
    }

    public String generateRefreshToken(UUID userId) {
        return createToken(
                userId,
                TokenType.REFRESH,
                jwtConfig.getRefreshTokenExpiration()
        );
    }

    public UUID validateAccessTokenAndGetUserId(String token) {
        return validateTokenAndGetUserId(token, TokenType.ACCESS);
    }

    public UUID validateRefreshTokenAndGetUserId(String token) {
        return validateTokenAndGetUserId(token, TokenType.REFRESH);
    }

    private UUID validateTokenAndGetUserId(String token, TokenType expectedType) {
        try {
            DecodedJWT decodedJWT = verifier.verify(token);

            String actualTokenType = decodedJWT
                    .getClaim(CLAIM_TOKEN_TYPE)
                    .asString();

            if (!expectedType.name().equals(actualTokenType)) {
                return null;
            }

            String subject = decodedJWT.getSubject();

            if (subject == null || subject.isBlank()) {
                return null;
            }

            return UUID.fromString(subject);
        } catch (JWTVerificationException | IllegalArgumentException exception) {
            return null;
        }
    }

    private String createToken(
            UUID userId,
            TokenType tokenType,
            long expirationMillis
    ) {
        long now = System.currentTimeMillis();

        return JWT.create()
                .withIssuer(ISSUER)
                .withSubject(userId.toString())
                .withClaim(CLAIM_TOKEN_TYPE, tokenType.name())
                .withJWTId(UUID.randomUUID().toString())
                .withIssuedAt(new Date(now))
                .withExpiresAt(new Date(now + expirationMillis))
                .sign(algorithm);
    }
}