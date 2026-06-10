package com.decidely.api.api.snapshot;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.decidely.api.api.AbstractIntegrationTest;
import com.decidely.api.api.auth.dto.LoginRequest;
import com.decidely.api.api.auth.dto.RegisterRequest;
import com.decidely.api.api.project.dto.CreateProjectRequest;
import com.decidely.api.api.snapshot.dto.CreateSnapshotRequest;
import com.decidely.api.domain.project.ProjectRepository;
import com.decidely.api.domain.project.ProjectType;
import com.decidely.api.domain.snapshot.ProjectSnapshotRepository;
import com.decidely.api.domain.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Collections;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class SnapshotControllerIntegrationTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "password123";
    private static final String AUTHORIZATION = "Authorization";
    private static final String BEARER = "Bearer ";
    private static final String PROJECT_TITLE = "Base project";
    private static final String SNAPSHOT_LABEL = "Version 1.0";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectSnapshotRepository snapshotRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String userToken;
    private String projectId;
    private String snapshotId;

    @BeforeEach
    void setUp() throws Exception {
        snapshotRepository.deleteAll();
        projectRepository.deleteAll();
        userRepository.deleteAll();

        String userEmail = "owner_" + UUID.randomUUID() + "@test.com";

        registerUser("Owner", userEmail);
        userToken = loginAndExtractAccessToken(userEmail);
        projectId = createProjectAndExtractId();
        snapshotId = createSnapshotAndExtractId(SNAPSHOT_LABEL);
    }

    @Test
    void ownerShouldPerformLifecycleSuccessfully() throws Exception {
        mockMvc.perform(get("/api/v1/projects/" + projectId + "/snapshots")
                        .header(AUTHORIZATION, BEARER + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.[0].label").value(SNAPSHOT_LABEL));

        long currentVersion = getCurrentProjectVersion();

        mockMvc.perform(post("/api/v1/projects/" + projectId + "/snapshots/" + snapshotId + "/restore")
                        .header(AUTHORIZATION, BEARER + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "version": %d
                                }
                                """.formatted(currentVersion)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(projectId))
                .andExpect(jsonPath("$.content.state").value("original"))
                .andExpect(jsonPath("$.version").exists());
    }

    @Test
    void shouldDenyIdorForSnapshotOperationsAndKeepOwnerDataUnchanged() throws Exception {
        String attackerEmail = "attacker_" + UUID.randomUUID() + "@test.com";

        registerUser("Attacker", attackerEmail);
        String attackerToken = loginAndExtractAccessToken(attackerEmail);

        mockMvc.perform(get("/api/v1/projects/" + projectId + "/snapshots")
                        .header(AUTHORIZATION, BEARER + attackerToken))
                .andExpect(status().isForbidden());

        CreateSnapshotRequest maliciousCreateRequest = new CreateSnapshotRequest("Illegal snapshot");

        mockMvc.perform(post("/api/v1/projects/" + projectId + "/snapshots")
                        .header(AUTHORIZATION, BEARER + attackerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(maliciousCreateRequest)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/projects/" + projectId + "/snapshots/" + snapshotId)
                        .header(AUTHORIZATION, BEARER + attackerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/projects/" + projectId + "/snapshots/" + snapshotId + "/restore")
                        .header(AUTHORIZATION, BEARER + attackerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "version": 0
                                }
                                """))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/projects/" + projectId + "/snapshots")
                        .header(AUTHORIZATION, BEARER + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$.[0].label").value(SNAPSHOT_LABEL));

        mockMvc.perform(get("/api/v1/projects/" + projectId)
                        .header(AUTHORIZATION, BEARER + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value(PROJECT_TITLE))
                .andExpect(jsonPath("$.content.state").value("original"));
    }

    @Test
    void shouldRejectSnapshotRestoreWithStaleProjectVersion() throws Exception {
        mockMvc.perform(patch("/api/v1/projects/" + projectId + "/content")
                        .header(AUTHORIZATION, BEARER + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "version": 0,
                                  "content": {
                                    "nodes": [],
                                    "edges": [],
                                    "state": "modified-after-snapshot"
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.content.state").value("modified-after-snapshot"));

        mockMvc.perform(post("/api/v1/projects/" + projectId + "/snapshots/" + snapshotId + "/restore")
                        .header(AUTHORIZATION, BEARER + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "version": 0
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
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

        return extractField(result, "accessToken");
    }

    private String createProjectAndExtractId() throws Exception {
        CreateProjectRequest request = new CreateProjectRequest(
                PROJECT_TITLE,
                ProjectType.TREE,
                validTreeContent("original"),
                Collections.emptySet(),
                "Category",
                "Note"
        );

        MvcResult result = mockMvc.perform(post("/api/v1/projects")
                        .header(AUTHORIZATION, BEARER + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        return extractField(result, "id");
    }

    private String createSnapshotAndExtractId(String label) throws Exception {
        CreateSnapshotRequest request = new CreateSnapshotRequest(label);

        MvcResult result = mockMvc.perform(post("/api/v1/projects/" + projectId + "/snapshots")
                        .header(AUTHORIZATION, BEARER + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        return extractField(result, "id");
    }

    private long getCurrentProjectVersion() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/projects/" + projectId)
                        .header(AUTHORIZATION, BEARER + userToken))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("version")
                .asLong();
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

    private String extractField(
            MvcResult result,
            String fieldName
    ) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get(fieldName)
                .asText();
    }


}