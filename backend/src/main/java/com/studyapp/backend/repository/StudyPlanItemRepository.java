package com.studyapp.backend.repository;

import com.studyapp.backend.model.StudyPlanItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StudyPlanItemRepository extends JpaRepository<StudyPlanItem, Long> {

    List<StudyPlanItem> findByUserIdAndPlanDateOrderByCreatedAtAsc(Long userId, LocalDate planDate);

    List<StudyPlanItem> findByUserIdAndPlanDateBetweenOrderByPlanDateAscCreatedAtAsc(Long userId, LocalDate startDate, LocalDate endDate);

    long countByUserIdAndCompletedTrue(Long userId);

    long countByUserId(Long userId);

    @Modifying
    @Query("DELETE FROM StudyPlanItem s WHERE s.user.id = :userId AND s.planDate = :planDate")
    void deleteByUserIdAndPlanDate(@Param("userId") Long userId, @Param("planDate") LocalDate planDate);

    @Modifying
    @Query("DELETE FROM StudyPlanItem s WHERE s.user.id = :userId AND s.planDate >= :startDate AND s.planDate <= :endDate")
    void deleteByUserIdAndPlanDateBetween(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
