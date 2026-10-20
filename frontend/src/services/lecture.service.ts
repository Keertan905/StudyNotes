import api from './api';

export interface LectureChapter {
  timestamp: string;
  title: string;
  summary: string;
  bulletPoints: string[];
}

export interface LectureKeyTakeaway {
  concept: string;
  explanation: string;
  importance: 'High' | 'Critical' | 'Moderate';
}

export interface LectureQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LectureSummaryPayload {
  title: string;
  executiveSummary: string;
  keyTakeaways: LectureKeyTakeaway[];
  chapters: LectureChapter[];
  formulasAndLaws: string[];
  revisionQuestions: LectureQuizQuestion[];
  estimatedDurationMinutes: number;
}

export interface SummarizeLectureRequest {
  title: string;
  subjectName?: string;
  subjectId?: number;
  speakerOrCourse?: string;
  transcript: string;
  focusArea?: 'general' | 'exam_revision' | 'formula_deep_dive' | 'quick_overview';
}

export interface SaveLectureSummaryRequest {
  subjectId?: number;
  title: string;
  speakerOrCourse?: string;
  transcript: string;
  summaryJson: string;
  estimatedDurationMinutes?: number;
}

export interface LectureSummaryResponse {
  id: number;
  subjectId?: number;
  subjectName?: string;
  title: string;
  speakerOrCourse?: string;
  transcript: string;
  summaryJson: string;
  estimatedDurationMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export const lectureService = {
  async summarize(data: SummarizeLectureRequest): Promise<LectureSummaryPayload> {
    const res = await api.post<LectureSummaryPayload>('/api/lectures/summarize', data);
    return res.data;
  },

  async save(data: SaveLectureSummaryRequest): Promise<LectureSummaryResponse> {
    const res = await api.post<LectureSummaryResponse>('/api/lectures', data);
    return res.data;
  },

  async getAll(subjectId?: number): Promise<LectureSummaryResponse[]> {
    const res = await api.get<LectureSummaryResponse[]>('/api/lectures', {
      params: subjectId ? { subjectId } : undefined
    });
    return res.data;
  },

  async getById(id: number): Promise<LectureSummaryResponse> {
    const res = await api.get<LectureSummaryResponse>(`/api/lectures/${id}`);
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/lectures/${id}`);
  }
};
