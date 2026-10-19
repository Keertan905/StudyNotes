import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  ArrowRight,
  Target,
  AlertTriangle,
  BookOpen,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Edit2,
  X,
  RefreshCw,
  MapPin,
  CalendarDays
} from 'lucide-react';
import toast from 'react-hot-toast';
import { plannerService } from '../../services/planner.service';
import type { 
  ExamTarget, 
  StudyPlanItem, 
  CreateExamRequest, 
  CreatePlanItemRequest,
  GeneratePlanRequest 
} from '../../services/planner.service';
import { subjectService } from '../../services/subject.service';
import type { SubjectItem } from '../../services/subject.service';

const colorThemes: Record<string, { bg: string; border: string; text: string; gradient: string; lightBg: string }> = {
  indigo: { bg: 'bg-indigo-600', border: 'border-indigo-200', text: 'text-indigo-600', gradient: 'from-indigo-600 to-indigo-800', lightBg: 'bg-indigo-50' },
  rose: { bg: 'bg-rose-600', border: 'border-rose-200', text: 'text-rose-600', gradient: 'from-rose-500 to-rose-700', lightBg: 'bg-rose-50' },
  emerald: { bg: 'bg-emerald-600', border: 'border-emerald-200', text: 'text-emerald-600', gradient: 'from-emerald-500 to-teal-700', lightBg: 'bg-emerald-50' },
  amber: { bg: 'bg-amber-600', border: 'border-amber-200', text: 'text-amber-600', gradient: 'from-amber-500 to-amber-700', lightBg: 'bg-amber-50' },
  purple: { bg: 'bg-purple-600', border: 'border-purple-200', text: 'text-purple-600', gradient: 'from-purple-600 to-violet-800', lightBg: 'bg-purple-50' },
  sky: { bg: 'bg-sky-600', border: 'border-sky-200', text: 'text-sky-600', gradient: 'from-sky-500 to-blue-700', lightBg: 'bg-sky-50' },
};

const activityTypeConfig: Record<string, { label: string; icon: any; color: string; badgeBg: string }> = {
  CONCEPT_STUDY: { label: 'Concept Study', icon: BookOpen, color: 'text-indigo-600', badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  PRACTICE_QUIZ: { label: 'Practice Quiz', icon: HelpCircle, color: 'text-emerald-600', badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  FLASHCARD_REVIEW: { label: 'Flashcard SM-2', icon: Sparkles, color: 'text-amber-600', badgeBg: 'bg-amber-50 border-amber-200 text-amber-700' },
  MISTAKE_CORRECTION: { label: 'Mistake Drill', icon: AlertTriangle, color: 'text-rose-600', badgeBg: 'bg-rose-50 border-rose-200 text-rose-700' },
  MOCK_EXAM: { label: 'Mock Exam', icon: Target, color: 'text-purple-600', badgeBg: 'bg-purple-50 border-purple-200 text-purple-700' },
};

export default function PlannerPage() {
  const navigate = useNavigate();

  // State
  const [exams, setExams] = useState<ExamTarget[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dailyPlan, setDailyPlan] = useState<{
    date: string;
    totalItems: number;
    completedItems: number;
    totalEstimatedMinutes: number;
    completedMinutes: number;
    completionPercentage: number;
    items: StudyPlanItem[];
  }>({
    date: selectedDate,
    totalItems: 0,
    completedItems: 0,
    totalEstimatedMinutes: 0,
    completedMinutes: 0,
    completionPercentage: 0,
    items: [],
  });

  const [isLoadingExams, setIsLoadingExams] = useState(true);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);

  // Modals
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamTarget | null>(null);
  const [examForm, setExamForm] = useState<CreateExamRequest>({
    title: '',
    examDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    targetScore: 85,
    priority: 'HIGH',
    location: '',
    notes: '',
    color: 'indigo',
    subjectId: undefined,
  });

  const [isPlanItemModalOpen, setIsPlanItemModalOpen] = useState(false);
  const [planItemForm, setPlanItemForm] = useState<CreatePlanItemRequest>({
    title: '',
    planDate: selectedDate,
    timeSlot: '10:00 - 10:45',
    activityType: 'CONCEPT_STUDY',
    estimatedMinutes: 45,
    priority: 'MEDIUM',
    actionRoute: '/notes',
    aiReasoning: '',
    subjectId: undefined,
  });

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiForm, setAiForm] = useState<GeneratePlanRequest>({
    startDate: selectedDate,
    daysCount: 3,
    dailyAvailableHours: 3,
    prioritizeWeakTopics: true,
    includeMistakes: true,
    includeFlashcards: true,
    addRestIntervals: true,
  });

  useEffect(() => {
    loadSubjects();
    loadExams();
  }, []);

  useEffect(() => {
    loadDailyPlan(selectedDate);
  }, [selectedDate]);

  const loadSubjects = async () => {
    try {
      const data = await subjectService.getSubjects();
      setSubjects(data);
    } catch {
      // Ignore
    }
  };

  const loadExams = async () => {
    setIsLoadingExams(true);
    try {
      const data = await plannerService.getExams();
      setExams(data);
    } catch {
      toast.error('Failed to load target exams');
    } finally {
      setIsLoadingExams(false);
    }
  };

  const loadDailyPlan = async (date: string) => {
    setIsLoadingPlan(true);
    try {
      const data = await plannerService.getDailyPlan(date);
      setDailyPlan(data);
    } catch {
      toast.error('Failed to load study timetable');
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const handleCreateOrUpdateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.title.trim()) {
      toast.error('Please enter an exam title');
      return;
    }
    try {
      if (editingExam) {
        await plannerService.updateExam(editingExam.id, examForm);
        toast.success('Exam target updated successfully');
      } else {
        await plannerService.createExam(examForm);
        toast.success('New exam countdown created!');
      }
      setIsExamModalOpen(false);
      setEditingExam(null);
      loadExams();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save exam target');
    }
  };

  const handleDeleteExam = async (id: number) => {
    if (!confirm('Are you sure you want to remove this target exam?')) return;
    try {
      await plannerService.deleteExam(id);
      toast.success('Exam removed');
      loadExams();
    } catch {
      toast.error('Failed to delete exam');
    }
  };

  const handleToggleExamStatus = async (id: number) => {
    try {
      await plannerService.toggleExamStatus(id);
      loadExams();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleTogglePlanItem = async (id: number) => {
    try {
      const updated = await plannerService.togglePlanItemCompleted(id);
      setDailyPlan((prev) => {
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
        toast.success('Block completed! Keep up the momentum! 🔥');
      }
    } catch {
      toast.error('Failed to toggle block status');
    }
  };

  const handleDeletePlanItem = async (id: number) => {
    try {
      await plannerService.deletePlanItem(id);
      loadDailyPlan(selectedDate);
      toast.success('Study block deleted');
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const handleCreatePlanItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planItemForm.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    try {
      await plannerService.createPlanItem({
        ...planItemForm,
        planDate: selectedDate,
      });
      setIsPlanItemModalOpen(false);
      loadDailyPlan(selectedDate);
      toast.success('Study block added to timetable!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add study block');
    }
  };

  const handleGenerateAiPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingAi(true);
    try {
      const result = await plannerService.generateAutoPlan({
        ...aiForm,
        startDate: selectedDate,
      });
      setDailyPlan(result);
      setIsAiModalOpen(false);
      toast.success('AI Study Timetable synthesized successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate study timetable');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const shiftDate = (deltaDays: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + deltaDays);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const formattedDateHeader = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
              Phase 6
            </span>
            <span className="text-xs text-slate-400 font-medium">Smart Scheduling</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 flex items-center gap-2.5">
            <CalendarIcon className="w-7 h-7 text-indigo-600" />
            Exam Countdown & Study Planner
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Personalized daily study schedules balanced against target exam dates, diagnostic gaps, and SM-2 flashcard reviews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setAiForm((prev) => ({ ...prev, startDate: selectedDate }));
              setIsAiModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Generate AI Plan
          </button>

          <button
            onClick={() => {
              setEditingExam(null);
              setExamForm({
                title: '',
                examDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
                targetScore: 85,
                priority: 'HIGH',
                location: '',
                notes: '',
                color: 'indigo',
                subjectId: undefined,
              });
              setIsExamModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium text-sm shadow-xs hover:bg-slate-50 transition-all"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            Add Exam
          </button>
        </div>
      </div>

      {/* SECTION 1: EXAM COUNTDOWN TICKERS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            Target Exam Countdowns
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {exams.filter((e) => e.status === 'UPCOMING').length} Upcoming Targets
          </span>
        </div>

        {isLoadingExams ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : exams.length === 0 ? (
          <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-800">No Target Exams Added Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Add your upcoming midterms, finals, or certification tests to unlock active day/hour countdowns and adaptive daily timetables.
            </p>
            <button
              onClick={() => setIsExamModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Your First Exam
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => {
              const theme = colorThemes[exam.color] || colorThemes.indigo;
              const isUrgent = exam.daysRemaining <= 5 && exam.daysRemaining >= 0 && exam.status === 'UPCOMING';
              const isPast = exam.daysRemaining < 0;

              return (
                <div
                  key={exam.id}
                  className={`relative p-5 rounded-2xl bg-white border ${
                    exam.status === 'COMPLETED' ? 'border-slate-200 opacity-60' : 'border-slate-200 hover:border-slate-300'
                  } shadow-xs hover:shadow-md transition-all flex flex-col justify-between`}
                >
                  <div>
                    {/* Header bar */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${theme.lightBg} ${theme.text}`}>
                          {exam.subjectCode || 'EXAM'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          exam.priority === 'HIGH' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {exam.priority} Priority
                        </span>
                        {isUrgent && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                            Urgent
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingExam(exam);
                            setExamForm({
                              title: exam.title,
                              examDate: exam.examDate,
                              targetScore: exam.targetScore,
                              priority: exam.priority,
                              location: exam.location || '',
                              notes: exam.notes || '',
                              color: exam.color || 'indigo',
                              subjectId: exam.subjectId,
                            });
                            setIsExamModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-colors"
                          title="Edit Exam"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExam(exam.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors"
                          title="Delete Exam"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-800 text-base mt-2 line-clamp-1">{exam.title}</h3>
                    {exam.subjectName && (
                      <p className="text-xs text-slate-500 font-medium">{exam.subjectName}</p>
                    )}

                    {/* Countdown Banner */}
                    <div className={`mt-4 p-3 rounded-xl bg-gradient-to-r ${
                      exam.status === 'COMPLETED' ? 'from-slate-600 to-slate-700' : theme.gradient
                    } text-white flex items-center justify-between`}>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-white/70 block">
                          {exam.status === 'COMPLETED' ? 'STATUS' : isPast ? 'CONCLUDED' : 'COUNTDOWN'}
                        </span>
                        <p className="text-xl font-extrabold tracking-tight">
                          {exam.status === 'COMPLETED'
                            ? 'Exam Completed 🎉'
                            : isPast
                            ? 'Exam Concluded'
                            : exam.daysRemaining === 0
                            ? 'Today! 🚨'
                            : `${exam.daysRemaining} Days Left`}
                        </p>
                        {exam.status === 'UPCOMING' && !isPast && exam.daysRemaining > 0 && (
                          <span className="text-[11px] text-white/80">
                            ~{exam.hoursRemaining} hours until test
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-white/70 block">Target</span>
                        <span className="text-lg font-bold text-amber-300">{exam.targetScore}%</span>
                      </div>
                    </div>

                    {exam.location && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{exam.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer status toggle */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Date: <strong className="text-slate-700">{new Date(exam.examDate).toLocaleDateString()}</strong>
                    </span>
                    <button
                      onClick={() => handleToggleExamStatus(exam.id)}
                      className={`inline-flex items-center gap-1 font-semibold transition-colors ${
                        exam.status === 'COMPLETED'
                          ? 'text-emerald-600 hover:text-slate-600'
                          : 'text-slate-500 hover:text-emerald-600'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {exam.status === 'COMPLETED' ? 'Completed' : 'Mark Done'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: DAILY STUDY TIMETABLE */}
      <section className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
        {/* Timetable Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Daily Study Timetable</span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">{formattedDateHeader}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => shiftDate(-1)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                selectedDate === new Date().toISOString().split('T')[0]
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Today
            </button>

            <button
              onClick={() => shiftDate(1)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 text-slate-700 bg-white"
            />

            <button
              onClick={() => {
                setPlanItemForm({
                  title: '',
                  planDate: selectedDate,
                  timeSlot: '10:00 - 10:45',
                  activityType: 'CONCEPT_STUDY',
                  estimatedMinutes: 45,
                  priority: 'MEDIUM',
                  actionRoute: '/notes',
                  aiReasoning: '',
                  subjectId: undefined,
                });
                setIsPlanItemModalOpen(true);
              }}
              className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Block
            </button>
          </div>
        </div>

        {/* Daily Progress Bar */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Daily Study Completion</span>
              <span className="text-xs font-extrabold text-indigo-600">
                {dailyPlan.completedItems} / {dailyPlan.totalItems} Blocks Completed
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {dailyPlan.completedMinutes} mins done • {Math.max(0, dailyPlan.totalEstimatedMinutes - dailyPlan.completedMinutes)} mins remaining today
            </p>
          </div>

          <div className="w-full sm:w-64 space-y-1">
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>{dailyPlan.completionPercentage}%</span>
              <span>Target: 100%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${dailyPlan.completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Timetable Items List */}
        {isLoadingPlan ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : dailyPlan.items.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-800 text-base">No Study Blocks Scheduled for This Date</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Let the AI synthesize an intelligent, high-yield timetable or add custom revision sessions manually.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setAiForm((prev) => ({ ...prev, startDate: selectedDate }));
                  setIsAiModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-xs transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                Generate AI Day Plan
              </button>
              <button
                onClick={() => setIsPlanItemModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Custom Block
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {dailyPlan.items.map((item) => {
              const actConfig = activityTypeConfig[item.activityType] || activityTypeConfig.CONCEPT_STUDY;
              const Icon = actConfig.icon;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    item.completed
                      ? 'bg-slate-50/70 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-xs'
                  } flex flex-col md:flex-row md:items-center justify-between gap-4`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Completion checkbox */}
                    <button
                      onClick={() => handleTogglePlanItem(item.id)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors flex-shrink-0"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-600" />
                      )}
                    </button>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.timeSlot && (
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            ⏰ {item.timeSlot}
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${actConfig.badgeBg}`}>
                          <Icon className="w-3 h-3" />
                          {actConfig.label}
                        </span>
                        {item.subjectName && (
                          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            📚 {item.subjectName}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          item.priority === 'HIGH' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.priority}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          • {item.estimatedMinutes} mins
                        </span>
                      </div>

                      <h4 className={`text-sm font-bold text-slate-800 ${item.completed ? 'line-through text-slate-500' : ''}`}>
                        {item.title}
                      </h4>

                      {item.aiReasoning && (
                        <p className="text-xs text-indigo-700 bg-indigo-50/70 p-1.5 rounded-lg border border-indigo-100/60 leading-relaxed max-w-2xl">
                          💡 <strong>AI Rationale:</strong> {item.aiReasoning}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    {item.actionRoute && (
                      <button
                        onClick={() => navigate(item.actionRoute!)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-all"
                      >
                        Launch
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDeletePlanItem(item.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete Block"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL 1: ADD / EDIT TARGET EXAM */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">
                {editingExam ? 'Edit Target Exam' : 'Add Target Exam Countdown'}
              </h3>
              <button
                onClick={() => setIsExamModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateExam} className="space-y-4 text-xs font-medium">
              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Exam Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems Final Exam"
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Exam Date *</label>
                  <input
                    type="date"
                    required
                    value={examForm.examDate}
                    onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Target Grade (%)</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={examForm.targetScore}
                    onChange={(e) => setExamForm({ ...examForm, targetScore: parseInt(e.target.value) || 85 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Subject (Optional)</label>
                  <select
                    value={examForm.subjectId || ''}
                    onChange={(e) =>
                      setExamForm({ ...examForm, subjectId: e.target.value ? parseInt(e.target.value) : undefined })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">General / None</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Priority</label>
                  <select
                    value={examForm.priority}
                    onChange={(e) => setExamForm({ ...examForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Color Accent</label>
                <div className="flex gap-2">
                  {Object.keys(colorThemes).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setExamForm({ ...examForm, color })}
                      className={`w-7 h-7 rounded-full border-2 ${
                        examForm.color === color ? 'border-slate-800 scale-110 shadow-xs' : 'border-transparent'
                      } ${colorThemes[color].bg} transition-all`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Location / Exam Hall</label>
                <input
                  type="text"
                  placeholder="e.g. Hall 4B or Online LMS"
                  value={examForm.location || ''}
                  onChange={(e) => setExamForm({ ...examForm, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                >
                  {editingExam ? 'Save Changes' : 'Create Countdown'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD STUDY BLOCK */}
      {isPlanItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Add Study Block</h3>
              <button
                onClick={() => setIsPlanItemModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlanItem} className="space-y-4 text-xs font-medium">
              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Session Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dynamic Programming & Memoization Drill"
                  value={planItemForm.title}
                  onChange={(e) => setPlanItemForm({ ...planItemForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Activity Type</label>
                  <select
                    value={planItemForm.activityType}
                    onChange={(e) => setPlanItemForm({ ...planItemForm, activityType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="CONCEPT_STUDY">Concept Study</option>
                    <option value="PRACTICE_QUIZ">Practice Quiz</option>
                    <option value="FLASHCARD_REVIEW">Flashcard SM-2</option>
                    <option value="MISTAKE_CORRECTION">Mistake Drill</option>
                    <option value="MOCK_EXAM">Mock Exam</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Estimated Time (mins)</label>
                  <input
                    type="number"
                    min="10"
                    max="180"
                    value={planItemForm.estimatedMinutes}
                    onChange={(e) =>
                      setPlanItemForm({ ...planItemForm, estimatedMinutes: parseInt(e.target.value) || 45 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Time Slot</label>
                  <input
                    type="text"
                    placeholder="e.g. 09:00 - 09:45"
                    value={planItemForm.timeSlot || ''}
                    onChange={(e) => setPlanItemForm({ ...planItemForm, timeSlot: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Subject</label>
                  <select
                    value={planItemForm.subjectId || ''}
                    onChange={(e) =>
                      setPlanItemForm({
                        ...planItemForm,
                        subjectId: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">General / None</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Tool Shortcut</label>
                <select
                  value={planItemForm.actionRoute || '/timer'}
                  onChange={(e) => setPlanItemForm({ ...planItemForm, actionRoute: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="/timer">Focus Timer (/timer)</option>
                  <option value="/notes">AI Notes Generator (/notes)</option>
                  <option value="/flashcards">Flashcard Revision (/flashcards)</option>
                  <option value="/quiz">Practice Quiz Hub (/quiz)</option>
                  <option value="/mistakes">Mistake Intelligence (/mistakes)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPlanItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-xs"
                >
                  Add Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: GENERATE AI STUDY PLAN */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">AI Study Timetable Generator</h3>
                  <p className="text-xs text-slate-500">Synthesizes exam countdowns, weak topics, and SM-2 flashcards</p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateAiPlan} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Start Date</label>
                  <input
                    type="date"
                    value={aiForm.startDate}
                    onChange={(e) => setAiForm({ ...aiForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Horizon (Days)</label>
                  <select
                    value={aiForm.daysCount}
                    onChange={(e) => setAiForm({ ...aiForm, daysCount: parseInt(e.target.value) || 3 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="1">1 Day (Today Only)</option>
                    <option value="3">3 Days (Recommended)</option>
                    <option value="7">7 Days (Full Week)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-700 font-semibold">Daily Study Availability</label>
                  <span className="font-extrabold text-indigo-600">{aiForm.dailyAvailableHours} Hours / Day</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={aiForm.dailyAvailableHours}
                  onChange={(e) => setAiForm({ ...aiForm, dailyAvailableHours: parseInt(e.target.value) || 3 })}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>1 hr (Light)</span>
                  <span>3 hrs (Standard)</span>
                  <span>6 hrs (Intensive)</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                <span className="text-xs font-bold text-indigo-900 block">AI Scheduling Levers</span>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiForm.prioritizeWeakTopics}
                    onChange={(e) => setAiForm({ ...aiForm, prioritizeWeakTopics: e.target.checked })}
                    className="rounded text-indigo-600 accent-indigo-600"
                  />
                  <span className="text-slate-700">Prioritize diagnostic weak spots (&lt;60% accuracy)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiForm.includeMistakes}
                    onChange={(e) => setAiForm({ ...aiForm, includeMistakes: e.target.checked })}
                    className="rounded text-indigo-600 accent-indigo-600"
                  />
                  <span className="text-slate-700">Integrate unresolved root-cause mistake drills</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiForm.includeFlashcards}
                    onChange={(e) => setAiForm({ ...aiForm, includeFlashcards: e.target.checked })}
                    className="rounded text-indigo-600 accent-indigo-600"
                  />
                  <span className="text-slate-700">Schedule overdue SuperMemo SM-2 retention cards</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiForm.addRestIntervals}
                    onChange={(e) => setAiForm({ ...aiForm, addRestIntervals: e.target.checked })}
                    className="rounded text-indigo-600 accent-indigo-600"
                  />
                  <span className="text-slate-700">Space blocks with 15-min cognitive rest intervals</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingAi}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-semibold shadow-md transition-all disabled:opacity-50"
                >
                  {isGeneratingAi ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                      Synthesizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Generate Timetable
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
