package com.studyapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class MistakeDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MistakeResponse {
        private Long id;
        private Long questionId;
        private String questionText;
        private String questionType;
        private List<String> options;
        private String correctAnswer;
        private String submittedAnswer;
        private String explanation;
        private String topicTag;
        private Long subjectId;
        private String subjectName;
        private String mistakeCategory; // CONCEPTUAL_GAP, MISREAD_QUESTION, CALCULATION_ERROR, MEMORY_LAPSE
        private String aiRootCause;
        private String aiRevisionTip;
        private String status; // UNRESOLVED, REVIEWED, RESOLVED
        private Integer retryCount;
        private LocalDateTime lastAttemptedAt;
        private LocalDateTime resolvedAt;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RetryMistakeRequest {
        @NotBlank(message = "Submitted answer cannot be blank")
        private String submittedAnswer;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RetryMistakeResponse {
        private boolean isCorrect;
        private String feedback;
        private String status;
        private Integer retryCount;
        private LocalDateTime resolvedAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateStatusRequest {
        @NotBlank(message = "Status cannot be blank")
        private String status; // UNRESOLVED, REVIEWED, RESOLVED
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MistakeStatsResponse {
        private long totalMistakes;
        private long unresolvedCount;
        private long resolvedCount;
        private double resolutionRatePercentage;
        private Map<String, Long> categoryBreakdown;
    }
}
