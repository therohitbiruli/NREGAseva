// src/App.js

import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { loadInitialData, getDistrictData, getDistrictList, fetchStateAverage, getAvailableFinancialYears } from "./api/mgnrega";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { Users, IndianRupee, TrendingUp, TrendingDown, BarChart3, Calendar, MapPin } from "lucide-react";

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
    'JANUARY': 'जनवरी',
    'FEBRUARY': 'फरवरी',
    'MARCH': 'मार्च',
    'APRIL': 'अप्रैल',
    'MAY': 'मई',
    'JUNE': 'जून',
    'JULY': 'जुलाई',
    'AUGUST': 'अगस्त',
    'SEPTEMBER': 'सितंबर',
    'OCTOBER': 'अक्टूबर',
    'NOVEMBER': 'नवंबर',
    'DECEMBER': 'दिसंबर'
};

function App() {
    const [districts, setDistricts] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [financialYears, setFinancialYears] = useState([]);
    const [selectedFinYear, setSelectedFinYear] = useState('');
    const [summaryData, setSummaryData] = useState({ householdsWorked: 0, wagesSpent: 0 });
    const [trendData, setTrendData] = useState({ labels: [], datasets: [] });
    const [stateAverage, setStateAverage] = useState({ householdsWorked: 0, wagesSpent: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalStats, setTotalStats] = useState({ totalHouseholds: 0, avgHouseholds: 0 });
    const [detectedLocation, setDetectedLocation] = useState(null);
    const [locationStatus, setLocationStatus] = useState('');

    // Map of common city/region names to district names in Jharkhand
    const locationToDistrict = {
        'ranchi': 'RANCHI',
        'jamshedpur': 'SARAIKELA-KHARSAWAN',
        'dhanbad': 'DHANBAD',
        'bokaro': 'BOKARO',
        'deoghar': 'DEOGHAR',
        'giridih': 'GIRIDIH',
        'hazaribag': 'HAZARIBAGH',
        'hazaribagh': 'HAZARIBAGH',
        'dumka': 'DUMKA',
        'ramgarh': 'RAMGARH',
        'east singhbhum': 'SARAIKELA-KHARSAWAN',
        'west singhbhum': 'WEST SINGHBHUM',
        'saraikela': 'SARAIKELA-KHARSAWAN',
        'kharsawan': 'SARAIKELA-KHARSAWAN',
        'gumla': 'GUMLA',
        'simdega': 'SIMDEGA',
        'lohardaga': 'LOHARDAGA',
        'palamu': 'PALAMU',
        'latehar': 'LATEHAR',
        'chatra': 'CHATRA',
        'koderma': 'KODERMA',
        'jamtara': 'JAMTARA',
        'sahibganj': 'SAHEBGANJ',
        'pakur': 'PAKUR',
        'godda': 'GODDA'
    };

    // Function to detect user location using IP geolocation
    const detectUserLocation = async () => {
        try {
            setLocationStatus('आपका स्थान पता लगाया जा रहा है...');
            
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            
            console.log('Detected location:', data);
            
            if (data && data.region) {
                const region = data.region.toLowerCase();
                const city = data.city ? data.city.toLowerCase() : '';
                
                setDetectedLocation(`${data.city || data.region}, ${data.region}`);
                
                let matchedDistrict = null;
                
                // Check city name
                for (const [key, district] of Object.entries(locationToDistrict)) {
                    if (city.includes(key) || key.includes(city)) {
                        matchedDistrict = district;
                        break;
                    }
                }
                
                // If no city match, check region
                if (!matchedDistrict) {
                    for (const [key, district] of Object.entries(locationToDistrict)) {
                        if (region.includes(key) || key.includes(region)) {
                            matchedDistrict = district;
                            break;
                        }
                    }
                }
                
                if (matchedDistrict) {
                    setLocationStatus(`✓ स्थान मिल गया: ${data.city || data.region}`);
                    return matchedDistrict;
                } else {
                    setLocationStatus(`स्थान: ${data.city || data.region} (झारखंड के बाहर)`);
                    return null;
                }
            }
            
            setLocationStatus('स्थान का पता नहीं लगा सका');
            return null;
        } catch (error) {
            console.error('Location detection error:', error);
            setLocationStatus('');
            return null;
        }
    };

    useEffect(() => {
        async function startup() {
            try {
                await loadInitialData();
                const districtList = getDistrictList();
                const yearsList = getAvailableFinancialYears();
                
                setDistricts(districtList);
                setFinancialYears(yearsList);
                
                const detectedDistrict = await detectUserLocation();
                
                if (detectedDistrict && districtList.includes(detectedDistrict)) {
                    setSelectedDistrict(detectedDistrict);
                } else if (districtList.length > 0) {
                    setSelectedDistrict(districtList[0]);
                } else {
                    setError("कोई ज़िला डेटा लोड नहीं हो सका। डेटा स्रोत खाली हो सकता है।");
                }
                
                if (yearsList.length > 0) {
                    setSelectedFinYear(yearsList[yearsList.length - 1]);
                }
            } catch (e) {
                setError("प्रारंभिक डेटा लोड करने में विफल। कृपया अपना कनेक्शन और API स्थिति जांचें।");
            } finally {
                setIsLoading(false);
            }
        }
        startup();
    }, []);

    useEffect(() => {
        if (!selectedDistrict || !selectedFinYear) return;

        const records = getDistrictData(selectedDistrict, selectedFinYear);
        const averageData = fetchStateAverage(selectedFinYear);
        setStateAverage(averageData);

        if (!records || records.length === 0) {
            setSummaryData({ householdsWorked: 0, wagesSpent: 0 });
            setTrendData({ labels: [], datasets: [] });
            setTotalStats({ totalHouseholds: 0, avgHouseholds: 0 });
            return;
        }

        const last6Months = records.slice(-6);
        const current = last6Months[last6Months.length - 1] || {};

        const totalHouseholds = last6Months.reduce((sum, r) => sum + parseInt(r['Total Households Worked'] || 0), 0);
        const avgHouseholds = Math.round(totalHouseholds / last6Months.length);

        setTotalStats({ totalHouseholds, avgHouseholds });

        setSummaryData({
            householdsWorked: parseInt(current['Total Households Worked'] || 0),
            wagesSpent: parseFloat(current['Wages'] || 0)
        });

        const hindiLabels = last6Months.map(r => {
            const monthName = (r.Month || '').toUpperCase();
            return monthNames[monthName] || r.Month || 'N/A';
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

    }, [selectedDistrict, selectedFinYear]);

    const getInsightText = () => {
        const isHouseholdsAbove = summaryData.householdsWorked > stateAverage.householdsWorked;
        const isWagesAbove = summaryData.wagesSpent > stateAverage.wagesSpent;
        
        if (isHouseholdsAbove && isWagesAbove) {
            return `${selectedDistrict} ज़िले में मनरेगा योजना का प्रदर्शन बहुत अच्छा है! इस महीने ${summaryData.householdsWorked.toLocaleString('hi-IN')} परिवारों को काम मिला, जो राज्य औसत से ज़्यादा है। कुल ₹${summaryData.wagesSpent.toLocaleString('hi-IN')} की मज़दूरी का भुगतान किया गया। पिछले 6 महीनों में ${totalStats.totalHouseholds.toLocaleString('hi-IN')} परिवारों को रोज़गार मिला। यह आपके ज़िले के विकास और ग्रामीण परिवारों की आर्थिक सुरक्षा के लिए एक अच्छा संकेत है।`;
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
                {locationStatus && (
                    <p className="text-xs sm:text-sm text-blue-600 font-semibold mt-2 flex items-center justify-center gap-1">
                        📍 {locationStatus}
                    </p>
                )}
            </header>

            <div className="max-w-6xl mx-auto bg-white p-3 sm:p-6 rounded-2xl shadow-2xl">
                {error ? (
                    <div className="text-center p-6 bg-red-100 text-red-700 rounded-xl text-xl font-bold">{error}</div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 sm:mb-8">
                            <div>
                                <label htmlFor="district-select" className="block mb-2 font-bold text-lg sm:text-xl text-gray-800 text-center">
                                    अपना ज़िला चुनें:
                                </label>
                                <div className="relative">
                                    <select
                                        id="district-select"
                                        className="w-full border-4 border-green-500 p-3 sm:p-4 pr-14 rounded-xl focus:ring-4 focus:ring-green-300 text-lg sm:text-xl font-bold text-gray-800 bg-green-50"
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
                                    <button
                                        onClick={async () => {
                                            const detectedDistrict = await detectUserLocation();
                                            if (detectedDistrict && districts.includes(detectedDistrict)) {
                                                setSelectedDistrict(detectedDistrict);
                                            }
                                        }}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                                        title="मेरा स्थान खोजें"
                                        disabled={isLoading}
                                    >
                                        <MapPin size={20} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="year-select" className="block mb-2 font-bold text-lg sm:text-xl text-gray-800 text-center flex items-center justify-center gap-2">
                                    <Calendar size={24} className="text-blue-600" />
                                    वित्तीय वर्ष चुनें:
                                </label>
                                <select
                                    id="year-select"
                                    className="w-full border-4 border-blue-500 p-3 sm:p-4 rounded-xl focus:ring-4 focus:ring-blue-300 text-lg sm:text-xl font-bold text-gray-800 bg-blue-50"
                                    value={selectedFinYear}
                                    onChange={(e) => setSelectedFinYear(e.target.value)}
                                    disabled={isLoading}
                                >
                                    {isLoading && <option>वर्ष लोड हो रहे हैं...</option>}
                                    {financialYears.map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-8">
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
                                
                                <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-3 sm:gap-4">
                                    <div className="bg-white p-4 sm:p-5 rounded-lg text-center shadow-md">
                                        <BarChart3 size={window.innerWidth < 640 ? 28 : 32} className="mx-auto mb-2 text-blue-600" />
                                        <p className="text-sm sm:text-base text-gray-600 font-semibold mb-1">कुल परिवार</p>
                                        <p className="text-2xl sm:text-3xl font-black text-gray-800">{totalStats.totalHouseholds.toLocaleString('hi-IN')}</p>
                                    </div>
                                    <div className="bg-white p-4 sm:p-5 rounded-lg text-center shadow-md">
                                        <Users size={window.innerWidth < 640 ? 28 : 32} className="mx-auto mb-2 text-green-600" />
                                        <p className="text-sm sm:text-base text-gray-600 font-semibold mb-1">औसत/माह</p>
                                        <p className="text-2xl sm:text-3xl font-black text-gray-800">{totalStats.avgHouseholds.toLocaleString('hi-IN')}</p>
                                    </div>
                                </div>
                            </div>

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