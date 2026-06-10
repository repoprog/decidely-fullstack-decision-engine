package com.decidely.api.api.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.decidely.api.api.AbstractIntegrationTest;
import com.decidely.api.api.auth.dto.LoginRequest;
import com.decidely.api.api.auth.dto.RegisterRequest;
import com.decidely.api.api.user.dto.ChangePasswordRequest;
import com.decidely.api.domain.user.User;
import com.decidely.api.domain.user.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.not;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class UserSecurityExceptionHandlingTest extends AbstractIntegrationTest {

    private static final String TEST_PASSWORD = "StrongPass123!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("change password with wrong current password should return 401, not 500")
    void changePasswordWithWrongCurrentPasswordShouldReturnUnauthorized() throws Exception {
        String email = uniqueEmail();
        registerUser(email);

        String accessToken = loginAndExtractAccessToken(email);

        ChangePasswordRequest request = new ChangePasswordRequest(
                "WrongCurrentPassword123!",
                "NewStrongPass123!"
        );

        mockMvc.perform(put("/api/v1/users/me/password")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.status").value(not(500)));
    }

    @Test
    @DisplayName("request with token for deleted user should return 401, not 500")
    void requestWithTokenForDeletedUserShouldReturnUnauthorizedInsteadOfServerError() throws Exception {
        String email = uniqueEmail();
        registerUser(email);

        String accessToken = loginAndExtractAccessToken(email);

        User user = userRepository.findByEmail(email)
                .orElseThrow();

        userRepository.delete(user);
        userRepository.flush();

        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid or expired token"));
    }

    private void registerUser(String email) throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Security Test User",
                email,
                TEST_PASSWORD
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    private String loginAndExtractAccessToken(String email) throws Exception {
        LoginRequest request = new LoginRequest(email, TEST_PASSWORD);

        String responseBody = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isString())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper
                .readTree(responseBody)
                .get("accessToken")
                .asText();
    }

    private String uniqueEmail() {
        return "user-security-" + UUID.randomUUID() + "@example.com";
    }
}