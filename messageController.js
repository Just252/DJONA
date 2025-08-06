const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// Obtenir toutes les conversations d'un utilisateur
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId
    })
    .populate('participants', 'username profilePicture')
    .populate('lastMessage')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'username'
      }
    })
    .sort({ lastActivity: -1 });

    res.json({ conversations });
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Créer ou obtenir une conversation
const createOrGetConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    const currentUserId = req.user.id;

    if (participantId === currentUserId) {
      return res.status(400).json({ message: 'Vous ne pouvez pas créer une conversation avec vous-même' });
    }

    // Vérifier que l'autre utilisateur existe
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Chercher une conversation existante
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, participantId] },
      isGroup: false
    })
    .populate('participants', 'username profilePicture')
    .populate('lastMessage');

    // Si aucune conversation n'existe, en créer une nouvelle
    if (!conversation) {
      conversation = new Conversation({
        participants: [currentUserId, participantId],
        isGroup: false
      });
      await conversation.save();
      await conversation.populate('participants', 'username profilePicture');
    }

    res.json({ conversation });
  } catch (error) {
    console.error('Erreur lors de la création/récupération de la conversation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir les messages d'une conversation
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user.id;

    // Vérifier que l'utilisateur fait partie de la conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }

    const messages = await Message.find({
      conversation: conversationId,
      deletedFor: { $ne: userId }
    })
    .populate('sender', 'username profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Message.countDocuments({
      conversation: conversationId,
      deletedFor: { $ne: userId }
    });

    res.json({
      messages: messages.reverse(), // Inverser pour avoir les plus anciens en premier
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalMessages: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Envoyer un message
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, messageType = 'text' } = req.body;
    const userId = req.user.id;

    // Vérifier que l'utilisateur fait partie de la conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }

    // Créer le message
    const message = new Message({
      conversation: conversationId,
      sender: userId,
      content,
      messageType
    });

    // Gérer les fichiers si nécessaire
    if (req.file) {
      message.file = {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        filePath: req.file.path
      };
      message.messageType = req.file.mimetype.startsWith('image/') ? 'image' : 
                           req.file.mimetype.startsWith('video/') ? 'video' :
                           req.file.mimetype.startsWith('audio/') ? 'audio' : 'file';
    }

    await message.save();
    await message.populate('sender', 'username profilePicture');

    // Mettre à jour la conversation
    conversation.lastMessage = message._id;
    conversation.lastActivity = new Date();
    await conversation.save();

    res.status(201).json({
      message: 'Message envoyé avec succès',
      data: message
    });
  } catch (error) {
    console.error('Erreur lors de l\\'envoi du message:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Marquer les messages comme lus
const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Vérifier que l'utilisateur fait partie de la conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }

    // Marquer tous les messages non lus comme lus
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        }
      }
    );

    res.json({ message: 'Messages marqués comme lus' });
  } catch (error) {
    console.error('Erreur lors du marquage des messages:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteForEveryone = false } = req.body;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    if (deleteForEveryone) {
      // Seul l'expéditeur peut supprimer pour tout le monde
      if (message.sender.toString() !== userId) {
        return res.status(403).json({ message: 'Non autorisé' });
      }
      
      message.isDeleted = true;
      message.content = 'Ce message a été supprimé';
    } else {
      // Supprimer seulement pour l'utilisateur actuel
      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
      }
    }

    await message.save();

    res.json({ 
      message: deleteForEveryone ? 'Message supprimé pour tous' : 'Message supprimé pour vous'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du message:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir le nombre de messages non lus
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Message.countDocuments({
      sender: { $ne: userId },
      'readBy.user': { $ne: userId },
      deletedFor: { $ne: userId }
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Erreur lors de la récupération du nombre de messages non lus:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  getConversations,
  createOrGetConversation,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
  getUnreadCount
};

