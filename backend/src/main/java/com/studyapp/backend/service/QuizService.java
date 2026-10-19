package com.studyapp.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyapp.backend.ai.AiProvider;
import com.studyapp.backend.dto.QuizDto;
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
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final SubjectRepository subjectRepository;
    private final UnitRepository unitRepository;
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;
    private final AiProvider aiProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    public List<QuizDto.QuestionItem> generateQuestions(QuizDto.GenerateRequest request) {
        String subject = request.getSubjectName() != null ? request.getSubjectName() : "General Computer Science";
        String topic = request.getTopic() != null ? request.getTopic() : "Core Principles";
        String difficulty = request.getDifficulty() != null ? request.getDifficulty() : "MEDIUM";
        int count = request.getQuestionCount() != null && request.getQuestionCount() > 0 ? request.getQuestionCount() : 5;
        List<String> types = request.getQuestionTypes() != null && !request.getQuestionTypes().isEmpty()
                ? request.getQuestionTypes()
                : List.of("MCQ", "TRUE_FALSE", "SHORT_ANSWER");

        if (aiProvider.isConfigured()) {
            try {
                String systemPrompt = "You are an expert university examiner. You create rigorous, syllabus-aligned examination questions.\n"
                        + "You MUST output ONLY a valid JSON array of objects, with NO surrounding markdown or markdown codeblocks (no ```json).\n"
                        + "Each object must have exactly these keys:\n"
                        + "{\n"
                        + "  \"questionType\": \"MCQ\" | \"TRUE_FALSE\" | \"SHORT_ANSWER\",\n"
                        + "  \"questionText\": \"string question\",\n"
                        + "  \"options\": [\"Option A text\", \"Option B text\", \"Option C text\", \"Option D text\"],\n"
                        + "  \"correctAnswer\": \"Exact option text or True/False or model answer\",\n"
                        + "  \"explanation\": \"Detailed technical explanation why this answer is correct\",\n"
                        + "  \"marks\": 1,\n"
                        + "  \"topicTag\": \"" + topic + "\"\n"
                        + "}\n"
                        + "For TRUE_FALSE questions, options must be [\"True\", \"False\"]. For SHORT_ANSWER, options should be empty [].";

                String userPrompt = "Subject: " + subject + "\n"
                        + "Topic: " + topic + "\n"
                        + "Difficulty: " + difficulty + "\n"
                        + "Allowed Types: " + String.join(", ", types) + "\n"
                        + "Generate exactly " + count + " questions now in pure JSON array format.";

                String rawResponse = aiProvider.generate(systemPrompt, userPrompt);
                List<QuizDto.QuestionItem> parsed = parseQuestionsJson(rawResponse, topic);
                if (!parsed.isEmpty()) {
                    return parsed;
                }
            } catch (Exception e) {
                log.warn("AI Question generation failed or returned unparseable JSON: {}", e.getMessage());
            }
        }

        // Educational fallback questions
        return generateFallbackQuestions(subject, topic, difficulty, count);
    }

    private List<QuizDto.QuestionItem> parseQuestionsJson(String raw, String defaultTopic) {
        List<QuizDto.QuestionItem> items = new ArrayList<>();
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
                    List<String> options = new ArrayList<>();
                    if (node.has("options") && node.get("options").isArray()) {
                        for (JsonNode opt : node.get("options")) {
                            options.add(opt.asText());
                        }
                    }

                    items.add(QuizDto.QuestionItem.builder()
                            .questionType(node.path("questionType").asText("MCQ"))
                            .questionText(node.path("questionText").asText("Untitled Question"))
                            .options(options)
                            .correctAnswer(node.path("correctAnswer").asText())
                            .explanation(node.path("explanation").asText("No detailed explanation provided."))
                            .marks(node.path("marks").asInt(1))
                            .topicTag(node.path("topicTag").asText(defaultTopic))
                            .build());
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse JSON questions: {}", e.getMessage());
        }
        return items;
    }

    private List<QuizDto.QuestionItem> generateFallbackQuestions(String subject, String topic, String difficulty, int count) {
        List<QuizDto.QuestionItem> list = new ArrayList<>();

        list.add(QuizDto.QuestionItem.builder()
                .questionType("MCQ")
                .questionText("Which of the following best defines the primary objective of " + topic + " in " + subject + "?")
                .options(List.of(
                        "Ensuring deterministic and efficient resource allocation",
                        "Eliminating all computational overhead",
                        "Replacing secondary storage completely",
                        "Bypassing hardware security controls"
                ))
                .correctAnswer("Ensuring deterministic and efficient resource allocation")
                .explanation("The fundamental purpose of " + topic + " is to optimize system performance and maintain predictable, deterministic resource sharing.")
                .marks(1)
                .topicTag(topic)
                .build());

        list.add(QuizDto.QuestionItem.builder()
                .questionType("TRUE_FALSE")
                .questionText("True or False: In " + subject + ", concepts of " + topic + " can operate without direct memory management.")
                .options(List.of("True", "False"))
                .correctAnswer("False")
                .explanation("Direct interaction with memory and architecture constraints is mandatory when dealing with " + topic + ".")
                .marks(1)
                .topicTag(topic)
                .build());

        list.add(QuizDto.QuestionItem.builder()
                .questionType("MCQ")
                .questionText("What is the typical time complexity or operational trade-off associated with " + topic + "?")
                .options(List.of(
                        "Trade-off between latency and throughput overhead",
                        "Instantaneous execution with zero memory cost",
                        "Exponential degradation regardless of input",
                        "Constant space overhead with unbounded call stacks"
                ))
                .correctAnswer("Trade-off between latency and throughput overhead")
                .explanation("In standard implementations of " + topic + ", optimizing for minimal latency often incurs a small throughput penalty due to synchronization or lookup metadata.")
                .marks(1)
                .topicTag(topic)
                .build());

        list.add(QuizDto.QuestionItem.builder()
                .questionType("SHORT_ANSWER")
                .questionText("Briefly explain how " + topic + " handles race conditions or concurrent state transitions.")
                .options(List.of())
                .correctAnswer("Mutual exclusion primitives, locks, or atomic operations ensure atomic state transitions.")
                .explanation("Synchronization mechanisms such as mutexes, semaphores, or compare-and-swap primitives guarantee consistent execution.")
                .marks(2)
                .topicTag(topic)
                .build());

        list.add(QuizDto.QuestionItem.builder()
                .questionType("MCQ")
                .questionText("Which design pattern or architectural principle is most commonly utilized when implementing " + topic + "?")
                .options(List.of(
                        "Separation of concerns and modular abstraction",
                        "Monolithic hardcoded state machines",
                        "Unrestricted shared global memory",
                        "Single-threaded blocking loops"
                ))
                .correctAnswer("Separation of concerns and modular abstraction")
                .explanation("Clean interfaces and modular boundaries allow robust reasoning and testing of " + topic + " components.")
                .marks(1)
                .topicTag(topic)
                .build());

        if (count < list.size()) {
            return new ArrayList<>(list.subList(0, count));
        }
        return list;
    }

    @Transactional
    public QuizDto.QuizResponse createQuiz(QuizDto.SaveQuizRequest request, String userEmail) {
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

        int totalMarks = 0;
        if (request.getQuestions() != null) {
            totalMarks = request.getQuestions().stream()
                    .mapToInt(q -> q.getMarks() != null ? q.getMarks() : 1)
                    .sum();
        }

        Quiz quiz = Quiz.builder()
                .user(user)
                .subject(subject)
                .unit(unit)
                .topic(topic)
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .quizType(request.getQuizType() != null ? request.getQuizType() : "PRACTICE")
                .difficulty(request.getDifficulty() != null ? request.getDifficulty() : "MEDIUM")
                .timeLimitMinutes(request.getTimeLimitMinutes())
                .passingPercentage(request.getPassingPercentage() != null ? request.getPassingPercentage() : 60.0)
                .totalMarks(totalMarks > 0 ? totalMarks : 10)
                .build();

        Quiz savedQuiz = quizRepository.save(quiz);

        if (request.getQuestions() != null) {
            for (QuizDto.QuestionItem item : request.getQuestions()) {
                String optionsJson = null;
                try {
                    if (item.getOptions() != null) {
                        optionsJson = objectMapper.writeValueAsString(item.getOptions());
                    }
                } catch (Exception ignored) {}

                Question question = Question.builder()
                        .quiz(savedQuiz)
                        .questionType(item.getQuestionType() != null ? item.getQuestionType() : "MCQ")
                        .questionText(item.getQuestionText().trim())
                        .optionsJson(optionsJson)
                        .correctAnswer(item.getCorrectAnswer().trim())
                        .explanation(item.getExplanation())
                        .marks(item.getMarks() != null ? item.getMarks() : 1)
                        .topicTag(item.getTopicTag() != null ? item.getTopicTag() : (topic != null ? topic.getName() : "General"))
                        .rubricJson(item.getRubricJson())
                        .build();

                savedQuiz.getQuestions().add(questionRepository.save(question));
            }
        }

        log.info("Created Quiz '{}' (ID: {}) with {} questions for user {}", savedQuiz.getTitle(), savedQuiz.getId(), savedQuiz.getQuestions().size(), user.getEmail());
        return mapToQuizResponse(savedQuiz);
    }

    @Transactional(readOnly = true)
    public List<QuizDto.QuizResponse> getQuizzes(String userEmail, Long subjectId) {
        User user = getUserByEmail(userEmail);
        List<Quiz> quizzes = (subjectId != null)
                ? quizRepository.findByUserIdAndSubjectIdOrderByCreatedAtDesc(user.getId(), subjectId)
                : quizRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        return quizzes.stream().map(this::mapToQuizResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public QuizDto.QuizResponse getQuizById(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Quiz quiz = quizRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found or access denied"));

        return mapToQuizResponse(quiz);
    }

    @Transactional
    public void deleteQuiz(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Quiz quiz = quizRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found or access denied"));

        quizRepository.delete(quiz);
        log.info("Deleted quiz ID: {} for user {}", id, user.getEmail());
    }

    @Transactional
    public QuizDto.StartAttemptResponse startAttempt(Long quizId, String userEmail) {
        User user = getUserByEmail(userEmail);
        Quiz quiz = quizRepository.findByIdAndUserId(quizId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found or access denied"));

        QuizAttempt attempt = QuizAttempt.builder()
                .quiz(quiz)
                .user(user)
                .startTime(LocalDateTime.now())
                .totalMarks(quiz.getTotalMarks())
                .status("IN_PROGRESS")
                .build();

        QuizAttempt saved = quizAttemptRepository.save(attempt);

        List<QuizDto.ExamQuestion> examQuestions = quiz.getQuestions().stream().map(q -> {
            List<String> options = new ArrayList<>();
            try {
                if (q.getOptionsJson() != null) {
                    options = objectMapper.readValue(q.getOptionsJson(), new TypeReference<List<String>>() {});
                }
            } catch (Exception ignored) {}

            return QuizDto.ExamQuestion.builder()
                    .id(q.getId())
                    .questionType(q.getQuestionType())
                    .questionText(q.getQuestionText())
                    .options(options)
                    .marks(q.getMarks())
                    .topicTag(q.getTopicTag())
                    .build();
        }).collect(Collectors.toList());

        return QuizDto.StartAttemptResponse.builder()
                .attemptId(saved.getId())
                .quizId(quiz.getId())
                .quizTitle(quiz.getTitle())
                .subjectName(quiz.getSubject() != null ? quiz.getSubject().getName() : "General")
                .timeLimitMinutes(quiz.getTimeLimitMinutes())
                .totalQuestions(examQuestions.size())
                .totalMarks(quiz.getTotalMarks())
                .startTime(saved.getStartTime())
                .questions(examQuestions)
                .build();
    }

    @Transactional
    public QuizDto.AttemptDetailResponse submitAttempt(Long attemptId, QuizDto.SubmitAttemptRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);
        QuizAttempt attempt = quizAttemptRepository.findByIdAndUserId(attemptId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found or access denied"));

        if ("COMPLETED".equalsIgnoreCase(attempt.getStatus())) {
            return getAttemptDetails(attemptId, userEmail);
        }

        Quiz quiz = attempt.getQuiz();
        List<Question> questions = quiz.getQuestions();
        Map<Long, String> submitted = request.getAnswers() != null ? request.getAnswers() : Collections.emptyMap();

        double totalScore = 0.0;
        int totalMaxMarks = 0;
        Map<String, double[]> topicScores = new HashMap<>(); // tag -> [earned, total]

        List<QuizDto.GradedQuestionItem> gradedItems = new ArrayList<>();

        for (Question q : questions) {
            String studentAns = submitted.get(q.getId());
            boolean isCorrect = false;
            double marksAwarded = 0.0;
            String feedback = "";

            int maxMarks = q.getMarks() != null ? q.getMarks() : 1;
            totalMaxMarks += maxMarks;

            String topicTag = q.getTopicTag() != null && !q.getTopicTag().isBlank() ? q.getTopicTag() : "General";
            topicScores.putIfAbsent(topicTag, new double[]{0.0, 0.0});
            topicScores.get(topicTag)[1] += maxMarks;

            if (studentAns != null && !studentAns.trim().isEmpty()) {
                String cleanStudent = studentAns.trim();
                String cleanCorrect = q.getCorrectAnswer().trim();

                if ("MCQ".equalsIgnoreCase(q.getQuestionType()) || "TRUE_FALSE".equalsIgnoreCase(q.getQuestionType())) {
                    if (cleanStudent.equalsIgnoreCase(cleanCorrect)) {
                        isCorrect = true;
                    } else if (cleanCorrect.toLowerCase().startsWith(cleanStudent.toLowerCase() + ".")
                            || cleanStudent.toLowerCase().startsWith(cleanCorrect.toLowerCase() + ".")) {
                        isCorrect = true;
                    }
                } else {
                    // Short Answer / Long Answer heuristic & keyword match
                    String[] keywords = cleanCorrect.toLowerCase().split("\\s+");
                    int matches = 0;
                    for (String kw : keywords) {
                        if (kw.length() > 3 && cleanStudent.toLowerCase().contains(kw)) {
                            matches++;
                        }
                    }
                    if (matches >= Math.max(1, keywords.length / 3)) {
                        isCorrect = true;
                        feedback = "Good conceptual coverage of core keywords.";
                    } else {
                        feedback = "Answer partially addresses concept. Refer to model explanation.";
                    }
                }
            }

            if (isCorrect) {
                marksAwarded = maxMarks;
                totalScore += marksAwarded;
                topicScores.get(topicTag)[0] += marksAwarded;
            }

            UserAnswer userAnswer = UserAnswer.builder()
                    .quizAttempt(attempt)
                    .question(q)
                    .submittedAnswer(studentAns)
                    .isCorrect(isCorrect)
                    .marksAwarded(marksAwarded)
                    .evaluationFeedback(feedback)
                    .build();

            userAnswerRepository.save(userAnswer);

            List<String> options = new ArrayList<>();
            try {
                if (q.getOptionsJson() != null) {
                    options = objectMapper.readValue(q.getOptionsJson(), new TypeReference<List<String>>() {});
                }
            } catch (Exception ignored) {}

            gradedItems.add(QuizDto.GradedQuestionItem.builder()
                    .questionId(q.getId())
                    .questionType(q.getQuestionType())
                    .questionText(q.getQuestionText())
                    .options(options)
                    .correctAnswer(q.getCorrectAnswer())
                    .submittedAnswer(studentAns)
                    .isCorrect(isCorrect)
                    .marksAwarded(marksAwarded)
                    .maxMarks(maxMarks)
                    .explanation(q.getExplanation())
                    .evaluationFeedback(feedback)
                    .topicTag(topicTag)
                    .build());
        }

        double percentage = totalMaxMarks > 0 ? (totalScore / totalMaxMarks) * 100.0 : 0.0;
        percentage = Math.round(percentage * 10.0) / 10.0;
        boolean passed = percentage >= (quiz.getPassingPercentage() != null ? quiz.getPassingPercentage() : 60.0);

        Map<String, QuizDto.TopicScore> topicBreakdown = new HashMap<>();
        for (Map.Entry<String, double[]> entry : topicScores.entrySet()) {
            double earned = entry.getValue()[0];
            double max = entry.getValue()[1];
            double pct = max > 0 ? (earned / max) * 100.0 : 0.0;
            String status = pct >= 80.0 ? "MASTERED" : (pct >= 50.0 ? "NEEDS_REVIEW" : "WEAK");
            topicBreakdown.put(entry.getKey(), QuizDto.TopicScore.builder()
                    .score(earned)
                    .total(max)
                    .percentage(Math.round(pct * 10.0) / 10.0)
                    .status(status)
                    .build());
        }

        String topicPerformanceJson = null;
        try {
            topicPerformanceJson = objectMapper.writeValueAsString(topicBreakdown);
        } catch (Exception ignored) {}

        String overallFeedback = passed
                ? "Excellent performance! You have passed the quiz with a score of " + percentage + "%."
                : "Quiz score: " + percentage + "%. Review the weak topics highlighted below and take targeted practice notes.";

        attempt.setEndTime(LocalDateTime.now());
        attempt.setTimeSpentSeconds(request.getTimeSpentSeconds() != null ? request.getTimeSpentSeconds() : 0);
        attempt.setScoreObtained(totalScore);
        attempt.setTotalMarks(totalMaxMarks);
        attempt.setPercentage(percentage);
        attempt.setPassed(passed);
        attempt.setStatus("COMPLETED");
        attempt.setFeedback(overallFeedback);
        attempt.setTopicPerformanceJson(topicPerformanceJson);

        quizAttemptRepository.save(attempt);
        log.info("Submitted attempt ID: {} for user {}. Score: {}/{} ({}%)", attemptId, user.getEmail(), totalScore, totalMaxMarks, percentage);

        return QuizDto.AttemptDetailResponse.builder()
                .attemptId(attempt.getId())
                .quizId(quiz.getId())
                .quizTitle(quiz.getTitle())
                .subjectName(quiz.getSubject() != null ? quiz.getSubject().getName() : "General")
                .scoreObtained(totalScore)
                .totalMarks(totalMaxMarks)
                .percentage(percentage)
                .passed(passed)
                .timeSpentSeconds(attempt.getTimeSpentSeconds())
                .status("COMPLETED")
                .feedback(overallFeedback)
                .topicPerformance(topicBreakdown)
                .questions(gradedItems)
                .createdAt(attempt.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public QuizDto.AttemptDetailResponse getAttemptDetails(Long attemptId, String userEmail) {
        User user = getUserByEmail(userEmail);
        QuizAttempt attempt = quizAttemptRepository.findByIdAndUserId(attemptId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found or access denied"));

        List<UserAnswer> userAnswers = userAnswerRepository.findByQuizAttemptIdOrderByIdAsc(attempt.getId());
        List<QuizDto.GradedQuestionItem> gradedItems = userAnswers.stream().map(ans -> {
            Question q = ans.getQuestion();
            List<String> options = new ArrayList<>();
            try {
                if (q.getOptionsJson() != null) {
                    options = objectMapper.readValue(q.getOptionsJson(), new TypeReference<List<String>>() {});
                }
            } catch (Exception ignored) {}

            return QuizDto.GradedQuestionItem.builder()
                    .questionId(q.getId())
                    .questionType(q.getQuestionType())
                    .questionText(q.getQuestionText())
                    .options(options)
                    .correctAnswer(q.getCorrectAnswer())
                    .submittedAnswer(ans.getSubmittedAnswer())
                    .isCorrect(ans.getIsCorrect())
                    .marksAwarded(ans.getMarksAwarded())
                    .maxMarks(q.getMarks() != null ? q.getMarks() : 1)
                    .explanation(q.getExplanation())
                    .evaluationFeedback(ans.getEvaluationFeedback())
                    .topicTag(q.getTopicTag())
                    .build();
        }).collect(Collectors.toList());

        Map<String, QuizDto.TopicScore> topicBreakdown = new HashMap<>();
        try {
            if (attempt.getTopicPerformanceJson() != null) {
                topicBreakdown = objectMapper.readValue(attempt.getTopicPerformanceJson(), new TypeReference<Map<String, QuizDto.TopicScore>>() {});
            }
        } catch (Exception ignored) {}

        return QuizDto.AttemptDetailResponse.builder()
                .attemptId(attempt.getId())
                .quizId(attempt.getQuiz().getId())
                .quizTitle(attempt.getQuiz().getTitle())
                .subjectName(attempt.getQuiz().getSubject() != null ? attempt.getQuiz().getSubject().getName() : "General")
                .scoreObtained(attempt.getScoreObtained())
                .totalMarks(attempt.getTotalMarks())
                .percentage(attempt.getPercentage())
                .passed(attempt.getPassed())
                .timeSpentSeconds(attempt.getTimeSpentSeconds())
                .status(attempt.getStatus())
                .feedback(attempt.getFeedback())
                .topicPerformance(topicBreakdown)
                .questions(gradedItems)
                .createdAt(attempt.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<QuizDto.AttemptSummaryResponse> getQuizHistory(String userEmail) {
        User user = getUserByEmail(userEmail);
        List<QuizAttempt> attempts = quizAttemptRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        return attempts.stream().map(att -> QuizDto.AttemptSummaryResponse.builder()
                .attemptId(att.getId())
                .quizId(att.getQuiz().getId())
                .quizTitle(att.getQuiz().getTitle())
                .subjectName(att.getQuiz().getSubject() != null ? att.getQuiz().getSubject().getName() : "General")
                .scoreObtained(att.getScoreObtained())
                .totalMarks(att.getTotalMarks())
                .percentage(att.getPercentage())
                .passed(att.getPassed())
                .timeSpentSeconds(att.getTimeSpentSeconds())
                .status(att.getStatus())
                .createdAt(att.getCreatedAt())
                .build()).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public QuizDto.QuizStatsResponse getQuizStats(String userEmail) {
        User user = getUserByEmail(userEmail);
        long totalQuizzes = quizRepository.countByUserId(user.getId());
        long totalAttempts = quizAttemptRepository.countByUserId(user.getId());
        Double avg = quizAttemptRepository.getAveragePercentageByUserId(user.getId());
        double avgPct = avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;

        List<QuizAttempt> attempts = quizAttemptRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        long passedCount = attempts.stream().filter(a -> Boolean.TRUE.equals(a.getPassed())).count();

        return QuizDto.QuizStatsResponse.builder()
                .totalQuizzes(totalQuizzes)
                .totalAttempts(totalAttempts)
                .averagePercentage(avgPct)
                .passedAttempts(passedCount)
                .build();
    }

    private QuizDto.QuizResponse mapToQuizResponse(Quiz quiz) {
        List<QuizDto.QuestionItem> questionItems = quiz.getQuestions().stream().map(q -> {
            List<String> options = new ArrayList<>();
            try {
                if (q.getOptionsJson() != null) {
                    options = objectMapper.readValue(q.getOptionsJson(), new TypeReference<List<String>>() {});
                }
            } catch (Exception ignored) {}

            return QuizDto.QuestionItem.builder()
                    .id(q.getId())
                    .questionType(q.getQuestionType())
                    .questionText(q.getQuestionText())
                    .options(options)
                    .correctAnswer(q.getCorrectAnswer())
                    .explanation(q.getExplanation())
                    .marks(q.getMarks())
                    .topicTag(q.getTopicTag())
                    .rubricJson(q.getRubricJson())
                    .build();
        }).collect(Collectors.toList());

        return QuizDto.QuizResponse.builder()
                .id(quiz.getId())
                .subjectId(quiz.getSubject() != null ? quiz.getSubject().getId() : null)
                .subjectName(quiz.getSubject() != null ? quiz.getSubject().getName() : null)
                .unitId(quiz.getUnit() != null ? quiz.getUnit().getId() : null)
                .unitTitle(quiz.getUnit() != null ? quiz.getUnit().getTitle() : null)
                .topicId(quiz.getTopic() != null ? quiz.getTopic().getId() : null)
                .topicName(quiz.getTopic() != null ? quiz.getTopic().getName() : null)
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .quizType(quiz.getQuizType())
                .difficulty(quiz.getDifficulty())
                .timeLimitMinutes(quiz.getTimeLimitMinutes())
                .passingPercentage(quiz.getPassingPercentage())
                .totalMarks(quiz.getTotalMarks())
                .questionCount(quiz.getQuestions().size())
                .questions(questionItems)
                .createdAt(quiz.getCreatedAt())
                .build();
    }
}
