import React, { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { postsAPI } from '../api/posts';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import PostCard from '../components/Post/PostCard';
import Layout from '../components/Layout/Layout';

const Home = () => {
  const [sortBy, setSortBy] = useState('recent');

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['posts', sortBy],
    queryFn: ({ pageParam = 1 }) =>
      postsAPI.getPosts({ page: pageParam, sort: sortBy }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.currentPage + 1 : undefined,
  });

  const [isFetching] = useInfiniteScroll(fetchNextPage, hasNextPage);

  const posts = data?.pages.flatMap(page => page.posts) || [];

  if (isLoading) {
    return (
      <Layout>
        <div className=\"flex justify-center items-center h-64\">
          <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600\"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className=\"text-center py-12\">
          <div className=\"text-red-600 mb-4\">
            <svg className=\"w-16 h-16 mx-auto\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z\" />
            </svg>
          </div>
          <h3 className=\"text-lg font-semibold text-secondary-900 mb-2\">
            Erreur de chargement
          </h3>
          <p className=\"text-secondary-600\">
            Impossible de charger les publications. Veuillez réessayer.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className=\"max-w-2xl mx-auto\">
        {/* En-tête avec filtres */}
        <div className=\"mb-8\">
          <h1 className=\"text-2xl font-bold text-secondary-900 mb-4\">
            Fil d'actualité
          </h1>
          
          <div className=\"flex space-x-4\">
            <button
              onClick={() => setSortBy('recent')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'recent'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-secondary-700 hover:bg-secondary-50 border border-secondary-200'
              }`}
            >
              Plus récent
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'popular'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-secondary-700 hover:bg-secondary-50 border border-secondary-200'
              }`}
            >
              Populaire
            </button>
          </div>
        </div>

        {/* Liste des publications */}
        <div className=\"space-y-6\">
          {posts.length === 0 ? (
            <div className=\"text-center py-12\">
              <div className=\"text-secondary-400 mb-4\">
                <svg className=\"w-16 h-16 mx-auto\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10\" />
                </svg>
              </div>
              <h3 className=\"text-lg font-semibold text-secondary-900 mb-2\">
                Aucune publication
              </h3>
              <p className=\"text-secondary-600\">
                Soyez le premier à partager quelque chose !
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))
          )}
        </div>

        {/* Indicateur de chargement */}
        {(isFetchingNextPage || isFetching) && (
          <div className=\"flex justify-center py-8\">
            <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600\"></div>
          </div>
        )}

        {/* Message de fin */}
        {!hasNextPage && posts.length > 0 && (
          <div className=\"text-center py-8\">
            <p className=\"text-secondary-500\">
              Vous avez vu toutes les publications !
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Home;

