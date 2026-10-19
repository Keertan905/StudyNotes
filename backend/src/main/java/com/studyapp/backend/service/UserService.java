package com.studyapp.backend.service;

import com.studyapp.backend.dto.UserDto;
import com.studyapp.backend.exception.BadRequestException;
import com.studyapp.backend.exception.ResourceNotFoundException;
import com.studyapp.backend.model.User;
import com.studyapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional(readOnly = true)
    public UserDto.ProfileResponse getProfile(String email) {
        User user = getUserByEmail(email);
        return mapToProfileResponse(user);
    }

    @Transactional
    public UserDto.ProfileResponse updateProfile(String email, UserDto.UpdateProfileRequest request) {
        User user = getUserByEmail(email);

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }
        if (request.getCollege() != null) {
            user.setCollege(request.getCollege().trim());
        }
        if (request.getBranch() != null) {
            user.setBranch(request.getBranch().trim());
        }
        if (request.getSemester() != null) {
            user.setSemester(request.getSemester());
        }

        User saved = userRepository.save(user);
        return mapToProfileResponse(saved);
    }

    @Transactional
    public void changePassword(String email, UserDto.ChangePasswordRequest request) {
        User user = getUserByEmail(email);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password does not match");
        }

        if (request.getNewPassword().length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private UserDto.ProfileResponse mapToProfileResponse(User u) {
        return UserDto.ProfileResponse.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .role(u.getRole() != null ? u.getRole().name() : "STUDENT")
                .college(u.getCollege())
                .branch(u.getBranch())
                .semester(u.getSemester())
                .createdAt(u.getCreatedAt())
                .build();
    }
}
