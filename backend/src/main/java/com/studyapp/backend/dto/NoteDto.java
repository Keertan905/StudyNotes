package com.studyapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

public class NoteDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GenerateRequest {
        @NotBlank(message = "Subject is required")
        private String subjectName;
        private Long subjectId;
        private Long unitId;
        private Long topicId;
        @NotBlank(message = "Topic or title is required")
        private String topic;
        private String academicLevel; // e.g. Undergraduate, Masters, Diploma
        private String explanationStyle; // e.g. Exam-Oriented, Intuitive, Rigorous
        private String detailLevel; // e.g. Quick Summary, Comprehensive, Bullet Points
        private String additionalContext; // optional text from uploaded material or notes
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SaveRequest {
        private Long subjectId;
        private Long unitId;
        private Long topicId;
        @NotBlank(message = "Title is required")
        private String title;
        @NotBlank(message = "Content is required")
        private String content;
        private String academicLevel;
        private String explanationStyle;
        private String detailLevel;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long subjectId;
        private String subjectName;
        private Long unitId;
        private String unitTitle;
        private Long topicId;
        private String topicName;
        private String title;
        private String content;
        private String academicLevel;
        private String explanationStyle;
        private String detailLevel;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
