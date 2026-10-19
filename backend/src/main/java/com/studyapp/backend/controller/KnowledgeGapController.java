package com.studyapp.backend.controller;

import com.studyapp.backend.dto.KnowledgeGapDto;
import com.studyapp.backend.service.KnowledgeGapService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/knowledge-gaps")
@RequiredArgsConstructor
@Tag(name = "Knowledge Gap Detector", description = "Topic-wise mastery analysis, weakness identification, and memory decay detection")
public class KnowledgeGapController {

    private final KnowledgeGapService knowledgeGapService;

    @GetMapping
    @Operation(summary = "Get full knowledge gap matrix, topic mastery percentages, and decay warnings")
    public ResponseEntity<KnowledgeGapDto.KnowledgeGapResponse> getKnowledgeGaps(
            Authentication authentication
    ) {
        return ResponseEntity.ok(knowledgeGapService.analyzeGaps(authentication.getName()));
    }
}
