import api from './api';

export type MistakeCategory = 'CONCEPTUAL_GAP' | 'MISREAD_QUESTION' | 'CALCULATION_ERROR' | 'MEMORY_LAPSE';
export type MistakeStatus = 'UNRESOLVED' | 'REVIEWED' | 'RESOLVED';

export interface MistakeRecord {
  id: number;
  questionId: number;
  questionText: string;
  questionType: string;
  options: string[];
  correctAnswer: string;
  submittedAnswer: string;
  explanation?: string;
  topicTag?: string;
  subjectId?: number;
  subjectName?: string;
  mistakeCategory: MistakeCategory;
  aiRootCause?: string;
  aiRevisionTip?: string;
  status: MistakeStatus;
  retryCount: number;
  lastAttemptedAt?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface MistakeStats {
  totalMistakes: number;
  unresolvedCount: number;
  resolvedCount: number;
  resolutionRatePercentage: number;
  categoryBreakdown: Record<string, number>;
}

export interface RetryMistakeResponse {
  isCorrect: boolean;
  feedback: string;
  status: MistakeStatus;
  retryCount: number;
  resolvedAt?: string;
}

export const mistakeService = {
  getMistakes: async (status?: string, subjectId?: number): Promise<MistakeRecord[]> => {
    const params: Record<string, any> = {};
    if (status && status !== 'ALL') params.status = status;
    if (subjectId) params.subjectId = subjectId;
    const response = await api.get<MistakeRecord[]>('/mistakes', { params });
    return response.data;
  },

  getStats: async (): Promise<MistakeStats> => {
    const response = await api.get<MistakeStats>('/mistakes/stats');
    return response.data;
  },

  retryMistake: async (id: number, submittedAnswer: string): Promise<RetryMistakeResponse> => {
    const response = await api.post<RetryMistakeResponse>(`/mistakes/${id}/retry`, { submittedAnswer });
    return response.data;
  },

  updateStatus: async (id: number, status: MistakeStatus): Promise<MistakeRecord> => {
    const response = await api.patch<MistakeRecord>(`/mistakes/${id}/status`, { status });
    return response.data;
  },

  deleteMistake: async (id: number): Promise<void> => {
    await api.delete(`/mistakes/${id}`);
  },
};
