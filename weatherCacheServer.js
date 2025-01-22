const express = require('express');
const axios = require('axios');
const schedule = require('node-schedule');

const app = express();
const PORT = process.env.PORT || 3000;

let weatherCache = null;

// Fonction pour récupérer les données météo
async function fetchWeather() {
  try {
    console.log("Fetching weather data...");
    const response = await axios.get('https://api.worldweatheronline.com/premium/v1/weather.ashx', {
      params: {
        key: 'YOUR_API_KEY',
        q: '43.82,1.30',
        format: 'json',
      },
    });
    weatherCache = response.data;
    console.log("Weather data updated successfully!");
  } catch (error) {
    console.error("Error fetching weather data:", error.message);
  }
}

// Planifier deux mises à jour par jour (6h00 et 18h00)
schedule.scheduleJob('0 6,18 * * *', fetchWeather);

// Appeler immédiatement au démarrage (optionnel)
fetchWeather();

// Endpoint pour fournir les données météo
app.get('/weather', (req, res) => {
  if (weatherCache) {
    res.json({
      success: true,
      data: weatherCache,
    });
  } else {
    res.json({
      success: false,
      message: "Les données météo ne sont pas encore disponibles. Réessayez plus tard.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
