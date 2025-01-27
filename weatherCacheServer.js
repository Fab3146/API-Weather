const express = require('express');
const axios = require('axios');
const schedule = require('node-schedule');
const cors = require('cors'); // Import du middleware CORS

const app = express();
const PORT = process.env.PORT || 3000;

// Activer CORS
app.use(cors());

// Cache météo
let weatherCache = null;
let lastUpdated = null;

// Fonction pour récupérer les données météo
async function fetchWeather() {
  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat: 43.8208, // Latitude de Grisolles
        lon: 1.2981,  // Longitude de Grisolles
        appid: '21b1f141009d04a9c0b86b5060c6f031', // Votre clé API
        units: 'metric', // Unités métriques pour les températures en °C
        lang: 'fr'      // Langue française pour les descriptions
      }
    });

    // Mise en cache des données météo
    weatherCache = response.data;
    lastUpdated = new Date();
    console.log('Météo mise à jour:', weatherCache);
  } catch (error) {
    console.error('Erreur lors de la récupération des données météo:', error);
  }
}

// Planifier les mises à jour à 6h00 et 18h00
schedule.scheduleJob('0 6,18 * * *', fetchWeather);

// Appeler une fois au démarrage
fetchWeather();

// Route principale (optionnelle, pour test)
app.get('/', (req, res) => {
  res.send('Bienvenue sur l\'API Météo ! Utilisez /weather pour récupérer les données météo.');
});

// Route pour récupérer la météo
app.get('/weather', (req, res) => {
  if (!weatherCache) {
    return res.status(503).send('Les données météo ne sont pas encore disponibles. Réessayez plus tard.');
  }
  res.json({
    weather: weatherCache,
    lastUpdated
  });
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`Serveur météo démarré sur le port ${PORT}`);
});
