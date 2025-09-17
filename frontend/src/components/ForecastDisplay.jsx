import React from 'react';
import { Calendar, TrendingUp, Package, Clock, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

const ForecastDisplay = ({ forecastData, startMonth, endMonth }) => {
  // ✅ THIS IS THE FIRST DEBUGGING LINE.
  // It shows what data the component initially receives.
  console.log('--- DATA RECEIVED BY DISPLAY COMPONENT ---', forecastData);

  const { isDark } = useTheme();

  if (!forecastData) {
    return null;
  }

  const { forecasted_products, meta } = forecastData;

  if (!forecasted_products || forecasted_products.length === 0) {
    return (
      <div className={`p-6 rounded-xl text-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>No forecast data available to display.</p>
      </div>
    );
  }

  const productNames = Object.keys(forecasted_products[0][Object.keys(forecasted_products[0])[0]]);

  const lineChartData = forecasted_products.map(forecast => {
    const date = Object.keys(forecast)[0];
    const products = forecast[date];
    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      ...products
    };
  });

  const latestForecast = forecasted_products[forecasted_products.length - 1];
  const latestDate = Object.keys(latestForecast)[0];
  const barChartData = Object.entries(latestForecast[latestDate])
    .map(([product, value]) => ({
      product,
      value: value !== null && !isNaN(value) ? Number(value).toFixed(0) : 0,
    }));

  const pieChartData = productNames.map(product => {
    const total = forecasted_products.reduce((sum, forecast) => {
      const date = Object.keys(forecast)[0];
      const value = forecast[date][product];
      return sum + (value !== null && !isNaN(value) ? Number(value).toFixed(0) : 0);
    }, 0);
    return { name: product, value: total };
  }).filter(item => item.value > 0);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  const chartTheme = {
    grid: isDark ? '#374151' : '#E5E7EB',
    text: isDark ? '#D1D5DB' : '#374151',
    background: isDark ? '#1F2937' : '#FFFFFF'
  };

  const formatDisplayMonth = (monthString) => {
    if (!monthString) return '';
    const [year, month] = monthString.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-8">
      {/* Meta Information */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
        <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-5 h-5 text-white p-1 bg-blue-500 rounded-lg" />
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Forecast Summary</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Method</p>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{meta.method.toUpperCase()}</p>
            </div>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Analysis Date</p>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{new Date(meta.generated_on).toLocaleDateString()}</p>
            </div>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Products</p>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{Object.keys(meta.last_dates_per_product).length}</p>
            </div>
            {startMonth && endMonth && (
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Period</p>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatDisplayMonth(startMonth)} - {formatDisplayMonth(endMonth)}</p>
                </div>
            )}
        </div>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Forecast Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis dataKey="date" stroke={chartTheme.text} fontSize={12} />
              <YAxis stroke={chartTheme.text} fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: chartTheme.background, border: `1px solid ${chartTheme.grid}` }} />
              {productNames.map((product, index) => (
                <Line key={product} type="monotone" dataKey={product} stroke={COLORS[index % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Latest Month Forecast</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis dataKey="product" stroke={chartTheme.text} fontSize={12} />
              <YAxis stroke={chartTheme.text} fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: chartTheme.background, border: `1px solid ${chartTheme.grid}` }} />
              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Detailed Forecasted Products */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
        <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Monthly Forecasted Values</h2>
        <div className="space-y-6">
          {forecasted_products.map((forecast, index) => {
            const date = Object.keys(forecast)[0];
            const products = forecast[date];
            return (
              <div key={index} className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {Object.entries(products).map(([product, value]) => {
                    // ✅ THIS IS THE MAIN DEBUGGING LINE. Check your browser console for its output.
                    console.log(`Product: ${product}, Value: ${value}, Type of Value: ${typeof value}`);

                    return (
                      <div key={product} className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{product}</span>
                        <p className={`text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {value !== null && !isNaN(value) ? Number(value).toFixed(0) : 'N/A'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ForecastDisplay;