import { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import logo from "./assets/logo.png"; 

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Helper: Format INR
const formatINR = (num) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

// Helper: Format number in lakhs/crores for better readability
const formatNumber = (num) => {
  if (num >= 10000000) {
    return (num / 10000000).toFixed(1) + ' Cr';
  } else if (num >= 100000) {
    return (num / 100000).toFixed(1) + ' L';
  }
  return num.toLocaleString();
};

// Cities data
const cities = ['Hyderabad', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune'];

// Helper function for date formatting
const formatDate = (date, format) => {
  const d = new Date(date);
  if (format === 'DD MMM') {
    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
  }
  if (format === 'MMM YY') {
    return `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear().toString().slice(-2)}`;
  }
  return d.toLocaleDateString();
};

function App() {
  const [viewMode, setViewMode] = useState('daily');
  const [selectedCity, setSelectedCity] = useState('All');
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  
  // Updated metrics with your specific values
  const [metrics, setMetrics] = useState({
    totalProduced: 130000, // 1.3 lakh helmets
    totalMachinesInstalled: 65,
    activeMachines: 61,
    totalRevenue: 3800000, // 38 lakhs revenue
    dailyRevenue: 150000, // 1.5 lakhs daily
    monthlyGrowth: 8.4,
  });
  
  const [dailyProduction, setDailyProduction] = useState([]);
  const [dailyRevenueSeries, setDailyRevenueSeries] = useState([]);
  const [cumulativeRevenue, setCumulativeRevenue] = useState([]);
  const [datesLabels, setDatesLabels] = useState([]);
  const [cityDeployments, setCityDeployments] = useState([]);
  const [machineStatus, setMachineStatus] = useState({ active: 94, maintenance: 4, offline: 2 }); // 61/65 = 94%
  const [forecastProduction, setForecastProduction] = useState([]);
  const [forecastRevenue, setForecastRevenue] = useState([]);
  const [forecastLabels, setForecastLabels] = useState([]);
  
  const intervalRef = useRef(null);
  const dayCounter = useRef(0);
  
  const refreshAllData = () => {
    dayCounter.current = dayCounter.current + 1;
    const daysToShow = viewMode === 'daily' ? 30 : (viewMode === 'weekly' ? 12 : 8);
    
    let newDates = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      let d = new Date();
      d.setDate(d.getDate() - i);
      if (viewMode === 'daily') newDates.push(formatDate(d, 'DD MMM'));
      else if (viewMode === 'weekly') newDates.push(`W${Math.floor((daysToShow - i) / 7) + 1}`);
      else newDates.push(formatDate(d, 'MMM YY'));
    }
    setDatesLabels(newDates);
    
    // Production series starting from slightly lower and growing
    let baseProd = metrics.totalProduced;
    let newProdSeries = [];
    let currentProdVal = baseProd * 0.85;
    for (let i = 0; i < daysToShow; i++) {
      let growth = currentProdVal * 0.008 * (0.7 + Math.random() * 0.8);
      currentProdVal = currentProdVal + growth;
      newProdSeries.push(Math.floor(currentProdVal));
    }
    setDailyProduction(newProdSeries);
    
    // Revenue series with daily growth
    let baseDailyRev = metrics.dailyRevenue;
    let newDailyRevSeries = [];
    let currentRevVal = baseDailyRev * 0.88;
    for (let i = 0; i < daysToShow; i++) {
      let revGrowth = currentRevVal * 0.007 * (0.6 + Math.random() * 0.9);
      currentRevVal = currentRevVal + revGrowth;
      newDailyRevSeries.push(Math.floor(currentRevVal));
    }
    setDailyRevenueSeries(newDailyRevSeries);
    
    // Cumulative Revenue
    let cumul = [];
    let running = metrics.totalRevenue - newDailyRevSeries.reduce((a, b) => a + b, 0) + newDailyRevSeries[0];
    for (let i = 0; i < newDailyRevSeries.length; i++) {
      if (i === 0) cumul.push(running);
      else cumul.push(cumul[i - 1] + newDailyRevSeries[i]);
    }
    setCumulativeRevenue(cumul);
    
    // Update metrics with realistic growth
    setMetrics(prev => {
      let prodIncrease = Math.floor(prev.totalProduced * 0.006) + 50;
      let totalProducedNew = prev.totalProduced + prodIncrease;
      let machinesNew = prev.totalMachinesInstalled + (Math.random() > 0.7 ? 1 : 0);
      let activeNew = Math.min(machinesNew, Math.floor(machinesNew * 0.94) + (Math.random() > 0.8 ? 1 : 0));
      let revenueGrowth = prev.totalRevenue * 0.006 + 15000;
      let totalRevenueNew = prev.totalRevenue + revenueGrowth;
      let dailyRevNew = prev.dailyRevenue * (1 + (0.006 + Math.random() * 0.004));
      let monthlyGrowthNew = prev.monthlyGrowth + (Math.random() * 0.3 - 0.05);
      if (monthlyGrowthNew < 5) monthlyGrowthNew = 5.2;
      if (monthlyGrowthNew > 16) monthlyGrowthNew = 15.8;
      return {
        totalProduced: totalProducedNew,
        totalMachinesInstalled: machinesNew,
        activeMachines: activeNew,
        totalRevenue: totalRevenueNew,
        dailyRevenue: Math.floor(dailyRevNew),
        monthlyGrowth: parseFloat(monthlyGrowthNew.toFixed(1))
      };
    });
    
    // City deployments based on realistic distribution
    let growthFactor = 1 + (dayCounter.current / 600);
    let newCityData = cities.map(city => {
      let base = { 
        Hyderabad: 18, 
        Mumbai: 15, 
        Delhi: 14, 
        Bangalore: 12, 
        Chennai: 4, 
        Pune: 2 
      };
      return Math.floor(base[city] * growthFactor + Math.random() * 2);
    });
    setCityDeployments(newCityData);
    
    // Machine status (active machines percentage)
    let activeRatio = metrics.activeMachines / metrics.totalMachinesInstalled;
    let active = Math.floor(activeRatio * 100);
    let maintenance = Math.floor((1 - activeRatio) * 0.6 * 100);
    let offline = 100 - active - maintenance;
    setMachineStatus({ active, maintenance, offline });
    
    // Forecast for next 30 days
    let forecastProdArr = [];
    let forecastRevArr = [];
    let lastProd = metrics.totalProduced;
    let lastDailyRev = metrics.dailyRevenue;
    for (let i = 1; i <= 30; i++) {
      let prodForecast = lastProd * (1 + 0.008 + Math.sin(i / 15) * 0.002);
      lastProd = prodForecast;
      forecastProdArr.push(Math.floor(prodForecast));
      
      let revForecast = lastDailyRev * (1 + 0.007 + (i / 500));
      lastDailyRev = revForecast;
      forecastRevArr.push(Math.floor(revForecast));
    }
    setForecastProduction(forecastProdArr);
    setForecastRevenue(forecastRevArr);
    setForecastLabels(Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`));
    
    setLastUpdateTime(new Date());
  };
  
  useEffect(() => {
    refreshAllData();
    intervalRef.current = setInterval(refreshAllData, 4500);
    return () => clearInterval(intervalRef.current);
  }, []);
  
  useEffect(() => {
    if (intervalRef.current) {
      refreshAllData();
    }
  }, [viewMode, selectedCity]);
  
  const getLineProductionData = () => ({
    labels: datesLabels,
    datasets: [{
      label: 'Helmets Produced (units)',
      data: dailyProduction,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.05)',
      borderWidth: 3,
      pointRadius: 3,
      pointBackgroundColor: '#059669',
      tension: 0.3,
      fill: false,
    }]
  });
  
  const getDailyRevenueData = () => ({
    labels: datesLabels,
    datasets: [{
      label: 'Daily Revenue (₹)',
      data: dailyRevenueSeries,
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.05)',
      borderWidth: 3,
      pointRadius: 3,
      pointBackgroundColor: '#d97706',
      tension: 0.3,
      fill: false,
    }]
  });
  
  const getCumulativeRevenueData = () => ({
    labels: datesLabels,
    datasets: [{
      label: 'Cumulative Revenue (₹)',
      data: cumulativeRevenue,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.3,
      borderWidth: 2,
    }]
  });
  
  const getBarChartData = () => ({
    labels: cities,
    datasets: [{
      label: 'Machines Deployed',
      data: cityDeployments,
      backgroundColor: '#3b82f6',
      borderRadius: 8,
      barPercentage: 0.65,
    }]
  });
  
  const getPieData = () => ({
    labels: ['Active', 'Maintenance', 'Offline'],
    datasets: [{
      data: [machineStatus.active, machineStatus.maintenance, machineStatus.offline],
      backgroundColor: ['#10b981', '#f97316', '#94a3b8'],
      borderWidth: 0,
    }]
  });
  
  const getForecastProductionData = () => ({
    labels: forecastLabels,
    datasets: [{
      label: 'Forecast Production (units)',
      data: forecastProduction,
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.05)',
      borderWidth: 2,
      borderDash: [6, 4],
      tension: 0.2,
    }]
  });
  
  const getForecastRevenueData = () => ({
    labels: forecastLabels,
    datasets: [{
      label: 'Forecast Revenue (₹)',
      data: forecastRevenue,
      borderColor: '#ec4899',
      backgroundColor: 'rgba(236, 72, 153, 0.05)',
      borderWidth: 2,
      borderDash: [6, 4],
      tension: 0.2,
    }]
  });
  
  const AnimatedNumber = ({ value, prefix = '', suffix = '' }) => {
    const [displayValue, setDisplayValue] = useState(value);
    useEffect(() => {
      const duration = 800;
      const steps = 40;
      const stepValue = (value - displayValue) / steps;
      let current = displayValue;
      let step = 0;
      const timer = setInterval(() => {
        step++;
        current += stepValue;
        if (step >= steps) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }, [value, displayValue]);
    return <span>{prefix}{Math.floor(displayValue).toLocaleString()}{suffix}</span>;
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 11, family: "'Inter', sans-serif" } } },
      tooltip: { backgroundColor: '#1f2937', titleColor: '#fff', bodyColor: '#e5e7eb' }
    },
    scales: {
      y: { grid: { color: '#e5e7eb', drawBorder: false }, ticks: { font: { size: 11 } } },
      x: { grid: { display: false }, ticks: { font: { size: 11 } } }
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
             
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Freshpod India
                </h1>
                <p className="text-xs text-gray-500">Disinfection Helmets · Smart Sanitization Solutions</p>
              </div>
            </div>
            <div className="flex gap-3">
              <select 
                value={viewMode} 
                onChange={(e) => setViewMode(e.target.value)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="daily">Daily View</option>
                <option value="weekly">Weekly View</option>
                <option value="monthly">Monthly View</option>
              </select>
              <select 
                value={selectedCity} 
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="All">All Cities</option>
                {cities.map(c => <option key={c}>{c}</option>)}
              </select>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-emerald-700">LIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-emerald-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">🪖</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+{formatNumber(Math.floor(metrics.totalProduced * 0.006))}</span>
            </div>
            <p className="text-gray-500 text-xs uppercase tracking-wide font-semibold">Total Helmets</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{formatNumber(metrics.totalProduced)}</p>
          </div>
          
          <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-emerald-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">🔧</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+{metrics.totalMachinesInstalled > 65 ? Math.floor(Math.random() * 2) : 0}</span>
            </div>
            <p className="text-gray-500 text-xs uppercase tracking-wide font-semibold">Machines Installed</p>
            <p className="text-2xl font-bold text-gray-800 mt-1"><AnimatedNumber value={metrics.totalMachinesInstalled} /></p>
          </div>
          
          <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-emerald-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">▶️</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{(metrics.activeMachines / metrics.totalMachinesInstalled * 100).toFixed(0)}%</span>
            </div>
            <p className="text-gray-500 text-xs uppercase tracking-wide font-semibold">Active Machines</p>
            <p className="text-2xl font-bold text-gray-800 mt-1"><AnimatedNumber value={metrics.activeMachines} /></p>
          </div>
          
          <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-emerald-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">💰</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">↑ {metrics.monthlyGrowth}%</span>
            </div>
            <p className="text-gray-500 text-xs uppercase tracking-wide font-semibold">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{formatINR(metrics.totalRevenue)}</p>
          </div>
          
          <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-emerald-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">📅</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">daily</span>
            </div>
            <p className="text-gray-500 text-xs uppercase tracking-wide font-semibold">Daily Revenue</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{formatINR(metrics.dailyRevenue)}</p>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">📈</span>
              <span className="text-xs font-semibold text-white bg-white/20 px-2 py-1 rounded-full">MoM</span>
            </div>
            <p className="text-white/80 text-xs uppercase tracking-wide font-semibold">Monthly Growth</p>
            <p className="text-3xl font-bold text-white mt-1">{metrics.monthlyGrowth}%</p>
            <p className="text-white/70 text-xs mt-2">↑ accelerating</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
              Daily Helmet Production
            </h3>
            <Line data={getLineProductionData()} options={chartOptions} />
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-amber-500 rounded-full"></span>
              Daily Revenue Growth
            </h3>
            <Line data={getDailyRevenueData()} options={chartOptions} />
          </div>
        </div>

        {/* Cumulative Revenue */}
        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
            Cumulative Revenue (Area Chart)
          </h3>
          <Line data={getCumulativeRevenueData()} options={chartOptions} />
        </div>

        {/* Operations Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
              Machines Deployed by City
            </h3>
            <Bar data={getBarChartData()} options={chartOptions} />
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
              Machine Status
            </h3>
            <Pie data={getPieData()} options={{ plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>

        {/* Forecast & KPI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-purple-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
              KPI Growth Indicator
            </h3>
            <div className="text-center py-6">
              <div className="relative inline-flex items-center justify-center">
                <div className="text-7xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {metrics.monthlyGrowth}%
                </div>
              </div>
              <p className="text-gray-600 mt-3">Monthly Growth Rate</p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full">
                <span className="text-emerald-600">⚡</span>
                <span className="text-sm font-semibold text-emerald-700">
                  +{((metrics.monthlyGrowth - 7.2) / 7.2 * 100).toFixed(0)}% vs last quarter
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-4">Strong upward trajectory, investor grade performance</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-violet-500 rounded-full"></span>
              30-Day Forecast: Production & Revenue
            </h3>
            <Line data={getForecastProductionData()} options={chartOptions} />
            <div className="mt-4">
              <Line data={getForecastRevenueData()} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center py-4 border-t border-gray-200">
          <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
            <span>🔄 Data auto-simulates real-world growth every 4.5 seconds</span>
            <span>•</span>
            <span>Freshpod India • Disinfection for tomorrow</span>
            <span>•</span>
            <span>Last updated: {lastUpdateTime.toLocaleTimeString()}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;