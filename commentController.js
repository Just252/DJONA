const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// Créer un commentaire
const createComment = async (req, res) => {
  try {
    const { content } = req.body;
    const postId = req.params.postId;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Le contenu du commentaire est requis' });
    }

    // Vérifier que la publication existe
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Publication non trouvée' });
    }

    const comment = new Comment({
      post: postId,
      author: req.user.id,
      content: content.trim()
    });

    await comment.save();
    await comment.populate('author', 'username profilePicture');

    // Mettre à jour le compteur de commentaires de la publication
    post.commentsCount += 1;
    await post.save();

    // Créer une notification si ce n'est pas l'auteur qui commente
    if (post.author.toString() !== req.user.id) {
      const notification = new Notification({
        recipient: post.author,
        sender: req.user.id,
        type: 'comment',
        message: `${req.user.username} a commenté votre publication`,
        relatedPost: postId,
        relatedComment: comment._id
      });
      await notification.save();
    }

    res.status(201).json({
      message: 'Commentaire créé avec succès',
      comment
    });
  } catch (error) {
    console.error('Erreur lors de la création du commentaire:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir les commentaires d'une publication
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ post: postId })
      .populate('author', 'username profilePicture')
      .populate('replies.author', 'username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Comment.countDocuments({ post: postId });

    res.json({
      comments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalComments: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des commentaires:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Liker/Unliker un commentaire
const toggleCommentLike = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Commentaire non trouvé' });
    }

    const existingLike = comment.likes.find(like => like.user.toString() === userId);

    if (existingLike) {
      // Retirer le like
      comment.likes = comment.likes.filter(like => like.user.toString() !== userId);
      comment.likesCount = Math.max(0, comment.likesCount - 1);
    } else {
      // Ajouter le like
      comment.likes.push({ user: userId });
      comment.likesCount += 1;

      // Créer une notification si ce n'est pas l'auteur qui like
      if (comment.author.toString() !== userId) {
        const notification = new Notification({
          recipient: comment.author,
          sender: userId,
          type: 'like',
          message: `${req.user.username} a aimé votre commentaire`,
          relatedComment: commentId
        });
        await notification.save();
      }
    }

    await comment.save();

    res.json({
      message: existingLike ? 'Like retiré' : 'Commentaire liké',
      isLiked: !existingLike,
      likesCount: comment.likesCount
    });
  } catch (error) {
    console.error('Erreur lors du toggle like commentaire:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Répondre à un commentaire
const replyToComment = async (req, res) => {
  try {
    const { content } = req.body;
    const commentId = req.params.id;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Le contenu de la réponse est requis' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Commentaire non trouvé' });
    }

    const reply = {
      author: req.user.id,
      content: content.trim(),
      createdAt: new Date()
    };

    comment.replies.push(reply);
    await comment.save();
    await comment.populate('replies.author', 'username profilePicture');

    // Créer une notification si ce n'est pas l'auteur qui répond
    if (comment.author.toString() !== req.user.id) {
      const notification = new Notification({
        recipient: comment.author,
        sender: req.user.id,
        type: 'comment',
        message: `${req.user.username} a répondu à votre commentaire`,
        relatedComment: commentId
      });
      await notification.save();
    }

    res.status(201).json({
      message: 'Réponse ajoutée avec succès',
      reply: comment.replies[comment.replies.length - 1]
    });
  } catch (error) {
    console.error('Erreur lors de la réponse au commentaire:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un commentaire
const deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Commentaire non trouvé' });
    }

    // Vérifier que l'utilisateur est l'auteur
    if (comment.author.toString() !== userId) {
      return res.status(403).json({ message: 'Non autorisé à supprimer ce commentaire' });
    }

    // Mettre à jour le compteur de commentaires de la publication
    const post = await Post.findById(comment.post);
    if (post) {
      post.commentsCount = Math.max(0, post.commentsCount - 1);
      await post.save();
    }

    // Supprimer les notifications associées
    await Notification.deleteMany({ relatedComment: commentId });

    // Supprimer le commentaire
    await Comment.findByIdAndDelete(commentId);

    res.json({ message: 'Commentaire supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du commentaire:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Modifier un commentaire
const updateComment = async (req, res) => {
  try {
    const { content } = req.body;
    const commentId = req.params.id;
    const userId = req.user.id;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Le contenu du commentaire est requis' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Commentaire non trouvé' });
    }

    // Vérifier que l'utilisateur est l'auteur
    if (comment.author.toString() !== userId) {
      return res.status(403).json({ message: 'Non autorisé à modifier ce commentaire' });
    }

    comment.content = content.trim();
    comment.updatedAt = new Date();
    await comment.save();
    await comment.populate('author', 'username profilePicture');

    res.json({
      message: 'Commentaire modifié avec succès',
      comment
    });
  } catch (error) {
    console.error('Erreur lors de la modification du commentaire:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  createComment,
  getComments,
  toggleCommentLike,
  replyToComment,
  deleteComment,
  updateComment
};

