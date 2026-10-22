package com.studyapp.backend.service;

import com.studyapp.backend.dto.GamificationDto;
import com.studyapp.backend.exception.ResourceNotFoundException;
import com.studyapp.backend.model.*;
import com.studyapp.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GamificationService {

    private final UserGamificationRepository userGamificationRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final XpTransactionRepository xpTransactionRepository;
    private final UserRepository userRepository;
    private final StudySessionRepository studySessionRepository;
    private final FlashcardReviewRepository flashcardReviewRepository;

    private static final int[] LEVEL_THRESHOLDS = {
            0,     // Level 1: 0 - 149
            150,   // Level 2: 150 - 399
            400,   // Level 3: 400 - 799
            800,   // Level 4: 800 - 1399
            1400,  // Level 5: 1400 - 2199
            2200,  // Level 6: 2200 - 3199
            3200,  // Level 7: 3200 - 4499
            4500,  // Level 8: 4500 - 5999
            6000,  // Level 9: 6000 - 7999
            8000   // Level 10: 8000+
    };

    private static final String[] LEVEL_TITLES = {
            "Novice Scholar",
            "Apprentice Learner",
            "Dedicated Student",
            "Knowledge Seeker",
            "Academic Specialist",
            "Master Thinker",
            "Polymath",
            "Research Fellow",
            "Dean's Scholar",
            "Grand Polymath"
    };

    // Master catalog of standard badges
    private static final List<BadgeDefinition> MASTER_BADGES = List.of(
            new BadgeDefinition("FIRST_STEP", "First Focus", "Logged your first focused study session", "Target", "FOCUS", 50),
            new BadgeDefinition("POMODORO_PRO", "Focus Champion", "Completed 5 focused study sessions", "Flame", "FOCUS", 100),
            new BadgeDefinition("CENTURION", "100-Minute Scholar", "Accumulated over 100 minutes of deep study time", "Clock", "FOCUS", 150),
            new BadgeDefinition("FLASH_MASTER", "Flash Master", "Reviewed 10 active recall flashcards", "Sparkles", "FLASHCARD", 75),
            new BadgeDefinition("QUIZ_WHIZ", "Quiz Whiz", "Passed an exam or practice quiz with 80% or higher", "HelpCircle", "QUIZ", 100),
            new BadgeDefinition("PERFECT_SCORE", "Perfectionist", "Scored a perfect 100% on any practice quiz", "Award", "QUIZ", 200),
            new BadgeDefinition("STREAK_3", "Consistent Mind", "Maintained a 3-day active study streak", "Flame", "STREAK", 100),
            new BadgeDefinition("STREAK_7", "Unstoppable", "Maintained a 7-day active study streak", "Zap", "STREAK", 250),
            new BadgeDefinition("OFFLINE_SCHOLAR", "Offline Scholar", "Studied or synced offline study materials", "WifiOff", "OFFLINE", 100),
            new BadgeDefinition("KNOWLEDGE_HUNTER", "Curator", "Earned over 500 total XP in learning activities", "BookOpen", "MILESTONE", 150)
    );

    private record BadgeDefinition(String key, String title, String description, String icon, String category, int xp) {}

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    public UserGamification getOrCreateGamification(User user) {
        return userGamificationRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserGamification g = UserGamification.builder()
                            .user(user)
                            .totalXp(0)
                            .currentLevel(1)
                            .currentStreak(0)
                            .longestStreak(0)
                            .lastActiveDate(null)
                            .leaderboardOptIn(true)
                            .build();
                    return userGamificationRepository.save(g);
                });
    }

    @Transactional
    public GamificationDto.ProfileResponse getProfile(String email) {
        User user = getUserByEmail(email);
        UserGamification g = getOrCreateGamification(user);
        refreshStreakIfNeeded(g);

        int level = calculateLevel(g.getTotalXp());
        g.setCurrentLevel(level);

        int base = getLevelBaseXp(level);
        int target = getNextLevelTargetXp(level);
        int progressPct = target > base ? Math.min(100, (int) Math.round(((double) (g.getTotalXp() - base) / (target - base)) * 100.0)) : 100;

        List<UserAchievement> achievements = userAchievementRepository.findByUserIdOrderByUnlockedAtDesc(user.getId());
        List<GamificationDto.AchievementItem> recent = achievements.stream().limit(5).map(this::mapToAchievementItem).collect(Collectors.toList());

        return GamificationDto.ProfileResponse.builder()
                .totalXp(g.getTotalXp())
                .currentLevel(level)
                .levelTitle(getLevelTitle(level))
                .currentLevelBaseXp(base)
                .nextLevelTargetXp(target)
                .progressToNextLevelPct(progressPct)
                .currentStreak(g.getCurrentStreak())
                .longestStreak(g.getLongestStreak())
                .lastActiveDate(g.getLastActiveDate())
                .leaderboardOptIn(g.getLeaderboardOptIn())
                .achievementsCount((long) achievements.size())
                .recentAchievements(recent)
                .build();
    }

    @Transactional
    public List<GamificationDto.AchievementItem> getAllAchievements(String email) {
        User user = getUserByEmail(email);
        Map<String, UserAchievement> unlockedMap = userAchievementRepository.findByUserIdOrderByUnlockedAtDesc(user.getId())
                .stream()
                .collect(Collectors.toMap(UserAchievement::getBadgeKey, a -> a, (k1, k2) -> k1));

        List<GamificationDto.AchievementItem> list = new ArrayList<>();
        for (BadgeDefinition b : MASTER_BADGES) {
            UserAchievement unlocked = unlockedMap.get(b.key());
            list.add(GamificationDto.AchievementItem.builder()
                    .id(unlocked != null ? unlocked.getId() : null)
                    .badgeKey(b.key())
                    .title(b.title())
                    .description(b.description())
                    .icon(b.icon())
                    .category(b.category())
                    .xpReward(b.xp())
                    .unlockedAt(unlocked != null ? unlocked.getUnlockedAt() : null)
                    .isUnlocked(unlocked != null)
                    .build());
        }
        return list;
    }

    @Transactional
    public List<GamificationDto.ActivityDayItem> getActivityHeatmap(String email, int daysBack) {
        User user = getUserByEmail(email);
        LocalDate start = LocalDate.now().minusDays(daysBack > 0 ? daysBack : 60);
        List<Object[]> rows = xpTransactionRepository.getActivityHeatmap(user.getId(), start);

        Map<LocalDate, long[]> map = new HashMap<>(); // date -> [count, totalXp]
        for (Object[] r : rows) {
            LocalDate d = (LocalDate) r[0];
            long count = ((Number) r[1]).longValue();
            long totalXp = ((Number) r[2]).longValue();
            map.put(d, new long[]{count, totalXp});
        }

        List<GamificationDto.ActivityDayItem> result = new ArrayList<>();
        LocalDate cur = start;
        LocalDate today = LocalDate.now();
        while (!cur.isAfter(today)) {
            long[] val = map.getOrDefault(cur, new long[]{0L, 0L});
            long c = val[0];
            long xp = val[1];
            int intensity = 0;
            if (c > 0) {
                if (c == 1) intensity = 1;
                else if (c <= 3) intensity = 2;
                else if (c <= 5) intensity = 3;
                else intensity = 4;
            }

            result.add(GamificationDto.ActivityDayItem.builder()
                    .date(cur)
                    .activityCount(c)
                    .totalXp(xp)
                    .intensity(intensity)
                    .build());
            cur = cur.plusDays(1);
        }
        return result;
    }

    @Transactional
    public List<GamificationDto.LeaderboardEntry> getLeaderboard(String email) {
        User currentUser = getUserByEmail(email);
        List<UserGamification> topList = userGamificationRepository.findTop50Leaderboard();

        List<GamificationDto.LeaderboardEntry> entries = new ArrayList<>();
        int rank = 1;
        for (UserGamification g : topList) {
            User u = g.getUser();
            boolean isCur = u.getId().equals(currentUser.getId());
            int lvl = calculateLevel(g.getTotalXp());

            entries.add(GamificationDto.LeaderboardEntry.builder()
                    .rank(rank++)
                    .userId(u.getId())
                    .name(u.getName())
                    .college(u.getCollege())
                    .branch(u.getBranch())
                    .totalXp(g.getTotalXp())
                    .currentLevel(lvl)
                    .levelTitle(getLevelTitle(lvl))
                    .currentStreak(g.getCurrentStreak())
                    .isCurrentUser(isCur)
                    .build());
        }
        return entries;
    }

    @Transactional
    public List<GamificationDto.XpHistoryItem> getXpHistory(String email) {
        User user = getUserByEmail(email);
        return xpTransactionRepository.findTop20ByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(t -> GamificationDto.XpHistoryItem.builder()
                        .id(t.getId())
                        .activityType(t.getActivityType())
                        .xpAmount(t.getXpAmount())
                        .description(t.getDescription())
                        .activityDate(t.getActivityDate())
                        .createdAt(t.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public GamificationDto.ProfileResponse updatePrivacy(String email, Boolean optIn) {
        User user = getUserByEmail(email);
        UserGamification g = getOrCreateGamification(user);
        g.setLeaderboardOptIn(optIn != null ? optIn : true);
        userGamificationRepository.save(g);
        return getProfile(email);
    }

    // Award XP for study focus sessions
    @Transactional
    public GamificationDto.RewardEventResponse awardStudySessionXp(User user, StudySession session, String syncId) {
        String sourceId = syncId != null ? syncId : ("session-" + session.getId());
        int mins = session.getActualDurationMinutes() != null ? session.getActualDurationMinutes() : 25;
        // Formula: 10 base XP + 1 XP per minute studied, capped at 120 XP
        int xp = Math.min(120, 10 + Math.max(1, mins));

        String desc = "Completed " + mins + " min study session: " + session.getTitle();
        LocalDate activityDate = session.getEndTime() != null ? session.getEndTime().toLocalDate() : LocalDate.now();

        return awardXpInternal(user, "STUDY_SESSION", sourceId, xp, desc, activityDate);
    }

    // Award XP for quiz attempt completion
    @Transactional
    public GamificationDto.RewardEventResponse awardQuizAttemptXp(User user, QuizAttempt attempt) {
        String sourceId = "attempt-" + attempt.getId();
        double pct = attempt.getPercentage() != null ? attempt.getPercentage() : 0.0;
        int xp = (int) Math.round(30.0 + (pct * 0.5)); // 30 to 80 XP
        if (pct >= 99.9) {
            xp += 20; // Perfect score bonus
        }
        String desc = String.format("Completed quiz attempt (%.0f%% score)", pct);
        LocalDate activityDate = attempt.getEndTime() != null ? attempt.getEndTime().toLocalDate() : LocalDate.now();

        GamificationDto.RewardEventResponse res = awardXpInternal(user, "QUIZ_COMPLETION", sourceId, xp, desc, activityDate);

        // Check quiz badges
        if (pct >= 80.0) {
            unlockBadgeIfEligible(user, "QUIZ_WHIZ", res);
        }
        if (pct >= 99.9) {
            unlockBadgeIfEligible(user, "PERFECT_SCORE", res);
        }

        return res;
    }

    // Award XP for flashcard review
    @Transactional
    public GamificationDto.RewardEventResponse awardFlashcardReviewXp(User user, FlashcardReview review, String syncId) {
        String sourceId = syncId != null ? syncId : ("review-" + review.getId());
        LocalDate today = LocalDate.now();

        // Enforce anti-spam cap: maximum 150 XP per day from flashcard reviews
        Integer dailyFlashcardXp = xpTransactionRepository.getDailyXpForType(user.getId(), today, "FLASHCARD_REVIEW");
        if (dailyFlashcardXp != null && dailyFlashcardXp >= 150) {
            log.info("User {} reached daily flashcard review XP cap (150 XP)", user.getEmail());
            return null;
        }

        int xp = 5;
        String desc = "Flashcard review (" + review.getRating() + ")";
        return awardXpInternal(user, "FLASHCARD_REVIEW", sourceId, xp, desc, today);
    }

    // Award XP for offline download or sync
    @Transactional
    public GamificationDto.RewardEventResponse awardOfflineSyncXp(User user, int sessionsSynced, int reviewsSynced, String syncBatchId) {
        String sourceId = "sync-batch-" + syncBatchId;
        int xp = (sessionsSynced * 35) + (reviewsSynced * 5);
        if (xp <= 0) return null;

        String desc = String.format("Offline sync (%d sessions, %d reviews)", sessionsSynced, reviewsSynced);
        GamificationDto.RewardEventResponse res = awardXpInternal(user, "OFFLINE_SYNC", sourceId, xp, desc, LocalDate.now());
        unlockBadgeIfEligible(user, "OFFLINE_SCHOLAR", res);
        return res;
    }

    // Award XP for Virtual Lab simulation completion
    @Transactional
    public GamificationDto.RewardEventResponse awardVirtualLabXp(User user, String experimentId, int scorePct, String experimentTitle) {
        String sourceId = "lab-" + experimentId + "-" + LocalDate.now();
        int xp = (int) Math.round(40.0 + (scorePct * 0.4)); // 40 to 80 XP
        if (scorePct >= 99.9) {
            xp += 20; // bonus for 100%
        }
        String desc = "Completed Virtual Lab: " + experimentTitle + " (" + scorePct + "% score)";
        return awardXpInternal(user, "VIRTUAL_LAB", sourceId, xp, desc, LocalDate.now());
    }

    // Unified, strictly deduplicated internal XP award engine
    private GamificationDto.RewardEventResponse awardXpInternal(
            User user, String activityType, String sourceId, int xpAmount, String description, LocalDate activityDate
    ) {
        if (sourceId != null && xpTransactionRepository.existsByUserIdAndActivityTypeAndSourceId(user.getId(), activityType, sourceId)) {
            log.warn("Deduplicated XP award rejected for user {} [activity={}, sourceId={}]", user.getId(), activityType, sourceId);
            return null;
        }

        XpTransaction tx = XpTransaction.builder()
                .user(user)
                .activityType(activityType)
                .sourceId(sourceId)
                .xpAmount(xpAmount)
                .description(description)
                .activityDate(activityDate != null ? activityDate : LocalDate.now())
                .build();
        xpTransactionRepository.save(tx);

        UserGamification g = getOrCreateGamification(user);
        int oldLevel = calculateLevel(g.getTotalXp());
        g.setTotalXp(g.getTotalXp() + xpAmount);
        int newLevel = calculateLevel(g.getTotalXp());
        g.setCurrentLevel(newLevel);

        updateStreak(g, activityDate != null ? activityDate : LocalDate.now());
        userGamificationRepository.save(g);

        GamificationDto.RewardEventResponse response = GamificationDto.RewardEventResponse.builder()
                .xpEarned(xpAmount)
                .newTotalXp(g.getTotalXp())
                .currentLevel(newLevel)
                .levelUpOccurred(newLevel > oldLevel)
                .unlockedAchievements(new ArrayList<>())
                .build();

        checkMilestoneAchievements(user, g, response);

        return response;
    }

    private void updateStreak(UserGamification g, LocalDate activityDate) {
        LocalDate last = g.getLastActiveDate();
        if (last == null) {
            g.setCurrentStreak(1);
        } else if (last.equals(activityDate)) {
            // Same day activity, streak preserved
            if (g.getCurrentStreak() == 0) g.setCurrentStreak(1);
        } else if (last.equals(activityDate.minusDays(1))) {
            // Consecutive day
            g.setCurrentStreak(g.getCurrentStreak() + 1);
        } else if (last.isBefore(activityDate.minusDays(1))) {
            // Broken streak, reset to 1
            g.setCurrentStreak(1);
        }
        g.setLongestStreak(Math.max(g.getLongestStreak(), g.getCurrentStreak()));
        g.setLastActiveDate(activityDate);
    }

    private void refreshStreakIfNeeded(UserGamification g) {
        if (g.getLastActiveDate() != null) {
            LocalDate yesterday = LocalDate.now().minusDays(1);
            if (g.getLastActiveDate().isBefore(yesterday)) {
                g.setCurrentStreak(0);
                userGamificationRepository.save(g);
            }
        }
    }

    private void checkMilestoneAchievements(User user, UserGamification g, GamificationDto.RewardEventResponse res) {
        // Streak milestones
        if (g.getCurrentStreak() >= 3) {
            unlockBadgeIfEligible(user, "STREAK_3", res);
        }
        if (g.getCurrentStreak() >= 7) {
            unlockBadgeIfEligible(user, "STREAK_7", res);
        }
        if (g.getTotalXp() >= 500) {
            unlockBadgeIfEligible(user, "KNOWLEDGE_HUNTER", res);
        }

        // Focus session milestones
        long sessionCount = studySessionRepository.countCompletedSessionsByUserId(user.getId());
        if (sessionCount >= 1) {
            unlockBadgeIfEligible(user, "FIRST_STEP", res);
        }
        if (sessionCount >= 5) {
            unlockBadgeIfEligible(user, "POMODORO_PRO", res);
        }

        Integer totalMins = studySessionRepository.getTotalMinutesStudiedSince(user.getId(), LocalDateTime.of(2000, 1, 1, 0, 0));
        if (totalMins != null && totalMins >= 100) {
            unlockBadgeIfEligible(user, "CENTURION", res);
        }

        // Flashcards
        long reviewCount = flashcardReviewRepository.count();
        if (reviewCount >= 10) {
            unlockBadgeIfEligible(user, "FLASH_MASTER", res);
        }
    }

    public void unlockBadgeIfEligible(User user, String badgeKey, GamificationDto.RewardEventResponse res) {
        if (userAchievementRepository.existsByUserIdAndBadgeKey(user.getId(), badgeKey)) {
            return;
        }

        MASTER_BADGES.stream().filter(b -> b.key().equals(badgeKey)).findFirst().ifPresent(badge -> {
            UserAchievement ua = UserAchievement.builder()
                    .user(user)
                    .badgeKey(badge.key())
                    .title(badge.title())
                    .description(badge.description())
                    .icon(badge.icon())
                    .category(badge.category())
                    .xpReward(badge.xp())
                    .build();

            UserAchievement saved = userAchievementRepository.save(ua);
            UserAchievement resultBadge = saved != null ? saved : ua;
            log.info("Unlocked achievement '{}' for student {}", badge.title(), user.getEmail());

            // Add badge XP bonus
            UserGamification g = getOrCreateGamification(user);
            g.setTotalXp(g.getTotalXp() + badge.xp());
            g.setCurrentLevel(calculateLevel(g.getTotalXp()));
            userGamificationRepository.save(g);

            if (res != null) {
                if (res.getUnlockedAchievements() == null) {
                    res.setUnlockedAchievements(new ArrayList<>());
                }
                res.getUnlockedAchievements().add(mapToAchievementItem(resultBadge));
            }
        });
    }

    public static int calculateLevel(int totalXp) {
        for (int i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
            if (totalXp >= LEVEL_THRESHOLDS[i]) {
                return i + 1;
            }
        }
        return 1;
    }

    public static int getLevelBaseXp(int level) {
        int idx = Math.max(1, Math.min(level, LEVEL_THRESHOLDS.length)) - 1;
        return LEVEL_THRESHOLDS[idx];
    }

    public static int getNextLevelTargetXp(int level) {
        if (level >= LEVEL_THRESHOLDS.length) {
            return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 2500;
        }
        return LEVEL_THRESHOLDS[level];
    }

    public static String getLevelTitle(int level) {
        int idx = Math.max(1, Math.min(level, LEVEL_TITLES.length)) - 1;
        return LEVEL_TITLES[idx];
    }

    private GamificationDto.AchievementItem mapToAchievementItem(UserAchievement a) {
        if (a == null) return null;
        return GamificationDto.AchievementItem.builder()
                .id(a.getId())
                .badgeKey(a.getBadgeKey())
                .title(a.getTitle())
                .description(a.getDescription())
                .icon(a.getIcon())
                .category(a.getCategory())
                .xpReward(a.getXpReward())
                .unlockedAt(a.getUnlockedAt())
                .isUnlocked(true)
                .build();
    }
}
