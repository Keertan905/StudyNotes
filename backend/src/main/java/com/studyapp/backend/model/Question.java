package com.studyapp.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    @JsonIgnore
    private Quiz quiz;

    @Builder.Default
    @Column(nullable = false)
    private String questionType = "MCQ"; // MCQ, TRUE_FALSE, SHORT_ANSWER, LONG_ANSWER

    @Column(columnDefinition = "TEXT", nullable = false)
    private String questionText;

    // JSON array of options for MCQ/TRUE_FALSE e.g. ["Option A", "Option B", "Option C", "Option D"]
    @Column(columnDefinition = "TEXT")
    private String optionsJson;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String correctAnswer;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Builder.Default
    private Integer marks = 1;

    private String topicTag;

    // Rubric JSON for short/long descriptive evaluation
    @Column(columnDefinition = "TEXT")
    private String rubricJson;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
