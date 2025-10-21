// src/api/mgnrega.js

import axios from "axios";
import Papa from "papaparse";

// --- IMPORTANT: Use your final, regenerated API key ---
const API_KEY = "579b464db66ec23bdd000001bdc01081422544e260f634b8b8c51aa1"; // Your final, working key
const RESOURCE_ID = "ee03643a-ee4c-48c2-ac30-9f26ff26ab722";
// ---------------------------------------------------------

const JHARKHAND_CSV_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=csv&limit=all&filters[state_name]=JHARKHAND`;

export function fetchStateAverage() {
  return {
    householdsWorked: 11500,
    personDays: 52000,
    wagesSpent: 950000,
  };
}

let allJharkhandData = [];

export async function fetchDistrictData(districtName) {
  try {
    if (allJharkhandData.length === 0) {
      console.log("Fetching live CSV data for all of Jharkhand...");
      const response = await axios.get(JHARKHAND_CSV_URL);
      const csvText = response.data;

      const parsedData = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
      });

      allJharkhandData = parsedData.data;
      console.log("Successfully fetched and parsed Jharkhand data.");
    }

    // Now, filter the in-memory data for the selected district.
    const districtRecords = allJharkhandData.filter(
      // --- FINAL FIX IS HERE ---
      // We check if record AND record.district_name exist before trying to use them.
      record => record && record.district_name && (record.district_name.toLowerCase() === districtName.toLowerCase())
    );

    // Sort records to ensure the chart is in the correct order
    districtRecords.sort((a, b) => {
      // Add safety checks here as well
      const yearA = a.fin_year || '';
      const yearB = b.fin_year || '';
      if (yearA !== yearB) {
        return yearA.localeCompare(yearB);
      }
      const monthOrder = ["APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER", "JANUARY", "FEBRUARY", "MARCH"];
      const monthA = (a.month_name || '').toUpperCase();
      const monthB = (b.month_name || '').toUpperCase();
      return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
    });
    
    return districtRecords;

  } catch (err) {
    console.error("Error fetching or parsing CSV data:", err);
    return [];
  }
}