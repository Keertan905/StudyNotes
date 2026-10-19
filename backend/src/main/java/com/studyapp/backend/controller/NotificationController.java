package com.studyapp.backend.controller;

import com.studyapp.backend.dto.NotificationDto;
import com.studyapp.backend.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Student academic notifications, exam alerts, and revision reminders")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Get all student notifications")
    public ResponseEntity<List<NotificationDto.Response>> getNotifications(Authentication authentication) {
        return ResponseEntity.ok(notificationService.getNotifications(authentication.getName()));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get count of unread notifications")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        return ResponseEntity.ok(Map.of("unreadCount", notificationService.getUnreadCount(authentication.getName())));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<NotificationDto.Response> markAsRead(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(notificationService.markAsRead(authentication.getName(), id));
    }

    @PostMapping("/read-all")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        notificationService.markAllAsRead(authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a notification")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long id,
            Authentication authentication
    ) {
        notificationService.deleteNotification(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/clear-all")
    @Operation(summary = "Clear all notifications")
    public ResponseEntity<Void> clearAll(Authentication authentication) {
        notificationService.clearAll(authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
