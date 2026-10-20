package com.studyapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

public class CodeExplainerDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExplainRequest {
        @NotBlank(message = "Code snippet is required")
        private String code;
        private String language; // "java", "python", "cpp", "c", "javascript", "sql", "go"
        private String detailLevel; // "step_by_step", "concise", "exam_ready"
        private String goal; // "explain_and_debug", "complexity_only", "find_bugs"
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LineExplanation {
        private String lineRange; // e.g. "Lines 1-4"
        private String codeSnippet;
        private String explanation;
        private String role; // "Declaration", "Algorithm Core", "Loop Invariant", "Base Case", "Return Value"
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ComplexityAnalysis {
        private String timeComplexity; // e.g. "O(n log n)"
        private String timeExplanation;
        private String spaceComplexity; // e.g. "O(1)"
        private String spaceExplanation;
        private List<String> bottlenecks;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BugReport {
        private Boolean hasBugs;
        private String bugType; // "Syntax", "Off-by-One", "NullPointer", "ResourceLeak", "InfiniteLoop", "None"
        private String bugDescription;
        private String fixedCode;
        private String fixExplanation;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PracticeChallenge {
        private String title;
        private String prompt;
        private String difficulty; // "Easy", "Medium", "Hard"
        private String hint;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExplainResponse {
        private String title;
        private String language;
        private String highLevelSummary;
        private ComplexityAnalysis complexity;
        private List<LineExplanation> lineExplanations;
        private BugReport bugReport;
        private List<PracticeChallenge> practiceChallenges;
    }
}
