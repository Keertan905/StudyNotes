package com.studyapp.backend.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class KnowledgeGapDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopicGapItem {
        private String topicTag;
        private Long subjectId;
        private String subjectName;
        private int totalQuestionsAttempted;
        private int correctAnswers;
        private double accuracyPercentage;
        private String masteryLevel; // WEAK (<60%), MODERATE (60-80%), STRONG (>80%)
        private String decayRisk; // HIGH, MEDIUM, LOW
        private int daysSinceLastPracticed;
        private LocalDateTime lastPracticedAt;
        private String recommendedAction;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SubjectGapSummary {
        private Long subjectId;
        private String subjectName;
        private int topicsCount;
        private double averageAccuracy;
        private int weakTopicsCount;
        private int moderateTopicsCount;
        private int strongTopicsCount;
        private List<TopicGapItem> topics;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class KnowledgeGapResponse {
        private int totalTopicsAssessed;
        private int criticalWeakAreas;
        private int moderateAreas;
        private int masteredAreas;
        private double overallAccuracy;
        private int decayAlertsCount;
        private List<SubjectGapSummary> subjects;
        private List<TopicGapItem> highPriorityGaps;
    }
}
