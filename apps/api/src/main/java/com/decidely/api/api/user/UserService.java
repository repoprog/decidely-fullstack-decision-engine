package com.decidely.api.api.user;

import com.decidely.api.api.user.dto.ChangePasswordRequest;
import com.decidely.api.api.user.dto.UpdateProfileRequest;
import com.decidely.api.api.user.dto.UserProfileDTO;
import com.decidely.api.domain.user.User;
import com.decidely.api.domain.user.UserRepository;
import com.decidely.api.exception.ResourceNotFoundException;
import com.decidely.api.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserProfileDTO getUserProfile(UUID userId) {
        return toProfileDto(findUserById(userId));
    }

    @Transactional
    public UserProfileDTO updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = findUserById(userId);
        String normalizedEmail = normalizeEmail(request.email());

        user.setName(normalizeName(request.name()));

        if (!user.getEmail().equals(normalizedEmail)) {
            userRepository.findByEmail(normalizedEmail)
                    .filter(existingUser -> !existingUser.getId().equals(userId))
                    .ifPresent(existingUser -> {
                        throw new ValidationException("Email is already in use");
                    });

            user.setEmail(normalizedEmail);
        }

        User savedUser = userRepository.save(user);
        return toProfileDto(savedUser);
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = findUserById(userId);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid current password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    private User findUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private UserProfileDTO toProfileDto(User user) {
        return new UserProfileDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
        );
    }

    private String normalizeName(String name) {
        return name == null ? null : name.trim();
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}