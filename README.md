<<<<<<< HEAD
# StudyApp — AI-Powered Personalized Study Platform

An intelligent, full-stack learning platform designed to turn syllabus topics into revision notes, generate diagnostic quizzes, detect knowledge gaps, and guide exam preparation.

---

## 📁 Project Architecture

```
studyapp/
├── backend/               # Spring Boot 4 + Java 17 + Spring Security 6 + JPA
│   ├── src/main/java/     # Application source (controller, service, repository, model, security)
│   ├── src/main/resources/# application.properties, database configuration
│   └── pom.xml            # Maven dependencies (JPA, MySQL, JJWT, PDFBox, Swagger/OpenAPI)
│
└── frontend/              # React 19 + TypeScript + Vite + Tailwind CSS
    ├── src/               # React components, pages, hooks, services, context
    ├── package.json       # Dependencies (React Router, Axios, Zustand, Recharts, Lucide)
    └── vite.config.ts     # Vite configuration with API proxy to port 8080
```

---

## ⚡ Quick Start

### 1. Database Setup
* Ensure MySQL is running on port `3306`.
* Default credentials configured in `backend/src/main/resources/application.properties`:
  * Database: `study_app`
  * Username: `root`
  * Password: `Keertan@SQL05`

### 2. Run Backend
```bash
cd backend
./mvnw spring-boot:run
```
* **API Server:** `http://localhost:8080`
* **Swagger UI Documentation:** `http://localhost:8080/swagger-ui/index.html`

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
* **Application URL:** `http://localhost:5173`

---

## 🗺️ Implementation Phases & Roadmap

- [x] **Phase 1: Foundation, Database, Authentication & UI Shell**
  - [x] Workspace inspection, Spring Boot 4 + React 19 + MySQL verification
  - [x] JWT Authentication & BCrypt Password Hashing (`/api/auth/register`, `/api/auth/login`, `/api/auth/forgot-password`, `/api/auth/reset-password`)
  - [x] Complete Landing Page (`/`) with Hero, Feature Grid, Live Preview, How It Works, Student Benefits, Interactive FAQ, and Modals
  - [x] Student Onboarding Flow (`/onboarding`) collecting degree, department, semester, target subjects, exam dates, daily hours, and AI style
  - [x] Authenticated Application Shell (`AppLayout`) with responsive sidebar drawer, dynamic breadcrumbs, notification popover, and profile dropdown
- [x] **Phase 2: Subject & Syllabus Management, AI Provider Integration, AI Notes Generator, and AI Tutor**
  - [x] Database entities & repositories: `Subject`, `Unit`, `Topic`, `Note`, `Conversation`, `ChatMessage`
  - [x] Modular server-side `AiProvider` interface with `OpenAiCompatibleProvider` & educational offline fallback
  - [x] Syllabus structure extraction engine using Apache PDFBox for PDF documents & formatted text
  - [x] Full Subject & Syllabus Management page (`/subjects`) with unit/topic tracking & completion progress
  - [x] AI Notes Generator page (`/notes`) with 10-section structured output, parameters, and saved library
  - [x] AI Academic Tutor page (`/tutor`) with conversation history, multi-turn context, and suggested follow-up chips
- [x] **Phase 3: Question Generation, Quizzes, Exam Attempts, Scoring, and History**
  - [x] Database entities & repositories: `Quiz`, `Question`, `QuizAttempt`, `UserAnswer` with MySQL persistence
  - [x] AI Question Generator with difficulty (Easy, Medium, Hard), count, question types (MCQ, True/False, Short Answer), and fallback
  - [x] Full-featured Exam Taking Environment with countdown timer, question palette, flag for review, and answer selection
  - [x] Auto-evaluation & rubric-based grading engine with pass/fail benchmarks and topic-wise diagnostic accuracy
  - [x] Results & Deep Review screen with question-by-question explanations, student vs. correct answers, and retakes
  - [x] Interactive Quiz Hub (`/quiz`) with summary analytics cards, available quizzes bank, and attempt history table
- [x] **Phase 4: Flashcards, Revision Scheduling (Spaced Repetition), Study Timer, and Tasks**
  - [x] Database entities & repositories: `Flashcard`, `FlashcardReview`, `StudySession`, `StudyTask` with MySQL persistence
  - [x] AI Flashcard Generator with high-yield active recall prompt, difficulty scaling, topic tags, and robust educational fallback
  - [x] SM-2 Spaced Repetition Scheduling algorithm (intervals, ease factors, repetition counts, and rating evaluation: Again, Hard, Good, Easy)
  - [x] Interactive Flashcard Review environment (`/flashcards`) with 3D flip card, keyboard shortcuts (Space, 1-4), hints, and progress tracking
  - [x] Flashcard Deck Manager with subject filtering, search, deck mastery analytics, and manual flashcard creation modal
  - [x] Customizable Focus & Pomodoro Timer (`/timer`) with animated SVG progress ring, presets (Focus, Breaks, Custom), and audio/visual alerts
  - [x] Session Task Management & Productivity Tracker with quick task additions, completion checkboxes, and study streak statistics
- [ ] **Phase 5: Knowledge Gap Detector, Mistake Intelligence Engine, and Adaptive Recommendations**
- [ ] **Phase 6: Exam Countdown Study Planner, Readiness Score, and Progress Dashboard**
- [ ] **Phase 7: Document-Grounded Question Answering (RAG/Doc Q&A), Citations, and Document Management**
- [ ] **Phase 8: Notifications, Accessibility, Security Review, Testing, and Documentation**
=======
# StudyNotes
>>>>>>> b2936402df179311ab855df92be694329b74ade3
