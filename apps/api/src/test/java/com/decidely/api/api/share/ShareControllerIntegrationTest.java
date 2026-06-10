package com.decidely.api.api.share;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.decidely.api.api.AbstractIntegrationTest;
import com.decidely.api.api.auth.dto.LoginRequest;
import com.decidely.api.api.auth.dto.RegisterRequest;
import com.decidely.api.api.project.dto.CreateProjectRequest;
import com.decidely.api.api.share.dto.CreateShareRequest;
import com.decidely.api.domain.project.ProjectType;
import com.decidely.api.domain.share.ProjectShare;
import com.decidely.api.domain.share.ProjectShareRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class ShareControllerIntegrationTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "password123";
    private static final String AUTHORIZATION = "Authorization";
    private static final String BEARER = "Bearer ";
    private static final String PROJECT_TITLE = "Top Secret Data";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProjectShareRepository shareRepository;

    private String userToken;
    private String projectId;

    @BeforeEach
    void setUp() throws Exception {
        shareRepository.deleteAll();

        String testUserEmail = "shareuser_" + UUID.randomUUID() + "@test.com";

        registerUser("Share Owner", testUserEmail);
        userToken = loginAndExtractAccessToken(testUserEmail);
        projectId = createProjectAndExtractId();
    }

    @Test
    void shouldAllowPublicAccessViaShareToken() throws Exception {
        String shareToken = createShareAndExtractToken(null);

        mockMvc.perform(get("/api/v1/projects/shared/" + shareToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value(PROJECT_TITLE))
                .andExpect(jsonPath("$.type").value("TREE"))
                .andExpect(jsonPath("$.content.nodes").isArray())
                .andExpect(jsonPath("$.content.edges").isArray())
                .andExpect(jsonPath("$.notes").doesNotExist())
                .andExpect(jsonPath("$.category").doesNotExist())
                .andExpect(jsonPath("$.tags").doesNotExist())
                .andExpect(jsonPath("$.version").doesNotExist())
                .andExpect(jsonPath("$.snapshotCount").doesNotExist());
    }

    @Test
    void shouldReturn403ForExpiredShareToken() throws Exception {
        String shareToken = createShareAndExtractToken(
                Instant.now().plus(1, ChronoUnit.HOURS)
        );

        ProjectShare share = shareRepository.findByToken(shareToken)
                .orElseThrow();

        share.setExpiresAt(Instant.now().minus(1, ChronoUnit.HOURS));
        shareRepository.saveAndFlush(share);

        mockMvc.perform(get("/api/v1/projects/shared/" + shareToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldReturn404ForInvalidShareToken() throws Exception {
        mockMvc.perform(get("/api/v1/projects/shared/not-a-real-token"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldDeleteShareAndMakeTokenUnavailable() throws Exception {
        String shareToken = createShareAndExtractToken(null);
        String shareId = findShareIdByToken(shareToken);

        mockMvc.perform(delete("/api/v1/projects/" + projectId + "/share/" + shareId)
                        .header(AUTHORIZATION, BEARER + userToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/projects/shared/" + shareToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldDenyIdorWhenDeletingAnotherUsersShare() throws Exception {
        String shareToken = createShareAndExtractToken(null);
        String shareId = findShareIdByToken(shareToken);

        String attackerEmail = "attacker_" + UUID.randomUUID() + "@test.com";
        registerUser("Attacker", attackerEmail);
        String attackerToken = loginAndExtractAccessToken(attackerEmail);

        CreateShareRequest maliciousShareRequest = new CreateShareRequest(null, null);

        mockMvc.perform(post("/api/v1/projects/" + projectId + "/share")
                        .header(AUTHORIZATION, BEARER + attackerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(maliciousShareRequest)))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/v1/projects/" + projectId + "/share/" + shareId)
                        .header(AUTHORIZATION, BEARER + attackerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/projects/shared/" + shareToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value(PROJECT_TITLE));

        mockMvc.perform(get("/api/v1/projects/" + projectId)
                        .header(AUTHORIZATION, BEARER + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value(PROJECT_TITLE));

        assertEquals(1, shareRepository.count());
    }

    private void registerUser(
            String name,
            String email
    ) throws Exception {
        RegisterRequest request = new RegisterRequest(name, email, PASSWORD);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    private String loginAndExtractAccessToken(String email) throws Exception {
        LoginRequest request = new LoginRequest(email, PASSWORD);

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("accessToken")
                .asText();
    }

    private String createProjectAndExtractId() throws Exception {
        CreateProjectRequest request = new CreateProjectRequest(
                PROJECT_TITLE,
                ProjectType.TREE,
                validTreeContent("shared"),
                Collections.emptySet(),
                "Dev",
                "Notes"
        );

        MvcResult result = mockMvc.perform(post("/api/v1/projects")
                        .header(AUTHORIZATION, BEARER + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("id")
                .asText();
    }

    private String createShareAndExtractToken(Instant expiresAt) throws Exception {
        CreateShareRequest request = new CreateShareRequest(null, expiresAt);

        MvcResult result = mockMvc.perform(post("/api/v1/projects/" + projectId + "/share")
                        .header(AUTHORIZATION, BEARER + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("token")
                .asText();
    }

    private String findShareIdByToken(String shareToken) {
        return shareRepository.findByToken(shareToken)
                .orElseThrow(() -> new RuntimeException("Share not found"))
                .getId()
                .toString();
    }

    private ObjectNode validTreeContent(String state) {
        ObjectNode content = objectMapper.createObjectNode();
        content.putArray("nodes");
        content.putArray("edges");

        if (state != null) {
            content.put("state", state);
        }

        return content;
    }
}