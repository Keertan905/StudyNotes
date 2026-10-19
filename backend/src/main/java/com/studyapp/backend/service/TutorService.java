package com.studyapp.backend.service;

import com.studyapp.backend.ai.AiProvider;
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

        // Build AI prompt with recent conversation history
        List<ChatMessage> history = chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());

        String subjectContext = conversation.getSubject() != null
                ? "Course Subject: " + conversation.getSubject().getName()
                : "General Academic Engineering Studies";

        String systemPrompt = "You are StudyApp's Intelligent Academic Tutor. "
                + "Context: " + subjectContext + ".\n"
                + "Student level: " + (request.getAcademicLevel() != null ? request.getAcademicLevel() : "College Undergrad") + ".\n"
                + "Response style: " + (request.getExplanationStyle() != null ? request.getExplanationStyle() : "Exam-Oriented & Step-by-Step with Intuitive Analogies") + ".\n"
                + "Provide clear, technically rigorous, pedagogical explanations. Cite key principles, step-by-step reasoning, and formula derivations where applicable. "
                + "At the end of your answer, provide 3 short, relevant follow-up questions prefixed with '💡 Suggested Next Questions:'.";

        StringBuilder conversationContext = new StringBuilder();
        // Take up to last 8 messages for context
        int start = Math.max(0, history.size() - 8);
        for (int i = start; i < history.size(); i++) {
            ChatMessage m = history.get(i);
            conversationContext.append(m.getRole().name()).append(": ").append(m.getContent()).append("\n\n");
        }

        String aiResponseText = aiProvider.generate(systemPrompt, conversationContext.toString());

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
                    "Can you give a real-world example of this concept?",
                    "What common exam mistakes do students make on this topic?",
                    "How is this evaluated in semester examinations?"
            ));
        }

        // Save Assistant message
        ChatMessage assistantMsg = ChatMessage.builder()
                .conversation(conversation)
                .role(ChatMessage.Role.ASSISTANT)
                .content(aiResponseText)
                .build();
        chatMessageRepository.save(assistantMsg);

        // Update conversation timestamp
        conversationRepository.save(conversation);

        return TutorDto.ChatResponse.builder()
                .userMessage(mapToMessageResponse(userMsg))
                .assistantMessage(mapToMessageResponse(assistantMsg))
                .suggestedFollowUps(suggestedFollowUps)
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
        return TutorDto.MessageResponse.builder()
                .id(message.getId())
                .role(message.getRole().name())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
