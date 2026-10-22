package com.studyapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class OfflineSyncDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SyncRequest {
        @Builder.Default
        private List<OfflineStudySessionItem> studySessions = new ArrayList<>();

        @Builder.Default
        private List<OfflineFlashcardReviewItem> flashcardReviews = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OfflineStudySessionItem {
        @NotBlank
        private String syncId; // Client-side generated UUID
        private Long subjectId;
        private Long topicId;
        private String title;
        private String sessionType;
        private Integer actualDurationMinutes;
        private Boolean completed;
        private String notes;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OfflineFlashcardReviewItem {
        @NotBlank
        private String syncId; // Client-side generated UUID
        @NotNull
        private Long flashcardId;
        @NotBlank
        private String rating; // AGAIN, HARD, GOOD, EASY
        private Integer timeSpentSeconds;
        private LocalDateTime reviewedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SyncResponse {
        private int syncedSessionsCount;
        private int syncedReviewsCount;
        private int totalXpEarned;
        private List<GamificationDto.AchievementItem> newAchievements;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OfflineDownloadManifest {
        private int totalNotes;
        private int totalFlashcards;
        private int totalDocuments;
        private LocalDateTime generatedAt;
    }
}
