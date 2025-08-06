# Guide de Déploiement DJONA

Ce guide vous explique comment déployer l'application DJONA en production.

## 🚀 Options de Déploiement

### Backend

#### Option 1: Render
1. Créer un compte sur [Render](https://render.com)
2. Connecter votre repository GitHub
3. Créer un nouveau Web Service
4. Configurer les variables d'environnement :
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/djona
   JWT_SECRET=your_super_secret_jwt_key
   PORT=5000
   ```
5. Définir la commande de build : `npm install`
6. Définir la commande de start : `npm start`
7. Déployer

#### Option 2: Railway
1. Créer un compte sur [Railway](https://railway.app)
2. Créer un nouveau projet depuis GitHub
3. Ajouter les variables d'environnement
4. Railway détectera automatiquement votre application Node.js

#### Option 3: Heroku
1. Installer Heroku CLI
2. Créer une nouvelle app : `heroku create djona-backend`
3. Configurer les variables d'environnement :
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set JWT_SECRET=your_jwt_secret
   ```
4. Déployer : `git push heroku main`

### Frontend

#### Option 1: Vercel
1. Installer Vercel CLI : `npm i -g vercel`
2. Dans le dossier frontend : `vercel`
3. Configurer les variables d'environnement :
   ```
   REACT_APP_API_URL=https://your-backend-url.com
   ```
4. Déployer : `vercel --prod`

#### Option 2: Netlify
1. Créer un compte sur [Netlify](https://netlify.com)
2. Connecter votre repository
3. Configurer les paramètres de build :
   - Build command: `npm run build`
   - Publish directory: `build`
4. Ajouter les variables d'environnement
5. Déployer

### Base de Données

#### MongoDB Atlas (Recommandé)
1. Créer un compte sur [MongoDB Atlas](https://cloud.mongodb.com)
2. Créer un nouveau cluster
3. Configurer l'accès réseau (autoriser toutes les IPs : 0.0.0.0/0)
4. Créer un utilisateur de base de données
5. Obtenir la chaîne de connexion
6. Remplacer `MONGODB_URI` dans vos variables d'environnement

## 🔧 Configuration de Production

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/djona?retryWrites=true&w=majority
JWT_SECRET=your_super_secure_jwt_secret_key_at_least_32_characters_long
```

### Frontend (.env)
```env
REACT_APP_API_URL=https://your-backend-domain.com
```

## 📋 Checklist de Déploiement

### Avant le Déploiement

- [ ] Tester l'application localement
- [ ] Vérifier que toutes les variables d'environnement sont configurées
- [ ] S'assurer que MongoDB Atlas est configuré
- [ ] Tester les connexions à la base de données
- [ ] Vérifier les CORS pour permettre les requêtes du frontend
- [ ] Optimiser les images et assets
- [ ] Minifier le code JavaScript/CSS

### Backend

- [ ] Configurer les variables d'environnement
- [ ] Vérifier que le port est configuré dynamiquement
- [ ] S'assurer que CORS autorise le domaine du frontend
- [ ] Tester les endpoints API
- [ ] Configurer les logs pour la production
- [ ] Vérifier la sécurité (rate limiting, validation, etc.)

### Frontend

- [ ] Configurer l'URL de l'API backend
- [ ] Optimiser le bundle (code splitting, lazy loading)
- [ ] Configurer les redirections pour le routing côté client
- [ ] Tester la responsivité sur différents appareils
- [ ] Vérifier les performances (Lighthouse)
- [ ] Configurer les meta tags pour le SEO

### Post-Déploiement

- [ ] Tester toutes les fonctionnalités en production
- [ ] Vérifier les logs d'erreur
- [ ] Tester la messagerie temps réel
- [ ] Vérifier les uploads de fichiers
- [ ] Tester l'authentification
- [ ] Configurer la surveillance (monitoring)

## 🔒 Sécurité en Production

### Variables d'Environnement
- Utiliser des secrets forts pour JWT_SECRET (minimum 32 caractères)
- Ne jamais exposer les clés secrètes dans le code
- Utiliser HTTPS en production

### Base de Données
- Configurer l'authentification MongoDB
- Limiter l'accès réseau aux IPs nécessaires
- Utiliser des connexions chiffrées (SSL/TLS)

### API
- Implémenter le rate limiting
- Valider toutes les entrées utilisateur
- Utiliser HTTPS uniquement
- Configurer les en-têtes de sécurité

## 🚨 Dépannage

### Erreurs Communes

#### Backend ne démarre pas
- Vérifier les variables d'environnement
- Vérifier la connexion à MongoDB
- Consulter les logs du serveur

#### Frontend ne peut pas se connecter au backend
- Vérifier l'URL de l'API dans les variables d'environnement
- Vérifier la configuration CORS du backend
- Vérifier que le backend est accessible

#### Socket.IO ne fonctionne pas
- Vérifier que les transports WebSocket sont autorisés
- Vérifier la configuration CORS pour Socket.IO
- Tester avec les transports de fallback

#### Uploads de fichiers échouent
- Vérifier les limites de taille de fichier
- Vérifier les permissions du dossier uploads
- Configurer le stockage cloud si nécessaire

## 📊 Monitoring et Maintenance

### Logs
- Configurer des logs structurés
- Utiliser des services comme LogRocket ou Sentry
- Surveiller les erreurs 500 et les timeouts

### Performance
- Utiliser des outils comme New Relic ou DataDog
- Surveiller l'utilisation de la mémoire et du CPU
- Optimiser les requêtes de base de données

### Sauvegardes
- Configurer des sauvegardes automatiques de MongoDB
- Tester régulièrement la restauration
- Documenter les procédures de récupération

## 🔄 Mise à Jour

### Déploiement Continu
1. Configurer GitHub Actions ou GitLab CI
2. Automatiser les tests avant déploiement
3. Déployer automatiquement après merge sur main
4. Configurer les rollbacks en cas d'erreur

### Exemple GitHub Actions (.github/workflows/deploy.yml)
```yaml
name: Deploy DJONA

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        # Configuration spécifique à votre service

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        # Configuration spécifique à Vercel
```

## 📞 Support

En cas de problème lors du déploiement :
1. Consulter les logs de l'application
2. Vérifier la documentation des services utilisés
3. Tester localement avec les mêmes variables d'environnement
4. Contacter le support technique si nécessaire

