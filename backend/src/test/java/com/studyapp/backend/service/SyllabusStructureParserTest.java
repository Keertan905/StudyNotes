package com.studyapp.backend.service;

import com.studyapp.backend.dto.SubjectDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SyllabusStructureParserTest {

    private SyllabusStructureParser parser;

    @BeforeEach
    void setUp() {
        parser = new SyllabusStructureParser();
    }

    @Test
    @DisplayName("Should parse multi-semester RGPV curriculum with course codes, units, and granular topics")
    void testMultiSemesterRgpvSyllabusParsing() {
        String syllabusText = """
            RAJIV GANDHI PROUDYOGIKI VISHWAVIDYALAYA, BHOPAL
            New Scheme Based On AICTE Flexible Curricula
            Computer Science and Information Technology
            
            B.Tech. CSIT - Semester - III
            
            CSIT-301 Discrete Mathematics & Graph Theory
            Unit I: Set Theory and Relations: Sets, Subsets, Operations on Sets, Cartesian Products, Binary Relations, Equivalence Relations, Partial Ordering Relations, Poset, Hasse Diagram.
            Unit II: Algebraic Structures: Semigroups, Monoids, Groups, Subgroups, Cosets, Lagrange's Theorem, Normal Subgroups, Homomorphism and Isomorphism.
            Unit III: Propositional Logic: Propositions, Truth Tables, Tautology, Contradiction, Normal Forms, Predicates and Quantifiers, Methods of Proof.
            Unit IV: Graph Theory: Basic terminology, Directed and Undirected graphs, Eulerian and Hamiltonian paths, Matrix representation of graphs, Planar graphs, Graph coloring.
            Unit V: Trees: Properties of Trees, Spanning Trees, Minimum Spanning Trees, Prim's and Kruskal's algorithm, Binary trees and tree traversals.
            References:
            1. Rosen K.H., "Discrete Mathematics and Its Applications", McGraw-Hill.
            2. Liu C.L., "Elements of Discrete Mathematics", Tata McGraw-Hill.
            
            CSIT-302 Data Structures and Algorithms
            Unit I: Introduction to Algorithms: Time and Space Complexity, Big O, Omega and Theta notations, Abstract Data Types. Arrays: Memory representation, Sparse Matrices.
            Unit II: Linear Data Structures: Stacks: Array and Linked List implementation, Polish notations, Recursion. Queues: Circular Queue, Priority Queue, Deque.
            Unit III: Non-Linear Structures - Trees: Binary Tree, Binary Search Tree, AVL Trees, B-Trees, Heap.
            Unit IV: Graph Algorithms: BFS, DFS, Dijkstra's Shortest Path, Bellman-Ford, Floyd-Warshall.
            Unit V: Sorting and Searching: Bubble Sort, Quick Sort, Merge Sort, Heap Sort, Linear Search, Binary Search, Hashing techniques and Collision Resolution.
            Text Books:
            1. Horowitz, Sahni, Anderson-Freed, "Fundamentals of Data Structures in C".
            
            === PAGE 2 ===
            
            B.Tech. CSIT - Semester - IV
            
            CSIT-401 Database Management Systems
            Unit I: Introduction: Database System Concepts, 3-Tier Architecture, Data Independence, Data Models, ER-Modeling.
            Unit II: Relational Model: Relational Algebra, Tuple Relational Calculus, Domain Relational Calculus, SQL Queries, Joins, Subqueries.
            Unit III: Database Design & Normalization: Functional Dependencies, Decomposition, Normal Forms: 1NF, 2NF, 3NF, BCNF, 4NF.
            Unit IV: Transaction Processing: ACID Properties, Schedules, Serializability, Concurrency Control, Lock-Based Protocols, Deadlocks.
            Unit V: Indexing & Storage: File Organization, B+ Tree Indexing, Static and Dynamic Hashing, Query Optimization basics.
            Suggested Reading:
            1. Korth, Silberschatz, Sudarshan, "Database System Concepts".
            
            CSIT-402(A) Artificial Intelligence (Departmental Elective)
            Unit I: AI Overview: Foundations of AI, Turing Test, Intelligent Agents, Problem Solving as Search.
            Unit II: Informed Search: A* Search, Heuristic Functions, Hill Climbing, Genetic Algorithms.
            Unit III: Knowledge Representation: Propositional and First Order Logic, Semantic Networks, Frames.
            Unit IV: Machine Learning Foundations: Supervised vs Unsupervised Learning, Decision Trees, Linear Regression.
            Unit V: Neural Networks & Expert Systems: Perceptron, Multilayer Perceptron, Expert System Architecture.
            """;

        List<SubjectDto.ExtractedSubject> subjects = parser.parseSyllabusText(syllabusText, "RGPV_CSIT_Curriculum.pdf");

        assertNotNull(subjects);
        assertEquals(4, subjects.size(), "Should identify exactly 4 courses across the 2 semesters");

        // Verify Subject 1: CSIT-301
        SubjectDto.ExtractedSubject sub1 = subjects.get(0);
        assertEquals("CSIT-301", sub1.getCode());
        assertEquals(3, sub1.getSemester());
        assertTrue(sub1.getName().contains("Discrete Mathematics"));
        assertEquals("CORE / THEORY", sub1.getSubjectType());
        assertFalse(sub1.isNeedsReview(), "Well-formed subject should not need review");
        assertEquals(5, sub1.getUnits().size(), "Should extract all 5 units for CSIT-301");
        assertTrue(sub1.getUnits().get(0).getTopics().contains("Equivalence Relations"));
        // Ensure References are NOT included as units or topics
        for (SubjectDto.UnitRequest u : sub1.getUnits()) {
            assertFalse(u.getTitle().toLowerCase().contains("references"));
            for (String t : u.getTopics()) {
                assertFalse(t.toLowerCase().contains("mcgraw-hill"));
            }
        }

        // Verify Subject 2: CSIT-302
        SubjectDto.ExtractedSubject sub2 = subjects.get(1);
        assertEquals("CSIT-302", sub2.getCode());
        assertEquals(3, sub2.getSemester());
        assertEquals(5, sub2.getUnits().size());
        assertEquals(2, sub2.getOrderIndex());

        // Verify Subject 3: CSIT-401 in Semester IV
        SubjectDto.ExtractedSubject sub3 = subjects.get(2);
        assertEquals("CSIT-401", sub3.getCode());
        assertEquals(4, sub3.getSemester(), "Semester IV should correctly transition to 4");
        assertEquals(5, sub3.getUnits().size());
        assertEquals(1, sub3.getOrderIndex(), "First course in Semester IV should have orderIndex 1");

        // Verify Subject 4: CSIT-402(A) Elective
        SubjectDto.ExtractedSubject sub4 = subjects.get(3);
        assertEquals("CSIT-402(A)", sub4.getCode());
        assertEquals(4, sub4.getSemester());
        assertEquals("DEPARTMENTAL ELECTIVE", sub4.getSubjectType(), "Should classify departmental elective");
        assertEquals(5, sub4.getUnits().size());
    }

    @Test
    @DisplayName("Should flag incomplete subjects for manual review when course code or units are missing")
    void testIncompleteSubjectFlaggedForReview() {
        String ambiguousText = """
            Semester: VI
            
            Cloud Computing Concepts
            Unit 1: Cloud Service Models, IaaS, PaaS, SaaS
            Unit 2: Virtualization, Hypervisors, Containers, Docker
            """;

        List<SubjectDto.ExtractedSubject> subjects = parser.parseSyllabusText(ambiguousText, "AmbiguousSyllabus.txt");

        assertEquals(1, subjects.size());
        SubjectDto.ExtractedSubject sub = subjects.get(0);
        assertEquals(6, sub.getSemester());
        assertTrue(sub.isNeedsReview(), "Subject missing code and having only 2 units must be flagged for manual review");
        assertNotNull(sub.getReviewReason());
        assertTrue(sub.getReviewReason().contains("Course code not detected") || sub.getReviewReason().contains("unit(s)"));
    }

    @Test
    @DisplayName("Should handle units spanning page boundaries without mixing content between subjects")
    void testMultiPageUnitContinuation() {
        String multiPageText = """
            Semester: V
            
            CSIT-501 Theory of Computation
            Unit I: Regular Languages: Finite Automata, DFA, NFA, Regular Expressions.
            === PAGE 3 ===
            Equivalence of DFA and NFA, Pumping Lemma for Regular Languages.
            Unit II: Context Free Grammars: Derivation trees, Chomsky Normal Form.
            Unit III: Pushdown Automata: PDA model, Acceptance by final state.
            Unit IV: Turing Machines: Formal definition, Variants of Turing Machines.
            Unit V: Decidability and Halting Problem: Rice's Theorem, Undecidable problems.
            """;

        List<SubjectDto.ExtractedSubject> subjects = parser.parseSyllabusText(multiPageText, "TOC.pdf");

        assertEquals(1, subjects.size());
        SubjectDto.ExtractedSubject sub = subjects.get(0);
        assertEquals(5, sub.getUnits().size());

        SubjectDto.UnitRequest unit1 = sub.getUnits().get(0);
        // Verify continuation across page 3 is retained in Unit 1
        assertTrue(unit1.getTopics().stream().anyMatch(t -> t.contains("Pumping Lemma") || t.contains("Equivalence of DFA")));
    }
}
