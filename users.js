import apiClient from './client';

export const usersAPI = {
  // Obtenir le profil d'un utilisateur
  getUserProfile: async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  // Suivre/Ne plus suivre un utilisateur
  toggleFollow: async (id) => {
    const response = await apiClient.post(`/users/${id}/follow`);
    return response.data;
  },

  // Obtenir les abonnés d'un utilisateur
  getFollowers: async (id, params = {}) => {
    const response = await apiClient.get(`/users/${id}/followers`, { params });
    return response.data;
  },

  // Obtenir les abonnements d'un utilisateur
  getFollowing: async (id, params = {}) => {
    const response = await apiClient.get(`/users/${id}/following`, { params });
    return response.data;
  },

  // Rechercher des utilisateurs
  searchUsers: async (params) => {
    const response = await apiClient.get('/users/search', { params });
    return response.data;
  },

  // Obtenir les publications d'un utilisateur
  getUserPosts: async (id, params = {}) => {
    const response = await apiClient.get(`/users/${id}/posts`, { params });
    return response.data;
  },

  // Obtenir des suggestions d'utilisateurs
  getSuggestedUsers: async (params = {}) => {
    const response = await apiClient.get('/users/suggestions', { params });
    return response.data;
  },
};

