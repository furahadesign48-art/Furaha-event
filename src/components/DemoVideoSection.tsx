import React, { useState, useRef } from 'react';
import { Play, Sparkles, Maximize2, Clock, Layers, Zap, Pause, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

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
    <section id="demo" className="relative py-16 md:py-24 bg-[#0b0f17] border-t border-white/5 overflow-hidden">
      {/* Dot grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
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
          <div
            className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full"
            style={{
              border: '1px solid rgba(59,130,246,0.28)',
              background:
                'linear-gradient(180deg, rgba(59,130,246,0.1), rgba(59,130,246,0.02))',
            }}
          >
            <Play className="w-3.5 h-3.5" style={{ color: '#93c5fd' }} />
            <span
              className="font-mono text-[11px] tracking-wide uppercase"
              style={{ color: '#93c5fd' }}
            >
              Démo interactive
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3 md:mb-4">
            Voir{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, #fcd34d 0%, #f59e0b 45%, #ec4899 100%)',
              }}
            >
              comment ça marche
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {t('demo_subtitle') ||
              'Une démo rapide de 60 secondes pour découvrir le dashboard de personnalisation et toutes les fonctionnalités.'}
          </p>
        </div>

        {/* Video frame + steps */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8 items-start">
          {/* Instagram / Phone mock container (takes 3 cols) */}
          <div className="lg:col-span-3 flex justify-center">
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
                  background:
                    'linear-gradient(145deg, #1a2236 0%, #0b0f17 60%, #161d32 100%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow:
                    '0 30px 100px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(251,191,36,0.1) inset, 0 2px 0 rgba(255,255,255,0.1) inset, 0 -2px 0 rgba(0,0,0,0.4) inset',
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
                          background:
                            'radial-gradient(ellipse at top, rgba(252,211,77,0.18) 0%, transparent 55%), radial-gradient(ellipse at bottom, rgba(236,72,153,0.18) 0%, transparent 55%), linear-gradient(180deg, #0f162a 0%, #0b0f17 60%, #0a1126 100%)',
                        }}
                      >
                        {/* Hero image background */}
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage:
                              `linear-gradient(180deg, rgba(11,15,23,0.25) 0%, rgba(11,15,23,0.65) 55%, rgba(11,15,23,0.92) 100%), url("${DEMO_VIDEO_POSTER}")`,
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
                              style={{ color: 'rgba(252,211,77,0.85)' }}
                            >
                              ✦ Mariage ✦
                            </div>
                            <div
                              className="text-[8px] font-medium tracking-wider mb-1"
                              style={{ color: 'rgba(255,255,255,0.7)' }}
                            >
                              Vous êtes invité au mariage de
                            </div>
                            <h2
                              className="font-extrabold leading-none"
                              style={{
                                fontSize: '28px',
                                color: '#fff',
                                fontFamily: 'serif',
                                textShadow: '0 2px 20px rgba(0,0,0,0.4)',
                              }}
                            >
                              Sophie
                            </h2>
                            <div
                              className="my-1 flex items-center justify-center gap-2"
                            >
                              <span
                                className="w-8 h-px"
                                style={{ background: 'rgba(252,211,77,0.7)' }}
                              />
                              <span style={{ color: 'rgba(252,211,77,1)', fontSize: '14px' }}>
                                ❦
                              </span>
                              <span
                                className="w-8 h-px"
                                style={{ background: 'rgba(252,211,77,0.7)' }}
                              />
                            </div>
                            <h2
                              className="font-extrabold leading-none mb-2"
                              style={{
                                fontSize: '28px',
                                color: '#fff',
                                fontFamily: 'serif',
                                textShadow: '0 2px 20px rgba(0,0,0,0.4)',
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
                                  background:
                                    'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
                                  border:
                                    '1px solid rgba(255,255,255,0.1)',
                                  backdropFilter: 'blur(4px)',
                                }}
                              >
                                <div
                                  className="font-extrabold leading-none"
                                  style={{ color: '#fcd34d', fontSize: '14px' }}
                                >
                                  {c.n}
                                </div>
                                <div
                                  className="mt-0.5 uppercase"
                                  style={{
                                    color: 'rgba(255,255,255,0.6)',
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
                              background:
                                'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                              border:
                                '1px solid rgba(251,191,36,0.22)',
                              backdropFilter: 'blur(10px)',
                              boxShadow:
                                '0 8px 30px -10px rgba(251,191,36,0.2)',
                            }}
                          >
                            <div className="grid grid-cols-2 gap-2 text-center">
                              <div>
                                <div
                                  className="text-[8px] uppercase tracking-wider mb-0.5"
                                  style={{ color: 'rgba(252,211,77,0.9)' }}
                                >
                                  Date
                                </div>
                                <div
                                  className="font-bold"
                                  style={{
                                    color: '#fff',
                                    fontSize: '11px',
                                  }}
                                >
                                  12 Août 2026
                                </div>
                              </div>
                              <div>
                                <div
                                  className="text-[8px] uppercase tracking-wider mb-0.5"
                                  style={{ color: 'rgba(252,211,77,0.9)' }}
                                >
                                  Lieu
                                </div>
                                <div
                                  className="font-bold"
                                  style={{
                                    color: '#fff',
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
                                borderColor: 'rgba(255,255,255,0.08)',
                              }}
                            >
                              <div
                                className="text-[8px] uppercase tracking-wider mb-0.5"
                                style={{ color: 'rgba(236,72,153,0.85)' }}
                              >
                                Cérémonie &amp; Réception
                              </div>
                              <div
                                style={{
                                  color: 'rgba(255,255,255,0.65)',
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
                              style={{ color: 'rgba(255,255,255,0.5)' }}
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
                                boxShadow:
                                  '0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 20px -6px rgba(251,191,36,0.6)',
                              }}
                            >
                              Confirmer ma présence
                            </button>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                className="py-1.5 rounded-lg font-semibold text-[9.5px]"
                                style={{
                                  background: 'rgba(255,255,255,0.05)',
                                  color: '#fff',
                                  border:
                                    '1px solid rgba(255,255,255,0.1)',
                                }}
                              >
                                💌 Envoyer un message
                              </button>
                              <button
                                className="py-1.5 rounded-lg font-semibold text-[9.5px]"
                                style={{
                                  background: 'rgba(255,255,255,0.05)',
                                  color: '#fff',
                                  border:
                                    '1px solid rgba(255,255,255,0.1)',
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

          {/* Steps (takes 2 cols) */}
          <div className="lg:col-span-2 space-y-4 md:space-y-5">
            <div
              className="rounded-2xl p-4 md:p-5"
              style={{
                background:
                  'linear-gradient(180deg, rgba(251,191,36,0.08) 0%, rgba(251,191,36,0.02) 100%)',
                border: '1px solid rgba(251,191,36,0.18)',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles
                  className="w-4 h-4 md:w-5 md:h-5"
                  style={{ color: '#fcd34d' }}
                />
                <h3
                  className="text-sm md:text-base font-extrabold"
                  style={{ color: '#fcd34d' }}
                >
                  3 étapes, 2 minutes
                </h3>
              </div>
              <div className="space-y-3 md:space-y-3.5">
                {demoSteps.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={i}
                      className="flex gap-3 p-3 rounded-xl group transition-all duration-300"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor =
                          step.color.replace(/[\d.]+\)$/, '0.25)');
                        e.currentTarget.style.transform = 'translateX(2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor =
                          'rgba(255,255,255,0.06)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: `radial-gradient(circle, ${step.color.replace(/[\d.]+\)$/, '0.18)')} 0%, ${step.color.replace(/[\d.]+\)$/, '0.04)')} 100%)`,
                            border: `1px solid ${step.color.replace(/[\d.]+\)$/, '0.28)')}`,
                            boxShadow: `0 8px 20px -10px ${step.color}`,
                          }}
                        >
                          <Icon className="w-4 h-4 md:w-[18px] md:h-[18px]" style={{ color: step.color }} />
                        </div>
                        {i < demoSteps.length - 1 && (
                          <div
                            className="flex-1 w-px my-1.5"
                            style={{
                              background:
                                'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 100%)',
                            }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[10px] md:text-[11px] font-mono font-bold px-1.5 py-0.5 rounded"
                            style={{
                              background: step.color.replace(/[\d.]+\)$/, '0.12)'),
                              color: step.color,
                            }}
                          >
                            0{i + 1}
                          </span>
                          <h4
                            className="text-xs md:text-sm font-bold"
                            style={{ color: '#ffffff' }}
                          >
                            {step.title}
                          </h4>
                        </div>
                        <p
                          className="text-[11px] md:text-xs mt-1 leading-snug"
                          style={{ color: 'rgba(255,255,255,0.55)' }}
                        >
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mini stat card */}
            <div
              className="rounded-2xl p-4 md:p-5 grid grid-cols-3 gap-3"
              style={{
                background:
                  'linear-gradient(180deg, #141a2c 0%, #0d1220 100%)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              {[
                { n: '120+', l: 'Templates', c: '#fcd34d' },
                { n: '< 2min', l: 'Setup', c: '#8af0cc' },
                { n: '24/7', l: 'Support', c: '#e9a4f2' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div
                    className="text-lg md:text-2xl font-extrabold"
                    style={{ color: s.c }}
                  >
                    {s.n}
                  </div>
                  <div
                    className="text-[10px] md:text-[11px] mt-0.5 font-medium"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoVideoSection;
