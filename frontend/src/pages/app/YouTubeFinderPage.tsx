import { useState, useEffect, useId } from "react";
import { 
  Video, 
  Search, 
  Sparkles, 
  Clock, 
  Eye, 
  ThumbsUp, 
  ExternalLink, 
  Play, 
  GraduationCap, 
  Info, 
  X, 
  AlertCircle, 
  Share2, 
  Bot,
  RotateCcw,
  WifiOff
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { youtubeService } from "../../services/youtube.service";
import type { YouTubeVideoItem, YouTubeSearchParams } from "../../services/youtube.service";
import { subjectService } from "../../services/subject.service";
import type { SubjectItem } from "../../services/subject.service";
import toast from "react-hot-toast";

export default function YouTubeFinderPage() {
  const searchInputId = useId();
  const subjectSelectId = useId();
  const navigate = useNavigate();

  // Search & Filter State
  const [query, setQuery] = useState("Binary Search");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [sortBy] = useState<YouTubeSearchParams["sortBy"]>("BEST_MATCH");
  const [durationFilter, setDurationFilter] = useState<YouTubeSearchParams["durationFilter"]>("ALL");
  const [language, setLanguage] = useState<YouTubeSearchParams["language"]>("ALL");
  const [difficulty, setDifficulty] = useState<YouTubeSearchParams["difficulty"]>("ALL");

  // Data & UI State
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<YouTubeVideoItem[]>([]);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(true);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  // Modal Video Player
  const [activePreviewVideo, setActivePreviewVideo] = useState<YouTubeVideoItem | null>(null);

  useEffect(() => {
    loadSubjects();
    checkStatus();
    executeSearch("Binary Search");
  }, []);

  const loadSubjects = async () => {
    try {
      const data = await subjectService.getSubjects();
      setSubjects(data);
    } catch {
      // Ignore background error
    }
  };

  const checkStatus = async () => {
    try {
      const res = await youtubeService.getStatus();
      setApiKeyConfigured(res.configured);
      if (!res.configured) {
        setShowSetupGuide(true);
      }
    } catch {
      // Ignore
    }
  };

  const executeSearch = async (searchQueryText?: string) => {
    const q = (searchQueryText !== undefined ? searchQueryText : query).trim();
    if (!q) {
      toast.error("Please enter a topic to search.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setHasSearched(true);

      const params: YouTubeSearchParams = {
        query: q,
        subjectName: selectedSubject || undefined,
        sortBy,
        durationFilter,
        language,
        difficulty,
      };

      const res = await youtubeService.search(params);
      setApiKeyConfigured(res.apiKeyConfigured);
      setQuotaExceeded(res.quotaExceeded);

      if (!res.apiKeyConfigured) {
        setErrorMessage(res.errorMessage || "YouTube API key not configured.");
        setShowSetupGuide(true);
        setVideos([]);
      } else if (res.quotaExceeded) {
        setErrorMessage(res.errorMessage || "YouTube API daily quota limit exceeded.");
        setShowSetupGuide(true);
        setVideos([]);
      } else if (res.errorMessage) {
        setErrorMessage(res.errorMessage);
        setVideos([]);
      } else {
        setVideos(res.videos);
        if (res.videos.length === 0) {
          toast("No videos found. Try broader keywords.", { icon: "🔍" });
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to search YouTube videos.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  const handleSubjectChange = (subjectName: string) => {
    setSelectedSubject(subjectName);
    if (subjectName) {
      const fullQuery = `${query ? query.split(" (")[0] : ""} (${subjectName})`;
      setQuery(fullQuery);
      executeSearch(fullQuery);
    }
  };

  const handleCopyLink = (video: YouTubeVideoItem) => {
    navigator.clipboard.writeText(video.videoUrl);
    toast.success("YouTube link copied to clipboard!");
  };

  const handleAskTutor = (video: YouTubeVideoItem) => {
    navigate("/tutor", {
      state: {
        initialPrompt: `I'm studying the topic "${video.title}" from ${video.channelTitle}. Could you explain the core concepts and key derivations covered in this topic?`,
      },
    });
  };

  const getDifficultyBadgeColor = (badge: string) => {
    switch (badge) {
      case "Exam Crash Course":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Advanced / Deep Dive":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Beginner Friendly":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">
            <Video className="w-4 h-4" />
            <span>AI Curriculum Learning Finder</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            YouTube Learning Finder
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Discover, evaluate, and stream curated high-yield video lectures dynamically ranked for your exam syllabus.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSetupGuide(!showSetupGuide)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
              !apiKeyConfigured || quotaExceeded
                ? "bg-amber-50 text-amber-800 border-amber-300 animate-pulse"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Info className="w-4 h-4 text-slate-500" />
            <span>API Settings</span>
            <span className={`w-2 h-2 rounded-full ${apiKeyConfigured && !quotaExceeded ? "bg-emerald-500" : "bg-amber-500"}`} />
          </button>
        </div>
      </div>

      {/* Offline Mode Alert */}
      {typeof navigator !== "undefined" && !navigator.onLine && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>YouTube Video Search & streaming requires an active internet connection. Access downloaded notes and flashcards in your Offline Library.</span>
          </div>
          <Link to="/offline" className="font-bold underline text-amber-950 flex-shrink-0">
            Go to Offline Library
          </Link>
        </div>
      )}

      {/* Setup Guide Banner (Shown when unconfigured or toggled) */}
      {showSetupGuide && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 shadow-xs animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Video className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-amber-900">
                  {!apiKeyConfigured ? "YouTube Data API v3 Key Required" : quotaExceeded ? "YouTube API Quota Limit Notice" : "YouTube API Integration Status"}
                </h3>
                <p className="text-xs text-amber-800 leading-relaxed max-w-3xl">
                  This feature queries real YouTube video statistics (views, likes, durations, and channels) directly via Google's official 
                  <strong> YouTube Data API v3</strong>. To enable live streaming search on your backend:
                </p>

                <div className="mt-3 bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-amber-200 text-xs text-slate-700 space-y-1.5 font-mono">
                  <p className="font-sans font-bold text-slate-900 text-[11px]">Configuration Steps:</p>
                  <p>1. Get a free API key at <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-semibold">Google Cloud Console</a> & enable &quot;YouTube Data API v3&quot;.</p>
                  <p>2. Set environment variable <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-bold">YOUTUBE_API_KEY=AIzaSy...</code> or update <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-bold">app.youtube.api-key</code> in <code className="text-indigo-600">backend/src/main/resources/application.properties</code>.</p>
                  <p>3. Restart the backend service. All video data will stream live without quotas.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSetupGuide(false)}
              className="text-amber-700 hover:text-amber-900 p-1 rounded-lg hover:bg-amber-100/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search & Subject Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <label htmlFor={searchInputId} className="sr-only">Search educational topic</label>
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id={searchInputId}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any syllabus topic, algorithm, theorem, or concept..."
                className="w-full pl-12 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-xs"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Subject Selector */}
            {subjects.length > 0 && (
              <div className="sm:w-56">
                <label htmlFor={subjectSelectId} className="sr-only">Filter by Course Subject</label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    id={subjectSelectId}
                    value={selectedSubject}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    className="w-full pl-10 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">All Subjects</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-sm shadow-xs transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Find Lectures</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results Header */}
      {hasSearched && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <p>
            Showing <strong className="text-slate-800">{videos.length}</strong> educational video recommendations for &ldquo;<span className="text-slate-900 font-semibold">{query}</span>&rdquo;
          </p>
          <span className="flex items-center gap-1 text-slate-400">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Sorted by {sortBy === "BEST_MATCH" ? "Curriculum Relevance & Engagement" : sortBy}
          </span>
        </div>
      )}

      {/* Videos Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs animate-pulse">
              <div className="w-full h-48 bg-slate-200" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                <div className="h-8 bg-slate-100 rounded-xl w-full" />
                <div className="flex justify-between pt-2">
                  <div className="h-4 bg-slate-200 rounded-md w-24" />
                  <div className="h-8 bg-slate-200 rounded-xl w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : errorMessage ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Unable to Fetch YouTube Results</h3>
          <p className="text-xs text-slate-500 leading-relaxed">{errorMessage}</p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => setShowSetupGuide(true)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
            >
              API Key Setup Guide
            </button>
            <button
              onClick={() => executeSearch()}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-xs"
            >
              Retry Search
            </button>
          </div>
        </div>
      ) : videos.length === 0 && hasSearched ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Videos Found</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            We couldn&apos;t find video matches for &ldquo;{query}&rdquo;. Try adjusting your filters or typing broader academic keywords.
          </p>
          <button
            onClick={() => {
              setDurationFilter("ALL");
              setDifficulty("ALL");
              setLanguage("ALL");
              executeSearch("Algorithms");
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors mt-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters & Search Algorithms
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg hover:border-slate-300 transition-all flex flex-col group"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Duration Badge */}
                <span className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                  <Clock className="w-3 h-3 text-slate-300" />
                  {video.duration}
                </span>

                {/* Difficulty / Style Badge */}
                <span className={`absolute top-2.5 left-2.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs ${getDifficultyBadgeColor(video.difficultyBadge)}`}>
                  {video.difficultyBadge}
                </span>

                {/* Play Overlay Button */}
                <button
                  type="button"
                  onClick={() => setActivePreviewVideo(video)}
                  className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-rose-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                  title="Quick Video Preview"
                >
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </button>
              </div>

              {/* Video Info Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3
                    className="font-bold text-slate-900 text-sm sm:text-base line-clamp-2 leading-snug group-hover:text-rose-600 transition-colors"
                    title={video.title}
                  >
                    {video.title}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-700 truncate max-w-[180px]">
                      {video.channelTitle}
                    </span>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
                      {video.formattedPublishedDate}
                    </span>
                  </div>

                  {/* Views & Likes Stats Row */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      {video.formattedViews}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium">
                      <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                      {video.formattedLikes}
                    </span>
                  </div>
                </div>

                {/* AI Recommendation Reason Banner */}
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 text-xs text-amber-900 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed line-clamp-2 text-[11px] font-medium">
                    {video.recommendationReason}
                  </p>
                </div>

                {/* Actions Row */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(video)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Copy YouTube Link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAskTutor(video)}
                      className="p-2 rounded-xl text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Ask AI Tutor about this lecture"
                    >
                      <Bot className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActivePreviewVideo(video)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <Play className="w-3 h-3" />
                      Preview
                    </button>
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition-colors"
                    >
                      <span>Watch</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Embedded Video Preview Modal */}
      {activePreviewVideo && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-950 rounded-3xl overflow-hidden max-w-4xl w-full border border-slate-800 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900">
              <div className="flex items-center gap-2 min-w-0 pr-4">
                <Video className="w-5 h-5 text-rose-500 flex-shrink-0" />
                <h4 className="text-sm font-bold text-white truncate">
                  {activePreviewVideo.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActivePreviewVideo(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embedded Iframe */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${activePreviewVideo.id}?autoplay=1&rel=0`}
                title={activePreviewVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            {/* Modal Footer with Actions */}
            <div className="px-5 py-4 bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span>Channel: <strong className="text-white font-medium">{activePreviewVideo.channelTitle}</strong></span>
                <span>Views: <strong className="text-white font-medium">{activePreviewVideo.formattedViews}</strong></span>
                <span>Duration: <strong className="text-white font-medium">{activePreviewVideo.duration}</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleAskTutor(activePreviewVideo);
                    setActivePreviewVideo(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
                >
                  <Bot className="w-3.5 h-3.5" />
                  Ask AI Tutor About This
                </button>
                <a
                  href={activePreviewVideo.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 font-semibold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in YouTube
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
