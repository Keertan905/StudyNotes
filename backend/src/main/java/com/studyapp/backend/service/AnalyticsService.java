package com.studyapp.backend.service;

import com.studyapp.backend.dto.AnalyticsDto;
import com.studyapp.backend.dto.ReadinessScoreDto;
import com.studyapp.backend.exception.ResourceNotFoundException;
import com.studyapp.backend.model.*;
import com.studyapp.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final UnitRepository unitRepository;
    private final TopicRepository topicRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final FlashcardRepository flashcardRepository;
    private final FlashcardReviewRepository flashcardReviewRepository;
    private final MistakeRecordRepository mistakeRecordRepository;
    private final StudySessionRepository studySessionRepository;
    private final StudyTaskRepository studyTaskRepository;
    private final ExamTargetRepository examTargetRepository;
    private final StudyPlanItemRepository studyPlanItemRepository;

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    // ==========================================
    // READINESS SCORE ENGINE
    // ==========================================

    @Transactional(readOnly = true)
    public ReadinessScoreDto getReadinessOverview(String userEmail) {
        User user = getUserByEmail(userEmail);
        List<Subject> subjects = subjectRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        // 1. Syllabus Coverage (25%)
        int totalTopicsCount = 0;
        int completedTopicsCount = 0;
        List<ReadinessScoreDto.SubjectReadinessDto> subjectDtos = new ArrayList<>();

        List<ExamTarget> upcomingExams = examTargetRepository.findByUserIdAndStatusOrderByExamDateAsc(user.getId(), "UPCOMING");
        ExamTarget nearestExam = upcomingExams.isEmpty() ? null : upcomingExams.get(0);

        List<QuizAttempt> allAttempts = quizAttemptRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        List<Flashcard> allCards = flashcardRepository.findByUserIdOrderByNextReviewDateAsc(user.getId());
        List<MistakeRecord> allMistakes = mistakeRecordRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        for (Subject sub : subjects) {
            List<Unit> units = unitRepository.findBySubjectIdOrderByUnitNumberAsc(sub.getId());
            int subTotalTopics = 0;
            int subCompletedTopics = 0;
            for (Unit u : units) {
                List<Topic> topics = topicRepository.findByUnitIdOrderByIdAsc(u.getId());
                subTotalTopics += topics.size();
                subCompletedTopics += (int) topics.stream().filter(Topic::isCompleted).count();
            }
            totalTopicsCount += subTotalTopics;
            completedTopicsCount += subCompletedTopics;

            // Subject quiz accuracy
            List<QuizAttempt> subAttempts = allAttempts.stream()
                    .filter(a -> a.getQuiz() != null && a.getQuiz().getSubject() != null && a.getQuiz().getSubject().getId().equals(sub.getId()))
                    .collect(Collectors.toList());
            double subQuizAcc = subAttempts.isEmpty() ? 70.0 : subAttempts.stream().mapToDouble(a -> a.getPercentage() != null ? a.getPercentage() : 0.0).average().orElse(70.0);

            // Subject flashcards
            List<Flashcard> subCards = allCards.stream()
                    .filter(c -> c.getSubject() != null && c.getSubject().getId().equals(sub.getId()))
                    .collect(Collectors.toList());
            int masteredSubCards = (int) subCards.stream().filter(c -> c.getRepetitions() != null && c.getRepetitions() >= 2).count();

            // Subject mistakes
            List<MistakeRecord> subMistakes = allMistakes.stream()
                    .filter(m -> m.getSubject() != null && m.getSubject().getId().equals(sub.getId()))
                    .collect(Collectors.toList());
            int unresolvedSubMistakes = (int) subMistakes.stream().filter(m -> "UNRESOLVED".equalsIgnoreCase(m.getStatus())).count();

            // Subject days to exam
            Integer subDaysToExam = null;
            Optional<ExamTarget> subExam = upcomingExams.stream()
                    .filter(e -> e.getSubject() != null && e.getSubject().getId().equals(sub.getId()))
                    .findFirst();
            if (subExam.isPresent()) {
                subDaysToExam = (int) ChronoUnit.DAYS.between(LocalDate.now(), subExam.get().getExamDate());
            }

            // Subject composite readiness
            double subCoverage = subTotalTopics > 0 ? ((double) subCompletedTopics / subTotalTopics) * 100.0 : 60.0;
            double subFlashRate = subCards.isEmpty() ? 75.0 : ((double) masteredSubCards / subCards.size()) * 100.0;
            double subMistakeHealth = subMistakes.isEmpty() ? 90.0 : Math.max(20.0, 100.0 - (unresolvedSubMistakes * 12.0));

            int subReadiness = (int) Math.round(
                    0.30 * subCoverage +
                    0.30 * subQuizAcc +
                    0.20 * subFlashRate +
                    0.20 * subMistakeHealth
            );
            subReadiness = Math.min(100, Math.max(10, subReadiness));

            String status = subReadiness >= 85 ? "EXEMPLARY" : (subReadiness >= 70 ? "READY" : (subReadiness >= 50 ? "DEVELOPING" : "CRITICAL"));

            subjectDtos.add(ReadinessScoreDto.SubjectReadinessDto.builder()
                    .subjectId(sub.getId())
                    .subjectName(sub.getName())
                    .subjectCode(sub.getCode())
                    .readinessScore(subReadiness)
                    .status(status)
                    .totalTopics(subTotalTopics)
                    .completedTopics(subCompletedTopics)
                    .syllabusCoveragePercent(Math.round(subCoverage * 10.0) / 10.0)
                    .quizAccuracyPercent(Math.round(subQuizAcc * 10.0) / 10.0)
                    .totalFlashcards(subCards.size())
                    .masteredFlashcards(masteredSubCards)
                    .unresolvedMistakes(unresolvedSubMistakes)
                    .daysToExam(subDaysToExam)
                    .build());
        }

        // 1. Syllabus coverage score (25%)
        int syllabusScore = totalTopicsCount > 0 ? (int) Math.round(((double) completedTopicsCount / totalTopicsCount) * 100.0) : 60;

        // 2. Quiz accuracy score (30%)
        Double avgQuizPct = quizAttemptRepository.getAveragePercentageByUserId(user.getId());
        int quizScore = avgQuizPct != null ? (int) Math.round(avgQuizPct) : 72;

        // 3. Flashcard SM-2 mastery score (20%)
        int totalCards = allCards.size();
        int masteredCards = (int) allCards.stream().filter(c -> c.getRepetitions() != null && c.getRepetitions() >= 2).count();
        int flashcardScore = totalCards > 0 ? (int) Math.round(((double) masteredCards / totalCards) * 100.0) : 75;

        // 4. Mistake resolution score (15%)
        long totalMistakes = allMistakes.size();
        long resolvedMistakes = allMistakes.stream().filter(m -> "MASTERED".equalsIgnoreCase(m.getStatus()) || "RESOLVED".equalsIgnoreCase(m.getStatus())).count();
        int mistakeScore = totalMistakes > 0 ? (int) Math.round(((double) resolvedMistakes / totalMistakes) * 100.0) : 85;

        // 5. Consistency score (10%)
        long completedTasks = studyTaskRepository.countByUserIdAndStatus(user.getId(), "COMPLETED");
        long completedSessions = studySessionRepository.countCompletedSessionsByUserId(user.getId());
        long completedPlanItems = studyPlanItemRepository.countByUserIdAndCompletedTrue(user.getId());
        int consistencyScore = Math.min(100, (int) (40 + (completedTasks * 6) + (completedSessions * 8) + (completedPlanItems * 10)));

        // Overall Weighted Composite
        int overallScore = (int) Math.round(
                0.25 * syllabusScore +
                0.30 * quizScore +
                0.20 * flashcardScore +
                0.15 * mistakeScore +
                0.10 * consistencyScore
        );
        overallScore = Math.min(100, Math.max(10, overallScore));

        String readinessStatus;
        String statusDescription;
        if (overallScore >= 88) {
            readinessStatus = "EXEMPLARY";
            statusDescription = "Exceptional preparation! High retention, few unresolved errors, and strong diagnostic performance.";
        } else if (overallScore >= 72) {
            readinessStatus = "READY";
            statusDescription = "Well-prepared for examination conditions. Focus on targeted revision of fringe concepts.";
        } else if (overallScore >= 50) {
            readinessStatus = "DEVELOPING";
            statusDescription = "Approaching readiness. Key syllabus topics and mistake patterns require dedicated review.";
        } else {
            readinessStatus = "CRITICAL";
            statusDescription = "Urgent diagnostic intervention recommended. High volume of unmastered errors and untested topics.";
        }

        // Nearest Exam
        Integer daysToNearest = null;
        if (nearestExam != null) {
            daysToNearest = (int) ChronoUnit.DAYS.between(LocalDate.now(), nearestExam.getExamDate());
        }

        // Recommendations
        List<String> recommendations = new ArrayList<>();
        if (quizScore < 70) {
            recommendations.add("Take 2 timed practice quizzes to lift overall diagnostic accuracy above the 75% benchmark.");
        }
        if (syllabusScore < 50) {
            recommendations.add("Complete remaining syllabus topic notes to expand core subject coverage.");
        }
        if (allCards.stream().anyMatch(c -> c.getNextReviewDate() != null && !c.getNextReviewDate().isAfter(LocalDate.now()))) {
            recommendations.add("Review overdue SM-2 flashcard decks today to protect long-term memory retention curves.");
        }
        if (allMistakes.stream().anyMatch(m -> "UNRESOLVED".equalsIgnoreCase(m.getStatus()))) {
            recommendations.add("Clear unmastered mistake records in the Mistake Intelligence drawer to prevent repeated exam deductions.");
        }
        if (recommendations.isEmpty()) {
            recommendations.add("Maintain consistency with daily Pomodoro focus sessions and mock exams.");
            recommendations.add("Review high-yield flashcard decks 48 hours prior to your target exam.");
        }

        return ReadinessScoreDto.builder()
                .overallReadiness(overallScore)
                .readinessStatus(readinessStatus)
                .statusDescription(statusDescription)
                .syllabusCoverageScore(syllabusScore)
                .quizAccuracyScore(quizScore)
                .flashcardMasteryScore(flashcardScore)
                .mistakeResolutionScore(mistakeScore)
                .consistencyScore(consistencyScore)
                .nearestExamId(nearestExam != null ? nearestExam.getId() : null)
                .nearestExamTitle(nearestExam != null ? nearestExam.getTitle() : null)
                .nearestExamDate(nearestExam != null ? nearestExam.getExamDate() : null)
                .daysToNearestExam(daysToNearest)
                .targetScore(nearestExam != null ? nearestExam.getTargetScore() : 85)
                .subjectBreakdowns(subjectDtos)
                .keyRecommendations(recommendations)
                .build();
    }

    // ==========================================
    // COMPREHENSIVE ANALYTICS FOR /analytics
    // ==========================================

    @Transactional(readOnly = true)
    public AnalyticsDto getComprehensiveAnalytics(String userEmail) {
        User user = getUserByEmail(userEmail);
        ReadinessScoreDto readiness = getReadinessOverview(userEmail);

        // Study Time & Velocity
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime startOfWeek = LocalDate.now().minusDays(6).atStartOfDay();

        Integer totalMins = studySessionRepository.getTotalMinutesStudiedSince(user.getId(), LocalDateTime.of(2000, 1, 1, 0, 0));
        Integer todayMins = studySessionRepository.getTotalMinutesStudiedSince(user.getId(), startOfToday);
        Integer weekMins = studySessionRepository.getTotalMinutesStudiedSince(user.getId(), startOfWeek);

        // 7-day study history
        List<StudySession> recentSessions = studySessionRepository.findByUserIdOrderByStartTimeDesc(user.getId());
        List<AnalyticsDto.DailyStudyPoint> history = new ArrayList<>();
        LocalDate today = LocalDate.now();
        DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("EEE");

        for (int i = 6; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            int dayMinutes = recentSessions.stream()
                    .filter(s -> s.getStartTime() != null && s.getStartTime().toLocalDate().equals(day))
                    .mapToInt(s -> s.getActualDurationMinutes() != null ? s.getActualDurationMinutes() : 0)
                    .sum();
            int dayCount = (int) recentSessions.stream()
                    .filter(s -> s.getStartTime() != null && s.getStartTime().toLocalDate().equals(day))
                    .count();

            history.add(AnalyticsDto.DailyStudyPoint.builder()
                    .date(day)
                    .dayOfWeek(day.format(dayFormatter))
                    .studyMinutes(dayMinutes)
                    .sessionsCount(dayCount)
                    .build());
        }

        // Quiz Performances
        List<QuizAttempt> attempts = quizAttemptRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        Double avgPercentage = quizAttemptRepository.getAveragePercentageByUserId(user.getId());

        List<AnalyticsDto.QuizPerformancePoint> quizPoints = attempts.stream()
                .limit(8)
                .map(a -> AnalyticsDto.QuizPerformancePoint.builder()
                        .attemptId(a.getId())
                        .quizTitle(a.getQuiz() != null ? a.getQuiz().getTitle() : "Practice Quiz")
                        .score(a.getScoreObtained() != null ? a.getScoreObtained() : 0.0)
                        .percentage(a.getPercentage() != null ? a.getPercentage() : 0.0)
                        .passed(Boolean.TRUE.equals(a.getPassed()))
                        .completedDate(a.getCreatedAt() != null ? a.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM dd")) : "Recent")
                        .build())
                .collect(Collectors.toList());

        // Flashcards retention
        List<Flashcard> cards = flashcardRepository.findByUserIdOrderByNextReviewDateAsc(user.getId());
        int masteredCards = (int) cards.stream().filter(c -> c.getRepetitions() != null && c.getRepetitions() >= 2).count();
        int overdueCards = (int) cards.stream().filter(c -> c.getNextReviewDate() != null && !c.getNextReviewDate().isAfter(today)).count();

        List<FlashcardReview> reviews = flashcardReviewRepository.findByUserIdOrderByReviewedAtDesc(user.getId());
        Map<String, Integer> ratingDist = new HashMap<>();
        ratingDist.put("AGAIN", 0);
        ratingDist.put("HARD", 0);
        ratingDist.put("GOOD", 0);
        ratingDist.put("EASY", 0);
        for (FlashcardReview r : reviews) {
            String rate = r.getRating() != null ? r.getRating().toUpperCase() : "GOOD";
            ratingDist.put(rate, ratingDist.getOrDefault(rate, 0) + 1);
        }

        // Mistakes
        List<MistakeRecord> mistakes = mistakeRecordRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        int masteredMistakes = (int) mistakes.stream().filter(m -> "MASTERED".equalsIgnoreCase(m.getStatus()) || "RESOLVED".equalsIgnoreCase(m.getStatus())).count();
        int unresolvedMistakes = (int) mistakes.stream().filter(m -> "UNRESOLVED".equalsIgnoreCase(m.getStatus())).count();
        double resRate = mistakes.isEmpty() ? 100.0 : ((double) masteredMistakes / mistakes.size()) * 100.0;

        Map<String, Integer> categoryDist = new HashMap<>();
        categoryDist.put("CONCEPTUAL", 0);
        categoryDist.put("CALCULATION", 0);
        categoryDist.put("MISREAD", 0);
        categoryDist.put("FACTUAL", 0);
        for (MistakeRecord m : mistakes) {
            String cat = m.getMistakeCategory() != null ? m.getMistakeCategory().toUpperCase() : "CONCEPTUAL";
            categoryDist.put(cat, categoryDist.getOrDefault(cat, 0) + 1);
        }

        long completedTasks = studyTaskRepository.countByUserIdAndStatus(user.getId(), "COMPLETED");
        long totalTasks = studyTaskRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).size();

        // Calculate simple streak: count consecutive recent days with study sessions
        int streak = 0;
        for (int i = 0; i < 30; i++) {
            LocalDate checkDay = today.minusDays(i);
            boolean hadSession = recentSessions.stream().anyMatch(s -> s.getStartTime() != null && s.getStartTime().toLocalDate().equals(checkDay));
            if (hadSession) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }
        if (streak == 0 && todayMins != null && todayMins > 0) {
            streak = 1;
        }

        return AnalyticsDto.builder()
                .readiness(readiness)
                .totalStudyMinutes(totalMins != null ? totalMins : 0)
                .todayStudyMinutes(todayMins != null ? todayMins : 0)
                .thisWeekStudyMinutes(weekMins != null ? weekMins : 0)
                .currentStreakDays(streak)
                .completedTasksCount((int) completedTasks)
                .totalTasksCount((int) totalTasks)
                .studyTimeHistory(history)
                .totalQuizzesTaken(attempts.size())
                .overallAverageScore(avgPercentage != null ? Math.round(avgPercentage * 10.0) / 10.0 : 0.0)
                .recentQuizPerformances(quizPoints)
                .totalFlashcards(cards.size())
                .cardsMastered(masteredCards)
                .cardsOverdue(overdueCards)
                .ratingDistribution(ratingDist)
                .totalMistakesLogged(mistakes.size())
                .mistakesMastered(masteredMistakes)
                .unresolvedMistakes(unresolvedMistakes)
                .mistakeResolutionRate(Math.round(resRate * 10.0) / 10.0)
                .mistakesByCategory(categoryDist)
                .build();
    }
}
