package com.studyapp.backend.repository;

import com.studyapp.backend.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByUserIdOrderByUpdatedAtDesc(Long userId);
    List<Note> findByUserIdAndSubjectIdOrderByUpdatedAtDesc(Long userId, Long subjectId);
    Optional<Note> findByIdAndUserId(Long id, Long userId);
    long countByUserId(Long userId);
}
