package com.studyapp.backend.controller;

import com.studyapp.backend.dto.LectureSummaryDto;
import com.studyapp.backend.service.LectureSummaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lectures")
@RequiredArgsConstructor
@Tag(name = "AI Lecture Summarizer", description = "Synthesize transcripts and lecture notes into structured study packs")
public class LectureSummaryController {

    private final LectureSummaryService lectureSummaryService;

    @PostMapping("/summarize")
    @Operation(summary = "Summarize lecture transcript into chapters, takeaways, and quiz")
    public ResponseEntity<LectureSummaryDto.SummaryPayload> summarizeLecture(
            @Valid @RequestBody LectureSummaryDto.SummarizeRequest request
    ) {
        return ResponseEntity.ok(lectureSummaryService.summarizeLecture(request));
    }

    @PostMapping
    @Operation(summary = "Save synthesized lecture summary")
    public ResponseEntity<LectureSummaryDto.Response> saveSummary(
            @Valid @RequestBody LectureSummaryDto.SaveRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(lectureSummaryService.saveSummary(request, authentication.getName()));
    }

    @GetMapping
    @Operation(summary = "List saved lecture summaries for current student")
    public ResponseEntity<List<LectureSummaryDto.Response>> getSummaries(
            @RequestParam(required = false) Long subjectId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(lectureSummaryService.getSummaries(authentication.getName(), subjectId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get single lecture summary by ID")
    public ResponseEntity<LectureSummaryDto.Response> getSummaryById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(lectureSummaryService.getSummaryById(id, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete lecture summary")
    public ResponseEntity<Map<String, String>> deleteSummary(
            @PathVariable Long id,
            Authentication authentication
    ) {
        lectureSummaryService.deleteSummary(id, authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Lecture summary deleted successfully"));
    }
}
