import { useState, useEffect } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
  Trash2,
  HardDrive,
  FileText,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Search,
  Eye,
  Info,
  RotateCw,
} from "lucide-react";
import { offlineService } from "../../services/offline.service";
import { useOfflineStatus } from "../../hooks/useOfflineStatus";
import type { OfflineNote, OfflineFlashcard, OfflineDocument } from "../../utils/offlineDb";
import toast from "react-hot-toast";

export default function OfflineLibraryPage() {
  const { isOnline, isSyncing, pendingCount, storageInfo, triggerSync, refreshStats } = useOfflineStatus();

  const [activeTab, setActiveTab] = useState<"notes" | "flashcards" | "documents" | "sync">("notes");
  const [notes, setNotes] = useState<OfflineNote[]>([]);
  const [flashcards, setFlashcards] = useState<OfflineFlashcard[]>([]);
  const [documents, setDocuments] = useState<OfflineDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  // Note Viewer Modal
  const [selectedNote, setSelectedNote] = useState<OfflineNote | null>(null);

  // Document Viewer Modal
  const [selectedDoc, setSelectedDoc] = useState<OfflineDocument | null>(null);

  // Flashcard Revision Practice Mode
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studySessionTimer, setStudySessionTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    loadLocalMaterials();
  }, []);

  // Simple study timer for offline focus tracking
  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setStudySessionTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const loadLocalMaterials = async () => {
    try {
      const [n, f, d] = await Promise.all([
        offlineService.getOfflineNotes(),
        offlineService.getOfflineFlashcards(),
        offlineService.getOfflineDocuments(),
      ]);
      setNotes(n);
      setFlashcards(f);
      setDocuments(d);
      await refreshStats();
    } catch (e) {
      console.error("Error loading offline materials:", e);
    }
  };

  const handleDownloadAll = async () => {
    if (!isOnline) {
      toast.error("Internet connection required to download fresh materials.");
      return;
    }
    setIsDownloadingAll(true);
    try {
      const [notesCount, cardsCount, docsCount] = await Promise.all([
        offlineService.downloadAllNotes().catch(() => 0),
        offlineService.downloadAllFlashcards().catch(() => 0),
        offlineService.downloadAllDocuments().catch(() => 0),
      ]);
      await loadLocalMaterials();
      toast.success(
        `Downloaded ${notesCount} note(s), ${cardsCount} flashcard(s), and ${docsCount} document(s) for offline study! 🚀`
      );
    } catch {
      toast.error("Failed to download some materials. Check network connectivity.");
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      await offlineService.deleteOfflineNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNote?.id === id) setSelectedNote(null);
      await refreshStats();
      toast.success("Note removed from offline storage");
    } catch {
      toast.error("Could not remove note");
    }
  };

  const handleDeleteFlashcard = async (id: number) => {
    try {
      await offlineService.deleteOfflineFlashcard(id);
      setFlashcards((prev) => prev.filter((f) => f.id !== id));
      await refreshStats();
      toast.success("Flashcard removed from offline storage");
    } catch {
      toast.error("Could not remove flashcard");
    }
  };

  const handleDeleteDoc = async (id: number) => {
    try {
      await offlineService.deleteOfflineDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (selectedDoc?.id === id) setSelectedDoc(null);
      await refreshStats();
      toast.success("Document removed from offline storage");
    } catch {
      toast.error("Could not remove document");
    }
  };

  const handleClearAllStorage = async () => {
    if (confirm("Are you sure you want to remove all offline study materials and clear cache?")) {
      await offlineService.clearAllOfflineData();
      await loadLocalMaterials();
      toast.success("Offline storage cleared completely");
    }
  };

  // Flashcard review handler (works completely offline via IndexedDB queue)
  const handleRateCard = async (rating: "AGAIN" | "HARD" | "GOOD" | "EASY") => {
    const currentCard = filteredFlashcards[cardIndex];
    if (!currentCard) return;

    try {
      const { updatedCard } = await offlineService.recordOfflineFlashcardReview(currentCard.id, rating, 10);
      if (updatedCard) {
        setFlashcards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
      }
      setIsFlipped(false);
      await refreshStats();

      if (cardIndex + 1 < filteredFlashcards.length) {
        setCardIndex((prev) => prev + 1);
      } else {
        toast.success("Deck completed! Reviewed all available offline cards! 🎉");
        setCardIndex(0);
      }
    } catch {
      toast.error("Failed to record offline review");
    }
  };

  // Complete offline study timer session
  const handleFinishTimerSession = async () => {
    const minutes = Math.max(1, Math.round(studySessionTimer / 60));
    setTimerRunning(false);
    setStudySessionTimer(0);
    try {
      await offlineService.recordOfflineStudySession({
        title: "Offline Focus Study",
        actualDurationMinutes: minutes,
        sessionType: "POMODORO",
        notes: `Studied ${minutes} minutes in Offline Study Mode.`,
      });
      await refreshStats();
      toast.success(`Logged ${minutes} minute offline session! Will sync when reconnected. ⏱️`);
    } catch {
      toast.error("Failed to log offline session");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 KB";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Filtered collections
  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.subjectName && n.subjectName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredFlashcards = flashcards.filter(
    (f) =>
      f.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.back.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDocs = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner: Status & Quick Controls */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-sm ${
              isOnline
                ? "bg-gradient-to-tr from-emerald-500 to-teal-600"
                : "bg-gradient-to-tr from-amber-500 to-orange-600"
            }`}
          >
            {isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">Offline Study Library</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                  isOnline
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                {isOnline ? "Online Mode" : "Offline Mode Active"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Read notes, review SM-2 flashcards, and track study sessions anywhere. All progress syncs automatically.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Sync Button */}
          <button
            onClick={() => triggerSync(false)}
            disabled={isSyncing || !isOnline}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-all ${
              pendingCount > 0 && isOnline
                ? "bg-indigo-600 hover:bg-indigo-700 text-white animate-pulse"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50"
            }`}
            title={!isOnline ? "Connect to internet to sync" : undefined}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : pendingCount > 0 ? `Sync (${pendingCount} Pending)` : "Sync All"}
          </button>

          {/* Download All Button */}
          <button
            onClick={handleDownloadAll}
            disabled={isDownloadingAll || !isOnline}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${isDownloadingAll ? "animate-bounce" : ""}`} />
            {isDownloadingAll ? "Downloading..." : "Download All Materials"}
          </button>
        </div>
      </div>

      {/* Feature Explanations & Security Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200/80 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 space-y-1">
          <p className="font-semibold text-slate-900">
            Offline Capability Notice & AI Boundaries:
          </p>
          <p className="leading-relaxed text-slate-600">
            You can access all downloaded notes, revise flashcards with full SM-2 repetition, read PDF/text chunks,
            and log focus sessions completely offline. Real-time AI generative features (such as Groq AI Tutor chat,
            video search, and visual image solving) require cloud AI APIs and are paused while disconnected.
            No API keys or cloud credentials are ever exposed in client storage.
          </p>
        </div>
      </div>

      {/* Storage and Activity Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Storage Meter */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-indigo-600">
                <HardDrive className="w-4 h-4" />
                Browser Storage
              </span>
              <span>IndexedDB</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900">
                {formatBytes(storageInfo.bytesUsed)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Estimated cached notes, flashcards & documents
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Browser Quota Safe</span>
            <button
              onClick={handleClearAllStorage}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
            >
              Clear Storage
            </button>
          </div>
        </div>

        {/* Downloaded Notes Metric */}
        <div
          onClick={() => setActiveTab("notes")}
          className={`p-5 rounded-3xl bg-white border shadow-xs cursor-pointer transition-all ${
            activeTab === "notes" ? "border-indigo-500 ring-2 ring-indigo-500/10" : "border-slate-200 hover:border-indigo-200"
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900">{notes.length}</div>
          <p className="text-xs text-slate-500 mt-0.5">Downloaded Revision Notes</p>
        </div>

        {/* Downloaded Flashcards Metric */}
        <div
          onClick={() => setActiveTab("flashcards")}
          className={`p-5 rounded-3xl bg-white border shadow-xs cursor-pointer transition-all ${
            activeTab === "flashcards" ? "border-amber-500 ring-2 ring-amber-500/10" : "border-slate-200 hover:border-amber-200"
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900">{flashcards.length}</div>
          <p className="text-xs text-slate-500 mt-0.5">Active Recall Flashcards</p>
        </div>

        {/* Downloaded Documents Metric */}
        <div
          onClick={() => setActiveTab("documents")}
          className={`p-5 rounded-3xl bg-white border shadow-xs cursor-pointer transition-all ${
            activeTab === "documents" ? "border-violet-500 ring-2 ring-violet-500/10" : "border-slate-200 hover:border-violet-200"
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-slate-900">{documents.length}</div>
          <p className="text-xs text-slate-500 mt-0.5">Study Documents & Chunks</p>
        </div>
      </div>

      {/* Tabs Navigation & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("notes")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "notes" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Notes ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab("flashcards")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "flashcards" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Flashcards ({flashcards.length})
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "documents" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Documents ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab("sync")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "sync" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sync Queue
            {pendingCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search downloaded items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* ================= TAB 1: NOTES ================= */}
      {activeTab === "notes" && (
        <div>
          {filteredNotes.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Offline Notes Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {searchQuery
                  ? "No notes matched your query."
                  : isOnline
                  ? "Click 'Download All Materials' to cache your study notes locally for offline viewing."
                  : "You haven't saved any notes for offline study yet."}
              </p>
              {isOnline && (
                <button
                  onClick={handleDownloadAll}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Download All Notes Now
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-semibold text-indigo-600">
                        {note.subjectName || "General Note"}
                      </span>
                      <span>
                        Downloaded {new Date(note.downloadedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base line-clamp-1">{note.title}</h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                      {note.content.substring(0, 160)}...
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedNote(note)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Read Offline
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Remove from offline cache"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: FLASHCARDS ================= */}
      {activeTab === "flashcards" && (
        <div className="space-y-6">
          {filteredFlashcards.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Offline Flashcards Available</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Download your flashcard deck when online to practice SuperMemo SM-2 spaced repetition anywhere.
              </p>
              {isOnline && (
                <button
                  onClick={handleDownloadAll}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Download Deck Now
                </button>
              )}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-5">
              {/* Deck header & progress */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold text-slate-700">
                  Card {cardIndex + 1} of {filteredFlashcards.length}
                </span>
                <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-bold">
                  {filteredFlashcards[cardIndex]?.difficulty || "MEDIUM"}
                </span>
              </div>

              {/* Interactive Flashcard Card */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="relative min-h-[260px] p-8 rounded-3xl bg-white border-2 border-indigo-100 shadow-md hover:border-indigo-300 cursor-pointer flex flex-col justify-between transition-all"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>{isFlipped ? "Answer & Explanation" : "Active Recall Question"}</span>
                  <span className="text-indigo-600 flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5" />
                    Click to flip
                  </span>
                </div>

                <div className="my-auto py-4 text-center">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                    {isFlipped
                      ? filteredFlashcards[cardIndex]?.back
                      : filteredFlashcards[cardIndex]?.front}
                  </h3>
                  {filteredFlashcards[cardIndex]?.hint && !isFlipped && (
                    <p className="mt-4 text-xs text-indigo-600 font-medium bg-indigo-50 px-3 py-1.5 rounded-xl inline-block">
                      💡 Hint: {filteredFlashcards[cardIndex]?.hint}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Interval: {filteredFlashcards[cardIndex]?.intervalDays || 1} day(s)
                  </span>
                  <span>
                    Ease: {filteredFlashcards[cardIndex]?.easeFactor || 2.5}
                  </span>
                </div>
              </div>

              {/* SM-2 Rating Controls */}
              {isFlipped ? (
                <div className="grid grid-cols-4 gap-2 pt-2 animate-in fade-in duration-150">
                  <button
                    onClick={() => handleRateCard("AGAIN")}
                    className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex flex-col items-center gap-1 transition-all"
                  >
                    <span>Again (0)</span>
                    <span className="text-[10px] font-normal text-rose-600">1 day</span>
                  </button>
                  <button
                    onClick={() => handleRateCard("HARD")}
                    className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold flex flex-col items-center gap-1 transition-all"
                  >
                    <span>Hard (1)</span>
                    <span className="text-[10px] font-normal text-amber-600">Short review</span>
                  </button>
                  <button
                    onClick={() => handleRateCard("GOOD")}
                    className="p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex flex-col items-center gap-1 transition-all"
                  >
                    <span>Good (2)</span>
                    <span className="text-[10px] font-normal text-blue-600">Gradual</span>
                  </button>
                  <button
                    onClick={() => handleRateCard("EASY")}
                    className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex flex-col items-center gap-1 transition-all"
                  >
                    <span>Easy (3)</span>
                    <span className="text-[10px] font-normal text-emerald-600">Long leap</span>
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <button
                    onClick={() => setIsFlipped(true)}
                    className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all"
                  >
                    Show Answer
                  </button>
                </div>
              )}

              {/* Navigation pagination */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setCardIndex((prev) => Math.max(0, prev - 1));
                    setIsFlipped(false);
                  }}
                  disabled={cardIndex === 0}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  &larr; Previous Card
                </button>
                <button
                  onClick={() => handleDeleteFlashcard(filteredFlashcards[cardIndex].id)}
                  className="text-xs text-rose-500 hover:text-rose-700 font-semibold"
                >
                  Remove Card
                </button>
                <button
                  onClick={() => {
                    setCardIndex((prev) => Math.min(filteredFlashcards.length - 1, prev + 1));
                    setIsFlipped(false);
                  }}
                  disabled={cardIndex >= filteredFlashcards.length - 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next Card &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: DOCUMENTS ================= */}
      {activeTab === "documents" && (
        <div>
          {filteredDocs.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Offline Documents Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Download your textbook PDFs or study guides to read notes and review indexed chunks offline.
              </p>
              {isOnline && (
                <button
                  onClick={handleDownloadAll}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Download Documents Now
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-bold text-violet-600 uppercase tracking-wider">
                        {doc.fileType} • {doc.chunks?.length || 0} Chunks
                      </span>
                      <span>{new Date(doc.downloadedAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base line-clamp-1">{doc.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{doc.fileName}</p>
                    {doc.summary && (
                      <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {doc.summary}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Chunks ({doc.chunks?.length || 0})
                    </button>
                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Remove from offline cache"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: SYNC QUEUE & OFFLINE TIMER ================= */}
      {activeTab === "sync" && (
        <div className="space-y-6">
          {/* Offline Focus Timer Widget */}
          <div className="p-6 rounded-3xl bg-gradient-to-tr from-slate-900 to-indigo-950 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Offline Focus Study Tracker
              </span>
              <h2 className="text-xl sm:text-2xl font-black mt-1">Pomodoro Focus Timer</h2>
              <p className="text-xs text-indigo-200 mt-1 max-w-lg">
                Study offline with zero distractions. When you finish, your focus session will queue locally
                and earn XP and streak updates upon reconnection.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-emerald-400">
                {Math.floor(studySessionTimer / 60)
                  .toString()
                  .padStart(2, "0")}
                :{(studySessionTimer % 60).toString().padStart(2, "0")}
              </div>
              <div className="flex items-center gap-2">
                {!timerRunning ? (
                  <button
                    onClick={() => setTimerRunning(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black shadow-xs transition-colors"
                  >
                    Start Timer
                  </button>
                ) : (
                  <button
                    onClick={handleFinishTimerSession}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black shadow-xs transition-colors"
                  >
                    Finish Session
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Pending Sync Items Details */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Pending Offline Synchronization Queue</h3>
                <p className="text-xs text-slate-500">
                  {pendingCount === 0
                    ? "All local study activities are currently synchronized with cloud storage."
                    : `${pendingCount} item(s) stored in IndexedDB awaiting upload.`}
                </p>
              </div>
              <button
                onClick={() => triggerSync(false)}
                disabled={isSyncing || !isOnline || pendingCount === 0}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-40 transition-colors shadow-xs flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                Sync Now
              </button>
            </div>

            {pendingCount === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                No queued actions. Everything is synchronized.
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  🔔 Notice: Reconnect to the internet and click "Sync Now". All queued sessions and flashcard ratings
                  will be awarded their full XP points and count toward daily streaks.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note Reader Modal */}
      {selectedNote && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  {selectedNote.subjectName || "Offline Note"}
                </span>
                <h2 className="text-xl font-black text-slate-900">{selectedNote.title}</h2>
              </div>
              <button
                onClick={() => setSelectedNote(null)}
                className="p-2 rounded-full hover:bg-slate-200 text-slate-500 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
              {selectedNote.content}
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>Saved in IndexedDB offline cache</span>
              <button
                onClick={() => setSelectedNote(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Chunks Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                  {selectedDoc.fileType} • {selectedDoc.chunks?.length || 0} Chunks Cached
                </span>
                <h2 className="text-xl font-black text-slate-900">{selectedDoc.title}</h2>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-2 rounded-full hover:bg-slate-200 text-slate-500 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              {selectedDoc.summary && (
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-950">
                  <strong className="block font-bold mb-1">Executive Summary:</strong>
                  {selectedDoc.summary}
                </div>
              )}
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Indexed Excerpts:</h4>
              {selectedDoc.chunks && selectedDoc.chunks.length > 0 ? (
                selectedDoc.chunks.map((chunk, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-white text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-600">
                      <span>Chunk #{chunk.chunkIndex + 1}</span>
                      <span>Page {chunk.pageNumber}</span>
                    </div>
                    {chunk.sectionHeading && (
                      <p className="font-semibold text-indigo-700">{chunk.sectionHeading}</p>
                    )}
                    <p className="text-slate-700 leading-relaxed">{chunk.chunkContent}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No chunk text stored.</p>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end text-xs">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold"
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
