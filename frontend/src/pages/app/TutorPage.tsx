import { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  Send, 
  Plus, 
  Trash2, 
  Loader2, 
  User as UserIcon, 
  Lightbulb, 
  ChevronRight, 
  FileText, 
  Upload, 
  BookOpen, 
  Sparkles, 
  X, 
  ShieldCheck, 
  Quote,
  Mic,
  Volume2,
  VolumeX,
  Radio,
  Languages,
  Globe
} from "lucide-react";
import { 
  tutorService, 
  type ConversationItem, 
  type MessageItem, 
  type RagCitation 
} from "../../services/tutor.service";
import { subjectService, type SubjectItem } from "../../services/subject.service";
import { 
  documentService, 
  type StudyDocument, 
  type DocumentChunk 
} from "../../services/document.service";
import toast from "react-hot-toast";

export default function TutorPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [documents, setDocuments] = useState<StudyDocument[]>([]);

  // Grounding & RAG states
  const [useDocumentGrounding, setUseDocumentGrounding] = useState(true);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docModalTab, setDocModalTab] = useState<'library' | 'upload' | 'paste'>('library');

  // Document upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadSubjectId, setUploadSubjectId] = useState<number | undefined>();
  const [isUploading, setIsUploading] = useState(false);

  // Paste text state
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteContent, setPasteContent] = useState("");
  const [pasteSubjectId, setPasteSubjectId] = useState<number | undefined>();

  // Chunk inspection state
  const [inspectingDoc, setInspectingDoc] = useState<{ doc: StudyDocument; chunks: DocumentChunk[] } | null>(null);

  // Active citation modal
  const [activeCitation, setActiveCitation] = useState<RagCitation | null>(null);

  // Input states
  const [inputMessage, setInputMessage] = useState("");
  const [explanationStyle, setExplanationStyle] = useState("Exam-Oriented & Step-by-Step");
  const [academicLevel, setAcademicLevel] = useState("Undergraduate");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>();
  const [suggestedFollowUps, setSuggestedFollowUps] = useState<string[]>([
    "Explain with a real-world analogy",
    "What are common mistakes on this topic in examinations?",
    "Show a step-by-step mathematical or code example"
  ]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Multilingual Learning States
  const [targetLanguage, setTargetLanguage] = useState<string>("English");
  const [translatingMsgId, setTranslatingMsgId] = useState<number | null>(null);
  const [messageTranslations, setMessageTranslations] = useState<Record<number, Record<string, string>>>({});
  const [messageActiveLang, setMessageActiveLang] = useState<Record<number, string>>({});

  const SUPPORTED_LANGUAGES = [
    { code: "English", label: "English", flag: "🇺🇸", speechLang: "en-US" },
    { code: "Hindi", label: "हिंदी (Hindi)", flag: "🇮🇳", speechLang: "hi-IN" },
    { code: "Hinglish", label: "Hinglish", flag: "🇮🇳", speechLang: "en-IN" },
    { code: "Spanish", label: "Español", flag: "🇪🇸", speechLang: "es-ES" },
    { code: "French", label: "Français", flag: "🇫🇷", speechLang: "fr-FR" },
    { code: "German", label: "Deutsch", flag: "🇩🇪", speechLang: "de-DE" },
  ];

  // Voice Interaction States (Web Speech Recognition & Synthesis)
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<number | null>(null);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  const handleSwitchMessageLanguage = async (msgId: number, originalContent: string, langCode: string) => {
    if (langCode === "English") {
      setMessageActiveLang(prev => ({ ...prev, [msgId]: "English" }));
      return;
    }

    if (messageTranslations[msgId] && messageTranslations[msgId][langCode]) {
      setMessageActiveLang(prev => ({ ...prev, [msgId]: langCode }));
      toast.success(`Switched answer to ${langCode}`);
      return;
    }

    try {
      setTranslatingMsgId(msgId);
      const res = await tutorService.translate(originalContent, langCode);
      setMessageTranslations(prev => ({
        ...prev,
        [msgId]: {
          ...(prev[msgId] || { "English": originalContent }),
          [langCode]: res.translatedText
        }
      }));
      setMessageActiveLang(prev => ({ ...prev, [msgId]: langCode }));
      toast.success(`Explanation translated to ${langCode}!`);
    } catch {
      toast.error(`Could not translate into ${langCode}`);
    } finally {
      setTranslatingMsgId(null);
    }
  };

  const cleanTextForSpeech = (raw: string) => {
    return raw
      .replace(/\[\d+\]/g, '') // remove citation badges like [1]
      .replace(/[#*_`~>-]/g, ' ') // remove markdown syntax
      .replace(/```[\s\S]*?```/g, 'Code block omitted for audio.')
      .replace(/\n+/g, '. ')
      .trim();
  };

  const toggleSpeak = (msgId: number, text: string) => {
    if (!('speechSynthesis' in window)) {
      toast.error("Text-to-speech audio is not supported in this browser.");
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleaned = cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    const activeLangCode = messageActiveLang[msgId] || targetLanguage || "English";
    const foundLang = SUPPORTED_LANGUAGES.find(l => l.code === activeLangCode);
    if (foundLang) {
      utterance.lang = foundLang.speechLang;
    }

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech Recognition is not supported by your browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        toast("🎙️ Listening... Speak your question now", { icon: "🗣️" });
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setInputMessage(transcript);
      };

      recognition.onerror = (err: any) => {
        setIsListening(false);
        if (err.error !== 'no-speech') {
          toast.error(`Microphone error: ${err.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      toast.error("Microphone access was denied or unavailable.");
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [selectedSubjectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, isSending]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [convs, subs, docs] = await Promise.all([
        tutorService.getConversations(),
        subjectService.getSubjects(),
        documentService.getDocuments(),
      ]);
      setConversations(convs);
      setSubjects(subs);
      setDocuments(docs);
      if (convs.length > 0) {
        loadConversationDetails(convs[0].id);
      }
    } catch {
      toast.error("Failed to load tutor data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const docs = await documentService.getDocuments(selectedSubjectId);
      setDocuments(docs);
    } catch {
      // Ignore
    }
  };

  const loadConversationDetails = async (id: number) => {
    try {
      const fullConv = await tutorService.getConversation(id);
      setActiveConversation(fullConv);
    } catch {
      toast.error("Failed to load chat history");
    }
  };

  const handleStartNewChat = async () => {
    try {
      const title = "Discussion " + (conversations.length + 1);
      const newConv = await tutorService.createConversation({
        title,
        subjectId: selectedSubjectId,
      });
      setConversations([newConv, ...conversations]);
      setActiveConversation(newConv);
      toast.success("New discussion started");
    } catch {
      toast.error("Failed to start new chat");
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    let targetConv = activeConversation;

    try {
      setIsSending(true);
      setInputMessage("");

      // If no active conversation, create one automatically
      if (!targetConv) {
        const title = text.length > 30 ? text.slice(0, 30) + "..." : text;
        targetConv = await tutorService.createConversation({
          title,
          subjectId: selectedSubjectId,
        });
        setConversations([targetConv, ...conversations]);
        setActiveConversation(targetConv);
      }

      // Optimistic user message append
      const optimisticUserMsg: MessageItem = {
        id: Date.now(),
        role: "USER",
        content: text.trim(),
        createdAt: new Date().toISOString(),
      };

      setActiveConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, optimisticUserMsg]
      } : null);

      const res = await tutorService.sendMessage(targetConv.id, {
        message: text.trim(),
        explanationStyle,
        academicLevel,
        language: targetLanguage,
        documentIds: selectedDocumentIds.length > 0 ? selectedDocumentIds : undefined,
        useDocumentGrounding,
      });

      // Update with server responses
      setActiveConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages.filter(m => m.id !== optimisticUserMsg.id), res.userMessage, res.assistantMessage]
      } : null);

      if (res.suggestedFollowUps && res.suggestedFollowUps.length > 0) {
        setSuggestedFollowUps(res.suggestedFollowUps);
      }

      if (res.isDocumentGrounded && res.citations && res.citations.length > 0) {
        toast.success(`Answer grounded in ${res.citations.length} document source(s)! 📚`);
      }

      if (autoSpeak && res.assistantMessage && res.assistantMessage.content) {
        toggleSpeak(res.assistantMessage.id, res.assistantMessage.content);
      }
    } catch {
      toast.error("Failed to send message. Check AI configuration.");
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteConversation = async (id: number) => {
    try {
      await tutorService.deleteConversation(id);
      const remaining = conversations.filter(c => c.id !== id);
      setConversations(remaining);
      if (activeConversation?.id === id) {
        setActiveConversation(remaining.length > 0 ? remaining[0] : null);
        if (remaining.length > 0) {
          loadConversationDetails(remaining[0].id);
        }
      }
      toast.success("Conversation deleted");
    } catch {
      toast.error("Failed to delete conversation");
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error("Please choose a PDF or text file");
      return;
    }
    setIsUploading(true);
    try {
      const doc = await documentService.uploadFile(uploadFile, uploadSubjectId, uploadTitle);
      setDocuments([doc, ...documents]);
      setUploadFile(null);
      setUploadTitle("");
      toast.success(`"${doc.title}" indexed into ${doc.chunkCount} knowledge chunks!`);
      setDocModalTab('library');
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePasteUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteTitle.trim() || !pasteContent.trim()) {
      toast.error("Please provide both a title and text content");
      return;
    }
    setIsUploading(true);
    try {
      const doc = await documentService.uploadText({
        title: pasteTitle.trim(),
        content: pasteContent.trim(),
        subjectId: pasteSubjectId,
      });
      setDocuments([doc, ...documents]);
      setPasteTitle("");
      setPasteContent("");
      toast.success(`"${doc.title}" indexed into ${doc.chunkCount} chunks!`);
      setDocModalTab('library');
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload notes");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (id: number) => {
    if (!confirm("Are you sure you want to remove this document from knowledge base?")) return;
    try {
      await documentService.deleteDocument(id);
      setDocuments(documents.filter(d => d.id !== id));
      setSelectedDocumentIds(selectedDocumentIds.filter(docId => docId !== id));
      toast.success("Document removed");
    } catch {
      toast.error("Failed to delete document");
    }
  };

  const handleInspectChunks = async (doc: StudyDocument) => {
    try {
      const details = await documentService.getDocumentDetails(doc.id);
      setInspectingDoc({ doc, chunks: details.chunks });
    } catch {
      toast.error("Failed to load document chunks");
    }
  };

  const toggleDocumentSelection = (id: number) => {
    if (selectedDocumentIds.includes(id)) {
      setSelectedDocumentIds(selectedDocumentIds.filter(docId => docId !== id));
    } else {
      setSelectedDocumentIds([...selectedDocumentIds, id]);
    }
  };

  // Render assistant content with clickable citations [1], [2]
  const renderMessageContent = (content: string, citations?: RagCitation[]) => {
    if (!citations || citations.length === 0) {
      return <div className="whitespace-pre-wrap leading-relaxed">{content}</div>;
    }

    // Split text by citation pattern e.g. [1], [2]
    const parts = content.split(/(\[\d+\])/g);

    return (
      <div className="whitespace-pre-wrap leading-relaxed">
        {parts.map((part, index) => {
          const match = part.match(/\[(\d+)\]/);
          if (match) {
            const citeNum = parseInt(match[1]);
            const citation = citations.find(c => c.citationIndex === citeNum);
            if (citation) {
              return (
                <button
                  key={index}
                  onClick={() => setActiveCitation(citation)}
                  className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded-md bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-[11px] font-bold border border-indigo-200 hover:scale-105 transition-transform align-baseline shadow-2xs"
                  title={`Source: ${citation.documentTitle} (Page ${citation.pageNumber || 1}) - Click to inspect excerpt`}
                >
                  [{citeNum}]
                </button>
              );
            }
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8.5rem)] flex flex-col">
      {/* Header */}
      <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
              Phase 7
            </span>
            <span className="text-xs text-slate-400 font-medium">Document RAG & Doc Q&A</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
            <Bot className="w-6 h-6 text-indigo-600" />
            <span>AI Academic Tutor (Document Grounding)</span>
          </h1>
          <p className="text-xs text-slate-500">
            Conversational academic tutor answering strictly from your textbooks, lecture notes, and syllabus documents with inline citations.
          </p>
        </div>

        {/* Selectors & Knowledge Base Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Knowledge Base Button */}
          <button
            onClick={() => setIsDocModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all"
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Documents ({documents.length})</span>
          </button>

          {/* Subject Context */}
          <select
            value={selectedSubjectId || ""}
            onChange={(e) => setSelectedSubjectId(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="">All Course Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Academic Level */}
          <select
            value={academicLevel}
            onChange={(e) => setAcademicLevel(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="Undergraduate">Undergraduate</option>
            <option value="Postgraduate">Postgraduate</option>
            <option value="Diploma">Diploma</option>
          </select>

          {/* Explanation Style */}
          <select
            value={explanationStyle}
            onChange={(e) => setExplanationStyle(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="Exam-Oriented & Step-by-Step">Exam-Oriented & Steps</option>
            <option value="Intuitive with Analogies">Intuitive & Analogies</option>
            <option value="Rigorous & Mathematical">Rigorous & Mathematical</option>
          </select>

          {/* Multilingual Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <select
              value={targetLanguage}
              onChange={(e) => {
                setTargetLanguage(e.target.value);
                toast.success(`Tutor language set to ${e.target.value}`);
              }}
              className="bg-transparent text-xs text-slate-700 font-medium outline-none cursor-pointer"
              title="Select language for AI tutor answers"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Voice Output Options */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                const next = !autoSpeak;
                setAutoSpeak(next);
                toast(next ? "🔊 Auto-Speak Answers: ON" : "🔇 Auto-Speak Answers: OFF");
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                autoSpeak ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
              title="Toggle automatic voice read-out for tutor explanations"
            >
              {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Auto-Voice</span>
            </button>

            <select
              value={speechRate}
              onChange={(e) => setSpeechRate(Number(e.target.value))}
              className="text-[11px] bg-transparent text-slate-600 font-semibold px-1 focus:outline-none cursor-pointer"
              title="Voice playback speed"
            >
              <option value={0.8}>0.8x</option>
              <option value={1.0}>1.0x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
            </select>
          </div>

          <button
            onClick={handleStartNewChat}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="mb-2 p-2 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-center gap-2 text-xs text-indigo-700 flex-shrink-0 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
          <span>Syncing academic tutor history and indexed knowledge base...</span>
        </div>
      )}

      {/* RAG Context Grounding Bar */}
      <div className="mb-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-50 via-slate-50 to-blue-50 border border-indigo-100 flex items-center justify-between gap-3 text-xs flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={useDocumentGrounding}
              onChange={(e) => setUseDocumentGrounding(e.target.checked)}
              className="rounded text-indigo-600 accent-indigo-600 w-3.5 h-3.5"
            />
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Document Grounding Mode (RAG)
            </span>
          </label>

          <span className="text-slate-400">•</span>

          <span className="text-slate-600">
            {selectedDocumentIds.length > 0 ? (
              <strong className="text-indigo-600">{selectedDocumentIds.length} Specific Document(s) Selected</strong>
            ) : documents.length > 0 ? (
              <span>Searching across all <strong>{documents.length} verified documents</strong></span>
            ) : (
              <span className="text-slate-400">No documents uploaded yet (General AI knowledge active)</span>
            )}
          </span>
        </div>

        <button
          onClick={() => setIsDocModalOpen(true)}
          className="text-indigo-600 hover:text-indigo-700 font-semibold text-xs inline-flex items-center gap-1"
        >
          <span>Upload or Select Docs</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Chat Shell (Sidebar + Message Area) */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex min-h-0">
        {/* Left Sidebar: Threads List */}
        <aside className="w-72 border-r border-slate-200 bg-slate-50/70 flex flex-col flex-shrink-0 hidden md:flex">
          <div className="p-3 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Discussions ({conversations.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No chats yet.</p>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => loadConversationDetails(c.id)}
                  className={`group p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                    activeConversation?.id === c.id
                      ? "bg-white border-indigo-200 text-indigo-900 font-semibold shadow-xs"
                      : "bg-transparent border-transparent text-slate-600 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="truncate">{c.title}</p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {c.subjectName || "General Studies"}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(c.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 transition-opacity"
                    title="Delete discussion"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Right Main Area: Chat Messages Feed */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Scrollable messages container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {!activeConversation || activeConversation.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto p-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 shadow-xs">
                  <Bot className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">Academic Doc Q&A Assistant</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Ask questions regarding course concepts, formula derivations, or exam problems.
                  When document grounding is active, the assistant cites exact pages and sections from your materials.
                </p>

                {documents.length === 0 && (
                  <button
                    onClick={() => setIsDocModalOpen(true)}
                    className="mt-4 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Syllabus Notes or Textbooks
                  </button>
                )}
              </div>
            ) : (
              activeConversation.messages.map((msg) => {
                const isUser = msg.role === "USER";

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 text-xs ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div className={`space-y-2 max-w-2xl ${isUser ? "items-end" : "items-start"}`}>
                      {/* Message Bubble */}
                      <div
                        className={`p-4 rounded-3xl ${
                          isUser
                            ? "bg-indigo-600 text-white rounded-br-xs shadow-xs"
                            : "bg-slate-50 border border-slate-200/80 text-slate-800 rounded-bl-xs shadow-2xs"
                        }`}
                      >
                        {/* Grounding Header for Assistant */}
                        {!isUser && msg.isDocumentGrounded && (
                          <div className="mb-2 pb-2 border-b border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-emerald-700">
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Document-Grounded Answer
                            </span>
                            {msg.groundingConfidence !== undefined && msg.groundingConfidence > 0 && (
                              <span className="text-[10px] bg-emerald-100/70 px-2 py-0.5 rounded-full text-emerald-800">
                                {Math.round(msg.groundingConfidence * 100)}% Match
                              </span>
                            )}
                          </div>
                        )}

                        {(() => {
                          const activeText = (!isUser && messageTranslations[msg.id] && messageActiveLang[msg.id] && messageTranslations[msg.id][messageActiveLang[msg.id]]) 
                            ? messageTranslations[msg.id][messageActiveLang[msg.id]] 
                            : msg.content;

                          return (
                            <>
                              {renderMessageContent(activeText, msg.citations)}

                              {/* Multilingual Switcher Bar */}
                              {!isUser && (
                                <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                      <Languages className="w-3 h-3 text-indigo-500" />
                                      Translate:
                                    </span>
                                    {SUPPORTED_LANGUAGES.map((lang) => {
                                      const currentMsgLang = messageActiveLang[msg.id] || targetLanguage || "English";
                                      const isActive = currentMsgLang === lang.code;
                                      const isTranslatingThis = translatingMsgId === msg.id;

                                      return (
                                        <button
                                          key={lang.code}
                                          type="button"
                                          onClick={() => handleSwitchMessageLanguage(msg.id, msg.content, lang.code)}
                                          disabled={isTranslatingThis}
                                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                                            isActive
                                              ? "bg-indigo-600 text-white shadow-xs"
                                              : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                                          }`}
                                          title={`Translate this answer to ${lang.label}`}
                                        >
                                          <span>{lang.flag}</span>
                                          <span>{lang.code}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Audio Voice Player for Assistant Message */}
                              {!isUser && (
                                <div className="mt-2 pt-2 border-t border-slate-200/40 flex items-center justify-between text-xs">
                                  <button
                                    type="button"
                                    onClick={() => toggleSpeak(msg.id, activeText)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                                      speakingMsgId === msg.id
                                        ? "bg-rose-50 text-rose-600 border border-rose-200 animate-pulse"
                                        : "bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200/60"
                                    }`}
                                  >
                                    {speakingMsgId === msg.id ? (
                                      <>
                                        <Radio className="w-3.5 h-3.5 text-rose-500 animate-spin" />
                                        <span>Speaking... (Click to Stop)</span>
                                        <span className="flex gap-0.5 items-end h-3 ml-1">
                                          <span className="w-0.5 h-2 bg-rose-500 animate-bounce" />
                                          <span className="w-0.5 h-3 bg-rose-500 animate-bounce delay-75" />
                                          <span className="w-0.5 h-1.5 bg-rose-500 animate-bounce delay-150" />
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>Listen to Explanation</span>
                                      </>
                                    )}
                                  </button>
                                  <span className="text-[10px] text-slate-400">
                                    {speakingMsgId === msg.id ? `${speechRate}x speed` : "Voice Audio"}
                                  </span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      {/* Sources & Citations Footer for Assistant */}
                      {!isUser && msg.citations && msg.citations.length > 0 && (
                        <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs space-y-2 w-full">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-900 text-[11px] flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                              Sources & Citations ({msg.citations.length})
                            </span>
                            <span className="text-[10px] text-slate-400">Click to view source excerpt</span>
                          </div>

                          <div className="grid grid-cols-1 gap-1.5">
                            {msg.citations.map((cite) => (
                              <button
                                key={cite.citationIndex}
                                onClick={() => setActiveCitation(cite)}
                                className="text-left p-2 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-all flex items-start gap-2 group"
                              >
                                <span className="w-5 h-5 rounded-md bg-indigo-100 group-hover:bg-indigo-600 group-hover:text-white text-indigo-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 transition-colors">
                                  {cite.citationIndex}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <strong className="text-slate-800 truncate font-semibold">
                                      {cite.documentTitle}
                                    </strong>
                                    {cite.pageNumber && (
                                      <span className="text-[10px] text-slate-400 font-medium">
                                        Page {cite.pageNumber}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-500 italic truncate mt-0.5">
                                    "{cite.snippet}"
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {isSending && (
              <div className="flex gap-3 text-xs justify-start items-center">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Scanning verified documents & generating grounded response...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Follow-Ups Pills */}
          {suggestedFollowUps.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto bg-slate-50/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 flex-shrink-0 mr-1">
                <Lightbulb className="w-3 h-3 text-amber-500" />
                Follow-ups:
              </span>
              {suggestedFollowUps.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  disabled={isSending}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 text-[11px] whitespace-nowrap transition-colors flex-shrink-0 shadow-2xs"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Real-time Listening Waveform Banner */}
          {isListening && (
            <div className="px-4 py-2 bg-rose-50 border-t border-rose-100 flex items-center justify-between text-xs text-rose-700 animate-pulse">
              <div className="flex items-center gap-2 font-medium">
                <Radio className="w-4 h-4 text-rose-600 animate-spin" />
                <span>Microphone Active — Speak your question clearly...</span>
                <span className="flex gap-1 items-end h-4 ml-1">
                  <span className="w-1 h-2 bg-rose-600 animate-bounce" />
                  <span className="w-1 h-4 bg-rose-600 animate-bounce delay-75" />
                  <span className="w-1 h-3 bg-rose-600 animate-bounce delay-150" />
                  <span className="w-1 h-4 bg-rose-600 animate-bounce delay-100" />
                </span>
              </div>
              <button
                type="button"
                onClick={toggleListening}
                className="px-2 py-0.5 rounded-md bg-rose-200/80 hover:bg-rose-300 text-rose-900 font-semibold text-[11px]"
              >
                Done Speaking
              </button>
            </div>
          )}

          {/* Bottom Chat Input Form */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => setIsDocModalOpen(true)}
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-indigo-600 transition-colors"
                title="Manage documents"
              >
                <BookOpen className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-2xl border transition-all flex items-center justify-center ${
                  isListening
                    ? "bg-rose-500 border-rose-600 text-white shadow-lg shadow-rose-500/30 animate-pulse scale-105"
                    : "border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-indigo-600"
                }`}
                title={isListening ? "Listening... Click to stop" : "Speak question with Microphone"}
              >
                {isListening ? (
                  <Radio className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={isListening ? "Listening to your voice..." : "Ask any question or speak with microphone..."}
                disabled={isSending}
                className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isSending}
                className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </main>
      </div>

      {/* MODAL 1: DOCUMENT MANAGEMENT & KNOWLEDGE BASE */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Knowledge Base & Document Grounding
                </h3>
                <p className="text-xs text-slate-500">Manage uploaded materials used to ground AI responses with citations</p>
              </div>
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-semibold flex-shrink-0">
              <button
                onClick={() => setDocModalTab('library')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  docModalTab === 'library'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Document Library ({documents.length})
              </button>
              <button
                onClick={() => setDocModalTab('upload')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  docModalTab === 'upload'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Upload File (PDF / Text)
              </button>
              <button
                onClick={() => setDocModalTab('paste')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  docModalTab === 'paste'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Paste Notes / Markdown
              </button>
            </div>

            {/* Tab 1: Library */}
            {docModalTab === 'library' && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                {documents.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                    <h4 className="font-semibold text-slate-700">No Documents Uploaded Yet</h4>
                    <p className="text-slate-500 max-w-sm mx-auto">
                      Upload course textbooks, lecture slides, or revision notes to enable source citations in tutor answers.
                    </p>
                    <button
                      onClick={() => setDocModalTab('upload')}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold"
                    >
                      Upload First Document
                    </button>
                  </div>
                ) : (
                  documents.map((doc) => {
                    const isSelected = selectedDocumentIds.includes(doc.id);

                    return (
                      <div
                        key={doc.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-300 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleDocumentSelection(doc.id)}
                            className="mt-1 rounded text-indigo-600 accent-indigo-600 w-4 h-4 cursor-pointer"
                            title="Filter grounding to this document"
                          />

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                                {doc.fileType}
                              </span>
                              <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{doc.title}</h4>
                            </div>

                            <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed">
                              {doc.summary || "Indexed academic document chunks ready for retrieval."}
                            </p>

                            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium pt-0.5">
                              <span>📄 {doc.pageCount} Pages</span>
                              <span>🧩 {doc.chunkCount} Chunks</span>
                              {doc.subjectName && <span>📚 {doc.subjectName}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleInspectChunks(doc)}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                          >
                            Inspect Chunks
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab 2: Upload File */}
            {docModalTab === 'upload' && (
              <form onSubmit={handleFileUpload} className="space-y-4 text-xs font-medium">
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Choose PDF or Text File *</label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.txt,.md"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadFile(e.target.files[0]);
                        if (!uploadTitle) {
                          setUploadTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
                        }
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:text-xs file:font-semibold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Supported: PDF (multi-page with page-by-page citation tracking), TXT, Markdown (.md)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-semibold mb-1 block">Document Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Operating Systems Lecture 4"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold mb-1 block">Subject (Optional)</label>
                    <select
                      value={uploadSubjectId || ''}
                      onChange={(e) => setUploadSubjectId(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">General / None</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDocModalTab('library')}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || !uploadFile}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold shadow-xs flex items-center gap-1.5"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Extracting & Indexing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        Upload & Index Document
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 3: Paste Notes / Markdown */}
            {docModalTab === 'paste' && (
              <form onSubmit={handlePasteUpload} className="space-y-4 text-xs font-medium">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-semibold mb-1 block">Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Graph Theory Summary Notes"
                      value={pasteTitle}
                      onChange={(e) => setPasteTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold mb-1 block">Subject</label>
                    <select
                      value={pasteSubjectId || ''}
                      onChange={(e) => setPasteSubjectId(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">General / None</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Notes / Markdown Text Content *</label>
                  <textarea
                    required
                    rows={8}
                    placeholder="Paste textbook excerpts, definitions, code snippets, or revision notes here..."
                    value={pasteContent}
                    onChange={(e) => setPasteContent(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDocModalTab('library')}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold shadow-xs flex items-center gap-1.5"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Chunking & Indexing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        Save & Index Notes
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: INSPECT DOCUMENT CHUNKS */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  Semantic Chunks: {inspectingDoc.doc.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {inspectingDoc.chunks.length} chunks indexed for RAG similarity matching
                </p>
              </div>
              <button
                onClick={() => setInspectingDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {inspectingDoc.chunks.map((chunk) => (
                <div key={chunk.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      Chunk #{chunk.chunkIndex + 1}
                    </span>
                    <span className="text-slate-400">
                      Page {chunk.pageNumber} {chunk.sectionHeading && `• ${chunk.sectionHeading}`}
                    </span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {chunk.chunkContent}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                onClick={() => setInspectingDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CITATION SOURCE DETAIL PREVIEW */}
      {activeCitation && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-start gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                  [{activeCitation.citationIndex}]
                </span>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{activeCitation.documentTitle}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {activeCitation.fileName} {activeCitation.pageNumber && `• Page ${activeCitation.pageNumber}`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveCitation(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Verified Reference Excerpt
                </span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-[10px]">
                  {Math.round(activeCitation.relevanceScore * 100)}% Match
                </span>
              </div>

              {activeCitation.sectionHeading && (
                <div className="p-2 rounded-xl bg-slate-100 font-semibold text-slate-700 text-[11px]">
                  Section: {activeCitation.sectionHeading}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100/80 text-slate-800 leading-relaxed max-h-60 overflow-y-auto">
                <Quote className="w-4 h-4 text-indigo-400 mb-2" />
                <p className="italic">{activeCitation.snippet}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                onClick={() => setActiveCitation(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
