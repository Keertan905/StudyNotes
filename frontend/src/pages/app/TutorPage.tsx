import { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  Send, 
  Plus, 
  Trash2, 
  Loader2, 
  User as UserIcon, 
  Lightbulb, 
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { tutorService, type ConversationItem, type MessageItem } from "../../services/tutor.service";
import { subjectService, type SubjectItem } from "../../services/subject.service";
import toast from "react-hot-toast";

export default function TutorPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

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

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, isSending]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [convs, subs] = await Promise.all([
        tutorService.getConversations(),
        subjectService.getSubjects(),
      ]);
      setConversations(convs);
      setSubjects(subs);
      if (convs.length > 0) {
        loadConversationDetails(convs[0].id);
      }
    } catch {
      toast.error("Failed to load tutor data");
    } finally {
      setIsLoading(false);
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
      const title = "New Discussion " + (conversations.length + 1);
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
      });

      // Update with server responses
      setActiveConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages.filter(m => m.id !== optimisticUserMsg.id), res.userMessage, res.assistantMessage]
      } : null);

      if (res.suggestedFollowUps && res.suggestedFollowUps.length > 0) {
        setSuggestedFollowUps(res.suggestedFollowUps);
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

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8.5rem)] flex flex-col">
      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bot className="w-6 h-6 text-indigo-600" />
            <span>AI Academic Tutor</span>
          </h1>
          <p className="text-xs text-slate-500">
            Interactive, syllabus-grounded tutoring with step-by-step reasoning and model questions
          </p>
        </div>

        {/* Selectors & Actions */}
        <div className="flex flex-wrap items-center gap-2">
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
        <div className="flex items-center justify-center p-2 text-xs text-slate-400 gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
          <span>Syncing tutor history...</span>
        </div>
      )}

      {/* Main Chat Shell (Sidebar + Message Area) */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex min-h-0">
        {/* Left Sidebar: Threads List (hidden on small mobile) */}
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
                      : "border-transparent hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2 flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-slate-400 group-hover:text-indigo-600" />
                    <span className="truncate">{c.title}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteConversation(c.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Right Area: Messages + Input */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {!activeConversation || activeConversation.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 my-auto">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                  <Bot className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">What would you like to understand today?</h3>
                <p className="text-xs max-w-md text-slate-500 mt-1 mb-6">
                  Ask conceptual doubts, algorithm mechanics, derivation steps, or request exam question templates.
                </p>

                {/* Suggested Starters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full text-left">
                  {[
                    "Explain the difference between process and thread",
                    "How does two-phase locking prevent concurrency anomalies?",
                    "Walk me through Dijkstra's Shortest Path algorithm",
                    "What are the ACID properties in database systems?"
                  ].map((starter) => (
                    <button
                      key={starter}
                      onClick={() => handleSendMessage(starter)}
                      className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-xs text-slate-700 transition-all flex items-center justify-between"
                    >
                      <span className="truncate mr-2">{starter}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              activeConversation.messages.map((m) => {
                const isUser = m.role === "USER";
                return (
                  <div
                    key={m.id}
                    className={`flex gap-3 max-w-3xl ${isUser ? "ml-auto justify-end" : "mr-auto"}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? "bg-indigo-600 text-white rounded-br-none shadow-xs"
                          : "bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none prose prose-indigo max-w-none"
                      }`}
                    >
                      {m.content}
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {isSending && (
              <div className="flex gap-3 max-w-2xl mr-auto">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Formulating step-by-step academic response...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Follow-ups Chips */}
          {suggestedFollowUps.length > 0 && !isSending && (
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-amber-500" />
                <span>Next:</span>
              </span>
              {suggestedFollowUps.slice(0, 3).map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s)}
                  className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 text-[11px] text-slate-600 transition-colors shadow-2xs"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input Box Bar */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask your tutor any question (e.g. 'Derive time complexity of QuickSort')..."
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="submit"
                disabled={isSending || !inputMessage.trim()}
                className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white shadow-xs transition-colors"
                title="Send Question"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
