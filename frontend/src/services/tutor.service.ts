import api from './api';

export interface MessageItem {
  id: number;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: string;
}

export interface ConversationItem {
  id: number;
  subjectId?: number;
  subjectName?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: MessageItem[];
}

export interface ChatResponse {
  userMessage: MessageItem;
  assistantMessage: MessageItem;
  suggestedFollowUps: string[];
}

export const tutorService = {
  async getConversations(): Promise<ConversationItem[]> {
    const res = await api.get<ConversationItem[]>('/tutor/conversations');
    return res.data;
  },

  async getConversation(id: number): Promise<ConversationItem> {
    const res = await api.get<ConversationItem>(`/tutor/conversations/${id}`);
    return res.data;
  },

  async createConversation(data: {
    subjectId?: number;
    title: string;
    initialMessage?: string;
  }): Promise<ConversationItem> {
    const res = await api.post<ConversationItem>('/tutor/conversations', data);
    return res.data;
  },

  async sendMessage(
    conversationId: number,
    data: {
      message: string;
      explanationStyle?: string;
      academicLevel?: string;
    }
  ): Promise<ChatResponse> {
    const res = await api.post<ChatResponse>(`/tutor/conversations/${conversationId}/messages`, data);
    return res.data;
  },

  async deleteConversation(id: number): Promise<void> {
    await api.delete(`/tutor/conversations/${id}`);
  },
};
