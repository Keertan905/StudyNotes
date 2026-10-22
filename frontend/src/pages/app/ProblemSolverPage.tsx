import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import {
  HelpCircle,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  Send,
  ChevronDown,
  ChevronUp,
  FileText,
  Zap,
  Globe2,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  problemSolverService,
  type SolveProblemResponse
} from '../../services/problemSolver.service';
import { subjectService, type SubjectItem } from '../../services/subject.service';

const SUBJECT_PRESETS = [
  { id: 'Mathematics', label: 'Mathematics', desc: 'Calculus, Linear Algebra, Probability' },
  { id: 'Java/OOP', label: 'Java & OOP', desc: 'Syntax, Class Design, Polymorphism' },
  { id: 'DSA', label: 'DSA & Algorithms', desc: 'Time Complexity, Trees, DP, Graphs' },
  { id: 'Networks', label: 'Computer Networks', desc: 'Subnetting, TCP/IP, OSI Protocols' },
  { id: 'Operating Systems', label: 'Operating Systems', desc: 'Paging, Deadlocks, Scheduling' },
];

const SAMPLE_PROBLEMS = [
  {
    subject: 'Mathematics',
    text: 'Solve the quadratic equation 2x^2 + 5x - 3 = 0 using the quadratic formula and verify the roots.',
  },
  {
    subject: 'Java/OOP',
    text: 'Explain why the following Java snippet throws NullPointerException and how to fix it with Optional:\nString name = getUserName();\nint len = name.length();',
  },
  {
    subject: 'DSA',
    text: 'What is the recurrence relation and asymptotic time complexity for Merge Sort: T(n) = 2T(n/2) + O(n)? Explain using Master Theorem.',
  },
  {
    subject: 'Networks',
    text: 'Calculate the network address, broadcast address, and usable host count for IP 192.168.10.74 with subnet mask /26 (255.255.255.192).',
  },
];

export default function ProblemSolverPage() {
  const [problemText, setProblemText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>();
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [groundWithDocs, setGroundWithDocs] = useState(false);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [isSolving, setIsSolving] = useState(false);

  // Solution State
  const [solution, setSolution] = useState<SolveProblemResponse | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1]));
  const [activeTab, setActiveTab] = useState<'steps' | 'intuitive' | 'pitfalls'>('steps');

  // Follow-up interaction
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
  const [followUpThread, setFollowUpThread] = useState<{ question: string; answer: string }[]>([]);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const data = await subjectService.getSubjects();
      setSubjects(data);
    } catch {
      // background
    }
  };

  const handleSolve = async (customText?: string, customSub?: string) => {
    const textToSolve = (customText || problemText).trim();
    if (!textToSolve) {
      toast.error('Please enter a question, equation, or code snippet');
      return;
    }

    setIsSolving(true);
    setSolution(null);
    setFollowUpThread([]);

    try {
      const data = await problemSolverService.solve({
        problemText: textToSolve,
        subject: customSub || selectedSubject,
        targetLanguage,
        groundWithDocs,
        subjectId: selectedSubjectId,
      });

      setSolution(data);
      // Auto expand first two steps
      setExpandedSteps(new Set([1, 2]));
      toast.success('Step-by-step solution generated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to solve problem. Please try again.');
    } finally {
      setIsSolving(false);
    }
  };

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepNumber)) next.delete(stepNumber);
      else next.add(stepNumber);
      return next;
    });
  };

  const expandAllSteps = () => {
    if (!solution) return;
    const all = new Set(solution.steps.map((s) => s.stepNumber));
    setExpandedSteps(all);
  };

  const collapseAllSteps = () => {
    setExpandedSteps(new Set());
  };

  const handleAskFollowUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!followUpQuestion.trim() || !solution) return;

    setIsAskingFollowUp(true);
    const q = followUpQuestion.trim();
    try {
      const res = await problemSolverService.askFollowUp({
        originalProblem: problemText,
        followUpQuestion: q,
        previousFinalAnswer: solution.finalAnswer,
        subject: selectedSubject,
      });

      setFollowUpThread((prev) => [...prev, { question: q, answer: res.answer }]);
      setFollowUpQuestion('');
      toast.success('Follow-up explained');
    } catch {
      toast.error('Failed to answer follow-up');
    } finally {
      setIsAskingFollowUp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600/10 text-indigo-600 rounded-lg">
              <Lightbulb className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Step-by-Step Problem Solver</h1>
              <p className="text-sm text-slate-500">
                Detailed derivations, algorithmic traces, "Why" rationales, and intuitive explanations
              </p>
            </div>
          </div>
        </div>

        {/* Security badge notice */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Static Code & Logic Analysis • Sandbox Safe</span>
        </div>
      </div>

      {/* Input Workspace Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        {/* Subject preset selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Subject Domain
          </label>
          <div className="flex flex-wrap gap-2">
            {SUBJECT_PRESETS.map((p) => {
              const isSelected = selectedSubject === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedSubject(p.id);
                    setSelectedSubjectId(undefined);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}

            {subjects.length > 0 && (
              <select
                value={selectedSubjectId || ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setSelectedSubjectId(val);
                  if (val) {
                    const found = subjects.find((s) => s.id === val);
                    if (found) setSelectedSubject(found.name);
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">My Course Subjects...</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Main Problem Input Box */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Enter Question, Equation, or Code Problem:
          </label>
          <textarea
            rows={4}
            value={problemText}
            onChange={(e) => setProblemText(e.target.value)}
            placeholder="Type your mathematical equation, technical question, or paste code snippet here..."
            className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50 font-sans"
          />
        </div>

        {/* Configurations Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            {/* Grounding Toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={groundWithDocs}
                onChange={(e) => setGroundWithDocs(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ground in uploaded study notes (RAG)</span>
            </label>

            {/* Language Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Globe2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="px-2 py-1 border border-slate-200 rounded-md text-xs bg-white text-slate-700"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Hinglish">Hinglish</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => handleSolve()}
              disabled={isSolving || !problemText.trim()}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {isSolving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Solving Step-by-Step...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Solve Problem</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sample Problems Bar */}
        <div className="pt-2 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Try Sample:</span>
          {SAMPLE_PROBLEMS.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setProblemText(s.text);
                setSelectedSubject(s.subject);
                handleSolve(s.text, s.subject);
              }}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition truncate max-w-[260px]"
            >
              {s.subject}: {s.text.substring(0, 30)}...
            </button>
          ))}
        </div>
      </div>

      {/* Solution Display Area */}
      {solution && (
        <div className="space-y-6">
          {/* Overview Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  {solution.classifiedCategory} • {solution.difficulty}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{solution.problemSummary}</h3>
              </div>

              {solution.isGrounded && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Grounded in Uploaded Notes ({Math.round(solution.groundingConfidence * 100)}% match)</span>
                </div>
              )}
            </div>

            {/* Prerequisites */}
            {solution.prerequisiteConcepts && solution.prerequisiteConcepts.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Prerequisites:
                </span>
                {solution.prerequisiteConcepts.map((c, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Solution Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('steps')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'steps' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Step-by-Step Derivation ({solution.steps.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('intuitive')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'intuitive' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                <span>Explain Like I'm 5 (Intuition)</span>
              </button>
              <button
                onClick={() => setActiveTab('pitfalls')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'pitfalls' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Common Mistakes & Traps</span>
              </button>
            </div>

            {activeTab === 'steps' && (
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <button onClick={expandAllSteps} className="hover:text-indigo-600 transition">
                  Expand All
                </button>
                <span>•</span>
                <button onClick={collapseAllSteps} className="hover:text-indigo-600 transition">
                  Collapse All
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: STEPS */}
          {activeTab === 'steps' && (
            <div className="space-y-4">
              {solution.steps.map((step) => {
                const isExpanded = expandedSteps.has(step.stepNumber);
                return (
                  <div
                    key={step.stepNumber}
                    className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition"
                  >
                    {/* Step Header */}
                    <div
                      onClick={() => toggleStep(step.stepNumber)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                          {step.stepNumber}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{step.title}</h4>
                      </div>

                      <div className="text-slate-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>

                    {/* Step Body */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-3">
                        {step.formulaOrCode && (
                          <div className="p-3 bg-slate-950 rounded-xl font-mono text-xs text-indigo-300 border border-slate-800 overflow-x-auto">
                            <code>{step.formulaOrCode}</code>
                          </div>
                        )}

                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            What is performed
                          </span>
                          <p className="text-sm text-slate-700 leading-relaxed">{step.explanation}</p>
                        </div>

                        {step.whyExplanation && (
                          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1">
                            <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                              <Zap className="w-3.5 h-3.5 text-indigo-600" />
                              Why this step is performed (Rationale)
                            </span>
                            <p className="text-xs text-indigo-900 leading-relaxed">
                              {step.whyExplanation}
                            </p>
                          </div>
                        )}

                        {step.keyTip && (
                          <div className="text-xs text-amber-800 bg-amber-50/70 border border-amber-200/80 px-3 py-2 rounded-lg flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            <span>{step.keyTip}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Final Answer Banner */}
              <div className="p-5 bg-emerald-500 text-white rounded-2xl shadow-lg space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-bold uppercase tracking-wider text-xs">Final Verified Answer</span>
                </div>
                <div className="text-lg font-mono font-bold">{solution.finalAnswer}</div>
                {solution.verificationCheck && (
                  <p className="text-xs text-emerald-100 pt-1 border-t border-emerald-400/40">
                    Sanity check: {solution.verificationCheck}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: INTUITIVE ANALOGY */}
          {activeTab === 'intuitive' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-amber-600">
                <Lightbulb className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">Intuitive "Explain Like I'm 5" Breakdown</h3>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed bg-amber-50/60 border border-amber-100 p-4 rounded-xl">
                {solution.intuitiveExplanation}
              </p>
            </div>
          )}

          {/* TAB 3: COMMON PITFALLS */}
          {activeTab === 'pitfalls' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">Common Exam Pitfalls & Misconceptions</h3>
              </div>
              <ul className="space-y-3">
                {solution.commonMistakes.map((mistake, idx) => (
                  <li
                    key={idx}
                    className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2"
                  >
                    <span className="text-rose-600 font-bold">•</span>
                    <span className="leading-relaxed">{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Interactive Follow-up Q&A Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>Ask a Follow-Up Question on This Solution</span>
            </h4>

            {/* Previous Follow-up Thread */}
            {followUpThread.length > 0 && (
              <div className="space-y-3">
                {followUpThread.map((item, idx) => (
                  <div key={idx} className="space-y-2 border-l-2 border-indigo-500 pl-4 py-1">
                    <p className="text-xs font-bold text-slate-900">Q: {item.question}</p>
                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/60 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleAskFollowUp} className="flex gap-2">
              <input
                type="text"
                value={followUpQuestion}
                onChange={(e) => setFollowUpQuestion(e.target.value)}
                placeholder="e.g. Why did we choose this substitution? What if n is odd?"
                className="flex-1 px-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <button
                type="submit"
                disabled={isAskingFollowUp || !followUpQuestion.trim()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {isAskingFollowUp ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Ask</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
