package com.studyapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadinessScoreDto {

    private int overallReadiness; // 0 - 100
    private String readinessStatus; // CRITICAL, DEVELOPING, READY, EXEMPLARY
    private String statusDescription;

    // Weighted Components
    private int syllabusCoverageScore;   // 25%
    private int quizAccuracyScore;       // 30%
    private int flashcardMasteryScore;   // 20%
    private int mistakeResolutionScore;  // 15%
    private int consistencyScore;        // 10%

    // Nearest Exam
    private Long nearestExamId;
    private String nearestExamTitle;
    private LocalDate nearestExamDate;
    private Integer daysToNearestExam;
    private Integer targetScore;

    // Breakdown by subject
    private List<SubjectReadinessDto> subjectBreakdowns;

    // AI Actionable Insights
    private List<String> keyRecommendations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubjectReadinessDto {
        private Long subjectId;
        private String subjectName;
        private String subjectCode;
        private int readinessScore;
        private String status;
        private int totalTopics;
        private int completedTopics;
        private double syllabusCoveragePercent;
        private double quizAccuracyPercent;
        private int totalFlashcards;
        private int masteredFlashcards;
        private int unresolvedMistakes;
        private Integer daysToExam;
    }
}
