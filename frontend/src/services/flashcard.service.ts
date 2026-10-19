import api from './api';

export interface GeneratedCardItem {
  front: string;
  back: string;
  hint?: string;
  difficulty: string;
  topicTag?: string;
}

export interface Flashcard {
  id: number;
  subjectId?: number;
  subjectName?: string;
  unitId?: number;
  unitTitle?: string;
  topicId?: number;
  topicName?: string;
  front: string;
  back: string;
  hint?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  nextReviewDate: string;
  lastReviewedAt?: string;
  reviewCount: number;
  isDue: boolean;
  createdAt: string;
}

export interface GenerateCardsRequest {
  subjectId?: number;
  subjectName?: string;
  unitId?: number;
  topicId?: number;
  topic: string;
  cardCount?: number;
  difficulty?: string;
  additionalContext?: string;
}

export interface CreateCardRequest {
  subjectId?: number;
  unitId?: number;
  topicId?: number;
  front: string;
  back: string;
  hint?: string;
  difficulty?: string;
}

export interface BatchSaveRequest {
  subjectId?: number;
  unitId?: number;
  topicId?: number;
  cards: GeneratedCardItem[];
}

export type ReviewRating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';

export interface ReviewCardRequest {
  rating: ReviewRating;
  timeSpentSeconds?: number;
}

export interface FlashcardStats {
  totalCards: number;
  dueTodayCount: number;
  masteredCount: number;
  learningCount: number;
  totalReviews: number;
}

export const flashcardService = {
  getCards: async (subjectId?: number): Promise<Flashcard[]> => {
    const params = subjectId ? { subjectId } : {};
    const res = await api.get<Flashcard[]>('/flashcards', { params });
    return res.data;
  },

  getDueCards: async (): Promise<Flashcard[]> => {
    const res = await api.get<Flashcard[]>('/flashcards/due');
    return res.data;
  },

  generateCards: async (data: GenerateCardsRequest): Promise<GeneratedCardItem[]> => {
    const res = await api.post<GeneratedCardItem[]>('/flashcards/generate', data);
    return res.data;
  },

  createCard: async (data: CreateCardRequest): Promise<Flashcard> => {
    const res = await api.post<Flashcard>('/flashcards', data);
    return res.data;
  },

  batchSaveCards: async (data: BatchSaveRequest): Promise<Flashcard[]> => {
    const res = await api.post<Flashcard[]>('/flashcards/batch', data);
    return res.data;
  },

  reviewCard: async (id: number, data: ReviewCardRequest): Promise<Flashcard> => {
    const res = await api.post<Flashcard>(`/flashcards/${id}/review`, data);
    return res.data;
  },

  deleteCard: async (id: number): Promise<void> => {
    await api.delete(`/flashcards/${id}`);
  },

  getStats: async (): Promise<FlashcardStats> => {
    const res = await api.get<FlashcardStats>('/flashcards/stats');
    return res.data;
  },
};
