package com.studyapp.backend.controller;

import com.studyapp.backend.dto.VirtualLabDto;
import com.studyapp.backend.service.VirtualLabService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/virtual-lab")
@RequiredArgsConstructor
@Tag(name = "Virtual Lab & Simulations", description = "Interactive science and engineering lab simulations, experiment guides, and diagnostic assessments")
public class VirtualLabController {

    private final VirtualLabService virtualLabService;

    @GetMapping("/experiments")
    @Operation(summary = "List all available virtual lab simulations")
    public ResponseEntity<List<VirtualLabDto.ExperimentSummary>> getAllExperiments() {
        return ResponseEntity.ok(virtualLabService.getAllExperiments());
    }

    @GetMapping("/experiments/{id}")
    @Operation(summary = "Get experiment instructions, parameters, and post-experiment quiz")
    public ResponseEntity<VirtualLabDto.ExperimentDetail> getExperimentById(@PathVariable String id) {
        return ResponseEntity.ok(virtualLabService.getExperimentById(id));
    }

    @PostMapping("/submit-assessment")
    @Operation(summary = "Submit post-experiment assessment, verify answers, and award XP")
    public ResponseEntity<VirtualLabDto.AssessmentResult> submitAssessment(
            @Valid @RequestBody VirtualLabDto.QuizSubmissionRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(virtualLabService.evaluateAssessment(request, authentication.getName()));
    }
}
