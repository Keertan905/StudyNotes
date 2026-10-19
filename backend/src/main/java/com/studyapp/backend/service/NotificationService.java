package com.studyapp.backend.service;

import com.studyapp.backend.dto.NotificationDto;
import com.studyapp.backend.exception.ResourceNotFoundException;
import com.studyapp.backend.model.ExamTarget;
import com.studyapp.backend.model.Notification;
import com.studyapp.backend.model.User;
import com.studyapp.backend.repository.ExamTargetRepository;
import com.studyapp.backend.repository.FlashcardRepository;
import com.studyapp.backend.repository.NotificationRepository;
import com.studyapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ExamTargetRepository examTargetRepository;
    private final FlashcardRepository flashcardRepository;

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional
    public List<NotificationDto.Response> getNotifications(String userEmail) {
        User user = getUserByEmail(userEmail);

        // Check and generate any contextual automated study triggers
        generateContextualAlerts(user);

        List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String userEmail) {
        User user = getUserByEmail(userEmail);
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    @Transactional
    public NotificationDto.Response markAsRead(String userEmail, Long id) {
        User user = getUserByEmail(userEmail);
        Notification notif = notificationRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with ID: " + id));
        notif.setIsRead(true);
        return mapToResponse(notificationRepository.save(notif));
    }

    @Transactional
    public void markAllAsRead(String userEmail) {
        User user = getUserByEmail(userEmail);
        notificationRepository.markAllAsReadByUserId(user.getId());
    }

    @Transactional
    public void deleteNotification(String userEmail, Long id) {
        User user = getUserByEmail(userEmail);
        Notification notif = notificationRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with ID: " + id));
        notificationRepository.delete(notif);
    }

    @Transactional
    public void clearAll(String userEmail) {
        User user = getUserByEmail(userEmail);
        notificationRepository.deleteAllByUserId(user.getId());
    }

    private void generateContextualAlerts(User user) {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();

        // 1. Upcoming exam countdown alert (within 7 days)
        List<ExamTarget> upcomingExams = examTargetRepository.findByUserIdAndStatusOrderByExamDateAsc(user.getId(), "UPCOMING");
        if (!upcomingExams.isEmpty()) {
            ExamTarget nearest = upcomingExams.get(0);
            long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), nearest.getExamDate());
            if (daysLeft >= 0 && daysLeft <= 7) {
                // Check if already notified today
                boolean alreadyNotified = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                        .anyMatch(n -> "EXAM_REMINDER".equals(n.getType()) && n.getCreatedAt().isAfter(todayStart));

                if (!alreadyNotified) {
                    Notification examNotif = Notification.builder()
                            .user(user)
                            .title("Upcoming Exam Countdown")
                            .message(String.format("%s is in %d day(s)! Review your daily timetable to hit your %d%% target score.",
                                    nearest.getTitle(), daysLeft, nearest.getTargetScore()))
                            .type("EXAM_REMINDER")
                            .link("/planner")
                            .isRead(false)
                            .build();
                    notificationRepository.save(examNotif);
                }
            }
        }

        // 2. Overdue SM-2 Flashcard revision alert
        long dueCards = flashcardRepository.countDueForReview(user.getId(), LocalDate.now());
        if (dueCards > 0) {
            boolean alreadyNotified = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                    .anyMatch(n -> "FLASHCARD_DUE".equals(n.getType()) && n.getCreatedAt().isAfter(todayStart));

            if (!alreadyNotified) {
                Notification flashcardNotif = Notification.builder()
                        .user(user)
                        .title("Flashcards Due for Review")
                        .message(String.format("You have %d spaced repetition flashcard(s) scheduled for today. Keep your memory consolidation curve strong!", dueCards))
                        .type("FLASHCARD_DUE")
                        .link("/flashcards")
                        .isRead(false)
                        .build();
                notificationRepository.save(flashcardNotif);
            }
        }
    }

    private NotificationDto.Response mapToResponse(Notification n) {
        return NotificationDto.Response.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .link(n.getLink() != null ? n.getLink() : "/dashboard")
                .isRead(Boolean.TRUE.equals(n.getIsRead()))
                .timeAgo(formatTimeAgo(n.getCreatedAt()))
                .createdAt(n.getCreatedAt())
                .build();
    }

    private String formatTimeAgo(LocalDateTime dt) {
        if (dt == null) return "Just now";
        Duration dur = Duration.between(dt, LocalDateTime.now());
        long seconds = dur.getSeconds();
        if (seconds < 60) return "Just now";
        long minutes = seconds / 60;
        if (minutes < 60) return minutes + "m ago";
        long hours = minutes / 60;
        if (hours < 24) return hours + "h ago";
        long days = hours / 24;
        return days + "d ago";
    }
}
