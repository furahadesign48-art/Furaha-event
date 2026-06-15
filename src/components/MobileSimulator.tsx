import React from 'react';
import { Smartphone, Sparkles, Heart } from 'lucide-react';

const MobileSimulator = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-50 via-purple-50/30 to-emerald-50/20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-1/4 w-44 h-44 bg-gradient-to-r from-amber-200/15 to-purple-200/15 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-1/4 w-36 h-36 bg-gradient-to-r from-emerald-200/15 to-amber-200/15 rounded-full blur-3xl animate-bounce-slow"></div>
      </div>
      
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Expérience mobile 
              </span>
              <span className="bg-gradient-to-r from-amber-500 via-amber-600 to-purple-500 bg-clip-text text-transparent block">parfaite</span>
            </h2>
            
            <p className="text-xl text-slate-600 mb-8 leading-relaxed backdrop-blur-sm bg-neutral-50/50 rounded-xl p-6 border border-amber-200/30">
              Vos invités recevront des invitations optimisées pour mobile, avec une interface intuitive 
              et des <span className="text-amber-700 font-medium">animations fluides</span> qui reflètent le prestige de votre événement.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-rose-500 rounded-full mr-4 animate-pulse shadow-glow-amber"></div>
                <span className="text-slate-700">Interface responsive et élégante</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-amber-500 rounded-full mr-4 animate-pulse shadow-glow-purple" style={{ animationDelay: '0.5s' }}></div>
                <span className="text-slate-700">Confirmation de présence en un clic</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full mr-4 animate-pulse" style={{ animationDelay: '1s' }}></div>
                <span className="text-slate-700">Partage facile sur réseaux sociaux</span>
              </div>
            </div>
          </div>

          {/* Mobile Mockup */}
          <div className="flex justify-center animate-slide-up">
            <div className="relative">
              {/* Phone Frame */}
              <div className="relative w-72 h-96 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] p-6 shadow-luxury border border-slate-700">
                <div className="w-full h-full bg-gradient-to-br from-neutral-50 to-amber-50/30 rounded-[2rem] overflow-hidden relative shadow-inner">
                  {/* Status Bar */}
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 h-6 flex items-center justify-between px-6 text-neutral-50 text-xs">
                    <span>9:41</span>
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                      <div className="w-1 h-1 bg-rose-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                    </div>
                  </div>
                  
                  {/* Invitation Content */}
                  <div className="p-6 h-full bg-gradient-to-br from-amber-50 via-rose-50/30 to-purple-50/20">
                    <div className="text-center mb-6">
                      <div className="relative mx-auto mb-3 w-fit">
                        <Sparkles className="h-10 w-10 text-amber-500 animate-glow drop-shadow-lg" />
                        <div className="absolute inset-0 animate-ping">
                          <Sparkles className="h-10 w-10 text-rose-400 opacity-30" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">Mariage de Sophie & Lucas</h3>
                      <p className="text-slate-600 text-sm">Samedi 15 Juin 2024</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-neutral-50 to-amber-50/50 rounded-2xl p-4 shadow-luxury mb-6 border border-amber-200/30 backdrop-blur-sm">
                      <div className="h-32 bg-gradient-to-br from-amber-100 via-rose-100/50 to-amber-200 rounded-xl flex items-center justify-center mb-4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent"></div>
                        <div className="relative">
                          <Heart className="h-14 w-14 text-amber-600 animate-glow drop-shadow-lg" />
                          <div className="absolute inset-0 animate-pulse">
                            <Heart className="h-14 w-14 text-rose-500 opacity-30" />
                          </div>
                        </div>
                      </div>
                      <p className="text-center text-slate-700 text-sm leading-relaxed">
                        "Nous avons l'honneur de vous inviter à célébrer notre union..."
                      </p>
                    </div>
                    
                    <button className="w-full bg-gradient-to-r from-amber-500 to-rose-500 text-slate-900 py-3 rounded-full font-semibold text-sm shadow-glow-amber hover:shadow-luxury transition-all duration-300 transform hover:scale-105 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"></div>
                      Confirmer ma présence
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-r from-amber-400 to-rose-400 rounded-full opacity-20 animate-float blur-lg"></div>
              <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full opacity-15 animate-float blur-lg" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/4 -left-6 w-10 h-10 bg-gradient-to-r from-rose-400 to-amber-400 rounded-full opacity-25 animate-bounce-slow blur-sm"></div>
              <div className="absolute bottom-1/4 -right-4 w-8 h-8 bg-gradient-to-r from-emerald-400 to-purple-400 rounded-full opacity-30 animate-float blur-sm" style={{ animationDelay: '2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MobileSimulator;