# DJONA - Plateforme Sociale Interactive

DJONA est une plateforme sociale moderne développée avec React.js, Node.js/Express, MongoDB, JWT et Socket.IO.

## 🚀 Fonctionnalités

### Authentification
- Inscription et connexion sécurisées avec JWT
- Gestion des sessions utilisateur
- Middleware d'authentification

### Publications
- Création de publications via upload de fichiers ou URLs externes
- Support des images, vidéos, documents et liens
- Aperçu automatique des URLs (YouTube, articles, etc.)
- Système de tags pour catégoriser le contenu

### Interactions Sociales
- Système de likes avec compteurs
- Commentaires avec réponses
- Partage de publications avec liens copiables
- Système de signalement (optionnel)

### Messagerie Temps Réel
- Messagerie privée entre utilisateurs
- Envoi de texte et fichiers
- Indicateurs de frappe en temps réel
- Historique des conversations
- Notifications de messages non lus

### Profils Utilisateurs
- Pages de profil personnalisées
- Système de suivi (suivre/se désabonner)
- Affichage des publications, likes et commentaires
- Suggestions d'utilisateurs à suivre

### Notifications
- Notifications en temps réel (likes, commentaires, nouveaux messages)
- Menu déroulant des notifications
- Compteur de notifications non lues

### Recherche
- Recherche de publications par mots-clés
- Recherche d'utilisateurs
- Filtrage par type de contenu et tags

## 🛠️ Technologies Utilisées

### Backend
- **Node.js** - Environnement d'exécution JavaScript
- **Express.js** - Framework web pour Node.js
- **MongoDB** - Base de données NoSQL
- **Mongoose** - ODM pour MongoDB
- **JWT** - Authentification par tokens
- **Socket.IO** - Communication temps réel
- **Multer** - Gestion des uploads de fichiers
- **Bcrypt** - Hachage des mots de passe

### Frontend
- **React.js** - Bibliothèque UI
- **React Query** - Gestion des données asynchrones
- **React Router** - Navigation côté client
- **Tailwind CSS** - Framework CSS utilitaire
- **Socket.IO Client** - Communication temps réel
- **Axios** - Client HTTP

## 📁 Structure du Projet

```
DJONA/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── postController.js
│   │   ├── commentController.js
│   │   ├── userController.js
│   │   ├── notificationController.js
│   │   └── messageController.js
│   ├── middlewares/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Comment.js
│   │   ├── Conversation.js
│   │   ├── Message.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── posts.js
│   │   ├── comments.js
│   │   ├── users.js
│   │   ├── notifications.js
│   │   └── messages.js
│   ├── utils/
│   │   └── urlPreview.js
│   ├── uploads/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## 🚀 Installation et Démarrage

### Prérequis
- Node.js (v14 ou supérieur)
- MongoDB (local ou Atlas)
- npm ou yarn

### Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd DJONA
```

2. **Installer les dépendances du backend**
```bash
cd backend
npm install
```

3. **Installer les dépendances du frontend**
```bash
cd ../frontend
npm install
```

4. **Configuration de l'environnement**

Créer un fichier `.env` dans le dossier `backend` :
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/djona
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

### Démarrage

1. **Démarrer MongoDB** (si local)
```bash
mongod
```

2. **Démarrer le backend**
```bash
cd backend
npm run dev
```

3. **Démarrer le frontend** (dans un nouveau terminal)
```bash
cd frontend
npm start
```

L'application sera accessible sur :
- Frontend : http://localhost:3000
- Backend API : http://localhost:5000/api

## 📚 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/profile` - Profil utilisateur
- `PUT /api/auth/profile` - Mise à jour du profil

### Publications
- `GET /api/posts` - Liste des publications
- `POST /api/posts/file` - Créer avec fichier
- `POST /api/posts/url` - Créer avec URL
- `GET /api/posts/:id` - Détails d'une publication
- `POST /api/posts/:id/like` - Liker/Unliker
- `POST /api/posts/:id/share` - Partager
- `DELETE /api/posts/:id` - Supprimer

### Commentaires
- `GET /api/comments/:postId` - Commentaires d'une publication
- `POST /api/comments/:postId` - Créer un commentaire
- `POST /api/comments/:id/like` - Liker un commentaire
- `POST /api/comments/:id/reply` - Répondre à un commentaire

### Utilisateurs
- `GET /api/users/:id` - Profil utilisateur
- `POST /api/users/:id/follow` - Suivre/Ne plus suivre
- `GET /api/users/search` - Rechercher des utilisateurs

### Messages
- `GET /api/messages/conversations` - Liste des conversations
- `POST /api/messages/conversations` - Créer une conversation
- `GET /api/messages/:conversationId` - Messages d'une conversation
- `POST /api/messages/:conversationId` - Envoyer un message

### Notifications
- `GET /api/notifications` - Liste des notifications
- `PUT /api/notifications/:id/read` - Marquer comme lue
- `DELETE /api/notifications/:id` - Supprimer

## 🔧 Configuration Avancée

### Variables d'Environnement

**Backend (.env)**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/djona
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development
```

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:5000
```

### Déploiement

#### Backend (Render/Railway)
1. Configurer les variables d'environnement
2. Utiliser MongoDB Atlas pour la base de données
3. Déployer le dossier `backend`

#### Frontend (Vercel/Netlify)
1. Configurer `REACT_APP_API_URL` avec l'URL du backend
2. Déployer le dossier `frontend`

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👥 Équipe

Développé par l'équipe DJONA

## 🐛 Signaler un Bug

Pour signaler un bug, veuillez ouvrir une issue sur GitHub avec :
- Description détaillée du problème
- Steps pour reproduire
- Environnement (OS, navigateur, versions)
- Screenshots si applicable

## 📈 Roadmap

- [ ] Application mobile (React Native)
- [ ] Notifications push
- [ ] Stories temporaires
- [ ] Appels vidéo/audio
- [ ] Groupes et communautés
- [ ] Monétisation et publicités
- [ ] Analytics avancées
- [ ] Mode sombre
- [ ] Support multilingue

