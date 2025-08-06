import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { notificationsAPI } from '../../api/notifications';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Récupérer le nombre de notifications non lues
  const { data: notificationData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsAPI.getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
  });

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowUserMenu(false);
  };

  const unreadCount = notificationData?.unreadCount || 0;

  return (
    <header className=\"bg-white border-b border-secondary-200 sticky top-0 z-50\">
      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">
        <div className=\"flex justify-between items-center h-16\">
          {/* Logo */}
          <div className=\"flex items-center\">
            <Link to=\"/\" className=\"flex items-center space-x-2\">
              <div className=\"w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg flex items-center justify-center\">
                <span className=\"text-white font-bold text-lg\">D</span>
              </div>
              <span className=\"text-xl font-bold gradient-text\">DJONA</span>
            </Link>
          </div>

          {/* Barre de recherche */}
          <div className=\"flex-1 max-w-lg mx-8\">
            <div className=\"relative\">
              <input
                type=\"text\"
                placeholder=\"Rechercher des publications ou des utilisateurs...\"
                className=\"input w-full pl-10\"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    navigate(`/search?q=${encodeURIComponent(e.target.value.trim())}`);
                  }
                }}
              />
              <div className=\"absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none\">
                <svg className=\"h-5 w-5 text-secondary-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                  <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z\" />
                </svg>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className=\"flex items-center space-x-4\">
            {isAuthenticated ? (
              <>
                {/* Bouton Créer */}
                <Link
                  to=\"/create\"
                  className=\"btn-primary btn-sm\"
                >
                  <svg className=\"w-4 h-4 mr-2\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                    <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 4v16m8-8H4\" />
                  </svg>
                  Créer
                </Link>

                {/* Notifications */}
                <div className=\"relative\">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className=\"btn-ghost btn-sm relative\"
                  >
                    <svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                      <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M15 17h5l-3.5-3.5a7 7 0 11-9.9 0L3 17h5a7 7 0 0014 0z\" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className=\"absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center\">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Messages */}
                <Link
                  to=\"/messages\"
                  className=\"btn-ghost btn-sm\"
                >
                  <svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                    <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z\" />
                  </svg>
                </Link>

                {/* Menu utilisateur */}
                <div className=\"relative\">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className=\"flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500\"
                  >
                    <img
                      className=\"h-8 w-8 rounded-full object-cover\"
                      src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.username}&background=3b82f6&color=fff`}
                      alt={user?.username}
                    />
                  </button>

                  {showUserMenu && (
                    <div className=\"absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-secondary-200\">
                      <Link
                        to={`/profile/${user?.id}`}
                        className=\"block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50\"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Mon profil
                      </Link>
                      <Link
                        to=\"/settings\"
                        className=\"block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50\"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Paramètres
                      </Link>
                      <hr className=\"my-1\" />
                      <button
                        onClick={handleLogout}
                        className=\"block w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50\"
                      >
                        Se déconnecter
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className=\"flex items-center space-x-3\">
                <Link
                  to=\"/login\"
                  className=\"btn-ghost btn-sm\"
                >
                  Se connecter
                </Link>
                <Link
                  to=\"/register\"
                  className=\"btn-primary btn-sm\"
                >
                  S'inscrire
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

