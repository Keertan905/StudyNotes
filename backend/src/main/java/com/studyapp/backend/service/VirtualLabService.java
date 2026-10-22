package com.studyapp.backend.service;

import com.studyapp.backend.dto.VirtualLabDto;
import com.studyapp.backend.exception.ResourceNotFoundException;
import com.studyapp.backend.model.User;
import com.studyapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class VirtualLabService {

    private final UserRepository userRepository;
    private final GamificationService gamificationService;

    private static final Map<String, VirtualLabDto.ExperimentDetail> EXPERIMENTS = new LinkedHashMap<>();

    static {
        // 1. CPU Scheduling Experiment
        EXPERIMENTS.put("cpu-scheduling", VirtualLabDto.ExperimentDetail.builder()
                .id("cpu-scheduling")
                .title("CPU Scheduling Algorithms Simulator")
                .category("COMPUTER_SCIENCE")
                .subject("Operating Systems")
                .difficulty("Intermediate")
                .description("Simulate and compare CPU scheduling algorithms (FCFS, Round Robin, SJF, and Priority) with interactive Gantt charts and performance metrics.")
                .objective("Understand how process scheduling impacts average waiting time, turnaround time, throughput, and CPU utilization.")
                .theoryPoints(List.of(
                        "Turnaround Time = Completion Time - Arrival Time",
                        "Waiting Time = Turnaround Time - Burst Time",
                        "FCFS suffers from the Convoy Effect where short processes wait behind long ones.",
                        "Round Robin gives fair CPU share using a time quantum; too small causes context-switch overhead, too large degrades to FCFS.",
                        "Shortest Job First (SJF) is provably optimal for minimizing average waiting time, but can cause starvation for long processes."
                ))
                .formulas(List.of(
                        "TAT = CT - AT",
                        "WT = TAT - BT",
                        "Average WT = (∑ WT_i) / n",
                        "CPU Utilization = (Busy Time / Total Time) × 100%"
                ))
                .stepInstructions(List.of(
                        "Step 1: Inspect the process table. Use default processes or add custom ones with Arrival Time, Burst Time, and Priority.",
                        "Step 2: Choose a scheduling algorithm (e.g. FCFS, Round Robin, SJF, or Priority).",
                        "Step 3: If Round Robin is chosen, adjust the Time Quantum slider (default: 2 or 3 ms).",
                        "Step 4: Press 'Run Simulation' or use 'Step' to advance cycle by cycle. Watch the Ready Queue and Gantt chart update.",
                        "Step 5: Compare the calculated Average Waiting Time and Turnaround Time against theoretical calculations."
                ))
                .quizQuestions(List.of(
                        VirtualLabDto.QuizQuestion.builder()
                                .id("q1")
                                .question("Which CPU scheduling algorithm is provably optimal in minimizing the average waiting time for a set of processes?")
                                .options(List.of("First-Come, First-Served (FCFS)", "Round Robin (RR)", "Shortest Job First (SJF)", "Priority Scheduling"))
                                .correctOptionIndex(2)
                                .explanation("SJF is provably optimal because scheduling the shortest job first minimizes the waiting times of all subsequent processes in the queue.")
                                .relatedConcept("SJF Optimality")
                                .build(),
                        VirtualLabDto.QuizQuestion.builder()
                                .id("q2")
                                .question("In Round Robin scheduling, what happens if the time quantum is set arbitrarily large (larger than the longest burst time)?")
                                .options(List.of("High context switch overhead", "The algorithm degenerates into FCFS", "Starvation of high priority jobs", "CPU utilization drops to zero"))
                                .correctOptionIndex(1)
                                .explanation("If the time quantum is larger than any process burst time, each process runs to completion on its first turn, identical to FCFS.")
                                .relatedConcept("Round Robin Quantum Selection")
                                .build(),
                        VirtualLabDto.QuizQuestion.builder()
                                .id("q3")
                                .question("A process arrives at time AT = 2, has burst time BT = 6, and completes at CT = 11. What is its Waiting Time (WT)?")
                                .options(List.of("5 ms", "3 ms", "9 ms", "11 ms"))
                                .correctOptionIndex(1)
                                .explanation("Turnaround Time = CT - AT = 11 - 2 = 9. Waiting Time = TAT - BT = 9 - 6 = 3 ms.")
                                .relatedConcept("Metric Calculation")
                                .build()
                ))
                .defaultParameters(Map.of(
                        "algorithm", "ROUND_ROBIN",
                        "timeQuantum", 2,
                        "processes", List.of(
                                Map.of("id", "P1", "arrival", 0, "burst", 5, "priority", 2),
                                Map.of("id", "P2", "arrival", 1, "burst", 3, "priority", 1),
                                Map.of("id", "P3", "arrival", 2, "burst", 8, "priority", 3),
                                Map.of("id", "P4", "arrival", 3, "burst", 2, "priority", 4)
                        )
                ))
                .build());

        // 2. Network Packet Routing Experiment
        EXPERIMENTS.put("packet-routing", VirtualLabDto.ExperimentDetail.builder()
                .id("packet-routing")
                .title("Network Packet Routing & Shortest Path Simulator")
                .category("NETWORKING")
                .subject("Computer Networks")
                .difficulty("Intermediate")
                .description("Explore Dijkstra-based shortest path routing, dynamic link weights, link failure rerouting, and hop-by-hop packet transmission latency.")
                .objective("Understand IP packet forwarding, routing table construction, queue delays, and dynamic path convergence.")
                .theoryPoints(List.of(
                        "Routers forward packets based on forwarding tables populated by algorithms like Dijkstra (OSPF link-state) or Bellman-Ford (RIP distance vector).",
                        "End-to-end Latency = Transmission Delay + Propagation Delay + Queuing Delay + Processing Delay.",
                        "Time-to-Live (TTL) decrements at each hop to prevent infinite forwarding loops in cyclic topologies.",
                        "When an active link fails, routers must recalculate optimal paths to converge without packet drop storms."
                ))
                .formulas(List.of(
                        "Total Latency = ∑ (d_trans + d_prop + d_queue + d_proc)",
                        "d_trans = Packet Size / Link Bandwidth (L / R)",
                        "d_prop = Distance / Propagation Speed (d / s)",
                        "TTL_new = TTL_current - 1"
                ))
                .stepInstructions(List.of(
                        "Step 1: Inspect the network topology graph connecting Client, Routers (R1-R4), and Destination Server.",
                        "Step 2: Adjust link weights or toggle link states (Online / Broken) to simulate network conditions.",
                        "Step 3: Select packet type (TCP SYN, HTTP GET, UDP ping) and click 'Send Packet'.",
                        "Step 4: Watch the animated packet traverse intermediate router nodes. Observe routing table lookups and hop latency.",
                        "Step 5: Break an active link while packets are in transit to witness dynamic failover rerouting."
                ))
                .quizQuestions(List.of(
                        VirtualLabDto.QuizQuestion.builder()
                                .id("q1")
                                .question("Which routing protocol uses Dijkstra's algorithm to compute the shortest path tree from link-state advertisements?")
                                .options(List.of("RIP (Routing Information Protocol)", "OSPF (Open Shortest Path First)", "BGP (Border Gateway Protocol)", "ARP (Address Resolution Protocol)"))
                                .correctOptionIndex(1)
                                .explanation("OSPF is a Link-State protocol that runs Dijkstra's algorithm locally on each router using complete topology information.")
                                .relatedConcept("Link-State Routing")
                                .build(),
                        VirtualLabDto.QuizQuestion.builder()
                                .id("q2")
                                .question("What is the primary purpose of the IP Header Time-To-Live (TTL) field?")
                                .options(List.of("To track transmission timestamp", "To measure hop latency", "To prevent looping packets from congesting the network indefinitely", "To encrypt packet contents"))
                                .correctOptionIndex(2)
                                .explanation("Each router decrements TTL by 1. When TTL reaches 0, the packet is discarded and an ICMP Time Exceeded message is sent back.")
                                .relatedConcept("TTL & Loop Mitigation")
                                .build(),
                        VirtualLabDto.QuizQuestion.builder()
                                .id("q3")
                                .question("If link bandwidth R = 10 Mbps and packet size L = 1,000,000 bits, what is the transmission delay?")
                                .options(List.of("10 ms", "100 ms", "1 second", "0.1 ms"))
                                .correctOptionIndex(1)
                                .explanation("Transmission delay = L / R = 1,000,000 / 10,000,000 = 0.1 seconds = 100 ms.")
                                .relatedConcept("Transmission Delay")
                                .build()
                ))
                .defaultParameters(Map.of(
                        "source", "Client",
                        "destination", "WebServer",
                        "packetType", "HTTP_REQUEST",
                        "nodes", List.of("Client", "R1", "R2", "R3", "R4", "WebServer")
                ))
                .build());

        // 3. Logic Gate Simulator
        EXPERIMENTS.put("logic-gates", VirtualLabDto.ExperimentDetail.builder()
                .id("logic-gates")
                .title("Digital Logic Gates & Combinational Circuits Simulator")
                .category("ELECTRONICS")
                .subject("Digital Electronics & Computer Architecture")
                .difficulty("Beginner")
                .description("Construct logic circuits with AND, OR, NOT, NAND, NOR, and XOR gates. Toggle inputs, observe LED outputs, and auto-verify truth tables.")
                .objective("Master Boolean logic, gate truth tables, De Morgan's laws, and combinational circuits like Half Adders and Multiplexers.")
                .theoryPoints(List.of(
                        "NAND and NOR gates are 'Universal Gates' because any Boolean function can be implemented using only NAND or only NOR gates.",
                        "XOR (Exclusive OR) outputs 1 if and only if inputs are different. It forms the foundation of binary adders and parity checkers.",
                        "Half Adder: Sum = A ⊕ B, Carry = A · B.",
                        "De Morgan's Theorem: (A · B)' = A' + B' and (A + B)' = A' · B'."
                ))
                .formulas(List.of(
                        "AND: Y = A · B",
                        "OR: Y = A + B",
                        "NOT: Y = A'",
                        "XOR: Y = A ⊕ B = A'B + AB'",
                        "NAND: Y = (A · B)'"
                ))
                .stepInstructions(List.of(
                        "Step 1: Choose a circuit preset (Single Gate, Half Adder, 2-to-1 Multiplexer, or Full Adder).",
                        "Step 2: Toggle Input Switches (A, B, C) between Logic 0 (LOW) and Logic 1 (HIGH).",
                        "Step 3: Trace wire signals through intermediate gates. Watch output LED states (OFF: 0, Glowing Green: 1).",
                        "Step 4: Inspect the live Truth Table. Note how the active row highlights based on your current input configuration.",
                        "Step 5: Verify that the circuit matches theoretical Boolean equations."
                ))
                .quizQuestions(List.of(
                        VirtualLabDto.QuizQuestion.builder()
                                .id("q1")
                                .question("Why are NAND and NOR gates called 'Universal Gates' in digital electronics?")
                                .options(List.of("They consume zero static power", "Any logic function can be constructed using only that gate type", "They operate at the speed of light", "They can store infinite bits"))
                                .correctOptionIndex(1)
                                .explanation("A universal gate can implement all fundamental Boolean operations (NOT, AND, OR) without requiring any other gate types.")
                                .relatedConcept("Universal Logic Gates")
                                .build(),
                        VirtualLabDto.QuizQuestion.builder()
                                .id("q2")
                                .question("What is the Boolean expression for the Carry output (C) of a binary Half Adder with inputs A and B?")
                                .options(List.of("A + B", "A ⊕ B", "A · B", "(A · B)'"))
                                .correctOptionIndex(2)
                                .explanation("A Half Adder generates Sum = A ⊕ B and Carry = A · B (since carry is 1 only when both A and B are 1).")
                                .relatedConcept("Half Adder Circuit")
                                .build(),
                        VirtualLabDto.QuizQuestion.builder()
                                .id("q3")
                                .question("According to De Morgan's first theorem, the expression (A + B)' is equivalent to:")
                                .options(List.of("A' · B'", "A' + B'", "A · B", "(A · B)'"))
                                .correctOptionIndex(0)
                                .explanation("De Morgan's theorem states that the complement of a sum is equal to the product of the complements: (A + B)' = A' · B'.")
                                .relatedConcept("De Morgan's Laws")
                                .build()
                ))
                .defaultParameters(Map.of(
                        "preset", "HALF_ADDER",
                        "inputA", false,
                        "inputB", false
                ))
                .build());

        // 4. Ohm's Law Experiment
        EXPERIMENTS.put("ohms-law", VirtualLabDto.ExperimentDetail.builder()
                .id("ohms-law")
                .title("Ohm's Law & Circuit Behavior Simulator")
                .category("PHYSICS")
                .subject("Physics & Basic Electrical Engineering")
                .difficulty("Beginner")
                .description("Explore the fundamental relationship between Voltage (V), Current (I), and Resistance (R). View live electron flow animations and V-I characteristics.")
                .objective("Verify V = I × R empirically, understand electrical power dissipation (P = V × I), and identify thermal resistor limits.")
                .theoryPoints(List.of(
                        "Ohm's Law states that electric current through a conductor between two points is directly proportional to voltage and inversely proportional to resistance.",
                        "Electrical Power is the rate of energy dissipation: P = V × I = I²R = V² / R (measured in Watts).",
                        "Ohmic materials display a strictly linear V vs I relationship with slope equal to Resistance (R).",
                        "Real resistors have maximum power ratings (e.g. 0.25W, 0.5W, 1W); exceeding this causes thermal breakdown."
                ))
                .formulas(List.of(
                        "V = I × R",
                        "I = V / R",
                        "R = V / I",
                        "Power P = V × I = I² × R = V² / R"
                ))
                .stepInstructions(List.of(
                        "Step 1: Use the Voltage slider to adjust DC battery voltage (0 to 24 V).",
                        "Step 2: Use the Resistance slider to change resistor value (1 to 1000 Ω).",
                        "Step 3: Toggle the circuit Switch to ON to start electron flow.",
                        "Step 4: Observe the live Ammeter reading (Current in mA or A) and the animated electron drift speed.",
                        "Step 5: Watch the real-time V-I curve plot and inspect power dissipation for thermal safety warnings."
                ))
                .quizQuestions(List.of(
                        VirtualLabDto.QuizQuestion.builder()
                                .id("q1")
                                .question("If a 12V voltage source is connected across a 400 Ω resistor, what is the current flowing through the circuit?")
                                .options(List.of("30 mA", "300 mA", "4.8 A", "3 mA"))
                                .correctOptionIndex(0)
                                .explanation("I = V / R = 12 / 400 = 0.03 A = 30 mA.")
                                .relatedConcept("Ohm's Law Calculation")
                                .build(),
                        VirtualLabDto.QuizQuestion.builder()
                                .id("q2")
                                .question("If the voltage across an Ohmic resistor is doubled while keeping resistance constant, what happens to power dissipation?")
                                .options(List.of("Power doubles (2x)", "Power remains constant", "Power quadruples (4x)", "Power is halved (0.5x)"))
                                .correctOptionIndex(2)
                                .explanation("Power P = V² / R. If V is doubled to 2V, new power is (2V)² / R = 4(V² / R) = 4P.")
                                .relatedConcept("Power Dissipation Law")
                                .build(),
                        VirtualLabDto.QuizQuestion.builder()
                                .id("q3")
                                .question("What is the slope of a Voltage (Y-axis) versus Current (X-axis) graph for an Ohmic conductor?")
                                .options(List.of("Conductance (G)", "Resistance (R)", "Capacitance (C)", "Power (P)"))
                                .correctOptionIndex(1)
                                .explanation("Since V = I × R, a plot with V on the vertical axis and I on the horizontal axis has slope ΔV / ΔI = R.")
                                .relatedConcept("V-I Characteristic Graph")
                                .build()
                ))
                .defaultParameters(Map.of(
                        "voltage", 12.0,
                        "resistance", 240.0,
                        "switchClosed", true
                ))
                .build());
    }

    public List<VirtualLabDto.ExperimentSummary> getAllExperiments() {
        return EXPERIMENTS.values().stream().map(e -> VirtualLabDto.ExperimentSummary.builder()
                .id(e.getId())
                .title(e.getTitle())
                .category(e.getCategory())
                .subject(e.getSubject())
                .difficulty(e.getDifficulty())
                .description(e.getDescription())
                .objective(e.getObjective())
                .concepts(e.getTheoryPoints().stream().limit(3).toList())
                .icon(switch (e.getCategory()) {
                    case "COMPUTER_SCIENCE" -> "Cpu";
                    case "NETWORKING" -> "Network";
                    case "ELECTRONICS" -> "Zap";
                    case "PHYSICS" -> "Activity";
                    default -> "FlaskConical";
                })
                .build()
        ).toList();
    }

    public VirtualLabDto.ExperimentDetail getExperimentById(String id) {
        VirtualLabDto.ExperimentDetail experiment = EXPERIMENTS.get(id);
        if (experiment == null) {
            throw new ResourceNotFoundException("Experiment not found with id: " + id);
        }
        return experiment;
    }

    @Transactional
    public VirtualLabDto.AssessmentResult evaluateAssessment(VirtualLabDto.QuizSubmissionRequest request, String userEmail) {
        VirtualLabDto.ExperimentDetail experiment = getExperimentById(request.getExperimentId());
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Map<String, Integer> answers = request.getSelectedAnswers() != null ? request.getSelectedAnswers() : Map.of();
        List<VirtualLabDto.QuestionResult> results = new ArrayList<>();
        int correct = 0;

        for (VirtualLabDto.QuizQuestion q : experiment.getQuizQuestions()) {
            Integer selected = answers.get(q.getId());
            boolean isCorrect = selected != null && selected == q.getCorrectOptionIndex();
            if (isCorrect) correct++;

            results.add(VirtualLabDto.QuestionResult.builder()
                    .questionId(q.getId())
                    .isCorrect(isCorrect)
                    .selectedIndex(selected != null ? selected : -1)
                    .correctIndex(q.getCorrectOptionIndex())
                    .explanation(q.getExplanation())
                    .build());
        }

        int total = experiment.getQuizQuestions().size();
        int scorePct = total > 0 ? (int) Math.round(((double) correct / total) * 100.0) : 0;
        boolean passed = scorePct >= 66;

        int xpAwarded = 0;
        if (passed) {
            var reward = gamificationService.awardVirtualLabXp(user, experiment.getId(), scorePct, experiment.getTitle());
            if (reward != null && reward.getXpEarned() != null) {
                xpAwarded = reward.getXpEarned();
            }
        }

        String feedback = scorePct == 100 
                ? "Outstanding! You demonstrated flawless mastery of " + experiment.getTitle() + "!"
                : passed 
                ? "Great job! You passed the post-experiment lab assessment." 
                : "Good attempt! Review the theory and experiment steps before retaking the assessment.";

        return VirtualLabDto.AssessmentResult.builder()
                .experimentId(experiment.getId())
                .totalQuestions(total)
                .correctCount(correct)
                .scorePercentage(scorePct)
                .passed(passed)
                .xpAwarded(xpAwarded)
                .feedbackMessage(feedback)
                .questionResults(results)
                .build();
    }
}
