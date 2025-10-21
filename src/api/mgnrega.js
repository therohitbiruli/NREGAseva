// src/api/mgnrega.js

import axios from "axios";
import Papa from "papaparse"; // Import the CSV parser

// --- IMPORTANT: Use your final, regenerated API key ---
const API_KEY = "579b464db66ec23bdd000001bdc01081422544e260f634b8b8c51aa1"; // Paste your newest key
const RESOURCE_ID = "ee03643a-ee4c-4c82-ac30-9f26ff26ab722";
// ---------------------------------------------------------

// Construct the URL to fetch the CSV for all of Jharkhand
const JHARKHAND_CSV_URL = `https://api.data.gov.in/resource/ee03643a-ee4c-48c2-ac30-9f2ff26ab722?api-key=579b464db66ec23bdd000001bdc01081422544e260f634b8b8c51aa1&format=csv&filters%5Bstate_name%5D=JHARKHAND`

// This function for the state average can stay the same
export function fetchStateAverage() {
  return {
    householdsWorked: 11500,
    personDays: 52000,
    wagesSpent: 950000,
  };
}


// We need to fetch and parse the data only once, so we'll store it here.
let allJharkhandData = [];

// This is our new, live-fetching function.
export async function fetchDistrictData(districtName) {
  try {
    // If we haven't fetched the data yet, go get it.
    if (allJharkhandData.length === 0) {
      console.log("Fetching live CSV data for all of Jharkhand...");
      const response = await axios.get(JHARKHAND_CSV_URL);
      const csvText = response.data;

      // Use Papa Parse to convert the CSV text to JSON
      const parsedData = Papa.parse(csvText, {
        header: true, // Treat the first row as headers (keys)
        skipEmptyLines: true,
      });

      allJharkhandData = parsedData.data;
      console.log("Successfully fetched and parsed Jharkhand data.");
    }

    // Now, filter the in-memory data for the selected district.
    const districtRecords = allJharkhandData.filter(
      record => record.district_name.toLowerCase() === districtName.toLowerCase()
    );

    // Sort records to ensure the chart is in the correct order
    districtRecords.sort((a, b) => {
      if (a.fin_year !== b.fin_year) {
        return a.fin_year.localeCompare(b.fin_year);
      }
      const monthOrder = ["APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER", "JANUARY", "FEBRUARY", "MARCH"];
      return monthOrder.indexOf(a.month_name.toUpperCase()) - monthOrder.indexOf(b.month_name.toUpperCase());
    });
    
    return districtRecords;

  } catch (err) {
    console.error("Error fetching or parsing CSV data:", err);
    return []; // Return empty array on failure
  }
}