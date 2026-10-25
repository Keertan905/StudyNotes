package com.studyapp.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyapp.backend.ai.AiProvider;
import com.studyapp.backend.dto.SubjectDto;
import com.studyapp.backend.exception.BadRequestException;
import com.studyapp.backend.exception.ResourceNotFoundException;
import com.studyapp.backend.model.*;
import com.studyapp.backend.repository.*;
import com.studyapp.backend.util.FileUploadSecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
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
    private final AiProvider aiProvider;
    private final SyllabusStructureParser syllabusStructureParser;
    private final ObjectMapper objectMapper = new ObjectMapper();

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

    public SubjectDto.SyllabusAiExtractResponse aiExtractSyllabus(MultipartFile file, String textInput, String userEmail) {
        String extractionSource = "RAW_TEXT";
        List<SubjectDto.ExtractedSubject> extractedSubjects = new ArrayList<>();

        if (file != null && !file.isEmpty()) {
            String safeName = FileUploadSecurityUtil.validateAndSanitizeFile(file);

            if (FileUploadSecurityUtil.isPdfFile(safeName)) {
                extractionSource = "PDF_DOCUMENT";
                try (PDDocument document = Loader.loadPDF(file.getBytes())) {
                    // 1. Run deterministic multi-page structural parser (extracts all semesters without 25k char cutoff)
                    extractedSubjects = syllabusStructureParser.parseCompletePdf(document, safeName);

                    // If PDF has virtually no extractable text (scanned document), fall back to vision OCR
                    boolean hasLowText = extractedSubjects.isEmpty() ||
                            (extractedSubjects.size() == 1 && extractedSubjects.get(0).isNeedsReview() &&
                                    (extractedSubjects.get(0).getUnits() == null || extractedSubjects.get(0).getUnits().isEmpty() ||
                                            extractedSubjects.get(0).getUnits().get(0).getTopics().size() <= 2));

                    if (hasLowText) {
                        log.info("PDF has insufficient text layer; attempting multi-page vision OCR: {}", safeName);
                        extractionSource = "PDF_SCANNED_OCR";
                        PDFRenderer renderer = new PDFRenderer(document);
                        int pagesToScan = Math.min(document.getNumberOfPages(), 15);
                        StringBuilder ocrText = new StringBuilder();

                        for (int p = 0; p < pagesToScan; p++) {
                            BufferedImage bim = renderer.renderImageWithDPI(p, 150);
                            ByteArrayOutputStream baos = new ByteArrayOutputStream();
                            ImageIO.write(bim, "PNG", baos);
                            byte[] pngBytes = baos.toByteArray();

                            String pageOcr = aiProvider.generateWithVision(
                                    "Extract all university syllabus courses, course codes, semesters, units, and topics from this page.",
                                    "Transcribe the full syllabus text including course code, title, units, and topics in plain text.",
                                    "image/png", pngBytes
                            );
                            if (pageOcr != null && !pageOcr.isBlank()) {
                                ocrText.append("\n=== PAGE ").append(p + 1).append(" ===\n").append(pageOcr);
                            }
                        }

                        if (!ocrText.isEmpty()) {
                            List<SubjectDto.ExtractedSubject> ocrSubjects = syllabusStructureParser.parseSyllabusText(ocrText.toString(), safeName);
                            if (!ocrSubjects.isEmpty()) {
                                extractedSubjects = ocrSubjects;
                            }
                        }
                    }
                } catch (IOException e) {
                    log.error("Failed to parse PDF document {}: {}", safeName, e.getMessage());
                    throw new BadRequestException("Failed to read syllabus PDF: " + e.getMessage());
                }
            } else if (FileUploadSecurityUtil.isImageFile(safeName)) {
                extractionSource = "IMAGE_OCR";
                try {
                    String mimeType = file.getContentType();
                    if (mimeType == null || mimeType.isBlank()) {
                        String lower = safeName.toLowerCase(Locale.ROOT);
                        if (lower.endsWith(".png")) mimeType = "image/png";
                        else if (lower.endsWith(".webp")) mimeType = "image/webp";
                        else mimeType = "image/jpeg";
                    }

                    String imageOcr = aiProvider.generateWithVision(
                            "Extract all university syllabus courses, course codes, semesters, units, and topics from this syllabus image.",
                            "Transcribe the full syllabus text including course code, title, units, and topics in plain text.",
                            mimeType, file.getBytes()
                    );
                    if (imageOcr != null && !imageOcr.isBlank()) {
                        extractedSubjects = syllabusStructureParser.parseSyllabusText(imageOcr, safeName);
                    }
                } catch (IOException e) {
                    log.error("Failed to read image file {}: {}", safeName, e.getMessage());
                    throw new BadRequestException("Failed to read syllabus image: " + e.getMessage());
                }
            } else {
                // Text, Markdown, doc file
                extractionSource = "DOCUMENT_TEXT";
                try {
                    String extractedText = new String(file.getBytes(), java.nio.charset.StandardCharsets.UTF_8).trim();
                    extractedSubjects = syllabusStructureParser.parseSyllabusText(extractedText, safeName);
                } catch (Exception e) {
                    log.error("Failed to read document file {}: {}", safeName, e.getMessage());
                    throw new BadRequestException("Failed to read document file: " + e.getMessage());
                }
            }
        } else if (textInput != null && !textInput.isBlank()) {
            extractionSource = "RAW_TEXT";
            String extractedText = FileUploadSecurityUtil.sanitizeTextContent(textInput);
            extractedSubjects = syllabusStructureParser.parseSyllabusText(extractedText, "Pasted Syllabus");
        } else {
            throw new BadRequestException("Please upload a syllabus file (PDF, JPG, PNG) or enter syllabus text.");
        }

        if (extractedSubjects.isEmpty()) {
            throw new BadRequestException("Could not extract any units or topics from the provided syllabus. Please ensure the file contains readable syllabus text.");
        }

        return SubjectDto.SyllabusAiExtractResponse.builder()
                .subjects(extractedSubjects)
                .extractionSource(extractionSource)
                .rawNotes("Successfully parsed " + extractedSubjects.size() + " subject(s) across curriculum")
                .build();
    }

    private List<SubjectDto.ExtractedSubject> parseAiSyllabusResponse(String rawAiResponse, String fallbackText, String filename) {
        List<String> paletteColors = List.of("#4f46e5", "#7c3aed", "#059669", "#0284c7", "#d97706", "#e11d48");
        List<SubjectDto.ExtractedSubject> result = new ArrayList<>();

        if (rawAiResponse != null && !rawAiResponse.isBlank()) {
            try {
                String cleaned = rawAiResponse.trim();
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

                JsonNode root = objectMapper.readTree(cleaned);
                JsonNode subjectsNode = root.path("subjects");
                if (subjectsNode.isMissingNode() || !subjectsNode.isArray()) {
                    // Maybe root itself is an array
                    if (root.isArray()) {
                        subjectsNode = root;
                    }
                }

                if (subjectsNode.isArray() && !subjectsNode.isEmpty()) {
                    int subIndex = 0;
                    for (JsonNode sNode : subjectsNode) {
                        String name = sNode.path("name").asText("").trim();
                        if (name.isBlank()) {
                            name = sNode.path("course_name").asText("").trim();
                        }
                        if (name.isBlank()) {
                            name = sNode.path("title").asText("").trim();
                        }
                        if (name.isBlank()) {
                            name = "Course " + (subIndex + 1);
                        }

                        String code = sNode.path("code").asText("").trim();
                        if (code.isBlank()) {
                            code = sNode.path("course_code").asText("").trim();
                        }

                        int sem = sNode.path("semester").asInt(1);
                        if (sem <= 0) sem = 1;

                        List<SubjectDto.UnitRequest> unitRequests = new ArrayList<>();
                        JsonNode unitsNode = sNode.path("units");
                        if (unitsNode.isArray()) {
                            int uIdx = 1;
                            for (JsonNode uNode : unitsNode) {
                                int uNum = uNode.path("unitNumber").asInt(uNode.path("unit_number").asInt(uIdx));
                                String uTitle = uNode.path("title").asText("").trim();
                                if (uTitle.isBlank()) {
                                    uTitle = "Unit " + uNum;
                                }
                                String uDesc = uNode.path("description").asText(null);

                                Set<String> uniqueTopics = new LinkedHashSet<>();
                                JsonNode topicsNode = uNode.path("topics");
                                if (topicsNode.isArray()) {
                                    for (JsonNode tNode : topicsNode) {
                                        String tName = tNode.asText("").trim();
                                        if (tName.startsWith("-") || tName.startsWith("•") || tName.startsWith("*")) {
                                            tName = tName.substring(1).trim();
                                        }
                                        if (!tName.isBlank() && tName.length() > 1) {
                                            uniqueTopics.add(tName);
                                        }
                                    }
                                }

                                unitRequests.add(SubjectDto.UnitRequest.builder()
                                        .unitNumber(uNum)
                                        .title(uTitle)
                                        .description(uDesc)
                                        .topics(new ArrayList<>(uniqueTopics))
                                        .build());
                                uIdx++;
                            }
                        }

                        result.add(SubjectDto.ExtractedSubject.builder()
                                .name(name)
                                .code(!code.isBlank() ? code : null)
                                .semester(sem)
                                .color(paletteColors.get(subIndex % paletteColors.size()))
                                .units(unitRequests)
                                .build());
                        subIndex++;
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to parse JSON syllabus response: {}", e.getMessage());
            }
        }

        // Fallback: If AI parsing failed or returned no subjects, and we have fallbackText
        if (result.isEmpty() && fallbackText != null && !fallbackText.isBlank()) {
            log.info("Using heuristic text fallback for syllabus parsing");
            List<SubjectDto.UnitRequest> fallbackUnits = parseSyllabusStructure(fallbackText);
            if (!fallbackUnits.isEmpty()) {
                String subName = "Course Syllabus";
                if (filename != null && !filename.isBlank()) {
                    int dot = filename.lastIndexOf('.');
                    subName = dot > 0 ? filename.substring(0, dot) : filename;
                    subName = subName.replace('_', ' ').replace('-', ' ').trim();
                }

                result.add(SubjectDto.ExtractedSubject.builder()
                        .name(subName)
                        .code(null)
                        .semester(1)
                        .color(paletteColors.get(0))
                        .units(fallbackUnits)
                        .build());
            }
        }

        return result;
    }

    @Transactional
    public List<SubjectDto.Response> batchImportSubjects(SubjectDto.BatchImportRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);
        List<SubjectDto.Response> savedResponses = new ArrayList<>();

        if (request == null || request.getSubjects() == null || request.getSubjects().isEmpty()) {
            throw new BadRequestException("No subjects provided for import");
        }

        List<Subject> existingSubjects = subjectRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        for (SubjectDto.Request req : request.getSubjects()) {
            if (req.getName() == null || req.getName().trim().isBlank()) {
                continue;
            }

            String reqName = req.getName().trim();
            String reqCode = req.getCode() != null && !req.getCode().trim().isBlank() ? req.getCode().trim() : null;
            int sem = req.getSemester() != null ? req.getSemester() : (user.getSemester() != null ? user.getSemester() : 1);

            // Deduplication check: check if user already has a subject in this semester with matching code or matching name
            Subject subject = existingSubjects.stream()
                    .filter(s -> Objects.equals(s.getSemester(), sem) &&
                            ((reqCode != null && s.getCode() != null && s.getCode().equalsIgnoreCase(reqCode))
                                    || s.getName().trim().equalsIgnoreCase(reqName)))
                    .findFirst()
                    .orElse(null);

            boolean isUpdate = (subject != null);
            if (!isUpdate) {
                subject = Subject.builder()
                        .user(user)
                        .name(reqName)
                        .code(reqCode)
                        .semester(sem)
                        .examDate(req.getExamDate())
                        .color(req.getColor() != null && !req.getColor().isBlank() ? req.getColor() : "#4f46e5")
                        .build();
            } else {
                if (reqCode != null) subject.setCode(reqCode);
                if (req.getExamDate() != null) subject.setExamDate(req.getExamDate());
                if (req.getColor() != null && !req.getColor().isBlank()) subject.setColor(req.getColor());
            }

            if (req.getUnits() != null) {
                if (isUpdate) {
                    Map<Integer, Unit> existingUnitsByNum = new HashMap<>();
                    for (Unit u : subject.getUnits()) {
                        existingUnitsByNum.put(u.getUnitNumber(), u);
                    }

                    int unitNum = 1;
                    for (SubjectDto.UnitRequest uReq : req.getUnits()) {
                        int targetNum = uReq.getUnitNumber() != null ? uReq.getUnitNumber() : unitNum;
                        Unit unit = existingUnitsByNum.get(targetNum);
                        if (unit == null) {
                            unit = Unit.builder()
                                    .subject(subject)
                                    .unitNumber(targetNum)
                                    .title(uReq.getTitle() != null && !uReq.getTitle().isBlank() ? uReq.getTitle().trim() : "Unit " + targetNum)
                                    .description(uReq.getDescription())
                                    .build();
                            subject.getUnits().add(unit);
                        } else {
                            if (uReq.getTitle() != null && !uReq.getTitle().isBlank()) {
                                unit.setTitle(uReq.getTitle().trim());
                            }
                            if (uReq.getDescription() != null) {
                                unit.setDescription(uReq.getDescription());
                            }
                        }

                        if (uReq.getTopics() != null) {
                            Set<String> existingTopicNames = new HashSet<>();
                            for (Topic t : unit.getTopics()) {
                                existingTopicNames.add(t.getName().trim().toLowerCase(Locale.ROOT));
                            }
                            for (String tName : uReq.getTopics()) {
                                if (tName != null && !tName.trim().isBlank()) {
                                    String cleanTopic = tName.trim();
                                    if (!existingTopicNames.contains(cleanTopic.toLowerCase(Locale.ROOT))) {
                                        Topic topic = Topic.builder()
                                                .unit(unit)
                                                .name(cleanTopic)
                                                .importance(Topic.Importance.MEDIUM)
                                                .build();
                                        unit.getTopics().add(topic);
                                        existingTopicNames.add(cleanTopic.toLowerCase(Locale.ROOT));
                                    }
                                }
                            }
                        }
                        unitNum++;
                    }
                } else {
                    int unitNum = 1;
                    for (SubjectDto.UnitRequest uReq : req.getUnits()) {
                        Unit unit = Unit.builder()
                                .subject(subject)
                                .unitNumber(uReq.getUnitNumber() != null ? uReq.getUnitNumber() : unitNum)
                                .title(uReq.getTitle() != null && !uReq.getTitle().isBlank() ? uReq.getTitle().trim() : "Unit " + unitNum)
                                .description(uReq.getDescription())
                                .build();

                        if (uReq.getTopics() != null) {
                            Set<String> seenTopics = new LinkedHashSet<>();
                            for (String tName : uReq.getTopics()) {
                                if (tName != null && !tName.trim().isBlank()) {
                                    seenTopics.add(tName.trim());
                                }
                            }
                            for (String tName : seenTopics) {
                                Topic topic = Topic.builder()
                                        .unit(unit)
                                        .name(tName)
                                        .importance(Topic.Importance.MEDIUM)
                                        .build();
                                unit.getTopics().add(topic);
                            }
                        }
                        subject.getUnits().add(unit);
                        unitNum++;
                    }
                }
            }

            Subject saved = subjectRepository.save(subject);
            savedResponses.add(mapToResponse(saved));
            log.info("Batch imported subject '{}' (ID: {}, isUpdate: {}) with {} units for user {}",
                    saved.getName(), saved.getId(), isUpdate, saved.getUnits().size(), user.getEmail());
        }

        return savedResponses;
    }

    public List<SubjectDto.UnitRequest> extractSyllabus(MultipartFile file, String textInput) {
        String content = "";
        if (file != null && !file.isEmpty()) {
            try {
                String safeName = com.studyapp.backend.util.FileUploadSecurityUtil.validateAndSanitizeFile(file);
                if (safeName.toLowerCase().endsWith(".pdf")) {
                    try (PDDocument document = Loader.loadPDF(file.getBytes())) {
                        PDFTextStripper stripper = new PDFTextStripper();
                        content = stripper.getText(document);
                    }
                } else {
                    content = new String(file.getBytes(), java.nio.charset.StandardCharsets.UTF_8);
                }
            } catch (IOException e) {
                log.error("Failed to read syllabus file: {}", e.getMessage());
                content = "";
            }
        }

        if (content.isBlank() && textInput != null) {
            content = com.studyapp.backend.util.FileUploadSecurityUtil.sanitizeTextContent(textInput);
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
