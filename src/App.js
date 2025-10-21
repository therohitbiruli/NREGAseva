// src/App.js

import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { fetchDistrictData, fetchStateAverage } from "./api/mgnrega";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ComparisonCard = ({ title, districtValue, stateValue }) => {
    // ... (This component remains the same)
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
        // ... (The JSX part of your App component remains the same, it will now work with the new state)
    );
}

export default App;