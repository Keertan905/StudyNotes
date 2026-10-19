import api from './api';

export type RecommendationType = 'QUIZ_PRACTICE' | 'FLASHCARD_REVIEW' | 'MISTAKE_RETRY' | 'ASK_TUTOR' | 'READ_NOTES';
export type PriorityLevel = 'CRITICAL' | 'RECOMMENDED' | 'OPTIONAL';

export interface RecommendationItem {
  id: string;
  type: RecommendationType;
  priority: PriorityLevel;
  title: string;
  description: string;
  reason: string;
  subjectId?: number;
  subjectName?: string;
  topicTag?: string;
  actionUrl: string;
  buttonText: string;
}

export interface RecommendationResponse {
  studentHeadline: string;
  aiAdvisory: string;
  items: RecommendationItem[];
}

export const recommendationService = {
  getAdaptiveRecommendations: async (): Promise<RecommendationResponse> => {
    const response = await api.get<RecommendationResponse>('/recommendations');
    return response.data;
  },
};
