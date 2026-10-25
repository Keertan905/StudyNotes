package com.studyapp.backend.service;

import com.studyapp.backend.dto.RecommendationDto;
import com.studyapp.backend.exception.ResourceNotFoundException;
import com.studyapp.backend.model.Subject;
import com.studyapp.backend.model.User;
import com.studyapp.backend.repository.SubjectRepository;
import com.studyapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional(readOnly = true)
    public RecommendationDto.RecommendationResponse getAdaptiveRecommendations(String userEmail) {
        User user = getUserByEmail(userEmail);
        List<RecommendationDto.RecommendationItem> items = new ArrayList<>();
        List<Subject> subjects = subjectRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        if (!subjects.isEmpty()) {
            Subject primary = subjects.get(0);
            items.add(RecommendationDto.RecommendationItem.builder()
                    .id("rec-quiz-" + primary.getId())
                    .type("QUIZ_PRACTICE")
                    .priority("CRITICAL")
                    .title("Practice Exam Questions: " + primary.getName())
                    .description("Test your recall with AI-generated MCQs and exam-style diagnostic questions.")
                    .reason("Active retrieval practice is proven to boost exam retention by up to 40%.")
                    .subjectId(primary.getId())
                    .subjectName(primary.getName())
                    .actionUrl("/quiz?subjectId=" + primary.getId())
                    .buttonText("Generate Practice Quiz")
                    .build());

            items.add(RecommendationDto.RecommendationItem.builder()
                    .id("rec-notes-" + primary.getId())
                    .type("READ_NOTES")
                    .priority("RECOMMENDED")
                    .title("Review AI Revision Notes: " + primary.getName())
                    .description("Read structured high-yield revision summaries, key formulas, and exam tips.")
                    .reason("Consolidate conceptual foundations before moving on to new units.")
                    .subjectId(primary.getId())
                    .subjectName(primary.getName())
                    .actionUrl("/notes")
                    .buttonText("Open AI Notes")
                    .build());

            items.add(RecommendationDto.RecommendationItem.builder()
                    .id("rec-tutor-" + primary.getId())
                    .type("ASK_TUTOR")
                    .priority("RECOMMENDED")
                    .title("Consult AI Tutor: " + primary.getName())
                    .description("Have an interactive discussion on challenging concepts, formulas, and proofs.")
                    .reason("Get immediate step-by-step guidance whenever you encounter complex topics.")
                    .subjectId(primary.getId())
                    .subjectName(primary.getName())
                    .actionUrl("/tutor")
                    .buttonText("Chat with AI Tutor")
                    .build());
        }

        // Focus session recommendation
        items.add(RecommendationDto.RecommendationItem.builder()
                .id("rec-default-timer")
                .type("READ_NOTES")
                .priority("RECOMMENDED")
                .title("25-Minute Deep Focus Session")
                .description("Boost your daily study rhythm with a distraction-free Pomodoro concentration block.")
                .reason("Consistent daily deep focus hours boost semester exam scores by up to 34%.")
                .actionUrl("/timer")
                .buttonText("Launch Study Timer")
                .build());

        String headline = !subjects.isEmpty()
                ? "Calibrated recommendations for " + subjects.get(0).getName() + "."
                : "Welcome to StudyApp! Enroll in your subjects to unlock personalized study recommendations.";

        String advisory = "Our adaptive engine highlights high-yield study workflows based on your enrolled syllabus subjects and active study modules.";

        return RecommendationDto.RecommendationResponse.builder()
                .studentHeadline(headline)
                .aiAdvisory(advisory)
                .items(items)
                .build();
    }
}
