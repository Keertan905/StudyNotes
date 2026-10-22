package com.studyapp.backend.service;

import com.studyapp.backend.ai.AiProvider;
import com.studyapp.backend.dto.DiagramDto;
import com.studyapp.backend.model.Diagram;
import com.studyapp.backend.model.User;
import com.studyapp.backend.repository.DiagramRepository;
import com.studyapp.backend.repository.SubjectRepository;
import com.studyapp.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DiagramServiceTest {

    @Mock
    private AiProvider aiProvider;

    @Mock
    private DiagramRepository diagramRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SubjectRepository subjectRepository;

    @InjectMocks
    private DiagramService diagramService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .name("Alice")
                .email("alice@studyapp.com")
                .build();
    }

    @Test
    void testGenerateDiagram_FallbackWhenAiEmpty() {
        when(aiProvider.generate(any(), any())).thenReturn("");

        DiagramDto.GenerateRequest request = DiagramDto.GenerateRequest.builder()
                .topic("Binary Search Algorithm")
                .subjectName("Data Structures & Algorithms")
                .diagramType("FLOWCHART")
                .build();

        DiagramDto.DiagramPayload payload = diagramService.generateDiagram(request);

        assertNotNull(payload);
        assertEquals("FLOWCHART", payload.getDiagramType());
        assertFalse(payload.getNodes().isEmpty());
        assertFalse(payload.getEdges().isEmpty());
        assertTrue(payload.getNodes().stream().anyMatch(n -> "start".equalsIgnoreCase(n.getCategory())));
    }

    @Test
    void testSaveDiagram() {
        when(userRepository.findByEmail("alice@studyapp.com")).thenReturn(Optional.of(testUser));
        when(diagramRepository.save(any(Diagram.class))).thenAnswer(invocation -> {
            Diagram d = invocation.getArgument(0);
            d.setId(99L);
            return d;
        });

        DiagramDto.SaveRequest saveRequest = DiagramDto.SaveRequest.builder()
                .title("Binary Search Flow")
                .diagramType("FLOWCHART")
                .graphData("{\"nodes\":[]}")
                .nodeCount(5)
                .build();

        DiagramDto.Response response = diagramService.saveDiagram(saveRequest, "alice@studyapp.com");

        assertNotNull(response);
        assertEquals(99L, response.getId());
        assertEquals("Binary Search Flow", response.getTitle());
        verify(diagramRepository, times(1)).save(any(Diagram.class));
    }
}
