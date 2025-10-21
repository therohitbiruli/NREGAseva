// src/api/mgnrega.js

import axios from "axios";
import Papa from "papaparse";

const API_KEY = "579b464db66ec23bdd000001bdc01081422544e260f634b8b8c51aa1";
const RESOURCE_ID = "ee03643a-ee4c-48c2-ac30-9f2ff26ab7222";
const BASE_URL = "https://api.data.gov.in/resource";

// Construct the API URL for Jharkhand data
const JHARKHAND_CSV_URL = `${BASE_URL}/${RESOURCE_ID}?api-key=${API_KEY}&format=csv&filters[State_name]=JHARKHAND`;

// Cache for storing fetched data
let allJharkhandData = [];
let isDataLoaded = false;

/**
 * Fetch state-level average statistics
 * You can calculate these from the actual data once loaded
 */
export function fetchStateAverage() {
  if (allJharkhandData.length > 0) {
    // Calculate actual averages from loaded data
    const totalHouseholds = allJharkhandData.reduce(
      (sum, record) => sum + (parseFloat(record['Total HouseHolds Worked'] || 0)), 0
    );
    const totalPersonDays = allJharkhandData.reduce(
      (sum, record) => sum + (parseFloat(record['Total Individuals Worked'] || 0)), 0
    );
    const totalWages = allJharkhandData.reduce(
      (sum, record) => sum + (parseFloat(record['Total No of Workers'] || 0)), 0
    );

    return {
      householdsWorked: Math.round(totalHouseholds / allJharkhandData.length),
      personDays: Math.round(totalPersonDays / allJharkhandData.length),
      wagesSpent: Math.round(totalWages / allJharkhandData.length),
    };
  }
  
  // Return default values if data not loaded yet
  return {
    householdsWorked: 11500,
    personDays: 52000,
    wagesSpent: 950000,
  };
}

/**
 * Fetch all Jharkhand data from the API
 */
async function loadAllJharkhandData() {
  if (isDataLoaded) {
    return allJharkhandData;
  }

  try {
    console.log("Fetching live CSV data for Jharkhand...");
    console.log("API URL:", JHARKHAND_CSV_URL);
    
    const response = await axios.get(JHARKHAND_CSV_URL, {
      headers: {
        'Accept': 'text/csv',
      },
      timeout: 30000, // 30 second timeout
    });

    const csvText = response.data;
    
    // Parse CSV with papaparse - more robust configuration
    const parsedData = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Keep everything as strings initially
      transformHeader: (header) => header.trim(),
      transform: (value) => typeof value === 'string' ? value.trim() : value,
      delimitersToGuess: [',', '\t', '|', ';'],
    });

    if (parsedData.errors.length > 0) {
      console.warn("CSV parsing warnings:", parsedData.errors);
    }

    allJharkhandData = parsedData.data;
    isDataLoaded = true;
    
    console.log(`Successfully fetched ${allJharkhandData.length} records`);

    // Debug: Show all unique district names
    const uniqueDistricts = [...new Set(
      allJharkhandData
        .map(record => record['District Name'])
        .filter(name => name && name.trim())
    )].sort();
    
    console.log("=== AVAILABLE DISTRICTS ===");
    console.log(uniqueDistricts);
    console.log("===========================");

    // Debug: Show column names
    if (allJharkhandData.length > 0) {
      console.log("=== AVAILABLE COLUMNS ===");
      console.log(Object.keys(allJharkhandData[0]));
      console.log("=========================");
    }

    return allJharkhandData;

  } catch (err) {
    console.error("Error fetching CSV data:", err.message);
    if (err.response) {
      console.error("Response status:", err.response.status);
      console.error("Response data:", err.response.data);
    }
    throw err;
  }
}

/**
 * Fetch data for a specific district
 * @param {string} districtName - Name of the district
 * @returns {Promise<Array>} Array of district records
 */
export async function fetchDistrictData(districtName) {
  try {
    // Load all data if not already loaded
    await loadAllJharkhandData();

    // Filter records for the specific district (case-insensitive)
    const districtRecords = allJharkhandData.filter(record => {
      const recordDistrict = record['District Name'];
      return recordDistrict && 
             recordDistrict.toLowerCase().trim() === districtName.toLowerCase().trim();
    });

    console.log(`Found ${districtRecords.length} records for district: ${districtName}`);

    // Sort by financial year and month
    districtRecords.sort((a, b) => {
      // First sort by financial year
      const yearA = a['fin year'] || '';
      const yearB = b['fin year'] || '';
      if (yearA !== yearB) {
        return yearA.localeCompare(yearB);
      }
      
      // Then sort by month
      const monthOrder = [
        "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER",
        "OCTOBER", "NOVEMBER", "DECEMBER", "JANUARY", "FEBRUARY", "MARCH"
      ];
      const monthA = (a.Month || '').toUpperCase().trim();
      const monthB = (b.Month || '').toUpperCase().trim();
      return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
    });

    return districtRecords;

  } catch (err) {
    console.error(`Error fetching data for district ${districtName}:`, err);
    return [];
  }
}

/**
 * Get list of all available districts
 * @returns {Promise<Array<string>>} Array of district names
 */
export async function fetchAvailableDistricts() {
  try {
    await loadAllJharkhandData();
    
    const districts = [...new Set(
      allJharkhandData
        .map(record => record['District Name'])
        .filter(name => name && name.trim())
    )].sort();

    return districts;

  } catch (err) {
    console.error("Error fetching district list:", err);
    return [];
  }
}

/**
 * Clear cached data (useful for refreshing)
 */
export function clearCache() {
  allJharkhandData = [];
  isDataLoaded = false;
  console.log("Cache cleared");
}