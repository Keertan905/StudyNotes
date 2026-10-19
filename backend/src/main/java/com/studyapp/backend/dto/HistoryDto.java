package com.studyapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class HistoryDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityEvent {
        private String id;
        private String type; // QUIZ_ATTEMPT, FLASHCARD_REVIEW, FOCUS_SESSION, NOTE_GENERATED, DOCUMENT_UPLOAD
        private String title;
        private String description;
        private String subjectName;
        private LocalDateTime timestamp;
        private String formattedTime;
        private Map<String, Object> metadata;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistorySummary {
        private int totalActivities;
        private int totalStudyMinutes;
        private int quizzesCompleted;
        private int flashcardsReviewed;
        private int notesGenerated;
        private int documentsUploaded;
        private List<ActivityEvent> events;
    }
}
