package com.studyapp.backend.controller;

import com.studyapp.backend.dto.StudyTaskDto;
import com.studyapp.backend.service.StudyTaskService;
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
@RequestMapping("/api/study-tasks")
@RequiredArgsConstructor
@Tag(name = "Study Tasks", description = "Create, track, and complete study tasks and goals")
public class StudyTaskController {

    private final StudyTaskService studyTaskService;

    @PostMapping
    @Operation(summary = "Create a new study task")
    public ResponseEntity<StudyTaskDto.TaskResponse> createTask(
            @Valid @RequestBody StudyTaskDto.CreateTaskRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(studyTaskService.createTask(request, authentication.getName()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update task details or toggle completion status")
    public ResponseEntity<StudyTaskDto.TaskResponse> updateTask(
            @PathVariable Long id,
            @RequestBody StudyTaskDto.UpdateTaskRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(studyTaskService.updateTask(id, request, authentication.getName()));
    }

    @GetMapping
    @Operation(summary = "Get study tasks, optionally filtered by subject")
    public ResponseEntity<List<StudyTaskDto.TaskResponse>> getTasks(
            @RequestParam(required = false) Long subjectId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(studyTaskService.getTasks(authentication.getName(), subjectId));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a study task")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long id,
            Authentication authentication
    ) {
        studyTaskService.deleteTask(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
