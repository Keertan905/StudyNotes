import api from './api';

export interface StudentNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  timeAgo: string;
  createdAt: string;
}

export const notificationService = {
  getNotifications: async (): Promise<StudentNotification[]> => {
    const response = await api.get<StudentNotification[]>('/notifications');
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<{ unreadCount: number }>('/notifications/unread-count');
    return response.data.unreadCount;
  },

  markAsRead: async (id: number): Promise<StudentNotification> => {
    const response = await api.patch<StudentNotification>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await api.post('/notifications/read-all');
  },

  deleteNotification: async (id: number): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },

  clearAll: async (): Promise<void> => {
    await api.delete('/notifications/clear-all');
  },
};
