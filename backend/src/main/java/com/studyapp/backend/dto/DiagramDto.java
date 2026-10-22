package com.studyapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class DiagramDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GenerateRequest {
        @NotBlank(message = "Topic is required")
        private String topic;
        private String subjectName;
        private Long subjectId;
        private String diagramType; // FLOWCHART, CONCEPT_MAP, SYSTEM_ARCHITECTURE, REVISION_INFOGRAPHIC
        private String complexity;  // concise, detailed, comprehensive
        private String customContext;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiagramNode {
        private String id;
        private String label;
        private String description;
        private String category; // start, process, decision, end, component, concept, formula
        private String shape;    // rect, diamond, circle, pill, rounded, hexagon
        private String color;    // hex color code
        private String icon;     // icon name: Play, CheckCircle, Cpu, Database, Server, GitBranch, AlertTriangle, etc.
        private String examTip;  // high-yield note or common pitfall
        private Double x;
        private Double y;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiagramEdge {
        private String id;
        private String sourceId;
        private String targetId;
        private String label;
        private String style; // solid, dashed, bidirectional
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiagramSection {
        private String id;
        private String title;
        private String icon;
        private String color;
        private String summary;
        private List<String> bulletPoints;
        private String formula;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiagramPayload {
        private String title;
        private String diagramType;
        private String summary;
        private String layoutDirection; // TB (top-bottom), LR (left-right)
        private List<DiagramNode> nodes;
        private List<DiagramEdge> edges;
        private List<DiagramSection> sections; // for Infographic cards
        private List<String> keyTakeaways;
        private String formulaHighlight;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaveRequest {
        @NotBlank(message = "Title is required")
        private String title;
        private String description;
        private Long subjectId;
        @NotBlank(message = "Diagram type is required")
        private String diagramType;
        @NotBlank(message = "Graph data is required")
        private String graphData;
        private String layoutStyle;
        private Integer nodeCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String title;
        private String description;
        private Long subjectId;
        private String subjectName;
        private String diagramType;
        private String graphData;
        private String layoutStyle;
        private Integer nodeCount;
        private LocalDateTime createdAt;
    }
}
