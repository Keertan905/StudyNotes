import api from './api';

export interface SubjectReadiness {
  subjectId: number;
  subjectName: string;
  subjectCode?: string;
  readinessScore: number;
  status: 'EXEMPLARY' | 'READY' | 'DEVELOPING' | 'CRITICAL';
  totalTopics: number;
  completedTopics: number;
  syllabusCoveragePercent: number;
  quizAccuracyPercent: number;
  totalFlashcards: number;
  masteredFlashcards: number;
  unresolvedMistakes: number;
  daysToExam?: number;
}

export interface ReadinessScore {
  overallReadiness: number;
  readinessStatus: 'EXEMPLARY' | 'READY' | 'DEVELOPING' | 'CRITICAL';
  statusDescription: string;
  syllabusCoverageScore: number;
  quizAccuracyScore: number;
  flashcardMasteryScore: number;
  mistakeResolutionScore: number;
  consistencyScore: number;
  nearestExamId?: number;
  nearestExamTitle?: string;
  nearestExamDate?: string;
  daysToNearestExam?: number;
  targetScore: number;
  subjectBreakdowns: SubjectReadiness[];
  keyRecommendations: string[];
}

export interface DailyStudyPoint {
  date: string;
  dayOfWeek: string;
  studyMinutes: number;
  sessionsCount: number;
}

export interface QuizPerformancePoint {
  attemptId: number;
  quizTitle: string;
  score: number;
  percentage: number;
  passed: boolean;
  completedDate: string;
}

export interface AnalyticsOverview {
  readiness: ReadinessScore;
  totalStudyMinutes: number;
  todayStudyMinutes: number;
  thisWeekStudyMinutes: number;
  currentStreakDays: number;
  completedTasksCount: number;
  totalTasksCount: number;
  studyTimeHistory: DailyStudyPoint[];
  totalQuizzesTaken: number;
  overallAverageScore: number;
  recentQuizPerformances: QuizPerformancePoint[];
  totalFlashcards: number;
  cardsMastered: number;
  cardsOverdue: number;
  ratingDistribution: Record<string, number>;
  totalMistakesLogged: number;
  mistakesMastered: number;
  unresolvedMistakes: number;
  mistakeResolutionRate: number;
  mistakesByCategory: Record<string, number>;
}

export const analyticsService = {
  getReadiness: async (): Promise<ReadinessScore> => {
    const response = await api.get<ReadinessScore>('/analytics/readiness');
    return response.data;
  },

  getOverview: async (): Promise<AnalyticsOverview> => {
    const response = await api.get<AnalyticsOverview>('/analytics/overview');
    return response.data;
  },
};
