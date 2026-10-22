import api from './api';

export interface RagCitation {
  documentId: number;
  documentTitle: string;
  chunkId: number;
  chunkIndex: number;
  pageNumber?: number;
  sectionHeading?: string;
  excerpt: string;
  relevanceScore: number;
}

export interface SolutionStep {
  stepNumber: number;
  title: string;
  formulaOrCode?: string;
  explanation: string;
  whyExplanation: string;
  keyTip?: string;
}

export interface SolveProblemRequest {
  problemText: string;
  subject?: string;
  targetLanguage?: string;
  groundWithDocs?: boolean;
  subjectId?: number;
  difficulty?: string;
}

export interface SolveProblemResponse {
  problemSummary: string;
  classifiedCategory: string;
  difficulty: string;
  prerequisiteConcepts: string[];
  steps: SolutionStep[];
  intuitiveExplanation: string;
  commonMistakes: string[];
  finalAnswer: string;
  verificationCheck?: string;
  isGrounded: boolean;
  groundingConfidence: number;
  citations: RagCitation[];
  suggestedFollowUps: string[];
}

export interface FollowUpRequest {
  originalProblem: string;
  followUpQuestion: string;
  stepIndex?: number;
  previousFinalAnswer?: string;
  subject?: string;
}

export interface FollowUpResponse {
  answer: string;
  relatedStepSummary?: string;
  furtherQuestions: string[];
}

export const problemSolverService = {
  async solve(data: SolveProblemRequest): Promise<SolveProblemResponse> {
    const res = await api.post<SolveProblemResponse>('/api/problem-solver/solve', data);
    return res.data;
  },

  async askFollowUp(data: FollowUpRequest): Promise<FollowUpResponse> {
    const res = await api.post<FollowUpResponse>('/api/problem-solver/follow-up', data);
    return res.data;
  }
};
