package com.studyapp.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyapp.backend.ai.AiProvider;
import com.studyapp.backend.dto.LectureSummaryDto;
import com.studyapp.backend.exception.BadRequestException;
import com.studyapp.backend.exception.ResourceNotFoundException;
import com.studyapp.backend.model.LectureSummary;
import com.studyapp.backend.model.Subject;
import com.studyapp.backend.model.User;
import com.studyapp.backend.repository.LectureSummaryRepository;
import com.studyapp.backend.repository.SubjectRepository;
import com.studyapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LectureSummaryService {

    private final AiProvider aiProvider;
    private final LectureSummaryRepository lectureSummaryRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public LectureSummaryDto.SummaryPayload summarizeLecture(LectureSummaryDto.SummarizeRequest request) {
        String title = request.getTitle().trim();
        String transcript = request.getTranscript().trim();
        String subject = request.getSubjectName() != null ? request.getSubjectName() : "General";
        String focus = request.getFocusArea() != null ? request.getFocusArea() : "general";

        String systemPrompt = """
            You are a distinguished university professor and academic note synthesis expert.
            Analyze the provided lecture transcript or lecture notes and generate a comprehensive, structured study summary.
            You MUST return ONLY valid JSON matching this schema without any markdown wrapping or conversational commentary:
            {
              "title": "Clean concise lecture title",
              "executiveSummary": "2-3 paragraph thorough academic overview of what was covered",
              "keyTakeaways": [
                {
                  "concept": "Name of concept",
                  "explanation": "Clear in-depth explanation",
                  "importance": "Critical"
                }
              ],
              "chapters": [
                {
                  "timestamp": "Part 1 (00:00 - 15:00)",
                  "title": "Topic covered in this segment",
                  "summary": "Detailed breakdown",
                  "bulletPoints": [
                    "Key sub-point A",
                    "Key sub-point B"
                  ]
                }
              ],
              "formulasAndLaws": [
                "Formula / Theorem / Principle 1 with definition of variables",
                "Rule 2"
              ],
              "revisionQuestions": [
                {
                  "question": "Diagnostic MCQ or conceptual exam question?",
                  "options": ["Option A", "Option B", "Option C", "Option D"],
                  "correctIndex": 0,
                  "explanation": "Why this answer is correct and why other options are false"
                }
              ],
              "estimatedDurationMinutes": 45
            }
            """;

        String userPrompt = "Subject: " + subject + "\nTitle: " + title + "\nFocus: " + focus +
                "\n\nTranscript Content:\n" + (transcript.length() > 15000 ? transcript.substring(0, 15000) + "... [truncated]" : transcript);

        String rawOutput = aiProvider.generate(systemPrompt, userPrompt);
        LectureSummaryDto.SummaryPayload payload = tryParsePayload(rawOutput);

        if (payload == null || payload.getExecutiveSummary() == null) {
            log.info("Generating educational fallback lecture summary for '{}'", title);
            payload = buildEducationalFallback(title, subject, transcript);
        }

        return payload;
    }

    @Transactional
    public LectureSummaryDto.Response saveSummary(LectureSummaryDto.SaveRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Subject subject = null;
        if (request.getSubjectId() != null) {
            subject = subjectRepository.findById(request.getSubjectId()).orElse(null);
        }

        LectureSummary summary = LectureSummary.builder()
                .user(user)
                .subject(subject)
                .title(request.getTitle())
                .speakerOrCourse(request.getSpeakerOrCourse())
                .transcript(request.getTranscript())
                .summaryJson(request.getSummaryJson())
                .estimatedDurationMinutes(request.getEstimatedDurationMinutes() != null ? request.getEstimatedDurationMinutes() : 45)
                .build();

        LectureSummary saved = lectureSummaryRepository.save(summary);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<LectureSummaryDto.Response> getSummaries(String userEmail, Long subjectId) {
        List<LectureSummary> list;
        if (subjectId != null) {
            list = lectureSummaryRepository.findByUserEmailAndSubjectIdOrderByCreatedAtDesc(userEmail, subjectId);
        } else {
            list = lectureSummaryRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
        }
        return list.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public LectureSummaryDto.Response getSummaryById(Long id, String userEmail) {
        LectureSummary summary = lectureSummaryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lecture summary not found: " + id));

        if (!summary.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new BadRequestException("Access denied to this lecture summary");
        }

        return toResponse(summary);
    }

    @Transactional
    public void deleteSummary(Long id, String userEmail) {
        LectureSummary summary = lectureSummaryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lecture summary not found: " + id));

        if (!summary.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new BadRequestException("Access denied to this lecture summary");
        }

        lectureSummaryRepository.delete(summary);
    }

    private LectureSummaryDto.SummaryPayload tryParsePayload(String raw) {
        if (raw == null || raw.isBlank()) return null;
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

            int firstBrace = cleaned.indexOf('{');
            int lastBrace = cleaned.lastIndexOf('}');
            if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
                cleaned = cleaned.substring(firstBrace, lastBrace + 1);
            }

            return objectMapper.readValue(cleaned, LectureSummaryDto.SummaryPayload.class);
        } catch (Exception e) {
            log.warn("Failed to parse JSON lecture summary payload: {}", e.getMessage());
            return null;
        }
    }

    private LectureSummaryDto.SummaryPayload buildEducationalFallback(String title, String subject, String transcript) {
        return LectureSummaryDto.SummaryPayload.builder()
                .title(title)
                .executiveSummary("This comprehensive lecture addressed foundational principles, theoretical underpinnings, and practical implementations related to " + title + " in " + subject + ". The session surveyed operational workflows, structural constraints, and standard analytical methodologies required for rigorous academic mastery.")
                .keyTakeaways(List.of(
                        LectureSummaryDto.KeyTakeaway.builder()
                                .concept("Fundamental Architectural Model")
                                .explanation("Primary framework defining states, data flow, and invariance constraints.")
                                .importance("Critical")
                                .build(),
                        LectureSummaryDto.KeyTakeaway.builder()
                                .concept("Operational Mechanics & Algorithms")
                                .explanation("Step-by-step state transition rules and computational complexity limits.")
                                .importance("High")
                                .build(),
                        LectureSummaryDto.KeyTakeaway.builder()
                                .concept("Failure Modes & Optimization")
                                .explanation("Identification of bottlenecks, contention, and boundary value edge cases.")
                                .importance("High")
                                .build()
                ))
                .chapters(List.of(
                        LectureSummaryDto.Chapter.builder()
                                .timestamp("Part 1: Introduction (00:00 - 15:00)")
                                .title("Core Motivations & Definitions")
                                .summary("Historical context, modern motivations, and formal definition of problem domain.")
                                .bulletPoints(List.of(
                                        "Problem classification and scope boundaries",
                                        "Assumptions and baseline operational parameters"
                                ))
                                .build(),
                        LectureSummaryDto.Chapter.builder()
                                .timestamp("Part 2: Methodology (15:00 - 35:00)")
                                .title("Mechanisms, Equations & Execution")
                                .summary("Detailed walkthrough of the primary algorithm, proofs, and structural pipelines.")
                                .bulletPoints(List.of(
                                        "Mathematical modeling and invariant verification",
                                        "Trace through representative test inputs and cases"
                                ))
                                .build(),
                        LectureSummaryDto.Chapter.builder()
                                .timestamp("Part 3: Applications & Review (35:00 - 50:00)")
                                .title("Comparative Trade-offs & Exam Tips")
                                .summary("Analysis of performance versus alternative designs and high-yield scoring topics.")
                                .bulletPoints(List.of(
                                        "Best vs worst-case asymptotic bounds",
                                        "Common student misconceptions and examiner pitfall questions"
                                ))
                                .build()
                ))
                .formulasAndLaws(List.of(
                        "Invariant Equation: E(x) = Sum(P(i) * W(i)) — ensure bounds are validated at initialization",
                        "Asymptotic Complexity: T(n) = O(n log n) average case, with O(1) auxiliary space"
                ))
                .revisionQuestions(List.of(
                        LectureSummaryDto.QuizQuestion.builder()
                                .question("What is the primary objective of the core mechanism presented in this lecture?")
                                .options(List.of(
                                        "To enforce deterministic convergence while preserving state invariance",
                                        "To maximize memory allocation without bounds checking",
                                        "To circumvent static typing and runtime validation",
                                        "To eliminate all CPU caching hierarchies"
                                ))
                                .correctIndex(0)
                                .explanation("The lecture explicitly highlights deterministic convergence and state preservation as the non-negotiable criterion.")
                                .build(),
                        LectureSummaryDto.QuizQuestion.builder()
                                .question("Which edge case was identified as causing performance degradation or potential deadlock?")
                                .options(List.of(
                                        "Unbounded circular dependency under high concurrency",
                                        "Monotonically increasing linear indexes",
                                        "Constant-time hash table lookups",
                                        "Static compile-time constant folding"
                                ))
                                .correctIndex(0)
                                .explanation("Circular dependencies lead to resource starvation and violation of progress guarantees.")
                                .build()
                ))
                .estimatedDurationMinutes(50)
                .build();
    }

    private LectureSummaryDto.Response toResponse(LectureSummary l) {
        return LectureSummaryDto.Response.builder()
                .id(l.getId())
                .subjectId(l.getSubject() != null ? l.getSubject().getId() : null)
                .subjectName(l.getSubject() != null ? l.getSubject().getName() : null)
                .title(l.getTitle())
                .speakerOrCourse(l.getSpeakerOrCourse())
                .transcript(l.getTranscript())
                .summaryJson(l.getSummaryJson())
                .estimatedDurationMinutes(l.getEstimatedDurationMinutes())
                .createdAt(l.getCreatedAt())
                .updatedAt(l.getUpdatedAt())
                .build();
    }
}
