package com.studyapp.backend.ai;

public interface AiProvider {
    boolean isConfigured();
    String generate(String systemPrompt, String userPrompt);
    default String generateWithVision(String systemPrompt, String userPrompt, String mimeType, byte[] imageBytes) {
        return generate(systemPrompt, userPrompt);
    }
}
