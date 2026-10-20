package com.studyapp.backend.controller;

import com.studyapp.backend.dto.AdminDto;
import com.studyapp.backend.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin Operations", description = "Endpoints restricted to administrative users with ROLE_ADMIN")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    @Operation(summary = "Get system-wide health and resource metrics (Admin only)")
    public ResponseEntity<AdminDto.SystemStatsResponse> getSystemStats() {
        return ResponseEntity.ok(adminService.getSystemStats());
    }

    @GetMapping("/users")
    @Operation(summary = "List all registered platform users with search filtering (Admin only)")
    public ResponseEntity<AdminDto.UserListResponse> getUsers(
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(adminService.getUsers(search));
    }

    @PatchMapping("/users/{id}/status")
    @Operation(summary = "Enable or disable a user account (Admin only)")
    public ResponseEntity<AdminDto.UserSummary> updateUserStatus(
            @PathVariable Long id,
            @RequestBody AdminDto.UpdateStatusRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(adminService.updateUserStatus(id, request.isEnabled(), authentication.getName()));
    }

    @PatchMapping("/users/{id}/role")
    @Operation(summary = "Promote or demote user role (Admin only)")
    public ResponseEntity<AdminDto.UserSummary> updateUserRole(
            @PathVariable Long id,
            @RequestBody AdminDto.UpdateRoleRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(adminService.updateUserRole(id, request.getRole(), authentication.getName()));
    }
}
