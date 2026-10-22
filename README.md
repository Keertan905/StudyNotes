# StudyApp — AI-Powered Personalized Study Platform

An intelligent, full-stack learning platform designed to turn syllabus topics into revision notes, generate diagnostic quizzes, detect knowledge gaps, stream curated video lectures, and guide exam preparation.

---

## 📁 Project Architecture

```
studyapp/
├── backend/               # Spring Boot 4 + Java 17 + Spring Security 6 + JPA + MySQL
│   ├── src/main/java/     # Application source (controllers, services, repositories, models, security, AI)
│   ├── src/main/resources/# application.properties, database configuration
│   ├── src/test/java/     # Automated unit & integration test suites (34/34 passing)
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

## 🗺️ Implementation Phases & Roadmap

- ✅ **Phase 1: Foundation, Database, Authentication & UI Shell**
  - ✅ Workspace inspection, Spring Boot 4 + React 19 + MySQL verification
  - ✅ JWT Authentication & BCrypt Password Hashing (`/api/auth/register`, `/api/auth/login`, `/api/auth/forgot-password`, `/api/auth/reset-password`)
  - ✅ Complete Landing Page (`/`) with Hero, Feature Grid, Live Preview, How It Works, Student Benefits, Interactive FAQ, and Modals
  - ✅ Student Onboarding Flow (`/onboarding`) collecting degree, department, semester, target subjects, exam dates, daily hours, and AI style
  - ✅ Authenticated Application Shell (`AppLayout`) with responsive sidebar drawer, dynamic breadcrumbs, notification popover, profile dropdown, and **desktop collapsible sidebar toggle** (saved in localStorage)
- ✅ **Phase 2: Subject & Syllabus Management, AI Provider Integration, AI Notes Generator, and AI Tutor**
  - ✅ Database entities & repositories: `Subject`, `Unit`, `Topic`, `Note`, `Conversation`, `ChatMessage`
  - ✅ Modular server-side `AiProvider` interface with `OpenAiCompatibleProvider` & educational offline fallback
  - ✅ Syllabus structure extraction engine using Apache PDFBox for PDF documents & formatted text
  - ✅ Full Subject & Syllabus Management page (`/subjects`) with unit/topic tracking & completion progress
  - ✅ AI Notes Generator page (`/notes`) with 10-section structured output, parameters, and saved library
  - ✅ AI Academic Tutor page (`/tutor`) with conversation history, multi-turn context, and suggested follow-up chips
- ✅ **Phase 3: Question Generation, Quizzes, Exam Attempts, Scoring, and History**
  - ✅ Database entities & repositories: `Quiz`, `Question`, `QuizAttempt`, `UserAnswer` with MySQL persistence
  - ✅ AI Question Generator with difficulty (Easy, Medium, Hard), count, question types (MCQ, True/False, Short Answer), and fallback
  - ✅ Full-featured Exam Taking Environment with countdown timer, question palette, flag for review, and answer selection
  - ✅ Auto-evaluation & rubric-based grading engine with pass/fail benchmarks and topic-wise diagnostic accuracy
  - ✅ Results & Deep Review screen with question-by-question explanations, student vs. correct answers, and retakes
  - ✅ Interactive Quiz Hub (`/quiz`) with summary analytics cards, available quizzes bank, and attempt history table
- ✅ **Phase 4: Flashcards, Revision Scheduling (Spaced Repetition), Study Timer, and Tasks**
  - ✅ Database entities & repositories: `Flashcard`, `FlashcardReview`, `StudySession`, `StudyTask` with MySQL persistence
  - ✅ AI Flashcard Generator with high-yield active recall prompt, difficulty scaling, topic tags, and robust educational fallback
  - ✅ SM-2 Spaced Repetition Scheduling algorithm (intervals, ease factors, repetition counts, and rating evaluation: Again, Hard, Good, Easy)
  - ✅ Interactive Flashcard Review environment (`/flashcards`) with 3D flip card, keyboard shortcuts (Space, 1-4), hints, and progress tracking
  - ✅ Flashcard Deck Manager with subject filtering, search, deck mastery analytics, and manual flashcard creation modal
  - ✅ Customizable Focus & Pomodoro Timer (`/timer`) with animated SVG progress ring, presets (Focus, Breaks, Custom), and audio/visual alerts
  - ✅ Session Task Management & Productivity Tracker with quick task additions, completion checkboxes, and study streak statistics
- ✅ **Phase 5: Knowledge Gap Detector, Mistake Intelligence Engine, and Adaptive Recommendations**
  - ✅ Database entities & repositories: `MistakeRecord` with category classification, root-cause diagnosis, and retry tracking
  - ✅ Knowledge Gap Detector algorithm computing per-topic accuracy, mastery levels (Weak, Moderate, Strong), and memory decay risks (>7 days)
  - ✅ Mistake Intelligence Engine (`/mistakes`) with AI misconception root cause, actionable exam rules, and direct inline re-attempt drawer
  - ✅ Adaptive Study Recommendations engine (`/knowledge-gaps`) prioritizing weak topics, overdue SM-2 reviews, and unmastered errors with 1-click launch actions
- ✅ **Phase 6: Exam Countdown Study Planner, Readiness Score, and Progress Dashboard**
  - ✅ Database entities & repositories: `ExamTarget` (exam titles, target scores, countdown timers) and `StudyPlanItem` (daily timetable scheduling) with MySQL persistence
  - ✅ AI Adaptive Study Timetable Generator balancing target exam dates, diagnostic gaps (<60% accuracy), unresolved mistakes, and SM-2 flashcard reviews
  - ✅ Exam Countdown & Timetable Hub (`/planner`) with real-time day/hour countdown tickers, color themes, daily study progress tracker, and 1-click launch shortcuts
  - ✅ Multi-factor Exam Readiness Score Engine calculating 5 weighted dimensions: Syllabus Coverage (25%), Quiz Diagnostics (30%), SM-2 Retention (20%), Mistake Resolution (15%), Consistency & Streak (10%)
  - ✅ Comprehensive Analytics Dashboard (`/analytics`) featuring radial readiness gauge, subject diagnostic matrix, 7-day focus velocity chart, and SM-2 retention health
  - ✅ Revamped Progress Dashboard (`/dashboard`) integrating live nearest exam countdown, readiness score widget, and today's AI agenda checklist
- ✅ **Phase 7: Document-Grounded Question Answering (RAG/Doc Q&A), Citations, and Document Management**
  - ✅ Database entities & repositories: `StudyDocument` (PDF/text file metadata, page/chunk counters, AI summaries) and `DocumentChunk` (semantic chunks, section headings, page numbers) with MySQL persistence
  - ✅ PDF & text parsing engine using Apache PDFBox 3.0.3 with multi-page text extraction, paragraph-aware chunking (~750 chars with 100 char overlap), and automatic AI document summarization
  - ✅ Semantic RAG Search Engine (`RagService`) computing BM25/TF-IDF token density, heading bonuses, exact phrase boosts, and normalized grounding confidence scores
  - ✅ Grounded Academic Tutor (`TutorService`) enforcing citation injection with bracketed source markers (`[1]`, `[2]`), source attribution, and persisted citation metadata
  - ✅ Document Management Hub in `/tutor` with drag-and-drop file upload (PDF/TXT/MD), raw notes paste, document library, and semantic chunk inspector modal
  - ✅ Interactive Citations & Grounding UI with verified confidence meters, clickable inline source badges (`[1]`), expandable citation source footers, and modal citation excerpt inspectors
- ✅ **Phase 8: Notifications, Accessibility, Security Review, Testing, and Documentation**
  - ✅ Student Notifications Engine (`Notification`, `NotificationRepository`, `NotificationService`, `NotificationController`) with auto-triggers for upcoming exams ($\le 7$ days) and overdue SM-2 flashcard reviews
  - ✅ Live Notification Center in application header with unread count badges, category icons, 1-click navigation, and "Mark all read"
  - ✅ Comprehensive Study History & Activity Log (`HistoryService`, `HistoryController`, `/history`) tracking focus sessions, quizzes, flashcards, notes, and document uploads with filters and JSON data export
  - ✅ Student Profile & AI Preferences (`UserService`, `UserController`, `/settings`) with academic degree/branch configuration, AI Tutor pedagogy tuning (Socratic, Concise, Intuitive, Exam-oriented), and benchmark goal selection
  - ✅ Account Security & Credentials Management with current password verification, BCrypt encryption, and active JWT session status
  - ✅ Accessibility (a11y) & UX Polish with unique element IDs, ARIA semantics, and accessible color contrast across all components
  - ✅ Automated Unit & Integration Tests (`NotificationServiceTest`, `UserServiceTest`, `RagServiceTest`, `BackendApplicationTests`) with 100% passing test suites
- ✅ **Phase 9: AI YouTube Learning Finder**
  - ✅ Secure backend integration with Google YouTube Data API v3 (`search.list` & `videos.list`) via `YouTubeService` and `YouTubeController` (`/api/youtube/search`, `/api/youtube/status`)
  - ✅ Real-time video statistics retrieval: accurate views, like counts, durations (ISO-8601 parsed), channel attribution, and high-res thumbnails with fallback
  - ✅ Multi-factor pedagogical ranking algorithm calculating relevance keyword density, logarithmic popularity, community engagement ratios, and recency/velocity scores
  - ✅ Dynamic AI recommendation reasons generated per video (crash course, deep dive, high engagement, authority educator)
  - ✅ Sorting & filter controls: Best Match, Most Viewed, Newest, Trending Velocity, duration pills (<4m, 4–20m, >20m), difficulty levels, and languages (English, Hindi, Spanish)
  - ✅ Responsive video card hub (`/youtube-finder`) with inline embedded video player modal, external YouTube launch, link sharing, and 1-click "Ask AI Tutor" bridging
  - ✅ Robust quota & error handling with configuration banners, dismissible setup guides, and environment variable support (`YOUTUBE_API_KEY`)
  - ✅ Unit test suite (`YouTubeServiceTest`) verifying configuration checks and error fallbacks
- ✅ **Phase 10: AI Mind Map Generator (High Priority)**
  - ✅ Dynamic visual concept mapping converting any subject, unit, PDF, or custom prompt into interactive node graphs
  - ✅ Zoom, pan, node expansion/collapsing, concept relationship links, and SVG/PNG/JSON export
  - ✅ Full-featured Mind Map hub (`/mindmap`) with interactive SVG canvas, node inspector drawer, instant templates, and saved library

- ✅ **Phase 11: Voice-Based AI Tutor**
  - ✅ Hands-free voice questioning via Web Speech API speech-to-text with audio waveform visualizer
  - ✅ High-clarity speech synthesis text-to-speech for audible explanations with pitch, speed, and replay controls
  - ✅ Seamless voice interaction directly integrated into `/tutor` with inline speaker buttons and auto-speak toggle

- ✅ **Phase 12: AI Lecture Summarizer**
  - ✅ Transforms lecture transcripts, audio recordings, or video transcripts into structured notes & revision points
  - ✅ Chapter breakdown, core formula summaries, key takeaway bullets, and auto-generated active recall quiz questions
  - ✅ Dedicated Lecture Summarizer hub (`/lecture-summarizer`) with interactive recall testing, time estimations, and library saving

- ✅ **Phase 13: AI Code Explainer & Debugger**
  - ✅ Line-by-line code explanation for Java, Python, C/C++, JavaScript, SQL, and more
  - ✅ Bug detection with instant fixes, time/space complexity analysis ($O(n)$), and targeted practice problems
  - ✅ Dual-pane Code Explainer workspace (`/code-explainer`) with syntax-highlighted editor, Big-O dashboard, and snippet templates

- ✅ **Phase 14: Visual Q&A — Ask Questions from Images**
  - ✅ Upload textbook photos, handwritten problem sheets, or diagram screenshots
  - ✅ Visual OCR and multi-modal AI analysis delivering step-by-step solutions and conceptual breakdowns
  - ✅ Dedicated Visual Solver hub (`/image-qa`) with clipboard paste (`Ctrl+V`), formula highlights, and related practice questions

- ✅ **Phase 15: Multilingual Learning**
  - ✅ Explain difficult concepts in English, Hindi, Hinglish, Spanish, French, and German
  - ✅ Per-message one-click language switcher (`Translate Answer`) allowing students to switch languages dynamically for every AI explanation
  - ✅ Speech synthesis configured with native multi-accent pronunciation (`hi-IN`, `en-US`, `es-ES`, etc.)
  - ✅ Smart technical vocabulary retention keeping formulas, code, and keywords clear while teaching in the student's preferred language

- ✅ **Phase 16: Offline Study Mode**
  - ✅ Browser-native IndexedDB client storage (`StudyApp_OfflineDB`) for caching student notes, SM-2 flashcard decks, and study document chunks
  - ✅ Dedicated Offline Library Hub (`/offline`) with storage estimation meters (`navigator.storage.estimate`), cache purge controls, and item-level deletion
  - ✅ Offline study capability allowing students to read revision notes, practice interactive flashcards with SM-2 intervals, and run Pomodoro focus timer sessions with zero internet connection
  - ✅ Robust local sync queue (`syncQueue`) persisting study actions during offline sessions and automatically synchronizing when connectivity returns
  - ✅ Idempotent backend synchronization API (`/api/offline/sync`, `/api/offline/manifest`) protecting against duplicate requests, session conflicts, and network aborts
  - ✅ Network status detection (`useOfflineStatus` hook) providing real-time online/offline indicators, auto-sync triggers on reconnect, and token expiry guards
  - ✅ Clear boundary indicators explaining online-only AI capabilities (Tutor, Lecture Summarizer, Image Q&A, YouTube Finder) with zero frontend secret caching
  - ✅ Automated unit test suite (`OfflineSyncServiceTest`) verifying session sync, flashcard repetition updates, and duplicate avoidance

- ✅ **Phase 17: Gamification & Rewards**
  - ✅ Multi-tier XP points system awarding XP for focused study sessions (10 base + 1 XP/min), quiz completions (30 base + percentage score + 20 bonus for 100%), flashcard reviews (5 XP/card with daily anti-spam cap), and offline study syncs
  - ✅ Mathematical level progression curve spanning Levels 1 to 10 ("Novice Scholar" to "Grand Polymath") with real-time level progress bars and XP thresholds
  - ✅ Automated achievement & badge unlock engine (`FIRST_STEP`, `POMODORO_PRO`, `CENTURION`, `FLASH_MASTER`, `QUIZ_WHIZ`, `PERFECT_SCORE`, `STREAK_3`, `STREAK_7`, `OFFLINE_SCHOLAR`, `KNOWLEDGE_HUNTER`) with gold/frosted visual showcases
  - ✅ Persistent daily streak tracker calculating active days, gap resets, and longest historical streaks
  - ✅ Visual 60-day study consistency activity heatmap (GitHub-style calendar grid) with interactive day inspection tooltips and intensity ratings
  - ✅ Campus Leaderboard (`/rewards`) ranking top 50 scholars by total XP with student privacy controls (opt-in/opt-out toggle to mask or hide student names)
  - ✅ Audited transaction ledger (`XpTransaction`) preventing client-side reward manipulation, duplicate submissions, and repeated-request abuse
  - ✅ Interactive Dashboard widgets and live top-navigation header pill displaying total XP, level, and streak status
- ✅ **Phase 18: AI Diagram & Infographic Maker**
  - ✅ Vector-based structured diagram generation: Flowcharts, Concept Maps, System Architectures, and Revision Infographics without static bitmap image dependencies
  - ✅ Interactive SVG canvas with infinite pan, zoom ($30\% - 250\%$), reset view, node inspection drawer with exam tips, and live formula highlights
  - ✅ Multi-format export engine supporting vector SVG download, high-resolution PNG rasterization via canvas, and JSON graph payloads
  - ✅ MySQL persistence with dedicated `Diagram` JPA entity, repository, and slide-out Saved Diagrams Library drawer
  - ✅ Resilient educational fallback templates delivering rich diagrams even in offline or unconfigured AI states
  - ✅ Automated unit test suite (`DiagramServiceTest`) verifying schema parsing, geometry normalizations, and persistence

- ✅ **Phase 19: Interactive Virtual Lab & Simulations**
  - ✅ Four real, algorithmic, non-static simulations spanning Computer Science, Networking, Electronics, and Physics:
    - **CPU Scheduling Simulator**: FCFS, Round Robin (custom quantum), Shortest Job First, Priority with dynamic Gantt charts, process editing, and calculated Waiting/Turnaround time metrics
    - **Network Packet Routing Simulator**: Interactive mesh topology with Dijkstra shortest-path computation, dynamic link severing/failover, animated packet hops, and hop latency logging
    - **Digital Logic Gate Simulator**: Combinational breadboard with AND, OR, NOT, NAND, NOR, XOR gates, input toggle switches, glowing LED indicators, and live truth table auto-verifier
    - **Ohm's Law & Circuit Behavior Simulator**: DC voltage and resistance sliders, real-time current calculation ($I = V / R$), electron drift speed animation, power dissipation ($P = V \times I$), and resistor thermal overload safety limits
  - ✅ Structured experiment guides, theory breakdowns, mathematical formulas, and step-by-step experiment instructions
  - ✅ Post-experiment diagnostic assessments with instant verification and direct integration with `GamificationService` (+XP rewards)
  - ✅ Automated unit test suite (`VirtualLabServiceTest`) verifying experiment catalogs, scoring algorithms, and gamification reward triggers

- ✅ **Phase 20: Step-by-Step Problem Solver**
  - ✅ Multi-domain technical problem solver supporting Mathematics, Java/OOP, Data Structures & Algorithms, Computer Networks, and Operating Systems
  - ✅ Progressive step breakdown with formula/code notation, pedagogical "What is done", and critical "Why this step was taken" rationale
  - ✅ Multi-level explanations: formal derivation steps, intuitive "Explain Like I'm 5" real-world analogies, and common exam pitfalls & traps
  - ✅ Interactive follow-up Q&A engine allowing students to clarify specific intermediate steps or ask boundary questions
  - ✅ Sandbox safety: strictly static code and algorithmic analysis without executing arbitrary code on the main backend
  - ✅ Document grounding (RAG) using `RagService` to optionally ground solutions in student uploaded syllabus materials with citation badges
  - ✅ Automated unit test suite (`ProblemSolverServiceTest`) verifying multi-step parsing, educational fallbacks, and follow-up endpoints

- ✅ **Phase 21: Enhanced Voice AI Tutor**
  - ✅ Web Speech API Speech-to-Text with dedicated listening indicator, animated audio waveform visualizer, and on-demand microphone permission requests
  - ✅ Real-time Voice Question Review drawer: allows students to view the live spoken transcript, edit the text before sending, and submit directly to the AI Tutor
  - ✅ Text-to-Speech synthesis with granular audio playback controls: **Play**, **Pause**, **Resume**, and **Stop** buttons on individual messages and sticky global player bar
  - ✅ Playback speed controls ($0.8\times, 1.0\times, 1.25\times$) and automatic multi-accent matching for translated explanations
  - ✅ Graceful non-blocking text-only fallback with informative banner guidance when microphone access is denied or unsupported

- ✅ **Phase 22: Offline Resilience, Session Guards & Navigation Flow**
  - ✅ **Spring Security Custom Handlers**: Configured explicit `AuthenticationEntryPoint` returning HTTP 401 Unauthorized for expired or missing tokens, preventing silent 403 authorization locks.
  - ✅ **Auto-Expiring Session Interceptor**: Frontend Axios interceptor detects expired or invalid sessions, purges stale credentials, and smoothly redirects students to `/login?expired=true`.
  - ✅ **Universal Offline Fallbacks**:
    - **Flashcards** (`/flashcards`): Automatic IndexedDB caching, offline SM-2 reviews, queue persistence, and background sync without blocking error toasts.
    - **Study Timer** (`/timer`): Isolated promise error handling ensuring Pomodoro timers, statistics, and task lists always initialize smoothly.
    - **AI Notes** (`/notes`): IndexedDB persistence and instant offline fallback for revision notes.
  - ✅ **Streamlined Navigation Layout**: Left sidebar reorganized to prioritize immediate student workflows: **Dashboard** $\rightarrow$ **My Subjects** $\rightarrow$ **AI Tutor** $\rightarrow$ **Video Learning**.




