const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const { getUrlPreview, isYouTubeUrl, getYouTubeVideoId } = require('../utils/urlPreview');
const path = require('path');

// Créer une publication avec fichier
const createPostWithFile = async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    
    if (!title || !req.file) {
      return res.status(400).json({ message: 'Titre et fichier requis' });
    }

    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];

    const post = new Post({
      author: req.user.id,
      title,
      description: description || '',
      content: {
        type: 'file',
        data: req.file.path,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      },
      tags: tagsArray
    });

    await post.save();
    await post.populate('author', 'username profilePicture');

    res.status(201).json({
      message: 'Publication créée avec succès',
      post
    });
  } catch (error) {
    console.error('Erreur lors de la création de la publication:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Créer une publication avec URL
const createPostWithUrl = async (req, res) => {
  try {
    const { title, description, url, tags } = req.body;
    
    if (!title || !url) {
      return res.status(400).json({ message: 'Titre et URL requis' });
    }

    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];

    // Générer l'aperçu de l'URL
    const preview = await getUrlPreview(url);

    // Traitement spécial pour YouTube
    if (isYouTubeUrl(url)) {
      const videoId = getYouTubeVideoId(url);
      preview.image = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }

    const post = new Post({
      author: req.user.id,
      title,
      description: description || '',
      content: {
        type: 'url',
        data: url,
        preview
      },
      tags: tagsArray
    });

    await post.save();
    await post.populate('author', 'username profilePicture');

    res.status(201).json({
      message: 'Publication créée avec succès',
      post
    });
  } catch (error) {
    console.error('Erreur lors de la création de la publication:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir toutes les publications (fil d'actualité)
const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'recent', author, tag } = req.query;
    const skip = (page - 1) * limit;

    // Construire le filtre
    const filter = { visibility: 'public' };
    if (author) filter.author = author;
    if (tag) filter.tags = { $in: [tag] };

    // Définir l'ordre de tri
    let sortOption = { createdAt: -1 }; // Par défaut: plus récent
    if (sort === 'popular') {
      sortOption = { likesCount: -1, createdAt: -1 };
    }

    const posts = await Post.find(filter)
      .populate('author', 'username profilePicture')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(filter);

    res.json({
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des publications:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir une publication par ID
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username profilePicture')
      .populate('likes.user', 'username profilePicture');

    if (!post) {
      return res.status(404).json({ message: 'Publication non trouvée' });
    }

    res.json({ post });
  } catch (error) {
    console.error('Erreur lors de la récupération de la publication:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Liker/Unliker une publication
const toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Publication non trouvée' });
    }

    const existingLike = post.likes.find(like => like.user.toString() === userId);

    if (existingLike) {
      // Retirer le like
      post.likes = post.likes.filter(like => like.user.toString() !== userId);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      // Ajouter le like
      post.likes.push({ user: userId });
      post.likesCount += 1;

      // Créer une notification si ce n'est pas l'auteur qui like
      if (post.author.toString() !== userId) {
        const notification = new Notification({
          recipient: post.author,
          sender: userId,
          type: 'like',
          message: `${req.user.username} a aimé votre publication`,
          relatedPost: postId
        });
        await notification.save();
      }
    }

    await post.save();

    res.json({
      message: existingLike ? 'Like retiré' : 'Publication likée',
      isLiked: !existingLike,
      likesCount: post.likesCount
    });
  } catch (error) {
    console.error('Erreur lors du toggle like:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Partager une publication
const sharePost = async (req, res) => {
  try {
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Publication non trouvée' });
    }

    post.sharesCount += 1;
    await post.save();

    // Créer une notification si ce n'est pas l'auteur qui partage
    if (post.author.toString() !== req.user.id) {
      const notification = new Notification({
        recipient: post.author,
        sender: req.user.id,
        type: 'share',
        message: `${req.user.username} a partagé votre publication`,
        relatedPost: postId
      });
      await notification.save();
    }

    const shareUrl = `${req.protocol}://${req.get('host')}/post/${postId}`;

    res.json({
      message: 'Publication partagée',
      shareUrl,
      sharesCount: post.sharesCount
    });
  } catch (error) {
    console.error('Erreur lors du partage:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer une publication
const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Publication non trouvée' });
    }

    // Vérifier que l'utilisateur est l'auteur
    if (post.author.toString() !== userId) {
      return res.status(403).json({ message: 'Non autorisé à supprimer cette publication' });
    }

    // Supprimer les commentaires associés
    await Comment.deleteMany({ post: postId });

    // Supprimer les notifications associées
    await Notification.deleteMany({ relatedPost: postId });

    // Supprimer la publication
    await Post.findByIdAndDelete(postId);

    res.json({ message: 'Publication supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Rechercher des publications
const searchPosts = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Terme de recherche requis' });
    }

    const skip = (page - 1) * limit;

    const posts = await Post.find({
      $text: { $search: q },
      visibility: 'public'
    })
    .populate('author', 'username profilePicture')
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Post.countDocuments({
      $text: { $search: q },
      visibility: 'public'
    });

    res.json({
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      searchTerm: q
    });
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  createPostWithFile,
  createPostWithUrl,
  getPosts,
  getPostById,
  toggleLike,
  sharePost,
  deletePost,
  searchPosts
};

