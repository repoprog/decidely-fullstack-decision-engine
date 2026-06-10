package com.decidely.api.api.snapshot;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
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
import com.decidely.api.domain.user.User;
import com.decidely.api.exception.ConflictException;
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

import java.time.Instant;
import java.util.Collections;
import java.util.List;
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
class SnapshotServiceTest {

    private static final String PROJECT_NOT_FOUND = "Project not found";
    private static final String SNAPSHOT_NOT_FOUND = "Snapshot not found";
    private static final String SNAPSHOT_LABEL = "Version after consultation";
    private static final String DETAIL_SNAPSHOT_LABEL = "Detail Snap";
    private static final String LIST_SNAPSHOT_LABEL = "Test Snap";

    @Mock
    private ProjectSnapshotRepository snapshotRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMapper projectMapper;

    @InjectMocks
    private SnapshotService snapshotService;

    private ObjectMapper objectMapper;
    private Project mockProject;
    private User mockUser;
    private UUID currentUserId;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        currentUserId = UUID.randomUUID();

        CustomUserDetails userDetails = mock(CustomUserDetails.class);
        lenient().when(userDetails.getId()).thenReturn(currentUserId);

        Authentication authentication = mock(Authentication.class);
        lenient().when(authentication.getPrincipal()).thenReturn(userDetails);

        SecurityContext securityContext = mock(SecurityContext.class);
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        mockUser = new User();
        mockUser.setId(currentUserId);

        mockProject = new Project();
        mockProject.setId(UUID.randomUUID());
        mockProject.setOwner(mockUser);
        mockProject.setDeleted(false);
        mockProject.setVersion(0L);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldGetSnapshotsList() {
        when(projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(mockProject.getId(), currentUserId))
                .thenReturn(Optional.of(mockProject));

        ProjectSnapshot snapshot = new ProjectSnapshot();
        snapshot.setId(UUID.randomUUID());
        snapshot.setLabel(LIST_SNAPSHOT_LABEL);
        snapshot.setProject(mockProject);
        snapshot.setCreatedAt(Instant.now());

        when(snapshotRepository.findAllByProjectIdOrderByCreatedAtDesc(mockProject.getId()))
                .thenReturn(List.of(snapshot));

        List<SnapshotSummaryDTO> result = snapshotService.getSnapshots(mockProject.getId());

        assertEquals(1, result.size());
        assertEquals(LIST_SNAPSHOT_LABEL, result.get(0).label());
    }

    @Test
    void shouldThrowWhenListingSnapshotsForProjectNotOwnedByCurrentUser() {
        UUID projectId = UUID.randomUUID();

        when(projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(projectId, currentUserId))
                .thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> snapshotService.getSnapshots(projectId)
        );

        assertEquals(PROJECT_NOT_FOUND, exception.getMessage());
        verify(snapshotRepository, never()).findAllByProjectIdOrderByCreatedAtDesc(any(UUID.class));
    }

    @Test
    void shouldGetSingleSnapshot() {
        UUID snapshotId = UUID.randomUUID();

        ProjectSnapshot snapshot = new ProjectSnapshot();
        snapshot.setId(snapshotId);
        snapshot.setLabel(DETAIL_SNAPSHOT_LABEL);
        snapshot.setProject(mockProject);

        when(projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(mockProject.getId(), currentUserId))
                .thenReturn(Optional.of(mockProject));

        when(snapshotRepository.findByIdAndProjectId(snapshotId, mockProject.getId()))
                .thenReturn(Optional.of(snapshot));

        SnapshotDetailDTO result = snapshotService.getSnapshot(mockProject.getId(), snapshotId);

        assertNotNull(result);
        assertEquals(DETAIL_SNAPSHOT_LABEL, result.label());
    }

    @Test
    void shouldThrowWhenGettingSnapshotForProjectNotOwnedByCurrentUser() {
        UUID projectId = UUID.randomUUID();
        UUID snapshotId = UUID.randomUUID();

        when(projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(projectId, currentUserId))
                .thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> snapshotService.getSnapshot(projectId, snapshotId)
        );

        assertEquals(PROJECT_NOT_FOUND, exception.getMessage());
        verify(snapshotRepository, never()).findByIdAndProjectId(any(UUID.class), any(UUID.class));
    }

    @Test
    void shouldCreateSnapshotAndGenerateSmartTagsForTable() {
        mockProject.setType(ProjectType.TABLE);

        ObjectNode jsonContent = objectMapper.createObjectNode();

        ArrayNode objectives = jsonContent.putArray("objectives");
        objectives.add(objectMapper.createObjectNode());
        objectives.add(objectMapper.createObjectNode());

        ArrayNode alternatives = jsonContent.putArray("alternatives");
        alternatives.add(objectMapper.createObjectNode());
        alternatives.add(objectMapper.createObjectNode());
        alternatives.add(objectMapper.createObjectNode());

        mockProject.setContent(jsonContent);

        CreateSnapshotRequest request = new CreateSnapshotRequest(SNAPSHOT_LABEL);

        when(projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(mockProject.getId(), currentUserId))
                .thenReturn(Optional.of(mockProject));

        when(snapshotRepository.save(any(ProjectSnapshot.class))).thenAnswer(invocation -> {
            ProjectSnapshot savedSnapshot = invocation.getArgument(0);
            savedSnapshot.setId(UUID.randomUUID());
            savedSnapshot.setCreatedAt(Instant.now());
            return savedSnapshot;
        });

        SnapshotSummaryDTO result = snapshotService.createSnapshot(mockProject.getId(), request);

        assertNotNull(result);
        assertEquals(SNAPSHOT_LABEL, result.label());
        assertTrue(result.smartTags().contains("Cele 2"));
        assertTrue(result.smartTags().contains("Alternatywy 3"));
        verify(snapshotRepository, times(1)).save(any(ProjectSnapshot.class));
    }

    @Test
    void shouldThrowWhenCreatingSnapshotForProjectNotOwnedByCurrentUser() {
        UUID projectId = UUID.randomUUID();
        CreateSnapshotRequest request = new CreateSnapshotRequest("Blocked");

        when(projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(projectId, currentUserId))
                .thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> snapshotService.createSnapshot(projectId, request)
        );

        assertEquals(PROJECT_NOT_FOUND, exception.getMessage());
        verify(snapshotRepository, never()).save(any(ProjectSnapshot.class));
    }

    @Test
    void shouldRestoreSnapshotSuccessfully() {
        UUID snapshotId = UUID.randomUUID();

        ObjectNode oldJsonContent = objectMapper.createObjectNode();
        oldJsonContent.put("state", "perfect_old_state");

        ProjectSnapshot snapshot = new ProjectSnapshot();
        snapshot.setId(snapshotId);
        snapshot.setProject(mockProject);
        snapshot.setContent(oldJsonContent);

        ProjectDetailDTO expectedDto = new ProjectDetailDTO(
                mockProject.getId(),
                1L,
                null,
                null,
                oldJsonContent,
                Collections.emptySet(),
                null,
                null,
                null,
                null,
                null
        );

        when(projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(mockProject.getId(), currentUserId))
                .thenReturn(Optional.of(mockProject));

        when(snapshotRepository.findByIdAndProjectId(snapshotId, mockProject.getId()))
                .thenReturn(Optional.of(snapshot));

        when(projectRepository.saveAndFlush(mockProject)).thenReturn(mockProject);
        when(projectMapper.toDetailDto(mockProject)).thenReturn(expectedDto);

        ProjectDetailDTO result = snapshotService.restoreSnapshot(
                mockProject.getId(),
                snapshotId,
                new RestoreSnapshotRequest(0L)
        );

        assertNotNull(result);
        assertNotNull(mockProject.getContent());
        assertEquals("perfect_old_state", mockProject.getContent().get("state").asText());
        verify(projectRepository, times(1)).saveAndFlush(mockProject);
        verify(projectMapper, times(1)).toDetailDto(mockProject);
    }

    @Test
    void shouldThrowExceptionWhenRestoringNonExistentSnapshot() {
        UUID fakeSnapshotId = UUID.randomUUID();

        when(projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(mockProject.getId(), currentUserId))
                .thenReturn(Optional.of(mockProject));

        when(snapshotRepository.findByIdAndProjectId(fakeSnapshotId, mockProject.getId()))
                .thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> snapshotService.restoreSnapshot(
                        mockProject.getId(),
                        fakeSnapshotId,
                        new RestoreSnapshotRequest(0L)
                )
        );

        assertEquals(SNAPSHOT_NOT_FOUND, exception.getMessage());
    }

    @Test
    void shouldThrowWhenRestoringSnapshotForProjectNotOwnedByCurrentUser() {
        UUID projectId = UUID.randomUUID();
        UUID snapshotId = UUID.randomUUID();

        when(projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(projectId, currentUserId))
                .thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> snapshotService.restoreSnapshot(
                        projectId,
                        snapshotId,
                        new RestoreSnapshotRequest(0L)
                )
        );

        assertEquals(PROJECT_NOT_FOUND, exception.getMessage());
        verify(snapshotRepository, never()).findByIdAndProjectId(any(UUID.class), any(UUID.class));
        verify(projectRepository, never()).save(any(Project.class));
        verify(projectRepository, never()).saveAndFlush(any(Project.class));
    }

    @Test
    void shouldThrowConflictWhenRestoringSnapshotWithStaleVersion() {
        UUID snapshotId = UUID.randomUUID();

        mockProject.setVersion(1L);

        ProjectSnapshot snapshot = new ProjectSnapshot();
        snapshot.setId(snapshotId);
        snapshot.setProject(mockProject);
        snapshot.setContent(objectMapper.createObjectNode());

        when(projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(mockProject.getId(), currentUserId))
                .thenReturn(Optional.of(mockProject));

        when(snapshotRepository.findByIdAndProjectId(snapshotId, mockProject.getId()))
                .thenReturn(Optional.of(snapshot));

        assertThrows(
                ConflictException.class,
                () -> snapshotService.restoreSnapshot(
                        mockProject.getId(),
                        snapshotId,
                        new RestoreSnapshotRequest(0L)
                )
        );

        verify(projectRepository, never()).save(any(Project.class));
        verify(projectRepository, never()).saveAndFlush(any(Project.class));
    }
}