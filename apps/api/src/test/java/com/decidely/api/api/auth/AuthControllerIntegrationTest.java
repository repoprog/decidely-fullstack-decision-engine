package com.decidely.api.api.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.decidely.api.api.AbstractIntegrationTest;
import com.decidely.api.api.auth.dto.LoginRequest;
import com.decidely.api.api.auth.dto.RegisterRequest;
import com.decidely.api.domain.user.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.http.HttpHeaders.SET_COOKIE;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class AuthControllerIntegrationTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "password123!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void shouldRegisterAndLoginSuccessfully() throws Exception {
        String email = "user_" + UUID.randomUUID() + "@test.com";

        register("test", email, PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.user.email").value(email))
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(cookie().exists("refresh_token"))
                .andExpect(cookie().httpOnly("refresh_token", true))
                .andExpect(header().string(SET_COOKIE, containsString("HttpOnly")))
                .andExpect(header().string(SET_COOKIE, containsString("SameSite=Lax")));

        login(email, PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.user.email").value(email))
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(cookie().exists("refresh_token"))
                .andExpect(cookie().httpOnly("refresh_token", true))
                .andExpect(header().string(SET_COOKIE, containsString("HttpOnly")))
                .andExpect(header().string(SET_COOKIE, containsString("SameSite=Lax")));
    }

    @Test
    void shouldRejectRefreshWithoutCookie() throws Exception {
        mockMvc.perform(post("/api/v1/auth/refresh"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldLoginAsDemoUserWithoutExposingRefreshToken() throws Exception {
        mockMvc.perform(post("/api/v1/auth/demo-login"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.user.email").value("demo@smartchoices.local"))
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(cookie().exists("refresh_token"))
                .andExpect(cookie().httpOnly("refresh_token", true))
                .andExpect(header().string(SET_COOKIE, containsString("HttpOnly")));
    }

    @Test
    void shouldRefreshAccessTokenWhenRefreshCookieIsPresent() throws Exception {
        String email = "refresh_" + UUID.randomUUID() + "@test.com";
        Cookie refreshCookie = registerAndLogin(email)
                .getResponse()
                .getCookie("refresh_token");

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(refreshCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists());
    }

    @Test
    void shouldRejectAccessWithoutToken() throws Exception {
        mockMvc.perform(get("/api/v1/projects"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectRegistrationWithDuplicateEmail() throws Exception {
        String email = "duplicate_" + UUID.randomUUID() + "@test.com";

        register("TestUser", email, PASSWORD)
                .andExpect(status().isOk());

        register("TestUser", email, PASSWORD)
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectLoginWithWrongPassword() throws Exception {
        String email = "wrongpass_" + UUID.randomUUID() + "@test.com";

        register("TestUser", email, "CorrectPass123!")
                .andExpect(status().isOk());

        login(email, "WrongPass123!")
                .andExpect(status().isUnauthorized());
    }

    private MvcResult registerAndLogin(String email) throws Exception {
        register("TestUser", email, PASSWORD)
                .andExpect(status().isOk());

        return login(email, PASSWORD)
                .andExpect(status().isOk())
                .andExpect(cookie().exists("refresh_token"))
                .andReturn();
    }

    private org.springframework.test.web.servlet.ResultActions register(
            String name,
            String email,
            String password
    ) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new RegisterRequest(
                        name,
                        email,
                        password
                ))));
    }

    private org.springframework.test.web.servlet.ResultActions login(
            String email,
            String password
    ) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginRequest(
                        email,
                        password
                ))));
    }

    @Test
    void shouldRejectRefreshTokenForDisabledUser() throws Exception {
        String email = "disabled_refresh_" + UUID.randomUUID() + "@test.com";

        RegisterRequest registerRequest = new RegisterRequest(
                "Disabled User",
                email,
                "password123"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        LoginRequest loginRequest = new LoginRequest(email, "password123");

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("refresh_token"))
                .andReturn();

        userRepository.findByEmail(email)
                .ifPresent(user -> {
                    user.setActive(false);
                    userRepository.saveAndFlush(user);
                });

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(loginResult.getResponse().getCookie("refresh_token")))
                .andExpect(status().isUnauthorized());
    }
}