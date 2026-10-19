package com.studyapp.backend.repository;

import com.studyapp.backend.model.StudyDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudyDocumentRepository extends JpaRepository<StudyDocument, Long> {

    List<StudyDocument> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<StudyDocument> findByUserIdAndSubjectIdOrderByCreatedAtDesc(Long userId, Long subjectId);

    Optional<StudyDocument> findByIdAndUserId(Long id, Long userId);

    long countByUserId(Long userId);
}
