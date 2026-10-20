package com.studyapp.backend.dto;

import com.studyapp.backend.model.User;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class AdminDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SystemStatsResponse {
        private long totalUsers;
        private long totalStudents;
        private long totalAdmins;
        private long totalSubjects;
        private long totalDocuments;
        private long totalQuizzes;
        private long totalMindMaps;
        private long totalFlashcards;
        private String systemStatus;
        private String apiProvider;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserSummary {
        private Long id;
        private String name;
        private String email;
        private User.Role role;
        private String college;
        private String branch;
        private Integer semester;
        private boolean enabled;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserListResponse {
        private List<UserSummary> users;
        private long totalCount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRoleRequest {
        private User.Role role;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateStatusRequest {
        private boolean enabled;
    }
}
