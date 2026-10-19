package com.studyapp.backend.dto;

import lombok.*;

import java.util.List;

public class RecommendationDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecommendationItem {
        private String id;
        private String type; // QUIZ_PRACTICE, FLASHCARD_REVIEW, MISTAKE_RETRY, ASK_TUTOR, READ_NOTES
        private String priority; // CRITICAL, RECOMMENDED, OPTIONAL
        private String title;
        private String description;
        private String reason;
        private Long subjectId;
        private String subjectName;
        private String topicTag;
        private String actionUrl;
        private String buttonText;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecommendationResponse {
        private String studentHeadline;
        private String aiAdvisory;
        private List<RecommendationItem> items;
    }
}
