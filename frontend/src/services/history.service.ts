import api from './api';

export interface ActivityEvent {
  id: string;
  type: 'QUIZ_ATTEMPT' | 'FLASHCARD_REVIEW' | 'FOCUS_SESSION' | 'NOTE_GENERATED' | 'DOCUMENT_UPLOAD';
  title: string;
  description: string;
  subjectName?: string;
  timestamp: string;
  formattedTime: string;
  metadata: Record<string, any>;
}

export interface HistorySummary {
  totalActivities: number;
  totalStudyMinutes: number;
  quizzesCompleted: number;
  flashcardsReviewed: number;
  notesGenerated: number;
  documentsUploaded: number;
  events: ActivityEvent[];
}

export const historyService = {
  getHistory: async (type?: string, search?: string): Promise<HistorySummary> => {
    const params: Record<string, string> = {};
    if (type && type !== 'ALL') params.type = type;
    if (search) params.search = search;

    const response = await api.get<HistorySummary>('/history', { params });
    return response.data;
  },
};
