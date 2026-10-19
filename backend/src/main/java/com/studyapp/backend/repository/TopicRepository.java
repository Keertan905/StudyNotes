package com.studyapp.backend.repository;

import com.studyapp.backend.model.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TopicRepository extends JpaRepository<Topic, Long> {
    List<Topic> findByUnitIdOrderByIdAsc(Long unitId);
    Optional<Topic> findByIdAndUnitSubjectUserId(Long id, Long userId);
}
