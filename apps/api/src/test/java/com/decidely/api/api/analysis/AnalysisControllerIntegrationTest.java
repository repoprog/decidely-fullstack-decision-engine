package com.decidely.api.api.analysis;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.decidely.api.api.AbstractIntegrationTest;
import com.decidely.api.api.auth.dto.LoginRequest;
import com.decidely.api.api.auth.dto.RegisterRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AnalysisControllerIntegrationTest extends AbstractIntegrationTest {

    private static final String TEST_PASSWORD = "password123!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String validUserToken;

    @BeforeEach
    void setUp() throws Exception {
        String testEmail = "analyst_" + UUID.randomUUID() + "@test.com";

        registerUser(testEmail);
        validUserToken = loginAndExtractAccessToken(testEmail);
    }

    @Test
    void shouldRejectUnauthenticatedRequests() throws Exception {
        mockMvc.perform(post("/api/v1/analysis/table")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/analysis/tree")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldProcessTableAnalysisForAuthenticatedUser() throws Exception {
        String validTablePayload = """
                {
                  "alternatives": [
                    {"index": 0, "name": "Opcja A"}
                  ],
                  "criteria": [
                    {"index": 0, "name": "Cena", "sortDirection": "LOWER"}
                  ],
                  "resolvedMatrix": {
                    "0-0": 100.0
                  },
                  "rejectedAlternativeIndices": [],
                  "equalizedCriterionIndices": []
                }
                """;

        mockMvc.perform(post("/api/v1/analysis/table")
                        .header("Authorization", "Bearer " + validUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validTablePayload))
                .andExpect(status().isOk());
    }

    @Test
    void shouldProcessTreeAnalysisForAuthenticatedUser() throws Exception {
        String validTreePayload = """
                {
                  "evaluationMode": "MAX",
                  "nodes": [
                     {"id": "root", "type": "decision", "name": "Initial decision"}
                  ],
                  "edges": []
                }
                """;

        mockMvc.perform(post("/api/v1/analysis/tree")
                        .header("Authorization", "Bearer " + validUserToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validTreePayload))
                .andExpect(status().isOk());
    }

    @Test
    void shouldRejectTreeAnalysisNodeWithoutId() throws Exception {
        String payload = """
                {
                  "evaluationMode": "MAX",
                  "nodes": [
                    {"type": "decision"}
                  ],
                  "edges": []
                }
                """;

        performTreeAnalysis(payload)
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectTreeAnalysisNodeWithInvalidType() throws Exception {
        String payload = """
                {
                  "evaluationMode": "MAX",
                  "nodes": [
                    {"id": "root", "type": "DECISION"}
                  ],
                  "edges": []
                }
                """;

        performTreeAnalysis(payload)
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectTreeAnalysisEdgeWithoutSourceOrTarget() throws Exception {
        String payload = """
                {
                  "evaluationMode": "MAX",
                  "nodes": [
                    {"id": "root", "type": "decision"},
                    {"id": "end", "type": "terminal"}
                  ],
                  "edges": [
                    {"id": "edge-1"}
                  ]
                }
                """;

        performTreeAnalysis(payload)
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectTreeAnalysisProbabilityGreaterThanOne() throws Exception {
        String payload = """
                {
                  "evaluationMode": "MAX",
                  "nodes": [
                    {"id": "root", "type": "chance"},
                    {"id": "end", "type": "terminal"}
                  ],
                  "edges": [
                    {
                      "id": "edge-1",
                      "source": "root",
                      "target": "end",
                      "data": {
                        "probability": 1.1
                      }
                    }
                  ]
                }
                """;

        performTreeAnalysis(payload)
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectTreeAnalysisWithEmptyNodes() throws Exception {
        String payload = """
                {
                  "evaluationMode": "MAX",
                  "nodes": [],
                  "edges": []
                }
                """;

        performTreeAnalysis(payload)
                .andExpect(status().isBadRequest());
    }

    private void registerUser(String email) throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegisterRequest(
                                "Analyst",
                                email,
                                TEST_PASSWORD
                        ))))
                .andExpect(status().isOk());
    }

    private String loginAndExtractAccessToken(String email) throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(
                                email,
                                TEST_PASSWORD
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("accessToken")
                .asText();
    }

    private ResultActions performTreeAnalysis(String payload) throws Exception {
        return mockMvc.perform(post("/api/v1/analysis/tree")
                .header("Authorization", "Bearer " + validUserToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload));
    }
}