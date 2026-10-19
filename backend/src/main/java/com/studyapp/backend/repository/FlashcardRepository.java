package com.studyapp.backend.repository;

import com.studyapp.backend.model.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {
    List<Flashcard> findByUserIdOrderByNextReviewDateAsc(Long userId);
    List<Flashcard> findByUserIdAndSubjectIdOrderByNextReviewDateAsc(Long userId, Long subjectId);
    Optional<Flashcard> findByIdAndUserId(Long id, Long userId);
    long countByUserId(Long userId);

    @Query("SELECT f FROM Flashcard f WHERE f.user.id = :userId AND f.nextReviewDate <= :currentDate ORDER BY f.nextReviewDate ASC")
    List<Flashcard> findDueForReview(@Param("userId") Long userId, @Param("currentDate") LocalDate currentDate);

    @Query("SELECT COUNT(f) FROM Flashcard f WHERE f.user.id = :userId AND f.nextReviewDate <= :currentDate")
    long countDueForReview(@Param("userId") Long userId, @Param("currentDate") LocalDate currentDate);
}
