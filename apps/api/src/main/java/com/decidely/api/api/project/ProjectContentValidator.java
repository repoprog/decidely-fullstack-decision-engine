package com.decidely.api.api.project;

import com.decidely.api.domain.project.ProjectType;
import com.decidely.api.exception.ValidationException;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
public class ProjectContentValidator {

    private static final int MAX_CONTENT_BYTES = 512_000;

    public void validate(ProjectType projectType, JsonNode content) {
        if (projectType == null) {
            throw new ValidationException("Project type is required");
        }

        if (content == null || content.isNull()) {
            throw new ValidationException("Content is required");
        }

        if (!content.isObject()) {
            throw new ValidationException("Project content must be a JSON object");
        }

        int estimatedSize = content.toString().getBytes(StandardCharsets.UTF_8).length;

        if (estimatedSize > MAX_CONTENT_BYTES) {
            throw new ValidationException("Project content is too large");
        }

        boolean validShape = switch (projectType) {
            case TABLE -> hasTableShape(content);
            case TREE -> hasTreeShape(content);
        };

        if (!validShape) {
            throw new ValidationException("Invalid project content for type " + projectType);
        }
    }

    public void validateIfPresent(ProjectType projectType, JsonNode content) {
        if (content == null || content.isNull()) {
            return;
        }

        validate(projectType, content);
    }

    private boolean hasTableShape(JsonNode content) {
        return content.has("alternatives")
                && content.get("alternatives").isArray()
                && content.has("objectives")
                && content.get("objectives").isArray()
                && content.has("cells")
                && content.get("cells").isObject();
    }

    private boolean hasTreeShape(JsonNode content) {
        return content.has("nodes")
                && content.get("nodes").isArray()
                && content.has("edges")
                && content.get("edges").isArray();
    }
}