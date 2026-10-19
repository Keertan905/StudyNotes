package com.studyapp.backend.service;

import com.studyapp.backend.ai.AiProvider;
import com.studyapp.backend.dto.NoteDto;
import com.studyapp.backend.exception.ResourceNotFoundException;
import com.studyapp.backend.model.*;
import com.studyapp.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NoteService {

    private final NoteRepository noteRepository;
    private final SubjectRepository subjectRepository;
    private final UnitRepository unitRepository;
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;
    private final AiProvider aiProvider;

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    public String generateNoteContent(NoteDto.GenerateRequest request) {
        String academicLevel = request.getAcademicLevel() != null ? request.getAcademicLevel() : "College Undergraduate (B.Tech / B.Sc)";
        String style = request.getExplanationStyle() != null ? request.getExplanationStyle() : "Exam-Oriented & Structured";
        String detail = request.getDetailLevel() != null ? request.getDetailLevel() : "Comprehensive with Direct Answers";

        String systemPrompt = "You are an elite university professor and exam preparation specialist. "
                + "Generate comprehensive, technically precise, and exam-focused revision notes in clean Markdown.\n"
                + "Structure the output using exactly these sections:\n"
                + "# " + request.getTopic() + "\n"
                + "## 1. Introduction & Overview\n"
                + "## 2. Formal Technical Definition\n"
                + "## 3. Core Concept Explanation\n"
                + "## 4. Key Characteristics & Properties\n"
                + "## 5. Architecture / Components / Classification\n"
                + "## 6. Working Mechanism & Operational Process\n"
                + "## 7. Advantages & Disadvantages (Table Comparison)\n"
                + "## 8. Real-World Applications & Industry Examples\n"
                + "## 9. High-Yield Exam Questions & Model Answers (5M & 10M format)\n"
                + "## 10. Summary & Last-Minute Revision Points (Quick Cheat-Sheet)\n\n"
                + "Ensure strict academic accuracy. Do not fabricate syllabus details.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Subject: ").append(request.getSubjectName()).append("\n");
        userPrompt.append("Topic: ").append(request.getTopic()).append("\n");
        userPrompt.append("Academic Level: ").append(academicLevel).append("\n");
        userPrompt.append("Explanation Style: ").append(style).append("\n");
        userPrompt.append("Detail Level: ").append(detail).append("\n");

        if (request.getAdditionalContext() != null && !request.getAdditionalContext().isBlank()) {
            userPrompt.append("\nReference Course Material / Textbook Excerpt:\n")
                    .append(request.getAdditionalContext().trim()).append("\n");
        }

        userPrompt.append("\nGenerate the complete notes now.");

        return aiProvider.generate(systemPrompt, userPrompt.toString());
    }

    @Transactional
    public NoteDto.Response saveNote(NoteDto.SaveRequest request, String userEmail) {
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

        Note note = Note.builder()
                .user(user)
                .subject(subject)
                .unit(unit)
                .topic(topic)
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .academicLevel(request.getAcademicLevel())
                .explanationStyle(request.getExplanationStyle())
                .detailLevel(request.getDetailLevel())
                .build();

        Note saved = noteRepository.save(note);
        log.info("Saved note '{}' (ID: {}) for user {}", saved.getTitle(), saved.getId(), user.getEmail());
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<NoteDto.Response> getNotes(String userEmail, Long subjectId) {
        User user = getUserByEmail(userEmail);
        List<Note> notes = (subjectId != null)
                ? noteRepository.findByUserIdAndSubjectIdOrderByUpdatedAtDesc(user.getId(), subjectId)
                : noteRepository.findByUserIdOrderByUpdatedAtDesc(user.getId());

        return notes.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public NoteDto.Response getNoteById(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Note note = noteRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Note not found or access denied"));

        return mapToResponse(note);
    }

    @Transactional
    public NoteDto.Response updateNote(Long id, NoteDto.SaveRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);
        Note note = noteRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Note not found or access denied"));

        note.setTitle(request.getTitle().trim());
        note.setContent(request.getContent().trim());
        if (request.getAcademicLevel() != null) note.setAcademicLevel(request.getAcademicLevel());
        if (request.getExplanationStyle() != null) note.setExplanationStyle(request.getExplanationStyle());
        if (request.getDetailLevel() != null) note.setDetailLevel(request.getDetailLevel());

        Note saved = noteRepository.save(note);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteNote(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Note note = noteRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Note not found or access denied"));

        noteRepository.delete(note);
        log.info("Deleted note ID: {} for user {}", id, user.getEmail());
    }

    private NoteDto.Response mapToResponse(Note note) {
        return NoteDto.Response.builder()
                .id(note.getId())
                .subjectId(note.getSubject() != null ? note.getSubject().getId() : null)
                .subjectName(note.getSubject() != null ? note.getSubject().getName() : null)
                .unitId(note.getUnit() != null ? note.getUnit().getId() : null)
                .unitTitle(note.getUnit() != null ? note.getUnit().getTitle() : null)
                .topicId(note.getTopic() != null ? note.getTopic().getId() : null)
                .topicName(note.getTopic() != null ? note.getTopic().getName() : null)
                .title(note.getTitle())
                .content(note.getContent())
                .academicLevel(note.getAcademicLevel())
                .explanationStyle(note.getExplanationStyle())
                .detailLevel(note.getDetailLevel())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }
}
