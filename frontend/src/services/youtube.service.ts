import api from './api';

export interface YouTubeSearchParams {
  query: string;
  subjectName?: string;
  sortBy?: 'BEST_MATCH' | 'MOST_VIEWED' | 'NEWEST' | 'TRENDING_ESTIMATE';
  durationFilter?: 'ALL' | 'SHORT' | 'MEDIUM' | 'LONG';
  language?: 'ALL' | 'en' | 'hi' | 'es';
  difficulty?: 'ALL' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXAM_CRASH_COURSE';
}

export interface YouTubeVideoItem {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  thumbnailUrl: string;
  publishedAt: string;
  formattedPublishedDate: string;
  duration: string;
  durationSeconds: number;
  views: number | null;
  formattedViews: string;
  likes: number | null;
  formattedLikes: string;
  videoUrl: string;
  recommendationReason: string;
  tags: string[];
  difficultyBadge: string;
  compositeScore: number;
}

export interface YouTubeSearchResponse {
  query: string;
  totalResults: number;
  videos: YouTubeVideoItem[];
  apiKeyConfigured: boolean;
  quotaExceeded: boolean;
  errorMessage?: string;
}

export interface YouTubeStatusResponse {
  configured: boolean;
  message: string;
}

export const youtubeService = {
  search: async (params: YouTubeSearchParams): Promise<YouTubeSearchResponse> => {
    const response = await api.post<YouTubeSearchResponse>('/youtube/search', params);
    return response.data;
  },

  getStatus: async (): Promise<YouTubeStatusResponse> => {
    const response = await api.get<YouTubeStatusResponse>('/youtube/status');
    return response.data;
  },
};
