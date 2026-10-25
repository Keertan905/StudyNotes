import { useState, useRef, useEffect, useMemo } from "react";
import {
  Sparkles,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Loader2,
  Layers,
  RotateCcw,
  Info
} from "lucide-react";
import toast from "react-hot-toast";
import {
  subjectService,
  type SubjectItem,
  type ExtractedSubjectItem
} from "../../services/subject.service";

interface AiSyllabusImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSubjects: SubjectItem[];
  onImportSuccess: (importedSubjects: SubjectItem[]) => void;
}

const PALETTE_COLORS = [
  "#4f46e5", // Indigo
  "#7c3aed", // Purple
  "#059669", // Emerald
  "#0284c7", // Sky Blue
  "#d97706", // Amber
  "#e11d48", // Rose
];

const SUBJECT_TYPES = [
  "CORE / THEORY",
  "DEPARTMENTAL ELECTIVE",
  "OPEN ELECTIVE",
  "LAB / PRACTICAL",
  "AUDIT / NON-CREDIT",
];

export default function AiSyllabusImportModal({
  isOpen,
  onClose,
  existingSubjects,
  onImportSuccess,
}: AiSyllabusImportModalProps) {
  // Step: "upload" | "extracting" | "preview"
  const [step, setStep] = useState<"upload" | "extracting" | "preview">("upload");
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extracted preview state
  const [extractedSubjects, setExtractedSubjects] = useState<ExtractedSubjectItem[]>([]);
  const [selectedSemesterTab, setSelectedSemesterTab] = useState<number | "ALL" | "REVIEW">("ALL");
  const [collapsedSubjects, setCollapsedSubjects] = useState<Record<number, boolean>>({});
  const [collapsedUnits, setCollapsedUnits] = useState<Record<string, boolean>>({});
  const [extractionSource, setExtractionSource] = useState<string>("DOCUMENT");
  const [isImporting, setIsImporting] = useState(false);

  // New topic input per unit (keyed by `${subjectIndex}_${unitIndex}`)
  const [newTopicInputs, setNewTopicInputs] = useState<Record<string, string>>({});

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  // Derived calculations for preview
  const availableSemesters = useMemo(() => {
    const sems = new Set<number>();
    extractedSubjects.forEach((s) => {
      if (s.semester) sems.add(s.semester);
    });
    return Array.from(sems).sort((a, b) => a - b);
  }, [extractedSubjects]);

  const needsReviewCount = useMemo(() => {
    return extractedSubjects.filter((s) => s.needsReview).length;
  }, [extractedSubjects]);

  const totalTopicsCount = useMemo(() => {
    return extractedSubjects.reduce(
      (acc, s) => acc + s.units.reduce((uAcc, u) => uAcc + u.topics.length, 0),
      0
    );
  }, [extractedSubjects]);

  const filteredSubjects = useMemo(() => {
    return extractedSubjects
      .map((subject, originalIndex) => ({ subject, originalIndex }))
      .filter(({ subject }) => {
        if (selectedSemesterTab === "REVIEW") {
          return Boolean(subject.needsReview);
        }
        if (selectedSemesterTab === "ALL") {
          return true;
        }
        return (subject.semester || 1) === selectedSemesterTab;
      });
  }, [extractedSubjects, selectedSemesterTab]);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    const validExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
    const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!validExtensions.includes(extension) && !file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Please upload a PDF syllabus or an image (JPG, PNG, WEBP)");
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      toast.error("File size exceeds 30MB limit");
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
    toast.success(`Selected file: ${file.name}`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const clearSelectedFile = () => {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleStartExtraction = async () => {
    if (activeTab === "file" && !selectedFile) {
      toast.error("Please select or drop a syllabus PDF or image file");
      return;
    }
    if (activeTab === "text" && !pastedText.trim()) {
      toast.error("Please paste your syllabus text or curriculum outline");
      return;
    }

    try {
      setStep("extracting");
      const res = await subjectService.aiExtractSyllabus(
        activeTab === "file" ? (selectedFile || undefined) : undefined,
        activeTab === "text" ? pastedText.trim() : undefined
      );

      if (!res.subjects || res.subjects.length === 0) {
        throw new Error("No subjects or units could be extracted from this syllabus");
      }

      setExtractedSubjects(res.subjects);
      setExtractionSource(res.extractionSource || "Syllabus Parser Engine");
      setCollapsedSubjects({});
      setCollapsedUnits({});
      setSelectedSemesterTab("ALL");
      setStep("preview");
      toast.success(
        `Successfully extracted ${res.subjects.length} subject${res.subjects.length > 1 ? "s" : ""} across semesters!`
      );
    } catch (err: any) {
      setStep("upload");
      const message = err.response?.data?.message || err.message || "Failed to extract syllabus. Please try again.";
      toast.error(message);
    }
  };

  // Duplicate checks against user's existing subjects
  const isDuplicateSubject = (name: string, code?: string) => {
    const cleanName = name.trim().toLowerCase();
    const cleanCode = code ? code.trim().toLowerCase() : "";

    return existingSubjects.some((s) => {
      const matchName = s.name.trim().toLowerCase() === cleanName;
      const matchCode = cleanCode && s.code && s.code.trim().toLowerCase() === cleanCode;
      return matchName || matchCode;
    });
  };

  // Subject mutations
  const updateSubjectField = (index: number, field: keyof ExtractedSubjectItem, value: any) => {
    const updated = [...extractedSubjects];
    updated[index] = { ...updated[index], [field]: value };
    setExtractedSubjects(updated);
  };

  const markReviewed = (index: number) => {
    const updated = [...extractedSubjects];
    updated[index] = { ...updated[index], needsReview: false, reviewReason: undefined };
    setExtractedSubjects(updated);
    toast.success("Subject marked as reviewed");
  };

  const removeSubject = (index: number) => {
    if (extractedSubjects.length === 1) {
      toast.error("At least one subject must remain in preview");
      return;
    }
    setExtractedSubjects(extractedSubjects.filter((_, i) => i !== index));
    toast.success("Subject removed from import");
  };

  const addManualSubject = () => {
    const defaultSem = typeof selectedSemesterTab === "number" ? selectedSemesterTab : 1;
    const newSub: ExtractedSubjectItem = {
      name: `New Subject ${extractedSubjects.length + 1}`,
      code: "",
      semester: defaultSem,
      subjectType: "CORE / THEORY",
      color: PALETTE_COLORS[extractedSubjects.length % PALETTE_COLORS.length],
      units: [
        {
          unitNumber: 1,
          title: "Unit 1: Foundations & Concepts",
          topics: ["Introduction to Course", "Core Architecture", "Methodology"],
        },
      ],
    };
    setExtractedSubjects([...extractedSubjects, newSub]);
    toast.success("Added new empty subject");
  };

  // Unit mutations
  const updateUnitTitle = (sIdx: number, uIdx: number, title: string) => {
    const updated = [...extractedSubjects];
    const units = [...updated[sIdx].units];
    units[uIdx] = { ...units[uIdx], title };
    updated[sIdx] = { ...updated[sIdx], units };
    setExtractedSubjects(updated);
  };

  const deleteUnit = (sIdx: number, uIdx: number) => {
    const updated = [...extractedSubjects];
    const units = updated[sIdx].units.filter((_, i) => i !== uIdx);
    const reindexed = units.map((u, i) => ({ ...u, unitNumber: i + 1 }));
    updated[sIdx] = { ...updated[sIdx], units: reindexed };
    setExtractedSubjects(updated);
  };

  const addUnitToSubject = (sIdx: number) => {
    const updated = [...extractedSubjects];
    const units = [...updated[sIdx].units];
    const nextNum = units.length + 1;
    units.push({
      unitNumber: nextNum,
      title: `Unit ${nextNum}: New Unit Title`,
      topics: ["Key Concept 1", "Key Concept 2"],
    });
    updated[sIdx] = { ...updated[sIdx], units };
    setExtractedSubjects(updated);
  };

  // Topic mutations
  const removeTopic = (sIdx: number, uIdx: number, tIdx: number) => {
    const updated = [...extractedSubjects];
    const units = [...updated[sIdx].units];
    const topics = units[uIdx].topics.filter((_, i) => i !== tIdx);
    units[uIdx] = { ...units[uIdx], topics };
    updated[sIdx] = { ...updated[sIdx], units };
    setExtractedSubjects(updated);
  };

  const updateTopic = (sIdx: number, uIdx: number, tIdx: number, newName: string) => {
    const updated = [...extractedSubjects];
    const units = [...updated[sIdx].units];
    const topics = [...units[uIdx].topics];
    topics[tIdx] = newName;
    units[uIdx] = { ...units[uIdx], topics };
    updated[sIdx] = { ...updated[sIdx], units };
    setExtractedSubjects(updated);
  };

  const addTopic = (sIdx: number, uIdx: number) => {
    const key = `${sIdx}_${uIdx}`;
    const value = (newTopicInputs[key] || "").trim();
    if (!value) return;

    const updated = [...extractedSubjects];
    const units = [...updated[sIdx].units];
    const topics = [...units[uIdx].topics, value];
    units[uIdx] = { ...units[uIdx], topics };
    updated[sIdx] = { ...updated[sIdx], units };
    setExtractedSubjects(updated);

    setNewTopicInputs({ ...newTopicInputs, [key]: "" });
  };

  const removeDuplicateTopicsInUnit = (sIdx: number, uIdx: number) => {
    const updated = [...extractedSubjects];
    const unit = updated[sIdx].units[uIdx];
    const rawNames = unit.topics.map((t) => (typeof t === "string" ? t : t.name));
    const unique = Array.from(new Set(rawNames.map((n) => n.trim().toLowerCase()))).map((lower) =>
      rawNames.find((n) => n.trim().toLowerCase() === lower)!
    );
    const countRemoved = rawNames.length - unique.length;
    if (countRemoved === 0) {
      toast("No duplicate topics found in this unit", { icon: "ℹ️" });
      return;
    }
    unit.topics = unique;
    setExtractedSubjects(updated);
    toast.success(`Removed ${countRemoved} duplicate topic${countRemoved > 1 ? "s" : ""}!`);
  };

  const toggleCollapseSubject = (sIdx: number) => {
    setCollapsedSubjects((prev) => ({ ...prev, [sIdx]: !prev[sIdx] }));
  };

  const setAllSubjectsCollapsed = (collapse: boolean) => {
    const newState: Record<number, boolean> = {};
    extractedSubjects.forEach((_, idx) => {
      newState[idx] = collapse;
    });
    setCollapsedSubjects(newState);
  };

  const toggleCollapseUnit = (key: string) => {
    setCollapsedUnits((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Confirmation & Save
  const handleConfirmImport = async () => {
    for (const sub of extractedSubjects) {
      if (!sub.name.trim()) {
        toast.error("All subjects must have a name");
        return;
      }
    }

    try {
      setIsImporting(true);
      const payload = {
        subjects: extractedSubjects.map((s) => ({
          name: s.name.trim(),
          code: s.code ? s.code.trim() : undefined,
          semester: s.semester || 1,
          color: s.color || "#4f46e5",
          units: s.units.map((u) => ({
            unitNumber: u.unitNumber,
            title: u.title.trim(),
            description: u.description || undefined,
            topics: u.topics.map((t) => (typeof t === "string" ? t.trim() : t.name.trim())),
          })),
        })),
      };

      const imported = await subjectService.batchImportSubjects(payload);
      toast.success(
        `Successfully imported ${imported.length} course${imported.length > 1 ? "s" : ""} into your database!`
      );
      onImportSuccess(imported);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to import subjects to database";
      toast.error(msg);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Syllabus Import Studio</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700">
                  Multi-Semester Document Engine
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Upload university syllabus PDFs (e.g. RGPV 1–8 Semesters) to parse subjects, units, and topics in order.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isImporting}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: Upload / Drag & Drop */}
          {step === "upload" && (
            <div className="space-y-5">
              {/* Tab Selector */}
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => setActiveTab("file")}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "file"
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Document / PDF Upload
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("text")}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "text"
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Paste Syllabus Text
                </button>
              </div>

              {activeTab === "file" ? (
                /* Drag & Drop Zone */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative cursor-pointer rounded-3xl border-2 border-dashed p-8 transition-all flex flex-col items-center justify-center text-center ${
                    isDragOver
                      ? "border-indigo-500 bg-indigo-50/70 scale-[1.01]"
                      : selectedFile
                      ? "border-indigo-300 bg-indigo-50/30"
                      : "border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/20"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />

                  {selectedFile ? (
                    /* Selected File Card */
                    <div
                      className="w-full max-w-md bg-white rounded-2xl p-4 border border-indigo-100 shadow-sm flex items-center justify-between gap-4 text-left"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {filePreviewUrl ? (
                          <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                            <img
                              src={filePreviewUrl}
                              alt="Syllabus Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {(selectedFile.size / 1024).toFixed(1)} KB •{" "}
                            {selectedFile.type.startsWith("image/") ? "Syllabus Image (OCR)" : "Complete PDF Document"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={clearSelectedFile}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    /* Empty State Prompt */
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 mb-1">
                        Upload RGPV or University Syllabus PDF
                      </h3>
                      <p className="text-xs text-slate-500 max-w-xs mb-3">
                        Drag and drop your complete syllabus file here, or click to browse. Supports full 7+ semester multi-page PDFs.
                      </p>
                      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100">PDF</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100">PNG / JPG</span>
                        <span>Up to 30MB</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Text Input Mode */
                <div className="space-y-2">
                  <textarea
                    rows={12}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste full syllabus text or copy-paste from multiple pages here...&#10;&#10;Example:&#10;SEMESTER III&#10;CSIT-301 Discrete Mathematics&#10;Unit I: Set Theory, Relations and Functions...&#10;Unit II: Propositional Logic and Proofs...&#10;&#10;CSIT-302 Data Structures&#10;Unit I: Linear Data Structures, Stacks, Queues..."
                    className="w-full p-4 rounded-2xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none leading-relaxed transition-all"
                  />
                  <p className="text-[11px] text-slate-400">
                    The structural parser separates semester blocks, course codes (e.g. CSIT-301), subject types, and units automatically.
                  </p>
                </div>
              )}

              {/* Extraction Features Info Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Complete Multi-Page Scan</p>
                    <p className="text-[11px] text-slate-500">Extracts 100% of pages without truncation or token cutoffs.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Semester & Unit Ordering</p>
                    <p className="text-[11px] text-slate-500">Maintains exact reading order across Semesters I–VIII.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Duplicate-Safe Import</p>
                    <p className="text-[11px] text-slate-500">Safely merges units without duplicating existing subjects.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Extraction in Progress */}
          {step === "extracting" && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 animate-pulse">
                  <Sparkles className="w-9 h-9 animate-spin" style={{ animationDuration: "3s" }} />
                </div>
              </div>

              <div className="space-y-2 max-w-sm">
                <h3 className="text-base font-bold text-slate-900">
                  Parsing Complete Syllabus Document...
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Extracting semester sections, subject course codes, unit boundaries, and decomposing topics across all pages.
                </p>
              </div>

              {/* Progress Steps Indicator */}
              <div className="w-full max-w-md bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-left">
                <div className="flex items-center gap-3 text-xs">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[10px]">
                    ✓
                  </div>
                  <span className="font-medium text-slate-700">Document loaded & text extracted</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] animate-bounce">
                    •
                  </div>
                  <span className="font-semibold text-indigo-700">
                    Running structural segmentation across all semesters...
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center font-bold text-[10px]">
                    3
                  </div>
                  <span className="text-slate-400">Building editable preview tree</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Editable Preview & Multi-Semester Navigation */}
          {step === "preview" && (
            <div className="space-y-5">
              {/* Summary Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-purple-50/70 border border-purple-100 rounded-2xl p-3.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-purple-900">
                        Extracted {extractedSubjects.length} Subject{extractedSubjects.length > 1 ? "s" : ""} across {availableSemesters.length} Semester{availableSemesters.length > 1 ? "s" : ""} • {totalTopicsCount} Topics
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-200/70 text-purple-800">
                        {extractionSource}
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-700">
                      Filter by semester, review unit topics, adjust course details, and confirm import.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addManualSubject}
                    className="px-3 py-1.5 rounded-xl bg-white text-purple-700 border border-purple-200 hover:bg-purple-100/50 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Subject</span>
                  </button>
                </div>
              </div>

              {/* Semester Filter Tabs & View Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedSemesterTab("ALL")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      selectedSemesterTab === "ALL"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span>All Semesters</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        selectedSemesterTab === "ALL" ? "bg-indigo-700 text-white" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {extractedSubjects.length}
                    </span>
                  </button>

                  {availableSemesters.map((sem) => {
                    const count = extractedSubjects.filter((s) => s.semester === sem).length;
                    const isSelected = selectedSemesterTab === sem;
                    return (
                      <button
                        key={sem}
                        type="button"
                        onClick={() => setSelectedSemesterTab(sem)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        <span>Semester {sem}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                            isSelected ? "bg-indigo-700 text-white" : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}

                  {needsReviewCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedSemesterTab("REVIEW")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        selectedSemesterTab === "REVIEW"
                          ? "bg-amber-600 text-white shadow-xs"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Needs Review</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          selectedSemesterTab === "REVIEW" ? "bg-amber-700 text-white" : "bg-amber-200 text-amber-900"
                        }`}
                      >
                        {needsReviewCount}
                      </span>
                    </button>
                  )}
                </div>

                {/* Bulk Expand / Collapse Controls */}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setAllSubjectsCollapsed(false)}
                    className="text-[11px] font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    Expand All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setAllSubjectsCollapsed(true)}
                    className="text-[11px] font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              {/* Extracted Subjects List */}
              <div className="space-y-4">
                {filteredSubjects.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                    No subjects found for this filter tab.
                  </div>
                ) : (
                  filteredSubjects.map(({ subject, originalIndex: sIdx }) => {
                    const isDup = isDuplicateSubject(subject.name, subject.code);
                    const isCollapsed = Boolean(collapsedSubjects[sIdx]);
                    const totalTopics = subject.units.reduce((acc, u) => acc + u.topics.length, 0);

                    return (
                      <div
                        key={sIdx}
                        className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                          subject.needsReview
                            ? "border-amber-300 shadow-sm"
                            : "border-slate-200 hover:border-slate-300 shadow-2xs"
                        }`}
                      >
                        {/* Duplicate Alert Banner */}
                        {isDup && (
                          <div className="bg-sky-50 border-b border-sky-100 px-4 py-2 flex items-center justify-between gap-3 text-xs text-sky-800">
                            <div className="flex items-center gap-2">
                              <Info className="w-4 h-4 text-sky-600 shrink-0" />
                              <span>
                                <strong>Existing Course:</strong> Matches an existing subject in your library. Importing will safely merge/update its units without duplicating.
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSubject(sIdx)}
                              className="text-sky-800 hover:text-sky-950 font-bold underline shrink-0"
                            >
                              Skip
                            </button>
                          </div>
                        )}

                        {/* Needs Review Alert Banner */}
                        {subject.needsReview && (
                          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-900">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>
                                <strong>Review Flag:</strong> {subject.reviewReason || "Irregular formatting detected. Please verify units and topics."}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => markReviewed(sIdx)}
                              className="px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 text-[11px] font-bold shrink-0 transition-colors"
                            >
                              Mark as Verified
                            </button>
                          </div>
                        )}

                        {/* Subject Card Header / Quick Bar */}
                        <div
                          onClick={() => toggleCollapseSubject(sIdx)}
                          className="p-4 flex items-center justify-between gap-3 cursor-pointer bg-slate-50/60 hover:bg-slate-50 transition-colors select-none"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <button
                              type="button"
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCollapseSubject(sIdx);
                              }}
                            >
                              {isCollapsed ? (
                                <ChevronRight className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>

                            <div
                              className="w-8 h-8 rounded-xl text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0"
                              style={{ backgroundColor: subject.color || "#4f46e5" }}
                            >
                              {subject.code
                                ? subject.code.slice(0, 4)
                                : subject.name.slice(0, 2).toUpperCase() || "SUB"}
                            </div>

                            <div className="min-w-0 flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-slate-800 truncate">
                                {subject.name || "Untitled Subject"}
                              </h3>

                              {subject.code && (
                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono font-bold text-[11px]">
                                  {subject.code}
                                </span>
                              )}

                              <span className="px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 font-semibold text-[11px]">
                                Sem {subject.semester || 1}
                              </span>

                              {subject.subjectType && (
                                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold text-[10px] tracking-wide">
                                  {subject.subjectType}
                                </span>
                              )}

                              {subject.needsReview && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                                  Needs Review
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                              {subject.units.length} Units • {totalTopics} Topics
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSubject(sIdx);
                              }}
                              title="Discard this subject"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Subject Details Body (if not collapsed) */}
                        {!isCollapsed && (
                          <div className="p-5 border-t border-slate-100 space-y-4">
                            {/* Editable Fields: Name, Code, Semester, Type, Color */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-200/60">
                              <div className="sm:col-span-5">
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                  Subject / Course Name *
                                </label>
                                <input
                                  type="text"
                                  value={subject.name}
                                  onChange={(e) => updateSubjectField(sIdx, "name", e.target.value)}
                                  placeholder="e.g. Operating Systems"
                                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                  Course Code
                                </label>
                                <input
                                  type="text"
                                  value={subject.code || ""}
                                  onChange={(e) => updateSubjectField(sIdx, "code", e.target.value)}
                                  placeholder="e.g. CS-404"
                                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                  Semester
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="12"
                                  value={subject.semester || 1}
                                  onChange={(e) => updateSubjectField(sIdx, "semester", Number(e.target.value))}
                                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none"
                                />
                              </div>

                              <div className="sm:col-span-3">
                                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                  Subject Type
                                </label>
                                <select
                                  value={subject.subjectType || "CORE / THEORY"}
                                  onChange={(e) => updateSubjectField(sIdx, "subjectType", e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none"
                                >
                                  {SUBJECT_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                      {type}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="sm:col-span-12 flex items-center gap-2 pt-1">
                                <span className="text-[11px] font-medium text-slate-500">Color Tag:</span>
                                <div className="flex items-center gap-1.5">
                                  {PALETTE_COLORS.map((c) => (
                                    <button
                                      key={c}
                                      type="button"
                                      onClick={() => updateSubjectField(sIdx, "color", c)}
                                      className={`w-5 h-5 rounded-md transition-transform ${
                                        subject.color === c ? "scale-125 ring-2 ring-slate-400" : ""
                                      }`}
                                      style={{ backgroundColor: c }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Units Section */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                  <Layers className="w-4 h-4 text-indigo-600" />
                                  <span>Units & Topics ({subject.units.length} Units)</span>
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => addUnitToSubject(sIdx)}
                                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add Unit</span>
                                </button>
                              </div>

                              {/* Unit Cards List */}
                              <div className="space-y-2.5">
                                {subject.units.map((unit, uIdx) => {
                                  const unitKey = `${sIdx}_${uIdx}`;
                                  const isUnitCollapsed = collapsedUnits[unitKey];
                                  const topicList = unit.topics.map((t) => (typeof t === "string" ? t : t.name));

                                  return (
                                    <div
                                      key={uIdx}
                                      className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden"
                                    >
                                      {/* Unit Title Header */}
                                      <div className="p-2.5 sm:p-3 flex items-center justify-between gap-2 sm:gap-3 bg-white border-b border-slate-100">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <button
                                            type="button"
                                            onClick={() => toggleCollapseUnit(unitKey)}
                                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                          >
                                            {isUnitCollapsed ? (
                                              <ChevronRight className="w-4 h-4" />
                                            ) : (
                                              <ChevronDown className="w-4 h-4" />
                                            )}
                                          </button>
                                          <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                                            {unit.unitNumber || uIdx + 1}
                                          </span>
                                          <input
                                            type="text"
                                            value={unit.title}
                                            onChange={(e) => updateUnitTitle(sIdx, uIdx, e.target.value)}
                                            placeholder="Unit Title"
                                            className="flex-1 min-w-0 px-2 py-0.5 rounded-lg text-xs font-bold text-slate-800 border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                                          />
                                          <span className="text-[11px] font-medium text-slate-400 shrink-0">
                                            ({topicList.length} topics)
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => removeDuplicateTopicsInUnit(sIdx, uIdx)}
                                            title="Remove duplicate topics in this unit"
                                            className="px-2 py-1 rounded-lg text-[11px] font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                          >
                                            Deduplicate
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => deleteUnit(sIdx, uIdx)}
                                            title="Delete Unit"
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Unit Topics Body */}
                                      {!isUnitCollapsed && (
                                        <div className="p-3 space-y-2.5">
                                          {/* Topics Chips */}
                                          <div className="flex flex-wrap gap-1.5">
                                            {topicList.map((tName, tIdx) => (
                                              <div
                                                key={tIdx}
                                                className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 shadow-2xs hover:border-indigo-200 transition-all"
                                              >
                                                <input
                                                  type="text"
                                                  value={tName}
                                                  onChange={(e) => updateTopic(sIdx, uIdx, tIdx, e.target.value)}
                                                  className="bg-transparent text-xs text-slate-700 outline-none w-auto max-w-[240px]"
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => removeTopic(sIdx, uIdx, tIdx)}
                                                  className="text-slate-400 hover:text-rose-500 ml-0.5 transition-colors"
                                                  title="Delete topic"
                                                >
                                                  <X className="w-3 h-3" />
                                                </button>
                                              </div>
                                            ))}
                                          </div>

                                          {/* Quick Add Topic Input */}
                                          <div className="flex items-center gap-2 pt-1">
                                            <input
                                              type="text"
                                              value={newTopicInputs[unitKey] || ""}
                                              onChange={(e) =>
                                                setNewTopicInputs({
                                                  ...newTopicInputs,
                                                  [unitKey]: e.target.value,
                                                })
                                              }
                                              onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                  e.preventDefault();
                                                  addTopic(sIdx, uIdx);
                                                }
                                              }}
                                              placeholder="+ Type topic name & press Enter..."
                                              className="w-full max-w-xs px-2.5 py-1 rounded-lg border border-slate-300 text-xs bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => addTopic(sIdx, uIdx)}
                                              className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors"
                                            >
                                              Add
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          {step === "upload" && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartExtraction}
                disabled={activeTab === "file" ? !selectedFile : !pastedText.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Parse Complete Syllabus</span>
              </button>
            </>
          )}

          {step === "extracting" && (
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-slate-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Scanning document structure across all semesters...</span>
              </span>
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60"
              >
                Cancel
              </button>
            </div>
          )}

          {step === "preview" && (
            <>
              <button
                type="button"
                onClick={() => setStep("upload")}
                disabled={isImporting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-upload / Back</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isImporting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={isImporting || extractedSubjects.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Importing to Database...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Confirm & Import {extractedSubjects.length} Subject{extractedSubjects.length > 1 ? "s" : ""}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
