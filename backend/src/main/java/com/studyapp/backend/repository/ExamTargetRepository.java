package com.studyapp.backend.repository;

import com.studyapp.backend.model.ExamTarget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExamTargetRepository extends JpaRepository<ExamTarget, Long> {

    List<ExamTarget> findByUserIdOrderByExamDateAsc(Long userId);

    List<ExamTarget> findByUserIdAndStatusOrderByExamDateAsc(Long userId, String status);

    Optional<ExamTarget> findFirstByUserIdAndStatusAndExamDateGreaterThanEqualOrderByExamDateAsc(Long userId, String status, LocalDate date);

    long countByUserIdAndStatus(Long userId, String status);
}
