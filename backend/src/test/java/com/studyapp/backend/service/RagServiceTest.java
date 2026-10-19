package com.studyapp.backend.service;

import com.studyapp.backend.dto.RagCitationDto;
import com.studyapp.backend.model.DocumentChunk;
import com.studyapp.backend.model.StudyDocument;
import com.studyapp.backend.model.User;
import com.studyapp.backend.repository.DocumentChunkRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RagServiceTest {

    @Mock
    private DocumentChunkRepository chunkRepository;

    @InjectMocks
    private RagService ragService;

    private User testUser;
    private StudyDocument testDoc;
    private DocumentChunk testChunk;

    @BeforeEach
    void setUp() {
        testUser = User.builder().id(1L).email("alex@studyapp.com").build();
        testDoc = StudyDocument.builder().id(10L).title("Computer Networks Textbook").fileName("networks.pdf").build();
        testChunk = DocumentChunk.builder()
                .id(100L)
                .document(testDoc)
                .chunkIndex(0)
                .pageNumber(14)
                .sectionHeading("Sliding Window Protocols")
                .chunkContent("The sliding window protocol is a foundational flow control protocol used in TCP. It allows a sender to transmit multiple packets before receiving an acknowledgment.")
                .build();
    }

    @Test
    void testRetrieveRelevantContextMatchesKeyword() {
        when(chunkRepository.findAllByUserId(1L)).thenReturn(List.of(testChunk));

        RagService.RetrievalResult result = ragService.retrieveRelevantContext(testUser, "explain sliding window protocol in TCP", null, null);

        assertNotNull(result);
        assertTrue(result.isHasRelevantContext());
        assertEquals(1, result.getCitations().size());

        RagCitationDto citation = result.getCitations().get(0);
        assertEquals(1, citation.getCitationIndex());
        assertEquals("Computer Networks Textbook", citation.getDocumentTitle());
        assertEquals(14, citation.getPageNumber());
        assertTrue(citation.getRelevanceScore() > 0.4);
    }

    @Test
    void testRetrieveEmptyWhenNoMatches() {
        when(chunkRepository.findAllByUserId(1L)).thenReturn(Collections.emptyList());

        RagService.RetrievalResult result = ragService.retrieveRelevantContext(testUser, "quantum computing entanglement", null, null);

        assertNotNull(result);
        assertFalse(result.isHasRelevantContext());
        assertTrue(result.getCitations().isEmpty());
    }
}
