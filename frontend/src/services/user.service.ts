import api from './api';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  college?: string;
  branch?: string;
  semester?: number;
  createdAt: string;
}

export interface UpdateProfileRequest {
  name: string;
  college?: string;
  branch?: string;
  semester?: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const userService = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/user/profile');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await api.put<UserProfile>('/user/profile', data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/user/change-password', data);
    return response.data;
  },
};
