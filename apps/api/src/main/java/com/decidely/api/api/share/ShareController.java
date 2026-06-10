package com.decidely.api.api.share;

import com.decidely.api.api.share.dto.CreateShareRequest;
import com.decidely.api.api.share.dto.ShareResponse;
import com.decidely.api.api.share.dto.SharedProjectDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor

public class ShareController {

    private final ShareService shareService;

    @PostMapping("/{id}/share")
    @PreAuthorize("@projectSecurity.isOwner(#id, authentication)")
    public ResponseEntity<ShareResponse> createShare(
            @PathVariable
            UUID id,
            @Valid
            @RequestBody
            CreateShareRequest request
    ) {
        return ResponseEntity.ok(shareService.createShare(id, request));
    }

    @GetMapping("/shared/{token}")
    public ResponseEntity<SharedProjectDTO> getSharedProject(
            @PathVariable
            String token) {
        return ResponseEntity.ok(shareService.getSharedProject(token));
    }

    @DeleteMapping("/{id}/share/{shareId}")
    @PreAuthorize("@projectSecurity.isOwner(#id, authentication)")
    public ResponseEntity<Void> deleteShare(
            @PathVariable
            UUID id,
            @PathVariable
            UUID shareId
    ) {
        shareService.deleteShare(id, shareId);
        return ResponseEntity.noContent().build();
    }
}