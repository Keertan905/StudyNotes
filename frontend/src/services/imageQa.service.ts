import api from './api';

export interface SolutionStep {
  stepNumber: number;
  title: string;
  formula?: string;
  explanation: string;
  intermediateResult?: string;
}

export interface PracticeQuestion {
  question: string;
  answerHint: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface ImageQaResponse {
  title: string;
  subject: string;
  extractedProblemText: string;
  givenValues: string[];
  solutionSteps: SolutionStep[];
  finalAnswer: string;
  keyFormulas: string[];
  commonPitfalls: string[];
  relatedPracticeQuestions: PracticeQuestion[];
}

export interface SolveImageRequest {
  imageBase64: string;
  imageName?: string;
  questionPrompt?: string;
  subjectName?: string;
  detailLevel?: 'step_by_step' | 'concise' | 'exam_ready';
}

export const imageQaService = {
  async solve(data: SolveImageRequest): Promise<ImageQaResponse> {
    const res = await api.post<ImageQaResponse>('/api/image-qa/solve', data);
    return res.data;
  }
};
