package com.studyapp.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "study_plan_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class StudyPlanItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_target_id")
    private ExamTarget examTarget;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id")
    private Topic topic;

    @Column(nullable = false)
    private LocalDate planDate;

    private String timeSlot; // e.g. "09:00 - 09:45"

    @Column(nullable = false)
    private String title;

    @Builder.Default
    @Column(nullable = false)
    private String activityType = "CONCEPT_STUDY"; // FLASHCARD_REVIEW, PRACTICE_QUIZ, CONCEPT_STUDY, MISTAKE_CORRECTION, MOCK_EXAM

    @Builder.Default
    private Integer estimatedMinutes = 45;

    @Builder.Default
    @Column(nullable = false)
    private String priority = "MEDIUM"; // HIGH, MEDIUM, LOW

    @Builder.Default
    @Column(nullable = false)
    private Boolean completed = false;

    private String actionRoute; // e.g. "/flashcards", "/quiz", "/mistakes", "/notes", "/timer"

    @Column(columnDefinition = "TEXT")
    private String aiReasoning;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
