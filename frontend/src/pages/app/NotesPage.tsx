import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  Printer, 
  Save, 
  Trash2, 
  BookOpen, 
  Loader2, 
  Search,
  Download
} from "lucide-react";
import { noteService, type NoteItem } from "../../services/note.service";
import { subjectService, type SubjectItem } from "../../services/subject.service";
import { offlineService } from "../../services/offline.service";
import toast from "react-hot-toast";

export default function NotesPage() {
  const [searchParams] = useSearchParams();

  // Subjects & Saved Notes
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [savedNotes, setSavedNotes] = useState<NoteItem[]>([]);
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);

  // Note Generator Form state
  const [subjectName, setSubjectName] = useState(searchParams.get("subjectName") || "");
  const [subjectId, setSubjectId] = useState<number | undefined>(
    searchParams.get("subjectId") ? Number(searchParams.get("subjectId")) : undefined
  );
  const [topic, setTopic] = useState(searchParams.get("topic") || "");
  const [academicLevel, setAcademicLevel] = useState("Undergraduate");
  const [explanationStyle, setExplanationStyle] = useState("Exam-Oriented");
  const [detailLevel, setDetailLevel] = useState("Comprehensive");
  const [additionalContext, setAdditionalContext] = useState("");

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subs, notes] = await Promise.all([
        subjectService.getSubjects(),
        noteService.getNotes(),
      ]);
      setSubjects(subs);
      setSavedNotes(notes);

      // Pre-select subject if in query param
      const qSubId = searchParams.get("subjectId");
      if (qSubId && !subjectName) {
        const found = subs.find(s => s.id === Number(qSubId));
        if (found) {
          setSubjectId(found.id);
          setSubjectName(found.name);
        }
      }
    } catch {
      toast.error("Failed to load subjects or notes");
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error("Please enter a topic to generate notes for");
      return;
    }

    try {
      setIsGenerating(true);
      setSelectedNote(null);
      const res = await noteService.generateNote({
        subjectName: subjectName || "General Engineering",
        subjectId,
        topic: topic.trim(),
        academicLevel,
        explanationStyle,
        detailLevel,
        additionalContext: additionalContext.trim() || undefined,
      });

      setGeneratedContent(res.content);
      setNoteTitle(`${topic.trim()} — Revision Notes`);
      toast.success("Notes generated successfully!");
    } catch {
      toast.error("Failed to generate notes. Check your AI key configuration.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedContent || !noteTitle) return;
    try {
      setIsSaving(true);
      const saved = await noteService.saveNote({
        subjectId,
        title: noteTitle,
        content: generatedContent,
        academicLevel,
        explanationStyle,
        detailLevel,
      });
      setSavedNotes([saved, ...savedNotes]);
      setSelectedNote(saved);
      toast.success("Note saved to your library!");
    } catch {
      toast.error("Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = selectedNote ? selectedNote.content : generatedContent;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      await noteService.deleteNote(id);
      setSavedNotes(savedNotes.filter(n => n.id !== id));
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  };

  const filteredNotes = savedNotes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.subjectName && n.subjectName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const displayContent = selectedNote ? selectedNote.content : generatedContent;
  const displayTitle = selectedNote ? selectedNote.title : noteTitle;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Notes Generator</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Generate structured, exam-oriented notes with definitions, processes, applications, and model questions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Generator Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Configure Note Parameters</span>
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Subject selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                <select
                  value={subjectId || ""}
                  onChange={(e) => {
                    const sid = Number(e.target.value);
                    setSubjectId(sid || undefined);
                    const found = subjects.find(s => s.id === sid);
                    if (found) setSubjectName(found.name);
                    else setSubjectName("");
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                >
                  <option value="">-- Select Subject (or specify custom below) --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Sem {s.semester})</option>
                  ))}
                </select>
                {!subjectId && (
                  <input
                    type="text"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="Or type custom subject name"
                    className="mt-2 w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-indigo-500 outline-none"
                  />
                )}
              </div>

              {/* Topic */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Topic / Unit Concept *</label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Round Robin Scheduling, Normalization in DBMS, Raft Consensus"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                />
              </div>

              {/* Style & Level */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Level</label>
                  <select
                    value={academicLevel}
                    onChange={(e) => setAcademicLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:border-indigo-500 outline-none"
                  >
                    <option value="Undergraduate">Undergraduate (B.Tech / B.Sc)</option>
                    <option value="Postgraduate">Postgraduate (M.Tech / MCA)</option>
                    <option value="Diploma">Diploma / Polytechnic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Explanation Style</label>
                  <select
                    value={explanationStyle}
                    onChange={(e) => setExplanationStyle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:border-indigo-500 outline-none"
                  >
                    <option value="Exam-Oriented">Exam-Oriented (Direct & Scoring)</option>
                    <option value="Intuitive">Intuitive & Analogies</option>
                    <option value="Rigorous">Rigorous & Mathematical</option>
                  </select>
                </div>
              </div>

              {/* Detail level */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detail Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Comprehensive", "Quick Summary", "Bullet Points"].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDetailLevel(d)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        detailLevel === d
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-bold"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Context */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Optional Textbook / Syllabus Context
                </label>
                <textarea
                  rows={2}
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Paste excerpt from your professor's slides or syllabus to ground the response..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-xs shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Exam Notes...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Notes</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Saved Notes Accordion */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Saved Notes Library ({savedNotes.length})</span>
              </h3>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {filteredNotes.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No notes saved yet.</p>
              ) : (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => { setSelectedNote(note); }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                      selectedNote?.id === note.id
                        ? "border-indigo-600 bg-indigo-50/70 font-semibold text-indigo-900"
                        : "border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="truncate">{note.title}</p>
                      <span className="text-[10px] text-slate-400">{note.subjectName || "General"}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Note Viewer & Action Toolbar (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden min-h-[600px] flex flex-col">
            {/* Note Viewer Action Bar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                  {selectedNote ? "Viewing Saved Note" : displayContent ? "Generated Draft" : "Note Preview"}
                </span>
                <h3 className="font-bold text-slate-900 text-base truncate max-w-md">
                  {displayTitle || "No Note Selected"}
                </h3>
              </div>

              {displayContent && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-xl text-slate-600 hover:bg-slate-200/60 transition-colors text-xs font-semibold flex items-center gap-1.5"
                    title="Copy to clipboard"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span className="hidden sm:inline">{isCopied ? "Copied" : "Copy"}</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="p-2 rounded-xl text-slate-600 hover:bg-slate-200/60 transition-colors text-xs font-semibold flex items-center gap-1.5"
                    title="Print or Export PDF"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">Print / PDF</span>
                  </button>

                  {selectedNote && (
                    <button
                      onClick={async () => {
                        try {
                          await offlineService.downloadNote(selectedNote.id);
                          toast.success("Note saved to Offline Library! 📥");
                        } catch {
                          toast.error("Failed to save note for offline study");
                        }
                      }}
                      className="p-2 rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors text-xs font-semibold flex items-center gap-1.5"
                      title="Save to Offline Library"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Save Offline</span>
                    </button>
                  )}

                  {!selectedNote && (
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save to Library</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Note Content Body */}
            <div className="p-6 sm:p-8 flex-1 overflow-y-auto print:p-0">
              {isGenerating ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-3">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-sm font-semibold text-slate-700">Synthesizing Course Material...</p>
                  <p className="text-xs max-w-sm">
                    Structuring formal definitions, mechanism processes, advantages/disadvantages, and 5M/10M exam questions.
                  </p>
                </div>
              ) : displayContent ? (
                <div className="prose prose-indigo max-w-none text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {displayContent}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-3 my-auto">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">No Note Selected</h4>
                  <p className="text-xs max-w-sm text-slate-500">
                    Choose a topic on the left to generate exam notes, or click any saved note from your library.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
