import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  Bot, 
  Send, 
  Plus, 
  Trash2, 
  Loader2, 
  User as UserIcon, 
  FileText, 
  Upload, 
  BookOpen, 
  Sparkles, 
  X, 
  ShieldCheck, 
  Quote,
  Mic,
  Volume2,
  Radio,
  Languages,
  WifiOff,
  Play,
  Pause,
  Square,
  MicOff,
  PanelLeftClose,
  PanelLeftOpen,
  History,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Camera
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
import { imageQaService } from "../../services/imageQa.service";
import toast from "react-hot-toast";

export default function TutorPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [documents, setDocuments] = useState<StudyDocument[]>([]);

  // Grounding & RAG states
  const [useDocumentGrounding] = useState(true);
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
  const [explanationStyle] = useState("Exam-Oriented & Step-by-Step");
  const [academicLevel] = useState("Undergraduate");
  const [selectedSubjectId] = useState<number | undefined>();
  const [, setSuggestedFollowUps] = useState<string[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Image Question attachment state (Problem Solver Integration)
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedImageName, setAttachedImageName] = useState<string>("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Multilingual Learning States
  const [targetLanguage] = useState<string>("English");
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
  const [isSpeechPaused, setIsSpeechPaused] = useState<boolean>(false);
  const [speakingTextSnippet, setSpeakingTextSnippet] = useState<string>("");
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [autoSpeak] = useState<boolean>(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false);
  const [voiceReviewOpen, setVoiceReviewOpen] = useState<boolean>(false);
  const isSpeechSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const recognitionRef = useRef<any>(null);

  // Left sidebar minimization state (persisted)
  const [isSidebarMinimized, setIsSidebarMinimized] = useState<boolean>(() => {
    return localStorage.getItem("tutor_sidebar_minimized") === "true";
  });

  const toggleSidebar = () => {
    setIsSidebarMinimized(prev => {
      const next = !prev;
      localStorage.setItem("tutor_sidebar_minimized", String(next));
      return next;
    });
  };

  // Copy feedback state
  const [copiedMsgId, setCopiedMsgId] = useState<number | null>(null);
  const handleCopyMessage = (msgId: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Response rating feedback state
  const [feedbackGiven, setFeedbackGiven] = useState<Record<number, 'up' | 'down'>>({});
  const handleFeedback = (msgId: number, type: 'up' | 'down') => {
    setFeedbackGiven(prev => ({ ...prev, [msgId]: type }));
    toast.success(type === 'up' ? "Response marked as helpful!" : "Feedback noted, we'll refine explanations!");
  };

  // Image upload & paste handlers
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }
    setAttachedImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
      toast.success(`Attached problem image: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
    e.target.value = '';
  };

  const handlePasteImage = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handleImageFile(file);
          toast.success('Pasted problem snapshot from clipboard!');
          return;
        }
      }
    }
  };

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

  const pauseSpeech = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsSpeechPaused(true);
      toast("Audio paused", { icon: "⏸️" });
    }
  };

  const resumeSpeech = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsSpeechPaused(false);
      toast("Audio resumed", { icon: "▶️" });
    }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      setIsSpeechPaused(false);
      setSpeakingTextSnippet("");
    }
  };

  const toggleSpeak = (msgId: number, text: string) => {
    if (!('speechSynthesis' in window)) {
      toast.error("Text-to-speech audio is not supported in this browser.");
      return;
    }

    if (speakingMsgId === msgId) {
      if (isSpeechPaused) {
        resumeSpeech();
      } else {
        pauseSpeech();
      }
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeechPaused(false);
    const cleaned = cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    const activeLangCode = messageActiveLang[msgId] || targetLanguage || "English";
    const foundLang = SUPPORTED_LANGUAGES.find(l => l.code === activeLangCode);
    if (foundLang) {
      utterance.lang = foundLang.speechLang;
    }

    utterance.onend = () => {
      setSpeakingMsgId(null);
      setIsSpeechPaused(false);
      setSpeakingTextSnippet("");
    };
    utterance.onerror = () => {
      setSpeakingMsgId(null);
      setIsSpeechPaused(false);
      setSpeakingTextSnippet("");
    };

    setSpeakingMsgId(msgId);
    setSpeakingTextSnippet(text.length > 70 ? text.substring(0, 70) + "..." : text);
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicPermissionDenied(true);
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
        setMicPermissionDenied(false);
        setVoiceReviewOpen(true);
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
        if (err.error === 'not-allowed' || err.error === 'service-not-allowed') {
          setMicPermissionDenied(true);
          toast.error("Microphone permission was denied. You can continue using text input.");
        } else if (err.error !== 'no-speech') {
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
      setMicPermissionDenied(true);
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
      const title = "Chat " + (conversations.length + 1);
      const newConv = await tutorService.createConversation({
        title,
        subjectId: selectedSubjectId,
      });
      setConversations([newConv, ...conversations]);
      setActiveConversation(newConv);
      toast.success("New chat started");
    } catch {
      toast.error("Failed to start new chat");
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : inputMessage;
    if (!text.trim() && !attachedImage) return;

    let targetConv = activeConversation;

    try {
      setIsSending(true);
      const currentImage = attachedImage;
      const currentImageName = attachedImageName;
      setInputMessage("");
      setAttachedImage(null);
      setAttachedImageName("");

      // If no active conversation, create one automatically
      if (!targetConv) {
        const title = text.trim() 
          ? (text.length > 30 ? text.slice(0, 30) + "..." : text) 
          : (currentImageName ? `Problem: ${currentImageName}` : "Problem Snapshot");
        targetConv = await tutorService.createConversation({
          title,
          subjectId: selectedSubjectId,
        });
        setConversations([targetConv, ...conversations]);
        setActiveConversation(targetConv);
      }

      // If an image is attached, solve with imageQaService
      if (currentImage) {
        const userMsgContent = (text.trim() ? text.trim() + "\n\n" : "") + `![Attached Problem Snapshot](${currentImage})`;
        const optimisticUserMsg: MessageItem = {
          id: Date.now(),
          role: "USER",
          content: userMsgContent,
          createdAt: new Date().toISOString(),
        };

        setActiveConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, optimisticUserMsg]
        } : null);

        toast.loading("Analyzing problem image & extracting mathematical formulas...", { id: "image-solver" });

        const solveRes = await imageQaService.solve({
          imageBase64: currentImage,
          imageName: currentImageName || "problem.png",
          questionPrompt: text.trim() || undefined,
          subjectName: targetConv.subjectName || undefined,
          detailLevel: 'step_by_step'
        });

        toast.success("Problem solved with full step-by-step breakdown!", { id: "image-solver" });

        const formattedSolution = `### 📝 Problem Analysis: ${solveRes.title || 'Extracted Academic Problem'}
**Extracted Statement:**
> ${solveRes.extractedProblemText || 'Analyzed from image'}

${solveRes.givenValues && solveRes.givenValues.length > 0 ? `**Given Values:**\n${solveRes.givenValues.map((v: string) => `• ${v}`).join('\n')}\n\n` : ''}${solveRes.keyFormulas && solveRes.keyFormulas.length > 0 ? `**Key Formulas:**\n${solveRes.keyFormulas.map((f: string) => `• \`${f}\``).join('\n')}\n\n` : ''}### 🔬 Step-by-Step Mathematical Solution:
${solveRes.solutionSteps && solveRes.solutionSteps.length > 0 
  ? solveRes.solutionSteps.map((s: any) => `**Step ${s.stepNumber}: ${s.title}**\n${s.formula ? `> Formula: \`${s.formula}\`\n\n` : ''}${s.explanation}${s.intermediateResult ? `\n*Intermediate result:* **${s.intermediateResult}**` : ''}`).join('\n\n')
  : 'Solution derived directly from the uploaded diagram.'}

### 🎯 Final Answer:
**${solveRes.finalAnswer || 'See step derivation above.'}**

${solveRes.commonPitfalls && solveRes.commonPitfalls.length > 0 ? `### ⚠️ Common Pitfalls to Avoid:\n${solveRes.commonPitfalls.map((p: string) => `• ${p}`).join('\n')}\n\n` : ''}${solveRes.relatedPracticeQuestions && solveRes.relatedPracticeQuestions.length > 0 ? `### 💡 Related Practice:\n${solveRes.relatedPracticeQuestions.map((q: any) => `• **[${q.difficulty}]** ${q.question} *(Hint: ${q.answerHint})*`).join('\n')}` : ''}`;

        const assistantMsg: MessageItem = {
          id: Date.now() + 1,
          role: "ASSISTANT",
          content: formattedSolution,
          createdAt: new Date().toISOString(),
        };

        setActiveConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, assistantMsg]
        } : null);

        if (autoSpeak && formattedSolution) {
          toggleSpeak(assistantMsg.id, formattedSolution);
        }

        // Also persist problem statement into tutor conversation history on backend
        tutorService.sendMessage(targetConv.id, {
          message: `[Image Problem Solved]: ${solveRes.extractedProblemText || text.trim()}`,
          explanationStyle,
          academicLevel,
          language: targetLanguage,
          useDocumentGrounding: false
        }).catch(() => {
          // Non-blocking sync
        });

        return;
      }

      // Standard text message flow
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
      toast.dismiss("image-solver");
      toast.error("Failed to process message or solve image. Please try again.");
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

  // Render assistant or user content with clickable citations [1], [2] and embedded images
  const renderMessageContent = (content: string, citations?: RagCitation[]) => {
    // Check if message contains markdown images: ![alt](url)
    const imgRegex = /!\[(.*?)\]\((data:image\/[a-zA-Z0-9+]+;base64,[^\s)]+|https?:\/\/[^\s)]+)\)/g;
    const partsWithImg: { type: 'text' | 'image'; text?: string; src?: string; alt?: string }[] = [];
    let lastIdx = 0;
    let match;

    while ((match = imgRegex.exec(content)) !== null) {
      if (match.index > lastIdx) {
        partsWithImg.push({ type: 'text', text: content.slice(lastIdx, match.index) });
      }
      partsWithImg.push({ type: 'image', alt: match[1], src: match[2] });
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < content.length) {
      partsWithImg.push({ type: 'text', text: content.slice(lastIdx) });
    }

    return (
      <div className="space-y-2">
        {partsWithImg.map((block, bIdx) => {
          if (block.type === 'image') {
            return (
              <div key={bIdx} className="my-2">
                <img
                  src={block.src}
                  alt={block.alt || 'Problem Snapshot'}
                  className="rounded-2xl max-h-72 max-w-full object-contain border border-slate-200/90 shadow-sm"
                />
              </div>
            );
          }

          const textBlock = block.text || '';
          if (!citations || citations.length === 0) {
            return <div key={bIdx} className="whitespace-pre-wrap leading-relaxed">{textBlock}</div>;
          }

          const parts = textBlock.split(/(\[\d+\])/g);
          return (
            <div key={bIdx} className="whitespace-pre-wrap leading-relaxed">
              {parts.map((part, index) => {
                const matchCite = part.match(/\[(\d+)\]/);
                if (matchCite) {
                  const citeNum = parseInt(matchCite[1]);
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
        })}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-4.5rem)] flex flex-col">

      {isLoading && (
        <div className="mb-2 p-2 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-center gap-2 text-xs text-indigo-700 flex-shrink-0 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
          <span>Syncing academic tutor history...</span>
        </div>
      )}

      {/* Main Chat Shell (Sidebar + Message Area) */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex min-h-0 relative">
        {/* Left Sidebar: Threads List / Minimized Rail */}
        <aside
          className={`${
            isSidebarMinimized ? "w-16" : "w-72 sm:w-80"
          } transition-all duration-200 ease-in-out border-r border-slate-200/90 bg-slate-50/80 flex flex-col flex-shrink-0 hidden md:flex relative z-10`}
        >
          {isSidebarMinimized ? (
            /* MINIMIZED SIDEBAR RAIL (ChatGPT style) */
            <div className="flex-1 flex flex-col items-center py-3.5 px-2 justify-between">
              <div className="flex flex-col items-center gap-3 w-full">
                {/* 1. Logo of AI Tutor */}
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs hover:scale-105 transition-all group relative"
                  title="AI Tutor (Click to expand sidebar)"
                >
                  <Bot className="w-5 h-5" />
                  <span className="absolute left-14 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md">
                    AI Tutor (Expand)
                  </span>
                </button>

                {/* 2. New Chat Icon */}
                <button
                  type="button"
                  onClick={handleStartNewChat}
                  className="w-10 h-10 rounded-xl border border-slate-200/80 bg-white hover:bg-indigo-50 hover:border-indigo-200 text-slate-700 hover:text-indigo-600 flex items-center justify-center shadow-2xs hover:scale-105 transition-all group relative"
                  title="New Chat"
                >
                  <Plus className="w-5 h-5" />
                  <span className="absolute left-14 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md">
                    New Chat
                  </span>
                </button>

                {/* 3. Logo for History / Recents talk */}
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="w-10 h-10 rounded-xl border border-slate-200/80 bg-white hover:bg-indigo-50 hover:border-indigo-200 text-slate-700 hover:text-indigo-600 flex items-center justify-center shadow-2xs hover:scale-105 transition-all group relative"
                  title="History / Recents Talks"
                >
                  <History className="w-4 h-4" />
                  {conversations.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-2xs">
                      {conversations.length > 9 ? "9+" : conversations.length}
                    </span>
                  )}
                  <span className="absolute left-14 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md">
                    Recent Talks ({conversations.length})
                  </span>
                </button>

                {/* 4. Expand Sidebar Toggle Button */}
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="w-10 h-10 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors group relative"
                  title="Expand sidebar"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                  <span className="absolute left-14 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md">
                    Expand Sidebar
                  </span>
                </button>
              </div>

              {/* Bottom: Document Knowledge Base button */}
              <div className="w-full flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(true)}
                  className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 flex items-center justify-center shadow-2xs transition-all group relative"
                  title="Grounding Knowledge Base"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="absolute left-14 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md">
                    Study Documents ({documents.length})
                  </span>
                </button>
              </div>
            </div>
          ) : (
            /* FULL EXPANDED SIDEBAR */
            <>
              {/* Header with Title, Bot Icon, and Minimize Button */}
              <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs leading-tight">AI Tutor</h3>
                    <span className="text-[10px] text-slate-400 font-medium">ChatGPT Academic Mode</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
                  title="Minimize sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>

              {/* New Chat Button */}
              <div className="p-3 border-b border-slate-200/70 space-y-2">
                <button
                  type="button"
                  onClick={handleStartNewChat}
                  className="w-full py-2.5 px-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs hover:shadow-indigo-500/20 transition-all active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Chat</span>
                </button>

                <div className="flex items-center justify-between px-1 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-indigo-500" />
                    Recent Talks
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                    {conversations.length}
                  </span>
                </div>
              </div>

              {/* Conversation History List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
                {conversations.length === 0 ? (
                  <div className="text-center py-8 px-3">
                    <MessageSquare className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-medium">No recent talks yet.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Start a conversation to see your study history here.</p>
                  </div>
                ) : (
                  conversations.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => loadConversationDetails(c.id)}
                      className={`group p-2.5 rounded-2xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                        activeConversation?.id === c.id
                          ? "bg-white border-indigo-200 text-indigo-950 font-semibold shadow-xs"
                          : "bg-transparent border-transparent text-slate-600 hover:bg-white/80 hover:border-slate-200/60"
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="truncate text-xs">{c.title}</p>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {c.subjectName || "General Studies"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(c.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-all"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Grounding Library status card */}
              <div className="p-2.5 border-t border-slate-200/80 bg-white/70">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(true)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 text-xs font-medium text-slate-700 flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span className="font-semibold text-xs text-slate-800">Grounding Library</span>
                  </span>
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">
                    {documents.length} docs
                  </span>
                </button>
              </div>
            </>
          )}
        </aside>

        {/* Right Main Area: ChatGPT Chat Stream */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
          {/* Main Chat Top Minimal Bar */}
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0 z-10">
            <div className="flex items-center gap-2">
              {isSidebarMinimized && (
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Expand sidebar"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              )}
              {/* Mobile sidebar toggle button */}
              <button
                type="button"
                onClick={toggleSidebar}
                className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Open conversations"
              >
                <History className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-800 truncate max-w-xs sm:max-w-md">
                  {activeConversation ? activeConversation.title : "New Academic Chat"}
                </span>
                {activeConversation?.subjectName && (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                    {activeConversation.subjectName}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDocModalOpen(true)}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold px-2.5 py-1 rounded-xl bg-indigo-50/70 hover:bg-indigo-100/70 transition-colors flex items-center gap-1.5"
                title="Manage Document Grounding"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grounding Notes</span>
                {selectedDocumentIds.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
            </div>
          </div>

          {/* Centered Scrollable Messages Container (Option 2 ChatGPT width max-w-3xl) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col">
            {!activeConversation || activeConversation.messages.length === 0 ? (
              /* Minimalist Welcome State (ChatGPT style) */
              <div className="my-auto flex flex-col items-center justify-center text-center max-w-xl mx-auto p-4 animate-in fade-in duration-300">
                <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center mb-4 shadow-md shadow-indigo-500/20">
                  <Bot className="w-7 h-7" />
                </div>
                <h2 className="font-extrabold text-slate-900 text-2xl sm:text-3xl tracking-tight">
                  What would you like to master today?
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
                  Ask exam questions, get step-by-step formula derivations, or ground answers with your uploaded lecture notes and textbooks.
                </p>

                {/* Quick suggestion chips (Option 2 style) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 w-full max-w-md">
                  {[
                    "Explain Quantum Mechanics wave duality",
                    "Summarize key formulas from Chapter 3",
                    "Guide me through calculus derivative rules",
                    "Generate quick revision practice questions"
                  ].map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInputMessage(prompt)}
                      className="p-3 text-left rounded-2xl border border-slate-200/90 hover:border-indigo-300 hover:bg-indigo-50/40 text-slate-700 hover:text-indigo-900 text-xs font-medium transition-all shadow-2xs hover:shadow-xs group"
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 group-hover:text-indigo-600 mb-1 font-semibold uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        Quick Study Prompt
                      </div>
                      <p className="line-clamp-1">{prompt}</p>
                    </button>
                  ))}
                </div>

                {documents.length === 0 && (
                  <button
                    onClick={() => setIsDocModalOpen(true)}
                    className="mt-6 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Syllabus Notes or Textbooks for Citations
                  </button>
                )}
              </div>
            ) : (
              /* Active Conversation Stream (ChatGPT Option 2) */
              <div className="max-w-3xl mx-auto w-full space-y-6">
                {activeConversation.messages.map((msg) => {
                  const isUser = msg.role === "USER";

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3.5 text-xs ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isUser && (
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div className={`space-y-2.5 max-w-2xl w-full ${isUser ? "flex flex-col items-end" : "items-start"}`}>
                        {/* Message Bubble */}
                        <div
                          className={`p-4 sm:p-5 rounded-3xl ${
                            isUser
                              ? "bg-slate-900 text-white rounded-br-xs shadow-xs max-w-xl text-left"
                              : "bg-slate-50/90 border border-slate-200/80 text-slate-800 rounded-bl-xs shadow-2xs w-full"
                          }`}
                        >
                          {/* Grounding Header for Assistant */}
                          {!isUser && msg.isDocumentGrounded && (
                            <div className="mb-2.5 pb-2 border-b border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-emerald-700">
                              <span className="flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                Verified Document-Grounded Answer
                              </span>
                              {msg.groundingConfidence !== undefined && msg.groundingConfidence > 0 && (
                                <span className="text-[10px] bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
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
                                <div className="text-slate-800 text-[13px] leading-relaxed">
                                  {renderMessageContent(activeText, msg.citations)}
                                </div>

                                {/* Multilingual Translation Switcher */}
                                {!isUser && (
                                  <div className="mt-3 pt-2.5 border-t border-slate-200/50 flex flex-wrap items-center justify-between gap-2 text-xs">
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
                                                : "bg-white hover:bg-slate-200 text-slate-600 border border-slate-200/60"
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
                                  <div className="mt-2.5 pt-2 border-t border-slate-200/40 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => toggleSpeak(msg.id, activeText)}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                                          speakingMsgId === msg.id
                                            ? isSpeechPaused
                                              ? "bg-amber-50 text-amber-700 border border-amber-300"
                                              : "bg-rose-50 text-rose-600 border border-rose-200 animate-pulse"
                                            : "bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200"
                                        }`}
                                      >
                                        {speakingMsgId === msg.id ? (
                                          isSpeechPaused ? (
                                            <>
                                              <Play className="w-3.5 h-3.5 text-amber-600" />
                                              <span>Paused (Resume)</span>
                                            </>
                                          ) : (
                                            <>
                                              <Pause className="w-3.5 h-3.5 text-rose-600" />
                                              <span>Speaking...</span>
                                              <span className="flex gap-0.5 items-end h-3 ml-1">
                                                <span className="w-0.5 h-2 bg-rose-500 animate-bounce" />
                                                <span className="w-0.5 h-3 bg-rose-500 animate-bounce delay-75" />
                                                <span className="w-0.5 h-1.5 bg-rose-500 animate-bounce delay-150" />
                                              </span>
                                            </>
                                          )
                                        ) : (
                                          <>
                                            <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                                            <span>Listen Aloud</span>
                                          </>
                                        )}
                                      </button>

                                      {speakingMsgId === msg.id && (
                                        <button
                                          type="button"
                                          onClick={stopSpeech}
                                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                          title="Stop audio playback"
                                        >
                                          <Square className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                      {speakingMsgId === msg.id && (
                                        <div className="flex items-center gap-1">
                                          {[0.8, 1.0, 1.25].map((rate) => (
                                            <button
                                              key={rate}
                                              type="button"
                                              onClick={() => {
                                                setSpeechRate(rate);
                                                toggleSpeak(msg.id, activeText);
                                              }}
                                              className={`px-1.5 py-0.5 rounded ${
                                                speechRate === rate ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-slate-200'
                                              }`}
                                            >
                                              {rate}x
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                      <span>{speakingMsgId === msg.id ? (isSpeechPaused ? "Paused" : "Playing") : "Voice Audio"}</span>
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>

                        {/* ChatGPT Action Row below Assistant Response (Option 2) */}
                        {!isUser && (
                          <div className="flex items-center gap-1 px-1 text-slate-400">
                            {/* Copy button */}
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(msg.id, msg.content)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors flex items-center gap-1 text-[11px] font-medium"
                              title="Copy response to clipboard"
                            >
                              {copiedMsgId === msg.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700 text-[10px] font-semibold">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span className="text-[10px]">Copy</span>
                                </>
                              )}
                            </button>

                            {/* Thumbs up */}
                            <button
                              type="button"
                              onClick={() => handleFeedback(msg.id, 'up')}
                              className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors ${
                                feedbackGiven[msg.id] === 'up' ? "text-indigo-600 bg-indigo-50" : "hover:text-slate-700"
                              }`}
                              title="Helpful response"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>

                            {/* Thumbs down */}
                            <button
                              type="button"
                              onClick={() => handleFeedback(msg.id, 'down')}
                              className={`p-1.5 rounded-lg hover:bg-slate-100 transition-colors ${
                                feedbackGiven[msg.id] === 'down' ? "text-rose-600 bg-rose-50" : "hover:text-slate-700"
                              }`}
                              title="Not helpful"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Sources & Citations Footer for Assistant (Option 2) */}
                        {!isUser && msg.citations && msg.citations.length > 0 && (
                          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs space-y-2 w-full">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-indigo-900 text-[11px] flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                                Verified Sources & Citations ({msg.citations.length})
                              </span>
                              <span className="text-[10px] text-slate-400">Click to view source excerpt</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {msg.citations.map((cite) => (
                                <button
                                  key={cite.citationIndex}
                                  onClick={() => setActiveCitation(cite)}
                                  className="text-left p-2.5 rounded-xl bg-white hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-300 transition-all flex items-start gap-2 group shadow-2xs"
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
                                          p. {cite.pageNumber}
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
                        <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
                          <UserIcon className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}

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
            )}
          </div>

          {/* Global Sticky Audio Player Bar when speaking */}
          {speakingMsgId !== null && (
            <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-white shadow-lg z-20">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex gap-0.5 items-end h-3.5 flex-shrink-0">
                  <span className={`w-1 bg-indigo-400 rounded-full ${isSpeechPaused ? 'h-2' : 'h-3.5 animate-bounce'}`} />
                  <span className={`w-1 bg-indigo-400 rounded-full ${isSpeechPaused ? 'h-3' : 'h-2 animate-bounce delay-75'}`} />
                  <span className={`w-1 bg-indigo-400 rounded-full ${isSpeechPaused ? 'h-1.5' : 'h-3 animate-bounce delay-150'}`} />
                  <span className={`w-1 bg-indigo-400 rounded-full ${isSpeechPaused ? 'h-2.5' : 'h-3.5 animate-bounce delay-100'}`} />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">
                    {isSpeechPaused ? "Audio Paused" : "Playing Voice Explanation"}
                  </span>
                  <p className="text-xs text-slate-300 truncate font-medium">
                    {speakingTextSnippet || "AI Tutor Voice Response"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={isSpeechPaused ? resumeSpeech : pauseSpeech}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1 shadow-sm transition"
                >
                  {isSpeechPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isSpeechPaused ? "Resume" : "Pause"}</span>
                </button>
                <button
                  type="button"
                  onClick={stopSpeech}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 hover:text-rose-400 text-slate-300 transition"
                  title="Stop playback"
                >
                  <Square className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Voice Speech-to-Text Review Drawer */}
          {voiceReviewOpen && (
            <div className="p-4 bg-indigo-50/90 border-t border-indigo-100 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150 z-20">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-indigo-600 text-white'}`}>
                    <Mic className="w-4 h-4" />
                  </div>
                  <span>{isListening ? "🎙️ Listening... Speak your question clearly" : "🎙️ Voice Question Captured — Review & Edit"}</span>
                  {isListening && (
                    <span className="flex gap-1 items-end h-3 ml-1">
                      <span className="w-1 h-2 bg-rose-500 animate-bounce" />
                      <span className="w-1 h-3.5 bg-rose-500 animate-bounce delay-75" />
                      <span className="w-1 h-2 bg-rose-500 animate-bounce delay-150" />
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isListening ? (
                    <button
                      type="button"
                      onClick={toggleListening}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition"
                    >
                      Done Speaking
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={toggleListening}
                      className="px-2.5 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-xs font-semibold transition"
                    >
                      Speak Again
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceReviewOpen(false);
                      if (isListening) toggleListening();
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Editable Transcript Input */}
              <div className="space-y-1.5">
                <div className="text-[11px] text-slate-500 font-medium">
                  Spoken question transcript (you can edit text before sending):
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={isListening ? "Listening to your voice..." : "Your spoken question will appear here..."}
                    className="flex-1 px-3.5 py-2 text-xs border border-indigo-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!inputMessage.trim()) return;
                      setVoiceReviewOpen(false);
                      handleSendMessage();
                    }}
                    disabled={!inputMessage.trim() || isSending}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Question</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Fallback Warning for Denied / Unsupported Microphone */}
          {(micPermissionDenied || !isSpeechSupported) && (
            <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 flex items-center justify-between text-xs text-amber-800 z-10">
              <div className="flex items-center gap-2">
                <MicOff className="w-4 h-4 text-amber-600" />
                <span>
                  {!isSpeechSupported 
                    ? "Speech recognition is not supported in this browser. Text input is active." 
                    : "Microphone access was denied or unavailable. Voice input is optional; text chat is fully functional."}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMicPermissionDenied(false)}
                className="text-amber-900 font-bold hover:underline text-[11px]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Floating Bottom Capsule Dock (Option 2 ChatGPT style) */}
          <div className="p-3 sm:p-4 bg-gradient-to-t from-white via-white/95 to-transparent flex-shrink-0 z-10">
            {typeof navigator !== "undefined" && !navigator.onLine && (
              <div className="mb-2.5 p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between max-w-3xl mx-auto">
                <span className="flex items-center gap-1.5 font-medium">
                  <WifiOff className="w-4 h-4 text-amber-600" />
                  AI Tutor requires an internet connection. Use Offline Library for saved notes.
                </span>
                <Link to="/offline" className="font-bold underline text-amber-900 hover:text-amber-950">
                  Open Offline Library
                </Link>
              </div>
            )}

            <div className="max-w-3xl mx-auto w-full">
              {/* Floating Image Preview Thumbnail (ChatGPT style) */}
              {attachedImage && (
                <div className="mb-2.5 p-2 bg-white/95 backdrop-blur-md rounded-2xl border border-indigo-200 shadow-lg flex items-center justify-between gap-3 max-w-sm animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={attachedImage}
                      alt="Problem snapshot preview"
                      className="w-12 h-12 rounded-xl object-cover border border-indigo-100 flex-shrink-0 shadow-2xs"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 truncate">
                        <Camera className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                        <span className="truncate">{attachedImageName || "Problem Snapshot"}</span>
                      </div>
                      <p className="text-[10px] text-indigo-600 font-medium">Ready to solve step-by-step</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachedImage(null);
                      setAttachedImageName("");
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex-shrink-0"
                    title="Remove attached image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Hidden file input for problem images */}
              <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageInputChange}
              />

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="relative flex items-center bg-white border border-slate-200 shadow-md hover:border-slate-300 focus-within:border-indigo-400 focus-within:ring-3 focus-within:ring-indigo-100/60 rounded-3xl sm:rounded-full p-1.5 pl-3 pr-2 transition-all gap-2"
              >
                {/* Grounding documents button (+) */}
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(true)}
                  className="p-2 rounded-2xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1 group relative flex-shrink-0"
                  title="Ground with verified documents & syllabus notes"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline text-[11px] font-semibold text-slate-600 group-hover:text-indigo-600">
                    Notes
                  </span>
                  {selectedDocumentIds.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>

                {/* Import / Snap Image Button (ChatGPT style) */}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className={`p-2 rounded-2xl transition-colors flex items-center gap-1 group relative flex-shrink-0 ${
                    attachedImage
                      ? "bg-indigo-100 text-indigo-700 font-bold"
                      : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                  }`}
                  title="Attach or snap a question/formula photo to solve"
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline text-[11px] font-semibold text-slate-600 group-hover:text-indigo-600">
                    Image
                  </span>
                  {attachedImage && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  )}
                </button>

                <div className="h-5 w-px bg-slate-200 flex-shrink-0 hidden sm:block" />

                {/* Text input with Ctrl+V paste support for screenshots */}
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onPaste={handlePasteImage}
                  placeholder={
                    isListening
                      ? "Listening to your voice..."
                      : attachedImage
                      ? "Ask specific question or press send to solve..."
                      : "Ask AI Tutor or paste/attach an image question..."
                  }
                  disabled={isSending}
                  className="flex-1 px-2.5 py-1.5 text-xs bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none"
                />

                {/* Speech Microphone Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-2xl transition-all flex-shrink-0 ${
                    isListening
                      ? "bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-pulse"
                      : "text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                  }`}
                  title={isListening ? "Listening... Click to stop" : "Speak with microphone"}
                >
                  {isListening ? (
                    <Radio className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>

                {/* Circular Indigo Submit Arrow Button (ChatGPT style) */}
                <button
                  type="submit"
                  disabled={(!inputMessage.trim() && !attachedImage) || isSending}
                  className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-xs flex-shrink-0"
                  title="Send message or solve image"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Sub-caption disclaimer */}
              <p className="text-[10px] text-center text-slate-400 mt-2">
                AI Tutor grounds responses in your verified study notes. Always verify key exam details.
              </p>
            </div>
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
