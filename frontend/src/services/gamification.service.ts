import api from "./api";

export interface GamificationProfile {
  totalXp: number;
  currentLevel: number;
  levelTitle: string;
  currentLevelBaseXp: number;
  nextLevelTargetXp: number;
  progressToNextLevelPct: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  leaderboardOptIn: boolean;
  achievementsCount: number;
  recentAchievements: AchievementItem[];
}

export interface AchievementItem {
  id?: number;
  badgeKey: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  unlockedAt: string | null;
  isUnlocked: boolean;
}

export interface ActivityDayItem {
  date: string;
  activityCount: number;
  totalXp: number;
  intensity: number; // 0 to 4
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  name: string;
  college?: string;
  branch?: string;
  totalXp: number;
  currentLevel: number;
  levelTitle: string;
  currentStreak: number;
  isCurrentUser: boolean;
}

export interface XpHistoryItem {
  id: number;
  activityType: string;
  xpAmount: number;
  description: string;
  activityDate: string;
  createdAt: string;
}

export const gamificationService = {
  async getProfile(): Promise<GamificationProfile> {
    const res = await api.get("/gamification/profile");
    return res.data;
  },

  async getAllAchievements(): Promise<AchievementItem[]> {
    const res = await api.get("/gamification/achievements");
    return res.data;
  },

  async getActivityHeatmap(days: number = 60): Promise<ActivityDayItem[]> {
    const res = await api.get(`/gamification/activity-heatmap?days=${days}`);
    return res.data;
  },

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const res = await api.get("/gamification/leaderboard");
    return res.data;
  },

  async getXpHistory(): Promise<XpHistoryItem[]> {
    const res = await api.get("/gamification/history");
    return res.data;
  },

  async updatePrivacy(optIn: boolean): Promise<GamificationProfile> {
    const res = await api.put("/gamification/privacy", { leaderboardOptIn: optIn });
    return res.data;
  },
};
