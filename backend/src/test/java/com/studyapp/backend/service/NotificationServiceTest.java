package com.studyapp.backend.service;

import com.studyapp.backend.dto.NotificationDto;
import com.studyapp.backend.model.Notification;
import com.studyapp.backend.model.User;
import com.studyapp.backend.repository.ExamTargetRepository;
import com.studyapp.backend.repository.FlashcardRepository;
import com.studyapp.backend.repository.NotificationRepository;
import com.studyapp.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ExamTargetRepository examTargetRepository;

    @Mock
    private FlashcardRepository flashcardRepository;

    @InjectMocks
    private NotificationService notificationService;

    private User testUser;
    private Notification testNotification;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .name("Alex Student")
                .email("alex@studyapp.com")
                .build();

        testNotification = Notification.builder()
                .id(101L)
                .user(testUser)
                .title("Exam Reminder")
                .message("Test message")
                .type("EXAM_REMINDER")
                .link("/planner")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void testGetNotifications() {
        when(userRepository.findByEmail("alex@studyapp.com")).thenReturn(Optional.of(testUser));
        when(examTargetRepository.findByUserIdAndStatusOrderByExamDateAsc(1L, "UPCOMING")).thenReturn(Collections.emptyList());
        when(flashcardRepository.countDueForReview(eq(1L), any())).thenReturn(0L);
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(testNotification));

        List<NotificationDto.Response> results = notificationService.getNotifications("alex@studyapp.com");

        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals("Exam Reminder", results.get(0).getTitle());
        assertFalse(results.get(0).getIsRead());
    }

    @Test
    void testMarkAsRead() {
        when(userRepository.findByEmail("alex@studyapp.com")).thenReturn(Optional.of(testUser));
        when(notificationRepository.findByIdAndUserId(101L, 1L)).thenReturn(Optional.of(testNotification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationDto.Response response = notificationService.markAsRead("alex@studyapp.com", 101L);

        assertNotNull(response);
        assertTrue(response.getIsRead());
        verify(notificationRepository, times(1)).save(testNotification);
    }
}
