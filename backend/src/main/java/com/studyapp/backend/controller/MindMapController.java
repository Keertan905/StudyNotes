package com.studyapp.backend.controller;

import com.studyapp.backend.dto.MindMapDto;
import com.studyapp.backend.service.MindMapService;
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
@RequestMapping("/api/mindmaps")
@RequiredArgsConstructor
@Tag(name = "AI Mind Map Generator", description = "Generate and explore visual concept graphs and relationship trees")
public class MindMapController {

    private final MindMapService mindMapService;

    @PostMapping("/generate")
    @Operation(summary = "Generate visual concept mind map graph from topic or syllabus context")
    public ResponseEntity<MindMapDto.GraphPayload> generateMindMap(
            @Valid @RequestBody MindMapDto.GenerateRequest request
    ) {
        MindMapDto.GraphPayload payload = mindMapService.generateMindMap(request);
        return ResponseEntity.ok(payload);
    }

    @PostMapping
    @Operation(summary = "Save mind map graph to student account")
    public ResponseEntity<MindMapDto.Response> saveMindMap(
            @Valid @RequestBody MindMapDto.SaveRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mindMapService.saveMindMap(request, authentication.getName()));
    }

    @GetMapping
    @Operation(summary = "List saved mind maps for current student")
    public ResponseEntity<List<MindMapDto.Response>> getMindMaps(
            @RequestParam(required = false) Long subjectId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(mindMapService.getMindMaps(authentication.getName(), subjectId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get single saved mind map by ID")
    public ResponseEntity<MindMapDto.Response> getMindMapById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(mindMapService.getMindMapById(id, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete saved mind map")
    public ResponseEntity<Map<String, String>> deleteMindMap(
            @PathVariable Long id,
            Authentication authentication
    ) {
        mindMapService.deleteMindMap(id, authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Mind map deleted successfully"));
    }
}
