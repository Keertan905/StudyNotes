package com.studyapp.backend.controller;

import com.studyapp.backend.dto.TutorDto;
import com.studyapp.backend.service.TutorService;
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
@RequestMapping("/api/tutor")
@RequiredArgsConstructor
@Tag(name = "AI Tutor", description = "Conversational academic tutor grounded in student courses")
public class TutorController {

    private final TutorService tutorService;

    @GetMapping("/conversations")
    @Operation(summary = "Get all tutor conversations for the current student")
    public ResponseEntity<List<TutorDto.ConversationResponse>> getConversations(
            Authentication authentication
    ) {
        return ResponseEntity.ok(tutorService.getConversations(authentication.getName()));
    }

    @GetMapping("/conversations/{id}")
    @Operation(summary = "Get conversation by ID with complete message history")
    public ResponseEntity<TutorDto.ConversationResponse> getConversationById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(tutorService.getConversationById(id, authentication.getName()));
    }

    @PostMapping("/conversations")
    @Operation(summary = "Start a new tutor conversation thread")
    public ResponseEntity<TutorDto.ConversationResponse> createConversation(
            @Valid @RequestBody TutorDto.CreateConversationRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tutorService.createConversation(request, authentication.getName()));
    }

    @PostMapping("/conversations/{id}/messages")
    @Operation(summary = "Send a question to the tutor and receive an intelligent response")
    public ResponseEntity<TutorDto.ChatResponse> sendMessage(
            @PathVariable Long id,
            @Valid @RequestBody TutorDto.SendMessageRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(tutorService.sendMessage(id, request, authentication.getName()));
    }

    @DeleteMapping("/conversations/{id}")
    @Operation(summary = "Delete a tutor conversation thread")
    public ResponseEntity<Void> deleteConversation(
            @PathVariable Long id,
            Authentication authentication
    ) {
        tutorService.deleteConversation(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/translate")
    @Operation(summary = "Translate and re-explain concept in a target language (Hindi, Hinglish, Spanish, etc.)")
    public ResponseEntity<TutorDto.TranslateResponse> translateExplanation(
            @Valid @RequestBody TutorDto.TranslateRequest request
    ) {
        return ResponseEntity.ok(tutorService.translateExplanation(request));
    }
}
