package com.studyapp.backend.repository;

import com.studyapp.backend.model.MindMap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MindMapRepository extends JpaRepository<MindMap, Long> {
    List<MindMap> findByUserEmailOrderByCreatedAtDesc(String email);
    List<MindMap> findByUserEmailAndSubjectIdOrderByCreatedAtDesc(String email, Long subjectId);
}
