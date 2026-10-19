package com.studyapp.backend.controller;

import com.studyapp.backend.dto.StudySessionDto;
import com.studyapp.backend.service.StudySessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/study-sessions")
@RequiredArgsConstructor
@Tag(name = "Study Timer & Focus Sessions", description = "Log Pomodoro timer focus sessions and track study analytics")
public class StudySessionController {

    private final StudySessionService studySessionService;

    @PostMapping
    @Operation(summary = "Log a completed study/Pomodoro focus session")
    public ResponseEntity<StudySessionDto.SessionResponse> logSession(
            @Valid @RequestBody StudySessionDto.LogSessionRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(studySessionService.logSession(request, authentication.getName()));
    }

    @GetMapping
    @Operation(summary = "Get all recorded study sessions for student")
    public ResponseEntity<List<StudySessionDto.SessionResponse>> getSessions(
            Authentication authentication
    ) {
        return ResponseEntity.ok(studySessionService.getSessions(authentication.getName()));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get daily and weekly study minutes and streak statistics")
    public ResponseEntity<StudySessionDto.SessionStatsResponse> getStats(
            Authentication authentication
    ) {
        return ResponseEntity.ok(studySessionService.getStats(authentication.getName()));
    }
}
