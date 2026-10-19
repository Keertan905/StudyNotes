package com.studyapp.backend.service;

import com.studyapp.backend.dto.KnowledgeGapDto;
import com.studyapp.backend.dto.RecommendationDto;
import com.studyapp.backend.exception.ResourceNotFoundException;
import com.studyapp.backend.model.*;
import com.studyapp.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final MistakeRecordRepository mistakeRecordRepository;
    private final FlashcardRepository flashcardRepository;
    private final KnowledgeGapService knowledgeGapService;
    private final UserRepository userRepository;

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional(readOnly = true)
    public RecommendationDto.RecommendationResponse getAdaptiveRecommendations(String userEmail) {
        User user = getUserByEmail(userEmail);
        List<RecommendationDto.RecommendationItem> items = new ArrayList<>();

        // 1. Check Unresolved Mistakes (Highest urgency)
        List<MistakeRecord> unresolvedMistakes = mistakeRecordRepository.findByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), "UNRESOLVED");
        if (!unresolvedMistakes.isEmpty()) {
            MistakeRecord first = unresolvedMistakes.get(0);
            String subName = first.getSubject() != null ? first.getSubject().getName() : "Your Courses";
            items.add(RecommendationDto.RecommendationItem.builder()
                    .id("rec-mistake-" + first.getId())
                    .type("MISTAKE_RETRY")
                    .priority("CRITICAL")
                    .title("Resolve " + unresolvedMistakes.size() + " Misconceptions in " + subName)
                    .description("You missed questions categorized as " + first.getMistakeCategory().replace('_', ' ') + ". Re-attempting missed questions is proven to double retention.")
                    .reason(first.getAiRevisionTip() != null ? first.getAiRevisionTip() : "Immediate retrieval practice prevents repeated exam errors.")
                    .subjectId(first.getSubject() != null ? first.getSubject().getId() : null)
                    .subjectName(subName)
                    .topicTag(first.getQuestion() != null ? first.getQuestion().getTopicTag() : null)
                    .actionUrl("/mistakes")
                    .buttonText("Open Mistake Notebook")
                    .build());
        }

        // 2. Check Overdue Flashcards
        List<Flashcard> dueCards = flashcardRepository.findDueForReview(user.getId(), LocalDate.now());
        if (!dueCards.isEmpty()) {
            Flashcard sample = dueCards.get(0);
            String subName = sample.getSubject() != null ? sample.getSubject().getName() : "General";
            items.add(RecommendationDto.RecommendationItem.builder()
                    .id("rec-flashcard-due")
                    .type("FLASHCARD_REVIEW")
                    .priority(dueCards.size() > 10 ? "CRITICAL" : "RECOMMENDED")
                    .title("Review " + dueCards.size() + " Spaced Repetition Cards")
                    .description("SM-2 algorithm scheduled these cards for optimal memory consolidation today.")
                    .reason("Cards reviewed today reset memory decay intervals for up to 2-3 weeks.")
                    .subjectId(sample.getSubject() != null ? sample.getSubject().getId() : null)
                    .subjectName(subName)
                    .actionUrl("/flashcards")
                    .buttonText("Start 5-Min Review")
                    .build());
        }

        // 3. Check Knowledge Gaps & Decay Risk
        KnowledgeGapDto.KnowledgeGapResponse gaps = knowledgeGapService.analyzeGaps(userEmail);
        if (gaps.getHighPriorityGaps() != null) {
            for (KnowledgeGapDto.TopicGapItem gap : gaps.getHighPriorityGaps()) {
                if (items.size() >= 5) break;

                if ("WEAK".equals(gap.getMasteryLevel())) {
                    items.add(RecommendationDto.RecommendationItem.builder()
                            .id("rec-gap-" + gap.getSubjectId() + "-" + Math.abs(gap.getTopicTag().hashCode()))
                            .type("QUIZ_PRACTICE")
                            .priority("CRITICAL")
                            .title("Strengthen Weak Area: " + gap.getTopicTag())
                            .description("Accuracy is currently " + gap.getAccuracyPercentage() + "% across " + gap.getTotalQuestionsAttempted() + " questions in " + gap.getSubjectName() + ".")
                            .reason(gap.getRecommendedAction())
                            .subjectId(gap.getSubjectId())
                            .subjectName(gap.getSubjectName())
                            .topicTag(gap.getTopicTag())
                            .actionUrl("/quiz?topic=" + gap.getTopicTag() + "&subjectName=" + gap.getSubjectName())
                            .buttonText("Generate Targeted Quiz")
                            .build());
                } else if ("HIGH".equals(gap.getDecayRisk())) {
                    items.add(RecommendationDto.RecommendationItem.builder()
                            .id("rec-decay-" + gap.getSubjectId() + "-" + Math.abs(gap.getTopicTag().hashCode()))
                            .type("ASK_TUTOR")
                            .priority("RECOMMENDED")
                            .title("Memory Decay Alert: " + gap.getTopicTag())
                            .description("Not practiced for " + gap.getDaysSinceLastPracticed() + " days. Risk of forgetting core exam definitions.")
                            .reason("Ask the AI Tutor for a quick refresher summary.")
                            .subjectId(gap.getSubjectId())
                            .subjectName(gap.getSubjectName())
                            .topicTag(gap.getTopicTag())
                            .actionUrl("/tutor?topic=" + gap.getTopicTag())
                            .buttonText("Consult AI Tutor")
                            .build());
                }
            }
        }

        // If list is small, add a general recommendation
        if (items.isEmpty()) {
            items.add(RecommendationDto.RecommendationItem.builder()
                    .id("rec-default-timer")
                    .type("READ_NOTES")
                    .priority("RECOMMENDED")
                    .title("Deep Focus Session")
                    .description("All current flashcards and errors are up to date! Log a 25-minute Pomodoro focus block.")
                    .reason("Consistent daily deep focus hours boost semester exam scores by up to 34%.")
                    .actionUrl("/timer")
                    .buttonText("Launch Focus Timer")
                    .build());
        }

        String headline = !unresolvedMistakes.isEmpty()
                ? "You have " + unresolvedMistakes.size() + " active misconception" + (unresolvedMistakes.size() > 1 ? "s" : "") + " to clear."
                : (gaps.getCriticalWeakAreas() > 0
                ? "Targeting " + gaps.getCriticalWeakAreas() + " high-yield weak topic" + (gaps.getCriticalWeakAreas() > 1 ? "s" : "") + " for today."
                : "Great mastery velocity! Maintain your retention with spaced reviews.");

        String advisory = "Our adaptive engine prioritized these actions based on your recent quiz error patterns, SM-2 decay timestamps, and topic accuracy benchmarks.";

        return RecommendationDto.RecommendationResponse.builder()
                .studentHeadline(headline)
                .aiAdvisory(advisory)
                .items(items)
                .build();
    }
}
