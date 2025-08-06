import apiClient from './client';

export const postsAPI = {
  // Créer une publication avec fichier
  createPostWithFile: async (formData) => {
    const response = await apiClient.post('/posts/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Créer une publication avec URL
  createPostWithUrl: async (postData) => {
    const response = await apiClient.post('/posts/url', postData);
    return response.data;
  },

  // Obtenir toutes les publications
  getPosts: async (params = {}) => {
    const response = await apiClient.get('/posts', { params });
    return response.data;
  },

  // Obtenir une publication par ID
  getPostById: async (id) => {
    const response = await apiClient.get(`/posts/${id}`);
    return response.data;
  },

  // Liker/Unliker une publication
  toggleLike: async (id) => {
    const response = await apiClient.post(`/posts/${id}/like`);
    return response.data;
  },

  // Partager une publication
  sharePost: async (id) => {
    const response = await apiClient.post(`/posts/${id}/share`);
    return response.data;
  },

  // Supprimer une publication
  deletePost: async (id) => {
    const response = await apiClient.delete(`/posts/${id}`);
    return response.data;
  },

  // Rechercher des publications
  searchPosts: async (params) => {
    const response = await apiClient.get('/posts/search', { params });
    return response.data;
  },
};

