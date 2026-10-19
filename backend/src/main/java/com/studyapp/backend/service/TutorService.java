package com.studyapp.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyapp.backend.ai.AiProvider;
import com.studyapp.backend.dto.RagCitationDto;
import com.studyapp.backend.dto.TutorDto;
import com.studyapp.backend.exception.ResourceNotFoundException;
import com.studyapp.backend.model.*;
import com.studyapp.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TutorService {

    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final AiProvider aiProvider;
    private final RagService ragService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional(readOnly = true)
    public List<TutorDto.ConversationResponse> getConversations(String userEmail) {
        User user = getUserByEmail(userEmail);
        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(user.getId())
                .stream()
                .map(this::mapToConversationResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TutorDto.ConversationResponse getConversationById(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Conversation conversation = conversationRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found or access denied"));

        return mapToConversationResponse(conversation);
    }

    @Transactional
    public TutorDto.ConversationResponse createConversation(TutorDto.CreateConversationRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);

        Subject subject = null;
        if (request.getSubjectId() != null) {
            subject = subjectRepository.findByIdAndUserId(request.getSubjectId(), user.getId()).orElse(null);
        }

        Conversation conversation = Conversation.builder()
                .user(user)
                .subject(subject)
                .title(request.getTitle().trim())
                .build();

        Conversation saved = conversationRepository.save(conversation);

        if (request.getInitialMessage() != null && !request.getInitialMessage().isBlank()) {
            sendMessage(saved.getId(), TutorDto.SendMessageRequest.builder()
                    .message(request.getInitialMessage())
                    .build(), userEmail);
            saved = conversationRepository.findById(saved.getId()).orElse(saved);
        }

        return mapToConversationResponse(saved);
    }

    @Transactional
    public TutorDto.ChatResponse sendMessage(Long conversationId, TutorDto.SendMessageRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);
        Conversation conversation = conversationRepository.findByIdAndUserId(conversationId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found or access denied"));

        // Save student's user message
        ChatMessage userMsg = ChatMessage.builder()
                .conversation(conversation)
                .role(ChatMessage.Role.USER)
                .content(request.getMessage().trim())
                .build();
        chatMessageRepository.save(userMsg);

        // Perform RAG retrieval if document grounding is enabled
        boolean useGrounding = !Boolean.FALSE.equals(request.getUseDocumentGrounding());
        Long subjectId = conversation.getSubject() != null ? conversation.getSubject().getId() : null;

        RagService.RetrievalResult ragResult = null;
        if (useGrounding) {
            ragResult = ragService.retrieveRelevantContext(user, request.getMessage(), request.getDocumentIds(), subjectId);
        }

        boolean isGrounded = ragResult != null && ragResult.isHasRelevantContext();
        List<RagCitationDto> citations = isGrounded ? ragResult.getCitations() : Collections.emptyList();
        double confidence = isGrounded ? ragResult.getGroundingConfidence() : 0.0;

        // Build AI prompt
        List<ChatMessage> history = chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());

        String subjectContext = conversation.getSubject() != null
                ? "Course Subject: " + conversation.getSubject().getName()
                : "General Academic Engineering Studies";

        StringBuilder systemPromptBuilder = new StringBuilder();
        systemPromptBuilder.append("You are StudyApp's Intelligent, Document-Grounded Academic Tutor.\n");
        systemPromptBuilder.append("Context: ").append(subjectContext).append(".\n");
        systemPromptBuilder.append("Student level: ").append(request.getAcademicLevel() != null ? request.getAcademicLevel() : "College Undergrad").append(".\n");
        systemPromptBuilder.append("Response style: ").append(request.getExplanationStyle() != null ? request.getExplanationStyle() : "Exam-Oriented & Step-by-Step with Intuitive Analogies").append(".\n");

        if (isGrounded) {
            systemPromptBuilder.append("\n=== CRITICAL INSTRUCTIONS FOR GROUNDED QUESTION ANSWERING ===\n");
            systemPromptBuilder.append("1. Ground your explanations directly in the verified source reference materials below.\n");
            systemPromptBuilder.append("2. Whenever stating a fact, formula, or concept from the references, cite your source using bracketed numbers [1], [2], [3] matching the numbered reference chunks.\n");
            systemPromptBuilder.append("3. If the reference documents do not address a specific part of the student's question, provide general pedagogical explanation while noting what was found in their uploaded notes.\n\n");
            systemPromptBuilder.append(ragResult.getFormattedContext()).append("\n");
        } else {
            systemPromptBuilder.append("Provide clear, technically rigorous, pedagogical explanations with key principles, step-by-step reasoning, and formula derivations.\n");
        }

        systemPromptBuilder.append("\nAt the end of your answer, provide 3 short, relevant follow-up questions prefixed with '💡 Suggested Next Questions:'.");

        StringBuilder conversationContext = new StringBuilder();
        int start = Math.max(0, history.size() - 8);
        for (int i = start; i < history.size(); i++) {
            ChatMessage m = history.get(i);
            conversationContext.append(m.getRole().name()).append(": ").append(m.getContent()).append("\n\n");
        }

        String aiResponseText = aiProvider.generate(systemPromptBuilder.toString(), conversationContext.toString());

        // Parse suggested follow-ups
        List<String> suggestedFollowUps = new ArrayList<>();
        if (aiResponseText.contains("💡 Suggested Next Questions:")) {
            String[] parts = aiResponseText.split("💡 Suggested Next Questions:");
            if (parts.length > 1) {
                String[] questions = parts[1].split("\\r?\\n");
                for (String q : questions) {
                    String clean = q.replaceFirst("^[-*0-9.]+\\s*", "").trim();
                    if (!clean.isEmpty() && clean.length() < 120) {
                        suggestedFollowUps.add(clean);
                    }
                }
            }
        }

        if (suggestedFollowUps.isEmpty()) {
            suggestedFollowUps.addAll(List.of(
                    "Can you give an intuitive exam-style example of this?",
                    "What common exam deductions do students face on this topic?",
                    "How does this formula or concept apply in real-world engineering?"
            ));
        }

        // Serialize citations for persistence
        String citationsJson = null;
        if (!citations.isEmpty()) {
            try {
                citationsJson = objectMapper.writeValueAsString(citations);
            } catch (Exception e) {
                log.warn("Failed to serialize citations: {}", e.getMessage());
            }
        }

        // Save Assistant message with RAG grounding metadata
        ChatMessage assistantMsg = ChatMessage.builder()
                .conversation(conversation)
                .role(ChatMessage.Role.ASSISTANT)
                .content(aiResponseText)
                .citationsJson(citationsJson)
                .groundingConfidence(confidence)
                .isDocumentGrounded(isGrounded)
                .build();
        chatMessageRepository.save(assistantMsg);

        // Update conversation timestamp
        conversationRepository.save(conversation);

        return TutorDto.ChatResponse.builder()
                .userMessage(mapToMessageResponse(userMsg))
                .assistantMessage(mapToMessageResponse(assistantMsg))
                .suggestedFollowUps(suggestedFollowUps)
                .citations(citations)
                .groundingConfidence(confidence)
                .isDocumentGrounded(isGrounded)
                .build();
    }

    @Transactional
    public void deleteConversation(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Conversation conversation = conversationRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found or access denied"));

        conversationRepository.delete(conversation);
    }

    private TutorDto.ConversationResponse mapToConversationResponse(Conversation conversation) {
        List<TutorDto.MessageResponse> messages = conversation.getMessages().stream()
                .map(this::mapToMessageResponse)
                .collect(Collectors.toList());

        return TutorDto.ConversationResponse.builder()
                .id(conversation.getId())
                .subjectId(conversation.getSubject() != null ? conversation.getSubject().getId() : null)
                .subjectName(conversation.getSubject() != null ? conversation.getSubject().getName() : null)
                .title(conversation.getTitle())
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .messages(messages)
                .build();
    }

    private TutorDto.MessageResponse mapToMessageResponse(ChatMessage message) {
        List<RagCitationDto> citations = null;
        if (message.getCitationsJson() != null && !message.getCitationsJson().isBlank()) {
            try {
                citations = objectMapper.readValue(message.getCitationsJson(), new TypeReference<List<RagCitationDto>>() {});
            } catch (Exception e) {
                log.warn("Failed to parse citations json: {}", e.getMessage());
            }
        }

        return TutorDto.MessageResponse.builder()
                .id(message.getId())
                .role(message.getRole().name())
                .content(message.getContent())
                .citations(citations)
                .groundingConfidence(message.getGroundingConfidence())
                .isDocumentGrounded(Boolean.TRUE.equals(message.getIsDocumentGrounded()))
                .createdAt(message.getCreatedAt())
                .build();
    }
}
