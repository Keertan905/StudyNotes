package com.studyapp.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "document_chunks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class DocumentChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    @JsonIgnore
    private StudyDocument document;

    @Column(nullable = false)
    private Integer chunkIndex;

    @Builder.Default
    private Integer pageNumber = 1;

    private String sectionHeading;

    @Column(columnDefinition = "MEDIUMTEXT", nullable = false)
    private String chunkContent;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
