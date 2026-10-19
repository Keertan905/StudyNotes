package com.studyapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

public class StudySessionDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LogSessionRequest {
        private Long subjectId;
        private Long topicId;
        @NotBlank(message = "Session title is required")
        private String title;
        private String sessionType; // POMODORO, SHORT_BREAK, LONG_BREAK, CUSTOM
        private Integer targetDurationMinutes;
        private Integer actualDurationMinutes;
        private Boolean completed;
        private String notes;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SessionResponse {
        private Long id;
        private Long subjectId;
        private String subjectName;
        private Long topicId;
        private String topicName;
        private String title;
        private String sessionType;
        private Integer targetDurationMinutes;
        private Integer actualDurationMinutes;
        private Boolean completed;
        private String notes;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SessionStatsResponse {
        private int minutesStudiedToday;
        private int minutesStudiedThisWeek;
        private long completedSessionsCount;
        private int currentStreakDays;
    }
}
