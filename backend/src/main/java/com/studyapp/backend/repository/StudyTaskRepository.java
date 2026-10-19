package com.studyapp.backend.repository;

import com.studyapp.backend.model.StudyTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudyTaskRepository extends JpaRepository<StudyTask, Long> {
    List<StudyTask> findByUserIdOrderByDueDateAsc(Long userId);
    List<StudyTask> findByUserIdAndSubjectIdOrderByDueDateAsc(Long userId, Long subjectId);
    Optional<StudyTask> findByIdAndUserId(Long id, Long userId);
    long countByUserId(Long userId);
}
