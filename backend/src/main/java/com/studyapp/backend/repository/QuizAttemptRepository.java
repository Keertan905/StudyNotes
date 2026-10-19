package com.studyapp.backend.repository;

import com.studyapp.backend.model.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<QuizAttempt> findByQuizIdAndUserIdOrderByCreatedAtDesc(Long quizId, Long userId);
    Optional<QuizAttempt> findByIdAndUserId(Long id, Long userId);
    long countByUserId(Long userId);

    @Query("SELECT AVG(qa.percentage) FROM QuizAttempt qa WHERE qa.user.id = :userId AND qa.status = 'COMPLETED'")
    Double getAveragePercentageByUserId(@Param("userId") Long userId);
}
