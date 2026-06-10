package com.decidely.api.api.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.decidely.api.api.AbstractIntegrationTest;
import com.decidely.api.api.auth.dto.LoginRequest;
import com.decidely.api.api.auth.dto.RegisterRequest;
import com.decidely.api.domain.project.Project;
import com.decidely.api.domain.project.ProjectRepository;
import com.decidely.api.domain.project.ProjectType;
import com.decidely.api.domain.share.ProjectShare;
import com.decidely.api.domain.share.ProjectShareRepository;
import com.decidely.api.domain.share.SharePermission;
import com.decidely.api.domain.user.User;
import com.decidely.api.domain.user.UserRepository;
import com.decidely.api.domain.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class AdminControllerIntegrationTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "password123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectShareRepository projectShareRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private User regularUser;
    private String adminToken;
    private String userToken;

    @BeforeEach
    void setUp() throws Exception {
        projectShareRepository.deleteAll();
        projectRepository.deleteAll();
        userRepository.deleteAll();

        String adminEmail = "admin_" + UUID.randomUUID() + "@test.com";
        registerUser("Admin", adminEmail, PASSWORD);

        User admin = userRepository.findByEmail(adminEmail).orElseThrow();
        admin.setRole(UserRole.ADMIN);
        userRepository.save(admin);

        adminToken = loginAndExtractAccessToken(adminEmail, PASSWORD);

        String userEmail = "user_" + UUID.randomUUID() + "@test.com";
        registerUser("User", userEmail, PASSWORD);

        regularUser = userRepository.findByEmail(userEmail).orElseThrow();
        userToken = loginAndExtractAccessToken(userEmail, PASSWORD);
    }

    @Test
    void shouldRejectAdminEndpointWithInvalidJwt() throws Exception {
        mockMvc.perform(get("/api/v1/admin/stats")
                        .header("Authorization", "Bearer forged.invalid.token.123"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/stats"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldDenyAccessToAdminEndpointsForRegularUser() throws Exception {
        mockMvc.perform(get("/api/v1/admin/stats")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/shares")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldReturnMaskedTokenForShares() throws Exception {
        Project project = new Project();
        project.setTitle("Secret Project");
        project.setOwner(regularUser);
        project.setType(ProjectType.TABLE);
        projectRepository.save(project);

        ProjectShare share = new ProjectShare();
        share.setProject(project);
        share.setToken("verySecretToken123456789");
        share.setExpiresAt(Instant.now().plusSeconds(3600));
        share.setPermission(SharePermission.READ_ONLY);
        projectShareRepository.save(share);

        mockMvc.perform(get("/api/v1/admin/shares")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].projectTitle").value("Secret Project"))
                .andExpect(jsonPath("$.content[0].maskedToken").value("verySecr..."))
                .andExpect(jsonPath("$.content[0].token").doesNotExist());
    }

    @Test
    void shouldReturn404WhenRevokingNonExistentShare() throws Exception {
        UUID fakeId = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/admin/shares/" + fakeId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldToggleUserActiveStatus() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/users/" + regularUser.getId() + "/toggle-active")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        User updatedUser = userRepository.findById(regularUser.getId()).orElseThrow();

        assertFalse(updatedUser.isActive(), "User should be deactivated");
    }

    @Test
    void shouldReturn400WhenAdminTriesToBlockAnotherAdmin() throws Exception {
        String secondAdminEmail = "admin2_" + UUID.randomUUID() + "@test.com";
        registerUser("Admin2", secondAdminEmail, PASSWORD);

        User secondAdmin = userRepository.findByEmail(secondAdminEmail).orElseThrow();
        secondAdmin.setRole(UserRole.ADMIN);
        userRepository.save(secondAdmin);

        mockMvc.perform(patch("/api/v1/admin/users/" + secondAdmin.getId() + "/toggle-active")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());

        User checkAdmin = userRepository.findById(secondAdmin.getId()).orElseThrow();

        assertTrue(checkAdmin.isActive(), "Admin account must remain active");
    }

    private void registerUser(
            String name,
            String email,
            String password
    ) throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegisterRequest(name, email, password))))
                .andExpect(status().isOk());
    }

    private String loginAndExtractAccessToken(
            String email,
            String password
    ) throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, password))))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("accessToken")
                .asText();
    }
}