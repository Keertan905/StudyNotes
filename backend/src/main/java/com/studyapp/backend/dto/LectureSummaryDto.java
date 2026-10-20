package com.studyapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class LectureSummaryDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SummarizeRequest {
        @NotBlank(message = "Title is required")
        private String title;
        private String subjectName;
        private Long subjectId;
        private String speakerOrCourse;
        @NotBlank(message = "Transcript or lecture notes text is required")
        private String transcript;
        private String focusArea; // "general", "exam_revision", "formula_deep_dive", "quick_overview"
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SaveRequest {
        private Long subjectId;
        @NotBlank(message = "Title is required")
        private String title;
        private String speakerOrCourse;
        @NotBlank(message = "Transcript is required")
        private String transcript;
        @NotBlank(message = "Summary JSON is required")
        private String summaryJson;
        private Integer estimatedDurationMinutes;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Chapter {
        private String timestamp; // e.g. "00:00 - 08:30" or "Part 1"
        private String title;
        private String summary;
        private List<String> bulletPoints;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class KeyTakeaway {
        private String concept;
        private String explanation;
        private String importance; // "High", "Critical", "Moderate"
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuizQuestion {
        private String question;
        private List<String> options;
        private Integer correctIndex;
        private String explanation;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SummaryPayload {
        private String title;
        private String executiveSummary;
        private List<KeyTakeaway> keyTakeaways;
        private List<Chapter> chapters;
        private List<String> formulasAndLaws;
        private List<QuizQuestion> revisionQuestions;
        private Integer estimatedDurationMinutes;
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
        private String title;
        private String speakerOrCourse;
        private String transcript;
        private String summaryJson;
        private Integer estimatedDurationMinutes;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
