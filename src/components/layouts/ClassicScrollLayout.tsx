import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import ornement5 from '../../images/ornement5.png';
import ornement6 from '../../images/ornement6.png';
import plume from '../../images/plume.png';
import {
  Heart, MapPin, Users, Wine, QrCode, Check, Sparkles, Gift,
  X, Download, BookOpen, Send, Clock, Volume2, VolumeX,
  Gamepad2, Trophy, HelpCircle, Star, RefreshCw, Hotel, Mail,
  Globe, Plane, Train, Car, CarTaxiFront, ChevronRight, ChevronLeft, Play, Pause, Info, Building, Image as ImageIcon,
  Mic, MicOff, Square, Trash2
} from 'lucide-react';
import { GameConfiguration, GameResult, AVAILABLE_GAMES } from '../../services/templateService';
import { UserModel, Invite } from '../../services/templateService';
import ToastModal from '../ToastModal';
import { FocusRail, FocusRailItem } from '../ui/focus-rail';
import { InteractiveTiltCard } from '../ui/tilt-card';
import { BorderRotate } from '../ui/animated-gradient-border';
import { ShinyButton } from '../ui/shiny-button';
import { TypewriterWithPen } from '../ui/typewriter-pen';
import ParallaxUnfurlingGallery, { ParallaxGalleryItem } from '../ui/3d-parallax-unfurling-gallery';
import MemoryMatchGame from '../MemoryMatchGame';
import LoveQuizGame from '../LoveQuizGame';
import CatchLoveGame from '../CatchLoveGame';

const photoCouple = 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop';

const optimizeImage = (url: string, width: number = 800, quality: number = 70) => {
  if (!url) return '';
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', `/upload/w_${width},q_${quality},f_auto,c_limit/`);
  }
  if (url.includes('images.unsplash.com') || url.includes('unsplash.com')) {
    try {
      const u = new URL(url);
      u.searchParams.set('w', String(width));
      u.searchParams.set('q', String(quality));
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      return u.toString();
    } catch {
      return url;
    }
  }
  if (url.includes('images.pexels.com') || url.includes('pexels.com')) {
    try {
      const u = new URL(url);
      u.searchParams.set('w', String(width));
      u.searchParams.set('auto', 'compress');
      u.searchParams.set('cs', 'tinysrgb');
      return u.toString();
    } catch {
      return url;
    }
  }
  return url;
};

const CountdownTimer = React.memo(({ targetDate, colors }: { targetDate: Date, colors: any }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +targetDate - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };
    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();
    return () => clearInterval(timer);
  }, [targetDate]);
  const countdownItems = [
    { label: 'JOURS', value: timeLeft.days, max: 365 },
    { label: 'HEURES', value: timeLeft.hours, max: 24 },
    { label: 'MINUTES', value: timeLeft.minutes, max: 60 },
    { label: 'SECONDES', value: timeLeft.seconds, max: 60 }
  ];
  return (
    <div className="grid grid-cols-4 gap-2 w-full max-w-md mx-auto">
      {countdownItems.map((item, i) => {
        const percentage = (item.value / item.max) * 100;
        return (
          <div key={i} className="flex flex-col items-center">
            <div className="relative w-14 h-14">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/5" />
                <circle cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="2" fill="transparent" strokeDasharray="163.36" strokeDashoffset={163.36 - (163.36 * percentage) / 100} className="transition-all duration-1000 ease-linear" style={{ color: colors.accent || colors.primary }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-black text-white">{String(item.value).padStart(2, '0')}</span>
              </div>
            </div>
            <span className="text-[7px] font-black text-white/40 tracking-widest mt-2 uppercase">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
});

const RevealOnScroll: React.FC<{ className?: string; animation?: string; delay?: number; repeat?: boolean; children: React.ReactNode }> = React.memo(({ className = '', animation = 'animate-slide-up', delay = 0, repeat = false, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (!repeat) observer.unobserve(entry.target);
        } else if (repeat) setIsVisible(false);
      });
    }, { threshold: 0.1 });
    if (domRef.current) observer.observe(domRef.current);
    return () => observer.disconnect();
  }, [repeat]);
  return (
    <div ref={domRef} className={`${className} transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
});

const CoupleQuizGame: React.FC<{ game: any; colors: any; onComplete: (score: number, data: any) => void; guestName: string; }> = ({ game, colors, onComplete, guestName }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const questions = game.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    if (currentQuestion.correctAnswerIndex !== undefined) {
      if (answer === currentQuestion.options[currentQuestion.correctAnswerIndex]) setScore(s => s + 1);
    } else { setScore(s => s + 1); }
    setTimeout(() => {
      if (currentQuestionIndex + 1 < questions.length) {
        setCurrentQuestionIndex(i => i + 1);
        setSelectedAnswer(null);
      } else {
        setIsComplete(true);
        onComplete(score + (currentQuestion.correctAnswerIndex !== undefined && answer === currentQuestion.options[currentQuestion.correctAnswerIndex] ? 1 : 0), { answers: newAnswers });
      }
    }, 800);
  };
  if (isComplete) return <div className="text-center py-8"><Trophy className="w-16 h-16 mx-auto mb-4" style={{ color: colors.primary }} /><h3 className="text-2xl font-bold mb-2" style={{ color: colors.primary }}>Terminé !</h3><p className="text-white/80 mb-4">Votre score : {score}/{questions.length}</p></div>;
  if (!currentQuestion) return <div className="text-white/60">Aucune question configurée</div>;
  return (
    <div className="py-4">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-4">{questions.map((_, i) => (<div key={i} className={`w-3 h-3 rounded-full ${i <= currentQuestionIndex ? '' : 'bg-white/30'}`} style={{ backgroundColor: i <= currentQuestionIndex ? colors.primary : undefined }} />))}</div>
        <h3 className="text-lg font-bold text-white mb-4">{currentQuestion.question}</h3>
      </div>
      <div className="space-y-3">{currentQuestion.options.map((option: string, i: number) => (<button key={i} onClick={() => !selectedAnswer && handleAnswer(option)} disabled={!!selectedAnswer} className={`w-full text-left py-4 px-6 rounded-2xl border-2 transition-all ${selectedAnswer === option ? 'bg-white text-slate-800 scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`} style={{ borderColor: selectedAnswer === option ? colors.primary : 'rgba(255,255,255,0.2)' }}>{option}</button>))}</div>
    </div>
  );
};

const WishGeneratorGame: React.FC<{ game: any; colors: any; onComplete: (score: number, data: any) => void; guestName: string; }> = ({ game, colors, onComplete }) => {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [wishes, setWishes] = useState<string[]>([]);
  const [currentWish, setCurrentWish] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const prompts = game.prompts || ['Votre message pour nous'];
  const currentPrompt = prompts[currentPromptIndex];
  const handleSubmitWish = () => {
    if (!currentWish.trim()) return;
    const newWishes = [...wishes, currentWish.trim()];
    setWishes(newWishes);
    if (currentPromptIndex + 1 < prompts.length) { setCurrentPromptIndex(i => i + 1); setCurrentWish(''); }
    else { setIsComplete(true); onComplete(newWishes.length, { wishes: newWishes }); }
  };
  if (isComplete) return <div className="text-center py-8"><Heart className="w-16 h-16 mx-auto mb-4 fill-rose-500" style={{ color: colors.primary }} /><h3 className="text-2xl font-bold mb-2" style={{ color: colors.primary }}>Merci !</h3><p className="text-white/80">Vos vœux ont été enregistrés</p></div>;
  return (
    <div className="py-4">
      <div className="text-center mb-6"><p className="text-white/60 text-sm mb-2">Question {currentPromptIndex + 1}/{prompts.length}</p><h3 className="text-xl font-bold text-white">{currentPrompt}</h3></div>
      <textarea value={currentWish} onChange={(e) => setCurrentWish(e.target.value)} placeholder="Écrivez votre message..." className="w-full bg-white/10 text-white placeholder-white/40 border-2 border-white/20 rounded-2xl p-4 mb-4 min-h-[120px] focus:outline-none focus:border-amber-400" />
      <button onClick={handleSubmitWish} disabled={!currentWish.trim()} className="w-full py-4 rounded-2xl font-bold text-white transition-all disabled:opacity-50" style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})` }}>Envoyer</button>
    </div>
  );
};

const PhotoChallengeGame: React.FC<{ game: any; colors: any; onComplete: (score: number, data: any) => void; guestName: string; }> = ({ game, colors, onComplete }) => {
  const [completedChallenges, setCompletedChallenges] = useState<Set<number>>(new Set());
  const challenges = game.challenges || ['Prendre une photo avec les mariés'];
  const handleToggleChallenge = (index: number) => {
    const newCompleted = new Set(completedChallenges);
    if (newCompleted.has(index)) newCompleted.delete(index); else newCompleted.add(index);
    setCompletedChallenges(newCompleted);
    if (newCompleted.size === challenges.length) onComplete(challenges.length, { completedChallenges: Array.from(newCompleted) });
  };
  return (
    <div className="py-4">
      <div className="text-center mb-6"></div>
      <div className="space-y-3">{challenges.map((challenge: string, index: number) => (<button key={index} onClick={() => handleToggleChallenge(index)} className={`w-full text-left py-4 px-6 rounded-2xl border-2 transition-all flex items-center space-x-3 ${completedChallenges.has(index) ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'}`} style={{ borderColor: completedChallenges.has(index) ? colors.primary : 'rgba(255,255,255,0.2)' }}><div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${completedChallenges.has(index) ? 'border-emerald-500' : 'border-white/30'}`}>{completedChallenges.has(index) && <Check className="w-4 h-4 text-emerald-500" />}</div><span className={`font-medium ${completedChallenges.has(index) ? 'line-through opacity-70' : 'text-white'}`}>{challenge}</span></button>))}</div>
      <p className="text-center text-white/50 text-sm mt-4">{completedChallenges.size}/{challenges.length} défis complétés</p>
    </div>
  );
};

const LoveStoryTimelineGame: React.FC<{ game: any; colors: any; onComplete: (score: number, data: any) => void; guestName: string; }> = ({ game, colors, onComplete }) => {
  const [viewedAll, setViewedAll] = useState(false);
  const events = game.events || [];
  useEffect(() => { if (events.length > 0) { setTimeout(() => { setViewedAll(true); onComplete(events.length, { viewedAll: true }); }, 2000); } }, [events.length, onComplete]);
  return (
    <div className="py-4">
      <div className="text-center mb-6"><Heart className="w-12 h-12 mx-auto mb-4 fill-rose-500" style={{ color: colors.primary }} /><h3 className="text-xl font-bold text-white mb-2">Notre Histoire</h3></div>
      <div className="space-y-4">{events.map((event: any, index: number) => (<div key={index} className="relative pl-8 border-l-2 border-white/20 pb-4 last:pb-0"><div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full" style={{ backgroundColor: colors.primary }} /><p className="text-white/50 text-xs mb-1">{event.date}</p><h4 className="text-white font-bold">{event.title}</h4><p className="text-white/70 text-sm">{event.description}</p></div>))}</div>
      {viewedAll && events.length > 0 && <p className="text-center text-emerald-400 text-sm mt-4 flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Vous avez lu toute l'histoire !</p>}
    </div>
  );
};

const WeddingTriviaGame: React.FC<{ game: any; colors: any; onComplete: (score: number, data: any) => void; guestName: string; }> = ({ game, colors, onComplete, guestName }) => <CoupleQuizGame game={game} colors={colors} onComplete={onComplete} guestName={guestName} />;
const GuestBookPromptGame: React.FC<{ game: any; colors: any; onComplete: (score: number, data: any) => void; guestName: string; }> = ({ game, colors, onComplete, guestName }) => <WishGeneratorGame game={game} colors={colors} onComplete={onComplete} guestName={guestName} />;

const FallingDots: React.FC<{ colors: { primary: string; secondary: string; accent?: string } }> = ({ colors }) => {
  const dotColors = [colors.primary, colors.secondary, colors.accent || '#ffffff'];
  return (
    <>
      <style>{`@keyframes fall { 0% { transform: translateY(0); opacity: 0.8; } 100% { transform: translateY(100vh); opacity: 0; } }`}</style>
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-1">
        {Array.from({ length: 40 }).map((_, i) => {
          const left = Math.random() * 100;
          const delay = Math.random() * 10;
          const duration = 5 + Math.random() * 10;
          const size = 4 + Math.random() * 8;
          const color = dotColors[Math.floor(Math.random() * dotColors.length)];
          return <div key={i} className="absolute rounded-full" style={{ left: `${left}%`, top: '-20px', width: `${size}px`, height: `${size}px`, backgroundColor: color, animationName: 'fall', animationDelay: `${delay}s`, animationDuration: `${duration}s`, animationFillMode: 'forwards', animationIterationCount: 'infinite', opacity: 0.8 }}></div>;
        })}
      </div>
    </>
  );
};

const PHOTO_VIDEO_RE = /\.(mp4|webm|mov|m4v|ogg|ogv|avi|mkv|flv|wmv|3gp)(\?.*)?$/i;
const isMediaVideo = (url: string) => PHOTO_VIDEO_RE.test(url.split('#')[0]);

const PhotoViewer: React.FC<{ photos?: string[]; initialPhoto: string; onClose: () => void; optimizeImage: (url: string, w: number, q?: number) => string; themeColors: { primary: string; secondary: string; accent?: string; }; }> = ({ photos = [], initialPhoto, onClose, optimizeImage, themeColors }) => {
  const [loaded, setLoaded] = useState(false);
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const mountedRef = useRef(false);
  const inGallery = Array.isArray(photos) && photos.length > 0 && photos.indexOf(initialPhoto) >= 0;
  const safePhotos = inGallery ? photos : [initialPhoto];
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    const idx = safePhotos.indexOf(initialPhoto);
    return idx >= 0 ? idx : 0;
  });
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const playIntervalRef = useRef<number | null>(null);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { primary, secondary } = themeColors || { primary: '#f59e0b', secondary: '#d946ef', accent: '#fbbf24' };
  const accent = (themeColors && themeColors.accent) || secondary;

  const lighter = (hex: string, amt = 0.22) => {
    try {
      const c = (hex || '#').replace("#", "");
      if (c.length < 6) return hex || '#ffffff';
      const r = parseInt(c.substring(0, 2), 16);
      const g = parseInt(c.substring(2, 4), 16);
      const b = parseInt(c.substring(4, 6), 16);
      const nr = Math.min(255, Math.round(r + (255 - r) * amt));
      const ng = Math.min(255, Math.round(g + (255 - g) * amt));
      const nb = Math.min(255, Math.round(b + (255 - b) * amt));
      return `rgb(${nr}, ${ng}, ${nb})`;
    } catch {
      return hex || '#ffffff';
    }
  };
  const darker = (hex: string, amt = 0.2) => {
    try {
      const c = (hex || '#').replace("#", "");
      if (c.length < 6) return hex || '#000000';
      const r = parseInt(c.substring(0, 2), 16);
      const g = parseInt(c.substring(2, 4), 16);
      const b = parseInt(c.substring(4, 6), 16);
      const nr = Math.max(0, Math.round(r * (1 - amt)));
      const ng = Math.max(0, Math.round(g * (1 - amt)));
      const nb = Math.max(0, Math.round(b * (1 - amt)));
      return `rgb(${nr}, ${ng}, ${nb})`;
    } catch {
      return hex || '#000000';
    }
  };

  const glow1 = lighter(primary, 0.35);
  const glow2 = lighter(secondary, 0.35);
  const glow3 = accent ? lighter(accent, 0.45) : lighter(primary, 0.5);
  const shadowColor1 = darker(primary, 0.05);
  const shadowColor2 = darker(secondary, 0.08);

  const total = safePhotos.length;
  const safeIndex = (currentIndex >= 0 && currentIndex < total) ? currentIndex : 0;
  const currentPhoto = safePhotos[safeIndex] || initialPhoto;
  const prevPhoto = prevIndex !== null && prevIndex >= 0 && prevIndex < total ? safePhotos[prevIndex] : null;
  const isVideo = isMediaVideo(currentPhoto);

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setPrevIndex(safeIndex);
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total, safeIndex]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setPrevIndex(safeIndex);
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total, safeIndex]);

  const stopAutoPlay = useCallback(() => {
    if (playIntervalRef.current !== null) {
      window.clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
  }, []);

  const startAutoPlay = useCallback(() => {
    stopAutoPlay();
    playIntervalRef.current = window.setInterval(() => {
      nextSlide();
    }, 5500);
  }, [stopAutoPlay, nextSlide]);

  useEffect(() => {
    if (isPlaying && !isVideo && total > 1) {
      startAutoPlay();
    } else {
      stopAutoPlay();
    }
    return stopAutoPlay;
  }, [isPlaying, isVideo, total, startAutoPlay, stopAutoPlay]);

  const finalSrc = useMemo(
    () => (isVideo ? currentPhoto : optimizeImage(currentPhoto, 1600, 85)),
    [isVideo, currentPhoto, optimizeImage]
  );

  const prevFinalSrc = useMemo(
    () => {
      if (!prevPhoto) return null;
      return isMediaVideo(prevPhoto) ? prevPhoto : optimizeImage(prevPhoto, 1600, 85);
    },
    [prevPhoto, optimizeImage]
  );

  const handleClose = useCallback(() => {
    if (closing) return;
    stopAutoPlay();
    setClosing(true);
    window.setTimeout(() => {
      if (mountedRef.current) onClose();
    }, 520);
  }, [closing, onClose, stopAutoPlay]);

  useEffect(() => {
    const t = window.setTimeout(() => setPrevIndex(null), 1200);
    return () => window.clearTimeout(t);
  }, [currentIndex]);

  useEffect(() => {
    setLoaded(false);
    mountedRef.current = true;
    if (isVideo) {
      setLoaded(true);
    } else {
      try {
        const img = new Image();
        img.src = finalSrc;
        img.onload = () => { if (mountedRef.current) setLoaded(true); };
        img.onerror = () => { if (mountedRef.current) setLoaded(true); };
      } catch {}
    }
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
    });
    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(raf);
    };
  }, [finalSrc, isVideo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      else if (e.key === "ArrowRight") nextSlide();
      else if (e.key === "ArrowLeft") prevSlide();
      else if (e.key === " " || e.code === "Space") { e.preventDefault(); setIsPlaying((p) => !p); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose, nextSlide, prevSlide]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    const prevTouch = document.body.style.touchAction as string | undefined;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = prev;
      if (prevTouch !== undefined) document.body.style.touchAction = prevTouch;
      else (document.body.style as any).touchAction = "";
    };
  }, []);

  const bumpControls = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current !== null) {
      window.clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 2600);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setShowControls(false), 2400);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMouseMove = () => bumpControls();
    const onTouchStart = () => bumpControls();
    const onTouchMove = () => bumpControls();
    const onClickBump = () => bumpControls();
    el.addEventListener('mousemove', onMouseMove, { passive: true });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('click', onClickBump, true);
    const onKey = () => bumpControls();
    window.addEventListener('keydown', onKey, true);
    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('click', onClickBump, true);
      window.removeEventListener('keydown', onKey, true);
      if (hideControlsTimerRef.current !== null) {
        window.clearTimeout(hideControlsTimerRef.current);
        hideControlsTimerRef.current = null;
      }
    };
  }, [bumpControls]);

  const show = entered && !closing;
  const enterFactor = show ? 1 : 0;

  return (
    <div
      ref={containerRef}
      className={"fixed inset-0 z-[110] flex items-center justify-center will-change-[backdrop-filter,opacity,background-color] "}
      onClick={handleClose}
      style={{
        opacity: enterFactor,
        transition: "opacity 650ms cubic-bezier(0.22, 1, 0.36, 1), backdrop-filter 750ms cubic-bezier(0.22, 1, 0.36, 1), background-color 750ms cubic-bezier(0.22, 1, 0.36, 1), -webkit-backdrop-filter 750ms cubic-bezier(0.22, 1, 0.36, 1)",
        backdropFilter: show ? `blur(34px) saturate(155%)` : `blur(0px) saturate(100%)`,
        WebkitBackdropFilter: show ? `blur(34px) saturate(155%)` : `blur(0px) saturate(100%)`,
        backgroundColor: show ? "rgba(0,0,0,0.78)" : "rgba(0,0,0,0)",
        backgroundImage: show ? `radial-gradient(ellipse at center, ${darker(primary, 0.82)} 0%, rgba(0,0,0,0.92) 100%)` : "none",
      }}
    >
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: 0.5 * enterFactor, transition: "opacity 800ms ease-out" }}>
        <div className="absolute -top-24 -left-20 w-[30rem] h-[30rem] rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${glow1} 0%, transparent 68%)`, animation: `pvFloat1 18s ease-in-out infinite ${show ? '' : 'paused'}` }} />
        <div className="absolute -bottom-28 -right-14 w-[34rem] h-[34rem] rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${glow2} 0%, transparent 68%)`, animation: `pvFloat2 22s ease-in-out infinite ${show ? '' : 'paused'}` }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-[28rem] h-[28rem] rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${glow3} 0%, transparent 72%)`, animation: `pvFloat3 26s ease-in-out infinite ${show ? '' : 'paused'}` }} />
      </div>

      <button onClick={(e) => { e.stopPropagation(); handleClose(); }} className="absolute top-4 sm:top-6 right-4 sm:right-6 w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white z-[120] will-change-transform active:scale-95" style={{ opacity: (0.2 + 0.8 * enterFactor) * (showControls ? 1 : 0), transform: `scale(${0.7 + 0.3 * enterFactor}) translateY(${showControls ? 0 : -12}px)`, transition: "transform 620ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms ease-out, background-color 280ms ease-out, box-shadow 280ms ease-out", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: `1px solid ${lighter(primary, 0.5)}33`, boxShadow: `0 10px 30px -10px ${darker(primary, 0.3)}66, 0 8px 24px -12px rgba(0,0,0,0.55)`, pointerEvents: showControls ? 'auto' : 'none' }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.2)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.1)"; }} aria-label="Fermer">
        <X className="h-6 w-6 sm:h-7 sm:w-7" />
      </button>

      {total > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); prevSlide(); }} className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white z-[120] will-change-transform active:scale-95 hover:bg-white/20 transition-colors" style={{ opacity: (0.2 + 0.8 * enterFactor) * (showControls ? 1 : 0), transform: `translateY(-50%) scale(${0.7 + 0.3 * enterFactor}) translateX(${showControls ? 0 : -14}px)`, transition: "transform 620ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms ease-out, background-color 280ms ease-out, box-shadow 280ms ease-out", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: `1px solid ${lighter(primary, 0.5)}33`, boxShadow: `0 10px 30px -10px ${darker(primary, 0.3)}66`, pointerEvents: showControls ? 'auto' : 'none' }} aria-label="Précédent">
            <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
          </button>

          <button onClick={(e) => { e.stopPropagation(); nextSlide(); }} className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white z-[120] will-change-transform active:scale-95 hover:bg-white/20 transition-colors" style={{ opacity: (0.2 + 0.8 * enterFactor) * (showControls ? 1 : 0), transform: `translateY(-50%) scale(${0.7 + 0.3 * enterFactor}) translateX(${showControls ? 0 : 14}px)`, transition: "transform 620ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms ease-out, background-color 280ms ease-out, box-shadow 280ms ease-out", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: `1px solid ${lighter(primary, 0.5)}33`, boxShadow: `0 10px 30px -10px ${darker(primary, 0.3)}66`, pointerEvents: showControls ? 'auto' : 'none' }} aria-label="Suivant">
            <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
          </button>

          <button onClick={(e) => { e.stopPropagation(); setIsPlaying((p) => !p); }} disabled={isVideo} className="absolute top-4 sm:top-6 left-4 sm:left-6 w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white z-[120] will-change-transform active:scale-95" style={{ opacity: (isVideo ? 0.4 : (0.2 + 0.8 * enterFactor)) * (showControls ? 1 : 0), transform: `scale(${0.7 + 0.3 * enterFactor}) translateY(${showControls ? 0 : -12}px)`, transition: "transform 620ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms ease-out, background-color 280ms ease-out, box-shadow 280ms ease-out", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: `1px solid ${lighter(primary, 0.5)}33`, boxShadow: `0 10px 30px -10px ${darker(primary, 0.3)}66`, cursor: isVideo ? 'not-allowed' : (showControls ? 'pointer' : 'none'), pointerEvents: showControls ? 'auto' : 'none' }} onMouseEnter={(e) => { if (!isVideo) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.2)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.1)"; }} aria-label={isPlaying ? "Pause diaporama" : "Lecture diaporama"}>
            {isPlaying ? <Pause className="h-5 w-5 sm:h-6 sm:w-6" /> : <Play className="h-5 w-5 sm:h-6 sm:w-6" />}
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[120] flex flex-col items-center gap-3" style={{ opacity: (0.2 + 0.8 * enterFactor) * (showControls ? 1 : 0), transform: `translateX(-50%) translateY(${6 * (1 - enterFactor)}px) translateY(${showControls ? 0 : 16}px)`, transition: "transform 620ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms ease-out", pointerEvents: showControls ? 'auto' : 'none' }}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: `1px solid rgba(255,255,255,0.1)` }}>
              <span className="text-white text-sm font-poppins font-medium">{safeIndex + 1}</span>
              <span className="text-white/50 text-sm font-poppins">/</span>
              <span className="text-white/80 text-sm font-poppins">{total}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)", border: `1px solid rgba(255,255,255,0.06)` }}>
              {safePhotos.slice(0, 20).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setPrevIndex(safeIndex); setCurrentIndex(i); }}
                  className="rounded-full transition-all duration-500"
                  style={{
                    width: i === safeIndex ? '22px' : '6px',
                    height: '6px',
                    background: i === safeIndex ? `linear-gradient(90deg, ${primary}, ${secondary})` : 'rgba(255,255,255,0.25)',
                    boxShadow: i === safeIndex ? `0 0 12px ${primary}80` : 'none',
                    opacity: i === safeIndex ? 1 : 0.6,
                  }}
                  aria-label={`Aller à la photo ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </>
      )}

      <div className="relative px-3 sm:px-6 md:px-10 py-4 sm:py-8 max-w-full max-h-full flex items-center justify-center z-[115] will-change-transform" style={{ transform: `scale(${0.7 + 0.3 * enterFactor}) translateY(${(-18) * (1 - enterFactor)}px)`, opacity: 0.15 + 0.85 * enterFactor, transformOrigin: "center center", transition: "transform 800ms cubic-bezier(0.22, 1, 0.36, 1), opacity 620ms ease-out" }} onClick={(e) => e.stopPropagation()}>
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden" style={{ boxShadow: show ? `0 55px 160px -20px ${shadowColor1}55, 0 35px 90px -18px ${shadowColor2}55, 0 28px 80px -12px rgba(0,0,0,0.9)` : "0 10px 30px -10px rgba(0,0,0,0.5)", border: `1px solid ${lighter(primary, 0.55)}22`, transition: "box-shadow 800ms cubic-bezier(0.22, 1, 0.36, 1), border-color 600ms ease-out" }}>
          {!loaded && (<div className="absolute inset-0 rounded-2xl sm:rounded-3xl z-20" style={{ background: `linear-gradient(90deg, ${lighter(primary, 0.75)}18, ${lighter(secondary, 0.7)}28, ${lighter(primary, 0.75)}18)`, backgroundSize: "200% 100%", animation: "shimmerX 1.8s ease-in-out infinite", opacity: enterFactor, transition: "opacity 350ms ease-out" }} />)}

          {prevPhoto && prevFinalSrc && !isMediaVideo(prevPhoto) && (
            <img
              src={prevFinalSrc}
              alt=""
              aria-hidden
              className="absolute inset-0 max-w-full w-auto h-auto object-contain select-none will-change-[opacity,transform] bg-black"
              style={{
                maxHeight: "min(84vh, 900px)",
                transform: `scale(${0.96 + 0.04 * enterFactor})`,
                opacity: loaded ? 0 : 0,
                filter: `saturate(${0.92 + 0.08 * enterFactor}) contrast(${0.96 + 0.04 * enterFactor})`,
                transition: "opacity 900ms cubic-bezier(0.22, 1, 0.36, 1)",
                zIndex: 1,
              }}
              draggable={false}
            />
          )}

          {isVideo ? (
            <video key={currentPhoto} src={finalSrc} controls autoPlay playsInline muted loop className={"relative max-w-full w-auto h-auto object-contain select-none will-change-[opacity,transform] bg-black z-[2]"} style={{ maxHeight: "min(84vh, 900px)", transform: `scale(${0.96 + 0.04 * (loaded ? enterFactor : 0.2)})`, opacity: loaded ? (0.4 + 0.6 * enterFactor) : 0, filter: `saturate(${0.92 + 0.08 * enterFactor}) contrast(${0.96 + 0.04 * enterFactor})`, transition: "opacity 600ms ease-out, transform 900ms cubic-bezier(0.22, 1, 0.36, 1), filter 720ms ease-out" }} />
          ) : (
            <img key={currentPhoto} src={finalSrc} alt={`Agrandissement photo ${safeIndex + 1}/${total}`} onLoad={() => setLoaded(true)} onError={() => setLoaded(true)} className={"relative max-w-full w-auto h-auto object-contain select-none will-change-[opacity,transform] z-[2]"} style={{ maxHeight: "min(84vh, 900px)", transform: `scale(${0.965 + 0.035 * (loaded ? enterFactor : 0.2)})`, opacity: loaded ? (0.3 + 0.7 * enterFactor) : 0, filter: `saturate(${0.95 + 0.05 * enterFactor}) contrast(${0.97 + 0.03 * enterFactor})`, transition: "opacity 900ms cubic-bezier(0.22, 1, 0.36, 1), transform 1200ms cubic-bezier(0.22, 1, 0.36, 1), filter 720ms ease-out", animation: loaded ? `pvKenBurns 8s cubic-bezier(0.22, 1, 0.36, 1) infinite alternate` : undefined }} draggable={false} loading="eager" decoding="async" />
          )}
          <div className="absolute inset-0 pointer-events-none rounded-2xl sm:rounded-3xl z-[3]" style={{ boxShadow: `inset 0 0 160px ${darker(primary, 0.8)}33, inset 0 0 70px rgba(0,0,0,0.32)`, opacity: enterFactor, transition: "opacity 620ms ease-out" }} />
        </div>
      </div>

      <style>{`
        @keyframes shimmerX { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes pvKenBurns { 0% { transform: scale(0.965); } 100% { transform: scale(1.02); } }
        @keyframes pvFloat1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,-20px) scale(1.1); } }
        @keyframes pvFloat2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-50px,30px) scale(1.15); } }
        @keyframes pvFloat3 { 0%,100% { transform: translate(-50%,-55%) scale(1); } 50% { transform: translate(-44%,-50%) scale(1.12); } }
      `}</style>
    </div>
  );
};

export interface ClassicScrollLayoutProps {
  safeUserModel: any;
  safeInvite: any;
  colors: any;
  optimizedBg: string;
  optimizedPattern: string | null;
  optimizedHeaderSectionBg: string | null;
  optimizedTextSectionBg: string | null;
  optimizedDateLocationSectionBg: string | null;
  optimizedGallerySectionBg: string | null;
  optimizedRsvpDrinksSectionBg: string | null;
  optimizedGamesSectionBg: string | null;
  optimizedQrFooterSectionBg: string | null;
  optimizedAccommodationSectionBg: string | null;
  parallaxGalleryItems: ParallaxGalleryItem[];
  galleryPhotos: string[];
  eventDay: string;
  eventMonth: string;
  eventYear: string;
  targetEventDate: Date;
  qrCodeDataUrl: string;
  isOfflineMode: boolean;
  retryCountdown: number | null;
  isConfirmed: boolean;
  selectedDrink: string[];
  guestBookMessages: any[];
  editingMessageId: string | null;
  editingText: string;
  showDeleteConfirm: { isOpen: boolean; message: any | null };
  showToastModal: { isOpen: boolean; type: 'drink' | 'confirmation' | 'cancellation'; drink?: string };
  selectedGalleryPhoto: string | null;
  isMusicPlaying: boolean;
  isMusicMuted: boolean;
  showNotificationModal: boolean;
  isFCMSupported: boolean | null;
  permission: NotificationPermission;
  token: string | null;
  isNotificationLoading: boolean;
  notificationError: string | null;
  showGuestBook: boolean;
  currentGameId: string | null;
  games: GameConfiguration[];
  gameResults: Record<string, GameResult[]>;
  completedGames: Set<string>;
  invite: Invite | null;
  inviteId: string | undefined;
  userModel: UserModel | null;
  isAdminView: boolean;
  isSubmittingMessage: boolean;
  guestMessage: string;
  sectionRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  messagesEndRef: React.MutableRefObject<HTMLDivElement | null>;
  setShowToastModal: (v: { isOpen: boolean; type: 'drink' | 'confirmation' | 'cancellation'; drink?: string }) => void;
  setSelectedGalleryPhoto: (v: string | null) => void;
  setShowGuestBook: (v: boolean) => void;
  setShowNotificationModal: (v: boolean) => void;
  setCurrentGameId: (v: string | null) => void;
  setEditingMessageId: (v: string | null) => void;
  setEditingText: (v: string) => void;
  setShowDeleteConfirm: (v: { isOpen: boolean; message: any | null }) => void;
  setGuestMessage: (v: string) => void;
  toggleMute: () => void;
  requestPermission: (ctx: { inviteId?: string; inviteDocPath?: string | null }) => Promise<void>;
  inviteDocPath: string | null;
  handleConfirmation: () => void;
  handleDrinkSelection: (drink: string) => void;
  handleSendMessage: () => void;
  handleEditMessage: (msg: any) => void;
  handleSaveEdit: (msg: any) => void;
  handleDeleteMessage: (msg: any) => void;
  confirmDelete: () => void;
  downloadQRCode: () => void;
  downloadInvitationJpg?: () => void;
  optimizeImageFn: (url: string, w?: number, q?: number) => string;
  isAdminFeatureUsed?: boolean;
  isRecording?: boolean;
  recordedAudioUrl?: string | null;
  recordingTime?: number;
  audioDuration?: number;
  currentlyPlayingMessageId?: string | null;
  isAudioPlaying?: boolean;
  toggleRecording?: () => void;
  cancelRecording?: () => void;
  playMessageAudio?: (msg: any) => void;
  formatAudioTime?: (s: number) => string;
  seekMessageAudio?: (msg: any, ratio: number) => void;
  getEffectiveAudioTime?: (msg: any) => number;
  getEffectiveAudioDuration?: (msg: any) => number;
  currentAudioTime?: number;
  forceAudioRerender?: number;
  isPreviewPlaying?: boolean;
  previewCurrentTime?: number;
  togglePreviewPlay?: () => void;
  seekPreviewAudio?: (ratio: number) => void;
  forcePreviewRerender?: number;
}

const ClassicScrollLayout: React.FC<ClassicScrollLayoutProps> = (props) => {
  const {
    safeUserModel, safeInvite, colors,
    optimizedBg, optimizedPattern,
    optimizedHeaderSectionBg, optimizedTextSectionBg, optimizedDateLocationSectionBg,
    optimizedGallerySectionBg, optimizedRsvpDrinksSectionBg, optimizedGamesSectionBg,
    optimizedQrFooterSectionBg, optimizedAccommodationSectionBg,
    parallaxGalleryItems, galleryPhotos,
    eventDay, eventMonth, eventYear, targetEventDate, qrCodeDataUrl,
    isOfflineMode, retryCountdown,
    isConfirmed, selectedDrink,
    guestBookMessages, editingMessageId, editingText,
    showDeleteConfirm, showToastModal,
    selectedGalleryPhoto, isMusicPlaying, isMusicMuted,
    showNotificationModal, isFCMSupported, permission, token,
    isNotificationLoading, notificationError, showGuestBook,
    currentGameId, games, gameResults, completedGames,
    invite, inviteId, userModel,
    isAdminView, isSubmittingMessage, guestMessage,
    sectionRefs, audioRef, messagesEndRef,
    setShowToastModal, setSelectedGalleryPhoto, setShowGuestBook,
    setShowNotificationModal, setCurrentGameId, setEditingMessageId,
    setEditingText, setShowDeleteConfirm, setGuestMessage,
    toggleMute, requestPermission, inviteDocPath,
    handleConfirmation, handleDrinkSelection, handleSendMessage,
    handleEditMessage, handleSaveEdit, handleDeleteMessage,
    confirmDelete, downloadQRCode, downloadInvitationJpg, optimizeImageFn,
    isRecording, recordedAudioUrl, recordingTime, audioDuration,
    currentlyPlayingMessageId, isAudioPlaying, toggleRecording,
    cancelRecording, playMessageAudio, formatAudioTime,
    seekMessageAudio, getEffectiveAudioTime, getEffectiveAudioDuration,
    currentAudioTime, forceAudioRerender,
    isPreviewPlaying, previewCurrentTime, togglePreviewPlay,
    seekPreviewAudio, forcePreviewRerender
  } = props;

  return (
    <div
      className="h-screen overflow-y-scroll overflow-x-hidden selection:bg-amber-500/30 font-poppins relative snap-y snap-mandatory"
      style={{
        backgroundImage: optimizedPattern ? `url(${optimizedPattern})` : 'none',
        backgroundColor: optimizedPattern ? 'transparent' : '#0f172a',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      {isOfflineMode && (
        <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none px-3 pt-2">
          <div className="backdrop-blur-xl rounded-full px-4 py-1.5 shadow-lg border border-white/10 flex items-center gap-2 pointer-events-auto" style={{ background: 'rgba(251, 191, 36, 0.18)' }}>
            <RefreshCw className="h-3 w-3 text-amber-200" style={{ animation: retryCountdown !== null ? 'spin 1.5s linear infinite' : 'none' }} />
            <span className="text-[10px] font-semibold text-amber-100 tracking-wide uppercase whitespace-nowrap">
              {retryCountdown !== null ? `Reconnexion automatique dans ${retryCountdown}s…` : 'Connexion en cours de rétablissement…'}
            </span>
          </div>
        </div>
      )}

      <style>{`
        ::-webkit-scrollbar { display: none; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-none z-0"></div>

      {safeUserModel.backgroundMusic && (
        <audio ref={audioRef} src={safeUserModel.backgroundMusic} loop preload="auto" />
      )}

      {/* HEADER + MAIN CONTENT */}
      <div ref={(el) => (sectionRefs.current.header = el)} className="relative w-full overflow-hidden flex flex-col items-center justify-start snap-start">
        <div className="relative w-full h-[92vh] z-0">
          {(safeUserModel as any).invitationVideo ? (
            <video
              src={(safeUserModel as any).invitationVideo}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-cover scale-105"
            />
          ) : (
            <InteractiveTiltCard image={{ src: optimizedHeaderSectionBg || optimizedBg, alt: "Background" }} tiltFactor={15} hoverScale={1.05} perspective={1000} borderRadius={0} glareIntensity={0.5} glareSize={100} className="w-full h-full" />
          )}
          {(safeUserModel as any).fallingDotsEnabled !== false && <FallingDots colors={colors} />}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none z-[5]"></div>
        </div>

        <div className="relative z-10 w-full px-0 flex flex-col items-center -mt-16 mb-6">
          {safeUserModel.guestInfoLeftImage && (
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
              <img src={optimizeImageFn(safeUserModel.guestInfoLeftImage, 400, 70)} className="h-48 md:h-72 w-auto object-contain object-left" alt="" loading="lazy" />
            </div>
          )}
          {safeUserModel.guestInfoRightImage && (
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
              <img src={optimizeImageFn(safeUserModel.guestInfoRightImage, 400, 70)} className="h-48 md:h-72 w-auto object-contain object-right scale-x-[-1]" alt="" loading="lazy" />
            </div>
          )}

          <div className="relative w-full flex justify-center px-4">
            <div className="w-full bg-black/60 backdrop-blur-xl rounded-[30px] p-4 border-2 flex flex-col items-center shadow-[0_0_30px_rgba(0,0,0,0.5)] relative group z-20 mx-auto max-w-[90%]" style={{ borderColor: `${colors.primary}cc` }}>
              <div className="flex items-center space-x-4 w-full px-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white/20 shadow-lg flex-shrink-0" style={{ background: `linear-gradient(to br, ${colors.primary}, ${colors.secondary})` }}>
                  {safeInvite.nom.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-white tracking-tight truncate leading-tight">{safeInvite.nom}</h2>
                  <div className="flex items-center space-x-3 mt-0.5">
                    <div className="flex items-center space-x-1.5 text-white/80">
                      <Gift className="h-3 w-3" style={{ color: colors.accent }} />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Table : {safeInvite.table}</p>
                    </div>
                    {safeInvite.etat === 'couple' && (
                      <div className="flex items-center space-x-1 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                        <Heart className="h-2.5 w-2.5 text-rose-400 fill-rose-400" />
                        <span className="text-[9px] font-black text-white uppercase tracking-tighter">Couple</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {optimizedTextSectionBg && (
          <div className="absolute left-0 right-0 top-[calc(92vh-4rem)] bottom-0 z-0 transition-all duration-700 ease-in-out">
            <img src={optimizedTextSectionBg} alt="Background" className="w-full h-full object-cover transition-transform duration-700 ease-in-out" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"></div>
          </div>
        )}
        {(safeUserModel as any).invitationTextEnabled !== false && (
        <div ref={(el) => (sectionRefs.current.mainContent = el)} className="relative z-10 flex justify-center mt-12 px-4 w-full">
          <div className="bg-white rounded-t-[120px] rounded-b-none w-full max-w-lg p-8 text-center shadow-[0_10px_40px_rgba(0,0,0,0.1)] relative">
            <div aria-hidden className="absolute inset-0 pointer-events-none z-0 rounded-t-[120px] overflow-hidden">
              <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0 27px, rgba(236,72,153,0.07) 27px 28px)' }} />
              <div className="absolute inset-0 select-none">
                {[{ l: '6%', t: '18%', s: 14, o: 0.07, c: '#ec4899' }, { l: '90%', t: '22%', s: 12, o: 0.08, c: '#d946ef' }, { l: '10%', t: '36%', s: 18, o: 0.06, c: '#ec4899' }, { l: '82%', t: '42%', s: 11, o: 0.09, c: '#f472b6' }, { l: '18%', t: '56%', s: 13, o: 0.07, c: '#d946ef' }, { l: '72%', t: '62%', s: 16, o: 0.06, c: '#ec4899' }, { l: '6%', t: '78%', s: 12, o: 0.08, c: '#f472b6' }, { l: '88%', t: '84%', s: 15, o: 0.07, c: '#d946ef' }, { l: '46%', t: '28%', s: 10, o: 0.06, c: '#ec4899' }, { l: '52%', t: '72%', s: 11, o: 0.07, c: '#f472b6' }].map((h, i) => (
                  <svg key={`ph-${i}`} width={h.s} height={h.s} viewBox="0 0 24 24" fill={h.c} style={{ position: 'absolute', left: h.l, top: h.t, opacity: h.o, transform: `rotate(${(i * 13) % 30 - 15}deg)` }}>
                    <path d="M12 21s-7-4.35-9.5-8.5C.9 10.2 2.4 6 6.2 6c2 0 3.4 1.1 4.3 2.6.9-1.5 2.3-2.6 4.3-2.6 3.8 0 5.3 4.2 3.7 6.5C19 16.65 12 21 12 21z" />
                  </svg>
                ))}
              </div>
            </div>
            <div className="space-y-6 relative z-10">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 rounded-full blur-2xl" style={{ background: `linear-gradient(to br, ${colors.primary}33, ${colors.secondary}33)` }} />
                <BorderRotate borderRadius={100} borderWidth={3} animationSpeed={3} gradientColors={{ primary: colors.primary, secondary: colors.secondary, accent: colors.accent || '#ffffff' }} backgroundColor="#ffffff" className="relative z-10 -mt-24 p-[2px]">
                  <img src={optimizeImageFn(safeUserModel.invitationPhoto || photoCouple, 400, 70)} className="w-48 h-48 rounded-full object-cover shadow-2xl" alt="Couple" loading="lazy" />
                </BorderRotate>
              </div>

              <RevealOnScroll className="relative">
                {safeUserModel.invitationTitleSubtitle && (<p className="text-lg font-normal font-bold mb-2" style={{ color: colors.primary }}>{safeUserModel.invitationTitleSubtitle}</p>)}
                <h1 className="text-3xl font-luxury font-medium leading-tight mb-4" style={{ color: colors.secondary }}>{safeUserModel.title}</h1>
                <div className="flex justify-center mb-6"><img src={ornement5} className="h-12 opacity-80" alt="" /></div>
                <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto px-2">
                  <TypewriterWithPen className="text-[14px] sm:text-[15px] md:text-[16px] text-slate-700 leading-[1.2] font-poppins px-0 w-full [&>p]:my-1 [&>p]:mb-2" penImage={plume} speed={48} htmlContent={(safeUserModel.invitationText || '').replace(/\[b\]/g, '<strong>').replace(/\[\/b\]/g, '</strong>').replace(/\[color=(.*?)\]/g, `<span style="color: $1">`).replace(/\[\/color\]/g, '</span>')} />
                  {((safeUserModel as any).invitationTextPhoto2) && (
                    <div className="mt-4">
                      {((safeUserModel as any).couplePhotoEnabled !== false && (safeUserModel as any).invitationTextPhoto2Title) && (<h3 className="text-sm font-poppins font-bold mb-0.5" style={{ color: '#000000', textDecoration: 'underline', textDecorationColor: '#000000' }}>{(safeUserModel as any).invitationTextPhoto2Title}</h3>)}
                      {((safeUserModel as any).couplePhotoEnabled !== false && (safeUserModel as any).invitationTextPhoto2Subtitle) && (<p className="text-[11px] font-poppins text-slate-700 mb-1.5">{(safeUserModel as any).invitationTextPhoto2Subtitle}</p>)}
                      {(safeUserModel as any).couplePhotoEnabled !== false && (
                      <img
                        src={optimizeImageFn((safeUserModel as any).invitationTextPhoto2, 400, 70)}
                        alt="Image invitation 2"
                        className="w-full max-w-[340px] max-h-[340px] object-contain mx-auto"
                        loading="lazy"
                      />
                      )}
                    </div>
                  )}
                  {safeUserModel.invitationTextPhoto && (
                    <div className="mt-4">
                      {(safeUserModel as any).couplePhotoEnabled !== false && safeUserModel.invitationTextPhotoTitle && (<h3 className="text-sm font-poppins font-bold mb-0.5" style={{ color: '#000000', textDecoration: 'underline', textDecorationColor: '#000000' }}>{safeUserModel.invitationTextPhotoTitle}</h3>)}
                      {(safeUserModel as any).couplePhotoEnabled !== false && safeUserModel.invitationTextPhotoSubtitle && (<p className="text-[11px] font-poppins text-slate-700 mb-1.5">{safeUserModel.invitationTextPhotoSubtitle}</p>)}
                      {(safeUserModel as any).couplePhotoEnabled !== false && (<img src={optimizeImageFn(safeUserModel.invitationTextPhoto, 400, 70)} alt="Motif" className="max-w-[150px] max-h-[150px] w-full object-contain mx-auto rounded-xl" loading="lazy" />)}
                    </div>
                  )}
                  <div className="mt-8 flex justify-center"><img src={ornement6} className="h-12 opacity-80" alt="" /></div>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* COUNTDOWN */}
      {(safeUserModel as any).countdownEnabled !== false && (
      <div ref={(el) => (sectionRefs.current.countdown = el)} className="relative z-10 w-full mt-4 px-0 min-h-screen flex items-center justify-center snap-start overflow-hidden">
        {optimizedDateLocationSectionBg && (
          <div className="absolute inset-0 z-0 transition-all duration-700 ease-in-out">
            <img src={optimizedDateLocationSectionBg} alt="Background" className="w-full h-full object-cover transition-transform duration-700 ease-in-out" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"></div>
          </div>
        )}
        {(safeUserModel as any).fallingDotsEnabled !== false && <FallingDots colors={colors} />}
        <div className="w-full max-w-lg px-4">
          <div className="w-full bg-black/50 backdrop-blur-2xl border-2 p-4 shadow-[0_0_80px_rgba(0,0,0,0.6),inset_0_0_60px_rgba(0,0,0,0.4)] flex flex-col items-center rounded-[30px] relative overflow-hidden" style={{ borderColor: `${colors.primary}80`, background: `linear-gradient(145deg, rgba(0,0,0,0.6), rgba(0,0,0,0.3))` }}>
            <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: colors.primary, opacity: 0.15 }}></div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: colors.secondary, opacity: 0.15 }}></div>
            <div className="w-full space-y-4 relative z-10">
              <div className="space-y-2">
                <h2 className="text-center font-luxury tracking-[0.8em] text-xs uppercase" style={{ color: colors.primary }}>✨ J- ✨</h2>
                <CountdownTimer targetDate={targetEventDate} colors={colors} />
              </div>
              <div className="grid grid-cols-3 gap-2 w-full">
                {[{ img: safeUserModel.eventPhoto1 || photoCouple, val: eventDay }, { img: safeUserModel.eventPhoto2 || photoCouple, val: eventMonth }, { img: safeUserModel.eventPhoto3 || photoCouple, val: eventYear }].map((item, i) => (
                  <div key={i} className="relative aspect-[3/4] overflow-hidden shadow-2xl border-2 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] group" style={{ borderColor: `${colors.primary}60` }}>
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-10"></div>
                    <img src={optimizeImageFn(item.img, 400, 70)} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" alt="" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl md:text-5xl font-luxury text-white drop-shadow-[0_6px_12px_rgba(0,0,0,0.9)] transition-all duration-300 group-hover:scale-125 group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">{item.val}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 pt-0">
                <div className="flex flex-col items-center space-y-2 w-full">
                  {(safeUserModel as any).eventVenuePhoto ? (
                    <div className="w-full cursor-pointer group" onClick={() => { const query = safeUserModel.eventAddress || safeUserModel.eventLocation; const url = /iPhone|iPad|iPod/.test(navigator.userAgent) ? `maps://?q=${encodeURIComponent(query)}` : `https://www.google.com/maps?q=${encodeURIComponent(query)}`; window.open(url, '_blank'); }}>
                      <div className="relative w-full aspect-[16/11] rounded-[24px] overflow-hidden shadow-2xl border-2 transition-all duration-400 group-hover:scale-[1.02]" style={{ borderColor: `${colors.secondary}55` }}>
                        <img src={optimizeImageFn((safeUserModel as any).eventVenuePhoto, 900, 78)} alt={safeUserModel.eventLocation} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(0,0,0,0.0) 0%, ${colors.secondary}10 25%, ${colors.secondary}55 55%, ${colors.secondary}bb 82%, ${colors.secondary}e6 100%)` }} />
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1500 pointer-events-none z-10"></div>
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full backdrop-blur-md border shadow" style={{ background: `linear-gradient(135deg, ${colors.secondary}cc, ${colors.primary}aa)`, borderColor: 'rgba(255,255,255,0.25)' }}>
                            <Building className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] text-white">Lieu de réception</span>
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 space-y-1.5 sm:space-y-2.5">
                          <h3 className="text-xl sm:text-3xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] leading-tight">{safeUserModel.eventLocation}</h3>
                          {safeUserModel.eventAddress && (
                            <div className="flex items-start gap-1.5">
                              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0 text-white" />
                              <p className="text-[11px] sm:text-sm text-white font-medium leading-snug drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">{safeUserModel.eventAddress}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 pt-1">
                            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                            <span className="font-bold text-xs sm:text-base text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">{safeUserModel.eventTime || '18h30'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="relative group cursor-pointer mx-auto" onClick={() => { const query = safeUserModel.eventAddress || safeUserModel.eventLocation; const url = /iPhone|iPad|iPod/.test(navigator.userAgent) ? `maps://?q=${encodeURIComponent(query)}` : `https://www.google.com/maps?q=${encodeURIComponent(query)}`; window.open(url, '_blank'); }}>
                        <motion.div whileTap={{ scale: 0.95 }} className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border-3 shadow-[0_0_60px_rgba(255,255,255,0.5)] relative animate-bounce rounded-full transition-all duration-300 mx-auto" style={{ borderColor: colors.accent || colors.primary, boxShadow: `0 0 40px ${colors.accent || colors.primary}60` }}>
                          <div className="absolute inset-1.5 rounded-full bg-gradient-to-br" style={{ background: `linear-gradient(145deg, ${colors.accent || colors.primary}, ${colors.secondary})` }}></div>
                          <MapPin className="h-5 w-5 relative z-10 text-white drop-shadow-lg" />
                        </motion.div>
                      </div>
                      <div className="cursor-pointer group w-full" onClick={() => { const query = safeUserModel.eventAddress || safeUserModel.eventLocation; const url = /iPhone|iPad|iPod/.test(navigator.userAgent) ? `maps://?q=${encodeURIComponent(query)}` : `https://www.google.com/maps?q=${encodeURIComponent(query)}`; window.open(url, '_blank'); }}>
                        <div className="relative overflow-hidden text-center p-3 w-full rounded-[20px] border-2 transition-all duration-400 group-hover:scale-[1.02] shadow-[0_0_50px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_80px_rgba(255,255,255,0.2)]" style={{ borderColor: `${colors.primary}40`, background: `linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))` }}>
                          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1500 pointer-events-none z-10"></div>
                          <h3 className="text-sm font-bold tracking-tight uppercase mb-1" style={{ color: colors.primary }}>📍 Lieu de réception</h3>
                          <p className="text-base text-white font-semibold mb-0.5 drop-shadow-lg">{safeUserModel.eventLocation}</p>
                          {safeUserModel.eventAddress && (<p className="text-xs text-white/80 font-medium mb-2 leading-tight">{safeUserModel.eventAddress}</p>)}
                          <div className="inline-flex items-center justify-center space-x-1.5 mb-1" style={{ color: colors.primary }}><Clock className="h-4 w-4" /><p className="font-bold text-sm drop-shadow-lg" style={{ color: colors.primary }}>{safeUserModel.eventTime || '18h30'}</p></div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ACCOMMODATIONS */}
      {((safeUserModel as any).accommodationEnabled && Array.isArray((safeUserModel as any).accommodations) && (safeUserModel as any).accommodations.length > 0) || ((safeUserModel as any).usefulAddressesEnabled && Array.isArray((safeUserModel as any).usefulAddresses) && (safeUserModel as any).usefulAddresses.length > 0) ? (
        <div ref={(el) => { sectionRefs.current.accommodation = el; }} className="relative z-10 w-full mt-0 px-0 snap-start overflow-hidden min-h-[100dvh] sm:min-h-[auto] flex items-center">
          {optimizedAccommodationSectionBg && (<div className="absolute inset-0 z-0 pointer-events-none transition-all duration-700"><img src={optimizedAccommodationSectionBg} alt="Background" className="w-full h-full object-cover transition-transform duration-700" /></div>)}
          <div className="w-full max-w-lg mx-auto px-4 py-10 sm:py-14 relative z-10">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-[10px] sm:text-xs tracking-[0.25em] uppercase font-semibold text-white/70 mb-2 sm:mb-3"><span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#0D2F5F' }} />Pratique<span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#4A6C9B' }} /></div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight mb-1 sm:mb-2 bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, #ffffff 0%, #D4AF37 50%, #ffffff 100%)` }}>Où dormir ?</h2>
              <p className="text-white/50 text-[11px] sm:text-sm font-medium max-w-md mx-auto leading-relaxed">Quelques adresses recommandées à proximité de la salle</p>
            </motion.div>
            {((safeUserModel as any).accommodationEnabled && Array.isArray((safeUserModel as any).accommodations) && (safeUserModel as any).accommodations.length > 0) && (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:max-w-2xl sm:mx-auto mb-8 sm:mb-10">
                {[...(safeUserModel as any).accommodations].sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)).filter((a: any) => a.name && a.address).map((acc: any, idx: number) => (
                  <motion.div key={acc.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: Math.min(idx * 0.08, 0.5) }} className="h-full">
                    <div className="relative w-full h-full rounded-[20px] overflow-hidden group transition-all duration-500 hover:-translate-y-1.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]" style={{
                      background: `linear-gradient(180deg, rgba(10,12,22,0.85) 0%, rgba(5,8,18,0.95) 100%)`,
                      border: `1px solid #0D2F5F40`,
                      boxShadow: `0 0 0 1px #0D2F5F18, 0 20px 50px -15px rgba(0,0,0,0.3)`
                    }}>
                      <div className="absolute inset-0 pointer-events-none opacity-30 transition-opacity duration-500 group-hover:opacity-50" style={{
                        background: `radial-gradient(ellipse at 0% 0%, #D4AF3720 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, #4A6C9B22 0%, transparent 55%)`
                      }} />

                      <div className="relative aspect-[4/3] overflow-hidden w-full bg-gradient-to-br from-slate-800 to-slate-900">
                        {acc.image ? (
                          <img
                            src={optimizeImageFn(acc.image, 600, 75)}
                            alt={acc.name}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{
                            background: `linear-gradient(135deg, #D4AF3730 0%, #4A6C9B40 100%)`
                          }}>
                            <Hotel className="w-10 h-10 text-white/50 drop-shadow" />
                          </div>
                        )}
                        <div className="absolute inset-0" style={{
                          background: 'linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.0) 45%, rgba(0,0,0,0.65) 78%, rgba(0,0,0,0.85) 100%)'
                        }} />
                        {acc.badge && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black tracking-wider uppercase backdrop-blur-md" style={{
                            background: `linear-gradient(135deg, #0D2F5Fdd, #4A6C9Bdd)`,
                            color: '#ffffff',
                            border: `1px solid rgba(255,255,255,0.25)`,
                            boxShadow: `0 4px 14px -4px #0D2F5F80`
                          }}>
                            {acc.badge}
                          </div>
                        )}
                        {acc.priceHint && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-black backdrop-blur-md" style={{
                            background: 'rgba(0,0,0,0.55)',
                            color: '#D4AF37',
                            border: `1px solid #D4AF3740`
                          }}>
                            {acc.priceHint}
                          </div>
                        )}
                      </div>

                      <div className="relative z-10 p-2.5 sm:p-3 space-y-2 sm:space-y-2.5">
                        <div className="min-w-0">
                          <h3 className="font-bold text-[12px] sm:text-[13px] truncate drop-shadow-md leading-tight" style={{ color: '#ffffff' }}>{acc.name}</h3>
                          <div className="flex items-start gap-1 mt-0.5">
                            <MapPin className="h-2.5 w-2.5 mt-0.5 flex-shrink-0" style={{ color: '#D4AF37' }} />
                            <span className="text-[10px] sm:text-[11px] text-white/70 truncate leading-tight">{acc.address}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                          <button
                            type="button"
                            onClick={() => { const url = /iPhone|iPad|iPod/.test(navigator.userAgent) ? `maps://?q=${encodeURIComponent(acc.address)}` : `https://www.google.com/maps?q=${encodeURIComponent(acc.address)}`; window.open(url, '_blank'); }}
                            className="flex items-center justify-center py-1.5 sm:py-2 rounded-lg transition-all active:scale-95 border"
                            style={{
                              background: `linear-gradient(180deg, #D4AF3722, #D4AF370d)`,
                              borderColor: `#D4AF3755`,
                              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08)`
                            }}
                            title="Ouvrir dans Maps"
                          >
                            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: '#D4AF37' }} />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (acc.websiteUrl) {
                                const url = acc.websiteUrl && !/^https?:\/\//i.test(acc.websiteUrl) ? `https://${acc.websiteUrl.replace(/^\/+/, '')}` : acc.websiteUrl;
                                window.open(url, '_blank');
                              } else if (acc.email) {
                                window.location.href = `mailto:${acc.email}`;
                              }
                            }}
                            disabled={!acc.websiteUrl && !acc.email}
                            className="flex items-center justify-center py-1.5 sm:py-2 rounded-lg transition-all active:scale-95 border disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                              background: `linear-gradient(180deg, #4A6C9B2a, #4A6C9B10)`,
                              borderColor: `#4A6C9B66`,
                              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08)`
                            }}
                            title={acc.websiteUrl ? 'Site web' : acc.email ? 'Email' : 'Aucun site'}
                          >
                            <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: '#4A6C9B' }} />
                          </button>

                          <div className="col-span-2">
                            {acc.email ? (
                              <a
                                href={`mailto:${acc.email}?subject=${encodeURIComponent(`Réservation - Mariage ${safeUserModel.title?.replace?.(/Mariage (de|d')?\s*/i, '') || ''}`)}&body=${encodeURIComponent('Bonjour,\n\nJe souhaiterais réserver une chambre pour le mariage.\n\nCordialement,')}`}
                                className="flex items-center justify-center gap-1.5 w-full py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all active:scale-95"
                                style={{
                                  background: `linear-gradient(180deg, #0D2F5F 0%, #4A6C9B 100%)`,
                                  color: 'white',
                                  boxShadow: `0 1px 0 rgba(255,255,255,0.3) inset, 0 0 0 1px #0D2F5F60, 0 8px 20px -8px #0D2F5F70`
                                }}
                              >
                                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span className="tracking-wide">Réserver</span>
                              </a>
                            ) : acc.websiteUrl ? (
                              <a
                                href={acc.websiteUrl && !/^https?:\/\//i.test(acc.websiteUrl) ? `https://${acc.websiteUrl.replace(/^\/+/, '')}` : acc.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5 w-full py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all active:scale-95"
                                style={{
                                  background: `linear-gradient(180deg, #0D2F5F 0%, #4A6C9B 100%)`,
                                  color: 'white',
                                  boxShadow: `0 1px 0 rgba(255,255,255,0.3) inset, 0 0 0 1px #0D2F5F60, 0 8px 20px -8px #0D2F5F70`
                                }}
                              >
                                <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span className="tracking-wide">Site web</span>
                              </a>
                            ) : (
                              <div className="w-full py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold text-white/30 bg-white/5 border border-white/10 text-center">
                                Aucun contact
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            {((safeUserModel as any).usefulAddressesEnabled && Array.isArray((safeUserModel as any).usefulAddresses) && (safeUserModel as any).usefulAddresses.length > 0) && (
              <div className="space-y-3 sm:space-y-4">
                <div className="text-center mb-3 sm:mb-4"><h3 className="text-sm sm:text-base font-bold tracking-[0.15em] uppercase text-white/70">✦ Autres adresses utiles ✦</h3></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {[...(safeUserModel as any).usefulAddresses].sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)).filter((a: any) => a.name).map((ua: any, idx: number) => {
                    const IconMap: Record<string, any> = { plane: Plane, train: Train, car: Car, taxi: CarTaxiFront, info: Info };
                    const IconComp = IconMap[ua.icon || 'info'] || Info;
                    return (<motion.div key={ua.id} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: Math.min(idx * 0.06, 0.4) }}><button type="button" onClick={() => { if (!ua.address) return; const url = /iPhone|iPad|iPod/.test(navigator.userAgent) ? `maps://?q=${encodeURIComponent(ua.address + ' ' + ua.name)}` : `https://www.google.com/maps?q=${encodeURIComponent(ua.address + ' ' + ua.name)}`; window.open(url, '_blank'); }} className="w-full text-left p-3 sm:p-4 rounded-2xl bg-black/40 backdrop-blur-xl border transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]" style={{ borderColor: `${colors.primary}30` }}><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow" style={{ background: `linear-gradient(145deg, ${colors.primary}90, ${colors.secondary}90)` }}><IconComp className="h-4 w-4 text-white" /></div><div className="flex-1 min-w-0"><h4 className="font-bold text-sm text-white truncate">{ua.name}</h4>{ua.address && <p className="text-[11px] text-white/70 truncate mt-0.5">{ua.address}</p>}{ua.details && <p className="text-[10px] font-semibold mt-0.5" style={{ color: colors.accent || colors.primary }}>{ua.details}</p>}</div></div></button></motion.div>);
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* GALERIE */}
      {(safeUserModel as any).galleryEnabled !== false && (
        <div ref={(el) => (sectionRefs.current.gallery = el)} className="relative z-10 w-full mt-0 px-0 snap-start overflow-hidden min-h-[100dvh] sm:min-h-[auto]">
          {optimizedGallerySectionBg && (<div className="absolute inset-0 z-0 pointer-events-none opacity-20 mix-blend-overlay transition-all duration-700"><img src={optimizedGallerySectionBg} alt="Background" className="w-full h-full object-cover transition-transform duration-700" /></div>)}
          <div className="relative z-40 flex flex-col items-center justify-center pt-8 sm:pt-12 md:pt-14 pb-4 sm:pb-5 md:pb-6 px-4 pointer-events-none">
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-[10px] sm:text-xs tracking-[0.25em] uppercase font-semibold text-white/70 mb-2 sm:mb-3"><span className="w-1 h-1 rounded-full" style={{ backgroundColor: colors.primary }} />Gallery<span className="w-1 h-1 rounded-full" style={{ backgroundColor: colors.primary }} /></div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight mb-1 sm:mb-2 bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, #ffffff 0%, ${colors.primary} 50%, #ffffff 100%)` }}>Nos Moments Précieux</h2>
              <p className="text-white/50 text-[11px] sm:text-sm font-medium max-w-md mx-auto leading-relaxed">C'est à tes côtés que je veux construire ma vie</p>
            </motion.div>
          </div>
          <div className="relative z-10">
            <ParallaxUnfurlingGallery items={parallaxGalleryItems} className="w-full" onImageClick={(_item, index) => { const safeIndex = !isNaN(index) && index >= 0 && index < galleryPhotos.length ? index : 0; setSelectedGalleryPhoto(galleryPhotos[safeIndex]); }} />
          </div>
        </div>
      )}

      {/* RSVP + DRINKS */}
      {((safeUserModel as any).rsvpEnabled !== false || (safeUserModel as any).drinksEnabled !== false) && (
        <div ref={(el) => (sectionRefs.current.rsvp = el)} className="min-h-screen flex flex-col items-center justify-start pt-16 pb-12 snap-start space-y-12 relative overflow-hidden w-full mt-12">
          {optimizedRsvpDrinksSectionBg && (<div className="absolute inset-0 z-0 transition-all duration-700 ease-in-out"><img src={optimizedRsvpDrinksSectionBg} alt="Background" className="w-full h-full object-cover transition-transform duration-700 ease-in-out" /><div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"></div></div>)}
          {(safeUserModel as any).fallingDotsEnabled !== false && <FallingDots colors={colors} />}
          <div className="relative z-10 w-full max-w-lg px-4">
            {(safeUserModel as any).rsvpEnabled !== false && (
              <RevealOnScroll className="space-y-4 flex flex-col items-center mb-8">
                <ShinyButton onClick={handleConfirmation} primaryColor={colors.primary} secondaryColor={colors.secondary}>
                  <div className="flex items-center gap-3">
                    {isConfirmed ? (<Check className="w-6 h-6 flex-shrink-0 text-emerald-400" />) : (<Users className="w-6 h-6 flex-shrink-0" />)}
                    <span className="text-white text-base md:text-lg font-bold tracking-wider whitespace-nowrap">{isConfirmed ? 'PRÉSENCE CONFIRMÉE' : 'CONFIRMER MA PRÉSENCE'}</span>
                  </div>
                </ShinyButton>
              </RevealOnScroll>
            )}
            {(safeUserModel as any).drinksEnabled !== false && (
              <div ref={(el) => (sectionRefs.current.drinks = el)}>
                <div className="w-full">
                  <BorderRotate borderRadius={40} borderWidth={2} animationSpeed={5} gradientColors={{ primary: colors.primary, secondary: colors.secondary, accent: colors.accent || '#ffffff' }} backgroundColor="transparent" className="w-full">
                    <div className="w-full rounded-[40px] p-8 text-white shadow-2xl h-full" style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.secondary})` }}>
                      <div className="flex flex-col items-center text-center space-y-4 mb-6">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"><Wine className="h-5 w-5 text-white" /></div>
                        <div>
                          <h3 className="text-lg font-bold">Choix de boisson</h3>
                          <p className="text-xs text-white/70 mt-2">Sélectionnez jusqu'à 2 boissons (pour les couples)</p>
                          <p className="text-[10px] text-white/50 mt-1">{selectedDrink.length}/2 boisson{selectedDrink.length > 1 ? 's' : ''} sélectionnée{selectedDrink.length > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 auto-rows-[minmax(0,1fr)]">
                        {(safeUserModel.drinkOptions || []).map((drink: string) => (
                          <button
                            key={drink}
                            title={drink}
                            onClick={() => handleDrinkSelection(drink)}
                            className={`flex flex-col items-center justify-center gap-0.5 px-1.5 py-1.5 rounded-xl transition-all duration-200 group w-full aspect-[2/1] overflow-hidden shrink-0 ${selectedDrink.includes(drink) ? 'bg-white shadow-lg ring-2 ring-white scale-[1.02]' : 'bg-white text-slate-800 hover:bg-white/90 active:scale-95'}`}
                            style={{ color: selectedDrink.includes(drink) ? colors.primary : undefined }}
                          >
                            <Wine
                              className="h-3 w-3 flex-shrink-0"
                              style={{ color: selectedDrink.includes(drink) ? colors.primary : '#94a3b8' }}
                            />
                            <span
                              className="text-[8px] sm:text-[8.5px] font-extrabold leading-[1.05] uppercase text-center min-w-0 w-full break-words"
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {drink}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </BorderRotate>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* JEUX */}
      {games && (safeUserModel as any).gamesEnabled !== false && games.filter((g: GameConfiguration) => g.isEnabled).length > 0 && (
        <div ref={(el) => (sectionRefs.current.games = el)} className="min-h-screen flex items-center justify-center py-12 snap-start relative overflow-hidden">
          {optimizedGamesSectionBg && (<div className="absolute inset-0 z-0 transition-all duration-700 ease-in-out"><img src={optimizedGamesSectionBg} alt="Background" className="w-full h-full object-cover transition-transform duration-700 ease-in-out" /><div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"></div></div>)}
          {(safeUserModel as any).fallingDotsEnabled !== false && <FallingDots colors={colors} />}
          <div className="relative z-10 w-full max-w-lg px-4">
            <div className="relative w-full" style={{ perspective: "1200px", transformStyle: "preserve-3d" }}>
              <BorderRotate borderRadius={36} borderWidth={3} animationSpeed={2.5} gradientColors={{ primary: colors.primary, secondary: colors.secondary, accent: colors.accent || '#ffffff' }} backgroundColor="transparent" className="w-full">
                <div className="w-full rounded-[36px] relative overflow-hidden" style={{ transformStyle: "preserve-3d", background: `linear-gradient(160deg, ${colors.primary}ff 0%, ${colors.secondary}f5 50%, ${colors.primary}ee 100%)`, boxShadow: `0 40px 80px -20px rgba(0,0,0,0.5), 0 25px 50px -12px rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -2px 0 rgba(255,255,255,0.08)` }}>
                  <div className="absolute -bottom-3 left-2 right-2 h-6 rounded-[30px] opacity-40 blur-sm" style={{ background: colors.secondary, transform: "translateZ(-20px)" }}></div>
                  <div className="absolute -bottom-6 left-4 right-4 h-6 rounded-[28px] opacity-25 blur-md" style={{ background: colors.primary, transform: "translateZ(-40px)" }}></div>
                  <div className="absolute inset-0 pointer-events-none z-[5]" style={{ background: `radial-gradient(ellipse 80% 50% at 30% 0%, rgba(255,255,255,0.45) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(255,255,255,0.22) 0%, transparent 55%)`, mixBlendMode: "screen" }}></div>
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-20 -left-16 w-72 h-72 rounded-full blur-3xl" style={{ backgroundColor: colors.primary, opacity: 0.55 }}></div>
                    <div className="absolute top-20 -right-20 w-80 h-80 rounded-full blur-3xl" style={{ backgroundColor: colors.secondary, opacity: 0.5 }}></div>
                    <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: colors.primary, opacity: 0.45 }}></div>
                  </div>
                  <div className="absolute inset-0 pointer-events-none opacity-[0.035] z-20" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.6) 2px, rgba(0,0,0,0.6) 4px)` }}></div>
                  <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-3" style={{ background: `linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 60%, transparent 100%)`, borderBottom: `1px solid rgba(255,255,255,0.2)`, transform: "translateZ(20px)" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: colors.primary, boxShadow: `0 0 10px ${colors.primary}` }}></div>
                      <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: colors.secondary, boxShadow: `0 0 10px ${colors.secondary}`, animationDelay: "0.3s" }}></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: "0 0 10px #34d399", animationDelay: "0.6s" }}></div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/25"><Star className="w-3 h-3" style={{ color: colors.primary }} fill={colors.primary} /><span className="text-[10px] font-black tracking-[0.2em] text-white uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">Pour la soirée</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-white/50"></div><div className="w-2 h-2 rounded-full bg-white/50"></div><div className="w-2 h-2 rounded-full bg-white/50"></div></div>
                  </div>
                  <div className="absolute top-14 left-3 w-6 h-6 border-l-2 border-t-2 rounded-tl-md pointer-events-none z-10" style={{ borderColor: colors.primary, opacity: 0.85, transform: "translateZ(30px)", filter: "drop-shadow(0 0 4px rgba(255,255,255,0.4))" }}></div>
                  <div className="absolute top-14 right-3 w-6 h-6 border-r-2 border-t-2 rounded-tr-md pointer-events-none z-10" style={{ borderColor: colors.secondary, opacity: 0.85, transform: "translateZ(30px)", filter: "drop-shadow(0 0 4px rgba(255,255,255,0.4))" }}></div>
                  <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 rounded-bl-md pointer-events-none z-10" style={{ borderColor: colors.secondary, opacity: 0.85, transform: "translateZ(30px)", filter: "drop-shadow(0 0 4px rgba(255,255,255,0.4))" }}></div>
                  <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 rounded-br-md pointer-events-none z-10" style={{ borderColor: colors.primary, opacity: 0.85, transform: "translateZ(30px)", filter: "drop-shadow(0 0 4px rgba(255,255,255,0.4))" }}></div>
                  <div className="relative z-10 p-5 space-y-5">
                    <div className="text-center relative" style={{ transform: "translateZ(40px)" }}>
                      <div className="relative inline-block mb-4">
                        <motion.div animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-6 rounded-full blur-md" style={{ background: `radial-gradient(ellipse, ${colors.primary} 0%, transparent 70%)` }}></motion.div>
                        <motion.div animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.15, 1], y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="relative inline-flex items-center justify-center" style={{ width: "72px", height: "72px", borderRadius: "22px", background: `linear-gradient(145deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 100%)`, backdropFilter: "blur(8px)", border: `2px solid rgba(255,255,255,0.25)`, boxShadow: `0 18px 35px -8px rgba(0,0,0,0.5), 0 8px 15px -4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.4)`, transformStyle: "preserve-3d" }}>
                          <div className="absolute inset-0 rounded-[20px] overflow-hidden opacity-50" style={{ background: `linear-gradient(135deg, ${colors.primary}40 0%, ${colors.secondary}40 100%)` }}></div>
                          <Gamepad2 className="w-9 h-9 text-white relative z-10 drop-shadow-lg" strokeWidth={2.2} />
                        </motion.div>
                      </div>
                      <motion.h2 animate={{ y: [0, -2, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="text-3xl md:text-4xl font-black font-luxury mb-3" style={{ color: "#fff", letterSpacing: "0.02em", textShadow: `0 2px 0 rgba(0,0,0,0.25), 0 4px 12px ${colors.primary}80, 0 6px 24px ${colors.secondary}50, 0 -1px 0 rgba(255,255,255,0.25)`, transform: "translateZ(30px)" }}>Jeux & Fun</motion.h2>
                      <p className="text-white/85 text-sm font-semibold tracking-wide" style={{ transform: "translateZ(20px)", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>Régalez-vous avant la soirée</p>
                      <div className="flex items-center justify-center gap-3 mt-4"><div className="h-px w-12" style={{ background: `linear-gradient(90deg, transparent, ${colors.primary})` }}></div><div className="flex items-center gap-1 px-3 py-1 rounded-full backdrop-blur-sm" style={{ background: `linear-gradient(90deg, ${colors.primary}60, ${colors.secondary}60)`, border: `1px solid rgba(255,255,255,0.3)` }}><HelpCircle className="w-3 h-3 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]" /><span className="text-[10px] font-black tracking-[0.25em] text-white uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">Jouez</span></div><div className="h-px w-12" style={{ background: `linear-gradient(90deg, ${colors.secondary}, transparent)` }}></div></div>
                    </div>
                    <div className="space-y-4 relative z-10" style={{ transform: "translateZ(25px)" }}>
                      {games.filter((g: GameConfiguration) => g.isEnabled && g.type !== 'puzzle').map((game: GameConfiguration, index: number) => {
                        const gameInfo = AVAILABLE_GAMES.find(g => g.type === game.type);
                        const resultsForGame = gameResults[game.id] || [];
                        const hasResultForThisGame = resultsForGame.some(res => res.guestName === invite?.nom && res.gameType === game.type);
                        const isCompleted = completedGames.has(game.id) || hasResultForThisGame;
                        return (
                          <div key={game.id} className="bg-white/22 backdrop-blur-xl rounded-[30px] overflow-hidden border border-white/30 shadow-lg transition-all duration-300 hover:shadow-2xl hover:bg-white/30 hover:scale-[1.02] group relative active:scale-[0.99]" style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,0.45), 0 10px 30px -10px rgba(0,0,0,0.35)` }}>
                            <div className="absolute inset-0 pointer-events-none opacity-60" style={{ background: `radial-gradient(ellipse at 30% 0%, rgba(255,255,255,0.25) 0%, transparent 55%)` }}></div>
                            <button type="button" onClick={() => setCurrentGameId(game.id)} className="w-full px-6 py-5 relative z-10 cursor-pointer text-left" style={{ pointerEvents: 'auto' }}>
                              <div className="flex items-center gap-5">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setCurrentGameId(game.id); }}
                                  className="w-14 h-14 rounded-[24px] flex items-center justify-center text-3xl shadow-lg group-hover:scale-115 transition-transform duration-250 flex-shrink-0 cursor-pointer active:scale-95 bg-transparent border-0 p-0"
                                  style={{ background: `linear-gradient(145deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.2) 100%)`, border: `1.5px solid rgba(255,255,255,0.45)`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), 0 8px 20px -6px rgba(0,0,0,0.3)`, pointerEvents: 'auto' }}
                                >
                                  {gameInfo?.icon || '🎮'}
                                </button>
                                <div className="flex-1 text-center px-2">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setCurrentGameId(game.id); }}
                                    className="text-white font-extrabold text-base md:text-lg mb-2 break-words drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] group-hover:brightness-110 transition-all cursor-pointer select-none active:scale-[0.97] inline-block bg-transparent border-0 p-0 w-full text-center"
                                    style={{ pointerEvents: 'auto' }}
                                  >
                                    {game.title}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setCurrentGameId(game.id); }}
                                    className="text-white/90 text-xs md:text-sm font-medium line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] cursor-pointer select-none active:scale-[0.98] block mx-auto bg-transparent border-0 p-0"
                                    style={{ pointerEvents: 'auto' }}
                                  >
                                    {game.description}
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setCurrentGameId(game.id); }}
                                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg group-hover:scale-120 group-hover:translate-x-1 transition-all duration-250 flex-shrink-0 cursor-pointer active:scale-95 bg-transparent border-0 p-0"
                                  style={{ background: `linear-gradient(145deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.22) 100%)`, border: `1.5px solid rgba(255,255,255,0.4)`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), 0 6px 14px -4px rgba(0,0,0,0.3)`, pointerEvents: 'auto' }}
                                >
                                  <ChevronRight className="text-white w-6 h-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" strokeWidth={2.8} />
                                </button>
                              </div>
                              {isCompleted && (<div className="mt-4 flex justify-center"><div className="inline-flex items-center gap-2 bg-emerald-400/30 px-5 py-2 rounded-full border border-emerald-300/40"><div><Check className="text-emerald-200 w-5 h-5" /></div><span className="text-emerald-100 text-xs font-bold uppercase tracking-widest">Terminé</span></div></div>)}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </BorderRotate>
            </div>
          </div>
        </div>
      )}

      {/* QR + FOOTER */}
      <div ref={(el) => (sectionRefs.current.qr = el)} className="min-h-screen flex flex-col items-center justify-start py-16 pt-48 pb-36 snap-start relative overflow-hidden">
        {optimizedQrFooterSectionBg && (<div className="absolute inset-0 z-0 transition-all duration-700 ease-in-out"><img src={optimizedQrFooterSectionBg} alt="Background" className="w-full h-full object-cover transition-transform duration-700 ease-in-out" /><div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"></div></div>)}
        {(safeUserModel as any).fallingDotsEnabled !== false && <FallingDots colors={colors} />}
        <RevealOnScroll className="relative w-full max-w-lg px-4 z-10">
          <div className="bg-black/40 backdrop-blur-xl rounded-[30px] p-5 shadow-xl flex flex-col items-center border-2 mb-6" style={{ borderColor: `${colors.primary}40` }}>
            <div className="flex items-center space-x-2 mb-5"><QrCode className="h-5 w-5" style={{ color: colors.primary }} /><h3 className="text-base font-bold" style={{ color: colors.primary }}>Code d'Invitation</h3></div>
            <div className="bg-white p-3 rounded-[20px] shadow-inner mb-5 w-full max-w-[200px] aspect-square flex items-center justify-center">{qrCodeDataUrl ? (<img src={qrCodeDataUrl} className="w-full h-full object-contain" alt="QR Code" />) : (<div className="w-full h-full bg-slate-100 animate-pulse rounded-xl" />)}</div>
            <div className="flex items-center gap-4 w-full justify-center">
              <button
                onClick={downloadQRCode}
                title="Télécharger le QR code"
                className="group relative w-12 h-12 rounded-full shadow-xl flex items-center justify-center hover:scale-110 hover:shadow-2xl transition-all duration-300 active:scale-95 text-white border-2 border-white/30 backdrop-blur-md"
                style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
              >
                <QrCode className="h-5 w-5 group-hover:rotate-6 transition-transform duration-300" />
                <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>
              </button>
              {downloadInvitationJpg && (
                <button
                  onClick={downloadInvitationJpg}
                  title="Télécharger l'invitation"
                  className="group relative w-12 h-12 rounded-full shadow-xl flex items-center justify-center hover:scale-110 hover:shadow-2xl transition-all duration-300 active:scale-95 text-white border-2 border-white/30 backdrop-blur-md"
                  style={{ background: `linear-gradient(135deg, ${colors.secondary}, ${colors.accent || colors.primary})` }}
                >
                  <ImageIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>
                </button>
              )}
            </div>
          </div>
        </RevealOnScroll>
        <div className="absolute bottom-0 left-0 right-0 pb-6 pt-4 flex justify-center w-full z-20 px-4">
          <div className="bg-white/90 backdrop-blur-md px-3 py-2.5 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 shadow-xl border border-white/20 w-full max-w-md rounded-2xl">
            <div className="flex items-center justify-center gap-2"><Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" /><p className="text-slate-600 text-[11px] font-medium text-center">Réalisé par <a href="https://www.furaha-digital.net/" target="_blank" rel="noopener noreferrer" className="font-bold hover:underline transition-all" style={{ color: colors.primary }}>Furaha Digital</a></p><Sparkles className="h-3 w-3 text-amber-400" /></div>
            <div className="h-[1px] w-16 bg-slate-300/70 sm:h-4 sm:w-[1px]"></div>
            <a href="https://wa.me/243844333917" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 group"><svg className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg><span className="text-[11px] font-semibold text-emerald-600 hover:underline transition-all">Contactez-nous sur WhatsApp</span></a>
          </div>
        </div>
      </div>

      {/* PHOTO VIEWER */}
      {selectedGalleryPhoto && (<PhotoViewer photos={galleryPhotos} initialPhoto={selectedGalleryPhoto} onClose={() => setSelectedGalleryPhoto(null)} optimizeImage={optimizeImageFn} themeColors={{ primary: colors.primary, secondary: colors.secondary, accent: colors.accent }} />)}

      {/* FLOATING CONTROLS */}
      <div className="fixed bottom-8 right-4 z-50 flex flex-col space-y-2">
        {safeUserModel.backgroundMusic && (
          <button
            onClick={toggleMute}
            className={`w-10 h-10 rounded-full shadow-md flex items-center justify-center border border-white/50 backdrop-blur-md transform hover:scale-105 transition-all active:scale-95 relative overflow-hidden ${isMusicMuted ? 'bg-slate-800/80' : ''}`}
            style={{ background: isMusicMuted ? undefined : `linear-gradient(to br, ${colors.primary}, ${colors.secondary})` }}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <div
                className="absolute rounded-full transition-transform"
                style={{
                  width: '80%',
                  height: '80%',
                  animation: (isMusicPlaying && !isMusicMuted) ? 'spin-slow 3s linear infinite' : 'none',
                  background: `
                    radial-gradient(circle at 30% 25%, rgba(255,255,255,0.5) 0%, transparent 38%),
                    conic-gradient(from 0deg,
                      rgba(255,80,80,0.4) 0%,
                      rgba(255,180,80,0.4) 14%,
                      rgba(180,255,80,0.4) 28%,
                      rgba(80,255,180,0.4) 42%,
                      rgba(80,180,255,0.4) 56%,
                      rgba(180,80,255,0.4) 70%,
                      rgba(255,80,180,0.4) 84%,
                      rgba(255,80,80,0.4) 100%
                    ),
                    linear-gradient(135deg, #ececf2 0%, #bcbccb 42%, #d5d5e0 55%, #9e9eb2 100%)
                  `,
                  boxShadow: 'inset 0 0 6px rgba(0,0,0,0.45), 0 0 4px rgba(0,0,0,0.2)',
                  filter: isMusicMuted ? 'grayscale(0.7) brightness(0.78)' : 'none',
                }}
              >
                <div className="absolute rounded-full pointer-events-none" style={{
                  inset: '18%',
                  border: '0.3px solid rgba(0,0,0,0.09)',
                  boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.05)',
                }} />
                <div className="absolute rounded-full pointer-events-none" style={{
                  inset: '26%',
                  border: '0.3px solid rgba(0,0,0,0.09)',
                }} />
                <div className="absolute rounded-full pointer-events-none" style={{
                  inset: '34%',
                  border: '0.3px solid rgba(0,0,0,0.09)',
                }} />
                <div className="absolute rounded-full" style={{
                  inset: '42%',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f1f1f6 50%, #d7d7e0 100%)',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.28), inset 0 1px 2px rgba(255,255,255,0.9)',
                }} />
                <div className="absolute rounded-full bg-[#15152a]" style={{
                  width: '14%',
                  height: '14%',
                  top: '43%',
                  left: '43%',
                  boxShadow: '0 0 0 0.5px rgba(0,0,0,0.65), inset 0 0 3px rgba(0,0,0,0.5)',
                }} />
                {(isMusicPlaying && !isMusicMuted) && (
                  <div className="absolute inset-0 rounded-full pointer-events-none" style={{
                    background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.2) 22%, transparent 52%, rgba(255,255,255,0.09) 78%, transparent 100%)',
                    mixBlendMode: 'screen',
                  }} />
                )}
              </div>
            </div>
          </button>
        )}
        {typeof navigator !== 'undefined' && !(/iPad|iPhone|iPod/.test(navigator.userAgent)) && (safeUserModel as any).notificationEnabled !== false && (
          <button
            onClick={() => { setShowNotificationModal(true); }}
            className="w-10 h-10 rounded-full shadow-md flex items-center justify-center text-white border border-white/50 backdrop-blur-md transform hover:scale-105 transition-all active:scale-95 relative"
            style={{ background: `linear-gradient(to br, ${colors.secondary}, ${colors.primary})`, backgroundColor: colors.secondary }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {(token || localStorage.getItem('furaha_notification_token') || permission === 'granted' || localStorage.getItem('furaha_notification_permission') === 'granted') && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center border border-white text-[10px] font-bold shadow-sm">
                <Check className="h-2.5 w-2.5" />
              </div>
            )}
          </button>
        )}
        {(safeUserModel as any).guestBookEnabled !== false && (
          <div className="relative group">
            <div className="absolute inset-[-4px] rounded-full overflow-hidden pointer-events-none">
              <div
                className="absolute inset-0 animate-spin-slow"
                style={{ background: `conic-gradient(from 0deg, transparent 70%, ${colors.primary}, ${colors.secondary})`, animationDuration: '3s' }}
              ></div>
              <div className="absolute inset-[2px] bg-slate-50/10 backdrop-blur-sm rounded-full"></div>
            </div>
            <button
              onClick={() => setShowGuestBook(true)}
              className="w-10 h-10 rounded-full shadow-md flex items-center justify-center text-white border border-white/50 backdrop-blur-md transform hover:scale-105 transition-all active:scale-95 relative z-10"
              style={{ background: `linear-gradient(to br, ${colors.primary}, ${colors.secondary})`, backgroundColor: colors.primary }}
            >
              <BookOpen className="h-5 w-5 text-white" />
              {guestBookMessages.length > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold border border-white shadow-sm animate-bounce">
                  {guestBookMessages.length}
                </div>
              )}
              <div className="absolute -bottom-1 -left-1 text-white opacity-80">
                <Sparkles className="h-3 w-3" style={{ color: colors.secondary }} />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* GUEST BOOK MODAL */}
      {(safeUserModel as any).guestBookEnabled !== false && showGuestBook && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowGuestBook(false)}></div>
          <div className="relative bg-[#faf9f6] w-full max-w-lg h-[88vh] rounded-[50px] shadow-[0_30px_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-zoom-in border border-white/30">
            <div className="relative h-36 flex-shrink-0 overflow-hidden">
              <img src={optimizeImageFn(safeUserModel.invitationPhoto || photoCouple, 800, 80)} className="w-full h-full object-cover scale-105" alt="Header" loading="lazy" />
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute inset-0 p-6 flex items-center justify-between text-white">
                <div className="flex items-center space-x-4">
                  <div className="relative group"><div className="absolute inset-[-4px] rounded-full bg-white/20 blur-sm"></div><div className="w-14 h-14 rounded-full border-2 border-white/80 overflow-hidden shadow-xl relative z-10"><img src={optimizeImageFn(safeUserModel.invitationPhoto || photoCouple, 150, 60)} className="w-full h-full object-cover" alt="" loading="lazy" /></div></div>
                  <div className="space-y-0.5"><p className="text-[9px] text-white/80 uppercase tracking-[0.4em] font-black">Livre d'Or</p><h3 className="text-2xl font-luxury tracking-tight drop-shadow-lg">Mots Doux & Vœux</h3></div>
                </div>
                <button onClick={() => setShowGuestBook(false)} className="p-2.5 bg-white/10 hover:bg-white/30 backdrop-blur-xl rounded-xl transition-all duration-500 border border-white/20 group shadow-lg"><X className="h-5 w-5 group-hover:rotate-180 transition-transform duration-700" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar relative bg-gradient-to-br from-[#fdf4f4] via-[#fef9f0] to-[#fdf5f9]">
              <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: `url(${ornement5})`, backgroundSize: '300px', backgroundRepeat: 'repeat', opacity: 0.15 }}></div>
              {guestBookMessages && guestBookMessages.length > 0 ? (
                <div className="relative z-10 pb-4">
                  {guestBookMessages.map((msg, index) => {
                    const isMe = msg.inviteId === inviteId;
                    const initials = (msg.nom || 'Inconnu').split(' ').map((n: any) => n ? n[0] : '').join('').substring(0, 2).toUpperCase();
                    const cardStyles = [{ bg: '#ffeef0', text: '#8b3a42', accent: '#ff9a9e', border: '#ffcdd2' }, { bg: '#fdf2f8', text: '#7a2048', accent: '#f78fb3', border: '#fce4ec' }, { bg: '#fff4e6', text: '#9a4c2a', accent: '#ffb199', border: '#ffe0b2' }];
                    const style = cardStyles[index % cardStyles.length];
                    return (
                      <div key={msg.id || index} className={`flex items-start space-x-2 sm:space-x-3 mb-5 sm:mb-6 w-full max-w-full ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'} animate-slide-up`} style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="flex-shrink-0 mt-1 relative">
                          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[8px] sm:text-[9px] font-black shadow-lg border-2 relative z-10 transform transition-all group-hover:scale-110`} style={{ background: isMe ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` : `linear-gradient(135deg, ${style.accent}, ${style.bg})`, color: isMe ? '#ffffff' : style.text, borderColor: isMe ? colors.primary : style.border }}>{initials || '?'}</div>
                          <div className="absolute -top-1 -right-1 text-pink-400 animate-pulse"><Heart className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-current" /></div>
                        </div>
                        <div className={`flex-1 min-w-0 p-4 sm:p-5 relative group transition-all duration-500 hover:shadow-xl ${isMe ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm'}`} style={{ background: isMe ? `linear-gradient(135deg, ${colors.primary}ee, ${colors.secondary}ee)` : `linear-gradient(135deg, ${style.bg}, ${style.bg}dd)`, boxShadow: '0 4px 20px -6px rgba(0,0,0,0.1)', border: `1px solid ${isMe ? colors.primary + '40' : style.border}`, color: isMe ? '#ffffff' : style.text, maxWidth: 'calc(100% - 3rem)' }}>
                          <div className={`absolute ${isMe ? 'top-1 left-1' : 'top-1 right-1'} opacity-40`}><Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: isMe ? '#fff' : style.accent }} /></div>
                          <div className={`absolute ${isMe ? 'bottom-1 right-1' : 'bottom-1 left-1'} opacity-30`}><Heart className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-current" style={{ color: isMe ? '#fff' : style.accent }} /></div>
                          <div className="flex justify-between items-start sm:items-center mb-2 sm:mb-3 gap-2 min-w-0">
                            <div className="flex flex-col min-w-0">
                              {!isMe && (<span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] mb-0.5 truncate" style={{ color: isMe ? '#ffffffcc' : style.accent }}>{msg.nom || 'Invité spécial(e)'}</span>)}
                              <div className="flex items-center space-x-1.5 text-[7.5px] sm:text-[8px] font-medium opacity-70 whitespace-nowrap"><Clock className="h-1.5 w-1.5 sm:h-2 sm:w-2" /><span>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span></div>
                            </div>
                            {isMe && (
                              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                                {editingMessageId === msg.id ? (<><button onClick={() => handleSaveEdit(msg)} disabled={isSubmittingMessage || !editingText.trim()} className="p-1 sm:p-1.5 rounded-full hover:bg-white/20 transition-all disabled:opacity-30"><svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button><button onClick={() => { setEditingMessageId(null); setEditingText(''); }} className="p-1 sm:p-1.5 rounded-full hover:bg-white/20 transition-all"><svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></>) : (<><button onClick={() => handleEditMessage(msg)} className="p-1 sm:p-1.5 rounded-full hover:bg-white/20 transition-all"><svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button><button onClick={() => handleDeleteMessage(msg)} className="p-1 sm:p-1.5 rounded-full hover:bg-white/20 transition-all"><svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></>)}
                              </div>
                            )}
                            {!isMe && (<div className="flex-shrink-0"><Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current opacity-50" style={{ color: isMe ? '#fff' : style.accent }} /></div>)}
                          </div>
                          {editingMessageId === msg.id ? (<textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} className="w-full bg-transparent border-none p-0 focus:ring-0 text-[14px] leading-relaxed italic font-serif resize-none" style={{ color: isMe ? '#fff' : style.text }} autoFocus />) : (
                            <div className="space-y-3">
                              {msg.message && !msg.audioUrl && (<p className="text-[14px] leading-relaxed italic font-serif">"{msg.message}"</p>)}
                              {msg.message && msg.audioUrl && (<p className="text-[13px] leading-relaxed italic font-serif opacity-85">"{msg.message}"</p>)}
                              {msg.audioUrl && (
                                <div className="pt-1 min-w-0 w-full overflow-hidden">
                                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 w-full">
                                    <button
                                      onClick={() => playMessageAudio && playMessageAudio(msg)}
                                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 shadow-sm"
                                      style={{ background: isMe ? 'rgba(255,255,255,0.25)' : style.accent, color: isMe ? '#ffffff' : '#ffffff' }}
                                    >
                                      {currentlyPlayingMessageId === msg.id && isAudioPlaying ? (<Pause className="h-4 w-4 sm:h-4.5 sm:w-4.5 fill-current" />) : (<Play className="h-4 w-4 sm:h-4.5 sm:w-4.5 fill-current ml-0.5" />)}
                                    </button>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center w-full overflow-hidden">
                                      <div className="flex items-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1 w-full h-3.5 sm:h-4 overflow-hidden min-w-0">
                                        {[...Array(24)].map((_, i) => {
                                          const heights = [14, 32, 50, 36, 64, 42, 80, 52, 66, 34, 84, 46, 62, 28, 70, 40, 56, 22, 52, 32, 64, 28, 48, 30];
                                          const isActive = currentlyPlayingMessageId === msg.id && isAudioPlaying;
                                          const curT = getEffectiveAudioTime ? getEffectiveAudioTime(msg) : 0;
                                          const totalT = getEffectiveAudioDuration ? getEffectiveAudioDuration(msg) : (msg.audioDuration || 0);
                                          const ratio = totalT > 0 ? Math.min(1, Math.max(0, curT / totalT)) : 0;
                                          const waveProgress = Math.floor(ratio * 24);
                                          const played = i <= waveProgress;
                                          return (
                                            <div
                                              key={i}
                                              className="w-[1.5px] sm:w-[2px] rounded-full flex-shrink-0"
                                              style={{
                                                height: `${heights[i]}%`,
                                                minHeight: '2px',
                                                background: played
                                                  ? (isMe ? '#ffffff' : style.text)
                                                  : (isActive
                                                      ? (isMe ? 'rgba(255,255,255,0.75)' : (style.text + 'cc'))
                                                      : (isMe ? 'rgba(255,255,255,0.35)' : (style.accent + '80'))),
                                                opacity: 1,
                                                transition: 'all 0.12s ease'
                                              }}
                                            ></div>
                                          );
                                        })}
                                      </div>
                                      {(() => {
                                        const curT = getEffectiveAudioTime ? getEffectiveAudioTime(msg) : 0;
                                        const totalT = getEffectiveAudioDuration ? getEffectiveAudioDuration(msg) : (msg.audioDuration || 0);
                                        const ratio = totalT > 0 ? Math.min(1, Math.max(0, curT / totalT)) : 0;
                                        const trackColor = isMe ? 'rgba(255,255,255,0.22)' : (style.accent + '33');
                                        const fillColor = isMe ? '#ffffff' : style.text;
                                        return (
                                          <div
                                            className="relative w-full h-1.5 rounded-full touch-none cursor-pointer select-none"
                                            style={{ background: trackColor }}
                                            onClick={(e) => {
                                              if (!seekMessageAudio || !e.currentTarget) return;
                                              const rect = e.currentTarget.getBoundingClientRect();
                                              const x = (e.clientX - rect.left) / rect.width;
                                              seekMessageAudio(msg, Math.max(0, Math.min(1, x)));
                                            }}
                                          >
                                            <div
                                              className="absolute left-0 top-0 h-full rounded-full transition-[width] duration-150"
                                              style={{ width: `${ratio * 100}%`, background: fillColor }}
                                            ></div>
                                            <div
                                              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-md transition-all duration-150 flex-shrink-0"
                                              style={{ left: `calc(${ratio * 100}% - 5px)`, background: fillColor }}
                                            ></div>
                                          </div>
                                        );
                                      })()}
                                      <div className="flex justify-between items-center mt-0.5 sm:mt-1 gap-1 min-w-0">
                                        <span className="text-[9px] sm:text-[10px] font-medium tabular-nums flex-shrink-0 whitespace-nowrap" style={{ color: isMe ? 'rgba(255,255,255,0.8)' : (style.text + 'CC') }}>
                                          {formatAudioTime ? formatAudioTime(getEffectiveAudioTime ? getEffectiveAudioTime(msg) : 0) : '0:00'}
                                        </span>
                                        {!isMe && (
                                          <span className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider flex-shrink-0 whitespace-nowrap hidden sm:inline-block" style={{ color: style.accent, opacity: 0.85 }}>
                                            Vocal
                                          </span>
                                        )}
                                        <span className="text-[9px] sm:text-[10px] font-medium tabular-nums flex-shrink-0 whitespace-nowrap ml-auto" style={{ color: isMe ? 'rgba(255,255,255,0.75)' : (style.text + 'B3') }}>
                                          {formatAudioTime ? formatAudioTime(getEffectiveAudioDuration ? getEffectiveAudioDuration(msg) : (msg.audioDuration || 0)) : '0:00'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {msg.replies && msg.replies.length > 0 && (<div className="mt-3 space-y-2">{msg.replies.map((r: any, rIdx: number) => { const isAdminReply = r.authorInviteId && r.authorInviteId === invite?.userId; const adminName = isAdminReply ? (safeUserModel.title || 'Organisateur') : (r.authorName || 'Invité'); return (<div key={r.id || rIdx} className={`relative border-l-[3px] pl-2.5 py-1 ${!isMe ? 'animate-slide-up' : ''}`} style={{ borderColor: isMe ? 'rgba(255,255,255,0.5)' : colors.primary }}><div className="flex items-center justify-between mb-0.5 gap-2"><span className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: isMe ? 'rgba(255,255,255,0.9)' : colors.primary }}>{adminName}</span><span className="text-[7.5px] font-medium flex items-center gap-0.5 whitespace-nowrap" style={{ color: isMe ? 'rgba(255,255,255,0.65)' : (style.text + '88') }}><Clock className="h-1.5 w-1.5" />{r.createdAt ? new Date(r.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</span></div><p className="leading-relaxed whitespace-pre-wrap" style={{ fontSize: '11px', color: isMe ? 'rgba(255,255,255,0.92)' : style.text, opacity: 0.85, fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: 'italic' }}>{r.content}</p></div>); })}</div>)}
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(to right, transparent, ${isMe ? 'rgba(255,255,255,0.6)' : style.accent}, transparent)` }}></div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center relative z-10">
                  <div className="w-28 h-28 bg-gradient-to-br from-white to-pink-50 rounded-full flex items-center justify-center shadow-xl mb-6 border border-pink-100 relative overflow-hidden group"><div className="absolute inset-0 bg-gradient-to-br from-transparent via-pink-50/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div><BookOpen className="h-12 w-12 text-pink-200" /></div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-pink-300 text-center px-8 leading-relaxed">Écrivez un mot d'amour pour les mariés</p>
                </div>
              )}
            </div>
            <div className="p-6 bg-white border-t border-slate-100 rounded-b-[50px] shadow-[0_-20px_50px_rgba(0,0,0,0.03)] relative z-20">
              {(isRecording || recordedAudioUrl) && (
                <div className={recordedAudioUrl ? 'mb-0' : 'mb-4'}>
                  <div className="p-4 rounded-3xl border-2 relative overflow-hidden" style={{ borderColor: isRecording ? '#fee2e2' : (colors.primary + '33'), background: isRecording ? 'linear-gradient(135deg, #fef2f2, #fff1f2)' : `linear-gradient(135deg, ${colors.primary}10, #ffffff)` }}>
                    {isRecording ? (
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg flex-shrink-0">
                          <div className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-40"></div>
                          <Mic className="h-5 w-5 text-white relative z-10" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Enregistrement en cours...</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex gap-0.5 items-end h-6">
                              {[...Array(5)].map((_, i) => (
                                <div key={i} className="w-1 bg-gradient-to-t from-red-400 to-pink-400 rounded-full animate-pulse" style={{ height: `${Math.random() * 80 + 20}%`, animationDelay: `${i * 0.1}s`, animationDuration: `${0.6 + Math.random() * 0.6}s` }}></div>
                              ))}
                            </div>
                            <span className="text-xl font-black tabular-nums text-red-600">
                              {formatAudioTime ? formatAudioTime(recordingTime || 0) : `${Math.floor((recordingTime || 0) / 60)}:${String((recordingTime || 0) % 60).padStart(2, '0')}`}
                            </span>
                          </div>
                        </div>
                        <button onClick={toggleRecording} className="w-11 h-11 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg hover:shadow-xl active:scale-90 transition-all flex-shrink-0">
                          <Square className="h-4 w-4 fill-current" />
                        </button>
                      </div>
                    ) : recordedAudioUrl ? (
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 w-full">
                        <button
                          onClick={() => togglePreviewPlay && togglePreviewPlay()}
                          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center flex-shrink-0 shadow-md transition-all active:scale-90"
                          style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, color: '#fff' }}
                        >
                          {isPreviewPlaying ? (<Pause className="h-4 w-4 sm:h-4.5 sm:w-4.5 fill-current" />) : (<Play className="h-4 w-4 sm:h-4.5 sm:w-4.5 fill-current ml-0.5" />)}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1.5 w-full min-w-0">
                            <Mic className="h-3 w-3 flex-shrink-0" style={{ color: colors.primary }} />
                            <div className="flex gap-0.5 items-end h-3 min-w-0 flex-1 overflow-hidden w-full">
                              {(() => {
                                const curT = previewCurrentTime || 0;
                                const totalT = audioDuration || 0;
                                const ratio = totalT > 0 ? Math.min(1, Math.max(0, curT / totalT)) : 0;
                                const waveProgress = Math.floor(ratio * 28);
                                const heights = [10, 30, 55, 35, 70, 45, 85, 50, 65, 30, 90, 45, 60, 25, 75, 40, 60, 20, 55, 30, 70, 25, 45, 15, 55, 35, 65, 20];
                                return [...Array(28)].map((_, i) => {
                                  const played = i <= waveProgress;
                                  return (
                                    <div key={i} className="w-0.5 sm:w-[2px] rounded-full flex-shrink-0" style={{
                                      height: `${heights[i]}%`,
                                      minHeight: '2px',
                                      background: played
                                        ? colors.primary
                                        : (isPreviewPlaying
                                            ? (colors.primary + 'B3')
                                            : (colors.primary + '55')),
                                      opacity: 1,
                                      transition: 'all 0.12s ease'
                                    }}></div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                          {(() => {
                            const curT = previewCurrentTime || 0;
                            const totalT = audioDuration || 0;
                            const ratio = totalT > 0 ? Math.min(1, Math.max(0, curT / totalT)) : 0;
                            const trackColor = colors.primary + '1A';
                            const fillColor = `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`;
                            return (
                              <div
                                className="relative w-full h-1.5 rounded-full touch-none cursor-pointer select-none"
                                style={{ background: trackColor }}
                                onClick={(e) => {
                                  if (!seekPreviewAudio || !e.currentTarget) return;
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const x = (e.clientX - rect.left) / rect.width;
                                  seekPreviewAudio(Math.max(0, Math.min(1, x)));
                                }}
                              >
                                <div
                                  className="absolute left-0 top-0 h-full rounded-full transition-[width] duration-150"
                                  style={{ width: `${ratio * 100}%`, background: fillColor }}
                                ></div>
                                <div
                                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-md transition-all duration-150 flex-shrink-0"
                                  style={{ left: `calc(${ratio * 100}% - 6px)`, background: colors.primary }}
                                ></div>
                              </div>
                            );
                          })()}
                          <div className="flex justify-between items-center mt-1 min-w-0">
                            <span className="text-[10px] sm:text-[11px] font-medium tabular-nums flex-shrink-0" style={{ color: colors.primary + 'CC' }}>
                              {formatAudioTime ? formatAudioTime(previewCurrentTime || 0) : '0:00'}
                            </span>
                            <span className="text-[10px] sm:text-[11px] font-medium tabular-nums flex-shrink-0" style={{ color: colors.primary + 'B3' }}>
                              {formatAudioTime ? formatAudioTime(audioDuration || 0) : '0:00'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-auto sm:ml-0">
                          <button onClick={cancelRecording} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center active:scale-90 transition-all flex-shrink-0" style={{ color: '#f43f5e', background: '#fff1f2' }}>
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                          <button onClick={handleSendMessage} disabled={isSubmittingMessage} className="rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90 disabled:opacity-40 hover:scale-105 relative overflow-hidden flex-shrink-0" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, color: '#ffffff', width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' }} title="Envoyer le message vocal">{isSubmittingMessage ? (<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>) : (<Send className="h-4.5 w-4.5 sm:h-5 sm:w-5 fill-current" strokeWidth={2.5} />)}</button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
              {!recordedAudioUrl && !isRecording && (
                <div className="flex items-center space-x-3 p-2 pl-4 rounded-full border-2 transition-all duration-500 bg-slate-50 focus-within:bg-white focus-within:border-slate-200 focus-within:shadow-xl group" style={{ borderColor: '#f1f5f9' }}>
                  <button
                    onClick={toggleRecording}
                    disabled={isSubmittingMessage}
                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 disabled:opacity-40 hover:scale-105 shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#92400e' }}
                    title="Enregistrer un message vocal"
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                  <textarea value={guestMessage} onChange={(e) => setGuestMessage(e.target.value)} placeholder="Écrivez votre message précieux..." className="flex-1 bg-transparent border-none py-3 focus:ring-0 transition-all resize-none h-14 text-sm font-medium text-slate-800 placeholder:text-slate-400 font-serif" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} />
                  <button onClick={handleSendMessage} disabled={isSubmittingMessage || !guestMessage.trim()} className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 disabled:opacity-30 hover:scale-105 relative overflow-hidden flex-shrink-0" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, color: '#ffffff' }}>{isSubmittingMessage ? (<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>) : (<Send className="h-5 w-5 relative z-10 fill-current group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />)}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden animate-slide-up">
            <div className="p-6 text-center"><div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center"><svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div><h3 className="text-lg font-bold text-slate-800 mb-1.5">Supprimer le message ?</h3><p className="text-slate-500 text-xs leading-relaxed">Cette action est irréversible. Votre message sera définitivement supprimé.</p></div>
            <div className="flex border-t border-slate-100">
              <button onClick={() => setShowDeleteConfirm({ isOpen: false, message: null })} className="flex-1 py-3 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors">Annuler</button>
              <button onClick={confirmDelete} disabled={isSubmittingMessage} className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white font-medium text-sm hover:from-red-600 hover:to-rose-600 transition-all disabled:opacity-50">{isSubmittingMessage ? (<div className="w-4 h-4 mx-auto border-2 border-white/30 border-t-white rounded-full animate-spin"></div>) : ('Supprimer')}</button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE GAME MODAL */}
      {currentGameId && (() => {
        const game = games.find(g => g.id === currentGameId);
        if (!game) return null;
        const gameInfo = AVAILABLE_GAMES.find(g => g.type === game.type);
        const currentGameResults = gameResults[game.id] || [];
        const playerResult = currentGameResults.find(res => res.guestName === invite?.nom && res.gameType === game.type);
        const isCompleted = completedGames.has(game.id) || !!playerResult;
        const playerScore = playerResult?.score;
        const handleGameComplete = async (score: number, data: any) => { setCompletedGames(prev => new Set([...prev, game.id])); };
        const handleMemoryComplete = async () => { setCompletedGames(prev => new Set([...prev, game.id])); };
        const handleLoveQuizComplete = async () => { setCompletedGames(prev => new Set([...prev, game.id])); };
        const handleCatchLoveComplete = async () => { setCompletedGames(prev => new Set([...prev, game.id])); };
        const renderGameContent = () => {
          switch (game.type) {
            case 'couple-quiz': return <CoupleQuizGame game={game} colors={colors} onComplete={handleGameComplete} guestName={invite?.nom || 'Invité'} />;
            case 'wish-generator': return <WishGeneratorGame game={game} colors={colors} onComplete={handleGameComplete} guestName={invite?.nom || 'Invité'} />;
            case 'photo-challenge': return <PhotoChallengeGame game={game} colors={colors} onComplete={handleGameComplete} guestName={invite?.nom || 'Invité'} />;
            case 'love-story-timeline': return <LoveStoryTimelineGame game={game} colors={colors} onComplete={handleGameComplete} guestName={invite?.nom || 'Invité'} />;
            case 'wedding-trivia': return <WeddingTriviaGame game={game} colors={colors} onComplete={handleGameComplete} guestName={invite?.nom || 'Invité'} />;
            case 'guest-book-prompt': return <GuestBookPromptGame game={game} colors={colors} onComplete={handleGameComplete} guestName={invite?.nom || 'Invité'} />;
            case 'quiz':
            case 'love-quiz': return <LoveQuizGame config={game as any} userId={invite?.userId || ''} modelId={userModel?.id || ''} inviteId={inviteId || ''} guestName={invite?.nom || 'Invité'} onSaveResult={handleLoveQuizComplete} leaderboard={currentGameResults} colors={colors} isCompleted={isCompleted} playerScore={playerScore} />;
            case 'memory-match': return <MemoryMatchGame config={game as any} userId={invite?.userId || ''} modelId={userModel?.id || ''} inviteId={inviteId || ''} guestName={invite?.nom || 'Invité'} onSaveResult={handleMemoryComplete} leaderboard={currentGameResults} colors={colors} isCompleted={isCompleted} playerScore={playerScore} />;
            case 'catch-love': return <CatchLoveGame config={game as any} userId={invite?.userId || ''} modelId={userModel?.id || ''} inviteId={inviteId || ''} guestName={invite?.nom || 'Invité'} onSaveResult={handleCatchLoveComplete} leaderboard={currentGameResults} colors={colors} isCompleted={isCompleted} playerScore={playerScore} />;
            default: return (<div className="text-center py-8"><div className="w-20 h-20 mx-auto bg-white/10 rounded-2xl flex items-center justify-center mb-4"><Trophy className="h-10 w-10 text-white/40" /></div><h4 className="text-white/70 font-medium mb-2">Jeu à venir</h4><p className="text-white/40 text-sm">Ce jeu sera disponible bientôt !</p></div>);
          }
        };
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setCurrentGameId(null)}></div>
            <div className="relative bg-[#faf9f6] w-full max-w-lg h-[88vh] rounded-[50px] shadow-[0_30px_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-zoom-in border border-white/30">
              <div className="relative h-32 sm:h-36 flex-shrink-0 overflow-hidden">
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]"></div>
                <div className="absolute inset-0 p-6 flex items-center justify-between text-white">
                  <div className="flex items-center space-x-4"><div className="relative group"><div className="absolute inset-[-4px] rounded-full bg-white/20 blur-sm"></div><div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center shadow-xl relative z-10"><span className="text-3xl">{gameInfo?.icon || '🎮'}</span></div></div><div className="space-y-0.5"><p className="text-[9px] text-white/80 uppercase tracking-[0.4em] font-black">Jeu</p><h3 className="text-2xl font-luxury tracking-tight drop-shadow-lg">{game.title}</h3></div></div>
                  <button onClick={() => setCurrentGameId(null)} className="p-2.5 bg-white/10 hover:bg-white/30 backdrop-blur-xl rounded-xl transition-all duration-500 border border-white/20 group shadow-lg"><X className="h-5 w-5 group-hover:rotate-180 transition-transform duration-700" /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 no-scrollbar relative bg-[#faf9f6]">{renderGameContent()}</div>
            </div>
          </div>
        );
      })()}

      {/* TOAST MODAL */}
      <ToastModal isOpen={showToastModal.isOpen} onClose={() => setShowToastModal({ ...showToastModal, isOpen: false })} type={showToastModal.type} selectedDrink={showToastModal.drink} primaryColor={colors.primary} secondaryColor={colors.secondary} />

      {/* NOTIFICATION MODAL */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { if (!(permission === 'granted' || token)) { localStorage.setItem('furaha_notification_modal_dismissed', 'true'); } setShowNotificationModal(false); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-slide-up">
            <div className="p-6 text-center" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg></div>
              <h2 className="text-xl font-bold text-white">Ne manquez pas l'événement !</h2>
            </div>
            <div className="p-6">
              {(isFCMSupported === false || (typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent))) && (<div className="mb-4 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm"><div className="flex items-start gap-3"><Info className="h-5 w-5 flex-shrink-0 mt-0.5" /><div><p className="font-semibold mb-1">Notifications non disponibles sur iOS</p><p>En raison de limitations d'Apple, les notifications push ne fonctionnent pas sur les appareils iOS (iPhone/iPad), quel que soit le navigateur. Utilisez un appareil Android ou un ordinateur pour activer les rappels.</p></div></div></div>)}
              {notificationError && (<div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">⚠️ Erreur : {notificationError}</div>)}
              {(permission === 'granted' || token) ? (<><div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">✅ Notifications activées avec succès !</div><p className="text-slate-600 text-center mb-6">Recevez un rappel automatiquement pour ne pas oublier la date !</p><button onClick={() => setShowNotificationModal(false)} className="w-full py-3 px-4 text-slate-500 font-medium rounded-xl transition-all hover:bg-slate-100">Quitter</button></>) : isFCMSupported !== false ? (<><p className="text-slate-600 text-center mb-6">Recevez un rappel automatiquement pour ne pas oublier la date !</p><div className="flex flex-col gap-3"><button onClick={async () => { await requestPermission({ inviteId, inviteDocPath }); }} disabled={isNotificationLoading || isFCMSupported === false} className="w-full py-3 px-4 text-white font-semibold rounded-xl shadow-lg transition-all active:scale-95" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>{isNotificationLoading ? 'Chargement...' : 'Autoriser les rappels'}</button><button onClick={() => { localStorage.setItem('furaha_notification_modal_dismissed', 'true'); setShowNotificationModal(false); }} className="w-full py-3 px-4 text-slate-500 font-medium rounded-xl transition-all hover:bg-slate-100">Plus tard</button></div></>) : (<button onClick={() => setShowNotificationModal(false)} className="w-full py-3 px-4 text-slate-500 font-medium rounded-xl transition-all hover:bg-slate-100">Fermer</button>)}
            </div>
          </div>
        </div>
      )}
      <style>{`
        .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes vibrate { 0% { transform: translate(0); } 20% { transform: translate(-2px, 2px); } 40% { transform: translate(-2px, -2px); } 60% { transform: translate(2px, 2px); } 80% { transform: translate(2px, -2px); } 100% { transform: translate(0); } }
        .animate-vibrate { animation: vibrate 0.3s linear infinite; animation-play-state: running; }
        .animate-vibrate:hover { animation-play-state: paused; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>
    </div>
  );
};

export default ClassicScrollLayout;