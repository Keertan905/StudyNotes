package com.studyapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class ProblemSolverDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SolveRequest {
        @NotBlank(message = "Problem statement or code is required")
        private String problemText;
        private String subject; // Mathematics, Java/OOP, DSA, Networks, Operating Systems, Physics, etc.
        private String targetLanguage; // English, Hindi, Hinglish, Spanish, French, German
        private Boolean groundWithDocs; // Ground using user's uploaded syllabus documents
        private Long subjectId;
        private String difficulty; // Beginner, Intermediate, Advanced
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SolutionStep {
        private int stepNumber;
        private String title;
        private String formulaOrCode;
        private String explanation;
        private String whyExplanation; // Crucial pedagogical rationale
        private String keyTip;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SolveResponse {
        private String problemSummary;
        private String classifiedCategory;
        private String difficulty;
        private List<String> prerequisiteConcepts;
        private List<SolutionStep> steps;
        private String intuitiveExplanation; // Explain Like I'm 5 / Intuitive breakdown
        private List<String> commonMistakes;
        private String finalAnswer;
        private String verificationCheck;
        private boolean isGrounded;
        private double groundingConfidence;
        private List<RagCitationDto> citations;
        private List<String> suggestedFollowUps;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FollowUpRequest {
        @NotBlank(message = "Original problem is required")
        private String originalProblem;
        @NotBlank(message = "Follow up question is required")
        private String followUpQuestion;
        private Integer stepIndex;
        private String previousFinalAnswer;
        private String subject;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FollowUpResponse {
        private String answer;
        private String relatedStepSummary;
        private List<String> furtherQuestions;
    }
}
