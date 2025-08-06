import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postsAPI } from '../../api/posts';
import { formatRelativeTime, formatNumber } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const PostCard = ({ post }) => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);

  // Mutation pour liker/unliker
  const likeMutation = useMutation({
    mutationFn: postsAPI.toggleLike,
    onSuccess: (data) => {
      // Mettre à jour le cache
      queryClient.setQueryData(['posts'], (oldData) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            posts: page.posts.map(p => 
              p._id === post._id 
                ? { 
                    ...p, 
                    likesCount: data.likesCount,
                    likes: data.isLiked 
                      ? [...p.likes, { user: user.id }]
                      : p.likes.filter(like => like.user !== user.id)
                  }
                : p
            )
          }))
        };
      });
    },
  });

  // Mutation pour partager
  const shareMutation = useMutation({
    mutationFn: postsAPI.sharePost,
    onSuccess: (data) => {
      // Copier le lien dans le presse-papiers
      navigator.clipboard.writeText(data.shareUrl);
      alert('Lien copié dans le presse-papiers !');
    },
  });

  const isLiked = post.likes?.some(like => like.user === user?.id);
  const isOwner = user?.id === post.author._id;

  const handleLike = () => {
    if (!isAuthenticated) return;
    likeMutation.mutate(post._id);
  };

  const handleShare = () => {
    shareMutation.mutate(post._id);
  };

  const renderContent = () => {
    if (post.content.type === 'file') {
      const { mimeType, data, fileName } = post.content;
      
      if (mimeType?.startsWith('image/')) {
        return (
          <img
            src={`http://localhost:5000/${data}`}
            alt={fileName}
            className=\"w-full max-h-96 object-cover rounded-lg\"
          />
        );
      } else if (mimeType?.startsWith('video/')) {
        return (
          <video
            controls
            className=\"w-full max-h-96 rounded-lg\"
          >
            <source src={`http://localhost:5000/${data}`} type={mimeType} />
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
        );
      } else {
        return (
          <div className=\"border border-secondary-200 rounded-lg p-4 bg-secondary-50\">
            <div className=\"flex items-center space-x-2\">
              <svg className=\"w-8 h-8 text-secondary-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z\" />
              </svg>
              <div>
                <p className=\"font-medium text-secondary-900\">{fileName}</p>
                <p className=\"text-sm text-secondary-500\">Document</p>
              </div>
            </div>
          </div>
        );
      }
    } else if (post.content.type === 'url') {
      const { preview } = post.content;
      return (
        <a
          href={post.content.data}
          target=\"_blank\"
          rel=\"noopener noreferrer\"
          className=\"block border border-secondary-200 rounded-lg overflow-hidden hover:border-primary-300 transition-colors\"
        >
          {preview?.image && (
            <img
              src={preview.image}
              alt={preview.title}
              className=\"w-full h-48 object-cover\"
            />
          )}
          <div className=\"p-4\">
            <h3 className=\"font-semibold text-secondary-900 line-clamp-2\">{preview?.title}</h3>
            {preview?.description && (
              <p className=\"text-sm text-secondary-600 mt-1 line-clamp-2\">{preview.description}</p>
            )}
            <p className=\"text-xs text-secondary-500 mt-2\">{preview?.siteName}</p>
          </div>
        </a>
      );
    }
  };

  return (
    <div className=\"card animate-fade-in\">
      <div className=\"card-content\">
        {/* En-tête */}
        <div className=\"flex items-center justify-between mb-4\">
          <div className=\"flex items-center space-x-3\">
            <Link to={`/profile/${post.author._id}`}>
              <img
                className=\"h-10 w-10 rounded-full object-cover\"
                src={post.author.profilePicture || `https://ui-avatars.com/api/?name=${post.author.username}&background=3b82f6&color=fff`}
                alt={post.author.username}
              />
            </Link>
            <div>
              <Link
                to={`/profile/${post.author._id}`}
                className=\"font-semibold text-secondary-900 hover:text-primary-600\"
              >
                {post.author.username}
              </Link>
              <p className=\"text-sm text-secondary-500\">
                {formatRelativeTime(post.createdAt)}
              </p>
            </div>
          </div>
          
          {isOwner && (
            <button className=\"btn-ghost btn-sm\">
              <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z\" />
              </svg>
            </button>
          )}
        </div>

        {/* Titre et description */}
        <div className=\"mb-4\">
          <h2 className=\"text-lg font-semibold text-secondary-900 mb-2\">{post.title}</h2>
          {post.description && (
            <p className=\"text-secondary-700\">{post.description}</p>
          )}
        </div>

        {/* Contenu */}
        <div className=\"mb-4\">
          {renderContent()}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className=\"flex flex-wrap gap-2 mb-4\">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className=\"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800\"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className=\"flex items-center justify-between pt-4 border-t border-secondary-200\">
          <div className=\"flex items-center space-x-6\">
            <button
              onClick={handleLike}
              disabled={!isAuthenticated || likeMutation.isLoading}
              className={`flex items-center space-x-2 text-sm ${
                isLiked ? 'text-red-600' : 'text-secondary-600 hover:text-red-600'
              } transition-colors`}
            >
              <svg
                className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`}
                fill={isLiked ? 'currentColor' : 'none'}
                stroke=\"currentColor\"
                viewBox=\"0 0 24 24\"
              >
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z\" />
              </svg>
              <span>{formatNumber(post.likesCount)}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className=\"flex items-center space-x-2 text-sm text-secondary-600 hover:text-primary-600 transition-colors\"
            >
              <svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z\" />
              </svg>
              <span>{formatNumber(post.commentsCount)}</span>
            </button>

            <button
              onClick={handleShare}
              disabled={shareMutation.isLoading}
              className=\"flex items-center space-x-2 text-sm text-secondary-600 hover:text-primary-600 transition-colors\"
            >
              <svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z\" />
              </svg>
              <span>{formatNumber(post.sharesCount)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;

