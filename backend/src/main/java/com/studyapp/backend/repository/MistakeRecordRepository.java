package com.studyapp.backend.repository;

import com.studyapp.backend.model.MistakeRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MistakeRecordRepository extends JpaRepository<MistakeRecord, Long> {

    List<MistakeRecord> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<MistakeRecord> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status);

    List<MistakeRecord> findByUserIdAndSubjectIdOrderByCreatedAtDesc(Long userId, Long subjectId);

    List<MistakeRecord> findByUserIdAndSubjectIdAndStatusOrderByCreatedAtDesc(Long userId, Long subjectId, String status);

    Optional<MistakeRecord> findByIdAndUserId(Long id, Long userId);

    Optional<MistakeRecord> findByUserIdAndQuestionId(Long userId, Long questionId);

    long countByUserId(Long userId);

    long countByUserIdAndStatus(Long userId, String status);

    @Query("SELECT m.mistakeCategory, COUNT(m) FROM MistakeRecord m WHERE m.user.id = :userId GROUP BY m.mistakeCategory")
    List<Object[]> countGroupedByCategory(@Param("userId") Long userId);
}
