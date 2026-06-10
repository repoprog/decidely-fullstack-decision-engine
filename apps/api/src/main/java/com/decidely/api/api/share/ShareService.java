package com.decidely.api.api.share;

import com.decidely.api.api.share.dto.CreateShareRequest;
import com.decidely.api.api.share.dto.ShareResponse;
import com.decidely.api.api.share.dto.SharedProjectDTO;
import com.decidely.api.domain.project.Project;
import com.decidely.api.domain.project.ProjectRepository;
import com.decidely.api.domain.share.ProjectShare;
import com.decidely.api.domain.share.ProjectShareRepository;
import com.decidely.api.domain.share.SharePermission;
import com.decidely.api.exception.AccessDeniedException;
import com.decidely.api.exception.ResourceNotFoundException;
import com.decidely.api.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShareService {

    private final ProjectShareRepository shareRepository;
    private final ProjectRepository projectRepository;


    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Transactional
    public ShareResponse createShare(UUID projectId, CreateShareRequest request) {
        Project project = findOwnedProject(projectId);
        String token = UUID.randomUUID().toString();

        ProjectShare share = ProjectShare.builder()
                .project(project)
                .sharedWithEmail(request.sharedWithEmail())
                .permission(SharePermission.READ_ONLY)
                .token(token)
                .expiresAt(request.expiresAt())
                .build();

        shareRepository.save(share);

        return new ShareResponse(buildShareUrl(token), token);
    }

    @Transactional(readOnly = true)
    public SharedProjectDTO getSharedProject(String token) {
        ProjectShare share = shareRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Share token not found"));

        if (isExpired(share)) {
            throw new AccessDeniedException("Share token has expired");
        }

        Project project = share.getProject();

        if (project.isDeleted()) {
            throw new ResourceNotFoundException("Shared project is no longer available");
        }

        return new SharedProjectDTO(
                project.getId(),
                project.getTitle(),
                project.getType(),
                project.getContent(),
                project.getUpdatedAt()
        );
    }

    @Transactional
    public void deleteShare(UUID projectId, UUID shareId) {
        findOwnedProject(projectId);

        ProjectShare share = shareRepository.findByIdAndProjectId(shareId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Share link not found"));

        shareRepository.delete(share);
    }

    private Project findOwnedProject(UUID projectId) {
        UUID ownerId = getCurrentUser().getId();

        return projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(projectId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

    private boolean isExpired(ProjectShare share) {
        return share.getExpiresAt() != null && share.getExpiresAt().isBefore(Instant.now());
    }

    private String buildShareUrl(String token) {
        return frontendUrl + "/shared/" + token;
    }

    private CustomUserDetails getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new AuthenticationCredentialsNotFoundException("No authenticated user found");
        }

        return userDetails;
    }
}