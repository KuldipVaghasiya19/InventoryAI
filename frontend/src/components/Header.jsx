import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, BarChart3, Home } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Header = () => {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    // { path: '/analytics', icon: BarChart3, label: 'Analytics' }
  ];

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-lg border-b transition-colors duration-300 ${
      isDark 
        ? 'bg-gray-900/80 border-gray-700' 
        : 'bg-white/80 border-gray-200'
    }`}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 group">
          <div className={`p-2 rounded-lg transition-all duration-300 group-hover:scale-110 ${
            isDark ? 'bg-blue-600' : 'bg-blue-500'
          }`}>
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <h1 className={`text-xl font-bold transition-colors ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            InventoryAI
          </h1>
        </Link>

        <nav className="flex items-center space-x-1">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                location.pathname === path
                  ? isDark
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : isDark
                    ? 'text-gray-300 hover:bg-gray-800'
                    : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>

        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
            isDark 
              ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};

export default Header;