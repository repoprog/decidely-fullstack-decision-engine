package com.decidely.api.api.snapshot;

import com.decidely.api.api.project.ProjectMapper;
import com.decidely.api.api.project.dto.ProjectDetailDTO;
import com.decidely.api.api.snapshot.dto.CreateSnapshotRequest;
import com.decidely.api.api.snapshot.dto.RestoreSnapshotRequest;
import com.decidely.api.api.snapshot.dto.SnapshotDetailDTO;
import com.decidely.api.api.snapshot.dto.SnapshotSummaryDTO;
import com.decidely.api.domain.project.Project;
import com.decidely.api.domain.project.ProjectRepository;
import com.decidely.api.domain.project.ProjectType;
import com.decidely.api.domain.snapshot.ProjectSnapshot;
import com.decidely.api.domain.snapshot.ProjectSnapshotRepository;
import com.decidely.api.exception.ConflictException;
import com.decidely.api.exception.ResourceNotFoundException;
import com.decidely.api.exception.ValidationException;
import com.decidely.api.security.CustomUserDetails;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SnapshotService {

    private static final String PROJECT_MODIFIED_MESSAGE =
            "Project was modified in another session. Reload the project before saving again.";
    private static final int MAX_SNAPSHOTS_PER_PROJECT = 100;

    private final ProjectSnapshotRepository snapshotRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMapper projectMapper;

    @Transactional(readOnly = true)
    public List<SnapshotSummaryDTO> getSnapshots(UUID projectId) {
        Project project = findOwnedProject(projectId);

        return snapshotRepository.findAllByProjectIdOrderByCreatedAtDesc(projectId)
                .stream()
                .map(snapshot -> toSummaryDto(snapshot, project.getType()))
                .collect(Collectors.toList());
    }

    @Transactional
    public SnapshotSummaryDTO createSnapshot(UUID projectId, CreateSnapshotRequest request) {
        Project project = findOwnedProject(projectId);

        long snapshotCount = snapshotRepository.countByProjectId(projectId);

        if (snapshotCount >= MAX_SNAPSHOTS_PER_PROJECT) {
            throw new ValidationException("Maximum number of snapshots reached for this project");
        }

        ProjectSnapshot snapshot = ProjectSnapshot.builder()
                .project(project)
                .label(request.label())
                .content(copyContent(project.getContent()))
                .createdBy(project.getOwner())
                .build();

        snapshotRepository.save(snapshot);

        return toSummaryDto(snapshot, project.getType());
    }

    @Transactional(readOnly = true)
    public SnapshotDetailDTO getSnapshot(UUID projectId, UUID snapId) {
        findOwnedProject(projectId);

        ProjectSnapshot snapshot = snapshotRepository.findByIdAndProjectId(snapId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Snapshot not found"));

        List<String> smartTags = generateSmartTags(
                snapshot.getContent(),
                snapshot.getProject().getType()
        );

        return new SnapshotDetailDTO(
                snapshot.getId(),
                snapshot.getLabel(),
                snapshot.getContent(),
                snapshot.getCreatedAt(),
                smartTags
        );
    }

    @Transactional
    public ProjectDetailDTO restoreSnapshot(
            UUID projectId,
            UUID snapId,
            RestoreSnapshotRequest request
    ) {
        Project project = findOwnedProject(projectId);

        ProjectSnapshot snapshot = snapshotRepository.findByIdAndProjectId(snapId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Snapshot not found"));

        requireExpectedVersion(project, request.version());

        project.setContent(copyContent(snapshot.getContent()));

        Project savedProject = projectRepository.saveAndFlush(project);
        return projectMapper.toDetailDto(savedProject);
    }

    private void requireExpectedVersion(Project project, Long expectedVersion) {
        if (!Objects.equals(project.getVersion(), expectedVersion)) {
            throw new ConflictException(PROJECT_MODIFIED_MESSAGE);
        }
    }

    private SnapshotSummaryDTO toSummaryDto(ProjectSnapshot snapshot, ProjectType projectType) {
        return new SnapshotSummaryDTO(
                snapshot.getId(),
                snapshot.getLabel(),
                snapshot.getCreatedAt(),
                generateSmartTags(snapshot.getContent(), projectType)
        );
    }

    private JsonNode copyContent(JsonNode content) {
        return content != null ? content.deepCopy() : null;
    }

    private Project findOwnedProject(UUID projectId) {
        UUID ownerId = getCurrentUser().getId();

        return projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(projectId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

    private CustomUserDetails getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AuthenticationCredentialsNotFoundException("No authenticated user found");
        }

        return userDetails;
    }

    private List<String> generateSmartTags(JsonNode content, ProjectType type) {
        List<String> tags = new ArrayList<>();

        if (content == null || content.isNull() || content.isEmpty()) {
            return tags;
        }

        if (type == ProjectType.TABLE) {
            int altCount = countArrayItems(content, "alternatives");
            int objCount = countArrayItems(content, "objectives");

            tags.add("Cele " + objCount);
            tags.add("Alternatywy " + altCount);
        } else if (type == ProjectType.TREE) {
            tags.add("Decyzje " + countTreeDecisionNodes(content));
        }

        return tags;
    }

    private int countArrayItems(JsonNode content, String fieldName) {
        JsonNode field = content.get(fieldName);

        return field != null && field.isArray() ? field.size() : 0;
    }

    private int countTreeDecisionNodes(JsonNode content) {
        JsonNode nodes = content.get("nodes");

        if (nodes == null || !nodes.isArray()) {
            return 0;
        }

        int decisionCount = 0;

        for (JsonNode node : nodes) {
            String nodeType = node.has("type") ? node.get("type").asText() : null;

            if ("decision".equals(nodeType) || "chance".equals(nodeType)) {
                decisionCount++;
            }
        }

        return decisionCount;
    }
}