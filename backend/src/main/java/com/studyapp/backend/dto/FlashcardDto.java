package com.studyapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class FlashcardDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GenerateRequest {
        private Long subjectId;
        private String subjectName;
        private Long unitId;
        private Long topicId;
        private String topic;
        @Builder.Default
        private Integer cardCount = 5;
        private String difficulty; // EASY, MEDIUM, HARD
        private String additionalContext;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GeneratedCardItem {
        private String front;
        private String back;
        private String hint;
        private String difficulty;
        private String topicTag;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateCardRequest {
        private Long subjectId;
        private Long unitId;
        private Long topicId;
        @NotBlank(message = "Card front / question is required")
        private String front;
        @NotBlank(message = "Card back / answer is required")
        private String back;
        private String hint;
        private String difficulty;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BatchSaveRequest {
        private Long subjectId;
        private Long unitId;
        private Long topicId;
        private List<GeneratedCardItem> cards;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReviewCardRequest {
        @NotBlank(message = "Rating is required (AGAIN, HARD, GOOD, EASY)")
        private String rating; // AGAIN, HARD, GOOD, EASY
        private Integer timeSpentSeconds;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CardResponse {
        private Long id;
        private Long subjectId;
        private String subjectName;
        private Long unitId;
        private String unitTitle;
        private Long topicId;
        private String topicName;
        private String front;
        private String back;
        private String hint;
        private String difficulty;
        private Integer intervalDays;
        private Double easeFactor;
        private Integer repetitions;
        private LocalDate nextReviewDate;
        private LocalDateTime lastReviewedAt;
        private Integer reviewCount;
        private Boolean isDue;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FlashcardStatsResponse {
        private long totalCards;
        private long dueTodayCount;
        private long masteredCount; // interval >= 21 days
        private long learningCount; // interval < 21 days
        private long totalReviews;
    }
}
