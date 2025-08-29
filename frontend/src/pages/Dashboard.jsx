import React, { useState } from 'react';
import { Package, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import ForecastDisplay from '../components/ForecastDisplay';
import { useTheme } from '../contexts/ThemeContext';
import { ApiService } from '../services/api.js';

const Dashboard = () => {
  const { isDark } = useTheme();
  const [uploadedData, setUploadedData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [forecastData, setForecastData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalItems: 0,
    predictedGrowth: 0,
    lowStockItems: 0,
    revenueForecast: 0
  });

  const handleDataUpload = async (data, name) => {

    setUploadedData(data);
    setFileName(name);
    setIsLoading(true);
    setError(null);

    try {
      // Generate forecast using API
      console.log(data);
      // const forecast = await ApiService.generateForecast(data);
      // console.log(forecast);
      setForecastData(data);

      // Get updated stats
      // const statsData = await ApiService.getInventoryStats(data);
      // setStats(statsData);
    } catch (err) {
      setError(err.message);
      // Fallback to sample data for demo purposes
      setForecastData(sampleForecastData);
      // setStats({
      //   totalItems: data.length,
      //   predictedGrowth: 15.2,
      //   lowStockItems: Math.floor(data.length * 0.1),
      //   revenueForecast: 124500
      // });
    } finally {
      setIsLoading(false);
    }
  };

  // Sample forecast data (fallback for demo purposes)
  const sampleForecastData = uploadedData ? {
    "forecasted_products": [
      {
        "2022-01-01": {
          "Alpha": 438,
          "Bravo": 452,
          "Charlie": 564,
          "Delta": 919,
          "Echo": 1084
        }
      },
      {
        "2022-02-01": {
          "Alpha": 428,
          "Bravo": 455,
          "Charlie": 716,
          "Delta": 996,
          "Echo": 1006
        }
      },
      {
        "2022-03-01": {
          "Alpha": 384,
          "Bravo": 499,
          "Charlie": 772,
          "Delta": 830,
          "Echo": 1347
        }
      }
    ],
    "meta": {
      "last_dates_per_product": {
        "Alpha": "2021-12-01",
        "Bravo": "2021-12-01",
        "Charlie": "2021-12-01",
        "Delta": "2021-12-01",
        "Echo": "2021-12-01"
      },
      "method": "prophet",
      "generated_on": "2025-08-29T18:04:08Z"
    }
  } : null;

  // const statsCards = [
  //   {
  //     title: 'Total Items',
  //     value: stats.totalItems.toLocaleString(),
  //     change: 12,
  //     icon: Package,
  //     color: 'bg-blue-500'
  //   },
  //   {
  //     title: 'Predicted Growth',
  //     value: `${stats.predictedGrowth}%`,
  //     change: 8.1,
  //     icon: TrendingUp,
  //     color: 'bg-green-500'
  //   },
  //   {
  //     title: 'Low Stock Items',
  //     value: stats.lowStockItems.toString(),
  //     change: -5,
  //     icon: AlertTriangle,
  //     color: 'bg-orange-500'
  //   },
  //   {
  //     title: 'Revenue Forecast',
  //     value: `$${(stats.revenueForecast / 1000).toFixed(1)}K`,
  //     change: 23,
  //     icon: DollarSign,
  //     color: 'bg-purple-500'
  //   }
  // ];

  return (
    <div className="space-y-8">
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
        
        {uploadedData && (
          <div className={`mt-6 p-4 rounded-lg ${
            isDark ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200'
          }`}>
            <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-700'}`}>
              ✅ Successfully loaded <strong>{fileName}</strong> with {uploadedData.length} records
            </p>
          </div>
        )}

        {isLoading && (
          <div className={`mt-6 p-4 rounded-lg ${
            isDark ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                🤖 AI is analyzing your data and generating forecasts...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className={`mt-6 p-4 rounded-lg ${
            isDark ? 'bg-yellow-900/20 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <p className={`text-sm ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
              ⚠️ API Error: {error}. Using sample data for demonstration.
            </p>
          </div>
        )}
      </div>

      {uploadedData && forecastData && (
        <ForecastDisplay forecastData={forecastData} />
      )}

      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div> */}

    </div>
  );
};

export default Dashboard;