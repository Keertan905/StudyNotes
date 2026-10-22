package com.studyapp.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "xp_transactions",
    indexes = {
        @Index(name = "idx_xp_user_date", columnList = "user_id, activityDate"),
        @Index(name = "idx_xp_user_source", columnList = "user_id, activityType, sourceId")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class XpTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(nullable = false, length = 64)
    private String activityType; // STUDY_SESSION, QUIZ_COMPLETION, FLASHCARD_REVIEW, ACHIEVEMENT_UNLOCK, OFFLINE_SYNC

    @Column(length = 128)
    private String sourceId;

    @Column(nullable = false)
    private Integer xpAmount;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private LocalDate activityDate;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
