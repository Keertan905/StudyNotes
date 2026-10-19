import { useState, useEffect, useId } from "react";
import { 
  History, 
  Search, 
  Clock, 
  HelpCircle, 
  Sparkles, 
  FileText, 
  UploadCloud, 
  Download,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Flame,
  Award
} from "lucide-react";
import { Link } from "react-router-dom";
import { historyService } from "../../services/history.service";
import type { HistorySummary, ActivityEvent } from "../../services/history.service";
import toast from "react-hot-toast";

type FilterType = "ALL" | "FOCUS_SESSION" | "QUIZ_ATTEMPT" | "FLASHCARD_REVIEW" | "NOTE_GENERATED" | "DOCUMENT_UPLOAD";

const FILTERS: { label: string; value: FilterType; icon: any }[] = [
  { label: "All Activities", value: "ALL", icon: History },
  { label: "Focus Sessions", value: "FOCUS_SESSION", icon: Clock },
  { label: "Quizzes", value: "QUIZ_ATTEMPT", icon: HelpCircle },
  { label: "Flashcards", value: "FLASHCARD_REVIEW", icon: Sparkles },
  { label: "AI Notes", value: "NOTE_GENERATED", icon: FileText },
  { label: "Documents", value: "DOCUMENT_UPLOAD", icon: UploadCloud },
];

export default function HistoryPage() {
  const searchInputId = useId();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadHistory();
  }, [activeFilter]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await historyService.getHistory(activeFilter, searchQuery.trim() || undefined);
      setSummary(data);
    } catch {
      toast.error("Failed to load study history");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadHistory();
  };

  const handleExportJson = () => {
    if (!summary || summary.events.length === 0) {
      toast.error("No activity history to export");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(summary, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `study_history_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Study history exported successfully!");
  };

  const getEventBadge = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "FOCUS_SESSION":
        return {
          label: "Focus Session",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          iconBg: "bg-emerald-100 text-emerald-600",
          icon: Clock,
          actionLink: "/timer",
          actionText: "Open Timer"
        };
      case "QUIZ_ATTEMPT":
        return {
          label: "Quiz Attempt",
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
          iconBg: "bg-indigo-100 text-indigo-600",
          icon: HelpCircle,
          actionLink: "/quiz",
          actionText: "View Quizzes"
        };
      case "FLASHCARD_REVIEW":
        return {
          label: "Flashcard Review",
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          iconBg: "bg-amber-100 text-amber-600",
          icon: Sparkles,
          actionLink: "/flashcards",
          actionText: "Practice Decks"
        };
      case "NOTE_GENERATED":
        return {
          label: "AI Notes",
          bg: "bg-sky-50 text-sky-700 border-sky-200",
          iconBg: "bg-sky-100 text-sky-600",
          icon: FileText,
          actionLink: "/notes",
          actionText: "Open Notes"
        };
      case "DOCUMENT_UPLOAD":
        return {
          label: "Document",
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          iconBg: "bg-rose-100 text-rose-600",
          icon: UploadCloud,
          actionLink: "/notes",
          actionText: "View Documents"
        };
      default:
        return {
          label: "Activity",
          bg: "bg-slate-100 text-slate-700 border-slate-200",
          iconBg: "bg-slate-100 text-slate-600",
          icon: History,
          actionLink: "/dashboard",
          actionText: "View"
        };
    }
  };

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            <span>Audit Trail & Progress Log</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Study History & Activity
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review all completed focus sessions, quiz results, flashcard reviews, and generated study notes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition-colors"
            title="Export Activity History as JSON"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export History
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Activities</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {summary?.totalActivities ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Recorded study actions</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Study Time</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatStudyTime(summary?.totalStudyMinutes ?? 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Tracked focus timer hours</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Quizzes Taken</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {summary?.quizzesCompleted ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Knowledge assessments</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-sky-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Flashcards Reviewed</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {summary?.flashcardsReviewed ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Spaced repetition reps</p>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <label htmlFor={searchInputId} className="sr-only">Search activity history</label>
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id={searchInputId}
              type="text"
              placeholder="Search by topic, subject, or activity description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-800 placeholder-slate-400"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-xs"
          >
            Filter
          </button>
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {FILTERS.map((f) => {
            const Icon = f.icon;
            const isSelected = activeFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* History Timeline */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-xs text-slate-500 mt-3 font-medium">Loading study records...</p>
          </div>
        ) : !summary || summary.events.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 px-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No activity logged yet</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              Start a Pomodoro focus timer, generate AI study notes, or practice flashcards to build your personal learning journal.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <Link
                to="/timer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
              >
                <Clock className="w-4 h-4" />
                Start Focus Session
              </Link>
              <Link
                to="/flashcards"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Review Flashcards
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-6">
            {summary.events.map((event) => {
              const badge = getEventBadge(event.type);
              const EventIcon = badge.icon;

              return (
                <div key={event.id} className="relative group">
                  {/* Timeline Node Icon */}
                  <div className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow-xs flex items-center justify-center ${badge.iconBg}`}>
                    <EventIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>

                  {/* Activity Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                          {badge.label}
                        </span>
                        {event.subjectName && (
                          <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {event.subjectName}
                          </span>
                        )}
                        <h4 className="text-sm sm:text-base font-bold text-slate-900">
                          {event.title}
                        </h4>
                      </div>

                      <span className="text-xs text-slate-400 whitespace-nowrap font-medium">
                        {event.formattedTime}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
                      {event.description}
                    </p>

                    {/* Metadata attributes badges */}
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-slate-50">
                        {event.metadata.score !== undefined && (
                          <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md border border-emerald-100">
                            <Award className="w-3.5 h-3.5" />
                            Score: {event.metadata.score}%
                          </span>
                        )}
                        {event.metadata.durationMinutes !== undefined && (
                          <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-md border border-indigo-100">
                            <Clock className="w-3.5 h-3.5" />
                            Duration: {event.metadata.durationMinutes} min
                          </span>
                        )}
                        {event.metadata.cardsStudied !== undefined && (
                          <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-md border border-amber-100">
                            <Flame className="w-3.5 h-3.5" />
                            Cards: {event.metadata.cardsStudied}
                          </span>
                        )}
                        {event.metadata.rating && (
                          <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-md border border-purple-100">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Result: {event.metadata.rating}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-end mt-3">
                      <Link
                        to={badge.actionLink}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors group-hover:translate-x-0.5 duration-150"
                      >
                        <span>{badge.actionText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
