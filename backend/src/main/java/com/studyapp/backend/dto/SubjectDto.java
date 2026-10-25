package com.studyapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

public class SubjectDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {
        @NotBlank(message = "Subject name is required")
        private String name;
        private String code;
        private Integer semester;
        private LocalDate examDate;
        private String color;
        private List<UnitRequest> units;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UnitRequest {
        private Integer unitNumber;
        private String title;
        private String description;
        private List<String> topics;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private String name;
        private String code;
        private Integer semester;
        private LocalDate examDate;
        private String color;
        private boolean archived;
        private int totalUnits;
        private int completedUnits;
        private int totalTopics;
        private int completedTopics;
        private List<UnitResponse> units;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UnitResponse {
        private Long id;
        private Integer unitNumber;
        private String title;
        private String description;
        private boolean completed;
        private List<TopicResponse> topics;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopicResponse {
        private Long id;
        private String name;
        private boolean completed;
        private String importance;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExtractedSubject {
        private String name;
        private String code;
        private Integer semester;
        private String color;
        private String subjectType; // e.g. "CORE / THEORY", "ELECTIVE", "PRACTICAL / LAB"
        private boolean needsReview;
        private String reviewReason;
        private Integer orderIndex;
        private List<UnitRequest> units;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SyllabusAiExtractResponse {
        private List<ExtractedSubject> subjects;
        private String extractionSource; // "IMAGE_OCR", "PDF_DOCUMENT", "RAW_TEXT"
        private String rawNotes;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BatchImportRequest {
        @jakarta.validation.constraints.NotEmpty(message = "At least one subject is required for import")
        private List<Request> subjects;
    }
}
