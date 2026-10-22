package com.studyapp.backend.repository;

import com.studyapp.backend.model.UserGamification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserGamificationRepository extends JpaRepository<UserGamification, Long> {

    Optional<UserGamification> findByUserId(Long userId);

    @Query("SELECT g FROM UserGamification g JOIN FETCH g.user WHERE g.leaderboardOptIn = true ORDER BY g.totalXp DESC")
    List<UserGamification> findTop50Leaderboard();
}
