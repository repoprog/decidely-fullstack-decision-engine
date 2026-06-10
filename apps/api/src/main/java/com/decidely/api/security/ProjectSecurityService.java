package com.decidely.api.security;

import com.decidely.api.domain.project.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service("projectSecurity")
@RequiredArgsConstructor

public class ProjectSecurityService {

    private final ProjectRepository projectRepository;

    public boolean isOwner(UUID projectId, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof CustomUserDetails userDetails)) {
            return false;
        }

        return projectRepository.existsByIdAndOwnerIdAndIsDeletedFalse(projectId, userDetails.getId());
    }
}
