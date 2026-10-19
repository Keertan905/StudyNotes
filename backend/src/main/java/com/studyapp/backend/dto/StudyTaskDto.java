package com.studyapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class StudyTaskDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateTaskRequest {
        private Long subjectId;
        private Long topicId;
        @NotBlank(message = "Task title is required")
        private String title;
        private LocalDate dueDate;
        private String priority; // LOW, MEDIUM, HIGH
        private Integer estimatedMinutes;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateTaskRequest {
        private String title;
        private LocalDate dueDate;
        private String priority;
        private String status; // TODO, IN_PROGRESS, COMPLETED
        private Integer estimatedMinutes;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaskResponse {
        private Long id;
        private Long subjectId;
        private String subjectName;
        private Long topicId;
        private String topicName;
        private String title;
        private LocalDate dueDate;
        private String priority;
        private String status;
        private Integer estimatedMinutes;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
