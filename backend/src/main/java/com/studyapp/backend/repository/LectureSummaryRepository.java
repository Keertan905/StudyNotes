package com.studyapp.backend.repository;

import com.studyapp.backend.model.LectureSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LectureSummaryRepository extends JpaRepository<LectureSummary, Long> {
    List<LectureSummary> findByUserEmailOrderByCreatedAtDesc(String email);
    List<LectureSummary> findByUserEmailAndSubjectIdOrderByCreatedAtDesc(String email, Long subjectId);
}
