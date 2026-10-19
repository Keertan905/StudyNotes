import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  BookOpen, 
  Sparkles, 
  BrainCircuit, 
  Bot, 
  HelpCircle, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  GraduationCap, 
  Clock, 
  BarChart3, 
  X,
  Layers,
  Award
} from "lucide-react";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const features = [
    {
      icon: BookOpen,
      title: "AI Notes Generator",
      tag: "Feature 1",
      desc: "Transform syllabus topics into structured, exam-oriented revision notes complete with key definitions, processes, pros/cons, and exam questions.",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: Bot,
      title: "Syllabus-Grounded AI Tutor",
      tag: "Feature 2 & 10",
      desc: "Ask natural language questions strictly grounded in your course materials with page citations and zero hallucination safeguards.",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: HelpCircle,
      title: "Smart Quizzes & Mock Exams",
      tag: "Feature 3",
      desc: "Generate targeted MCQs, short answers, and full mock exams. Instant automated evaluation with transparent rubrics and detailed explanations.",
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: BrainCircuit,
      title: "Knowledge Gap Detector",
      tag: "Feature 7",
      desc: "Our real performance analysis engine pinpoints exactly which syllabus units and topics need targeted practice rather than generic AI guesses.",
      color: "from-rose-500 to-red-600"
    },
    {
      icon: AlertTriangle,
      title: "Mistake Intelligence Engine",
      tag: "Feature 9",
      desc: "Classify your incorrect answers by conceptual misunderstanding, forgotten definitions, or calculation slips to fix recurring patterns.",
      color: "from-amber-500 to-orange-600"
    },
    {
      icon: Calendar,
      title: "Exam Countdown Planner",
      tag: "Feature 6 & 8",
      desc: "Input your exam schedule and daily study availability to receive an adaptive countdown study routine prioritizing your weakest topics.",
      color: "from-sky-500 to-blue-600"
    }
  ];

  const steps = [
    {
      step: "01",
      title: "Organize Your Syllabus",
      desc: "Add your subjects, define semester units, and upload official course material or lecture slides to build your personalized study repository."
    },
    {
      step: "02",
      title: "Test & Diagnose Gaps",
      desc: "Take diagnostic quizzes. StudyApp tracks your score, identifies recurring mistakes, and isolates untested or weak concepts."
    },
    {
      step: "03",
      title: "Revise & Master",
      desc: "Execute daily spaced repetition flashcards, generate targeted AI revision notes, and monitor your transparent Exam Readiness Score."
    }
  ];

  const faqs = [
    {
      q: "How does the Knowledge Gap Detector evaluate my performance?",
      a: "Unlike generic chatbots, StudyApp tracks your actual quiz attempts, timestamp recency, and mistake history. It requires multiple successful evaluations before marking a topic as mastered and marks untested topics clearly as 'Not enough data'."
    },
    {
      q: "Can I upload my university syllabus PDF or textbook slides?",
      a: "Yes! StudyApp features document text extraction using Apache PDFBox. The AI Tutor grounds its explanations strictly within your uploaded materials and provides citations."
    },
    {
      q: "Does StudyApp work without an active AI API key?",
      a: "StudyApp is architected with a decoupled provider interface. Core subject organization, manual flashcards, study timer, and performance analytics work natively with MySQL. When you configure your API key, AI generation tools activate seamlessly."
    },
    {
      q: "What is the Exam Readiness Score?",
      a: "It is a transparent, formula-backed score (0-100%) that measures syllabus coverage, recent quiz accuracy, spaced repetition consistency, and untested areas. We explain every component so you know exactly where to improve."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-900 to-indigo-700 bg-clip-text text-transparent">
                StudyApp
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                AI Prep System
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#preview" className="hover:text-indigo-600 transition-colors">Preview</a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-700 hover:text-indigo-600 px-3.5 py-2 rounded-lg hover:bg-slate-100 transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all inline-flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-indigo-50/60 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100/80 text-indigo-800 text-xs font-semibold mb-6 border border-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI-Powered Intelligent Study & Examination Preparation System</span>
          </div>

          {/* Master Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Study Smarter. <br />
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
              Prepare Better. Achieve More.
            </span>
          </h1>

          {/* Description */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The complete production-minded platform for college students. Turn university syllabi into concise revision notes, diagnostic quizzes, detected knowledge gaps, and adaptive exam countdown plans.
          </p>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-base border border-slate-300 shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <span>Explore Features</span>
            </a>
          </div>

          {/* Proof Badges */}
          <div className="mt-12 pt-8 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Full-Stack Spring Boot & React</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Persistent MySQL Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Syllabus-Grounded Doc Q&A</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Real Performance Diagnostics</span>
            </div>
          </div>
        </div>

        {/* Ambient background blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-indigo-200/40 to-violet-200/40 rounded-full blur-3xl pointer-events-none -z-0" />
      </section>

      {/* Feature Cards Grid */}
      <section id="features" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Core Capabilities
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Engineered for College Academic Excellence
            </h2>
            <p className="mt-3 text-slate-600">
              Every tool is purpose-built to help you understand tough technical subjects, retain concepts, and pass semester assessments with distinction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="group relative rounded-2xl p-7 bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} text-white flex items-center justify-center shadow-md`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                        {feat.tag}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:gap-2 transition-all">
                    <span>Learn more</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Sample Dashboard Preview */}
      <section id="preview" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100/60 px-3 py-1 rounded-full border border-indigo-200">
              Live Architecture
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Student Command Center Preview
            </h2>
            <p className="mt-3 text-slate-600">
              A single unified workspace connecting syllabus tracking, readiness metrics, and smart study recommendations.
            </p>
          </div>

          {/* Interactive Mock Dashboard Shell */}
          <div className="rounded-3xl border border-slate-300 bg-white shadow-2xl overflow-hidden max-w-5xl mx-auto">
            {/* Window bar */}
            <div className="h-11 bg-slate-100 border-b border-slate-200 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-mono text-slate-500">studyapp.internal • student workspace</span>
              </div>
              <div className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                Connected: Spring Boot 4 + MySQL
              </div>
            </div>

            {/* Mock Content */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Header card */}
              <div className="rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-800 to-violet-900 p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-xs">
                    Semester 6 • B.Tech Computer Science
                  </span>
                  <h3 className="text-2xl font-bold mt-2">Welcome, Student! 👋</h3>
                  <p className="text-indigo-200 text-xs sm:text-sm mt-1">
                    Next examination: <strong className="text-white">Distributed Systems</strong> in 14 days.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-indigo-200">Exam Readiness</p>
                    <p className="text-2xl font-extrabold text-emerald-300">78%</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-amber-300" />
                  </div>
                </div>
              </div>

              {/* Stat grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-xs font-medium">Subjects Active</span>
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="text-xl font-bold text-slate-800">5 Courses</p>
                  <p className="text-xs text-emerald-600 font-medium mt-1">22 Units mapped</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-xs font-medium">Quizzes Completed</span>
                    <HelpCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-xl font-bold text-slate-800">18 Tests</p>
                  <p className="text-xs text-slate-500 mt-1">Avg 82.4% accuracy</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-xs font-medium">Revision Cards</span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-xl font-bold text-slate-800">42 Due</p>
                  <p className="text-xs text-amber-600 font-medium mt-1">Spaced repetition queue</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-xs font-medium">Detected Gaps</span>
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  </div>
                  <p className="text-xl font-bold text-rose-600">3 Weak Topics</p>
                  <p className="text-xs text-slate-500 mt-1">Targeted retest suggested</p>
                </div>
              </div>

              {/* Two Column Diagnostic Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-slate-200 bg-white">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-indigo-600" />
                    <span>Knowledge Gap Breakdown</span>
                  </h4>
                  <div className="mt-3 space-y-2.5">
                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-slate-700">Consensus Algorithms (Raft & Paxos)</span>
                        <span className="text-rose-600 font-bold">42% • Weak</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="w-[42%] h-full bg-rose-500 rounded-full" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-slate-700">Vector Clocks & Causality</span>
                        <span className="text-amber-600 font-bold">68% • Improving</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="w-[68%] h-full bg-amber-500 rounded-full" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-slate-700">RPC & Remote Invocation</span>
                        <span className="text-emerald-600 font-bold">95% • Mastered</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="w-[95%] h-full bg-emerald-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-purple-600" />
                      <span>AI Exam Readiness Recommendation</span>
                    </h4>
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                      "Prioritize Raft Leader Election. You made 2 conceptual errors on quorum partition in your last mock test. Suggested next step: Generate targeted AI Notes on Unit 3, then run a 5-question retest."
                    </p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link
                      to="/register"
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Start Practice Retest
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Structured Methodology
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              How StudyApp Prepares You
            </h2>
            <p className="mt-3 text-slate-600">
              Three systematic phases transforming unorganized college study materials into exam mastery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.step} className="relative p-8 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-3xl font-black text-indigo-600/40 mb-3 font-mono">
                  {s.step}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Student Benefits */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-indigo-50/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100/60 px-3 py-1 rounded-full border border-indigo-200">
              Key Advantages
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Why Students Choose StudyApp
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-base">Zero Hallucinations</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Answers are grounded directly in your syllabus and uploaded slides with explicit page citations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-base">Save 15+ Hours Weekly</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Automate flashcard creation, revision notes extraction, and diagnostic quiz preparation in seconds.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-base">Objective Analytics</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Scoring algorithms clearly show your calculation method and isolate untested areas without false confidence.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-base">Spaced Repetition</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Scientifically scheduled review prompts prevent the forgetting curve before midterms and finals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Got Questions?
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-slate-600">
              Everything you need to know about StudyApp architecture and features.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={faq.q}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between font-semibold text-slate-900 hover:text-indigo-600"
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 flex-shrink-0 text-indigo-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 flex-shrink-0 text-slate-400" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-16 bg-gradient-to-r from-indigo-700 via-indigo-800 to-violet-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Ace Your Semester Examinations?
          </h2>
          <p className="mt-3 text-indigo-200 max-w-xl mx-auto text-sm sm:text-base">
            Create your free account now and configure your syllabus in under two minutes.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl bg-white text-indigo-700 font-bold hover:bg-indigo-50 shadow-lg transition-all"
            >
              Get Started Now
            </Link>
            <Link
              to="/login"
              className="px-8 py-3.5 rounded-xl bg-indigo-600/60 hover:bg-indigo-600 text-white font-semibold border border-indigo-400/40 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white">StudyApp</span>
              <span className="text-xs text-slate-500">© 2026 StudyApp. All rights reserved.</span>
            </div>

            {/* Functioning Footer Links */}
            <div className="flex flex-wrap items-center gap-6 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveModal("about")}
                className="hover:text-white transition-colors"
              >
                About
              </button>
              <button
                type="button"
                onClick={() => setActiveModal("contact")}
                className="hover:text-white transition-colors"
              >
                Contact
              </button>
              <button
                type="button"
                onClick={() => setActiveModal("privacy")}
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setActiveModal("terms")}
                className="hover:text-white transition-colors"
              >
                Terms of Service
              </button>
              <button
                type="button"
                onClick={() => setActiveModal("support")}
                className="hover:text-white transition-colors"
              >
                Support
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Informational Modal Dialogs for Footer links */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            {activeModal === "about" && (
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">About StudyApp</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  StudyApp is an intelligent study and examination preparation system engineered for college and university students. It combines Spring Boot 4, MySQL, React 19, and advanced AI services to provide syllabus tracking, adaptive diagnostic testing, and knowledge gap detection.
                </p>
                <div className="p-3 bg-indigo-50 rounded-lg text-xs text-indigo-700">
                  Version 1.0.0 • Production College Major Project
                </div>
              </div>
            )}

            {activeModal === "contact" && (
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Contact Us</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Have questions, feedback, or need assistance? Reach out to the StudyApp platform development team:
                </p>
                <div className="space-y-2 text-sm text-slate-700">
                  <p>📧 Email: <strong className="text-indigo-600">support@studyapp.internal</strong></p>
                  <p>📍 Location: College Engineering Campus</p>
                </div>
              </div>
            )}

            {activeModal === "privacy" && (
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Privacy Policy</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  We value your privacy. All study notes, syllabus documents, and quiz results are strictly isolated by your user ID. Passwords are encrypted using BCrypt, and external AI providers only receive text payloads necessary for generating learning materials.
                </p>
                <p className="text-xs text-slate-500">Last updated: October 2026</p>
              </div>
            )}

            {activeModal === "terms" && (
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Terms of Service</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  StudyApp is designed to assist educational revision and examination preparation. AI-generated evaluations and readiness scores are diagnostic estimates and do not guarantee exact university examination scores.
                </p>
              </div>
            )}

            {activeModal === "support" && (
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Help & Support</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  Need help configuring your subjects or AI provider? Check the project README or access the in-app documentation under Settings.
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
