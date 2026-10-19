package com.studyapp.backend.controller;

import com.studyapp.backend.dto.FlashcardDto;
import com.studyapp.backend.service.FlashcardService;
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
@RequestMapping("/api/flashcards")
@RequiredArgsConstructor
@Tag(name = "Flashcards & Spaced Repetition", description = "AI Flashcard Generation, Review Sessions, and SM-2 Scheduling")
public class FlashcardController {

    private final FlashcardService flashcardService;

    @PostMapping("/generate")
    @Operation(summary = "Generate high-yield active recall flashcards via AI")
    public ResponseEntity<List<FlashcardDto.GeneratedCardItem>> generateCards(
            @RequestBody FlashcardDto.GenerateRequest request
    ) {
        return ResponseEntity.ok(flashcardService.generateCards(request));
    }

    @PostMapping
    @Operation(summary = "Create an individual flashcard manually")
    public ResponseEntity<FlashcardDto.CardResponse> createCard(
            @Valid @RequestBody FlashcardDto.CreateCardRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(flashcardService.createCard(request, authentication.getName()));
    }

    @PostMapping("/batch")
    @Operation(summary = "Batch save generated flashcards into user's study deck")
    public ResponseEntity<List<FlashcardDto.CardResponse>> batchSaveCards(
            @RequestBody FlashcardDto.BatchSaveRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(flashcardService.batchSaveCards(request, authentication.getName()));
    }

    @GetMapping
    @Operation(summary = "List all flashcards for current student, optionally filtered by subject")
    public ResponseEntity<List<FlashcardDto.CardResponse>> getCards(
            @RequestParam(required = false) Long subjectId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(flashcardService.getCards(authentication.getName(), subjectId));
    }

    @GetMapping("/due")
    @Operation(summary = "Get all flashcards due for review today based on SM-2 scheduling")
    public ResponseEntity<List<FlashcardDto.CardResponse>> getDueCards(
            Authentication authentication
    ) {
        return ResponseEntity.ok(flashcardService.getDueCards(authentication.getName()));
    }

    @PostMapping("/{id}/review")
    @Operation(summary = "Submit a flashcard review rating (AGAIN, HARD, GOOD, EASY) to calculate next review date")
    public ResponseEntity<FlashcardDto.CardResponse> reviewCard(
            @PathVariable Long id,
            @Valid @RequestBody FlashcardDto.ReviewCardRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(flashcardService.reviewCard(id, request, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a flashcard")
    public ResponseEntity<Void> deleteCard(
            @PathVariable Long id,
            Authentication authentication
    ) {
        flashcardService.deleteCard(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    @Operation(summary = "Get flashcard deck statistics and mastery distribution")
    public ResponseEntity<FlashcardDto.FlashcardStatsResponse> getStats(
            Authentication authentication
    ) {
        return ResponseEntity.ok(flashcardService.getStats(authentication.getName()));
    }
}
