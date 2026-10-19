import api from './api';

export interface QuestionItem {
  id?: number;
  questionType: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'LONG_ANSWER';
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  marks?: number;
  topicTag?: string;
}

export interface Quiz {
  id: number;
  subjectId?: number;
  subjectName?: string;
  unitId?: number;
  unitTitle?: string;
  topicId?: number;
  topicName?: string;
  title: string;
  description?: string;
  quizType: 'PRACTICE' | 'MOCK_EXAM' | 'DIAGNOSTIC';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimitMinutes?: number;
  passingPercentage: number;
  totalMarks: number;
  questionCount: number;
  questions?: QuestionItem[];
  createdAt: string;
}

export interface GenerateQuizRequest {
  subjectId?: number;
  subjectName: string;
  unitId?: number;
  topicId?: number;
  topic: string;
  quizType?: string;
  difficulty?: string;
  questionCount?: number;
  questionTypes?: string[];
  timeLimitMinutes?: number;
  additionalContext?: string;
}

export interface SaveQuizRequest {
  subjectId?: number;
  unitId?: number;
  topicId?: number;
  title: string;
  description?: string;
  quizType: string;
  difficulty: string;
  timeLimitMinutes?: number;
  passingPercentage?: number;
  questions: QuestionItem[];
}

export interface ExamQuestion {
  id: number;
  questionType: string;
  questionText: string;
  options: string[];
  marks: number;
  topicTag: string;
}

export interface StartAttemptResponse {
  attemptId: number;
  quizId: number;
  quizTitle: string;
  subjectName: string;
  timeLimitMinutes?: number;
  totalQuestions: number;
  totalMarks: number;
  startTime: string;
  questions: ExamQuestion[];
}

export interface SubmitAttemptRequest {
  timeSpentSeconds: number;
  answers: Record<number, string>; // questionId -> studentAnswer
}

export interface GradedQuestionItem {
  questionId: number;
  questionType: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  submittedAnswer?: string;
  isCorrect: boolean;
  marksAwarded: number;
  maxMarks: number;
  explanation: string;
  evaluationFeedback?: string;
  topicTag: string;
}

export interface TopicScore {
  score: number;
  total: number;
  percentage: number;
  status: 'MASTERED' | 'NEEDS_REVIEW' | 'WEAK';
}

export interface AttemptDetailResponse {
  attemptId: number;
  quizId: number;
  quizTitle: string;
  subjectName: string;
  scoreObtained: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  timeSpentSeconds: number;
  status: string;
  feedback: string;
  topicPerformance: Record<string, TopicScore>;
  questions: GradedQuestionItem[];
  createdAt: string;
}

export interface AttemptSummaryResponse {
  attemptId: number;
  quizId: number;
  quizTitle: string;
  subjectName: string;
  scoreObtained: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  timeSpentSeconds: number;
  status: string;
  createdAt: string;
}

export interface QuizStats {
  totalQuizzes: number;
  totalAttempts: number;
  averagePercentage: number;
  passedAttempts: number;
}

export const quizService = {
  getQuizzes: async (subjectId?: number): Promise<Quiz[]> => {
    const params = subjectId ? { subjectId } : {};
    const res = await api.get<Quiz[]>('/quizzes', { params });
    return res.data;
  },

  getQuizById: async (id: number): Promise<Quiz> => {
    const res = await api.get<Quiz>(`/quizzes/${id}`);
    return res.data;
  },

  generateQuestions: async (data: GenerateQuizRequest): Promise<QuestionItem[]> => {
    const res = await api.post<QuestionItem[]>('/quizzes/generate', data);
    return res.data;
  },

  createQuiz: async (data: SaveQuizRequest): Promise<Quiz> => {
    const res = await api.post<Quiz>('/quizzes', data);
    return res.data;
  },

  deleteQuiz: async (id: number): Promise<void> => {
    await api.delete(`/quizzes/${id}`);
  },

  startAttempt: async (quizId: number): Promise<StartAttemptResponse> => {
    const res = await api.post<StartAttemptResponse>(`/quizzes/${quizId}/start`);
    return res.data;
  },

  submitAttempt: async (attemptId: number, data: SubmitAttemptRequest): Promise<AttemptDetailResponse> => {
    const res = await api.post<AttemptDetailResponse>(`/quizzes/attempts/${attemptId}/submit`, data);
    return res.data;
  },

  getAttemptDetails: async (attemptId: number): Promise<AttemptDetailResponse> => {
    const res = await api.get<AttemptDetailResponse>(`/quizzes/attempts/${attemptId}`);
    return res.data;
  },

  getQuizHistory: async (): Promise<AttemptSummaryResponse[]> => {
    const res = await api.get<AttemptSummaryResponse[]>('/quizzes/history');
    return res.data;
  },

  getQuizStats: async (): Promise<QuizStats> => {
    const res = await api.get<QuizStats>('/quizzes/stats');
    return res.data;
  },
};
