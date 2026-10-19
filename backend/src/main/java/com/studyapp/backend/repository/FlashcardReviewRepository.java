package com.studyapp.backend.repository;

import com.studyapp.backend.model.FlashcardReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlashcardReviewRepository extends JpaRepository<FlashcardReview, Long> {
    List<FlashcardReview> findByUserIdOrderByReviewedAtDesc(Long userId);
    List<FlashcardReview> findByFlashcardIdOrderByReviewedAtDesc(Long flashcardId);
    long countByUserId(Long userId);
}
