package com.studyapp.backend.service;

import com.studyapp.backend.dto.SubjectDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * High-precision, document-structure-aware syllabus parser for multi-semester university curricula
 * (including RGPV CS/IT/CSIT branch syllabi).
 *
 * Preserves document reading order, semester boundaries, course codes, multi-page units, and topic hierarchies
 * without truncation or keyword-only heuristics.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class SyllabusStructureParser {

    private static final List<String> PALETTE_COLORS = List.of(
            "#4f46e5", "#7c3aed", "#059669", "#0284c7", "#d97706", "#e11d48", "#0891b2", "#475569"
    );

    // Regex for Semester detection: matches "Semester - III", "III Semester", "Semester 3", "3rd Semester", etc.
    private static final Pattern SEMESTER_PATTERN = Pattern.compile(
            "(?i)(?:^|[\\s(\\[])(?:semester|sem)\\s*[-:–]?\\s*([IVX0-9]+|first|second|third|fourth|fifth|sixth|seventh|eighth|1st|2nd|3rd|4th|5th|6th|7th|8th)\\b"
    );
    private static final Pattern ALT_SEMESTER_PATTERN = Pattern.compile(
            "(?i)\\b([IVX]+|1st|2nd|3rd|4th|5th|6th|7th|8th)\\s+(?:semester|sem)\\b"
    );

    // Regex for Course Code: e.g. CSIT-301, CS-302, IT301, BT-101, ES-301, CSIT-701(A), CS601B
    private static final Pattern COURSE_CODE_PATTERN = Pattern.compile(
            "\\b([A-Z]{2,5}[ -]?\\d{3}[A-Z]?(?:\\([A-Z0-9]+\\))?)(?=\\s|[:\\-–]|$)"
    );

    // Regex for Unit headers: matches "Unit - I: ...", "UNIT 1: ...", "Module - II ...", "Chapter 3: ..."
    private static final Pattern UNIT_PATTERN = Pattern.compile(
            "(?i)^(?:unit|module|chapter)\\s*[-:–]?\\s*([0-9ivx]+)\\s*[:\\-–\\s]*(.*)$"
    );

    // Section stop markers where syllabus content ends for a unit/subject
    private static final Pattern STOP_SECTION_PATTERN = Pattern.compile(
            "(?i)^(?:suggested\\s+)?(?:references|text\\s*books?|reference\\s*books?|recommended\\s*books?|books\\s*recommended|reading\\s*materials?|course\\s*outcomes?|cos?|evaluation\\s*scheme|scheme\\s*of\\s*(?:teaching|examination)|guidelines\\s*for\\s*execution)\\s*[:\\-–]?.*$"
    );

    // Repeated running headers/footers to ignore
    private static final Pattern RUNNING_NOISE_PATTERN = Pattern.compile(
            "(?i)^.*(?:rajiv\\s+gandhi\\s+proudyogiki|rgpv\\s*bhopal|aicte\\s+flexible|credit\\s+based\\s+grading|w\\.e\\.f\\.|page\\s+\\d+\\s+of\\s+\\d+).*$"
    );

    /**
     * Extracts and organizes complete syllabus hierarchy from an Apache PDFBox PDDocument across all pages.
     */
    public List<SubjectDto.ExtractedSubject> parseCompletePdf(PDDocument document, String originalFilename) throws IOException {
        int pageCount = document.getNumberOfPages();
        log.info("Parsing complete PDF syllabus '{}' containing {} pages", originalFilename, pageCount);

        PDFTextStripper stripper = new PDFTextStripper();
        stripper.setSortByPosition(true);

        StringBuilder fullTextBuilder = new StringBuilder();

        for (int page = 1; page <= pageCount; page++) {
            stripper.setStartPage(page);
            stripper.setEndPage(page);
            String pageText = stripper.getText(document);

            if (pageText != null && !pageText.isBlank()) {
                fullTextBuilder.append("\n=== PAGE ").append(page).append(" ===\n");
                fullTextBuilder.append(pageText);
            }
        }

        return parseSyllabusText(fullTextBuilder.toString(), originalFilename);
    }

    /**
     * Parses structured syllabus hierarchy from full curriculum text, preserving semester, subject,
     * and unit sequences.
     */
    public List<SubjectDto.ExtractedSubject> parseSyllabusText(String fullText, String originalFilename) {
        if (fullText == null || fullText.isBlank()) {
            return Collections.emptyList();
        }

        String[] rawLines = fullText.split("\\r?\\n");
        List<ParsedSubjectBuilder> subjectBuilders = new ArrayList<>();

        Integer currentSemester = null;
        ParsedSubjectBuilder currentSubject = null;
        ParsedUnitBuilder currentUnit = null;
        boolean inStopSection = false;
        int currentSubjectOrder = 0;

        for (int i = 0; i < rawLines.length; i++) {
            String rawLine = rawLines[i];
            String trimmed = rawLine.trim();

            if (trimmed.isEmpty()) continue;

            // Page delimiter markers
            if (trimmed.startsWith("=== PAGE ") && trimmed.endsWith(" ===")) {
                // Keep current subject & unit active across page boundaries
                inStopSection = false;
                continue;
            }

            // Skip running headers and footers
            if (RUNNING_NOISE_PATTERN.matcher(trimmed).matches()) {
                continue;
            }

            // Check for Semester changes
            Integer detectedSem = detectSemester(trimmed);
            if (detectedSem != null) {
                if (currentSemester == null || !currentSemester.equals(detectedSem)) {
                    currentSemester = detectedSem;
                    currentSubjectOrder = 0;
                    inStopSection = false;
                }
            }

            // Check for Stop Sections (References, Text Books, Scheme Tables)
            if (STOP_SECTION_PATTERN.matcher(trimmed).matches()) {
                inStopSection = true;
                continue;
            }

            // Check if line declares a Subject / Course Code Header
            SubjectHeaderMatch headerMatch = detectSubjectHeader(trimmed, rawLines, i);
            if (headerMatch != null) {
                // Complete previous unit and subject
                if (currentUnit != null && currentSubject != null) {
                    currentSubject.units.add(currentUnit);
                    currentUnit = null;
                }
                if (currentSubject != null) {
                    subjectBuilders.add(currentSubject);
                }

                currentSubjectOrder++;
                currentSubject = new ParsedSubjectBuilder();
                currentSubject.semester = currentSemester != null ? currentSemester : inferSemesterFromCode(headerMatch.code);
                currentSubject.code = headerMatch.code;
                currentSubject.name = headerMatch.title;
                currentSubject.subjectType = headerMatch.type;
                currentSubject.orderIndex = currentSubjectOrder;
                inStopSection = false;

                if (headerMatch.linesConsumed > 0) {
                    i += headerMatch.linesConsumed;
                }
                continue;
            }

            // If we are currently inside a Reference or Scheme section of the current subject, skip until next Unit/Subject
            if (inStopSection) {
                Matcher unitCheck = UNIT_PATTERN.matcher(trimmed);
                if (unitCheck.matches()) {
                    inStopSection = false;
                } else {
                    continue;
                }
            }

            // Check for Unit / Module Heading
            Matcher unitMatcher = UNIT_PATTERN.matcher(trimmed);
            if (unitMatcher.matches()) {
                // If we don't have an active subject yet, synthesize an initial subject
                if (currentSubject == null) {
                    currentSubjectOrder++;
                    currentSubject = new ParsedSubjectBuilder();
                    currentSubject.semester = currentSemester != null ? currentSemester : 1;
                    currentSubject.code = null;
                    currentSubject.name = deriveSubjectNameFromFilename(originalFilename);
                    currentSubject.subjectType = "CORE / THEORY";
                    currentSubject.orderIndex = currentSubjectOrder;
                }

                if (currentUnit != null) {
                    currentSubject.units.add(currentUnit);
                }

                int unitNum = parseRomanOrArabicNumber(unitMatcher.group(1));
                if (unitNum <= 0) unitNum = currentSubject.units.size() + 1;

                String rest = unitMatcher.group(2).trim();
                String unitTitle;
                String inlineTopics = null;

                if (rest.contains(":")) {
                    String[] parts = rest.split(":", 2);
                    String candidateTitle = parts[0].trim();
                    if (!candidateTitle.isBlank() && candidateTitle.length() < 60) {
                        unitTitle = candidateTitle;
                        inlineTopics = parts[1].trim();
                    } else {
                        unitTitle = "Unit " + unitNum;
                        inlineTopics = rest;
                    }
                } else if (rest.contains("–") || rest.contains("-")) {
                    String[] parts = rest.split("[–\\-]", 2);
                    String candidateTitle = parts[0].trim();
                    if (!candidateTitle.isBlank() && candidateTitle.length() < 60) {
                        unitTitle = candidateTitle;
                        inlineTopics = parts[1].trim();
                    } else {
                        unitTitle = "Unit " + unitNum;
                        inlineTopics = rest;
                    }
                } else if (rest.contains(",") || rest.contains(";")) {
                    unitTitle = "Unit " + unitNum;
                    inlineTopics = rest;
                } else {
                    unitTitle = rest.isBlank() ? "Unit " + unitNum : rest;
                }

                if (!unitTitle.toLowerCase(Locale.ROOT).startsWith("unit")) {
                    unitTitle = "Unit " + unitNum + ": " + unitTitle;
                }

                currentUnit = new ParsedUnitBuilder();
                currentUnit.unitNumber = unitNum;
                currentUnit.title = unitTitle;

                if (inlineTopics != null && !inlineTopics.isBlank()) {
                    parseAndAddTopics(inlineTopics, currentUnit);
                }

                continue;
            }

            // If we are inside an active Unit, decompose text into topics
            if (currentUnit != null && !inStopSection) {
                parseAndAddTopics(trimmed, currentUnit);
            }
        }

        // Close final unit and subject
        if (currentUnit != null && currentSubject != null) {
            currentSubject.units.add(currentUnit);
        }
        if (currentSubject != null) {
            subjectBuilders.add(currentSubject);
        }

        // Convert builders to ExtractedSubject DTOs with validation & confidence assessment
        return buildExtractedSubjects(subjectBuilders, originalFilename);
    }

    private void parseAndAddTopics(String line, ParsedUnitBuilder unit) {
        // Remove trailing hours/marks e.g. "(08 Hours)", "[8 Lectures]"
        String cleaned = line.replaceAll("(?i)\\(\\s*\\d+\\s*(?:hours?|lectures?|hrs?|periods?)\\s*\\)", "").trim();
        cleaned = cleaned.replaceAll("(?i)\\[\\s*\\d+\\s*(?:hours?|lectures?|hrs?|periods?)\\s*\\]", "").trim();

        if (cleaned.isBlank() || cleaned.length() < 3) return;

        // Skip lines that look like page numbering or table headers
        if (cleaned.matches("^\\d+$") || cleaned.equalsIgnoreCase("theory") || cleaned.equalsIgnoreCase("practical")) {
            return;
        }

        // Bullet point check
        if (cleaned.startsWith("-") || cleaned.startsWith("•") || cleaned.startsWith("*") || cleaned.matches("^\\d+\\.\\s+.*")) {
            String topic = cleaned.replaceFirst("^[\\-•*\\d.]+\\s*", "").trim();
            if (!topic.isBlank()) {
                unit.topics.add(sanitizeTopicName(topic));
            }
            return;
        }

        // Split by semicolons, colons (when representing topic sections), or commas
        if (cleaned.contains(";") || cleaned.contains(",") || cleaned.contains(":")) {
            String[] segments = cleaned.split("[;,]");
            for (String seg : segments) {
                String sub = seg.trim();
                // If contains colon (e.g. "Arrays: Representation and operations"), split or preserve
                if (sub.contains(":") && !sub.toLowerCase(Locale.ROOT).startsWith("http")) {
                    String[] colonParts = sub.split(":", 2);
                    for (String cp : colonParts) {
                        String cand = sanitizeTopicName(cp.trim());
                        if (isValidTopic(cand)) {
                            unit.topics.add(cand);
                        }
                    }
                } else {
                    String cand = sanitizeTopicName(sub);
                    if (isValidTopic(cand)) {
                        unit.topics.add(cand);
                    }
                }
            }
        } else {
            String cand = sanitizeTopicName(cleaned);
            if (isValidTopic(cand)) {
                unit.topics.add(cand);
            }
        }
    }

    private boolean isValidTopic(String topic) {
        if (topic == null || topic.isBlank()) return false;
        if (topic.length() < 2 || topic.length() > 140) return false;
        String lower = topic.toLowerCase(Locale.ROOT);
        return !lower.startsWith("unit ") && !lower.startsWith("module ") && !lower.startsWith("semester ");
    }

    private String sanitizeTopicName(String topic) {
        return topic.replaceAll("^[\\-•*:,\\s]+", "")
                .replaceAll("[\\-•*:,\\s]+$", "")
                .trim();
    }

    private Integer detectSemester(String line) {
        Matcher m1 = SEMESTER_PATTERN.matcher(line);
        if (m1.find()) {
            return parseSemesterToken(m1.group(1));
        }
        Matcher m2 = ALT_SEMESTER_PATTERN.matcher(line);
        if (m2.find()) {
            return parseSemesterToken(m2.group(1));
        }
        return null;
    }

    private Integer parseSemesterToken(String token) {
        if (token == null) return null;
        String lower = token.trim().toLowerCase(Locale.ROOT);
        return switch (lower) {
            case "i", "1", "1st", "first" -> 1;
            case "ii", "2", "2nd", "second" -> 2;
            case "iii", "3", "3rd", "third" -> 3;
            case "iv", "4", "4th", "fourth" -> 4;
            case "v", "5", "5th", "fifth" -> 5;
            case "vi", "6", "6th", "sixth" -> 6;
            case "vii", "7", "7th", "seventh" -> 7;
            case "viii", "8", "8th", "eighth" -> 8;
            default -> null;
        };
    }

    private Integer inferSemesterFromCode(String code) {
        if (code == null) return 1;
        Matcher m = Pattern.compile("\\d{3}").matcher(code);
        if (m.find()) {
            char firstDigit = m.group().charAt(0);
            int sem = Character.getNumericValue(firstDigit);
            if (sem >= 1 && sem <= 8) return sem;
        }
        return 1;
    }

    private SubjectHeaderMatch detectSubjectHeader(String line, String[] allLines, int currentIndex) {
        // Typical formats:
        // "CSIT-301 Discrete Mathematics"
        // "Course Code: CSIT-501 Course Title: Theory of Computation"
        // "CSIT 601 - Computer Networks"
        // "CSIT-701(A) Cloud Computing (Departmental Elective-I)"
        Matcher codeMatcher = COURSE_CODE_PATTERN.matcher(line);
        if (!codeMatcher.find()) {
            return null;
        }

        String matchedCode = codeMatcher.group(1).trim();

        // Validate that this is indeed an academic course code rather than a random date or acronym
        String prefix = matchedCode.replaceAll("[ -]?\\d+.*$", "").toUpperCase(Locale.ROOT);
        if (prefix.length() < 2 || prefix.length() > 5) {
            return null;
        }

        // Extract title following the code on the same line
        int codeEnd = codeMatcher.end();
        String remainder = line.substring(codeEnd).replaceAll("^[\\-–:]+\\s*", "").trim();
        int linesConsumed = 0;

        // If remainder is empty or very short, title might be on the immediate next line
        if (remainder.isBlank() && currentIndex + 1 < allLines.length) {
            String nextLine = allLines[currentIndex + 1].trim();
            if (!nextLine.isEmpty() && !UNIT_PATTERN.matcher(nextLine).matches() && !COURSE_CODE_PATTERN.matcher(nextLine).find()) {
                remainder = nextLine;
                linesConsumed = 1;
            }
        }

        if (remainder.isBlank()) {
            remainder = "Course " + matchedCode;
        }

        // Detect Course Type
        String type = "CORE / THEORY";
        String lowerRemainder = remainder.toLowerCase(Locale.ROOT);
        if (lowerRemainder.contains("departmental elective") || lowerRemainder.contains("dept elective") || lowerRemainder.contains("pec")) {
            type = "DEPARTMENTAL ELECTIVE";
        } else if (lowerRemainder.contains("open elective") || lowerRemainder.contains("oec")) {
            type = "OPEN ELECTIVE";
        } else if (lowerRemainder.contains("lab") || lowerRemainder.contains("practical") || lowerRemainder.contains("laboratory")) {
            type = "PRACTICAL / LAB";
        }

        // Clean up title (remove trailing categories or parentheses e.g. "(Departmental Elective-I)")
        String cleanTitle = remainder.replaceAll("(?i)\\((?:departmental|open|dept)?\\s*elective[^)]*\\)", "")
                .replaceAll("(?i)\\b(?:pcc|pec|oec|esc|bsc)\\b", "")
                .replaceAll("^[\\-–:\\s]+", "")
                .replaceAll("[\\-–:\\s]+$", "")
                .trim();

        if (cleanTitle.isBlank()) cleanTitle = "Course " + matchedCode;

        return new SubjectHeaderMatch(matchedCode, cleanTitle, type, linesConsumed);
    }

    private List<SubjectDto.ExtractedSubject> buildExtractedSubjects(List<ParsedSubjectBuilder> builders, String originalFilename) {
        List<SubjectDto.ExtractedSubject> result = new ArrayList<>();
        int colorIdx = 0;

        for (ParsedSubjectBuilder b : builders) {
            // Deduplicate and filter units
            List<SubjectDto.UnitRequest> finalUnits = new ArrayList<>();
            int uIdx = 1;
            for (ParsedUnitBuilder ub : b.units) {
                // Deduplicate topics within unit preserving order
                Set<String> uniqueTopics = new LinkedHashSet<>(ub.topics);
                if (uniqueTopics.isEmpty()) {
                    String fallbackTopic = ub.title.replaceFirst("(?i)^unit\\s*\\d+[:\\s]*", "").trim();
                    if (!fallbackTopic.isBlank()) {
                        uniqueTopics.add(fallbackTopic);
                    } else {
                        uniqueTopics.add("Unit Concepts & Methodology");
                    }
                }
                finalUnits.add(SubjectDto.UnitRequest.builder()
                        .unitNumber(ub.unitNumber > 0 ? ub.unitNumber : uIdx)
                        .title(ub.title)
                        .topics(new ArrayList<>(uniqueTopics))
                        .build());
                uIdx++;
            }

            // Confidence Scoring & Manual Review Flagging (Requirement 8)
            boolean needsReview = false;
            List<String> reviewReasons = new ArrayList<>();

            if (b.code == null || b.code.isBlank()) {
                needsReview = true;
                reviewReasons.add("Course code not detected");
            }
            if (b.semester == null || b.semester <= 0) {
                b.semester = 1;
                needsReview = true;
                reviewReasons.add("Semester could not be confirmed (defaulted to 1)");
            }
            if (finalUnits.size() < 3) {
                needsReview = true;
                reviewReasons.add(finalUnits.isEmpty()
                        ? "No units could be parsed"
                        : "Only " + finalUnits.size() + " unit(s) parsed (expected 4–5 units)");
            }

            result.add(SubjectDto.ExtractedSubject.builder()
                    .name(b.name)
                    .code(b.code)
                    .semester(b.semester)
                    .subjectType(b.subjectType != null ? b.subjectType : "CORE / THEORY")
                    .color(PALETTE_COLORS.get(colorIdx % PALETTE_COLORS.size()))
                    .needsReview(needsReview)
                    .reviewReason(!reviewReasons.isEmpty() ? String.join("; ", reviewReasons) : null)
                    .orderIndex(b.orderIndex)
                    .units(finalUnits)
                    .build());

            colorIdx++;
        }

        // If no subjects could be identified at all, produce a flagged fallback subject
        if (result.isEmpty()) {
            log.warn("No structured subjects identified; generating single fallback subject with review flag");
            result.add(SubjectDto.ExtractedSubject.builder()
                    .name(deriveSubjectNameFromFilename(originalFilename))
                    .code(null)
                    .semester(1)
                    .subjectType("CORE / THEORY")
                    .color(PALETTE_COLORS.get(0))
                    .needsReview(true)
                    .reviewReason("Document structure could not be parsed automatically. Please review and edit units.")
                    .orderIndex(1)
                    .units(List.of(
                            SubjectDto.UnitRequest.builder()
                                    .unitNumber(1)
                                    .title("Unit 1: Core Fundamentals")
                                    .topics(new ArrayList<>(List.of("Overview", "Core Principles")))
                                    .build()
                    ))
                    .build());
        }

        return result;
    }

    private String deriveSubjectNameFromFilename(String filename) {
        if (filename == null || filename.isBlank()) return "Curriculum Syllabus";
        int dot = filename.lastIndexOf('.');
        String base = dot > 0 ? filename.substring(0, dot) : filename;
        return base.replace('_', ' ').replace('-', ' ').trim();
    }

    private static class SubjectHeaderMatch {
        final String code;
        final String title;
        final String type;
        final int linesConsumed;

        SubjectHeaderMatch(String code, String title, String type, int linesConsumed) {
            this.code = code;
            this.title = title;
            this.type = type;
            this.linesConsumed = linesConsumed;
        }
    }

    private static class ParsedSubjectBuilder {
        Integer semester;
        String code;
        String name;
        String subjectType;
        int orderIndex;
        List<ParsedUnitBuilder> units = new ArrayList<>();
    }

    private static class ParsedUnitBuilder {
        int unitNumber;
        String title;
        List<String> topics = new ArrayList<>();
    }

    private int parseRomanOrArabicNumber(String text) {
        if (text == null) return 1;
        String t = text.trim().toUpperCase(Locale.ROOT);
        return switch (t) {
            case "I", "1" -> 1;
            case "II", "2" -> 2;
            case "III", "3" -> 3;
            case "IV", "4" -> 4;
            case "V", "5" -> 5;
            case "VI", "6" -> 6;
            case "VII", "7" -> 7;
            case "VIII", "8" -> 8;
            default -> {
                try {
                    yield Integer.parseInt(t);
                } catch (NumberFormatException e) {
                    yield 1;
                }
            }
        };
    }
}
