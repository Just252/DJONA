const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');

// Importer les routes
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');

const app = express();
const server = http.createServer(app);

// Configuration CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:3000'],
  credentials: true
};

app.use(cors(corsOptions));

// Configuration Socket.IO
const io = socketIo(server, {
  cors: corsOptions
});

// Connecter à MongoDB
connectDB();

// Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'DJONA API is running!', 
    timestamp: new Date().toISOString() 
  });
});

// Gestion des connexions Socket.IO
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('Nouvel utilisateur connecté:', socket.id);

  // Associer l'utilisateur à sa socket
  socket.on('join', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`Utilisateur ${userId} associé à la socket ${socket.id}`);
  });

  // Rejoindre une conversation
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} a rejoint la conversation ${conversationId}`);
  });

  // Quitter une conversation
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
    console.log(`Socket ${socket.id} a quitté la conversation ${conversationId}`);
  });

  // Envoyer un message
  socket.on('send_message', (data) => {
    const { conversationId, message } = data;
    
    // Diffuser le message à tous les participants de la conversation
    socket.to(conversationId).emit('receive_message', {
      conversationId,
      message,
      timestamp: new Date()
    });
    
    console.log(`Message envoyé dans la conversation ${conversationId}`);
  });

  // Notification de frappe en cours
  socket.on('typing', (data) => {
    const { conversationId, isTyping } = data;
    socket.to(conversationId).emit('user_typing', {
      userId: socket.userId,
      isTyping,
      conversationId
    });
  });

  // Envoyer une notification en temps réel
  socket.on('send_notification', (data) => {
    const { recipientId, notification } = data;
    const recipientSocketId = connectedUsers.get(recipientId);
    
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receive_notification', notification);
      console.log(`Notification envoyée à l'utilisateur ${recipientId}`);
    }
  });

  // Marquer les messages comme lus
  socket.on('mark_messages_read', (data) => {
    const { conversationId, userId } = data;
    socket.to(conversationId).emit('messages_read', {
      conversationId,
      readBy: userId,
      timestamp: new Date()
    });
  });

  // Déconnexion
  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`Utilisateur ${socket.userId} déconnecté`);
    }
    console.log('Utilisateur déconnecté:', socket.id);
  });
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err.stack);
  res.status(500).json({ 
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Middleware pour les routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur DJONA démarré sur le port ${PORT}`);
  console.log(`📱 API disponible sur http://localhost:${PORT}/api`);
  console.log(`🔗 Socket.IO activé pour la messagerie temps réel`);
});

