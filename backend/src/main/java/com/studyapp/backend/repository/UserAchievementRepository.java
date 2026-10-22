package com.studyapp.backend.repository;

import com.studyapp.backend.model.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, Long> {

    List<UserAchievement> findByUserIdOrderByUnlockedAtDesc(Long userId);

    boolean existsByUserIdAndBadgeKey(Long userId, String badgeKey);

    Optional<UserAchievement> findByUserIdAndBadgeKey(Long userId, String badgeKey);

    long countByUserId(Long userId);
}
