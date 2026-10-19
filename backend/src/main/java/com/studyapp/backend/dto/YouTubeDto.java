package com.studyapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.List;

public class YouTubeDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchRequest {
        private String query;
        private String subjectName;
        private String sortBy; // BEST_MATCH, MOST_VIEWED, NEWEST, TRENDING_ESTIMATE
        private String durationFilter; // ALL, SHORT, MEDIUM, LONG
        private String language; // ALL, en, hi, es
        private String difficulty; // ALL, BEGINNER, INTERMEDIATE, ADVANCED, EXAM_CRASH_COURSE
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VideoItemDto {
        private String id;
        private String title;
        private String description;
        private String channelTitle;
        private String channelId;
        private String thumbnailUrl;
        private String publishedAt;
        private String formattedPublishedDate;
        private String duration;
        private Long durationSeconds;
        private Long views;
        private String formattedViews;
        private Long likes;
        private String formattedLikes;
        private String videoUrl;
        private String recommendationReason;
        @Builder.Default
        private List<String> tags = Collections.emptyList();
        private String difficultyBadge;
        private Double compositeScore;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchResponse {
        private String query;
        private int totalResults;
        private List<VideoItemDto> videos;
        private boolean apiKeyConfigured;
        private boolean quotaExceeded;
        private String errorMessage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusResponse {
        private boolean configured;
        private String message;
    }
}
