package com.studyapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class GamificationDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileResponse {
        private Integer totalXp;
        private Integer currentLevel;
        private String levelTitle;
        private Integer currentLevelBaseXp;
        private Integer nextLevelTargetXp;
        private Integer progressToNextLevelPct;
        private Integer currentStreak;
        private Integer longestStreak;
        private LocalDate lastActiveDate;
        private Boolean leaderboardOptIn;
        private Long achievementsCount;
        private List<AchievementItem> recentAchievements;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AchievementItem {
        private Long id;
        private String badgeKey;
        private String title;
        private String description;
        private String icon;
        private String category;
        private Integer xpReward;
        private LocalDateTime unlockedAt;
        private boolean isUnlocked;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityDayItem {
        private LocalDate date;
        private Long activityCount;
        private Long totalXp;
        private Integer intensity; // 0 (none) to 4 (high)
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LeaderboardEntry {
        private Integer rank;
        private Long userId;
        private String name;
        private String college;
        private String branch;
        private Integer totalXp;
        private Integer currentLevel;
        private String levelTitle;
        private Integer currentStreak;
        private boolean isCurrentUser;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class XpHistoryItem {
        private Long id;
        private String activityType;
        private Integer xpAmount;
        private String description;
        private LocalDate activityDate;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrivacyRequest {
        private Boolean leaderboardOptIn;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RewardEventResponse {
        private Integer xpEarned;
        private Integer newTotalXp;
        private Integer currentLevel;
        private boolean levelUpOccurred;
        private List<AchievementItem> unlockedAchievements;
    }
}
