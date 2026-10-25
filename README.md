# StudyApp — AI-Powered Personalized Study Platform

An intelligent, full-stack learning platform designed to turn syllabus topics into revision notes, generate diagnostic quizzes, stream curated video lectures, solve problems step-by-step, run interactive virtual lab simulations, generate vector diagrams, and guide exam preparation with a ChatGPT-style AI Tutor.

---

## 📁 Project Architecture

```
studyapp/
├── backend/               # Spring Boot 4 + Java 17 + Spring Security 6 + JPA + MySQL
│   ├── src/main/java/     # Application source (controllers, services, repositories, models, security, AI)
│   ├── src/main/resources/# application.properties, database configuration
│   ├── src/test/java/     # Automated unit & integration test suites
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

### 1. Groq Cloud (AI Tutor, Notes Generator, Quizzes, Diagrams & Problem Solver)
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
app.youtube.api-key=${GOOGLE_API_KEY:${YOUTUBE_API_KEY:}}
app.youtube.max-results=20
app.youtube.timeout-seconds=15
```
*(Supports `GOOGLE_API_KEY` or `YOUTUBE_API_KEY` system environment variable. Get a key from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and enable "YouTube Data API v3").*

---

## 🚀 Active Core Features & Modules

- 🤖 **ChatGPT-Style AI Academic Tutor (`/tutor`)**:
  - Clean OpenAI ChatGPT aesthetic with deep indigo & slate theme.
  - Left-hand minimization bar with AI Tutor icon, New Chat action, and History/Recents conversation drawer.
  - Sticky floating bottom input dock with integrated multi-modal **📷 Image / Clipboard Paste (`Ctrl+V`)** problem solving.
  - Interactive speech-to-text voice questioning, text-to-speech audio explanations, and instant multi-language translation.
- 📝 **AI Notes Generator (`/notes`)**:
  - High-yield, 10-section structured notes customized directly from syllabus topics or uploaded document excerpts.
- ❓ **Quiz & Exam Taking Environment (`/quiz`)**:
  - Dynamic AI question generator (MCQs, True/False, Short Answer) with timer, question palette, and instant diagnostic grading.
- 🎨 **AI Diagram & Infographic Maker (`/diagrams`)**:
  - Vector SVG diagrams: Flowcharts, System Architectures, and Revision Infographics with zoom/pan and SVG/PNG/JSON export.
- 🧪 **Interactive Virtual Lab & Simulations (`/virtual-lab`)**:
  - Algorithmic simulations for CPU Scheduling, Network Routing (Dijkstra), Digital Logic Gates, and Ohm's Law circuits.
- 💡 **Step-by-Step Problem Solver (`/problem-solver`)**:
  - Deep mathematical, algorithmic, and engineering breakdowns with "What is done" and "Why this step was taken" explanations.
- 🎥 **Video Learning Finder (`/youtube-finder`)**:
  - Academic lecture retrieval using Google YouTube Data API v3 with pedagogical relevance ranking.
- ⏱️ **Study Timer & Productivity Tracker (`/timer`)**:
  - Centered circular Pomodoro focus countdown with session task tracking and reflection notes.
- 🏆 **Gamification & Rewards (`/rewards`)**:
  - Level progression, XP accumulation, daily study streaks, study heatmap, and campus leaderboard.
- 💾 **Offline Study Library (`/offline`)**:
  - IndexedDB local storage (`StudyApp_OfflineDB`) for offline note reviews and study sessions with background sync.

---

## 🗺️ Implementation History & Evolution

- ✅ **Phase 1: Foundation, Database, Authentication & UI Shell**
  - Spring Boot 4 + React 19 + MySQL foundation.
  - JWT Authentication, BCrypt password hashing, and user registration/login.
  - Responsive AppLayout with collapsible desktop sidebar.
- ✅ **Phase 2: Subject & Syllabus Management, Notes Generator & AI Tutor**
  - Syllabus structure extraction engine using Apache PDFBox for PDF documents.
  - Subject, Unit, and Topic hierarchical syllabus tracking.
  - AI Notes Generator with 10-section structured output.
- ✅ **Phase 3: Question Generation, Quizzes & Exam Attempts**
  - AI Question Generator (MCQs, True/False, Short Answers).
  - Diagnostic exam environment with instant grading and topic accuracy breakdown.
- ✅ **Phase 4: Document Grounding (RAG), Speech & Video Learning**
  - Apache PDFBox document chunking and BM25/TF-IDF semantic search.
  - Google YouTube Data API v3 integration with pedagogical ranking.
  - Web Speech API integration for hands-free voice questioning and speech synthesis.
- ✅ **Phase 5: Interactive Simulations, Diagrams & Problem Solver**
  - Vector diagram generator (SVG flowcharts, architectures, infographics).
  - Virtual lab simulations (CPU scheduling, packet routing, logic gates, Ohm's law).
  - Step-by-step problem solver for engineering and computer science.
- ✅ **Phase 6: Offline Library & Gamification System**
  - Browser-native IndexedDB offline persistence and idempotent background sync.
  - XP transaction ledger, achievement badges, 60-day study heatmap, and campus leaderboard.
- ✅ **Phase 7: UI Modernization & Architecture Streamlining**
  - **ChatGPT Tutor Redesign**: Redesigned AI Tutor layout featuring a left-side minimization rail and floating input dock.
  - **Integrated Visual Problem Solver**: Merged image solving directly into the AI Tutor, removing duplicate pages.
  - **Clean Full-Width Diagram Maker**: Removed side inspectors and fixed API base path proxy resolution.
  - **Feature Deprecation & Code Pruning**: Fully deleted deprecated legacy features (*Readiness Score & Progress Analytics*, *Exam Countdown & Study Planner*, *Mistake Notebook & AI Root Cause*, *Knowledge Gap Detector*, and *Flashcards & Spaced Repetition*) across frontend routes, pages, client services, backend controllers, and DTOs.
