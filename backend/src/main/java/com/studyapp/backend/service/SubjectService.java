package com.studyapp.backend.service;

import com.studyapp.backend.dto.SubjectDto;
import com.studyapp.backend.exception.ResourceNotFoundException;
import com.studyapp.backend.model.*;
import com.studyapp.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final UnitRepository unitRepository;
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional(readOnly = true)
    public List<SubjectDto.Response> getSubjects(String userEmail, boolean includeArchived) {
        User user = getUserByEmail(userEmail);
        List<Subject> subjects = includeArchived
                ? subjectRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                : subjectRepository.findByUserIdAndArchivedOrderByCreatedAtDesc(user.getId(), false);

        return subjects.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SubjectDto.Response getSubjectById(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Subject subject = subjectRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found or access denied"));

        return mapToResponse(subject);
    }

    @Transactional
    public SubjectDto.Response createSubject(SubjectDto.Request request, String userEmail) {
        User user = getUserByEmail(userEmail);

        Subject subject = Subject.builder()
                .user(user)
                .name(request.getName().trim())
                .code(request.getCode())
                .semester(request.getSemester() != null ? request.getSemester() : user.getSemester())
                .examDate(request.getExamDate())
                .color(request.getColor() != null && !request.getColor().isBlank() ? request.getColor() : "#4f46e5")
                .build();

        if (request.getUnits() != null) {
            for (SubjectDto.UnitRequest uReq : request.getUnits()) {
                Unit unit = Unit.builder()
                        .subject(subject)
                        .unitNumber(uReq.getUnitNumber() != null ? uReq.getUnitNumber() : subject.getUnits().size() + 1)
                        .title(uReq.getTitle() != null ? uReq.getTitle() : "Unit " + (subject.getUnits().size() + 1))
                        .description(uReq.getDescription())
                        .build();

                if (uReq.getTopics() != null) {
                    for (String tName : uReq.getTopics()) {
                        if (tName != null && !tName.trim().isBlank()) {
                            Topic topic = Topic.builder()
                                    .unit(unit)
                                    .name(tName.trim())
                                    .importance(Topic.Importance.MEDIUM)
                                    .build();
                            unit.getTopics().add(topic);
                        }
                    }
                }
                subject.getUnits().add(unit);
            }
        }

        Subject saved = subjectRepository.save(subject);
        log.info("Created subject '{}' (ID: {}) for user {}", saved.getName(), saved.getId(), user.getEmail());
        return mapToResponse(saved);
    }

    @Transactional
    public SubjectDto.Response updateSubject(Long id, SubjectDto.Request request, String userEmail) {
        User user = getUserByEmail(userEmail);
        Subject subject = subjectRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found or access denied"));

        subject.setName(request.getName().trim());
        if (request.getCode() != null) subject.setCode(request.getCode().trim());
        if (request.getSemester() != null) subject.setSemester(request.getSemester());
        if (request.getExamDate() != null) subject.setExamDate(request.getExamDate());
        if (request.getColor() != null) subject.setColor(request.getColor());

        Subject saved = subjectRepository.save(subject);
        return mapToResponse(saved);
    }

    @Transactional
    public void toggleArchive(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Subject subject = subjectRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found or access denied"));

        subject.setArchived(!subject.isArchived());
        subjectRepository.save(subject);
    }

    @Transactional
    public void deleteSubject(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Subject subject = subjectRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found or access denied"));

        subjectRepository.delete(subject);
        log.info("Deleted subject ID: {} for user: {}", id, user.getEmail());
    }

    @Transactional
    public SubjectDto.Response addUnit(Long subjectId, SubjectDto.UnitRequest uReq, String userEmail) {
        User user = getUserByEmail(userEmail);
        Subject subject = subjectRepository.findByIdAndUserId(subjectId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found or access denied"));

        Unit unit = Unit.builder()
                .subject(subject)
                .unitNumber(uReq.getUnitNumber() != null ? uReq.getUnitNumber() : subject.getUnits().size() + 1)
                .title(uReq.getTitle() != null ? uReq.getTitle() : "Unit " + (subject.getUnits().size() + 1))
                .description(uReq.getDescription())
                .build();

        if (uReq.getTopics() != null) {
            for (String tName : uReq.getTopics()) {
                if (tName != null && !tName.trim().isBlank()) {
                    unit.getTopics().add(Topic.builder()
                            .unit(unit)
                            .name(tName.trim())
                            .importance(Topic.Importance.MEDIUM)
                            .build());
                }
            }
        }

        subject.getUnits().add(unit);
        Subject saved = subjectRepository.save(subject);
        return mapToResponse(saved);
    }

    @Transactional
    public void toggleTopicCompletion(Long topicId, String userEmail) {
        User user = getUserByEmail(userEmail);
        Topic topic = topicRepository.findByIdAndUnitSubjectUserId(topicId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found or access denied"));

        topic.setCompleted(!topic.isCompleted());
        topicRepository.save(topic);

        // Check if all topics in unit are completed
        Unit unit = topic.getUnit();
        boolean allDone = unit.getTopics().stream().allMatch(Topic::isCompleted);
        unit.setCompleted(allDone);
        unitRepository.save(unit);
    }

    public List<SubjectDto.UnitRequest> extractSyllabus(MultipartFile file, String textInput) {
        String content = "";
        if (file != null && !file.isEmpty()) {
            try {
                if (Objects.requireNonNull(file.getOriginalFilename()).toLowerCase().endsWith(".pdf")) {
                    try (PDDocument document = Loader.loadPDF(file.getBytes())) {
                        PDFTextStripper stripper = new PDFTextStripper();
                        content = stripper.getText(document);
                    }
                } else {
                    content = new String(file.getBytes());
                }
            } catch (IOException e) {
                log.error("Failed to read syllabus file: {}", e.getMessage());
                content = "";
            }
        }

        if (content.isBlank() && textInput != null) {
            content = textInput;
        }

        return parseSyllabusStructure(content);
    }

    private List<SubjectDto.UnitRequest> parseSyllabusStructure(String text) {
        List<SubjectDto.UnitRequest> units = new ArrayList<>();
        if (text == null || text.isBlank()) {
            return units;
        }

        // Split text by lines and look for Unit/Module/Chapter markers
        Pattern unitPattern = Pattern.compile("(?i)^(unit|module|chapter)\\s*([0-9ivx]+)[:\\-\\s]*(.*)$");
        String[] lines = text.split("\\r?\\n");

        SubjectDto.UnitRequest currentUnit = null;

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;

            Matcher matcher = unitPattern.matcher(trimmed);
            if (matcher.find()) {
                currentUnit = SubjectDto.UnitRequest.builder()
                        .unitNumber(units.size() + 1)
                        .title(trimmed)
                        .topics(new ArrayList<>())
                        .build();
                units.add(currentUnit);
            } else if (currentUnit != null) {
                // If line contains commas or bullets, split as topics
                if (trimmed.startsWith("-") || trimmed.startsWith("•") || trimmed.startsWith("*")) {
                    currentUnit.getTopics().add(trimmed.substring(1).trim());
                } else if (trimmed.contains(",")) {
                    String[] parts = trimmed.split(",");
                    for (String p : parts) {
                        if (!p.trim().isEmpty() && p.trim().length() < 100) {
                            currentUnit.getTopics().add(p.trim());
                        }
                    }
                } else if (trimmed.length() < 80) {
                    currentUnit.getTopics().add(trimmed);
                }
            }
        }

        // Fallback: If no Unit markers found, create default units from paragraphs
        if (units.isEmpty()) {
            SubjectDto.UnitRequest defaultUnit = SubjectDto.UnitRequest.builder()
                    .unitNumber(1)
                    .title("Core Concepts & Overview")
                    .topics(new ArrayList<>())
                    .build();

            for (String line : lines) {
                String trimmed = line.trim();
                if (!trimmed.isEmpty() && trimmed.length() < 80) {
                    defaultUnit.getTopics().add(trimmed);
                }
                if (defaultUnit.getTopics().size() >= 8) break;
            }
            units.add(defaultUnit);
        }

        return units;
    }

    private SubjectDto.Response mapToResponse(Subject subject) {
        int totalUnits = subject.getUnits().size();
        int completedUnits = (int) subject.getUnits().stream().filter(Unit::isCompleted).count();

        int totalTopics = 0;
        int completedTopics = 0;

        List<SubjectDto.UnitResponse> unitResponses = new ArrayList<>();
        for (Unit u : subject.getUnits()) {
            totalTopics += u.getTopics().size();
            completedTopics += (int) u.getTopics().stream().filter(Topic::isCompleted).count();

            List<SubjectDto.TopicResponse> topicResponses = u.getTopics().stream()
                    .map(t -> SubjectDto.TopicResponse.builder()
                            .id(t.getId())
                            .name(t.getName())
                            .completed(t.isCompleted())
                            .importance(t.getImportance().name())
                            .build())
                    .collect(Collectors.toList());

            unitResponses.add(SubjectDto.UnitResponse.builder()
                    .id(u.getId())
                    .unitNumber(u.getUnitNumber())
                    .title(u.getTitle())
                    .description(u.getDescription())
                    .completed(u.isCompleted())
                    .topics(topicResponses)
                    .build());
        }

        return SubjectDto.Response.builder()
                .id(subject.getId())
                .name(subject.getName())
                .code(subject.getCode())
                .semester(subject.getSemester())
                .examDate(subject.getExamDate())
                .color(subject.getColor())
                .archived(subject.isArchived())
                .totalUnits(totalUnits)
                .completedUnits(completedUnits)
                .totalTopics(totalTopics)
                .completedTopics(completedTopics)
                .units(unitResponses)
                .build();
    }
}
