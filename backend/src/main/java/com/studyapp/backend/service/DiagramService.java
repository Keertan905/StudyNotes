package com.studyapp.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyapp.backend.ai.AiProvider;
import com.studyapp.backend.dto.DiagramDto;
import com.studyapp.backend.exception.BadRequestException;
import com.studyapp.backend.exception.ResourceNotFoundException;
import com.studyapp.backend.model.Diagram;
import com.studyapp.backend.model.Subject;
import com.studyapp.backend.model.User;
import com.studyapp.backend.repository.DiagramRepository;
import com.studyapp.backend.repository.SubjectRepository;
import com.studyapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class DiagramService {

    private final AiProvider aiProvider;
    private final DiagramRepository diagramRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DiagramDto.DiagramPayload generateDiagram(DiagramDto.GenerateRequest request) {
        String topic = request.getTopic().trim();
        String subject = request.getSubjectName() != null && !request.getSubjectName().isBlank() 
                ? request.getSubjectName() : "Computer Science & Engineering";
        String diagramType = request.getDiagramType() != null ? request.getDiagramType() : "FLOWCHART";
        String complexity = request.getComplexity() != null ? request.getComplexity() : "detailed";
        String context = request.getCustomContext() != null ? request.getCustomContext() : "";

        String systemPrompt = """
            You are an expert technical illustrator, educational computer science professor, and visual concept architect.
            Generate a rich, structured academic diagram or revision infographic for the specified topic.
            Output ONLY valid, parseable JSON matching the following schema without any markdown wrapper or explanation:
            {
              "title": "Clear educational title",
              "diagramType": "%s",
              "summary": "1-2 sentence core concept explanation",
              "layoutDirection": "TB",
              "nodes": [
                {
                  "id": "node-1",
                  "label": "Process / Step / Component Name",
                  "description": "Specific technical operation or definition",
                  "category": "start | process | decision | end | component | formula",
                  "shape": "rect | diamond | circle | pill | hexagon",
                  "color": "#6366f1",
                  "icon": "Play | Cpu | Database | CheckCircle | AlertTriangle | Layers | ArrowRight",
                  "examTip": "High-yield exam tip or common trick",
                  "x": 300,
                  "y": 60
                }
              ],
              "edges": [
                {
                  "id": "edge-1",
                  "sourceId": "node-1",
                  "targetId": "node-2",
                  "label": "Yes / Valid / Output / Dataflow",
                  "style": "solid | dashed"
                }
              ],
              "sections": [
                {
                  "id": "sec-1",
                  "title": "Core Formula / Principle",
                  "icon": "Zap",
                  "color": "#ec4899",
                  "summary": "Brief summary",
                  "bulletPoints": ["Point 1", "Point 2"],
                  "formula": "Optional mathematical or big-O notation"
                }
              ],
              "keyTakeaways": ["Crucial exam takeaway 1", "Crucial exam takeaway 2"],
              "formulaHighlight": "E.g. Time Complexity O(n log n) or V = I * R"
            }
            Guidelines:
            - If diagramType is FLOWCHART: Include 5 to 9 sequential nodes with start, process, at least 1 decision diamond with Yes/No edges, and end.
            - If diagramType is CONCEPT_MAP: Create interconnected concept nodes with labeled relational edges (e.g. 'Inherits from', 'Transmits to').
            - If diagramType is SYSTEM_ARCHITECTURE: Model layers (Client -> API Gateway -> Microservice -> Database/Cache) with realistic data flows.
            - If diagramType is REVISION_INFOGRAPHIC: Populate both visual nodes and 3-4 rich 'sections' highlighting formulas, comparison points, and pitfalls.
            """.formatted(diagramType);

        String userPrompt = "Subject: " + subject + "\nTopic: " + topic + 
                "\nDiagram Type: " + diagramType + "\nComplexity: " + complexity +
                (context.isBlank() ? "" : "\nAdditional Context/Syllabus Snippet:\n" + context);

        String rawOutput = null;
        try {
            rawOutput = aiProvider.generate(systemPrompt, userPrompt);
        } catch (Exception e) {
            log.warn("AI diagram generation call failed: {}. Falling back to educational diagram.", e.getMessage());
        }
        DiagramDto.DiagramPayload payload = tryParsePayload(rawOutput);

        if (payload == null || payload.getNodes() == null || payload.getNodes().isEmpty()) {
            log.info("Generating educational fallback diagram for '{}' ({})", topic, diagramType);
            payload = buildEducationalFallback(topic, subject, diagramType);
        }

        normalizeLayout(payload);
        return payload;
    }

    private DiagramDto.DiagramPayload tryParsePayload(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            String clean = raw.trim();
            if (clean.startsWith("```json")) {
                clean = clean.substring(7);
            } else if (clean.startsWith("```")) {
                clean = clean.substring(3);
            }
            if (clean.endsWith("```")) {
                clean = clean.substring(0, clean.length() - 3);
            }
            clean = clean.trim();
            int startIdx = clean.indexOf("{");
            int endIdx = clean.lastIndexOf("}");
            if (startIdx >= 0 && endIdx > startIdx) {
                clean = clean.substring(startIdx, endIdx + 1);
            }
            return objectMapper.readValue(clean, DiagramDto.DiagramPayload.class);
        } catch (Exception e) {
            log.warn("Failed to parse AI output into DiagramPayload: {}", e.getMessage());
            return null;
        }
    }

    private void normalizeLayout(DiagramDto.DiagramPayload payload) {
        if (payload == null || payload.getNodes() == null) return;
        List<DiagramDto.DiagramNode> nodes = payload.getNodes();
        boolean isTB = !"LR".equalsIgnoreCase(payload.getLayoutDirection());

        // Assign positions if default or zero
        double currentX = isTB ? 320 : 60;
        double currentY = isTB ? 50 : 200;
        double step = 120;

        for (int i = 0; i < nodes.size(); i++) {
            DiagramDto.DiagramNode node = nodes.get(i);
            if (node.getX() == null || node.getY() == null || (node.getX() == 0 && node.getY() == 0)) {
                if (isTB) {
                    // Slight zigzag for branches if decision
                    double offsetX = (i % 2 == 1 && "decision".equalsIgnoreCase(node.getCategory())) ? 200 : 320;
                    node.setX(offsetX);
                    node.setY(currentY);
                    currentY += step;
                } else {
                    node.setX(currentX);
                    node.setY(currentY);
                    currentX += 200;
                }
            }
            if (node.getColor() == null || node.getColor().isBlank()) {
                node.setColor(pickColorForCategory(node.getCategory(), i));
            }
            if (node.getShape() == null || node.getShape().isBlank()) {
                node.setShape(pickShapeForCategory(node.getCategory()));
            }
            if (node.getIcon() == null || node.getIcon().isBlank()) {
                node.setIcon("Cpu");
            }
        }
    }

    private String pickColorForCategory(String category, int index) {
        if (category == null) return "#6366f1";
        return switch (category.toLowerCase()) {
            case "start" -> "#10b981"; // emerald
            case "end" -> "#ef4444";   // rose/red
            case "decision" -> "#f59e0b"; // amber
            case "formula" -> "#ec4899"; // pink
            case "component" -> "#3b82f6"; // blue
            default -> {
                String[] colors = {"#6366f1", "#8b5cf6", "#0ea5e9", "#14b8a6", "#f97316"};
                yield colors[index % colors.length];
            }
        };
    }

    private String pickShapeForCategory(String category) {
        if (category == null) return "rect";
        return switch (category.toLowerCase()) {
            case "start", "end" -> "pill";
            case "decision" -> "diamond";
            case "formula" -> "rounded";
            default -> "rect";
        };
    }

    private DiagramDto.DiagramPayload buildEducationalFallback(String topic, String subject, String diagramType) {
        List<DiagramDto.DiagramNode> nodes = new ArrayList<>();
        List<DiagramDto.DiagramEdge> edges = new ArrayList<>();
        List<DiagramDto.DiagramSection> sections = new ArrayList<>();
        List<String> keyTakeaways = new ArrayList<>();
        String formula = "O(1) Memory | High-Yield Topic";

        if ("FLOWCHART".equalsIgnoreCase(diagramType)) {
            nodes.add(DiagramDto.DiagramNode.builder()
                    .id("node-1").label("Start: " + topic).description("Initialize parameters and validate input conditions")
                    .category("start").shape("pill").color("#10b981").icon("Play")
                    .examTip("Always verify boundary conditions in exam edge cases.").x(320.0).y(50.0).build());
            nodes.add(DiagramDto.DiagramNode.builder()
                    .id("node-2").label("Step 1: Input Processing").description("Parse state and allocate memory buffers")
                    .category("process").shape("rect").color("#6366f1").icon("Cpu")
                    .examTip("Pre-conditions must be met before proceeding.").x(320.0).y(160.0).build());
            nodes.add(DiagramDto.DiagramNode.builder()
                    .id("node-3").label("Condition Check").description("Evaluate if termination or base case condition is met")
                    .category("decision").shape("diamond").color("#f59e0b").icon("HelpCircle")
                    .examTip("Decision branches determine worst-case time complexity.").x(320.0).y(280.0).build());
            nodes.add(DiagramDto.DiagramNode.builder()
                    .id("node-4").label("Execute Transformation").description("Apply core algorithm / mathematical operation")
                    .category("process").shape("rect").color("#3b82f6").icon("Layers")
                    .examTip("Main state update happens here.").x(140.0).y(400.0).build());
            nodes.add(DiagramDto.DiagramNode.builder()
                    .id("node-5").label("Emit Result & Finish").description("Return output and deallocate temporary resources")
                    .category("end").shape("pill").color("#ef4444").icon("CheckCircle")
                    .examTip("Verify invariant conditions hold upon termination.").x(320.0).y(510.0).build());

            edges.add(DiagramDto.DiagramEdge.builder().id("e1").sourceId("node-1").targetId("node-2").label("Start").style("solid").build());
            edges.add(DiagramDto.DiagramEdge.builder().id("e2").sourceId("node-2").targetId("node-3").label("Data Loaded").style("solid").build());
            edges.add(DiagramDto.DiagramEdge.builder().id("e3").sourceId("node-3").targetId("node-4").label("Condition True").style("solid").build());
            edges.add(DiagramDto.DiagramEdge.builder().id("e4").sourceId("node-4").targetId("node-3").label("Loop Next").style("dashed").build());
            edges.add(DiagramDto.DiagramEdge.builder().id("e5").sourceId("node-3").targetId("node-5").label("Base Case / Done").style("solid").build());

            keyTakeaways.add("Flowcharts require unambiguous decision criteria at every branching point.");
            keyTakeaways.add("Loop termination must be guaranteed to prevent infinite state cycles.");
        } else if ("SYSTEM_ARCHITECTURE".equalsIgnoreCase(diagramType)) {
            nodes.add(DiagramDto.DiagramNode.builder()
                    .id("node-1").label("Client Interface").description("Student Browser / Mobile app client sending requests")
                    .category("component").shape("rect").color("#0ea5e9").icon("Monitor")
                    .examTip("Handles presentation and optimistic user feedback.").x(320.0).y(50.0).build());
            nodes.add(DiagramDto.DiagramNode.builder()
                    .id("node-2").label("API Gateway / Router").description("Authenticates JWT, applies rate limits, and routes requests")
                    .category("component").shape("rect").color("#6366f1").icon("Server")
                    .examTip("Centralized security checkpoint and reverse proxy.").x(320.0).y(170.0).build());
            nodes.add(DiagramDto.DiagramNode.builder()
                    .id("node-3").label("Application Service Layer").description("Business logic for " + topic)
                    .category("process").shape("rect").color("#8b5cf6").icon("Cpu")
                    .examTip("Stateless business layer enables horizontal scaling.").x(320.0).y(290.0).build());
            nodes.add(DiagramDto.DiagramNode.builder()
                    .id("node-4").label("Persistence & Database").description("ACID compliant relational storage & cache index")
                    .category("component").shape("hexagon").color("#10b981").icon("Database")
                    .examTip("Indexing and normalization minimize I/O overhead.").x(320.0).y(410.0).build());

            edges.add(DiagramDto.DiagramEdge.builder().id("e1").sourceId("node-1").targetId("node-2").label("HTTPS / REST").style("solid").build());
            edges.add(DiagramDto.DiagramEdge.builder().id("e2").sourceId("node-2").targetId("node-3").label("Internal RPC").style("solid").build());
            edges.add(DiagramDto.DiagramEdge.builder().id("e3").sourceId("node-3").targetId("node-4").label("JPA / SQL Queries").style("solid").build());

            keyTakeaways.add("Decoupling layers ensures high cohesion and low coupling across modules.");
            keyTakeaways.add("Always place security and token validation at the outer gateway boundary.");
        } else {
            // REVISION_INFOGRAPHIC or CONCEPT_MAP
            nodes.add(DiagramDto.DiagramNode.builder()
                    .id("node-1").label(topic).description("Core foundational pillar in " + subject)
                    .category("start").shape("pill").color("#6366f1").icon("Sparkles")
                    .examTip("Master the definition before solving numericals.").x(320.0).y(50.0).build());
            nodes.add(DiagramDto.DiagramNode.builder()
                    .id("node-2").label("Fundamental Theory").description("Underlying laws, axioms, and specifications")
                    .category("concept").shape("rect").color("#3b82f6").icon("BookOpen")
                    .examTip("Questions often test exceptions to the standard theory.").x(140.0).y(180.0).build());
            nodes.add(DiagramDto.DiagramNode.builder()
                    .id("node-3").label("Practical Application").description("Real-world implementation and trade-offs")
                    .category("concept").shape("rect").color("#0ea5e9").icon("Tool")
                    .examTip("Case study questions emphasize efficiency trade-offs.").x(500.0).y(180.0).build());
            nodes.add(DiagramDto.DiagramNode.builder()
                    .id("node-4").label("Key Formula / Theorem").description("Mathematical formulation and proof structure")
                    .category("formula").shape("rounded").color("#ec4899").icon("Zap")
                    .examTip("Check dimensional consistency when writing equations.").x(320.0).y(310.0).build());

            edges.add(DiagramDto.DiagramEdge.builder().id("e1").sourceId("node-1").targetId("node-2").label("Governed by").style("solid").build());
            edges.add(DiagramDto.DiagramEdge.builder().id("e2").sourceId("node-1").targetId("node-3").label("Applied in").style("solid").build());
            edges.add(DiagramDto.DiagramEdge.builder().id("e3").sourceId("node-2").targetId("node-4").label("Formulated as").style("dashed").build());
            edges.add(DiagramDto.DiagramEdge.builder().id("e4").sourceId("node-3").targetId("node-4").label("Validated by").style("solid").build());

            sections.add(DiagramDto.DiagramSection.builder()
                    .id("s1").title("Core Principles")
                    .icon("Sparkles").color("#6366f1")
                    .summary("Main concepts governing " + topic)
                    .bulletPoints(List.of("Linear time efficiency", "State immutability", "Error boundary verification"))
                    .formula("Complexity: O(n log n)")
                    .build());
            sections.add(DiagramDto.DiagramSection.builder()
                    .id("s2").title("Exam Pitfalls & Traps")
                    .icon("AlertTriangle").color("#f59e0b")
                    .summary("Common mistakes students make in tests")
                    .bulletPoints(List.of("Ignoring off-by-one boundary cases", "Confusing worst-case with average-case", "Omitting unit conversion"))
                    .formula("Trap: Assuming constant time without verification")
                    .build());

            keyTakeaways.add("Always define variables before writing formulas in theoretical answers.");
            keyTakeaways.add("Re-verify calculations with boundary edge cases (0, 1, or maximum bounds).");
            formula = "Efficiency: O(log n) | High Examination Weightage";
        }

        return DiagramDto.DiagramPayload.builder()
                .title(topic + " — " + diagramType.replace("_", " "))
                .diagramType(diagramType)
                .summary("Comprehensive structured visualization of " + topic + " for exam mastery and rapid revision.")
                .layoutDirection("TB")
                .nodes(nodes)
                .edges(edges)
                .sections(sections)
                .keyTakeaways(keyTakeaways)
                .formulaHighlight(formula)
                .build();
    }

    @Transactional
    public DiagramDto.Response saveDiagram(DiagramDto.SaveRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Subject subject = null;
        if (request.getSubjectId() != null) {
            subject = subjectRepository.findById(request.getSubjectId()).orElse(null);
        }

        Diagram diagram = Diagram.builder()
                .user(user)
                .subject(subject)
                .title(request.getTitle())
                .description(request.getDescription())
                .diagramType(request.getDiagramType())
                .graphData(request.getGraphData())
                .layoutStyle(request.getLayoutStyle())
                .nodeCount(request.getNodeCount() != null ? request.getNodeCount() : 0)
                .build();

        Diagram saved = diagramRepository.save(diagram);
        return mapToResponse(saved);
    }

    public List<DiagramDto.Response> getDiagrams(String userEmail, Long subjectId) {
        List<Diagram> diagrams;
        if (subjectId != null) {
            diagrams = diagramRepository.findByUserEmailAndSubjectIdOrderByCreatedAtDesc(userEmail, subjectId);
        } else {
            diagrams = diagramRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
        }
        return diagrams.stream().map(this::mapToResponse).toList();
    }

    public DiagramDto.Response getDiagramById(Long id, String userEmail) {
        Diagram diagram = diagramRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Diagram not found with id: " + id));
        if (!diagram.getUser().getEmail().equals(userEmail)) {
            throw new BadRequestException("You do not have permission to view this diagram");
        }
        return mapToResponse(diagram);
    }

    @Transactional
    public void deleteDiagram(Long id, String userEmail) {
        Diagram diagram = diagramRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Diagram not found with id: " + id));
        if (!diagram.getUser().getEmail().equals(userEmail)) {
            throw new BadRequestException("You do not have permission to delete this diagram");
        }
        diagramRepository.delete(diagram);
    }

    private DiagramDto.Response mapToResponse(Diagram diagram) {
        return DiagramDto.Response.builder()
                .id(diagram.getId())
                .title(diagram.getTitle())
                .description(diagram.getDescription())
                .subjectId(diagram.getSubject() != null ? diagram.getSubject().getId() : null)
                .subjectName(diagram.getSubject() != null ? diagram.getSubject().getName() : null)
                .diagramType(diagram.getDiagramType())
                .graphData(diagram.getGraphData())
                .layoutStyle(diagram.getLayoutStyle())
                .nodeCount(diagram.getNodeCount())
                .createdAt(diagram.getCreatedAt())
                .build();
    }
}
