package com.studyapp.backend.service;

import com.studyapp.backend.dto.StudySessionDto;
import com.studyapp.backend.exception.ResourceNotFoundException;
import com.studyapp.backend.model.*;
import com.studyapp.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudySessionService {

    private final StudySessionRepository studySessionRepository;
    private final SubjectRepository subjectRepository;
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional
    public StudySessionDto.SessionResponse logSession(StudySessionDto.LogSessionRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);

        Subject subject = null;
        if (request.getSubjectId() != null) {
            subject = subjectRepository.findByIdAndUserId(request.getSubjectId(), user.getId()).orElse(null);
        }

        Topic topic = null;
        if (request.getTopicId() != null) {
            topic = topicRepository.findByIdAndUnitSubjectUserId(request.getTopicId(), user.getId()).orElse(null);
        }

        LocalDateTime start = request.getStartTime() != null ? request.getStartTime() : LocalDateTime.now().minusMinutes(request.getActualDurationMinutes() != null ? request.getActualDurationMinutes() : 25);
        LocalDateTime end = request.getEndTime() != null ? request.getEndTime() : LocalDateTime.now();

        StudySession session = StudySession.builder()
                .user(user)
                .subject(subject)
                .topic(topic)
                .title(request.getTitle().trim())
                .sessionType(request.getSessionType() != null ? request.getSessionType() : "POMODORO")
                .targetDurationMinutes(request.getTargetDurationMinutes() != null ? request.getTargetDurationMinutes() : 25)
                .actualDurationMinutes(request.getActualDurationMinutes() != null ? request.getActualDurationMinutes() : 25)
                .completed(request.getCompleted() != null ? request.getCompleted() : true)
                .notes(request.getNotes())
                .startTime(start)
                .endTime(end)
                .build();

        StudySession saved = studySessionRepository.save(session);
        log.info("Logged study session '{}' ({} mins) for user {}", saved.getTitle(), saved.getActualDurationMinutes(), user.getEmail());
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<StudySessionDto.SessionResponse> getSessions(String userEmail) {
        User user = getUserByEmail(userEmail);
        List<StudySession> list = studySessionRepository.findByUserIdOrderByStartTimeDesc(user.getId());
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StudySessionDto.SessionStatsResponse getStats(String userEmail) {
        User user = getUserByEmail(userEmail);
        LocalDateTime startOfToday = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime startOfWeek = LocalDateTime.of(LocalDate.now().minusDays(LocalDate.now().getDayOfWeek().getValue() - 1), LocalTime.MIN);

        Integer todayMins = studySessionRepository.getTotalMinutesStudiedSince(user.getId(), startOfToday);
        Integer weekMins = studySessionRepository.getTotalMinutesStudiedSince(user.getId(), startOfWeek);
        long completedCount = studySessionRepository.countCompletedSessionsByUserId(user.getId());

        // Simple streak calculation: if studied today, streak is at least 1
        int streak = (todayMins != null && todayMins > 0) ? 1 : 0;

        return StudySessionDto.SessionStatsResponse.builder()
                .minutesStudiedToday(todayMins != null ? todayMins : 0)
                .minutesStudiedThisWeek(weekMins != null ? weekMins : 0)
                .completedSessionsCount(completedCount)
                .currentStreakDays(streak)
                .build();
    }

    private StudySessionDto.SessionResponse mapToResponse(StudySession s) {
        return StudySessionDto.SessionResponse.builder()
                .id(s.getId())
                .subjectId(s.getSubject() != null ? s.getSubject().getId() : null)
                .subjectName(s.getSubject() != null ? s.getSubject().getName() : null)
                .topicId(s.getTopic() != null ? s.getTopic().getId() : null)
                .topicName(s.getTopic() != null ? s.getTopic().getName() : null)
                .title(s.getTitle())
                .sessionType(s.getSessionType())
                .targetDurationMinutes(s.getTargetDurationMinutes())
                .actualDurationMinutes(s.getActualDurationMinutes())
                .completed(s.getCompleted())
                .notes(s.getNotes())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
