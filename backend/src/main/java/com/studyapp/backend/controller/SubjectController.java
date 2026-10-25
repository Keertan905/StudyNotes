package com.studyapp.backend.controller;

import com.studyapp.backend.dto.SubjectDto;
import com.studyapp.backend.service.SubjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
@Tag(name = "Subjects & Syllabus", description = "Subject, unit, topic, and syllabus document extraction endpoints")
public class SubjectController {

    private final SubjectService subjectService;

    @GetMapping
    @Operation(summary = "Get all subjects for current student")
    public ResponseEntity<List<SubjectDto.Response>> getSubjects(
            @RequestParam(defaultValue = "false") boolean includeArchived,
            Authentication authentication
    ) {
        return ResponseEntity.ok(subjectService.getSubjects(authentication.getName(), includeArchived));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get subject details with units and topics")
    public ResponseEntity<SubjectDto.Response> getSubjectById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(subjectService.getSubjectById(id, authentication.getName()));
    }

    @PostMapping
    @Operation(summary = "Create a new subject")
    public ResponseEntity<SubjectDto.Response> createSubject(
            @Valid @RequestBody SubjectDto.Request request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(subjectService.createSubject(request, authentication.getName()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update subject information")
    public ResponseEntity<SubjectDto.Response> updateSubject(
            @PathVariable Long id,
            @Valid @RequestBody SubjectDto.Request request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(subjectService.updateSubject(id, request, authentication.getName()));
    }

    @PatchMapping("/{id}/archive")
    @Operation(summary = "Toggle archive status of a subject")
    public ResponseEntity<Void> toggleArchive(
            @PathVariable Long id,
            Authentication authentication
    ) {
        subjectService.toggleArchive(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a subject and its associated units and topics")
    public ResponseEntity<Void> deleteSubject(
            @PathVariable Long id,
            Authentication authentication
    ) {
        subjectService.deleteSubject(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/units")
    @Operation(summary = "Add a new unit with topics to a subject")
    public ResponseEntity<SubjectDto.Response> addUnit(
            @PathVariable Long id,
            @RequestBody SubjectDto.UnitRequest uReq,
            Authentication authentication
    ) {
        return ResponseEntity.ok(subjectService.addUnit(id, uReq, authentication.getName()));
    }

    @PatchMapping("/topics/{topicId}/toggle")
    @Operation(summary = "Toggle topic completion status")
    public ResponseEntity<Void> toggleTopic(
            @PathVariable Long topicId,
            Authentication authentication
    ) {
        subjectService.toggleTopicCompletion(topicId, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/extract-syllabus", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Extract syllabus units and topics from uploaded PDF or raw text")
    public ResponseEntity<List<SubjectDto.UnitRequest>> extractSyllabus(
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "text", required = false) String text
    ) {
        return ResponseEntity.ok(subjectService.extractSyllabus(file, text));
    }

    @PostMapping(value = "/ai-extract-syllabus", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Extract full subject details, units, and topics using OCR and AI from syllabus image, PDF, or text")
    public ResponseEntity<SubjectDto.SyllabusAiExtractResponse> aiExtractSyllabus(
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "text", required = false) String text,
            Authentication authentication
    ) {
        return ResponseEntity.ok(subjectService.aiExtractSyllabus(file, text, authentication != null ? authentication.getName() : null));
    }

    @PostMapping("/batch-import")
    @Operation(summary = "Batch import confirmed subjects, units, and topics into the database")
    public ResponseEntity<List<SubjectDto.Response>> batchImportSubjects(
            @Valid @RequestBody SubjectDto.BatchImportRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(subjectService.batchImportSubjects(request, authentication.getName()));
    }
}
