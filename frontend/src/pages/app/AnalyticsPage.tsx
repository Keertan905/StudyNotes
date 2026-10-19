import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  BookOpen,
  Sparkles,
  AlertTriangle,
  Flame,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  ChevronRight,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { analyticsService } from '../../services/analytics.service';
import type { AnalyticsOverview, ReadinessScore } from '../../services/analytics.service';

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const overview = await analyticsService.getOverview();
      setData(overview);
    } catch {
      toast.error('Failed to load readiness analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: ReadinessScore['readinessStatus']) => {
    switch (status) {
      case 'EXEMPLARY':
        return { label: 'Exemplary Readiness', bg: 'bg-emerald-500 text-white', ring: 'border-emerald-200' };
      case 'READY':
        return { label: 'Exam Ready', bg: 'bg-indigo-600 text-white', ring: 'border-indigo-200' };
      case 'DEVELOPING':
        return { label: 'Developing Readiness', bg: 'bg-amber-500 text-white', ring: 'border-amber-200' };
      case 'CRITICAL':
      default:
        return { label: 'Critical Gap Attention', bg: 'bg-rose-600 text-white', ring: 'border-rose-200' };
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        <div className="h-20 bg-slate-100 rounded-3xl animate-pulse" />
        <div className="h-72 bg-slate-100 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-60 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Analytics Data Unavailable</h2>
        <p className="text-sm text-slate-500">Could not retrieve readiness metrics. Please check your network connection.</p>
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const { readiness } = data;
  const statusConfig = getStatusBadge(readiness.readinessStatus);

  // SVG Gauge calculations
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (readiness.overallReadiness / 100) * circumference;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Phase 6
            </span>
            <span className="text-xs text-slate-400 font-medium">Diagnostic Insights</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-indigo-600" />
            Readiness Score & Progress Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Algorithmic composite evaluation tracking syllabus depth, mock exam diagnostics, SM-2 retention, and error remediation.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium text-sm shadow-xs hover:bg-slate-50 transition-all self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          Refresh Metrics
        </button>
      </div>

      {/* SECTION 1: THE EXECUTIVE READINESS SCORECARD */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Circular Gauge */}
          <div className="lg:col-span-4 flex flex-col items-center text-center">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-white/10 fill-none"
                />
                <circle
                  cx="88"
                  cy="88"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="text-emerald-400 fill-none transition-all duration-1000 ease-out"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black tracking-tight text-white">
                  {readiness.overallReadiness}%
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  Readiness Score
                </span>
              </div>
            </div>

            <div className="mt-3">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${statusConfig.bg}`}>
                {statusConfig.label}
              </span>
            </div>

            {readiness.daysToNearestExam !== undefined && readiness.daysToNearestExam !== null && (
              <p className="text-xs text-indigo-200 mt-2 font-medium">
                🎯 {readiness.nearestExamTitle || 'Upcoming Exam'} in{' '}
                <strong className="text-white">{readiness.daysToNearestExam} Days</strong>
              </p>
            )}
          </div>

          {/* 5 Weighted Pillars */}
          <div className="lg:col-span-8 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">5 Weighted Readiness Pillars</h3>
              <p className="text-xs text-indigo-200 leading-relaxed mt-0.5">
                {readiness.statusDescription}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Pillar 1 */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="flex justify-between items-center font-medium">
                  <span className="text-indigo-200 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    Syllabus Coverage (25%)
                  </span>
                  <span className="font-bold text-white">{readiness.syllabusCoverageScore}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-400 rounded-full transition-all"
                    style={{ width: `${readiness.syllabusCoverageScore}%` }}
                  />
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="flex justify-between items-center font-medium">
                  <span className="text-indigo-200 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                    Quiz Diagnostics (30%)
                  </span>
                  <span className="font-bold text-white">{readiness.quizAccuracyScore}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all"
                    style={{ width: `${readiness.quizAccuracyScore}%` }}
                  />
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="flex justify-between items-center font-medium">
                  <span className="text-indigo-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    SM-2 Retention (20%)
                  </span>
                  <span className="font-bold text-white">{readiness.flashcardMasteryScore}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${readiness.flashcardMasteryScore}%` }}
                  />
                </div>
              </div>

              {/* Pillar 4 */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="flex justify-between items-center font-medium">
                  <span className="text-indigo-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Mistake Resolution (15%)
                  </span>
                  <span className="font-bold text-white">{readiness.mistakeResolutionScore}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-400 rounded-full transition-all"
                    style={{ width: `${readiness.mistakeResolutionScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Pillar 5 & Consistency */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <span className="text-indigo-200 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                Study Consistency & Velocity (10%):
              </span>
              <div className="flex items-center gap-3">
                <span className="font-bold text-amber-300">{data.currentStreakDays} Day Streak 🔥</span>
                <span className="font-bold text-white">{readiness.consistencyScore}% score</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Prescriptive Recommendations Banner */}
        {readiness.keyRecommendations && readiness.keyRecommendations.length > 0 && (
          <div className="mt-6 pt-5 border-t border-white/10 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 block mb-2">
              💡 Actionable Recommendations to Boost Score (+5 to +15%):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-indigo-100">
              {readiness.keyRecommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: SUBJECT-BY-SUBJECT READINESS BREAKDOWN */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Subject Diagnostics Matrix
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {readiness.subjectBreakdowns.length} Enrolled Courses
          </span>
        </div>

        {readiness.subjectBreakdowns.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
            <p className="text-sm text-slate-600 font-medium">No subjects found in syllabus engine.</p>
            <button
              onClick={() => navigate('/subjects')}
              className="text-xs text-indigo-600 hover:underline font-semibold"
            >
              Go to Subjects & Syllabus &rarr;
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readiness.subjectBreakdowns.map((sub) => {
              const subStatus = getStatusBadge(sub.status as any);

              return (
                <div
                  key={sub.subjectId}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                        {sub.subjectCode || 'SUBJECT'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${subStatus.bg}`}>
                        {sub.readinessScore}% Ready
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-800 text-base line-clamp-1">{sub.subjectName}</h3>

                    {/* Mini metrics bar */}
                    <div className="space-y-2 pt-2 text-xs">
                      <div>
                        <div className="flex justify-between text-slate-500 mb-1">
                          <span>Syllabus Covered</span>
                          <strong className="text-slate-700">
                            {sub.completedTopics} / {sub.totalTopics} ({sub.syllabusCoveragePercent}%)
                          </strong>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ width: `${sub.syllabusCoveragePercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">Quiz Acc.</span>
                          <span className="text-xs font-bold text-slate-800">{sub.quizAccuracyPercent}%</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">Cards Mastered</span>
                          <span className="text-xs font-bold text-emerald-600">
                            {sub.masteredFlashcards} / {sub.totalFlashcards}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">Open Errors</span>
                          <span className={`text-xs font-bold ${sub.unresolvedMistakes > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                            {sub.unresolvedMistakes}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">
                      {sub.daysToExam !== null && sub.daysToExam !== undefined
                        ? `Exam in ${sub.daysToExam} Days`
                        : 'No Target Exam Set'}
                    </span>
                    <button
                      onClick={() => navigate('/quiz')}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1"
                    >
                      Practice
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 3: STUDY FOCUS TIME & VELOCITY */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Past 7 Days History Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Velocity Tracker</span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">Study Focus Minutes (Past 7 Days)</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Total Week: <strong>{data.thisWeekStudyMinutes} mins</strong>
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-6 px-2 border-b border-slate-100">
            {data.studyTimeHistory.map((point) => {
              const maxMinutes = Math.max(60, ...data.studyTimeHistory.map((p) => p.studyMinutes));
              const heightPercent = Math.max(8, (point.studyMinutes / maxMinutes) * 100);

              return (
                <div key={point.date} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                    {point.studyMinutes}m
                  </div>
                  <div className="w-full max-w-[36px] bg-slate-100 rounded-t-xl overflow-hidden h-28 flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-indigo-600 to-violet-500 rounded-t-xl transition-all duration-500"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">{point.dayOfWeek}</span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2 text-center text-xs">
            <div>
              <span className="text-slate-400 block">Today's Focus</span>
              <strong className="text-base text-slate-800">{data.todayStudyMinutes} mins</strong>
            </div>
            <div>
              <span className="text-slate-400 block">All-Time Total</span>
              <strong className="text-base text-slate-800">
                {Math.round(data.totalStudyMinutes / 60)} hrs ({data.totalStudyMinutes}m)
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">Consistency Streak</span>
              <strong className="text-base text-amber-600 font-extrabold flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                {data.currentStreakDays} Days
              </strong>
            </div>
          </div>
        </div>

        {/* Spaced Repetition & Mistake Stats */}
        <div className="space-y-6">
          {/* SM-2 Spaced Repetition Health */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                SM-2 Retention Health
              </h4>
              <span className="text-xs font-semibold text-emerald-600">
                {data.cardsMastered} / {data.totalFlashcards} Mastered
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
                <span className="text-[10px] text-rose-500 block font-bold">Again</span>
                <strong className="text-xs text-rose-700">{data.ratingDistribution['AGAIN'] || 0}</strong>
              </div>
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">
                <span className="text-[10px] text-amber-500 block font-bold">Hard</span>
                <strong className="text-xs text-amber-700">{data.ratingDistribution['HARD'] || 0}</strong>
              </div>
              <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
                <span className="text-[10px] text-blue-500 block font-bold">Good</span>
                <strong className="text-xs text-blue-700">{data.ratingDistribution['GOOD'] || 0}</strong>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-[10px] text-emerald-500 block font-bold">Easy</span>
                <strong className="text-xs text-emerald-700">{data.ratingDistribution['EASY'] || 0}</strong>
              </div>
            </div>

            {data.cardsOverdue > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-100 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{data.cardsOverdue} flashcards due for review today.</span>
              </p>
            )}
          </div>

          {/* Mistake Intelligence Velocity */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Mistake Clearance Rate
              </h4>
              <span className="text-xs font-bold text-slate-800">{data.mistakeResolutionRate}% Cleared</span>
            </div>

            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-emerald-500 rounded-full"
                style={{ width: `${data.mistakeResolutionRate}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-slate-500 pt-1">
              <span>{data.mistakesMastered} Errors Mastered</span>
              <span className="text-rose-600 font-semibold">{data.unresolvedMistakes} Open Errors</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: RECENT QUIZ DIAGNOSTIC SESSIONS */}
      <section className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Quiz History</span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">Recent Diagnostic Test Sessions</h3>
          </div>
          <span className="text-xs text-slate-500">
            Average Score: <strong className="text-slate-800">{data.overallAverageScore}%</strong>
          </span>
        </div>

        {data.recentQuizPerformances.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No quiz attempts recorded yet. Practice tests will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Assessment Title</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3">Percentage</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentQuizPerformances.map((qp) => (
                  <tr key={qp.attemptId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-semibold text-slate-800">{qp.quizTitle}</td>
                    <td className="py-3 text-slate-500">{qp.completedDate}</td>
                    <td className="py-3 font-medium text-slate-700">{qp.score} pts</td>
                    <td className="py-3 font-bold text-slate-900">{qp.percentage}%</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        qp.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {qp.passed ? 'PASSED' : 'RETEST'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => navigate('/quiz')}
                        className="text-indigo-600 hover:text-indigo-700 font-semibold"
                      >
                        Review &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
