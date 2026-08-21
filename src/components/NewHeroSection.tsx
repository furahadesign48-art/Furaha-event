import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Sparkles,
  Heart,
  CheckCircle2,
  Users,
  Camera,
  Timer,
  CheckSquare,
  MessageSquareHeart,
  Gamepad2,
} from 'lucide-react';
import { CinematicHero } from './ui/cinematic-landing-hero';

const InvitationMockup = () => {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[92%] h-[72%] pointer-events-none blur-3xl opacity-75"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(251,191,36,0.45) 0%, rgba(251,191,36,0.18) 35%, rgba(251,191,36,0) 70%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-full h-32 pointer-events-none blur-3xl opacity-55"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(236,72,153,0.22) 0%, rgba(236,72,153,0) 70%)',
        }}
      />

      <div
        className="relative rounded-xl overflow-hidden widget-depth"
        style={{
          background:
            'linear-gradient(180deg, #0f1420 0%, #0b0f17 100%)',
        }}
      >
        <div className="flex items-center justify-between px-4 h-11 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-inner" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-inner" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-inner" />
          </div>
          <div className="flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-amber-300/80 fill-amber-300/70" />
            <span className="font-mono text-[11px] text-white/55">
              preview · mariage ·{' '}
              <span style={{ color: '#fcd34d' }}>invitation</span>
            </span>
          </div>
          <div className="w-[52px]" />
        </div>

        <div className="grid grid-cols-12">
          <div className="col-span-6 md:col-span-5 p-4 sm:p-5 border-r border-white/5">
            <div className="text-[11px] font-mono text-white/40 uppercase tracking-wider mb-3">
              Contenu de l'invitation
            </div>
            <div className="space-y-2.5">
              {[
                { icon: Heart, label: "Page d'accueil & noms", ok: true },
                { icon: Timer, label: 'Compte à rebours', ok: true },
                { icon: Users, label: 'Date, lieu & plan', ok: true },
                { icon: Camera, label: 'Galerie 3D photos', ok: true },
                { icon: CheckSquare, label: 'RSVP + boissons', ok: true },
                {
                  icon: MessageSquareHeart,
                  label: "Livre d'or interactif",
                  ok: true,
                },
                { icon: Gamepad2, label: 'Quiz, Memory, jeux', ok: true },
                {
                  icon: Sparkles,
                  label: 'Check-in QR Code',
                  ok: false,
                  wip: true,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-md"
                  style={{
                    background: row.wip
                      ? 'rgba(251,191,36,0.05)'
                      : 'rgba(255,255,255,0.02)',
                    border: row.wip
                      ? '1px dashed rgba(251,191,36,0.25)'
                      : '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                    style={{
                      background: row.ok
                        ? 'linear-gradient(145deg, rgba(251,191,36,0.22), rgba(251,191,36,0.06))'
                        : 'rgba(255,255,255,0.04)',
                      border: row.ok
                        ? '1px solid rgba(251,191,36,0.30)'
                        : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {row.ok ? (
                      <CheckCircle2
                        className="w-3.5 h-3.5"
                        style={{ color: '#fbbf24' }}
                      />
                    ) : (
                      <row.icon
                        className="w-3.5 h-3.5"
                        style={{ color: '#fcd34d', opacity: 0.7 }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[12.5px] font-medium truncate"
                      style={{
                        color: row.ok
                          ? '#ffffff'
                          : 'rgba(255,255,255,0.65)',
                      }}
                    >
                      {row.label}
                    </div>
                  </div>
                  {row.wip && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider"
                      style={{
                        background: 'rgba(251,191,36,0.12)',
                        color: '#fcd34d',
                        border: '1px solid rgba(251,191,36,0.28)',
                      }}
                    >
                      Live
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-6 md:col-span-7 p-3 sm:p-4 bg-[#0a0d14]">
            <div
              className="relative h-full rounded-lg overflow-hidden flex flex-col"
              style={{
                border: '1px solid rgba(251,191,36,0.30)',
                background:
                  'radial-gradient(ellipse at top, rgba(251,191,36,0.22), transparent 55%), linear-gradient(180deg, #121827 0%, #0a0d14 100%)',
              }}
            >
              <div className="flex justify-center pt-2">
                <div className="h-1.5 w-14 rounded-full bg-black/50" />
              </div>
              <div className="flex-1 flex flex-col items-center justify-center px-3 py-3 text-center">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-2.5"
                  style={{
                    background: 'linear-gradient(145deg, #fbbf24, #b45309)',
                    boxShadow: '0 10px 28px -10px rgba(251,191,36,0.85)',
                  }}
                >
                  <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white" />
                </div>
                <div
                  className="font-serif tracking-[0.22em] uppercase mb-1"
                  style={{ color: 'rgba(253,230,138,0.95)', fontSize: '11px' }}
                >
                  Save the date
                </div>
                <div
                  className="text-white font-extrabold leading-tight mb-1"
                  style={{ fontSize: '17px' }}
                >
                  Sarah
                  <span style={{ color: '#fbbf24' }} className="mx-0.5">
                    &
                  </span>
                  Malik
                </div>
                <div
                  className="text-white/45 mb-2.5"
                  style={{ fontSize: '10px' }}
                >
                  14 · 06 · 2026 · Château des Lumières
                </div>
                <div className="flex flex-wrap justify-center gap-1 mb-2.5">
                  {[
                    { i: Camera, l: 'Galerie' },
                    { i: Users, l: 'RSVP' },
                    { i: Heart, l: "Livre d'or" },
                    { i: Gamepad2, l: 'Jeux' },
                  ].map((p) => (
                    <div
                      key={p.l}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                      style={{
                        background: 'rgba(251,191,36,0.11)',
                        border: '1px solid rgba(251,191,36,0.26)',
                      }}
                    >
                      <p.i
                        className="w-2.5 h-2.5"
                        style={{ color: '#fbbf24' }}
                      />
                      <span
                        className="font-medium"
                        style={{
                          fontSize: '9px',
                          color: 'rgba(253,230,138,0.92)',
                        }}
                      >
                        {p.l}
                      </span>
                    </div>
                  ))}
                </div>
                <div
                  className="w-full h-8 rounded-md flex items-center justify-center"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(251,191,36,0.24), rgba(251,191,36,0.08))',
                    border: '1px solid rgba(251,191,36,0.32)',
                  }}
                >
                  <Sparkles
                    className="w-3 h-3 mr-1.5"
                    style={{ color: '#fcd34d' }}
                  />
                  <span
                    className="font-bold"
                    style={{ fontSize: '10.5px', color: '#fde68a' }}
                  >
                    Ouvrir l'invitation
                  </span>
                </div>
              </div>
              <div
                className="mx-3 mb-3 h-5 rounded-md"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TrustBadges = () => {
  return (
    <>
      <div
        className="cinematic-badge gsap-reveal absolute -bottom-4 -left-4 sm:-left-6 px-3 py-2.5 rounded-2xl floating-ui-badge flex items-center gap-2.5 text-xs pointer-events-auto"
        style={{ zIndex: 5 }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(145deg,#fbbf24,#b45309)' }}
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-white font-semibold text-[11.5px]">
            Template Premium
          </div>
          <div className="text-white/45 text-[10px]">Prêt en 5 minutes</div>
        </div>
      </div>

      <div
        className="cinematic-badge gsap-reveal absolute -top-4 -right-2 sm:-right-5 px-3 py-2 rounded-2xl floating-ui-badge flex items-center gap-2 text-xs pointer-events-auto"
        style={{ zIndex: 5 }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{
            background:
              'linear-gradient(145deg, #ec4899, #be185d)',
            boxShadow: '0 8px 20px -10px rgba(236,72,153,0.85)',
          }}
        >
          <Heart className="w-3.5 h-3.5 text-white fill-white" />
        </div>
        <div className="leading-tight">
          <div className="text-white font-semibold text-[11px]">
            Mariages & Événements
          </div>
          <div className="text-white/45 text-[10px]">
            Thèmes élégants inclus
          </div>
        </div>
      </div>
    </>
  );
};

const NewHeroSection = () => {
  const { t } = useLanguage();

  const eyebrow =
    t('hero_eyebrow') || 'Cérémonies d\'Exception';

  const tagline1 = t('hero_tagline1') || 'Donnez vie à';
  const taglineAccent = t('hero_tagline_accent') || "le plus beau jour de votre histoire";
  const tagline2 =
    t('hero_tagline2') || 'avec une touche de magie.';

  const description =
    t('hero_description') ||
    "Concevez des invitations sur mesure, élégantes et immersives pour célébrer vos moments les plus précieux";

  const primaryLabel =
    t('discover_templates') || "Découvrir nos modèles";
  const secondaryLabel =
    t('view_features') || 'Voir les fonctionnalités';

  return (
    <CinematicHero
      eyebrow={eyebrow}
      tagline1={tagline1}
      taglineAccent={taglineAccent}
      tagline2={tagline2}
      description={description}
      primaryCta={{ label: primaryLabel, href: '#services' }}
      secondaryCta={{ label: secondaryLabel, href: '#features' }}
      trustItems={[
        {
          icon: (
            <CheckCircle2
              className="w-3.5 h-3.5"
              style={{ color: 'rgba(251,191,36,0.9)' }}
            />
          ),
          label: 'Sans code — 100% visuel',
        },
        {
          icon: (
            <Users
              className="w-3.5 h-3.5"
              style={{ color: 'rgba(251,191,36,0.9)' }}
            />
          ),
          label: 'Invitations illimitées*',
        },
        {
          icon: (
            <Heart
              className="w-3.5 h-3.5"
              style={{ color: 'rgba(251,191,36,0.9)' }}
            />
          ),
          label: 'Support personnalisé',
        },
      ]}
    />
  );
};

export default NewHeroSection;
