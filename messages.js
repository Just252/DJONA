import apiClient from './client';

export const messagesAPI = {
  // Obtenir toutes les conversations
  getConversations: async () => {
    const response = await apiClient.get('/messages/conversations');
    return response.data;
  },

  // Créer ou obtenir une conversation
  createOrGetConversation: async (participantId) => {
    const response = await apiClient.post('/messages/conversations', { participantId });
    return response.data;
  },

  // Obtenir les messages d'une conversation
  getMessages: async (conversationId, params = {}) => {
    const response = await apiClient.get(`/messages/${conversationId}`, { params });
    return response.data;
  },

  // Envoyer un message texte
  sendMessage: async (conversationId, content) => {
    const response = await apiClient.post(`/messages/${conversationId}`, { content });
    return response.data;
  },

  // Envoyer un message avec fichier
  sendMessageWithFile: async (conversationId, formData) => {
    const response = await apiClient.post(`/messages/${conversationId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Marquer les messages comme lus
  markMessagesAsRead: async (conversationId) => {
    const response = await apiClient.put(`/messages/${conversationId}/read`);
    return response.data;
  },

  // Supprimer un message
  deleteMessage: async (messageId, deleteForEveryone = false) => {
    const response = await apiClient.delete(`/messages/message/${messageId}`, {
      data: { deleteForEveryone }
    });
    return response.data;
  },

  // Obtenir le nombre de messages non lus
  getUnreadCount: async () => {
    const response = await apiClient.get('/messages/unread-count');
    return response.data;
  },
};

