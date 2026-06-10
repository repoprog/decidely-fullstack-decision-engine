package com.decidely.api.api.project;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.decidely.api.api.AbstractIntegrationTest;
import com.decidely.api.api.auth.dto.LoginRequest;
import com.decidely.api.api.auth.dto.RegisterRequest;
import com.decidely.api.api.project.dto.CreateProjectRequest;
import com.decidely.api.api.project.dto.PatchContentRequest;
import com.decidely.api.domain.project.ProjectRepository;
import com.decidely.api.domain.project.ProjectType;
import com.decidely.api.domain.user.User;
import com.decidely.api.domain.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.Collections;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class ProjectControllerIntegrationTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "password123";
    private static final String AUTHORIZATION = "Authorization";
    private static final String BEARER = "Bearer ";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String userToken;
    private String testUserEmail;

    @BeforeEach
    void setUp() throws Exception {
        projectRepository.deleteAll();
        userRepository.deleteAll();

        testUserEmail = "projectuser_" + UUID.randomUUID() + "@test.com";

        registerUser("test", testUserEmail);
        userToken = loginAndExtractAccessToken(testUserEmail);
    }

    @Test
    void shouldCreateAndRetrieveProject() throws Exception {
        CreateProjectRequest createRequest = new CreateProjectRequest(
                "My Test Table",
                ProjectType.TABLE,
                null,
                Collections.emptySet(),
                "Finance",
                "My note"
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/projects")
                        .header(AUTHORIZATION, BEARER + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.version").exists())
                .andExpect(jsonPath("$.title").value("My Test Table"))
                .andReturn();

        String projectId = extractId(createResult);

        mockMvc.perform(get("/api/v1/projects/" + projectId)
                        .header(AUTHORIZATION, BEARER + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(projectId))
                .andExpect(jsonPath("$.version").exists())
                .andExpect(jsonPath("$.title").value("My Test Table"));
    }

    @Test
    void shouldPatchContentWithCorrectVersionAndReturnNewVersion() throws Exception {
        String projectId = createProjectAndExtractId(
                createProjectRequest("Versioned Project")
        );

        String payload = """
        {
          "version": 0,
          "content": {
            "alternatives": ["A", "B"],
            "objectives": ["Cena"],
            "cells": {
              "0-0": "10",
              "0-1": "20"
            }
          }
        }
        """;

        mockMvc.perform(patch("/api/v1/projects/" + projectId + "/content")
                        .header(AUTHORIZATION, BEARER + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(projectId))
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.content.alternatives[0]").value("A"))
                .andExpect(jsonPath("$.content.objectives[0]").value("Cena"));
    }

    @Test
    void shouldReturn409WhenPatchingContentWithStaleVersion() throws Exception {
        String projectId = createProjectAndExtractId(
                createProjectRequest("Stale Project")
        );

        String firstPayload = """
        {
          "version": 0,
          "content": {
            "alternatives": ["A", "B"],
            "objectives": ["Cena"],
            "cells": {
              "0-0": "10",
              "0-1": "20"
            }
          }
        }
        """;

        mockMvc.perform(patch("/api/v1/projects/" + projectId + "/content")
                        .header(AUTHORIZATION, BEARER + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(firstPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(1));

        String stalePayload = """
        {
          "version": 0,
          "content": {
            "alternatives": ["A", "B"],
            "objectives": ["Cena"],
            "cells": {
              "0-0": "15",
              "0-1": "25"
            }
          }
        }
        """;
        mockMvc.perform(patch("/api/v1/projects/" + projectId + "/content")
                        .header(AUTHORIZATION, BEARER + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(stalePayload))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldRejectPatchContentWithoutVersion() throws Exception {
        String projectId = createProjectAndExtractId(
                createProjectRequest("Missing Version Project")
        );

        String payload = """
        {
          "content": {
            "alternatives": ["A", "B"],
            "objectives": ["Cena"],
            "cells": {
              "0-0": "10",
              "0-1": "20"
            }
          }
        }
        """;

        mockMvc.perform(patch("/api/v1/projects/" + projectId + "/content")
                        .header(AUTHORIZATION, BEARER + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectRequestsFromDisabledUserWithValidJwt() throws Exception {
        mockMvc.perform(get("/api/v1/projects")
                        .header(AUTHORIZATION, BEARER + userToken))
                .andExpect(status().isOk());

        User user = userRepository.findByEmail(testUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setActive(false);
        userRepository.save(user);

        mockMvc.perform(get("/api/v1/projects")
                        .header(AUTHORIZATION, BEARER + userToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturn403WhenUserAccessesAnotherUsersProject() throws Exception {
        ObjectNode initialContent = validTableContent();

        CreateProjectRequest createRequest = new CreateProjectRequest(
                "User A Project",
                ProjectType.TABLE,
                initialContent,
                Collections.emptySet(),
                "Secret",
                "Private notes"
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/projects")
                        .header(AUTHORIZATION, BEARER + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String projectId = extractId(createResult);

        String attackerEmail = "attacker_" + UUID.randomUUID() + "@test.com";
        registerUser("Attacker", attackerEmail);
        String attackerToken = loginAndExtractAccessToken(attackerEmail);

        mockMvc.perform(get("/api/v1/projects/" + projectId)
                        .header(AUTHORIZATION, BEARER + attackerToken))
                .andExpect(status().isForbidden());

        String updatePayload = """
            {
              "title": "Compromised project",
              "category": "Public",
              "notes": "Modified notes"
            }
            """;

        mockMvc.perform(put("/api/v1/projects/" + projectId)
                        .header(AUTHORIZATION, BEARER + attackerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload))
                .andExpect(status().isForbidden());

        var maliciousContent = objectMapper.createObjectNode();
        maliciousContent.put("secret", "changed");

        PatchContentRequest patchRequest = new PatchContentRequest(0L, maliciousContent);

        mockMvc.perform(patch("/api/v1/projects/" + projectId + "/content")
                        .header(AUTHORIZATION, BEARER + attackerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patchRequest)))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/v1/projects/" + projectId)
                        .header(AUTHORIZATION, BEARER + attackerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/projects/" + projectId)
                        .header(AUTHORIZATION, BEARER + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("User A Project"))
                .andExpect(jsonPath("$.category").value("Secret"))
                .andExpect(jsonPath("$.notes").value("Private notes"))
                .andExpect(jsonPath("$.content.alternatives[0]").value("A"))
                .andExpect(jsonPath("$.content.objectives[0]").value("Cena"));
    }

    @Test
    void shouldHandlePaginationBoundaryCorrectly() throws Exception {
        mockMvc.perform(get("/api/v1/projects?page=999&size=20")
                        .header(AUTHORIZATION, BEARER + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content").isEmpty());

        mockMvc.perform(get("/api/v1/projects?page=-1")
                        .header(AUTHORIZATION, BEARER + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.number").value(0));

        mockMvc.perform(get("/api/v1/projects?size=10000")
                        .header(AUTHORIZATION, BEARER + userToken))
                .andExpect(status().isOk());
    }

    @Test
    void shouldRejectProjectCreationWhenTitleIsTooLong() throws Exception {
        String tooLongTitle = "A".repeat(121);

        String payload = """
                {
                  "title": "%s",
                  "type": "TABLE",
                  "content": {}
                }
                """.formatted(tooLongTitle);

        mockMvc.perform(post("/api/v1/projects")
                        .header(AUTHORIZATION, BEARER + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectProjectUpdateWhenTitleIsEmpty() throws Exception {
        String projectId = createProjectAndExtractId(
                createProjectRequest("Valid title")
        );

        String payload = """
                {
                  "title": ""
                }
                """;

        mockMvc.perform(put("/api/v1/projects/" + projectId)
                        .header(AUTHORIZATION, BEARER + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }


    @Test
    void shouldRejectProjectCreationWhenTagIsBlank() throws Exception {
        String payload = """
                {
                  "title": "Valid title",
                  "type": "TABLE",
                  "content": {},
                  "tags": ["valid", ""]
                }
                """;

        mockMvc.perform(post("/api/v1/projects")
                        .header(AUTHORIZATION, BEARER + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectProjectCreationWhenTooManyTagsAreProvided() throws Exception {
        StringBuilder tagsJson = new StringBuilder("[");

        for (int i = 0; i < 21; i++) {
            if (i > 0) {
                tagsJson.append(",");
            }

            tagsJson.append("\"tag").append(i).append("\"");
        }

        tagsJson.append("]");

        String payload = """
                {
                  "title": "Valid title",
                  "type": "TABLE",
                  "content": {},
                  "tags": %s
                }
                """.formatted(tagsJson);

        mockMvc.perform(post("/api/v1/projects")
                        .header(AUTHORIZATION, BEARER + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
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

    private String createProjectAndExtractId(CreateProjectRequest request) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/projects")
                        .header(AUTHORIZATION, BEARER + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        return extractId(result);
    }

    private String extractId(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("id")
                .asText();
    }

    private CreateProjectRequest createProjectRequest(String title) {
        return new CreateProjectRequest(
                title,
                ProjectType.TABLE,
                null,
                Collections.emptySet(),
                "Finance",
                "Initial note"
        );
    }

    private ObjectNode validTableContent() {
        var content = objectMapper.createObjectNode();
        content.putArray("alternatives").add("A").add("B");
        content.putArray("objectives").add("Cena");
        content.putObject("cells")
                .put("0-0", "10")
                .put("0-1", "20");

        return content;
    }

    @Test
    void shouldReturn400WhenPatchingTableProjectWithInvalidContentShape() throws Exception {
        var initialContent = objectMapper.createObjectNode();
        initialContent.putArray("alternatives");
        initialContent.putArray("objectives");
        initialContent.putObject("cells");

        CreateProjectRequest createRequest = new CreateProjectRequest(
                "Invalid Content Test",
                ProjectType.TABLE,
                initialContent,
                Collections.emptySet(),
                "Test",
                "Notes"
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/projects")
                        .header(AUTHORIZATION, BEARER + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String projectId = extractId(createResult);

        String invalidPatchPayload = """
            {
              "version": 0,
              "content": {
                "nodes": [],
                "edges": []
              }
            }
            """;

        mockMvc.perform(patch("/api/v1/projects/" + projectId + "/content")
                        .header(AUTHORIZATION, BEARER + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPatchPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Invalid project content for type TABLE"));
    }

    @Test
    void shouldAllowPatchingTableProjectWithValidContentShape() throws Exception {
        var initialContent = objectMapper.createObjectNode();
        initialContent.putArray("alternatives");
        initialContent.putArray("objectives");
        initialContent.putObject("cells");

        CreateProjectRequest createRequest = new CreateProjectRequest(
                "Valid Content Test",
                ProjectType.TABLE,
                initialContent,
                Collections.emptySet(),
                "Test",
                "Notes"
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/projects")
                        .header(AUTHORIZATION, BEARER + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String projectId = extractId(createResult);

        String validPatchPayload = """
            {
              "version": 0,
              "content": {
                "alternatives": ["A", "B"],
                "objectives": ["Cena"],
                "cells": {
                  "0-0": "10",
                  "0-1": "20"
                }
              }
            }
            """;

        mockMvc.perform(patch("/api/v1/projects/" + projectId + "/content")
                        .header(AUTHORIZATION, BEARER + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validPatchPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.alternatives[0]").value("A"))
                .andExpect(jsonPath("$.content.objectives[0]").value("Cena"));
    }
}