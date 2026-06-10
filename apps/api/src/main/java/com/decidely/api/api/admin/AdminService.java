package com.decidely.api.api.admin;

import com.decidely.api.api.admin.dto.AdminShareDTO;
import com.decidely.api.api.admin.dto.SystemStatsDTO;
import com.decidely.api.api.admin.dto.UserSummaryDTO;
import com.decidely.api.domain.project.ProjectRepository;
import com.decidely.api.domain.share.ProjectShareRepository;
import com.decidely.api.domain.user.User;
import com.decidely.api.domain.user.UserRepository;
import com.decidely.api.domain.user.UserRole;
import com.decidely.api.exception.ResourceNotFoundException;
import com.decidely.api.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ProjectShareRepository projectShareRepository;

    @Transactional(readOnly = true)
    public SystemStatsDTO getSystemStats() {
        return projectRepository.getSystemStats();
    }

    @Transactional(readOnly = true)
    public Page<UserSummaryDTO> getUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(user -> new UserSummaryDTO(
                        user.getId(),
                        user.getName(),
                        user.getEmail(),
                        user.getRole().name(),
                        user.isActive(),
                        user.getCreatedAt()
                ));
    }

    @Transactional
    public void toggleUserActive(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() == UserRole.ADMIN) {
            throw new ValidationException("Admin accounts cannot be deactivated");
        }

        user.setActive(!user.isActive());
    }

    @Transactional(readOnly = true)
    public Page<AdminShareDTO> getActiveShares(Pageable pageable) {
        return projectShareRepository.findActiveSharesWithDetails(Instant.now(), pageable)
                .map(share -> new AdminShareDTO(
                        share.getId(),
                        share.getProject().getId().toString(),
                        share.getProject().getTitle(),
                        maskToken(share.getToken()),
                        share.getExpiresAt(),
                        share.getProject().getOwner().getEmail()
                ));
    }

    @Transactional
    public void revokeShare(UUID id) {
        if (!projectShareRepository.existsById(id)) {
            throw new ResourceNotFoundException("Share link not found or already revoked");
        }

        projectShareRepository.deleteById(id);
    }

    private String maskToken(String token) {
        if (token == null || token.length() < 8) {
            return "Token unavailable";
        }

        return token.substring(0, 8) + "...";
    }
}