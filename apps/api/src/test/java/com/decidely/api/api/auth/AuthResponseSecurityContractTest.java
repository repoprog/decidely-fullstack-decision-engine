package com.decidely.api.api.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.decidely.api.api.AbstractIntegrationTest;
import com.decidely.api.api.auth.dto.LoginRequest;
import com.decidely.api.api.auth.dto.RegisterRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthResponseSecurityContractTest extends AbstractIntegrationTest {

    private static final String REFRESH_TOKEN_COOKIE_NAME = "refresh_token";
    private static final String TEST_PASSWORD = "StrongPass123!";
    private static final String TEST_USER_NAME = "Security Test User";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("register should return access token and user, but refresh token only in HttpOnly cookie")
    void registerShouldNotExposeRefreshTokenInResponseBody() throws Exception {
        String email = uniqueEmail();

        RegisterRequest request = new RegisterRequest(
                TEST_USER_NAME,
                email,
                TEST_PASSWORD
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isString())
                .andExpect(jsonPath("$.user.id").exists())
                .andExpect(jsonPath("$.user.name").value(TEST_USER_NAME))
                .andExpect(jsonPath("$.user.email").value(email))
                .andExpect(jsonPath("$.user.role").value("USER"))
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(jsonPath("$", not(containsString("refreshToken"))))
                .andExpect(cookie().exists(REFRESH_TOKEN_COOKIE_NAME))
                .andExpect(header().string(
                        HttpHeaders.SET_COOKIE,
                        allOf(
                                containsString(REFRESH_TOKEN_COOKIE_NAME + "="),
                                containsString("HttpOnly"),
                                containsString("Path=/api/v1/auth/refresh")
                        )
                ));
    }

    @Test
    @DisplayName("login should return access token and user, but refresh token only in HttpOnly cookie")
    void loginShouldNotExposeRefreshTokenInResponseBody() throws Exception {
        String email = uniqueEmail();

        registerUser(email);

        LoginRequest request = new LoginRequest(
                email,
                TEST_PASSWORD
        );

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isString())
                .andExpect(jsonPath("$.user.id").exists())
                .andExpect(jsonPath("$.user.name").value(TEST_USER_NAME))
                .andExpect(jsonPath("$.user.email").value(email))
                .andExpect(jsonPath("$.user.role").value("USER"))
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(jsonPath("$", not(containsString("refreshToken"))))
                .andExpect(cookie().exists(REFRESH_TOKEN_COOKIE_NAME))
                .andExpect(header().string(
                        HttpHeaders.SET_COOKIE,
                        allOf(
                                containsString(REFRESH_TOKEN_COOKIE_NAME + "="),
                                containsString("HttpOnly"),
                                containsString("Path=/api/v1/auth/refresh")
                        )
                ));
    }

    private void registerUser(String email) throws Exception {
        RegisterRequest request = new RegisterRequest(
                TEST_USER_NAME,
                email,
                TEST_PASSWORD
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    private String uniqueEmail() {
        return "security-test-" + UUID.randomUUID() + "@example.com";
    }
}