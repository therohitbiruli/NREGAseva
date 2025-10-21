// src/App.js

import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { fetchDistrictData, fetchStateAverage } from "./api/mgnrega";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ComparisonCard = ({ title, districtValue, stateValue }) => {
  const isAboveAverage = districtValue >= stateValue;
  const difference = Math.abs(districtValue - stateValue);

  return (
      <div className={`p-3 rounded text-center ${isAboveAverage ? 'bg-green-100' : 'bg-red-100'}`}>
          <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
          <p className="text-xl font-bold text-gray-900">{districtValue.toLocaleString()}</p>
          <p className={`text-xs font-medium ${isAboveAverage ? 'text-green-700' : 'text-red-700'}`}>
              {isAboveAverage ? '↑' : '↓'} {difference.toLocaleString()} {isAboveAverage ? 'above' : 'below'} state average ({stateValue.toLocaleString()})
          </p>
      </div>
  ); // ... (This component remains the same)
};

function App() {
    const [districts, setDistricts] = useState([]); // State to hold the dynamic district list
    const [selectedDistrict, setSelectedDistrict] = useState(''); // State for the selected district name
    const [summaryData, setSummaryData] = useState({ householdsWorked: 0, wagesSpent: 0 });
    const [trendData, setTrendData] = useState({ labels: [], datasets: [] });
    const [stateAverage, setStateAverage] = useState({ householdsWorked: 0, wagesSpent: 0 });
    const [isLoading, setIsLoading] = useState(true);

    // Effect to fetch the list of districts ONCE on startup
    useEffect(() => {
        async function loadInitialData() {
            console.log("Loading initial data and district list...");
            const allRecords = await fetchDistrictData(''); // Fetch all data to build the district list
            const uniqueDistricts = [...new Set(allRecords.map(r => r['District Name']))].sort();
            
            setDistricts(uniqueDistricts);
            if (uniqueDistricts.length > 0) {
                setSelectedDistrict(uniqueDistricts[0]); // Select the first district by default
            }
            setIsLoading(false);
        }
        loadInitialData();
    }, []);

    // Effect to fetch data when the selected district changes
    useEffect(() => {
        if (!selectedDistrict) return; // Don't fetch if no district is selected

        async function getData() {
            setIsLoading(true);
            const records = await fetchDistrictData(selectedDistrict);
            const averageData = await fetchStateAverage();
            setStateAverage(averageData);

            if (!records || records.length === 0) {
                setSummaryData({ householdsWorked: 0, wagesSpent: 0 });
                setTrendData({ labels: [], datasets: [] });
                setIsLoading(false);
                return;
            };

            const last6Months = records.slice(-6);
            const current = last6Months[last6Months.length - 1] || {};

            setSummaryData({
                householdsWorked: parseInt(current['Total Households Worked'] || 0),
                wagesSpent: parseFloat(current['Wages'] || 0)
            });

            setTrendData({
                labels: last6Months.map(r => r.Month || 'N/A'),
                datasets: [{
                    label: "Households Worked",
                    data: last6Months.map(r => parseInt(r['Total Households Worked'] || 0)),
                    borderColor: "rgb(34,197,94)",
                    backgroundColor: "rgba(34,197,94,0.5)"
                }]
            });
            setIsLoading(false);
        }
        getData();
    }, [selectedDistrict]);

    return (
      <div className="min-h-screen bg-gray-50 p-4 font-sans">
      <header className="text-center mb-6">
          <h1 className="text-3xl font-bold text-green-700">NREGAkendra</h1>
          <p className="text-gray-600 mt-2">MGNREGA Performance Dashboard for Jharkhand</p>
      </header>

      <div className="max-w-md mx-auto bg-white p-4 rounded-lg shadow-md">
          <label htmlFor="district-select" className="block mb-2 font-semibold text-gray-800">Select Your District:</label>
          <select
              id="district-select"
              className="w-full border border-gray-300 p-2 rounded mb-6 focus:ring-2 focus:ring-green-500"
              value={selectedDistrict.code}
              onChange={(e) =>
                  setSelectedDistrict(districts.find(d => d.code === e.target.value))
              }
          >
              {districts.map((d) => (
                  <option key={d.code} value={d.code}>{d.name}</option>
              ))}
          </select>

          {isLoading ? (
              <div className="text-center p-8">Loading data...</div>
          ) : (
              <>
                  {/* Comparison Cards */}
                  <div className="mb-6">
                      <h2 className="font-semibold text-lg mb-2 text-center text-gray-700">This Month vs. State Average</h2>
                      <div className="grid grid-cols-1 gap-4">
                          <ComparisonCard title="Households Worked" districtValue={summaryData.householdsWorked} stateValue={stateAverage.householdsWorked} />
                          <ComparisonCard title="Wages Spent (₹)" districtValue={summaryData.wagesSpent} stateValue={stateAverage.wagesSpent} />
                      </div>
                  </div>

                  {/* Trend Chart */}
                  <div className="mt-4">
                      <h2 className="font-semibold text-lg mb-2 text-center text-gray-700">Trend (Last 6 Months)</h2>
                      <Line data={trendData} options={{ responsive: true }} />
                  </div>
              </>
          )}
      </div>
  </div>
        // ... (The JSX part of your App component remains the same, it will now work with the new state)
    );
}

export default App;