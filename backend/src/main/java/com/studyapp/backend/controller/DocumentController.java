package com.studyapp.backend.controller;

import com.studyapp.backend.dto.DocumentDto;
import com.studyapp.backend.service.DocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Tag(name = "Document Management & Grounding", description = "PDF and text document upload, semantic chunking, and RAG knowledge base")
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload an academic PDF or text document for RAG indexing and grounding")
    public ResponseEntity<DocumentDto.Response> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "subjectId", required = false) Long subjectId,
            @RequestParam(value = "title", required = false) String title,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(documentService.uploadFile(authentication.getName(), file, subjectId, title));
    }

    @PostMapping("/text")
    @Operation(summary = "Upload raw syllabus notes or Markdown text for RAG indexing")
    public ResponseEntity<DocumentDto.Response> uploadText(
            @RequestBody DocumentDto.UploadTextRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(documentService.uploadText(authentication.getName(), request));
    }

    @GetMapping
    @Operation(summary = "Get all uploaded study documents, optionally filtered by subject")
    public ResponseEntity<List<DocumentDto.Response>> getDocuments(
            @RequestParam(required = false) Long subjectId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(documentService.getDocuments(authentication.getName(), subjectId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get document details including semantic chunks and AI summary")
    public ResponseEntity<DocumentDto.DocumentDetailResponse> getDocumentDetails(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(documentService.getDocumentDetails(authentication.getName(), id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an uploaded study document and its indexed semantic chunks")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable Long id,
            Authentication authentication
    ) {
        documentService.deleteDocument(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
