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
import type { GlassCardProps } from './ui/glass-cards';

const rgbFromColor = (c: string) =>
  c.replace(/rgba?\(([^,]+),([^,]+),([^,]+),?[^)]*\)/, "rgb($1,$2,$3)");

const StaticFeatureCard: React.FC<GlassCardProps & { index: number }> = ({
  id, title, description, icon: IconComponent, color, gradient, bullets, index
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
          borderRadius: '18px',
          background: gradient,
          border: `1px solid ${color.replace(/[\d.]+\)$/, "0.45)")}`,
          boxShadow: `
            0 12px 48px rgba(0, 0, 0, 0.45),
            0 3px 12px rgba(0, 0, 0, 0.32),
            inset 0 1px 0 rgba(255, 255, 255, 0.22),
            inset 0 -1px 0 rgba(0, 0, 0, 0.2)
          `,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '-1.5px',
            borderRadius: '19.5px',
            padding: '1.5px',
            background: `conic-gradient(
              from 0deg,
              transparent 0deg,
              ${color} 60deg,
              ${color.replace(/[\d.]+\)$/, "0.55)")} 120deg,
              transparent 180deg,
              ${color.replace(/[\d.]+\)$/, "0.3)")} 240deg,
              transparent 360deg
            )`,
            zIndex: -1,
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            opacity: 0.9,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 100%)",
            pointerEvents: 'none',
            borderRadius: '18px 18px 0 0',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-6 sm:-bottom-10 left-1/2 -translate-x-1/2 w-[85%] h-[50%] sm:h-[60%] pointer-events-none blur-3xl opacity-60 sm:opacity-70"
          style={{
            background: `radial-gradient(ellipse at center, ${color.replace(/[\d.]+\)$/, "0.35)")} 0%, ${color.replace(/[\d.]+\)$/, "0.1)")} 45%, transparent 72%)`,
          }}
        />

        <div className="relative z-10 flex flex-col h-full p-3.5 sm:p-5 md:p-6">
          <div className="flex items-start gap-2 sm:gap-3 mb-2.5 sm:mb-3">
            <div
              className="relative p-2 sm:p-2.5 sm:p-3 rounded-lg sm:rounded-xl shrink-0"
              style={{
                background: `linear-gradient(145deg, ${color.replace(/[\d.]+\)$/, "0.28)")}, ${color.replace(/[\d.]+\)$/, "0.08)")})`,
                border: `1px solid ${color.replace(/[\d.]+\)$/, "0.5)")}`,
                boxShadow: `0 6px 20px -8px ${solidColor}`,
              }}
            >
              <IconComponent
                className="w-4 h-4 sm:w-5 sm:h-5 sm:w-6 sm:h-6"
                style={{ color: solidColor }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="inline-flex items-center mb-1 sm:mb-1.5 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] sm:text-[10px] font-mono tracking-wider uppercase"
                style={{
                  background: `${color.replace(/[\d.]+\)$/, "0.18)")}`,
                  color: solidColor,
                  border: `1px solid ${color.replace(/[\d.]+\)$/, "0.35)")}`,
                }}
              >
                F{String(index + 1).padStart(2, '0')}
              </div>
              <h3 className="text-sm sm:text-base md:text-xl font-extrabold text-white leading-tight">
                {title}
              </h3>
            </div>
          </div>

          <p
            className="hidden sm:block leading-relaxed text-xs md:text-sm mb-3 md:mb-4"
            style={{ color: "rgba(255,255,255,0.82)" }}
          >
            {description}
          </p>

          <ul className="grid grid-cols-1 gap-1 sm:gap-1.5 md:gap-2 mt-auto">
            {bullets.slice(0, 2).map((bullet, idx) => (
              <li
                key={idx}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0"
                  style={{
                    background: `linear-gradient(145deg, ${solidColor}, ${color.replace(/[\d.]+\)$/, "0.7)")})`,
                    boxShadow: `0 0 0 2px ${color.replace(/[\d.]+\)$/, "0.18)")}`,
                  }}
                />
                <span
                  className="text-[9px] sm:text-[10px] sm:text-xs font-medium leading-snug line-clamp-1"
                  style={{ color: "rgba(255,255,255,0.88)" }}
                >
                  {bullet}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const WhyChooseSection = () => {
  const { t } = useLanguage();

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
    <section id="features" className="relative py-16 md:py-20 bg-[#0b0f17] border-t border-white/5 overflow-hidden">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
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
          <div
            className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full"
            style={{
              border: '1px solid rgba(251,191,36,0.25)',
              background: 'linear-gradient(180deg, rgba(251,191,36,0.1), rgba(251,191,36,0.02))',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
            <span className="font-mono text-[11px] tracking-wide uppercase" style={{ color: '#fcd34d' }}>
              {t('all_in_one_platform') || 'Plateforme tout-en-un'}
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-0">
            {t('why_choose_us') || 'Tout ce qu\'il faut pour un événement inoubliable'}
          </h2>
        </div>
      </div>

      {/* Static Feature Cards Grid */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 md:mt-10">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {features.map((card, index) => (
            <StaticFeatureCard
              key={card.id}
              {...card}
              index={index}
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
              background:
                'linear-gradient(180deg, #141a2c 0%, #0d1220 100%)',
              border: '1px solid rgba(251,191,36,0.28)',
              boxShadow:
                '0 30px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(251,191,36,0.08) inset, 0 1px 0 rgba(255,255,255,0.05) inset',
            }}
          >
            <h3 className="text-base md:text-xl font-bold text-white mb-0.5 md:mb-1">
              {t('ready_to_start') || 'Prêt à créer votre invitation ?'}
            </h3>
            <p className="text-xs md:text-sm text-white/55 mb-3 md:mb-4">
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
                  background:
                    'linear-gradient(180deg, #1e2338 0%, #0b0f17 100%)',
                  color: '#fff',
                  boxShadow:
                    '0 0 0 1px rgba(251,191,36,0.22), 0 12px 30px -12px rgba(0,0,0,0.9), 0 1px 1px rgba(255,255,255,0.09) inset, 0 -3px 6px rgba(0,0,0,0.9) inset',
                }}
              >
                <Mail className="w-5 h-5 md:w-[22px] md:h-[22px]" style={{ color: '#fcd34d' }} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSection;
