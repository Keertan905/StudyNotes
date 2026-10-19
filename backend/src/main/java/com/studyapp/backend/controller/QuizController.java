package com.studyapp.backend.controller;

import com.studyapp.backend.dto.QuizDto;
import com.studyapp.backend.service.QuizService;
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
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
@Tag(name = "Quiz & Examination System", description = "AI Question Generation, Quizzes, Attempts, and Grading")
public class QuizController {

    private final QuizService quizService;

    @PostMapping("/generate")
    @Operation(summary = "Generate question items via AI or educational fallback")
    public ResponseEntity<List<QuizDto.QuestionItem>> generateQuestions(
            @RequestBody QuizDto.GenerateRequest request
    ) {
        return ResponseEntity.ok(quizService.generateQuestions(request));
    }

    @PostMapping
    @Operation(summary = "Create and save a new quiz with its questions")
    public ResponseEntity<QuizDto.QuizResponse> createQuiz(
            @Valid @RequestBody QuizDto.SaveQuizRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(quizService.createQuiz(request, authentication.getName()));
    }

    @GetMapping
    @Operation(summary = "List all quizzes for current student, optionally filtered by subject")
    public ResponseEntity<List<QuizDto.QuizResponse>> getQuizzes(
            @RequestParam(required = false) Long subjectId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(quizService.getQuizzes(authentication.getName(), subjectId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get quiz details with questions")
    public ResponseEntity<QuizDto.QuizResponse> getQuizById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(quizService.getQuizById(id, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a quiz")
    public ResponseEntity<Void> deleteQuiz(
            @PathVariable Long id,
            Authentication authentication
    ) {
        quizService.deleteQuiz(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/start")
    @Operation(summary = "Start a quiz attempt (returns exam questions without answers)")
    public ResponseEntity<QuizDto.StartAttemptResponse> startAttempt(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(quizService.startAttempt(id, authentication.getName()));
    }

    @PostMapping("/attempts/{attemptId}/submit")
    @Operation(summary = "Submit attempt answers for grading and topic breakdown")
    public ResponseEntity<QuizDto.AttemptDetailResponse> submitAttempt(
            @PathVariable Long attemptId,
            @RequestBody QuizDto.SubmitAttemptRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(quizService.submitAttempt(attemptId, request, authentication.getName()));
    }

    @GetMapping("/attempts/{attemptId}")
    @Operation(summary = "Get detailed results, correct answers, and feedback for an attempt")
    public ResponseEntity<QuizDto.AttemptDetailResponse> getAttemptDetails(
            @PathVariable Long attemptId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(quizService.getAttemptDetails(attemptId, authentication.getName()));
    }

    @GetMapping("/history")
    @Operation(summary = "Get list of student's past quiz attempts")
    public ResponseEntity<List<QuizDto.AttemptSummaryResponse>> getQuizHistory(
            Authentication authentication
    ) {
        return ResponseEntity.ok(quizService.getQuizHistory(authentication.getName()));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get overall quiz statistics for student")
    public ResponseEntity<QuizDto.QuizStatsResponse> getQuizStats(
            Authentication authentication
    ) {
        return ResponseEntity.ok(quizService.getQuizStats(authentication.getName()));
    }
}
