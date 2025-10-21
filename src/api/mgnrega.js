import axios from "axios";

// --- IMPORTANT: REPLACE THESE WITH YOUR OWN CREDENTIALS ---
const API_KEY = "579b464db66ec23bdd00000161ecc5e3cb65484b594aa822cd9ea015";
const RESOURCE_ID = "ee03643a-ee4c-48c2-ac30-9f26ff26ab722";
// ---------------------------------------------------------

const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";
const API_BASE_URL = `${CORS_PROXY}https://api.data.gov.in/resource/${RESOURCE_ID}`;

// This is a placeholder for a real state-level API call.
// We are hardcoding this for now.
export async function fetchStateAverage() {
  return {
    householdsWorked: 11500,
    personDays: 52000,
    wagesSpent: 950000,
  };
}


export async function fetchDistrictData(districtName) {
  // Use localStorage for caching to avoid repeated API calls
  const cacheKey = `district_${districtName}`;
  const cachedData = localStorage.getItem(cacheKey);

  // If we have recent cached data, use it. (Cache for 1 hour)
  if (cachedData) {
    const { data, timestamp } = JSON.parse(cachedData);
    if (Date.now() - timestamp < 3600000) {
      console.log("Returning cached data for", districtName);
      return data;
    }
  }

  try {
    console.log("Fetching live data for", districtName);
    const response = await axios.get(API_BASE_URL, {
      params: {
        'api-key': API_KEY,
        format: 'json',
        limit: 12, // Get the last 12 months
        'filters[state_name]': 'JHARKHAND',
        'filters[district_name]': districtName.toUpperCase(), // API expects uppercase district name
      }
    });

    const records = response.data.records;

    // Save the new data and a timestamp to the cache
    localStorage.setItem(cacheKey, JSON.stringify({ data: records, timestamp: Date.now() }));

    return records;
  } catch (err) {
    console.error("API fetch failed, trying to use older cache if available", err);
    // If API fails, return cached data even if it's old
    if (cachedData) {
      return JSON.parse(cachedData).data;
    }
    return null; // No live data and no cache
  }
}