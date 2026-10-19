import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  BookOpen,
  HelpCircle,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import {
  knowledgeGapService,
  type KnowledgeGapResponse,
  type TopicGapItem,
  type SubjectGapSummary,
} from '../../services/knowledgeGap.service';
import {
  recommendationService,
  type RecommendationResponse,
} from '../../services/recommendation.service';
import toast from 'react-hot-toast';

export default function KnowledgeGapsPage() {
  const navigate = useNavigate();

  const [gapData, setGapData] = useState<KnowledgeGapResponse | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | 'ALL'>('ALL');
  const [masteryFilter, setMasteryFilter] = useState<'ALL' | 'WEAK' | 'MODERATE' | 'STRONG' | 'DECAY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [gaps, recs] = await Promise.all([
        knowledgeGapService.getKnowledgeGaps(),
        recommendationService.getAdaptiveRecommendations(),
      ]);
      setGapData(gaps);
      setRecommendations(recs);
    } catch {
      toast.error('Failed to load knowledge gap diagnostics');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter topics for the matrix
  const getFilteredTopics = (topics: TopicGapItem[]) => {
    return topics.filter((t) => {
      const matchesSearch =
        t.topicTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subjectName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMastery =
        masteryFilter === 'ALL'
          ? true
          : masteryFilter === 'DECAY'
          ? t.decayRisk === 'HIGH'
          : t.masteryLevel === masteryFilter;

      return matchesSearch && matchesMastery;
    });
  };

  const getFilteredSubjects = (): SubjectGapSummary[] => {
    if (!gapData) return [];
    let list = gapData.subjects;
    if (selectedSubjectId !== 'ALL') {
      list = list.filter((s) => s.subjectId === selectedSubjectId);
    }
    return list;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh]">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-slate-800">Analyzing Your Knowledge Matrix...</h3>
        <p className="text-sm text-slate-500 mt-1">Evaluating quiz attempts, SM-2 decay timestamps & error patterns</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 uppercase tracking-wider">
              Diagnostic Intelligence
            </span>
            <span className="text-xs text-slate-400 font-medium">Phase 5</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Brain className="w-8 h-8 text-indigo-600" />
            Knowledge Gap Detector
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Real-time mastery matrix, concept weakness diagnosis, and memory decay alerts across all your enrolled subjects.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            Refresh Diagnostics
          </button>
          <button
            onClick={() => navigate('/mistakes')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition"
          >
            <ShieldAlert className="w-4 h-4" />
            Mistake Notebook
          </button>
        </div>
      </div>

      {/* Top Diagnostic KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Accuracy</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{gapData?.overallAccuracy ?? 0}%</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${gapData?.overallAccuracy ?? 0}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">Across {gapData?.totalTopicsAssessed ?? 0} assessed curriculum topics</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-sm hover:shadow-md transition bg-gradient-to-br from-rose-50/30 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Critical Weak Spots</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700">{gapData?.criticalWeakAreas ?? 0}</div>
          <p className="text-xs text-rose-600 mt-2 font-medium">Accuracy &lt; 60% — High exam hazard</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-sm hover:shadow-md transition bg-gradient-to-br from-amber-50/30 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Memory Decay Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700">{gapData?.decayAlertsCount ?? 0}</div>
          <p className="text-xs text-amber-600 mt-2 font-medium">&gt;7 days unreviewed • Spaced recall needed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-sm hover:shadow-md transition bg-gradient-to-br from-emerald-50/30 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Mastered Topics</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">{gapData?.masteredAreas ?? 0}</div>
          <p className="text-xs text-emerald-600 mt-2 font-medium">&ge; 80% accuracy benchmark maintained</p>
        </div>
      </div>

      {/* Adaptive Study Recommendations Deck */}
      {recommendations && recommendations.items.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-violet-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur border border-white/15 text-indigo-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Adaptive Study Engine
              </div>
              <span className="text-xs text-indigo-300 font-medium">Updated automatically based on your mastery curves</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
              {recommendations.studentHeadline}
            </h2>
            <p className="text-sm text-indigo-200/90 max-w-3xl mb-6">
              {recommendations.aiAdvisory}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.items.map((item) => {
                const isCritical = item.priority === 'CRITICAL';
                return (
                  <div
                    key={item.id}
                    className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-5 border border-white/10 transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isCritical
                              ? 'bg-rose-500/80 text-white shadow-sm'
                              : 'bg-amber-400/80 text-slate-950 font-semibold'
                          }`}
                        >
                          {item.priority}
                        </span>
                        <span className="text-xs text-indigo-200 font-medium truncate max-w-[140px]">
                          {item.subjectName}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-white group-hover:text-indigo-200 transition">
                        {item.title}
                      </h3>
                      <p className="text-xs text-indigo-100/80 mt-1.5 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="mt-3 p-2.5 rounded-xl bg-black/20 text-xs text-indigo-200/90 border border-white/5 flex items-start gap-2">
                        <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="italic leading-snug">{item.reason}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(item.actionUrl)}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white text-slate-900 font-semibold text-xs hover:bg-indigo-50 transition shadow-sm"
                    >
                      <span>{item.buttonText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar for Topic Matrix */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
              <Filter className="w-3.5 h-3.5" />
              Filter By:
            </div>

            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Subjects</option>
              {gapData?.subjects.map((s) => (
                <option key={s.subjectId} value={s.subjectId}>
                  {s.subjectName}
                </option>
              ))}
            </select>

            {/* Mastery Level Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(
                [
                  { id: 'ALL', label: 'All' },
                  { id: 'WEAK', label: 'Weak (<60%)' },
                  { id: 'MODERATE', label: 'Moderate' },
                  { id: 'STRONG', label: 'Mastered (>80%)' },
                  { id: 'DECAY', label: 'Decaying (7d+)' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMasteryFilter(tab.id)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition ${
                    masteryFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search topic or concept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Knowledge Gap Matrix - Grouped By Subject */}
      <div className="space-y-6">
        {getFilteredSubjects().map((subject) => {
          const visibleTopics = getFilteredTopics(subject.topics);
          if (visibleTopics.length === 0) return null;

          return (
            <div
              key={subject.subjectId}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
            >
              {/* Subject Group Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{subject.subjectName}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>{subject.topicsCount} Curriculum Topics</span>
                    <span>•</span>
                    <span className="font-medium text-slate-700">
                      Average Accuracy: {subject.averageAccuracy}%
                    </span>
                    <span>•</span>
                    <span className="text-rose-600 font-medium">
                      {subject.weakTopicsCount} Weak Spots
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      navigate(
                        `/quiz?subjectId=${subject.subjectId}&subjectName=${encodeURIComponent(
                          subject.subjectName
                        )}`
                      )
                    }
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    Generate Diagnostic Quiz
                  </button>
                </div>
              </div>

              {/* Topics Grid */}
              <div className="divide-y divide-slate-100">
                {visibleTopics.map((topic, idx) => {
                  const isWeak = topic.masteryLevel === 'WEAK';
                  const isStrong = topic.masteryLevel === 'STRONG';
                  const isDecaying = topic.decayRisk === 'HIGH';

                  return (
                    <div
                      key={idx}
                      className="p-4 sm:p-5 hover:bg-slate-50/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm">{topic.topicTag}</h4>

                          {/* Mastery Badge */}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isWeak
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : isStrong
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-100 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isWeak ? 'Weak (<60%)' : isStrong ? 'Mastered' : 'Moderate'}
                          </span>

                          {/* Decay Warning */}
                          {isDecaying && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-500" />
                              Decay Hazard ({topic.daysSinceLastPracticed}d ago)
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500">
                          {topic.recommendedAction}
                        </p>
                      </div>

                      {/* Performance Bar & Actions */}
                      <div className="flex items-center gap-6 shrink-0">
                        <div className="w-36 text-right">
                          <div className="flex items-center justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-400 font-normal">Accuracy</span>
                            <span
                              className={
                                isWeak
                                  ? 'text-rose-600 font-bold'
                                  : isStrong
                                  ? 'text-emerald-600 font-bold'
                                  : 'text-amber-600 font-bold'
                              }
                            >
                              {topic.accuracyPercentage}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${
                                isWeak
                                  ? 'bg-rose-500'
                                  : isStrong
                                  ? 'bg-emerald-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.max(5, topic.accuracyPercentage)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {topic.correctAnswers} / {topic.totalQuestionsAttempted} answered correct
                          </span>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/quiz?topic=${encodeURIComponent(
                                  topic.topicTag
                                )}&subjectName=${encodeURIComponent(subject.subjectName)}`
                              )
                            }
                            className="p-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5"
                            title="Start Quiz Drill on this Topic"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="hidden sm:inline">Practice</span>
                          </button>

                          <button
                            onClick={() =>
                              navigate(
                                `/tutor?topic=${encodeURIComponent(
                                  topic.topicTag
                                )}&subjectName=${encodeURIComponent(subject.subjectName)}`
                              )
                            }
                            className="p-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5"
                            title="Ask AI Tutor to Explain this Topic"
                          >
                            <HelpCircle className="w-3.5 h-3.5 text-violet-600" />
                            <span className="hidden sm:inline">Ask Tutor</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
