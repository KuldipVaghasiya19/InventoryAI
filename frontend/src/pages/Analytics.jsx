import React from 'react';
import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Analytics = () => {
  const { isDark } = useTheme();

  const analyticsData = [
    {
      title: 'Demand Forecast',
      value: '94.5%',
      change: 5.2,
      icon: TrendingUp,
      color: 'bg-blue-500'
    },
    {
      title: 'Accuracy Rate',
      value: '89.7%',
      change: 2.1,
      icon: Activity,
      color: 'bg-green-500'
    },
    {
      title: 'Categories Analyzed',
      value: '24',
      change: 12,
      icon: PieChart,
      color: 'bg-purple-500'
    },
    {
      title: 'Predictions Made',
      value: '1,247',
      change: 34,
      icon: BarChart3,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Analytics Dashboard
        </h1>
        <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Detailed insights and performance metrics
        </p>
      </div>

      

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`p-6 rounded-xl ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        } shadow-lg`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Top Performing Categories
          </h2>
          <div className="space-y-4">
            {['Electronics', 'Clothing', 'Home & Garden', 'Sports'].map((category, index) => (
              <div key={category} className="flex items-center justify-between">
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{category}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${85 - index * 10}%` }}
                    ></div>
                  </div>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {85 - index * 10}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`p-6 rounded-xl ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        } shadow-lg`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Recent Predictions
          </h2>
          <div className="space-y-4">
            {[
              { item: 'Summer Clothing', prediction: '+25%', confidence: '94%' },
              { item: 'Electronics', prediction: '+12%', confidence: '87%' },
              { item: 'Home Decor', prediction: '-8%', confidence: '91%' },
              { item: 'Sports Equipment', prediction: '+18%', confidence: '89%' }
            ].map((pred, index) => (
              <div key={index} className={`p-3 rounded-lg ${
                isDark ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {pred.item}
                  </span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    pred.prediction.startsWith('+') 
                      ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
                      : 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
                  }`}>
                    {pred.prediction}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Confidence: {pred.confidence}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;