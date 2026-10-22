package com.studyapp.backend.service;

import com.studyapp.backend.dto.GamificationDto;
import com.studyapp.backend.dto.VirtualLabDto;
import com.studyapp.backend.model.User;
import com.studyapp.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VirtualLabServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private GamificationService gamificationService;

    @InjectMocks
    private VirtualLabService virtualLabService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .name("Lab Student")
                .email("student@studyapp.com")
                .build();
    }

    @Test
    void testGetAllExperiments() {
        List<VirtualLabDto.ExperimentSummary> list = virtualLabService.getAllExperiments();

        assertNotNull(list);
        assertTrue(list.size() >= 4);
        assertTrue(list.stream().anyMatch(e -> "cpu-scheduling".equals(e.getId())));
        assertTrue(list.stream().anyMatch(e -> "packet-routing".equals(e.getId())));
        assertTrue(list.stream().anyMatch(e -> "logic-gates".equals(e.getId())));
        assertTrue(list.stream().anyMatch(e -> "ohms-law".equals(e.getId())));
    }

    @Test
    void testEvaluateAssessment_Passed() {
        when(userRepository.findByEmail("student@studyapp.com")).thenReturn(Optional.of(testUser));
        when(gamificationService.awardVirtualLabXp(eq(testUser), eq("cpu-scheduling"), anyInt(), anyString()))
                .thenReturn(GamificationDto.RewardEventResponse.builder().xpEarned(60).build());

        // Correct answers for cpu-scheduling: q1 -> 2, q2 -> 1, q3 -> 1
        VirtualLabDto.QuizSubmissionRequest request = VirtualLabDto.QuizSubmissionRequest.builder()
                .experimentId("cpu-scheduling")
                .selectedAnswers(Map.of(
                        "q1", 2,
                        "q2", 1,
                        "q3", 1
                ))
                .build();

        VirtualLabDto.AssessmentResult result = virtualLabService.evaluateAssessment(request, "student@studyapp.com");

        assertNotNull(result);
        assertEquals(3, result.getCorrectCount());
        assertEquals(100, result.getScorePercentage());
        assertTrue(result.isPassed());
        assertEquals(60, result.getXpAwarded());
        verify(gamificationService, times(1)).awardVirtualLabXp(any(), any(), anyInt(), any());
    }
}
