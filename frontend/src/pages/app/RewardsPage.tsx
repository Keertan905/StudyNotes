import { useState, useEffect } from "react";
import {
  Zap,
  Award,
  Flame,
  Clock,
  Sparkles,
  HelpCircle,
  WifiOff,
  BookOpen,
  Target,
  Trophy,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Calendar,
} from "lucide-react";
import { gamificationService } from "../../services/gamification.service";
import type {
  GamificationProfile,
  AchievementItem,
  ActivityDayItem,
  LeaderboardEntry,
  XpHistoryItem,
} from "../../services/gamification.service";
import toast from "react-hot-toast";

export default function RewardsPage() {
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [heatmap, setHeatmap] = useState<ActivityDayItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [history, setHistory] = useState<XpHistoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);

  useEffect(() => {
    loadGamificationData();
  }, []);

  const loadGamificationData = async () => {
    setIsLoading(true);
    try {
      const [profData, achData, heatData, leadData, histData] = await Promise.all([
        gamificationService.getProfile().catch(() => null),
        gamificationService.getAllAchievements().catch(() => []),
        gamificationService.getActivityHeatmap(60).catch(() => []),
        gamificationService.getLeaderboard().catch(() => []),
        gamificationService.getXpHistory().catch(() => []),
      ]);
      setProfile(profData);
      setAchievements(achData);
      setHeatmap(heatData);
      setLeaderboard(leadData);
      setHistory(histData);
    } catch (e) {
      console.error("Failed to load gamification data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePrivacy = async () => {
    if (!profile) return;
    setUpdatingPrivacy(true);
    try {
      const updated = await gamificationService.updatePrivacy(!profile.leaderboardOptIn);
      setProfile(updated);
      toast.success(
        updated.leaderboardOptIn
          ? "You are now visible on the Campus Leaderboard! 🏆"
          : "Your name is now private and hidden from the public leaderboard. 🛡️"
      );
      // Reload leaderboard to reflect
      const refreshedLeaderboard = await gamificationService.getLeaderboard().catch(() => []);
      setLeaderboard(refreshedLeaderboard);
    } catch {
      toast.error("Failed to update privacy preference");
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case "Flame":
        return <Flame className="w-5 h-5" />;
      case "Clock":
        return <Clock className="w-5 h-5" />;
      case "Sparkles":
        return <Sparkles className="w-5 h-5" />;
      case "HelpCircle":
        return <HelpCircle className="w-5 h-5" />;
      case "Award":
        return <Award className="w-5 h-5" />;
      case "Zap":
        return <Zap className="w-5 h-5" />;
      case "WifiOff":
        return <WifiOff className="w-5 h-5" />;
      case "BookOpen":
        return <BookOpen className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const filteredAchievements = achievements.filter((a) => {
    if (selectedCategory === "ALL") return true;
    return a.category.toUpperCase() === selectedCategory;
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-pulse">
        <div className="h-56 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="h-44 bg-slate-200 rounded-3xl" />
          <div className="h-44 bg-slate-200 rounded-3xl" />
          <div className="h-44 bg-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Hero Progression Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-900 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-sm">
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>Academic Gamification & Learning Rewards</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/40 backdrop-blur-sm flex items-center justify-center text-amber-200 text-2xl font-black shadow-inner">
                  {profile?.currentLevel || 1}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                    Level {profile?.currentLevel || 1} • {profile?.levelTitle || "Novice Scholar"}
                  </h1>
                  <p className="text-amber-100 text-xs sm:text-sm mt-0.5">
                    Earn XP through verified study sessions, quizzes, flashcards, and offline milestones.
                  </p>
                </div>
              </div>
            </div>

            {/* Streak & XP Badges */}
            <div className="flex items-center gap-3">
              <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-200 block">Total XP</span>
                <span className="text-xl font-black text-white">{profile?.totalXp || 0} XP</span>
              </div>
              <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-200 flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3 text-amber-300 fill-amber-300" />
                  Streak
                </span>
                <span className="text-xl font-black text-amber-300">{profile?.currentStreak || 0} Days</span>
              </div>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-100">
              <span>
                Current: <strong>{profile?.totalXp} XP</strong>
              </span>
              <span>
                Next Level: <strong>{profile?.nextLevelTargetXp} XP</strong> (
                {(profile?.nextLevelTargetXp || 0) - (profile?.totalXp || 0)} XP needed)
              </span>
            </div>
            <div className="w-full h-3.5 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/20">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${Math.max(4, profile?.progressToNextLevelPct || 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Ambient glow decoration */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* SECTION 1: DAILY ACTIVITY CALENDAR (HEATMAP) */}
      <section className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              60-Day Study Consistency Calendar
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              Daily Activity Heatmap & Streaks
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Less</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-slate-100 border border-slate-200" title="0 activities" />
              <span className="w-3 h-3 rounded-xs bg-emerald-200" title="1 activity" />
              <span className="w-3 h-3 rounded-xs bg-emerald-400" title="2-3 activities" />
              <span className="w-3 h-3 rounded-xs bg-emerald-600" title="4-5 activities" />
              <span className="w-3 h-3 rounded-xs bg-emerald-800" title="6+ activities" />
            </div>
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="flex flex-wrap gap-1.5 min-w-[500px]">
            {heatmap.map((day) => {
              let bg = "bg-slate-100 hover:bg-slate-200";
              if (day.intensity === 1) bg = "bg-emerald-200 hover:bg-emerald-300";
              else if (day.intensity === 2) bg = "bg-emerald-400 hover:bg-emerald-500";
              else if (day.intensity === 3) bg = "bg-emerald-600 hover:bg-emerald-700";
              else if (day.intensity === 4) bg = "bg-emerald-800 hover:bg-emerald-900";

              return (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.activityCount} activities (+${day.totalXp} XP)`}
                  className={`w-4 h-4 rounded-xs ${bg} transition-all cursor-pointer`}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 2: ACHIEVEMENTS & BADGES SHOWCASE */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              Trophy Room
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              Earned Badges & Milestones ({unlockedCount} / {achievements.length} Unlocked)
            </h2>
          </div>

          {/* Category filter pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl overflow-x-auto text-xs font-bold">
            {["ALL", "FOCUS", "QUIZ", "FLASHCARD", "STREAK", "OFFLINE"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedCategory === cat
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAchievements.map((badge) => {
            const isUnlocked = badge.isUnlocked;
            return (
              <div
                key={badge.badgeKey}
                className={`p-5 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                  isUnlocked
                    ? "bg-gradient-to-b from-amber-50/50 to-white border-amber-300 shadow-xs hover:shadow-md"
                    : "bg-slate-50/80 border-slate-200 opacity-70"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs ${
                        isUnlocked
                          ? "bg-gradient-to-tr from-amber-500 to-orange-500 text-white"
                          : "bg-slate-300 text-slate-600"
                      }`}
                    >
                      {getBadgeIcon(badge.icon)}
                    </div>
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                        isUnlocked
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      +{badge.xpReward} XP
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
                    {badge.title}
                    {isUnlocked ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{badge.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] font-medium text-slate-400 flex items-center justify-between">
                  <span>Category: {badge.category}</span>
                  <span>
                    {isUnlocked && badge.unlockedAt
                      ? `Unlocked ${new Date(badge.unlockedAt).toLocaleDateString()}`
                      : "Locked"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: CAMPUS LEADERBOARD (WITH PRIVACY TOGGLE) */}
      <section className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
              <Trophy className="w-4 h-4" />
              Campus Rankings
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              Student Leaderboard (Top 50 Scholars)
            </h2>
          </div>

          {/* Privacy Toggle Button */}
          <button
            onClick={handleTogglePrivacy}
            disabled={updatingPrivacy}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all shadow-xs ${
              profile?.leaderboardOptIn
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
            }`}
          >
            {profile?.leaderboardOptIn ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>
              {profile?.leaderboardOptIn ? "Public on Leaderboard (Click to Hide)" : "Private / Hidden (Click to Show)"}
            </span>
          </button>
        </div>

        {/* Leaderboard Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3 px-3">Rank</th>
                <th className="py-3 px-3">Scholar</th>
                <th className="py-3 px-3">Academic Program</th>
                <th className="py-3 px-3">Level</th>
                <th className="py-3 px-3 text-right">Streak</th>
                <th className="py-3 px-3 text-right">Total XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaderboard.map((entry) => {
                const isTop1 = entry.rank === 1;
                const isTop2 = entry.rank === 2;
                const isTop3 = entry.rank === 3;

                return (
                  <tr
                    key={entry.userId}
                    className={`transition-colors ${
                      entry.isCurrentUser
                        ? "bg-indigo-50/80 font-semibold text-indigo-950"
                        : "hover:bg-slate-50/80 text-slate-800"
                    }`}
                  >
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        {isTop1 && <span className="text-lg">🥇</span>}
                        {isTop2 && <span className="text-lg">🥈</span>}
                        {isTop3 && <span className="text-lg">🥉</span>}
                        <span className="font-extrabold text-slate-700">#{entry.rank}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {entry.name ? entry.name.charAt(0).toUpperCase() : "S"}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">
                            {entry.name || "Student"}
                            {entry.isCurrentUser && (
                              <span className="ml-2 text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                                You
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 text-xs">
                      {entry.college ? `${entry.college} • ${entry.branch || "General"}` : "StudyApp Academy"}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-slate-800">
                        Lvl {entry.currentLevel} ({entry.levelTitle})
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                        <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {entry.currentStreak}d
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span className="font-black text-indigo-700 text-sm">{entry.totalXp} XP</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 4: XP TRANSACTION AUDIT HISTORY */}
      <section className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Activity Log</span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">Recent XP Reward Transactions</h3>
          </div>
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No recent reward transactions yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">{tx.description}</p>
                  <p className="text-[10px] text-slate-400">
                    {tx.activityType} • {new Date(tx.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  +{tx.xpAmount} XP
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
