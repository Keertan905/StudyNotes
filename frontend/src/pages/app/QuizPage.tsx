import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  HelpCircle,
  Sparkles,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  BarChart3,
  RotateCcw,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Flag,
  ArrowRight,
  Loader2,
  Check,
  BookOpen,
} from "lucide-react";
import {
  quizService,
  type Quiz,
  type QuestionItem,
  type StartAttemptResponse,
  type AttemptDetailResponse,
  type AttemptSummaryResponse,
  type QuizStats,
} from "../../services/quiz.service";
import { subjectService, type SubjectItem } from "../../services/subject.service";
import toast from "react-hot-toast";

type ViewMode = "hub" | "generate" | "taking" | "result";

export default function QuizPage() {
  const [searchParams] = useSearchParams();

  // Navigation / View State
  const [viewMode, setViewMode] = useState<ViewMode>("hub");
  const [activeTab, setActiveTab] = useState<"quizzes" | "history">("quizzes");

  // Data State
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [history, setHistory] = useState<AttemptSummaryResponse[]>([]);
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filter
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<number | "ALL">("ALL");

  // Generator State
  const [genSubjectId, setGenSubjectId] = useState<number | undefined>(undefined);
  const [genSubjectName, setGenSubjectName] = useState(searchParams.get("subjectName") || "");
  const [genTopic, setGenTopic] = useState(searchParams.get("topic") || "");
  const [genDifficulty, setGenDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [genCount, setGenCount] = useState<number>(5);
  const [genTimeLimit, setGenTimeLimit] = useState<number>(10);
  const [genTypes, setGenTypes] = useState<string[]>(["MCQ", "TRUE_FALSE", "SHORT_ANSWER"]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreviewQuestions, setGeneratedPreviewQuestions] = useState<QuestionItem[]>([]);
  const [genQuizTitle, setGenQuizTitle] = useState("");

  // Quiz Taking State
  const [activeAttempt, setActiveAttempt] = useState<StartAttemptResponse | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTimeMs, setStartTimeMs] = useState<number>(0);

  // Result State
  const [currentResult, setCurrentResult] = useState<AttemptDetailResponse | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Timer Effect during taking mode
  useEffect(() => {
    if (viewMode !== "taking" || timeLeftSeconds === null) return;

    if (timeLeftSeconds <= 0) {
      toast.error("Time is up! Submitting your answers automatically...");
      handleFinalSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [viewMode, timeLeftSeconds]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [quizList, subList, histList, statsData] = await Promise.all([
        quizService.getQuizzes(),
        subjectService.getSubjects(),
        quizService.getQuizHistory(),
        quizService.getQuizStats(),
      ]);
      setQuizzes(quizList);
      setSubjects(subList);
      setHistory(histList);
      setStats(statsData);

      // Check query param for direct generate
      const qSubId = searchParams.get("subjectId");
      if (qSubId) {
        const found = subList.find((s) => s.id === Number(qSubId));
        if (found) {
          setGenSubjectId(found.id);
          setGenSubjectName(found.name);
        }
      }
    } catch {
      toast.error("Failed to load quiz data");
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // GENERATOR HANDLERS
  // ==========================================
  const handleGenerateQuestions = async () => {
    if (!genTopic.trim()) {
      toast.error("Please specify a topic for question generation");
      return;
    }

    try {
      setIsGenerating(true);
      const sName = genSubjectName || (genSubjectId ? subjects.find((s) => s.id === genSubjectId)?.name : "General");
      const questions = await quizService.generateQuestions({
        subjectId: genSubjectId,
        subjectName: sName || "General",
        topic: genTopic.trim(),
        difficulty: genDifficulty,
        questionCount: genCount,
        questionTypes: genTypes,
        timeLimitMinutes: genTimeLimit > 0 ? genTimeLimit : undefined,
      });

      setGeneratedPreviewQuestions(questions);
      setGenQuizTitle(`${genTopic.trim()} — ${genDifficulty} Quiz`);
      toast.success(`Generated ${questions.length} questions! Review and save.`);
    } catch {
      toast.error("Question generation failed. Check backend configuration.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndStartQuiz = async (startImmediately: boolean) => {
    if (generatedPreviewQuestions.length === 0) {
      toast.error("No questions generated yet");
      return;
    }

    try {
      const created = await quizService.createQuiz({
        subjectId: genSubjectId,
        title: genQuizTitle || `${genTopic.trim()} Assessment`,
        description: `Covers ${genTopic.trim()} at ${genDifficulty} difficulty with ${generatedPreviewQuestions.length} questions.`,
        quizType: "PRACTICE",
        difficulty: genDifficulty,
        timeLimitMinutes: genTimeLimit > 0 ? genTimeLimit : undefined,
        passingPercentage: 60,
        questions: generatedPreviewQuestions,
      });

      toast.success("Quiz saved successfully!");
      setQuizzes((prev) => [created, ...prev]);

      if (startImmediately) {
        handleStartQuiz(created.id);
      } else {
        setViewMode("hub");
        setGeneratedPreviewQuestions([]);
      }
    } catch {
      toast.error("Failed to save quiz");
    }
  };

  // ==========================================
  // EXAM / TAKING HANDLERS
  // ==========================================
  const handleStartQuiz = async (quizId: number) => {
    try {
      setIsLoading(true);
      const attempt = await quizService.startAttempt(quizId);
      setActiveAttempt(attempt);
      setCurrentQIndex(0);
      setUserAnswers({});
      setFlaggedQuestions({});
      setStartTimeMs(Date.now());

      if (attempt.timeLimitMinutes && attempt.timeLimitMinutes > 0) {
        setTimeLeftSeconds(attempt.timeLimitMinutes * 60);
      } else {
        setTimeLeftSeconds(null);
      }

      setViewMode("taking");
      toast.success(`Started "${attempt.quizTitle}". Best of luck!`);
    } catch {
      toast.error("Failed to start quiz attempt");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionId: number, optionVal: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionVal,
    }));
  };

  const toggleFlagQuestion = (questionId: number) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleFinalSubmit = async () => {
    if (!activeAttempt) return;

    try {
      setIsSubmitting(true);
      const elapsedSeconds = Math.max(1, Math.round((Date.now() - startTimeMs) / 1000));
      const result = await quizService.submitAttempt(activeAttempt.attemptId, {
        timeSpentSeconds: elapsedSeconds,
        answers: userAnswers,
      });

      setCurrentResult(result);
      setViewMode("result");
      toast.success(`Quiz completed! Score: ${result.scoreObtained}/${result.totalMarks} (${result.percentage}%)`);
      // Refresh stats and history in background
      quizService.getQuizStats().then(setStats).catch(() => {});
      quizService.getQuizHistory().then(setHistory).catch(() => {});
    } catch {
      toast.error("Failed to submit quiz attempt");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;
    try {
      await quizService.deleteQuiz(quizId);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      toast.success("Quiz deleted");
    } catch {
      toast.error("Failed to delete quiz");
    }
  };

  const handleViewAttemptResult = async (attemptId: number) => {
    try {
      setIsLoading(true);
      const result = await quizService.getAttemptDetails(attemptId);
      setCurrentResult(result);
      setViewMode("result");
    } catch {
      toast.error("Failed to load attempt result");
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered quizzes
  const filteredQuizzes = quizzes.filter((q) => {
    if (selectedSubjectFilter === "ALL") return true;
    return q.subjectId === selectedSubjectFilter;
  });

  // Helpers
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // =========================================================================
  // RENDER: EXAM TAKING VIEW
  // =========================================================================
  if (viewMode === "taking" && activeAttempt) {
    const currentQ = activeAttempt.questions[currentQIndex];
    const totalQ = activeAttempt.questions.length;
    const answeredCount = Object.keys(userAnswers).filter((k) => !!userAnswers[Number(k)]).length;
    const progressPct = Math.round((answeredCount / totalQ) * 100);

    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col">
        {/* Top Header */}
        <header className="border-b border-slate-800 bg-slate-950/80 px-6 py-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {activeAttempt.subjectName}
            </span>
            <h1 className="text-lg font-bold truncate max-w-md">{activeAttempt.quizTitle}</h1>
          </div>

          <div className="flex items-center gap-6">
            {timeLeftSeconds !== null && (
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border font-mono text-sm font-semibold transition-colors ${
                  timeLeftSeconds <= 60
                    ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse"
                    : timeLeftSeconds <= 300
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                    : "bg-slate-800 text-slate-200 border-slate-700"
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
            )}

            <button
              onClick={() => {
                if (window.confirm(`Submit exam now? You have answered ${answeredCount} of ${totalQ} questions.`)) {
                  handleFinalSubmit();
                }
              }}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium text-sm rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Finish & Submit
                </>
              )}
            </button>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5">
          <div
            className="bg-indigo-500 h-1.5 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Exam Body */}
        <div className="flex-1 max-w-6xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Question Card (3 cols) */}
          <div className="lg:col-span-3 flex flex-col justify-between bg-slate-800/80 border border-slate-700/60 rounded-2xl p-8 backdrop-blur-sm shadow-xl">
            <div>
              {/* Question Meta */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/60">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-700 text-slate-300">
                    Question {currentQIndex + 1} of {totalQ}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                    {currentQ.questionType}
                  </span>
                  {currentQ.topicTag && (
                    <span className="text-xs text-slate-400">Topic: {currentQ.topicTag}</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-medium">{currentQ.marks} mark{currentQ.marks > 1 ? "s" : ""}</span>
                  <button
                    onClick={() => toggleFlagQuestion(currentQ.id)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border transition-colors ${
                      flaggedQuestions[currentQ.id]
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "text-slate-400 border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    {flaggedQuestions[currentQ.id] ? "Flagged" : "Flag"}
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <h2 className="text-xl font-medium text-slate-100 leading-relaxed mb-8">
                {currentQ.questionText}
              </h2>

              {/* Options or Text Area */}
              {currentQ.questionType === "SHORT_ANSWER" || currentQ.questionType === "LONG_ANSWER" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    Type your answer below:
                  </label>
                  <textarea
                    rows={6}
                    value={userAnswers[currentQ.id] || ""}
                    onChange={(e) => handleSelectOption(currentQ.id, e.target.value)}
                    placeholder="Provide key definitions, working mechanism, or bullet points..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans text-sm resize-none"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = userAnswers[currentQ.id] === opt;
                    const letter = String.fromCharCode(65 + idx);

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(currentQ.id, opt)}
                        className={`w-full text-left p-4 rounded-xl border flex items-center gap-4 transition-all ${
                          isSelected
                            ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10"
                            : "bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-700/40 hover:border-slate-600"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                            isSelected
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {letter}
                        </div>
                        <span className="text-sm font-medium leading-relaxed">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Nav */}
            <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-700/60">
              <button
                onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQIndex === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <span className="text-xs text-slate-400">
                {userAnswers[currentQ.id] ? "Answer recorded" : "Not answered yet"}
              </span>

              {currentQIndex < totalQ - 1 ? (
                <button
                  onClick={() => setCurrentQIndex((prev) => Math.min(totalQ - 1, prev + 1))}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleFinalSubmit}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Submit Exam
                </button>
              )}
            </div>
          </div>

          {/* Question Palette Sidebar (1 col) */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-sm h-fit">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center justify-between">
              <span>Question Palette</span>
              <span className="text-xs text-slate-400 font-normal">
                {answeredCount}/{totalQ} Done
              </span>
            </h3>

            <div className="grid grid-cols-5 gap-2.5 mb-6">
              {activeAttempt.questions.map((q, idx) => {
                const isCurrent = idx === currentQIndex;
                const isAnswered = !!userAnswers[q.id];
                const isFlagged = !!flaggedQuestions[q.id];

                let bgClass = "bg-slate-900 border-slate-700 text-slate-400";
                if (isAnswered) bgClass = "bg-indigo-600/30 border-indigo-500 text-indigo-200";
                if (isFlagged) bgClass = "bg-amber-500/30 border-amber-500 text-amber-200";
                if (isCurrent) bgClass += " ring-2 ring-white font-bold";

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`h-9 rounded-lg border text-xs font-medium flex items-center justify-center transition-all ${bgClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 text-xs text-slate-400 border-t border-slate-700/60 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-indigo-600/30 border border-indigo-500" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500" />
                <span>Flagged for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-slate-900 border border-slate-700" />
                <span>Unanswered ({totalQ - answeredCount})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: RESULTS & REVIEW VIEW
  // =========================================================================
  if (viewMode === "result" && currentResult) {
    const isPassed = currentResult.passed;

    return (
      <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8 animate-fade-in">
        {/* Top Action Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {currentResult.subjectName}
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-2">
              Performance Review: {currentResult.quizTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleStartQuiz(currentResult.quizId)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold transition-colors border border-indigo-200"
            >
              <RotateCcw className="w-4 h-4" />
              Retake Quiz
            </button>
            <button
              onClick={() => {
                setViewMode("hub");
                setCurrentResult(null);
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors"
            >
              Back to Quiz Hub
            </button>
          </div>
        </div>

        {/* Score Hero Card */}
        <div
          className={`p-8 rounded-3xl border shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 ${
            isPassed
              ? "bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-50 border-emerald-200"
              : "bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-slate-50 border-rose-200"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {isPassed ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  PASSED BENCHMARK
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  NEEDS REMEDIATION
                </div>
              )}
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {Math.round(currentResult.timeSpentSeconds / 60)}m {currentResult.timeSpentSeconds % 60}s taken
              </span>
            </div>

            <h2 className="text-3xl font-black text-slate-900">
              {isPassed ? "Great work! Solid grasp of concepts." : "Focus on weak areas identified below."}
            </h2>
            <p className="text-slate-600 max-w-xl text-sm leading-relaxed">{currentResult.feedback}</p>
          </div>

          {/* Score Badge */}
          <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200 min-w-44">
            <span className="text-4xl font-black tracking-tight text-slate-900">
              {currentResult.percentage}%
            </span>
            <span className="text-xs font-semibold text-slate-500 mt-1">
              {currentResult.scoreObtained} / {currentResult.totalMarks} Marks
            </span>
          </div>
        </div>

        {/* Topic-Wise Breakdown */}
        {currentResult.topicPerformance && Object.keys(currentResult.topicPerformance).length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Topic Mastery Diagnostic
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(currentResult.topicPerformance).map(([tag, scoreObj]) => {
                const statusColor =
                  scoreObj.status === "MASTERED"
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : scoreObj.status === "NEEDS_REVIEW"
                    ? "text-amber-700 bg-amber-50 border-amber-200"
                    : "text-rose-700 bg-rose-50 border-rose-200";

                return (
                  <div key={tag} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 truncate max-w-44">{tag}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                        {scoreObj.status}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between text-xs text-slate-500">
                      <span>Accuracy</span>
                      <span className="font-semibold text-slate-900">{scoreObj.percentage}%</span>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          scoreObj.status === "MASTERED"
                            ? "bg-emerald-500"
                            : scoreObj.status === "NEEDS_REVIEW"
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                        style={{ width: `${scoreObj.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed Question Review */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900">Question-by-Question Solution & Analysis</h3>

          <div className="space-y-4">
            {currentResult.questions.map((item, idx) => {
              const isCorrect = item.isCorrect;

              return (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl border bg-white shadow-sm transition-all ${
                    isCorrect ? "border-slate-200" : "border-rose-200 bg-rose-50/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.questionType}
                      </span>
                      {item.topicTag && (
                        <span className="text-xs text-slate-400 font-medium">Topic: {item.topicTag}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold">
                      {isCorrect ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          +{item.marksAwarded} Marks
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1">
                          <XCircle className="w-4 h-4" />0 / {item.maxMarks} Marks
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-900 font-medium text-sm mb-4 leading-relaxed">
                    {item.questionText}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="font-bold text-slate-500 block mb-1">Your Submitted Answer:</span>
                      <span
                        className={`font-medium ${
                          isCorrect ? "text-emerald-700 font-semibold" : "text-rose-700 font-semibold"
                        }`}
                      >
                        {item.submittedAnswer || "(No answer submitted)"}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs">
                      <span className="font-bold text-emerald-800 block mb-1">Correct Answer:</span>
                      <span className="font-semibold text-emerald-900">{item.correctAnswer}</span>
                    </div>
                  </div>

                  {item.explanation && (
                    <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-950">
                      <span className="font-bold text-indigo-900 block mb-1">Explanation & Key Takeaway:</span>
                      <p className="leading-relaxed">{item.explanation}</p>
                    </div>
                  )}

                  {item.evaluationFeedback && (
                    <div className="mt-2 text-xs text-slate-500 italic">
                      AI Rubric Feedback: {item.evaluationFeedback}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: AI GENERATOR MODAL / VIEW
  // =========================================================================
  if (viewMode === "generate") {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => setViewMode("hub")}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 mb-2"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back to Quizzes
            </button>
            <h1 className="text-2xl font-black text-slate-900">AI Exam & Quiz Generator</h1>
            <p className="text-sm text-slate-500 mt-1">
              Generate syllabus-aligned diagnostic questions tailored to your subject, difficulty, and question format.
            </p>
          </div>
        </div>

        {/* Configuration Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Subject
              </label>
              <select
                value={genSubjectId || ""}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setGenSubjectId(val);
                  const sub = subjects.find((s) => s.id === val);
                  if (sub) setGenSubjectName(sub.name);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="">Select an enrolled subject...</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Sem {s.semester})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Topic or Syllabus Sub-section *
              </label>
              <input
                type="text"
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
                placeholder="e.g. Virtual Memory, Deadlocks, Semaphore Primitives"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder-slate-400"
              />
            </div>
          </div>

          {/* Difficulty & Count */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["EASY", "MEDIUM", "HARD"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setGenDifficulty(lvl)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      genDifficulty === lvl
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Number of Questions
              </label>
              <select
                value={genCount}
                onChange={(e) => setGenCount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value={3}>3 Questions (Quick Check)</option>
                <option value={5}>5 Questions (Standard Diagnostic)</option>
                <option value={10}>10 Questions (Comprehensive)</option>
                <option value={15}>15 Questions (Full Mock)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Time Limit
              </label>
              <select
                value={genTimeLimit}
                onChange={(e) => setGenTimeLimit(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value={0}>Untimed (Self-paced)</option>
                <option value={5}>5 Minutes</option>
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
              </select>
            </div>
          </div>

          {/* Question Types checkboxes */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Included Question Formats
            </label>
            <div className="flex flex-wrap gap-4">
              {[
                { id: "MCQ", label: "Multiple Choice (MCQ)" },
                { id: "TRUE_FALSE", label: "True / False" },
                { id: "SHORT_ANSWER", label: "Short Answer / Conceptual" },
              ].map((type) => {
                const checked = genTypes.includes(type.id);
                return (
                  <label
                    key={type.id}
                    className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setGenTypes([...genTypes, type.id]);
                        } else {
                          if (genTypes.length > 1) {
                            setGenTypes(genTypes.filter((t) => t !== type.id));
                          } else {
                            toast.error("At least one question type is required");
                          }
                        }
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    {type.label}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleGenerateQuestions}
              disabled={isGenerating || !genTopic.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Questions with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Questions
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generated Questions Preview & Save */}
        {generatedPreviewQuestions.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Question Preview ({generatedPreviewQuestions.length} Questions)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review the generated questions before saving to your quiz bank.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSaveAndStartQuiz(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                >
                  Save to Hub
                </button>
                <button
                  onClick={() => handleSaveAndStartQuiz(true)}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  Save & Start Now
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {generatedPreviewQuestions.map((q, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">
                      Q{idx + 1} • {q.questionType}
                    </span>
                    <span className="text-xs text-indigo-600 font-semibold">{q.marks} Mark</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{q.questionText}</p>
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-lg text-xs font-medium border ${
                            opt === q.correctAnswer
                              ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold"
                              : "bg-white border-slate-200 text-slate-600"
                          }`}
                        >
                          {String.fromCharCode(65 + oIdx)}. {opt}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-slate-500 pt-1">
                    <span className="font-semibold text-slate-700">Explanation:</span> {q.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // RENDER: QUIZ HUB (MAIN VIEW)
  // =========================================================================
  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-sm font-medium">Loading Quiz Hub & Analytics...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Quiz & Examination System
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Test conceptual retention, diagnose knowledge gaps, and prepare for semester exams.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode("generate")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-md transition-all shadow-indigo-500/20"
          >
            <Sparkles className="w-4 h-4" />
            AI Quiz Generator
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            Quizzes Available
          </span>
          <p className="text-2xl font-black text-slate-900">{stats?.totalQuizzes || quizzes.length}</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            Total Attempts
          </span>
          <p className="text-2xl font-black text-slate-900">{stats?.totalAttempts || history.length}</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            Average Score
          </span>
          <p className="text-2xl font-black text-slate-900">{stats?.averagePercentage || 0}%</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            Passed Benchmarks
          </span>
          <p className="text-2xl font-black text-slate-900">{stats?.passedAttempts || 0}</p>
        </div>
      </div>

      {/* Filter & Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("quizzes")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              activeTab === "quizzes"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Available Quizzes ({filteredQuizzes.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              activeTab === "history"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Attempt History ({history.length})
          </button>
        </div>

        {activeTab === "quizzes" && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500">Subject:</span>
            <select
              value={selectedSubjectFilter}
              onChange={(e) =>
                setSelectedSubjectFilter(
                  e.target.value === "ALL" ? "ALL" : Number(e.target.value)
                )
              }
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: QUIZZES GRID */}
      {activeTab === "quizzes" && (
        <>
          {filteredQuizzes.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Quizzes Created Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Create your first diagnostic quiz using our AI generator to evaluate topic readiness.
              </p>
              <button
                onClick={() => setViewMode("generate")}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Generate Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuizzes.map((quiz) => {
                const diffColor =
                  quiz.difficulty === "HARD"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : quiz.difficulty === "MEDIUM"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200";

                return (
                  <div
                    key={quiz.id}
                    className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">
                          {quiz.subjectName || "General"}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${diffColor}`}>
                          {quiz.difficulty}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 leading-snug mb-2">
                        {quiz.title}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                        {quiz.description || "Comprehensive syllabus practice quiz."}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 py-3 border-t border-slate-100 mb-4">
                        <span className="flex items-center gap-1 font-medium">
                          <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                          {quiz.questionCount} Questions
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          {quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} Mins` : "Untimed"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartQuiz(quiz.id)}
                          className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Start Quiz
                        </button>
                        <button
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Quiz"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: ATTEMPT HISTORY */}
      {activeTab === "history" && (
        <>
          {history.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 space-y-3">
              <BarChart3 className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Attempts Recorded Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Take a practice quiz to view score breakdowns, mistake analysis, and topic mastery.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-6 py-3.5">Quiz / Subject</th>
                      <th className="px-6 py-3.5">Score</th>
                      <th className="px-6 py-3.5">Percentage</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Time Spent</th>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {history.map((att) => {
                      const isPassed = att.passed;

                      return (
                        <tr key={att.attemptId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-900 block">{att.quizTitle}</span>
                            <span className="text-[11px] text-slate-400">{att.subjectName}</span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-900">
                            {att.scoreObtained} / {att.totalMarks}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-900">{att.percentage}%</span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isPassed
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {isPassed ? "PASSED" : "NEEDS REVIEW"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {Math.round(att.timeSpentSeconds / 60)}m {att.timeSpentSeconds % 60}s
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {new Date(att.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleViewAttemptResult(att.attemptId)}
                              className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors"
                            >
                              View Analysis
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
