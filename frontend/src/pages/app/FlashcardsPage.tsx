import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Layers,
  Sparkles,
  RotateCw,
  CheckCircle2,
  Calendar,
  Award,
  Plus,
  Trash2,
  Brain,
  Search,
  Loader2,
  ArrowRight,
  Lightbulb,
  Download
} from "lucide-react";
import {
  flashcardService,
  type Flashcard,
  type GeneratedCardItem,
  type FlashcardStats,
  type ReviewRating,
} from "../../services/flashcard.service";
import { subjectService, type SubjectItem } from "../../services/subject.service";
import { offlineService } from "../../services/offline.service";
import toast from "react-hot-toast";

type TabMode = "review" | "deck" | "generate";

export default function FlashcardsPage() {
  const [searchParams] = useSearchParams();

  // Tab State
  const [activeTab, setActiveTab] = useState<TabMode>("review");

  // Data State
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [stats, setStats] = useState<FlashcardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filter
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<number | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Review Session State
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Generator State
  const [genSubjectId, setGenSubjectId] = useState<number | undefined>(undefined);
  const [genSubjectName, setGenSubjectName] = useState(searchParams.get("subjectName") || "");
  const [genTopic, setGenTopic] = useState(searchParams.get("topic") || "");
  const [genDifficulty, setGenDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [genCount, setGenCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<GeneratedCardItem[]>([]);

  // Manual Creation State
  const [showManualModal, setShowManualModal] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [newHint, setNewHint] = useState("");
  const [newSubjectId, setNewSubjectId] = useState<number | undefined>(undefined);
  const [newDifficulty, setNewDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [allCards, dueList, subList, statsData] = await Promise.all([
        flashcardService.getCards(),
        flashcardService.getDueCards(),
        subjectService.getSubjects(),
        flashcardService.getStats(),
      ]);
      setCards(allCards);
      setDueCards(dueList);
      setSubjects(subList);
      setStats(statsData);

      // Pre-select subject if param given
      const qSubId = searchParams.get("subjectId");
      if (qSubId) {
        const found = subList.find((s) => s.id === Number(qSubId));
        if (found) {
          setGenSubjectId(found.id);
          setGenSubjectName(found.name);
          setNewSubjectId(found.id);
        }
      }
    } catch {
      toast.error("Failed to load flashcard decks");
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard controls for review
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== "review" || dueCards.length === 0 || sessionCompleted) return;

      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === "1") handleReviewRating("AGAIN");
        if (e.key === "2") handleReviewRating("HARD");
        if (e.key === "3") handleReviewRating("GOOD");
        if (e.key === "4") handleReviewRating("EASY");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, isFlipped, dueCards, reviewIndex, sessionCompleted]);

  // ==========================================
  // REVIEW HANDLERS
  // ==========================================
  const handleReviewRating = async (rating: ReviewRating) => {
    if (dueCards.length === 0 || reviewIndex >= dueCards.length) return;
    const currentCard = dueCards[reviewIndex];

    try {
      setIsReviewing(true);
      const updated = await flashcardService.reviewCard(currentCard.id, { rating });

      // Update card in master list
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

      // Advance
      if (reviewIndex + 1 < dueCards.length) {
        setReviewIndex((prev) => prev + 1);
        setIsFlipped(false);
        setShowHint(false);
      } else {
        setSessionCompleted(true);
        toast.success("Review session completed! Outstanding retention.");
      }

      // Refresh stats
      flashcardService.getStats().then(setStats).catch(() => {});
    } catch {
      toast.error("Failed to record card review");
    } finally {
      setIsReviewing(false);
    }
  };

  const handleRestartReview = () => {
    setReviewIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setSessionCompleted(false);
    flashcardService.getDueCards().then(setDueCards).catch(() => {});
  };

  // ==========================================
  // GENERATOR HANDLERS
  // ==========================================
  const handleGenerateCards = async () => {
    if (!genTopic.trim()) {
      toast.error("Please enter a topic to generate flashcards");
      return;
    }

    try {
      setIsGenerating(true);
      const sName =
        genSubjectName || (genSubjectId ? subjects.find((s) => s.id === genSubjectId)?.name : "General");
      const generated = await flashcardService.generateCards({
        subjectId: genSubjectId,
        subjectName: sName,
        topic: genTopic.trim(),
        difficulty: genDifficulty,
        cardCount: genCount,
      });

      setGeneratedPreview(generated);
      toast.success(`Generated ${generated.length} flashcards! Review and save.`);
    } catch {
      toast.error("Flashcard generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveBatch = async (startReviewNow: boolean) => {
    if (generatedPreview.length === 0) return;

    try {
      const saved = await flashcardService.batchSaveCards({
        subjectId: genSubjectId,
        cards: generatedPreview,
      });

      toast.success(`Added ${saved.length} flashcards to your deck!`);
      setCards((prev) => [...saved, ...prev]);
      setGeneratedPreview([]);

      if (startReviewNow) {
        setDueCards((prev) => [...saved, ...prev]);
        setReviewIndex(0);
        setIsFlipped(false);
        setSessionCompleted(false);
        setActiveTab("review");
      } else {
        setActiveTab("deck");
      }

      flashcardService.getStats().then(setStats).catch(() => {});
    } catch {
      toast.error("Failed to save flashcards");
    }
  };

  // ==========================================
  // MANUAL CARD CREATION
  // ==========================================
  const handleCreateManualCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) {
      toast.error("Both question and answer are required");
      return;
    }

    try {
      const created = await flashcardService.createCard({
        subjectId: newSubjectId,
        front: newFront.trim(),
        back: newBack.trim(),
        hint: newHint.trim() || undefined,
        difficulty: newDifficulty,
      });

      toast.success("Flashcard added!");
      setCards((prev) => [created, ...prev]);
      setDueCards((prev) => [created, ...prev]);
      setShowManualModal(false);
      setNewFront("");
      setNewBack("");
      setNewHint("");
      flashcardService.getStats().then(setStats).catch(() => {});
    } catch {
      toast.error("Failed to add flashcard");
    }
  };

  const handleDeleteCard = async (id: number) => {
    if (!window.confirm("Delete this flashcard permanently?")) return;
    try {
      await flashcardService.deleteCard(id);
      setCards((prev) => prev.filter((c) => c.id !== id));
      setDueCards((prev) => prev.filter((c) => c.id !== id));
      toast.success("Card deleted");
      flashcardService.getStats().then(setStats).catch(() => {});
    } catch {
      toast.error("Failed to delete card");
    }
  };

  // Filtered Deck
  const filteredCards = cards.filter((c) => {
    const matchSub = selectedSubjectFilter === "ALL" || c.subjectId === selectedSubjectFilter;
    const matchSearch =
      searchQuery === "" ||
      c.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.back.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.subjectName && c.subjectName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSub && matchSearch;
  });

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-sm font-medium">Loading Flashcard Decks & Spaced Repetition Schedule...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Flashcards & Spaced Repetition
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Active recall powered by SuperMemo-2 (SM-2) memory scheduling for long-term retention.
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <button
            onClick={async () => {
              try {
                const count = await offlineService.downloadAllFlashcards();
                toast.success(`Saved ${count} flashcards to Offline Library! 📥`);
              } catch {
                toast.error("Failed to download flashcards for offline study");
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs shadow-xs transition-colors"
            title="Download full deck to browser IndexedDB for offline revision"
          >
            <Download className="w-4 h-4 text-teal-600" />
            Save Deck Offline
          </button>
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Card
          </button>
          <button
            onClick={() => setActiveTab("generate")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs shadow-md transition-all shadow-indigo-500/20"
          >
            <Sparkles className="w-4 h-4" />
            AI Card Generator
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-rose-500" />
            Due for Review Today
          </span>
          <p className="text-2xl font-black text-rose-600">{stats?.dueTodayCount || dueCards.length}</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-600" />
            Total Deck Size
          </span>
          <p className="text-2xl font-black text-slate-900">{stats?.totalCards || cards.length}</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-600" />
            Mastered Concepts
          </span>
          <p className="text-2xl font-black text-emerald-700">{stats?.masteredCount || 0}</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-amber-500" />
            Total Reviews Completed
          </span>
          <p className="text-2xl font-black text-slate-900">{stats?.totalReviews || 0}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
        <button
          onClick={() => setActiveTab("review")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
            activeTab === "review"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <RotateCw className="w-4 h-4" />
          Active Recall Session ({dueCards.length})
        </button>
        <button
          onClick={() => setActiveTab("deck")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
            activeTab === "deck"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Layers className="w-4 h-4" />
          Deck Manager ({cards.length})
        </button>
        <button
          onClick={() => setActiveTab("generate")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
            activeTab === "generate"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          AI Generator
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ACTIVE RECALL / 3D FLIP CARD REVIEW */}
      {/* ========================================================================= */}
      {activeTab === "review" && (
        <div className="space-y-6">
          {sessionCompleted || dueCards.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4 max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">All Caught Up for Today! 🎉</h2>
              <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                You have reviewed all cards currently due under your SM-2 schedule. Your memory consolidation is on track!
              </p>
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => {
                    setDueCards(cards);
                    handleRestartReview();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                >
                  Practice Entire Deck Anyway ({cards.length})
                </button>
                <button
                  onClick={() => setActiveTab("generate")}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate New Cards
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Progress & Shortcuts Header */}
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-2">
                <span>
                  Card {reviewIndex + 1} of {dueCards.length}
                </span>
                <span className="text-[11px] bg-slate-100 px-2.5 py-1 rounded-md text-slate-600 font-mono">
                  [Space] to Flip • [1-4] to Rate
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((reviewIndex + 1) / dueCards.length) * 100}%` }}
                />
              </div>

              {/* 3D Interactive Card */}
              {(() => {
                const card = dueCards[reviewIndex];

                return (
                  <div
                    onClick={() => setIsFlipped((prev) => !prev)}
                    className="relative cursor-pointer min-h-[360px] w-full rounded-3xl border border-slate-200 bg-white shadow-lg hover:shadow-xl transition-all p-8 flex flex-col justify-between select-none group"
                  >
                    {/* Card Top Metadata */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {card.subjectName || "General Engineering"}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                        {isFlipped ? "Answer / Back" : "Prompt / Front"}
                      </span>
                    </div>

                    {/* Card Content */}
                    <div className="my-auto py-6 text-center space-y-4">
                      {!isFlipped ? (
                        <>
                          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-2">
                            Active Recall Question
                          </span>
                          <h2 className="text-2xl font-bold text-slate-900 leading-snug">
                            {card.front}
                          </h2>
                          {card.hint && (
                            <div className="pt-4">
                              {showHint ? (
                                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 inline-block font-medium">
                                  💡 Hint: {card.hint}
                                </p>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowHint(true);
                                  }}
                                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mx-auto font-medium"
                                >
                                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                                  Show Hint
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="animate-fade-in space-y-3">
                          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-2">
                            Explanation & Concept
                          </span>
                          <div className="text-base font-medium text-slate-800 leading-relaxed whitespace-pre-line text-left bg-slate-50 border border-slate-200 rounded-2xl p-6">
                            {card.back}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Footer Hint */}
                    <div className="text-center text-xs text-slate-400 font-medium">
                      {!isFlipped ? "Click anywhere or press Space to flip" : "Rate how well you recalled this concept below"}
                    </div>
                  </div>
                );
              })()}

              {/* Rating Controls (Shown after flip) */}
              {isFlipped ? (
                <div className="grid grid-cols-4 gap-3 animate-fade-in">
                  <button
                    onClick={() => handleReviewRating("AGAIN")}
                    disabled={isReviewing}
                    className="p-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 flex flex-col items-center justify-center gap-1 transition-all"
                  >
                    <span className="text-xs font-bold flex items-center gap-1">
                      <span className="w-4 h-4 rounded bg-rose-200 text-rose-900 flex items-center justify-center text-[10px]">1</span>
                      Again
                    </span>
                    <span className="text-[10px] text-rose-600 font-medium">&lt; 1 day</span>
                  </button>

                  <button
                    onClick={() => handleReviewRating("HARD")}
                    disabled={isReviewing}
                    className="p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 flex flex-col items-center justify-center gap-1 transition-all"
                  >
                    <span className="text-xs font-bold flex items-center gap-1">
                      <span className="w-4 h-4 rounded bg-amber-200 text-amber-900 flex items-center justify-center text-[10px]">2</span>
                      Hard
                    </span>
                    <span className="text-[10px] text-amber-600 font-medium">1 - 2 days</span>
                  </button>

                  <button
                    onClick={() => handleReviewRating("GOOD")}
                    disabled={isReviewing}
                    className="p-3.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 flex flex-col items-center justify-center gap-1 transition-all"
                  >
                    <span className="text-xs font-bold flex items-center gap-1">
                      <span className="w-4 h-4 rounded bg-indigo-200 text-indigo-900 flex items-center justify-center text-[10px]">3</span>
                      Good
                    </span>
                    <span className="text-[10px] text-indigo-600 font-medium">4 - 6 days</span>
                  </button>

                  <button
                    onClick={() => handleReviewRating("EASY")}
                    disabled={isReviewing}
                    className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex flex-col items-center justify-center gap-1 transition-all"
                  >
                    <span className="text-xs font-bold flex items-center gap-1">
                      <span className="w-4 h-4 rounded bg-emerald-200 text-emerald-900 flex items-center justify-center text-[10px]">4</span>
                      Easy
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium">7+ days</span>
                  </button>
                </div>
              ) : (
                <div className="flex justify-center">
                  <button
                    onClick={() => setIsFlipped(true)}
                    className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                  >
                    <RotateCw className="w-4 h-4" />
                    Reveal Answer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DECK MANAGER */}
      {/* ========================================================================= */}
      {activeTab === "deck" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search concepts or prompts..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500">Subject:</span>
              <select
                value={selectedSubjectFilter}
                onChange={(e) =>
                  setSelectedSubjectFilter(
                    e.target.value === "ALL" ? "ALL" : Number(e.target.value)
                  )
                }
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredCards.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 space-y-3">
              <Layers className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Flashcards Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Generate active recall flashcards from syllabus topics or add your own cards.
              </p>
              <button
                onClick={() => setActiveTab("generate")}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                Generate Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCards.map((card) => {
                const isMastered = card.intervalDays >= 21;

                return (
                  <div
                    key={card.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {card.subjectName || "General"}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isMastered
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200"
                          }`}
                        >
                          {isMastered ? "Mastered" : `Interval: ${card.intervalDays}d`}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                        {card.front}
                      </h4>

                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {card.back}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                      <span>Next review: {card.nextReviewDate}</span>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Delete Card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AI FLASHCARD GENERATOR */}
      {/* ========================================================================= */}
      {activeTab === "generate" && (
        <div className="space-y-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-black text-slate-900">Generate Concept Flashcards with AI</h2>
            <p className="text-xs text-slate-500">
              Instantly create active recall question–answer pairs from any subject or syllabus sub-topic.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Target Subject
                </label>
                <select
                  value={genSubjectId || ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : undefined;
                    setGenSubjectId(val);
                    const sub = subjects.find((s) => s.id === val);
                    if (sub) setGenSubjectName(sub.name);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="">Select a subject...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Topic / Sub-Topic *
                </label>
                <input
                  type="text"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="e.g. CPU Scheduling Algorithms, Paging, Deadlocks"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["EASY", "MEDIUM", "HARD"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setGenDifficulty(lvl)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        genDifficulty === lvl
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Cards Count
                </label>
                <select
                  value={genCount}
                  onChange={(e) => setGenCount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value={3}>3 Flashcards (Quick Review)</option>
                  <option value={5}>5 Flashcards (Standard)</option>
                  <option value={10}>10 Flashcards (Deep Dive)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleGenerateCards}
                disabled={isGenerating || !genTopic.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Flashcards...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Flashcards
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generator Preview */}
          {generatedPreview.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Preview Generated Cards ({generatedPreview.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review and save these cards into your spaced-repetition study deck.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSaveBatch(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                  >
                    Save to Deck
                  </button>
                  <button
                    onClick={() => handleSaveBatch(true)}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    Save & Review Now
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedPreview.map((card, idx) => (
                  <div key={idx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase">
                      Card #{idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{card.front}</h4>
                    <p className="text-xs text-slate-600 whitespace-pre-line bg-white p-3 rounded-xl border border-slate-200">
                      {card.back}
                    </p>
                    {card.hint && (
                      <span className="text-[11px] text-amber-700 italic block">
                        Hint: {card.hint}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Card Creation Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-fade-in">
            <h3 className="text-lg font-black text-slate-900">Add New Flashcard</h3>

            <form onSubmit={handleCreateManualCard} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <select
                  value={newSubjectId || ""}
                  onChange={(e) => setNewSubjectId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium"
                >
                  <option value="">Select a subject...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Card Front (Question / Prompt) *
                </label>
                <textarea
                  rows={3}
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  placeholder="e.g. What is the difference between paging and segmentation?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Card Back (Answer / Explanation) *
                </label>
                <textarea
                  rows={4}
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  placeholder="e.g. Paging is fixed-size blocks managed by hardware. Segmentation is variable-size user-defined logical units..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Memory Hint (Optional)</label>
                <input
                  type="text"
                  value={newHint}
                  onChange={(e) => setNewHint(e.target.value)}
                  placeholder="e.g. Fixed blocks vs Logical modules"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["EASY", "MEDIUM", "HARD"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setNewDifficulty(lvl)}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        newDifficulty === lvl
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
