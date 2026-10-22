package com.studyapp.backend.service;

import com.studyapp.backend.dto.GamificationDto;
import com.studyapp.backend.model.*;
import com.studyapp.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GamificationServiceTest {

    @Mock
    private UserGamificationRepository userGamificationRepository;

    @Mock
    private UserAchievementRepository userAchievementRepository;

    @Mock
    private XpTransactionRepository xpTransactionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StudySessionRepository studySessionRepository;

    @Mock
    private FlashcardReviewRepository flashcardReviewRepository;

    @InjectMocks
    private GamificationService gamificationService;

    private User testUser;
    private UserGamification testGamification;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .name("Keertan Student")
                .email("student@studyapp.com")
                .college("Engineering College")
                .branch("Computer Science")
                .build();

        testGamification = UserGamification.builder()
                .id(10L)
                .user(testUser)
                .totalXp(120)
                .currentLevel(1)
                .currentStreak(1)
                .longestStreak(1)
                .lastActiveDate(LocalDate.now().minusDays(1))
                .leaderboardOptIn(true)
                .build();

        lenient().when(userAchievementRepository.save(any(UserAchievement.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("Level progression calculations correctly map XP ranges to levels and titles")
    void testLevelProgression() {
        assertEquals(1, GamificationService.calculateLevel(0));
        assertEquals(1, GamificationService.calculateLevel(149));
        assertEquals(2, GamificationService.calculateLevel(150));
        assertEquals(3, GamificationService.calculateLevel(400));
        assertEquals(4, GamificationService.calculateLevel(800));
        assertEquals(10, GamificationService.calculateLevel(9000));

        assertEquals("Novice Scholar", GamificationService.getLevelTitle(1));
        assertEquals("Apprentice Learner", GamificationService.getLevelTitle(2));
        assertEquals("Dedicated Student", GamificationService.getLevelTitle(3));
        assertEquals("Grand Polymath", GamificationService.getLevelTitle(10));
    }

    @Test
    @DisplayName("Awarding study session XP updates total XP and streak on consecutive day")
    void testAwardStudySessionXp() {
        when(xpTransactionRepository.existsByUserIdAndActivityTypeAndSourceId(anyLong(), anyString(), anyString()))
                .thenReturn(false);
        when(userGamificationRepository.findByUserId(testUser.getId()))
                .thenReturn(Optional.of(testGamification));
        when(userAchievementRepository.existsByUserIdAndBadgeKey(anyLong(), anyString())).thenReturn(true);
        when(studySessionRepository.countCompletedSessionsByUserId(testUser.getId())).thenReturn(1L);

        StudySession session = StudySession.builder()
                .id(100L)
                .user(testUser)
                .title("Operating Systems")
                .actualDurationMinutes(25)
                .completed(true)
                .endTime(LocalDateTime.now())
                .build();

        GamificationDto.RewardEventResponse response = gamificationService.awardStudySessionXp(testUser, session, null);

        assertNotNull(response);
        // 10 base + 25 mins = 35 XP
        assertEquals(35, response.getXpEarned());
        // 120 + 35 = 155 XP -> Level 2
        assertEquals(155, response.getNewTotalXp());
        assertEquals(2, response.getCurrentLevel());
        assertTrue(response.isLevelUpOccurred());

        // Yesterday was lastActiveDate, so streak should increment to 2
        assertEquals(2, testGamification.getCurrentStreak());
        assertEquals(LocalDate.now(), testGamification.getLastActiveDate());

        verify(xpTransactionRepository, times(1)).save(any(XpTransaction.class));
        verify(userGamificationRepository, times(1)).save(testGamification);
    }

    @Test
    @DisplayName("Duplicate XP requests with matching sourceId are safely rejected")
    void testDuplicateXpRejection() {
        when(xpTransactionRepository.existsByUserIdAndActivityTypeAndSourceId(testUser.getId(), "STUDY_SESSION", "session-999"))
                .thenReturn(true);

        StudySession session = StudySession.builder()
                .id(999L)
                .user(testUser)
                .title("Algorithms")
                .actualDurationMinutes(25)
                .build();

        GamificationDto.RewardEventResponse response = gamificationService.awardStudySessionXp(testUser, session, null);

        assertNull(response, "Duplicate XP request must return null and award nothing");
        verify(xpTransactionRepository, never()).save(any(XpTransaction.class));
    }

    @Test
    @DisplayName("Quiz attempt awards XP and unlocks QUIZ_WHIZ and PERFECT_SCORE achievements")
    void testQuizAttemptAwardsAndAchievements() {
        when(xpTransactionRepository.existsByUserIdAndActivityTypeAndSourceId(anyLong(), anyString(), anyString()))
                .thenReturn(false);
        when(userGamificationRepository.findByUserId(testUser.getId()))
                .thenReturn(Optional.of(testGamification));
        when(userAchievementRepository.existsByUserIdAndBadgeKey(testUser.getId(), "QUIZ_WHIZ")).thenReturn(false);
        when(userAchievementRepository.existsByUserIdAndBadgeKey(testUser.getId(), "PERFECT_SCORE")).thenReturn(false);
        when(userAchievementRepository.save(any(UserAchievement.class))).thenAnswer(invocation -> {
            UserAchievement ua = invocation.getArgument(0);
            ua.setId(501L);
            return ua;
        });

        Quiz quiz = Quiz.builder().id(20L).title("Data Structures Midterm").build();
        QuizAttempt attempt = QuizAttempt.builder()
                .id(300L)
                .quiz(quiz)
                .user(testUser)
                .percentage(100.0)
                .passed(true)
                .endTime(LocalDateTime.now())
                .build();

        GamificationDto.RewardEventResponse response = gamificationService.awardQuizAttemptXp(testUser, attempt);

        assertNotNull(response);
        // Base 30 + (100 * 0.5) + 20 bonus = 100 XP
        assertEquals(100, response.getXpEarned());

        // Verifies both achievements were saved
        verify(userAchievementRepository, times(2)).save(any(UserAchievement.class));
    }

    @Test
    @DisplayName("Flashcard daily review XP cap prevents spamming")
    void testFlashcardDailyXpCap() {
        when(xpTransactionRepository.getDailyXpForType(eq(testUser.getId()), eq(LocalDate.now()), eq("FLASHCARD_REVIEW")))
                .thenReturn(150); // Already reached 150 daily cap

        FlashcardReview review = FlashcardReview.builder()
                .id(400L)
                .user(testUser)
                .rating("GOOD")
                .build();

        GamificationDto.RewardEventResponse response = gamificationService.awardFlashcardReviewXp(testUser, review, null);
        assertNull(response, "Review XP must be blocked once daily cap is reached");
        verify(xpTransactionRepository, never()).save(any(XpTransaction.class));
    }

    @Test
    @DisplayName("Leaderboard privacy toggle updates student preference")
    void testPrivacyUpdate() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(userGamificationRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(testGamification));
        when(userAchievementRepository.findByUserIdOrderByUnlockedAtDesc(testUser.getId())).thenReturn(Collections.emptyList());

        GamificationDto.ProfileResponse res = gamificationService.updatePrivacy(testUser.getEmail(), false);
        assertNotNull(res);
        assertFalse(res.getLeaderboardOptIn());
        assertFalse(testGamification.getLeaderboardOptIn());
        verify(userGamificationRepository, times(1)).save(testGamification);
    }
}
