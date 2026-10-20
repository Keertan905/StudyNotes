package com.studyapp.backend.controller;

import com.studyapp.backend.dto.CodeExplainerDto;
import com.studyapp.backend.service.CodeExplainerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/code")
@RequiredArgsConstructor
@Tag(name = "AI Code Explainer & Debugger", description = "Line-by-line code explanation, time/space complexity analysis, and automated bug detection")
public class CodeExplainerController {

    private final CodeExplainerService codeExplainerService;

    @PostMapping("/explain")
    @Operation(summary = "Explain source code line-by-line, calculate Big-O complexity, and detect bugs")
    public ResponseEntity<CodeExplainerDto.ExplainResponse> explainCode(
            @Valid @RequestBody CodeExplainerDto.ExplainRequest request
    ) {
        return ResponseEntity.ok(codeExplainerService.explainCode(request));
    }
}
