package com.studyapp.backend.repository;

import com.studyapp.backend.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Quiz> findByUserIdAndSubjectIdOrderByCreatedAtDesc(Long userId, Long subjectId);
    Optional<Quiz> findByIdAndUserId(Long id, Long userId);
    long countByUserId(Long userId);
}
