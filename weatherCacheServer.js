const express = require('express');
const axios = require('axios');
const schedule = require('node-schedule');

// Configuration
const API_KEY = 'f7232d4548a6bf5521ebc11a405e1301'; // Clé API Weatherstack
const LATITUDE = 43.8205; // Latitude de Grisolles
const LONGITUDE = 1.2997; // Longitude de Grisolles
const API_URL = `http://api.weatherstack.com/current?access_key=${API_KEY}&query=${LATITUDE},${LONGITUDE}`;

let weatherCache = null; // Cache pour les données météo
let lastUpdated = null; // Horodatage de la dernière mise à jour

// Fonction pour récupérer les données météo depuis Weatherstack
async function fetchWeatherData() {
  try {
    const response = await axios.get(API_URL);

    if (response.status === 200 && response.data.current) {
      weatherCache = response.data; // Mettre à jour le cache
      lastUpdated = new Date(); // Mettre à jour l'horodatage
      console.log(`[${new Date().toISOString()}] Météo mise à jour avec succès.`);
    } else {
      console.error(`[${new Date().toISOString()}] Erreur API:`, response.data.error || 'Réponse invalide.');
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erreur lors de la requête API:`, error.message);
  }
}

// Planification des appels API : tous les jours à 6h et 18h
schedule.scheduleJob('0 6,18 * * *', fetchWeatherData);

// Lancer une première récupération au démarrage
fetchWeatherData();

// Initialiser un serveur Express
const app = express();

// Route pour récupérer les données météo en cache
app.get('/weather', (req, res) => {
  if (weatherCache) {
    res.json({
      success: true,
      data: weatherCache,
      lastUpdated: lastUpdated,
    });
  } else {
    res.status(503).json({
      success: false,
      message: 'Les données météo ne sont pas encore disponibles.',
    });
  }
});

// Démarrer le serveur
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur météo lancé sur le port ${PORT}`);
});