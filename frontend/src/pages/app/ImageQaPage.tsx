import { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Copy, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle2, 
  X,
  FileQuestion
} from 'lucide-react';
import toast from 'react-hot-toast';
import { imageQaService } from '../../services/imageQa.service';
import type { ImageQaResponse } from '../../services/imageQa.service';

const SAMPLE_QUESTIONS = [
  {
    title: "RC Circuit Transient Response",
    subject: "Electrical Engineering",
    prompt: "A series RC circuit with R = 10k ohms and C = 100uF is connected to a 12V DC source at t = 0. Calculate the capacitor voltage v(t) at t = 2.0 seconds and determine the time constant tau.",
    imageMock: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'><rect width='100%' height='100%' fill='%230f172a'/><text x='50%' y='40%' fill='%2338bdf8' font-size='16' font-family='sans-serif' text-anchor='middle'>Series RC Circuit Diagram</text><text x='50%' y='65%' fill='%2394a3b8' font-size='12' font-family='monospace' text-anchor='middle'>Vs = 12V | R = 10k&#937; | C = 100&#956;F</text></svg>"
  },
  {
    title: "Calculus — Integration by Parts",
    subject: "Engineering Mathematics",
    prompt: "Evaluate the definite integral of x * e^(2x) dx from x = 0 to x = 1 using integration by parts. State u, dv, and show all intermediate integration steps.",
    imageMock: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'><rect width='100%' height='100%' fill='%230f172a'/><text x='50%' y='40%' fill='%23a855f7' font-size='16' font-family='sans-serif' text-anchor='middle'>Definite Integral Problem</text><text x='50%' y='65%' fill='%2394a3b8' font-size='14' font-family='monospace' text-anchor='middle'>&#8747; [0 to 1] x &#183; e^(2x) dx</text></svg>"
  },
  {
    title: "Computer Networks — IPv4 Subnetting",
    subject: "Computer Networks",
    prompt: "Given the IP network address 192.168.10.0/24, create 4 usable subnets for 30 hosts each. Find the subnet mask, network IDs, usable host ranges, and broadcast addresses.",
    imageMock: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'><rect width='100%' height='100%' fill='%230f172a'/><text x='50%' y='40%' fill='%2334d399' font-size='16' font-family='sans-serif' text-anchor='middle'>IPv4 Subnet Topology</text><text x='50%' y='65%' fill='%2394a3b8' font-size='12' font-family='monospace' text-anchor='middle'>Base: 192.168.10.0/24 | Subnets Needed: 4</text></svg>"
  }
];

export default function ImageQaPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [questionPrompt, setQuestionPrompt] = useState<string>('');
  const [subjectName, setSubjectName] = useState<string>('Engineering & Science');
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [result, setResult] = useState<ImageQaResponse | null>(null);
  const [activeStepTab, setActiveStepTab] = useState<'steps' | 'formulas' | 'pitfalls' | 'practice'>('steps');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      toast.success(`Loaded image: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processFile(file);
          toast.success('Pasted screenshot from clipboard!');
          return;
        }
      }
    }
  };

  const handleSolve = async () => {
    if (!imagePreview && !questionPrompt.trim()) {
      toast.error('Please upload a question image or type a problem statement.');
      return;
    }

    try {
      setIsSolving(true);
      const res = await imageQaService.solve({
        imageBase64: imagePreview || 'data:image/png;base64,mock',
        imageName: imageName || 'question_snapshot.png',
        questionPrompt: questionPrompt.trim(),
        subjectName,
        detailLevel: 'step_by_step'
      });
      setResult(res);
      setActiveStepTab('steps');
      toast.success('Problem solved with full step-by-step mathematical breakdown!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to solve problem.');
    } finally {
      setIsSolving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div 
      className="min-h-full bg-slate-50 p-4 sm:p-6 space-y-6"
      onPaste={handlePaste}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Ask Questions from Images (Visual Q&A)</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                OCR & Problem Solver
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Upload textbook pages, handwritten questions, or paste screenshots (Ctrl+V) for instant step-by-step solutions, equations, and exam tips.
            </p>
          </div>
        </div>

        {/* Quick Sample Questions */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">
            ⚡ Quick Demos:
          </span>
          {SAMPLE_QUESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                setImagePreview(s.imageMock);
                setImageName(s.title + '.svg');
                setQuestionPrompt(s.prompt);
                setSubjectName(s.subject);
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 text-xs font-medium whitespace-nowrap transition-colors border border-slate-200/60"
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Dual-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Upload & Question Focus */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-purple-600" />
              Upload Question Photo or Screenshot
            </h2>

            {/* Dropzone Area */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                imagePreview
                  ? 'border-purple-300 bg-purple-50/20'
                  : 'border-slate-300 hover:border-purple-500 bg-slate-50/60 hover:bg-purple-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {imagePreview ? (
                <div className="relative w-full max-h-[260px] flex items-center justify-center overflow-hidden rounded-2xl group">
                  <img
                    src={imagePreview}
                    alt="Uploaded Question"
                    className="max-h-[240px] w-auto object-contain rounded-xl shadow-md border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagePreview(null);
                      setImageName('');
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-xl bg-slate-900/80 text-white hover:bg-rose-600 transition-colors shadow-lg"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-1">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="font-semibold text-xs text-slate-800">
                    Click to browse, drag & drop, or paste screenshot (Ctrl+V)
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Supports PNG, JPG, JPEG, WEBP textbook photos & formulas
                  </p>
                </div>
              )}
            </div>

            {/* Subject Context Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject Domain
              </label>
              <select
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="Engineering & Science">General Engineering & Science</option>
                <option value="Engineering Mathematics">Mathematics & Calculus</option>
                <option value="Physics & Mechanics">Physics & Mechanics</option>
                <option value="Electrical Engineering">Electrical & Electronics Circuits</option>
                <option value="Computer Science">Computer Science & Algorithms</option>
                <option value="Chemistry">Chemistry & Materials Science</option>
              </select>
            </div>

            {/* Optional Specific Doubt */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Specific Doubt or Question Focus (Optional)
              </label>
              <textarea
                value={questionPrompt}
                onChange={(e) => setQuestionPrompt(e.target.value)}
                rows={3}
                placeholder="e.g. Solve part (b) or explain the theorem used in this derivation..."
                className="w-full p-3 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
              />
            </div>

            <button
              onClick={handleSolve}
              disabled={isSolving || (!imagePreview && !questionPrompt.trim())}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className={`w-4 h-4 ${isSolving ? 'animate-spin' : ''}`} />
              <span>{isSolving ? 'Reading Image & Solving Problem...' : 'Solve Question from Image'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Step-by-Step Solution Breakdown */}
        <div className="lg:col-span-7">
          {!result ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[440px]">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-4">
                <FileQuestion className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                No Problem Solved Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
                Upload or paste a screenshot of any question, equation, or circuit diagram. The solver will extract the text, transcribe given values, and produce step-by-step mathematical derivations.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
              {/* Output Top Banner */}
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-purple-50/50 via-white to-slate-50 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{result.title}</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                      {result.subject}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span>{result.solutionSteps.length} Systematic Steps</span>
                    <span>•</span>
                    <span>{result.keyFormulas.length} Core Formulas</span>
                    <span>•</span>
                    <span>{result.commonPitfalls.length} Common Pitfalls</span>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(result.finalAnswer)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-purple-600" />
                  <span>Copy Solution</span>
                </button>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex items-center border-b border-slate-100 px-6 gap-2 overflow-x-auto bg-slate-50/60">
                {[
                  { key: 'steps', label: `Step-by-Step Derivation (${result.solutionSteps.length})` },
                  { key: 'formulas', label: `Formulas (${result.keyFormulas.length})` },
                  { key: 'pitfalls', label: `Exam Pitfalls (${result.commonPitfalls.length})` },
                  { key: 'practice', label: `Practice (${result.relatedPracticeQuestions.length})` }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveStepTab(tab.key as any)}
                    className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                      activeStepTab === tab.key
                        ? 'border-purple-600 text-purple-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="p-6 space-y-4 max-h-[640px] overflow-y-auto">
                {/* 1. Steps Tab */}
                {activeStepTab === 'steps' && (
                  <div className="space-y-4">
                    {/* Extracted Problem Statement */}
                    <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                        <FileQuestion className="w-3.5 h-3.5 text-purple-600" />
                        Transcribed Problem Statement
                      </div>
                      <p className="text-xs text-purple-950 font-medium leading-relaxed">
                        {result.extractedProblemText}
                      </p>
                    </div>

                    {/* Given Values */}
                    {result.givenValues && result.givenValues.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Identified Given Parameters:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {result.givenValues.map((val, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-mono text-xs text-slate-800">
                              {val}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step Cards */}
                    <div className="space-y-3">
                      {result.solutionSteps.map((step) => (
                        <div key={step.stepNumber} className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {step.stepNumber}
                            </span>
                            <h4 className="font-bold text-xs text-slate-900">{step.title}</h4>
                          </div>

                          {step.formula && (
                            <div className="p-2.5 rounded-xl bg-slate-900 text-purple-300 font-mono text-xs overflow-x-auto">
                              {step.formula}
                            </div>
                          )}

                          <p className="text-xs text-slate-600 leading-relaxed">
                            {step.explanation}
                          </p>

                          {step.intermediateResult && (
                            <div className="p-2 rounded-lg bg-purple-50/70 border border-purple-100 text-xs font-semibold text-purple-900">
                              👉 Result: {step.intermediateResult}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Final Concluding Answer */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white space-y-1 shadow-md shadow-emerald-500/20">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        Final Concluding Answer
                      </div>
                      <div className="text-sm font-bold leading-relaxed font-mono">
                        {result.finalAnswer}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Formulas Tab */}
                {activeStepTab === 'formulas' && (
                  <div className="space-y-3">
                    {result.keyFormulas.map((f, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-slate-900 text-purple-300 font-mono text-xs flex items-center justify-between gap-3">
                        <span className="leading-relaxed">{f}</span>
                        <button
                          onClick={() => copyToClipboard(f)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
                          title="Copy formula"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Pitfalls Tab */}
                {activeStepTab === 'pitfalls' && (
                  <div className="space-y-3">
                    {result.commonPitfalls.map((pitfall, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-rose-900 leading-relaxed">
                          <strong>Common Exam Trap:</strong> {pitfall}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. Practice Tab */}
                {activeStepTab === 'practice' && (
                  <div className="space-y-3">
                    {result.relatedPracticeQuestions.map((q, idx) => (
                      <div key={idx} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                            Practice Challenge #{idx + 1}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            q.difficulty === 'Hard'
                              ? 'bg-rose-100 text-rose-700'
                              : q.difficulty === 'Medium'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {q.difficulty}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {q.question}
                        </p>
                        {q.answerHint && (
                          <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 text-[11px] text-purple-900">
                            <strong>Solution Hint:</strong> {q.answerHint}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
