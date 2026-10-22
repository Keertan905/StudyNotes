package com.studyapp.backend.controller;

import com.studyapp.backend.dto.GamificationDto;
import com.studyapp.backend.service.GamificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gamification")
@RequiredArgsConstructor
@Tag(name = "Gamification & Rewards", description = "Student XP points, levels, achievements, streaks, and activity history")
public class GamificationController {

    private final GamificationService gamificationService;

    @GetMapping("/profile")
    @Operation(summary = "Get current student's gamification profile, XP, level, and streaks")
    public ResponseEntity<GamificationDto.ProfileResponse> getProfile(Authentication authentication) {
        return ResponseEntity.ok(gamificationService.getProfile(authentication.getName()));
    }

    @GetMapping("/achievements")
    @Operation(summary = "Get full catalog of achievements, unlocked status, and unlock timestamps")
    public ResponseEntity<List<GamificationDto.AchievementItem>> getAchievements(Authentication authentication) {
        return ResponseEntity.ok(gamificationService.getAllAchievements(authentication.getName()));
    }

    @GetMapping("/activity-heatmap")
    @Operation(summary = "Get daily activity counts and XP for the past 60 days for heatmap calendar")
    public ResponseEntity<List<GamificationDto.ActivityDayItem>> getActivityHeatmap(
            @RequestParam(defaultValue = "60") int days,
            Authentication authentication
    ) {
        return ResponseEntity.ok(gamificationService.getActivityHeatmap(authentication.getName(), days));
    }

    @GetMapping("/leaderboard")
    @Operation(summary = "Get optional student leaderboard ranked by XP (respects student privacy)")
    public ResponseEntity<List<GamificationDto.LeaderboardEntry>> getLeaderboard(Authentication authentication) {
        return ResponseEntity.ok(gamificationService.getLeaderboard(authentication.getName()));
    }

    @GetMapping("/history")
    @Operation(summary = "Get recent XP transaction history and audit records")
    public ResponseEntity<List<GamificationDto.XpHistoryItem>> getXpHistory(Authentication authentication) {
        return ResponseEntity.ok(gamificationService.getXpHistory(authentication.getName()));
    }

    @PutMapping("/privacy")
    @Operation(summary = "Update leaderboard privacy preferences (opt-in or opt-out)")
    public ResponseEntity<GamificationDto.ProfileResponse> updatePrivacy(
            @RequestBody GamificationDto.PrivacyRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(gamificationService.updatePrivacy(authentication.getName(), request.getLeaderboardOptIn()));
    }
}
