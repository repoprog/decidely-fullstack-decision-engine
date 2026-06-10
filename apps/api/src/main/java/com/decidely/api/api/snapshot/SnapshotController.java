package com.decidely.api.api.snapshot;

import com.decidely.api.api.project.dto.ProjectDetailDTO;
import com.decidely.api.api.snapshot.dto.CreateSnapshotRequest;
import com.decidely.api.api.snapshot.dto.RestoreSnapshotRequest;
import com.decidely.api.api.snapshot.dto.SnapshotDetailDTO;
import com.decidely.api.api.snapshot.dto.SnapshotSummaryDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects/{id}/snapshots")
@RequiredArgsConstructor
public class SnapshotController {

    private final SnapshotService snapshotService;

    @GetMapping
    @PreAuthorize("@projectSecurity.isOwner(#id, authentication)")
    public ResponseEntity<List<SnapshotSummaryDTO>> getSnapshots(
            @PathVariable
            UUID id
    ) {
        return ResponseEntity.ok(snapshotService.getSnapshots(id));
    }

    @PostMapping
    @PreAuthorize("@projectSecurity.isOwner(#id, authentication)")
    public ResponseEntity<SnapshotSummaryDTO> createSnapshot(
            @PathVariable
            UUID id,
            @Valid
            @RequestBody
            CreateSnapshotRequest request
    ) {
        SnapshotSummaryDTO snapshot = snapshotService.createSnapshot(id, request);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{snapId}")
                .buildAndExpand(snapshot.id())
                .toUri();

        return ResponseEntity.created(location).body(snapshot);
    }

    @GetMapping("/{snapId}")
    @PreAuthorize("@projectSecurity.isOwner(#id, authentication)")
    public ResponseEntity<SnapshotDetailDTO> getSnapshot(
            @PathVariable
            UUID id,
            @PathVariable
            UUID snapId
    ) {
        return ResponseEntity.ok(snapshotService.getSnapshot(id, snapId));
    }

    @PostMapping("/{snapId}/restore")
    @PreAuthorize("@projectSecurity.isOwner(#id, authentication)")
    public ResponseEntity<ProjectDetailDTO> restoreSnapshot(
            @PathVariable
            UUID id,
            @PathVariable
            UUID snapId,
            @Valid
            @RequestBody
            RestoreSnapshotRequest request
    ) {
        return ResponseEntity.ok(snapshotService.restoreSnapshot(id, snapId, request));
    }
}