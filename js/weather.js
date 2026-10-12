// Session 11: geocode a city first, then request weather for its coordinates.
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

async function getJSON(url) {
  // fetch also resolves on HTTP errors, so check the status before reading JSON.
  // loadWeather is awaited inside main.js's try/catch, which handles rejections.
  const response = await fetch(url);
  if (response.status === 429) throw new Error("rate-limit");
  if (response.status >= 500) throw new Error("server-error");
  if (response.status !== 200) throw new Error("request-error");
  return await response.json();
}

export async function loadWeather(city) {
  // URLSearchParams safely encodes spaces, accents, and punctuation in city names.
  const query = new URLSearchParams({ name: city, count: 1, language: "en", format: "json" });
  const geo = await getJSON(`${GEO_URL}?${query}`);
  if (!geo.results?.length) throw new Error("not-found");

  const location = geo.results[0];
  if (typeof location.latitude !== "number" || typeof location.longitude !== "number" || !location.name) {
    throw new Error("incomplete-data");
  }

  const params = new URLSearchParams({
    latitude: location.latitude,
    longitude: location.longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "auto",
    forecast_days: 3,
    temperature_unit: "celsius",
    wind_speed_unit: "kmh"
  });
  const data = await getJSON(`${WEATHER_URL}?${params}`);

  // Do not turn missing/null values into misleading zero-degree readings.
  const current = data.current;
  if (!current || typeof current.time !== "string" || current.time.length < 16 ||
      typeof current.temperature_2m !== "number" || typeof current.apparent_temperature !== "number" ||
      typeof current.relative_humidity_2m !== "number" || typeof current.wind_speed_10m !== "number" ||
      typeof current.weather_code !== "number") {
    throw new Error("incomplete-data");
  }

  if (data.daily?.time?.length !== 3) throw new Error("incomplete-data");
  data.daily.time.forEach((day, i) => {
    if (typeof day !== "string" || typeof data.daily.temperature_2m_max?.[i] !== "number" ||
        typeof data.daily.temperature_2m_min?.[i] !== "number" || typeof data.daily.weather_code?.[i] !== "number") {
      throw new Error("incomplete-data");
    }
  });
  return { location, current, daily: data.daily };
}

export function friendlyError(error, city) {
  if (error.message === "not-found") return `We couldn't find “${city}”. Check the spelling or try a nearby city.`;
  if (error.message === "rate-limit") return "Too many requests. Please wait a minute, then try again.";
  if (error.message === "server-error") return "The weather service is temporarily unavailable. Please try again shortly.";
  if (error.message === "request-error") return "The weather service couldn't complete that request. Please try again.";
  if (error.message === "incomplete-data") return "The weather service returned incomplete data. Please try again shortly.";
  return "We couldn't load the weather. Check your internet connection and try again.";
}
