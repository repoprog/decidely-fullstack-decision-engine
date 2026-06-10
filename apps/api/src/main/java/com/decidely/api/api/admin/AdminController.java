package com.decidely.api.api.admin;

import com.decidely.api.api.admin.dto.AdminShareDTO;
import com.decidely.api.api.admin.dto.SystemStatsDTO;
import com.decidely.api.api.admin.dto.UserSummaryDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.SortDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<SystemStatsDTO> getStats() {
        return ResponseEntity.ok(adminService.getSystemStats());
    }

    @GetMapping("/users")
    public ResponseEntity<Page<UserSummaryDTO>> getUsers(
            @PageableDefault(size = 10)
            @SortDefault.SortDefaults(
                    {@SortDefault(
                            sort = "role",
                            direction = Sort.Direction.ASC
                    ), @SortDefault(
                            sort = "createdAt",
                            direction = Sort.Direction.DESC
                    )}
            )
            Pageable pageable) {
        return ResponseEntity.ok(adminService.getUsers(pageable));
    }

    @PatchMapping("/users/{id}/toggle-active")
    public ResponseEntity<Void> toggleUserActive(
            @PathVariable
            UUID id) {
        adminService.toggleUserActive(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/shares")
    public ResponseEntity<Page<AdminShareDTO>> getActiveShares(
            @PageableDefault(
                    size = 10,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable) {
        return ResponseEntity.ok(adminService.getActiveShares(pageable));
    }

    @DeleteMapping("/shares/{id}")
    public ResponseEntity<Void> revokeShare(
            @PathVariable
            UUID id) {
        adminService.revokeShare(id);
        return ResponseEntity.noContent().build();
    }
}