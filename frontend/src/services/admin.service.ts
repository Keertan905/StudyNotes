import api from './api';

export interface SystemStats {
  totalUsers: number;
  totalStudents: number;
  totalAdmins: number;
  totalSubjects: number;
  totalDocuments: number;
  totalQuizzes: number;
  totalMindMaps: number;
  totalFlashcards: number;
  systemStatus: string;
  apiProvider: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  college?: string;
  branch?: string;
  semester?: number;
  enabled: boolean;
  createdAt: string;
}

export interface UserListResponse {
  users: AdminUser[];
  totalCount: number;
}

export const adminService = {
  getStats: async (): Promise<SystemStats> => {
    const res = await api.get<SystemStats>('/admin/stats');
    return res.data;
  },

  getUsers: async (search?: string): Promise<UserListResponse> => {
    const res = await api.get<UserListResponse>('/admin/users', {
      params: search ? { search } : {},
    });
    return res.data;
  },

  updateUserStatus: async (userId: number, enabled: boolean): Promise<AdminUser> => {
    const res = await api.patch<AdminUser>(`/admin/users/${userId}/status`, { enabled });
    return res.data;
  },

  updateUserRole: async (userId: number, role: 'STUDENT' | 'ADMIN'): Promise<AdminUser> => {
    const res = await api.patch<AdminUser>(`/admin/users/${userId}/role`, { role });
    return res.data;
  },
};

export default adminService;
