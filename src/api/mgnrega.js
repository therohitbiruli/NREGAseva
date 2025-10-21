// src/api/mgnrega.js

import axios from "axios";
import Papa from "papaparse";

const API_KEY = "579b464db66ec23bdd000001bdc01081422544e260f634b8b8c51aa1";
// --- THIS IS THE ONLY FIX NEEDED ---
const RESOURCE_ID = "ee03643a-ee4c-48c2-ac30-9f2ff26ab722"; // Removed the extra '2' at the end
// ------------------------------------
const JHARKHAND_CSV_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=csv&limit=all&filters[state_name]=JHARKHAND`;

let allJharkhandData = [];

// This function for the state average can stay the same
export function fetchStateAverage() {
  return {
    householdsWorked: 11500,
    personDays: 52000,
    wagesSpent: 950000,
  };
}


export async function fetchDistrictData(districtName) {
  try {
    if (allJharkhandData.length === 0) {
      console.log("Fetching live CSV data for all of Jharkhand...");
      const response = await axios.get(JHARKHAND_CSV_URL);
      const csvText = response.data;
      const parsedData = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      allJharkhandData = parsedData.data;
      console.log(`Successfully fetched and parsed ${allJharkhandData.length} records.`);

      // DEBUG: Show a sample of the actual district names found
      const uniqueDistrictNames = [...new Set(allJharkhandData.map(record => record && record['District Name']))];
      console.log("District Names found in data:", uniqueDistrictNames);
    }

    const districtRecords = allJharkhandData.filter(
      record => record && record['District Name'] && (record['District Name'].toLowerCase() === districtName.toLowerCase())
    );

    districtRecords.sort((a, b) => {
      const yearA = a['fin year'] || '';
      const yearB = b['fin year'] || '';
      if (yearA !== yearB) return yearA.localeCompare(yearB);
      
      const monthOrder = ["APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER", "JANUARY", "FEBRUARY", "MARCH"];
      const monthA = (a.Month || '').toUpperCase();
      const monthB = (b.Month || '').toUpperCase();
      return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
    });
    
    return districtRecords;

  } catch (err) {
    console.error("Error fetching or parsing CSV data:", err);
    return [];
  }
}