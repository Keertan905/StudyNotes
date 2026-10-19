package com.studyapp.backend.controller;

import com.studyapp.backend.dto.ExamTargetDto;
import com.studyapp.backend.dto.StudyPlanItemDto;
import com.studyapp.backend.service.PlannerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/planner")
@RequiredArgsConstructor
@Tag(name = "Exam Countdown & Study Planner", description = "Target exam countdowns, timetable scheduling, and AI-driven daily study plans")
public class PlannerController {

    private final PlannerService plannerService;

    // --- Exams / Countdowns ---

    @GetMapping("/exams")
    @Operation(summary = "Get all target exams and countdown timers for the current student")
    public ResponseEntity<List<ExamTargetDto.Response>> getExams(Authentication authentication) {
        return ResponseEntity.ok(plannerService.getExams(authentication.getName()));
    }

    @PostMapping("/exams")
    @Operation(summary = "Create a new target exam with countdown date, priority, and target score")
    public ResponseEntity<ExamTargetDto.Response> createExam(
            @RequestBody ExamTargetDto.Request request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(plannerService.createExam(authentication.getName(), request));
    }

    @PutMapping("/exams/{id}")
    @Operation(summary = "Update an existing target exam")
    public ResponseEntity<ExamTargetDto.Response> updateExam(
            @PathVariable Long id,
            @RequestBody ExamTargetDto.Request request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(plannerService.updateExam(authentication.getName(), id, request));
    }

    @DeleteMapping("/exams/{id}")
    @Operation(summary = "Delete an exam countdown target")
    public ResponseEntity<Void> deleteExam(@PathVariable Long id, Authentication authentication) {
        plannerService.deleteExam(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/exams/{id}/toggle")
    @Operation(summary = "Toggle exam status between UPCOMING and COMPLETED")
    public ResponseEntity<ExamTargetDto.Response> toggleExamStatus(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(plannerService.toggleExamStatus(authentication.getName(), id));
    }

    // --- Daily & Weekly Plan ---

    @GetMapping("/daily")
    @Operation(summary = "Get daily study plan blocks for a specific date")
    public ResponseEntity<StudyPlanItemDto.DailyPlanResponse> getDailyPlan(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Authentication authentication
    ) {
        return ResponseEntity.ok(plannerService.getDailyPlan(authentication.getName(), date));
    }

    @GetMapping("/weekly")
    @Operation(summary = "Get study plan items across a date range")
    public ResponseEntity<List<StudyPlanItemDto.Response>> getWeeklyPlan(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication
    ) {
        return ResponseEntity.ok(plannerService.getWeeklyPlan(authentication.getName(), startDate, endDate));
    }

    @PostMapping("/items")
    @Operation(summary = "Create a custom study block in the timetable")
    public ResponseEntity<StudyPlanItemDto.Response> createPlanItem(
            @RequestBody StudyPlanItemDto.Request request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(plannerService.createPlanItem(authentication.getName(), request));
    }

    @PutMapping("/items/{id}")
    @Operation(summary = "Update a study plan item")
    public ResponseEntity<StudyPlanItemDto.Response> updatePlanItem(
            @PathVariable Long id,
            @RequestBody StudyPlanItemDto.Request request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(plannerService.updatePlanItem(authentication.getName(), id, request));
    }

    @PatchMapping("/items/{id}/toggle")
    @Operation(summary = "Toggle completion status of a study plan block")
    public ResponseEntity<StudyPlanItemDto.Response> togglePlanItemCompleted(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(plannerService.togglePlanItemCompleted(authentication.getName(), id));
    }

    @DeleteMapping("/items/{id}")
    @Operation(summary = "Delete a study plan item from timetable")
    public ResponseEntity<Void> deletePlanItem(@PathVariable Long id, Authentication authentication) {
        plannerService.deletePlanItem(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/generate")
    @Operation(summary = "Generate an AI-powered smart study plan based on upcoming exams, weak topics, and SM-2 flashcards")
    public ResponseEntity<StudyPlanItemDto.DailyPlanResponse> generatePlan(
            @RequestBody StudyPlanItemDto.GeneratePlanRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(plannerService.generateAutoPlan(authentication.getName(), request));
    }
}
