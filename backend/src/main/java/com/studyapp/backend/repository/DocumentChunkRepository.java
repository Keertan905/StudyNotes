package com.studyapp.backend.repository;

import com.studyapp.backend.model.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, Long> {

    List<DocumentChunk> findByDocumentIdOrderByChunkIndexAsc(Long documentId);

    @Query("SELECT c FROM DocumentChunk c WHERE c.document.user.id = :userId")
    List<DocumentChunk> findAllByUserId(@Param("userId") Long userId);

    @Query("SELECT c FROM DocumentChunk c WHERE c.document.user.id = :userId AND c.document.id IN :docIds")
    List<DocumentChunk> findByUserIdAndDocumentIdIn(@Param("userId") Long userId, @Param("docIds") List<Long> docIds);

    @Query("SELECT c FROM DocumentChunk c WHERE c.document.user.id = :userId AND c.document.subject.id = :subjectId")
    List<DocumentChunk> findByUserIdAndSubjectId(@Param("userId") Long userId, @Param("subjectId") Long subjectId);

    long countByDocumentId(Long documentId);
}
