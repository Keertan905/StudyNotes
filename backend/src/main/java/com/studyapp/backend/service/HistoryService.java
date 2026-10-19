package com.studyapp.backend.service;

import com.studyapp.backend.dto.HistoryDto;
import com.studyapp.backend.exception.ResourceNotFoundException;
import com.studyapp.backend.model.*;
import com.studyapp.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class HistoryService {

    private final UserRepository userRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final FlashcardReviewRepository flashcardReviewRepository;
    private final StudySessionRepository studySessionRepository;
    private final NoteRepository noteRepository;
    private final StudyDocumentRepository documentRepository;

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional(readOnly = true)
    public HistoryDto.HistorySummary getActivityHistory(String userEmail, String typeFilter, String search) {
        User user = getUserByEmail(userEmail);
        List<HistoryDto.ActivityEvent> events = new ArrayList<>();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("MMM dd, yyyy • hh:mm a");

        // 1. Quizzes
        List<QuizAttempt> attempts = quizAttemptRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        for (QuizAttempt a : attempts) {
            String subName = a.getQuiz() != null && a.getQuiz().getSubject() != null ? a.getQuiz().getSubject().getName() : "General";
            String title = a.getQuiz() != null ? a.getQuiz().getTitle() : "Practice Quiz";

            Map<String, Object> meta = new HashMap<>();
            meta.put("percentage", a.getPercentage());
            meta.put("score", a.getScoreObtained());
            meta.put("passed", a.getPassed());

            events.add(HistoryDto.ActivityEvent.builder()
                    .id("quiz_" + a.getId())
                    .type("QUIZ_ATTEMPT")
                    .title("Quiz Assessment: " + title)
                    .description(String.format("Completed diagnostic test scoring %.1f%% (%s)",
                            a.getPercentage() != null ? a.getPercentage() : 0.0,
                            Boolean.TRUE.equals(a.getPassed()) ? "Passed" : "Needs Review"))
                    .subjectName(subName)
                    .timestamp(a.getCreatedAt())
                    .formattedTime(a.getCreatedAt() != null ? a.getCreatedAt().format(dtf) : "Recently")
                    .metadata(meta)
                    .build());
        }

        // 2. Flashcards
        List<FlashcardReview> reviews = flashcardReviewRepository.findByUserIdOrderByReviewedAtDesc(user.getId());
        for (FlashcardReview r : reviews) {
            String front = r.getFlashcard() != null ? r.getFlashcard().getFront() : "Flashcard";
            if (front.length() > 50) front = front.substring(0, 50) + "...";
            String subName = r.getFlashcard() != null && r.getFlashcard().getSubject() != null ? r.getFlashcard().getSubject().getName() : "General";

            Map<String, Object> meta = new HashMap<>();
            meta.put("rating", r.getRating());
            meta.put("newIntervalDays", r.getNewIntervalDays());

            events.add(HistoryDto.ActivityEvent.builder()
                    .id("flash_" + r.getId())
                    .type("FLASHCARD_REVIEW")
                    .title("SM-2 Flashcard Review: " + front)
                    .description(String.format("Rated '%s' • Next review scheduled in %d day(s)",
                            r.getRating(), r.getNewIntervalDays() != null ? r.getNewIntervalDays() : 1))
                    .subjectName(subName)
                    .timestamp(r.getReviewedAt())
                    .formattedTime(r.getReviewedAt() != null ? r.getReviewedAt().format(dtf) : "Recently")
                    .metadata(meta)
                    .build());
        }

        // 3. Focus Sessions
        List<StudySession> sessions = studySessionRepository.findByUserIdOrderByStartTimeDesc(user.getId());
        int totalStudyMinutes = 0;
        for (StudySession s : sessions) {
            int mins = s.getActualDurationMinutes() != null ? s.getActualDurationMinutes() : 0;
            totalStudyMinutes += mins;
            String subName = s.getSubject() != null ? s.getSubject().getName() : "General Focus";

            Map<String, Object> meta = new HashMap<>();
            meta.put("durationMinutes", mins);
            meta.put("sessionType", s.getSessionType());

            events.add(HistoryDto.ActivityEvent.builder()
                    .id("session_" + s.getId())
                    .type("FOCUS_SESSION")
                    .title("Pomodoro Focus: " + s.getTitle())
                    .description(String.format("Logged %d minutes of distraction-free study time", mins))
                    .subjectName(subName)
                    .timestamp(s.getStartTime())
                    .formattedTime(s.getStartTime() != null ? s.getStartTime().format(dtf) : "Recently")
                    .metadata(meta)
                    .build());
        }

        // 4. Notes
        List<Note> notes = noteRepository.findByUserIdOrderByUpdatedAtDesc(user.getId());
        for (Note n : notes) {
            String subName = n.getSubject() != null ? n.getSubject().getName() : "General";
            events.add(HistoryDto.ActivityEvent.builder()
                    .id("note_" + n.getId())
                    .type("NOTE_GENERATED")
                    .title("AI Revision Note: " + n.getTitle())
                    .description("Generated structured academic study summary")
                    .subjectName(subName)
                    .timestamp(n.getCreatedAt())
                    .formattedTime(n.getCreatedAt() != null ? n.getCreatedAt().format(dtf) : "Recently")
                    .metadata(Collections.emptyMap())
                    .build());
        }

        // 5. Documents
        List<StudyDocument> docs = documentRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        for (StudyDocument d : docs) {
            String subName = d.getSubject() != null ? d.getSubject().getName() : "General";
            events.add(HistoryDto.ActivityEvent.builder()
                    .id("doc_" + d.getId())
                    .type("DOCUMENT_UPLOAD")
                    .title("Indexed Reference: " + d.getTitle())
                    .description(String.format("Uploaded %s document indexed into %d RAG chunks", d.getFileType(), d.getChunkCount()))
                    .subjectName(subName)
                    .timestamp(d.getCreatedAt())
                    .formattedTime(d.getCreatedAt() != null ? d.getCreatedAt().format(dtf) : "Recently")
                    .metadata(Collections.emptyMap())
                    .build());
        }

        // Sort descending by timestamp
        events.sort((a, b) -> {
            if (a.getTimestamp() == null && b.getTimestamp() == null) return 0;
            if (a.getTimestamp() == null) return 1;
            if (b.getTimestamp() == null) return -1;
            return b.getTimestamp().compareTo(a.getTimestamp());
        });

        // Apply filters
        List<HistoryDto.ActivityEvent> filtered = events;
        if (typeFilter != null && !typeFilter.isBlank() && !"ALL".equalsIgnoreCase(typeFilter)) {
            filtered = filtered.stream()
                    .filter(e -> typeFilter.equalsIgnoreCase(e.getType()))
                    .collect(Collectors.toList());
        }
        if (search != null && !search.isBlank()) {
            String query = search.toLowerCase().trim();
            filtered = filtered.stream()
                    .filter(e -> e.getTitle().toLowerCase().contains(query)
                            || e.getDescription().toLowerCase().contains(query)
                            || (e.getSubjectName() != null && e.getSubjectName().toLowerCase().contains(query)))
                    .collect(Collectors.toList());
        }

        return HistoryDto.HistorySummary.builder()
                .totalActivities(events.size())
                .totalStudyMinutes(totalStudyMinutes)
                .quizzesCompleted(attempts.size())
                .flashcardsReviewed(reviews.size())
                .notesGenerated(notes.size())
                .documentsUploaded(docs.size())
                .events(filtered)
                .build();
    }
}
