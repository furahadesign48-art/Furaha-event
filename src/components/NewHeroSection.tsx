import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const NewHeroSection = () => {
  const { t } = useLanguage();

  return (
    <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-50 via-neutral-50 to-amber-100/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900/80 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-amber-200/30 to-rose-200/30 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-purple-200/30 to-amber-200/30 rounded-full blur-xl animate-bounce-slow"></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-gradient-to-r from-emerald-200/30 to-amber-200/30 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="max-w-4xl mx-auto text-center animate-fade-in">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 bg-clip-text text-transparent">
          <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 dark:from-amber-400 dark:via-amber-300 dark:to-amber-400 bg-clip-text text-transparent">
            Furaha-Event
          </span>
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-700 dark:text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
          {t('hero_description') || 'Créez des invitations magnifiques et interactives pour tous vos événements spéciaux'}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-white px-8 py-4 rounded-full hover:from-amber-600 hover:via-amber-700 hover:to-amber-600 transition-all duration-500 font-semibold text-lg shadow-glow-amber hover:shadow-luxury transform hover:scale-105 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-1000"></div>
            {t('discover_templates') || 'Découvrir nos modèles'}
          </button>
          
          <button className="bg-transparent border-2 border-amber-500 text-amber-600 dark:text-amber-400 px-8 py-4 rounded-full hover:bg-amber-500 hover:text-white dark:hover:text-slate-900 transition-all duration-500 font-semibold text-lg shadow-lg hover:shadow-luxury transform hover:scale-105 backdrop-blur-sm">
            {t('view_pricing') || 'Voir les tarifs'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default NewHeroSection;