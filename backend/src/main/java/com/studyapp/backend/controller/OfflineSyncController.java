package com.studyapp.backend.controller;

import com.studyapp.backend.dto.OfflineSyncDto;
import com.studyapp.backend.repository.FlashcardRepository;
import com.studyapp.backend.repository.NoteRepository;
import com.studyapp.backend.repository.StudyDocumentRepository;
import com.studyapp.backend.repository.UserRepository;
import com.studyapp.backend.service.OfflineSyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/offline")
@RequiredArgsConstructor
@Tag(name = "Offline Study Mode & Sync", description = "Synchronize local offline study sessions, flashcard reviews, and check download status")
public class OfflineSyncController {

    private final OfflineSyncService offlineSyncService;
    private final NoteRepository noteRepository;
    private final FlashcardRepository flashcardRepository;
    private final StudyDocumentRepository studyDocumentRepository;
    private final UserRepository userRepository;

    @PostMapping("/sync")
    @Operation(summary = "Synchronize batched offline study sessions and flashcard reviews with idempotency and XP awards")
    public ResponseEntity<OfflineSyncDto.SyncResponse> syncOfflineData(
            @Valid @RequestBody OfflineSyncDto.SyncRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(offlineSyncService.syncOfflineData(request, authentication.getName()));
    }

    @GetMapping("/manifest")
    @Operation(summary = "Get total counts of notes, flashcards, and documents eligible for offline download")
    public ResponseEntity<OfflineSyncDto.OfflineDownloadManifest> getManifest(Authentication authentication) {
        var user = userRepository.findByEmail(authentication.getName().toLowerCase().trim()).orElseThrow();
        int notesCount = noteRepository.findByUserIdOrderByUpdatedAtDesc(user.getId()).size();
        int flashcardsCount = (int) flashcardRepository.countByUserId(user.getId());
        int docsCount = studyDocumentRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).size();

        return ResponseEntity.ok(OfflineSyncDto.OfflineDownloadManifest.builder()
                .totalNotes(notesCount)
                .totalFlashcards(flashcardsCount)
                .totalDocuments(docsCount)
                .generatedAt(LocalDateTime.now())
                .build());
    }
}
