package com.studyapp.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyapp.backend.ai.AiProvider;
import com.studyapp.backend.dto.MistakeDto;
import com.studyapp.backend.exception.ResourceNotFoundException;
import com.studyapp.backend.model.*;
import com.studyapp.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MistakeService {

    private final MistakeRecordRepository mistakeRecordRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final AiProvider aiProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional
    public MistakeRecord recordMistake(User user, Question question, QuizAttempt attempt, String submittedAnswer) {
        // Check if an unresolved mistake for this user and question already exists
        Optional<MistakeRecord> existing = mistakeRecordRepository.findByUserIdAndQuestionId(user.getId(), question.getId());
        if (existing.isPresent()) {
            MistakeRecord rec = existing.get();
            rec.setSubmittedAnswer(submittedAnswer);
            rec.setStatus("UNRESOLVED");
            rec.setLastAttemptedAt(LocalDateTime.now());
            rec.setQuizAttempt(attempt);
            return mistakeRecordRepository.save(rec);
        }

        // Determine category & analysis
        String category = classifyMistakeCategory(question, submittedAnswer);
        String[] analysis = generateAiRootCauseAndTip(question, submittedAnswer, category);

        Subject subject = question.getQuiz() != null ? question.getQuiz().getSubject() : null;

        MistakeRecord record = MistakeRecord.builder()
                .user(user)
                .question(question)
                .quizAttempt(attempt)
                .subject(subject)
                .submittedAnswer(submittedAnswer)
                .mistakeCategory(category)
                .aiRootCause(analysis[0])
                .aiRevisionTip(analysis[1])
                .status("UNRESOLVED")
                .retryCount(0)
                .lastAttemptedAt(LocalDateTime.now())
                .build();

        MistakeRecord saved = mistakeRecordRepository.save(record);
        log.info("Recorded mistake ID: {} for user: {} on question ID: {}", saved.getId(), user.getEmail(), question.getId());
        return saved;
    }

    private String classifyMistakeCategory(Question question, String submittedAnswer) {
        String qText = question.getQuestionText() != null ? question.getQuestionText().toLowerCase() : "";
        if (qText.contains("calculate") || qText.contains("solve") || qText.contains("how many") || qText.matches(".*\\d+.*[+\\-*/=].*")) {
            return "CALCULATION_ERROR";
        }
        if (qText.contains("not ") || qText.contains("except") || qText.contains("incorrect") || qText.contains("false")) {
            return "MISREAD_QUESTION";
        }
        if (qText.contains("define") || qText.contains("what is") || qText.contains("acronym") || qText.contains("name of")) {
            return "MEMORY_LAPSE";
        }
        return "CONCEPTUAL_GAP";
    }

    private String[] generateAiRootCauseAndTip(Question question, String submittedAnswer, String category) {
        String qText = question.getQuestionText();
        String cAns = question.getCorrectAnswer();
        String explanation = question.getExplanation();

        if (aiProvider.isConfigured()) {
            try {
                String prompt = "A student answered a university exam question incorrectly.\n"
                        + "Question: " + qText + "\n"
                        + "Correct Answer: " + cAns + "\n"
                        + "Student's Answer: " + (submittedAnswer != null ? submittedAnswer : "(blank)") + "\n"
                        + "Explanation: " + (explanation != null ? explanation : "") + "\n"
                        + "Mistake Category: " + category + "\n\n"
                        + "Output exactly two sentences in JSON format: {\"rootCause\": \"...\", \"revisionTip\": \"...\"}";

                String res = aiProvider.generate("You are an educational diagnostician identifying student misconceptions.", prompt);
                String cleaned = res.trim();
                int sIdx = cleaned.indexOf('{');
                int eIdx = cleaned.lastIndexOf('}');
                if (sIdx != -1 && eIdx != -1 && eIdx > sIdx) {
                    cleaned = cleaned.substring(sIdx, eIdx + 1);
                    var node = objectMapper.readTree(cleaned);
                    String root = node.has("rootCause") ? node.get("rootCause").asText() : null;
                    String tip = node.has("revisionTip") ? node.get("revisionTip").asText() : null;
                    if (root != null && tip != null) {
                        return new String[]{root, tip};
                    }
                }
            } catch (Exception e) {
                log.warn("AI root cause generation fallback: {}", e.getMessage());
            }
        }

        // Educational heuristic fallback
        String rootCause;
        String revisionTip;

        switch (category) {
            case "CALCULATION_ERROR":
                rootCause = "Discrepancy in intermediate arithmetic or formula derivation steps.";
                revisionTip = "Write out every intermediate step and verify units/coefficients carefully.";
                break;
            case "MISREAD_QUESTION":
                rootCause = "Overlooked a negative constraint (e.g., 'NOT', 'EXCEPT') in the question stem.";
                revisionTip = "Circle or underline qualifying qualifiers in the problem prompt before reviewing options.";
                break;
            case "MEMORY_LAPSE":
                rootCause = "Recall decay regarding the exact technical definition or terminology.";
                revisionTip = "Use active recall flashcards to reinforce memory cues for this specific term.";
                break;
            default:
                rootCause = explanation != null && !explanation.isBlank()
                        ? explanation
                        : "Confusion between the fundamental properties of '" + (question.getTopicTag() != null ? question.getTopicTag() : "this topic") + "' and related concepts.";
                revisionTip = "Review the core definition and compare key differentiating characteristics in your notes.";
                break;
        }

        return new String[]{rootCause, revisionTip};
    }

    @Transactional(readOnly = true)
    public List<MistakeDto.MistakeResponse> getMistakes(String userEmail, String status, Long subjectId) {
        User user = getUserByEmail(userEmail);
        List<MistakeRecord> list;

        if (subjectId != null && status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            list = mistakeRecordRepository.findByUserIdAndSubjectIdAndStatusOrderByCreatedAtDesc(user.getId(), subjectId, status.toUpperCase().trim());
        } else if (subjectId != null) {
            list = mistakeRecordRepository.findByUserIdAndSubjectIdOrderByCreatedAtDesc(user.getId(), subjectId);
        } else if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            list = mistakeRecordRepository.findByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), status.toUpperCase().trim());
        } else {
            list = mistakeRecordRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        }

        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MistakeDto.MistakeStatsResponse getMistakeStats(String userEmail) {
        User user = getUserByEmail(userEmail);
        long total = mistakeRecordRepository.countByUserId(user.getId());
        long unresolved = mistakeRecordRepository.countByUserIdAndStatus(user.getId(), "UNRESOLVED");
        long resolved = mistakeRecordRepository.countByUserIdAndStatus(user.getId(), "RESOLVED");

        double rate = total > 0 ? (resolved * 100.0) / total : 0.0;

        Map<String, Long> categoryMap = new HashMap<>();
        List<Object[]> grouped = mistakeRecordRepository.countGroupedByCategory(user.getId());
        for (Object[] row : grouped) {
            String cat = (String) row[0];
            Long cnt = (Long) row[1];
            categoryMap.put(cat, cnt);
        }

        return MistakeDto.MistakeStatsResponse.builder()
                .totalMistakes(total)
                .unresolvedCount(unresolved)
                .resolvedCount(resolved)
                .resolutionRatePercentage(Math.round(rate * 10.0) / 10.0)
                .categoryBreakdown(categoryMap)
                .build();
    }

    @Transactional
    public MistakeDto.RetryMistakeResponse retryMistake(Long mistakeId, MistakeDto.RetryMistakeRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);
        MistakeRecord record = mistakeRecordRepository.findByIdAndUserId(mistakeId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Mistake record not found or access denied"));

        Question q = record.getQuestion();
        String studentAns = request.getSubmittedAnswer().trim();
        String correctAns = q.getCorrectAnswer().trim();

        boolean isCorrect = false;
        String feedback;

        if ("MCQ".equalsIgnoreCase(q.getQuestionType()) || "TRUE_FALSE".equalsIgnoreCase(q.getQuestionType())) {
            if (studentAns.equalsIgnoreCase(correctAns)
                    || correctAns.toLowerCase().startsWith(studentAns.toLowerCase() + ".")
                    || studentAns.toLowerCase().startsWith(correctAns.toLowerCase() + ".")) {
                isCorrect = true;
            }
        } else {
            // Keyword match for short answer
            String[] keywords = correctAns.toLowerCase().split("\\s+");
            int matches = 0;
            for (String kw : keywords) {
                if (kw.length() > 3 && studentAns.toLowerCase().contains(kw)) {
                    matches++;
                }
            }
            if (matches >= Math.max(1, keywords.length / 3)) {
                isCorrect = true;
            }
        }

        record.setRetryCount(record.getRetryCount() + 1);
        record.setLastAttemptedAt(LocalDateTime.now());

        if (isCorrect) {
            record.setStatus("RESOLVED");
            record.setResolvedAt(LocalDateTime.now());
            feedback = "Correct! You have resolved this misconception. Great job!";
        } else {
            feedback = "Not quite. " + (q.getExplanation() != null ? q.getExplanation() : "Compare your response with the concept tip and try again.");
        }

        mistakeRecordRepository.save(record);
        log.info("Student {} retried mistake ID: {}, result: {}", user.getEmail(), mistakeId, isCorrect ? "CORRECT" : "INCORRECT");

        return MistakeDto.RetryMistakeResponse.builder()
                .isCorrect(isCorrect)
                .feedback(feedback)
                .status(record.getStatus())
                .retryCount(record.getRetryCount())
                .resolvedAt(record.getResolvedAt())
                .build();
    }

    @Transactional
    public MistakeDto.MistakeResponse updateStatus(Long mistakeId, MistakeDto.UpdateStatusRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);
        MistakeRecord record = mistakeRecordRepository.findByIdAndUserId(mistakeId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Mistake record not found"));

        String newStatus = request.getStatus().toUpperCase().trim();
        record.setStatus(newStatus);
        if ("RESOLVED".equals(newStatus) && record.getResolvedAt() == null) {
            record.setResolvedAt(LocalDateTime.now());
        }

        MistakeRecord saved = mistakeRecordRepository.save(record);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteMistake(Long mistakeId, String userEmail) {
        User user = getUserByEmail(userEmail);
        MistakeRecord record = mistakeRecordRepository.findByIdAndUserId(mistakeId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Mistake record not found"));

        mistakeRecordRepository.delete(record);
    }

    private MistakeDto.MistakeResponse mapToResponse(MistakeRecord m) {
        Question q = m.getQuestion();
        List<String> options = new ArrayList<>();
        if (q.getOptionsJson() != null) {
            try {
                options = objectMapper.readValue(q.getOptionsJson(), new TypeReference<List<String>>() {});
            } catch (Exception ignored) {}
        }

        Subject sub = m.getSubject() != null ? m.getSubject() : (q.getQuiz() != null ? q.getQuiz().getSubject() : null);

        return MistakeDto.MistakeResponse.builder()
                .id(m.getId())
                .questionId(q.getId())
                .questionText(q.getQuestionText())
                .questionType(q.getQuestionType())
                .options(options)
                .correctAnswer(q.getCorrectAnswer())
                .submittedAnswer(m.getSubmittedAnswer())
                .explanation(q.getExplanation())
                .topicTag(q.getTopicTag())
                .subjectId(sub != null ? sub.getId() : null)
                .subjectName(sub != null ? sub.getName() : "General")
                .mistakeCategory(m.getMistakeCategory())
                .aiRootCause(m.getAiRootCause())
                .aiRevisionTip(m.getAiRevisionTip())
                .status(m.getStatus())
                .retryCount(m.getRetryCount())
                .lastAttemptedAt(m.getLastAttemptedAt())
                .resolvedAt(m.getResolvedAt())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
