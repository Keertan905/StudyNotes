import api from './api';

export interface ExperimentSummary {
  id: string;
  title: string;
  category: 'COMPUTER_SCIENCE' | 'NETWORKING' | 'ELECTRONICS' | 'PHYSICS';
  subject: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  objective: string;
  concepts: string[];
  icon: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  relatedConcept: string;
}

export interface ExperimentDetail {
  id: string;
  title: string;
  category: string;
  subject: string;
  difficulty: string;
  description: string;
  objective: string;
  theoryPoints: string[];
  formulas: string[];
  stepInstructions: string[];
  quizQuestions: QuizQuestion[];
  defaultParameters: Record<string, any>;
}

export interface QuizSubmissionRequest {
  experimentId: string;
  selectedAnswers: Record<string, number>;
}

export interface QuestionResult {
  questionId: string;
  isCorrect: boolean;
  selectedIndex: number;
  correctIndex: number;
  explanation: string;
}

export interface AssessmentResult {
  experimentId: string;
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  passed: boolean;
  xpAwarded: number;
  feedbackMessage: string;
  questionResults: QuestionResult[];
}

export const virtualLabService = {
  async getExperiments(): Promise<ExperimentSummary[]> {
    const res = await api.get<ExperimentSummary[]>('/api/virtual-lab/experiments');
    return res.data;
  },

  async getExperimentById(id: string): Promise<ExperimentDetail> {
    const res = await api.get<ExperimentDetail>(`/api/virtual-lab/experiments/${id}`);
    return res.data;
  },

  async submitAssessment(data: QuizSubmissionRequest): Promise<AssessmentResult> {
    const res = await api.post<AssessmentResult>('/api/virtual-lab/submit-assessment', data);
    return res.data;
  }
};
