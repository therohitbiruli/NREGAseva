// src/api/mgnrega.js

// Directly import the local JSON data file. This requires NO external libraries.
import allJharkhandData from '../data/mgnrega_data.json';

const getSortableDate = (record) => {
  const monthName = (record.Month || "").toUpperCase();
  const finYear = record['fin year'] || "";
  if (!monthName || !finYear) return null;
  const monthOrder = ["APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER", "JANUARY", "FEBRUARY", "MARCH"];
  const monthIndex = monthOrder.indexOf(monthName);
  if (monthIndex === -1) return null;
  const startYear = parseInt(finYear.substring(0, 4));
  const calendarYear = monthIndex >= 9 ? startYear + 1 : startYear;
  const calendarMonthIndex = (monthIndex + 3) % 12;
  return new Date(calendarYear, calendarMonthIndex, 1);
};

export function getDistrictData(districtName) {
  const districtRecords = allJharkhandData.filter(
    record => record['District Name']?.toLowerCase() === districtName.toLowerCase()
  );

  districtRecords.sort((a, b) => {
    const dateA = getSortableDate(a);
    const dateB = getSortableDate(b);
    if (!dateA || !dateB) return 0;
    return dateA - dateB;
  });

  return districtRecords;
}

export function getDistrictList() {
    return [...new Set(allJharkhandData.map(r => r['District Name']))].filter(Boolean).sort();
}

export function fetchStateAverage() {
  return {
    householdsWorked: 11500,
    wagesSpent: 950000,
  };
}