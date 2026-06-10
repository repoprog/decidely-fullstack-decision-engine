package com.decidely.api.api.user;

import com.decidely.api.api.user.dto.ChangePasswordRequest;
import com.decidely.api.api.user.dto.UpdateProfileRequest;
import com.decidely.api.api.user.dto.UserProfileDTO;
import com.decidely.api.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/me")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<UserProfileDTO> getCurrentUser(
            @AuthenticationPrincipal
            CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(userService.getUserProfile(userDetails.getId()));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileDTO> updateProfile(
            @Valid
            @RequestBody
            UpdateProfileRequest request,
            @AuthenticationPrincipal
            CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(userService.updateProfile(userDetails.getId(), request));
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(
            @Valid
            @RequestBody
            ChangePasswordRequest request,
            @AuthenticationPrincipal
            CustomUserDetails userDetails
    ) {
        userService.changePassword(userDetails.getId(), request);
        return ResponseEntity.noContent().build();
    }
}
