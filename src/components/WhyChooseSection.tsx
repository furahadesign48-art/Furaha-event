import React from 'react';
import { 
  Timer, 
  Images, 
  CheckSquare, 
  MessageSquareHeart, 
  Gamepad2, 
  Users,
  Sparkles,
  Wine,
  MapPin,
  Heart,
  Trophy,
  QrCode,
  MessageCircle,
  Mail
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';
import type { GlassCardProps } from './ui/glass-cards';

const rgbFromColor = (c: string) =>
  c.replace(/rgba?\(([^,]+),([^,]+),([^,]+),?[^)]*\)/, "rgb($1,$2,$3)");

const StaticFeatureCard: React.FC<GlassCardProps & { index: number; isDarkMode: boolean }> = ({
  id, title, description, color, bullets, index, isDarkMode
}) => {
  const solidColor = rgbFromColor(color);
  return (
    <div
      className="relative w-full animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: '22px',
          background: isDarkMode
            ? 'linear-gradient(180deg, #141a2c 0%, #0d1220 100%)'
            : '#ffffff',
          border: isDarkMode
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid rgba(180, 83, 9, 0.14)',
          boxShadow: isDarkMode
            ? '0 20px 50px -20px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.25)'
            : '0 20px 50px -20px rgba(180, 83, 9, 0.18), 0 4px 12px rgba(180, 83, 9, 0.06)',
        }}
      >
        <div className="relative z-10 flex flex-col h-full p-4 sm:p-5 md:p-6">
          <div
            className="rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6"
            style={{
              background: isDarkMode
                ? color.replace(/[\d.]+\)$/, "0.08)")
                : color.replace(/[\d.]+\)$/, "0.10)"),
              border: isDarkMode
                ? `1px solid ${color.replace(/[\d.]+\)$/, "0.18)")}`
                : `1px solid ${color.replace(/[\d.]+\)$/, "0.22)")}`,
            }}
          >
            <div
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2 sm:mb-3"
              style={{
                color: solidColor,
                lineHeight: 1,
              }}
            >
              {String(index + 1).padStart(2, '0')}
            </div>
            <h3 className={cn(
              "text-lg sm:text-xl md:text-2xl font-bold leading-tight mb-2 sm:mb-3 transition-colors duration-500",
              isDarkMode ? "text-white" : "text-amber-950"
            )}>
              {title}
            </h3>
            <p
              className="leading-relaxed text-sm md:text-base transition-colors duration-500"
              style={{ color: isDarkMode ? "rgba(255,255,255,0.72)" : "rgba(120, 53, 15, 0.70)" }}
            >
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const WhyChooseSection = () => {
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();

  const features: Omit<GlassCardProps, 'index' | 'total'>[] = [
    {
      id: 1,
      title: t('countdown_title') || 'Compte à Rebours Animé',
      description: t('countdown_desc') || 'Vos invités voient les jours, heures, minutes et secondes défiler jusqu\'au grand jour. Une anticipation visuelle élégante qui crée l\'émotion dès l\'ouverture de l\'invitation.',
      icon: Timer,
      color: 'rgba(251, 191, 36, 0.9)',
      gradient: 'linear-gradient(135deg, #1a1205 0%, #2b1d07 40%, #3a2a0c 100%)',
      bullets: ['Jours / Heures / Minutes', 'Chiffres stylisés', 'Mise à jour en temps réel']
    },
    {
      id: 2,
      title: t('gallery_title') || 'Galerie Photo 3D Immersive',
      description: t('gallery_desc') || 'Présentez vos plus belles photos dans une galerie 3D parallaxe avec effet de profondeur. Visualiseur plein écran, zoom et défilement fluide pour un rendu premium.',
      icon: Images,
      color: 'rgba(236, 72, 153, 0.9)',
      gradient: 'linear-gradient(135deg, #1a0513 0%, #2b0a1e 40%, #3d0f28 100%)',
      bullets: ['Effet parallaxe 3D', 'Visualiseur plein écran', 'Galerie circulaire animée']
    },
    {
      id: 3,
      title: t('rsvp_title') || 'RSVP Intelligent + Boissons',
      description: t('rsvp_desc') || 'Gérez les confirmations en temps réel avec choix du menu boissons par invité (couple ou simple). Statistiques instantanées dans votre dashboard admin.',
      icon: CheckSquare,
      color: 'rgba(16, 185, 129, 0.9)',
      gradient: 'linear-gradient(135deg, #051a10 0%, #082b1b 40%, #0c3d26 100%)',
      bullets: ['Confirmation en 1 clic', 'Simple / Couple', 'Choix boissons personnalisé']
    },
    {
      id: 4,
      title: t('guestbook_title') || 'Livre d\'Or Interactif',
      description: t('guestbook_desc') || 'Vos invités laissent des messages que vous pouvez consulter et auxquels vous pouvez répondre en tant qu\'administrateur. Export PDF disponible pour garder un souvenir imprimé.',
      icon: MessageSquareHeart,
      color: 'rgba(59, 130, 246, 0.9)',
      gradient: 'linear-gradient(135deg, #050e1e 0%, #091733 40%, #0d2149 100%)',
      bullets: ['Messages invités en direct', 'Réponses administrateur', 'Export PDF souvenir']
    },
    {
      id: 5,
      title: t('games_title') || 'Jeux d\'Ambiance & Animations',
      description: t('games_desc') || 'Quiz couple, Memory des amoureux, Catch Love, Défis photo, Timeline histoire d\'amour, générateur de vœux… Des jeux pour animer vos invités avant et pendant l\'événement.',
      icon: Gamepad2,
      color: 'rgba(168, 85, 247, 0.9)',
      gradient: 'linear-gradient(135deg, #14061f 0%, #230c33 40%, #321147 100%)',
      bullets: ['Quiz & Memory', 'Catch Love & Défis photo', 'Timeline & Vœux']
    },
    {
      id: 6,
      title: t('checkin_title') || 'Check-in Invités & Dashboard',
      description: t('checkin_desc') || 'Panneau de contrôle complet : inscription des présents le jour J avec QR Code, gestion des tables, suivi des confirmations, envoi de rappels et export des listes.',
      icon: Users,
      color: 'rgba(249, 115, 22, 0.9)',
      gradient: 'linear-gradient(135deg, #1c0c04 0%, #2e1506 40%, #421e0a 100%)',
      bullets: ['Check-in / Check-out', 'QR Code par invité', 'Dashboard & Export Excel']
    }
  ];

  const highlightBadges = [
    { icon: MapPin, label: 'Plan d\'accès' },
    { icon: Heart, label: 'Timeline d\'amour' },
    { icon: Sparkles, label: 'Design premium' },
    { icon: Wine, label: 'Menu boissons' },
    { icon: Trophy, label: 'Classement jeux' },
    { icon: QrCode, label: 'QR Codes' }
  ];

  return (
    <section id="features" className={cn(
      "relative py-16 md:py-20 border-t overflow-hidden transition-colors duration-500",
      isDarkMode ? "bg-[#0b0f17] border-white/5" : "bg-amber-50/50 border-amber-900/10"
    )}>
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: isDarkMode
            ? 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)'
            : 'radial-gradient(circle at 1px 1px, #78350f 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Ambient glows */}
      <div className="absolute top-20 left-0 w-[580px] h-[580px] -translate-x-1/3 rounded-full pointer-events-none blur-3xl"
           style={{
             background:
               'radial-gradient(closest-side, rgba(217,70,239,0.18), rgba(217,70,239,0) 70%)',
           }}
      />
      <div className="absolute bottom-20 right-10 w-[620px] h-[620px] rounded-full pointer-events-none blur-3xl"
           style={{
             background:
               'radial-gradient(closest-side, rgba(251,191,36,0.24), rgba(251,191,36,0) 70%)',
           }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-6 md:mb-8 animate-fade-in">
          <h2 className={cn(
            "text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-0 transition-colors duration-500",
            isDarkMode ? "text-white" : "text-amber-950"
          )}>
            {t('why_choose_us') || 'Tout ce qu\'il faut pour un événement inoubliable'}
          </h2>
        </div>
      </div>

      {/* Static Feature Cards Grid */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 md:mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {features.map((card, index) => (
            <StaticFeatureCard
              key={card.id}
              {...card}
              index={index}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      </div>

      {/* Bottom CTA teaser */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center animate-fade-in relative pb-10 md:pb-14">
          {/* BACKLIGHT premium sur la carte */}
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[180%] pointer-events-none blur-3xl opacity-80"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(251,191,36,0.42) 0%, rgba(251,191,36,0.16) 40%, rgba(251,191,36,0) 72%)',
            }}
          />
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[140%] pointer-events-none blur-3xl opacity-40"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(244,114,182,0.18) 0%, rgba(244,114,182,0) 70%)',
            }}
          />
          <div
            className="inline-block rounded-2xl px-5 py-3.5 md:px-8 md:py-5 text-left sm:text-center relative"
            style={{
              background: isDarkMode
                ? 'linear-gradient(180deg, #141a2c 0%, #0d1220 100%)'
                : 'linear-gradient(180deg, #fffaf0 0%, #fffbeb 100%)',
              border: isDarkMode
                ? '1px solid rgba(251,191,36,0.28)'
                : '1px solid rgba(180,83,9,0.28)',
              boxShadow: isDarkMode
                ? '0 30px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(251,191,36,0.08) inset, 0 1px 0 rgba(255,255,255,0.05) inset'
                : '0 30px 80px -20px rgba(180,83,9,0.25), 0 0 0 1px rgba(251,191,36,0.15) inset, 0 1px 0 rgba(255,255,255,0.7) inset',
            }}
          >
            <h3 className={cn(
              "text-base md:text-xl font-bold mb-0.5 md:mb-1 transition-colors duration-500",
              isDarkMode ? "text-white" : "text-amber-950"
            )}>
              {t('ready_to_start') || 'Prêt à créer votre invitation ?'}
            </h3>
            <p className={cn(
              "text-xs md:text-sm mb-3 md:mb-4 transition-colors duration-500",
              isDarkMode ? "text-white/55" : "text-amber-900/65"
            )}>
              {t('contact_direct') || 'Contactez-nous directement — Paiement et accompagnement personnalisés'}
            </p>
            <div className="flex flex-row gap-3 justify-center">
              <a
                href="https://wa.me/243844333917"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contacter via WhatsApp"
                className="inline-flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.08] hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  boxShadow:
                    '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(16,185,129,0.55), 0 12px 30px -10px rgba(16,185,129,0.65)',
                }}
              >
                <MessageCircle className="w-5 h-5 md:w-[22px] md:h-[22px]" />
              </a>
              <a
                href="mailto:furahadesign48@gmail.com"
                aria-label="Contacter par email"
                className="inline-flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.08] hover:-translate-y-0.5"
                style={{
                  background: isDarkMode
                    ? 'linear-gradient(180deg, #1e2338 0%, #0b0f17 100%)'
                    : 'linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%)',
                  color: '#fff',
                  boxShadow: isDarkMode
                    ? '0 0 0 1px rgba(251,191,36,0.22), 0 12px 30px -12px rgba(0,0,0,0.9), 0 1px 1px rgba(255,255,255,0.09) inset, 0 -3px 6px rgba(0,0,0,0.9) inset'
                    : '0 0 0 1px rgba(180,83,9,0.22), 0 12px 30px -12px rgba(180,83,9,0.25), 0 1px 1px rgba(255,255,255,0.9) inset, 0 -3px 6px rgba(180,83,9,0.08) inset',
                }}
              >
                <Mail className="w-5 h-5 md:w-[22px] md:h-[22px]" style={{ color: isDarkMode ? '#fcd34d' : '#d97706' }} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSection;
