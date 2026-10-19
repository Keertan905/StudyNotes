import api from './api';

export interface TopicItem {
  id?: number;
  name: string;
  completed?: boolean;
  importance?: string;
}

export interface UnitItem {
  id?: number;
  unitNumber?: number;
  title: string;
  description?: string;
  completed?: boolean;
  topics: (TopicItem | string)[];
}

export interface SubjectItem {
  id: number;
  name: string;
  code?: string;
  semester?: number;
  examDate?: string;
  color?: string;
  archived: boolean;
  totalUnits: number;
  completedUnits: number;
  totalTopics: number;
  completedTopics: number;
  units: {
    id: number;
    unitNumber: number;
    title: string;
    description?: string;
    completed: boolean;
    topics: {
      id: number;
      name: string;
      completed: boolean;
      importance: string;
    }[];
  }[];
}

export const subjectService = {
  async getSubjects(includeArchived = false): Promise<SubjectItem[]> {
    const res = await api.get<SubjectItem[]>('/subjects', { params: { includeArchived } });
    return res.data;
  },

  async getSubject(id: number): Promise<SubjectItem> {
    const res = await api.get<SubjectItem>(`/subjects/${id}`);
    return res.data;
  },

  async createSubject(data: {
    name: string;
    code?: string;
    semester?: number;
    examDate?: string;
    color?: string;
    units?: UnitItem[];
  }): Promise<SubjectItem> {
    const res = await api.post<SubjectItem>('/subjects', data);
    return res.data;
  },

  async updateSubject(id: number, data: Partial<SubjectItem>): Promise<SubjectItem> {
    const res = await api.put<SubjectItem>(`/subjects/${id}`, data);
    return res.data;
  },

  async toggleArchive(id: number): Promise<void> {
    await api.patch(`/subjects/${id}/archive`);
  },

  async deleteSubject(id: number): Promise<void> {
    await api.delete(`/subjects/${id}`);
  },

  async addUnit(subjectId: number, data: { unitNumber?: number; title: string; description?: string; topics?: string[] }): Promise<SubjectItem> {
    const res = await api.post<SubjectItem>(`/subjects/${subjectId}/units`, data);
    return res.data;
  },

  async toggleTopic(topicId: number): Promise<void> {
    await api.patch(`/subjects/topics/${topicId}/toggle`);
  },

  async extractSyllabus(file?: File, text?: string): Promise<UnitItem[]> {
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (text) formData.append('text', text);

    const res = await api.post<UnitItem[]>('/subjects/extract-syllabus', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
