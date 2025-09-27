import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCw, Download, FileText, Camera, Activity, TrendingUp, AlertTriangle, Clock, Wifi, WifiOff, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'https://vibration-1.onrender.com';

function VibrationChart() {
  const [historicalData, setHistoricalData] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [combinedData, setCombinedData] = useState([]);
  const [predictionSteps, setPredictionSteps] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [anomalyCount, setAnomalyCount] = useState(0);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const chartRef = useRef(null);

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', isoString);
        return new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });
      }
      
      // Format time with proper timezone handling
      return date.toLocaleTimeString('en-IN', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Kolkata' // Indian timezone
      });
    } catch (error) {
      console.error('Error formatting time:', error, isoString);
      return new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });
    }
  };

  const fetchHistoricalData = async () => {
    try {
      console.log('Fetching historical data from:', `${API_BASE_URL}/vibration`);
      const res = await fetch(`${API_BASE_URL}/vibration`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Historical data received:', data);
      
      // Handle different response structures
      const vibrationData = data.data || data || [];
      setHistoricalData(vibrationData);
      setAnomalyCount(vibrationData.filter(item => item.anomaly).length);
      setConnectionStatus('connected');
      setError(null);
    } catch (err) {
      console.error('Error fetching historical data:', err);
      setError(`Failed to fetch historical data: ${err.message}`);
      setConnectionStatus('disconnected');
      
      // Set dummy data for testing
      const now = new Date();
      const dummyData = Array.from({ length: 50 }, (_, i) => {
        const timestamp = new Date(now.getTime() - (50 - i) * 60000); // Go back 50 minutes, then forward
        return {
          timestamp: timestamp.toISOString(),
          vibration: Math.sin(i * 0.1) * 2 + Math.random() * 0.5 + 5,
          anomaly: Math.random() > 0.9
        };
      });
      setHistoricalData(dummyData);
      setAnomalyCount(dummyData.filter(item => item.anomaly).length);
    }
  };

  const fetchPredictions = async (steps = 10) => {
    try {
      console.log('Fetching predictions from:', `${API_BASE_URL}/predict?steps=${steps}`);
      const res = await fetch(`${API_BASE_URL}/predict?steps=${steps}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Predictions received:', data);
      
      // Handle different response structures
      const predictionData = data.data || data || [];
      setPredictions(predictionData);
      setConnectionStatus('connected');
      setError(null);
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setError(`Failed to fetch predictions: ${err.message}`);
      setConnectionStatus('disconnected');
      
      // Set dummy predictions for testing
      const now = new Date();
      const lastTimestamp = historicalData.length > 0 
        ? new Date(historicalData[historicalData.length - 1].timestamp)
        : now;
        
      const dummyPredictions = Array.from({ length: steps }, (_, i) => {
        const predictionTime = new Date(lastTimestamp.getTime() + (i + 1) * 60000);
        return {
          timestamp: predictionTime.toISOString(),
          vibration: Math.sin((50 + i) * 0.1) * 2 + Math.random() * 0.3 + 5
        };
      });
      setPredictions(dummyPredictions);
    }
  };

  // Combine historical + predicted for chart
  useEffect(() => {
    const historical = historicalData.map((item, i) => ({
      index: i,
      timestamp: formatTime(item.timestamp),
      historical: item.vibration,
      predicted: null,
      anomaly: item.anomaly
    }));

    const predicted = predictions.map((item, i) => ({
      index: historicalData.length + i,
      timestamp: formatTime(item.timestamp),
      historical: null,
      predicted: item.vibration,
      anomaly: false
    }));

    setCombinedData([...historical, ...predicted]);
  }, [historicalData, predictions]);

  // Initial fetch
  useEffect(() => {
    refreshData();
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 60000);
    return () => clearInterval(interval);
  }, [predictionSteps]);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchHistoricalData(),
        fetchPredictions(predictionSteps)
      ]);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepsChange = (e) => {
    const steps = parseInt(e.target.value);
    setPredictionSteps(steps);
    fetchPredictions(steps);
  };

  const exportToCSV = () => {
    const csvContent = [
      'Index,Timestamp,Historical,Predicted,Anomaly',
      ...combinedData.map(d =>
        `${d.index},${d.timestamp},${d.historical ?? ''},${d.predicted ?? ''},${d.anomaly}`
      )
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vibration-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPNG = async () => {
    if (chartRef.current) {
      // Simulate export for demo - in real app you'd use html2canvas
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#000000';
      ctx.font = '20px Arial';
      ctx.fillText('Vibration Chart Export', 20, 40);
      
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vibration-chart.png';
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900">{`Time: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value?.toFixed(3)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Vibration Monitoring Dashboard</h1>
                <p className="text-gray-600">Real-time vibration analysis with predictive insights</p>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border">
              {connectionStatus === 'connected' ? (
                <>
                  <Wifi className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Connected</span>
                </>
              ) : connectionStatus === 'disconnected' ? (
                <>
                  <WifiOff className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-600">Disconnected</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />
                  <span className="text-sm font-medium text-yellow-600">Connecting...</span>
                </>
              )}
            </div>
          </div>
          

        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Points</p>
                <p className="text-2xl font-bold text-gray-900">{historicalData.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Anomalies Detected</p>
                <p className="text-2xl font-bold text-red-600">{anomalyCount}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Predictions</p>
                <p className="text-2xl font-bold text-orange-600">{predictions.length}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Updated</p>
                <p className="text-sm font-bold text-gray-900">
                  {lastUpdated ? lastUpdated.toLocaleTimeString('en-IN', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit',
                    timeZone: 'Asia/Kolkata'
                  }) : 'Never'}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Chart Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          {/* Chart Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">Vibration Analysis</h2>
              {isLoading && (
                <div className="flex items-center gap-2 text-blue-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {/* Prediction Steps Control */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">
                  Prediction Steps: 
                  <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                    {predictionSteps}
                  </span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={predictionSteps}
                  onChange={handleStepsChange}
                  className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshData}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <FileText className="w-4 h-4" />
                  CSV
                </button>
                
                <button
                  onClick={exportToPNG}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  <Camera className="w-4 h-4" />
                  PNG
                </button>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div ref={chartRef} className="w-full" style={{ height: '500px' }}>
            <ResponsiveContainer>
              <LineChart data={combinedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  dataKey="historical"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Historical Data"
                  dot={(props) =>
                    props.payload.anomaly ? (
                      <circle 
                        cx={props.cx} 
                        cy={props.cy} 
                        r={5} 
                        fill="#ef4444" 
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    ) : (
                      <circle 
                        cx={props.cx} 
                        cy={props.cy} 
                        r={3} 
                        fill="#3b82f6"
                        stroke="#ffffff"
                        strokeWidth={1}
                      />
                    )
                  }
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#f97316"
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  name="Predicted Data"
                  dot={{ r: 3, fill: '#f97316', stroke: '#ffffff', strokeWidth: 1 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-600"></div>
              <span className="text-sm text-gray-600">Historical Data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-orange-600 border-dashed border-t-2"></div>
              <span className="text-sm text-gray-600">Predicted Data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              <span className="text-sm text-gray-600">Anomaly Detected</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Data refreshes automatically every 60 seconds • Last update: {lastUpdated ? lastUpdated.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Never'}</p>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}

export default VibrationChart;
