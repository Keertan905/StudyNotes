package com.studyapp.backend.ai;

public interface AiProvider {
    boolean isConfigured();
    String generate(String systemPrompt, String userPrompt);
}
