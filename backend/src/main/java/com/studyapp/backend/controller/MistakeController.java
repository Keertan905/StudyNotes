package com.studyapp.backend.controller;

import com.studyapp.backend.dto.MistakeDto;
import com.studyapp.backend.service.MistakeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mistakes")
@RequiredArgsConstructor
@Tag(name = "Mistake Intelligence Engine", description = "Student mistake cataloging, AI root-cause analysis, and re-attempt mastery")
public class MistakeController {

    private final MistakeService mistakeService;

    @GetMapping
    @Operation(summary = "Get mistake records for the student, optionally filtered by status and subject")
    public ResponseEntity<List<MistakeDto.MistakeResponse>> getMistakes(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long subjectId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(mistakeService.getMistakes(authentication.getName(), status, subjectId));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get mistake notebook analytics and error categories breakdown")
    public ResponseEntity<MistakeDto.MistakeStatsResponse> getMistakeStats(
            Authentication authentication
    ) {
        return ResponseEntity.ok(mistakeService.getMistakeStats(authentication.getName()));
    }

    @PostMapping("/{id}/retry")
    @Operation(summary = "Re-attempt a mistaken question to test mastery and resolve it")
    public ResponseEntity<MistakeDto.RetryMistakeResponse> retryMistake(
            @PathVariable Long id,
            @Valid @RequestBody MistakeDto.RetryMistakeRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(mistakeService.retryMistake(id, request, authentication.getName()));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Manually update the status of a mistake (UNRESOLVED, REVIEWED, RESOLVED)")
    public ResponseEntity<MistakeDto.MistakeResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody MistakeDto.UpdateStatusRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(mistakeService.updateStatus(id, request, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a mistake record from the notebook")
    public ResponseEntity<Void> deleteMistake(
            @PathVariable Long id,
            Authentication authentication
    ) {
        mistakeService.deleteMistake(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
