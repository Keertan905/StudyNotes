package com.studyapp.backend.controller;

import com.studyapp.backend.dto.DiagramDto;
import com.studyapp.backend.service.DiagramService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/diagrams")
@RequiredArgsConstructor
@Tag(name = "AI Diagram & Infographic Maker", description = "Generate and manage structured flowcharts, concept maps, and infographics")
public class DiagramController {

    private final DiagramService diagramService;

    @PostMapping("/generate")
    @Operation(summary = "Generate structured vector diagram or revision infographic from topic")
    public ResponseEntity<DiagramDto.DiagramPayload> generateDiagram(
            @Valid @RequestBody DiagramDto.GenerateRequest request
    ) {
        return ResponseEntity.ok(diagramService.generateDiagram(request));
    }

    @PostMapping
    @Operation(summary = "Save diagram to student library")
    public ResponseEntity<DiagramDto.Response> saveDiagram(
            @Valid @RequestBody DiagramDto.SaveRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(diagramService.saveDiagram(request, authentication.getName()));
    }

    @GetMapping
    @Operation(summary = "Get all saved diagrams for current student")
    public ResponseEntity<List<DiagramDto.Response>> getDiagrams(
            @RequestParam(required = false) Long subjectId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(diagramService.getDiagrams(authentication.getName(), subjectId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get saved diagram by ID")
    public ResponseEntity<DiagramDto.Response> getDiagramById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(diagramService.getDiagramById(id, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete diagram from student library")
    public ResponseEntity<Map<String, String>> deleteDiagram(
            @PathVariable Long id,
            Authentication authentication
    ) {
        diagramService.deleteDiagram(id, authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Diagram deleted successfully"));
    }
}
