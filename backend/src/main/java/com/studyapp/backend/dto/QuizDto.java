package com.studyapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class QuizDto {

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
        private String quizType; // PRACTICE, MOCK_EXAM, DIAGNOSTIC
        private String difficulty; // EASY, MEDIUM, HARD
        @Builder.Default
        private Integer questionCount = 5;
        private List<String> questionTypes; // MCQ, TRUE_FALSE, SHORT_ANSWER
        private Integer timeLimitMinutes;
        private String additionalContext;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SaveQuizRequest {
        private Long subjectId;
        private Long unitId;
        private Long topicId;
        @NotBlank(message = "Quiz title is required")
        private String title;
        private String description;
        private String quizType;
        private String difficulty;
        private Integer timeLimitMinutes;
        private Double passingPercentage;
        private List<QuestionItem> questions;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuestionItem {
        private Long id;
        private String questionType;
        private String questionText;
        private List<String> options;
        private String correctAnswer;
        private String explanation;
        private Integer marks;
        private String topicTag;
        private String rubricJson;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuizResponse {
        private Long id;
        private Long subjectId;
        private String subjectName;
        private Long unitId;
        private String unitTitle;
        private Long topicId;
        private String topicName;
        private String title;
        private String description;
        private String quizType;
        private String difficulty;
        private Integer timeLimitMinutes;
        private Double passingPercentage;
        private Integer totalMarks;
        private Integer questionCount;
        private List<QuestionItem> questions;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StartAttemptResponse {
        private Long attemptId;
        private Long quizId;
        private String quizTitle;
        private String subjectName;
        private Integer timeLimitMinutes;
        private Integer totalQuestions;
        private Integer totalMarks;
        private LocalDateTime startTime;
        private List<ExamQuestion> questions;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExamQuestion {
        private Long id;
        private String questionType;
        private String questionText;
        private List<String> options;
        private Integer marks;
        private String topicTag;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SubmitAttemptRequest {
        private Integer timeSpentSeconds;
        // Map of questionId -> student's submitted answer
        private Map<Long, String> answers;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AttemptSummaryResponse {
        private Long attemptId;
        private Long quizId;
        private String quizTitle;
        private String subjectName;
        private Double scoreObtained;
        private Integer totalMarks;
        private Double percentage;
        private Boolean passed;
        private Integer timeSpentSeconds;
        private String status;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AttemptDetailResponse {
        private Long attemptId;
        private Long quizId;
        private String quizTitle;
        private String subjectName;
        private Double scoreObtained;
        private Integer totalMarks;
        private Double percentage;
        private Boolean passed;
        private Integer timeSpentSeconds;
        private String status;
        private String feedback;
        private Map<String, TopicScore> topicPerformance;
        private List<GradedQuestionItem> questions;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopicScore {
        private double score;
        private double total;
        private double percentage;
        private String status; // MASTERED, NEEDS_REVIEW, WEAK
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GradedQuestionItem {
        private Long questionId;
        private String questionType;
        private String questionText;
        private List<String> options;
        private String correctAnswer;
        private String submittedAnswer;
        private Boolean isCorrect;
        private Double marksAwarded;
        private Integer maxMarks;
        private String explanation;
        private String evaluationFeedback;
        private String topicTag;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuizStatsResponse {
        private long totalQuizzes;
        private long totalAttempts;
        private double averagePercentage;
        private long passedAttempts;
    }
}
