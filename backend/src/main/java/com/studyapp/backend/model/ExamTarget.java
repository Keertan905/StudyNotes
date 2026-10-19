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
@Table(name = "exam_targets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ExamTarget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private LocalDate examDate;

    @Builder.Default
    private Integer targetScore = 85;

    @Builder.Default
    @Column(nullable = false)
    private String priority = "HIGH"; // HIGH, MEDIUM, LOW

    @Builder.Default
    @Column(nullable = false)
    private String status = "UPCOMING"; // UPCOMING, COMPLETED, CANCELLED

    private String location;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Builder.Default
    private String color = "indigo"; // indigo, rose, emerald, amber, purple, sky, cyan

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
