import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Sparkles, 
  Clock, 
  Bookmark, 
  Trash2, 
  FolderOpen, 
  CheckCircle2, 
  Copy, 
  BookOpen, 
  ChevronRight, 
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { lectureService } from '../../services/lecture.service';
import type { LectureSummaryPayload, LectureSummaryResponse } from '../../services/lecture.service';
import { subjectService, type SubjectItem } from '../../services/subject.service';

const SAMPLE_TRANSCRIPTS = [
  {
    title: "Operating Systems — Virtual Memory & Paging",
    subject: "Operating Systems",
    transcript: `Welcome everyone. Today we are diving deep into Virtual Memory and Paging. The core problem virtual memory solves is providing each process with an illusion of contiguous physical memory that exceeds the actual DRAM capacity. Paging divides physical memory into fixed-size blocks called frames, and logical memory into blocks called pages. Typically, page size is 4KB. The Memory Management Unit (MMU) translates logical addresses into physical addresses using a Page Table. An address consists of two parts: a page number (p) and page offset (d). When a process references a page not present in physical RAM, the MMU triggers a Page Fault interrupt. The OS must then select a victim frame using page replacement algorithms such as FIFO, LRU (Least Recently Used), or Optimal. LRU is theoretically superior to FIFO because it avoids Belady's Anomaly, but true LRU requires expensive hardware counters or stack maintenance. In practice, systems approximate LRU using clock algorithms with a reference bit. Always remember for the exam: Page Table Base Register (PTBR) points to the current process page table, and Translation Lookaside Buffer (TLB) is an associative cache that reduces memory lookup time from two memory accesses down to one when a TLB hit occurs.`
  },
  {
    title: "Database Systems — Normalization & Functional Dependencies",
    subject: "Database Management Systems",
    transcript: `In this lecture, we cover database design theory, specifically functional dependencies and normal forms from 1NF through BCNF. A relation is in 1NF if every attribute contains only atomic, indivisible values. 2NF requires 1NF plus the absence of partial dependencies — meaning no non-prime attribute should be functionally dependent on a proper subset of any candidate key. 3NF eliminates transitive dependencies: if X -> Y, then either X is a superkey or Y is a prime attribute. Boyce-Codd Normal Form (BCNF) is stricter: for every functional dependency X -> Y, X MUST be a superkey without exception. While every schema can be decomposed into 3NF preserving both lossless join and dependency preservation, decomposing into BCNF guarantees lossless join but may not always preserve all functional dependencies. In semester exams, you will be given a set of attributes and functional dependencies and asked to determine the candidate keys using attribute closure (X+). Calculate closure systematically by applying Armstrong's Axioms: Reflexivity, Augmentation, and Transitivity.`
  }
];

export default function LectureSummarizerPage() {
  const [title, setTitle] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectId, setSubjectId] = useState<number | undefined>();
  const [speakerOrCourse, setSpeakerOrCourse] = useState('');
  const [transcript, setTranscript] = useState('');
  const [focusArea, setFocusArea] = useState<'general' | 'exam_revision' | 'formula_deep_dive' | 'quick_overview'>('exam_revision');

  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [payload, setPayload] = useState<LectureSummaryPayload | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'takeaways' | 'chapters' | 'formulas' | 'quiz'>('overview');

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  // Saved summaries drawer
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [savedSummaries, setSavedSummaries] = useState<LectureSummaryResponse[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

  useEffect(() => {
    loadSubjects();
    loadSavedSummaries();
  }, []);

  const loadSubjects = async () => {
    try {
      const data = await subjectService.getSubjects();
      setSubjects(data);
    } catch {
      // Ignore
    }
  };

  const loadSavedSummaries = async () => {
    try {
      setIsLoadingLibrary(true);
      const data = await lectureService.getAll();
      setSavedSummaries(data);
    } catch {
      // Ignore
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  const handleSummarize = async () => {
    if (!title.trim()) {
      toast.error('Please enter a lecture title.');
      return;
    }
    if (!transcript.trim()) {
      toast.error('Please paste a lecture transcript or notes text.');
      return;
    }

    try {
      setIsSummarizing(true);
      const res = await lectureService.summarize({
        title: title.trim(),
        subjectName: subjectName || undefined,
        subjectId,
        speakerOrCourse: speakerOrCourse.trim() || undefined,
        transcript: transcript.trim(),
        focusArea
      });

      setPayload(res);
      setQuizAnswers({});
      setShowQuizResults(false);
      setActiveTab('overview');
      toast.success('Lecture synthesized into revision notes, chapters, and quiz!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to summarize lecture.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSave = async () => {
    if (!payload) return;
    try {
      setIsSaving(true);
      const saved = await lectureService.save({
        title: payload.title || title,
        subjectId,
        speakerOrCourse,
        transcript,
        summaryJson: JSON.stringify(payload),
        estimatedDurationMinutes: payload.estimatedDurationMinutes
      });
      setSavedSummaries(prev => [saved, ...prev]);
      toast.success('Lecture summary saved to your academic library!');
    } catch {
      toast.error('Failed to save lecture summary.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSaved = (item: LectureSummaryResponse) => {
    try {
      const parsed: LectureSummaryPayload = JSON.parse(item.summaryJson);
      setPayload(parsed);
      setTitle(item.title);
      if (item.subjectName) setSubjectName(item.subjectName);
      if (item.subjectId) setSubjectId(item.subjectId);
      if (item.speakerOrCourse) setSpeakerOrCourse(item.speakerOrCourse);
      setTranscript(item.transcript);
      setQuizAnswers({});
      setShowQuizResults(false);
      setActiveTab('overview');
      setLibraryOpen(false);
      toast.success(`Loaded "${item.title}"`);
    } catch {
      toast.error('Could not load saved lecture summary.');
    }
  };

  const handleDeleteSaved = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await lectureService.delete(id);
      setSavedSummaries(prev => prev.filter(s => s.id !== id));
      toast.success('Summary removed from library.');
    } catch {
      toast.error('Failed to delete summary.');
    }
  };

  const handleQuizSelect = (qIdx: number, optIdx: number) => {
    if (showQuizResults) return;
    setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">AI Lecture Summarizer</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Audio & Transcript Notes
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Transform lecture transcripts or recordings into chapter breakdown, key takeaways, formula cheatsheets, and active recall quizzes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {payload && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-600" />
              <span>Save to Library</span>
            </button>
          )}

          <button
            onClick={() => setLibraryOpen(true)}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-indigo-100"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>Saved Summaries ({savedSummaries.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Lecture Input & Transcript */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-600" />
              Lecture Details & Transcript
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lecture / Topic Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Operating Systems: Paging & Virtual Memory"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject Course
                </label>
                <select
                  value={subjectId || ''}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : undefined;
                    setSubjectId(val);
                    const found = subjects.find(s => s.id === val);
                    setSubjectName(found ? found.name : '');
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">General Academic</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Synthesis Focus
                </label>
                <select
                  value={focusArea}
                  onChange={(e: any) => setFocusArea(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="exam_revision">Exam Scoring Focus</option>
                  <option value="general">Comprehensive Summary</option>
                  <option value="formula_deep_dive">Formulas & Definitions</option>
                  <option value="quick_overview">Quick 5-Minute Overview</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Lecture Transcript / Notes Content *
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {transcript.length} characters
                </span>
              </div>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={9}
                placeholder="Paste speech-to-text transcript, professor lecture notes, or video captions here..."
                className="w-full p-3.5 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed"
              />
            </div>

            {/* Quick Sample Transcripts */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                ⚡ Or try a sample lecture transcript:
              </div>
              <div className="space-y-1.5">
                {SAMPLE_TRANSCRIPTS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTitle(item.title);
                      setSubjectName(item.subject);
                      setTranscript(item.transcript);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200/80 hover:border-amber-200 transition-colors flex items-center justify-between group"
                  >
                    <div className="truncate pr-2">
                      <span className="font-semibold text-xs text-slate-800 group-hover:text-amber-700 truncate block">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400">{item.subject}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSummarize}
              disabled={isSummarizing || !title.trim() || !transcript.trim()}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className={`w-4 h-4 ${isSummarizing ? 'animate-spin' : ''}`} />
              <span>{isSummarizing ? 'Synthesizing Lecture Knowledge...' : 'Synthesize Lecture Summary'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Structured Summary Display */}
        <div className="lg:col-span-7">
          {!payload ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[420px]">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                No Lecture Synthesized Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
                Paste your lecture recording transcript, choose your academic focus, and click "Synthesize Lecture Summary" to generate revision cards, timeline chapters, and diagnostic questions.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
              {/* Output Header */}
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-amber-50/50 via-white to-slate-50 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{payload.title}</h2>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1 font-medium text-amber-700">
                      <Clock className="w-3.5 h-3.5" />
                      ~{payload.estimatedDurationMinutes || 45} mins lecture
                    </span>
                    <span>•</span>
                    <span>{payload.chapters.length} Chapters</span>
                    <span>•</span>
                    <span>{payload.keyTakeaways.length} Key Concepts</span>
                    <span>•</span>
                    <span>{payload.revisionQuestions.length} Practice Questions</span>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(payload.executiveSummary)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Summary</span>
                </button>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex items-center border-b border-slate-100 px-6 gap-2 overflow-x-auto bg-slate-50/60">
                {[
                  { key: 'overview', label: 'Overview' },
                  { key: 'takeaways', label: `Key Takeaways (${payload.keyTakeaways.length})` },
                  { key: 'chapters', label: `Timeline Chapters (${payload.chapters.length})` },
                  { key: 'formulas', label: `Formulas & Laws (${payload.formulasAndLaws.length})` },
                  { key: 'quiz', label: `Recall Quiz (${payload.revisionQuestions.length})` }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                      activeTab === tab.key
                        ? 'border-amber-600 text-amber-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content Display */}
              <div className="p-6 space-y-4 max-h-[640px] overflow-y-auto">
                {/* 1. Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 leading-relaxed text-xs text-slate-800">
                      <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        Executive Academic Overview
                      </h4>
                      <p className="whitespace-pre-line leading-relaxed text-slate-700">
                        {payload.executiveSummary}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                        <div className="text-xl font-bold text-amber-600">{payload.chapters.length}</div>
                        <div className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">Chapters Analyzed</div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                        <div className="text-xl font-bold text-indigo-600">{payload.keyTakeaways.length}</div>
                        <div className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">Core Concepts</div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                        <div className="text-xl font-bold text-emerald-600">{payload.revisionQuestions.length}</div>
                        <div className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">Quiz Questions</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Key Takeaways Tab */}
                {activeTab === 'takeaways' && (
                  <div className="space-y-3">
                    {payload.keyTakeaways.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-slate-900">{item.concept}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.importance === 'Critical'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {item.importance}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {item.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Chapters Tab */}
                {activeTab === 'chapters' && (
                  <div className="space-y-3">
                    {payload.chapters.map((chapter, idx) => (
                      <div key={idx} className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">
                            {chapter.timestamp}
                          </span>
                          <h4 className="font-bold text-xs text-slate-900">{chapter.title}</h4>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {chapter.summary}
                        </p>
                        {chapter.bulletPoints && chapter.bulletPoints.length > 0 && (
                          <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 pt-1 border-t border-slate-100">
                            {chapter.bulletPoints.map((bp, bIdx) => (
                              <li key={bIdx}>{bp}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. Formulas and Laws Tab */}
                {activeTab === 'formulas' && (
                  <div className="space-y-3">
                    {payload.formulasAndLaws.length === 0 ? (
                      <p className="text-xs text-slate-500 italic text-center py-6">No specific mathematical formulas or formal laws identified in this session.</p>
                    ) : (
                      payload.formulasAndLaws.map((formula, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs flex items-center justify-between gap-3">
                          <span className="leading-relaxed">{formula}</span>
                          <button
                            onClick={() => copyToClipboard(formula)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
                            title="Copy formula"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 5. Recall Quiz Tab */}
                {activeTab === 'quiz' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="text-xs font-semibold text-slate-700">
                        Answer each question, then click "Check Answers" to grade your recall.
                      </div>
                      <button
                        onClick={() => setShowQuizResults(true)}
                        disabled={showQuizResults}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
                      >
                        Check Answers
                      </button>
                    </div>

                    <div className="space-y-4">
                      {payload.revisionQuestions.map((q, qIdx) => {
                        const selected = quizAnswers[qIdx];
                        const isGraded = showQuizResults;
                        const isCorrect = selected === q.correctIndex;

                        return (
                          <div key={qIdx} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                            <div className="font-semibold text-xs text-slate-900">
                              {qIdx + 1}. {q.question}
                            </div>

                            <div className="space-y-1.5">
                              {q.options.map((opt, oIdx) => {
                                const isSelected = selected === oIdx;
                                const isCorrectChoice = isGraded && oIdx === q.correctIndex;
                                const isWrongChoice = isGraded && isSelected && !isCorrect;

                                return (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    onClick={() => handleQuizSelect(qIdx, oIdx)}
                                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between ${
                                      isCorrectChoice
                                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold'
                                        : isWrongChoice
                                        ? 'bg-rose-100 text-rose-900 border border-rose-300 line-through'
                                        : isSelected
                                        ? 'bg-indigo-100 text-indigo-900 border border-indigo-300 font-semibold'
                                        : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'
                                    }`}
                                  >
                                    <span>{opt}</span>
                                    {isCorrectChoice && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>

                            {isGraded && (
                              <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed">
                                <strong>Explanation:</strong> {q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Saved Summaries Modal Drawer */}
      {libraryOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex justify-end">
          <div className="w-full max-w-md bg-white h-full border-l border-slate-200 p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-bold text-slate-900">Saved Lecture Summaries</h2>
              </div>
              <button
                onClick={() => setLibraryOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 space-y-3">
              {isLoadingLibrary ? (
                <div className="text-center py-8 text-xs text-slate-400">Loading library...</div>
              ) : savedSummaries.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  No saved lecture summaries found.<br />
                  Summarize a transcript and click "Save to Library".
                </div>
              ) : (
                savedSummaries.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleLoadSaved(item)}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-amber-50/50 border border-slate-200/80 cursor-pointer transition-all flex items-start justify-between gap-3 group"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-amber-700 transition-colors">
                        {item.title}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1.5">
                        {item.subjectName && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                            {item.subjectName}
                          </span>
                        )}
                        <span>~{item.estimatedDurationMinutes || 45} mins</span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteSaved(e, item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
                      title="Delete summary"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
