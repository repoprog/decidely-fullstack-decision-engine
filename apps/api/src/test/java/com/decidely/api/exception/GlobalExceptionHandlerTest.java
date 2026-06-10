package com.decidely.api.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new DummyController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void shouldReturnStructuredErrorResponseForNotFound() throws Exception {
        mockMvc.perform(get("/dummy/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Resource does not exist"))
                .andExpect(jsonPath("$.path").value("/dummy/not-found"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void shouldReturnStructuredErrorResponseForValidationException() throws Exception {
        mockMvc.perform(get("/dummy/validation"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Invalid input data"))
                .andExpect(jsonPath("$.path").value("/dummy/validation"));
    }

    @Test
    void shouldReturnStructuredErrorResponseForAccessDenied() throws Exception {
        mockMvc.perform(get("/dummy/access-denied"))
                .andExpect(status().isForbidden())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("Access denied"))
                .andExpect(jsonPath("$.path").value("/dummy/access-denied"));
    }

    @Test
    void shouldReturnStructuredErrorResponseForIllegalArgument() throws Exception {
        mockMvc.perform(get("/dummy/illegal-argument"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Invalid pagination argument"))
                .andExpect(jsonPath("$.path").value("/dummy/illegal-argument"));
    }

    @Test
    void shouldReturnStructuredErrorResponseForGenericExceptionAndHideDetails() throws Exception {
        mockMvc.perform(get("/dummy/generic"))
                .andExpect(status().isInternalServerError())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.message").value("An unexpected error occurred"))
                .andExpect(jsonPath("$.path").value("/dummy/generic"));
    }

    @RestController
    static class DummyController {

        @GetMapping("/dummy/not-found")
        public void notFound() {
            throw new ResourceNotFoundException("Resource does not exist");
        }

        @GetMapping("/dummy/validation")
        public void validation() {
            throw new ValidationException("Invalid input data");
        }

        @GetMapping("/dummy/access-denied")
        public void accessDenied() {
            throw new AccessDeniedException("Sensitive denial reason");
        }

        @GetMapping("/dummy/illegal-argument")
        public void illegalArgument() {
            throw new IllegalArgumentException("Invalid pagination argument");
        }

        @GetMapping("/dummy/generic")
        public void generic() throws Exception {
            throw new Exception("Sensitive internal failure details");
        }
    }
}