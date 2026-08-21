import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import ornement5 from '../images/ornement5.png';
import ornement6 from '../images/ornement6.png';
import plume from '../images/plume.png';
import furahaLogo from '../images/FURAHA-GOLD.png';

// Fallback images if local assets are missing
const pagneImage = 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop';
const photoCouple = 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop';
const motif1 = 'https://www.transparenttextures.com/patterns/cubes.png';
const motif2 = 'https://www.transparenttextures.com/patterns/pinstripe-light.png';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { 
  Heart, 
  Calendar, 
  MapPin, 
  Users, 
  Wine, 
  Camera, 
  MessageCircle, 
  QrCode, 
  Check, 
  Sparkles,
  ArrowLeft,
  Gift,
  GraduationCap,
  User,
  X,
  Eye,
  Download,
  BookOpen,
  Send,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Trash2,
  Clock,
  Feather,
  ChevronDown,
  Info,
  Palette,
  Volume2,
  VolumeX,
  Music as MusicIcon,
  Gamepad2,
  Trophy,
  HelpCircle,
  Star,
  RefreshCw,
  Hotel,
  Mail,
  Globe,
  Plane,
  Train,
  Car,
  CarTaxiFront
} from 'lucide-react';
import { UserModelService, InviteService, GameService, GameConfiguration, AVAILABLE_GAMES, GameResult } from '../services/templateService';
import { UserModel, Invite } from '../services/templateService';
import ToastModal from './ToastModal';
import { notificationService } from '../services/notificationService';
import { useNotifications } from '../hooks/useNotifications';
import { FocusRail, FocusRailItem } from './ui/focus-rail';
import { InteractiveTiltCard } from './ui/tilt-card';
import HolographicCard from './ui/holographic-card';
import { BorderRotate } from './ui/animated-gradient-border';
import { ShinyButton } from './ui/shiny-button';
import { TypewriterWithPen } from './ui/typewriter-pen';
import { CircularGallery, GalleryItem } from './ui/circular-gallery';
import ParallaxUnfurlingGallery, { ParallaxGalleryItem } from './ui/3d-parallax-unfurling-gallery';
import MemoryMatchGame from './MemoryMatchGame';
import LoveQuizGame from './LoveQuizGame';
import CatchLoveGame from './CatchLoveGame';

// Helper for image optimization
const optimizeImage = (url: string, width: number = 800, quality: number = 70) => {
  if (!url) return '';
  if (url.includes('cloudinary.com')) {
    // Replace /upload/ with /upload/w_{width},q_{quality},f_auto/
    return url.replace('/upload/', `/upload/w_${width},q_${quality},f_auto,c_limit/`);
  }
  return url;
};

// --- UTILITAIRES DÉPLACÉS EN HAUT POUR COMPATIBILITÉ SAFARI ---

const getIconForCategory = (category: string) => {
  switch (category) {
    case 'wedding': return Heart;
    case 'birthday': return Gift;
    case 'graduation': return GraduationCap;
    default: return Heart;
  }
};

const parseLatLngFromString = (s: string): { lat: number; lng: number } | null => {
  if (!s) return null;
  const m = s.match(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/);
  if (m) {
    const lat = parseFloat(m[1]);
    const lng = parseFloat(m[2]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
  }
  return null;
};

const segmentGraphemes = (str: string) => {
  if (!str) return [];
  try {
    // Vérification ultra-stricte pour Safari
    if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
      const seg = new (Intl as any).Segmenter(undefined, { granularity: 'grapheme' });
      return Array.from(seg.segment(str)).map((s: any) => s.segment);
    }
  } catch (e) {}
  return Array.from(str);
};

// --- COMPOSANTS DE SÉCURITÉ ---

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; errorMessage: string | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white rounded-3xl p-8 shadow-2xl border-2 border-rose-500">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Oups ! Une erreur est survenue</h2>
            <p className="text-slate-600 mb-6">L'affichage de l'invitation a rencontré un problème sur ce navigateur. Essayez d'actualiser ou d'utiliser un autre appareil.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors"
            >
              Actualiser la page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- COMPOSANT COMPTE À REBOURS OPTIMISÉ ---
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
              {/* Progress Circle Background */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="26"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="transparent"
                  className="text-white/5"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="26"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="transparent"
                  strokeDasharray="163.36"
                  strokeDashoffset={163.36 - (163.36 * percentage) / 100}
                  className="transition-all duration-1000 ease-linear"
                  style={{ color: colors.accent || colors.primary }}
                />
              </svg>
              {/* Value Text */}
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
        } else if (repeat) {
          setIsVisible(false);
        }
      });
    }, { threshold: 0.1 });
    
    if (domRef.current) observer.observe(domRef.current);
    return () => observer.disconnect();
  }, [repeat]);

  return (
    <div
      ref={domRef}
      className={`${className} transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
});

// --- COMPOSANTS DE JEUX ---

const CoupleQuizGame: React.FC<{
  game: any;
  colors: any;
  onComplete: (score: number, data: any) => void;
  guestName: string;
}> = ({ game, colors, onComplete, guestName }) => {
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
    
    // If we have correct answers defined, check and increment score
    if (currentQuestion.correctAnswerIndex !== undefined) {
      if (answer === currentQuestion.options[currentQuestion.correctAnswerIndex]) {
        setScore(s => s + 1);
      }
    } else {
      // If no correct answer, just increment
      setScore(s => s + 1);
    }

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

  if (isComplete) {
    return (
      <div className="text-center py-8">
        <Trophy className="w-16 h-16 mx-auto mb-4" style={{ color: colors.primary }} />
        <h3 className="text-2xl font-bold mb-2" style={{ color: colors.primary }}>Terminé !</h3>
        <p className="text-white/80 mb-4">Votre score : {score}/{questions.length}</p>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="text-white/60">Aucune question configurée</div>;
  }

  return (
    <div className="py-4">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-4">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${i <= currentQuestionIndex ? '' : 'bg-white/30'}`}
              style={{ backgroundColor: i <= currentQuestionIndex ? colors.primary : undefined }}
            />
          ))}
        </div>
        <h3 className="text-lg font-bold text-white mb-4">{currentQuestion.question}</h3>
      </div>
      <div className="space-y-3">
        {currentQuestion.options.map((option: string, i: number) => (
          <button
            key={i}
            onClick={() => !selectedAnswer && handleAnswer(option)}
            disabled={!!selectedAnswer}
            className={`w-full text-left py-4 px-6 rounded-2xl border-2 transition-all ${
              selectedAnswer === option
                ? 'bg-white text-slate-800 scale-105'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            style={{ borderColor: selectedAnswer === option ? colors.primary : 'rgba(255,255,255,0.2)' }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

const WishGeneratorGame: React.FC<{
  game: any;
  colors: any;
  onComplete: (score: number, data: any) => void;
  guestName: string;
}> = ({ game, colors, onComplete, guestName }) => {
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
    
    if (currentPromptIndex + 1 < prompts.length) {
      setCurrentPromptIndex(i => i + 1);
      setCurrentWish('');
    } else {
      setIsComplete(true);
      onComplete(newWishes.length, { wishes: newWishes });
    }
  };

  if (isComplete) {
    return (
      <div className="text-center py-8">
        <Heart className="w-16 h-16 mx-auto mb-4 fill-rose-500" style={{ color: colors.primary }} />
        <h3 className="text-2xl font-bold mb-2" style={{ color: colors.primary }}>Merci !</h3>
        <p className="text-white/80">Vos vœux ont été enregistrés</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="text-center mb-6">
        <p className="text-white/60 text-sm mb-2">Question {currentPromptIndex + 1}/{prompts.length}</p>
        <h3 className="text-xl font-bold text-white">{currentPrompt}</h3>
      </div>
      <textarea
        value={currentWish}
        onChange={(e) => setCurrentWish(e.target.value)}
        placeholder="Écrivez votre message..."
        className="w-full bg-white/10 text-white placeholder-white/40 border-2 border-white/20 rounded-2xl p-4 mb-4 min-h-[120px] focus:outline-none focus:border-amber-400"
      />
      <button
        onClick={handleSubmitWish}
        disabled={!currentWish.trim()}
        className="w-full py-4 rounded-2xl font-bold text-white transition-all disabled:opacity-50"
        style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})` }}
      >
        Envoyer
      </button>
    </div>
  );
};

const PhotoChallengeGame: React.FC<{
  game: any;
  colors: any;
  onComplete: (score: number, data: any) => void;
  guestName: string;
}> = ({ game, colors, onComplete, guestName }) => {
  const [completedChallenges, setCompletedChallenges] = useState<Set<number>>(new Set());

  const challenges = game.challenges || ['Prendre une photo avec les mariés'];

  const handleToggleChallenge = (index: number) => {
    const newCompleted = new Set(completedChallenges);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedChallenges(newCompleted);
    if (newCompleted.size === challenges.length) {
      onComplete(challenges.length, { completedChallenges: Array.from(newCompleted) });
    }
  };

  return (
    <div className="py-4">
      <div className="text-center mb-6">
        <Camera className="w-12 h-12 mx-auto mb-4" style={{ color: colors.primary }} />
        <h3 className="text-xl font-bold text-white mb-2">Défis Photo</h3>
        <p className="text-white/60 text-sm">Cochez les défis que vous avez relevés !</p>
      </div>
      <div className="space-y-3">
        {challenges.map((challenge: string, index: number) => (
          <button
            key={index}
            onClick={() => handleToggleChallenge(index)}
            className={`w-full text-left py-4 px-6 rounded-2xl border-2 transition-all flex items-center space-x-3 ${
              completedChallenges.has(index)
                ? 'bg-white/20'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            style={{ borderColor: completedChallenges.has(index) ? colors.primary : 'rgba(255,255,255,0.2)' }}
          >
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${completedChallenges.has(index) ? 'border-emerald-500' : 'border-white/30'}`}>
              {completedChallenges.has(index) && <Check className="w-4 h-4 text-emerald-500" />}
            </div>
            <span className={`font-medium ${completedChallenges.has(index) ? 'line-through opacity-70' : 'text-white'}`}>{challenge}</span>
          </button>
        ))}
      </div>
      <p className="text-center text-white/50 text-sm mt-4">{completedChallenges.size}/{challenges.length} défis complétés</p>
    </div>
  );
};

const LoveStoryTimelineGame: React.FC<{
  game: any;
  colors: any;
  onComplete: (score: number, data: any) => void;
  guestName: string;
}> = ({ game, colors, onComplete, guestName }) => {
  const [viewedAll, setViewedAll] = useState(false);

  const events = game.events || [];

  useEffect(() => {
    if (events.length > 0) {
      setTimeout(() => {
        setViewedAll(true);
        onComplete(events.length, { viewedAll: true });
      }, 2000);
    }
  }, [events.length, onComplete]);

  return (
    <div className="py-4">
      <div className="text-center mb-6">
        <Heart className="w-12 h-12 mx-auto mb-4 fill-rose-500" style={{ color: colors.primary }} />
        <h3 className="text-xl font-bold text-white mb-2">Notre Histoire</h3>
      </div>
      <div className="space-y-4">
        {events.map((event: any, index: number) => (
          <div key={index} className="relative pl-8 border-l-2 border-white/20 pb-4 last:pb-0">
            <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full" style={{ backgroundColor: colors.primary }} />
            <p className="text-white/50 text-xs mb-1">{event.date}</p>
            <h4 className="text-white font-bold">{event.title}</h4>
            <p className="text-white/70 text-sm">{event.description}</p>
          </div>
        ))}
      </div>
      {viewedAll && events.length > 0 && (
        <p className="text-center text-emerald-400 text-sm mt-4 flex items-center justify-center gap-2">
          <Check className="w-4 h-4" /> Vous avez lu toute l'histoire !
        </p>
      )}
    </div>
  );
};

const WeddingTriviaGame: React.FC<{
  game: any;
  colors: any;
  onComplete: (score: number, data: any) => void;
  guestName: string;
}> = ({ game, colors, onComplete, guestName }) => {
  // Similar to CoupleQuizGame, just reuse it with different props
  return <CoupleQuizGame game={game} colors={colors} onComplete={onComplete} guestName={guestName} />;
};

const GuestBookPromptGame: React.FC<{
  game: any;
  colors: any;
  onComplete: (score: number, data: any) => void;
  guestName: string;
}> = ({ game, colors, onComplete, guestName }) => {
  // Similar to WishGeneratorGame
  return <WishGeneratorGame game={game} colors={colors} onComplete={onComplete} guestName={guestName} />;
};

// --- FALLING DOTS COMPONENT ---
const FallingDots: React.FC<{ colors: { primary: string; secondary: string; accent?: string } }> = ({ colors }) => {
  const dotColors = [colors.primary, colors.secondary, colors.accent || '#ffffff'];
  
  return (
    <>
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(0);
            opacity: 0.8;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }
      `}</style>
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-1">
        {Array.from({ length: 40 }).map((_, i) => {
          const left = Math.random() * 100;
          const delay = Math.random() * 10;
          const duration = 5 + Math.random() * 10;
          const size = 4 + Math.random() * 8;
          const color = dotColors[Math.floor(Math.random() * dotColors.length)];
          
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${left}%`,
                top: '-20px',
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                animationName: 'fall',
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                animationFillMode: 'forwards',
                animationIterationCount: 'infinite',
                opacity: 0.8,
              }}
            ></div>
          );
        })}
      </div>
    </>
  );
};

// --- PHOTO VIEWER COMPONENT ---
const PhotoViewer: React.FC<{
  photos: string[];
  initialPhoto: string;
  onClose: () => void;
  optimizeImage: (url: string, w: number, q?: number) => string;
  themeColors: {
    primary: string;
    secondary: string;
    accent?: string;
  };
}> = ({ photos, initialPhoto, onClose, optimizeImage, themeColors }) => {
  const [loaded, setLoaded] = useState(false);
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const mountedRef = useRef(false);

  // Derive dynamic accent colors from theme
  const { primary, secondary } = themeColors;
  const accent = themeColors.accent || secondary;

  // Blend helpers using tiny HSL shifts to get variants without hardcoded colors
  const lighter = (hex: string, amt = 0.22) => {
    try {
      const c = hex.replace("#", "");
      const r = parseInt(c.substring(0, 2), 16);
      const g = parseInt(c.substring(2, 4), 16);
      const b = parseInt(c.substring(4, 6), 16);
      const nr = Math.min(255, Math.round(r + (255 - r) * amt));
      const ng = Math.min(255, Math.round(g + (255 - g) * amt));
      const nb = Math.min(255, Math.round(b + (255 - b) * amt));
      return `rgb(${nr}, ${ng}, ${nb})`;
    } catch {
      return hex;
    }
  };
  const darker = (hex: string, amt = 0.2) => {
    try {
      const c = hex.replace("#", "");
      const r = parseInt(c.substring(0, 2), 16);
      const g = parseInt(c.substring(2, 4), 16);
      const b = parseInt(c.substring(4, 6), 16);
      const nr = Math.max(0, Math.round(r * (1 - amt)));
      const ng = Math.max(0, Math.round(g * (1 - amt)));
      const nb = Math.max(0, Math.round(b * (1 - amt)));
      return `rgb(${nr}, ${ng}, ${nb})`;
    } catch {
      return hex;
    }
  };

  const glow1 = lighter(primary, 0.35);
  const glow2 = lighter(secondary, 0.35);
  const glow3 = accent ? lighter(accent, 0.45) : lighter(primary, 0.5);
  const shadowColor1 = darker(primary, 0.05);
  const shadowColor2 = darker(secondary, 0.08);

  // Preload image eagerly
  const finalSrc = useMemo(
    () => optimizeImage(initialPhoto, 1600, 85),
    [initialPhoto, optimizeImage]
  );

  // Close handler with smooth exit animation
  const handleClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    // Wait for the smooth exit transition before actually unmounting
    window.setTimeout(() => {
      if (mountedRef.current) onClose();
    }, 520);
  }, [closing, onClose]);

  useEffect(() => {
    mountedRef.current = true;
    // Kick off image prefetch immediately
    try {
      const img = new Image();
      img.src = finalSrc;
      img.onload = () => { if (mountedRef.current) setLoaded(true); };
      img.onerror = () => { if (mountedRef.current) setLoaded(true); };
    } catch {}
    // Smooth enter animation — spring-feel via multiple rAFs (slight delay to be gentle)
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
    });
    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(raf);
    };
  }, [finalSrc]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  // Prevent page scroll while viewer open
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

  // Compute enter/exit state
  const show = entered && !closing;
  const enterFactor = show ? 1 : 0;

  return (
    <div
      className={
        "fixed inset-0 z-[110] flex items-center justify-center will-change-[backdrop-filter,opacity,background-color] "
      }
      onClick={handleClose}
      style={{
        // Smooth opacity fade
        opacity: enterFactor,
        transition:
          "opacity 520ms cubic-bezier(0.22, 1, 0.36, 1), backdrop-filter 620ms cubic-bezier(0.22, 1, 0.36, 1), background-color 620ms cubic-bezier(0.22, 1, 0.36, 1), -webkit-backdrop-filter 620ms cubic-bezier(0.22, 1, 0.36, 1)",
        // Progressive backdrop blur (0 → very strong)
        backdropFilter: show
          ? `blur(30px) saturate(145%)`
          : `blur(0px) saturate(100%)`,
        WebkitBackdropFilter: show
          ? `blur(30px) saturate(145%)`
          : `blur(0px) saturate(100%)`,
        backgroundColor: show ? "rgba(0,0,0,0.74)" : "rgba(0,0,0,0)",
        // Radial halo tuned to theme primary/secondary
        backgroundImage: show
          ? `radial-gradient(ellipse at center, ${darker(primary, 0.82)} 0%, rgba(0,0,0,0.88) 100%)`
          : "none",
      }}
    >
      {/* Dynamic ambient glows — pulled directly from theme colors */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          opacity: 0.55 * enterFactor,
          transition: "opacity 600ms ease-out",
        }}
      >
        <div
          className="absolute -top-24 -left-20 w-[30rem] h-[30rem] rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${glow1} 0%, transparent 68%)` }}
        />
        <div
          className="absolute -bottom-28 -right-14 w-[34rem] h-[34rem] rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${glow2} 0%, transparent 68%)` }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-[28rem] h-[28rem] rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${glow3} 0%, transparent 72%)` }}
        />
      </div>

      {/* Close button — glassmorphism, soft zoom */}
      <button
        onClick={(e) => { e.stopPropagation(); handleClose(); }}
        className="absolute top-4 sm:top-6 right-4 sm:right-6 w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white z-[120] will-change-transform active:scale-95"
        style={{
          opacity: 0.2 + 0.8 * enterFactor,
          transform: `scale(${0.7 + 0.3 * enterFactor})`,
          transition:
            "transform 520ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms ease-out, background-color 200ms ease-out, box-shadow 200ms ease-out",
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: `1px solid ${lighter(primary, 0.5)}33`,
          boxShadow: `0 10px 30px -10px ${darker(primary, 0.3)}66, 0 8px 24px -12px rgba(0,0,0,0.55)`,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.18)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.1)"; }}
        aria-label="Fermer"
      >
        <X className="h-6 w-6 sm:h-7 sm:w-7" />
      </button>

      {/* Single photo container — smooth cubic-bezier zoom (scale 0.7 → 1) */}
      <div
        className="relative px-3 sm:px-6 md:px-10 py-4 sm:py-8 max-w-full max-h-full flex items-center justify-center z-[115] will-change-transform"
        style={{
          transform: `scale(${0.7 + 0.3 * enterFactor}) translateY(${(-18) * (1 - enterFactor)}px)`,
          opacity: 0.15 + 0.85 * enterFactor,
          transformOrigin: "center center",
          transition:
            "transform 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 520ms ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative frame with dynamic theme glow */}
        <div
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden"
          style={{
            boxShadow: show
              ? `0 45px 140px -20px ${shadowColor1}55, 0 30px 80px -18px ${shadowColor2}55, 0 25px 70px -12px rgba(0,0,0,0.85)`
              : "0 10px 30px -10px rgba(0,0,0,0.5)",
            border: `1px solid ${lighter(primary, 0.55)}22`,
            transition: "box-shadow 700ms cubic-bezier(0.22, 1, 0.36, 1), border-color 500ms ease-out",
          }}
        >
          {/* Loading shimmer — gentle, not jarring */}
          {!loaded && (
            <div
              className="absolute inset-0 rounded-2xl sm:rounded-3xl"
              style={{
                background: `linear-gradient(90deg, ${lighter(primary, 0.75)}10, ${lighter(secondary, 0.7)}22, ${lighter(primary, 0.75)}10)`,
                backgroundSize: "200% 100%",
                animation: "shimmerX 1.6s ease-in-out infinite",
                opacity: enterFactor,
                transition: "opacity 300ms ease-out",
              }}
            />
          )}

          <img
            src={finalSrc}
            alt="Agrandissement photo"
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
            className={
              "max-w-full w-auto h-auto object-contain select-none will-change-[opacity,transform] "
            }
            style={{
              maxHeight: "min(84vh, 900px)",
              // Extra smooth photo zoom-in to amplify the gentle feel
              transform: `scale(${0.96 + 0.04 * (loaded ? enterFactor : 0.2)})`,
              opacity: loaded ? (0.4 + 0.6 * enterFactor) : 0,
              filter: `saturate(${0.92 + 0.08 * enterFactor}) contrast(${0.96 + 0.04 * enterFactor})`,
              transition:
                "opacity 480ms ease-out, transform 820ms cubic-bezier(0.22, 1, 0.36, 1), filter 620ms ease-out",
            }}
            draggable={false}
            loading="eager"
            decoding="async"
          />

          {/* Subtle premium inner vignette */}
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl sm:rounded-3xl"
            style={{
              boxShadow: `inset 0 0 140px ${darker(primary, 0.8)}33, inset 0 0 60px rgba(0,0,0,0.3)`,
              opacity: enterFactor,
              transition: "opacity 520ms ease-out",
            }}
          />
        </div>
      </div>

      {/* Inline keyframes for shimmer */}
      <style>{`
        @keyframes shimmerX {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

// --- COMPOSANT PRINCIPAL ---

const InvitationPreview: React.FC<{ embedded?: boolean; embeddedModel?: UserModel | null }> = (props) => {
  return (
    <ErrorBoundary>
      <InvitationPreviewContent {...props} />
    </ErrorBoundary>
  );
};

// --- HELPERS DE CACHE LOCALSTORAGE (URGENCE DÉGRADÉ FIREBASE) ---
const INVITE_CACHE_PREFIX = 'furaha_invite_cache_v1_';
const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 jours de cache (mariages urgents)

interface InviteCacheEntry {
  invite: Invite;
  userModel: UserModel;
  savedAt: number;
}

const getCachedInviteData = (inviteId: string): InviteCacheEntry | null => {
  try {
    const raw = localStorage.getItem(INVITE_CACHE_PREFIX + inviteId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as InviteCacheEntry;
    if (!parsed?.savedAt) return null;
    const age = Date.now() - parsed.savedAt;
    if (age > CACHE_MAX_AGE_MS) return null;
    return parsed;
  } catch (e) {
    console.warn('[Cache] Erreur lecture cache:', e);
    return null;
  }
};

const setCachedInviteData = (inviteId: string, invite: Invite, userModel: UserModel) => {
  try {
    const entry: InviteCacheEntry = { invite, userModel, savedAt: Date.now() };
    localStorage.setItem(INVITE_CACHE_PREFIX + inviteId, JSON.stringify(entry));
  } catch (e) {
    console.warn('[Cache] Erreur écriture cache:', e);
  }
};
// ------------------------------------------------------------------

const InvitationPreviewContent: React.FC<{ embedded?: boolean; embeddedModel?: UserModel | null }> = ({ embedded = false, embeddedModel = null }) => {
  const { inviteId } = useParams<{ inviteId: string }>();
  const navigate = useNavigate();
  const [inviteDocPath, setInviteDocPath] = useState<string | null>(null);
  const { token, permission, requestPermission, isLoading: isNotificationLoading, error, isFCMSupported } = useNotifications();
  const [userModel, setUserModel] = useState<UserModel | null>(embedded ? embeddedModel : null);
  const [dataError, setDataError] = useState<string | null>(null);
  // États d'urgence : mode dégradé + réessa automatique
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (embedded && embeddedModel) {
      setUserModel(embeddedModel);
    }
  }, [embedded, embeddedModel]);

  const [invite, setInvite] = useState<Invite | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [typedText, setTypedText] = useState('');
  const [hasTypedOnce, setHasTypedOnce] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState<string[]>([]);
  const [guestMessage, setGuestMessage] = useState('');
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [showGuestBook, setShowGuestBook] = useState(false);
  const [guestBookMessages, setGuestBookMessages] = useState<any[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ isOpen: boolean; message: any | null }>({ isOpen: false, message: null });
  const [showToastModal, setShowToastModal] = useState<{ isOpen: boolean; type: 'drink' | 'confirmation' | 'cancellation'; drink?: string }>({
    isOpen: false,
    type: 'drink'
  });
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState<string | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  // Etats pour la page d'administration
  const [isAdminView, setIsAdminView] = useState(false);
  const [adminEditingId, setAdminEditingId] = useState<string | null>(null);
  const [adminFilterConfirmed, setAdminFilterConfirmed] = useState(false);

  // Etats pour les jeux
  const [showGames, setShowGames] = useState(false);
  const [completedGames, setCompletedGames] = useState<Set<string>>(new Set());
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [games, setGames] = useState<GameConfiguration[]>([]);
  const [gameResults, setGameResults] = useState<Record<string, GameResult[]>>({}); // key: gameId, value: results array
  const [isLoadingGames, setIsLoadingGames] = useState(false);

  const invitationTextRef = useRef<HTMLParagraphElement | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  // Refs synchronisées pour maj cache dans callbacks de subscription (URGENCE FIREBASE)
  const userModelRef = useRef<UserModel | null>(embedded ? embeddedModel : null);
  const inviteRef = useRef<Invite | null>(null);
  useEffect(() => { userModelRef.current = userModel; }, [userModel]);
  useEffect(() => { inviteRef.current = invite; }, [invite]);
  
  // Refs pour les sections de navigation
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [currentSection, setCurrentSection] = useState<string>('countdown');
  
  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  
  // Sécurité anti-crash - Déclarer safeUserModel et safeInvite D'ABORD pour éviter l'erreur de variable non initialisée
   const safeUserModel = userModel || {
     invitationTitleSubtitle: '',
     title: 'Invitation',
     backgroundImage: photoCouple,
     category: 'wedding',
     eventLocation: 'Lieu à définir',
     eventAddress: '',
     eventDate: '01.01.2026',
     drinkOptions: [],
     colors: { primary: '#f59e0b', secondary: '#d946ef', accent: '#fbbf24' },
     eventPhotos: [],
     invitationTextPhoto: '',
     invitationTextPhotoTitle: ''
   };

   const safeInvite = invite || { 
     nom: (userModel as any)?.guestData?.name || 'Invité', 
     table: (userModel as any)?.guestData?.tableNumber || 'Non assigné', 
     confirmed: false, 
     etat: 'simple' 
   };

  // Liste des sections pour la navigation (après safeUserModel pour condition accommodation)
  const accommodationVisible =
    ((safeUserModel as any).accommodationEnabled && Array.isArray((safeUserModel as any).accommodations) && (safeUserModel as any).accommodations.length > 0) ||
    ((safeUserModel as any).usefulAddressesEnabled && Array.isArray((safeUserModel as any).usefulAddresses) && (safeUserModel as any).usefulAddresses.length > 0);

  const sections = [
    { id: 'header', label: 'Accueil' },
    { id: 'mainContent', label: 'Invitation' },
    { id: 'countdown', label: 'Compte à rebours' },
    ...(accommodationVisible ? [{ id: 'accommodation', label: 'Hébergements' }] : []),
    { id: 'gallery', label: 'Galerie' },
    { id: 'rsvp', label: 'RSVP' },
    { id: 'drinks', label: 'Boissons' },
    ...(games && games.filter(g => g.isEnabled).length > 0 ? [{ id: 'games', label: 'Jeux' }] : []),
    { id: 'qr', label: 'QR Code' }
  ];

  useEffect(() => {
    if (embedded) {
      setIsLoading(false);
      return;
    }
    if (!inviteId) {
      setDataError("Identifiant d'invitation manquant.");
      setIsLoading(false);
      return;
    }

    // 1) CHARGEMENT OPTIMISTE depuis le cache LOCAL (même avant Firebase) — sauve les invités déjà venus
    const cached = getCachedInviteData(inviteId);
    if (cached) {
      setInvite(cached.invite);
      setUserModel(cached.userModel);
      setInviteDocPath(cached.invite.userId ? `users/${cached.invite.userId}/invites/${cached.invite.id}` : null);
      setIsConfirmed(!!cached.invite.confirmed);
      setSelectedDrink((cached.invite as any).selectedDrink ? (cached.invite as any).selectedDrink.split(', ') : []);
      setIsLoading(false); // On affiche tout de suite depuis le cache
      setIsOfflineMode(true);
    }

    let unsubInvite: (() => void) | null = null;
    let unsubUserModel: (() => void) | null = null;
    let isSubscribing = true;
    let retryTimer: ReturnType<typeof setInterval> | null = null;

    const init = async () => {
      try {
        const inviteData = await InviteService.getInviteGlobal(inviteId);
        if (!isSubscribing) return;
        
        if (inviteData) {
          setInvite(inviteData);
          setInviteDocPath(`users/${inviteData.userId}/invites/${inviteData.id}`);
          setIsConfirmed(inviteData.confirmed);
          setSelectedDrink((inviteData as any).selectedDrink ? (inviteData as any).selectedDrink.split(', ') : []);
          
          // Subscribe to invite updates
          unsubInvite = InviteService.subscribeInvite(inviteData.userId, inviteData.id, (updatedInvite) => {
            if (updatedInvite) {
              setInvite(updatedInvite);
              setIsConfirmed(updatedInvite.confirmed);
              setSelectedDrink((updatedInvite as any).selectedDrink ? (updatedInvite as any).selectedDrink.split(', ') : []);
              // Mise à jour du cache à chaque modification live
              const currentUM = userModelRef.current;
              if (currentUM) setCachedInviteData(inviteId, updatedInvite, currentUM);
            }
          });

          // Get user models and subscribe to the first one
          const models = await UserModelService.getUserModels(inviteData.userId);
          if (models.length > 0) {
            setUserModel(models[0]);
            // =================================================
            // 💾 SAUVEGARDE DANS LE CACHE (clé : inviteId)
            // =================================================
            setCachedInviteData(inviteId, inviteData, models[0]);
            // On sort du mode offline si on a réussi
            setIsOfflineMode(false);
            setRetryCountdown(null);
            // Preload initial images
            const initialImagesToPreload = [
              models[0].backgroundImage,
              models[0].headerSectionBackground,
              models[0].textSectionBackground,
              models[0].dateLocationSectionBackground,
              models[0].gallerySectionBackground,
              models[0].rsvpDrinksSectionBackground,
              models[0].gamesSectionBackground,
              models[0].qrFooterSectionBackground,
              models[0].accommodationSectionBackground,
              ...(models[0].eventPhotos || []),
            ].filter(Boolean) as string[];
            initialImagesToPreload.forEach((imgUrl) => {
              const img = new Image();
              img.src = imgUrl;
            });

            unsubUserModel = UserModelService.subscribeUserModel(inviteData.userId, models[0].id, (updatedModel) => {
              if (updatedModel) {
                setUserModel(updatedModel);
                // Mise à jour cache sur modif live du modèle
                const currentInv = inviteRef.current;
                if (currentInv) setCachedInviteData(inviteId, currentInv, updatedModel);
                const imagesToPreload = [
                  updatedModel.backgroundImage,
                  updatedModel.headerSectionBackground,
                  updatedModel.textSectionBackground,
                  updatedModel.dateLocationSectionBackground,
                  updatedModel.gallerySectionBackground,
                  updatedModel.rsvpDrinksSectionBackground,
                  updatedModel.gamesSectionBackground,
                  updatedModel.qrFooterSectionBackground,
                  updatedModel.accommodationSectionBackground,
                  ...(updatedModel.eventPhotos || []),
                ].filter(Boolean) as string[];
                imagesToPreload.forEach((imgUrl) => {
                  const img = new Image();
                  img.src = imgUrl;
                });
              }
            });
          } else {
            // Si on a du cache on ne montre pas d'erreur, on continue en offline
            if (!getCachedInviteData(inviteId)) {
              setDataError("Aucun design d'invitation trouvé pour cet événement.");
            }
          }
        } else {
          if (!getCachedInviteData(inviteId)) {
            setDataError("Invitation introuvable. Veuillez vérifier le lien.");
          }
        }
      } catch (e) {
        console.error(e);
        // ==== CHUTE DE SECOURS CRITIQUE : Cache offline ====
        const existingCache = getCachedInviteData(inviteId);
        if (existingCache) {
          // On AFFICHE depuis le cache — AUCUNE erreur affichée à l'invité
          setInvite(existingCache.invite);
          setUserModel(existingCache.userModel);
          setInviteDocPath(existingCache.invite.userId ? `users/${existingCache.invite.userId}/invites/${existingCache.invite.id}` : null);
          setIsConfirmed(!!existingCache.invite.confirmed);
          setSelectedDrink((existingCache.invite as any).selectedDrink ? (existingCache.invite as any).selectedDrink.split(', ') : []);
          setIsOfflineMode(true);
          setDataError(null);
          // Compte à rebours de réessai automatique toutes les 30s
          setRetryCountdown(30);
        } else {
          setDataError("Erreur de chargement. Veuillez actualiser la page.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Lancer le compte à rebours de réessa automatique si on est en offline
    if (isOfflineMode && !retryTimer) {
      retryTimer = setInterval(() => {
        setRetryCountdown(prev => {
          if (prev === null) return null;
          if (prev <= 1) {
            // Relance init() pour retenter Firebase
            init();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }

    init();

    return () => {
      isSubscribing = false;
      unsubInvite?.();
      unsubUserModel?.();
      if (retryTimer) clearInterval(retryTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteId, embedded]);

  // Auto-expand love quiz when games modal opens
  useEffect(() => {
    if (showGames) {
      const loveQuizGame = games.find(g => g.type === 'love-quiz' && g.isEnabled);
      if (loveQuizGame && !completedGames.has(loveQuizGame.id)) {
        setCurrentGameId(loveQuizGame.id);
      }
    }
  }, [showGames, games, completedGames]);

  // Load games for the user model AND all game results
  useEffect(() => {
    const defaultImageUrl = 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800';
    const processGames = (games: any[]) => {
      return games.filter((g: GameConfiguration) => g.type !== 'puzzle');
    };

    const loadGames = async () => {
      if (!invite?.userId || !userModel?.id) {
        if ((safeUserModel as any).games) {
          setGames(processGames((safeUserModel as any).games));
        }
        return;
      }

      setIsLoadingGames(true);
      try {
        const loadedGames = await GameService.getModelGames(invite.userId, userModel.id);
        setGames(loadedGames);

        // Now load results for all memory match and love quiz games
        const resultsMap: Record<string, GameResult[]> = {};
        const completedSet = new Set<string>();

        for (const game of loadedGames) {
          if (game.type === 'memory-match' || game.type === 'love-quiz' || game.type === 'catch-love') {
            try {
              const results = await GameService.getPuzzleResults(invite.userId, userModel.id, game.id);
              resultsMap[game.id] = results;
              // Check if current guest has a result FOR THIS EXACT GAME INSTANCE
              // results are already scoped to this gameId by getPuzzleResults; still enforce game.type match
              if (results.some(res => res.guestName === invite?.nom && res.gameType === game.type)) {
                completedSet.add(game.id);
              }
            } catch (err) {
              console.error(`Error loading results for game ${game.id}:`, err);
              resultsMap[game.id] = [];
            }
          }
        }

        setGameResults(resultsMap);
        setCompletedGames(completedSet);
      } catch (e) {
        console.error("Error loading games:", e);
        if ((safeUserModel as any).games) {
          setGames(processGames((safeUserModel as any).games));
        }
      } finally {
        setIsLoadingGames(false);
      }
    };

    loadGames();
  }, [invite?.userId, userModel?.id, safeUserModel, invite?.nom]);

  // Load game results (leaderboard) when current game changes (only if not already loaded)
  useEffect(() => {
    if (!currentGameId || !invite?.userId || !userModel?.id) return;

    const game = games.find(g => g.id === currentGameId);
    if (game && (game.type === 'memory-match' || game.type === 'love-quiz' || game.type === 'catch-love') && !gameResults[currentGameId]) {
      const loadResults = async () => {
        try {
          const results = await GameService.getPuzzleResults(invite.userId, userModel.id, currentGameId);
          setGameResults(prev => ({ ...prev, [currentGameId]: results }));
          // If current guest has a result of this game type, mark game as completed
          const hasPlayed = results.some(res => res.guestName === invite?.nom && res.gameType === game.type);
          if (hasPlayed) {
            setCompletedGames(prev => new Set([...prev, game.id]));
          }
        } catch (e) {
          console.error("Error loading game results:", e);
        }
      };
      loadResults();
    }
  }, [currentGameId, games, invite?.userId, userModel?.id, gameResults]);

  // Track active section with Intersection Observer
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    
    sections.forEach(section => {
      const element = sectionRefs.current[section.id];
      if (!element) return;
      
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setCurrentSection(section.id);
          }
        },
        { threshold: 0.5 } // Trigger when 50% of section is visible
      );
      
      observer.observe(element);
      observers.push(observer);
    });
    
    return () => observers.forEach(observer => observer.disconnect());
  }, [sections]);



   // Pre-calculate optimized URLs to avoid repetitive string manipulation during render
   const optimizedBg = useMemo(() => optimizeImage(safeUserModel.backgroundImage, 1200, 80), [safeUserModel.backgroundImage]);
   const optimizedPattern = useMemo(() => safeUserModel.patternBackgroundImage ? optimizeImage(safeUserModel.patternBackgroundImage, 400, 40) : null, [safeUserModel.patternBackgroundImage]);
   
   // Optimized section backgrounds
   const optimizedHeaderSectionBg = useMemo(() => safeUserModel.headerSectionBackground ? optimizeImage(safeUserModel.headerSectionBackground, 1200, 80) : null, [safeUserModel.headerSectionBackground]);
   const optimizedTextSectionBg = useMemo(() => safeUserModel.textSectionBackground ? optimizeImage(safeUserModel.textSectionBackground, 1200, 80) : null, [safeUserModel.textSectionBackground]);
   const optimizedDateLocationSectionBg = useMemo(() => safeUserModel.dateLocationSectionBackground ? optimizeImage(safeUserModel.dateLocationSectionBackground, 1200, 80) : null, [safeUserModel.dateLocationSectionBackground]);
   const optimizedGallerySectionBg = useMemo(() => safeUserModel.gallerySectionBackground ? optimizeImage(safeUserModel.gallerySectionBackground, 1200, 80) : null, [safeUserModel.gallerySectionBackground]);
   const optimizedRsvpDrinksSectionBg = useMemo(() => safeUserModel.rsvpDrinksSectionBackground ? optimizeImage(safeUserModel.rsvpDrinksSectionBackground, 1200, 80) : null, [safeUserModel.rsvpDrinksSectionBackground]);
   const optimizedGamesSectionBg = useMemo(() => safeUserModel.gamesSectionBackground ? optimizeImage(safeUserModel.gamesSectionBackground, 1200, 80) : null, [safeUserModel.gamesSectionBackground]);
   const optimizedQrFooterSectionBg = useMemo(() => safeUserModel.qrFooterSectionBackground ? optimizeImage(safeUserModel.qrFooterSectionBackground, 1200, 80) : null, [safeUserModel.qrFooterSectionBackground]);
   const optimizedAccommodationSectionBg = useMemo(() => (safeUserModel as any).accommodationSectionBackground ? optimizeImage((safeUserModel as any).accommodationSectionBackground, 1200, 80) : null, [(safeUserModel as any).accommodationSectionBackground]);
   
   const customizations = (safeUserModel as any).customizations || {};
   const colors = customizations.colors || safeUserModel.colors || { primary: '#f59e0b', secondary: '#d946ef', accent: '#fbbf24' };
   
   const galleryPhotos = useMemo(() => {
     const photos = [];
     if (Array.isArray(safeUserModel.eventPhotos)) photos.push(...safeUserModel.eventPhotos);
     return photos.length > 0 ? photos : [photoCouple];
   }, [safeUserModel]);

   const galleryItems = useMemo<GalleryItem[]>(() => {
     const romanticTitles = [
       "Un Amour Infini",
       "Moments Précieux",
       "Promesse Éternelle",
       "Battements de Cœur",
       "Regard Complice",
       "Main dans la Main",
       "Notre Histoire",
       "Pour Toujours",
       "Coeur à Coeur",
       "Le Chemin de l'Amour"
     ];
     
     const romanticSubtitles = [
       "Chaque jour à tes côtés est une nouvelle aventure.",
       "Deux cœurs qui battent à l'unisson pour l'éternité.",
       "Le début de notre plus belle histoire d'amour.",
       "Ton sourire est ma plus belle destination.",
       "Gravé dans nos mémoires pour toujours.",
       "L'amour est le seul voyage qui ne finit jamais.",
       "Nos plus beaux moments partagés.",
       "Un regard, un sourire, une éternité.",
       "L'amour en action, chaque jour.",
       "Notre futur, écrit ensemble."
     ];

     return galleryPhotos.map((photo, index) => ({
       common: romanticTitles[index % romanticTitles.length],
       binomial: romanticSubtitles[index % romanticSubtitles.length],
       photo: {
         url: optimizeImage(photo, 800, 70),
         text: `Photo ${index + 1}`,
         by: String(index) // Store index as string for easy retrieval
       }
     }));
   }, [galleryPhotos]);

   const parallaxGalleryItems = useMemo<ParallaxGalleryItem[]>(() => {
     return galleryPhotos.map((photo, index) => ({
       src: optimizeImage(photo, 900, 78),
       alt: `Moment précieux ${index + 1}`,
     }));
   }, [galleryPhotos]);

  // Souscription aux messages du livre d'or
  useEffect(() => {
    const userId = invite?.userId || (userModel as any)?.userId;
    if (userId) {
      const unsub = InviteService.subscribeAllGuestMessages(userId, async (messages) => {
        const sortedMessages = [...messages].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const withReplies = await Promise.all(
          sortedMessages.map(async (msg: any) => {
            try {
              const [legacy, modern] = await Promise.all([
                InviteService.getLegacyMessageReplies(userId, msg.inviteId, msg.id).catch(() => []),
                InviteService.getMessageReplies(userId, msg.inviteId, msg.id).catch(() => [])
              ]);
              const seen = new Set<string>();
              const combined: any[] = [];
              [...legacy, ...modern].forEach((r: any) => {
                if (!r || !r.id) return;
                if (seen.has(r.id)) return;
                seen.add(r.id);
                combined.push(r);
              });
              combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
              return { ...msg, replies: combined };
            } catch (e) {
              return { ...msg, replies: [] };
            }
          })
        );

        setGuestBookMessages(withReplies);
      });
      return () => unsub();
    }
  }, [invite?.userId, userModel]);

  // Scroll to bottom when guest book opens or messages change
  useEffect(() => {
    if (showGuestBook) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [showGuestBook, guestBookMessages]);

  // Logic for background music on ANY user interaction
  useEffect(() => {
    const tryPlayMusic = () => {
      if (!isMusicPlaying && safeUserModel.backgroundMusic && audioRef.current) {
        audioRef.current.play().then(() => {
          setIsMusicPlaying(true);
        }).catch(err => {
          console.log("Autoplay blocked, waiting for more interaction", err);
        });
      }
    };

    // Try playing on mount (though autoplay is often blocked)
    tryPlayMusic();
    
    const handleAnyInteraction = () => tryPlayMusic();

    // Add many interaction listeners to catch ANY user input
    window.addEventListener('scroll', handleAnyInteraction, { passive: true });
    window.addEventListener('click', handleAnyInteraction, { passive: true });
    window.addEventListener('touchstart', handleAnyInteraction, { passive: true });
    window.addEventListener('touchmove', handleAnyInteraction, { passive: true });
    window.addEventListener('touchend', handleAnyInteraction, { passive: true });
    window.addEventListener('pointerdown', handleAnyInteraction, { passive: true });
    window.addEventListener('pointerup', handleAnyInteraction, { passive: true });
    window.addEventListener('mousedown', handleAnyInteraction, { passive: true });
    window.addEventListener('mouseup', handleAnyInteraction, { passive: true });
    window.addEventListener('keydown', handleAnyInteraction, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleAnyInteraction);
      window.removeEventListener('click', handleAnyInteraction);
      window.removeEventListener('touchstart', handleAnyInteraction);
      window.removeEventListener('touchmove', handleAnyInteraction);
      window.removeEventListener('touchend', handleAnyInteraction);
      window.removeEventListener('pointerdown', handleAnyInteraction);
      window.removeEventListener('pointerup', handleAnyInteraction);
      window.removeEventListener('mousedown', handleAnyInteraction);
      window.removeEventListener('mouseup', handleAnyInteraction);
      window.removeEventListener('keydown', handleAnyInteraction);
    };
  }, [isMusicPlaying, safeUserModel.backgroundMusic]);

  // Afficher le modal de notifications après 10s si pas déjà autorisé ou vu
  useEffect(() => {
    console.log('=== DEBUG NOTIFICATION MODAL ===');
    console.log('inviteDocPath:', inviteDocPath);
    console.log('permission:', permission);
    console.log('token:', token);
    console.log('isLoading:', isLoading);
    console.log('isAdminView:', isAdminView);

    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (inviteDocPath && !isLoading && !isAdminView && isSecure) {
      // Vérifier si notifications sont déjà autorisées (soit via permission, soit via localStorage)
      const savedPermission = localStorage.getItem('furaha_notification_permission');
      const savedToken = localStorage.getItem('furaha_notification_token');
      const isAlreadyGranted = permission === 'granted' || savedPermission === 'granted' || !!savedToken;
      
      if (isAlreadyGranted) {
        // Sauvegarder dans localStorage pour persister si ce n'est pas déjà fait
        if (permission === 'granted') {
          localStorage.setItem('furaha_notification_permission', 'granted');
        }
        return;
      }
      
      // Vérifier si l'utilisateur a déjà fermé le modal
      const hasDismissedModal = localStorage.getItem('furaha_notification_modal_dismissed');
      
      if (!hasDismissedModal) {
        console.log('→ Setting timer to show notification modal in 10s');
        const timer = setTimeout(() => {
          setShowNotificationModal(true);
        }, 10000);
        return () => clearTimeout(timer);
      }
    } else {
      console.log('→ Conditions not met to show modal');
    }
  }, [inviteDocPath, permission, token, isLoading, isAdminView]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      audioRef.current.play();
      setIsMusicPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMusicMuted;
    setIsMusicMuted(!isMusicMuted);
  };

  // Génération du QR Code
  useEffect(() => {
    if (inviteId || embedded) {
      const qrData = `Nom: ${safeInvite.nom}\nTable: ${safeInvite.table}\nBoisson: ${selectedDrink || 'Non choisie'}`;
      QRCode.toDataURL(qrData, { width: 256, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error(err));
    }
  }, [inviteId, embedded, safeInvite.nom, safeInvite.table, selectedDrink]);

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `QR-Invitation-${safeInvite.nom.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Animation de texte sécurisée pour Safari
  useEffect(() => {
    const el = invitationTextRef.current;
    if (!el || !userModel || hasTypedOnce) return;
    const full = String(userModel.invitationText || '');
    
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        let i = 0;
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        typingTimerRef.current = window.setInterval(() => {
          const chars = segmentGraphemes(full);
          if (i < chars.length) {
            setTypedText(prev => prev + chars[i]);
            i++;
          } else {
            clearInterval(typingTimerRef.current!);
            setHasTypedOnce(true);
          }
        }, 30);
      }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [userModel, hasTypedOnce]);

  const handleConfirmation = async () => {
    if (!inviteId || !invite) return;
    const newStatus = !isConfirmed;
    
    // UI Optimiste : On change l'état et on ouvre le modal immédiatement
    setIsConfirmed(newStatus);
    setShowToastModal({
      isOpen: true,
      type: newStatus ? 'confirmation' : 'cancellation'
    });

    try {
      await InviteService.updateInvite(invite.userId, inviteId, { confirmed: newStatus });
    } catch (e) {
      console.error(e);
      // En cas d'erreur, on revient en arrière et on ferme le modal
      setIsConfirmed(!newStatus);
      setShowToastModal({ isOpen: false, type: 'confirmation' });
      
      const notification = document.createElement('div');
      notification.className = 'fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-rose-500 text-white px-6 py-3 rounded-full shadow-2xl font-bold';
      notification.innerText = 'Erreur lors de la confirmation. Veuillez réessayer.';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    }
  };

  const handleDrinkSelection = (drink: string) => {
    if (!inviteId || !invite) return;

    let newSelectedDrinks: string[];
    if (selectedDrink.includes(drink)) {
      newSelectedDrinks = selectedDrink.filter(d => d !== drink);
    } else if (selectedDrink.length < 2) {
      newSelectedDrinks = [...selectedDrink, drink];
    } else {
      newSelectedDrinks = [selectedDrink[1], drink];
    }
    
    setSelectedDrink(newSelectedDrinks);
    setShowToastModal({
      isOpen: true,
      type: 'drink',
      drink: newSelectedDrinks.join(', ')
    });

    try {
      InviteService.updateInviteResponse(invite.userId, inviteId, { selectedDrink: newSelectedDrinks.join(', ') });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async () => {
    if (!inviteId || !invite || !guestMessage.trim()) return;
    setIsSubmittingMessage(true);
    try {
      await InviteService.createGuestMessage(invite.userId, inviteId, guestMessage);
      setGuestMessage('');
      // Notification personnalisée sans alerte ni modal de boisson
      const notification = document.createElement('div');
      notification.className = 'fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl font-bold animate-bounce';
      notification.innerText = 'Message envoyé !';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  const handleEditMessage = (msg: any) => {
    if (msg.inviteId !== inviteId) return;
    setEditingMessageId(msg.id);
    setEditingText(msg.message);
  };

  const handleSaveEdit = async (msg: any) => {
    if (!inviteId || !invite || !editingText.trim() || msg.inviteId !== inviteId) return;
    setIsSubmittingMessage(true);
    try {
      await InviteService.updateGuestMessage(invite.userId, inviteId, msg.id, editingText);
      setEditingMessageId(null);
      setEditingText('');
      // Notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-blue-500 text-white px-6 py-3 rounded-full shadow-2xl font-bold animate-bounce';
      notification.innerText = 'Message modifié !';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  const handleDeleteMessage = async (msg: any) => {
    if (!inviteId || !invite || msg.inviteId !== inviteId) return;
    setShowDeleteConfirm({ isOpen: true, message: msg });
  };

  const confirmDelete = async () => {
    const msg = showDeleteConfirm.message;
    if (!inviteId || !invite || !msg) return;
    setIsSubmittingMessage(true);
    try {
      await InviteService.deleteGuestMessage(invite.userId, inviteId, msg.id);
      // Notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl font-bold animate-bounce';
      notification.innerText = 'Message supprimé !';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingMessage(false);
      setShowDeleteConfirm({ isOpen: false, message: null });
    }
  };

  // --- LOGIQUE DE PARSING DE DATE ROBUSTE ---
  const parsedDate = useMemo(() => {
    if (!safeUserModel.eventDate) return { day: '00', month: '00', year: '00', fullDate: new Date() };
    
    const cleanDate = safeUserModel.eventDate.trim();
    
    // Préparer l'heure au format HH:mm (remplacer 'h' par ':')
    const timeStr = (safeUserModel.eventTime || '00:00').replace('h', ':').padStart(5, '0');

    // 1. Essayer le format "7 janvier 2026" (Français long)
    const frenchMonths: { [key: string]: string } = {
      'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04', 'mai': '05', 'juin': '06',
      'juillet': '07', 'août': '08', 'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
    };
    
    const longParts = cleanDate.toLowerCase().split(' ');
    if (longParts.length === 3) {
      const d = longParts[0].replace(/\D/g, '').padStart(2, '0');
      const m = frenchMonths[longParts[1]];
      const y = longParts[2];
      if (m && d && !isNaN(parseInt(y))) {
        const isoStr = `${y}-${m}-${d}T${timeStr}:00`;
        const fDate = new Date(isoStr);
        return {
          day: d,
          month: m,
          year: y.slice(-2),
          fullDate: isNaN(fDate.getTime()) ? new Date() : fDate
        };
      }
    }

    // 2. Essayer les formats avec séparateurs (JJ/MM/AAAA, JJ.MM.AAAA, AAAA-MM-JJ)
    const parts = cleanDate.split(/[./-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) { // AAAA-MM-JJ
        const isoStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}T${timeStr}:00`;
        const fDate = new Date(isoStr);
        return {
          day: parts[2].padStart(2, '0'),
          month: parts[1].padStart(2, '0'),
          year: parts[0].slice(-2),
          fullDate: isNaN(fDate.getTime()) ? new Date() : fDate
        };
      } else { // JJ/MM/AAAA
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        const isoStr = `${y}-${m}-${d}T${timeStr}:00`;
        const fDate = new Date(isoStr);
        return {
          day: d,
          month: m,
          year: y.slice(-2),
          fullDate: isNaN(fDate.getTime()) ? new Date() : fDate
        };
      }
    }
    
    return { day: '00', month: '00', year: '00', fullDate: new Date() };
  }, [safeUserModel.eventDate, safeUserModel.eventTime]);

  const { day: eventDay, month: eventMonth, year: eventYear, fullDate: targetEventDate } = parsedDate;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-slate-800 relative overflow-hidden">
        {/* Soft Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: `${colors.primary}10`, animation: 'float 8s ease-in-out infinite' }}></div>
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background: `${colors.secondary || colors.accent}10`, animation: 'float 8s ease-in-out infinite 2s' }}></div>
        </div>

        {/* Loading Content */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          {/* Logo with Pulse */}
          <img 
            src={furahaLogo} 
            alt="Furaha Logo" 
            className="w-48 h-auto mb-8 opacity-0 animate-fadeIn"
            style={{ animationDelay: '0.2s' }}
          />
          
          {/* Loading Dots */}
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className="w-3 h-3 rounded-full opacity-0"
                style={{ 
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary || colors.accent})`,
                  animation: `pulse 1.4s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`
                }}
              ></div>
            ))}
          </div>
          
          {/* Loading Text */}
          <p className="font-poppins text-sm text-slate-500 mt-4 opacity-0 animate-fadeIn" style={{ animationDelay: '0.8s' }}>Chargement de votre invitation...</p>
        </div>

        {/* Custom CSS for Animations */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) scale(1); opacity: 0.4; }
            50% { transform: translateY(-40px) scale(1.1); opacity: 0.7; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0; transform: scale(0.6); }
            50% { opacity: 1; transform: scale(1); }
          }
          .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
        `}</style>
      </div>
    );
  }

  if (dataError) {
    // Aucun cache dispo : on affiche une erreur RASSURANTE avec retry auto
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fafafa 0%, #fff7ed 50%, #fdf4ff 100%)' }}>
        {/* Background ambiance douce */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-30" style={{ background: '#f59e0b' }}></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-20" style={{ background: '#d946ef' }}></div>
        </div>

        <div className="relative z-10 max-w-md bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/60">
          {/* Logo Furaha en haut pour la confiance */}
          <img 
            src={furahaLogo} 
            alt="Furaha Digital" 
            className="w-32 h-auto mx-auto mb-6 opacity-90"
          />
          {/* Loader élégant */}
          <div className="flex items-center justify-center gap-2 mb-5">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className="w-3 h-3 rounded-full"
                style={{ 
                  background: 'linear-gradient(135deg, #f59e0b, #d946ef)',
                  animation: 'pulse 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`
                }}
              ></div>
            ))}
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Mise à jour en cours…</h2>
          <p className="text-sm text-slate-500 mb-1 font-medium">
            {dataError}
          </p>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Nos équipes sont sur le pont. Merci de votre confiance — la page va tenter de se reconnecter automatiquement.
          </p>
          {/* Bouton retry manuel */}
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-3 text-white rounded-xl font-bold hover:opacity-90 transition-all active:scale-95 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d946ef)' }}
          >
            Recharger l'invitation maintenant
          </button>
          <style>{`
            @keyframes pulse { 0%, 100% { opacity: 0.2; transform: scale(0.6); } 50% { opacity: 1; transform: scale(1); } }
          `}</style>
        </div>
      </div>
    );
  }

  // Si l'utilisateur utilise une invitation riche (HTML personnalisé)
  if ((safeUserModel as any).useRichInvitation && (safeUserModel as any).richInvitationHTML) {
    return (
      <div 
        className="rich-invitation-container"
        dangerouslySetInnerHTML={{ __html: (safeUserModel as any).richInvitationHTML }}
      />
    );
  }

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
      {/* === BANNIÈRE DISCRÈTE MODE HORS-LIGNE (URGENCE FIREBASE) === */}
      {isOfflineMode && (
        <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none px-3 pt-2">
          <div 
            className="backdrop-blur-xl rounded-full px-4 py-1.5 shadow-lg border border-white/10 flex items-center gap-2 pointer-events-auto"
            style={{ background: 'rgba(251, 191, 36, 0.18)' }}
          >
            <RefreshCw 
              className="h-3 w-3 text-amber-200" 
              style={{ animation: retryCountdown !== null ? 'spin 1.5s linear infinite' : 'none' }} 
            />
            <span className="text-[10px] font-semibold text-amber-100 tracking-wide uppercase whitespace-nowrap">
              {retryCountdown !== null 
                ? `Reconnexion automatique dans ${retryCountdown}s…` 
                : 'Connexion en cours de rétablissement…'}
            </span>
          </div>
        </div>
      )}

      <style>{`
        ::-webkit-scrollbar {
          display: none;
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      {/* Background Overlay to darken and blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-none z-0"></div>

      {/* Background Music Audio Element */}
      {safeUserModel.backgroundMusic && (
        <audio 
          ref={audioRef} 
          src={safeUserModel.backgroundMusic} 
          loop 
          preload="auto"
        />
      )}

      {/* HEADER + MAIN CONTENT COMBINED */}
      <div 
        ref={(el) => sectionRefs.current.header = el}
        className="relative w-full overflow-hidden flex flex-col items-center justify-start snap-start"
      >
        <div className="relative w-full h-[92vh] z-0">
          <InteractiveTiltCard 
            image={{ src: optimizedHeaderSectionBg || optimizedBg, alt: "Background" }}
            tiltFactor={15}
            hoverScale={1.05}
            perspective={1000}
            borderRadius={0}
            glareIntensity={0.5}
            glareSize={100}
            className="w-full h-full"
          />
          <FallingDots colors={colors} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none z-[5]"></div>
        </div>

        {/* Date, Guest Name and Table Card Area - Placed to overlap the bottom of the photo */}
        <div className="relative z-10 w-full px-0 flex flex-col items-center -mt-16 mb-6">
          {/* Flowers / Ornaments from Dashboard - Placed at the very edges of the PAGE */}
          {(safeUserModel.guestInfoLeftImage || ornement5) && (
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
              <img 
                src={optimizeImage(safeUserModel.guestInfoLeftImage || ornement5, 400, 70)} 
                className="h-48 md:h-72 w-auto object-contain object-left" 
                alt="" 
                loading="lazy"
              />
            </div>
          )}
          {(safeUserModel.guestInfoRightImage || ornement5) && (
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
              <img 
                src={optimizeImage(safeUserModel.guestInfoRightImage || ornement5, 400, 70)} 
                className="h-48 md:h-72 w-auto object-contain object-right scale-x-[-1]" 
                alt="" 
                loading="lazy"
              />
            </div>
          )}

          <div className="relative w-full flex justify-center px-4">
            {/* Guest Info Block - Back to its original design */}
            <div 
              className="w-full bg-black/60 backdrop-blur-xl rounded-[30px] p-4 border-2 flex flex-col items-center shadow-[0_0_30px_rgba(0,0,0,0.5)] relative group z-20 mx-auto max-w-[90%]"
              style={{ borderColor: `${colors.primary}cc` }}
            >
              <div className="flex items-center space-x-4 w-full px-2">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white/20 shadow-lg flex-shrink-0"
                  style={{ background: `linear-gradient(to br, ${colors.primary}, ${colors.secondary})` }}
                >
                  {safeInvite.nom.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-white tracking-tight truncate leading-tight">
                    {safeInvite.nom}
                  </h2>
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

        {/* Text Section Background */}
        {optimizedTextSectionBg && (
          <div className="absolute left-0 right-0 top-[calc(92vh-4rem)] bottom-0 z-0 transition-all duration-700 ease-in-out">
            <img 
              src={optimizedTextSectionBg} 
              alt="Background" 
              className="w-full h-full object-cover transition-transform duration-700 ease-in-out" 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"></div>
          </div>
        )}
        {/* MAIN CONTENT (now inside the same motion div) */}
        <div 
          ref={(el) => sectionRefs.current.mainContent = el}
          className="relative z-10 flex justify-center mt-12 px-4 w-full"
        >
        <div className="bg-white rounded-t-[120px] rounded-b-none w-full max-w-lg p-8 text-center shadow-[0_10px_40px_rgba(0,0,0,0.1)] relative">
          {/* Decorative paper background (notebook lines + discreet hearts) - clipped to card rounded corners */}
          <div aria-hidden className="absolute inset-0 pointer-events-none z-0 rounded-t-[120px] overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(to bottom, transparent 0 27px, rgba(236,72,153,0.07) 27px 28px)',
              }}
            />
            <div className="absolute inset-0 select-none">
              {[
                { l: '6%',  t: '18%', s: 14, o: 0.07, c: '#ec4899' },
                { l: '90%', t: '22%', s: 12, o: 0.08, c: '#d946ef' },
                { l: '10%', t: '36%', s: 18, o: 0.06, c: '#ec4899' },
                { l: '82%', t: '42%', s: 11, o: 0.09, c: '#f472b6' },
                { l: '18%', t: '56%', s: 13, o: 0.07, c: '#d946ef' },
                { l: '72%', t: '62%', s: 16, o: 0.06, c: '#ec4899' },
                { l: '6%',  t: '78%', s: 12, o: 0.08, c: '#f472b6' },
                { l: '88%', t: '84%', s: 15, o: 0.07, c: '#d946ef' },
                { l: '46%', t: '28%', s: 10, o: 0.06, c: '#ec4899' },
                { l: '52%', t: '72%', s: 11, o: 0.07, c: '#f472b6' },
              ].map((h, i) => (
                <svg
                  key={`ph-${i}`}
                  width={h.s}
                  height={h.s}
                  viewBox="0 0 24 24"
                  fill={h.c}
                  style={{
                    position: 'absolute',
                    left: h.l,
                    top: h.t,
                    opacity: h.o,
                    transform: `rotate(${(i * 13) % 30 - 15}deg)`,
                  }}
                >
                  <path d="M12 21s-7-4.35-9.5-8.5C.9 10.2 2.4 6 6.2 6c2 0 3.4 1.1 4.3 2.6.9-1.5 2.3-2.6 4.3-2.6 3.8 0 5.3 4.2 3.7 6.5C19 16.65 12 21 12 21z" />
                </svg>
              ))}
            </div>
          </div>
          <div className="space-y-6 relative z-10">

            {/* Circular Couple Photo - FROZEN (no Reveal entrance, rotating circular border restored) */}
            <div className="relative inline-block mb-4">
              <div
                className="absolute inset-0 rounded-full blur-2xl"
                style={{ background: `linear-gradient(to br, ${colors.primary}33, ${colors.secondary}33)` }}
              />
              <BorderRotate
                borderRadius={100}
                borderWidth={3}
                animationSpeed={3}
                gradientColors={{
                  primary: colors.primary,
                  secondary: colors.secondary,
                  accent: colors.accent || '#ffffff'
                }}
                backgroundColor="#ffffff"
                className="relative z-10 -mt-24 p-[2px]"
              >
                <img
                  src={optimizeImage(safeUserModel.invitationPhoto || photoCouple, 400, 70)}
                  className="w-48 h-48 rounded-full object-cover shadow-2xl"
                  alt="Couple"
                  loading="lazy"
                />
              </BorderRotate>
            </div>

            <RevealOnScroll className="relative">

              {/* Subtitle above title */}
              {safeUserModel.invitationTitleSubtitle && (
                <p
                  className="text-lg font-normal font-bold mb-2"
                  style={{ color: colors.primary }}
                >
                  {safeUserModel.invitationTitleSubtitle}
                </p>
              )}
              {/* Title Style as requested */}
              <h1
                className="text-3xl font-luxury font-medium leading-tight mb-4"
                style={{ color: colors.secondary }}
              >
                {safeUserModel.title}
              </h1>

              {/* Ornement supérieur */}
              <div className="flex justify-center mb-6">
                <img src={ornement5} className="h-12 opacity-80" alt="" />
              </div>

              {/* Reduced text size and handled BBCode/HTML with Typewriter effect */}
              <div className="flex flex-col items-center justify-center w-full">
                <TypewriterWithPen 
                  className="text-sm md:text-base text-slate-700 leading-snug font-poppins px-4 max-w-md"
                  penImage={plume}
                  speed={48}
                  htmlContent={(safeUserModel.invitationText || '')
                    .replace(/\[b\]/g, '<strong>').replace(/\[\/b\]/g, '</strong>')
                    .replace(/\[color=(.*?)\]/g, `<span style="color: $1">`).replace(/\[\/color\]/g, '</span>')}
                />

                {/* Photo dans la zone de texte (après le texte) */}
                {safeUserModel.invitationTextPhoto && (
                  <div className="mt-4">
                    {safeUserModel.invitationTextPhotoTitle && (
                      <h3 
                        className="text-lg font-poppins font-bold mb-1"
                        style={{ 
                          color: '#000000', 
                          textDecoration: 'underline', 
                          textDecorationColor: '#000000' 
                        }}
                      >
                        {safeUserModel.invitationTextPhotoTitle}
                      </h3>
                    )}
                    {safeUserModel.invitationTextPhotoSubtitle && (
                      <p 
                        className="text-xs font-poppins text-slate-700 mb-2"
                      >
                        {safeUserModel.invitationTextPhotoSubtitle}
                      </p>
                    )}
                    <img
                      src={optimizeImage(safeUserModel.invitationTextPhoto, 400, 70)}
                      alt="Motif"
                      className="max-w-[200px] max-h-[200px] object-contain mx-auto"
                      loading="lazy"
                    />
                  </div>
                )}
                
                {/* Ornement inférieur après le texte */}
                <div className="mt-8 flex justify-center">
                  <img src={ornement6} className="h-12 opacity-80" alt="" />
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
        </div>
      </div>

      {/* UNIFIED COUNTDOWN & MAPS CONTAINER - Redesigned 3D Card Style */}
      <div 
        ref={(el) => sectionRefs.current.countdown = el}
        className="relative z-10 w-full mt-4 px-0 min-h-screen flex items-center justify-center snap-start overflow-hidden"
      >
        {/* Section Background */}
            {optimizedDateLocationSectionBg && (
              <div className="absolute inset-0 z-0 transition-all duration-700 ease-in-out">
                <img 
                  src={optimizedDateLocationSectionBg} 
                  alt="Background" 
                  className="w-full h-full object-cover transition-transform duration-700 ease-in-out" 
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"></div>
              </div>
            )}
        {/* Falling Dots */}
        <FallingDots colors={colors} />
        {/* Main 3D Card Container - removed heavy hover tilt */}
        <div className="w-full max-w-lg px-4">
          <div 
            className="w-full bg-black/50 backdrop-blur-2xl border-2 p-4 shadow-[0_0_80px_rgba(0,0,0,0.6),inset_0_0_60px_rgba(0,0,0,0.4)] flex flex-col items-center rounded-[30px] relative overflow-hidden"
            style={{ 
              borderColor: `${colors.primary}80`,
              background: `linear-gradient(145deg, rgba(0,0,0,0.6), rgba(0,0,0,0.3))`
            }}
          >
            {/* Decorative Glow Background */}
            <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: colors.primary, opacity: 0.15 }}></div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: colors.secondary, opacity: 0.15 }}></div>

            <div className="w-full space-y-4 relative z-10">
              
              {/* Countdown Circles - removed heavy scale animation */}
              <div className="space-y-2">
                <h2 
                  className="text-center font-luxury tracking-[0.8em] text-xs uppercase"
                  style={{ color: colors.primary }}
                >
                  ✨ J- ✨
                </h2>
                
                <CountdownTimer targetDate={targetEventDate} colors={colors} />
              </div>

              {/* 3 Photos with JJ, MM, AA - removed rotate, scale entry animations */}
              <div className="grid grid-cols-3 gap-2 w-full">
                {[
                  { img: safeUserModel.eventPhoto1 || photoCouple, val: eventDay },
                  { img: safeUserModel.eventPhoto2 || photoCouple, val: eventMonth },
                  { img: safeUserModel.eventPhoto3 || photoCouple, val: eventYear }
                ].map((item, i) => (
                  <div 
                    key={i} 
                    className="relative aspect-[3/4] overflow-hidden shadow-2xl border-2 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] group"
                    style={{
                      borderColor: `${colors.primary}60`
                    }}
                  >
                    {/* Shine on hover */}
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-10"></div>
                    <img 
                      src={optimizeImage(item.img, 400, 70)} 
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" 
                      alt="" 
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span 
                        className="text-4xl md:text-5xl font-luxury text-white drop-shadow-[0_6px_12px_rgba(0,0,0,0.9)] transition-all duration-300 group-hover:scale-125 group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                      >
                        {item.val}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* MAPS & LOCATION - removed heavy spring/rotate/scale animations */}
              <div className="space-y-2 pt-0">
                <div className="flex flex-col items-center space-y-2">
                  {/* Enhanced Floating Location Icon */}
                  <div 
                    className="relative group cursor-pointer mx-auto"
                    onClick={() => {
                      const query = safeUserModel.eventAddress || safeUserModel.eventLocation;
                      const url = /iPhone|iPad|iPod/.test(navigator.userAgent) 
                        ? `maps://?q=${encodeURIComponent(query)}`
                        : `https://www.google.com/maps?q=${encodeURIComponent(query)}`;
                      window.open(url, '_blank');
                    }}
                  >
                    {/* Premium Location Pin - removed spring whileHover, keep subtle */}
                    <motion.div 
                      whileTap={{ scale: 0.95 }}
                      className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border-3 shadow-[0_0_60px_rgba(255,255,255,0.5)] relative animate-bounce rounded-full transition-all duration-300 mx-auto"
                      style={{ 
                        borderColor: colors.accent || colors.primary,
                        boxShadow: `0 0 40px ${colors.accent || colors.primary}60`
                      }}
                    >
                      <div className="absolute inset-1.5 rounded-full bg-gradient-to-br" style={{ background: `linear-gradient(145deg, ${colors.accent || colors.primary}, ${colors.secondary})` }}></div>
                      <MapPin className="h-5 w-5 relative z-10 text-white drop-shadow-lg" />
                    </motion.div>
                    {/* CTA text below pin */}
                    <div className="mt-2 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.accent || colors.primary }}>
                        Ouvrir dans Maps
                      </p>
                    </div>
                  </div>
                  
                  {/* Enhanced "Lieu de réception" card - removed entry animation */}
                  <div 
                    className="cursor-pointer group w-full"
                    onClick={() => {
                      const query = safeUserModel.eventAddress || safeUserModel.eventLocation;
                      const url = /iPhone|iPad|iPod/.test(navigator.userAgent) 
                        ? `maps://?q=${encodeURIComponent(query)}`
                        : `https://www.google.com/maps?q=${encodeURIComponent(query)}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <div className="relative overflow-hidden text-center p-3 w-full rounded-[20px] border-2 transition-all duration-400 group-hover:scale-[1.02] shadow-[0_0_50px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_80px_rgba(255,255,255,0.2)]"
                         style={{ 
                           borderColor: `${colors.primary}40`,
                           background: `linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))`
                         }}>
                       {/* Animated Shine effect */}
                       <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1500 pointer-events-none z-10"></div>
                       <h3 className="text-sm font-bold tracking-tight uppercase mb-1" style={{ color: colors.primary }}>
                         📍 Lieu de réception
                       </h3>
                       <p className="text-base text-white font-semibold mb-0.5 drop-shadow-lg">{safeUserModel.eventLocation}</p>
                       {safeUserModel.eventAddress && (
                         <p className="text-xs text-white/80 font-medium mb-2 leading-tight">{safeUserModel.eventAddress}</p>
                       )}
                       <div className="inline-flex items-center justify-center space-x-1.5 mb-1" style={{ color: colors.primary }}>
                         <Clock className="h-4 w-4" />
                         <p className="font-bold text-sm drop-shadow-lg" style={{ color: colors.primary }}>{safeUserModel.eventTime || '18h30'}</p>
                       </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== SECTION HÉBERGEMENTS & ADRESSES UTILES ===== */}
      {((safeUserModel as any).accommodationEnabled && Array.isArray((safeUserModel as any).accommodations) && (safeUserModel as any).accommodations.length > 0) ||
       ((safeUserModel as any).usefulAddressesEnabled && Array.isArray((safeUserModel as any).usefulAddresses) && (safeUserModel as any).usefulAddresses.length > 0) ? (
      <div
        ref={(el) => { sectionRefs.current.accommodation = el; }}
        className="relative z-10 w-full mt-0 px-0 snap-start overflow-hidden min-h-[100dvh] sm:min-h-[auto] flex items-center"
      >
        {optimizedAccommodationSectionBg && (
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20 mix-blend-overlay transition-all duration-700">
            <img
              src={optimizedAccommodationSectionBg}
              alt="Background"
              className="w-full h-full object-cover transition-transform duration-700"
            />
          </div>
        )}
        <div className="w-full max-w-lg mx-auto px-4 py-10 sm:py-14 relative z-10">
          {/* Titre Section */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-6 sm:mb-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-[10px] sm:text-xs tracking-[0.25em] uppercase font-semibold text-white/70 mb-2 sm:mb-3">
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: colors.primary }} />
              Pratique
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: colors.secondary }} />
            </div>
            <h2
              className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight mb-1 sm:mb-2 bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, #ffffff 0%, ${colors.primary} 50%, #ffffff 100%)`,
              }}
            >
              Où dormir ?
            </h2>
            <p className="text-white/50 text-[11px] sm:text-sm font-medium max-w-md mx-auto leading-relaxed">
              Quelques adresses recommandées à proximité de la salle
            </p>
          </motion.div>

          {/* Liste Hébergements */}
          {((safeUserModel as any).accommodationEnabled && Array.isArray((safeUserModel as any).accommodations) && (safeUserModel as any).accommodations.length > 0) && (
            <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
              {[...(safeUserModel as any).accommodations]
                .sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                .filter((a: any) => a.name && a.address)
                .map((acc: any, idx: number) => (
                <motion.div
                  key={acc.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: Math.min(idx * 0.08, 0.5) }}
                >
                  <div
                    className="relative w-full bg-black/45 backdrop-blur-2xl border-2 shadow-xl rounded-[20px] p-2.5 sm:p-4 overflow-hidden group transition-all duration-300 hover:scale-[1.01]"
                    style={{
                      borderColor: `${colors.primary}50`,
                      background: `linear-gradient(145deg, rgba(0,0,0,0.55), rgba(0,0,0,0.25))`
                    }}
                  >
                    {/* Glow */}
                    <div className="absolute -top-10 -left-10 w-28 h-28 rounded-full blur-2xl pointer-events-none" style={{ backgroundColor: colors.primary, opacity: 0.12 }}></div>
                    <div className="absolute -bottom-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none" style={{ backgroundColor: colors.secondary, opacity: 0.12 }}></div>

                    <div className="relative z-10 space-y-2 sm:space-y-3">
                      {/* Header : Nom + Badge + Prix */}
                      <div className="flex items-start gap-2 sm:gap-2.5">
                        <div
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow"
                          style={{ background: `linear-gradient(145deg, ${colors.primary}, ${colors.secondary})` }}
                        >
                          <Hotel className="h-4 w-4 sm:h-5 sm:w-5 text-white drop-shadow" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <h3 className="font-bold text-sm sm:text-base text-white truncate drop-shadow">{acc.name}</h3>
                            {acc.badge && (
                              <span
                                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black tracking-wide uppercase flex-shrink-0"
                                style={{
                                  backgroundColor: `${colors.primary}30`,
                                  color: colors.accent || colors.primary,
                                  border: `1px solid ${colors.primary}50`
                                }}
                              >
                                {acc.badge}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] sm:text-sm text-white/80 mt-0.5">
                            <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" style={{ color: colors.primary }} />
                            <span className="truncate">{acc.address}</span>
                          </div>
                          {acc.priceHint && (
                            <div className="text-[11px] font-bold mt-0.5" style={{ color: colors.accent || colors.primary }}>
                              {acc.priceHint}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Boutons Actions */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 pt-0.5">
                        {/* Maps */}
                        <button
                          type="button"
                          onClick={() => {
                            const url = /iPhone|iPad|iPod/.test(navigator.userAgent)
                              ? `maps://?q=${encodeURIComponent(acc.address)}`
                              : `https://www.google.com/maps?q=${encodeURIComponent(acc.address)}`;
                            window.open(url, '_blank');
                          }}
                          className="flex items-center justify-center gap-1 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-semibold transition-all active:scale-95 text-white border"
                          style={{
                            backgroundColor: `${colors.primary}25`,
                            borderColor: `${colors.primary}50`
                          }}
                        >
                          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span>Maps</span>
                        </button>

                        {/* Email réservation */}
                        {acc.email ? (
                          <a
                            href={`mailto:${acc.email}?subject=${encodeURIComponent(`Réservation - Mariage ${safeUserModel.title?.replace?.(/Mariage (de|d')?\s*/i, '') || ''}`)}&body=${encodeURIComponent(
`Bonjour,

Je souhaiterais réserver une chambre pour le mariage.

Cordialement,`
                            )}`}
                            className="flex items-center justify-center gap-1 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-semibold transition-all active:scale-95 text-white border"
                            style={{
                              backgroundColor: `${colors.secondary}30`,
                              borderColor: `${colors.secondary}60`
                            }}
                          >
                            <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>Réserver</span>
                          </a>
                        ) : (
                          <div className="flex items-center justify-center gap-1 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-semibold text-white/40 bg-white/5 border border-white/10">
                            <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>—</span>
                          </div>
                        )}

                        {/* Site web */}
                        {acc.websiteUrl ? (
                          <a
                            href={acc.websiteUrl && !/^https?:\/\//i.test(acc.websiteUrl) ? `https://${acc.websiteUrl.replace(/^\/+/, '')}` : acc.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-semibold transition-all active:scale-95 text-white border"
                            style={{
                              backgroundColor: `${colors.accent || colors.primary}25`,
                              borderColor: `${colors.accent || colors.primary}50`
                            }}
                          >
                            <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>Site web</span>
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Liste Adresses Utiles */}
          {((safeUserModel as any).usefulAddressesEnabled && Array.isArray((safeUserModel as any).usefulAddresses) && (safeUserModel as any).usefulAddresses.length > 0) && (
            <div className="space-y-3 sm:space-y-4">
              <div className="text-center mb-3 sm:mb-4">
                <h3 className="text-sm sm:text-base font-bold tracking-[0.15em] uppercase text-white/70">
                  ✦ Autres adresses utiles ✦
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {[...(safeUserModel as any).usefulAddresses]
                  .sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                  .filter((a: any) => a.name)
                  .map((ua: any, idx: number) => {
                    const IconMap: Record<string, any> = {
                      plane: Plane,
                      train: Train,
                      car: Car,
                      taxi: CarTaxiFront,
                      info: Info
                    };
                    const IconComp = IconMap[ua.icon || 'info'] || Info;
                    return (
                      <motion.div
                        key={ua.id}
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: Math.min(idx * 0.06, 0.4) }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (!ua.address) return;
                            const url = /iPhone|iPad|iPod/.test(navigator.userAgent)
                              ? `maps://?q=${encodeURIComponent(ua.address + ' ' + ua.name)}`
                              : `https://www.google.com/maps?q=${encodeURIComponent(ua.address + ' ' + ua.name)}`;
                            window.open(url, '_blank');
                          }}
                          className="w-full text-left p-3 sm:p-4 rounded-2xl bg-black/40 backdrop-blur-xl border transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                          style={{ borderColor: `${colors.primary}30` }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow"
                              style={{
                                background: `linear-gradient(145deg, ${colors.primary}90, ${colors.secondary}90)`
                              }}
                            >
                              <IconComp className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm text-white truncate">{ua.name}</h4>
                              {ua.address && <p className="text-[11px] text-white/70 truncate mt-0.5">{ua.address}</p>}
                              {ua.details && <p className="text-[10px] font-semibold mt-0.5" style={{ color: colors.accent || colors.primary }}>{ua.details}</p>}
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
      ) : null}

      {/* Galerie 3D Parallax */}
      <div
        ref={(el) => (sectionRefs.current.gallery = el)}
        className="relative z-10 w-full mt-0 px-0 snap-start overflow-hidden min-h-[100dvh] sm:min-h-[auto]"
      >
        {/* Section Background (si l'utilisateur en a uploadé un, on l'affiche en overlay teinté) */}
        {optimizedGallerySectionBg && (
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20 mix-blend-overlay transition-all duration-700">
            <img
              src={optimizedGallerySectionBg}
              alt="Background"
              className="w-full h-full object-cover transition-transform duration-700"
            />
          </div>
        )}

        {/* Titre en-tête */}
        <div className="relative z-40 flex flex-col items-center justify-center pt-8 sm:pt-12 md:pt-14 pb-4 sm:pb-5 md:pb-6 px-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-[10px] sm:text-xs tracking-[0.25em] uppercase font-semibold text-white/70 mb-2 sm:mb-3">
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: colors.primary }} />
              Gallery
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: colors.primary }} />
            </div>
            <h2
              className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight mb-1 sm:mb-2 bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, #ffffff 0%, ${colors.primary} 50%, #ffffff 100%)`,
              }}
            >
              Nos Moments Précieux
            </h2>
            <p className="text-white/50 text-[11px] sm:text-sm font-medium max-w-md mx-auto leading-relaxed">
              C'est à tes côtés que je veux construire ma vie
            </p>
          </motion.div>
        </div>

        {/* Parallax Gallery Component (taille normale) */}
        <div className="relative z-10">
          <ParallaxUnfurlingGallery
            items={parallaxGalleryItems}
            className="w-full"
            onImageClick={(_item, index) => {
              const safeIndex =
                !isNaN(index) && index >= 0 && index < galleryPhotos.length ? index : 0;
              setSelectedGalleryPhoto(galleryPhotos[safeIndex]);
            }}
          />
        </div>
      </div>

        {/* COMBINED RSVP + DRINKS */}
        <div 
            ref={(el) => sectionRefs.current.rsvp = el}
            className="min-h-screen flex flex-col items-center justify-start pt-16 pb-12 snap-start space-y-12 relative overflow-hidden w-full mt-12"
          >
            {/* Section Background */}
            {optimizedRsvpDrinksSectionBg && (
              <div className="absolute inset-0 z-0 transition-all duration-700 ease-in-out">
                <img 
                  src={optimizedRsvpDrinksSectionBg} 
                  alt="Background" 
                  className="w-full h-full object-cover transition-transform duration-700 ease-in-out" 
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"></div>
              </div>
            )}
            {/* Falling Dots */}
            <FallingDots colors={colors} />
          <div className="relative z-10 w-full max-w-lg px-4">
          <RevealOnScroll className="space-y-4 flex flex-col items-center mb-8">
          <ShinyButton 
            onClick={handleConfirmation}
            primaryColor={colors.primary}
            secondaryColor={colors.secondary}
          >
            <div className="flex items-center gap-3">
              {isConfirmed ? (
                <Check className="w-6 h-6 flex-shrink-0 text-emerald-400" />
              ) : (
                <Users className="w-6 h-6 flex-shrink-0" />
              )}
              <span className="text-white text-base md:text-lg font-bold tracking-wider whitespace-nowrap">
                {isConfirmed ? 'PRÉSENCE CONFIRMÉE' : 'CONFIRMER MA PRÉSENCE'}
              </span>
            </div>
          </ShinyButton>
          </RevealOnScroll>

        {/* Drink Selection */}
        <div 
          ref={(el) => sectionRefs.current.drinks = el}
        >
        <div className="w-full">
        <BorderRotate
          borderRadius={40}
          borderWidth={2}
          animationSpeed={5}
          gradientColors={{
            primary: colors.primary,
            secondary: colors.secondary,
            accent: colors.accent || '#ffffff'
          }}
          backgroundColor="transparent"
          className="w-full"
        >
          <div 
            className="w-full rounded-[40px] p-8 text-white shadow-2xl h-full"
            style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.secondary})` }}
          >
            <div className="flex flex-col items-center text-center space-y-4 mb-6">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <Wine className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Choix de boisson</h3>
                <p className="text-xs text-white/70 mt-2">
                  Sélectionnez jusqu'à 2 boissons (pour les couples)
                </p>
                <p className="text-[10px] text-white/50 mt-1">
                  {selectedDrink.length}/2 boisson{selectedDrink.length > 1 ? 's' : ''} sélectionnée{selectedDrink.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {safeUserModel.drinkOptions.map((drink) => (
                <button
                  key={drink}
                  onClick={() => handleDrinkSelection(drink)}
                  className={`flex items-center space-x-1.5 px-2 py-2.5 rounded-xl transition-all duration-200 text-left group h-full ${
                    selectedDrink.includes(drink)
                      ? 'bg-white shadow-lg ring-2 ring-white scale-[1.02]'
                      : 'bg-white text-slate-800 hover:bg-white/90 active:scale-95'
                  }`}
                  style={{ color: selectedDrink.includes(drink) ? colors.primary : undefined }}
                >
                  <Wine 
                    className="h-3.5 w-3.5 flex-shrink-0" 
                    style={{ color: selectedDrink.includes(drink) ? colors.primary : '#94a3b8' }} 
                  />
                  <span className="text-[10px] font-bold leading-tight break-words uppercase">{drink}</span>
                </button>
              ))}
            </div>
          </div>
        </BorderRotate>
        </div>
        </div>
        </div>
        </div>

        {/* JEUX INTERACTIFS (AMÉLIORÉS) */}
        {games && games.filter((g: GameConfiguration) => g.isEnabled).length > 0 && (
          <div 
            ref={(el) => sectionRefs.current.games = el}
            className="min-h-screen flex items-center justify-center py-12 snap-start relative overflow-hidden"
          >
            {/* Section Background */}
            {optimizedGamesSectionBg && (
              <div className="absolute inset-0 z-0 transition-all duration-700 ease-in-out">
                <img 
                  src={optimizedGamesSectionBg} 
                  alt="Background" 
                  className="w-full h-full object-cover transition-transform duration-700 ease-in-out" 
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"></div>
              </div>
            )}
            <FallingDots colors={colors} />
            <div className="relative z-10 w-full max-w-lg px-4">
            <div className="relative w-full">
            <div
              className="relative w-full"
              style={{
                perspective: "1200px",
                transformStyle: "preserve-3d",
              }}
            >
              <BorderRotate
                borderRadius={36}
                borderWidth={3}
                animationSpeed={2.5}
                gradientColors={{
                  primary: colors.primary,
                  secondary: colors.secondary,
                  accent: colors.accent || '#ffffff'
                }}
                backgroundColor="transparent"
                className="w-full"
              >
                <div
                  className="w-full rounded-[36px] relative overflow-hidden"
                  style={{
                    transformStyle: "preserve-3d",
                    background: `linear-gradient(160deg, ${colors.primary}ff 0%, ${colors.secondary}f5 50%, ${colors.primary}ee 100%)`,
                    boxShadow: `
                      0 40px 80px -20px rgba(0,0,0,0.5),
                      0 25px 50px -12px rgba(0,0,0,0.4),
                      inset 0 2px 0 rgba(255,255,255,0.35),
                      inset 0 -2px 0 rgba(255,255,255,0.08)
                    `
                  }}
                >
                  {/* 3D layered depth shadows */}
                  <div className="absolute -bottom-3 left-2 right-2 h-6 rounded-[30px] opacity-40 blur-sm" style={{ background: colors.secondary, transform: "translateZ(-20px)" }}></div>
                  <div className="absolute -bottom-6 left-4 right-4 h-6 rounded-[28px] opacity-25 blur-md" style={{ background: colors.primary, transform: "translateZ(-40px)" }}></div>

                  {/* Light overlay — brightens entire card */}
                  <div
                    className="absolute inset-0 pointer-events-none z-[5]"
                    style={{
                      background: `
                        radial-gradient(ellipse 80% 50% at 30% 0%, rgba(255,255,255,0.45) 0%, transparent 60%),
                        radial-gradient(ellipse 60% 40% at 80% 100%, rgba(255,255,255,0.22) 0%, transparent 55%)
                      `,
                      mixBlendMode: "screen",
                    }}
                  ></div>

                  {/* Animated glow background — boosted brightness (primary + secondary only) */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Soft gradients — increased opacity & size */}
                    <div className="absolute -top-20 -left-16 w-72 h-72 rounded-full blur-3xl" style={{ backgroundColor: colors.primary, opacity: 0.55 }}></div>
                    <div className="absolute top-20 -right-20 w-80 h-80 rounded-full blur-3xl" style={{ backgroundColor: colors.secondary, opacity: 0.5 }}></div>
                    <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: colors.primary, opacity: 0.45 }}></div>
                  </div>

                  {/* Scanlines overlay — arcade CRT effect (reduced darkness) */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-[0.035] z-20"
                    style={{
                      backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.6) 2px, rgba(0,0,0,0.6) 4px)`,
                    }}
                  ></div>

                  {/* Top arcade console bar — lighter, glass effect */}
                  <div
                    className="relative z-10 flex items-center justify-between px-5 pt-4 pb-3"
                    style={{
                      background: `linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 60%, transparent 100%)`,
                      borderBottom: `1px solid rgba(255,255,255,0.2)`,
                      transform: "translateZ(20px)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: colors.primary, boxShadow: `0 0 10px ${colors.primary}` }}></div>
                      <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: colors.secondary, boxShadow: `0 0 10px ${colors.secondary}`, animationDelay: "0.3s" }}></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: "0 0 10px #34d399", animationDelay: "0.6s" }}></div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/25">
                      <Star className="w-3 h-3" style={{ color: colors.primary }} fill={colors.primary} />
                      <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">Pour la soirée</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-white/50"></div>
                      <div className="w-2 h-2 rounded-full bg-white/50"></div>
                      <div className="w-2 h-2 rounded-full bg-white/50"></div>
                    </div>
                  </div>

                  {/* Corner brackets — arcade cabinet style (brighter, primary/secondary only) */}
                  <div className="absolute top-14 left-3 w-6 h-6 border-l-2 border-t-2 rounded-tl-md pointer-events-none z-10" style={{ borderColor: colors.primary, opacity: 0.85, transform: "translateZ(30px)", filter: "drop-shadow(0 0 4px rgba(255,255,255,0.4))" }}></div>
                  <div className="absolute top-14 right-3 w-6 h-6 border-r-2 border-t-2 rounded-tr-md pointer-events-none z-10" style={{ borderColor: colors.secondary, opacity: 0.85, transform: "translateZ(30px)", filter: "drop-shadow(0 0 4px rgba(255,255,255,0.4))" }}></div>
                  <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 rounded-bl-md pointer-events-none z-10" style={{ borderColor: colors.secondary, opacity: 0.85, transform: "translateZ(30px)", filter: "drop-shadow(0 0 4px rgba(255,255,255,0.4))" }}></div>
                  <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 rounded-br-md pointer-events-none z-10" style={{ borderColor: colors.primary, opacity: 0.85, transform: "translateZ(30px)", filter: "drop-shadow(0 0 4px rgba(255,255,255,0.4))" }}></div>

                  <div className="relative z-10 p-5 space-y-5">
                    <div className="text-center relative" style={{ transform: "translateZ(40px)" }}>
                      {/* Floating gamepad with 3D elevated platform */}
                      <div className="relative inline-block mb-4">
                        {/* 3D pedestal under icon */}
                        <motion.div
                          animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-6 rounded-full blur-md"
                          style={{ background: `radial-gradient(ellipse, ${colors.primary} 0%, transparent 70%)` }}
                        ></motion.div>
                        <motion.div
                          animate={{
                            rotate: [0, -10, 10, 0],
                            scale: [1, 1.15, 1],
                            y: [0, -8, 0],
                          }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                          className="relative inline-flex items-center justify-center"
                          style={{
                            width: "72px",
                            height: "72px",
                            borderRadius: "22px",
                            background: `linear-gradient(145deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 100%)`,
                            backdropFilter: "blur(8px)",
                            border: `2px solid rgba(255,255,255,0.25)`,
                            boxShadow: `
                              0 18px 35px -8px rgba(0,0,0,0.5),
                              0 8px 15px -4px rgba(0,0,0,0.3),
                              inset 0 1px 0 rgba(255,255,255,0.4)
                            `,
                            transformStyle: "preserve-3d",
                          }}
                        >
                          <div className="absolute inset-0 rounded-[20px] overflow-hidden opacity-50" style={{ background: `linear-gradient(135deg, ${colors.primary}40 0%, ${colors.secondary}40 100%)` }}></div>
                          <Gamepad2 className="w-9 h-9 text-white relative z-10 drop-shadow-lg" strokeWidth={2.2} />
                        </motion.div>
                      </div>

                      {/* Title with 3D depth */}
                      <motion.h2
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="text-3xl md:text-4xl font-black font-luxury mb-3"
                        style={{
                          color: "#fff",
                          letterSpacing: "0.02em",
                          textShadow: `
                            0 2px 0 rgba(0,0,0,0.25),
                            0 4px 12px ${colors.primary}80,
                            0 6px 24px ${colors.secondary}50,
                            0 -1px 0 rgba(255,255,255,0.25)
                          `,
                          transform: "translateZ(30px)",
                        }}
                      >
                        Jeux & Fun
                      </motion.h2>
                      <p
                        className="text-white/85 text-sm font-semibold tracking-wide"
                        style={{
                          transform: "translateZ(20px)",
                          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                        }}
                      >
                        Régalez-vous avant la soirée
                      </p>

                      {/* Divider arcade style */}
                      <div className="flex items-center justify-center gap-3 mt-4">
                        <div className="h-px w-12" style={{ background: `linear-gradient(90deg, transparent, ${colors.primary})` }}></div>
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full backdrop-blur-sm" style={{ background: `linear-gradient(90deg, ${colors.primary}60, ${colors.secondary}60)`, border: `1px solid rgba(255,255,255,0.3)` }}>
                          <HelpCircle className="w-3 h-3 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]" />
                          <span className="text-[10px] font-black tracking-[0.25em] text-white uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">Jouez</span>
                        </div>
                        <div className="h-px w-12" style={{ background: `linear-gradient(90deg, ${colors.secondary}, transparent)` }}></div>
                      </div>
                    </div>

                    <div className="space-y-4 relative z-10" style={{ transform: "translateZ(25px)" }}>
                  {games.filter((g: GameConfiguration) => g.isEnabled && g.type !== 'puzzle').map((game: GameConfiguration, index) => {
                    const gameInfo = AVAILABLE_GAMES.find(g => g.type === game.type);
                    const resultsForGame = gameResults[game.id] || [];
                    const hasResultForThisGame = resultsForGame.some(  
                      res => res.guestName === invite?.nom && res.gameType === game.type
                    );
                    const isCompleted = completedGames.has(game.id) || hasResultForThisGame;

                    return (
                      <div 
                        key={game.id}
                        className="bg-white/22 backdrop-blur-xl rounded-[30px] overflow-hidden border border-white/30 shadow-lg transition-all duration-300 hover:shadow-2xl hover:bg-white/30 hover:scale-[1.02] group relative active:scale-[0.99]"
                        style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,0.45), 0 10px 30px -10px rgba(0,0,0,0.35)` }}
                      >
                        {/* Inner glow light */}
                        <div className="absolute inset-0 pointer-events-none opacity-60" style={{ background: `radial-gradient(ellipse at 30% 0%, rgba(255,255,255,0.25) 0%, transparent 55%)` }}></div>
                        <button
                          onClick={() => setCurrentGameId(game.id)}
                          className="w-full px-6 py-5 relative z-10"
                        >
                          <div className="flex items-center gap-5">
                            <div 
                              className="w-14 h-14 rounded-[24px] flex items-center justify-center text-3xl shadow-lg group-hover:scale-115 transition-transform duration-250 flex-shrink-0"
                              style={{
                                background: `linear-gradient(145deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.2) 100%)`,
                                border: `1.5px solid rgba(255,255,255,0.45)`,
                                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), 0 8px 20px -6px rgba(0,0,0,0.3)`,
                              }}
                            >
                              {gameInfo?.icon || '🎮'}
                            </div>
                            <div className="flex-1 text-center px-2">
                              <h3 
                                className="text-white font-extrabold text-base md:text-lg mb-2 break-words drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] group-hover:brightness-110 transition-all"
                              >
                                {game.title}
                              </h3>
                              <p className="text-white/90 text-xs md:text-sm font-medium line-clamp-2 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">{game.description}</p>
                            </div>
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg group-hover:scale-120 group-hover:translate-x-1 transition-all duration-250 flex-shrink-0"
                              style={{
                                background: `linear-gradient(145deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.22) 100%)`,
                                border: `1.5px solid rgba(255,255,255,0.4)`,
                                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), 0 6px 14px -4px rgba(0,0,0,0.3)`,
                              }}
                            >
                              <ChevronRight className="text-white w-6 h-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" strokeWidth={2.8} />
                            </div>
                          </div>
                          {isCompleted && (
                            <div className="mt-4 flex justify-center">
                              <div 
                                className="inline-flex items-center gap-2 bg-emerald-400/30 px-5 py-2 rounded-full border border-emerald-300/40"
                              >
                                <div>
                                  <Check className="text-emerald-200 w-5 h-5" />
                                </div>
                                <span className="text-emerald-100 text-xs font-bold uppercase tracking-widest">Terminé</span>
                              </div>
                            </div>
                          )}
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
          </div>
        )}

        {/* QR CODE SECTION (Compact) + FOOTER */}
        <div 
          ref={(el) => sectionRefs.current.qr = el}
          className="min-h-screen flex flex-col items-center justify-start py-16 pt-48 pb-36 snap-start relative overflow-hidden"
        >
          {/* Section Background */}
          {optimizedQrFooterSectionBg && (
            <div className="absolute inset-0 z-0 transition-all duration-700 ease-in-out">
              <img 
                src={optimizedQrFooterSectionBg} 
                alt="Background" 
                className="w-full h-full object-cover transition-transform duration-700 ease-in-out" 
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"></div>
            </div>
          )}
          {/* Falling Dots */}
          <FallingDots colors={colors} />
          <RevealOnScroll className="relative w-full max-w-lg px-4 z-10">
          <div 
            className="bg-black/40 backdrop-blur-xl rounded-[30px] p-5 shadow-xl flex flex-col items-center border-2 mb-6"
            style={{ borderColor: `${colors.primary}40` }}
          >
            <div className="flex items-center space-x-2 mb-5">
              <QrCode className="h-5 w-5" style={{ color: colors.primary }} />
              <h3 className="text-base font-bold" style={{ color: colors.primary }}>Code d'Invitation</h3>
            </div>

            <div className="bg-white p-3 rounded-[20px] shadow-inner mb-5 w-full max-w-[200px] aspect-square flex items-center justify-center">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} className="w-full h-full object-contain" alt="QR Code" />
              ) : (
                <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl" />
              )}
            </div>

            <button
                onClick={downloadQRCode}
                className="w-full py-3 rounded-[20px] font-bold text-xs shadow-lg flex items-center justify-center space-x-3 hover:scale-[1.03] transition-all duration-300 relative overflow-hidden group border border-white/20 active:scale-95 text-white"
                style={{ 
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                }}
              >
              <Download className="h-4 w-4" />
              <span className="uppercase tracking-[0.15em]">Télécharger</span>
            </button>
          </div>
        </RevealOnScroll>

          {/* FOOTER - fixé en bas de la section */}
          <div className="absolute bottom-0 left-0 right-0 pb-6 pt-4 flex justify-center w-full z-20 px-4">
            <div className="bg-white/90 backdrop-blur-md px-3 py-2.5 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 shadow-xl border border-white/20 w-full max-w-md rounded-2xl">
              <div className="flex items-center justify-center gap-2">
                <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
                <p className="text-slate-600 text-[11px] font-medium text-center">
                  Réalisé par <a 
                    href="https://www.furaha-digital.net/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-bold hover:underline transition-all"
                    style={{ color: colors.primary }}
                  >
                    Furaha Digital
                  </a>
                </p>
                <Sparkles className="h-3 w-3 text-amber-400" />
              </div>
              <div className="h-[1px] w-16 bg-slate-300/70 sm:h-4 sm:w-[1px]"></div>
              <a 
                href="https://wa.me/243844333917" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 group"
              >
                <svg className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-[11px] font-semibold text-emerald-600 hover:underline transition-all">
                  Contactez-nous sur WhatsApp
                </span>
              </a>
            </div>
          </div>
        </div>

      {/* FULL SCREEN PHOTO VIEWER */}
      {selectedGalleryPhoto && (
        <PhotoViewer 
          photos={galleryPhotos} 
          initialPhoto={selectedGalleryPhoto} 
          onClose={() => setSelectedGalleryPhoto(null)} 
          optimizeImage={optimizeImage}
          themeColors={{
            primary: colors.primary,
            secondary: colors.secondary,
            accent: colors.tertiary,
          }}
        />
      )}

      {/* FLOATING CONTROLS (Music, Notifications & Guest Book) - DESIGN COMPACT */}
      <div className="fixed bottom-8 right-4 z-50 flex flex-col space-y-2">
        {/* MUSIC CONTROL BUTTON (COMPACT) */}
        {safeUserModel.backgroundMusic && (
          <button 
            onClick={toggleMute}
            className={`w-10 h-10 rounded-full shadow-md flex items-center justify-center text-white border border-white/50 backdrop-blur-md transform hover:scale-105 transition-all active:scale-95 relative ${
              isMusicMuted ? 'bg-slate-800/80' : ''
            }`}
            style={{ 
              background: isMusicMuted ? undefined : `linear-gradient(to br, ${colors.primary}, ${colors.secondary})`
            }}
          >
            {isMusicMuted ? (
              <VolumeX className="h-5 w-5 text-white" />
            ) : (
              <Volume2 className={`h-5 w-5 text-white ${isMusicPlaying ? 'animate-pulse' : ''}`} />
            )}
          </button>
        )}

        {/* BOUTON NOTIFICATIONS (CACHÉ SUR iOS) */}
        {typeof navigator !== 'undefined' && !(/iPad|iPhone|iPod/.test(navigator.userAgent)) && (
          <button 
            onClick={async () => {
              console.log('=== Manual notification button clicked ===');
              setShowNotificationModal(true);
            }}
            className="w-10 h-10 rounded-full shadow-md flex items-center justify-center text-white border border-white/50 backdrop-blur-md transform hover:scale-105 transition-all active:scale-95 relative"
            style={{ 
              background: `linear-gradient(to br, ${colors.secondary}, ${colors.primary})`,
              backgroundColor: colors.secondary // Fallback
            }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {(token || localStorage.getItem('furaha_notification_token') || permission === 'granted' || localStorage.getItem('furaha_notification_permission') === 'granted') && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center border border-white text-[10px] font-bold shadow-sm">
                ✓
              </div>
            )}
          </button>
        )}
        
        {/* BOUTON LIVRE D'OR (COMPACT + EFFETS ATTRACTIFS) */}
        <div className="relative group">
          {/* Contour lumineux tournant */}
          <div className="absolute inset-[-4px] rounded-full overflow-hidden pointer-events-none">
            <div 
              className="absolute inset-0 animate-spin-slow"
              style={{ 
                background: `conic-gradient(from 0deg, transparent 70%, ${colors.primary}, ${colors.secondary})`,
                animationDuration: '3s'
              }}
            ></div>
            <div className="absolute inset-[2px] bg-slate-50/10 backdrop-blur-sm rounded-full"></div>
          </div>
          
          <button 
            onClick={() => setShowGuestBook(true)}
            className="w-10 h-10 rounded-full shadow-md flex items-center justify-center text-white border border-white/50 backdrop-blur-md transform hover:scale-105 transition-all active:scale-95 relative z-10"
            style={{ 
              background: `linear-gradient(to br, ${colors.primary}, ${colors.secondary})`,
              backgroundColor: colors.primary // Fallback
            }}
          >
            <BookOpen className="h-5 w-5 text-white" />
            {guestBookMessages.length > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold border border-white shadow-sm animate-bounce">
                {guestBookMessages.length}
              </div>
            )}
            
            {/* Petit sparkle en bas à gauche */}
            <div className="absolute -bottom-1 -left-1 text-white opacity-80">
              <Sparkles className="h-3 w-3" style={{ color: colors.secondary }} />
            </div>
          </button>
        </div>
      </div>



      {/* GUEST BOOK MODAL (Ultra Modern Mode) */}
      {showGuestBook && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowGuestBook(false)}></div>
          <div className="relative bg-[#faf9f6] w-full max-w-lg h-[88vh] rounded-[50px] shadow-[0_30px_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-zoom-in border border-white/30">
            {/* Ultra Premium Artistic Header (Rectangular & Compact) */}
            <div className="relative h-36 flex-shrink-0 overflow-hidden">
              <img 
                src={optimizeImage(safeUserModel.invitationPhoto || photoCouple, 800, 80)} 
                className="w-full h-full object-cover scale-105"
                alt="Header"
                loading="lazy"
              />
              {/* Clean artistic overlay without bottom fade */}
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              
              <div className="absolute inset-0 p-6 flex items-center justify-between text-white">
                <div className="flex items-center space-x-4">
                  <div className="relative group">
                    <div className="absolute inset-[-4px] rounded-full bg-white/20 blur-sm"></div>
                    <div className="w-14 h-14 rounded-full border-2 border-white/80 overflow-hidden shadow-xl relative z-10">
                      <img 
                        src={optimizeImage(safeUserModel.invitationPhoto || photoCouple, 150, 60)} 
                        className="w-full h-full object-cover" 
                        alt="" 
                        loading="lazy"
                      />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] text-white/80 uppercase tracking-[0.4em] font-black">Livre d'Or</p>
                    <h3 className="text-2xl font-luxury tracking-tight drop-shadow-lg">Mots Doux & Vœux</h3>
                  </div>
                </div>

                <button 
                  onClick={() => setShowGuestBook(false)}
                  className="p-2.5 bg-white/10 hover:bg-white/30 backdrop-blur-xl rounded-xl transition-all duration-500 border border-white/20 group shadow-lg"
                >
                  <X className="h-5 w-5 group-hover:rotate-180 transition-transform duration-700" />
                </button>
              </div>
            </div>

            {/* Premium Message Area with Romantic Texture */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar relative bg-gradient-to-br from-[#fdf4f4] via-[#fef9f0] to-[#fdf5f9]">
              {/* Subtle romantic texture overlay */}
              <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: `url(${ornement5})`, backgroundSize: '300px', backgroundRepeat: 'repeat', opacity: 0.15 }}></div>
              
              {guestBookMessages && guestBookMessages.length > 0 ? (
                <div className="relative z-10 pb-4">
                    {guestBookMessages.map((msg, index) => {
                      const isMe = msg.inviteId === inviteId;
                      const initials = (msg.nom || 'Inconnu').split(' ').map((n: any) => n ? n[0] : '').join('').substring(0, 2).toUpperCase();
                      
                      const cardStyles = [
                        { bg: '#ffeef0', text: '#8b3a42', accent: '#ff9a9e', border: '#ffcdd2' }, // Soft pink
                        { bg: '#fdf2f8', text: '#7a2048', accent: '#f78fb3', border: '#fce4ec' }, // Light mauve
                        { bg: '#fff4e6', text: '#9a4c2a', accent: '#ffb199', border: '#ffe0b2' }, // Warm peach
                      ];
                      
                      const style = cardStyles[index % cardStyles.length];

                      return (
                        <div 
                          key={msg.id || index} 
                          className={`flex items-start space-x-3 mb-6 ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'} animate-slide-up`}
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          {/* Romantic Avatar with Heart Accent */}
                          <div className="flex-shrink-0 mt-1 relative">
                            <div 
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-[9px] font-black shadow-lg border-2 relative z-10 transform transition-all group-hover:scale-110`}
                              style={{ 
                                background: isMe 
                                  ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` 
                                  : `linear-gradient(135deg, ${style.accent}, ${style.bg})`,
                                color: isMe ? '#ffffff' : style.text,
                                borderColor: isMe ? colors.primary : style.border,
                              }}
                            >
                              {initials || '?'}
                            </div>
                            {/* Floating heart decoration */}
                            <div className="absolute -top-1 -right-1 text-pink-400 animate-pulse">
                              <Heart className="h-3 w-3 fill-current" />
                            </div>
                          </div>

                          <div 
                            className={`flex-1 p-5 relative group transition-all duration-500 hover:shadow-xl hover:scale-[1.02] ${
                              isMe ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm'
                            }`}
                            style={{
                              background: isMe 
                                ? `linear-gradient(135deg, ${colors.primary}ee, ${colors.secondary}ee)` 
                                : `linear-gradient(135deg, ${style.bg}, ${style.bg}dd)`,
                              boxShadow: '0 4px 20px -6px rgba(0,0,0,0.1)',
                              border: `1px solid ${isMe ? colors.primary + '40' : style.border}`,
                              color: isMe ? '#ffffff' : style.text,
                            }}
                          >
                            {/* Romantic Decorative Elements */}
                            <div className={`absolute ${isMe ? 'top-1 left-1' : 'top-1 right-1'} opacity-40`}>
                              <Sparkles className="h-4 w-4" style={{ color: isMe ? '#fff' : style.accent }} />
                            </div>
                            <div className={`absolute ${isMe ? 'bottom-1 right-1' : 'bottom-1 left-1'} opacity-30`}>
                              <Heart className="h-3 w-3 fill-current" style={{ color: isMe ? '#fff' : style.accent }} />
                            </div>

                            <div className="flex justify-between items-center mb-3">
                              <div className="flex flex-col">
                                {!isMe && (
                                  <span 
                                    className="text-[10px] font-bold uppercase tracking-[0.15em] mb-0.5"
                                    style={{ color: isMe ? '#ffffffcc' : style.accent }}
                                  >
                                    {msg.nom || 'Invité spécial(e)'}
                                  </span>
                                )}
                                <div className="flex items-center space-x-1.5 text-[8px] font-medium opacity-70">
                                  <Clock className="h-2 w-2" />
                                  <span>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                </div>
                              </div>
                              {/* Edit/Delete buttons for own messages */}
                              {isMe && (
                                <div className="flex items-center space-x-2">
                                  {editingMessageId === msg.id ? (
                                    <>
                                      <button 
                                        onClick={() => handleSaveEdit(msg)}
                                        disabled={isSubmittingMessage || !editingText.trim()}
                                        className="p-1.5 rounded-full hover:bg-white/20 transition-all disabled:opacity-30"
                                      >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setEditingMessageId(null);
                                          setEditingText('');
                                        }}
                                        className="p-1.5 rounded-full hover:bg-white/20 transition-all"
                                      >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button 
                                        onClick={() => handleEditMessage(msg)}
                                        className="p-1.5 rounded-full hover:bg-white/20 transition-all"
                                      >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteMessage(msg)}
                                        className="p-1.5 rounded-full hover:bg-white/20 transition-all"
                                      >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                              {!isMe && (
                                <div className="flex-shrink-0">
                                  <Heart className="h-4 w-4 fill-current opacity-50" style={{ color: isMe ? '#fff' : style.accent }} />
                                </div>
                              )}
                            </div>
                            
                            {editingMessageId === msg.id ? (
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="w-full bg-transparent border-none p-0 focus:ring-0 text-[14px] leading-relaxed italic font-serif resize-none"
                                style={{ color: isMe ? '#fff' : style.text }}
                                autoFocus
                              />
                            ) : (
                              <p className="text-[14px] leading-relaxed italic font-serif">
                                "{msg.message}"
                              </p>
                            )}

                            {msg.replies && msg.replies.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {msg.replies.map((r: any, rIdx: number) => {
                                  const isAdminReply = r.authorInviteId && r.authorInviteId === invite?.userId;
                                  const adminName = isAdminReply ? (safeUserModel.title || 'Organisateur') : (r.authorName || 'Invité');
                                  return (
                                    <div
                                      key={r.id || rIdx}
                                      className={`relative border-l-[3px] pl-2.5 py-1 ${!isMe ? 'animate-slide-up' : ''}`}
                                      style={{ borderColor: isMe ? 'rgba(255,255,255,0.5)' : colors.primary }}
                                    >
                                      <div className="flex items-center justify-between mb-0.5 gap-2">
                                        <span
                                          className="text-[9px] font-bold uppercase tracking-[0.14em]"
                                          style={{ color: isMe ? 'rgba(255,255,255,0.9)' : colors.primary }}
                                        >
                                          {adminName}
                                        </span>
                                        <span
                                          className="text-[7.5px] font-medium flex items-center gap-0.5 whitespace-nowrap"
                                          style={{ color: isMe ? 'rgba(255,255,255,0.65)' : (style.text + '88') }}
                                        >
                                          <Clock className="h-1.5 w-1.5" />
                                          {r.createdAt ? new Date(r.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                      </div>
                                      <p
                                        className="leading-relaxed whitespace-pre-wrap"
                                        style={{
                                          fontSize: '11px',
                                          color: isMe ? 'rgba(255,255,255,0.92)' : style.text,
                                          opacity: 0.85,
                                          fontFamily: "'Georgia', 'Times New Roman', serif",
                                          fontStyle: 'italic'
                                        }}
                                      >
                                        {r.content}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            
                            {/* Romantic accent line */}
                            <div 
                              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                              style={{ background: `linear-gradient(to right, transparent, ${isMe ? 'rgba(255,255,255,0.6)' : style.accent}, transparent)` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center relative z-10">
                  <div className="w-28 h-28 bg-gradient-to-br from-white to-pink-50 rounded-full flex items-center justify-center shadow-xl mb-6 border border-pink-100 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-pink-50/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <BookOpen className="h-12 w-12 text-pink-200" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-pink-300 text-center px-8 leading-relaxed">Écrivez un mot d'amour pour les mariés</p>
                </div>
              )}
            </div>

            {/* Luxury Input Area (Refined) */}
            <div className="p-6 bg-white border-t border-slate-100 rounded-b-[50px] shadow-[0_-20px_50px_rgba(0,0,0,0.03)] relative z-20">
              <div 
                className="flex items-center space-x-3 p-2 pl-6 rounded-full border-2 transition-all duration-500 bg-slate-50 focus-within:bg-white focus-within:border-slate-200 focus-within:shadow-xl group"
                style={{ borderColor: '#f1f5f9' }}
              >
                <textarea
                  value={guestMessage}
                  onChange={(e) => setGuestMessage(e.target.value)}
                  placeholder="Écrivez votre message précieux..."
                  className="flex-1 bg-transparent border-none py-3 focus:ring-0 transition-all resize-none h-14 text-sm font-medium text-slate-800 placeholder:text-slate-400 font-serif"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isSubmittingMessage || !guestMessage.trim()}
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 disabled:opacity-30 hover:scale-105 relative overflow-hidden flex-shrink-0"
                  style={{ 
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    color: '#ffffff'
                  }}
                >
                  {isSubmittingMessage ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Send className="h-5 w-5 relative z-10 fill-current group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden animate-slide-up">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1.5">Supprimer le message ?</h3>
              <p className="text-slate-500 text-xs leading-relaxed">Cette action est irréversible. Votre message sera définitivement supprimé.</p>
            </div>
            <div className="flex border-t border-slate-100">
              <button 
                onClick={() => setShowDeleteConfirm({ isOpen: false, message: null })}
                className="flex-1 py-3 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isSubmittingMessage}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white font-medium text-sm hover:from-red-600 hover:to-rose-600 transition-all disabled:opacity-50"
              >
                {isSubmittingMessage ? (
                  <div className="w-4 h-4 mx-auto border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Supprimer'
                )}
              </button>
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
        const playerResult = currentGameResults.find(
          res => res.guestName === invite?.nom && res.gameType === game.type
        );
        const isCompleted = completedGames.has(game.id) || !!playerResult;
        const playerScore = playerResult?.score;

        const handleGameComplete = async (score: number, data: any) => {
          setCompletedGames(prev => new Set([...prev, game.id]));
          if (invite?.userId) {
            try {
              await GameService.saveGameResult(
                invite.userId,
                inviteId || '',
                game.id,
                game.type,
                invite?.nom || 'Invité',
                data,
                score
              );
            } catch (e) {
              console.error("Error saving game result:", e);
            }
          }
        };



        const handleMemoryComplete = async (timeInSeconds: number) => {
          setCompletedGames(prev => new Set([...prev, game.id]));
          if (invite?.userId && userModel?.id) {
            try {
              await GameService.addPuzzleResult(invite.userId, userModel.id, game.id, inviteId || '', invite?.nom || 'Invité', timeInSeconds, 'memory-match');
              const results = await GameService.getPuzzleResults(invite.userId, userModel.id, game.id);
              setGameResults(prev => ({ ...prev, [game.id]: results }));
            } catch (e) {
              console.error("Error saving memory match result:", e);
            }
          }
        };

        const handleLoveQuizComplete = async (score: number) => {
          setCompletedGames(prev => new Set([...prev, game.id]));
          if (invite?.userId && userModel?.id) {
            try {
              await GameService.addPuzzleResult(invite.userId, userModel.id, game.id, inviteId || '', invite?.nom || 'Invité', score, 'love-quiz');
              const results = await GameService.getPuzzleResults(invite.userId, userModel.id, game.id);
              setGameResults(prev => ({ ...prev, [game.id]: results }));
            } catch (e) {
              console.error("Error saving love quiz result:", e);
            }
          }
        };

        const handleCatchLoveComplete = async (score: number) => {
          setCompletedGames(prev => new Set([...prev, game.id]));
          if (invite?.userId && userModel?.id) {
            try {
              await GameService.addPuzzleResult(invite.userId, userModel.id, game.id, inviteId || '', invite?.nom || 'Invité', score, 'catch-love');
              const results = await GameService.getPuzzleResults(invite.userId, userModel.id, game.id);
              setGameResults(prev => ({ ...prev, [game.id]: results }));
            } catch (e) {
              console.error("Error saving catch love result:", e);
            }
          }
        };

        const renderGameContent = () => {
          switch (game.type) {
            case 'couple-quiz':
              return <CoupleQuizGame game={game} colors={colors} onComplete={handleGameComplete} guestName={invite?.nom || 'Invité'} />;
            case 'wish-generator':
              return <WishGeneratorGame game={game} colors={colors} onComplete={handleGameComplete} guestName={invite?.nom || 'Invité'} />;
            case 'photo-challenge':
              return <PhotoChallengeGame game={game} colors={colors} onComplete={handleGameComplete} guestName={invite?.nom || 'Invité'} />;
            case 'love-story-timeline':
              return <LoveStoryTimelineGame game={game} colors={colors} onComplete={handleGameComplete} guestName={invite?.nom || 'Invité'} />;
            case 'wedding-trivia':
              return <WeddingTriviaGame game={game} colors={colors} onComplete={handleGameComplete} guestName={invite?.nom || 'Invité'} />;
            case 'guest-book-prompt':
              return <GuestBookPromptGame game={game} colors={colors} onComplete={handleGameComplete} guestName={invite?.nom || 'Invité'} />;
            case 'quiz':
            case 'love-quiz':
              return (
                <LoveQuizGame
                  config={game as any}
                  userId={invite?.userId || ''}
                  modelId={userModel?.id || ''}
                  inviteId={inviteId || ''}
                  guestName={invite?.nom || 'Invité'}
                  onSaveResult={handleLoveQuizComplete}
                  leaderboard={currentGameResults}
                  colors={colors}
                  isCompleted={isCompleted}
                  playerScore={playerScore}
                />
              );
            case 'memory-match':
              return (
                <MemoryMatchGame
                  config={game as any}
                  userId={invite?.userId || ''}
                  modelId={userModel?.id || ''}
                  inviteId={inviteId || ''}
                  guestName={invite?.nom || 'Invité'}
                  onSaveResult={handleMemoryComplete}
                  leaderboard={currentGameResults}
                  colors={colors}
                  isCompleted={isCompleted}
                  playerScore={playerScore}
                />
              );
            case 'catch-love':
              return (
                <CatchLoveGame
                  config={game as any}
                  userId={invite?.userId || ''}
                  modelId={userModel?.id || ''}
                  inviteId={inviteId || ''}
                  guestName={invite?.nom || 'Invité'}
                  onSaveResult={handleCatchLoveComplete}
                  leaderboard={currentGameResults}
                  colors={colors}
                  isCompleted={isCompleted}
                  playerScore={playerScore}
                />
              );
            default:
              return (
                <div className="text-center py-8">
                  <div className="w-20 h-20 mx-auto bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                    <Trophy className="h-10 w-10 text-white/40" />
                  </div>
                  <h4 className="text-white/70 font-medium mb-2">Jeu à venir</h4>
                  <p className="text-white/40 text-sm">Ce jeu sera disponible bientôt !</p>
                </div>
              );
          }
        };

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setCurrentGameId(null)}></div>
            <div className="relative bg-[#faf9f6] w-full max-w-lg h-[88vh] rounded-[50px] shadow-[0_30px_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-zoom-in border border-white/30">
              {/* Premium Artistic Header */}
              <div className="relative h-32 sm:h-36 flex-shrink-0 overflow-hidden">
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]"></div>
                
                <div className="absolute inset-0 p-6 flex items-center justify-between text-white">
                  <div className="flex items-center space-x-4">
                    <div className="relative group">
                      <div className="absolute inset-[-4px] rounded-full bg-white/20 blur-sm"></div>
                      <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center shadow-xl relative z-10">
                        <span className="text-3xl">{gameInfo?.icon || '🎮'}</span>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] text-white/80 uppercase tracking-[0.4em] font-black">Jeu</p>
                      <h3 className="text-2xl font-luxury tracking-tight drop-shadow-lg">{game.title}</h3>
                    </div>
                  </div>

                  <button 
                    onClick={() => setCurrentGameId(null)}
                    className="p-2.5 bg-white/10 hover:bg-white/30 backdrop-blur-xl rounded-xl transition-all duration-500 border border-white/20 group shadow-lg"
                  >
                    <X className="h-5 w-5 group-hover:rotate-180 transition-transform duration-700" />
                  </button>
                </div>
              </div>

              {/* Game Content */}
              <div className="flex-1 overflow-y-auto p-6 no-scrollbar relative bg-[#faf9f6]">
                {renderGameContent()}
              </div>
            </div>
          </div>
        );
      })()}

      {/* TOAST MODAL */}
      <ToastModal 
        isOpen={showToastModal.isOpen}
        onClose={() => setShowToastModal({ ...showToastModal, isOpen: false })}
        type={showToastModal.type}
        selectedDrink={showToastModal.drink}
        primaryColor={colors.primary}
        secondaryColor={colors.secondary}
      />

      {/* MODAL DE NOTIFICATION */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay sombre */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              // Fermer le modal sans rien faire et marquer comme vu
              if (!(permission === 'granted' || token)) {
                localStorage.setItem('furaha_notification_modal_dismissed', 'true');
              }
              setShowNotificationModal(false);
            }}
          />
          
          {/* Contenu du modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-slide-up">
            {/* En-tête avec dégradé */}
            <div 
              className="p-6 text-center"
              style={{ 
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` 
              }}
            >
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Ne manquez pas l'événement !</h2>
            </div>
            
            {/* Corps */}
            <div className="p-6">
              {(isFCMSupported === false || (typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent))) && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-1">Notifications non disponibles sur iOS</p>
                      <p>En raison de limitations d'Apple, les notifications push ne fonctionnent pas sur les appareils iOS (iPhone/iPad), quel que soit le navigateur. Utilisez un appareil Android ou un ordinateur pour activer les rappels.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
                  ⚠️ Erreur : {error}
                </div>
              )}
              
              {/* Si notifications activées */}
              {(permission === 'granted' || token) && (
                <>
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
                    ✅ Notifications activées avec succès !
                  </div>
                  <p className="text-slate-600 text-center mb-6">
                    Recevez un rappel automatiquement pour ne pas oublier la date !
                  </p>
                  <button
                    onClick={() => setShowNotificationModal(false)}
                    className="w-full py-3 px-4 text-slate-500 font-medium rounded-xl transition-all hover:bg-slate-100"
                  >
                    Quitter
                  </button>
                </>
              )}
              
              {/* Si notifications pas activées */}
              {!(permission === 'granted' || token) && isFCMSupported !== false && (
                <>
                  <p className="text-slate-600 text-center mb-6">
                    Recevez un rappel automatiquement pour ne pas oublier la date !
                  </p>
                  
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={async () => {
                        console.log('=== CLIC SUR BOUTON AUTORISER ===');
                        console.log('inviteId:', inviteId);
                        console.log('inviteDocPath:', inviteDocPath);
                        console.log('invite state:', invite);
                        await requestPermission({ inviteId, inviteDocPath });
                      }}
                      disabled={isNotificationLoading || isFCMSupported === false}
                      className="w-full py-3 px-4 text-white font-semibold rounded-xl shadow-lg transition-all active:scale-95"
                      style={{ 
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` 
                      }}
                    >
                      {isNotificationLoading ? 'Chargement...' : 'Autoriser les rappels'}
                    </button>
                    
                    <button
                      onClick={() => {
                        localStorage.setItem('furaha_notification_modal_dismissed', 'true');
                        setShowNotificationModal(false);
                      }}
                      className="w-full py-3 px-4 text-slate-500 font-medium rounded-xl transition-all hover:bg-slate-100"
                    >
                      Plus tard
                    </button>
                  </div>
                </>
              )}
              
              {isFCMSupported === false && (
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="w-full py-3 px-4 text-slate-500 font-medium rounded-xl transition-all hover:bg-slate-100"
                >
                  Fermer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`
        .animate-bounce-slow {
  animation: bounce-slow 3s infinite ease-in-out;
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes vibrate {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }

        .animate-vibrate {
          animation: vibrate 0.3s linear infinite;
          animation-play-state: running;
        }

        .animate-vibrate:hover {
          animation-play-state: paused;
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default InvitationPreview;
