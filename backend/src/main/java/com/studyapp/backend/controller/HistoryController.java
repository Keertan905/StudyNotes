package com.studyapp.backend.controller;

import com.studyapp.backend.dto.HistoryDto;
import com.studyapp.backend.service.HistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
@Tag(name = "Study History & Logs", description = "Consolidated academic history feed tracking quizzes, flashcards, pomodoro sessions, and notes")
public class HistoryController {

    private final HistoryService historyService;

    @GetMapping
    @Operation(summary = "Get chronological student activity history with search and type filters")
    public ResponseEntity<HistoryDto.HistorySummary> getHistory(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            Authentication authentication
    ) {
        return ResponseEntity.ok(historyService.getActivityHistory(authentication.getName(), type, search));
    }
}
