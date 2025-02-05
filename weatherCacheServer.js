const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 10000;
const API_KEY = '21b1f141009d04a9c0b86b5060c6f031'; // Clé API OpenWeather
const LAT = 43.8208; // Latitude de Grisolles
const LON = 1.2981; // Longitude de Grisolles
const CACHE_FILE = path.join(__dirname, 'weatherData.json');

app.use(cors());

// Stockage en cache
let weatherCache = {};
let lastUpdated = null;

// ✅ Charger les données en cache au démarrage
const loadCache = () => {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      const data = fs.readFileSync(CACHE_FILE, 'utf-8');
      const parsedData = JSON.parse(data);
      weatherCache = parsedData.weather;
      lastUpdated = parsedData.lastUpdated;
      console.log("✅ Cache météo chargé depuis le fichier.");
    } catch (err) {
      console.error("⚠️ Erreur lors du chargement du cache météo :", err);
    }
  }
};

loadCache(); // Charger les données au démarrage

// ✅ Sauvegarder les nouvelles données en cache
const saveCache = () => {
  fs.writeFileSync(CACHE_FILE, JSON.stringify({ weather: weatherCache, lastUpdated }, null, 2), 'utf-8');
  console.log("💾 Cache météo sauvegardé.");
};

// ✅ Récupérer les données météo (actuelles + prévisions sur 3 jours)
const fetchWeatherData = async () => {
  try {
    console.log("🌍 Mise à jour des données météo...");

    const currentWeather = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric&lang=fr`
    );

    const forecastWeather = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric&lang=fr`
    );

    // ✅ Filtrer les prévisions pour avoir une seule valeur par jour à midi
    const dailyForecasts = forecastWeather.data.list.filter((item) =>
      item.dt_txt.includes('12:00:00')
    ).slice(0, 3); // Récupérer les prévisions pour 3 jours

    weatherCache = {
      current: {
        name: currentWeather.data.name,
        temp: Math.round(currentWeather.data.main.temp),
        humidity: currentWeather.data.main.humidity,
        icon: currentWeather.data.weather[0].icon,
        description: currentWeather.data.weather[0].description,
      },
      forecast: dailyForecasts.map((day) => ({
        date: day.dt_txt,
        temp: Math.round(day.main.temp),
        humidity: day.main.humidity,
        icon: day.weather[0].icon,
        description: day.weather[0].description,
      })),
    };

    lastUpdated = new Date().toISOString();
    saveCache(); // Sauvegarder les données en cache
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des données météo:', error);
  }
};

// ✅ Route pour récupérer les données météo
app.get('/weather', (req, res) => {
  if (!weatherCache.current || !weatherCache.forecast) {
    return res.status(500).json({ error: 'Données météo non disponibles.' });
  }

  res.json({
    weather: weatherCache,
    lastUpdated,
  });
});

// ✅ Programmer les mises à jour à 8h et 18h
const scheduleWeatherUpdates = () => {
  const now = new Date();
  const nextUpdateHour = now.getHours() < 8 ? 8 : 18;
  const nextUpdate = new Date();
  nextUpdate.setHours(nextUpdateHour, 0, 0, 0);

  const timeUntilNextUpdate = nextUpdate - now;
  setTimeout(() => {
    fetchWeatherData();
    setInterval(fetchWeatherData, 12 * 60 * 60 * 1000); // Mise à jour toutes les 12h
  }, timeUntilNextUpdate);
};

scheduleWeatherUpdates(); // Lancer la programmation des mises à jour
fetchWeatherData(); // Mise à jour initiale au démarrage

// ✅ Lancer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur météo démarré sur le port ${PORT}`);
});

