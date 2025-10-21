// src/api/mgnrega.js

import axios from "axios";
import Papa from "papaparse";

const API_KEY = "579b464db66ec23bdd000001bdc01081422544e260f634b8b8c51aa1";
const RESOURCE_ID = "ee03643a-ee4c-48c2-ac30-9f2ff26ab722";
const JHARKHAND_CSV_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=csv&limit=all&filters[state_name]=JHARKHAND`;

// Cache for the entire dataset
let allJharkhandData = [];
let isDataLoaded = false;

/**
 * Fetches and parses the entire CSV data for Jharkhand.
 * This should only be called once.
 */
export async function loadInitialData() {
  if (isDataLoaded) {
    return;
  }
  try {
    console.log("Fetching live CSV data for all of Jharkhand...");
    const response = await axios.get(JHARKHAND_CSV_URL);
    const csvText = response.data;
    const parsedData = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    
    allJharkhandData = parsedData.data.filter(record => record && record['District Name']); // Ensure records are valid
    isDataLoaded = true;
    
    console.log(`Successfully fetched and parsed ${allJharkhandData.length} valid records.`);
  } catch (err) {
    console.error("CRITICAL ERROR: Could not fetch or parse initial CSV data.", err);
    throw err; // Throw error to be caught by the UI
  }
}

/**
 * Gets the data for a specific district from the already loaded dataset.
 */
export function getDistrictData(districtName) {
  if (!isDataLoaded) return [];

  const districtRecords = allJharkhandData.filter(
    record => record['District Name'].toLowerCase() === districtName.toLowerCase()
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
}

/**
 * Gets a unique, sorted list of district names from the loaded data.
 */
export function getDistrictList() {
    if (!isDataLoaded) return [];
    return [...new Set(allJharkhandData.map(r => r['District Name']))].sort();
}

export function fetchStateAverage() {
  return {
    householdsWorked: 11500,
    wagesSpent: 950000,
  };
}