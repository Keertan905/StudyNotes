package com.studyapp.backend.service;

import com.studyapp.backend.dto.GamificationDto;
import com.studyapp.backend.dto.OfflineSyncDto;
import com.studyapp.backend.exception.ResourceNotFoundException;
import com.studyapp.backend.model.*;
import com.studyapp.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OfflineSyncService {

    private final UserRepository userRepository;
    private final StudySessionRepository studySessionRepository;
    private final SubjectRepository subjectRepository;
    private final TopicRepository topicRepository;
    private final FlashcardRepository flashcardRepository;
    private final FlashcardReviewRepository flashcardReviewRepository;
    private final XpTransactionRepository xpTransactionRepository;
    private final GamificationService gamificationService;

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    @Transactional
    public OfflineSyncDto.SyncResponse syncOfflineData(OfflineSyncDto.SyncRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);
        int syncedSessions = 0;
        int syncedReviews = 0;
        int totalXpEarned = 0;
        List<GamificationDto.AchievementItem> allNewAchievements = new ArrayList<>();

        // 1. Process Offline Study Sessions
        if (request.getStudySessions() != null) {
            for (OfflineSyncDto.OfflineStudySessionItem item : request.getStudySessions()) {
                String syncId = (item.getSyncId() != null && !item.getSyncId().isBlank())
                        ? item.getSyncId().trim()
                        : UUID.randomUUID().toString();

                // Idempotency: verify this syncId hasn't already been processed
                if (xpTransactionRepository.existsByUserIdAndActivityTypeAndSourceId(user.getId(), "STUDY_SESSION", syncId)) {
                    log.info("Skipping already synchronized offline session {}", syncId);
                    continue;
                }

                Subject subject = null;
                if (item.getSubjectId() != null) {
                    subject = subjectRepository.findByIdAndUserId(item.getSubjectId(), user.getId()).orElse(null);
                }

                Topic topic = null;
                if (item.getTopicId() != null) {
                    topic = topicRepository.findByIdAndUnitSubjectUserId(item.getTopicId(), user.getId()).orElse(null);
                }

                int duration = item.getActualDurationMinutes() != null && item.getActualDurationMinutes() > 0
                        ? item.getActualDurationMinutes()
                        : 25;

                LocalDateTime start = item.getStartTime() != null
                        ? item.getStartTime()
                        : LocalDateTime.now().minusMinutes(duration);
                LocalDateTime end = item.getEndTime() != null
                        ? item.getEndTime()
                        : LocalDateTime.now();

                StudySession session = StudySession.builder()
                        .user(user)
                        .subject(subject)
                        .topic(topic)
                        .title(item.getTitle() != null && !item.getTitle().isBlank() ? item.getTitle().trim() : "Offline Focus Session")
                        .sessionType(item.getSessionType() != null ? item.getSessionType() : "POMODORO")
                        .targetDurationMinutes(duration)
                        .actualDurationMinutes(duration)
                        .completed(item.getCompleted() != null ? item.getCompleted() : true)
                        .notes(item.getNotes())
                        .startTime(start)
                        .endTime(end)
                        .build();

                StudySession savedSession = studySessionRepository.save(session);
                syncedSessions++;

                GamificationDto.RewardEventResponse reward = gamificationService.awardStudySessionXp(user, savedSession, syncId);
                if (reward != null) {
                    totalXpEarned += reward.getXpEarned();
                    if (reward.getUnlockedAchievements() != null) {
                        allNewAchievements.addAll(reward.getUnlockedAchievements());
                    }
                }
            }
        }

        // 2. Process Offline Flashcard Reviews
        if (request.getFlashcardReviews() != null) {
            for (OfflineSyncDto.OfflineFlashcardReviewItem item : request.getFlashcardReviews()) {
                String syncId = (item.getSyncId() != null && !item.getSyncId().isBlank())
                        ? item.getSyncId().trim()
                        : UUID.randomUUID().toString();

                if (xpTransactionRepository.existsByUserIdAndActivityTypeAndSourceId(user.getId(), "FLASHCARD_REVIEW", syncId)) {
                    log.info("Skipping already synchronized offline flashcard review {}", syncId);
                    continue;
                }

                Flashcard card = flashcardRepository.findByIdAndUserId(item.getFlashcardId(), user.getId()).orElse(null);
                if (card == null) {
                    log.warn("Offline flashcard ID {} not found for user {}", item.getFlashcardId(), user.getEmail());
                    continue;
                }

                int prevInterval = card.getIntervalDays() != null ? card.getIntervalDays() : 1;
                double prevEase = card.getEaseFactor() != null ? card.getEaseFactor() : 2.5;
                int reps = card.getRepetitions() != null ? card.getRepetitions() : 0;
                String rating = item.getRating() != null ? item.getRating().toUpperCase().trim() : "GOOD";

                int newInterval;
                double newEase = prevEase;

                switch (rating) {
                    case "AGAIN":
                        reps = 0;
                        newInterval = 1;
                        newEase = Math.max(1.3, prevEase - 0.2);
                        break;
                    case "HARD":
                        newInterval = Math.max(1, (int) Math.round(prevInterval * 1.2));
                        newEase = Math.max(1.3, prevEase - 0.15);
                        break;
                    case "GOOD":
                        if (reps == 0) newInterval = 1;
                        else if (reps == 1) newInterval = 6;
                        else newInterval = (int) Math.round(prevInterval * prevEase);
                        reps++;
                        break;
                    case "EASY":
                        if (reps == 0) newInterval = 3;
                        else if (reps == 1) newInterval = 8;
                        else newInterval = (int) Math.round(prevInterval * prevEase * 1.3);
                        reps++;
                        newEase = prevEase + 0.15;
                        break;
                    default:
                        newInterval = 1;
                }

                LocalDate nextDate = LocalDate.now().plusDays(newInterval);
                card.setIntervalDays(newInterval);
                card.setEaseFactor(Math.round(newEase * 100.0) / 100.0);
                card.setRepetitions(reps);
                card.setNextReviewDate(nextDate);
                card.setLastReviewedAt(item.getReviewedAt() != null ? item.getReviewedAt() : LocalDateTime.now());
                card.setReviewCount(card.getReviewCount() != null ? card.getReviewCount() + 1 : 1);
                Flashcard savedCard = flashcardRepository.save(card);

                FlashcardReview review = FlashcardReview.builder()
                        .flashcard(savedCard)
                        .user(user)
                        .rating(rating)
                        .timeSpentSeconds(item.getTimeSpentSeconds() != null ? item.getTimeSpentSeconds() : 0)
                        .previousIntervalDays(prevInterval)
                        .newIntervalDays(newInterval)
                        .previousEaseFactor(prevEase)
                        .newEaseFactor(newEase)
                        .build();

                FlashcardReview savedReview = flashcardReviewRepository.save(review);
                FlashcardReview reviewForXp = savedReview != null ? savedReview : review;
                syncedReviews++;

                GamificationDto.RewardEventResponse reward = gamificationService.awardFlashcardReviewXp(user, reviewForXp, syncId);
                if (reward != null) {
                    totalXpEarned += reward.getXpEarned();
                    if (reward.getUnlockedAchievements() != null) {
                        allNewAchievements.addAll(reward.getUnlockedAchievements());
                    }
                }
            }
        }

        // 3. Check and award Offline Scholar achievement if student synced offline activities
        if (syncedSessions > 0 || syncedReviews > 0) {
            GamificationDto.RewardEventResponse offRes = GamificationDto.RewardEventResponse.builder()
                    .unlockedAchievements(new ArrayList<>())
                    .build();
            gamificationService.unlockBadgeIfEligible(user, "OFFLINE_SCHOLAR", offRes);
            if (offRes.getUnlockedAchievements() != null) {
                allNewAchievements.addAll(offRes.getUnlockedAchievements());
            }
        }

        log.info("Synchronized offline data for user {}: {} sessions, {} reviews, +{} XP",
                user.getEmail(), syncedSessions, syncedReviews, totalXpEarned);

        return OfflineSyncDto.SyncResponse.builder()
                .syncedSessionsCount(syncedSessions)
                .syncedReviewsCount(syncedReviews)
                .totalXpEarned(totalXpEarned)
                .newAchievements(allNewAchievements)
                .message(String.format("Successfully synchronized %d study session(s) and %d flashcard review(s).", syncedSessions, syncedReviews))
                .build();
    }
}
