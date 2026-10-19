import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  Trash2,
  Brain,
  Lightbulb,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Check,
  Send,
} from 'lucide-react';
import {
  mistakeService,
  type MistakeRecord,
  type MistakeStats,
  type MistakeCategory,
  type MistakeStatus,
} from '../../services/mistake.service';
import { subjectService, type SubjectItem } from '../../services/subject.service';
import toast from 'react-hot-toast';

const CATEGORY_CONFIG: Record<
  MistakeCategory,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  CONCEPTUAL_GAP: {
    label: 'Conceptual Gap',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    desc: 'Core principle misunderstanding',
  },
  CALCULATION_ERROR: {
    label: 'Calculation Error',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    desc: 'Arithmetic or formula execution error',
  },
  MISREAD_QUESTION: {
    label: 'Misread Question',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    desc: 'Overlooked qualifier or constraint',
  },
  MEMORY_LAPSE: {
    label: 'Memory Lapse',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
    desc: 'Recall failure of term or formula',
  },
};

export default function MistakesPage() {
  const navigate = useNavigate();

  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [stats, setStats] = useState<MistakeStats | null>(null);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | MistakeStatus>('UNRESOLVED');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | MistakeCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Retake State per Mistake Card
  const [retakeActiveId, setRetakeActiveId] = useState<number | null>(null);
  const [retakeInput, setRetakeInput] = useState<Record<number, string>>({});
  const [isSubmittingRetake, setIsSubmittingRetake] = useState<number | null>(null);
  const [retakeFeedback, setRetakeFeedback] = useState<Record<number, { isCorrect: boolean; message: string }>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [list, statsData, subs] = await Promise.all([
        mistakeService.getMistakes(),
        mistakeService.getStats(),
        subjectService.getSubjects(),
      ]);
      setMistakes(list);
      setStats(statsData);
      setSubjects(subs);
    } catch {
      toast.error('Failed to load mistake notebook');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered Mistakes
  const filteredMistakes = mistakes.filter((m) => {
    const matchesStatus = statusFilter === 'ALL' ? true : m.status === statusFilter;
    const matchesSubject = selectedSubjectId === 'ALL' ? true : m.subjectId === selectedSubjectId;
    const matchesCategory = categoryFilter === 'ALL' ? true : m.mistakeCategory === categoryFilter;
    const matchesSearch =
      m.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.topicTag && m.topicTag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.aiRootCause && m.aiRootCause.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSubject && matchesCategory && matchesSearch;
  });

  const handleRetakeSubmit = async (mistake: MistakeRecord) => {
    const answer = retakeInput[mistake.id];
    if (!answer || !answer.trim()) {
      toast.error('Please choose or enter your answer first');
      return;
    }

    try {
      setIsSubmittingRetake(mistake.id);
      const res = await mistakeService.retryMistake(mistake.id, answer);

      setRetakeFeedback((prev) => ({
        ...prev,
        [mistake.id]: { isCorrect: res.isCorrect, message: res.feedback },
      }));

      if (res.isCorrect) {
        toast.success('Awesome! Misconception cleared and resolved!');
        // Update local list status
        setMistakes((prev) =>
          prev.map((m) =>
            m.id === mistake.id
              ? { ...m, status: 'RESOLVED', retryCount: res.retryCount, resolvedAt: res.resolvedAt }
              : m
          )
        );
        // Refresh stats
        const newStats = await mistakeService.getStats();
        setStats(newStats);
      } else {
        toast.error('Not quite correct. Try reviewing the tip!');
      }
    } catch {
      toast.error('Failed to submit re-attempt');
    } finally {
      setIsSubmittingRetake(null);
    }
  };

  const handleToggleStatus = async (mistake: MistakeRecord) => {
    const nextStatus: MistakeStatus = mistake.status === 'RESOLVED' ? 'UNRESOLVED' : 'RESOLVED';
    try {
      const updated = await mistakeService.updateStatus(mistake.id, nextStatus);
      setMistakes((prev) => prev.map((m) => (m.id === mistake.id ? updated : m)));
      toast.success(`Marked as ${nextStatus.toLowerCase()}`);
      const newStats = await mistakeService.getStats();
      setStats(newStats);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this mistake from your notebook?')) return;
    try {
      await mistakeService.deleteMistake(id);
      setMistakes((prev) => prev.filter((m) => m.id !== id));
      toast.success('Mistake removed');
      const newStats = await mistakeService.getStats();
      setStats(newStats);
    } catch {
      toast.error('Failed to delete mistake record');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh]">
        <Loader2 className="w-10 h-10 text-rose-600 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-slate-800">Loading Mistake Intelligence Notebook...</h3>
        <p className="text-sm text-slate-500 mt-1">Cataloging exam errors & AI diagnosis data</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 uppercase tracking-wider">
              Mistake Intelligence Engine
            </span>
            <span className="text-xs text-slate-400 font-medium">Phase 5</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-rose-600" />
            Mistake Notebook & AI Root Cause
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Automatically tracks every missed quiz question, pinpoints your exact conceptual misconceptions, and lets you re-attempt until 100% mastered.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            Sync Mistakes
          </button>
          <button
            onClick={() => navigate('/knowledge-gaps')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition"
          >
            <Brain className="w-4 h-4" />
            Knowledge Gap Matrix
          </button>
        </div>
      </div>

      {/* Top Mistake KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Mistakes</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-slate-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.totalMistakes ?? 0}</div>
          <p className="text-xs text-slate-500 mt-2">Recorded across all completed quiz attempts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-sm bg-gradient-to-br from-rose-50/40 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Active Misconceptions</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700">{stats?.unresolvedCount ?? 0}</div>
          <p className="text-xs text-rose-600 mt-2 font-medium">Require active re-attempts before exam</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-sm bg-gradient-to-br from-emerald-50/40 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Resolved Misconceptions</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">{stats?.resolvedCount ?? 0}</div>
          <p className="text-xs text-emerald-600 mt-2 font-medium">Successfully re-attempted and mastered</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-indigo-200/80 shadow-sm bg-gradient-to-br from-indigo-50/40 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Resolution Rate</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-700">{stats?.resolutionRatePercentage ?? 0}%</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${stats?.resolutionRatePercentage ?? 0}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">Target &ge; 85% before major university finals</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
              <Filter className="w-3.5 h-3.5" />
              Filter:
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(
                [
                  { id: 'UNRESOLVED', label: 'Unresolved' },
                  { id: 'RESOLVED', label: 'Resolved' },
                  { id: 'ALL', label: 'All Mistakes' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                    statusFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Subject Dropdown */}
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="ALL">All Mistake Categories</option>
              <option value="CONCEPTUAL_GAP">Conceptual Gap</option>
              <option value="CALCULATION_ERROR">Calculation Error</option>
              <option value="MISREAD_QUESTION">Misread Question</option>
              <option value="MEMORY_LAPSE">Memory Lapse</option>
            </select>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search mistake, topic, or tip..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Mistake Cards List */}
      <div className="space-y-5">
        {filteredMistakes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {statusFilter === 'UNRESOLVED' ? 'Inbox Zero: No Active Misconceptions!' : 'No Mistakes Found'}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              {statusFilter === 'UNRESOLVED'
                ? 'All exam errors in this view have been resolved. Excellent work! Keep practicing to uncover new blind spots.'
                : 'Try adjusting your subject or status filters to view previous entries.'}
            </p>
            <button
              onClick={() => navigate('/quiz')}
              className="mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm"
            >
              Take a Practice Quiz
            </button>
          </div>
        ) : (
          filteredMistakes.map((mistake) => {
            const catInfo = CATEGORY_CONFIG[mistake.mistakeCategory] || CATEGORY_CONFIG.CONCEPTUAL_GAP;
            const isResolved = mistake.status === 'RESOLVED';
            const isRetaking = retakeActiveId === mistake.id;
            const feedback = retakeFeedback[mistake.id];

            return (
              <div
                key={mistake.id}
                className={`bg-white rounded-2xl border transition shadow-sm overflow-hidden ${
                  isResolved
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : 'border-slate-200/90 hover:border-rose-200'
                }`}
              >
                {/* Mistake Card Header */}
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                      {mistake.subjectName}
                    </span>

                    {mistake.topicTag && (
                      <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                        {mistake.topicTag}
                      </span>
                    )}

                    {/* Category Badge */}
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${catInfo.bg} ${catInfo.text} ${catInfo.border}`}
                    >
                      {catInfo.label}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isResolved ? (
                        <>
                          <Check className="w-3 h-3" /> Resolved
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" /> Unresolved
                        </>
                      )}
                    </span>

                    {mistake.retryCount > 0 && (
                      <span className="text-[11px] text-slate-400 font-medium">
                        Retried {mistake.retryCount}x
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(mistake)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                        isResolved
                          ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {isResolved ? 'Mark Unresolved' : 'Mark as Resolved'}
                    </button>
                    <button
                      onClick={() => handleDelete(mistake.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Remove from notebook"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 sm:p-6 space-y-5">
                  {/* Question Stem */}
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
                      {mistake.questionText}
                    </h3>
                  </div>

                  {/* Student vs. Correct Answer Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 uppercase tracking-wider">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        Your Submitted Answer
                      </div>
                      <div className="font-semibold text-rose-950 text-sm">
                        {mistake.submittedAnswer || '(Left Blank / Unanswered)'}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Correct Expected Answer
                      </div>
                      <div className="font-semibold text-emerald-950 text-sm">
                        {mistake.correctAnswer}
                      </div>
                    </div>
                  </div>

                  {/* AI Root Cause & Revision Tip Box */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-slate-50 border border-indigo-100/90 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                        AI Misconception Analysis & Exam Tip
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-700 block mb-1">
                          Why this error occurred:
                        </span>
                        <p className="text-slate-600 leading-relaxed">
                          {mistake.aiRootCause ||
                            mistake.explanation ||
                            'Confusion between fundamental concept constraints.'}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-indigo-950 block mb-1 flex items-center gap-1">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          Actionable Exam Rule:
                        </span>
                        <p className="text-indigo-900 font-medium leading-relaxed bg-white/70 p-2.5 rounded-xl border border-indigo-100">
                          {mistake.aiRevisionTip ||
                            'Review the technical definition and contrast with related distractors.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Active Re-attempt Section */}
                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() =>
                          setRetakeActiveId(isRetaking ? null : mistake.id)
                        }
                        className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {isRetaking ? 'Hide Re-attempt Drawer' : 'Re-attempt Question Now to Master It'}
                        {isRetaking ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            navigate(
                              `/tutor?prompt=${encodeURIComponent(
                                `Can you explain the concept behind this exam question and help me resolve my misconception?\nQuestion: ${mistake.questionText}\nCorrect Answer: ${mistake.correctAnswer}`
                              )}`
                            )
                          }
                          className="text-xs text-slate-500 hover:text-indigo-600 transition flex items-center gap-1"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          Ask AI Tutor
                        </button>
                      </div>
                    </div>

                    {/* Expandable Retake Form */}
                    {isRetaking && (
                      <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Select or type the correct answer without looking:
                        </div>

                        {/* Options if available */}
                        {mistake.options && mistake.options.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {mistake.options.map((opt, optIdx) => {
                              const isSelected = retakeInput[mistake.id] === opt;
                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  onClick={() =>
                                    setRetakeInput((prev) => ({
                                      ...prev,
                                      [mistake.id]: opt,
                                    }))
                                  }
                                  className={`p-3 text-left rounded-xl text-xs font-medium border transition ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                      : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <input
                            type="text"
                            placeholder="Type your corrected answer..."
                            value={retakeInput[mistake.id] || ''}
                            onChange={(e) =>
                              setRetakeInput((prev) => ({
                                ...prev,
                                [mistake.id]: e.target.value,
                              }))
                            }
                            className="w-full text-xs p-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                          />
                        )}

                        <div className="flex items-center justify-between gap-3 pt-1">
                          <button
                            onClick={() => handleRetakeSubmit(mistake)}
                            disabled={isSubmittingRetake === mistake.id}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50"
                          >
                            {isSubmittingRetake === mistake.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            Submit Retake
                          </button>

                          {feedback && (
                            <div
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                                feedback.isCorrect
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {feedback.isCorrect ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-600" />
                              )}
                              <span>{feedback.message}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
