// src/api/mgnrega.js
import axios from "axios";

const API_KEY = "YOUR_API_KEY";
const RESOURCE_ID = "YOUR_RESOURCE_ID";
const STATE_CODE = "20"; // Jharkhand

export async function fetchDistrictData(districtCode) {
  const cacheKey = `district_${districtCode}`;
  
  try {
    const response = await axios.get(`https://api.data.gov.in/resource/${RESOURCE_ID}`, {
      params: {
        api-key: API_KEY,
        format: "json",
        filters: `state_code=${STATE_CODE}&district_code=${districtCode}`,
        limit: 12
      }
    });

    const records = response.data.records;

    // Save to localStorage
    localStorage.setItem(cacheKey, JSON.stringify(records));
    return records;
  } catch (err) {
    console.error("API fetch failed, using cache", err);

    // Return cached data if available
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
    return null; // fallback empty
  }
}

 // This is a placeholder for a real state-level API call.
// In a real app, you would calculate this by fetching data for all 24 districts.
export async function fetchStateAverage() {
    // Dummy data representing the average for a district in Jharkhand
    return {
      householdsWorked: 11500,
      personDays: 52000,
      wagesSpent: 950000,
    };
  }
