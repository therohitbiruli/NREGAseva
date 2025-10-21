// src/App.js

import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { loadInitialData, getDistrictData, getDistrictList, fetchStateAverage } from "./api/mgnrega";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ComparisonCard = ({ title, districtValue, stateValue }) => {
    const isAboveAverage = districtValue > stateValue;
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
    const [error, setError] = useState(null);

    // This effect runs only ONCE to load all data and populate the district list.
    useEffect(() => {
        async function startup() {
            try {
                await loadInitialData(); // Wait for all data to be fetched and parsed
                const districtList = getDistrictList(); // Get the list of districts
                setDistricts(districtList);
                if (districtList.length > 0) {
                    setSelectedDistrict(districtList[0]); // Set the first district as the default
                } else {
                    setError("No district data could be loaded. The data source might be empty.");
                }
            } catch (e) {
                setError("Failed to load initial data. Please check your connection and the API status.");
            } finally {
                setIsLoading(false);
            }
        }
        startup();
    }, []); // The empty array ensures this runs only once.

    // This effect runs whenever 'selectedDistrict' changes.
    useEffect(() => {
        if (!selectedDistrict) return;

        const records = getDistrictData(selectedDistrict);
        const averageData = fetchStateAverage();
        setStateAverage(averageData);

        if (!records || records.length === 0) {
            setSummaryData({ householdsWorked: 0, wagesSpent: 0 });
            setTrendData({ labels: [], datasets: [] });
            return;
        };

        const last6Months = records.slice(-6);
        const current = last6Months[last6Months.length - 1] || {};

        setSummaryData({
            householdsWorked: parseInt(current['Total Households Worked'] || 0),
            wagesSpent: parseFloat(current['Wages'] || 0)
        });

        setTrendData({
          labels: last6Months.map(r => `${(r.Month || '').substring(0, 3)} ${r['fin year']}`),
          datasets: [{
            label: "Households Worked",
            data: last6Months.map(r => parseInt(r['Total Households Worked'] || 0)),
            borderColor: "rgb(34,197,94)",
            backgroundColor: "rgba(34,197,94,0.5)"
        }]
    });

    }, [selectedDistrict]);

    return (
        <div className="min-h-screen bg-gray-50 p-4 font-sans">
            <header className="text-center mb-6">
                <h1 className="text-3xl font-bold text-green-700">NREGAseva</h1>
                <p className="text-gray-600 mt-2">MGNREGA Performance Dashboard for Jharkhand</p>
            </header>

            <div className="max-w-md mx-auto bg-white p-4 rounded-lg shadow-md">
                {error ? (
                    <div className="text-center p-4 bg-red-100 text-red-700 rounded">{error}</div>
                ) : (
                    <>
                        <label htmlFor="district-select" className="block mb-2 font-semibold text-gray-800">Select Your District:</label>
                        <select
                            id="district-select"
                            className="w-full border border-gray-300 p-2 rounded mb-6 focus:ring-2 focus:ring-green-500"
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                            disabled={isLoading}
                        >
                            {isLoading && <option>Loading districts...</option>}
                            {districts.map((district) => (
                                <option key={district} value={district}>
                                    {district}
                                </option>
                            ))}
                        </select>
                        
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