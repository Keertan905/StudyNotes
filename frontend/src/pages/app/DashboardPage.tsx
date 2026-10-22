import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  GraduationCap, 
  FileText, 
  HelpCircle, 
  Sparkles, 
  BrainCircuit, 
  AlertTriangle, 
  Calendar, 
  ArrowRight,
  CheckCircle2,
  Flame,
  TrendingUp,
  Target,
  Circle,
  Trophy,
  HardDrive
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { analyticsService } from "../../services/analytics.service";
import type { AnalyticsOverview } from "../../services/analytics.service";
import { plannerService } from "../../services/planner.service";
import type { DailyPlanResponse, ExamTarget } from "../../services/planner.service";
import { gamificationService } from "../../services/gamification.service";
import type { GamificationProfile } from "../../services/gamification.service";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [dailyPlan, setDailyPlan] = useState<DailyPlanResponse | null>(null);
  const [exams, setExams] = useState<ExamTarget[]>([]);
  const [gamification, setGamification] = useState<GamificationProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [analyticsData, planData, examsData, gamificationData] = await Promise.all([
        analyticsService.getOverview().catch(() => null),
        plannerService.getDailyPlan().catch(() => null),
        plannerService.getExams().catch(() => []),
        gamificationService.getProfile().catch(() => null),
      ]);
      setAnalytics(analyticsData);
      setDailyPlan(planData);
      setExams(examsData);
      setGamification(gamificationData);
    } catch {
      // Ignore background error
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePlanItem = async (id: number) => {
    try {
      const updated = await plannerService.togglePlanItemCompleted(id);
      setDailyPlan((prev) => {
        if (!prev) return prev;
        const newItems = prev.items.map((i) => (i.id === id ? updated : i));
        const completed = newItems.filter((i) => i.completed).length;
        return {
          ...prev,
          items: newItems,
          completedItems: completed,
          completionPercentage: Math.round((completed / (newItems.length || 1)) * 100),
        };
      });
      if (updated.completed) {
        toast.success("Study block finished! Great job! 🔥");
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const nearestExam = exams.find((e) => e.status === "UPCOMING");

  const quickActions = [
    {
      to: "/rewards",
      title: "Gamification & Rewards",
      desc: "Level progression, XP points, streaks, and campus leaderboard",
      icon: Trophy,
      color: "from-amber-500 to-yellow-600",
    },
    {
      to: "/offline",
      title: "Offline Study Library",
      desc: "Cache notes, SM-2 flashcards, and documents for offline learning",
      icon: HardDrive,
      color: "from-teal-500 to-emerald-600",
    },
    {
      to: "/planner",
      title: "Exam Study Planner",
      desc: "Daily personalized timetable synchronized with target exams",
      icon: Calendar,
      color: "from-sky-500 to-blue-600",
    },
    {
      to: "/analytics",
      title: "Readiness & Analytics",
      desc: "Algorithmic 5-pillar readiness score and study velocity",
      icon: TrendingUp,
      color: "from-emerald-500 to-teal-600",
    },
    {
      to: "/quiz",
      title: "Quiz & Mock Exams",
      desc: "Practice auto-generated MCQs, short answers, and tests",
      icon: HelpCircle,
      color: "from-blue-500 to-indigo-600",
    },
    {
      to: "/flashcards",
      title: "Flashcard Revision",
      desc: "SuperMemo SM-2 spaced repetition for formulas & facts",
      icon: Sparkles,
      color: "from-amber-500 to-orange-600",
    },
    {
      to: "/knowledge-gaps",
      title: "Knowledge Gap Detector",
      desc: "Locate and patch weak conceptual areas across subjects",
      icon: BrainCircuit,
      color: "from-rose-500 to-red-600",
    },
    {
      to: "/mistakes",
      title: "Mistake Intelligence",
      desc: "Analyze root causes, exam prevention rules, and retakes",
      icon: AlertTriangle,
      color: "from-orange-500 to-amber-600",
    },
    {
      to: "/notes",
      title: "AI Notes Generator",
      desc: "10-section structured high-yield revision notes",
      icon: FileText,
      color: "from-indigo-500 to-purple-600",
    },
    {
      to: "/subjects",
      title: "Subjects & Syllabus",
      desc: "Manage syllabus units, course topics, and study progress",
      icon: GraduationCap,
      color: "from-violet-500 to-purple-700",
    },
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-pulse">
        <div className="h-48 bg-slate-100 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="h-44 bg-slate-100 rounded-3xl" />
          <div className="h-44 bg-slate-100 rounded-3xl" />
          <div className="h-44 bg-slate-100 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-800 to-violet-900 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-medium backdrop-blur-sm mb-4">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>Phase 6 Active • Study Planner & Readiness Score Ready</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Welcome back, {user?.name || "Student"}! 👋
          </h1>
          <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
            Your personal AI study companion has calibrated your daily timetable. Track upcoming exam countdowns,
            boost your readiness score, and master weak conceptual gaps.
          </p>

          <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium text-indigo-100">
            {user?.college && (
              <div className="bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                🏛️ {user.college}
              </div>
            )}
            {user?.branch && (
              <div className="bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                📚 {user.branch}
              </div>
            )}
            <div className="bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
              🎓 Semester {user?.semester || 1}
            </div>
            {analytics?.currentStreakDays !== undefined && (
              <div className="bg-amber-400/20 text-amber-200 border border-amber-400/30 px-3 py-1.5 rounded-xl backdrop-blur-xs font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                {analytics.currentStreakDays} Day Streak
              </div>
            )}
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* SECTION: ACADEMIC LEVEL & GAMIFICATION CARD */}
      {gamification && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 border border-amber-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-black text-2xl shadow-sm flex-shrink-0">
              {gamification.currentLevel}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Level {gamification.currentLevel}</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-bold text-slate-800">{gamification.levelTitle}</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {gamification.totalXp} Total XP Earned
              </h3>
              <p className="text-xs text-slate-500">
                {gamification.nextLevelTargetXp - gamification.totalXp} XP to Level {gamification.currentLevel + 1} • {gamification.achievementsCount} Achievements Unlocked
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-md space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Level Progress</span>
              <span>{gamification.progressToNextLevelPct}%</span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(4, gamification.progressToNextLevelPct)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/rewards"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5" />
              Rewards & Leaderboard
            </Link>
            <Link
              to="/offline"
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <HardDrive className="w-3.5 h-3.5 text-teal-600" />
              Offline Library
            </Link>
          </div>
        </div>
      )}

      {/* SECTION: LIVE READINESS & NEAREST EXAM COUNTDOWN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Nearest Exam Countdown Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5 text-indigo-600">
                <Target className="w-4 h-4" />
                Next Target Exam
              </span>
              <span>{nearestExam ? `${nearestExam.priority} Priority` : 'Countdown'}</span>
            </div>

            {nearestExam ? (
              <div className="mt-4 space-y-2">
                <h3 className="text-xl font-extrabold text-slate-900 line-clamp-1">{nearestExam.title}</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {nearestExam.subjectName || 'General Exam'} • Target: <strong className="text-indigo-600">{nearestExam.targetScore}%</strong>
                </p>

                <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Remaining</span>
                    <strong className="text-lg font-black text-indigo-700">
                      {nearestExam.daysRemaining === 0 ? 'Today! 🚨' : `${nearestExam.daysRemaining} Days`}
                    </strong>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {new Date(nearestExam.examDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 py-4 text-center space-y-2">
                <p className="text-xs text-slate-500">No active exam countdowns.</p>
                <button
                  onClick={() => navigate('/planner')}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Set target exam &rarr;
                </button>
              </div>
            )}
          </div>

          <Link
            to="/planner"
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <span>View Full Study Timetable</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Holistic Readiness Score Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <TrendingUp className="w-4 h-4" />
                Exam Readiness Score
              </span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-[10px]">
                {analytics?.readiness.readinessStatus || 'DIAGNOSTIC'}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex flex-col items-center justify-center shadow-xs">
                <span className="text-2xl font-black">{analytics?.readiness.overallReadiness || 72}%</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-100">Score</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  {analytics?.readiness.readinessStatus === 'EXEMPLARY'
                    ? 'Honors Ready'
                    : analytics?.readiness.readinessStatus === 'READY'
                    ? 'Well Prepared'
                    : 'Target Gaps Identified'}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {analytics?.readiness.statusDescription || 'Multi-factor diagnostic evaluation based on 5 syllabus pillars.'}
                </p>
              </div>
            </div>

            {/* Quick mini-bars */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-400 block">Syllabus</span>
                <strong className="text-slate-800">{analytics?.readiness.syllabusCoverageScore || 65}%</strong>
              </div>
              <div className="p-2 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-400 block">Quiz Acc.</span>
                <strong className="text-slate-800">{analytics?.readiness.quizAccuracyScore || 78}%</strong>
              </div>
              <div className="p-2 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-400 block">Retention</span>
                <strong className="text-slate-800">{analytics?.readiness.flashcardMasteryScore || 80}%</strong>
              </div>
            </div>
          </div>

          <Link
            to="/analytics"
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            <span>Detailed Diagnostic Breakdown</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Study Velocity & Focus Time Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5 text-amber-600">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                Focus & Velocity
              </span>
              <span>This Week</span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-2xl font-black text-slate-900">
                  {analytics?.thisWeekStudyMinutes || 0} mins
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">Focus time logged past 7 days</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100/80">
                  <span className="text-[10px] text-amber-600 font-bold uppercase block">Streak</span>
                  <strong className="text-sm font-extrabold text-amber-700 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {analytics?.currentStreakDays || 0} Days
                  </strong>
                </div>

                <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100/80">
                  <span className="text-[10px] text-indigo-600 font-bold uppercase block">Tasks Done</span>
                  <strong className="text-sm font-extrabold text-indigo-700">
                    {analytics?.completedTasksCount || 0} Tasks
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/timer"
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-600 hover:text-amber-700"
          >
            <span>Open Pomodoro Focus Timer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* SECTION: TODAY'S STUDY PLAN CHECKLIST */}
      {dailyPlan && dailyPlan.items.length > 0 && (
        <section className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Today's Agenda</span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                Scheduled Study Blocks ({dailyPlan.completedItems} / {dailyPlan.totalItems} Complete)
              </h2>
            </div>
            <Link
              to="/planner"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Open Timetable
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dailyPlan.items.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  item.completed
                    ? "bg-slate-50 border-slate-200 opacity-60"
                    : "bg-white border-slate-200 hover:border-indigo-200 hover:shadow-xs"
                } flex items-start justify-between gap-3`}
              >
                <div className="flex items-start gap-2.5">
                  <button
                    onClick={() => handleTogglePlanItem(item.id)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors flex-shrink-0"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 hover:text-indigo-600" />
                    )}
                  </button>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {item.timeSlot || `${item.estimatedMinutes} mins`}
                    </span>
                    <h4 className={`text-xs font-bold text-slate-800 line-clamp-1 ${item.completed ? "line-through text-slate-400" : ""}`}>
                      {item.title}
                    </h4>
                    {item.subjectName && (
                      <span className="text-[10px] text-slate-500 font-medium">{item.subjectName}</span>
                    )}
                  </div>
                </div>

                {item.actionRoute && (
                  <button
                    onClick={() => navigate(item.actionRoute!)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex-shrink-0"
                  >
                    Start &rarr;
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Feature Modules Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">StudyApp Platform Modules</h2>
          <span className="text-xs text-slate-400 font-medium">8 Integrated Tools</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                className="group relative p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} text-white flex items-center justify-center mb-3 shadow-xs`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors text-sm">
                    {action.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {action.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-400 group-hover:text-indigo-600">
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
