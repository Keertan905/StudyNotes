package com.studyapp.backend.service;

import com.studyapp.backend.dto.GamificationDto;
import com.studyapp.backend.dto.OfflineSyncDto;
import com.studyapp.backend.model.*;
import com.studyapp.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OfflineSyncServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private StudySessionRepository studySessionRepository;

    @Mock
    private SubjectRepository subjectRepository;

    @Mock
    private TopicRepository topicRepository;

    @Mock
    private FlashcardRepository flashcardRepository;

    @Mock
    private FlashcardReviewRepository flashcardReviewRepository;

    @Mock
    private XpTransactionRepository xpTransactionRepository;

    @Mock
    private GamificationService gamificationService;

    @InjectMocks
    private OfflineSyncService offlineSyncService;

    private User testUser;
    private Flashcard testCard;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .name("Offline Learner")
                .email("offline@studyapp.com")
                .build();

        testCard = Flashcard.builder()
                .id(50L)
                .user(testUser)
                .front("What is ACID in DB?")
                .back("Atomicity, Consistency, Isolation, Durability")
                .intervalDays(1)
                .easeFactor(2.5)
                .repetitions(0)
                .build();

        lenient().when(flashcardReviewRepository.save(any(FlashcardReview.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        lenient().when(studySessionRepository.save(any(StudySession.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("Syncing offline study sessions creates session and awards XP with idempotency")
    void testSyncOfflineStudySession() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(xpTransactionRepository.existsByUserIdAndActivityTypeAndSourceId(eq(testUser.getId()), eq("STUDY_SESSION"), eq("session-uuid-1")))
                .thenReturn(false);

        when(studySessionRepository.save(any(StudySession.class))).thenAnswer(invocation -> {
            StudySession s = invocation.getArgument(0);
            s.setId(201L);
            return s;
        });

        when(gamificationService.awardStudySessionXp(eq(testUser), any(StudySession.class), eq("session-uuid-1")))
                .thenReturn(GamificationDto.RewardEventResponse.builder()
                        .xpEarned(35)
                        .newTotalXp(35)
                        .currentLevel(1)
                        .unlockedAchievements(new ArrayList<>())
                        .build());

        OfflineSyncDto.SyncRequest req = OfflineSyncDto.SyncRequest.builder()
                .studySessions(List.of(
                        OfflineSyncDto.OfflineStudySessionItem.builder()
                                .syncId("session-uuid-1")
                                .title("Offline Architecture Study")
                                .actualDurationMinutes(25)
                                .completed(true)
                                .startTime(LocalDateTime.now().minusMinutes(25))
                                .endTime(LocalDateTime.now())
                                .build()
                ))
                .build();

        OfflineSyncDto.SyncResponse res = offlineSyncService.syncOfflineData(req, testUser.getEmail());

        assertNotNull(res);
        assertEquals(1, res.getSyncedSessionsCount());
        assertEquals(0, res.getSyncedReviewsCount());
        assertEquals(35, res.getTotalXpEarned());

        verify(studySessionRepository, times(1)).save(any(StudySession.class));
        verify(gamificationService, times(1)).unlockBadgeIfEligible(eq(testUser), eq("OFFLINE_SCHOLAR"), any());
    }

    @Test
    @DisplayName("Syncing offline flashcard review updates card with SM-2 spaced repetition")
    void testSyncOfflineFlashcardReview() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(xpTransactionRepository.existsByUserIdAndActivityTypeAndSourceId(eq(testUser.getId()), eq("FLASHCARD_REVIEW"), eq("review-uuid-1")))
                .thenReturn(false);
        when(flashcardRepository.findByIdAndUserId(50L, testUser.getId())).thenReturn(Optional.of(testCard));
        when(flashcardRepository.save(any(Flashcard.class))).thenAnswer(inv -> inv.getArgument(0));

        when(gamificationService.awardFlashcardReviewXp(eq(testUser), any(FlashcardReview.class), eq("review-uuid-1")))
                .thenReturn(GamificationDto.RewardEventResponse.builder()
                        .xpEarned(5)
                        .newTotalXp(40)
                        .currentLevel(1)
                        .unlockedAchievements(new ArrayList<>())
                        .build());

        OfflineSyncDto.SyncRequest req = OfflineSyncDto.SyncRequest.builder()
                .flashcardReviews(List.of(
                        OfflineSyncDto.OfflineFlashcardReviewItem.builder()
                                .syncId("review-uuid-1")
                                .flashcardId(50L)
                                .rating("GOOD")
                                .timeSpentSeconds(15)
                                .reviewedAt(LocalDateTime.now())
                                .build()
                ))
                .build();

        OfflineSyncDto.SyncResponse res = offlineSyncService.syncOfflineData(req, testUser.getEmail());

        assertNotNull(res);
        assertEquals(1, res.getSyncedReviewsCount());
        assertEquals(5, res.getTotalXpEarned());

        // Verifies card repetitions incremented
        assertEquals(1, testCard.getRepetitions());
        verify(flashcardReviewRepository, times(1)).save(any(FlashcardReview.class));
    }

    @Test
    @DisplayName("Already synchronized offline items with matching syncId are skipped")
    void testDuplicateSyncIdSkipped() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(xpTransactionRepository.existsByUserIdAndActivityTypeAndSourceId(eq(testUser.getId()), eq("STUDY_SESSION"), eq("already-synced-uuid")))
                .thenReturn(true);

        OfflineSyncDto.SyncRequest req = OfflineSyncDto.SyncRequest.builder()
                .studySessions(List.of(
                        OfflineSyncDto.OfflineStudySessionItem.builder()
                                .syncId("already-synced-uuid")
                                .title("Duplicate Session")
                                .actualDurationMinutes(25)
                                .build()
                ))
                .build();

        OfflineSyncDto.SyncResponse res = offlineSyncService.syncOfflineData(req, testUser.getEmail());
        assertNotNull(res);
        assertEquals(0, res.getSyncedSessionsCount());
        verify(studySessionRepository, never()).save(any(StudySession.class));
    }
}
