import api from './api';

export interface NoteItem {
  id: number;
  subjectId?: number;
  subjectName?: string;
  unitId?: number;
  unitTitle?: string;
  topicId?: number;
  topicName?: string;
  title: string;
  content: string;
  academicLevel?: string;
  explanationStyle?: string;
  detailLevel?: string;
  createdAt: string;
  updatedAt: string;
}

export const noteService = {
  async getNotes(subjectId?: number): Promise<NoteItem[]> {
    const res = await api.get<NoteItem[]>('/notes', { params: { subjectId } });
    return res.data;
  },

  async getNote(id: number): Promise<NoteItem> {
    const res = await api.get<NoteItem>(`/notes/${id}`);
    return res.data;
  },

  async generateNote(data: {
    subjectName: string;
    subjectId?: number;
    unitId?: number;
    topicId?: number;
    topic: string;
    academicLevel?: string;
    explanationStyle?: string;
    detailLevel?: string;
    additionalContext?: string;
  }): Promise<{ content: string }> {
    const res = await api.post<{ content: string }>('/notes/generate', data);
    return res.data;
  },

  async saveNote(data: {
    subjectId?: number;
    unitId?: number;
    topicId?: number;
    title: string;
    content: string;
    academicLevel?: string;
    explanationStyle?: string;
    detailLevel?: string;
  }): Promise<NoteItem> {
    const res = await api.post<NoteItem>('/notes', data);
    return res.data;
  },

  async updateNote(id: number, data: {
    title: string;
    content: string;
    academicLevel?: string;
    explanationStyle?: string;
    detailLevel?: string;
  }): Promise<NoteItem> {
    const res = await api.put<NoteItem>(`/notes/${id}`, data);
    return res.data;
  },

  async deleteNote(id: number): Promise<void> {
    await api.delete(`/notes/${id}`);
  },
};
