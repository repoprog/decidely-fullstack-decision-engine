package com.decidely.api.security;

import com.decidely.api.domain.project.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectSecurityServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private Authentication authentication;

    @Mock
    private CustomUserDetails userDetails;

    @InjectMocks
    private ProjectSecurityService projectSecurityService;

    private UUID projectId;
    private UUID currentUserId;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        currentUserId = UUID.randomUUID();
    }

    @Test
    void shouldReturnFalseWhenAuthenticationIsNull() {
        boolean result = projectSecurityService.isOwner(projectId, null);

        assertFalse(result, "Anonymous user should not have access");
    }

    @Test
    void shouldReturnFalseWhenUserIsNotAuthenticated() {
        when(authentication.isAuthenticated()).thenReturn(false);

        boolean result = projectSecurityService.isOwner(projectId, authentication);

        assertFalse(result, "Unauthenticated user should not have access");
    }

    @Test
    void shouldReturnFalseWhenPrincipalIsNotCustomUserDetails() {
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn("anonymousUser");

        boolean result = projectSecurityService.isOwner(projectId, authentication);

        assertFalse(result, "Unsupported principal type should be rejected");
    }

    @Test
    void shouldReturnFalseWhenProjectDoesNotExist() {
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getId()).thenReturn(currentUserId);
        when(projectRepository.existsByIdAndOwnerIdAndIsDeletedFalse(projectId, currentUserId))
                .thenReturn(false);

        boolean result = projectSecurityService.isOwner(projectId, authentication);

        assertFalse(result, "Missing project should deny access");
    }

    @Test
    void shouldReturnFalseWhenUserIsNotTheOwner() {
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getId()).thenReturn(currentUserId);
        when(projectRepository.existsByIdAndOwnerIdAndIsDeletedFalse(projectId, currentUserId))
                .thenReturn(false);

        boolean result = projectSecurityService.isOwner(projectId, authentication);

        assertFalse(result, "Non-owner should not have access");
    }

    @Test
    void shouldReturnTrueWhenUserIsTheOwner() {
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getId()).thenReturn(currentUserId);
        when(projectRepository.existsByIdAndOwnerIdAndIsDeletedFalse(projectId, currentUserId))
                .thenReturn(true);

        boolean result = projectSecurityService.isOwner(projectId, authentication);

        assertTrue(result, "Project owner should have access");
    }
}