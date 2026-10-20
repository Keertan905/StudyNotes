package com.studyapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class MindMapDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GenerateRequest {
        @NotBlank(message = "Topic or title is required")
        private String topic;
        private String subjectName;
        private Long subjectId;
        private Long unitId;
        private Long topicId;
        private String depth; // "concise", "balanced", "comprehensive"
        private String layoutStyle; // "radial", "tree", "flow"
        private String customContext; // optional extra notes or document text
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SaveRequest {
        private Long subjectId;
        private Long unitId;
        private Long topicId;
        @NotBlank(message = "Title is required")
        private String title;
        private String description;
        @NotBlank(message = "Graph data is required")
        private String graphData;
        private String layoutStyle;
        private Integer nodeCount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NodeData {
        private String id;
        private String label;
        private String description;
        private String category; // "root", "concept", "subconcept", "example", "formula", "application"
        private String color;
        private String examTip;
        private List<NodeData> children;
        private List<String> relatedNodeIds;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GraphPayload {
        private String rootId;
        private NodeData rootNode;
        private Integer totalNodes;
        private Integer maxDepth;
        private List<CrossLink> crossLinks;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CrossLink {
        private String sourceId;
        private String targetId;
        private String relationship;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long subjectId;
        private String subjectName;
        private Long unitId;
        private String unitTitle;
        private Long topicId;
        private String topicName;
        private String title;
        private String description;
        private String graphData;
        private String layoutStyle;
        private Integer nodeCount;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
