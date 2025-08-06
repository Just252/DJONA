import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Créer la connexion socket
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        transports: ['websocket'],
      });

      // Événements de connexion
      newSocket.on('connect', () => {
        console.log('Connecté au serveur Socket.IO');
        newSocket.emit('join', user.id);
      });

      newSocket.on('disconnect', () => {
        console.log('Déconnecté du serveur Socket.IO');
      });

      // Gestion des erreurs
      newSocket.on('connect_error', (error) => {
        console.error('Erreur de connexion Socket.IO:', error);
      });

      setSocket(newSocket);

      // Nettoyage lors de la déconnexion
      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    } else {
      // Déconnecter si l'utilisateur n'est pas authentifié
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [isAuthenticated, user]);

  // Fonctions utilitaires
  const joinConversation = (conversationId) => {
    if (socket) {
      socket.emit('join_conversation', conversationId);
    }
  };

  const leaveConversation = (conversationId) => {
    if (socket) {
      socket.emit('leave_conversation', conversationId);
    }
  };

  const sendMessage = (conversationId, message) => {
    if (socket) {
      socket.emit('send_message', {
        conversationId,
        message
      });
    }
  };

  const sendTyping = (conversationId, isTyping) => {
    if (socket) {
      socket.emit('typing', {
        conversationId,
        isTyping
      });
    }
  };

  const sendNotification = (recipientId, notification) => {
    if (socket) {
      socket.emit('send_notification', {
        recipientId,
        notification
      });
    }
  };

  const markMessagesRead = (conversationId, userId) => {
    if (socket) {
      socket.emit('mark_messages_read', {
        conversationId,
        userId
      });
    }
  };

  const value = {
    socket,
    onlineUsers,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendTyping,
    sendNotification,
    markMessagesRead,
    isConnected: socket?.connected || false,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

