import React from 'react';
import { Calendar, TrendingUp, Package, Clock, BarChart3, LineChart } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

const ForecastDisplay = ({ forecastData }) => {
  const { isDark } = useTheme();

  if (!forecastData) return null;

  const { forecasted_products, metrics } = forecastData;

  // Prepare data for line chart
  const lineChartData = forecasted_products.map(forecast => {
    const date = Object.keys(forecast)[0];
    const products = forecast[date];
    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      ...products
    };
  });

  // Prepare data for bar chart (latest month)
  const latestForecast = forecasted_products[forecasted_products.length - 1];
  const latestDate = Object.keys(latestForecast)[0];
  const barChartData = Object.entries(latestForecast[latestDate]).map(([product, value]) => ({
    product,
    value
  }));

  // Prepare data for pie chart (total forecast by product)
  const pieChartData = Object.keys(forecasted_products[0][Object.keys(forecasted_products[0])[0]]).map(product => {
    const total = forecasted_products.reduce((sum, forecast) => {
      const date = Object.keys(forecast)[0];
      return sum + forecast[date][product];
    }, 0);
    return {
      name: product,
      value: total
    };
  });

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const chartTheme = {
    grid: isDark ? '#374151' : '#E5E7EB',
    text: isDark ? '#D1D5DB' : '#374151',
    background: isDark ? '#1F2937' : '#FFFFFF'
  };

  return (
    <div className="space-y-8">
      {/* Meta Information */}
      {/* <div className={`p-6 rounded-xl ${
        isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      } shadow-lg`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-500 rounded-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Forecast Summary
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center space-x-2 mb-2">
              <Package className="w-4 h-4 text-blue-500" />
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Method
              </span>
            </div>
            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {meta.method.toUpperCase()}
            </p>
          </div>
          
          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-green-500" />
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Generated On
              </span>
            </div>
            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {new Date(meta.generated_on).toLocaleDateString()}
            </p>
          </div>
          
          <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Products
              </span>
            </div>
            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {Object.keys(meta.last_dates_per_product).length}
            </p>
          </div>
        </div>
      </div> */}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Line Chart - Trend Analysis */}
        <div className={`p-6 rounded-xl ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        } shadow-lg`}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-500 rounded-lg">
              <LineChart className="w-5 h-5 text-white" />
            </div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Forecast Trends
            </h3>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis 
                dataKey="date" 
                stroke={chartTheme.text}
                fontSize={12}
              />
              <YAxis 
                stroke={chartTheme.text}
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: chartTheme.background,
                  border: `1px solid ${chartTheme.grid}`,
                  borderRadius: '8px',
                  color: chartTheme.text
                }}
              />
              {Object.keys(forecasted_products[0][Object.keys(forecasted_products[0])[0]]).map((product, index) => (
                <Line 
                  key={product}
                  type="monotone" 
                  dataKey={product} 
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: COLORS[index % COLORS.length], strokeWidth: 2 }}
                />
              ))}
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - Latest Month */}
        <div className={`p-6 rounded-xl ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        } shadow-lg`}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-500 rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Latest Month Forecast
            </h3>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis 
                dataKey="product" 
                stroke={chartTheme.text}
                fontSize={12}
              />
              <YAxis 
                stroke={chartTheme.text}
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: chartTheme.background,
                  border: `1px solid ${chartTheme.grid}`,
                  borderRadius: '8px',
                  color: chartTheme.text
                }}
              />
              <Bar 
                dataKey="value" 
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        
        {/* Summary Table */}
        {/* <div className={`p-6 rounded-xl ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        } shadow-lg`}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Forecast Summary
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className={`text-left py-3 px-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Product
                  </th>
                  <th className={`text-right py-3 px-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Avg Forecast
                  </th>
                  <th className={`text-right py-3 px-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(forecasted_products[0][Object.keys(forecasted_products[0])[0]]).map(product => {
                  const values = forecasted_products.map(forecast => {
                    const date = Object.keys(forecast)[0];
                    return forecast[date][product];
                  });
                  const avg = Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
                  const trend = values[values.length - 1] > values[0] ? 'up' : 'down';
                  const trendPercent = Math.round(((values[values.length - 1] - values[0]) / values[0]) * 100);
                  
                  return (
                    <tr key={product} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <td className={`py-3 px-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {product}
                      </td>
                      <td className={`py-3 px-2 text-right ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {avg.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          trend === 'up'
                            ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
                            : 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
                        }`}>
                          {trend === 'up' ? '↗' : '↘'} {Math.abs(trendPercent)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div> */}
      </div>

      {/* Detailed Forecasted Products */}
      <div className={`p-6 rounded-xl ${
        isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      } shadow-lg`}>
        <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Monthly Forecasted Values
        </h2>
        
        <div className="space-y-6">
          {forecasted_products.map((forecast, index) => {
            const date = Object.keys(forecast)[0];
            const products = forecast[date];
            
            return (
              <div key={index} className={`p-4 rounded-lg border ${
                isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center space-x-2 mb-4">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {new Date(date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                  {Object.entries(products).map(([product, value]) => (
                    <div key={product} className={`p-3 rounded-lg ${
                      isDark ? 'bg-gray-800' : 'bg-white'
                    } border ${isDark ? 'border-gray-600' : 'border-gray-200'} hover:shadow-md transition-shadow`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${
                          isDark ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {product}
                        </span>
                        <Package className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className={`text-lg font-bold mt-1 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {value.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Last Dates Per Product */}
      {/* <div className={`p-6 rounded-xl ${
        isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      } shadow-lg`}>
        <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Last Data Points
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Object.entries(meta.last_dates_per_product).map(([product, lastDate]) => (
            <div key={product} className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-700' : 'bg-gray-50'
            } hover:shadow-md transition-shadow`}>
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {product}
                </span>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {new Date(lastDate).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
};

export default ForecastDisplay;