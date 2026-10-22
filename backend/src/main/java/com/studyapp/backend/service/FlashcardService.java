package com.studyapp.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyapp.backend.ai.AiProvider;
import com.studyapp.backend.dto.FlashcardDto;
import com.studyapp.backend.exception.ResourceNotFoundException;
import com.studyapp.backend.model.*;
import com.studyapp.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlashcardService {

    private final FlashcardRepository flashcardRepository;
    private final FlashcardReviewRepository flashcardReviewRepository;
    private final SubjectRepository subjectRepository;
    private final UnitRepository unitRepository;
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;
    private final GamificationService gamificationService;
    private final AiProvider aiProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    public List<FlashcardDto.GeneratedCardItem> generateCards(FlashcardDto.GenerateRequest request) {
        String subject = request.getSubjectName() != null ? request.getSubjectName() : "General Computer Science";
        String topic = request.getTopic() != null ? request.getTopic() : "Core Principles";
        String difficulty = request.getDifficulty() != null ? request.getDifficulty() : "MEDIUM";
        int count = request.getCardCount() != null && request.getCardCount() > 0 ? request.getCardCount() : 5;

        if (aiProvider.isConfigured()) {
            try {
                String systemPrompt = "You are an elite academic tutor creating high-yield active recall flashcards for university examinations.\n"
                        + "You MUST output ONLY a valid JSON array of objects, with NO surrounding markdown or markdown codeblocks (no ```json).\n"
                        + "Each object must have exactly these keys:\n"
                        + "{\n"
                        + "  \"front\": \"Concise, challenging concept question or prompt\",\n"
                        + "  \"back\": \"Direct, accurate, bulleted answer or technical explanation\",\n"
                        + "  \"hint\": \"Optional memory cue or mnemonic\",\n"
                        + "  \"difficulty\": \"" + difficulty + "\",\n"
                        + "  \"topicTag\": \"" + topic + "\"\n"
                        + "}";

                String userPrompt = "Subject: " + subject + "\n"
                        + "Topic: " + topic + "\n"
                        + "Difficulty: " + difficulty + "\n"
                        + "Generate exactly " + count + " flashcard pairs now in pure JSON array format.";

                String rawResponse = aiProvider.generate(systemPrompt, userPrompt);
                List<FlashcardDto.GeneratedCardItem> parsed = parseCardsJson(rawResponse, topic, difficulty);
                if (!parsed.isEmpty()) {
                    return parsed;
                }
            } catch (Exception e) {
                log.warn("AI Flashcard generation failed or returned unparseable JSON: {}", e.getMessage());
            }
        }

        return generateFallbackCards(subject, topic, difficulty, count);
    }

    private List<FlashcardDto.GeneratedCardItem> parseCardsJson(String raw, String defaultTopic, String defaultDifficulty) {
        List<FlashcardDto.GeneratedCardItem> items = new ArrayList<>();
        try {
            String cleaned = raw.trim();
            if (cleaned.startsWith("```json")) {
                cleaned = cleaned.substring(7);
            } else if (cleaned.startsWith("```")) {
                cleaned = cleaned.substring(3);
            }
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3);
            }
            cleaned = cleaned.trim();

            int startIdx = cleaned.indexOf('[');
            int endIdx = cleaned.lastIndexOf(']');
            if (startIdx != -1 && endIdx != -1 && endIdx > startIdx) {
                cleaned = cleaned.substring(startIdx, endIdx + 1);
            }

            JsonNode root = objectMapper.readTree(cleaned);
            if (root.isArray()) {
                for (JsonNode node : root) {
                    items.add(FlashcardDto.GeneratedCardItem.builder()
                            .front(node.path("front").asText("Concept Question"))
                            .back(node.path("back").asText("Technical Explanation"))
                            .hint(node.path("hint").asText(null))
                            .difficulty(node.path("difficulty").asText(defaultDifficulty))
                            .topicTag(node.path("topicTag").asText(defaultTopic))
                            .build());
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse JSON flashcards: {}", e.getMessage());
        }
        return items;
    }

    private List<FlashcardDto.GeneratedCardItem> generateFallbackCards(String subject, String topic, String difficulty, int count) {
        List<FlashcardDto.GeneratedCardItem> list = new ArrayList<>();

        list.add(FlashcardDto.GeneratedCardItem.builder()
                .front("What is the primary role of " + topic + " in " + subject + "?")
                .back("Provides an abstraction layer that guarantees deterministic execution, isolation, and optimal resource scheduling.")
                .hint("Think about resource mediation and abstraction.")
                .difficulty(difficulty)
                .topicTag(topic)
                .build());

        list.add(FlashcardDto.GeneratedCardItem.builder()
                .front("What are the key trade-offs when optimizing " + topic + "?")
                .back("1. Space vs. Time complexity\n2. Synchronization latency vs. Throughput\n3. Implementation simplicity vs. Peak performance")
                .hint("Latency vs. Memory bounds.")
                .difficulty(difficulty)
                .topicTag(topic)
                .build());

        list.add(FlashcardDto.GeneratedCardItem.builder()
                .front("How does " + topic + " prevent data inconsistency or race hazards?")
                .back("By utilizing atomic operations, locking protocols (mutexes/semaphores), or immutable state representations.")
                .hint("Synchronization primitives.")
                .difficulty(difficulty)
                .topicTag(topic)
                .build());

        list.add(FlashcardDto.GeneratedCardItem.builder()
                .front("Explain the worst-case failure mode associated with " + topic + ".")
                .back("Thrashing, deadlock, or resource starvation caused by unbounded queueing or cyclic dependency graphs.")
                .hint("System degradation under high load.")
                .difficulty(difficulty)
                .topicTag(topic)
                .build());

        list.add(FlashcardDto.GeneratedCardItem.builder()
                .front("State the standard mathematical or algorithmic invariant governing " + topic + ".")
                .back("Conservation of state transitions and bounded execution guarantees (e.g., progress and safety properties).")
                .hint("Safety and liveness properties.")
                .difficulty(difficulty)
                .topicTag(topic)
                .build());

        if (count < list.size()) {
            return new ArrayList<>(list.subList(0, count));
        }
        return list;
    }

    @Transactional
    public FlashcardDto.CardResponse createCard(FlashcardDto.CreateCardRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);

        Subject subject = null;
        if (request.getSubjectId() != null) {
            subject = subjectRepository.findByIdAndUserId(request.getSubjectId(), user.getId()).orElse(null);
        }

        Unit unit = null;
        if (request.getUnitId() != null) {
            unit = unitRepository.findByIdAndSubjectUserId(request.getUnitId(), user.getId()).orElse(null);
        }

        Topic topic = null;
        if (request.getTopicId() != null) {
            topic = topicRepository.findByIdAndUnitSubjectUserId(request.getTopicId(), user.getId()).orElse(null);
        }

        Flashcard card = Flashcard.builder()
                .user(user)
                .subject(subject)
                .unit(unit)
                .topic(topic)
                .front(request.getFront().trim())
                .back(request.getBack().trim())
                .hint(request.getHint() != null ? request.getHint().trim() : null)
                .difficulty(request.getDifficulty() != null ? request.getDifficulty() : "MEDIUM")
                .intervalDays(1)
                .easeFactor(2.5)
                .repetitions(0)
                .nextReviewDate(LocalDate.now())
                .reviewCount(0)
                .build();

        Flashcard saved = flashcardRepository.save(card);
        log.info("Created flashcard ID: {} for user {}", saved.getId(), user.getEmail());
        return mapToResponse(saved);
    }

    @Transactional
    public List<FlashcardDto.CardResponse> batchSaveCards(FlashcardDto.BatchSaveRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);

        Subject subject = null;
        if (request.getSubjectId() != null) {
            subject = subjectRepository.findByIdAndUserId(request.getSubjectId(), user.getId()).orElse(null);
        }

        Unit unit = null;
        if (request.getUnitId() != null) {
            unit = unitRepository.findByIdAndSubjectUserId(request.getUnitId(), user.getId()).orElse(null);
        }

        Topic topic = null;
        if (request.getTopicId() != null) {
            topic = topicRepository.findByIdAndUnitSubjectUserId(request.getTopicId(), user.getId()).orElse(null);
        }

        List<Flashcard> cardsToSave = new ArrayList<>();
        if (request.getCards() != null) {
            for (FlashcardDto.GeneratedCardItem item : request.getCards()) {
                cardsToSave.add(Flashcard.builder()
                        .user(user)
                        .subject(subject)
                        .unit(unit)
                        .topic(topic)
                        .front(item.getFront().trim())
                        .back(item.getBack().trim())
                        .hint(item.getHint())
                        .difficulty(item.getDifficulty() != null ? item.getDifficulty() : "MEDIUM")
                        .intervalDays(1)
                        .easeFactor(2.5)
                        .repetitions(0)
                        .nextReviewDate(LocalDate.now())
                        .reviewCount(0)
                        .build());
            }
        }

        List<Flashcard> saved = flashcardRepository.saveAll(cardsToSave);
        log.info("Batch saved {} flashcards for user {}", saved.size(), user.getEmail());
        return saved.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FlashcardDto.CardResponse> getCards(String userEmail, Long subjectId) {
        User user = getUserByEmail(userEmail);
        List<Flashcard> list = (subjectId != null)
                ? flashcardRepository.findByUserIdAndSubjectIdOrderByNextReviewDateAsc(user.getId(), subjectId)
                : flashcardRepository.findByUserIdOrderByNextReviewDateAsc(user.getId());

        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FlashcardDto.CardResponse> getDueCards(String userEmail) {
        User user = getUserByEmail(userEmail);
        List<Flashcard> due = flashcardRepository.findDueForReview(user.getId(), LocalDate.now());
        return due.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public FlashcardDto.CardResponse reviewCard(Long cardId, FlashcardDto.ReviewCardRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);
        Flashcard card = flashcardRepository.findByIdAndUserId(cardId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Flashcard not found or access denied"));

        int prevInterval = card.getIntervalDays() != null ? card.getIntervalDays() : 1;
        double prevEase = card.getEaseFactor() != null ? card.getEaseFactor() : 2.5;
        int reps = card.getRepetitions() != null ? card.getRepetitions() : 0;

        int newInterval;
        double newEase = prevEase;
        String rating = request.getRating().toUpperCase().trim();

        // SM-2 Spaced Repetition Scheduling
        switch (rating) {
            case "AGAIN":
                reps = 0;
                newInterval = 1;
                newEase = Math.max(1.3, prevEase - 0.2);
                break;
            case "HARD":
                newInterval = Math.max(1, (int) Math.round(prevInterval * 1.2));
                newEase = Math.max(1.3, prevEase - 0.15);
                break;
            case "GOOD":
                if (reps == 0) {
                    newInterval = 1;
                } else if (reps == 1) {
                    newInterval = 6;
                } else {
                    newInterval = (int) Math.round(prevInterval * prevEase);
                }
                reps++;
                break;
            case "EASY":
                if (reps == 0) {
                    newInterval = 3;
                } else if (reps == 1) {
                    newInterval = 8;
                } else {
                    newInterval = (int) Math.round(prevInterval * prevEase * 1.3);
                }
                reps++;
                newEase = prevEase + 0.15;
                break;
            default:
                newInterval = 1;
        }

        LocalDate nextDate = LocalDate.now().plusDays(newInterval);

        card.setIntervalDays(newInterval);
        card.setEaseFactor(Math.round(newEase * 100.0) / 100.0);
        card.setRepetitions(reps);
        card.setNextReviewDate(nextDate);
        card.setLastReviewedAt(LocalDateTime.now());
        card.setReviewCount(card.getReviewCount() != null ? card.getReviewCount() + 1 : 1);

        Flashcard savedCard = flashcardRepository.save(card);

        FlashcardReview review = FlashcardReview.builder()
                .flashcard(savedCard)
                .user(user)
                .rating(rating)
                .timeSpentSeconds(request.getTimeSpentSeconds() != null ? request.getTimeSpentSeconds() : 0)
                .previousIntervalDays(prevInterval)
                .newIntervalDays(newInterval)
                .previousEaseFactor(prevEase)
                .newEaseFactor(newEase)
                .build();

        flashcardReviewRepository.save(review);
        log.info("Reviewed flashcard ID: {} with rating '{}'. Next review in {} days ({})", cardId, rating, newInterval, nextDate);

        try {
            gamificationService.awardFlashcardReviewXp(user, review, null);
        } catch (Exception ex) {
            log.warn("Failed to award flashcard review XP: {}", ex.getMessage());
        }

        return mapToResponse(savedCard);
    }

    @Transactional
    public void deleteCard(Long cardId, String userEmail) {
        User user = getUserByEmail(userEmail);
        Flashcard card = flashcardRepository.findByIdAndUserId(cardId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Flashcard not found or access denied"));

        flashcardRepository.delete(card);
        log.info("Deleted flashcard ID: {} for user {}", cardId, user.getEmail());
    }

    @Transactional(readOnly = true)
    public FlashcardDto.FlashcardStatsResponse getStats(String userEmail) {
        User user = getUserByEmail(userEmail);
        List<Flashcard> all = flashcardRepository.findByUserIdOrderByNextReviewDateAsc(user.getId());
        long dueCount = flashcardRepository.countDueForReview(user.getId(), LocalDate.now());
        long totalReviews = flashcardReviewRepository.countByUserId(user.getId());

        long mastered = all.stream().filter(c -> c.getIntervalDays() != null && c.getIntervalDays() >= 21).count();
        long learning = all.size() - mastered;

        return FlashcardDto.FlashcardStatsResponse.builder()
                .totalCards(all.size())
                .dueTodayCount(dueCount)
                .masteredCount(mastered)
                .learningCount(learning)
                .totalReviews(totalReviews)
                .build();
    }

    private FlashcardDto.CardResponse mapToResponse(Flashcard card) {
        boolean isDue = card.getNextReviewDate() == null || !card.getNextReviewDate().isAfter(LocalDate.now());

        return FlashcardDto.CardResponse.builder()
                .id(card.getId())
                .subjectId(card.getSubject() != null ? card.getSubject().getId() : null)
                .subjectName(card.getSubject() != null ? card.getSubject().getName() : null)
                .unitId(card.getUnit() != null ? card.getUnit().getId() : null)
                .unitTitle(card.getUnit() != null ? card.getUnit().getTitle() : null)
                .topicId(card.getTopic() != null ? card.getTopic().getId() : null)
                .topicName(card.getTopic() != null ? card.getTopic().getName() : null)
                .front(card.getFront())
                .back(card.getBack())
                .hint(card.getHint())
                .difficulty(card.getDifficulty())
                .intervalDays(card.getIntervalDays())
                .easeFactor(card.getEaseFactor())
                .repetitions(card.getRepetitions())
                .nextReviewDate(card.getNextReviewDate())
                .lastReviewedAt(card.getLastReviewedAt())
                .reviewCount(card.getReviewCount())
                .isDue(isDue)
                .createdAt(card.getCreatedAt())
                .build();
    }
}
