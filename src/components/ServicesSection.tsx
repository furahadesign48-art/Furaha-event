import React from 'react';
import { Heart, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ServicesSectionProps {
  onViewWeddingTemplate?: () => void;
}

const ServicesSection = ({ onViewWeddingTemplate }: ServicesSectionProps) => {
  const { t } = useLanguage();

  const weddingService = {
    id: 1,
    title: t('wedding_invitations') || 'Invitations de Mariage',
    description: t('wedding_description') || 'Une expérience interactive complète pour le plus beau jour de votre vie. Invitations élégantes et entièrement personnalisées, RSVP intelligent, livre d\'or animé avec réponses, jeux d\'ambiance, galerie 3D immersive et check-in invités le jour J.',
    image: 'https://static.vecteezy.com/system/resources/thumbnails/056/699/345/small_2x/a-young-couple-of-african-american-bride-and-groom-at-their-wedding-ceremony-photo.jpg',
    icon: Heart,
    features: [
      'Compte à rebours personnalisé',
      'Galerie photo 3D immersive',
      'RSVP + choix de boissons',
      'Livre d\'or interactif avec réponses',
      'Quiz couple & Memory amoureux',
      'Catch Love & Défis photo',
      'Timeline Histoire d\'amour',
      'Check-in invités & QR Code',
      'Itinéraire et plan d\'accès'
    ]
  };

  return (
    <section id="services" className="relative py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#0a0d14] border-t border-white/5 overflow-hidden">
      {/* Subtle dot grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '26px 26px',
        }}
      />
      {/* Ambient glow */}
      <div className="absolute top-1/3 right-0 w-[620px] h-[620px] -translate-y-1/2 translate-x-1/3 rounded-full pointer-events-none blur-3xl"
           style={{
             background:
               'radial-gradient(closest-side, rgba(251,191,36,0.28), rgba(251,191,36,0) 70%)',
           }}
      />

      <div className="relative max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12 md:mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1 rounded-full"
               style={{
                 border: '1px solid rgba(251,191,36,0.25)',
                 background: 'linear-gradient(180deg, rgba(251,191,36,0.1), rgba(251,191,36,0.02))',
               }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
            <span className="font-mono text-[11px] tracking-wide uppercase"
                  style={{ color: '#fcd34d' }}
            >
              {t('wedding_only') || 'Modèle phare — Mariage'}
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            {t('our_services') || 'Notre Offre Mariage'}
          </h2>
          <p className="text-base md:text-lg text-white/55 max-w-2xl mx-auto leading-relaxed">
            {t('services_description') || 'Une invitation premium et interactive qui transforme l\'annonce de votre union en une expérience mémorable pour tous vos invités'}
          </p>
        </div>

        {/* Main card - GitHub style */}
        <div className="animate-slide-up relative">
          {/* GITHUB-STYLE BACKLIGHT GLOW sous la carte */}
          <div
            aria-hidden="true"
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[92%] h-[70%] pointer-events-none blur-3xl opacity-70"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(251,191,36,0.38) 0%, rgba(251,191,36,0.16) 38%, rgba(251,191,36,0) 70%)',
            }}
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[110%] h-40 pointer-events-none blur-3xl opacity-50"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(244,114,182,0.12) 0%, rgba(244,114,182,0) 70%)',
            }}
          />

          <div
            className="relative rounded-2xl overflow-hidden group"
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              background:
                'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
              boxShadow:
                '0 30px 80px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(251,191,36,0.05) inset',
              transition: 'all 400ms cubic-bezier(0.22,1,0.36,1)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(251,191,36,0.25)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            {/* Top badge bar - GitHub repo style */}
            <div className="flex items-center justify-between px-5 sm:px-7 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                <span className="font-mono text-[11.5px] text-white/60">
                  templates/<span style={{ color: '#fcd34d' }}>wedding-premium</span>
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-white/50">
                <div className="inline-flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" style={{ color: '#fbbf24' }} />
                  <span>v3.1</span>
                </div>
                <div className="inline-flex items-center gap-1.5">
                  <Heart className="w-3 h-3 text-rose-400" />
                  <span>★ Pro</span>
                </div>
              </div>
            </div>

            {/* Image area */}
            <div className="relative h-52 md:h-72 overflow-hidden border-b border-white/5">
              <img
                src={weddingService.image}
                alt={weddingService.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0"
                   style={{
                     background:
                       'linear-gradient(180deg, rgba(10,13,20,0.1) 0%, rgba(10,13,20,0.65) 60%, rgba(10,13,20,0.9) 100%)',
                   }}
              />
            </div>

            {/* Content */}
            <div className="p-6 md:p-10 text-center">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8">
                {weddingService.title}
              </h3>

              <button
                onClick={onViewWeddingTemplate}
                className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-md text-sm font-semibold transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background:
                    'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                  color: '#0b0f17',
                  boxShadow:
                    '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 10px 30px -10px rgba(251,191,36,0.55)',
                }}
              >
                <Heart className="w-4 h-4 fill-current" />
                <span>{t('view_templates') || 'Découvrir le modèle Mariage'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
