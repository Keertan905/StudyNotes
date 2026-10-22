package com.studyapp.backend.service;

import com.studyapp.backend.ai.AiProvider;
import com.studyapp.backend.dto.ProblemSolverDto;
import com.studyapp.backend.model.User;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProblemSolverServiceTest {

    @Mock
    private AiProvider aiProvider;

    @Mock
    private RagService ragService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProblemSolverService problemSolverService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .name("Solver Student")
                .email("solver@studyapp.com")
                .build();
    }

    @Test
    void testSolveProblem_FallbackWhenAiEmpty() {
        when(userRepository.findByEmail("solver@studyapp.com")).thenReturn(Optional.of(testUser));
        when(aiProvider.generate(any(), any())).thenReturn("");

        ProblemSolverDto.SolveRequest request = ProblemSolverDto.SolveRequest.builder()
                .problemText("Solve quadratic equation 2x^2 + 5x - 3 = 0")
                .subject("Mathematics")
                .groundWithDocs(false)
                .build();

        ProblemSolverDto.SolveResponse response = problemSolverService.solveProblem(request, "solver@studyapp.com");

        assertNotNull(response);
        assertNotNull(response.getSteps());
        assertFalse(response.getSteps().isEmpty());
        assertNotNull(response.getFinalAnswer());
        assertNotNull(response.getIntuitiveExplanation());
        assertFalse(response.getCommonMistakes().isEmpty());
    }

    @Test
    void testAnswerFollowUp() {
        when(aiProvider.generate(any(), any())).thenReturn("");

        ProblemSolverDto.FollowUpRequest request = ProblemSolverDto.FollowUpRequest.builder()
                .originalProblem("Solve for x")
                .followUpQuestion("Why did we divide both sides by 2?")
                .stepIndex(2)
                .build();

        ProblemSolverDto.FollowUpResponse response = problemSolverService.answerFollowUp(request, "solver@studyapp.com");

        assertNotNull(response);
        assertNotNull(response.getAnswer());
        assertFalse(response.getFurtherQuestions().isEmpty());
    }
}
