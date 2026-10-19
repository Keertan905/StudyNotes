package com.studyapp.backend.repository;

import com.studyapp.backend.model.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {
    List<Subject> findByUserIdAndArchivedOrderByCreatedAtDesc(Long userId, boolean archived);
    List<Subject> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Subject> findByIdAndUserId(Long id, Long userId);
    boolean existsByIdAndUserId(Long id, Long userId);
    long countByUserIdAndArchived(Long userId, boolean archived);
}
