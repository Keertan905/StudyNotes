package com.studyapp.backend.controller;

import com.studyapp.backend.dto.ProblemSolverDto;
import com.studyapp.backend.service.ProblemSolverService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/problem-solver")
@RequiredArgsConstructor
@Tag(name = "Step-by-Step Problem Solver", description = "Pedagogical problem solver with step rationale, intuitive analogies, and document grounding")
public class ProblemSolverController {

    private final ProblemSolverService problemSolverService;

    @PostMapping("/solve")
    @Operation(summary = "Generate step-by-step problem solution with concept breakdown and optional RAG grounding")
    public ResponseEntity<ProblemSolverDto.SolveResponse> solveProblem(
            @Valid @RequestBody ProblemSolverDto.SolveRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(problemSolverService.solveProblem(request, authentication.getName()));
    }

    @PostMapping("/follow-up")
    @Operation(summary = "Ask a clarifying follow-up question on a specific solution step")
    public ResponseEntity<ProblemSolverDto.FollowUpResponse> answerFollowUp(
            @Valid @RequestBody ProblemSolverDto.FollowUpRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(problemSolverService.answerFollowUp(request, authentication.getName()));
    }
}
