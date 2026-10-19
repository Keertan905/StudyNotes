package com.studyapp.backend.controller;

import com.studyapp.backend.dto.AnalyticsDto;
import com.studyapp.backend.dto.ReadinessScoreDto;
import com.studyapp.backend.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Readiness & Progress Analytics", description = "Multi-factor exam readiness scoring, subject health breakdown, and study velocity trends")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/readiness")
    @Operation(summary = "Get current student holistic exam readiness score and weighted component metrics")
    public ResponseEntity<ReadinessScoreDto> getReadiness(Authentication authentication) {
        return ResponseEntity.ok(analyticsService.getReadinessOverview(authentication.getName()));
    }

    @GetMapping("/overview")
    @Operation(summary = "Get comprehensive student study analytics, focus trends, and diagnostic progression")
    public ResponseEntity<AnalyticsDto> getOverview(Authentication authentication) {
        return ResponseEntity.ok(analyticsService.getComprehensiveAnalytics(authentication.getName()));
    }
}
