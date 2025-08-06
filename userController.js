const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// Obtenir le profil d'un utilisateur par ID
const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUserId = req.user?.id;

    const user = await User.findById(userId)
      .populate('followers', 'username profilePicture')
      .populate('following', 'username profilePicture');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'utilisateur actuel suit cet utilisateur
    const isFollowing = currentUserId ? 
      user.followers.some(follower => follower._id.toString() === currentUserId) : 
      false;

    // Obtenir les publications de l'utilisateur
    const posts = await Post.find({ author: userId, visibility: 'public' })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      user: {
        id: user._id,
        username: user.username,
        bio: user.bio,
        profilePicture: user.profilePicture,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        isFollowing,
        posts
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Suivre/Ne plus suivre un utilisateur
const toggleFollow = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous suivre vous-même' });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Ne plus suivre
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== targetUserId
      );
      targetUser.followers = targetUser.followers.filter(
        id => id.toString() !== currentUserId
      );
    } else {
      // Suivre
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);

      // Créer une notification
      const notification = new Notification({
        recipient: targetUserId,
        sender: currentUserId,
        type: 'follow',
        message: `${currentUser.username} a commencé à vous suivre`
      });
      await notification.save();
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      message: isFollowing ? 'Utilisateur non suivi' : 'Utilisateur suivi',
      isFollowing: !isFollowing,
      followersCount: targetUser.followers.length
    });
  } catch (error) {
    console.error('Erreur lors du toggle follow:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir les abonnés d'un utilisateur
const getFollowers = async (req, res) => {
  try {
    const userId = req.params.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId)
      .populate({
        path: 'followers',
        select: 'username profilePicture bio',
        options: {
          skip: skip,
          limit: parseInt(limit)
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const totalFollowers = await User.findById(userId).select('followers');
    const total = totalFollowers.followers.length;

    res.json({
      followers: user.followers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalFollowers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des abonnés:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir les abonnements d'un utilisateur
const getFollowing = async (req, res) => {
  try {
    const userId = req.params.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId)
      .populate({
        path: 'following',
        select: 'username profilePicture bio',
        options: {
          skip: skip,
          limit: parseInt(limit)
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const totalFollowing = await User.findById(userId).select('following');
    const total = totalFollowing.following.length;

    res.json({
      following: user.following,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalFollowing: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des abonnements:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Rechercher des utilisateurs
const searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Terme de recherche requis' });
    }

    const skip = (page - 1) * limit;

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } }
      ]
    })
    .select('username profilePicture bio followersCount followingCount isVerified')
    .sort({ followersCount: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await User.countDocuments({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } }
      ]
    });

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      searchTerm: q
    });
  } catch (error) {
    console.error('Erreur lors de la recherche d\'utilisateurs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir les publications d'un utilisateur
const getUserPosts = async (req, res) => {
  try {
    const userId = req.params.id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ 
      author: userId, 
      visibility: 'public' 
    })
    .populate('author', 'username profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Post.countDocuments({ 
      author: userId, 
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
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des publications:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir les suggestions d'utilisateurs à suivre
const getSuggestedUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { limit = 5 } = req.query;

    const currentUser = await User.findById(currentUserId).select('following');
    const followingIds = currentUser.following;

    // Trouver des utilisateurs populaires que l'utilisateur ne suit pas encore
    const suggestedUsers = await User.find({
      _id: { $nin: [...followingIds, currentUserId] }
    })
    .select('username profilePicture bio followersCount isVerified')
    .sort({ followersCount: -1 })
    .limit(parseInt(limit));

    res.json({ suggestedUsers });
  } catch (error) {
    console.error('Erreur lors de la récupération des suggestions:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  getUserProfile,
  toggleFollow,
  getFollowers,
  getFollowing,
  searchUsers,
  getUserPosts,
  getSuggestedUsers
};

