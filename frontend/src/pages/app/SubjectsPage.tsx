import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  GraduationCap, 
  Plus, 
  Trash2, 
  Archive, 
  CheckCircle2, 
  Circle, 
  FileUp, 
  ChevronDown, 
  ChevronRight, 
  Calendar, 
  Loader2, 
  X
} from "lucide-react";
import { subjectService, type SubjectItem, type UnitItem } from "../../services/subject.service";
import toast from "react-hot-toast";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    code: "",
    semester: 6,
    examDate: "",
    color: "#4f46e5",
  });
  const [extractedUnits, setExtractedUnits] = useState<UnitItem[]>([]);
  const [pastedSyllabus, setPastedSyllabus] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setIsLoading(true);
      const data = await subjectService.getSubjects();
      setSubjects(data);
      if (data.length > 0 && expandedSubject === null) {
        setExpandedSubject(data[0].id);
      }
    } catch {
      toast.error("Failed to load subjects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtract = async () => {
    if (!selectedFile && !pastedSyllabus.trim()) {
      toast.error("Please upload a PDF syllabus or paste text");
      return;
    }
    try {
      setIsExtracting(true);
      const units = await subjectService.extractSyllabus(selectedFile || undefined, pastedSyllabus || undefined);
      setExtractedUnits(units);
      toast.success(`Extracted ${units.length} units with topics!`);
    } catch {
      toast.error("Failed to extract syllabus");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Subject name is required");
      return;
    }

    try {
      setIsSaving(true);
      await subjectService.createSubject({
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        semester: form.semester,
        examDate: form.examDate || undefined,
        color: form.color,
        units: extractedUnits.length > 0 ? extractedUnits : undefined,
      });

      toast.success("Subject created successfully!");
      setIsModalOpen(false);
      resetModal();
      loadSubjects();
    } catch {
      toast.error("Failed to save subject");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTopic = async (topicId: number) => {
    try {
      await subjectService.toggleTopic(topicId);
      // Refresh subjects to update topic and unit progress percentages
      const data = await subjectService.getSubjects();
      setSubjects(data);
    } catch {
      toast.error("Failed to update topic status");
    }
  };

  const handleDeleteSubject = async (id: number) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;
    try {
      await subjectService.deleteSubject(id);
      setSubjects(subjects.filter(s => s.id !== id));
      toast.success("Subject deleted");
    } catch {
      toast.error("Failed to delete subject");
    }
  };

  const handleToggleArchive = async (id: number) => {
    try {
      await subjectService.toggleArchive(id);
      loadSubjects();
      toast.success("Subject status updated");
    } catch {
      toast.error("Failed to archive subject");
    }
  };

  const resetModal = () => {
    setForm({ name: "", code: "", semester: 6, examDate: "", color: "#4f46e5" });
    setExtractedUnits([]);
    setPastedSyllabus("");
    setSelectedFile(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Subjects & Syllabus</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage course units, track topic completion, and upload university syllabi
          </p>
        </div>

        <button
          onClick={() => { resetModal(); setIsModalOpen(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">No Subjects Added Yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Add your semester courses or upload a syllabus PDF to automatically structure your units and topics.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs"
          >
            Create Your First Subject
          </button>
        </div>
      ) : (
        /* Subjects List */
        <div className="space-y-4">
          {subjects.map((sub) => {
            const isExpanded = expandedSubject === sub.id;
            const progress = sub.totalTopics > 0 
              ? Math.round((sub.completedTopics / sub.totalTopics) * 100) 
              : 0;

            return (
              <div 
                key={sub.id} 
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all"
              >
                {/* Subject Header Bar */}
                <div 
                  onClick={() => setExpandedSubject(isExpanded ? null : sub.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-11 h-11 rounded-xl text-white flex items-center justify-center font-bold text-sm shadow-xs"
                      style={{ backgroundColor: sub.color || "#4f46e5" }}
                    >
                      {sub.code ? sub.code.slice(0, 4) : sub.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">{sub.name}</h3>
                        {sub.code && (
                          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {sub.code}
                          </span>
                        )}
                        <span className="text-xs text-slate-400">• Sem {sub.semester || 1}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {sub.totalUnits} Units • {sub.totalTopics} Topics ({sub.completedTopics} Completed)
                      </p>
                    </div>
                  </div>

                  {/* Progress & Actions */}
                  <div className="flex items-center gap-6 justify-between md:justify-end">
                    {/* Progress Bar */}
                    <div className="w-36">
                      <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1">
                        <span>Syllabus Covered</span>
                        <span className="font-bold text-slate-800">{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${progress}%`,
                            backgroundColor: sub.color || "#4f46e5" 
                          }}
                        />
                      </div>
                    </div>

                    {/* Exam Date */}
                    {sub.examDate && (
                      <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Exam: {sub.examDate}</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        title="Archive Subject"
                        onClick={() => handleToggleArchive(sub.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        title="Delete Subject"
                        onClick={() => handleDeleteSubject(sub.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpandedSubject(isExpanded ? null : sub.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-600"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Units & Topics Accordion */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-6 space-y-4">
                    {sub.units.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">
                        No units added yet for this subject.
                      </div>
                    ) : (
                      sub.units.map((unit) => (
                        <div key={unit.id} className="bg-white rounded-xl border border-slate-200 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center">
                                {unit.unitNumber}
                              </span>
                              <span>{unit.title}</span>
                            </h4>
                            <span className="text-xs text-slate-400">
                              {unit.topics.filter(t => t.completed).length} / {unit.topics.length} done
                            </span>
                          </div>

                          {/* Topics List */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {unit.topics.map((topic) => (
                              <div
                                key={topic.id}
                                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all ${
                                  topic.completed 
                                    ? "bg-emerald-50/40 border-emerald-200 text-emerald-800" 
                                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                                }`}
                              >
                                <div 
                                  onClick={() => handleToggleTopic(topic.id)}
                                  className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                                >
                                  {topic.completed ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                  )}
                                  <span className={`truncate ${topic.completed ? "line-through opacity-80" : ""}`}>
                                    {topic.name}
                                  </span>
                                </div>

                                <Link
                                  to={`/notes?subjectId=${sub.id}&subjectName=${encodeURIComponent(sub.name)}&topic=${encodeURIComponent(topic.name)}`}
                                  className="ml-2 px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[10px] flex-shrink-0"
                                >
                                  AI Notes
                                </Link>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Subject Modal with Syllabus Extraction */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-slate-900 mb-1">Add New Subject</h2>
            <p className="text-xs text-slate-500 mb-6">
              Create manually or extract units and topics directly from your syllabus.
            </p>

            <form onSubmit={handleCreateSubject} className="space-y-5">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Distributed Systems"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g. CS602"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Exam Date</label>
                  <input
                    type="date"
                    value={form.examDate}
                    onChange={(e) => setForm({ ...form, examDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Badge Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    {["#4f46e5", "#7c3aed", "#059669", "#d97706", "#e11d48"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm({ ...form, color: c })}
                        className={`w-7 h-7 rounded-lg transition-transform ${form.color === c ? "scale-110 ring-2 ring-slate-400" : ""}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Syllabus Extraction Box */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <FileUp className="w-4 h-4 text-indigo-600" />
                    <span>Upload Syllabus (PDF or Paste Text)</span>
                  </span>
                  <span className="text-[11px] text-indigo-600">Apache PDFBox Extraction</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Upload PDF Syllabus</label>
                    <input
                      type="file"
                      accept=".pdf,.txt"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Or Paste Syllabus Text</label>
                    <textarea
                      rows={2}
                      value={pastedSyllabus}
                      onChange={(e) => setPastedSyllabus(e.target.value)}
                      placeholder="Paste Unit 1: Topics... Unit 2: Topics..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExtract}
                  disabled={isExtracting}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium text-xs flex items-center gap-2 shadow-xs"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Extracting Units & Topics...</span>
                    </>
                  ) : (
                    <span>Extract Structure</span>
                  )}
                </button>

                {/* Extracted Preview */}
                {extractedUnits.length > 0 && (
                  <div className="mt-3 p-3 bg-white rounded-xl border border-indigo-100 max-h-40 overflow-y-auto space-y-2">
                    <p className="text-xs font-bold text-indigo-700">Extracted Units Preview:</p>
                    {extractedUnits.map((u, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-semibold text-slate-800">{u.title}: </span>
                        <span className="text-slate-500">
                          {u.topics.map(t => (typeof t === 'string' ? t : t.name)).join(", ")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-xs shadow-md shadow-indigo-100 flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Save Subject</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
