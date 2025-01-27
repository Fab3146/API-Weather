const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 10000;
const API_KEY = '21b1f141009d04a9c0b86b5060c6f031'; // Clé API OpenWeather
const LAT = 43.8208; // Latitude de Grisolles
const LON = 1.2981; // Longitude de Grisolles

app.use(cors());

// Stockage en cache
let weatherCache = {};
let lastUpdated = null;

// Fonction pour récupérer les données météo (actuelles + prévisions sur 3 jours)
const fetchWeatherData = async () => {
  try {
    const currentWeather = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric&lang=fr`
    );

    const forecastWeather = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric&lang=fr`
    );

    // Filtrage des prévisions pour avoir une prévision par jour à midi
    const dailyForecasts = forecastWeather.data.list.filter((item) =>
      item.dt_txt.includes('12:00:00')
    ).slice(0, 3); // On prend les 3 prochains jours

    weatherCache = {
      current: currentWeather.data,
      forecast: dailyForecasts
    };

    lastUpdated = new Date().toISOString();
    console.log('Météo mise à jour:', weatherCache);
  } catch (error) {
    console.error('Erreur lors de la récupération des données météo:', error);
  }
};

// Point d'entrée pour récupérer les données météo
app.get('/weather', (req, res) => {
  if (!weatherCache.current || !weatherCache.forecast) {
    return res.status(500).json({ error: 'Données météo non disponibles.' });
  }

  res.json({
    weather: weatherCache,
    lastUpdated
  });
});

// Mettre à jour les données météo toutes les heures
setInterval(fetchWeatherData, 60 * 60 * 1000); // Toutes les 60 minutes
fetchWeatherData(); // Mise à jour initiale

app.listen(PORT, () => {
  console.log(`Serveur météo démarré sur le port ${PORT}`);
});
