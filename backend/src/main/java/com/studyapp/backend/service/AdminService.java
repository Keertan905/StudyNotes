package com.studyapp.backend.service;

import com.studyapp.backend.dto.AdminDto;
import com.studyapp.backend.exception.BadRequestException;
import com.studyapp.backend.exception.ResourceNotFoundException;
import com.studyapp.backend.model.User;
import com.studyapp.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminService {

    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final StudyDocumentRepository studyDocumentRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final MindMapRepository mindMapRepository;
    private final FlashcardRepository flashcardRepository;

    @Value("${app.ai.provider:groq}")
    private String aiProvider;

    @Transactional(readOnly = true)
    public AdminDto.SystemStatsResponse getSystemStats() {
        long totalUsers = userRepository.count();
        long totalStudents = userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.STUDENT)
                .count();
        long totalAdmins = totalUsers - totalStudents;

        return AdminDto.SystemStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalStudents(totalStudents)
                .totalAdmins(totalAdmins)
                .totalSubjects(subjectRepository.count())
                .totalDocuments(studyDocumentRepository.count())
                .totalQuizzes(quizAttemptRepository.count())
                .totalMindMaps(mindMapRepository.count())
                .totalFlashcards(flashcardRepository.count())
                .systemStatus("HEALTHY - ALL SERVICES OPERATIONAL")
                .apiProvider(aiProvider.toUpperCase())
                .build();
    }

    @Transactional(readOnly = true)
    public AdminDto.UserListResponse getUsers(String search) {
        List<User> users = userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));

        if (search != null && !search.isBlank()) {
            String lower = search.toLowerCase().trim();
            users = users.stream()
                    .filter(u -> (u.getName() != null && u.getName().toLowerCase().contains(lower)) ||
                                 (u.getEmail() != null && u.getEmail().toLowerCase().contains(lower)))
                    .collect(Collectors.toList());
        }

        List<AdminDto.UserSummary> dtoList = users.stream()
                .map(u -> AdminDto.UserSummary.builder()
                        .id(u.getId())
                        .name(u.getName())
                        .email(u.getEmail())
                        .role(u.getRole())
                        .college(u.getCollege())
                        .branch(u.getBranch())
                        .semester(u.getSemester())
                        .enabled(u.isEnabled())
                        .createdAt(u.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return AdminDto.UserListResponse.builder()
                .users(dtoList)
                .totalCount(dtoList.size())
                .build();
    }

    @Transactional
    public AdminDto.UserSummary updateUserStatus(Long userId, boolean enabled, String currentAdminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Prevent self-disable
        if (user.getEmail().equalsIgnoreCase(currentAdminEmail) && !enabled) {
            throw new BadRequestException("Security rule: You cannot disable your own administrator account.");
        }

        user.setEnabled(enabled);
        User saved = userRepository.save(user);
        log.info("Admin {} changed enabled status of user {} to {}", currentAdminEmail, user.getEmail(), enabled);

        return AdminDto.UserSummary.builder()
                .id(saved.getId())
                .name(saved.getName())
                .email(saved.getEmail())
                .role(saved.getRole())
                .college(saved.getCollege())
                .branch(saved.getBranch())
                .semester(saved.getSemester())
                .enabled(saved.isEnabled())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Transactional
    public AdminDto.UserSummary updateUserRole(Long userId, User.Role role, String currentAdminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getEmail().equalsIgnoreCase(currentAdminEmail) && role != User.Role.ADMIN) {
            throw new BadRequestException("Security rule: You cannot demote your own administrator account.");
        }

        user.setRole(role);
        User saved = userRepository.save(user);
        log.info("Admin {} changed role of user {} to {}", currentAdminEmail, user.getEmail(), role);

        return AdminDto.UserSummary.builder()
                .id(saved.getId())
                .name(saved.getName())
                .email(saved.getEmail())
                .role(saved.getRole())
                .college(saved.getCollege())
                .branch(saved.getBranch())
                .semester(saved.getSemester())
                .enabled(saved.isEnabled())
                .createdAt(saved.getCreatedAt())
                .build();
    }
}
