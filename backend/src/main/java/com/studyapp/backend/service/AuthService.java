package com.studyapp.backend.service;

import com.studyapp.backend.dto.*;
import com.studyapp.backend.exception.BadRequestException;
import com.studyapp.backend.model.PasswordResetToken;
import com.studyapp.backend.model.User;
import com.studyapp.backend.repository.PasswordResetTokenRepository;
import com.studyapp.backend.repository.UserRepository;
import com.studyapp.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Validate passwords match
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }

        // Check duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("An account with this email address already exists");
        }

        // Build and save user
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .college(request.getCollege())
                .branch(request.getBranch())
                .semester(request.getSemester())
                .role(User.Role.STUDENT)
                .build();

        userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());

        // Generate JWT
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateToken(userDetails);

        return buildAuthResponse(token, user);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail().toLowerCase().trim(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateToken(userDetails);

        log.info("User logged in: {}", user.getEmail());
        return buildAuthResponse(token, user);
    }

    @Transactional
    public void forgotPassword(String email) {
        // Always return success — do not reveal if email exists
        userRepository.findByEmail(email.toLowerCase().trim()).ifPresent(user -> {
            // Delete existing tokens for this user
            tokenRepository.deleteByUser(user);

            // Create new token valid for 1 hour
            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .token(UUID.randomUUID().toString())
                    .user(user)
                    .expiresAt(LocalDateTime.now().plusHours(1))
                    .build();

            tokenRepository.save(resetToken);

            if (mailEnabled) {
                // TODO: send email with reset link in Phase 16
                log.info("Password reset email would be sent to: {}", email);
            } else {
                log.info("Mail not configured. Reset token generated for: {} — token: {}",
                        email, resetToken.getToken());
            }
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }

        PasswordResetToken resetToken = tokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset link"));

        if (resetToken.isUsed()) {
            throw new BadRequestException("This reset link has already been used");
        }

        if (resetToken.isExpired()) {
            throw new BadRequestException("This reset link has expired. Please request a new one");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        log.info("Password reset successfully for: {}", user.getEmail());
    }

    private AuthResponse buildAuthResponse(String token, User user) {
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(AuthResponse.UserDto.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole().name())
                        .college(user.getCollege())
                        .branch(user.getBranch())
                        .semester(user.getSemester())
                        .build())
                .build();
    }
}
