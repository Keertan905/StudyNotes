import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  GraduationCap, 
  FileText, 
  HelpCircle, 
  Clock, 
  ArrowRight,
  CheckCircle2,
  Flame,
  Trophy,
  HardDrive,
  Bot,
  Video,
  Workflow,
  FlaskConical,
  Lightbulb,
  BookOpen,
  Code2
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { gamificationService } from "../../services/gamification.service";
import type { GamificationProfile } from "../../services/gamification.service";
import { studySessionService } from "../../services/studySession.service";
import type { SessionStats } from "../../services/studySession.service";
import { subjectService, type SubjectItem } from "../../services/subject.service";

export default function DashboardPage() {
  const { user } = useAuth();

  const [gamification, setGamification] = useState<GamificationProfile | null>(null);
  const [timerStats, setTimerStats] = useState<SessionStats | null>(null);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [gamificationData, statsData, subjectsData] = await Promise.all([
        gamificationService.getProfile().catch(() => null),
        studySessionService.getStats().catch(() => null),
        subjectService.getSubjects().catch(() => []),
      ]);
      setGamification(gamificationData);
      setTimerStats(statsData);
      setSubjects(subjectsData);
    } catch {
      // Ignore background error
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    {
      to: "/tutor",
      title: "AI Study Tutor",
      desc: "Interactive academic dialog with multi-modal formula and diagram explanations",
      icon: Bot,
      color: "from-indigo-500 to-indigo-700",
    },
    {
      to: "/notes",
      title: "AI Notes Generator",
      desc: "Structured, high-yield revision notes tailored directly to your syllabus",
      icon: FileText,
      color: "from-blue-500 to-indigo-600",
    },
    {
      to: "/quiz",
      title: "Quiz & Mock Exams",
      desc: "Practice auto-generated MCQs, short answers, and timed diagnostic tests",
      icon: HelpCircle,
      color: "from-emerald-500 to-teal-600",
    },
    {
      to: "/diagrams",
      title: "Diagram & Infographics",
      desc: "Visual flowcharts, system architectures, and concept revision maps",
      icon: Workflow,
      color: "from-purple-500 to-indigo-600",
    },
    {
      to: "/virtual-lab",
      title: "Virtual Lab",
      desc: "Interactive computer science and science experiment simulations",
      icon: FlaskConical,
      color: "from-cyan-500 to-blue-600",
    },
    {
      to: "/problem-solver",
      title: "Problem Solver",
      desc: "Step-by-step mathematical, engineering, and numerical problem breakdowns",
      icon: Lightbulb,
      color: "from-amber-500 to-orange-600",
    },
    {
      to: "/youtube-finder",
      title: "Video Learning",
      desc: "Curated academic lectures and targeted educational video recommendations",
      icon: Video,
      color: "from-red-500 to-rose-600",
    },
    {
      to: "/lecture-summarizer",
      title: "Lecture Summarizer",
      desc: "Condense long lecture recordings and study materials into key takeaways",
      icon: BookOpen,
      color: "from-teal-500 to-emerald-600",
    },
    {
      to: "/code-explainer",
      title: "Code Explainer",
      desc: "Line-by-line algorithm code walkthroughs, big-O analysis, and optimizations",
      icon: Code2,
      color: "from-slate-700 to-slate-900",
    },
    {
      to: "/timer",
      title: "Study Timer",
      desc: "Pomodoro rhythm focus sessions, task tracking, and study time logs",
      icon: Clock,
      color: "from-violet-500 to-purple-700",
    },
    {
      to: "/rewards",
      title: "Rewards & Streaks",
      desc: "XP progression, badges, daily streaks, and campus leaderboard",
      icon: Trophy,
      color: "from-amber-500 to-yellow-600",
    },
    {
      to: "/offline",
      title: "Offline Study Library",
      desc: "IndexedDB cached documents and study resources for offline learning",
      icon: HardDrive,
      color: "from-teal-600 to-emerald-700",
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
            <span>AI Study & Exam Preparation Workspace Ready</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Welcome back, {user?.name || "Student"}! 👋
          </h1>
          <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
            Your personal AI study workspace is active. Explore interactive academic tutoring,
            generate high-yield revision notes, and track your focus sessions.
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
            {timerStats?.currentStreakDays !== undefined && (
              <div className="bg-amber-400/20 text-amber-200 border border-amber-400/30 px-3 py-1.5 rounded-xl backdrop-blur-xs font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                {timerStats.currentStreakDays} Day Streak
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
              {gamification.currentLevel}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  {gamification.levelTitle || "Academic Explorer"}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wide">
                  Level {gamification.currentLevel}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {gamification.totalXp} XP accumulated • {Math.max(0, gamification.nextLevelTargetXp - gamification.totalXp)} XP needed for next level
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-md space-y-1.5">
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

      {/* SECTION: ACADEMIC FOCUS & PRODUCTIVITY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Enrolled Subjects Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5 text-indigo-600">
                <GraduationCap className="w-4 h-4" />
                Active Subjects
              </span>
              <span>Syllabus</span>
            </div>

            <div className="mt-4 space-y-2">
              <span className="text-3xl font-black text-slate-900">{subjects.length}</span>
              <p className="text-xs text-slate-500 font-medium">
                Enrolled academic subjects with AI-structured syllabi and study materials.
              </p>
            </div>
          </div>

          <Link
            to="/subjects"
            className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <span>Manage Subjects & Syllabus</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Study Time Logged Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <Clock className="w-4 h-4" />
                Focus Time Logged
              </span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-[10px]">
                Productivity
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <span className="text-3xl font-black text-slate-900">
                {timerStats?.minutesStudiedToday || 0} <span className="text-sm font-semibold text-slate-500">mins today</span>
              </span>
              <p className="text-xs text-slate-500 font-medium">
                {timerStats?.minutesStudiedThisWeek || 0} total minutes completed across study sessions this week.
              </p>
            </div>
          </div>

          <Link
            to="/timer"
            className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            <span>Open Study Timer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Study Sessions Completed Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5 text-amber-600">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                Completed Sessions
              </span>
              <span>Streak</span>
            </div>

            <div className="mt-4 space-y-2">
              <span className="text-3xl font-black text-slate-900">
                {timerStats?.completedSessionsCount || 0}
              </span>
              <p className="text-xs text-slate-500 font-medium">
                Deep study intervals finished with active streak of {timerStats?.currentStreakDays || 0} days.
              </p>
            </div>
          </div>

          <Link
            to="/history"
            className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-600 hover:text-amber-700"
          >
            <span>View Full Study History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Feature Modules Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">StudyApp Learning Modules</h2>
          <span className="text-xs text-slate-400 font-medium">All Integrated Tools</span>
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
