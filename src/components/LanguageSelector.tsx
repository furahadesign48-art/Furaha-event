import React, { useState } from 'react';
import { Languages, ChevronDown } from 'lucide-react';
import { useLanguage, Language } from '../contexts/LanguageContext';

const LanguageSelector = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
    { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
    { code: 'es' as Language, name: 'Español', flag: '🇪🇸' }
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-100 to-amber-200 dark:from-slate-700 dark:to-slate-600 hover:from-amber-200 hover:to-amber-300 dark:hover:from-slate-600 dark:hover:to-slate-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 group"
        title={t('language')}
      >
        <div className="relative">
          <Languages className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <div className="absolute inset-0 animate-pulse opacity-30">
            <Languages className="h-4 w-4 text-amber-400 dark:text-amber-300" />
          </div>
        </div>
        
        <span className="text-sm font-medium text-amber-700 dark:text-amber-300 hidden sm:block">
          {currentLanguage?.flag} {currentLanguage?.name}
        </span>
        
        <ChevronDown 
          className={`h-3 w-3 text-amber-600 dark:text-amber-400 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-luxury border border-neutral-200/50 dark:border-slate-600/50 py-2 z-50 animate-slide-up">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center px-4 py-3 text-left hover:bg-amber-50 dark:hover:bg-slate-700 transition-all duration-200 ${
                language === lang.code 
                  ? 'bg-amber-100 dark:bg-slate-700 text-amber-700 dark:text-amber-300' 
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <span className="text-lg mr-3">{lang.flag}</span>
              <div>
                <div className="font-medium">{lang.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {lang.code}
                </div>
              </div>
              {language === lang.code && (
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;