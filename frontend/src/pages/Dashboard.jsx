import React, { useState } from 'react';
import { Package, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import ForecastDisplay from '../components/ForecastDisplay';
import { useTheme } from '../contexts/ThemeContext';
import { ApiService } from '../services/api';
import Papa from 'papaparse';

const Dashboard = () => {
  const { isDark } = useTheme();
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedData, setUploadedData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [showForecast, setShowForecast] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [forecastData, setForecastData] = useState(null);
// Change handleDataUpload
const handleDataUpload = (file) => {
  if (!file) return;

  setUploadedFile(file);   // <-- keep the File object
  setFileName(file.name);

  // Parse CSV only for displaying, do NOT replace uploadedFile
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      setUploadedData(results.data);  // for display only
      setShowForecast(false);
    },
  });
};

const handleGenerateForecast = async () => {
  if (!uploadedFile || !startMonth || !endMonth) return;

  setIsGenerating(true);
  try {
    const formData = new FormData();
    formData.append('train_file', uploadedFile, uploadedFile.name); // File object
    formData.append('start_month', startMonth); // e.g., "01/2025"
    formData.append('end_month', endMonth);     // e.g., "04/2025"

    const response = await fetch('http://127.0.0.1:8000/forecast', {
      method: 'POST',
      body: formData, // do NOT set Content-Type manually
    });

    const data = await response.json();
    setForecastData(data);
    setShowForecast(true);
  } catch (error) {
    console.error(error);
    alert(error.message);
  } finally {
    setIsGenerating(false);
  }
};



  const formatMonth = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  const today = new Date();
  const minStartDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  let minEndDate = null;
  let maxEndDate = null;
  if (startMonth) {
    const start = new Date(startMonth);
    minEndDate = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    maxEndDate = new Date(start.getFullYear(), start.getMonth() + 6, 1);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          AI Inventory Prediction System
        </h1>
        <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
          Upload your inventory data and let our AI analyze trends, predict demand, and optimize your stock levels.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <FileUpload onDataUpload={handleDataUpload} />

        {/* Month Selection */}
        <div className={`mt-6 p-6 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-lg`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Forecast Period</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Start Month</label>
              <input
                type="month"
                value={startMonth}
                onChange={(e) => {
                  setStartMonth(e.target.value);
                  setEndMonth('');
                }}
                min={formatMonth(minStartDate)}
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>End Month</label>
              <input
                type="month"
                value={endMonth}
                onChange={(e) => setEndMonth(e.target.value)}
                min={startMonth && minEndDate ? formatMonth(minEndDate) : ''}
                max={startMonth && maxEndDate ? formatMonth(maxEndDate) : ''}
                disabled={!startMonth}
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerateForecast}
          disabled={!uploadedFile || !startMonth || !endMonth || isGenerating}
          className={`w-full mt-4 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${!uploadedFile || !startMonth || !endMonth || isGenerating ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400' : isDark ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-lg hover:shadow-xl' : 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-105 shadow-lg hover:shadow-xl'}`}
        >
          {isGenerating ? 'Generating Forecast...' : 'Generate AI Forecast'}
        </button>
      </div>

      {uploadedData && (
        <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
          <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-700'}`}>
            ✅ Successfully loaded <strong>{fileName}</strong> with {uploadedData.length} records
          </p>
        </div>
      )}

      {showForecast && forecastData && (
        <ForecastDisplay forecastData={forecastData} startMonth={startMonth} endMonth={endMonth} />
      )}
    </div>
  );
};

export default Dashboard;
