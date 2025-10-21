// src/App.js

import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { loadInitialData, getDistrictData, getDistrictList, fetchStateAverage } from "./api/mgnrega";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { Users, IndianRupee, TrendingUp, TrendingDown } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ComparisonCard = ({ title, districtValue, stateValue, icon: Icon }) => {
    const isAboveAverage = districtValue > stateValue;
    const difference = Math.abs(districtValue - stateValue);

    return (
        <div className={`p-6 rounded-xl shadow-lg ${isAboveAverage ? 'bg-gradient-to-br from-green-400 to-green-500' : 'bg-gradient-to-br from-orange-400 to-red-500'} text-white`}>
            <div className="flex items-center justify-center mb-3">
                <Icon size={40} strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-bold text-center mb-2">{title}</h2>
            <p className="text-4xl font-black text-center mb-3">{districtValue.toLocaleString('hi-IN')}</p>
            <div className="flex items-center justify-center gap-2 bg-white bg-opacity-30 rounded-lg p-2">
                {isAboveAverage ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                <p className="text-sm font-semibold">
                    {isAboveAverage ? 'ज़्यादा' : 'कम'} {difference.toLocaleString('hi-IN')}
                </p>
            </div>
            <p className="text-xs text-center mt-2 opacity-90">
                राज्य औसत: {stateValue.toLocaleString('hi-IN')}
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
                    setError("कोई ज़िला डेटा लोड नहीं हो सका। डेटा स्रोत खाली हो सकता है।");
                }
            } catch (e) {
                setError("प्रारंभिक डेटा लोड करने में विफल। कृपया अपना कनेक्शन और API स्थिति जांचें।");
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
            labels: last6Months.map(r => r.Month || 'N/A'),
            datasets: [{
                label: "काम करने वाले परिवार",
                data: last6Months.map(r => parseInt(r['Total Households Worked'] || 0)),
                borderColor: "rgb(34,197,94)",
                backgroundColor: "rgba(34,197,94,0.5)",
                borderWidth: 4,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        });

    }, [selectedDistrict]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-4 font-sans">
            <header className="text-center mb-8">
                <h1 className="text-5xl font-black text-green-800 mb-2">नरेगा केंद्र</h1>
                <p className="text-xl text-gray-700 font-semibold">मनरेगा प्रदर्शन डैशबोर्ड - झारखंड</p>
            </header>

            <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-2xl">
                {error ? (
                    <div className="text-center p-6 bg-red-100 text-red-700 rounded-xl text-xl font-bold">{error}</div>
                ) : (
                    <>
                        <label htmlFor="district-select" className="block mb-3 font-bold text-2xl text-gray-800 text-center">
                            अपना ज़िला चुनें:
                        </label>
                        <select
                            id="district-select"
                            className="w-full border-4 border-green-500 p-4 rounded-xl mb-8 focus:ring-4 focus:ring-green-300 text-xl font-bold text-gray-800 bg-green-50"
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                            disabled={isLoading}
                        >
                            {isLoading && <option>ज़िले लोड हो रहे हैं...</option>}
                            {districts.map((district) => (
                                <option key={district} value={district}>
                                    {district}
                                </option>
                            ))}
                        </select>
                        
                        <div className="mb-8">
                            <h2 className="font-black text-3xl mb-6 text-center text-gray-800">इस महीने का प्रदर्शन</h2>
                            <div className="grid grid-cols-1 gap-6">
                                <ComparisonCard 
                                    title="काम करने वाले परिवार" 
                                    districtValue={summaryData.householdsWorked} 
                                    stateValue={stateAverage.householdsWorked}
                                    icon={Users}
                                />
                                <ComparisonCard 
                                    title="मज़दूरी खर्च (₹)" 
                                    districtValue={summaryData.wagesSpent} 
                                    stateValue={stateAverage.wagesSpent}
                                    icon={IndianRupee}
                                />
                            </div>
                        </div>
                        <div className="mt-6 bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg">
                            <h2 className="font-black text-2xl mb-4 text-center text-gray-800">पिछले 6 महीने का रुझान</h2>
                            <div className="bg-white p-4 rounded-lg">
                                <Line 
                                    data={trendData} 
                                    options={{ 
                                        responsive: true,
                                        plugins: {
                                            legend: {
                                                labels: {
                                                    font: {
                                                        size: 16,
                                                        weight: 'bold'
                                                    }
                                                }
                                            }
                                        },
                                        scales: {
                                            y: {
                                                ticks: {
                                                    font: {
                                                        size: 14,
                                                        weight: 'bold'
                                                    }
                                                }
                                            },
                                            x: {
                                                ticks: {
                                                    font: {
                                                        size: 14,
                                                        weight: 'bold'
                                                    }
                                                }
                                            }
                                        }
                                    }} 
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default App;