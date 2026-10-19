
import api from './api';

export interface ExamTarget {
  id: number;
  subjectId?: number;
  subjectName?: string;
  subjectCode?: string;
  title: string;
  examDate: string;
  targetScore: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  location?: string;
  notes?: string;
  color: string;
  daysRemaining: number;
  hoursRemaining: number;
  progressPercent: number;
  createdAt: string;
}

export interface StudyPlanItem {
  id: number;
  examTargetId?: number;
  examTargetTitle?: string;
  subjectId?: number;
  subjectName?: string;
  topicId?: number;
  topicTitle?: string;
  planDate: string;
  timeSlot?: string;
  title: string;
  activityType: 'FLASHCARD_REVIEW' | 'PRACTICE_QUIZ' | 'CONCEPT_STUDY' | 'MISTAKE_CORRECTION' | 'MOCK_EXAM';
  estimatedMinutes: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  completed: boolean;
  actionRoute?: string;
  aiReasoning?: string;
  createdAt: string;
}

export interface DailyPlanResponse {
  date: string;
  totalItems: number;
  completedItems: number;
  totalEstimatedMinutes: number;
  completedMinutes: number;
  completionPercentage: number;
  items: StudyPlanItem[];
}

export interface CreateExamRequest {
  subjectId?: number;
  title: string;
  examDate: string;
  targetScore?: number;
  priority?: string;
  location?: string;
  notes?: string;
  color?: string;
}

export interface CreatePlanItemRequest {
  examTargetId?: number;
  subjectId?: number;
  topicId?: number;
  planDate?: string;
  timeSlot?: string;
  title: string;
  activityType?: string;
  estimatedMinutes?: number;
  priority?: string;
  actionRoute?: string;
  aiReasoning?: string;
}

export interface GeneratePlanRequest {
  startDate?: string;
  daysCount?: number;
  dailyAvailableHours?: number;
  examTargetIds?: number[];
  prioritizeWeakTopics?: boolean;
  includeMistakes?: boolean;
  includeFlashcards?: boolean;
  addRestIntervals?: boolean;
}

export const plannerService = {
  getExams: async (): Promise<ExamTarget[]> => {
    const response = await api.get<ExamTarget[]>('/planner/exams');
    return response.data;
  },

  createExam: async (data: CreateExamRequest): Promise<ExamTarget> => {
    const response = await api.post<ExamTarget>('/planner/exams', data);
    return response.data;
  },

  updateExam: async (id: number, data: CreateExamRequest): Promise<ExamTarget> => {
    const response = await api.put<ExamTarget>(`/planner/exams/${id}`, data);
    return response.data;
  },

  deleteExam: async (id: number): Promise<void> => {
    await api.delete(`/planner/exams/${id}`);
  },

  toggleExamStatus: async (id: number): Promise<ExamTarget> => {
    const response = await api.patch<ExamTarget>(`/planner/exams/${id}/toggle`);
    return response.data;
  },

  getDailyPlan: async (date?: string): Promise<DailyPlanResponse> => {
    const params = date ? { date } : {};
    const response = await api.get<DailyPlanResponse>('/planner/daily', { params });
    return response.data;
  },

  getWeeklyPlan: async (startDate?: string, endDate?: string): Promise<StudyPlanItem[]> => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get<StudyPlanItem[]>('/planner/weekly', { params });
    return response.data;
  },

  createPlanItem: async (data: CreatePlanItemRequest): Promise<StudyPlanItem> => {
    const response = await api.post<StudyPlanItem>('/planner/items', data);
    return response.data;
  },

  updatePlanItem: async (id: number, data: CreatePlanItemRequest): Promise<StudyPlanItem> => {
    const response = await api.put<StudyPlanItem>(`/planner/items/${id}`, data);
    return response.data;
  },

  togglePlanItemCompleted: async (id: number): Promise<StudyPlanItem> => {
    const response = await api.patch<StudyPlanItem>(`/planner/items/${id}/toggle`);
    return response.data;
  },

  deletePlanItem: async (id: number): Promise<void> => {
    await api.delete(`/planner/items/${id}`);
  },

  generateAutoPlan: async (data: GeneratePlanRequest): Promise<DailyPlanResponse> => {
    const response = await api.post<DailyPlanResponse>('/planner/generate', data);
    return response.data;
  },
};
