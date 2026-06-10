package com.decidely.api.api.project;

import com.decidely.api.api.project.dto.CreateProjectRequest;
import com.decidely.api.api.project.dto.PatchContentRequest;
import com.decidely.api.api.project.dto.ProjectDetailDTO;
import com.decidely.api.api.project.dto.ProjectSummaryDTO;
import com.decidely.api.api.project.dto.UpdateProjectRequest;
import com.decidely.api.domain.project.ProjectType;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor

public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<Page<ProjectSummaryDTO>> getProjects(
            @RequestParam(required = false)
            ProjectType type,
            @RequestParam(required = false)
            String category,
            @RequestParam(required = false)
            String search,
            @PageableDefault(sort = "updatedAt", direction = Sort.Direction.DESC, size = 20)
            Pageable pageable
    ) {
        return ResponseEntity.ok(projectService.getProjects(type, category, search, pageable));
    }

    @PostMapping
    public ResponseEntity<ProjectDetailDTO> createProject(
            @Valid
            @RequestBody
            CreateProjectRequest request) {
        ProjectDetailDTO project = projectService.createProject(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(project.id())
                .toUri();
        return ResponseEntity.created(location).body(project);
    }

    @GetMapping("/{id}")
    @PreAuthorize("@projectSecurity.isOwner(#id, authentication)")
    public ResponseEntity<ProjectDetailDTO> getProject(
            @PathVariable
            UUID id) {
        return ResponseEntity.ok(projectService.getProject(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@projectSecurity.isOwner(#id, authentication)")
    public ResponseEntity<ProjectDetailDTO> updateProject(
            @PathVariable
            UUID id,
            @Valid
            @RequestBody
            UpdateProjectRequest request
    ) {
        return ResponseEntity.ok(projectService.updateProject(id, request));
    }

    @PatchMapping("/{id}/content")
    @PreAuthorize("@projectSecurity.isOwner(#id, authentication)")
    public ResponseEntity<ProjectDetailDTO> patchContent(
            @PathVariable
            UUID id,
            @Valid
            @RequestBody
            PatchContentRequest request
    ) {
        return ResponseEntity.ok(projectService.patchContent(id, request));
    }


    @DeleteMapping("/{id}")
    @PreAuthorize("@projectSecurity.isOwner(#id, authentication)")
    public ResponseEntity<Void> deleteProject(
            @PathVariable
            UUID id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }
}
