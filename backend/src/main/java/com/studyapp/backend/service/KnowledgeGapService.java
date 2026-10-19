package com.studyapp.backend.service;

import com.studyapp.backend.dto.KnowledgeGapDto;
import com.studyapp.backend.exception.ResourceNotFoundException;
import com.studyapp.backend.model.*;
import com.studyapp.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class KnowledgeGapService {

    private final QuizAttemptRepository quizAttemptRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional(readOnly = true)
    public KnowledgeGapDto.KnowledgeGapResponse analyzeGaps(String userEmail) {
        User user = getUserByEmail(userEmail);
        List<Subject> subjects = subjectRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        List<QuizAttempt> attempts = quizAttemptRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        // Aggregate stats per subject and topic
        // key: "subjectId::topicTag"
        Map<String, TopicAggregator> aggMap = new HashMap<>();

        for (QuizAttempt attempt : attempts) {
            Subject sub = attempt.getQuiz() != null ? attempt.getQuiz().getSubject() : null;
            Long subId = sub != null ? sub.getId() : 0L;
            String subName = sub != null ? sub.getName() : "General Studies";

            List<UserAnswer> answers = userAnswerRepository.findByQuizAttemptIdOrderByIdAsc(attempt.getId());
            for (UserAnswer ans : answers) {
                Question q = ans.getQuestion();
                if (q == null) continue;

                String topicTag = q.getTopicTag() != null && !q.getTopicTag().isBlank() ? q.getTopicTag().trim() : "General";
                String key = subId + "::" + topicTag;

                TopicAggregator agg = aggMap.computeIfAbsent(key, k -> new TopicAggregator(subId, subName, topicTag));
                agg.totalQuestions++;
                if (Boolean.TRUE.equals(ans.getIsCorrect())) {
                    agg.correctQuestions++;
                }
                LocalDateTime ansTime = ans.getCreatedAt() != null ? ans.getCreatedAt() : attempt.getStartTime();
                if (agg.lastPracticed == null || (ansTime != null && ansTime.isAfter(agg.lastPracticed))) {
                    agg.lastPracticed = ansTime;
                }
            }
        }

        // If no quiz answers yet, create baseline from registered subjects/topics so the UI is educational and complete
        if (aggMap.isEmpty()) {
            for (Subject sub : subjects) {
                for (Unit u : sub.getUnits()) {
                    for (Topic t : u.getTopics()) {
                        String key = sub.getId() + "::" + t.getName();
                        TopicAggregator agg = new TopicAggregator(sub.getId(), sub.getName(), t.getName());
                        agg.totalQuestions = 0;
                        agg.correctQuestions = 0;
                        agg.lastPracticed = LocalDateTime.now().minusDays(10); // Decay alert baseline
                        aggMap.put(key, agg);
                    }
                }
            }
        }

        LocalDateTime now = LocalDateTime.now();
        List<KnowledgeGapDto.TopicGapItem> allItems = new ArrayList<>();

        int totalWeak = 0;
        int totalMod = 0;
        int totalMastered = 0;
        int totalDecay = 0;
        double sumAccuracy = 0.0;
        int countAccuracyItems = 0;

        for (TopicAggregator agg : aggMap.values()) {
            double accuracy = agg.totalQuestions > 0 ? (agg.correctQuestions * 100.0) / agg.totalQuestions : 0.0;
            accuracy = Math.round(accuracy * 10.0) / 10.0;

            String mastery;
            if (agg.totalQuestions == 0 || accuracy < 60.0) {
                mastery = "WEAK";
                totalWeak++;
            } else if (accuracy < 80.0) {
                mastery = "MODERATE";
                totalMod++;
            } else {
                mastery = "STRONG";
                totalMastered++;
            }

            int daysSince = agg.lastPracticed != null ? (int) Duration.between(agg.lastPracticed, now).toDays() : 14;
            String decay;
            if (daysSince >= 7) {
                decay = "HIGH";
                totalDecay++;
            } else if (daysSince >= 4) {
                decay = "MEDIUM";
            } else {
                decay = "LOW";
            }

            String recAction = "WEAK".equals(mastery)
                    ? "Generate 5-question active recall drill on " + agg.topicTag
                    : ("HIGH".equals(decay)
                    ? "Quick refresher quiz needed — last studied " + daysSince + " days ago"
                    : "Maintain mastery with spaced repetition flashcards");

            if (agg.totalQuestions > 0) {
                sumAccuracy += accuracy;
                countAccuracyItems++;
            }

            allItems.add(KnowledgeGapDto.TopicGapItem.builder()
                    .subjectId(agg.subjectId)
                    .subjectName(agg.subjectName)
                    .topicTag(agg.topicTag)
                    .totalQuestionsAttempted(agg.totalQuestions)
                    .correctAnswers(agg.correctQuestions)
                    .accuracyPercentage(accuracy)
                    .masteryLevel(mastery)
                    .decayRisk(decay)
                    .daysSinceLastPracticed(daysSince)
                    .lastPracticedAt(agg.lastPracticed)
                    .recommendedAction(recAction)
                    .build());
        }

        double overallAcc = countAccuracyItems > 0 ? Math.round((sumAccuracy / countAccuracyItems) * 10.0) / 10.0 : 0.0;

        // Group into Subject summaries
        Map<Long, List<KnowledgeGapDto.TopicGapItem>> bySubject = allItems.stream()
                .collect(Collectors.groupingBy(KnowledgeGapDto.TopicGapItem::getSubjectId));

        List<KnowledgeGapDto.SubjectGapSummary> subjectSummaries = new ArrayList<>();
        for (Map.Entry<Long, List<KnowledgeGapDto.TopicGapItem>> entry : bySubject.entrySet()) {
            List<KnowledgeGapDto.TopicGapItem> sTopics = entry.getValue();
            String sName = sTopics.get(0).getSubjectName();
            double avg = sTopics.stream().mapToDouble(KnowledgeGapDto.TopicGapItem::getAccuracyPercentage).average().orElse(0.0);

            long wCount = sTopics.stream().filter(t -> "WEAK".equals(t.getMasteryLevel())).count();
            long mCount = sTopics.stream().filter(t -> "MODERATE".equals(t.getMasteryLevel())).count();
            long sCount = sTopics.stream().filter(t -> "STRONG".equals(t.getMasteryLevel())).count();

            subjectSummaries.add(KnowledgeGapDto.SubjectGapSummary.builder()
                    .subjectId(entry.getKey())
                    .subjectName(sName)
                    .topicsCount(sTopics.size())
                    .averageAccuracy(Math.round(avg * 10.0) / 10.0)
                    .weakTopicsCount((int) wCount)
                    .moderateTopicsCount((int) mCount)
                    .strongTopicsCount((int) sCount)
                    .topics(sTopics)
                    .build());
        }

        // Sort priority gaps: Weak first, then High Decay
        List<KnowledgeGapDto.TopicGapItem> priorityGaps = allItems.stream()
                .sorted(Comparator.comparingInt((KnowledgeGapDto.TopicGapItem t) -> "WEAK".equals(t.getMasteryLevel()) ? 0 : 1)
                        .thenComparing(KnowledgeGapDto.TopicGapItem::getAccuracyPercentage))
                .limit(8)
                .collect(Collectors.toList());

        return KnowledgeGapDto.KnowledgeGapResponse.builder()
                .totalTopicsAssessed(allItems.size())
                .criticalWeakAreas(totalWeak)
                .moderateAreas(totalMod)
                .masteredAreas(totalMastered)
                .overallAccuracy(overallAcc)
                .decayAlertsCount(totalDecay)
                .subjects(subjectSummaries)
                .highPriorityGaps(priorityGaps)
                .build();
    }

    private static class TopicAggregator {
        Long subjectId;
        String subjectName;
        String topicTag;
        int totalQuestions = 0;
        int correctQuestions = 0;
        LocalDateTime lastPracticed;

        TopicAggregator(Long subId, String subName, String topicTag) {
            this.subjectId = subId;
            this.subjectName = subName;
            this.topicTag = topicTag;
        }
    }
}
