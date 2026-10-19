package com.studyapp.backend.service;

import com.studyapp.backend.dto.UserDto;
import com.studyapp.backend.model.User;
import com.studyapp.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .name("Alex Student")
                .email("alex@studyapp.com")
                .password("encodedOldPassword")
                .college("MIT")
                .branch("Computer Science")
                .semester(5)
                .build();
    }

    @Test
    void testGetProfile() {
        when(userRepository.findByEmail("alex@studyapp.com")).thenReturn(Optional.of(testUser));

        UserDto.ProfileResponse profile = userService.getProfile("alex@studyapp.com");

        assertNotNull(profile);
        assertEquals("Alex Student", profile.getName());
        assertEquals("alex@studyapp.com", profile.getEmail());
        assertEquals("MIT", profile.getCollege());
    }

    @Test
    void testUpdateProfile() {
        when(userRepository.findByEmail("alex@studyapp.com")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserDto.UpdateProfileRequest request = UserDto.UpdateProfileRequest.builder()
                .name("Alex R. Student")
                .college("Stanford")
                .branch("AI & Data Science")
                .semester(6)
                .build();

        UserDto.ProfileResponse updated = userService.updateProfile("alex@studyapp.com", request);

        assertNotNull(updated);
        assertEquals("Alex R. Student", updated.getName());
        assertEquals("Stanford", updated.getCollege());
        assertEquals(6, updated.getSemester());
    }
}
