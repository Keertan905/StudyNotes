package com.studyapp.backend.controller;

import com.studyapp.backend.dto.UserDto;
import com.studyapp.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Tag(name = "User Profile & Security", description = "Student academic profile and password settings")
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    @Operation(summary = "Get authenticated student's profile details")
    public ResponseEntity<UserDto.ProfileResponse> getProfile(Authentication authentication) {
        return ResponseEntity.ok(userService.getProfile(authentication.getName()));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update student academic profile details")
    public ResponseEntity<UserDto.ProfileResponse> updateProfile(
            @Valid @RequestBody UserDto.UpdateProfileRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(userService.updateProfile(authentication.getName(), request));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password with current password verification")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody UserDto.ChangePasswordRequest request,
            Authentication authentication
    ) {
        userService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
