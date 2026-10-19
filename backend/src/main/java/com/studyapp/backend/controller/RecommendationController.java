package com.studyapp.backend.controller;

import com.studyapp.backend.dto.RecommendationDto;
import com.studyapp.backend.service.RecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
@Tag(name = "Adaptive Recommendations", description = "AI-driven personalized daily study tasks based on knowledge gaps and mistakes")
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping
    @Operation(summary = "Get prioritized adaptive learning recommendations for the student")
    public ResponseEntity<RecommendationDto.RecommendationResponse> getAdaptiveRecommendations(
            Authentication authentication
    ) {
        return ResponseEntity.ok(recommendationService.getAdaptiveRecommendations(authentication.getName()));
    }
}
