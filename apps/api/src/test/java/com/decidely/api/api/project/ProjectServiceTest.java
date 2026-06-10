package com.decidely.api.api.project;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.decidely.api.api.project.dto.CreateProjectRequest;
import com.decidely.api.api.project.dto.PatchContentRequest;
import com.decidely.api.api.project.dto.ProjectDetailDTO;
import com.decidely.api.api.project.dto.ProjectSummaryDTO;
import com.decidely.api.api.project.dto.UpdateProjectRequest;
import com.decidely.api.domain.project.Project;
import com.decidely.api.domain.project.ProjectRepository;
import com.decidely.api.domain.project.ProjectSummaryProjection;
import com.decidely.api.domain.project.ProjectType;
import com.decidely.api.domain.user.User;
import com.decidely.api.domain.user.UserRepository;
import com.decidely.api.exception.ResourceNotFoundException;
import com.decidely.api.security.CustomUserDetails;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProjectMapper projectMapper;


    @Mock
    private ProjectContentValidator projectContentValidator;

    @InjectMocks
    private ProjectService projectService;


    private UUID currentUserId;
    private User mockUser;
    private Project mockProject;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        currentUserId = UUID.randomUUID();
        objectMapper = new ObjectMapper();

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
        mockProject.setTitle("Test Project");
        mockProject.setType(ProjectType.TABLE);
        mockProject.setOwner(mockUser);
        mockProject.setDeleted(false);
        mockProject.setVersion(0L);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldOnlyReturnProjectsBelongingToCurrentUser() {
        PageRequest pageRequest = PageRequest.of(0, 20);

        ProjectSummaryProjection mockProjection = mock(ProjectSummaryProjection.class);
        when(mockProjection.getId()).thenReturn(mockProject.getId());
        when(mockProjection.getTitle()).thenReturn("Title");
        when(mockProjection.getType()).thenReturn(ProjectType.TABLE);
        when(mockProjection.getSnapshotCount()).thenReturn(0);

        Page<ProjectSummaryProjection> page = new PageImpl<>(List.of(mockProjection));

        when(projectRepository.findProjectSummariesByCriteria(
                eq(currentUserId),
                any(),
                any(),
                any(),
                eq(pageRequest)
        )).thenReturn(page);

        Page<ProjectSummaryDTO> result = projectService.getProjects(
                null,
                null,
                null,
                pageRequest
        );

        assertEquals(1, result.getContent().size());
        assertEquals("Title", result.getContent().get(0).title());

        verify(projectRepository, times(1)).findProjectSummariesByCriteria(
                eq(currentUserId),
                any(),
                any(),
                any(),
                eq(pageRequest)
        );
    }

    @Test
    void shouldCreateProjectSuccessfully() {
        CreateProjectRequest request = new CreateProjectRequest(
                "New Project",
                ProjectType.TREE,
                null,
                Collections.emptySet(),
                "Finance",
                "Notes"
        );

        when(userRepository.getReferenceById(currentUserId)).thenReturn(mockUser);
        when(projectRepository.save(any(Project.class))).thenReturn(mockProject);

        ProjectDetailDTO expectedDto = new ProjectDetailDTO(
                mockProject.getId(),
                0L,
                "New Project",
                ProjectType.TREE,
                null,
                Collections.emptySet(),
                "Finance",
                "Notes",
                Instant.now(),
                Instant.now(),
                0
        );

        when(projectMapper.toDetailDto(any(Project.class))).thenReturn(expectedDto);

        ProjectDetailDTO result = projectService.createProject(request);

        assertNotNull(result);
        assertEquals("New Project", result.title());
        verify(projectRepository, times(1)).save(any(Project.class));
    }

    @Test
    void shouldGetProjectSuccessfully() {
        when(projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(mockProject.getId(), currentUserId))
                .thenReturn(Optional.of(mockProject));

        ProjectDetailDTO expectedDto = new ProjectDetailDTO(
                mockProject.getId(),
                0L,
                "Test Project",
                ProjectType.TABLE,
                null,
                Collections.emptySet(),
                null,
                null,
                Instant.now(),
                Instant.now(),
                0
        );

        when(projectMapper.toDetailDto(mockProject)).thenReturn(expectedDto);

        ProjectDetailDTO result = projectService.getProject(mockProject.getId());

        assertNotNull(result);
        assertEquals("Test Project", result.title());
    }

    @Test
    void shouldThrowExceptionWhenProjectNotFound() {
        UUID randomId = UUID.randomUUID();

        when(projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(randomId, currentUserId))
                .thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> projectService.getProject(randomId)
        );

        assertTrue(exception.getMessage().contains("Project not found"));
    }

    @Test
    void shouldThrowExceptionWhenProjectDoesNotBelongToCurrentUser() {
        UUID otherUsersProjectId = UUID.randomUUID();

        when(projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(otherUsersProjectId, currentUserId))
                .thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> projectService.updateProject(
                        otherUsersProjectId,
                        new UpdateProjectRequest("Blocked", null, null, null)
                )
        );

        assertTrue(exception.getMessage().contains("Project not found"));
        verify(projectRepository, never()).save(any(Project.class));
    }

    @Test
    void shouldUpdateProjectSuccessfully() {
        UpdateProjectRequest request = new UpdateProjectRequest(
                "Updated Title",
                null,
                "New Category",
                null
        );

        when(projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(mockProject.getId(), currentUserId))
                .thenReturn(Optional.of(mockProject));

        when(projectRepository.save(any(Project.class))).thenReturn(mockProject);

        ProjectDetailDTO expectedDto = new ProjectDetailDTO(
                mockProject.getId(),
                0L,
                "Updated Title",
                ProjectType.TABLE,
                null,
                Collections.emptySet(),
                "New Category",
                null,
                Instant.now(),
                Instant.now(),
                0
        );

        when(projectMapper.toDetailDto(any(Project.class))).thenReturn(expectedDto);

        ProjectDetailDTO result = projectService.updateProject(mockProject.getId(), request);

        assertEquals("Updated Title", result.title());
        assertEquals("New Category", result.category());
        verify(projectRepository, times(1)).save(mockProject);
    }

    @Test
    void shouldPatchContentSuccessfully() {
        ObjectNode newContent = objectMapper.createObjectNode();
        newContent.putArray("alternatives").add("A").add("B");
        newContent.putArray("objectives").add("Cena");
        newContent.putObject("cells")
                .put("0-0", "10")
                .put("0-1", "20");

        PatchContentRequest request = new PatchContentRequest(0L, newContent);

        when(projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(mockProject.getId(), currentUserId))
                .thenReturn(Optional.of(mockProject));

        when(projectRepository.saveAndFlush(mockProject)).thenReturn(mockProject);

        when(projectMapper.toDetailDto(mockProject)).thenReturn(new ProjectDetailDTO(
                mockProject.getId(),
                0L,
                "Test Project",
                ProjectType.TABLE,
                newContent,
                Collections.emptySet(),
                null,
                null,
                null,
                null,
                null
        ));

        ProjectDetailDTO result = projectService.patchContent(mockProject.getId(), request);

        assertEquals("A", mockProject.getContent().get("alternatives").get(0).asText());
        assertEquals("Cena", result.content().get("objectives").get(0).asText());

        verify(projectContentValidator).validate(ProjectType.TABLE, newContent);
        verify(projectRepository, times(1)).saveAndFlush(mockProject);
    }


    @Test
    void shouldDeleteProjectBySettingIsDeletedFlag() {
        when(projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(mockProject.getId(), currentUserId))
                .thenReturn(Optional.of(mockProject));

        projectService.deleteProject(mockProject.getId());

        assertTrue(mockProject.isDeleted(), "Project should be marked as deleted");
        verify(projectRepository, times(1)).save(mockProject);
    }

    @Test
    void shouldRejectPatchContentWhenProjectDoesNotBelongToCurrentUser() {
        UUID otherUsersProjectId = UUID.randomUUID();

        ObjectNode content = objectMapper.createObjectNode();
        content.put("secret", "changed");

        when(projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(otherUsersProjectId, currentUserId))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> projectService.patchContent(
                        otherUsersProjectId,
                        new PatchContentRequest(0L, content)
                )
        );

        verify(projectRepository, never()).saveAndFlush(any(Project.class));
    }

    @Test
    void shouldRejectDeleteWhenProjectDoesNotBelongToCurrentUser() {
        UUID otherUsersProjectId = UUID.randomUUID();

        when(projectRepository.findByIdAndOwnerIdAndIsDeletedFalse(otherUsersProjectId, currentUserId))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> projectService.deleteProject(otherUsersProjectId)
        );

        verify(projectRepository, never()).save(any(Project.class));
    }
}