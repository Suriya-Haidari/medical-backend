import express from "express";
const router = express.Router();

import {
  getWeatherData,
  getWeatherDataByCoordinates,
} from "../utils/weatherData.js";

router.get("/", async (req, res) => {
  const { city, lat, lon } = req.query;

  try {
    let weatherData;
    if (lat && lon) {
      // Fetch weather data using coordinates
      weatherData = await getWeatherDataByCoordinates(lat, lon);
    } else if (city) {
      // Fetch weather data using city name
      weatherData = await getWeatherData(city);
    } else {
      return res.status(400).send("City or coordinates are required.");
    }

    res.json(weatherData);
  } catch (error) {
    res.status(500).send(`Error fetching weather data: ${error.message}`);
  }
});

export default router;
