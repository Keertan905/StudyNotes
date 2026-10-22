import { useState, useEffect, useRef } from "react";
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  Calendar,
  Flame,
  Plus,
  Trash2,
  BookOpen,
  Coffee,
  Check,
  Loader2,
} from "lucide-react";
import {
  studySessionService,
  type StudySession,
  type SessionStats,
  type StudyTask,
} from "../../services/studySession.service";
import { subjectService, type SubjectItem } from "../../services/subject.service";
import { offlineService } from "../../services/offline.service";
import toast from "react-hot-toast";

type TimerMode = "POMODORO" | "SHORT_BREAK" | "LONG_BREAK" | "CUSTOM";

const MODE_CONFIG: Record<TimerMode, { label: string; defaultMinutes: number; color: string; ringColor: string }> = {
  POMODORO: { label: "Focus Session", defaultMinutes: 25, color: "text-indigo-600", ringColor: "#4f46e5" },
  SHORT_BREAK: { label: "Short Break", defaultMinutes: 5, color: "text-teal-600", ringColor: "#0d9488" },
  LONG_BREAK: { label: "Long Break", defaultMinutes: 15, color: "text-sky-600", ringColor: "#0284c7" },
  CUSTOM: { label: "Custom Focus", defaultMinutes: 45, color: "text-violet-600", ringColor: "#7c3aed" },
};

export default function TimerPage() {
  // Timer State
  const [timerMode, setTimerMode] = useState<TimerMode>("POMODORO");
  const [targetMinutes, setTargetMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  // Link to Subject/Topic
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>(undefined);
  const [sessionTopic, setSessionTopic] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");

  // History & Tasks
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Quick Task Form
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Timer Countdown Effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            handleSessionCompleted();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, targetMinutes, timerMode]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [subs, sessList, statData, taskList] = await Promise.all([
        subjectService.getSubjects().catch(() => []),
        studySessionService.getSessions().catch(() => []),
        studySessionService.getStats().catch(() => ({
          minutesStudiedToday: 0,
          minutesStudiedThisWeek: 0,
          completedSessionsCount: 0,
          currentStreakDays: 0,
        })),
        studySessionService.getTasks().catch(() => []),
      ]);
      setSubjects(subs);
      setSessions(sessList);
      setStats(statData);
      setTasks(taskList);
      if (subs.length > 0) setSelectedSubjectId(subs[0].id);
    } catch {
      // Graceful fallback without blocking user from studying
      setSubjects([]);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (mode: TimerMode) => {
    setIsRunning(false);
    setTimerMode(mode);
    const mins = MODE_CONFIG[mode].defaultMinutes;
    setTargetMinutes(mins);
    setSecondsRemaining(mins * 60);
  };

  const handleStartPause = () => {
    if (!isRunning) {
      if (!sessionStartTime) setSessionStartTime(Date.now());
      setIsRunning(true);
      toast.success("Timer started. Stay focused!");
    } else {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setSessionStartTime(null);
    setSecondsRemaining(targetMinutes * 60);
  };

  const handleSkip = () => {
    setIsRunning(false);
    if (timerMode === "POMODORO") {
      switchMode("SHORT_BREAK");
    } else {
      switchMode("POMODORO");
    }
  };

  const handleSessionCompleted = async () => {
    // Play browser audio beep or toast
    toast.success(`🎉 ${MODE_CONFIG[timerMode].label} completed! Great job!`, { duration: 6000 });

    if (timerMode === "POMODORO" || timerMode === "CUSTOM") {
      try {
        const sub = subjects.find((s) => s.id === selectedSubjectId);
        const title = sessionTopic.trim() || `${sub ? sub.name : "Deep Study"} Session`;

        const logged = await studySessionService.logSession({
          subjectId: selectedSubjectId,
          title,
          sessionType: timerMode,
          targetDurationMinutes: targetMinutes,
          actualDurationMinutes: targetMinutes,
          completed: true,
          notes: sessionNotes.trim() || undefined,
        });

        setSessions((prev) => [logged, ...prev]);
        studySessionService.getStats().then(setStats).catch(() => {});
      } catch {
        // Offline fallback: save study session to IndexedDB sync queue
        try {
          const sub = subjects.find((s) => s.id === selectedSubjectId);
          const title = sessionTopic.trim() || `${sub ? sub.name : "Deep Study"} Session`;
          await offlineService.recordOfflineStudySession({
            subjectId: selectedSubjectId,
            title,
            sessionType: timerMode,
            actualDurationMinutes: targetMinutes,
            notes: sessionNotes.trim() || undefined,
          });
          toast.success("Study session saved offline! Will auto-sync when online.", { icon: "💾" });
        } catch {
          toast.error("Failed to persist session log");
        }
      }
    }

    // Auto switch to break if focus completed
    if (timerMode === "POMODORO") {
      switchMode("SHORT_BREAK");
    } else {
      switchMode("POMODORO");
    }
  };

  // Task Actions
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const created = await studySessionService.createTask({
        subjectId: selectedSubjectId,
        title: newTaskTitle.trim(),
        priority: "MEDIUM",
        estimatedMinutes: 25,
      });

      setTasks((prev) => [created, ...prev]);
      setNewTaskTitle("");
      toast.success("Task added!");
    } catch {
      toast.error("Failed to add task");
    }
  };

  const handleToggleTask = async (task: StudyTask) => {
    try {
      const nextStatus = task.status === "COMPLETED" ? "TODO" : "COMPLETED";
      const updated = await studySessionService.updateTask(task.id, {
        status: nextStatus,
      });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await studySessionService.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch {
      toast.error("Failed to delete task");
    }
  };

  // Time format
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-sm font-medium">Loading Study Timer & Focus Metrics...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Study Timer & Focus Tracker
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Maintain deep concentration intervals with Pomodoro rhythm and daily productivity metrics.
          </p>
        </div>
      </div>

      {/* Productivity Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-600" />
            Studied Today
          </span>
          <p className="text-2xl font-black text-slate-900">{stats?.minutesStudiedToday || 0} mins</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            Studied This Week
          </span>
          <p className="text-2xl font-black text-slate-900">{stats?.minutesStudiedThisWeek || 0} mins</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            Completed Sessions
          </span>
          <p className="text-2xl font-black text-slate-900">{stats?.completedSessionsCount || sessions.length}</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" />
            Daily Streak
          </span>
          <p className="text-2xl font-black text-amber-600">
            {stats?.currentStreakDays || 0} day{stats?.currentStreakDays === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* Main Grid: Timer on Left, Tasks & Logs on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Pomodoro Circular Timer (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-between space-y-8">
          {/* Mode Switcher Pill */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80">
            {(["POMODORO", "SHORT_BREAK", "LONG_BREAK", "CUSTOM"] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timerMode === m
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {MODE_CONFIG[m].label}
              </button>
            ))}
          </div>

          {/* Circular SVG Gauge with Countdown */}
          <div className="relative flex items-center justify-center my-4">
            <svg className="w-72 h-72 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="144"
                cy="144"
                r="120"
                stroke="#e2e8f0"
                strokeWidth="12"
                fill="transparent"
              />
              {/* Animated Progress Circle */}
              <circle
                cx="144"
                cy="144"
                r="120"
                stroke={MODE_CONFIG[timerMode].ringColor}
                strokeWidth="12"
                fill="transparent"
                strokeDasharray="753.98"
                strokeDashoffset={753.98 - (753.98 * (secondsRemaining / (targetMinutes * 60)))}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-5xl font-black tracking-tight text-slate-900 font-mono">
                {timeFormatted}
              </span>
              <span className={`text-xs font-bold uppercase tracking-wider mt-2 ${MODE_CONFIG[timerMode].color}`}>
                {MODE_CONFIG[timerMode].label}
              </span>
            </div>
          </div>

          {/* Primary Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={handleStartPause}
              className={`px-8 py-4 rounded-2xl font-bold text-sm text-white shadow-lg flex items-center gap-2 transition-all transform hover:scale-105 ${
                isRunning
                  ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25"
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  Start Focus
                </>
              )}
            </button>

            <button
              onClick={handleSkip}
              className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Skip to Next Interval"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Focus Topic & Subject Linking */}
          <div className="w-full pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Subject
              </label>
              <select
                value={selectedSubjectId || ""}
                onChange={(e) => setSelectedSubjectId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a subject...</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Session Focus / Topic
              </label>
              <input
                type="text"
                value={sessionTopic}
                onChange={(e) => setSessionTopic(e.target.value)}
                placeholder="e.g. Page replacement algorithms"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Session Notes & Key Reflections
              </label>
              <textarea
                rows={2}
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Jot down notes or summaries of what you reviewed during this timer..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Tasks & Session History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Study Tasks Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Session Tasks ({tasks.filter((t) => t.status === "COMPLETED").length}/{tasks.length})
              </h3>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleCreateTask} className="flex gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add task for this session..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            {/* Task list */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No tasks added yet. Add a topic or problem set to stay focused.
                </p>
              ) : (
                tasks.map((task) => {
                  const isDone = task.status === "COMPLETED";

                  return (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 text-xs"
                    >
                      <button
                        onClick={() => handleToggleTask(task)}
                        className="flex items-center gap-2.5 text-left flex-1"
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isDone
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isDone && <Check className="w-3 h-3" />}
                        </div>
                        <span
                          className={`font-medium ${
                            isDone ? "line-through text-slate-400" : "text-slate-800"
                          }`}
                        >
                          {task.title}
                        </span>
                      </button>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Completed Sessions Log */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Coffee className="w-4 h-4 text-emerald-600" />
              Recent Completed Sessions
            </h3>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {sessions.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  Completed Pomodoro sessions will be logged here.
                </p>
              ) : (
                sessions.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{s.title}</span>
                      <span className="text-[11px] text-slate-400">
                        {s.subjectName || "General Focus"} • {s.actualDurationMinutes} mins
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Done
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
