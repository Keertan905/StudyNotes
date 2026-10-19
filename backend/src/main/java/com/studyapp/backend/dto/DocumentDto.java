package com.studyapp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class DocumentDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long subjectId;
        private String subjectName;
        private String subjectCode;
        private String title;
        private String fileName;
        private String fileType;
        private Long fileSize;
        private Integer pageCount;
        private Integer chunkCount;
        private String status;
        private String summary;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UploadTextRequest {
        private Long subjectId;
        private String title;
        private String fileName;
        private String content;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChunkResponse {
        private Long id;
        private Integer chunkIndex;
        private Integer pageNumber;
        private String sectionHeading;
        private String chunkContent;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentDetailResponse {
        private Response document;
        private List<ChunkResponse> chunks;
    }
}
