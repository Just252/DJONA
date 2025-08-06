import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesAPI } from '../api/messages';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { formatRelativeTime } from '../utils/formatters';
import Layout from '../components/Layout/Layout';

const Messages = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const { user } = useAuth();
  const { socket, joinConversation, leaveConversation, sendMessage, sendTyping } = useSocket();
  const queryClient = useQueryClient();

  // Récupérer les conversations
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagesAPI.getConversations,
  });

  // Récupérer les messages de la conversation sélectionnée
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConversation?._id],
    queryFn: () => messagesAPI.getMessages(selectedConversation._id),
    enabled: !!selectedConversation,
  });

  // Mutation pour envoyer un message
  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, content }) => messagesAPI.sendMessage(conversationId, content),
    onSuccess: (data) => {
      // Mettre à jour le cache des messages
      queryClient.setQueryData(['messages', selectedConversation._id], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          messages: [...oldData.messages, data.data]
        };
      });
      
      // Envoyer via Socket.IO
      sendMessage(selectedConversation._id, data.data);
      
      // Réinitialiser le champ de saisie
      setNewMessage('');
    },
  });

  // Écouter les événements Socket.IO
  useEffect(() => {
    if (!socket) return;

    // Recevoir des messages
    const handleReceiveMessage = (data) => {
      queryClient.setQueryData(['messages', data.conversationId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          messages: [...oldData.messages, data.message]
        };
      });
    };

    // Gérer les indicateurs de frappe
    const handleUserTyping = (data) => {
      if (data.conversationId === selectedConversation?._id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
    };
  }, [socket, selectedConversation, queryClient]);

  // Rejoindre/quitter les conversations
  useEffect(() => {
    if (selectedConversation) {
      joinConversation(selectedConversation._id);
      return () => leaveConversation(selectedConversation._id);
    }
  }, [selectedConversation, joinConversation, leaveConversation]);

  // Faire défiler vers le bas lors de nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData?.messages]);

  // Gérer la frappe
  const handleTyping = (value) => {
    setNewMessage(value);
    
    if (!isTyping && selectedConversation) {
      setIsTyping(true);
      sendTyping(selectedConversation._id, true);
    }

    // Arrêter l'indicateur de frappe après 3 secondes d'inactivité
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (selectedConversation) {
        sendTyping(selectedConversation._id, false);
      }
    }, 3000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      conversationId: selectedConversation._id,
      content: newMessage.trim()
    });

    // Arrêter l'indicateur de frappe
    if (isTyping) {
      setIsTyping(false);
      sendTyping(selectedConversation._id, false);
    }
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants.find(p => p._id !== user.id);
  };

  if (conversationsLoading) {
    return (
      <Layout>
        <div className=\"flex justify-center items-center h-64\">
          <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600\"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className=\"max-w-6xl mx-auto h-[calc(100vh-200px)]\">
        <div className=\"flex h-full bg-white rounded-lg shadow-sm border border-secondary-200 overflow-hidden\">
          {/* Liste des conversations */}
          <div className=\"w-1/3 border-r border-secondary-200 flex flex-col\">
            <div className=\"p-4 border-b border-secondary-200\">
              <h2 className=\"text-lg font-semibold text-secondary-900\">Messages</h2>
            </div>
            
            <div className=\"flex-1 overflow-y-auto\">
              {conversationsData?.conversations?.length === 0 ? (
                <div className=\"p-4 text-center text-secondary-500\">
                  Aucune conversation
                </div>
              ) : (
                conversationsData?.conversations?.map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation);
                  return (
                    <div
                      key={conversation._id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-4 border-b border-secondary-100 cursor-pointer hover:bg-secondary-50 transition-colors ${
                        selectedConversation?._id === conversation._id ? 'bg-primary-50 border-primary-200' : ''
                      }`}
                    >
                      <div className=\"flex items-center space-x-3\">
                        <img
                          src={otherParticipant?.profilePicture || `https://ui-avatars.com/api/?name=${otherParticipant?.username}&background=3b82f6&color=fff`}
                          alt={otherParticipant?.username}
                          className=\"w-10 h-10 rounded-full object-cover\"
                        />
                        <div className=\"flex-1 min-w-0\">
                          <p className=\"font-medium text-secondary-900 truncate\">
                            {otherParticipant?.username}
                          </p>
                          {conversation.lastMessage && (
                            <p className=\"text-sm text-secondary-500 truncate\">
                              {conversation.lastMessage.content}
                            </p>
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <span className=\"text-xs text-secondary-400\">
                            {formatRelativeTime(conversation.lastActivity)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Zone de conversation */}
          <div className=\"flex-1 flex flex-col\">
            {selectedConversation ? (
              <>
                {/* En-tête de conversation */}
                <div className=\"p-4 border-b border-secondary-200 bg-white\">
                  <div className=\"flex items-center space-x-3\">
                    <img
                      src={getOtherParticipant(selectedConversation)?.profilePicture || `https://ui-avatars.com/api/?name=${getOtherParticipant(selectedConversation)?.username}&background=3b82f6&color=fff`}
                      alt={getOtherParticipant(selectedConversation)?.username}
                      className=\"w-10 h-10 rounded-full object-cover\"
                    />
                    <div>
                      <h3 className=\"font-semibold text-secondary-900\">
                        {getOtherParticipant(selectedConversation)?.username}
                      </h3>
                      {typingUsers.size > 0 && (
                        <p className=\"text-sm text-primary-600\">En train d'écrire...</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className=\"flex-1 overflow-y-auto p-4 space-y-4\">
                  {messagesLoading ? (
                    <div className=\"flex justify-center\">
                      <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600\"></div>
                    </div>
                  ) : (
                    messagesData?.messages?.map((message) => {
                      const isOwn = message.sender._id === user.id;
                      return (
                        <div
                          key={message._id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOwn 
                              ? 'bg-primary-600 text-white' 
                              : 'bg-secondary-100 text-secondary-900'
                          }`}>
                            <p className=\"text-sm\">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isOwn ? 'text-primary-200' : 'text-secondary-500'
                            }`}>
                              {formatRelativeTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Formulaire d'envoi */}
                <form onSubmit={handleSendMessage} className=\"p-4 border-t border-secondary-200 bg-white\">
                  <div className=\"flex space-x-2\">
                    <input
                      type=\"text\"
                      value={newMessage}
                      onChange={(e) => handleTyping(e.target.value)}
                      placeholder=\"Tapez votre message...\"
                      className=\"flex-1 input\"
                      disabled={sendMessageMutation.isLoading}
                    />
                    <button
                      type=\"submit\"
                      disabled={!newMessage.trim() || sendMessageMutation.isLoading}
                      className=\"btn-primary btn-md\"
                    >
                      <svg className=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                        <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 19l9 2-9-18-9 18 9-2zm0 0v-8\" />
                      </svg>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className=\"flex-1 flex items-center justify-center text-secondary-500\">
                <div className=\"text-center\">
                  <svg className=\"w-16 h-16 mx-auto mb-4 text-secondary-300\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                    <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z\" />
                  </svg>
                  <p>Sélectionnez une conversation pour commencer</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Messages;

