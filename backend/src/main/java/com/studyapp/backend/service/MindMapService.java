package com.studyapp.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyapp.backend.ai.AiProvider;
import com.studyapp.backend.dto.MindMapDto;
import com.studyapp.backend.exception.BadRequestException;
import com.studyapp.backend.exception.ResourceNotFoundException;
import com.studyapp.backend.model.*;
import com.studyapp.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class MindMapService {

    private final AiProvider aiProvider;
    private final MindMapRepository mindMapRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final UnitRepository unitRepository;
    private final TopicRepository topicRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public MindMapDto.GraphPayload generateMindMap(MindMapDto.GenerateRequest request) {
        String topic = request.getTopic().trim();
        String subject = request.getSubjectName() != null ? request.getSubjectName() : "General Studies";
        String depth = request.getDepth() != null ? request.getDepth() : "balanced";
        String context = request.getCustomContext() != null ? request.getCustomContext() : "";

        String systemPrompt = """
            You are an expert academic concept cartographer and university professor.
            Generate a detailed, hierarchical conceptual Mind Map for the given academic topic.
            You MUST return ONLY a valid, parseable JSON object matching this schema without any markdown formatting or commentary:
            {
              "rootId": "root-1",
              "rootNode": {
                "id": "root-1",
                "label": "Short central concept (1-4 words)",
                "description": "Clear 1-2 sentence core definition",
                "category": "root",
                "color": "#6366f1",
                "examTip": "High-yield summary or key formula/theorem",
                "children": [
                  {
                    "id": "node-1",
                    "label": "Key Branch Name",
                    "description": "Explanation of branch",
                    "category": "concept",
                    "color": "#3b82f6",
                    "examTip": "Important exam tip or common trick",
                    "children": [
                      {
                        "id": "node-1-1",
                        "label": "Sub-concept",
                        "description": "Specific detail, formula or principle",
                        "category": "subconcept",
                        "color": "#0ea5e9",
                        "examTip": "How this is tested in exams",
                        "children": []
                      }
                    ]
                  }
                ]
              },
              "crossLinks": [
                {
                  "sourceId": "node-1-1",
                  "targetId": "node-2-1",
                  "relationship": "Depends on / Contradicts / Special Case Of"
                }
              ]
            }
            
            Guidelines:
            - Create between 4 to 6 main high-level branches (e.g. Core Principles, Key Components/Taxonomy, Algorithms/Processes, Trade-offs/Comparison, Practical Applications).
            - Each branch should have 2 to 4 detailed child nodes.
            - Provide insightful, real academic definitions and practical exam tips for every single node.
            - If depth is 'comprehensive', expand down to 3 levels deep. If 'concise', maintain 2 levels deep.
            """;

        String userPrompt = "Subject: " + subject + "\nTopic: " + topic + "\nTarget Depth: " + depth +
                (context.isBlank() ? "" : "\nAdditional Context/Syllabus Snippet:\n" + context);

        String rawOutput = aiProvider.generate(systemPrompt, userPrompt);
        MindMapDto.GraphPayload payload = tryParsePayload(rawOutput);

        if (payload == null || payload.getRootNode() == null) {
            log.info("Generating educational fallback mind map graph for '{}'", topic);
            payload = buildEducationalFallback(topic, subject, depth);
        }

        enrichPayloadMetadata(payload);
        return payload;
    }

    @Transactional
    public MindMapDto.Response saveMindMap(MindMapDto.SaveRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Subject subject = null;
        if (request.getSubjectId() != null) {
            subject = subjectRepository.findById(request.getSubjectId()).orElse(null);
        }

        Unit unit = null;
        if (request.getUnitId() != null) {
            unit = unitRepository.findById(request.getUnitId()).orElse(null);
        }

        Topic topic = null;
        if (request.getTopicId() != null) {
            topic = topicRepository.findById(request.getTopicId()).orElse(null);
        }

        MindMap mindMap = MindMap.builder()
                .user(user)
                .subject(subject)
                .unit(unit)
                .topic(topic)
                .title(request.getTitle())
                .description(request.getDescription())
                .graphData(request.getGraphData())
                .layoutStyle(request.getLayoutStyle() != null ? request.getLayoutStyle() : "radial")
                .nodeCount(request.getNodeCount() != null ? request.getNodeCount() : 1)
                .build();

        MindMap saved = mindMapRepository.save(mindMap);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<MindMapDto.Response> getMindMaps(String userEmail, Long subjectId) {
        List<MindMap> list;
        if (subjectId != null) {
            list = mindMapRepository.findByUserEmailAndSubjectIdOrderByCreatedAtDesc(userEmail, subjectId);
        } else {
            list = mindMapRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
        }
        return list.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public MindMapDto.Response getMindMapById(Long id, String userEmail) {
        MindMap mindMap = mindMapRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mind map not found: " + id));

        if (!mindMap.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new BadRequestException("Access denied to this mind map");
        }

        return toResponse(mindMap);
    }

    @Transactional
    public void deleteMindMap(Long id, String userEmail) {
        MindMap mindMap = mindMapRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mind map not found: " + id));

        if (!mindMap.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new BadRequestException("Access denied to this mind map");
        }

        mindMapRepository.delete(mindMap);
    }

    private MindMapDto.GraphPayload tryParsePayload(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            String cleaned = raw.trim();
            if (cleaned.startsWith("```json")) {
                cleaned = cleaned.substring(7);
            } else if (cleaned.startsWith("```")) {
                cleaned = cleaned.substring(3);
            }
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3);
            }
            cleaned = cleaned.trim();

            int firstBrace = cleaned.indexOf('{');
            int lastBrace = cleaned.lastIndexOf('}');
            if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
                cleaned = cleaned.substring(firstBrace, lastBrace + 1);
            }

            return objectMapper.readValue(cleaned, MindMapDto.GraphPayload.class);
        } catch (Exception e) {
            log.warn("Failed to parse JSON mind map payload: {}", e.getMessage());
            return null;
        }
    }

    private void enrichPayloadMetadata(MindMapDto.GraphPayload payload) {
        if (payload == null || payload.getRootNode() == null) return;
        int count = countNodes(payload.getRootNode());
        int depth = calculateMaxDepth(payload.getRootNode(), 1);
        payload.setTotalNodes(count);
        payload.setMaxDepth(depth);
        if (payload.getCrossLinks() == null) {
            payload.setCrossLinks(new ArrayList<>());
        }
    }

    private int countNodes(MindMapDto.NodeData node) {
        if (node == null) return 0;
        int total = 1;
        if (node.getChildren() != null) {
            for (MindMapDto.NodeData child : node.getChildren()) {
                total += countNodes(child);
            }
        }
        return total;
    }

    private int calculateMaxDepth(MindMapDto.NodeData node, int currentDepth) {
        if (node == null || node.getChildren() == null || node.getChildren().isEmpty()) {
            return currentDepth;
        }
        int max = currentDepth;
        for (MindMapDto.NodeData child : node.getChildren()) {
            max = Math.max(max, calculateMaxDepth(child, currentDepth + 1));
        }
        return max;
    }

    private MindMapDto.GraphPayload buildEducationalFallback(String topic, String subject, String depth) {
        String rootId = "root-" + UUID.randomUUID().toString().substring(0, 8);
        String[] colors = {"#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4"};

        List<MindMapDto.NodeData> branches = new ArrayList<>();

        // Branch 1: Fundamentals & Core Definitions
        branches.add(MindMapDto.NodeData.builder()
                .id("branch-1")
                .label("Fundamentals & Architecture")
                .description("Primary definitions, theoretical background, and structural models governing " + topic + ".")
                .category("concept")
                .color(colors[0])
                .examTip("Memorize standard definitions and primary classification criteria for direct 5-mark questions.")
                .children(List.of(
                        MindMapDto.NodeData.builder()
                                .id("branch-1-1")
                                .label("Formal Definitions")
                                .description("Precise terminology and fundamental axioms.")
                                .category("subconcept")
                                .color(colors[0])
                                .examTip("State standard notation before deriving properties.")
                                .children(List.of())
                                .build(),
                        MindMapDto.NodeData.builder()
                                .id("branch-1-2")
                                .label("Structural Components")
                                .description("Core modules, state machines, and data pipelines.")
                                .category("subconcept")
                                .color(colors[0])
                                .examTip("Draw annotated block diagrams to earn full structure marks.")
                                .children(List.of())
                                .build()
                ))
                .build());

        // Branch 2: Mechanisms & Algorithms
        branches.add(MindMapDto.NodeData.builder()
                .id("branch-2")
                .label("Mechanisms & Execution")
                .description("Algorithmic steps, operational workflows, and execution lifecycle.")
                .category("concept")
                .color(colors[1])
                .examTip("Step-by-step trace tables are frequently tested with numerical parameters.")
                .children(List.of(
                        MindMapDto.NodeData.builder()
                                .id("branch-2-1")
                                .label("Core Process Flow")
                                .description("Sequential phases from initialization to output convergence.")
                                .category("subconcept")
                                .color(colors[1])
                                .examTip("Highlight loop invariants and termination guarantees.")
                                .children(List.of())
                                .build(),
                        MindMapDto.NodeData.builder()
                                .id("branch-2-2")
                                .label("Optimization Strategies")
                                .description("Caching, heuristics, and asymptotic pruning.")
                                .category("subconcept")
                                .color(colors[1])
                                .examTip("Compare best vs worst-case asymptotic bounds.")
                                .children(List.of())
                                .build()
                ))
                .build());

        // Branch 3: Trade-offs & Comparisons
        branches.add(MindMapDto.NodeData.builder()
                .id("branch-3")
                .label("Trade-offs & Analysis")
                .description("Complexity metrics, edge cases, failure modes, and comparative alternatives.")
                .category("concept")
                .color(colors[2])
                .examTip("Tabulate comparisons side-by-side: Complexity, Memory, Scalability, and Limitations.")
                .children(List.of(
                        MindMapDto.NodeData.builder()
                                .id("branch-3-1")
                                .label("Complexity Bounds")
                                .description("Time and Space complexity under varying input sizes.")
                                .category("subconcept")
                                .color(colors[2])
                                .examTip("State Big-O notation with justification.")
                                .children(List.of())
                                .build(),
                        MindMapDto.NodeData.builder()
                                .id("branch-3-2")
                                .label("Bottlenecks & Edge Cases")
                                .description("Contention, deadlocks, boundary value exceptions, and drift.")
                                .category("subconcept")
                                .color(colors[2])
                                .examTip("Commonly tested as scenario-based troubleshooting questions.")
                                .children(List.of())
                                .build()
                ))
                .build());

        // Branch 4: Practical Applications & Exam Focus
        branches.add(MindMapDto.NodeData.builder()
                .id("branch-4")
                .label("Applications & Exam Mastery")
                .description("Real-world industrial use cases, typical semester questions, and high-yield scoring points.")
                .category("concept")
                .color(colors[3])
                .examTip("Quote at least two modern industrial implementations to elevate subjective answers.")
                .children(List.of(
                        MindMapDto.NodeData.builder()
                                .id("branch-4-1")
                                .label("Real-World Systems")
                                .description("Cloud services, distributed engines, and embedded controllers.")
                                .category("subconcept")
                                .color(colors[3])
                                .examTip("Link theoretical concepts to production scale constraints.")
                                .children(List.of())
                                .build(),
                        MindMapDto.NodeData.builder()
                                .id("branch-4-2")
                                .label("High-Yield Questions")
                                .description("Frequently recurring university exam patterns.")
                                .category("subconcept")
                                .color(colors[3])
                                .examTip("Practice past-year 10-mark essay prompts on this topic.")
                                .children(List.of())
                                .build()
                ))
                .build());

        MindMapDto.NodeData rootNode = MindMapDto.NodeData.builder()
                .id(rootId)
                .label(topic)
                .description("Comprehensive conceptual landscape for " + topic + " in " + subject + ".")
                .category("root")
                .color("#4f46e5")
                .examTip("Master the interplay between theoretical definition, algorithmic execution, and trade-off metrics.")
                .children(branches)
                .build();

        List<MindMapDto.CrossLink> crossLinks = List.of(
                MindMapDto.CrossLink.builder()
                        .sourceId("branch-1-2")
                        .targetId("branch-2-1")
                        .relationship("Instantiates")
                        .build(),
                MindMapDto.CrossLink.builder()
                        .sourceId("branch-2-2")
                        .targetId("branch-3-1")
                        .relationship("Governs")
                        .build()
        );

        MindMapDto.GraphPayload payload = MindMapDto.GraphPayload.builder()
                .rootId(rootId)
                .rootNode(rootNode)
                .crossLinks(crossLinks)
                .build();

        enrichPayloadMetadata(payload);
        return payload;
    }

    private MindMapDto.Response toResponse(MindMap map) {
        return MindMapDto.Response.builder()
                .id(map.getId())
                .subjectId(map.getSubject() != null ? map.getSubject().getId() : null)
                .subjectName(map.getSubject() != null ? map.getSubject().getName() : null)
                .unitId(map.getUnit() != null ? map.getUnit().getId() : null)
                .unitTitle(map.getUnit() != null ? map.getUnit().getTitle() : null)
                .topicId(map.getTopic() != null ? map.getTopic().getId() : null)
                .topicName(map.getTopic() != null ? map.getTopic().getName() : null)
                .title(map.getTitle())
                .description(map.getDescription())
                .graphData(map.getGraphData())
                .layoutStyle(map.getLayoutStyle())
                .nodeCount(map.getNodeCount())
                .createdAt(map.getCreatedAt())
                .updatedAt(map.getUpdatedAt())
                .build();
    }
}
