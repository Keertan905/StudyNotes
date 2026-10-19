package com.studyapp.backend.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Component
@Slf4j
public class OpenAiCompatibleProvider implements AiProvider {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.ai.api-key:}")
    private String apiKey;

    @Value("${app.ai.base-url:https://api.openai.com/v1}")
    private String baseUrl;

    @Value("${app.ai.model:gpt-4o}")
    private String model;

    @Value("${app.ai.timeout-seconds:60}")
    private int timeoutSeconds;

    @Value("${app.ai.max-tokens:4096}")
    private int maxTokens;

    public OpenAiCompatibleProvider() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    @Override
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank() && !apiKey.equalsIgnoreCase("your-api-key-here");
    }

    @Override
    public String generate(String systemPrompt, String userPrompt) {
        if (!isConfigured()) {
            log.warn("AI Provider requested but app.ai.api-key is not configured.");
            return generateOfflineFallback(systemPrompt, userPrompt);
        }

        try {
            List<Map<String, String>> messages = new ArrayList<>();
            if (systemPrompt != null && !systemPrompt.isBlank()) {
                messages.add(Map.of("role", "system", "content", systemPrompt));
            }
            messages.add(Map.of("role", "user", "content", userPrompt));

            Map<String, Object> requestBodyMap = new HashMap<>();
            requestBodyMap.put("model", model);
            requestBodyMap.put("messages", messages);
            requestBodyMap.put("temperature", 0.7);
            requestBodyMap.put("max_tokens", maxTokens);

            String requestBodyJson = objectMapper.writeValueAsString(requestBodyMap);

            String endpoint = baseUrl.endsWith("/") ? baseUrl + "chat/completions" : baseUrl + "/chat/completions";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey.trim())
                    .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode choices = root.path("choices");
                if (choices.isArray() && !choices.isEmpty()) {
                    return choices.get(0).path("message").path("content").asText();
                }
                throw new RuntimeException("Empty response choices from AI provider");
            } else {
                log.error("AI provider returned HTTP status {}: {}", response.statusCode(), response.body());
                throw new RuntimeException("AI provider returned HTTP " + response.statusCode() + ": " + response.body());
            }
        } catch (Exception e) {
            log.error("AI Generation failed: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate content: " + e.getMessage(), e);
        }
    }

    private String generateOfflineFallback(String systemPrompt, String userPrompt) {
        return "> ⚠️ **AI Provider Notice**: External AI API Key is not configured in backend environment (`app.ai.api-key`).\n\n"
                + "To enable live OpenAI, Gemini, or Groq responses, provide your API key in `application.properties` or set the `APP_AI_API_KEY` environment variable.\n\n"
                + "### Sample Structure for Your Request:\n"
                + "Your prompt has been acknowledged. In full mode, this section contains dynamically generated syllabus-grounded explanations, definitions, key components, and exam questions.";
    }
}
