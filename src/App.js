// src/App.js

import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { loadInitialData, getDistrictData, getDistrictList, fetchStateAverage } from "./api/mgnrega";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { Users, IndianRupee, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

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

// Month name mapping
const monthNames = {
    'January': 'जनवरी',
    'February': 'फरवरी',
    'March': 'मार्च',
    'April': 'अप्रैल',
    'May': 'मई',
    'June': 'जून',
    'July': 'जुलाई',
    'August': 'अगस्त',
    'September': 'सितंबर',
    'October': 'अक्टूबर',
    'November': 'नवंबर',
    'December': 'दिसंबर'
};

function App() {
    const [districts, setDistricts] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [summaryData, setSummaryData] = useState({ householdsWorked: 0, wagesSpent: 0 });
    const [trendData, setTrendData] = useState({ labels: [], datasets: [] });
    const [stateAverage, setStateAverage] = useState({ householdsWorked: 0, wagesSpent: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalStats, setTotalStats] = useState({ totalHouseholds: 0, avgHouseholds: 0, totalWages: 0 });

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
            setTotalStats({ totalHouseholds: 0, avgHouseholds: 0, totalWages: 0 });
            return;
        };

        const last6Months = records.slice(-6);
        const current = last6Months[last6Months.length - 1] || {};

        // Calculate total statistics
        const totalHouseholds = last6Months.reduce((sum, r) => sum + parseInt(r['Total Households Worked'] || 0), 0);
        const avgHouseholds = Math.round(totalHouseholds / last6Months.length);
        const totalWages = last6Months.reduce((sum, r) => sum + parseFloat(r['Wages'] || 0), 0);

        setTotalStats({ totalHouseholds, avgHouseholds, totalWages });

        setSummaryData({
            householdsWorked: parseInt(current['Total Households Worked'] || 0),
            wagesSpent: parseFloat(current['Wages'] || 0)
        });

        // Convert month names to Hindi with year
        const hindiLabels = last6Months.map(r => {
            const monthName = r.Month || 'N/A';
            const year = r.Year || r.year || new Date().getFullYear(); // Try to get year from data
            // Debug: Log what we're getting
            console.log('Original month from data:', monthName, 'Year:', year);
            const hindiMonth = monthNames[monthName] || monthName;
            return `${hindiMonth} ${year}`;
        });

        setTrendData({
            labels: hindiLabels,
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

    // Generate insight text
    const getInsightText = () => {
        const isHouseholdsAbove = summaryData.householdsWorked > stateAverage.householdsWorked;
        const isWagesAbove = summaryData.wagesSpent > stateAverage.wagesSpent;
        
        if (isHouseholdsAbove && isWagesAbove) {
            return `${selectedDistrict} ज़िले में मनरेगा योजना का प्रदर्शन बहुत अच्छा है! इस महीने ${summaryData.householdsWorked.toLocaleString('hi-IN')} परिवारों को काम मिला, जो राज्य औसत से ज़्यादा है। कुल ₹${summaryData.wagesSpent.toLocaleString('hi-IN')} की मज़दूरी का भुगतान किया गया। पिछले 6 महीनों में ${totalStats.totalHouseholds.toLocaleString('hi-IN')} परिवारों को रोज़गार मिला और ₹${totalStats.totalWages.toLocaleString('hi-IN')} का भुगतान हुआ। यह आपके ज़िले के विकास और ग्रामीण परिवारों की आर्थिक सुरक्षा के लिए एक अच्छा संकेत है।`;
        } else if (!isHouseholdsAbove && !isWagesAbove) {
            return `${selectedDistrict} ज़िले में मनरेगा योजना में सुधार की ज़रूरत है। इस महीने ${summaryData.householdsWorked.toLocaleString('hi-IN')} परिवारों को काम मिला, जो राज्य औसत से कम है। पिछले 6 महीनों में ${totalStats.totalHouseholds.toLocaleString('hi-IN')} परिवारों को रोज़गार मिला। अधिक परिवारों को लाभ पहुंचाने के लिए और कार्यों की योजना बनाने की आवश्यकता है। आप अपने ग्राम पंचायत से संपर्क कर सकते हैं और अधिक काम की मांग कर सकते हैं।`;
        } else {
            return `${selectedDistrict} ज़िले में मनरेगा योजना का मिश्रित प्रदर्शन देखा गया है। इस महीने ${summaryData.householdsWorked.toLocaleString('hi-IN')} परिवारों को काम मिला। पिछले 6 महीनों में कुल ${totalStats.totalHouseholds.toLocaleString('hi-IN')} परिवारों को रोज़गार मिला और औसत ${totalStats.avgHouseholds.toLocaleString('hi-IN')} परिवार प्रति माह काम कर रहे हैं। कुछ क्षेत्रों में सुधार हो रहा है, लेकिन और भी बेहतर किया जा सकता है।`;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-2 sm:p-4 font-sans">
            <header className="text-center mb-4 sm:mb-8">
                <h1 className="text-3xl sm:text-5xl font-black text-green-800 mb-1 sm:mb-2">नरेगा केंद्र</h1>
                <p className="text-sm sm:text-xl text-gray-700 font-semibold">मनरेगा प्रदर्शन डैशबोर्ड - झारखंड</p>
            </header>

            <div className="max-w-6xl mx-auto bg-white p-3 sm:p-6 rounded-2xl shadow-2xl">
                {error ? (
                    <div className="text-center p-6 bg-red-100 text-red-700 rounded-xl text-xl font-bold">{error}</div>
                ) : (
                    <>
                        <label htmlFor="district-select" className="block mb-2 sm:mb-3 font-bold text-xl sm:text-2xl text-gray-800 text-center">
                            अपना ज़िला चुनें:
                        </label>
                        <select
                            id="district-select"
                            className="w-full border-4 border-green-500 p-3 sm:p-4 rounded-xl mb-4 sm:mb-8 focus:ring-4 focus:ring-green-300 text-lg sm:text-xl font-bold text-gray-800 bg-green-50"
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
                        
                        {/* Main content grid - side by side on desktop, stacked on mobile */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-8">
                            {/* Left side - Trend Chart (takes 2 columns on desktop) */}
                            <div className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl shadow-lg order-2 lg:order-1">
                                <h2 className="font-black text-xl sm:text-2xl mb-3 sm:mb-4 text-center text-gray-800">पिछले 6 महीने का रुझान</h2>
                                <div className="bg-white p-2 sm:p-4 rounded-lg">
                                    <Line 
                                        data={trendData} 
                                        options={{ 
                                            responsive: true,
                                            maintainAspectRatio: true,
                                            plugins: {
                                                legend: {
                                                    labels: {
                                                        font: {
                                                            size: window.innerWidth < 640 ? 12 : 16,
                                                            weight: 'bold'
                                                        }
                                                    }
                                                }
                                            },
                                            scales: {
                                                y: {
                                                    ticks: {
                                                        font: {
                                                            size: window.innerWidth < 640 ? 10 : 14,
                                                            weight: 'bold'
                                                        }
                                                    }
                                                },
                                                x: {
                                                    ticks: {
                                                        font: {
                                                            size: window.innerWidth < 640 ? 10 : 14,
                                                            weight: 'bold'
                                                        }
                                                    }
                                                }
                                            }
                                        }} 
                                    />
                                </div>
                                
                                {/* Quick Statistics Below Chart */}
                                <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                                    <div className="bg-white p-2 sm:p-3 rounded-lg text-center shadow">
                                        <BarChart3 size={window.innerWidth < 640 ? 20 : 24} className="mx-auto mb-1 text-blue-600" />
                                        <p className="text-xs sm:text-xs text-gray-600 font-semibold">कुल परिवार</p>
                                        <p className="text-sm sm:text-lg font-black text-gray-800">{totalStats.totalHouseholds.toLocaleString('hi-IN')}</p>
                                    </div>
                                    <div className="bg-white p-2 sm:p-3 rounded-lg text-center shadow">
                                        <Users size={window.innerWidth < 640 ? 20 : 24} className="mx-auto mb-1 text-green-600" />
                                        <p className="text-xs sm:text-xs text-gray-600 font-semibold">औसत/माह</p>
                                        <p className="text-sm sm:text-lg font-black text-gray-800">{totalStats.avgHouseholds.toLocaleString('hi-IN')}</p>
                                    </div>
                                    <div className="bg-white p-2 sm:p-3 rounded-lg text-center shadow">
                                        <IndianRupee size={window.innerWidth < 640 ? 20 : 24} className="mx-auto mb-1 text-orange-600" />
                                        <p className="text-xs sm:text-xs text-gray-600 font-semibold">कुल मज़दूरी</p>
                                        <p className="text-sm sm:text-lg font-black text-gray-800">₹{(totalStats.totalWages / 10000000).toFixed(1)}Cr</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right side - Comparison Cards (takes 1 column on desktop) */}
                            <div className="lg:col-span-1 order-1 lg:order-2">
                                <h2 className="font-black text-xl sm:text-2xl mb-3 sm:mb-4 text-center text-gray-800">इस महीने का प्रदर्शन</h2>
                                <div className="flex flex-col gap-3 sm:gap-4">
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
                        </div>

                        {/* Bottom - Insight Text */}
                        <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 sm:p-6 rounded-xl shadow-lg">
                            <h2 className="font-black text-xl sm:text-2xl mb-3 sm:mb-4 text-center text-gray-800 flex items-center justify-center gap-2">
                                <BarChart3 size={window.innerWidth < 640 ? 24 : 28} className="text-purple-600" />
                                आंकड़े क्या बताते हैं?
                            </h2>
                            <p className="text-sm sm:text-lg leading-relaxed text-gray-800 text-center font-medium">
                                {getInsightText()}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default App;