package com.studyapp.backend.controller;

import com.studyapp.backend.dto.NoteDto;
import com.studyapp.backend.service.NoteService;
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
@RequestMapping("/api/notes")
@RequiredArgsConstructor
@Tag(name = "AI Notes Generator", description = "Generate, save, and manage comprehensive revision notes")
public class NoteController {

    private final NoteService noteService;

    @PostMapping("/generate")
    @Operation(summary = "Generate comprehensive AI revision notes from subject/topic")
    public ResponseEntity<Map<String, String>> generateNote(
            @Valid @RequestBody NoteDto.GenerateRequest request
    ) {
        String markdown = noteService.generateNoteContent(request);
        return ResponseEntity.ok(Map.of("content", markdown));
    }

    @PostMapping
    @Operation(summary = "Save or create a note in the database")
    public ResponseEntity<NoteDto.Response> saveNote(
            @Valid @RequestBody NoteDto.SaveRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(noteService.saveNote(request, authentication.getName()));
    }

    @GetMapping
    @Operation(summary = "Get notes for current student, optionally filtered by subject")
    public ResponseEntity<List<NoteDto.Response>> getNotes(
            @RequestParam(required = false) Long subjectId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(noteService.getNotes(authentication.getName(), subjectId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get note by ID")
    public ResponseEntity<NoteDto.Response> getNoteById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(noteService.getNoteById(id, authentication.getName()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing note")
    public ResponseEntity<NoteDto.Response> updateNote(
            @PathVariable Long id,
            @Valid @RequestBody NoteDto.SaveRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(noteService.updateNote(id, request, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a note")
    public ResponseEntity<Void> deleteNote(
            @PathVariable Long id,
            Authentication authentication
    ) {
        noteService.deleteNote(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
