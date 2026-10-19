import api from './api';

export interface StudySession {
  id: number;
  subjectId?: number;
  subjectName?: string;
  topicId?: number;
  topicName?: string;
  title: string;
  sessionType: 'POMODORO' | 'SHORT_BREAK' | 'LONG_BREAK' | 'CUSTOM';
  targetDurationMinutes: number;
  actualDurationMinutes: number;
  completed: boolean;
  notes?: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface LogSessionRequest {
  subjectId?: number;
  topicId?: number;
  title: string;
  sessionType?: string;
  targetDurationMinutes?: number;
  actualDurationMinutes?: number;
  completed?: boolean;
  notes?: string;
  startTime?: string;
  endTime?: string;
}

export interface SessionStats {
  minutesStudiedToday: number;
  minutesStudiedThisWeek: number;
  completedSessionsCount: number;
  currentStreakDays: number;
}

export interface StudyTask {
  id: number;
  subjectId?: number;
  subjectName?: string;
  topicId?: number;
  topicName?: string;
  title: string;
  dueDate?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  estimatedMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  subjectId?: number;
  topicId?: number;
  title: string;
  dueDate?: string;
  priority?: string;
  estimatedMinutes?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  dueDate?: string;
  priority?: string;
  status?: string;
  estimatedMinutes?: number;
}

export const studySessionService = {
  logSession: async (data: LogSessionRequest): Promise<StudySession> => {
    const res = await api.post<StudySession>('/study-sessions', data);
    return res.data;
  },

  getSessions: async (): Promise<StudySession[]> => {
    const res = await api.get<StudySession[]>('/study-sessions');
    return res.data;
  },

  getStats: async (): Promise<SessionStats> => {
    const res = await api.get<SessionStats>('/study-sessions/stats');
    return res.data;
  },

  // Task endpoints
  getTasks: async (subjectId?: number): Promise<StudyTask[]> => {
    const params = subjectId ? { subjectId } : {};
    const res = await api.get<StudyTask[]>('/study-tasks', { params });
    return res.data;
  },

  createTask: async (data: CreateTaskRequest): Promise<StudyTask> => {
    const res = await api.post<StudyTask>('/study-tasks', data);
    return res.data;
  },

  updateTask: async (id: number, data: UpdateTaskRequest): Promise<StudyTask> => {
    const res = await api.put<StudyTask>(`/study-tasks/${id}`, data);
    return res.data;
  },

  deleteTask: async (id: number): Promise<void> => {
    await api.delete(`/study-tasks/${id}`);
  },
};
