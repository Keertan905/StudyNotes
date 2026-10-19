package com.studyapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class ExamTargetDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        private Long subjectId;
        private String title;
        private LocalDate examDate;
        private Integer targetScore;
        private String priority; // HIGH, MEDIUM, LOW
        private String location;
        private String notes;
        private String color;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long subjectId;
        private String subjectName;
        private String subjectCode;
        private String title;
        private LocalDate examDate;
        private Integer targetScore;
        private String priority;
        private String status;
        private String location;
        private String notes;
        private String color;
        private long daysRemaining;
        private long hoursRemaining;
        private double progressPercent; // Progress towards exam date from creation
        private LocalDateTime createdAt;
    }
}
