package com.studyapp.backend.controller;

import com.studyapp.backend.dto.ImageQaDto;
import com.studyapp.backend.service.ImageQaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/image-qa")
@RequiredArgsConstructor
@Tag(name = "Ask Questions from Images", description = "Extract questions, formulas, and diagrams from images and generate step-by-step solutions")
public class ImageQaController {

    private final ImageQaService imageQaService;

    @PostMapping("/solve")
    @Operation(summary = "Analyze uploaded image question and generate step-by-step academic solution")
    public ResponseEntity<ImageQaDto.ImageQaResponse> solveProblem(
            @Valid @RequestBody ImageQaDto.SolveRequest request
    ) {
        return ResponseEntity.ok(imageQaService.solveProblem(request));
    }
}
