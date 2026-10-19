package com.studyapp.backend.service;

import com.studyapp.backend.dto.ExamTargetDto;
import com.studyapp.backend.dto.KnowledgeGapDto;
import com.studyapp.backend.dto.StudyPlanItemDto;
import com.studyapp.backend.exception.BadRequestException;
import com.studyapp.backend.exception.ResourceNotFoundException;
import com.studyapp.backend.model.*;
import com.studyapp.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlannerService {

    private final ExamTargetRepository examTargetRepository;
    private final StudyPlanItemRepository studyPlanItemRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final TopicRepository topicRepository;
    private final MistakeRecordRepository mistakeRecordRepository;
    private final FlashcardRepository flashcardRepository;
    private final KnowledgeGapService knowledgeGapService;

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    // ==========================================
    // EXAM TARGETS (COUNTDOWN)
    // ==========================================

    @Transactional(readOnly = true)
    public List<ExamTargetDto.Response> getExams(String userEmail) {
        User user = getUserByEmail(userEmail);
        List<ExamTarget> exams = examTargetRepository.findByUserIdOrderByExamDateAsc(user.getId());
        return exams.stream().map(this::mapToExamResponse).collect(Collectors.toList());
    }

    @Transactional
    public ExamTargetDto.Response createExam(String userEmail, ExamTargetDto.Request request) {
        User user = getUserByEmail(userEmail);
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new BadRequestException("Exam title is required");
        }
        if (request.getExamDate() == null) {
            throw new BadRequestException("Exam date is required");
        }

        Subject subject = null;
        if (request.getSubjectId() != null) {
            subject = subjectRepository.findByIdAndUserId(request.getSubjectId(), user.getId())
                    .orElse(null);
        }

        ExamTarget exam = ExamTarget.builder()
                .user(user)
                .subject(subject)
                .title(request.getTitle().trim())
                .examDate(request.getExamDate())
                .targetScore(request.getTargetScore() != null ? request.getTargetScore() : 85)
                .priority(request.getPriority() != null ? request.getPriority() : "HIGH")
                .status("UPCOMING")
                .location(request.getLocation())
                .notes(request.getNotes())
                .color(request.getColor() != null ? request.getColor() : "indigo")
                .build();

        ExamTarget saved = examTargetRepository.save(exam);
        return mapToExamResponse(saved);
    }

    @Transactional
    public ExamTargetDto.Response updateExam(String userEmail, Long id, ExamTargetDto.Request request) {
        User user = getUserByEmail(userEmail);
        ExamTarget exam = examTargetRepository.findById(id)
                .filter(e -> e.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Exam target not found with ID: " + id));

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            exam.setTitle(request.getTitle().trim());
        }
        if (request.getExamDate() != null) {
            exam.setExamDate(request.getExamDate());
        }
        if (request.getTargetScore() != null) {
            exam.setTargetScore(request.getTargetScore());
        }
        if (request.getPriority() != null) {
            exam.setPriority(request.getPriority());
        }
        if (request.getLocation() != null) {
            exam.setLocation(request.getLocation());
        }
        if (request.getNotes() != null) {
            exam.setNotes(request.getNotes());
        }
        if (request.getColor() != null) {
            exam.setColor(request.getColor());
        }
        if (request.getSubjectId() != null) {
            Subject subject = subjectRepository.findByIdAndUserId(request.getSubjectId(), user.getId()).orElse(null);
            exam.setSubject(subject);
        }

        return mapToExamResponse(examTargetRepository.save(exam));
    }

    @Transactional
    public void deleteExam(String userEmail, Long id) {
        User user = getUserByEmail(userEmail);
        ExamTarget exam = examTargetRepository.findById(id)
                .filter(e -> e.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Exam target not found with ID: " + id));
        examTargetRepository.delete(exam);
    }

    @Transactional
    public ExamTargetDto.Response toggleExamStatus(String userEmail, Long id) {
        User user = getUserByEmail(userEmail);
        ExamTarget exam = examTargetRepository.findById(id)
                .filter(e -> e.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Exam target not found with ID: " + id));

        if ("UPCOMING".equalsIgnoreCase(exam.getStatus())) {
            exam.setStatus("COMPLETED");
        } else {
            exam.setStatus("UPCOMING");
        }
        return mapToExamResponse(examTargetRepository.save(exam));
    }

    private ExamTargetDto.Response mapToExamResponse(ExamTarget e) {
        LocalDate today = LocalDate.now();
        long daysRemaining = ChronoUnit.DAYS.between(today, e.getExamDate());
        long hoursRemaining = daysRemaining > 0 ? daysRemaining * 24 : 0;

        // Progress estimate
        double progressPercent = 0.0;
        if (e.getCreatedAt() != null) {
            long totalDays = ChronoUnit.DAYS.between(e.getCreatedAt().toLocalDate(), e.getExamDate());
            if (totalDays > 0) {
                long elapsed = ChronoUnit.DAYS.between(e.getCreatedAt().toLocalDate(), today);
                progressPercent = Math.min(100.0, Math.max(0.0, (double) elapsed / totalDays * 100.0));
            }
        }
        if ("COMPLETED".equalsIgnoreCase(e.getStatus())) {
            progressPercent = 100.0;
        }

        return ExamTargetDto.Response.builder()
                .id(e.getId())
                .subjectId(e.getSubject() != null ? e.getSubject().getId() : null)
                .subjectName(e.getSubject() != null ? e.getSubject().getName() : null)
                .subjectCode(e.getSubject() != null ? e.getSubject().getCode() : null)
                .title(e.getTitle())
                .examDate(e.getExamDate())
                .targetScore(e.getTargetScore())
                .priority(e.getPriority())
                .status(e.getStatus())
                .location(e.getLocation())
                .notes(e.getNotes())
                .color(e.getColor() != null ? e.getColor() : "indigo")
                .daysRemaining(daysRemaining)
                .hoursRemaining(hoursRemaining)
                .progressPercent(Math.round(progressPercent * 10.0) / 10.0)
                .createdAt(e.getCreatedAt())
                .build();
    }

    // ==========================================
    // STUDY PLAN ITEMS & TIMETABLE
    // ==========================================

    @Transactional(readOnly = true)
    public StudyPlanItemDto.DailyPlanResponse getDailyPlan(String userEmail, LocalDate date) {
        User user = getUserByEmail(userEmail);
        LocalDate targetDate = date != null ? date : LocalDate.now();

        List<StudyPlanItem> items = studyPlanItemRepository.findByUserIdAndPlanDateOrderByCreatedAtAsc(user.getId(), targetDate);
        List<StudyPlanItemDto.Response> itemDtos = items.stream().map(this::mapToItemResponse).collect(Collectors.toList());

        int totalItems = itemDtos.size();
        int completedItems = (int) itemDtos.stream().filter(StudyPlanItemDto.Response::getCompleted).count();
        int totalMinutes = itemDtos.stream().mapToInt(StudyPlanItemDto.Response::getEstimatedMinutes).sum();
        int completedMinutes = itemDtos.stream()
                .filter(StudyPlanItemDto.Response::getCompleted)
                .mapToInt(StudyPlanItemDto.Response::getEstimatedMinutes)
                .sum();
        double completionPercent = totalItems > 0 ? ((double) completedItems / totalItems) * 100.0 : 0.0;

        return StudyPlanItemDto.DailyPlanResponse.builder()
                .date(targetDate)
                .totalItems(totalItems)
                .completedItems(completedItems)
                .totalEstimatedMinutes(totalMinutes)
                .completedMinutes(completedMinutes)
                .completionPercentage(Math.round(completionPercent * 10.0) / 10.0)
                .items(itemDtos)
                .build();
    }

    @Transactional(readOnly = true)
    public List<StudyPlanItemDto.Response> getWeeklyPlan(String userEmail, LocalDate startDate, LocalDate endDate) {
        User user = getUserByEmail(userEmail);
        LocalDate start = startDate != null ? startDate : LocalDate.now();
        LocalDate end = endDate != null ? endDate : start.plusDays(6);

        List<StudyPlanItem> items = studyPlanItemRepository.findByUserIdAndPlanDateBetweenOrderByPlanDateAscCreatedAtAsc(
                user.getId(), start, end);
        return items.stream().map(this::mapToItemResponse).collect(Collectors.toList());
    }

    @Transactional
    public StudyPlanItemDto.Response createPlanItem(String userEmail, StudyPlanItemDto.Request request) {
        User user = getUserByEmail(userEmail);
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new BadRequestException("Plan item title is required");
        }

        Subject subject = null;
        if (request.getSubjectId() != null) {
            subject = subjectRepository.findByIdAndUserId(request.getSubjectId(), user.getId()).orElse(null);
        }

        Topic topic = null;
        if (request.getTopicId() != null) {
            topic = topicRepository.findById(request.getTopicId()).orElse(null);
        }

        ExamTarget examTarget = null;
        if (request.getExamTargetId() != null) {
            examTarget = examTargetRepository.findById(request.getExamTargetId()).orElse(null);
        }

        StudyPlanItem item = StudyPlanItem.builder()
                .user(user)
                .examTarget(examTarget)
                .subject(subject)
                .topic(topic)
                .planDate(request.getPlanDate() != null ? request.getPlanDate() : LocalDate.now())
                .timeSlot(request.getTimeSlot())
                .title(request.getTitle().trim())
                .activityType(request.getActivityType() != null ? request.getActivityType() : "CONCEPT_STUDY")
                .estimatedMinutes(request.getEstimatedMinutes() != null ? request.getEstimatedMinutes() : 45)
                .priority(request.getPriority() != null ? request.getPriority() : "MEDIUM")
                .completed(false)
                .actionRoute(request.getActionRoute() != null ? request.getActionRoute() : "/timer")
                .aiReasoning(request.getAiReasoning())
                .build();

        return mapToItemResponse(studyPlanItemRepository.save(item));
    }

    @Transactional
    public StudyPlanItemDto.Response updatePlanItem(String userEmail, Long id, StudyPlanItemDto.Request request) {
        User user = getUserByEmail(userEmail);
        StudyPlanItem item = studyPlanItemRepository.findById(id)
                .filter(i -> i.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Study plan item not found with ID: " + id));

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            item.setTitle(request.getTitle().trim());
        }
        if (request.getPlanDate() != null) {
            item.setPlanDate(request.getPlanDate());
        }
        if (request.getTimeSlot() != null) {
            item.setTimeSlot(request.getTimeSlot());
        }
        if (request.getActivityType() != null) {
            item.setActivityType(request.getActivityType());
        }
        if (request.getEstimatedMinutes() != null) {
            item.setEstimatedMinutes(request.getEstimatedMinutes());
        }
        if (request.getPriority() != null) {
            item.setPriority(request.getPriority());
        }
        if (request.getActionRoute() != null) {
            item.setActionRoute(request.getActionRoute());
        }
        if (request.getAiReasoning() != null) {
            item.setAiReasoning(request.getAiReasoning());
        }

        return mapToItemResponse(studyPlanItemRepository.save(item));
    }

    @Transactional
    public StudyPlanItemDto.Response togglePlanItemCompleted(String userEmail, Long id) {
        User user = getUserByEmail(userEmail);
        StudyPlanItem item = studyPlanItemRepository.findById(id)
                .filter(i -> i.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Study plan item not found with ID: " + id));

        item.setCompleted(!Boolean.TRUE.equals(item.getCompleted()));
        return mapToItemResponse(studyPlanItemRepository.save(item));
    }

    @Transactional
    public void deletePlanItem(String userEmail, Long id) {
        User user = getUserByEmail(userEmail);
        StudyPlanItem item = studyPlanItemRepository.findById(id)
                .filter(i -> i.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Study plan item not found with ID: " + id));
        studyPlanItemRepository.delete(item);
    }

    // ==========================================
    // AI / SMART ADAPTIVE STUDY PLAN GENERATOR
    // ==========================================

    @Transactional
    public StudyPlanItemDto.DailyPlanResponse generateAutoPlan(String userEmail, StudyPlanItemDto.GeneratePlanRequest request) {
        User user = getUserByEmail(userEmail);
        LocalDate start = request.getStartDate() != null ? request.getStartDate() : LocalDate.now();
        int daysCount = (request.getDaysCount() != null && request.getDaysCount() > 0) ? request.getDaysCount() : 3;
        LocalDate end = start.plusDays(daysCount - 1);
        int dailyHours = (request.getDailyAvailableHours() != null && request.getDailyAvailableHours() > 0)
                ? request.getDailyAvailableHours() : 3;

        boolean prioritizeWeak = !Boolean.FALSE.equals(request.getPrioritizeWeakTopics());
        boolean includeMistakes = !Boolean.FALSE.equals(request.getIncludeMistakes());
        boolean includeFlashcards = !Boolean.FALSE.equals(request.getIncludeFlashcards());

        // Clean uncompleted auto-generated items in this date range to avoid stacking
        studyPlanItemRepository.deleteByUserIdAndPlanDateBetween(user.getId(), start, end);

        // Gather Context Data
        List<ExamTarget> upcomingExams = examTargetRepository.findByUserIdAndStatusOrderByExamDateAsc(user.getId(), "UPCOMING");
        ExamTarget primaryExam = upcomingExams.isEmpty() ? null : upcomingExams.get(0);

        List<Subject> subjects = subjectRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        List<MistakeRecord> unresolvedMistakes = mistakeRecordRepository.findByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), "UNRESOLVED");
        List<Flashcard> dueFlashcards = flashcardRepository.findDueForReview(user.getId(), LocalDate.now().plusDays(daysCount));
        KnowledgeGapDto.KnowledgeGapResponse gaps = knowledgeGapService.analyzeGaps(userEmail);

        List<KnowledgeGapDto.TopicGapItem> weakTopics = gaps != null && gaps.getHighPriorityGaps() != null
                ? gaps.getHighPriorityGaps() : Collections.emptyList();

        List<StudyPlanItem> generatedItems = new ArrayList<>();

        // Standard daily slots based on dailyHours
        // e.g. 2 hours -> 2 blocks of 45-50 min
        // 3 hours -> 3 blocks of 45 min
        // 4+ hours -> 4 blocks of 45 min
        int blocksPerDay = Math.min(5, Math.max(2, dailyHours));

        String[] timeSlots = new String[]{
                "09:00 - 09:45 (Morning)",
                "11:15 - 12:00 (Mid-Day)",
                "15:00 - 15:45 (Afternoon)",
                "17:30 - 18:15 (Evening)",
                "20:00 - 20:45 (Night Wrap-up)"
        };

        for (int dayOffset = 0; dayOffset < daysCount; dayOffset++) {
            LocalDate currentDate = start.plusDays(dayOffset);

            for (int blockIdx = 0; blockIdx < blocksPerDay; blockIdx++) {
                String slot = timeSlots[blockIdx % timeSlots.length];
                StudyPlanItem item = null;

                // Priority Block 1: Weakest Topic or Mistake Correction
                if (blockIdx == 0 && prioritizeWeak && !weakTopics.isEmpty()) {
                    KnowledgeGapDto.TopicGapItem weak = weakTopics.get(dayOffset % weakTopics.size());
                    Subject sub = subjects.stream().filter(s -> s.getId().equals(weak.getSubjectId())).findFirst().orElse(null);
                    item = StudyPlanItem.builder()
                            .user(user)
                            .examTarget(primaryExam)
                            .subject(sub)
                            .planDate(currentDate)
                            .timeSlot(slot)
                            .title("Targeted Mastery: " + weak.getTopicTag())
                            .activityType("CONCEPT_STUDY")
                            .estimatedMinutes(45)
                            .priority("HIGH")
                            .completed(false)
                            .actionRoute("/notes")
                            .aiReasoning("Diagnostic gap detected: Accuracy is currently " + Math.round(weak.getAccuracyPercentage()) + "% in " + weak.getTopicTag() + ". High impact on upcoming exams.")
                            .build();
                } else if (blockIdx == 1 && includeMistakes && !unresolvedMistakes.isEmpty()) {
                    MistakeRecord mistake = unresolvedMistakes.get(dayOffset % unresolvedMistakes.size());
                    item = StudyPlanItem.builder()
                            .user(user)
                            .examTarget(primaryExam)
                            .subject(mistake.getSubject())
                            .planDate(currentDate)
                            .timeSlot(slot)
                            .title("Mistake Remediation: " + mistake.getMistakeCategory() + " Root-Cause Drill")
                            .activityType("MISTAKE_CORRECTION")
                            .estimatedMinutes(40)
                            .priority("HIGH")
                            .completed(false)
                            .actionRoute("/mistakes")
                            .aiReasoning("Fixing recurring " + mistake.getMistakeCategory() + " error to prevent repeat penalties on target exam.")
                            .build();
                } else if ((blockIdx == 2 || (blockIdx == 1 && unresolvedMistakes.isEmpty())) && includeFlashcards && !dueFlashcards.isEmpty()) {
                    Flashcard sampleCard = dueFlashcards.get(dayOffset % dueFlashcards.size());
                    item = StudyPlanItem.builder()
                            .user(user)
                            .examTarget(primaryExam)
                            .subject(sampleCard.getSubject())
                            .planDate(currentDate)
                            .timeSlot(slot)
                            .title("Spaced Repetition: Active Recall Deck (" + dueFlashcards.size() + " cards due)")
                            .activityType("FLASHCARD_REVIEW")
                            .estimatedMinutes(35)
                            .priority("MEDIUM")
                            .completed(false)
                            .actionRoute("/flashcards")
                            .aiReasoning("SM-2 algorithm scheduled revision to ensure permanent long-term memory consolidation.")
                            .build();
                } else {
                    // Practice Quiz or General Mock Test
                    Subject activeSubject = !subjects.isEmpty() ? subjects.get((dayOffset + blockIdx) % subjects.size()) : null;
                    String title = primaryExam != null
                            ? "Practice Exam Sprint: " + primaryExam.getTitle()
                            : (activeSubject != null ? "Topic Quiz: " + activeSubject.getName() : "High-Yield Timed Quiz");

                    item = StudyPlanItem.builder()
                            .user(user)
                            .examTarget(primaryExam)
                            .subject(activeSubject)
                            .planDate(currentDate)
                            .timeSlot(slot)
                            .title(title)
                            .activityType("PRACTICE_QUIZ")
                            .estimatedMinutes(45)
                            .priority("MEDIUM")
                            .completed(false)
                            .actionRoute("/quiz")
                            .aiReasoning("Timed test conditions build exam pacing, stress resilience, and rapid retrieval speed.")
                            .build();
                }

                if (item != null) {
                    generatedItems.add(item);
                }
            }
        }

        studyPlanItemRepository.saveAll(generatedItems);
        return getDailyPlan(userEmail, start);
    }

    private StudyPlanItemDto.Response mapToItemResponse(StudyPlanItem i) {
        return StudyPlanItemDto.Response.builder()
                .id(i.getId())
                .examTargetId(i.getExamTarget() != null ? i.getExamTarget().getId() : null)
                .examTargetTitle(i.getExamTarget() != null ? i.getExamTarget().getTitle() : null)
                .subjectId(i.getSubject() != null ? i.getSubject().getId() : null)
                .subjectName(i.getSubject() != null ? i.getSubject().getName() : null)
                .topicId(i.getTopic() != null ? i.getTopic().getId() : null)
                .topicTitle(i.getTopic() != null ? i.getTopic().getName() : null)
                .planDate(i.getPlanDate())
                .timeSlot(i.getTimeSlot())
                .title(i.getTitle())
                .activityType(i.getActivityType())
                .estimatedMinutes(i.getEstimatedMinutes())
                .priority(i.getPriority())
                .completed(Boolean.TRUE.equals(i.getCompleted()))
                .actionRoute(i.getActionRoute() != null ? i.getActionRoute() : "/timer")
                .aiReasoning(i.getAiReasoning())
                .createdAt(i.getCreatedAt())
                .build();
    }
}
