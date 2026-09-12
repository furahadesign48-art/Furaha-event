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
  Play,
  Pause,
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
  CarTaxiFront,
  Mic,
  MicOff,
  Square
} from 'lucide-react';
import { storage } from '../config/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
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
import ClassicScrollLayout from './layouts/ClassicScrollLayout';
import BookLayout from './layouts/BookLayout';

// Helper for image optimization
const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v|ogg|ogv|avi|mkv|flv|wmv|3gp)(\?.*)?$/i;
const isVideoUrl = (url: string) => VIDEO_EXT_RE.test(url.split('#')[0]);

const optimizeImage = (url: string, width: number = 800, quality: number = 70) => {
  if (!url) return '';
  if (isVideoUrl(url)) return url;
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', `/upload/w_${width},q_${quality},f_auto,c_limit/`);
  }
  return url;
};

// --- UTILITAIRES DÃ‰PLACÃ‰S EN HAUT POUR COMPATIBILITÃ‰ SAFARI ---

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
    // VÃ©rification ultra-stricte pour Safari
    if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
      const seg = new (Intl as any).Segmenter(undefined, { granularity: 'grapheme' });
      return Array.from(seg.segment(str)).map((s: any) => s.segment);
    }
  } catch (e) {}
  return Array.from(str);
};

// --- COMPOSANTS DE SÃ‰CURITÃ‰ ---

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
            <p className="text-slate-600 mb-6">L'affichage de l'invitation a rencontrÃ© un problÃ¨me sur ce navigateur. Essayez d'actualiser ou d'utiliser un autre appareil.</p>
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

// --- COMPOSANT COMPTE Ã€ REBOURS OPTIMISÃ‰ ---
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
        <h3 className="text-2xl font-bold mb-2" style={{ color: colors.primary }}>TerminÃ© !</h3>
        <p className="text-white/80 mb-4">Votre score : {score}/{questions.length}</p>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="text-white/60">Aucune question configurÃ©e</div>;
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
        <p className="text-white/80">Vos vÅ“ux ont Ã©tÃ© enregistrÃ©s</p>
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
        placeholder="Ã‰crivez votre message..."
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

  const challenges = game.challenges || ['Prendre une photo avec les mariÃ©s'];

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
        <h3 className="text-xl font-bold text-white mb-2">DÃ©fis Photo</h3>
        <p className="text-white/60 text-sm">Cochez les dÃ©fis que vous avez relevÃ©s !</p>
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
      <p className="text-center text-white/50 text-sm mt-4">{completedChallenges.size}/{challenges.length} dÃ©fis complÃ©tÃ©s</p>
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
  photos?: string[];
  initialPhoto?: string;
  onClose: () => void;
  optimizeImage: (url: string, w: number, q?: number) => string;
  themeColors?: {
    primary: string;
    secondary: string;
    accent?: string;
  };
}> = ({ photos = [], initialPhoto, onClose, optimizeImage, themeColors }) => {
  const safeInitial = initialPhoto || (photos && photos.length ? photos[0] : '') || '';
  const inGallery = Array.isArray(photos) && photos.length > 0 && safeInitial && photos.indexOf(safeInitial) >= 0;
  const safePhotos = inGallery ? photos : (safeInitial ? [safeInitial] : ['']);
  const safeThemeColors = themeColors || { primary: '#f59e0b', secondary: '#d946ef', accent: '#fbbf24' };

  const [loaded, setLoaded] = useState(false);
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const mountedRef = useRef(false);
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    const idx = safePhotos.indexOf(safeInitial);
    return idx >= 0 ? idx : 0;
  });
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const playIntervalRef = useRef<number | null>(null);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimerRef = useRef<number | null>(null);

  const revealControls = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current !== null) {
      window.clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setShowControls(false), 3500);
    return () => {
      window.clearTimeout(t);
      if (hideControlsTimerRef.current !== null) {
        window.clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, []);

  const { primary, secondary } = safeThemeColors;
  const accent = safeThemeColors.accent || secondary;

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
  const currentPhoto = safePhotos[safeIndex] || safeInitial;
  const prevPhoto = prevIndex !== null && prevIndex >= 0 && prevIndex < total ? safePhotos[prevIndex] : null;
  const isVideo = !!currentPhoto && isVideoUrl(currentPhoto);

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
      return isVideoUrl(prevPhoto) ? prevPhoto : optimizeImage(prevPhoto, 1600, 85);
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

  const show = entered && !closing;
  const enterFactor = show ? 1 : 0;

  return (
    <div
      className={"fixed inset-0 z-[110] flex items-center justify-center will-change-[backdrop-filter,opacity,background-color] "}
      onClick={(e) => { revealControls(); handleClose(e); }}
      onTouchStart={(e) => { revealControls(); }}
      style={{
        opacity: enterFactor,
        transition: "opacity 520ms cubic-bezier(0.22, 1, 0.36, 1), backdrop-filter 620ms cubic-bezier(0.22, 1, 0.36, 1), background-color 620ms cubic-bezier(0.22, 1, 0.36, 1), -webkit-backdrop-filter 620ms cubic-bezier(0.22, 1, 0.36, 1)",
        backdropFilter: show ? `blur(30px) saturate(145%)` : `blur(0px) saturate(100%)`,
        WebkitBackdropFilter: show ? `blur(30px) saturate(145%)` : `blur(0px) saturate(100%)`,
        backgroundColor: show ? "rgba(0,0,0,0.74)" : "rgba(0,0,0,0)",
        backgroundImage: show ? `radial-gradient(ellipse at center, ${darker(primary, 0.82)} 0%, rgba(0,0,0,0.88) 100%)` : "none",
      }}
    >
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: 0.55 * enterFactor, transition: "opacity 600ms ease-out" }}>
        <div className="absolute -top-24 -left-20 w-[30rem] h-[30rem] rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${glow1} 0%, transparent 68%)` }} />
        <div className="absolute -bottom-28 -right-14 w-[34rem] h-[34rem] rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${glow2} 0%, transparent 68%)` }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-[28rem] h-[28rem] rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${glow3} 0%, transparent 72%)` }} />
      </div>

      <button onClick={(e) => { e.stopPropagation(); revealControls(); handleClose(); }} className="absolute top-4 sm:top-6 right-4 sm:right-6 w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white z-[120] will-change-transform active:scale-95" style={{ opacity: (0.2 + 0.8 * enterFactor) * (showControls ? 1 : 0), transform: `scale(${0.7 + 0.3 * enterFactor})`, transition: "transform 520ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms ease-out, background-color 200ms ease-out, box-shadow 200ms ease-out", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${lighter(primary, 0.5)}33`, boxShadow: `0 10px 30px -10px ${darker(primary, 0.3)}66, 0 8px 24px -12px rgba(0,0,0,0.55)` }} onMouseEnter={(e) => { revealControls(); (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.18)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.1)"; }} aria-label="Fermer">
        <X className="h-6 w-6 sm:h-7 sm:w-7" />
      </button>

      {total > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); revealControls(); prevSlide(); }} className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white z-[120] will-change-transform active:scale-95 hover:bg-white/20 transition-colors" style={{ opacity: (0.2 + 0.8 * enterFactor) * (showControls ? 1 : 0), transform: `translateY(-50%) scale(${0.7 + 0.3 * enterFactor})`, transition: "transform 520ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms ease-out, background-color 200ms ease-out, box-shadow 200ms ease-out", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${lighter(primary, 0.5)}33`, boxShadow: `0 10px 30px -10px ${darker(primary, 0.3)}66` }} aria-label="Précédent">
            <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
          </button>

          <button onClick={(e) => { e.stopPropagation(); revealControls(); nextSlide(); }} className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white z-[120] will-change-transform active:scale-95 hover:bg-white/20 transition-colors" style={{ opacity: (0.2 + 0.8 * enterFactor) * (showControls ? 1 : 0), transform: `translateY(-50%) scale(${0.7 + 0.3 * enterFactor})`, transition: "transform 520ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms ease-out, background-color 200ms ease-out, box-shadow 200ms ease-out", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${lighter(primary, 0.5)}33`, boxShadow: `0 10px 30px -10px ${darker(primary, 0.3)}66` }} aria-label="Suivant">
            <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
          </button>

          <button onClick={(e) => { e.stopPropagation(); revealControls(); setIsPlaying((p) => !p); }} disabled={isVideo} className="absolute top-4 sm:top-6 left-4 sm:left-6 w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white z-[120] will-change-transform active:scale-95" style={{ opacity: (isVideo ? 0.4 : (0.2 + 0.8 * enterFactor)) * (showControls ? 1 : 0), transform: `scale(${0.7 + 0.3 * enterFactor})`, transition: "transform 520ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms ease-out, background-color 200ms ease-out, box-shadow 200ms ease-out", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${lighter(primary, 0.5)}33`, boxShadow: `0 10px 30px -10px ${darker(primary, 0.3)}66`, cursor: isVideo ? 'not-allowed' : 'pointer' }} onMouseEnter={(e) => { revealControls(); if (!isVideo) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.18)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.1)"; }} aria-label={isPlaying ? "Pause diaporama" : "Lecture diaporama"}>
            {isPlaying ? <Pause className="h-5 w-5 sm:h-6 sm:w-6" /> : <Play className="h-5 w-5 sm:h-6 sm:w-6" />}
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-white text-sm font-poppins z-[120] flex items-center gap-3" style={{ opacity: (0.2 + 0.8 * enterFactor) * (showControls ? 1 : 0), transform: `translateX(-50%) translateY(${6 * (1 - enterFactor)}px)`, transition: "transform 520ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms ease-out, background-color 200ms ease-out", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", border: `1px solid rgba(255,255,255,0.1)` }}>
            <span>{safeIndex + 1}</span>
            <span className="opacity-60">/</span>
            <span className="opacity-80">{total}</span>
          </div>
        </>
      )}

      <div className="relative px-3 sm:px-6 md:px-10 py-4 sm:py-8 max-w-full max-h-full flex items-center justify-center z-[115] will-change-transform" style={{ transform: `scale(${0.7 + 0.3 * enterFactor}) translateY(${(-18) * (1 - enterFactor)}px)`, opacity: 0.15 + 0.85 * enterFactor, transformOrigin: "center center", transition: "transform 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 520ms ease-out" }} onClick={(e) => { e.stopPropagation(); revealControls(); }} onTouchStart={(e) => { revealControls(); }}>
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden" style={{ boxShadow: show ? `0 45px 140px -20px ${shadowColor1}55, 0 30px 80px -18px ${shadowColor2}55, 0 25px 70px -12px rgba(0,0,0,0.85)` : "0 10px 30px -10px rgba(0,0,0,0.5)", border: `1px solid ${lighter(primary, 0.55)}22`, transition: "box-shadow 700ms cubic-bezier(0.22, 1, 0.36, 1), border-color 500ms ease-out" }}>
          {!loaded && (<div className="absolute inset-0 rounded-2xl sm:rounded-3xl z-10" style={{ background: `linear-gradient(90deg, ${lighter(primary, 0.75)}10, ${lighter(secondary, 0.7)}22, ${lighter(primary, 0.75)}10)`, backgroundSize: "200% 100%", animation: "shimmerX 1.6s ease-in-out infinite", opacity: enterFactor, transition: "opacity 300ms ease-out" }} />)}
          {isVideo ? (
            <video key={currentPhoto} src={finalSrc} controls autoPlay playsInline muted loop className={"max-w-full w-auto h-auto object-contain select-none will-change-[opacity,transform] bg-black"} style={{ maxHeight: "min(84vh, 900px)", transform: `scale(${0.96 + 0.04 * (loaded ? enterFactor : 0.2)})`, opacity: loaded ? (0.4 + 0.6 * enterFactor) : 0, filter: `saturate(${0.92 + 0.08 * enterFactor}) contrast(${0.96 + 0.04 * enterFactor})`, transition: "opacity 480ms ease-out, transform 820ms cubic-bezier(0.22, 1, 0.36, 1), filter 620ms ease-out" }} />
          ) : (
            <img key={currentPhoto} src={finalSrc} alt={`Agrandissement photo ${safeIndex + 1}/${total}`} onLoad={() => setLoaded(true)} onError={() => setLoaded(true)} className={"max-w-full w-auto h-auto object-contain select-none will-change-[opacity,transform] "} style={{ maxHeight: "min(84vh, 900px)", transform: `scale(${0.96 + 0.04 * (loaded ? enterFactor : 0.2)})`, opacity: loaded ? (0.4 + 0.6 * enterFactor) : 0, filter: `saturate(${0.92 + 0.08 * enterFactor}) contrast(${0.96 + 0.04 * enterFactor})`, transition: "opacity 480ms ease-out, transform 820ms cubic-bezier(0.22, 1, 0.36, 1), filter 620ms ease-out" }} draggable={false} loading="eager" decoding="async" />
          )}
          <div className="absolute inset-0 pointer-events-none rounded-2xl sm:rounded-3xl" style={{ boxShadow: `inset 0 0 140px ${darker(primary, 0.8)}33, inset 0 0 60px rgba(0,0,0,0.3)`, opacity: enterFactor, transition: "opacity 520ms ease-out" }} />
        </div>
      </div>

      <style>{`@keyframes shimmerX { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
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

// --- HELPERS DE CACHE LOCALSTORAGE (URGENCE DÃ‰GRADÃ‰ FIREBASE) ---
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
    console.warn('[Cache] Erreur Ã©criture cache:', e);
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
  // Ã‰tats d'urgence : mode dÃ©gradÃ© + rÃ©essa automatique
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentlyPlayingMessageId, setCurrentlyPlayingMessageId] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentAudioTime, setCurrentAudioTime] = useState<number>(0);
  const [forceAudioRerender, setForceAudioRerender] = useState<number>(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState<number>(0);
  const [forcePreviewRerender, setForcePreviewRerender] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const messageAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
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
  // Refs synchronisÃ©es pour maj cache dans callbacks de subscription (URGENCE FIREBASE)
  const userModelRef = useRef<UserModel | null>(embedded ? embeddedModel : null);
  const inviteRef = useRef<Invite | null>(null);
  useEffect(() => { 
    userModelRef.current = (embedded && embeddedModel) ? embeddedModel : userModel; 
  }, [userModel, embedded, embeddedModel]);
  useEffect(() => { inviteRef.current = invite; }, [invite]);
  
  // Refs pour les sections de navigation
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [currentSection, setCurrentSection] = useState<string>('countdown');
  
  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  
  // SÃ©curitÃ© anti-crash - DÃ©clarer safeUserModel et safeInvite D'ABORD pour Ã©viter l'erreur de variable non initialisÃ©e
  // En mode embedded, on utilise directement embeddedModel pour Ã©viter le dÃ©calage de rendu du useState
   const resolvedUserModel = (embedded && embeddedModel) ? embeddedModel : userModel;
   const safeUserModel = resolvedUserModel || {
     invitationTitleSubtitle: '',
     title: 'Invitation',
     backgroundImage: photoCouple,
     category: 'wedding',
     eventLocation: 'Lieu Ã  dÃ©finir',
     eventAddress: '',
     eventDate: '01.01.2026',
     drinkOptions: [],
     colors: { primary: '#f59e0b', secondary: '#d946ef', accent: '#fbbf24' },
     eventPhotos: [],
     invitationTextPhoto: '',
     invitationTextPhotoTitle: '',
     invitationTextPhoto2: '',
     invitationTextPhoto2Title: ''
   };

   const safeInvite = invite || { 
     nom: (resolvedUserModel as any)?.guestData?.name || 'InvitÃ©', 
     table: (resolvedUserModel as any)?.guestData?.tableNumber || 'Non assignÃ©', 
     confirmed: false, 
     etat: 'simple' 
   };

  // Liste des sections pour la navigation (aprÃ¨s safeUserModel pour condition accommodation)
  const accommodationVisible =
    ((safeUserModel as any).accommodationEnabled && Array.isArray((safeUserModel as any).accommodations) && (safeUserModel as any).accommodations.length > 0) ||
    ((safeUserModel as any).usefulAddressesEnabled && Array.isArray((safeUserModel as any).usefulAddresses) && (safeUserModel as any).usefulAddresses.length > 0);
  const countdownEnabled = (safeUserModel as any).countdownEnabled !== false;
  const galleryEnabled = (safeUserModel as any).galleryEnabled !== false;
  const rsvpEnabled = (safeUserModel as any).rsvpEnabled !== false;
  const drinksEnabled = (safeUserModel as any).drinksEnabled !== false;
  const gamesEnabledGlobal = (safeUserModel as any).gamesEnabled !== false;

  const sections = [
    { id: 'header', label: 'Accueil' },
    ...((safeUserModel as any).couplePhotoEnabled !== false || (safeUserModel as any).invitationTextEnabled !== false ? [{ id: 'mainContent', label: 'Invitation' }] : []),
    ...(countdownEnabled ? [{ id: 'countdown', label: 'Compte Ã  rebours' }] : []),
    ...(accommodationVisible ? [{ id: 'accommodation', label: 'HÃ©bergements' }] : []),
    ...(galleryEnabled ? [{ id: 'gallery', label: 'Galerie' }] : []),
    ...(rsvpEnabled ? [{ id: 'rsvp', label: 'RSVP' }] : []),
    ...(drinksEnabled ? [{ id: 'drinks', label: 'Boissons' }] : []),
    ...(gamesEnabledGlobal && games && games.filter(g => g.isEnabled).length > 0 ? [{ id: 'games', label: 'Jeux' }] : []),
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

    // 1) CHARGEMENT OPTIMISTE depuis le cache LOCAL (mÃªme avant Firebase) â€” sauve les invitÃ©s dÃ©jÃ  venus
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
              // Mise Ã  jour du cache Ã  chaque modification live
              const currentUM = userModelRef.current;
              if (currentUM) setCachedInviteData(inviteId, updatedInvite, currentUM);
            }
          });

          // Get user models and subscribe to the first one
          const models = await UserModelService.getUserModels(inviteData.userId);
          if (models.length > 0) {
            setUserModel(models[0]);
            // =================================================
            // ðŸ’¾ SAUVEGARDE DANS LE CACHE (clÃ© : inviteId)
            // =================================================
            setCachedInviteData(inviteId, inviteData, models[0]);
            // On sort du mode offline si on a rÃ©ussi
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
                // Mise Ã  jour cache sur modif live du modÃ¨le
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
              setDataError("Aucun design d'invitation trouvÃ© pour cet Ã©vÃ©nement.");
            }
          }
        } else {
          if (!getCachedInviteData(inviteId)) {
            setDataError("Invitation introuvable. Veuillez vÃ©rifier le lien.");
          }
        }
      } catch (e) {
        console.error(e);
        // ==== CHUTE DE SECOURS CRITIQUE : Cache offline ====
        const existingCache = getCachedInviteData(inviteId);
        if (existingCache) {
          // On AFFICHE depuis le cache â€” AUCUNE erreur affichÃ©e Ã  l'invitÃ©
          setInvite(existingCache.invite);
          setUserModel(existingCache.userModel);
          setInviteDocPath(existingCache.invite.userId ? `users/${existingCache.invite.userId}/invites/${existingCache.invite.id}` : null);
          setIsConfirmed(!!existingCache.invite.confirmed);
          setSelectedDrink((existingCache.invite as any).selectedDrink ? (existingCache.invite as any).selectedDrink.split(', ') : []);
          setIsOfflineMode(true);
          setDataError(null);
          // Compte Ã  rebours de rÃ©essai automatique toutes les 30s
          setRetryCountdown(30);
        } else {
          setDataError("Erreur de chargement. Veuillez actualiser la page.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Lancer le compte Ã  rebours de rÃ©essa automatique si on est en offline
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
     if (Array.isArray((safeUserModel as any).eventVideos)) photos.push(...((safeUserModel as any).eventVideos));
     if (Array.isArray(safeUserModel.eventPhotos)) photos.push(...safeUserModel.eventPhotos);
     return photos.length > 0 ? photos : [photoCouple];
   }, [safeUserModel]);

   const galleryItems = useMemo<GalleryItem[]>(() => {
     const romanticTitles = [
       "Un Amour Infini",
       "Moments PrÃ©cieux",
       "Promesse Ã‰ternelle",
       "Battements de CÅ“ur",
       "Regard Complice",
       "Main dans la Main",
       "Notre Histoire",
       "Pour Toujours",
       "Coeur Ã  Coeur",
       "Le Chemin de l'Amour"
     ];
     
     const romanticSubtitles = [
       "Chaque jour Ã  tes cÃ´tÃ©s est une nouvelle aventure.",
       "Deux cÅ“urs qui battent Ã  l'unisson pour l'Ã©ternitÃ©.",
       "Le dÃ©but de notre plus belle histoire d'amour.",
       "Ton sourire est ma plus belle destination.",
       "GravÃ© dans nos mÃ©moires pour toujours.",
       "L'amour est le seul voyage qui ne finit jamais.",
       "Nos plus beaux moments partagÃ©s.",
       "Un regard, un sourire, une Ã©ternitÃ©.",
       "L'amour en action, chaque jour.",
       "Notre futur, Ã©crit ensemble."
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
       alt: `Moment prÃ©cieux ${index + 1}`,
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

  useEffect(() => {
    if (!showGuestBook) {
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioBlob(null);
      setRecordedAudioUrl(null);
      setAudioDuration(0);
      setRecordingTime(0);
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (messageAudioRef.current) {
        messageAudioRef.current.pause();
        messageAudioRef.current.src = '';
        messageAudioRef.current = null;
      }
      if (progressTickRef.current) {
        clearInterval(progressTickRef.current);
        progressTickRef.current = null;
      }
      setCurrentlyPlayingMessageId(null);
      setIsAudioPlaying(false);
      setCurrentAudioTime(0);
    }
  }, [showGuestBook]);

  useEffect(() => {
    return () => {
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (progressTickRef.current) clearInterval(progressTickRef.current);
      if (messageAudioRef.current) { messageAudioRef.current.pause(); }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

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

  // Afficher le modal de notifications aprÃ¨s 10s si pas dÃ©jÃ  autorisÃ© ou vu
  useEffect(() => {
    console.log('=== DEBUG NOTIFICATION MODAL ===');
    console.log('inviteDocPath:', inviteDocPath);
    console.log('permission:', permission);
    console.log('token:', token);
    console.log('isLoading:', isLoading);
    console.log('isAdminView:', isAdminView);

    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const notificationEnabled = (safeUserModel as any).notificationEnabled !== false;
    
    if (inviteDocPath && !isLoading && !isAdminView && isSecure && notificationEnabled) {
      // VÃ©rifier si notifications sont dÃ©jÃ  autorisÃ©es (soit via permission, soit via localStorage)
      const savedPermission = localStorage.getItem('furaha_notification_permission');
      const savedToken = localStorage.getItem('furaha_notification_token');
      const isAlreadyGranted = permission === 'granted' || savedPermission === 'granted' || !!savedToken;
      
      if (isAlreadyGranted) {
        // Sauvegarder dans localStorage pour persister si ce n'est pas dÃ©jÃ  fait
        if (permission === 'granted') {
          localStorage.setItem('furaha_notification_permission', 'granted');
        }
        return;
      }
      
      // VÃ©rifier si l'utilisateur a dÃ©jÃ  fermÃ© le modal
      const hasDismissedModal = localStorage.getItem('furaha_notification_modal_dismissed');
      
      if (!hasDismissedModal) {
        console.log('â†’ Setting timer to show notification modal in 10s');
        const timer = setTimeout(() => {
          setShowNotificationModal(true);
        }, 10000);
        return () => clearTimeout(timer);
      }
    } else {
      console.log('â†’ Conditions not met to show modal');
    }
  }, [inviteDocPath, permission, token, isLoading, isAdminView, safeUserModel]);

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

  // GÃ©nÃ©ration du QR Code
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

  const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  const downloadInvitationJpg = useCallback(async () => {
    const W = 1080;
    const H = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const primary = safeUserModel.colors?.primary || '#f59e0b';
    const secondary = safeUserModel.colors?.secondary || '#d946ef';
    const accent = safeUserModel.colors?.accent || '#fbbf24';

    // Fond
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Orbes
    ctx.globalAlpha = 0.35;
    const glow1 = ctx.createRadialGradient(W * 0.15, H * 0.12, 20, W * 0.15, H * 0.12, 380);
    glow1.addColorStop(0, secondary);
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, W, H);
    const glow2 = ctx.createRadialGradient(W * 0.88, H * 0.28, 20, W * 0.88, H * 0.28, 420);
    glow2.addColorStop(0, primary);
    glow2.addColorStop(1, 'transparent');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, W, H);
    const glow3 = ctx.createRadialGradient(W * 0.5, H * 0.92, 20, W * 0.5, H * 0.92, 460);
    glow3.addColorStop(0, accent);
    glow3.addColorStop(1, 'transparent');
    ctx.fillStyle = glow3;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    let cursorY = 120;
    const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    // Titre du mariage (en haut)
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '300 30px "Poppins", sans-serif';
    ctx.fillText('Invitation', W / 2, cursorY);
    cursorY += 100;
    ctx.font = '900 92px "Poppins", sans-serif';
    const titleGrad = ctx.createLinearGradient(W / 2 - 400, 0, W / 2 + 400, 0);
    titleGrad.addColorStop(0, '#ffffff');
    titleGrad.addColorStop(0.5, primary);
    titleGrad.addColorStop(1, secondary);
    ctx.fillStyle = titleGrad;
    ctx.fillText(safeUserModel.title || 'Invitation', W / 2, cursorY);
    cursorY += 90;
    ctx.textAlign = 'start';

    // Photo d'entête
    const px = 80;
    const headerSrc = (safeUserModel as any).headerSectionBackground || safeUserModel.backgroundImage || '';
    if (headerSrc) {
      try {
        const img = await loadImage(headerSrc);
        const imgH = 620;
        const pw = W - 160;
        ctx.save();
        drawRoundedRect(px, cursorY, pw, imgH, 44);
        ctx.clip();
        const ratio = Math.max(pw / img.width, imgH / img.height);
        const dw = img.width * ratio;
        const dh = img.height * ratio;
        ctx.drawImage(img, px + (pw - dw) / 2, cursorY + (imgH - dh) / 2, dw, dh);
        ctx.restore();
        const vg = ctx.createLinearGradient(0, cursorY, 0, cursorY + imgH);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(0.55, `${secondary}55`);
        vg.addColorStop(1, `${secondary}d0`);
        ctx.fillStyle = vg;
        drawRoundedRect(px, cursorY, pw, imgH, 44);
        ctx.fill();
        cursorY += imgH + 70;
      } catch {}
    }

    // Invité + Boisson
    const boxY = cursorY;
    const boxH = 260;
    const bw = W - 160;
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.strokeStyle = `${primary}55`;
    ctx.lineWidth = 3;
    drawRoundedRect(px, boxY, bw, boxH, 32);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = primary;
    ctx.font = 'bold 30px "Poppins", sans-serif';
    ctx.fillText('✉️ Invité', px + 40, boxY + 65);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 58px "Poppins", sans-serif';
    ctx.fillText(safeInvite.nom || 'Invité', px + 40, boxY + 135);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '500 32px "Poppins", sans-serif';
    ctx.fillText(`Table : ${safeInvite.table || 'Non assigné'}`, px + 40, boxY + 195);
    // Boisson (dans la partie droite de la carte)
    ctx.textAlign = 'right';
    ctx.fillStyle = accent;
    ctx.font = 'bold 28px "Poppins", sans-serif';
    ctx.fillText('🍽️ Boisson', px + bw - 40, boxY + 65);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 34px "Poppins", sans-serif';
    const drinkText = selectedDrink.length ? selectedDrink.join(', ') : 'Non choisie';
    const drinkX = px + bw - 40;
    // Wrap si trop long
    const maxDrinkW = bw / 2 - 60;
    if (ctx.measureText(drinkText).width > maxDrinkW && selectedDrink.length > 1) {
      ctx.fillText(selectedDrink[0], drinkX, boxY + 130);
      ctx.fillText(selectedDrink.slice(1).join(', '), drinkX, boxY + 178);
    } else {
      ctx.fillText(drinkText, drinkX, boxY + 145);
    }
    ctx.textAlign = 'start';
    cursorY += boxH + 70;

    // QR Code
    const qrW = 420;
    const qrX = (W - qrW) / 2;
    const qrBoxH = qrW + 80;
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.strokeStyle = `${accent}66`;
    ctx.lineWidth = 3;
    drawRoundedRect(px, cursorY, W - 160, qrBoxH, 32);
    ctx.fill();
    ctx.stroke();
    if (qrCodeDataUrl) {
      try {
        const qrImg = await loadImage(qrCodeDataUrl);
        ctx.fillStyle = '#ffffff';
        drawRoundedRect(qrX, cursorY + 40, qrW, qrW, 28);
        ctx.fill();
        ctx.drawImage(qrImg, qrX + 25, cursorY + 65, qrW - 50, qrW - 50);
      } catch {}
    }
    cursorY += qrBoxH + 80;

    // Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '400 26px "Poppins", sans-serif';
    ctx.fillText('Réalisé par Furaha Digital', W / 2, H - 60);
    ctx.textAlign = 'start';

    // Export
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Invitation-${safeInvite.nom.replace(/\s+/g, '-')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {}
  }, [qrCodeDataUrl, safeInvite.nom, safeInvite.table, safeUserModel, selectedDrink]);

  // Animation de texte sÃ©curisÃ©e pour Safari
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
    
    // UI Optimiste : On change l'Ã©tat et on ouvre le modal immÃ©diatement
    setIsConfirmed(newStatus);
    setShowToastModal({
      isOpen: true,
      type: newStatus ? 'confirmation' : 'cancellation'
    });

    try {
      await InviteService.updateInvite(invite.userId, inviteId, { confirmed: newStatus });
    } catch (e) {
      console.error(e);
      // En cas d'erreur, on revient en arriÃ¨re et on ferme le modal
      setIsConfirmed(!newStatus);
      setShowToastModal({ isOpen: false, type: 'confirmation' });
      
      const notification = document.createElement('div');
      notification.className = 'fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-rose-500 text-white px-6 py-3 rounded-full shadow-2xl font-bold';
      notification.innerText = 'Erreur lors de la confirmation. Veuillez rÃ©essayer.';
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

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      return;
    }
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('L\'enregistrement audio n\'est pas supporté par votre navigateur');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mr: MediaRecorder;
      try {
        mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      } catch (e) {
        try {
          mr = new MediaRecorder(stream, { mimeType: 'audio/mp4' });
        } catch (e2) {
          mr = new MediaRecorder(stream);
        }
      }
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mr.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mr.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioBlob(audioBlob);
        setRecordedAudioUrl(url);
        const dur = (Date.now() - recordingStartTimeRef.current) / 1000;
        setAudioDuration(Math.round(dur));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      recordingStartTimeRef.current = Date.now();
      setRecordingTime(0);
      setIsRecording(true);
      setRecordedAudioBlob(null);
      setRecordedAudioUrl(null);
      setAudioDuration(0);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch (e) {
      console.error('Erreur enregistrement audio:', e);
      alert('Impossible d\'accéder au micro. Vérifiez les permissions.');
    }
  };

  const cancelRecording = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.removeEventListener('timeupdate', () => {});
      previewAudioRef.current.src = '';
    }
    if (previewProgressTickRef.current) {
      clearInterval(previewProgressTickRef.current);
      previewProgressTickRef.current = null;
    }
    setIsPreviewPlaying(false);
    setPreviewCurrentTime(0);
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    setAudioDuration(0);
    setRecordingTime(0);
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const progressTickRef = useRef<number | null>(null);
  const previewProgressTickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!recordedAudioUrl) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.src = '';
      }
      setIsPreviewPlaying(false);
      setPreviewCurrentTime(0);
      if (previewProgressTickRef.current) {
        clearInterval(previewProgressTickRef.current);
        previewProgressTickRef.current = null;
      }
      return;
    }
    const audio = new Audio(recordedAudioUrl);
    audio.preload = 'auto';
    previewAudioRef.current = audio;
    audio.onended = () => {
      setIsPreviewPlaying(false);
      setPreviewCurrentTime(audioDuration || 0);
      if (previewProgressTickRef.current) {
        clearInterval(previewProgressTickRef.current);
        previewProgressTickRef.current = null;
      }
      setForcePreviewRerender(x => x + 1);
    };
    audio.onpause = () => {
      setIsPreviewPlaying(false);
    };
    audio.onplay = () => {
      setIsPreviewPlaying(true);
    };
    audio.onloadedmetadata = () => {
      setForcePreviewRerender(x => x + 1);
      if (audio.duration && isFinite(audio.duration) && !audioDuration) {
        setAudioDuration(audio.duration);
      }
    };
    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', () => {});
      if (previewProgressTickRef.current) {
        clearInterval(previewProgressTickRef.current);
        previewProgressTickRef.current = null;
      }
    };
  }, [recordedAudioUrl]);

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current || !recordedAudioUrl) return;
    const audio = previewAudioRef.current;
    if (isPreviewPlaying) {
      audio.pause();
      setIsPreviewPlaying(false);
      if (previewProgressTickRef.current) {
        clearInterval(previewProgressTickRef.current);
        previewProgressTickRef.current = null;
      }
      return;
    }
    if (previewProgressTickRef.current) {
      clearInterval(previewProgressTickRef.current);
    }
    audio.play().then(() => {
      setIsPreviewPlaying(true);
    }).catch(e => console.error('Erreur lecture aperçu:', e));
    previewProgressTickRef.current = window.setInterval(() => {
      if (previewAudioRef.current) {
        setPreviewCurrentTime(previewAudioRef.current.currentTime || 0);
        setForcePreviewRerender(x => x + 1);
      }
    }, 150);
  };

  const seekPreviewAudio = (ratio: number) => {
    if (!previewAudioRef.current) return;
    const dur = (previewAudioRef.current.duration && isFinite(previewAudioRef.current.duration)) ? previewAudioRef.current.duration : (audioDuration || 0);
    if (!dur) return;
    try {
      previewAudioRef.current.currentTime = Math.max(0, Math.min(dur, ratio * dur));
      setPreviewCurrentTime(previewAudioRef.current.currentTime);
      setForcePreviewRerender(x => x + 1);
    } catch (e) {
      console.error(e);
    }
  };

  const playMessageAudio = (msg: any) => {
    if (!msg.audioUrl) return;
    if (currentlyPlayingMessageId === msg.id && isAudioPlaying) {
      if (messageAudioRef.current) {
        messageAudioRef.current.pause();
        setIsAudioPlaying(false);
      }
      return;
    }
    if (currentlyPlayingMessageId === msg.id && !isAudioPlaying && messageAudioRef.current && messageAudioRef.current.src) {
      messageAudioRef.current.play().then(() => {
        setIsAudioPlaying(true);
      }).catch(e => console.error('Erreur lecture audio:', e));
      return;
    }
    if (messageAudioRef.current) {
      messageAudioRef.current.pause();
      messageAudioRef.current.removeEventListener('timeupdate', () => {});
      messageAudioRef.current.src = '';
    }
    if (progressTickRef.current) {
      clearInterval(progressTickRef.current);
      progressTickRef.current = null;
    }
    const audio = new Audio(msg.audioUrl);
    messageAudioRef.current = audio;
    audio.onended = () => {
      setCurrentlyPlayingMessageId(null);
      setIsAudioPlaying(false);
      setCurrentAudioTime(0);
      if (progressTickRef.current) {
        clearInterval(progressTickRef.current);
        progressTickRef.current = null;
      }
      setForceAudioRerender(x => x + 1);
    };
    audio.onpause = () => {
      setIsAudioPlaying(false);
    };
    audio.onplay = () => {
      setCurrentlyPlayingMessageId(msg.id);
      setIsAudioPlaying(true);
    };
    audio.onloadedmetadata = () => {
      setForceAudioRerender(x => x + 1);
    };
    audio.play().catch(e => console.error('Erreur lecture audio:', e));
    if (progressTickRef.current) clearInterval(progressTickRef.current);
    progressTickRef.current = window.setInterval(() => {
      if (messageAudioRef.current) {
        setCurrentAudioTime(messageAudioRef.current.currentTime || 0);
        setForceAudioRerender(x => x + 1);
      }
    }, 150);
  };

  const seekMessageAudio = (msg: any, ratio: number) => {
    if (!messageAudioRef.current || currentlyPlayingMessageId !== msg.id) return;
    const dur = (messageAudioRef.current.duration && isFinite(messageAudioRef.current.duration)) ? messageAudioRef.current.duration : (msg.audioDuration || 0);
    if (!dur) return;
    try {
      messageAudioRef.current.currentTime = Math.max(0, Math.min(dur, ratio * dur));
      setCurrentAudioTime(messageAudioRef.current.currentTime);
      setForceAudioRerender(x => x + 1);
    } catch (e) {
      console.error(e);
    }
  };

  const getEffectiveAudioTime = (msg: any) => {
    if (currentlyPlayingMessageId !== msg.id || !messageAudioRef.current) return 0;
    return messageAudioRef.current.currentTime || 0;
  };

  const getEffectiveAudioDuration = (msg: any) => {
    if (currentlyPlayingMessageId === msg.id && messageAudioRef.current && messageAudioRef.current.duration && isFinite(messageAudioRef.current.duration)) {
      return messageAudioRef.current.duration;
    }
    return msg.audioDuration || 0;
  };

  const formatAudioTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = async () => {
    if (!inviteId) return;
    if (!guestMessage.trim() && !recordedAudioBlob && !recordedAudioUrl) return;
    const userId = invite?.userId || (userModel as any)?.userId;
    if (!userId) {
      const notification = document.createElement('div');
      notification.className = 'fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl font-bold animate-bounce';
      notification.innerText = 'Utilisateur non identifié';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
      return;
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.removeEventListener('timeupdate', () => {});
      previewAudioRef.current.src = '';
    }
    if (previewProgressTickRef.current) {
      clearInterval(previewProgressTickRef.current);
      previewProgressTickRef.current = null;
    }
    setIsPreviewPlaying(false);
    setPreviewCurrentTime(0);
    setIsSubmittingMessage(true);
    try {
      let finalAudioUrl: string | undefined;
      let finalDuration: number | undefined;
      if (recordedAudioBlob) {
        const fileName = `guest-audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.webm`;
        const sRef = storageRef(storage, `users/${userId}/invites/${inviteId}/guestMessages/${fileName}`);
        await uploadBytes(sRef, recordedAudioBlob);
        finalAudioUrl = await getDownloadURL(sRef);
        finalDuration = audioDuration;
      }
      await InviteService.createGuestMessage(userId, inviteId, guestMessage, finalAudioUrl, finalDuration);
      setGuestMessage('');
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioBlob(null);
      setRecordedAudioUrl(null);
      setAudioDuration(0);
      setRecordingTime(0);
      const notification = document.createElement('div');
      notification.className = 'fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl font-bold animate-bounce';
      notification.innerText = 'Message envoyé !';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    } catch (e) {
      console.error(e);
      const notification = document.createElement('div');
      notification.className = 'fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl font-bold animate-bounce';
      notification.innerText = 'Erreur lors de l\'envoi';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
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
      notification.innerText = 'Message modifiÃ© !';
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
      notification.innerText = 'Message supprimÃ© !';
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
    
    // PrÃ©parer l'heure au format HH:mm (remplacer 'h' par ':')
    const timeStr = (safeUserModel.eventTime || '00:00').replace('h', ':').padStart(5, '0');

    // 1. Essayer le format "7 janvier 2026" (Français long)
    const frenchMonths: { [key: string]: string } = {
      'janvier': '01', 'fevrier': '02', 'février': '02', 'mars': '03', 'avril': '04', 'mai': '05', 'juin': '06',
      'juillet': '07', 'aout': '08', 'août': '08', 'septembre': '09', 'octobre': '10', 'novembre': '11', 'decembre': '12', 'décembre': '12'
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

    // 2. Essayer les formats avec sÃ©parateurs (JJ/MM/AAAA, JJ.MM.AAAA, AAAA-MM-JJ)
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
          {/* Loader Ã©lÃ©gant */}
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
          <h2 className="text-xl font-bold text-slate-800 mb-2">Mise Ã  jour en coursâ€¦</h2>
          <p className="text-sm text-slate-500 mb-1 font-medium">
            {dataError}
          </p>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Nos Ã©quipes sont sur le pont. Merci de votre confiance â€” la page va tenter de se reconnecter automatiquement.
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

  // Si l'utilisateur utilise une invitation riche (HTML personnalisÃ©)
  if ((safeUserModel as any).useRichInvitation && (safeUserModel as any).richInvitationHTML) {
    return (
      <div 
        className="rich-invitation-container"
        dangerouslySetInnerHTML={{ __html: (safeUserModel as any).richInvitationHTML }}
      />
    );
  }

  // ===== SÃ‰LECTION DU LAYOUT (MULTI-MODÃˆLES) =====
  // Feature Flags & Whitelist pour protÃ©ger les utilisateurs actuels
  const FEATURE_FLAG_BOOK_ENABLED = true; // PASSER Ã€ true SEULEMENT APRÃˆS VALIDATION
  const BOOK_WHITELIST_UIDS: string[] = []; // Ajouter l'UID Firebase ici pour test utilisateur
  const rawLayout = (safeUserModel as any).customizations?.layout || 'default';
  const canUseBookLayout = FEATURE_FLAG_BOOK_ENABLED && (BOOK_WHITELIST_UIDS.length === 0 || BOOK_WHITELIST_UIDS.includes(safeUserModel.userId));
  const effectiveLayout = (canUseBookLayout && rawLayout === 'book') ? 'book' : 'default';

  // ===== Rendu selon layout =====
  if (effectiveLayout === 'book') {
    return (
      <BookLayout
        safeUserModel={safeUserModel}
        safeInvite={safeInvite}
        colors={colors}
        optimizedBg={optimizedBg}
        optimizedPattern={optimizedPattern}
        optimizedHeaderSectionBg={optimizedHeaderSectionBg}
        optimizedTextSectionBg={optimizedTextSectionBg}
        optimizedDateLocationSectionBg={optimizedDateLocationSectionBg}
        optimizedGallerySectionBg={optimizedGallerySectionBg}
        optimizedRsvpDrinksSectionBg={optimizedRsvpDrinksSectionBg}
        optimizedGamesSectionBg={optimizedGamesSectionBg}
        optimizedQrFooterSectionBg={optimizedQrFooterSectionBg}
        optimizedAccommodationSectionBg={optimizedAccommodationSectionBg}
        parallaxGalleryItems={parallaxGalleryItems}
        galleryPhotos={galleryPhotos}
        eventDay={eventDay}
        eventMonth={eventMonth}
        eventYear={eventYear}
        targetEventDate={targetEventDate}
        qrCodeDataUrl={qrCodeDataUrl}
        isOfflineMode={isOfflineMode}
        retryCountdown={retryCountdown}
        isConfirmed={isConfirmed}
        selectedDrink={selectedDrink}
        guestBookMessages={guestBookMessages}
        editingMessageId={editingMessageId}
        editingText={editingText}
        showDeleteConfirm={showDeleteConfirm}
        showToastModal={showToastModal}
        selectedGalleryPhoto={selectedGalleryPhoto}
        isMusicPlaying={isMusicPlaying}
        isMusicMuted={isMusicMuted}
        showNotificationModal={showNotificationModal}
        isFCMSupported={isFCMSupported}
        permission={permission}
        token={token}
        isNotificationLoading={isNotificationLoading}
        notificationError={error}
        showGuestBook={showGuestBook}
        currentGameId={currentGameId}
        games={games}
        gameResults={gameResults}
        completedGames={completedGames}
        invite={invite}
        inviteId={inviteId}
        userModel={userModel}
        isAdminView={isAdminView}
        isSubmittingMessage={isSubmittingMessage}
        guestMessage={guestMessage}
        sectionRefs={sectionRefs}
        audioRef={audioRef}
        messagesEndRef={messagesEndRef}
        setShowToastModal={setShowToastModal}
        setSelectedGalleryPhoto={setSelectedGalleryPhoto}
        setShowGuestBook={setShowGuestBook}
        setShowNotificationModal={setShowNotificationModal}
        setCurrentGameId={setCurrentGameId}
        setEditingMessageId={setEditingMessageId}
        setEditingText={setEditingText}
        setShowDeleteConfirm={setShowDeleteConfirm}
        setGuestMessage={setGuestMessage}
        toggleMute={toggleMute}
        requestPermission={requestPermission}
        inviteDocPath={inviteDocPath}
        handleConfirmation={handleConfirmation}
        handleDrinkSelection={handleDrinkSelection}
        handleSendMessage={handleSendMessage}
        handleEditMessage={handleEditMessage}
        handleSaveEdit={handleSaveEdit}
        handleDeleteMessage={handleDeleteMessage}
        confirmDelete={confirmDelete}
        downloadQRCode={downloadQRCode}
        downloadInvitationJpg={downloadInvitationJpg}
        optimizeImageFn={optimizeImage}
        isRecording={isRecording}
        recordedAudioUrl={recordedAudioUrl}
        recordingTime={recordingTime}
        audioDuration={audioDuration}
        currentlyPlayingMessageId={currentlyPlayingMessageId}
        isAudioPlaying={isAudioPlaying}
        toggleRecording={toggleRecording}
        cancelRecording={cancelRecording}
        playMessageAudio={playMessageAudio}
        formatAudioTime={formatAudioTime}
        seekMessageAudio={seekMessageAudio}
        getEffectiveAudioTime={getEffectiveAudioTime}
        getEffectiveAudioDuration={getEffectiveAudioDuration}
        currentAudioTime={currentAudioTime}
        forceAudioRerender={forceAudioRerender}
        isPreviewPlaying={isPreviewPlaying}
        previewCurrentTime={previewCurrentTime}
        togglePreviewPlay={togglePreviewPlay}
        seekPreviewAudio={seekPreviewAudio}
        forcePreviewRerender={forcePreviewRerender}
      />
    );
  }
  return (
    <ClassicScrollLayout
      safeUserModel={safeUserModel}
      safeInvite={safeInvite}
      colors={colors}
      optimizedBg={optimizedBg}
      optimizedPattern={optimizedPattern}
      optimizedHeaderSectionBg={optimizedHeaderSectionBg}
      optimizedTextSectionBg={optimizedTextSectionBg}
      optimizedDateLocationSectionBg={optimizedDateLocationSectionBg}
      optimizedGallerySectionBg={optimizedGallerySectionBg}
      optimizedRsvpDrinksSectionBg={optimizedRsvpDrinksSectionBg}
      optimizedGamesSectionBg={optimizedGamesSectionBg}
      optimizedQrFooterSectionBg={optimizedQrFooterSectionBg}
      optimizedAccommodationSectionBg={optimizedAccommodationSectionBg}
      parallaxGalleryItems={parallaxGalleryItems}
      galleryPhotos={galleryPhotos}
      eventDay={eventDay}
      eventMonth={eventMonth}
      eventYear={eventYear}
      targetEventDate={targetEventDate}
      qrCodeDataUrl={qrCodeDataUrl}
      isOfflineMode={isOfflineMode}
      retryCountdown={retryCountdown}
      isConfirmed={isConfirmed}
      selectedDrink={selectedDrink}
      guestBookMessages={guestBookMessages}
      editingMessageId={editingMessageId}
      editingText={editingText}
      showDeleteConfirm={showDeleteConfirm}
      showToastModal={showToastModal}
      selectedGalleryPhoto={selectedGalleryPhoto}
      isMusicPlaying={isMusicPlaying}
      isMusicMuted={isMusicMuted}
      showNotificationModal={showNotificationModal}
      isFCMSupported={isFCMSupported}
      permission={permission}
      token={token}
      isNotificationLoading={isNotificationLoading}
      notificationError={error}
      showGuestBook={showGuestBook}
      currentGameId={currentGameId}
      games={games}
      gameResults={gameResults}
      completedGames={completedGames}
      invite={invite}
      inviteId={inviteId}
      userModel={userModel}
      isAdminView={isAdminView}
      isSubmittingMessage={isSubmittingMessage}
      guestMessage={guestMessage}
      sectionRefs={sectionRefs}
      audioRef={audioRef}
      messagesEndRef={messagesEndRef}
      setShowToastModal={setShowToastModal}
      setSelectedGalleryPhoto={setSelectedGalleryPhoto}
      setShowGuestBook={setShowGuestBook}
      setShowNotificationModal={setShowNotificationModal}
      setCurrentGameId={setCurrentGameId}
      setEditingMessageId={setEditingMessageId}
      setEditingText={setEditingText}
      setShowDeleteConfirm={setShowDeleteConfirm}
      setGuestMessage={setGuestMessage}
      toggleMute={toggleMute}
      requestPermission={requestPermission}
      inviteDocPath={inviteDocPath}
      handleConfirmation={handleConfirmation}
      handleDrinkSelection={handleDrinkSelection}
      handleSendMessage={handleSendMessage}
      handleEditMessage={handleEditMessage}
      handleSaveEdit={handleSaveEdit}
      handleDeleteMessage={handleDeleteMessage}
      confirmDelete={confirmDelete}
      downloadQRCode={downloadQRCode}
      downloadInvitationJpg={downloadInvitationJpg}
      optimizeImageFn={optimizeImage}
      isRecording={isRecording}
      recordedAudioUrl={recordedAudioUrl}
      recordingTime={recordingTime}
      audioDuration={audioDuration}
      currentlyPlayingMessageId={currentlyPlayingMessageId}
      isAudioPlaying={isAudioPlaying}
      toggleRecording={toggleRecording}
      cancelRecording={cancelRecording}
      playMessageAudio={playMessageAudio}
      formatAudioTime={formatAudioTime}
      seekMessageAudio={seekMessageAudio}
      getEffectiveAudioTime={getEffectiveAudioTime}
      getEffectiveAudioDuration={getEffectiveAudioDuration}
      currentAudioTime={currentAudioTime}
      forceAudioRerender={forceAudioRerender}
      isPreviewPlaying={isPreviewPlaying}
      previewCurrentTime={previewCurrentTime}
      togglePreviewPlay={togglePreviewPlay}
      seekPreviewAudio={seekPreviewAudio}
      forcePreviewRerender={forcePreviewRerender}
    />
  );
};

export default InvitationPreview;
