package com.studyapp.backend.service;

import com.studyapp.backend.dto.RagCitationDto;
import com.studyapp.backend.model.DocumentChunk;
import com.studyapp.backend.model.StudyDocument;
import com.studyapp.backend.model.User;
import com.studyapp.backend.repository.DocumentChunkRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RagService {

    private final DocumentChunkRepository chunkRepository;

    private static final Set<String> STOP_WORDS = Set.of(
            "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "with", "by", "from",
            "is", "are", "was", "were", "what", "how", "why", "when", "where", "can", "could",
            "explain", "show", "describe", "give", "tell", "me", "this", "that", "these", "those"
    );

    @Data
    @Builder
    public static class RetrievalResult {
        private List<RagCitationDto> citations;
        private String formattedContext;
        private double groundingConfidence;
        private boolean hasRelevantContext;
    }

    @Transactional(readOnly = true)
    public RetrievalResult retrieveRelevantContext(User user, String query, List<Long> docIds, Long subjectId) {
        if (query == null || query.isBlank()) {
            return RetrievalResult.builder()
                    .citations(Collections.emptyList())
                    .formattedContext("")
                    .groundingConfidence(0.0)
                    .hasRelevantContext(false)
                    .build();
        }

        // 1. Fetch candidate chunks
        List<DocumentChunk> candidates;
        if (docIds != null && !docIds.isEmpty()) {
            candidates = chunkRepository.findByUserIdAndDocumentIdIn(user.getId(), docIds);
        } else if (subjectId != null) {
            candidates = chunkRepository.findByUserIdAndSubjectId(user.getId(), subjectId);
        } else {
            candidates = chunkRepository.findAllByUserId(user.getId());
        }

        if (candidates.isEmpty()) {
            return RetrievalResult.builder()
                    .citations(Collections.emptyList())
                    .formattedContext("")
                    .groundingConfidence(0.0)
                    .hasRelevantContext(false)
                    .build();
        }

        // 2. Tokenize and clean query
        List<String> queryTokens = Arrays.stream(query.toLowerCase().split("[^a-zA-Z0-9]+"))
                .filter(t -> t.length() > 2 && !STOP_WORDS.contains(t))
                .collect(Collectors.toList());

        if (queryTokens.isEmpty()) {
            queryTokens = Arrays.stream(query.toLowerCase().split("[^a-zA-Z0-9]+"))
                    .filter(t -> t.length() > 1)
                    .collect(Collectors.toList());
        }

        // 3. Score candidate chunks
        List<ScoredChunk> scoredChunks = new ArrayList<>();
        String normalizedQuery = query.toLowerCase().trim();

        for (DocumentChunk chunk : candidates) {
            String chunkText = chunk.getChunkContent().toLowerCase();
            String heading = chunk.getSectionHeading() != null ? chunk.getSectionHeading().toLowerCase() : "";
            StudyDocument doc = chunk.getDocument();
            String docTitle = doc != null ? doc.getTitle().toLowerCase() : "";

            double score = 0.0;

            // Exact phrase match bonus
            if (chunkText.contains(normalizedQuery)) {
                score += 1.5;
            }

            // Heading match bonus
            for (String token : queryTokens) {
                if (heading.contains(token)) {
                    score += 0.5;
                }
                if (docTitle.contains(token)) {
                    score += 0.3;
                }
            }

            // Token frequency & density in content
            int matches = 0;
            for (String token : queryTokens) {
                if (chunkText.contains(token)) {
                    matches++;
                    // count occurrences up to 3
                    int count = 0;
                    int idx = 0;
                    while ((idx = chunkText.indexOf(token, idx)) != -1 && count < 3) {
                        count++;
                        idx += token.length();
                    }
                    score += 0.2 * count;
                }
            }

            // Keyword coverage percentage
            if (!queryTokens.isEmpty()) {
                double coverage = (double) matches / queryTokens.size();
                score += coverage * 1.0;
            }

            if (score > 0.25) {
                scoredChunks.add(new ScoredChunk(chunk, score));
            }
        }

        scoredChunks.sort((a, b) -> Double.compare(b.score, a.score));

        // Take top 4 chunks
        List<ScoredChunk> topChunks = scoredChunks.stream().limit(4).collect(Collectors.toList());

        if (topChunks.isEmpty()) {
            return RetrievalResult.builder()
                    .citations(Collections.emptyList())
                    .formattedContext("")
                    .groundingConfidence(0.0)
                    .hasRelevantContext(false)
                    .build();
        }

        // Build citations and context
        List<RagCitationDto> citations = new ArrayList<>();
        StringBuilder contextBuilder = new StringBuilder();
        contextBuilder.append("=== VERIFIED DOCUMENT GROUNDING CONTEXT ===\n");
        contextBuilder.append("Use the following indexed reference chunks to construct your answer. Cite your sources in the text using bracketed numbers [1], [2] matching these references:\n\n");

        int citationIdx = 1;
        double totalScore = 0.0;

        for (ScoredChunk sc : topChunks) {
            DocumentChunk c = sc.chunk;
            StudyDocument doc = c.getDocument();
            String docTitle = doc != null ? doc.getTitle() : "Reference Document";
            String fileName = doc != null ? doc.getFileName() : "doc.pdf";

            // Extract high-yield snippet (~200 chars)
            String snippet = createSnippet(c.getChunkContent(), queryTokens);
            double normalizedScore = Math.min(0.99, Math.max(0.40, sc.score / 3.0));
            totalScore += normalizedScore;

            citations.add(RagCitationDto.builder()
                    .citationIndex(citationIdx)
                    .documentId(doc != null ? doc.getId() : null)
                    .documentTitle(docTitle)
                    .fileName(fileName)
                    .pageNumber(c.getPageNumber())
                    .sectionHeading(c.getSectionHeading())
                    .snippet(snippet)
                    .relevanceScore(Math.round(normalizedScore * 100.0) / 100.0)
                    .build());

            contextBuilder.append(String.format("[%d] Source: \"%s\" (Page %d, Section: \"%s\")\n\"%s\"\n\n",
                    citationIdx, docTitle, c.getPageNumber(), c.getSectionHeading(), c.getChunkContent()));

            citationIdx++;
        }

        double confidence = topChunks.isEmpty() ? 0.0 : totalScore / topChunks.size();
        confidence = Math.round(confidence * 100.0) / 100.0;

        return RetrievalResult.builder()
                .citations(citations)
                .formattedContext(contextBuilder.toString())
                .groundingConfidence(confidence)
                .hasRelevantContext(true)
                .build();
    }

    private String createSnippet(String content, List<String> queryTokens) {
        String clean = content.replaceAll("\\s+", " ").trim();
        String lower = clean.toLowerCase();

        int bestIndex = -1;
        for (String token : queryTokens) {
            int idx = lower.indexOf(token);
            if (idx != -1 && (bestIndex == -1 || idx < bestIndex)) {
                bestIndex = idx;
            }
        }

        if (bestIndex == -1) {
            return clean.length() > 220 ? clean.substring(0, 220) + "..." : clean;
        }

        int start = Math.max(0, bestIndex - 40);
        int end = Math.min(clean.length(), bestIndex + 180);
        String snippet = clean.substring(start, end);
        if (start > 0) snippet = "..." + snippet;
        if (end < clean.length()) snippet = snippet + "...";
        return snippet;
    }

    private static class ScoredChunk {
        DocumentChunk chunk;
        double score;

        ScoredChunk(DocumentChunk chunk, double score) {
            this.chunk = chunk;
            this.score = score;
        }
    }
}
