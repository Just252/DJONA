import apiClient from './client';

export const notificationsAPI = {
  // Obtenir les notifications
  getNotifications: async (params = {}) => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  // Obtenir le nombre de notifications non lues
  getUnreadCount: async () => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  },

  // Marquer une notification comme lue
  markAsRead: async (id) => {
    const response = await apiClient.put(`/notifications/${id}/read`);
    return response.data;
  },

  // Marquer toutes les notifications comme lues
  markAllAsRead: async () => {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  },

  // Supprimer une notification
  deleteNotification: async (id) => {
    const response = await apiClient.delete(`/notifications/${id}`);
    return response.data;
  },

  // Supprimer toutes les notifications
  deleteAllNotifications: async () => {
    const response = await apiClient.delete('/notifications');
    return response.data;
  },
};

