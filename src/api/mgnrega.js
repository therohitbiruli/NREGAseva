// src/api/mgnrega.js

import axios from "axios";
import Papa from "paparse";

const API_KEY = "579b464db66ec23bdd000001bdc01081422544e260f634b8b8c51aa1";
const RESOURCE_ID = "ee03643a-ee4c-48c2-ac30-9f26ff26ab722";
const JHARKHAND_CSV_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=csv&limit=all&filters[state_name]=JHARKHAND`;

let allJharkhandData = [];
let isDataLoaded = false;

/**
 * A helper function to convert a financial year record into a real Date object for sorting.
 * Example: { Month: "APRIL", 'fin year': "2024-2025" } becomes a Date object for April 2024.
 * Example: { Month: "JANUARY", 'fin year': "2024-2025" } becomes a Date object for January 2025.
 */
const getSortableDate = (record) => {
  const monthName = (record.Month || "").toUpperCase();
  const finYear = record['fin year'] || "";
  
  if (!monthName || !finYear) return null;

  const monthOrder = ["APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER", "JANUARY", "FEBRUARY", "MARCH"];
  const monthIndex = monthOrder.indexOf(monthName);
  
  if (monthIndex === -1) return null;

  const startYear = parseInt(finYear.substring(0, 4));
  // If the month is January, February, or March, it belongs to the second year of the financial period.
  const calendarYear = monthIndex >= 9 ? startYear + 1 : startYear;
  
  // The month in a Date object is 0-indexed (Jan=0, Feb=1...). We need to convert our financial month index to a calendar month index.
  const calendarMonthIndex = (monthIndex + 3) % 12;

  return new Date(calendarYear, calendarMonthIndex, 1);
};


export async function loadInitialData() {
  if (isDataLoaded) return;
  try {
    console.log("Fetching live CSV data...");
    const response = await axios.get(JHARKHAND_CSV_URL);
    const parsedData = Papa.parse(response.data, { header: true, skipEmptyLines: true });
    
    // Filter out any invalid records before storing
    allJharkhandData = parsedData.data.filter(record => record && record['District Name'] && record.Month && record['fin year']);
    isDataLoaded = true;
    
    console.log(`Successfully parsed ${allJharkhandData.length} valid records.`);
  } catch (err) {
    console.error("CRITICAL ERROR: Could not fetch initial data.", err);
    throw err;
  }
}

export function getDistrictData(districtName) {
  if (!isDataLoaded) return [];

  const districtRecords = allJharkhandData.filter(
    record => record['District Name'].toLowerCase() === districtName.toLowerCase()
  );

  // --- THIS IS THE CRITICAL FIX: Sort by a real date ---
  districtRecords.sort((a, b) => {
    const dateA = getSortableDate(a);
    const dateB = getSortableDate(b);
    if (!dateA || !dateB) return 0;
    return dateA - dateB; // Sort ascending chronologically
  });

  return districtRecords;
}

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