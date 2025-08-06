import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postsAPI } from '../api/posts';
import Layout from '../components/Layout/Layout';

const CreatePost = () => {
  const [postType, setPostType] = useState('url'); // 'url' ou 'file'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    tags: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Mutation pour créer une publication avec URL
  const createUrlPostMutation = useMutation({
    mutationFn: postsAPI.createPostWithUrl,
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
      navigate('/');
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Erreur lors de la création');
    },
  });

  // Mutation pour créer une publication avec fichier
  const createFilePostMutation = useMutation({
    mutationFn: postsAPI.createPostWithFile,
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
      navigate('/');
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Erreur lors de la création');
    },
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Le titre est requis');
      return;
    }

    if (postType === 'url') {
      if (!formData.url.trim()) {
        setError('L\\'URL est requise');
        return;
      }
      
      createUrlPostMutation.mutate({
        title: formData.title,
        description: formData.description,
        url: formData.url,
        tags: formData.tags,
      });
    } else {
      if (!selectedFile) {
        setError('Veuillez sélectionner un fichier');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('tags', formData.tags);
      formDataToSend.append('file', selectedFile);

      createFilePostMutation.mutate(formDataToSend);
    }
  };

  const isLoading = createUrlPostMutation.isLoading || createFilePostMutation.isLoading;

  return (
    <Layout>
      <div className=\"max-w-2xl mx-auto\">
        <div className=\"mb-8\">
          <h1 className=\"text-2xl font-bold text-secondary-900 mb-2\">
            Créer une publication
          </h1>
          <p className=\"text-secondary-600\">
            Partagez du contenu avec la communauté DJONA
          </p>
        </div>

        <div className=\"card\">
          <div className=\"card-content\">
            {error && (
              <div className=\"bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6\">
                {error}
              </div>
            )}

            {/* Sélecteur de type */}
            <div className=\"mb-6\">
              <div className=\"flex space-x-4\">
                <button
                  type=\"button\"
                  onClick={() => setPostType('url')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                    postType === 'url'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-secondary-200 hover:border-secondary-300'
                  }`}
                >
                  <div className=\"flex items-center justify-center space-x-2\">
                    <svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                      <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1\" />
                    </svg>
                    <span className=\"font-medium\">Lien URL</span>
                  </div>
                </button>
                
                <button
                  type=\"button\"
                  onClick={() => setPostType('file')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                    postType === 'file'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-secondary-200 hover:border-secondary-300'
                  }`}
                >
                  <div className=\"flex items-center justify-center space-x-2\">
                    <svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                      <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12\" />
                    </svg>
                    <span className=\"font-medium\">Fichier</span>
                  </div>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className=\"space-y-6\">
              {/* Titre */}
              <div>
                <label htmlFor=\"title\" className=\"block text-sm font-medium text-secondary-700 mb-2\">
                  Titre *
                </label>
                <input
                  id=\"title\"
                  name=\"title\"
                  type=\"text\"
                  required
                  className=\"input\"
                  placeholder=\"Donnez un titre à votre publication\"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor=\"description\" className=\"block text-sm font-medium text-secondary-700 mb-2\">
                  Description
                </label>
                <textarea
                  id=\"description\"
                  name=\"description\"
                  rows={4}
                  className=\"textarea\"
                  placeholder=\"Décrivez votre publication (optionnel)\"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              {/* Contenu selon le type */}
              {postType === 'url' ? (
                <div>
                  <label htmlFor=\"url\" className=\"block text-sm font-medium text-secondary-700 mb-2\">
                    URL *
                  </label>
                  <input
                    id=\"url\"
                    name=\"url\"
                    type=\"url\"
                    required
                    className=\"input\"
                    placeholder=\"https://exemple.com\"
                    value={formData.url}
                    onChange={handleChange}
                  />
                  <p className=\"text-sm text-secondary-500 mt-1\">
                    YouTube, articles, sites web... Un aperçu sera généré automatiquement.
                  </p>
                </div>
              ) : (
                <div>
                  <label htmlFor=\"file\" className=\"block text-sm font-medium text-secondary-700 mb-2\">
                    Fichier *
                  </label>
                  <div className=\"mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-secondary-300 border-dashed rounded-md hover:border-secondary-400 transition-colors\">
                    <div className=\"space-y-1 text-center\">
                      <svg
                        className=\"mx-auto h-12 w-12 text-secondary-400\"
                        stroke=\"currentColor\"
                        fill=\"none\"
                        viewBox=\"0 0 48 48\"
                      >
                        <path
                          d=\"M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02\"
                          strokeWidth={2}
                          strokeLinecap=\"round\"
                          strokeLinejoin=\"round\"
                        />
                      </svg>
                      <div className=\"flex text-sm text-secondary-600\">
                        <label
                          htmlFor=\"file\"
                          className=\"relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500\"
                        >
                          <span>Télécharger un fichier</span>
                          <input
                            id=\"file\"
                            name=\"file\"
                            type=\"file\"
                            className=\"sr-only\"
                            accept=\"image/*,video/*,audio/*,.pdf,.doc,.docx\"
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className=\"pl-1\">ou glisser-déposer</p>
                      </div>
                      <p className=\"text-xs text-secondary-500\">
                        PNG, JPG, GIF, MP4, PDF jusqu'à 50MB
                      </p>
                    </div>
                  </div>
                  {selectedFile && (
                    <p className=\"text-sm text-secondary-600 mt-2\">
                      Fichier sélectionné: {selectedFile.name}
                    </p>
                  )}
                </div>
              )}

              {/* Tags */}
              <div>
                <label htmlFor=\"tags\" className=\"block text-sm font-medium text-secondary-700 mb-2\">
                  Tags
                </label>
                <input
                  id=\"tags\"
                  name=\"tags\"
                  type=\"text\"
                  className=\"input\"
                  placeholder=\"tech, design, art (séparés par des virgules)\"
                  value={formData.tags}
                  onChange={handleChange}
                />
                <p className=\"text-sm text-secondary-500 mt-1\">
                  Ajoutez des tags pour aider les autres à découvrir votre contenu.
                </p>
              </div>

              {/* Boutons */}
              <div className=\"flex justify-end space-x-4 pt-6 border-t border-secondary-200\">
                <button
                  type=\"button\"
                  onClick={() => navigate('/')}
                  className=\"btn-outline btn-md\"
                >
                  Annuler
                </button>
                <button
                  type=\"submit\"
                  disabled={isLoading}
                  className=\"btn-primary btn-md\"
                >
                  {isLoading ? (
                    <div className=\"flex items-center\">
                      <div className=\"animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2\"></div>
                      Publication...
                    </div>
                  ) : (
                    'Publier'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreatePost;

