import React, { useState, useRef } from 'react';
import { Play, Sparkles, Maximize2, Clock, Layers, Zap, Pause, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';

// =========================================================================
// 🔗 LIEN VIDÉO FIRESTORAGE À REMPLIR ICI (lorsque ta vidéo sera prête)
// =========================================================================
// Exemple Firestorage :
//   "https://firebasestorage.googleapis.com/v0/b/<ton-projet>.appspot.com/o/videos%2Fdemo-dashboard.mp4?alt=media&token=xxxxx"
// Exemple Cloudinary :
//   "https://res.cloudinary.com/<ton-cloud>/video/upload/vxxx/demo-dashboard.mp4"
// Laisse la chaîne vide '' pour afficher le mockup dashboard par défaut.
// =========================================================================
const DEMO_VIDEO_URL: string =
  'https://firebasestorage.googleapis.com/v0/b/furaha-event-831ca.firebasestorage.app/o/Demo%20Furaha.mp4?alt=media&token=0199fbf5-c985-496b-88c9-29c012782b03';

const DEMO_VIDEO_POSTER: string = '';

const DemoVideoSection = () => {
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const controlsTimer = React.useRef<number | null>(null);

  const hasRealVideo = DEMO_VIDEO_URL.trim().length > 0;

  const formatTime = (sec: number) => {
    if (!isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
    triggerShowControls();
  };

  const togglePlay = async () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      setIsLoading(true);
      setHasError(false);
      try {
        await v.play();
        setIsPlaying(true);
        triggerShowControls();
      } catch (err) {
        console.error('Erreur lecture vidéo:', err);
        setHasError(true);
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const triggerShowControls = () => {
    setShowControls(true);
    if (controlsTimer.current) window.clearTimeout(controlsTimer.current);
    controlsTimer.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
      }
    }, 2500);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const newTime = (parseFloat(e.target.value) / 100) * v.duration;
    v.currentTime = newTime;
    setProgress(parseFloat(e.target.value));
    setCurrentTime(newTime);
    triggerShowControls();
  };

  React.useEffect(() => {
    return () => {
      if (controlsTimer.current) window.clearTimeout(controlsTimer.current);
    };
  }, []);

  const demoSteps = [
    {
      icon: Layers,
      title: 'Choisissez un modèle',
      desc: 'Sélectionnez parmi des dizaines de templates premium thématiques.',
      color: 'rgba(251,191,36,0.9)',
    },
    {
      icon: Zap,
      title: 'Personnalisez en 2 min',
      desc: 'Texte, photos, couleurs, musique, hébergements… tout est modifiable.',
      color: 'rgba(236,72,153,0.9)',
    },
    {
      icon: Clock,
      title: 'Partagez & suivez',
      desc: 'Envoyez le lien unique et recevez les RSVP + messages en direct.',
      color: 'rgba(16,185,129,0.9)',
    },
  ];

  return (
    <section id="demo" className={cn(
      "relative py-16 md:py-24 border-t overflow-hidden transition-colors duration-500",
      isDarkMode ? "bg-[#0b0f17] border-white/5" : "bg-white border-amber-900/10"
    )}>
      {/* Dot grid pattern */}
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
      <div
        className="absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full pointer-events-none blur-3xl"
        style={{
          background:
            'radial-gradient(closest-side, rgba(217,70,239,0.22), rgba(217,70,239,0) 70%)',
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-[700px] h-[700px] rounded-full pointer-events-none blur-3xl"
        style={{
          background:
            'radial-gradient(closest-side, rgba(251,191,36,0.22), rgba(251,191,36,0) 70%)',
        }}
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full pointer-events-none blur-3xl"
        style={{
          background:
            'radial-gradient(closest-side, rgba(59,130,246,0.15), rgba(59,130,246,0) 70%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-10 md:mb-14 animate-fade-in">
          <h2 className={cn(
            "text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-0 transition-colors duration-500",
            isDarkMode ? "text-white" : "text-amber-950"
          )}>
            Voir{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: isDarkMode
                  ? 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 45%, #ec4899 100%)'
                  : 'linear-gradient(135deg, #d97706 0%, #b45309 45%, #db2777 100%)',
              }}
            >
              comment ça marche
            </span>
          </h2>
        </div>

        {/* Video frame */}
        <div className="flex justify-center">
            <div className="relative group">
              {/* Multi-layer backlight (plus haut pour format portrait) */}
              <div
                aria-hidden="true"
                className="absolute -inset-6 rounded-[2.5rem] pointer-events-none blur-3xl opacity-80"
                style={{
                  background:
                    'radial-gradient(ellipse at 30% 20%, rgba(252,211,77,0.35) 0%, rgba(252,211,77,0) 60%), radial-gradient(ellipse at 70% 80%, rgba(236,72,153,0.28) 0%, rgba(236,72,153,0) 55%)',
                }}
              />
              <div
                aria-hidden="true"
                className="absolute -inset-3 rounded-[2rem] pointer-events-none blur-2xl opacity-50"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 50%, rgba(217,70,239,0.22) 0%, rgba(217,70,239,0) 65%)',
                }}
              />

              {/* PHONE FRAME — Tall portrait format */}
              <div
                className="relative rounded-[2.5rem] p-[10px] sm:p-[12px] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.95)]"
                style={{
                  background: isDarkMode
                    ? 'linear-gradient(145deg, #1a2236 0%, #0b0f17 60%, #161d32 100%)'
                    : 'linear-gradient(145deg, #404040 0%, #262626 60%, #171717 100%)',
                  border: isDarkMode
                    ? '1px solid rgba(255,255,255,0.1)'
                    : '1px solid rgba(0,0,0,0.3)',
                  boxShadow: isDarkMode
                    ? '0 30px 100px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(251,191,36,0.1) inset, 0 2px 0 rgba(255,255,255,0.1) inset, 0 -2px 0 rgba(0,0,0,0.4) inset'
                    : '0 30px 100px -20px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.2) inset, 0 2px 0 rgba(255,255,255,0.15) inset, 0 -2px 0 rgba(0,0,0,0.3) inset',
                }}
              >
                {/* Screen area (even taller aspect 1:2 for max vertical visibility) */}
                <div
                  className="relative rounded-[1.9rem] overflow-hidden"
                  style={{
                    width: '310px',
                    maxWidth: '82vw',
                    aspectRatio: '1 / 2',
                    background: '#000',
                    border: '1px solid rgba(0,0,0,0.6)',
                  }}
                >
                  {/* Notch / Dynamic Island */}
                  <div
                    aria-hidden="true"
                    className="absolute top-2 left-1/2 -translate-x-1/2 z-40 w-[90px] h-[22px] sm:w-[110px] sm:h-[26px] rounded-full pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(180deg, #0a0d16 0%, #000000 100%)',
                      boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset',
                    }}
                  />

                  {/* Status bar (fake) */}
                  <div
                    aria-hidden="true"
                    className="absolute top-0 left-0 right-0 h-[38px] z-30 flex items-end justify-between px-5 pb-1 pointer-events-none"
                    style={{ color: '#fff' }}
                  >
                    <span className="text-[10px] font-bold tracking-wide">9:41</span>
                    <div className="flex items-center gap-1">
                      <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor" opacity="0.9">
                        <rect x="0" y="6" width="2" height="4" rx="0.5" />
                        <rect x="4" y="4" width="2" height="6" rx="0.5" />
                        <rect x="8" y="2" width="2" height="8" rx="0.5" />
                        <rect x="12" y="0" width="2" height="10" rx="0.5" />
                      </svg>
                      <svg width="22" height="10" viewBox="0 0 22 10" fill="none">
                        <rect x="0.5" y="0.5" width="18" height="9" rx="2.5" stroke="currentColor" strokeOpacity="0.6" />
                        <rect x="2" y="2" width="14" height="6" rx="1" fill="currentColor" opacity="0.85" />
                        <rect x="19.5" y="3.5" width="1.5" height="3" rx="0.75" fill="currentColor" opacity="0.6" />
                      </svg>
                    </div>
                  </div>

                  {/* Video / Mockup content (portrait) */}
                  <div className="absolute inset-0">
                    {hasRealVideo ? (
                      <video
                        ref={(el) => { videoRef.current = el; if (el) el.volume = 1; }}
                        src={DEMO_VIDEO_URL}
                        poster={DEMO_VIDEO_POSTER || undefined}
                        controls={false}
                        playsInline
                        muted={isMuted}
                        loop
                        preload="metadata"
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ background: '#000' }}
                        onClick={() => { if (isPlaying) triggerShowControls(); }}
                        onPlay={() => { setIsPlaying(true); setIsLoading(false); setHasError(false); triggerShowControls(); }}
                        onPause={() => { setIsPlaying(false); setShowControls(true); }}
                        onEnded={() => { setIsPlaying(false); setShowControls(true); }}
                        onWaiting={() => setIsLoading(true)}
                        onPlaying={() => setIsLoading(false)}
                        onCanPlay={() => setIsLoading(false)}
                        onError={() => { setHasError(true); setIsLoading(false); setIsPlaying(false); }}
                        onVolumeChange={(e) => setIsMuted(e.currentTarget.muted)}
                        onTimeUpdate={(e) => {
                          const v = e.currentTarget;
                          if (v.duration) {
                            setProgress((v.currentTime / v.duration) * 100);
                            setCurrentTime(v.currentTime);
                          }
                        }}
                        onLoadedMetadata={(e) => {
                          setDuration(e.currentTarget.duration || 0);
                        }}
                      />
                    ) : (
                      /* MOCKUP INVITATION MOBILE — format portrait Instagram */
                      <div
                        className="absolute inset-0"
                        style={{
                          background: isDarkMode
                            ? 'radial-gradient(ellipse at top, rgba(252,211,77,0.18) 0%, transparent 55%), radial-gradient(ellipse at bottom, rgba(236,72,153,0.18) 0%, transparent 55%), linear-gradient(180deg, #0f162a 0%, #0b0f17 60%, #0a1126 100%)'
                            : 'radial-gradient(ellipse at top, rgba(252,211,77,0.25) 0%, transparent 55%), radial-gradient(ellipse at bottom, rgba(236,72,153,0.15) 0%, transparent 55%), linear-gradient(180deg, #fffbeb 0%, #fef3c7 60%, #fff7ed 100%)',
                        }}
                      >
                        {/* Hero image background */}
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage: isDarkMode
                              ? `linear-gradient(180deg, rgba(11,15,23,0.25) 0%, rgba(11,15,23,0.65) 55%, rgba(11,15,23,0.92) 100%), url("${DEMO_VIDEO_POSTER}")`
                              : `linear-gradient(180deg, rgba(255,251,235,0.2) 0%, rgba(255,251,235,0.6) 55%, rgba(255,251,235,0.92) 100%), url("${DEMO_VIDEO_POSTER}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        />

                        {/* Content scrollable invitation */}
                        <div className="relative h-full flex flex-col px-4 pt-12 pb-3">
                          {/* Header invitation */}
                          <div className="text-center mt-2">
                            <div
                              className="text-[9px] font-mono tracking-[0.2em] uppercase mb-2"
                              style={{ color: isDarkMode ? 'rgba(252,211,77,0.85)' : 'rgba(180,83,9,0.9)' }}
                            >
                              ✦ Mariage ✦
                            </div>
                            <div
                              className="text-[8px] font-medium tracking-wider mb-1"
                              style={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(120,53,15,0.75)' }}
                            >
                              Vous êtes invité au mariage de
                            </div>
                            <h2
                              className="font-extrabold leading-none"
                              style={{
                                fontSize: '28px',
                                color: isDarkMode ? '#fff' : '#78350f',
                                fontFamily: 'serif',
                                textShadow: isDarkMode ? '0 2px 20px rgba(0,0,0,0.4)' : '0 2px 12px rgba(180,83,9,0.15)',
                              }}
                            >
                              Sophie
                            </h2>
                            <div
                              className="my-1 flex items-center justify-center gap-2"
                            >
                              <span
                                className="w-8 h-px"
                                style={{ background: isDarkMode ? 'rgba(252,211,77,0.7)' : 'rgba(217,119,6,0.6)' }}
                              />
                              <span style={{ color: isDarkMode ? 'rgba(252,211,77,1)' : 'rgba(217,119,6,1)', fontSize: '14px' }}>
                                ❦
                              </span>
                              <span
                                className="w-8 h-px"
                                style={{ background: isDarkMode ? 'rgba(252,211,77,0.7)' : 'rgba(217,119,6,0.6)' }}
                              />
                            </div>
                            <h2
                              className="font-extrabold leading-none mb-2"
                              style={{
                                fontSize: '28px',
                                color: isDarkMode ? '#fff' : '#78350f',
                                fontFamily: 'serif',
                                textShadow: isDarkMode ? '0 2px 20px rgba(0,0,0,0.4)' : '0 2px 12px rgba(180,83,9,0.15)',
                              }}
                            >
                              &amp; Lucas
                            </h2>
                          </div>

                          {/* Countdown mini */}
                          <div
                            className="mt-3 grid grid-cols-4 gap-1 mx-auto w-[88%]"
                          >
                            {[
                              { n: '24', l: 'Jours' },
                              { n: '08', l: 'H' },
                              { n: '15', l: 'Min' },
                              { n: '42', l: 'Sec' },
                            ].map((c, i) => (
                              <div
                                key={i}
                                className="rounded-lg py-1.5 text-center"
                                style={{
                                  background: isDarkMode
                                    ? 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))'
                                    : 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,251,235,0.7))',
                                  border: isDarkMode
                                    ? '1px solid rgba(255,255,255,0.1)'
                                    : '1px solid rgba(251,191,36,0.25)',
                                  backdropFilter: 'blur(4px)',
                                }}
                              >
                                <div
                                  className="font-extrabold leading-none"
                                  style={{ color: isDarkMode ? '#fcd34d' : '#d97706', fontSize: '14px' }}
                                >
                                  {c.n}
                                </div>
                                <div
                                  className="mt-0.5 uppercase"
                                  style={{
                                    color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(120,53,15,0.65)',
                                    fontSize: '7px',
                                    letterSpacing: '0.08em',
                                  }}
                                >
                                  {c.l}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Mini infos card */}
                          <div
                            className="mt-4 rounded-xl p-3 mx-auto w-[94%]"
                            style={{
                              background: isDarkMode
                                ? 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
                                : 'linear-gradient(180deg, #ffffff 0%, #fffbeb 100%)',
                              border: isDarkMode
                                ? '1px solid rgba(251,191,36,0.22)'
                                : '1px solid rgba(251,191,36,0.35)',
                              backdropFilter: 'blur(10px)',
                              boxShadow: isDarkMode
                                ? '0 8px 30px -10px rgba(251,191,36,0.2)'
                                : '0 8px 30px -10px rgba(180,83,9,0.2)',
                            }}
                          >
                            <div className="grid grid-cols-2 gap-2 text-center">
                              <div>
                                <div
                                  className="text-[8px] uppercase tracking-wider mb-0.5"
                                  style={{ color: isDarkMode ? 'rgba(252,211,77,0.9)' : 'rgba(180,83,9,0.85)' }}
                                >
                                  Date
                                </div>
                                <div
                                  className="font-bold"
                                  style={{
                                    color: isDarkMode ? '#fff' : '#78350f',
                                    fontSize: '11px',
                                  }}
                                >
                                  12 Août 2026
                                </div>
                              </div>
                              <div>
                                <div
                                  className="text-[8px] uppercase tracking-wider mb-0.5"
                                  style={{ color: isDarkMode ? 'rgba(252,211,77,0.9)' : 'rgba(180,83,9,0.85)' }}
                                >
                                  Lieu
                                </div>
                                <div
                                  className="font-bold"
                                  style={{
                                    color: isDarkMode ? '#fff' : '#78350f',
                                    fontSize: '11px',
                                  }}
                                >
                                  Villa des Lys
                                </div>
                              </div>
                            </div>
                            <div
                              className="mt-2 pt-2 border-t text-center"
                              style={{
                                borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(180,83,9,0.10)',
                              }}
                            >
                              <div
                                className="text-[8px] uppercase tracking-wider mb-0.5"
                                style={{ color: isDarkMode ? 'rgba(236,72,153,0.85)' : 'rgba(190,24,93,0.85)' }}
                              >
                                Cérémonie &amp; Réception
                              </div>
                              <div
                                style={{
                                  color: isDarkMode ? 'rgba(255,255,255,0.65)' : 'rgba(120,53,15,0.7)',
                                  fontSize: '9.5px',
                                }}
                              >
                                15h · 20h · Diner &amp; Bal
                              </div>
                            </div>
                          </div>

                          {/* Photo gallery strip */}
                          <div className="mt-3 px-2">
                            <div
                              className="text-[8px] uppercase tracking-wider mb-1.5"
                              style={{ color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(120,53,15,0.6)' }}
                            >
                              Le couple ✦
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              {[0, 1, 2].map((i) => (
                                <div
                                  key={i}
                                  className="aspect-square rounded-lg overflow-hidden"
                                  style={{
                                    backgroundImage: `linear-gradient(135deg, rgba(252,211,77,${
                                      0.2 + i * 0.08
                                    }), rgba(236,72,153,${0.2 + i * 0.1})), url("${DEMO_VIDEO_POSTER}")`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: `${i * 50}% center`,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                  }}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Bottom actions (CTA) */}
                          <div className="mt-auto space-y-1.5">
                            <button
                              className="w-full py-2 rounded-lg font-bold text-[11px]"
                              style={{
                                background:
                                  'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                                color: '#0b0f17',
                                boxShadow: isDarkMode
                                  ? '0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 20px -6px rgba(251,191,36,0.6)'
                                  : '0 1px 0 rgba(255,255,255,0.4) inset, 0 6px 20px -6px rgba(180,83,9,0.35)',
                              }}
                            >
                              Confirmer ma présence
                            </button>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                className="py-1.5 rounded-lg font-semibold text-[9.5px]"
                                style={{
                                  background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                                  color: isDarkMode ? '#fff' : '#78350f',
                                  border: isDarkMode
                                    ? '1px solid rgba(255,255,255,0.1)'
                                    : '1px solid rgba(180,83,9,0.15)',
                                }}
                              >
                                💌 Envoyer un message
                              </button>
                              <button
                                className="py-1.5 rounded-lg font-semibold text-[9.5px]"
                                style={{
                                  background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                                  color: isDarkMode ? '#fff' : '#78350f',
                                  border: isDarkMode
                                    ? '1px solid rgba(255,255,255,0.1)'
                                    : '1px solid rgba(180,83,9,0.15)',
                                }}
                              >
                                📍 Itinéraire
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Home indicator bar (bottom iPhone) */}
                    <div
                      aria-hidden="true"
                      className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-30 w-[110px] h-[3.5px] rounded-full pointer-events-none"
                      style={{
                        background:
                          'rgba(255,255,255,0.75)',
                        boxShadow:
                          '0 0 4px rgba(0,0,0,0.5)',
                      }}
                    />

                    {/* Play / Pause overlay — auto-hide when playing */}
                    {(!isPlaying || showControls || isLoading || hasError) && (
                      <button
                        onClick={togglePlay}
                        className="absolute inset-0 flex items-center justify-center z-20 transition-opacity duration-300"
                        style={{
                          opacity: isPlaying && !isLoading && !hasError ? 0 : 1,
                          pointerEvents: isPlaying && showControls ? 'auto' : isPlaying ? 'none' : 'auto',
                          background: isPlaying
                            ? 'transparent'
                            : 'linear-gradient(180deg, rgba(11,15,23,0.18) 0%, rgba(11,15,23,0.4) 100%)',
                        }}
                      >
                        <div className="relative flex flex-col items-center">
                          {!isPlaying && !isLoading && !hasError && (
                            <>
                              <div
                                className="absolute inset-0 rounded-full animate-ping opacity-40"
                                style={{
                                  background:
                                    'radial-gradient(circle, rgba(252,211,77,0.4) 0%, rgba(252,211,77,0) 70%)',
                                  transform: 'scale(2.2)',
                                }}
                              />
                              <div
                                className="absolute inset-0 rounded-full animate-ping opacity-30"
                                style={{
                                  background:
                                    'radial-gradient(circle, rgba(236,72,153,0.35) 0%, rgba(236,72,153,0) 70%)',
                                  transform: 'scale(3)',
                                  animationDelay: '0.5s',
                                }}
                              />
                            </>
                          )}
                          <div
                            className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                            style={{
                              background: isPlaying
                                ? 'rgba(11,15,23,0.6)'
                                : hasError
                                ? 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)'
                                : isLoading
                                ? 'rgba(11,15,23,0.6)'
                                : 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                              color: isPlaying ? '#fcd34d' : hasError ? '#fff' : isLoading ? '#fcd34d' : '#0b0f17',
                              boxShadow: isPlaying
                                ? '0 0 0 1px rgba(255,255,255,0.15), 0 10px 30px -10px rgba(0,0,0,0.8)'
                                : hasError
                                ? '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 2px rgba(255,255,255,0.2), 0 16px 40px -10px rgba(239,68,68,0.7)'
                                : isLoading
                                ? '0 0 0 1px rgba(255,255,255,0.15), 0 10px 30px -10px rgba(0,0,0,0.8)'
                                : '0 1px 0 rgba(255,255,255,0.35) inset, 0 0 0 2px rgba(255,255,255,0.2), 0 16px 40px -10px rgba(251,191,36,0.7), 0 0 60px rgba(251,191,36,0.35)',
                              backdropFilter: (isPlaying || isLoading) ? 'blur(8px)' : undefined,
                            }}
                          >
                            {isLoading ? (
                              <div className="w-6 h-6 sm:w-7 sm:h-7 border-4 border-current border-t-transparent rounded-full animate-spin" />
                            ) : isPlaying ? (
                              <Pause
                                className="w-6 h-6 sm:w-7 sm:h-7"
                                fill="currentColor"
                              />
                            ) : hasError ? (
                              <AlertCircle
                                className="w-6 h-6 sm:w-7 sm:h-7"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                              />
                            ) : (
                              <Play
                                className="w-6 h-6 sm:w-7 sm:h-7 ml-0.5"
                                fill="currentColor"
                              />
                            )}
                          </div>
                          {hasError && (
                            <div className="mt-3 px-3 py-1.5 rounded-lg text-center max-w-[85%]"
                                 style={{
                                   background: 'rgba(239,68,68,0.18)',
                                   border: '1px solid rgba(239,68,68,0.4)',
                                   backdropFilter: 'blur(8px)',
                                 }}>
                              <p className="text-[10px] font-bold text-red-300 leading-tight">
                                Vidéo inaccessible
                              </p>
                              <p className="text-[9px] text-red-200/70 mt-0.5 leading-tight">
                                Vérifiez le lien ou CORS
                              </p>
                            </div>
                          )}
                          {!isPlaying && !isLoading && !hasError && hasRealVideo && (
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                              className="mt-3 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all hover:scale-[1.04]"
                              style={{
                                background: isMuted ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                                border: `1px solid ${isMuted ? 'rgba(239,68,68,0.45)' : 'rgba(16,185,129,0.4)'}`,
                                backdropFilter: 'blur(8px)',
                              }}
                            >
                              {isMuted ? (
                                <VolumeX className="w-3.5 h-3.5 text-red-300" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
                              )}
                              <span className={`text-[9px] font-bold ${isMuted ? 'text-red-200/90' : 'text-emerald-200/90'}`}>
                                {isMuted ? 'Son désactivé — cliquer pour activer' : 'Son activé'}
                              </span>
                            </button>
                          )}
                        </div>
                      </button>
                    )}

                    {/* Invisible tap zone when playing, to bring controls back */}
                    {isPlaying && !showControls && !isLoading && !hasError && (
                      <button
                        onClick={() => triggerShowControls()}
                        className="absolute inset-0 z-10"
                        aria-label="Afficher les contrôles"
                      />
                    )}

                    {/* Custom playback controls bar with seek bar */}
                    {hasRealVideo && (
                      <div
                        className="absolute left-0 right-0 bottom-[22px] z-30 px-2.5 py-2 transition-opacity duration-300"
                        style={{
                          opacity: (!isPlaying || showControls) ? 1 : 0,
                          pointerEvents: (!isPlaying || showControls) ? 'auto' : 'none',
                          background: 'linear-gradient(180deg, transparent 0%, rgba(11,15,23,0.85) 100%)',
                        }}
                      >
                        {/* Seek bar */}
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[9px] font-bold text-amber-300 w-[30px] text-right shrink-0 tabular-nums">
                            {formatTime(currentTime)}
                          </span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="0.1"
                            value={progress || 0}
                            onChange={handleSeek}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 h-1 rounded-full appearance-none cursor-pointer accent-amber-400"
                            style={{
                              background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${progress || 0}%, rgba(255,255,255,0.25) ${progress || 0}%, rgba(255,255,255,0.25) 100%)`,
                            }}
                          />
                          <span className="text-[9px] font-bold text-amber-300/80 w-[30px] shrink-0 tabular-nums">
                            {formatTime(duration)}
                          </span>
                        </div>
                        {/* Mini play/pause + mute + time */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={togglePlay}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors hover:bg-white/5"
                            >
                              {isPlaying ? (
                                <Pause className="w-3.5 h-3.5 text-amber-300" fill="currentColor" />
                              ) : (
                                <Play className="w-3.5 h-3.5 text-amber-300 ml-0.5" fill="currentColor" />
                              )}
                              <span className="text-[9px] font-bold text-white/70">
                                {isPlaying ? 'Pause' : 'Lecture'}
                              </span>
                            </button>
                            <button
                              onClick={toggleMute}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors hover:bg-white/5"
                              title={isMuted ? 'Activer le son' : 'Couper le son'}
                            >
                              {isMuted ? (
                                <VolumeX className="w-3.5 h-3.5 text-red-300" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                              )}
                              <span className={`text-[9px] font-bold ${isMuted ? 'text-red-300/70' : 'text-white/70'}`}>
                                {isMuted ? 'Muet' : 'Son'}
                              </span>
                            </button>
                          </div>
                          <span className="text-[9px] font-mono text-white/40">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Instagram-style top badge */}
                    <div
                      className="absolute top-11 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold z-30 flex items-center gap-1"
                      style={{
                        background: 'rgba(236,72,153,0.18)',
                        color: '#f9a8d4',
                        border: '1px solid rgba(236,72,153,0.3)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ background: '#ec4899' }}
                      />
                      Démo · Furaha
                    </div>
                  </div>
                </div>
              </div>

              {/* Side buttons (left volume/power) */}
              <div
                aria-hidden="true"
                className="hidden sm:block absolute top-24 -left-[3px] w-[3px] h-[34px] rounded-l-md"
                style={{
                  background:
                    'linear-gradient(180deg, #202941 0%, #111729 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              />
              <div
                aria-hidden="true"
                className="hidden sm:block absolute top-[154px] -left-[3px] w-[3px] h-[54px] rounded-l-md"
                style={{
                  background:
                    'linear-gradient(180deg, #202941 0%, #111729 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              />
              <div
                aria-hidden="true"
                className="hidden sm:block absolute top-[220px] -left-[3px] w-[3px] h-[54px] rounded-l-md"
                style={{
                  background:
                    'linear-gradient(180deg, #202941 0%, #111729 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              />
              <div
                aria-hidden="true"
                className="hidden sm:block absolute top-[180px] -right-[3px] w-[3px] h-[86px] rounded-r-md"
                style={{
                  background:
                    'linear-gradient(180deg, #202941 0%, #111729 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              />
            </div>
        </div>
      </div>
    </section>
  );
};

export default DemoVideoSection;
