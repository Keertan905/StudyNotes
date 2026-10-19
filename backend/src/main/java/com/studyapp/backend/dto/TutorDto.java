package com.studyapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class TutorDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateConversationRequest {
        private Long subjectId;
        @NotBlank(message = "Title is required")
        private String title;
        private String initialMessage;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SendMessageRequest {
        @NotBlank(message = "Message content is required")
        private String message;
        private String explanationStyle; // concise, detailed, exam-oriented
        private String academicLevel;
        private List<Long> documentIds;
        @Builder.Default
        private Boolean useDocumentGrounding = true;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConversationResponse {
        private Long id;
        private Long subjectId;
        private String subjectName;
        private String title;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private List<MessageResponse> messages;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MessageResponse {
        private Long id;
        private String role;
        private String content;
        private List<RagCitationDto> citations;
        private Double groundingConfidence;
        private Boolean isDocumentGrounded;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatResponse {
        private MessageResponse userMessage;
        private MessageResponse assistantMessage;
        private List<String> suggestedFollowUps;
        private List<RagCitationDto> citations;
        private Double groundingConfidence;
        private Boolean isDocumentGrounded;
    }
}
