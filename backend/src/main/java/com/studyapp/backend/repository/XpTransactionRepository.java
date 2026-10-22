package com.studyapp.backend.repository;

import com.studyapp.backend.model.XpTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface XpTransactionRepository extends JpaRepository<XpTransaction, Long> {

    boolean existsByUserIdAndActivityTypeAndSourceId(Long userId, String activityType, String sourceId);

    List<XpTransaction> findTop20ByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT t.activityDate, COUNT(t), SUM(t.xpAmount) FROM XpTransaction t " +
           "WHERE t.user.id = :userId AND t.activityDate >= :startDate " +
           "GROUP BY t.activityDate ORDER BY t.activityDate ASC")
    List<Object[]> getActivityHeatmap(@Param("userId") Long userId, @Param("startDate") LocalDate startDate);

    @Query("SELECT COALESCE(SUM(t.xpAmount), 0) FROM XpTransaction t WHERE t.user.id = :userId AND t.activityDate = :date AND t.activityType = :type")
    Integer getDailyXpForType(@Param("userId") Long userId, @Param("date") LocalDate date, @Param("type") String type);
}
