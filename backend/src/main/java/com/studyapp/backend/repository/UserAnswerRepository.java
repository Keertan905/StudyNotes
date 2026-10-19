package com.studyapp.backend.repository;

import com.studyapp.backend.model.UserAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserAnswerRepository extends JpaRepository<UserAnswer, Long> {
    List<UserAnswer> findByQuizAttemptIdOrderByIdAsc(Long quizAttemptId);
}
