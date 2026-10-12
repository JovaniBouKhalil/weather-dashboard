import { getCondition } from "./conditions.js";

// Sessions 8 and 9: cache selectors, and keep page updates in one module.
const searchButton = document.querySelector("#search-button");
const cityInput = document.querySelector("#city-input");
const cityButtons = document.querySelectorAll(".city-button");
const feedback = document.querySelector("#feedback");
const statusMessage = document.querySelector("#status-message");
const retryButton = document.querySelector("#retry-button");
const loadingDot = document.querySelector("#loading-dot");
const emptyState = document.querySelector("#empty-state");
const results = document.querySelector("#weather-results");
const locationName = document.querySelector("#location-name");
const locationRegion = document.querySelector("#location-region");
const temperature = document.querySelector("#temperature");
const weatherIcon = document.querySelector("#weather-icon");
const description = document.querySelector("#weather-description");
const dayPeriod = document.querySelector("#day-period");
const observationTime = document.querySelector("#observation-time");
const feelsLike = document.querySelector("#feels-like");
const humidity = document.querySelector("#humidity");
const windSpeed = document.querySelector("#wind-speed");
const forecastList = document.querySelector("#forecast-list");

function setVisible(element, visible) {
  if (visible) element.classList.remove("is-hidden");
  else element.classList.add("is-hidden");
}

export function setStatus(state, message, canRetry = false) {
  feedback.dataset.state = state;
  statusMessage.textContent = message;
  const loading = state === "loading";
  searchButton.disabled = loading;
  cityInput.disabled = loading;
  cityButtons.forEach(button => { button.disabled = loading; });
  searchButton.textContent = loading ? "Checking weather…" : "Check weather ↗";
  setVisible(loadingDot, loading);
  setVisible(retryButton, state === "error" && canRetry);
  setVisible(results, state === "success");
  setVisible(emptyState, state !== "success");
}

export function renderWeather(data) {
  const { location, current, daily } = data;
  const condition = getCondition(current.weather_code, current.is_day);

  // API text always uses textContent, never innerHTML (Session 11).
  locationName.textContent = location.name;
  locationRegion.textContent = location.admin1 && location.admin1 !== location.name
    ? `${location.admin1}, ${location.country || ""}` : location.country || "";
  temperature.textContent = `${Math.round(current.temperature_2m)}°C`;
  weatherIcon.textContent = condition.icon;
  weatherIcon.setAttribute("aria-label", condition.description);
  description.textContent = condition.description;
  dayPeriod.textContent = current.is_day === 0 ? "NIGHTTIME" : "DAYTIME";
  feelsLike.textContent = `${Math.round(current.apparent_temperature)}°C`;
  humidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
  windSpeed.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  // The API supplies city-local ISO time. Display it without a browser-timezone conversion.
  observationTime.textContent = `Updated ${current.time} · city local time`;

  // map creates cards from this response; replaceChildren removes the previous city's cards.
  const labels = ["Today", "Tomorrow", "Next day"];
  const cards = daily.time.map((day, i) => {
    const outlook = getCondition(daily.weather_code[i]);
    const card = document.createElement("li");
    card.classList.add("forecast-card");

    const heading = document.createElement("h3");
    heading.textContent = labels[i];
    const date = document.createElement("p");
    date.classList.add("forecast-date");
    date.textContent = day;
    const icon = document.createElement("span");
    icon.classList.add("forecast-icon");
    icon.textContent = outlook.icon;
    icon.setAttribute("role", "img");
    icon.setAttribute("aria-label", outlook.description);
    const text = document.createElement("p");
    text.classList.add("forecast-description");
    text.textContent = outlook.description;
    const temperatures = document.createElement("p");
    temperatures.classList.add("forecast-temperatures");
    temperatures.textContent = `High ${Math.round(daily.temperature_2m_max[i])}° / Low ${Math.round(daily.temperature_2m_min[i])}°`;

    card.append(heading, date, icon, text, temperatures);
    return card;
  });
  forecastList.replaceChildren(...cards);
}
