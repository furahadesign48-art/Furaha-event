import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Sparkles,
  Heart,
  CheckCircle2,
  Users,
  Clock,
  MessageCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';

const PhoneMockup = ({ 
  src, 
  className,
  alt = "Modèle d'invitation",
  variant = 'black',
  size = 'md',
}: { 
  src: string; 
  className?: string;
  alt?: string;
  variant?: 'black' | 'white';
  size?: 'sm' | 'md' | 'lg';
}) => {
  const sizes = {
    sm: { w: 200, h: 400, screenR: '30px', frameR: '38px', notchW: 90, notchH: 22 },
    md: { w: 220, h: 440, screenR: '34px', frameR: '42px', notchW: 96, notchH: 24 },
    lg: { w: 260, h: 520, screenR: '40px', frameR: '50px', notchW: 120, notchH: 28 },
  };
  const s = sizes[size];

  const frameBg = variant === 'white' 
    ? 'linear-gradient(180deg, #f5f5f5 0%, #e5e5e5 25%, #d4d4d4 55%, #c0c0c0 85%, #a8a8a8 100%)'
    : 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 50%, #0f0f0f 100%)';
  const notchBg = variant === 'white' ? '#1f1f1f' : '#0a0a0a';
  const outerBorder = variant === 'white'
    ? '0 0 0 1px rgba(255,255,255,0.85), 0 0 0 2px rgba(0,0,0,0.15), 0 2px 0 rgba(255,255,255,0.5) inset, 0 -2px 0 rgba(0,0,0,0.1) inset'
    : '0 0 0 1px rgba(251,191,36,0.18)';

  return (
    <div className={cn("relative", className)}>
      <div 
        className="relative p-[10px] shadow-2xl" 
        style={{
          width: `${s.w}px`,
          height: `${s.h}px`,
          borderRadius: s.frameR,
          background: frameBg,
          boxShadow: `0 30px 80px -20px rgba(0,0,0,0.75), ${outerBorder}`,
        }}>
        <div 
          className="absolute left-1/2 z-20 rounded-full"
          style={{
            top: '10px',
            transform: 'translateX(-50%)',
            width: `${s.notchW}px`,
            height: `${s.notchH}px`,
            background: notchBg,
          }} 
        />
        <div 
          className="w-full h-full overflow-hidden"
          style={{
            borderRadius: s.screenR,
            background: '#000',
          }}>
          <img 
            src={src} 
            alt={alt}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div 
          className="absolute rounded-l"
          style={{ 
            left: '-3px', 
            top: '18%', 
            width: '3px', 
            height: '8%', 
            background: variant === 'white' ? '#9a9a9a' : '#333' 
          }} 
        />
        <div 
          className="absolute rounded-l"
          style={{ 
            left: '-3px', 
            top: '30%', 
            width: '3px', 
            height: '14%', 
            background: variant === 'white' ? '#9a9a9a' : '#333' 
          }} 
        />
        <div 
          className="absolute rounded-r"
          style={{ 
            right: '-3px', 
            top: '24%', 
            width: '3px', 
            height: '12%', 
            background: variant === 'white' ? '#9a9a9a' : '#333' 
          }} 
        />
      </div>
    </div>
  );
};

const NewHeroSection = () => {
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();

  const primaryLabel =
    t('discover_templates') || "Découvrir nos modèles";

  return (
    <section className={cn(
      "relative w-full overflow-hidden pt-28 sm:pt-32 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8 border-b transition-colors duration-500",
      isDarkMode ? "border-white/5" : "border-amber-900/10"
    )}>
      <div 
        className="absolute inset-0 z-0 transition-colors duration-500"
        style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, #1a0f1f 0%, #2d1b2e 25%, #1a0f1f 50%, #0f0a14 75%, #0b0f17 100%)'
            : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 25%, #fffbeb 50%, #fef7ed 75%, #ffffff 100%)'
        }}
      />
      <div 
        className="absolute inset-0 z-0 opacity-30"
        style={{
          backgroundImage: isDarkMode
            ? `
              linear-gradient(to right, rgba(251,191,36,0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(251,191,36,0.05) 1px, transparent 1px)
            `
            : `
              linear-gradient(to right, rgba(180,83,9,0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(180,83,9,0.08) 1px, transparent 1px)
            `,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse at 50% 35%, black 0%, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 35%, black 0%, transparent 72%)'
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -top-48 -left-40 w-[680px] h-[680px] rounded-full pointer-events-none z-0 blur-3xl"
        style={{
          background: isDarkMode
            ? 'radial-gradient(closest-side, rgba(251,191,36,0.30), rgba(251,191,36,0) 70%)'
            : 'radial-gradient(closest-side, rgba(251,191,36,0.22), rgba(251,191,36,0) 70%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-48 -right-40 w-[720px] h-[720px] rounded-full pointer-events-none z-0 blur-3xl"
        style={{
          background: isDarkMode
            ? 'radial-gradient(closest-side, rgba(139,92,246,0.15), rgba(139,92,246,0) 70%)'
            : 'radial-gradient(closest-side, rgba(168,85,247,0.10), rgba(168,85,247,0) 70%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto w-full">
        {/* ============== 1. TITRE + CTA (mobile & desktop) ============== */}
        <div className="text-center lg:text-left lg:max-w-none">
          <div className="grid lg:grid-cols-2 lg:gap-8 lg:items-start">
            <div>
              <h1 className={cn(
                "font-extrabold tracking-tight leading-[1.05] mb-0 text-center lg:text-left transition-colors duration-500",
                isDarkMode ? "text-white" : "text-amber-950"
              )}
                  style={{ 
                    fontSize: 'clamp(1.8rem, 6vw, 4.2rem)',
                    textShadow: isDarkMode ? '0 10px 40px rgba(0,0,0,0.5)' : '0 4px 20px rgba(180,83,9,0.15)'
                  }}>
                Donnez vie à votre
              </h1>
              <h1 className={cn(
                "font-extrabold tracking-tight leading-[1.05] mb-8 sm:mb-10 text-center lg:text-left transition-colors duration-500",
                isDarkMode ? "text-white" : "text-amber-950"
              )}
                  style={{ 
                    fontSize: 'clamp(1.8rem, 6vw, 4.2rem)',
                    textShadow: isDarkMode ? '0 10px 40px rgba(0,0,0,0.5)' : '0 4px 20px rgba(180,83,9,0.15)'
                  }}>
                événement avec{' '}
                <span
                  className="transition-all duration-500 bg-clip-text text-transparent"
                  style={{
                    backgroundImage: isDarkMode
                      ? 'linear-gradient(135deg, #a78bfa 0%, #fcd34d 35%, #fbbf24 65%, #7c3aed 100%)'
                      : 'linear-gradient(135deg, #9333ea 0%, #d97706 50%, #7c3aed 100%)',
                  }}
                >
                  Une invitation haut de gamme
                </span>
              </h1>

              <div className="flex justify-center lg:justify-start mb-12 lg:mb-0">
                <a
                  href="https://wa.me/243844333917"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-full text-base font-bold tracking-wide transition-all duration-300 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-amber-400/70 w-full sm:w-auto"
                  style={{
                    background: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 40%, #d97706 70%, #7c3aed 100%)',
                    color: '#0b0f17',
                    boxShadow: '0 0 0 1px rgba(251,191,36,0.5), 0 15px 40px -10px rgba(251,191,36,0.6), 0 0 60px -20px rgba(139,92,246,0.5)'
                  }}
                >
                  <MessageCircle className="w-5 h-5 shrink-0" />
                  Nous contacter
                </a>
              </div>
            </div>

            {/* ============== 2. MOCKUP 3 TELEPHONES - DESKTOP SEULEMENT ============== */}
            <div className="relative h-[600px] hidden lg:block">
              <div className="absolute inset-x-0 bottom-0 h-[540px] pointer-events-none">
                <div className="absolute left-1/2 -translate-x-1/2 bottom-0 z-0 origin-bottom scale-[1.12]">
                  <PhoneMockup
                    src="/model2.jpg"
                    alt="Modèle 2"
                    variant="white"
                    size="lg"
                  />
                </div>
                <div className="absolute left-[2%] bottom-0 z-20 origin-bottom-left scale-[0.90] -ml-2">
                  <PhoneMockup
                    src="/model1.jpg"
                    alt="Modèle 1"
                    variant="black"
                    size="md"
                  />
                </div>
                <div className="absolute right-[2%] bottom-0 z-20 origin-bottom-right scale-[0.90] -mr-2">
                  <PhoneMockup
                    src="/model3.jpg"
                    alt="Modèle 3"
                    variant="black"
                    size="md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============== 2. MOCKUP - MOBILE + TABLETTE (ordres 2) ============== */}
        <div className="lg:hidden relative my-10 sm:my-14 flex justify-center">
          <div className="relative w-full max-w-[340px] sm:max-w-[400px] h-[360px] sm:h-[420px] flex items-end justify-center pointer-events-none">
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 z-0 origin-bottom scale-[0.88] sm:scale-[0.92]">
              <PhoneMockup
                src="/model2.jpg"
                alt="Modèle 2"
                variant="white"
                size="md"
              />
            </div>
            <div className="absolute left-0 bottom-0 z-20 origin-bottom-left scale-[0.62] sm:scale-[0.66] -ml-4 sm:-ml-2">
              <PhoneMockup
                src="/model1.jpg"
                alt="Modèle 1"
                variant="black"
                size="sm"
              />
            </div>
            <div className="absolute right-0 bottom-0 z-20 origin-bottom-right scale-[0.62] sm:scale-[0.66] -mr-4 sm:-mr-2">
              <PhoneMockup
                src="/model3.jpg"
                alt="Modèle 3"
                variant="black"
                size="sm"
              />
            </div>
          </div>
        </div>


      </div>
    </section>
  );
};

export default NewHeroSection;
