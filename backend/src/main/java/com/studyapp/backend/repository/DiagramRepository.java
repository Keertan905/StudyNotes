package com.studyapp.backend.repository;

import com.studyapp.backend.model.Diagram;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiagramRepository extends JpaRepository<Diagram, Long> {
    List<Diagram> findByUserEmailOrderByCreatedAtDesc(String email);
    List<Diagram> findByUserEmailAndSubjectIdOrderByCreatedAtDesc(String email, Long subjectId);
    List<Diagram> findByUserEmailAndDiagramTypeOrderByCreatedAtDesc(String email, String diagramType);
}
