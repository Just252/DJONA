import apiClient from './client';

export const commentsAPI = {
  // Créer un commentaire
  createComment: async (postId, content) => {
    const response = await apiClient.post(`/comments/${postId}`, { content });
    return response.data;
  },

  // Obtenir les commentaires d'une publication
  getComments: async (postId, params = {}) => {
    const response = await apiClient.get(`/comments/${postId}`, { params });
    return response.data;
  },

  // Liker/Unliker un commentaire
  toggleCommentLike: async (id) => {
    const response = await apiClient.post(`/comments/${id}/like`);
    return response.data;
  },

  // Répondre à un commentaire
  replyToComment: async (id, content) => {
    const response = await apiClient.post(`/comments/${id}/reply`, { content });
    return response.data;
  },

  // Modifier un commentaire
  updateComment: async (id, content) => {
    const response = await apiClient.put(`/comments/${id}`, { content });
    return response.data;
  },

  // Supprimer un commentaire
  deleteComment: async (id) => {
    const response = await apiClient.delete(`/comments/${id}`);
    return response.data;
  },
};

