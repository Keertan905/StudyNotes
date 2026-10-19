import { Link } from "react-router-dom";
import { 
  GraduationCap, 
  FileText, 
  Bot, 
  HelpCircle, 
  Sparkles, 
  BrainCircuit, 
  AlertTriangle, 
  Calendar, 
  ArrowRight,
  CheckCircle2,
  Clock
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  const quickActions = [
    {
      to: "/subjects",
      title: "Subjects & Syllabus",
      desc: "Manage syllabus units, course topics, and study progress",
      icon: GraduationCap,
      color: "from-blue-500 to-indigo-600",
    },
    {
      to: "/notes",
      title: "AI Notes Generator",
      desc: "Generate comprehensive, simplified revision notes from topics",
      icon: FileText,
      color: "from-indigo-500 to-purple-600",
    },
    {
      to: "/tutor",
      title: "AI Tutor (Doc Q&A)",
      desc: "Ask syllabus-grounded questions and chat with your uploaded notes",
      icon: Bot,
      color: "from-purple-500 to-pink-600",
    },
    {
      to: "/quiz",
      title: "Quiz & Exams",
      desc: "Practice auto-generated MCQs, short answers, and mock tests",
      icon: HelpCircle,
      color: "from-emerald-500 to-teal-600",
    },
    {
      to: "/flashcards",
      title: "Flashcard Revision",
      desc: "Spaced repetition flashcards for definitions and formulas",
      icon: Sparkles,
      color: "from-amber-500 to-orange-600",
    },
    {
      to: "/knowledge-gaps",
      title: "Knowledge Gap Detector",
      desc: "Find and patch weak conceptual areas across your subjects",
      icon: BrainCircuit,
      color: "from-rose-500 to-red-600",
    },
    {
      to: "/mistakes",
      title: "Mistake Intelligence",
      desc: "Analyze mistakes by conceptual error, forgotten facts, or application",
      icon: AlertTriangle,
      color: "from-orange-500 to-amber-600",
    },
    {
      to: "/planner",
      title: "Exam Countdown Planner",
      desc: "Target exam dates and generate daily personalized study routines",
      icon: Calendar,
      color: "from-sky-500 to-blue-600",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-medium backdrop-blur-sm mb-4">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>Authentication Active • Spring Boot & MySQL Ready</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Welcome back, {user?.name || "Student"}! 👋
          </h1>
          <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
            Your personal AI study assistant is ready. Track your syllabus, generate revision notes,
            identify knowledge gaps, and prepare for your exams.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-indigo-100">
            {user?.college && (
              <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
                🏛️ {user.college}
              </div>
            )}
            {user?.branch && (
              <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
                📚 {user.branch}
              </div>
            )}
            <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
              🎓 Semester {user?.semester || 1}
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
              ✉️ {user?.email}
            </div>
          </div>
        </div>

        {/* Subtle background glow */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Authentication</p>
            <p className="text-lg font-bold text-slate-800">Secure JWT</p>
            <p className="text-xs text-emerald-600 font-medium">● Logged In as {user?.role || "STUDENT"}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Phase 2 Next</p>
            <p className="text-lg font-bold text-slate-800">Subjects & Topics</p>
            <p className="text-xs text-slate-500">Syllabus structure engine</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Session State</p>
            <p className="text-lg font-bold text-slate-800">Active</p>
            <p className="text-xs text-slate-500">Token auto-persisted</p>
          </div>
        </div>
      </div>

      {/* Feature Modules Grid */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">StudyApp Platform Modules</h2>
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
