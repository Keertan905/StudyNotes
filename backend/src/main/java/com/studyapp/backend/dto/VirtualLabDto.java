package com.studyapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

public class VirtualLabDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExperimentSummary {
        private String id;
        private String title;
        private String category; // COMPUTER_SCIENCE, NETWORKING, ELECTRONICS, PHYSICS
        private String subject;
        private String difficulty; // Beginner, Intermediate, Advanced
        private String description;
        private String objective;
        private List<String> concepts;
        private String icon;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizQuestion {
        private String id;
        private String question;
        private List<String> options;
        private int correctOptionIndex;
        private String explanation;
        private String relatedConcept;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExperimentDetail {
        private String id;
        private String title;
        private String category;
        private String subject;
        private String difficulty;
        private String description;
        private String objective;
        private List<String> theoryPoints;
        private List<String> formulas;
        private List<String> stepInstructions;
        private List<QuizQuestion> quizQuestions;
        private Map<String, Object> defaultParameters;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizSubmissionRequest {
        @NotBlank(message = "Experiment ID is required")
        private String experimentId;
        private Map<String, Integer> selectedAnswers; // questionId -> selectedOptionIndex
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionResult {
        private String questionId;
        private boolean isCorrect;
        private int selectedIndex;
        private int correctIndex;
        private String explanation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssessmentResult {
        private String experimentId;
        private int totalQuestions;
        private int correctCount;
        private int scorePercentage;
        private boolean passed;
        private int xpAwarded;
        private String feedbackMessage;
        private List<QuestionResult> questionResults;
    }
}
