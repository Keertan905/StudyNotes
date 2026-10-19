package com.studyapp.backend.service;

import com.studyapp.backend.ai.AiProvider;
import com.studyapp.backend.dto.DocumentDto;
import com.studyapp.backend.exception.BadRequestException;
import com.studyapp.backend.exception.ResourceNotFoundException;
import com.studyapp.backend.model.DocumentChunk;
import com.studyapp.backend.model.StudyDocument;
import com.studyapp.backend.model.Subject;
import com.studyapp.backend.model.User;
import com.studyapp.backend.repository.DocumentChunkRepository;
import com.studyapp.backend.repository.StudyDocumentRepository;
import com.studyapp.backend.repository.SubjectRepository;
import com.studyapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final StudyDocumentRepository documentRepository;
    private final DocumentChunkRepository chunkRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final AiProvider aiProvider;

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional
    public DocumentDto.Response uploadFile(String userEmail, MultipartFile file, Long subjectId, String customTitle) {
        User user = getUserByEmail(userEmail);

        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded file is empty");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.txt";
        String fileType = determineFileType(originalFilename);
        String title = (customTitle != null && !customTitle.isBlank())
                ? customTitle.trim()
                : stripExtension(originalFilename);

        Subject subject = null;
        if (subjectId != null) {
            subject = subjectRepository.findByIdAndUserId(subjectId, user.getId()).orElse(null);
        }

        List<ExtractedPage> extractedPages = new ArrayList<>();
        int pageCount = 1;

        try {
            if ("PDF".equalsIgnoreCase(fileType)) {
                try (PDDocument pdDoc = Loader.loadPDF(file.getBytes())) {
                    pageCount = pdDoc.getNumberOfPages();
                    PDFTextStripper stripper = new PDFTextStripper();
                    for (int page = 1; page <= pageCount; page++) {
                        stripper.setStartPage(page);
                        stripper.setEndPage(page);
                        String pageText = stripper.getText(pdDoc).trim();
                        if (!pageText.isEmpty()) {
                            extractedPages.add(new ExtractedPage(page, pageText));
                        }
                    }
                }
            } else {
                // Text, Markdown, CSV, etc.
                String text = new String(file.getBytes(), StandardCharsets.UTF_8).trim();
                extractedPages.add(new ExtractedPage(1, text));
            }
        } catch (IOException e) {
            log.error("Failed to parse document {}: {}", originalFilename, e.getMessage());
            throw new BadRequestException("Failed to read and parse uploaded file: " + e.getMessage());
        }

        if (extractedPages.isEmpty()) {
            throw new BadRequestException("Could not extract any readable text from the uploaded document.");
        }

        // Generate semantic chunks
        List<DocumentChunk> chunks = chunkPages(extractedPages);

        // Generate brief AI summary
        String documentSummary = generateAiSummary(title, chunks);

        StudyDocument studyDoc = StudyDocument.builder()
                .user(user)
                .subject(subject)
                .title(title)
                .fileName(originalFilename)
                .fileType(fileType)
                .fileSize(file.getSize())
                .pageCount(pageCount)
                .chunkCount(chunks.size())
                .status("READY")
                .summary(documentSummary)
                .build();

        StudyDocument savedDoc = documentRepository.save(studyDoc);

        for (DocumentChunk chunk : chunks) {
            chunk.setDocument(savedDoc);
        }
        chunkRepository.saveAll(chunks);

        return mapToResponse(savedDoc);
    }

    @Transactional
    public DocumentDto.Response uploadText(String userEmail, DocumentDto.UploadTextRequest request) {
        User user = getUserByEmail(userEmail);

        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new BadRequestException("Document title is required");
        }
        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new BadRequestException("Document text content is required");
        }

        Subject subject = null;
        if (request.getSubjectId() != null) {
            subject = subjectRepository.findByIdAndUserId(request.getSubjectId(), user.getId()).orElse(null);
        }

        String fileName = (request.getFileName() != null && !request.getFileName().isBlank())
                ? request.getFileName()
                : request.getTitle().replaceAll("[^a-zA-Z0-9_-]", "_") + ".txt";

        List<ExtractedPage> extractedPages = List.of(new ExtractedPage(1, request.getContent().trim()));
        List<DocumentChunk> chunks = chunkPages(extractedPages);
        String summary = generateAiSummary(request.getTitle(), chunks);

        StudyDocument studyDoc = StudyDocument.builder()
                .user(user)
                .subject(subject)
                .title(request.getTitle().trim())
                .fileName(fileName)
                .fileType("TXT")
                .fileSize((long) request.getContent().getBytes(StandardCharsets.UTF_8).length)
                .pageCount(1)
                .chunkCount(chunks.size())
                .status("READY")
                .summary(summary)
                .build();

        StudyDocument savedDoc = documentRepository.save(studyDoc);

        for (DocumentChunk chunk : chunks) {
            chunk.setDocument(savedDoc);
        }
        chunkRepository.saveAll(chunks);

        return mapToResponse(savedDoc);
    }

    @Transactional(readOnly = true)
    public List<DocumentDto.Response> getDocuments(String userEmail, Long subjectId) {
        User user = getUserByEmail(userEmail);
        List<StudyDocument> docs;
        if (subjectId != null) {
            docs = documentRepository.findByUserIdAndSubjectIdOrderByCreatedAtDesc(user.getId(), subjectId);
        } else {
            docs = documentRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        }
        return docs.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DocumentDto.DocumentDetailResponse getDocumentDetails(String userEmail, Long id) {
        User user = getUserByEmail(userEmail);
        StudyDocument doc = documentRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with ID: " + id));

        List<DocumentChunk> chunks = chunkRepository.findByDocumentIdOrderByChunkIndexAsc(doc.getId());
        List<DocumentDto.ChunkResponse> chunkDtos = chunks.stream()
                .map(c -> DocumentDto.ChunkResponse.builder()
                        .id(c.getId())
                        .chunkIndex(c.getChunkIndex())
                        .pageNumber(c.getPageNumber())
                        .sectionHeading(c.getSectionHeading())
                        .chunkContent(c.getChunkContent())
                        .build())
                .collect(Collectors.toList());

        return DocumentDto.DocumentDetailResponse.builder()
                .document(mapToResponse(doc))
                .chunks(chunkDtos)
                .build();
    }

    @Transactional
    public void deleteDocument(String userEmail, Long id) {
        User user = getUserByEmail(userEmail);
        StudyDocument doc = documentRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with ID: " + id));
        documentRepository.delete(doc);
    }

    // ==========================================
    // SEMANTIC CHUNKING ALGORITHM
    // ==========================================

    private List<DocumentChunk> chunkPages(List<ExtractedPage> pages) {
        List<DocumentChunk> chunks = new ArrayList<>();
        int chunkIdx = 0;
        int targetChunkSize = 750; // Characters per chunk
        int overlapSize = 100;     // Overlap for continuity

        Pattern headingPattern = Pattern.compile("^(#+\\s+|Chapter\\s+\\d+|Unit\\s+\\d+|[0-9]+\\.[0-9]*\\s+)(.+)$", Pattern.MULTILINE | Pattern.CASE_INSENSITIVE);

        for (ExtractedPage page : pages) {
            String text = page.text.replaceAll("\\r?\\n{3,}", "\n\n").trim();
            if (text.isEmpty()) continue;

            // Find current heading if any
            String currentHeading = "Page " + page.pageNumber;
            Matcher m = headingPattern.matcher(text);
            if (m.find()) {
                currentHeading = m.group(0).trim();
            }

            // Paragraph-aware chunking
            String[] paragraphs = text.split("\n\n");
            StringBuilder currentChunk = new StringBuilder();

            for (String p : paragraphs) {
                String cleanP = p.trim();
                if (cleanP.isEmpty()) continue;

                if (currentChunk.length() + cleanP.length() > targetChunkSize && currentChunk.length() > 0) {
                    chunks.add(DocumentChunk.builder()
                            .chunkIndex(chunkIdx++)
                            .pageNumber(page.pageNumber)
                            .sectionHeading(currentHeading)
                            .chunkContent(currentChunk.toString().trim())
                            .build());

                    // Carry over tail for overlap
                    String previous = currentChunk.toString();
                    currentChunk = new StringBuilder();
                    if (previous.length() > overlapSize) {
                        currentChunk.append(previous.substring(previous.length() - overlapSize)).append("\n");
                    }
                }
                currentChunk.append(cleanP).append("\n\n");
            }

            if (currentChunk.length() > 0) {
                chunks.add(DocumentChunk.builder()
                        .chunkIndex(chunkIdx++)
                        .pageNumber(page.pageNumber)
                        .sectionHeading(currentHeading)
                        .chunkContent(currentChunk.toString().trim())
                        .build());
            }
        }

        return chunks;
    }

    private String generateAiSummary(String title, List<DocumentChunk> chunks) {
        if (chunks.isEmpty()) {
            return "Uploaded academic reference material for " + title + ".";
        }

        StringBuilder preview = new StringBuilder();
        int sampleCount = Math.min(3, chunks.size());
        for (int i = 0; i < sampleCount; i++) {
            preview.append(chunks.get(i).getChunkContent()).append("\n");
        }

        String prompt = "Provide a 2-3 sentence executive academic summary of the following document excerpt titled '" + title + "'. "
                + "Highlight the primary engineering concepts, algorithms, or theories covered:\n\n"
                + preview;

        try {
            String aiResult = aiProvider.generate("You are an expert academic summarizer.", prompt);
            if (aiResult != null && !aiResult.isBlank()) {
                return aiResult.trim();
            }
        } catch (Exception e) {
            log.warn("AI summary fallback: {}", e.getMessage());
        }

        return "Academic reference document titled '" + title + "' containing " + chunks.size() + " indexed knowledge chunks.";
    }

    private String determineFileType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf")) return "PDF";
        if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "MD";
        if (lower.endsWith(".txt")) return "TXT";
        if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "DOC";
        return "TXT";
    }

    private String stripExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot > 0 ? filename.substring(0, dot) : filename;
    }

    private DocumentDto.Response mapToResponse(StudyDocument doc) {
        return DocumentDto.Response.builder()
                .id(doc.getId())
                .subjectId(doc.getSubject() != null ? doc.getSubject().getId() : null)
                .subjectName(doc.getSubject() != null ? doc.getSubject().getName() : null)
                .subjectCode(doc.getSubject() != null ? doc.getSubject().getCode() : null)
                .title(doc.getTitle())
                .fileName(doc.getFileName())
                .fileType(doc.getFileType())
                .fileSize(doc.getFileSize())
                .pageCount(doc.getPageCount())
                .chunkCount(doc.getChunkCount())
                .status(doc.getStatus())
                .summary(doc.getSummary())
                .createdAt(doc.getCreatedAt())
                .build();
    }

    private static class ExtractedPage {
        int pageNumber;
        String text;

        ExtractedPage(int pageNumber, String text) {
            this.pageNumber = pageNumber;
            this.text = text;
        }
    }
}
