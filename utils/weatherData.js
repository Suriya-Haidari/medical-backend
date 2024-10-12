import axios from "axios";

// Function to fetch weather data by city name
const getWeatherData = async (city) => {
  const apiKey = process.env.OPEN_WEATHER_MAP_SECRET_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw new Error(`Unable to fetch data: ${error.message}`);
  }
};

// Function to fetch weather data by coordinates (latitude, longitude)
const getWeatherDataByCoordinates = async (lat, lon) => {
  const apiKey = process.env.OPEN_WEATHER_MAP_SECRET_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw new Error(`Unable to fetch data: ${error.message}`);
  }
};

export { getWeatherData, getWeatherDataByCoordinates };
