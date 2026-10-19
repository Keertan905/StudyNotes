# StudyApp — AI-Powered Personalized Study Platform

An intelligent, full-stack learning platform designed to turn syllabus topics into revision notes, generate diagnostic quizzes, detect knowledge gaps, stream curated video lectures, and guide exam preparation.

---

## 📁 Project Architecture

```
studyapp/
├── backend/               # Spring Boot 4 + Java 17 + Spring Security 6 + JPA + MySQL
│   ├── src/main/java/     # Application source (controllers, services, repositories, models, security, AI)
│   ├── src/main/resources/# application.properties, database configuration
│   ├── src/test/java/     # Automated unit & integration test suites (10/10 passing)
│   └── pom.xml            # Maven dependencies (JPA, MySQL, JJWT, PDFBox, Lombok)
│
└── frontend/              # React 19 + TypeScript + Vite + Tailwind CSS
    ├── src/               # React components, pages, hooks, services, context
    ├── package.json       # Dependencies (React Router 7, Axios, Lucide, Recharts)
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
```powershell
cd d:\studyapp\backend
.\mvnw.cmd spring-boot:run
```
* **API Server:** `http://localhost:8080`

### 3. Run Frontend
```powershell
cd d:\studyapp\frontend
npm run dev
```
* **Application URL:** `http://localhost:5173`

---

## 🔑 AI & External API Configuration

### 1. Groq Cloud (AI Tutor, Notes Generator, Quizzes & Flashcards)
Configured in `backend/src/main/resources/application.properties`:
```properties
app.ai.provider=groq
app.ai.api-key=${GROQ_API_KEY:your-groq-api-key-here}
app.ai.base-url=https://api.groq.com/openai/v1
app.ai.model=openai/gpt-oss-120b
app.ai.timeout-seconds=60
app.ai.max-tokens=4096
```
*(Supports `GROQ_API_KEY` system environment variable or direct specification).*

### 2. Google YouTube Data API v3 (AI Video Learning Finder)
Configured in `backend/src/main/resources/application.properties`:
```properties
app.youtube.api-key=${YOUTUBE_API_KEY:}
app.youtube.max-results=20
app.youtube.timeout-seconds=15
```
*(Get a free key from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and enable "YouTube Data API v3").*

---

## 🗺️ Implementation Phases & Roadmap (All Phases Completed)

- [x] **Phase 1: Foundation, Database, Authentication & UI Shell**
  - [x] Workspace inspection, Spring Boot 4 + React 19 + MySQL verification
  - [x] JWT Authentication & BCrypt Password Hashing (`/api/auth/register`, `/api/auth/login`, `/api/auth/forgot-password`, `/api/auth/reset-password`)
  - [x] Complete Landing Page (`/`) with Hero, Feature Grid, Live Preview, How It Works, Student Benefits, Interactive FAQ, and Modals
  - [x] Student Onboarding Flow (`/onboarding`) collecting degree, department, semester, target subjects, exam dates, daily hours, and AI style
  - [x] Authenticated Application Shell (`AppLayout`) with responsive sidebar drawer, dynamic breadcrumbs, notification popover, profile dropdown, and **desktop collapsible sidebar toggle** (saved in localStorage)
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
- [x] **Phase 5: Knowledge Gap Detector, Mistake Intelligence Engine, and Adaptive Recommendations**
  - [x] Database entities & repositories: `MistakeRecord` with category classification, root-cause diagnosis, and retry tracking
  - [x] Knowledge Gap Detector algorithm computing per-topic accuracy, mastery levels (Weak, Moderate, Strong), and memory decay risks (>7 days)
  - [x] Mistake Intelligence Engine (`/mistakes`) with AI misconception root cause, actionable exam rules, and direct inline re-attempt drawer
  - [x] Adaptive Study Recommendations engine (`/knowledge-gaps`) prioritizing weak topics, overdue SM-2 reviews, and unmastered errors with 1-click launch actions
- [x] **Phase 6: Exam Countdown Study Planner, Readiness Score, and Progress Dashboard**
  - [x] Database entities & repositories: `ExamTarget` (exam titles, target scores, countdown timers) and `StudyPlanItem` (daily timetable scheduling) with MySQL persistence
  - [x] AI Adaptive Study Timetable Generator balancing target exam dates, diagnostic gaps (<60% accuracy), unresolved mistakes, and SM-2 flashcard reviews
  - [x] Exam Countdown & Timetable Hub (`/planner`) with real-time day/hour countdown tickers, color themes, daily study progress tracker, and 1-click launch shortcuts
  - [x] Multi-factor Exam Readiness Score Engine calculating 5 weighted dimensions: Syllabus Coverage (25%), Quiz Diagnostics (30%), SM-2 Retention (20%), Mistake Resolution (15%), Consistency & Streak (10%)
  - [x] Comprehensive Analytics Dashboard (`/analytics`) featuring radial readiness gauge, subject diagnostic matrix, 7-day focus velocity chart, and SM-2 retention health
  - [x] Revamped Progress Dashboard (`/dashboard`) integrating live nearest exam countdown, readiness score widget, and today's AI agenda checklist
- [x] **Phase 7: Document-Grounded Question Answering (RAG/Doc Q&A), Citations, and Document Management**
  - [x] Database entities & repositories: `StudyDocument` (PDF/text file metadata, page/chunk counters, AI summaries) and `DocumentChunk` (semantic chunks, section headings, page numbers) with MySQL persistence
  - [x] PDF & text parsing engine using Apache PDFBox 3.0.3 with multi-page text extraction, paragraph-aware chunking (~750 chars with 100 char overlap), and automatic AI document summarization
  - [x] Semantic RAG Search Engine (`RagService`) computing BM25/TF-IDF token density, heading bonuses, exact phrase boosts, and normalized grounding confidence scores
  - [x] Grounded Academic Tutor (`TutorService`) enforcing citation injection with bracketed source markers (`[1]`, `[2]`), source attribution, and persisted citation metadata
  - [x] Document Management Hub in `/tutor` with drag-and-drop file upload (PDF/TXT/MD), raw notes paste, document library, and semantic chunk inspector modal
  - [x] Interactive Citations & Grounding UI with verified confidence meters, clickable inline source badges (`[1]`), expandable citation source footers, and modal citation excerpt inspectors
- [x] **Phase 8: Notifications, Accessibility, Security Review, Testing, and Documentation**
  - [x] Student Notifications Engine (`Notification`, `NotificationRepository`, `NotificationService`, `NotificationController`) with auto-triggers for upcoming exams ($\le 7$ days) and overdue SM-2 flashcard reviews
  - [x] Live Notification Center in application header with unread count badges, category icons, 1-click navigation, and "Mark all read"
  - [x] Comprehensive Study History & Activity Log (`HistoryService`, `HistoryController`, `/history`) tracking focus sessions, quizzes, flashcards, notes, and document uploads with filters and JSON data export
  - [x] Student Profile & AI Preferences (`UserService`, `UserController`, `/settings`) with academic degree/branch configuration, AI Tutor pedagogy tuning (Socratic, Concise, Intuitive, Exam-oriented), and benchmark goal selection
  - [x] Account Security & Credentials Management with current password verification, BCrypt encryption, and active JWT session status
  - [x] Accessibility (a11y) & UX Polish with unique element IDs, ARIA semantics, and accessible color contrast across all components
  - [x] Automated Unit & Integration Tests (`NotificationServiceTest`, `UserServiceTest`, `RagServiceTest`, `BackendApplicationTests`) with 100% passing test suites
- [x] **Phase 9: AI YouTube Learning Finder**
  - [x] Secure backend integration with Google YouTube Data API v3 (`search.list` & `videos.list`) via `YouTubeService` and `YouTubeController` (`/api/youtube/search`, `/api/youtube/status`)
  - [x] Real-time video statistics retrieval: accurate views, like counts, durations (ISO-8601 parsed), channel attribution, and high-res thumbnails with fallback
  - [x] Multi-factor pedagogical ranking algorithm calculating relevance keyword density, logarithmic popularity, community engagement ratios, and recency/velocity scores
  - [x] Dynamic AI recommendation reasons generated per video (crash course, deep dive, high engagement, authority educator)
  - [x] Sorting & filter controls: Best Match, Most Viewed, Newest, Trending Velocity, duration pills (<4m, 4–20m, >20m), difficulty levels, and languages (English, Hindi, Spanish)
  - [x] Responsive video card hub (`/youtube-finder`) with inline embedded video player modal, external YouTube launch, link sharing, and 1-click "Ask AI Tutor" bridging
  - [x] Robust quota & error handling with configuration banners, dismissible setup guides, and environment variable support (`YOUTUBE_API_KEY`)
  - [x] Unit test suite (`YouTubeServiceTest`) verifying configuration checks and error fallbacks
