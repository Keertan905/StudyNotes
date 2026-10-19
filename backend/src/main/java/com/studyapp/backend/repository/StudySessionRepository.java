package com.studyapp.backend.repository;

import com.studyapp.backend.model.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StudySessionRepository extends JpaRepository<StudySession, Long> {
    List<StudySession> findByUserIdOrderByStartTimeDesc(Long userId);

    @Query("SELECT COALESCE(SUM(s.actualDurationMinutes), 0) FROM StudySession s WHERE s.user.id = :userId AND s.startTime >= :since")
    Integer getTotalMinutesStudiedSince(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(s) FROM StudySession s WHERE s.user.id = :userId AND s.completed = true")
    long countCompletedSessionsByUserId(@Param("userId") Long userId);
}
