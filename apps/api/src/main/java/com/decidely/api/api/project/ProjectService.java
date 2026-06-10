package com.decidely.api.api.project;

import com.decidely.api.api.project.dto.CreateProjectRequest;
import com.decidely.api.api.project.dto.PatchContentRequest;
import com.decidely.api.api.project.dto.ProjectDetailDTO;
import com.decidely.api.api.project.dto.ProjectSummaryDTO;
import com.decidely.api.api.project.dto.UpdateProjectRequest;
import com.decidely.api.domain.project.Project;
import com.decidely.api.domain.project.ProjectRepository;
import com.decidely.api.domain.project.ProjectType;
import com.decidely.api.domain.user.UserRepository;
import com.decidely.api.exception.ConflictException;
import com.decidely.api.exception.ResourceNotFoundException;
import com.decidely.api.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor

public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMapper projectMapper;
    private final ProjectContentValidator projectContentValidator;

    private CustomUserDetails getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AuthenticationCredentialsNotFoundException("No authenticated user found");
        }

        return userDetails;
    }

    @Transactional(readOnly = true)
    public Page<ProjectSummaryDTO> getProjects(ProjectType type, String category, String search, Pageable pageable) {
        UUID ownerId = getCurrentUser().getId();

        return projectRepository.findProjectSummariesByCriteria(
                ownerId,
                type != null ? type.name() : null,
                category,
                search != null && !search.trim().isEmpty() ? search : null,
                pageable
        ).map(p -> new ProjectSummaryDTO(
                p.getId(),
                p.getTitle(),
                p.getType(),
                p.getTags(),
                p.getCategory(),
                p.getNotes(),
                p.getCreatedAt(),
                p.getUpdatedAt(),
                p.getSnapshotCount()
        ));
    }

    @Transactional
    public ProjectDetailDTO createProject(CreateProjectRequest request) {
        projectContentValidator.validateIfPresent(request.type(), request.content());

        Project project = Project.builder()
                .owner(userRepository.getReferenceById(getCurrentUser().getId()))
                .title(request.title())
                .type(request.type())
                .content(request.content())
                .tags(request.tags())
                .category(request.category())
                .notes(request.notes())
                .build();

        return projectMapper.toDetailDto(projectRepository.save(project));
    }

    @Transactional(readOnly = true)
    public ProjectDetailDTO getProject(UUID id) {
        return projectMapper.toDetailDto(findOwnedProject(id));
    }

    @Transactional
    public ProjectDetailDTO updateProject(UUID id, UpdateProjectRequest request) {
        Project project = findOwnedProject(id);

        if (request.title() != null) {
            project.setTitle(request.title());
        }
        if (request.tags() != null) {
            project.setTags(request.tags());
        }
        if (request.category() != null) {
            project.setCategory(request.category());
        }
        if (request.notes() != null) {
            project.setNotes(request.notes());
        }

        return projectMapper.toDetailDto(projectRepository.save(project));
    }

    @Transactional
    public ProjectDetailDTO patchContent(UUID id, PatchContentRequest request) {
        Project project = findOwnedProject(id);

        if (!Objects.equals(project.getVersion(), request.version())) {
            throw new ConflictException(
                    "Project was modified in another session. Reload the project before saving again."
            );
        }

        projectContentValidator.validate(project.getType(), request.content());

        project.setContent(request.content());

        Project savedProject = projectRepository.saveAndFlush(project);
        return projectMapper.toDetailDto(savedProject);
    }

    @Transactional
    public void deleteProject(UUID id) {
        Project project = findOwnedProject(id);
        project.setDeleted(true);
        projectRepository.save(project);
    }

    private Project findOwnedProject(UUID id) {
        UUID ownerId = getCurrentUser().getId();

        return projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(id, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

}
