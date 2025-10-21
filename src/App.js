import React, { useState, useEffect } from "react";
import { districts } from "./data/districts";
import { Line } from "react-chartjs-2";
import { fetchDistrictData, fetchStateAverage } from "./api/mgnrega"; // Import the new function
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// A simple component to show comparison with a visual indicator
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
    const [selectedDistrict, setSelectedDistrict] = useState(districts[0]);
    const [summaryData, setSummaryData] = useState({ householdsWorked: 0, personDays: 0, wagesSpent: 0 });
    const [trendData, setTrendData] = useState({ labels: [], datasets: [] });
    const [stateAverage, setStateAverage] = useState({ householdsWorked: 0, personDays: 0, wagesSpent: 0 }); // New state for average
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function getData() {
            setIsLoading(true);

            // Fetch both district and state data
            const records = await fetchDistrictData(selectedDistrict.name);
            const averageData = await fetchStateAverage();
            setStateAverage(averageData);

            if (!records) {
                setIsLoading(false);
                return;
            };

            const last6Months = records.slice(-6);
            const current = last6Months.length > 0 ? last6Months[last6Months.length - 1] : {};

            setSummaryData({
                householdsWorked: parseInt(current.households_worked || 0),
                personDays: parseInt(current.person_days || 0),
                wagesSpent: parseInt(current.wages_spent || 0)
            });

            setTrendData({
                labels: last6Months.map(r => r.month_name || 'N/A'),
                datasets: [
                    {
                        label: "Households Worked",
                        data: last6Months.map(r => parseInt(r.households_worked || 0)),
                        borderColor: "rgb(34,197,94)",
                        backgroundColor: "rgba(34,197,94,0.5)"
                    }
                ]
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
    );
}

export default App;