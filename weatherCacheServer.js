const express = require('express');
const axios = require('axios');
const schedule = require('node-schedule');

const app = express();
const PORT = process.env.PORT || 3000;

// Cache météo
let weatherCache = null;
let lastUpdated = null;

// Fonction pour récupérer les données météo
async function fetchWeather() {
  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        q: 'Paris',
        appid: 'VOTRE_API_KEY', // Remplacez par votre clé API OpenWeatherMap
        units: 'metric',
        lang: 'fr'
      }
    });
    weatherCache = response.data;
    lastUpdated = new Date();
    console.log('Météo mise à jour:', weatherCache);
  } catch (error) {
    console.error('Erreur lors de la récupération des données météo:', error);
  }
}

// Mettre à jour les données toutes les heures
schedule.scheduleJob('0 * * * *', fetchWeather);

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
