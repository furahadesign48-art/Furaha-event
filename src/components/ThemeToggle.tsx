import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className="relative p-2 rounded-full bg-gradient-to-r from-amber-100 to-amber-200 dark:from-slate-700 dark:to-slate-600 hover:from-amber-200 hover:to-amber-300 dark:hover:from-slate-600 dark:hover:to-slate-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 group"
      title={isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      <div className="relative w-5 h-5">
        <Sun 
          className={`absolute inset-0 h-5 w-5 text-amber-600 dark:text-amber-400 transition-all duration-300 transform ${
            isDarkMode ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
        />
        <Moon 
          className={`absolute inset-0 h-5 w-5 text-slate-600 dark:text-slate-300 transition-all duration-300 transform ${
            isDarkMode ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
      
      {/* Effet de lueur */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400/20 to-amber-500/20 dark:from-slate-400/20 dark:to-slate-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
    </button>
  );
};

export default ThemeToggle;