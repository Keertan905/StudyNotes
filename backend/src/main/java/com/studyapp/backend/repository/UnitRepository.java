package com.studyapp.backend.repository;

import com.studyapp.backend.model.Unit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UnitRepository extends JpaRepository<Unit, Long> {
    List<Unit> findBySubjectIdOrderByUnitNumberAsc(Long subjectId);
    Optional<Unit> findByIdAndSubjectUserId(Long id, Long userId);
}
