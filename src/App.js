// src/App.js

import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { fetchDistrictData, fetchStateAverage } from "./api/mgnrega";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// This component is perfect, no changes needed.
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
    );
};

function App() {
    const [districts, setDistricts] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [summaryData, setSummaryData] = useState({ householdsWorked: 0, wagesSpent: 0 });
    const [trendData, setTrendData] = useState({ labels: [], datasets: [] });
    const [stateAverage, setStateAverage] = useState({ householdsWorked: 0, wagesSpent: 0 });
    const [isLoading, setIsLoading] = useState(true);

    // Effect to fetch the list of districts ONCE on startup
    useEffect(() => {
        async function loadInitialData() {
            const allRecords = await fetchDistrictData(''); // Fetch all data to build the district list
            const uniqueDistricts = [...new Set(allRecords.map(r => r['District Name']))].filter(Boolean).sort();
            
            setDistricts(uniqueDistricts);
            if (uniqueDistricts.length > 0) {
                setSelectedDistrict(uniqueDistricts[0]);
            }
            setIsLoading(false);
        }
        loadInitialData();
    }, []);

    // Effect to fetch data when the selected district changes
    useEffect(() => {
        if (!selectedDistrict) return;

        async function getDataForDistrict() {
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
        getDataForDistrict();
    }, [selectedDistrict]);

    return (
        <div className="min-h-screen bg-gray-50 p-4 font-sans">
            <header className="text-center mb-6">
                <h1 className="text-3xl font-bold text-green-700">NREGAkendra</h1>
                <p className="text-gray-600 mt-2">MGNREGA Performance Dashboard for Jharkhand</p>
            </header>

            <div className="max-w-md mx-auto bg-white p-4 rounded-lg shadow-md">
                <label htmlFor="district-select" className="block mb-2 font-semibold text-gray-800">Select Your District:</label>
                {/* --- THIS IS THE FINAL FIX: The dropdown menu JSX --- */}
                <select
                    id="district-select"
                    className="w-full border border-gray-300 p-2 rounded mb-6 focus:ring-2 focus:ring-green-500"
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    disabled={isLoading}
                >
                    <option value="">{isLoading ? "Loading districts..." : "Select a district"}</option>
                    {districts.map((district) => (
                        <option key={district} value={district}>
                            {district}
                        </option>
                    ))}
                </select>
                {/* -------------------------------------------------------- */}

                {isLoading && selectedDistrict ? (
                    <div className="text-center p-8">Loading data for {selectedDistrict}...</div>
                ) : (
                    <>
                        <div className="mb-6">
                            <h2 className="font-semibold text-lg mb-2 text-center text-gray-700">This Month vs. State Average</h2>
                            <div className="grid grid-cols-1 gap-4">
                                <ComparisonCard title="Households Worked" districtValue={summaryData.householdsWorked} stateValue={stateAverage.householdsWorked} />
                                <ComparisonCard title="Wages Spent (₹)" districtValue={summaryData.wagesSpent} stateValue={stateAverage.wagesSpent} />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h2 className="font-semibold text-lg mb-2 text-center text-gray-700">Trend (Last 6 Months)</h2>
                            <Line data={trendData} options={{ responsive: true }} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default App;