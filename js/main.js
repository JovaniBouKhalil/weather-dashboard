import { loadWeather, friendlyError } from "./weather.js";
import { renderWeather, setStatus } from "./render.js";

// Session 9: the entry module connects events to the API and rendering modules.
const form = document.querySelector("#search-form");
const input = document.querySelector("#city-input");
const retryButton = document.querySelector("#retry-button");
const cityButtons = document.querySelectorAll(".city-button");
let lastCity = "";
let loading = false;
let requestId = 0;

async function searchWeather(city) {
  // trim rejects whitespace-only input before spending a network request.
  const query = city.trim();
  if (loading) return;
  if (query.length < 2) {
    setStatus("error", "Please enter a city name with at least two characters.");
    return;
  }

  lastCity = query;
  loading = true;
  const thisRequest = ++requestId;
  setStatus("loading", `Looking up weather for ${query}…`);

  // Session 10 timers: recover after 15 seconds, even if the server never answers.
  // A request number ignores late responses, so they cannot replace a newer search.
  const timeout = setTimeout(() => {
    if (thisRequest !== requestId) return;
    requestId++;
    loading = false;
    setStatus("error", "The weather service took too long to respond. Please try again.", true);
  }, 15000);

  // Every fetch in loadWeather is awaited within this try/catch boundary.
  try {
    const data = await loadWeather(query);
    if (thisRequest !== requestId) return;
    renderWeather(data);
    setStatus("success", `Weather loaded for ${data.location.name}. All times are local to the city.`);
  } catch (error) {
    if (thisRequest !== requestId) return;
    setStatus("error", friendlyError(error, query), true);
  }

  clearTimeout(timeout);
  loading = false;
}

function handleSearch(event) {
  event.preventDefault();
  searchWeather(input.value);
}

form.addEventListener("submit", handleSearch);
retryButton.addEventListener("click", () => { searchWeather(lastCity); });
cityButtons.forEach(button => {
  button.addEventListener("click", () => {
    input.value = button.dataset.city;
    searchWeather(button.dataset.city);
  });
});
