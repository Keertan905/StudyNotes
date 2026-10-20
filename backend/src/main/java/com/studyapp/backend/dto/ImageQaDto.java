package com.studyapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

public class ImageQaDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SolveRequest {
        @NotBlank(message = "Image data (base64 or URL) is required")
        private String imageBase64;
        private String imageName;
        private String questionPrompt; // optional specific instruction, e.g. "Explain step 3 in detail"
        private String subjectName;
        private String detailLevel; // "step_by_step", "concise", "exam_ready"
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SolutionStep {
        private Integer stepNumber;
        private String title;
        private String formula;
        private String explanation;
        private String intermediateResult;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PracticeQuestion {
        private String question;
        private String answerHint;
        private String difficulty;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ImageQaResponse {
        private String title;
        private String subject;
        private String extractedProblemText;
        private List<String> givenValues;
        private List<SolutionStep> solutionSteps;
        private String finalAnswer;
        private List<String> keyFormulas;
        private List<String> commonPitfalls;
        private List<PracticeQuestion> relatedPracticeQuestions;
    }
}
