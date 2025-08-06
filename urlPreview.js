const axios = require('axios');

const getUrlPreview = async (url) => {
  try {
    // Vérifier si l'URL est valide
    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlRegex.test(url)) {
      throw new Error('URL invalide');
    }
    
    // Ajouter https:// si le protocole manque
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    
    // Récupérer le contenu HTML
    const response = await axios.get(fullUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = response.data;
    
    // Extraire les métadonnées
    const preview = {
      url: fullUrl,
      title: extractMetaTag(html, 'og:title') || extractTitle(html) || 'Sans titre',
      description: extractMetaTag(html, 'og:description') || extractMetaTag(html, 'description') || '',
      image: extractMetaTag(html, 'og:image') || extractMetaTag(html, 'twitter:image') || '',
      siteName: extractMetaTag(html, 'og:site_name') || extractDomain(fullUrl)
    };
    
    return preview;
  } catch (error) {
    console.error('Erreur lors de la génération de l\'aperçu:', error.message);
    
    // Retourner un aperçu basique en cas d'erreur
    return {
      url: url,
      title: extractDomain(url),
      description: 'Aperçu non disponible',
      image: '',
      siteName: extractDomain(url)
    };
  }
};

const extractMetaTag = (html, property) => {
  const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
  const match = html.match(regex);
  return match ? match[1] : null;
};

const extractTitle = (html) => {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : null;
};

const extractDomain = (url) => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return url;
  }
};

// Détecter si l'URL est une vidéo YouTube
const isYouTubeUrl = (url) => {
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  return youtubeRegex.test(url);
};

// Extraire l'ID de la vidéo YouTube
const getYouTubeVideoId = (url) => {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
};

module.exports = {
  getUrlPreview,
  isYouTubeUrl,
  getYouTubeVideoId
};

