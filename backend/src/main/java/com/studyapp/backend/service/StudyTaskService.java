package com.studyapp.backend.service;

import com.studyapp.backend.dto.StudyTaskDto;
import com.studyapp.backend.exception.ResourceNotFoundException;
import com.studyapp.backend.model.*;
import com.studyapp.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudyTaskService {

    private final StudyTaskRepository studyTaskRepository;
    private final SubjectRepository subjectRepository;
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional
    public StudyTaskDto.TaskResponse createTask(StudyTaskDto.CreateTaskRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);

        Subject subject = null;
        if (request.getSubjectId() != null) {
            subject = subjectRepository.findByIdAndUserId(request.getSubjectId(), user.getId()).orElse(null);
        }

        Topic topic = null;
        if (request.getTopicId() != null) {
            topic = topicRepository.findByIdAndUnitSubjectUserId(request.getTopicId(), user.getId()).orElse(null);
        }

        StudyTask task = StudyTask.builder()
                .user(user)
                .subject(subject)
                .topic(topic)
                .title(request.getTitle().trim())
                .dueDate(request.getDueDate())
                .priority(request.getPriority() != null ? request.getPriority() : "MEDIUM")
                .status("TODO")
                .estimatedMinutes(request.getEstimatedMinutes() != null ? request.getEstimatedMinutes() : 30)
                .build();

        StudyTask saved = studyTaskRepository.save(task);
        log.info("Created study task '{}' for user {}", saved.getTitle(), user.getEmail());
        return mapToResponse(saved);
    }

    @Transactional
    public StudyTaskDto.TaskResponse updateTask(Long taskId, StudyTaskDto.UpdateTaskRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);
        StudyTask task = studyTaskRepository.findByIdAndUserId(taskId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found or access denied"));

        if (request.getTitle() != null) task.setTitle(request.getTitle().trim());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getStatus() != null) task.setStatus(request.getStatus());
        if (request.getEstimatedMinutes() != null) task.setEstimatedMinutes(request.getEstimatedMinutes());

        StudyTask saved = studyTaskRepository.save(task);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<StudyTaskDto.TaskResponse> getTasks(String userEmail, Long subjectId) {
        User user = getUserByEmail(userEmail);
        List<StudyTask> list = (subjectId != null)
                ? studyTaskRepository.findByUserIdAndSubjectIdOrderByDueDateAsc(user.getId(), subjectId)
                : studyTaskRepository.findByUserIdOrderByDueDateAsc(user.getId());

        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public void deleteTask(Long taskId, String userEmail) {
        User user = getUserByEmail(userEmail);
        StudyTask task = studyTaskRepository.findByIdAndUserId(taskId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found or access denied"));

        studyTaskRepository.delete(task);
        log.info("Deleted task ID: {} for user {}", taskId, user.getEmail());
    }

    private StudyTaskDto.TaskResponse mapToResponse(StudyTask t) {
        return StudyTaskDto.TaskResponse.builder()
                .id(t.getId())
                .subjectId(t.getSubject() != null ? t.getSubject().getId() : null)
                .subjectName(t.getSubject() != null ? t.getSubject().getName() : null)
                .topicId(t.getTopic() != null ? t.getTopic().getId() : null)
                .topicName(t.getTopic() != null ? t.getTopic().getName() : null)
                .title(t.getTitle())
                .dueDate(t.getDueDate())
                .priority(t.getPriority())
                .status(t.getStatus())
                .estimatedMinutes(t.getEstimatedMinutes())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
