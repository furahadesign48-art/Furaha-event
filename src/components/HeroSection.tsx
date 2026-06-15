import React from 'react';
import { ArrowRight } from 'lucide-react';
import furahaLogo from '../images/FURAHA-GOLD.png';

const HeroSection = () => {
  return (
    <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-neutral-100 via-amber-50/40 to-purple-50/30 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-amber-200/30 to-rose-200/30 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-purple-200/30 to-amber-200/30 rounded-full blur-xl animate-bounce-slow"></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-gradient-to-r from-emerald-200/30 to-amber-200/30 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="max-w-7xl mx-auto">
        <div className="text-center animate-fade-in">
          <div className="flex justify-center items-center mb-6">
            <div className="relative">
              <img src={furahaLogo} alt="Furaha Event Logo" className="h-12 w-12 object-contain animate-glow drop-shadow-lg" />
              <div className="absolute inset-0 animate-ping">
                <img src={furahaLogo} alt="Furaha Event Logo ping" className="h-12 w-12 object-contain opacity-30" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Invitations digitales 
            <span className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 bg-clip-text text-transparent block">élégantes</span>
            <span className="text-2xl md:text-3xl lg:text-4xl font-normal bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 bg-clip-text text-transparent">
              pour vos événements
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed backdrop-blur-sm bg-neutral-50/30 rounded-2xl p-6 border border-amber-200/20">
            Créez des invitations inoubliables qui reflètent le prestige de vos événements. 
            <span className="text-amber-700 font-medium">Design sophistiqué</span>, personnalisation complète, envoi instantané.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-900 px-8 py-4 rounded-full hover:from-amber-600 hover:via-amber-700 hover:to-amber-600 transition-all duration-500 font-semibold text-lg shadow-glow-amber hover:shadow-luxury flex items-center group transform hover:scale-105 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              Commencer gratuitement
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
            
            <button className="bg-transparent border-2 border-gradient-to-r from-slate-800 to-slate-900 text-slate-900 px-8 py-4 rounded-full hover:bg-gradient-to-r hover:from-slate-900 hover:to-slate-800 hover:text-neutral-50 transition-all duration-500 font-semibold text-lg shadow-lg hover:shadow-luxury transform hover:scale-105 backdrop-blur-sm">
              Voir les modèles
            </button>
          </div>
        </div>
        
        {/* Hero Image Placeholder */}
        <div className="mt-16 flex justify-center animate-slide-up">
          <div className="relative">
            <div className="w-80 h-60 md:w-96 md:h-72 bg-gradient-to-br from-amber-100 via-amber-50 to-rose-100 rounded-3xl shadow-luxury border border-amber-200/50 flex items-center justify-center backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-200/20 via-transparent to-purple-200/20"></div>
              <div className="text-center">
                <div className="relative">
                  <img src={furahaLogo} alt="Furaha Logo" className="h-16 w-16 mx-auto mb-4 animate-glow drop-shadow-lg object-contain" />
                  <div className="absolute inset-0 animate-pulse">
                    <img src={furahaLogo} alt="Furaha Logo pulse" className="h-16 w-16 mx-auto mb-4 opacity-30 object-contain" />
                  </div>
                </div>
                <p className="text-amber-800 font-semibold text-lg">Aperçu d'invitation</p>
                <p className="text-amber-700 font-medium">Design élégant & moderne</p>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-gradient-to-r from-amber-400 to-rose-400 rounded-full opacity-20 animate-float blur-sm"></div>
            <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-r from-purple-500 to-amber-500 rounded-full opacity-15 animate-float blur-sm" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 -right-8 w-12 h-12 bg-gradient-to-r from-emerald-400 to-amber-400 rounded-full opacity-25 animate-bounce-slow blur-sm"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
