package com.studyapp.backend.controller;

import com.studyapp.backend.dto.YouTubeDto;
import com.studyapp.backend.service.YouTubeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/youtube")
@RequiredArgsConstructor
@Tag(name = "YouTube Learning Finder", description = "Dynamic educational video search, ranking, and recommendations via YouTube Data API v3")
public class YouTubeController {

    private final YouTubeService youtubeService;

    @GetMapping("/status")
    @Operation(summary = "Check if YouTube Data API key is configured")
    public ResponseEntity<YouTubeDto.StatusResponse> getStatus() {
        return ResponseEntity.ok(youtubeService.getStatus());
    }

    @PostMapping("/search")
    @Operation(summary = "Search and rank YouTube educational videos dynamically")
    public ResponseEntity<YouTubeDto.SearchResponse> searchVideosPost(@RequestBody YouTubeDto.SearchRequest request) {
        return ResponseEntity.ok(youtubeService.searchVideos(request));
    }

    @GetMapping("/search")
    @Operation(summary = "Search YouTube educational videos via query parameters")
    public ResponseEntity<YouTubeDto.SearchResponse> searchVideosGet(
            @RequestParam String query,
            @RequestParam(required = false) String subjectName,
            @RequestParam(required = false, defaultValue = "BEST_MATCH") String sortBy,
            @RequestParam(required = false, defaultValue = "ALL") String durationFilter,
            @RequestParam(required = false, defaultValue = "ALL") String language,
            @RequestParam(required = false, defaultValue = "ALL") String difficulty) {

        YouTubeDto.SearchRequest request = YouTubeDto.SearchRequest.builder()
                .query(query)
                .subjectName(subjectName)
                .sortBy(sortBy)
                .durationFilter(durationFilter)
                .language(language)
                .difficulty(difficulty)
                .build();

        return ResponseEntity.ok(youtubeService.searchVideos(request));
    }
}
