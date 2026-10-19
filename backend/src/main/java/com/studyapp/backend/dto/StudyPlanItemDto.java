package com.studyapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class StudyPlanItemDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        private Long examTargetId;
        private Long subjectId;
        private Long topicId;
        private LocalDate planDate;
        private String timeSlot;
        private String title;
        private String activityType; // FLASHCARD_REVIEW, PRACTICE_QUIZ, CONCEPT_STUDY, MISTAKE_CORRECTION, MOCK_EXAM
        private Integer estimatedMinutes;
        private String priority;
        private String actionRoute;
        private String aiReasoning;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long examTargetId;
        private String examTargetTitle;
        private Long subjectId;
        private String subjectName;
        private Long topicId;
        private String topicTitle;
        private LocalDate planDate;
        private String timeSlot;
        private String title;
        private String activityType;
        private Integer estimatedMinutes;
        private String priority;
        private Boolean completed;
        private String actionRoute;
        private String aiReasoning;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyPlanResponse {
        private LocalDate date;
        private int totalItems;
        private int completedItems;
        private int totalEstimatedMinutes;
        private int completedMinutes;
        private double completionPercentage;
        private List<Response> items;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GeneratePlanRequest {
        private LocalDate startDate;
        private Integer daysCount; // e.g. 1 (today), 3, or 7
        private Integer dailyAvailableHours; // e.g. 2, 3, 4, 5
        private List<Long> examTargetIds;
        private Boolean prioritizeWeakTopics;
        private Boolean includeMistakes;
        private Boolean includeFlashcards;
        private Boolean addRestIntervals;
    }
}
