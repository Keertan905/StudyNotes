import api from './api';

export interface TopicGapItem {
  topicTag: string;
  subjectId: number;
  subjectName: string;
  totalQuestionsAttempted: number;
  correctAnswers: number;
  accuracyPercentage: number;
  masteryLevel: 'WEAK' | 'MODERATE' | 'STRONG';
  decayRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  daysSinceLastPracticed: number;
  lastPracticedAt?: string;
  recommendedAction: string;
}

export interface SubjectGapSummary {
  subjectId: number;
  subjectName: string;
  topicsCount: number;
  averageAccuracy: number;
  weakTopicsCount: number;
  moderateTopicsCount: number;
  strongTopicsCount: number;
  topics: TopicGapItem[];
}

export interface KnowledgeGapResponse {
  totalTopicsAssessed: number;
  criticalWeakAreas: number;
  moderateAreas: number;
  masteredAreas: number;
  overallAccuracy: number;
  decayAlertsCount: number;
  subjects: SubjectGapSummary[];
  highPriorityGaps: TopicGapItem[];
}

export const knowledgeGapService = {
  getKnowledgeGaps: async (): Promise<KnowledgeGapResponse> => {
    const response = await api.get<KnowledgeGapResponse>('/knowledge-gaps');
    return response.data;
  },
};
