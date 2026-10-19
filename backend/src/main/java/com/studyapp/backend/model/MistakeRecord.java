package com.studyapp.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "mistake_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class MistakeRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_attempt_id")
    @JsonIgnore
    private QuizAttempt quizAttempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @Column(columnDefinition = "TEXT")
    private String submittedAnswer;

    // e.g. CONCEPTUAL_GAP, MISREAD_QUESTION, CALCULATION_ERROR, MEMORY_LAPSE
    @Builder.Default
    @Column(nullable = false)
    private String mistakeCategory = "CONCEPTUAL_GAP";

    @Column(columnDefinition = "TEXT")
    private String aiRootCause;

    @Column(columnDefinition = "TEXT")
    private String aiRevisionTip;

    // UNRESOLVED, REVIEWED, RESOLVED
    @Builder.Default
    @Column(nullable = false)
    private String status = "UNRESOLVED";

    @Builder.Default
    private Integer retryCount = 0;

    private LocalDateTime lastAttemptedAt;

    private LocalDateTime resolvedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
