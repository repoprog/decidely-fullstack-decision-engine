package com.decidely.api.api.share;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.decidely.api.api.share.dto.CreateShareRequest;
import com.decidely.api.api.share.dto.ShareResponse;
import com.decidely.api.api.share.dto.SharedProjectDTO;
import com.decidely.api.domain.project.Project;
import com.decidely.api.domain.project.ProjectRepository;
import com.decidely.api.domain.project.ProjectType;
import com.decidely.api.domain.share.ProjectShare;
import com.decidely.api.domain.share.ProjectShareRepository;
import com.decidely.api.domain.user.User;
import com.decidely.api.exception.AccessDeniedException;
import com.decidely.api.exception.ResourceNotFoundException;
import com.decidely.api.security.CustomUserDetails;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShareServiceTest {

    private static final String VALID_TOKEN = "valid-secret-token";
    private static final String FRONTEND_URL = "http://localhost:5173";
    private static final String PROJECT_TITLE = "Top Secret Project";

    @Mock
    private ProjectShareRepository shareRepository;

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private ShareService shareService;

    private Project mockProject;
    private ProjectShare mockShare;
    private UUID currentUserId;
    private ObjectMapper objectMapper;
    private Instant projectUpdatedAt;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(shareService, "frontendUrl", FRONTEND_URL);

        objectMapper = new ObjectMapper();
        currentUserId = UUID.randomUUID();
        projectUpdatedAt = Instant.now().truncatedTo(ChronoUnit.MILLIS);

        CustomUserDetails userDetails = mock(CustomUserDetails.class);
        lenient().when(userDetails.getId()).thenReturn(currentUserId);

        Authentication authentication = mock(Authentication.class);
        lenient().when(authentication.getPrincipal()).thenReturn(userDetails);

        SecurityContext securityContext = mock(SecurityContext.class);
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        User owner = new User();
        owner.setId(currentUserId);

        mockProject = new Project();
        mockProject.setId(UUID.randomUUID());
        mockProject.setTitle(PROJECT_TITLE);
        mockProject.setType(ProjectType.TREE);
        mockProject.setContent(validTreeContent("shared"));
        mockProject.setUpdatedAt(projectUpdatedAt);
        mockProject.setDeleted(false);
        mockProject.setOwner(owner);

        mockShare = new ProjectShare();
        mockShare.setId(UUID.randomUUID());
        mockShare.setProject(mockProject);
        mockShare.setToken(VALID_TOKEN);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldCreateShareLinkSuccessfully() {
        CreateShareRequest request = new CreateShareRequest("reviewer@test.com", null);

        when(projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(mockProject.getId(), currentUserId))
                .thenReturn(Optional.of(mockProject));

        ShareResponse response = shareService.createShare(mockProject.getId(), request);

        assertNotNull(response);
        assertNotNull(response.token());
        assertTrue(response.shareUrl().startsWith(FRONTEND_URL + "/shared/"));
        verify(shareRepository, times(1)).save(any(ProjectShare.class));
    }

    @Test
    void shouldThrowWhenCreatingShareForProjectNotOwnedByCurrentUser() {
        UUID projectId = UUID.randomUUID();
        CreateShareRequest request = new CreateShareRequest("reviewer@test.com", null);

        when(projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(projectId, currentUserId))
                .thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> shareService.createShare(projectId, request)
        );

        assertEquals("Project not found", exception.getMessage());
        verify(shareRepository, never()).save(any(ProjectShare.class));
    }

    @Test
    void shouldDeleteShareSuccessfully() {
        when(projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(mockProject.getId(), currentUserId))
                .thenReturn(Optional.of(mockProject));

        when(shareRepository.findByIdAndProjectId(mockShare.getId(), mockProject.getId()))
                .thenReturn(Optional.of(mockShare));

        shareService.deleteShare(mockProject.getId(), mockShare.getId());

        verify(shareRepository, times(1)).delete(mockShare);
    }

    @Test
    void shouldThrowWhenDeletingShareForProjectNotOwnedByCurrentUser() {
        UUID projectId = UUID.randomUUID();
        UUID shareId = UUID.randomUUID();

        when(projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(projectId, currentUserId))
                .thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> shareService.deleteShare(projectId, shareId)
        );

        assertEquals("Project not found", exception.getMessage());
        verify(shareRepository, never()).findByIdAndProjectId(any(UUID.class), any(UUID.class));
        verify(shareRepository, never()).delete(any(ProjectShare.class));
    }

    @Test
    void shouldThrowWhenDeletingShareThatDoesNotBelongToProject() {
        UUID shareId = UUID.randomUUID();

        when(projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(mockProject.getId(), currentUserId))
                .thenReturn(Optional.of(mockProject));

        when(shareRepository.findByIdAndProjectId(shareId, mockProject.getId()))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> shareService.deleteShare(mockProject.getId(), shareId)
        );

        verify(shareRepository, never()).delete(any(ProjectShare.class));
    }

    @Test
    void shouldReturnSharedProjectWhenTokenIsValid() {
        mockShare.setExpiresAt(Instant.now().plus(1, ChronoUnit.HOURS));

        when(shareRepository.findByToken(VALID_TOKEN)).thenReturn(Optional.of(mockShare));

        SharedProjectDTO result = shareService.getSharedProject(VALID_TOKEN);

        assertEquals(mockProject.getId(), result.id());
        assertEquals(PROJECT_TITLE, result.title());
        assertEquals(ProjectType.TREE, result.type());
        assertEquals("shared", result.content().get("state").asText());
        assertTrue(result.content().get("nodes").isArray());
        assertTrue(result.content().get("edges").isArray());
        assertEquals(projectUpdatedAt, result.updatedAt());

        verify(projectRepository, never())
                .findByIdAndOwnerIdAndIsDeletedFalse(any(UUID.class), any(UUID.class));
    }

    @Test
    void shouldThrowNotFoundWhenShareTokenDoesNotExist() {
        when(shareRepository.findByToken(VALID_TOKEN)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> shareService.getSharedProject(VALID_TOKEN)
        );

        assertEquals("Share token not found", exception.getMessage());
    }

    @Test
    void shouldThrowAccessDeniedWhenTokenIsExpired() {
        mockShare.setExpiresAt(Instant.now().minus(1, ChronoUnit.HOURS));

        when(shareRepository.findByToken(VALID_TOKEN)).thenReturn(Optional.of(mockShare));

        AccessDeniedException exception = assertThrows(
                AccessDeniedException.class,
                () -> shareService.getSharedProject(VALID_TOKEN)
        );

        assertEquals("Share token has expired", exception.getMessage());
    }

    @Test
    void shouldThrowNotFoundWhenSharedProjectIsDeleted() {
        mockProject.setDeleted(true);
        mockShare.setExpiresAt(Instant.now().plus(1, ChronoUnit.HOURS));

        when(shareRepository.findByToken(VALID_TOKEN)).thenReturn(Optional.of(mockShare));

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> shareService.getSharedProject(VALID_TOKEN)
        );

        assertEquals("Shared project is no longer available", exception.getMessage());
    }

    private ObjectNode validTreeContent(String state) {
        ObjectNode content = objectMapper.createObjectNode();
        content.putArray("nodes");
        content.putArray("edges");

        if (state != null) {
            content.put("state", state);
        }

        return content;
    }
}