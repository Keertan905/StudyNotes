package com.studyapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDto {

    private ReadinessScoreDto readiness;

    // Study Time & Velocity
    private int totalStudyMinutes;
    private int todayStudyMinutes;
    private int thisWeekStudyMinutes;
    private int currentStreakDays;
    private int completedTasksCount;
    private int totalTasksCount;

    // Daily Study History (Past 7 or 14 days)
    private List<DailyStudyPoint> studyTimeHistory;

    // Quiz Diagnostic Evolution
    private int totalQuizzesTaken;
    private double overallAverageScore;
    private List<QuizPerformancePoint> recentQuizPerformances;

    // Flashcard SM-2 Retention Health
    private int totalFlashcards;
    private int cardsMastered;
    private int cardsOverdue;
    private Map<String, Integer> ratingDistribution; // Again, Hard, Good, Easy

    // Mistake Intelligence Velocity
    private int totalMistakesLogged;
    private int mistakesMastered;
    private int unresolvedMistakes;
    private double mistakeResolutionRate;
    private Map<String, Integer> mistakesByCategory; // Conceptual, Calculation, Misread, Factual

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyStudyPoint {
        private LocalDate date;
        private String dayOfWeek;
        private int studyMinutes;
        private int sessionsCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizPerformancePoint {
        private Long attemptId;
        private String quizTitle;
        private double score;
        private double percentage;
        private boolean passed;
        private String completedDate;
    }
}
