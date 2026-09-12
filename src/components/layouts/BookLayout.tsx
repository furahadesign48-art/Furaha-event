import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import ornement5 from '../../images/ornement5.png';
import ornement6 from '../../images/ornement6.png';
import plume from '../../images/plume.png';
const fleurBordeaux = '/fleur_bordeaux.png';
const fleurDoree = '/fleur_doree.png';
import {
  Heart, MapPin, Users, Wine, QrCode, Check, Sparkles, Gift,
  X, Download, BookOpen, Send, Clock, Volume2, VolumeX,
  Gamepad2, Trophy, HelpCircle, Star, RefreshCw, Hotel, Mail,
  Globe, Plane, Train, Car, CarTaxiFront, ChevronRight, Info,
  ChevronLeft, ChevronRight as ChevronRightIcon, Calendar, Camera, Feather,
  CheckCircle2, AlertTriangle, PartyPopper
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

const PHOTO_VIDEO_RE = /\.(mp4|webm|mov|m4v|ogg|ogv|avi|mkv|flv|wmv|3gp)(\?.*)?$/i;
const isMediaVideo = (url: string) => PHOTO_VIDEO_RE.test(url.split('#')[0]);

const optimizeImage = (url: string, width: number = 800, quality: number = 70) => {
  if (!url) return '';
  if (isMediaVideo(url)) return url;
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', `/upload/w_${width},q_${quality},f_auto,c_limit/`);
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

const CalendrierJour: React.FC<{ day: string; targetEventDate: Date; colors: { BURG_MID: string; BURG_DARK: string }; }> = ({ day, targetEventDate, colors }) => {
  const jourNum = parseInt(day, 10) || 1;
  const year = targetEventDate.getFullYear();
  const month = targetEventDate.getMonth();
  const joursDansMois = new Date(year, month + 1, 0).getDate();
  const premierJourSemaine = new Date(year, month, 1).getDay();
  const decalage = premierJourSemaine === 0 ? 6 : premierJourSemaine - 1;
  const totalCells = Math.ceil((decalage + joursDansMois) / 7) * 7;
  const cells: (number | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const jourReel = i - decalage + 1;
    if (jourReel < 1 || jourReel > joursDansMois) cells.push(null);
    else cells.push(jourReel);
  }
  const { BURG_MID, BURG_DARK } = colors;
  return (
    <div className="grid grid-cols-7 gap-1">
      {cells.map((j, idx) => {
        const isEvent = j === jourNum;
        return (
          <div key={idx} className="flex items-center justify-center aspect-square">
            {j === null ? (
              <div className="w-full h-full" />
            ) : isEvent ? (
              <div
                className="relative w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] rounded-full flex items-center justify-center"
                style={{
                  background: `radial-gradient(circle at 32% 28%, ${BURG_MID} 0%, ${BURG_DARK} 100%)`,
                  boxShadow: `0 3px 8px -2px rgba(90,15,44,0.55), inset 0 1px 0 rgba(255,255,255,0.25)`,
                }}
              >
                <span className="text-[10.5px] sm:text-[11.5px] font-black text-white" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.25)' }}>
                  {j}
                </span>
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-yellow-400 border border-white" />
              </div>
            ) : (
              <span className="text-[10px] sm:text-[11px] font-medium" style={{ color: '#5c4a36', opacity: 0.85 }}>
                {j}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

const FallingDots: React.FC<{ colors: { primary: string; secondary: string; accent?: string } }> = ({ colors }) => {
  const dotColors = [colors.primary, colors.secondary, colors.accent || '#ffffff'];
  return (
    <>
      <style>{`@keyframes fallbook { 0% { transform: translateY(0); opacity: 0.8; } 100% { transform: translateY(100vh); opacity: 0; } }`}</style>
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-1">
        {Array.from({ length: 20 }).map((_, i) => {
          const left = Math.random() * 100;
          const delay = Math.random() * 10;
          const duration = 5 + Math.random() * 10;
          const size = 4 + Math.random() * 8;
          const color = dotColors[Math.floor(Math.random() * dotColors.length)];
          return <div key={i} className="absolute rounded-full" style={{ left: `${left}%`, top: '-20px', width: `${size}px`, height: `${size}px`, backgroundColor: color, animationName: 'fallbook', animationDelay: `${delay}s`, animationDuration: `${duration}s`, animationFillMode: 'forwards', animationIterationCount: 'infinite', opacity: 0.8 }}></div>;
        })}
      </div>
    </>
  );
};

const PhotoViewer: React.FC<{ photos?: string[]; initialPhoto: string; onClose: () => void; optimizeImage: (url: string, w: number, q?: number) => string; themeColors: { primary: string; secondary: string; accent?: string; }; }> = ({ photos = [], initialPhoto, onClose, optimizeImage, themeColors }) => {
  const safePhotos = Array.isArray(photos) && photos.length > 0 ? photos : [initialPhoto || ''];
  const safeInitial = initialPhoto || safePhotos[0] || '';
  const safeThemeColors = themeColors || { primary: '#f59e0b', secondary: '#d946ef', accent: '#fbbf24' };
  const [loaded, setLoaded] = useState(false);
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const mountedRef = React.useRef(false);
  const { primary, secondary } = safeThemeColors;
  const accent = safeThemeColors.accent || secondary;
  const isVideo = isMediaVideo(safeInitial);
  const lighter = (hex: string, amt = 0.22) => { try { const c = (hex || '#').replace("#", ""); if (c.length < 6) return hex || '#ffffff'; const r = parseInt(c.substring(0, 2), 16); const g = parseInt(c.substring(2, 4), 16); const b = parseInt(c.substring(4, 6), 16); return `rgb(${Math.min(255, Math.round(r + (255 - r) * amt))}, ${Math.min(255, Math.round(g + (255 - g) * amt))}, ${Math.min(255, Math.round(b + (255 - b) * amt))})`; } catch { return hex || '#ffffff'; } };
  const darker = (hex: string, amt = 0.2) => { try { const c = (hex || '#').replace("#", ""); if (c.length < 6) return hex || '#000000'; const r = parseInt(c.substring(0, 2), 16); const g = parseInt(c.substring(2, 4), 16); const b = parseInt(c.substring(4, 6), 16); return `rgb(${Math.max(0, Math.round(r * (1 - amt)))}, ${Math.max(0, Math.round(g * (1 - amt)))}, ${Math.max(0, Math.round(b * (1 - amt)))})`; } catch { return hex || '#000000'; } };
  const glow1 = lighter(primary, 0.35); const glow2 = lighter(secondary, 0.35); const glow3 = accent ? lighter(accent, 0.45) : lighter(primary, 0.5);
  const shadowColor1 = darker(primary, 0.05); const shadowColor2 = darker(secondary, 0.08);
  const finalSrc = isVideo ? safeInitial : useMemo(() => optimizeImage(safeInitial, 1600, 85), [safeInitial, optimizeImage]);
  const handleClose = useCallback(() => { if (closing) return; setClosing(true); window.setTimeout(() => { if (mountedRef.current) onClose(); }, 520); }, [closing, onClose]);
  useEffect(() => { mountedRef.current = true; if (isVideo) { setLoaded(true); } else { try { const img = new Image(); img.src = finalSrc; img.onload = () => { if (mountedRef.current) setLoaded(true); }; img.onerror = () => { if (mountedRef.current) setLoaded(true); }; } catch { } } const raf = requestAnimationFrame(() => { requestAnimationFrame(() => { requestAnimationFrame(() => setEntered(true)); }); }); return () => { mountedRef.current = false; cancelAnimationFrame(raf); }; }, [finalSrc, isVideo]);
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [handleClose]);
  useEffect(() => { const prev = document.body.style.overflow; const prevTouch = document.body.style.touchAction as string | undefined; document.body.style.overflow = "hidden"; document.body.style.touchAction = "none"; return () => { document.body.style.overflow = prev; if (prevTouch !== undefined) document.body.style.touchAction = prevTouch; else (document.body.style as any).touchAction = ""; }; }, []);
  const show = entered && !closing;
  const enterFactor = show ? 1 : 0;
  return (
    <div className={"fixed inset-0 z-[110] flex items-center justify-center will-change-[backdrop-filter,opacity,background-color] "} onClick={handleClose} style={{ opacity: enterFactor, transition: "opacity 520ms cubic-bezier(0.22, 1, 0.36, 1), backdrop-filter 620ms cubic-bezier(0.22, 1, 0.36, 1), background-color 620ms cubic-bezier(0.22, 1, 0.36, 1), -webkit-backdrop-filter 620ms cubic-bezier(0.22, 1, 0.36, 1)", backdropFilter: show ? `blur(30px) saturate(145%)` : `blur(0px) saturate(100%)`, WebkitBackdropFilter: show ? `blur(30px) saturate(145%)` : `blur(0px) saturate(100%)`, backgroundColor: show ? "rgba(0,0,0,0.74)" : "rgba(0,0,0,0)", backgroundImage: show ? `radial-gradient(ellipse at center, ${darker(primary, 0.82)} 0%, rgba(0,0,0,0.88) 100%)` : "none" }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: 0.55 * enterFactor, transition: "opacity 600ms ease-out" }}>
        <div className="absolute -top-24 -left-20 w-[30rem] h-[30rem] rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${glow1} 0%, transparent 68%)` }} />
        <div className="absolute -bottom-28 -right-14 w-[34rem] h-[34rem] rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${glow2} 0%, transparent 68%)` }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-[28rem] h-[28rem] rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${glow3} 0%, transparent 72%)` }} />
      </div>
      <button onClick={(e) => { e.stopPropagation(); handleClose(); }} className="absolute top-4 sm:top-6 right-4 sm:right-6 w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white z-[120] will-change-transform active:scale-95" style={{ opacity: 0.2 + 0.8 * enterFactor, transform: `scale(${0.7 + 0.3 * enterFactor})`, transition: "transform 520ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms ease-out, background-color 200ms ease-out, box-shadow 200ms ease-out", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: `1px solid ${lighter(primary, 0.5)}33`, boxShadow: `0 10px 30px -10px ${darker(primary, 0.3)}66, 0 8px 24px -12px rgba(0,0,0,0.55)` }} aria-label="Fermer"><X className="h-6 w-6 sm:h-7 sm:w-7" /></button>
      <div className="relative px-3 sm:px-6 md:px-10 py-4 sm:py-8 max-w-full max-h-full flex items-center justify-center z-[115] will-change-transform" style={{ transform: `scale(${0.7 + 0.3 * enterFactor}) translateY(${(-18) * (1 - enterFactor)}px)`, opacity: 0.15 + 0.85 * enterFactor, transformOrigin: "center center", transition: "transform 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 520ms ease-out" }} onClick={(e) => e.stopPropagation()}>
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden" style={{ boxShadow: show ? `0 45px 140px -20px ${shadowColor1}55, 0 30px 80px -18px ${shadowColor2}55, 0 25px 70px -12px rgba(0,0,0,0.85)` : "0 10px 30px -10px rgba(0,0,0,0.5)", border: `1px solid ${lighter(primary, 0.55)}22`, transition: "box-shadow 700ms cubic-bezier(0.22, 1, 0.36, 1), border-color 500ms ease-out" }}>
          {!loaded && <div className="absolute inset-0 rounded-2xl sm:rounded-3xl z-10" style={{ background: `linear-gradient(90deg, ${lighter(primary, 0.75)}10, ${lighter(secondary, 0.7)}22, ${lighter(primary, 0.75)}10)`, backgroundSize: "200% 100%", animation: "shimmerX 1.6s ease-in-out infinite", opacity: enterFactor, transition: "opacity 300ms ease-out" }} />}
          {isVideo ? (
            <video
              src={finalSrc}
              controls
              autoPlay
              playsInline
              muted
              loop
              className={"max-w-full w-auto h-auto object-contain select-none will-change-[opacity,transform] bg-black"}
              style={{ maxHeight: "min(84vh, 900px)", transform: `scale(${0.96 + 0.04 * (loaded ? enterFactor : 0.2)})`, opacity: loaded ? (0.4 + 0.6 * enterFactor) : 0, filter: `saturate(${0.92 + 0.08 * enterFactor}) contrast(${0.96 + 0.04 * enterFactor})`, transition: "opacity 480ms ease-out, transform 820ms cubic-bezier(0.22, 1, 0.36, 1), filter 620ms ease-out" }}
            />
          ) : (
            <img src={finalSrc} alt="Agrandissement photo" onLoad={() => setLoaded(true)} onError={() => setLoaded(true)} className={"max-w-full w-auto h-auto object-contain select-none will-change-[opacity,transform] "} style={{ maxHeight: "min(84vh, 900px)", transform: `scale(${0.96 + 0.04 * (loaded ? enterFactor : 0.2)})`, opacity: loaded ? (0.4 + 0.6 * enterFactor) : 0, filter: `saturate(${0.92 + 0.08 * enterFactor}) contrast(${0.96 + 0.04 * enterFactor})`, transition: "opacity 480ms ease-out, transform 820ms cubic-bezier(0.22, 1, 0.36, 1), filter 620ms ease-out" }} draggable={false} loading="eager" decoding="async" />
          )}
          <div className="absolute inset-0 pointer-events-none rounded-2xl sm:rounded-3xl" style={{ boxShadow: `inset 0 0 140px ${darker(primary, 0.8)}33, inset 0 0 60px rgba(0,0,0,0.3)`, opacity: enterFactor, transition: "opacity 520ms ease-out" }} />
        </div>
      </div>
      <style>{`@keyframes shimmerX { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
};

export interface BookLayoutProps {
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
}

const BookLayout: React.FC<BookLayoutProps> = (props) => {
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
    confirmDelete, downloadQRCode, optimizeImageFn
  } = props;

  const accommodationVisible =
    ((safeUserModel as any).accommodationEnabled && Array.isArray((safeUserModel as any).accommodations) && (safeUserModel as any).accommodations.length > 0) ||
    ((safeUserModel as any).usefulAddressesEnabled && Array.isArray((safeUserModel as any).usefulAddresses) && (safeUserModel as any).usefulAddresses.length > 0);
  const couplePhotoEnabled = (safeUserModel as any).couplePhotoEnabled !== false;
  const invitationTextEnabled = (safeUserModel as any).invitationTextEnabled !== false;
  const countdownEnabled = (safeUserModel as any).countdownEnabled !== false;
  const galleryEnabled = (safeUserModel as any).galleryEnabled !== false;
  const rsvpEnabled = (safeUserModel as any).rsvpEnabled !== false;
  const drinksEnabled = (safeUserModel as any).drinksEnabled !== false;
  const gamesEnabledGlobal = (safeUserModel as any).gamesEnabled !== false;
  const gamesVisible = gamesEnabledGlobal && games && games.filter((g: GameConfiguration) => g.isEnabled).length > 0;
  const rsvpDrinksVisible = rsvpEnabled || drinksEnabled;

  const [showRsvpConfirm, setShowRsvpConfirm] = useState<null | 'yes' | 'no'>(null);
  const [isConfirmingRsvp, setIsConfirmingRsvp] = useState(false);
  const [showGuestBookViewer, setShowGuestBookViewer] = useState(false);

  const sectionDefinitions = useMemo(() => {
    const sections: string[] = ['cover'];
    if (couplePhotoEnabled) sections.push('couplePhoto');
    if (invitationTextEnabled) sections.push('invitationText');
    sections.push('invitation');
    if (countdownEnabled) sections.push('countdown');
    if (accommodationVisible) sections.push('accommodation');
    if (galleryEnabled) sections.push('gallery');
    if (rsvpDrinksVisible) sections.push('rsvp');
    if (gamesVisible) sections.push('games');
    sections.push('qr');
    return sections;
  }, [accommodationVisible, gamesVisible, couplePhotoEnabled, invitationTextEnabled, countdownEnabled, galleryEnabled, rsvpDrinksVisible]);

  const totalSections = sectionDefinitions.length;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const wheelLockUntil = useRef<number>(0);
  const [lastDirection, setLastDirection] = useState<'next' | 'prev'>('next');
  const [envelopeOpening, setEnvelopeOpening] = useState(false);
  const [envelopeOpened, setEnvelopeOpened] = useState(false);

  const sectionBgImage = (idx: number): string | null => {
    switch (sectionDefinitions[idx]) {
      case 'cover': return optimizedHeaderSectionBg || optimizedBg;
      case 'couplePhoto': return null;
      case 'invitationText': return optimizedTextSectionBg;
      case 'invitation': return optimizedTextSectionBg;
      case 'countdown': return optimizedDateLocationSectionBg;
      case 'accommodation': return optimizedAccommodationSectionBg;
      case 'gallery': return optimizedGallerySectionBg;
      case 'rsvp': return optimizedRsvpDrinksSectionBg;
      case 'games': return optimizedGamesSectionBg;
      case 'qr': return optimizedQrFooterSectionBg;
      default: return optimizedBg;
    }
  };

  const lighter = (hex: string, amt = 0.22) => {
    try {
      const c = hex.replace("#", "");
      const r = parseInt(c.substring(0, 2), 16);
      const g = parseInt(c.substring(2, 4), 16);
      const b = parseInt(c.substring(4, 6), 16);
      return `rgb(${Math.min(255, Math.round(r + (255 - r) * amt))}, ${Math.min(255, Math.round(g + (255 - g) * amt))}, ${Math.min(255, Math.round(b + (255 - b) * amt))})`;
    } catch { return hex; }
  };
  const darker = (hex: string, amt = 0.2) => {
    try {
      const c = hex.replace("#", "");
      const r = parseInt(c.substring(0, 2), 16);
      const g = parseInt(c.substring(2, 4), 16);
      const b = parseInt(c.substring(4, 6), 16);
      return `rgb(${Math.max(0, Math.round(r * (1 - amt)))}, ${Math.max(0, Math.round(g * (1 - amt)))}, ${Math.max(0, Math.round(b * (1 - amt)))})`;
    } catch { return hex; }
  };

  const goToSection = useCallback((index: number, direction?: 'next' | 'prev') => {
    if (index < 0 || index >= totalSections) return;
    if (isNavigating || index === activeSection) return;
    setLastDirection(direction ?? (index > activeSection ? 'next' : 'prev'));
    setIsNavigating(true);
    setActiveSection(index);
    window.setTimeout(() => setIsNavigating(false), 480);
  }, [totalSections, isNavigating, activeSection]);

  const scrollToSection = useCallback((index: number) => {
    goToSection(index);
  }, [goToSection]);

  const nextSection = useCallback(() => goToSection(activeSection + 1, 'next'), [activeSection, goToSection]);
  const prevSection = useCallback(() => goToSection(activeSection - 1, 'prev'), [activeSection, goToSection]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now < wheelLockUntil.current) { e.preventDefault(); return; }
      const delta = e.deltaY;
      if (Math.abs(delta) < 18) return;
      if (isNavigating) return;
      const target = delta > 0 ? activeSection + 1 : activeSection - 1;
      if (target < 0 || target >= totalSections) return;
      wheelLockUntil.current = now + 520;
      e.preventDefault();
      goToSection(target, delta > 0 ? 'next' : 'prev');
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) touchStartY.current = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const start = touchStartY.current;
      touchStartY.current = null;
      if (start === null || isNavigating) return;
      const end = e.changedTouches[0]?.clientY ?? start;
      const dy = start - end;
      if (Math.abs(dy) < 48) return;
      const target = dy > 0 ? activeSection + 1 : activeSection - 1;
      if (target < 0 || target >= totalSections) return;
      goToSection(target, dy > 0 ? 'next' : 'prev');
    };
    const onKey = (e: KeyboardEvent) => {
      if (isNavigating) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToSection(activeSection + 1, 'next');
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        goToSection(activeSection - 1, 'prev');
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToSection(0, 'prev');
      } else if (e.key === 'End') {
        e.preventDefault();
        goToSection(totalSections - 1, 'next');
      }
    };

    scroller.addEventListener('wheel', onWheel, { passive: false });
    scroller.addEventListener('touchstart', onTouchStart, { passive: true });
    scroller.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      scroller.removeEventListener('wheel', onWheel);
      scroller.removeEventListener('touchstart', onTouchStart);
      scroller.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKey);
    };
  }, [totalSections, activeSection, isNavigating, goToSection]);

  const renderPage = (pageType: string, sectionIdx: number) => {
    const BURG_DARK = '#5a0f2c';
    const BURG_MID = '#7a1f3e';
    const BURG_SOFT = '#9a3458';
    const CREAM = '#faf5ec';
    const CREAM_SOFT = '#f7efe2';
    const CREAM_DEEP = '#f5efe2';
    const GOLD = '#c89b2f';
    const GOLD_LIGHT = '#d9b35a';

    switch (pageType) {
      case 'cover': {
        const titleRaw = safeUserModel.title || 'Wesley & Lina';
        const parts = titleRaw.split(/\s*(?:&|et|and|·|•|–|-)\s*/i).map(s => s.trim()).filter(Boolean);
        const firstNameA = parts[0] || 'Alexander';
        const firstNameB = parts[1] || 'Isabella';
        const locationLine = safeInvite.lieu || safeInvite.eventLocation || 'Unis pour la vie';

        const scallopPath = (() => {
          const W = 400, H = 480;
          const pts: string[] = [];
          const bumpsTopBottom = 10, bumpsSides = 12;
          const amp = 10;
          for (let i = 0; i <= bumpsTopBottom; i++) {
            const x = (i / bumpsTopBottom) * W;
            const y = amp * (1 - Math.cos((i / bumpsTopBottom) * Math.PI * 2)) / 2;
            pts.push(`${x === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`);
          }
          for (let i = 1; i <= bumpsSides; i++) {
            const t = i / bumpsSides;
            const y = H * t;
            const x = W + (amp * (1 - Math.cos(t * Math.PI * 2))) / 2;
            pts.push(`L${x.toFixed(2)},${y.toFixed(2)}`);
          }
          for (let i = bumpsTopBottom - 1; i >= 0; i--) {
            const t = i / bumpsTopBottom;
            const x = W * t;
            const y = H - (amp * (1 - Math.cos(t * Math.PI * 2))) / 2;
            pts.push(`L${x.toFixed(2)},${y.toFixed(2)}`);
          }
          for (let i = bumpsSides - 1; i >= 1; i--) {
            const t = i / bumpsSides;
            const y = H * t;
            const x = 0 + (amp * (1 - Math.cos(t * Math.PI * 2))) / 2;
            pts.push(`L${x.toFixed(2)},${y.toFixed(2)}`);
          }
          return pts.join(' ') + ' Z';
        })();

        const innerScallop = (() => {
          const pad = 22, amp = 6;
          const W = 400 - pad * 2, H = 480 - pad * 2;
          const bumpsTB = 10, bumpsSD = 12;
          const pts: string[] = [];
          for (let i = 0; i <= bumpsTB; i++) {
            const x = pad + (i / bumpsTB) * W;
            const y = pad + (amp * (1 - Math.cos((i / bumpsTB) * Math.PI * 2))) / 2;
            pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`);
          }
          for (let i = 1; i <= bumpsSD; i++) {
            const t = i / bumpsSD;
            const y = pad + H * t;
            const x = pad + W + (amp * (1 - Math.cos(t * Math.PI * 2))) / 2;
            pts.push(`L${x.toFixed(2)},${y.toFixed(2)}`);
          }
          for (let i = bumpsTB - 1; i >= 0; i--) {
            const t = i / bumpsTB;
            const x = pad + W * t;
            const y = pad + H - (amp * (1 - Math.cos(t * Math.PI * 2))) / 2;
            pts.push(`L${x.toFixed(2)},${y.toFixed(2)}`);
          }
          for (let i = bumpsSD - 1; i >= 1; i--) {
            const t = i / bumpsSD;
            const y = pad + H * t;
            const x = pad + (amp * (1 - Math.cos(t * Math.PI * 2))) / 2;
            pts.push(`L${x.toFixed(2)},${y.toFixed(2)}`);
          }
          return pts.join(' ') + ' Z';
        })();

        return (
          <div className="relative w-full py-10 sm:py-12 px-4 sm:px-6 overflow-visible" style={{
            background: `linear-gradient(180deg, ${CREAM} 0%, #f9f2e4 100%)`,
          }}>
            <div className="relative mx-auto max-w-[380px] flex flex-col items-center">

              {/* =============== ENVELOPPE BORDEAUX OUVERTE =============== */}
              <div className="relative w-full aspect-[4/4.2] mb-[-28px] sm:mb-[-32px] z-20">
                {/* === CORPS DE L'ENVELOPPE (rectangle bordeaux) */}
                <div className="absolute inset-x-[5%] bottom-0 top-[38%]" style={{
                  background: `linear-gradient(180deg, ${BURG_MID} 0%, ${BURG_DARK} 100%)`,
                  boxShadow: `
                    inset 0 2px 6px rgba(255,255,255,0.07),
                    0 26px 50px -22px rgba(90,15,44,0.6),
                    0 4px 10px -4px rgba(0,0,0,0.15)
                  `,
                }} />

                {/* === RABAT TRIANGULAIRE OUVERT (BORDEAUX, pointant vers le haut) */}
                <div className="absolute inset-x-[5%] top-0 h-[58%]" style={{
                  background: `linear-gradient(180deg, #8a2548 0%, ${BURG_MID} 55%, ${BURG_DARK} 100%)`,
                  clipPath: 'polygon(0 100%, 50% 0, 100% 100%)',
                  boxShadow: `inset 0 2px 5px rgba(255,255,255,0.08), 0 8px 18px -10px rgba(90,15,44,0.5)`,
                  zIndex: 2,
                }} />

                {/* === INTERIEUR DE L'ENVELOPPE (fond vert + fleurs visibles dans l'ouverture) */}
                <div className="absolute inset-x-[9%] top-[8%] h-[44%] overflow-hidden" style={{
                  zIndex: 1,
                }}>
                  {/* Fond vert mousse comme dans la maquette */}
                  <div className="absolute inset-0" style={{
                    background: `linear-gradient(135deg, #6b7a55 0%, #556144 45%, #4a5438 100%)`,
                    boxShadow: `inset 0 0 30px rgba(0,0,0,0.28)`,
                  }} />
                  {/* Grandes fleurs (pivoines/roses) dans l'intérieure */}
                  <div className="absolute -top-[8%] -left-[10%] w-[78%] h-[120%] pointer-events-none" style={{ transform: 'rotate(-6deg)' }}>
                    <img src={fleurBordeaux} alt="" className="w-full h-full object-contain" style={{ filter: 'saturate(1.2) brightness(0.92) drop-shadow(0 4px 8px rgba(0,0,0,0.35))' }} loading="lazy" />
                  </div>
                  <div className="absolute -top-[4%] -right-[12%] w-[65%] h-[110%] pointer-events-none" style={{ transform: 'rotate(14deg) scaleX(-1)' }}>
                    <img src={fleurDoree} alt="" className="w-full h-full object-contain" style={{ filter: 'saturate(1.25) brightness(1.05) drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }} loading="lazy" />
                  </div>
                </div>

                {/* === SCEAU DE CIRE DORE — sur la pointe basse du rabat */}
                <div className="absolute left-1/2 top-[43%] -translate-x-1/2 -translate-y-1/2 z-30">
                  <div className="relative w-[70px] h-[70px] sm:w-[80px] sm:h-[80px]">
                    <div className="absolute inset-0 rounded-full" style={{
                      background: `radial-gradient(circle at 32% 26%, ${GOLD_LIGHT} 0%, ${GOLD} 48%, #8e6a1c 100%)`,
                      boxShadow: `
                        0 8px 18px rgba(90,15,44,0.5),
                        0 0 0 1px rgba(90,15,44,0.18) inset,
                        0 2px 4px rgba(255,255,255,0.32) inset
                      `,
                    }} />
                    <div className="absolute inset-[14%] rounded-full" style={{
                      border: `1.5px solid rgba(142,106,28,0.55)`,
                    }} />
                    <div className="absolute inset-[24%] rounded-full flex items-center justify-center" style={{
                      border: `0.8px solid rgba(142,106,28,0.4)`,
                      color: '#7a5a15',
                    }}>
                      <span className="font-serif font-black italic text-lg sm:text-xl" style={{
                        textShadow: '0 1px 0 rgba(255,255,255,0.4)',
                      }}>
                        {(firstNameA.charAt(0) + firstNameB.charAt(0)).toUpperCase()}
                      </span>
                    </div>
                    <div className="absolute top-[14%] left-[18%] w-[26%] h-[14%] rounded-[50%]" style={{
                      background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.6), transparent 70%)',
                    }} />
                  </div>
                </div>

                {/* === BRIN DE FLEURS SORTANT DU COIN HAUT DROIT */}
                <div className="absolute -top-[6%] -right-[6%] z-40 pointer-events-none select-none w-[150px] h-[170px]" style={{ transform: 'rotate(18deg)' }}>
                  <img src={fleurDoree} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.35)) saturate(1.1)' }} loading="lazy" />
                </div>
              </div>

              {/* =============== CARTE ORNÉE — BORDS CHANTOURNÉS =============== */}
              <div className="relative w-[96%] z-10">
                {/* Ombre portée diffuse sous la carte */}
                <div className="absolute inset-x-[8%] bottom-[-8px] h-[24px]" style={{
                  background: `radial-gradient(ellipse at center, rgba(90,15,44,0.28) 0%, transparent 70%)`,
                  filter: 'blur(5px)',
                }} />

                {/* Carte principale : SVG avec bords chantournés (scallops) */}
                <div className="relative w-full">
                  <svg viewBox="0 0 400 480" className="w-full h-auto block" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
                    <defs>
                      <filter id="cover-card-shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#5a0f2c" floodOpacity="0.28" />
                        <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#000" floodOpacity="0.08" />
                      </filter>
                      <linearGradient id="cover-card-bg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fdfbf6" />
                        <stop offset="100%" stopColor="#f3ebd8" />
                      </linearGradient>
                      <pattern id="cover-filigree" patternUnits="userSpaceOnUse" width="28" height="28">
                        <path d="M14 2 C 18 8, 18 20, 14 26 M2 14 C 8 10, 20 10, 26 14 M14 10 A 4 4 0 1 0 14 18 A 4 4 0 1 0 14 10" stroke="#9c7a3a" strokeWidth="0.5" fill="none" opacity="0.42" />
                      </pattern>
                      <radialGradient id="cover-emboss-inner" cx="50%" cy="50%" r="50%">
                        <stop offset="86%" stopColor="transparent" />
                        <stop offset="92%" stopColor="#e8dcc0" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#c9b890" stopOpacity="0.1" />
                      </radialGradient>
                    </defs>

                    {/* Couche externe : ombre + fond ivoire avec bords chantournés */}
                    <path d={scallopPath} fill="url(#cover-card-bg)" filter="url(#cover-card-shadow)" />
                    {/* Liseré intérieur double bordure fine */}
                    <path d={scallopPath} fill="none" stroke="#8a6a2a" strokeOpacity="0.25" strokeWidth="1.2" transform="translate(0,0)" />
                    <path d={innerScallop} fill="url(#cover-emboss-inner)" />
                    {/* Double filet orné avec pattern */}
                    <path d={innerScallop} fill="none" stroke="#7a1f3e" strokeOpacity="0.22" strokeWidth="1" />
                    <g opacity="0.35">
                      <path d={innerScallop} fill="none" stroke="url(#cover-filigree)" strokeWidth="14" transform="" />
                    </g>

                    {/* 4 ornements de coins (rosaces) dans les angles intérieurs */}
                    {[
                      { cx: 62, cy: 62, r: -20 },
                      { cx: 338, cy: 62, r: 20, sx: -1 },
                      { cx: 62, cy: 418, r: 200 },
                      { cx: 338, cy: 418, r: 160, sx: -1 },
                    ].map((c, i) => (
                      <g key={i} transform={`translate(${c.cx},${c.cy}) rotate(${c.r}) scale(${c.sx ?? 1},1)`} opacity="0.55">
                        <path d="M0,-22 C8,-14 14,-8 20,0 C14,8 8,14 0,22 C-8,14 -14,8 -20,0 C-14,-8 -8,-14 0,-22 Z" fill="none" stroke="#7a1f3e" strokeWidth="0.8" />
                        <circle r="4.5" fill="none" stroke="#c89b2f" strokeWidth="0.8" />
                        <circle r="2" fill="#c89b2f" />
                        <path d="M0,-14 L0,-22 M0,14 L0,22 M-14,0 L-22,0 M14,0 L22,0" stroke="#7a1f3e" strokeWidth="0.7" strokeLinecap="round" />
                      </g>
                    ))}
                  </svg>

                  {/* Contenu texte centré dans la carte */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-[14%] py-[17%]">
                    {/* Pré-titre : JOIN US FOR THE WEDDING OF */}
                    <div className="mb-2 sm:mb-3 flex flex-col items-center gap-0.5">
                      <p className="font-serif uppercase text-[11px] sm:text-[13px] font-light tracking-[0.28em]" style={{ color: '#4a3a2a', letterSpacing: '0.28em' }}>
                      {safeUserModel.preTitle || 'Notre plus'}
                      </p>
                      <p className="font-serif uppercase text-[11px] sm:text-[13px] font-light tracking-[0.3em]" style={{ color: '#4a3a2a', letterSpacing: '0.3em' }}>
                        {safeUserModel.preTitle2 || 'beau jour'}
                      </p>
                    </div>

                    {/* Séparateur petit ornement */}
                    <div className="mb-2 flex items-center gap-1.5 opacity-70">
                      <div className="w-5 h-px" style={{ background: `${BURG_MID}` }} />
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: BURG_MID }} />
                      <div className="w-5 h-px" style={{ background: `${BURG_MID}` }} />
                    </div>

                    {/* PRENOM 1 — grande calligraphie */}
                    <h1 className="font-luxury leading-[0.95] text-center" style={{
                      fontSize: 'clamp(3.2rem, 9.5vw, 4.2rem)',
                      color: '#2a0818',
                      fontWeight: 500,
                      letterSpacing: '-0.01em',
                    }}>
                      {firstNameA}
                    </h1>

                    {/* & orné */}
                    <div className="my-1.5 sm:my-2.5 flex items-center gap-3">
                      <div className="h-px w-10 sm:w-12" style={{ background: `linear-gradient(90deg, transparent, ${BURG_MID}55)`, opacity: 0.7 }} />
                      <span className="font-serif italic text-3xl sm:text-4xl" style={{ color: BURG_MID }}>&</span>
                      <div className="h-px w-10 sm:w-12" style={{ background: `linear-gradient(90deg, ${BURG_MID}55, transparent)`, opacity: 0.7 }} />
                    </div>

                    {/* PRENOM 2 */}
                    <h1 className="font-luxury leading-[0.95] text-center" style={{
                      fontSize: 'clamp(3.2rem, 9.5vw, 4.2rem)',
                      color: '#2a0818',
                      fontWeight: 500,
                      letterSpacing: '-0.01em',
                    }}>
                      {firstNameB}
                    </h1>

                    {/* Séparateur + lieu */}
                    <div className="mt-4 sm:mt-6 w-full flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 opacity-75">
                        <div className="w-8 h-px" style={{ background: `${BURG_MID}66` }} />
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M6 1 L 7.2 4.6 L 11 4.8 L 8 7.2 L 9 11 L 6 8.8 L 3 11 L 4 7.2 L 1 4.8 L 4.8 4.6 Z" fill={BURG_MID} />
                        </svg>
                        <div className="w-8 h-px" style={{ background: `${BURG_MID}66` }} />
                      </div>
                      <p className="font-serif italic text-[13px] sm:text-[16px] text-center leading-snug" style={{
                        color: '#5a3c2a',
                      }}>
                        {locationLine}
                      </p>
                    </div>
                  </div>

                  {/* === FLEURS / BRIN SUR LE COIN HAUT-GAUCHE DE LA CARTE */}
                  <div className="absolute -top-[4%] -left-[3%] z-50 pointer-events-none select-none w-[clamp(110px,28vw,170px)] h-[clamp(130px,33vw,200px)]" style={{ transform: 'rotate(-10deg)' }}>
                    <img src={fleurBordeaux} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 5px 12px rgba(90,15,44,0.45)) saturate(1.08)' }} loading="lazy" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'couplePhoto': {
        const BURG_MID = '#7a1f3e';
        const BURG_DARK = '#5a0f2c';
        const CREAM = '#faf5ec';
        const CREAM_DEEP = '#f5efe2';
        const GOLD = '#c89b2f';

        return (
          <div className="relative w-full py-6 sm:py-8 px-4 sm:px-6 overflow-visible" style={{
            background: `linear-gradient(180deg, #f9f2e4 0%, ${CREAM_DEEP} 50%, ${CREAM} 100%)`,
          }}>
            <div className="relative mx-auto max-w-[380px] flex flex-col items-center">
              {/* === Carte invité : Nom + Table (juste avant disque) === */}
              {(safeInvite.nom || safeInvite.table) && (
                <div className="relative w-full mb-5 sm:mb-6">
                  <div className="relative w-full rounded-[12px] p-4 sm:p-5" style={{
                    background: `linear-gradient(135deg, #fffaf1 0%, ${CREAM} 100%)`,
                    border: `1px solid ${BURG_MID}33`,
                    boxShadow: `0 8px 22px -14px ${BURG_DARK}55, inset 0 1px 0 rgba(255,255,255,0.9)`,
                  }}>
                    {/* Fleur décorative coin HAUT-GAUCHE de la carte invité */}
                    <div className="absolute -top-[18px] -left-[14px] z-20 pointer-events-none select-none w-[86px] h-[86px] sm:w-[94px] sm:h-[94px]" style={{ transform: 'rotate(-14deg)' }}>
                      <img src={fleurBordeaux} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 3px 8px rgba(90,15,44,0.42)) saturate(1.06)' }} loading="lazy" />
                    </div>
                    {/* Fleur décorative coin HAUT-DROIT de la carte invité */}
                    <div className="absolute -top-[16px] -right-[12px] z-20 pointer-events-none select-none w-[80px] h-[80px] sm:w-[88px] sm:h-[88px]" style={{ transform: 'rotate(20deg) scaleX(-1)' }}>
                      <img src={fleurDoree} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 3px 8px rgba(166,109,53,0.38)) saturate(1.1)' }} loading="lazy" />
                    </div>

                    {/* Ornement haut gauche */}
                    <svg className="absolute -top-0.5 -left-0.5 w-8 h-8" viewBox="0 0 32 32" fill="none">
                      <path d="M2 2 Q2 15 15 15 M2 2 Q15 2 15 15" stroke={BURG_MID} strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.6" />
                      <circle cx="6.5" cy="6.5" r="0.9" fill={BURG_MID} opacity="0.7" />
                    </svg>
                    <svg className="absolute -top-0.5 -right-0.5 w-8 h-8 rotate-90" viewBox="0 0 32 32" fill="none">
                      <path d="M2 2 Q2 15 15 15 M2 2 Q15 2 15 15" stroke={BURG_MID} strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.6" />
                      <circle cx="6.5" cy="6.5" r="0.9" fill={BURG_MID} opacity="0.7" />
                    </svg>
                    <div className="flex flex-col items-center gap-1.5 px-2 py-1">
                      {safeInvite.nom && (
                        <p className="font-serif italic font-bold text-[15px] sm:text-[17px] leading-tight text-center" style={{ color: BURG_DARK }}>
                          {safeInvite.nom}{safeInvite.etat === 'couple' && <> <span className="font-semibold" style={{ color: BURG_MID, fontSize: '0.78em' }}>— Couple</span></>}
                        </p>
                      )}
                      {safeInvite.table && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] sm:text-[12px] font-semibold tracking-wider uppercase" style={{ color: BURG_MID }}>
                            Table {safeInvite.table}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Filet doré sous le titre */}
                    {(safeInvite.nom || safeInvite.table) && (
                      <svg className="mx-auto mt-2 w-10" viewBox="0 0 40 6" fill="none">
                        <path d="M2 3 Q10 0 20 3 Q30 6 38 3" stroke={GOLD} strokeWidth="0.8" strokeLinecap="round" opacity="0.85" />
                      </svg>
                    )}
                  </div>
                </div>
              )}

              {/* === PLAYER MUSIQUE INLINE (Style maquette : 3 boutons + titre artiste) === */}
              <div className="relative w-full flex flex-col items-center py-2 mb-3">
                {/* Rangée de contrôles : Précédent ● Lecture ● Suivant */}
                <div className="flex items-center justify-center gap-8 sm:gap-10 mb-3">
                  <button
                    onClick={() => { /* previous track placeholder */ }}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all active:scale-90 group"
                    aria-label="Morceau précédent"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-[22px] sm:h-[22px]" strokeWidth={2.5} style={{ color: BURG_DARK }} />
                  </button>

                  {/* Bouton Play / Pause central — disque vinyle noir tournant */}
                  <button
                    onClick={toggleMute}
                    className="relative w-[66px] h-[66px] sm:w-[74px] sm:h-[74px] rounded-full flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(90,15,44,0.45)] transition-all active:scale-95 hover:scale-[1.03]"
                    style={{
                      background: `radial-gradient(circle at 32% 28%, #2a2a38 0%, #12121a 52%, #000 100%)`,
                      animation: isMusicPlaying && !isMusicMuted ? 'spin-slow 5s linear infinite' : 'none',
                    }}
                    aria-label={isMusicMuted ? 'Activer la musique' : 'Mettre en pause'}
                  >
                    {/* Sillons extérieurs cercles concentriques */}
                    <div className="absolute inset-[6%] rounded-full pointer-events-none" style={{
                      border: `0.5px solid rgba(255,255,255,0.07)`,
                      boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.02)',
                    }} />
                    <div className="absolute inset-[14%] rounded-full pointer-events-none" style={{
                      border: `0.4px solid rgba(255,255,255,0.05)`,
                    }} />
                    <div className="absolute inset-[22%] rounded-full pointer-events-none" style={{
                      border: `0.4px solid rgba(255,255,255,0.04)`,
                    }} />
                    {/* Petit cercle central "trousse" du vinyle */}
                    <div className="absolute inset-[26%] rounded-full" style={{
                      background: `radial-gradient(circle at 35% 30%, #fff6d8 0%, ${GOLD} 48%, #8a671c 100%)`,
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.45)',
                    }} />
                    {/* Micro-trou central */}
                    <div className="absolute w-[7px] h-[7px] rounded-full bg-black z-10" style={{
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.85)',
                    }} />
                    {/* Effet lumineux rotation (reflet qui tourne avec le disque) */}
                    {isMusicPlaying && !isMusicMuted && (
                      <div className="absolute inset-0 rounded-full pointer-events-none" style={{
                        background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.12) 20%, transparent 45%, rgba(255,255,255,0.06) 70%, transparent 100%)',
                        mixBlendMode: 'screen',
                      }} />
                    )}
                  </button>

                  <button
                    onClick={() => { /* next track placeholder */ }}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
                    aria-label="Morceau suivant"
                  >
                    <ChevronRightIcon className="w-5 h-5 sm:w-[22px] sm:h-[22px]" strokeWidth={2.5} style={{ color: BURG_DARK }} />
                  </button>
                </div>

                {/* Titre + Artiste en italique (sous les contrôles) */}
                <div className="text-center max-w-[78%] mx-auto">
                  <p className="font-serif italic text-[12px] sm:text-[13px] leading-snug mb-0.5" style={{
                    color: BURG_DARK,
                    opacity: 0.92,
                  }}>
                    {safeUserModel.musicTitle || 'Le son de l\'amour'}
                  </p>
                  <p className="font-serif italic text-[10px] sm:text-[11px]" style={{
                    color: '#7a5a47',
                    opacity: 0.78,
                  }}>
                    {safeUserModel.musicArtist || safeUserModel.title || 'Celestin & Celine'}
                  </p>
                </div>
              </div>

              {/* Séparateur fin en bas (transition douce vers section suivante) */}
              <div className="w-full flex items-center justify-center gap-3 mt-2 mb-4 opacity-70">
                <div className="h-px flex-1 max-w-[60px]" style={{ background: `linear-gradient(90deg, transparent, ${BURG_MID}55)` }} />
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: BURG_MID }} />
                <div className="h-px flex-1 max-w-[60px]" style={{ background: `linear-gradient(90deg, ${BURG_MID}55, transparent)` }} />
              </div>

              {/* === GALERIE POLAROID INCLINÉES — "CLICK FOR / OUR LOVE STORY" (style maquette) === */}
              <div className="relative w-full h-[290px] sm:h-[310px] my-3 sm:my-4">
                {/* 1ère POLAROID — penchée à gauche - sous-couche */}
                <div
                  className="absolute left-[2%] top-0 w-[70%] sm:w-[68%]"
                  style={{ transform: 'rotate(-6deg)' }}
                >
                  <div className="relative bg-white shadow-[0_14px_36px_-14px_rgba(90,15,44,0.42)] rounded-[3px]">
                    {/* Marge intérieure façon polaroid blanche */}
                    <div className="p-2.5 pb-[26%]">
                      {/* Photo carrée à l'intérieur */}
                      {(() => {
                        const photo1 =
                          safeUserModel.invitationPhoto ||
                          (safeUserModel.eventPhotos && safeUserModel.eventPhotos[0]) ||
                          safeUserModel.backgroundImage ||
                          photoCouple;
                        return (
                          <div
                            className="relative w-full overflow-hidden bg-[#eee9df]"
                            style={{ paddingTop: '100%' }}
                          >
                            <img
                              src={optimizeImageFn(photo1, 800, 80)}
                              alt="Notre histoire"
                              className="absolute inset-0 w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        );
                      })()}
                    </div>
                    {/* Légende texte en bas de la polaroid */}
                    <div className="absolute left-0 right-0 bottom-[5%] flex justify-center px-4">
                      <p className="font-luxury tracking-[0.08em] text-[13px] sm:text-[14px] uppercase font-black" style={{
                        color: '#2a140a',
                        textShadow: '0 1px 0 rgba(255,255,255,0.9)',
                      }}>
                        CLICK FOR
                      </p>
                    </div>
                    {/* Petit masking-tape adhésif dans un coin */}
                    <div className="absolute -top-2.5 left-[14%] w-[54px] h-[16px] opacity-80" style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(248,238,210,0.5) 100%)',
                      transform: 'rotate(-8deg)',
                      boxShadow: '0 2px 4px rgba(90,15,44,0.08)',
                    }} />
                  </div>
                </div>

                {/* 2ème POLAROID — penchée à droite - sur-couche (devant) */}
                <div
                  className="absolute right-[2%] top-[18%] w-[70%] sm:w-[68%] z-10"
                  style={{ transform: 'rotate(7deg)' }}
                >
                  <div className="relative bg-white shadow-[0_18px_44px_-18px_rgba(90,15,44,0.5)] rounded-[3px]">
                    <div className="p-2.5 pb-[26%]">
                      {(() => {
                        const photo2 =
                          safeUserModel.backgroundImage ||
                          (safeUserModel.eventPhotos && safeUserModel.eventPhotos[1]) ||
                          (safeUserModel.eventPhotos && safeUserModel.eventPhotos[0]) ||
                          safeUserModel.invitationTextPhoto ||
                          photoCouple;
                        return (
                          <div
                            className="relative w-full overflow-hidden bg-[#eee9df]"
                            style={{ paddingTop: '100%' }}
                          >
                            <img
                              src={optimizeImageFn(photo2, 800, 80)}
                              alt="Notre histoire"
                              className="absolute inset-0 w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        );
                      })()}
                    </div>
                    <div className="absolute left-0 right-0 bottom-[5%] flex justify-center px-4">
                      <p className="font-luxury tracking-[0.08em] text-[12.5px] sm:text-[13.5px] uppercase font-black" style={{
                        color: '#2a140a',
                        textShadow: '0 1px 0 rgba(255,255,255,0.9)',
                      }}>
                        NOTRE HISTOIRE
                      </p>
                    </div>
                    {/* Adhésif masking tape */}
                    <div className="absolute -top-2.5 right-[18%] w-[58px] h-[16px] opacity-80" style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(248,238,210,0.5) 100%)',
                      transform: 'rotate(10deg)',
                      boxShadow: '0 2px 4px rgba(90,15,44,0.08)',
                    }} />
                    {/* Petite fleur décorative dans le coin droit bas (devant) */}
                    <div className="absolute -bottom-6 -right-6 w-[96px] h-[96px] z-20 pointer-events-none" style={{ transform: 'rotate(18deg)' }}>
                      <img src={fleurBordeaux} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 3px 7px rgba(90,15,44,0.4)) saturate(1.05)' }} loading="lazy" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Séparateur fin sous les polaroids */}
              <div className="w-full flex items-center justify-center gap-3 mt-2 opacity-70">
                <div className="h-px flex-1 max-w-[70px]" style={{ background: `linear-gradient(90deg, transparent, ${BURG_MID}55)` }} />
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1 L 7.2 4.6 L 11 4.8 L 8 7.2 L 9 11 L 6 8.8 L 3 11 L 4 7.2 L 1 4.8 L 4.8 4.6 Z" fill={BURG_MID} opacity="0.75"/>
                </svg>
                <div className="h-px flex-1 max-w-[70px]" style={{ background: `linear-gradient(90deg, ${BURG_MID}55, transparent)` }} />
              </div>
            </div>
          </div>
        );
      }

      case 'invitation': {
        const BURG_MID = '#7a1f3e';
        const BURG_DARK = '#5a0f2c';
        const BURG_SOFT = '#9a3458';
        const CREAM = '#faf5ec';
        const GOLD = '#c89b2f';

        const locationLine = safeUserModel.eventLocation || 'Villa Balbiano, Lake Como';
        const addressLine = safeUserModel.eventAddress || 'Lake Como, Italy';
        const eventTime = safeUserModel.eventTime || '16:00';

        const openMaps = () => {
          try {
            const query = safeUserModel.eventAddress || safeUserModel.eventLocation;
            if (!query) return;
            const isIOS = /iPhone|iPad|iPod/.test(typeof navigator !== 'undefined' ? navigator.userAgent : '');
            const url = isIOS ? `maps://?q=${encodeURIComponent(query)}` : `https://www.google.com/maps?q=${encodeURIComponent(query)}`;
            window.open(url, '_blank');
          } catch {}
        };

        const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        useEffect(() => {
          const calculate = () => {
            const diff = +targetEventDate - +new Date();
            if (diff > 0) {
              setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / 1000 / 60) % 60),
                seconds: Math.floor((diff / 1000) % 60),
              });
            } else {
              setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
          };
          const t = setInterval(calculate, 1000);
          calculate();
          return () => clearInterval(t);
        }, [targetEventDate]);

        const pad = (n: number) => String(n).padStart(2, '0');
        const padDays = (n: number) => String(n).padStart(n >= 100 ? 3 : 2, '0');
        const CREAM_DEEP = '#f5efe2';

        return (
          <div className="relative w-full py-6 sm:py-8 px-4 sm:px-6 overflow-visible" style={{
            background: `linear-gradient(180deg, ${CREAM} 0%, #f5efe2 100%)`,
          }}>
            <div className="relative mx-auto max-w-[380px] flex flex-col items-center space-y-5 sm:space-y-6">
              {/* === CARTE 1 : LIEU ET HEURE === */}
              <div className="relative w-full">
                <div className="absolute -top-1 -left-1 -bottom-1 -right-1 rounded-[4px]" style={{
                  background: `linear-gradient(135deg, ${BURG_MID} 0%, #8a2a4a 50%, ${BURG_DARK} 100%)`,
                  opacity: 0.92,
                }} />
                <div className="relative bg-[#fffdf8] rounded-[2px] p-5 sm:p-6 overflow-hidden" style={{
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
                }}>
                  {/* Coin gauche : fleur décorative */}
                  <div className="absolute -top-8 -left-8 w-[132px] h-[132px] pointer-events-none z-10" style={{ transform: 'rotate(-18deg)' }}>
                    <img src={fleurDoree} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 3px 8px rgba(166,109,53,0.35)) saturate(1.08)' }} loading="lazy" />
                  </div>

                  {/* Haut de carte : Titre centré */}
                  <div className="flex flex-col items-center mb-4 sm:mb-5">
                    <h2 className="font-luxury font-medium leading-[1.05] text-[26px] sm:text-[30px] tracking-wide text-center" style={{
                      color: BURG_DARK,
                    }}>
                      Bienvenu(e,s)
                    </h2>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="h-px w-6" style={{ background: `${BURG_MID}88` }} />
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: `${BURG_MID}aa` }} />
                      <div className="h-px w-6" style={{ background: `${BURG_MID}88` }} />
                    </div>
                  </div>

                  {/* Bloc Lieu — centré */}
                  <div className="flex flex-col items-center gap-2 mb-5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{
                      background: `linear-gradient(145deg, ${BURG_MID}, ${BURG_DARK})`,
                      boxShadow: '0 3px 6px -2px rgba(90,15,44,0.45)',
                    }}>
                      <MapPin className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0 text-center">
                      <p className="font-semibold text-[13px] sm:text-[14px] leading-snug mb-0.5" style={{ color: BURG_DARK }}>
                        {locationLine}
                      </p>
                      <p className="text-[11.5px] sm:text-[12.5px] leading-snug" style={{ color: '#5c4a36', opacity: 0.92 }}>
                        {addressLine}
                      </p>
                    </div>
                  </div>

                  {/* Bloc Heure + Bouton Voir l'adresse — centré */}
                  <div className="flex items-center justify-center gap-5 sm:gap-8 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" style={{ color: BURG_MID }} strokeWidth={2.2} />
                      <span className="font-serif italic font-bold text-[13.5px] sm:text-[15px]" style={{ color: BURG_DARK }}>
                        {eventTime}
                      </span>
                    </div>
                    <button
                      onClick={openMaps}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10.5px] sm:text-[11.5px] font-bold uppercase tracking-[0.14em] transition-all active:scale-95 hover:scale-[1.03]"
                      style={{
                        color: '#fff',
                        background: `linear-gradient(145deg, ${BURG_MID} 0%, ${BURG_DARK} 100%)`,
                        boxShadow: '0 4px 10px -3px rgba(90,15,44,0.5)',
                      }}
                    >
                      Voir l'adresse
                      <ChevronRightIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>

              {/* === CALENDRIER : DATE DE L'ÉVÉNEMENT === */}
              <div className="relative w-full">
                <div className="absolute -top-1 -left-1 -bottom-1 -right-1 rounded-[4px]" style={{
                  background: `linear-gradient(135deg, ${BURG_DARK} 0%, ${BURG_MID} 50%, #8a2a4a 100%)`,
                  opacity: 0.92,
                }} />
                <div className="relative bg-[#fffdf8] rounded-[2px] p-5 sm:p-6 overflow-hidden" style={{
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
                }}>
                  {/* Coin droit haut : fleur */}
                  <div className="absolute -top-8 -right-8 w-[132px] h-[132px] pointer-events-none z-10" style={{ transform: 'rotate(22deg) scaleX(-1)' }}>
                    <img src={fleurBordeaux} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 3px 8px rgba(90,15,44,0.4)) saturate(1.05)' }} loading="lazy" />
                  </div>

                  <div className="flex flex-col items-center mb-4 sm:mb-5">
                    <h2 className="font-luxury font-medium leading-[1.05] text-[26px] sm:text-[30px] tracking-wide" style={{
                      color: BURG_DARK,
                    }}>
                      Calendrier
                    </h2>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="h-px w-6" style={{ background: `${BURG_MID}88` }} />
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: `${BURG_MID}aa` }} />
                      <div className="h-px w-6" style={{ background: `${BURG_MID}88` }} />
                    </div>
                  </div>

                  {/* Calendrier stylisé avec la date cochée */}
                  <div className="flex items-center justify-center ml-[10px]">
                    <div className="relative w-full max-w-[260px]">
                      {/* Cadre calendrier */}
                      <div className="relative rounded-[10px] overflow-hidden shadow-xl" style={{
                        boxShadow: `0 8px 24px -8px rgba(90,15,44,0.35), 0 2px 0 rgba(90,15,44,0.08)`,
                      }}>
                        {/* Bandeau supérieur mois + année */}
                        <div className="px-4 py-3 text-center" style={{
                          background: `linear-gradient(145deg, ${BURG_MID} 0%, ${BURG_DARK} 100%)`,
                        }}>
                          <p className="font-serif font-bold italic text-white text-[17px] sm:text-[18px] tracking-wide capitalize" style={{
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                          }}>
                            {(() => {
                              try {
                                const parts = targetEventDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).split(' ');
                                const monthText = parts[0];
                                const yearText = parts[1];
                                return monthText.charAt(0).toUpperCase() + monthText.slice(1) + ' ' + yearText;
                              } catch {
                                return eventMonth + ' ' + eventYear;
                              }
                            })()}
                          </p>
                        </div>

                        {/* Corps du calendrier */}
                        <div className="bg-[#fffdf8] px-3 py-3 sm:px-4 sm:py-4">
                          {/* Jours de la semaine */}
                          <div className="grid grid-cols-7 gap-1 mb-2">
                            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((j, i) => (
                              <div key={i} className="flex items-center justify-center">
                                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider" style={{
                                  color: `${BURG_MID}`,
                                  opacity: 0.7,
                                }}>
                                  {j}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Grille des jours avec le jour coché */}
                          <CalendrierJour
                            day={eventDay}
                            targetEventDate={targetEventDate}
                            colors={{ BURG_MID, BURG_DARK }}
                          />
                        </div>
                      </div>

                      {/* Épingle / trombone décoratif */}
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-7 h-4 rounded-b-full" style={{
                        background: `linear-gradient(180deg, ${GOLD} 0%, #8a6518 100%)`,
                        boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
                        zIndex: 5,
                      }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* === COMPTE À REBOURS (sous le calendrier) === */}
              <div className="relative w-full flex flex-col items-center pt-2 mx-auto">
                {/* Petite fleur haut-gauche (chute de clochettes + feuilles) */}
                <div className="absolute -top-14 -left-12 w-[144px] h-[192px] sm:w-40 sm:h-56 pointer-events-none">
                  <img src={fleurDoree} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 2px 6px rgba(166,109,53,0.3)) saturate(1.08)' }} loading="lazy" />
                </div>

                <div className="flex items-center justify-center gap-1 sm:gap-1.5 mx-auto">
                  {/* Jours */}
                  <div className="flex flex-col items-center">
                    <span className="font-serif font-bold text-3xl sm:text-[40px] leading-none tracking-tight tabular-nums not-italic" style={{ color: BURG_DARK }}>
                      {padDays(timeLeft.days)}
                    </span>
                  </div>
                  <span className="font-serif font-bold text-2xl sm:text-3xl leading-none mb-2 not-italic" style={{ color: BURG_SOFT }}>:</span>
                  {/* Heures */}
                  <div className="flex flex-col items-center">
                    <span className="font-serif font-bold text-3xl sm:text-[40px] leading-none tracking-tight tabular-nums not-italic" style={{ color: BURG_DARK }}>
                      {pad(timeLeft.hours)}
                    </span>
                  </div>
                  <span className="font-serif font-bold text-2xl sm:text-3xl leading-none mb-2 not-italic" style={{ color: BURG_SOFT }}>:</span>
                  {/* Minutes */}
                  <div className="flex flex-col items-center">
                    <span className="font-serif font-bold text-3xl sm:text-[40px] leading-none tracking-tight tabular-nums not-italic" style={{ color: BURG_DARK }}>
                      {pad(timeLeft.minutes)}
                    </span>
                  </div>
                  <span className="font-serif font-bold text-2xl sm:text-3xl leading-none mb-2 not-italic" style={{ color: BURG_SOFT }}>:</span>
                  {/* Secondes (en bordeaux/rose) */}
                  <div className="flex flex-col items-center">
                    <span className="font-serif font-bold text-3xl sm:text-[40px] leading-none tracking-tight tabular-nums not-italic" style={{ color: BURG_SOFT }}>
                      {pad(timeLeft.seconds)}
                    </span>
                  </div>
                </div>

                {/* Labels : Jours • Heures • Minutes • Secondes — en français, non italique */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 mt-2 mx-auto">
                  <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.22em] uppercase not-italic" style={{ color: BURG_DARK, opacity: 0.75 }}>Jours</span>
                  <span className="text-xs leading-none" style={{ color: BURG_SOFT }}>•</span>
                  <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.22em] uppercase not-italic" style={{ color: BURG_DARK, opacity: 0.75 }}>Heures</span>
                  <span className="text-xs leading-none" style={{ color: BURG_SOFT }}>•</span>
                  <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.22em] uppercase not-italic" style={{ color: BURG_DARK, opacity: 0.75 }}>Minutes</span>
                  <span className="text-xs leading-none" style={{ color: BURG_SOFT }}>•</span>
                  <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.22em] uppercase not-italic" style={{ color: BURG_SOFT }}>Secondes</span>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'invitationText': {
        const invitationTextContent = (safeUserModel.invitationText || '')
          .replace(/\[b\]/g, '<strong>')
          .replace(/\[\/b\]/g, '</strong>')
          .replace(/\[color=(.*?)\]/g, `<span style="color: $1">`)
          .replace(/\[\/color\]/g, '</span>');

        return (
          <div className="relative w-full py-6 sm:py-8 px-4 sm:px-6 overflow-visible" style={{
            background: `linear-gradient(180deg, #f5efe2 0%, ${CREAM_DEEP} 50%, ${CREAM} 100%)`,
          }}>
            <div className="relative mx-auto max-w-[380px] flex flex-col items-center">

              <div className="relative w-full">
                <div className="absolute -inset-[2px] rounded-[2px]" style={{ background: `linear-gradient(135deg, ${BURG_MID}cc, ${BURG_DARK}aa, ${BURG_MID}cc, ${BURG_DARK}aa)` }} />
                <div className="relative w-full px-6 sm:px-8 py-7 sm:py-9 overflow-hidden" style={{ background: CREAM_DEEP, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)' }}>

                  <svg className="absolute top-2 left-2 w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 40 40" fill="none">
                    <path d="M2 2 Q2 18 18 18 M2 2 Q18 2 18 18" stroke={BURG_MID} strokeWidth="1.2" fill="none" strokeLinecap="round" />
                    <circle cx="8" cy="8" r="1.2" fill={BURG_MID} />
                    <circle cx="15" cy="5" r="0.8" fill={GOLD} />
                  </svg>
                  <svg className="absolute top-2 right-2 w-8 h-8 sm:w-10 sm:h-10 rotate-90" viewBox="0 0 40 40" fill="none">
                    <path d="M2 2 Q2 18 18 18 M2 2 Q18 2 18 18" stroke={BURG_MID} strokeWidth="1.2" fill="none" strokeLinecap="round" />
                    <circle cx="8" cy="8" r="1.2" fill={BURG_MID} />
                    <circle cx="15" cy="5" r="0.8" fill={GOLD} />
                  </svg>
                  <svg className="absolute bottom-2 left-2 w-8 h-8 sm:w-10 sm:h-10 -rotate-90" viewBox="0 0 40 40" fill="none">
                    <path d="M2 2 Q2 18 18 18 M2 2 Q18 2 18 18" stroke={BURG_MID} strokeWidth="1.2" fill="none" strokeLinecap="round" />
                    <circle cx="8" cy="8" r="1.2" fill={BURG_MID} />
                    <circle cx="15" cy="5" r="0.8" fill={GOLD} />
                  </svg>
                  <svg className="absolute bottom-2 right-2 w-8 h-8 sm:w-10 sm:h-10 rotate-180" viewBox="0 0 40 40" fill="none">
                    <path d="M2 2 Q2 18 18 18 M2 2 Q18 2 18 18" stroke={BURG_MID} strokeWidth="1.2" fill="none" strokeLinecap="round" />
                    <circle cx="8" cy="8" r="1.2" fill={BURG_MID} />
                    <circle cx="15" cy="5" r="0.8" fill={GOLD} />
                  </svg>

                  <div className="absolute -top-10 -left-10 w-[136px] h-[136px] pointer-events-none z-10" style={{ transform: 'rotate(-18deg)' }}>
                    <img src={fleurBordeaux} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 3px 8px rgba(90,15,44,0.4)) saturate(1.05)' }} loading="lazy" />
                  </div>

                  <div className="absolute -bottom-8 -right-8 w-[120px] h-[132px] sm:w-[140px] sm:h-[154px] pointer-events-none">
                    <img src={fleurDoree} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 3px 8px rgba(166,109,53,0.38)) saturate(1.08)' }} loading="lazy" />
                  </div>

                  <div className="relative flex flex-col items-center mb-5 sm:mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 border" style={{ background: `${BURG_SOFT}10`, borderColor: `${BURG_MID}30` }}>
                      <Heart className="w-2.5 h-2.5" style={{ color: BURG_DARK }} fill={BURG_DARK} />
                      <span className="text-[10px] tracking-[0.28em] uppercase font-semibold" style={{ color: BURG_DARK }}>Invitation Speciale</span>
                    </div>

                    <h2 className="font-luxury text-4xl sm:text-5xl leading-none mb-1" style={{ color: BURG_MID }}>
                      Très Cher(e)
                    </h2>
                    <svg className="mx-auto mt-2 mb-3 w-16" viewBox="0 0 80 8" fill="none">
                      <path d="M2 4 Q20 0 40 4 Q60 8 78 4" stroke={GOLD} strokeWidth="1" strokeLinecap="round" />
                      <circle cx="40" cy="4" r="1.2" fill={BURG_MID} />
                    </svg>
                  </div>

                  <div className="relative w-full mb-6">
                    <div className="flex flex-col items-center justify-center w-full max-w-[300px] mx-auto">
                      <TypewriterWithPen
                        className="text-[12.5px] sm:text-[13.5px] leading-[1.8] w-full text-center [&>p]:my-1 [&>p]:mb-2"
                        style={{ color: BURG_DARK, fontFamily: 'Georgia, serif', fontStyle: 'italic', opacity: 0.88 }}
                        penImage={plume}
                        speed={42}
                        htmlContent={invitationTextContent}
                      />
                    </div>
                  </div>

                  {((safeUserModel as any).invitationTextPhoto2) && (
                    <div className="mb-4 text-center">
                      {((safeUserModel as any).invitationTextPhoto2Title) && (
                        <h3 className="text-[13px] sm:text-[14px] font-bold mb-0.5" style={{ color: BURG_DARK }}>
                          {(safeUserModel as any).invitationTextPhoto2Title}
                        </h3>
                      )}
                      {((safeUserModel as any).invitationTextPhoto2Subtitle) && (
                        <p className="text-[11px] mb-1.5" style={{ color: `${BURG_DARK}72` }}>
                          {(safeUserModel as any).invitationTextPhoto2Subtitle}
                        </p>
                      )}
                      <img
                        src={optimizeImageFn((safeUserModel as any).invitationTextPhoto2, 800, 85)}
                        alt=""
                        className="w-full max-w-[420px] max-h-[520px] object-contain mx-auto"
                        style={{}}
                        loading="lazy"
                      />
                    </div>
                  )}

                  {safeUserModel.invitationTextPhoto && (
                    <div className="mb-3 text-center">
                      {safeUserModel.invitationTextPhotoTitle && (
                        <h3 className="text-[13px] sm:text-[14px] font-bold mb-0.5" style={{ color: BURG_DARK }}>
                          {safeUserModel.invitationTextPhotoTitle}
                        </h3>
                      )}
                      {safeUserModel.invitationTextPhotoSubtitle && (
                        <p className="text-[11px] mb-1.5" style={{ color: `${BURG_DARK}72` }}>
                          {safeUserModel.invitationTextPhotoSubtitle}
                        </p>
                      )}
                      <img
                        src={optimizeImageFn(safeUserModel.invitationTextPhoto, 500, 72)}
                        alt=""
                        className="max-w-[150px] max-h-[150px] w-full object-contain mx-auto rounded-sm"
                        style={{
                          border: `1px solid ${BURG_MID}40`,
                          padding: '4px',
                          background: '#fffdf8',
                          boxShadow: `0 10px 24px -12px ${BURG_DARK}35`
                        }}
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-center gap-2 opacity-70">
                    <div className="h-px w-10 sm:w-14" style={{ background: `linear-gradient(90deg, transparent, ${BURG_MID}55)` }} />
                    <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1 L 7.2 4.6 L 11 4.8 L 8 7.2 L 9 11 L 6 8.8 L 3 11 L 4 7.2 L 1 4.8 L 4.8 4.6 Z" fill={BURG_MID} opacity="0.75"/>
                    </svg>
                    <div className="h-px w-10 sm:w-14" style={{ background: `linear-gradient(90deg, ${BURG_MID}55, transparent)` }} />
                  </div>

                </div>
              </div>

            </div>
          </div>
        );
      }

      case 'countdown': {
        return (
          <div className="relative w-full" />
        );
      }

      case 'accommodation':
        return (
          <div className="relative w-full h-full overflow-visible">
            <div className="absolute inset-0 z-0" style={{ background: `linear-gradient(180deg, ${CREAM} 0%, ${CREAM_DEEP} 100%)` }} />
            
            <div className="absolute top-[-44px] left-[-38px] z-10 pointer-events-none w-[260px] h-[260px]" style={{ transform: 'rotate(-18deg)' }}>
              <img src={fleurBordeaux} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 4px 12px rgba(90,15,44,0.42)) saturate(1.05)' }} loading="lazy" />
            </div>
            
            <div className="absolute bottom-[-34px] right-[-32px] z-10 pointer-events-none w-[230px] h-[230px]" style={{ transform: 'rotate(15deg) scaleX(-1)' }}>
              <img src={fleurDoree} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 4px 12px rgba(166,109,53,0.38)) saturate(1.08)' }} loading="lazy" />
            </div>

            <div className="relative z-10 min-h-full p-5 sm:p-7">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-2 sm:mb-3 border" style={{ background: `${BURG_SOFT}12`, borderColor: `${BURG_MID}35` }}>
                  <span className="w-1 h-1 rounded-full" style={{ backgroundColor: BURG_DARK }} />
                  <span className="text-[10px] sm:text-xs tracking-[0.25em] uppercase font-semibold" style={{ color: BURG_DARK }}>Pratique</span>
                  <span className="w-1 h-1 rounded-full" style={{ backgroundColor: GOLD }} />
                </div>
                <h2 className="text-2xl sm:text-4xl font-luxury mb-2" style={{ color: BURG_DARK, letterSpacing: '-0.01em' }}>
                  Où dormir ?
                </h2>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="h-[1px] w-10 sm:w-14" style={{ background: `linear-gradient(90deg, transparent, ${BURG_MID})` }} />
                  <div style={{ color: GOLD }}>✦</div>
                  <div className="h-[1px] w-10 sm:w-14" style={{ background: `linear-gradient(90deg, ${BURG_MID}, transparent)` }} />
                </div>
                <p className="text-[11px] sm:text-sm font-medium max-w-md mx-auto leading-relaxed" style={{ color: `${BURG_DARK}75` }}>
                  Quelques adresses recommandées à proximité
                </p>
              </div>

              {((safeUserModel as any).accommodationEnabled && Array.isArray((safeUserModel as any).accommodations) && (safeUserModel as any).accommodations.length > 0) && (
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:max-w-2xl sm:mx-auto mb-8 max-w-lg mx-auto">
                  {[...(safeUserModel as any).accommodations]
                    .sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                    .filter((a: any) => a.name && a.address)
                    .map((acc: any, idx: number) => (
                      <div
                        key={acc.id}
                        className="relative w-full h-full rounded-[22px] overflow-hidden group transition-all duration-500 hover:-translate-y-1.5"
                        style={{
                          background: '#fffdf8',
                          border: `1px solid ${BURG_MID}30`,
                          boxShadow: `0 8px 28px -12px ${BURG_DARK}35, inset 0 1px 0 rgba(255,255,255,0.7)`
                        }}
                      >
                        <div className="absolute inset-0 pointer-events-none opacity-40 transition-opacity duration-500 group-hover:opacity-65" style={{
                          background: `radial-gradient(ellipse at 0% 0%, ${BURG_SOFT}18 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, ${BURG_MID}15 0%, transparent 55%)`
                        }} />

                        <div className="relative aspect-[4/3] overflow-hidden w-full rounded-t-[21px]" style={{ background: `linear-gradient(135deg, ${BURG_SOFT}35 0%, ${BURG_MID}45 100%)` }}>
                          {acc.image ? (
                            <img
                              src={optimizeImageFn(acc.image, 600, 75)}
                              alt={acc.name}
                              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Hotel className="w-10 h-10 drop-shadow" style={{ color: BURG_DARK, opacity: 0.6 }} />
                            </div>
                          )}
                          <div className="absolute inset-0 rounded-t-[21px]" style={{
                            background: 'linear-gradient(180deg, rgba(90,15,44,0.0) 0%, rgba(90,15,44,0.0) 45%, rgba(90,15,44,0.55) 78%, rgba(90,15,44,0.78) 100%)'
                          }} />
                          {acc.badge && (
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black tracking-wider uppercase backdrop-blur-md" style={{
                              background: `linear-gradient(135deg, ${BURG_MID}ee, ${BURG_DARK}ee)`,
                              color: '#fffaf3',
                              border: `1px solid ${GOLD}60`,
                              boxShadow: `0 4px 14px -4px ${BURG_DARK}60`
                            }}>
                              {acc.badge}
                            </div>
                          )}
                          {acc.priceHint && (
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-black backdrop-blur-md" style={{
                              background: 'rgba(255,253,248,0.85)',
                              color: BURG_DARK,
                              border: `1px solid ${BURG_MID}35`
                            }}>
                              {acc.priceHint}
                            </div>
                          )}
                        </div>

                        <div className="relative z-10 p-2.5 sm:p-3 space-y-2 sm:space-y-2.5">
                          <div className="min-w-0">
                            <h3 className="font-bold text-[12px] sm:text-[13px] truncate leading-tight" style={{ color: BURG_DARK }}>{acc.name}</h3>
                            <div className="flex items-start gap-1 mt-0.5">
                              <MapPin className="h-2.5 w-2.5 mt-0.5 flex-shrink-0" style={{ color: BURG_MID }} />
                              <span className="text-[10px] sm:text-[11px] truncate leading-tight" style={{ color: `${BURG_DARK}75` }}>{acc.address}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const url = /iPhone|iPad|iPod/.test(navigator.userAgent) ? `maps://?q=${encodeURIComponent(acc.address)}` : `https://www.google.com/maps?q=${encodeURIComponent(acc.address)}`;
                                window.open(url, '_blank');
                              }}
                              className="flex items-center justify-center py-1.5 sm:py-2 rounded-lg transition-all active:scale-95 border"
                              style={{
                                background: `linear-gradient(180deg, ${BURG_MID}12, ${BURG_MID}08)`,
                                borderColor: `${BURG_MID}45`
                              }}
                              title="Ouvrir dans Maps"
                            >
                              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: BURG_DARK }} />
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
                                background: `linear-gradient(180deg, ${BURG_SOFT}18, ${BURG_SOFT}0a)`,
                                borderColor: `${BURG_SOFT}55`
                              }}
                              title={acc.websiteUrl ? 'Site web' : acc.email ? 'Email' : 'Aucun site'}
                            >
                              <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: BURG_DARK }} />
                            </button>

                            <div className="col-span-2">
                              {acc.email ? (
                                <a
                                  href={`mailto:${acc.email}?subject=${encodeURIComponent(`Réservation - Mariage ${(safeUserModel.title || '').replace(/Mariage (de|d')?\s*/i, '')}`)}&body=${encodeURIComponent('Bonjour,\n\nJe souhaiterais réserver une chambre pour le mariage.\n\nCordialement,')}`}
                                  className="flex items-center justify-center gap-1.5 w-full py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-bold transition-all active:scale-95 text-white"
                                  style={{
                                    background: `linear-gradient(135deg, ${BURG_MID} 0%, ${BURG_DARK} 100%)`,
                                    boxShadow: `0 8px 20px -10px ${BURG_DARK}90, inset 0 1px 0 rgba(255,255,255,0.22)`
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
                                  className="flex items-center justify-center gap-1.5 w-full py-2 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-bold transition-all active:scale-95 text-white"
                                  style={{
                                    background: `linear-gradient(135deg, ${BURG_MID} 0%, ${BURG_DARK} 100%)`,
                                    boxShadow: `0 8px 20px -10px ${BURG_DARK}90, inset 0 1px 0 rgba(255,255,255,0.22)`
                                  }}
                                >
                                  <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  <span className="tracking-wide">Site web</span>
                                </a>
                              ) : (
                                <div className="w-full py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold text-center border" style={{ color: `${BURG_DARK}45`, background: `${BURG_DARK}06`, borderColor: `${BURG_DARK}18` }}>
                                  Aucun contact
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {((safeUserModel as any).usefulAddressesEnabled && Array.isArray((safeUserModel as any).usefulAddresses) && (safeUserModel as any).usefulAddresses.length > 0) && (
                <div className="space-y-3 sm:space-y-4 max-w-lg mx-auto">
                  <div className="text-center mb-3 sm:mb-4">
                    <h3 className="text-sm sm:text-base font-bold tracking-[0.15em] uppercase" style={{ color: BURG_DARK }}>✦ Autres adresses utiles ✦</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    {[...(safeUserModel as any).usefulAddresses]
                      .sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                      .filter((a: any) => a.name)
                      .map((ua: any, idx: number) => {
                        const IconMap: Record<string, any> = { plane: Plane, train: Train, car: Car, taxi: CarTaxiFront, info: Info };
                        const IconComp = IconMap[ua.icon || 'info'] || Info;
                        return (
                          <button
                            key={ua.id}
                            type="button"
                            onClick={() => {
                              if (!ua.address) return;
                              const url = /iPhone|iPad|iPod/.test(navigator.userAgent)
                                ? `maps://?q=${encodeURIComponent(ua.address + ' ' + ua.name)}`
                                : `https://www.google.com/maps?q=${encodeURIComponent(ua.address + ' ' + ua.name)}`;
                              window.open(url, '_blank');
                            }}
                            className="w-full text-left p-3 sm:p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                            style={{ background: '#fffdf8', borderColor: `${BURG_MID}30`, boxShadow: `0 6px 20px -10px ${BURG_DARK}25` }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow"
                                style={{ background: `linear-gradient(145deg, ${BURG_MID}, ${BURG_DARK})` }}
                              >
                                <IconComp className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm truncate" style={{ color: BURG_DARK }}>{ua.name}</h4>
                                {ua.address && <p className="text-[11px] truncate mt-0.5" style={{ color: `${BURG_DARK}70` }}>{ua.address}</p>}
                                {ua.details && (
                                  <p className="text-[10px] font-semibold mt-0.5" style={{ color: BURG_MID }}>
                                    {ua.details}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'gallery':
        return (
          <div className="relative w-full h-full overflow-visible">
            {sectionBgImage(sectionIdx) && (
              <div className="absolute inset-0 z-0 pointer-events-none opacity-10">
                <img src={sectionBgImage(sectionIdx)!} className="w-full h-full object-cover" alt="" />
              </div>
            )}
            <div className="absolute inset-0 z-0" style={{ background: `linear-gradient(180deg, ${CREAM} 0%, ${CREAM_DEEP} 100%)` }} />
            
            <div className="absolute top-[-38px] right-[-30px] z-10 pointer-events-none w-[220px] h-[220px]" style={{ transform: 'rotate(22deg)' }}>
              <img src={fleurBordeaux} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 4px 12px rgba(90,15,44,0.4)) saturate(1.05)' }} loading="lazy" />
            </div>
            
            <div className="absolute bottom-[-28px] left-[-24px] z-10 pointer-events-none w-[200px] h-[200px]" style={{ transform: 'rotate(-14deg)' }}>
              <img src={fleurDoree} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 4px 12px rgba(166,109,53,0.36)) saturate(1.08)' }} loading="lazy" />
            </div>

            <div className="relative z-10 min-h-full p-5 sm:p-7 flex flex-col">
              <div className="text-center mb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-2 border" style={{ background: `${BURG_SOFT}10`, borderColor: `${BURG_MID}30` }}>
                  <Camera className="w-2.5 h-2.5" style={{ color: BURG_DARK }} />
                  <span className="text-[10px] tracking-[0.25em] uppercase font-semibold" style={{ color: BURG_DARK }}>Galerie</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-luxury mb-2" style={{ color: BURG_DARK, letterSpacing: '-0.01em' }}>
                  Nos Moments Précieux
                </h2>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="h-[1px] w-10 sm:w-14" style={{ background: `linear-gradient(90deg, transparent, ${BURG_MID})` }} />
                  <div style={{ color: GOLD }}>✦</div>
                  <div className="h-[1px] w-10 sm:w-14" style={{ background: `linear-gradient(90deg, ${BURG_MID}, transparent)` }} />
                </div>
                <p className="text-[11px] sm:text-sm font-medium max-w-md mx-auto leading-relaxed" style={{ color: `${BURG_DARK}72` }}>
                  C'est à tes côtés que je veux construire ma vie
                </p>
              </div>

              <div className="flex-1 w-full overflow-y-auto overflow-x-hidden pr-1 -mr-1 space-y-5">
                {parallaxGalleryItems.length === 0 ? (
                  <div className="h-48 flex items-center justify-center rounded-[26px] border-2 border-dashed" style={{ borderColor: `${BURG_MID}35`, background: `linear-gradient(135deg, ${CREAM} 0%, ${CREAM_DEEP} 100%)` }}>
                    <p className="text-xs font-medium italic" style={{ color: `${BURG_DARK}55` }}>Aucune photo pour le moment</p>
                  </div>
                ) : (
                  <div className="w-full space-y-4">
                    {(() => {
                      const photos = parallaxGalleryItems;
                      const tiles: Array<{ span: 'single' | 'double' | 'tall'; rotate: number; tilt: 'left' | 'right' | 'center'; caption: string }> = [
                        { span: 'double', rotate: -1.2, tilt: 'left', caption: 'Notre première rencontre ✨' },
                        { span: 'single', rotate: 1.8, tilt: 'right', caption: 'Nos fiançailles 💍' },
                        { span: 'single', rotate: -2.1, tilt: 'left', caption: 'Le grand jour 🤍' },
                        { span: 'double', rotate: 1.1, tilt: 'right', caption: 'Voyage de noces 🌴' },
                        { span: 'single', rotate: -0.8, tilt: 'center', caption: 'En famille 👨‍👩‍👧' },
                        { span: 'single', rotate: 2.4, tilt: 'right', caption: 'À deux ❤️' },
                      ];
                      const GOLD = '#c89b2f';
                      const MOSSCARD = 'rgba(90,106,68,0.15)';
                      const MOOS_BORDER = 'rgba(90,106,68,0.38)';
                      return (
                        <div className="w-full relative">
                          <svg className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-10 opacity-50 pointer-events-none z-20" viewBox="0 0 40 40" fill="none">
                            <path d="M20 2 C26 9 31 16 20 25 C9 16 14 9 20 2Z" fill={`${GOLD}`} opacity="0.5" />
                            <circle cx="20" cy="20" r="1.6" fill={BURG_DARK} />
                          </svg>
                          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-5">
                            {photos.map((item, idx) => {
                              const tile = tiles[idx % tiles.length];
                              const safeIndex = !isNaN(idx) && idx >= 0 && idx < galleryPhotos.length ? idx : 0;
                              const isVideo = /\.(mp4|webm|mov|m4v|ogg|ogv|avi|mkv|flv|wmv|3gp)(\?.*)?$/i.test((item.src || '').split('#')[0]);
                              const isDouble = tile.span === 'double' && (idx % 3 === 0);
                              return (
                                <div
                                  key={`${item.src}-${idx}`}
                                  className={`relative group ${isDouble ? 'col-span-2' : 'col-span-1'}`}
                                  style={{
                                    transform: `rotate(${tile.rotate}deg)`,
                                    transition: 'transform 420ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 420ms ease',
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => setSelectedGalleryPhoto(galleryPhotos[safeIndex])}
                                    className={`relative w-full ${isDouble ? 'aspect-[16/10]' : 'aspect-[3/4]'} rounded-[14px] overflow-hidden shadow-[0_10px_28px_-12px_rgba(90,15,44,0.45),inset_0_1px_0_rgba(255,255,255,0.7)] active:scale-[0.975] transition-all duration-300 group-hover:shadow-[0_18px_44px_-14px_rgba(90,15,44,0.6),inset_0_1px_0_rgba(255,255,255,0.9)] group-hover:scale-[1.03] group-hover:rotate-[0deg] group-hover:z-30 text-left p-0 m-0 bg-transparent border-0 cursor-pointer`}
                                    style={{
                                      background: `linear-gradient(180deg, #fffdfa 0%, ${CREAM} 100%)`,
                                      border: `1px solid rgba(200,155,47,0.42)`,
                                      padding: isDouble ? '10px 10px 42px 10px' : '9px 9px 50px 9px',
                                      boxShadow: undefined,
                                      isolation: 'isolate',
                                    }}
                                  >
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-[5] opacity-80" preserveAspectRatio="none" viewBox="0 0 100 100" fill="none">
                                      <path d="M0.5 5.2 C1.2 2.1 4 0.6 7.1 0.7 C14.7 1 23.6 0.1 32.3 1.7 C41 3.3 49.6 2.2 58.4 1.5 C67.2 0.8 76 2.3 83.6 1.3 C89.9 0.5 96.5 2.2 98.2 8.6 C99 13.2 99 20.8 99.2 28.4 C99.5 36.1 99.8 44.2 99 52.4 C98.2 60.7 100.1 68.2 99 75.4 C98.2 81.8 96.4 87.1 93.8 90.8 C91.2 94.6 86.5 96 80.2 97 C73 98.2 65.7 99.6 58.5 99 C51.2 98.4 44.8 96.6 38.2 97.5 C31.6 98.4 25.4 100.6 18.8 99.4 C12.4 98.2 5.9 96.3 3.3 90.7 C0.9 85.5 0.2 78.3 0.1 71.1 C0 63.9 0.3 55.8 0.1 48 C-0.1 40.2 0.5 32.5 0.1 24.8 C-0.2 19.1 -0.3 11 0.5 5.2Z" stroke={`${GOLD}`} strokeOpacity="0.55" strokeWidth="0.35" fill="none" />
                                    </svg>
                                    <div className="absolute top-[-9px] left-4 w-16 h-6 z-[6] opacity-70 rotate-[-7deg] pointer-events-none"
                                      style={{
                                        background: `linear-gradient(90deg, rgba(90,106,68,0.32) 0%, rgba(90,106,68,0.18) 50%, rgba(90,106,68,0.32) 100%)`,
                                        boxShadow: `0 1px 2px rgba(0,0,0,0.12)`,
                                        borderBottom: `1px dashed rgba(90,106,68,0.45)`,
                                      }}
                                    />
                                    <div className="absolute top-[-9px] right-6 w-14 h-6 z-[6] opacity-65 rotate-[6deg] pointer-events-none"
                                      style={{
                                        background: `linear-gradient(90deg, rgba(200,155,47,0.28) 0%, rgba(200,155,47,0.14) 50%, rgba(200,155,47,0.28) 100%)`,
                                        boxShadow: `0 1px 2px rgba(0,0,0,0.1)`,
                                        borderBottom: `1px dashed rgba(200,155,47,0.45)`,
                                      }}
                                    />
                                    <div className="absolute bottom-[-6px] left-5 w-14 h-5 z-[6] opacity-55 rotate-[4deg] pointer-events-none"
                                      style={{
                                        background: `linear-gradient(90deg, rgba(90,15,44,0.22) 0%, rgba(90,15,44,0.1) 50%, rgba(90,15,44,0.22) 100%)`,
                                      }}
                                    />
                                    <div
                                      className="relative w-full h-full rounded-[10px] overflow-hidden group/photo"
                                      style={{
                                        border: `1px solid ${BURG_MID}33`,
                                        boxShadow: `inset 0 0 0 2px #fffdfa, 0 2px 6px rgba(90,15,44,0.18)`,
                                      }}
                                    >
                                      {isVideo ? (
                                        <video
                                          src={item.src}
                                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/photo:scale-[1.08]"
                                          muted loop playsInline preload="metadata" draggable={false}
                                        />
                                      ) : (
                                        <img
                                          src={item.src}
                                          alt={item.alt || `Photo ${idx + 1}`}
                                          loading="lazy"
                                          draggable={false}
                                          className="w-full h-full object-cover transition-all duration-700 ease-out group-hover/photo:scale-[1.08] group-hover/photo:brightness-105 group-hover/photo:saturate-110"
                                          style={{ filter: 'contrast(1.02) saturate(1.02)' }}
                                        />
                                      )}
                                      {isVideo && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                          <div className="w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border text-white shadow-lg transition-transform duration-300 group-hover/photo:scale-110"
                                            style={{ background: 'rgba(90,15,44,0.55)', borderColor: 'rgba(255,255,255,0.25)' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="translate-x-[1px]"><path d="M8 5v14l11-7z" /></svg>
                                          </div>
                                        </div>
                                      )}
                                      <div className="absolute inset-0 pointer-events-none z-10"
                                        style={{
                                          background: `linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 38%), linear-gradient(180deg, transparent 72%, rgba(90,15,44,0.18) 100%)`,
                                          mixBlendMode: 'soft-light',
                                        }}
                                      />
                                      <div className="absolute top-2 left-2 w-3.5 h-3.5 rounded-sm pointer-events-none z-[8]"
                                        style={{ background: `${MOSSCARD}`, borderLeft: `1px solid ${MOOS_BORDER}`, borderTop: `1px solid ${MOOS_BORDER}` }}
                                      />
                                      <div className="absolute top-2 right-2 w-3.5 h-3.5 rounded-sm pointer-events-none z-[8]"
                                        style={{ background: `${MOSSCARD}`, borderRight: `1px solid ${MOOS_BORDER}`, borderTop: `1px solid ${MOOS_BORDER}` }}
                                      />
                                      <div className="absolute bottom-2 left-2 w-3.5 h-3.5 rounded-sm pointer-events-none z-[8]"
                                        style={{ background: `${MOSSCARD}`, borderLeft: `1px solid ${MOOS_BORDER}`, borderBottom: `1px solid ${MOOS_BORDER}` }}
                                      />
                                      <div className="absolute bottom-2 right-2 w-3.5 h-3.5 rounded-sm pointer-events-none z-[8]"
                                        style={{ background: `${MOSSCARD}`, borderRight: `1px solid ${MOOS_BORDER}`, borderBottom: `1px solid ${MOOS_BORDER}` }}
                                      />
                                    </div>
                                    <div className="absolute left-0 right-0 bottom-0 px-3 pb-2 pt-2 z-[7] flex items-center justify-between">
                                      <p className="text-[10px] sm:text-[11px] font-luxury italic truncate pr-2" style={{ color: BURG_DARK, letterSpacing: '0.01em' }}>
                                        {tile.caption}
                                      </p>
                                      <span className="text-[9px] sm:text-[10px] font-black tracking-[0.18em] uppercase flex-shrink-0" style={{ color: `${GOLD}` }}>
                                        N°{String(idx + 1).padStart(2, '0')}
                                      </span>
                                    </div>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex items-center justify-center gap-2 mt-5 mb-1">
                            <svg className="w-8 h-8 opacity-70" viewBox="0 0 40 40" fill="none">
                              <path d="M20 3 C24 9 29 14 20 22 C11 14 16 9 20 3Z" fill={BURG_MID} opacity="0.45" />
                              <path d="M12 16 C16 13 19 14 20 18 C21 14 24 13 28 16 C27 21 23 24 20 27 C17 24 13 21 12 16Z" fill={MOSSCARD} stroke={MOOS_BORDER} strokeWidth="0.4" />
                              <circle cx="20" cy="17" r="1.2" fill={GOLD} />
                            </svg>
                            <p className="text-[10px] italic tracking-[0.08em]" style={{ color: `${BURG_DARK}65` }}>
                              ~ Un album, toute une vie ~
                            </p>
                            <svg className="w-8 h-8 opacity-70 scale-x-[-1]" viewBox="0 0 40 40" fill="none">
                              <path d="M20 3 C24 9 29 14 20 22 C11 14 16 9 20 3Z" fill={BURG_MID} opacity="0.45" />
                              <path d="M12 16 C16 13 19 14 20 18 C21 14 24 13 28 16 C27 21 23 24 20 27 C17 24 13 21 12 16Z" fill={MOSSCARD} stroke={MOOS_BORDER} strokeWidth="0.4" />
                              <circle cx="20" cy="17" r="1.2" fill={GOLD} />
                            </svg>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'rsvp': {
        const BURG_DARK = '#5a0f2c';
        const BURG_MID = '#7a1f3e';
        const BURG_SOFT = '#9a3458';
        const CREAM = '#faf5ec';
        const CREAM_DEEP = '#f5efe2';
        const GOLD = '#c89b2f';
        const GOLD_LIGHT = '#d9b35a';

        const handleConfirmRsvp = async (choice: 'yes' | 'no') => {
          setIsConfirmingRsvp(true);
          try {
            if (choice === 'yes' && !isConfirmed) {
              await handleConfirmation();
              setShowToastModal({ isOpen: true, type: 'confirmation' });
            } else {
              setShowToastModal({ isOpen: true, type: 'cancellation' });
            }
          } finally {
            setShowRsvpConfirm(null);
            setTimeout(() => setIsConfirmingRsvp(false), 500);
          }
        };

        return (
          <div className="relative w-full px-5 sm:px-7 pt-8 pb-14" style={{ background: 'linear-gradient(180deg, #f7f1e8 0%, #fdfaf5 100%)' }}>
            <div className="relative w-full max-w-md mx-auto">
              {/* === Formulaire RSVP simplifié === */}
              <div className="relative w-full">
                <div className="space-y-5 sm:space-y-6">

                  {/* === DESIGN RSVP — ENVELOPPE + CARTE === */}
                  <div className="relative w-full mb-2 sm:mb-3">
                    <div className="relative mx-auto w-full max-w-[320px] aspect-[4/5]">

                      {/* === 1) CORPS RECTANGLE BORDEAUX DE L'ENVELOPPE (tout le fond vertical) */}
                      <div className="absolute inset-x-[4%] inset-y-[12%]" style={{
                        background: `linear-gradient(180deg, #8a2548 0%, ${BURG_MID} 30%, ${BURG_DARK} 100%)`,
                        boxShadow: `
                          inset 0 2px 6px rgba(255,255,255,0.06),
                          0 24px 48px -20px rgba(90,15,44,0.6),
                          0 4px 10px -3px rgba(0,0,0,0.14)
                        `,
                      }} />

                      {/* === 2) CARTE RSVP BLANCHE qui sort de l'enveloppe (visible dans l'ouverture) */}
                      <div className="absolute left-[12%] right-[12%] top-[22%] bottom-[22%] z-[3]" style={{
                        background: `linear-gradient(180deg, #ffffff 0%, #fdfaf5 100%)`,
                        borderRadius: '2px',
                        boxShadow: `
                          0 14px 30px -12px rgba(90,15,44,0.5),
                          0 2px 8px rgba(90,15,44,0.12),
                          inset 0 1px 0 rgba(255,255,255,0.9)
                        `,
                      }}>
                        {/* Double bordure intérieure */}
                        <div className="absolute" style={{
                          inset: '7%',
                          border: `1px solid ${BURG_MID}`,
                          opacity: 0.55,
                          borderRadius: '1px',
                        }} />
                        <div className="absolute" style={{
                          inset: '10%',
                          border: `0.5px solid ${BURG_MID}`,
                          opacity: 0.35,
                          borderRadius: '1px',
                        }} />

                        {/* Coin orné haut gauche */}
                        <div className="absolute top-[5%] left-[5%] w-10 h-10 pointer-events-none" style={{ transform: 'rotate(-20deg)', opacity: 0.75 }}>
                          <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
                            <path d="M4 4 C 12 6, 14 12, 20 14 C 26 12, 28 6, 36 4" stroke={BURG_MID} strokeWidth="0.9" strokeLinecap="round" />
                            <circle cx="20" cy="18" r="2.2" fill={BURG_MID} />
                          </svg>
                        </div>
                        {/* Coin orné haut droit */}
                        <div className="absolute top-[5%] right-[5%] w-10 h-10 pointer-events-none" style={{ transform: 'rotate(20deg) scaleX(-1)', opacity: 0.75 }}>
                          <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
                            <path d="M4 4 C 12 6, 14 12, 20 14 C 26 12, 28 6, 36 4" stroke={BURG_MID} strokeWidth="0.9" strokeLinecap="round" />
                            <circle cx="20" cy="18" r="2.2" fill={BURG_MID} />
                          </svg>
                        </div>
                        {/* Coin orné bas gauche */}
                        <div className="absolute bottom-[5%] left-[5%] w-10 h-10 pointer-events-none" style={{ transform: 'rotate(160deg)', opacity: 0.75 }}>
                          <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
                            <path d="M4 4 C 12 6, 14 12, 20 14 C 26 12, 28 6, 36 4" stroke={BURG_MID} strokeWidth="0.9" strokeLinecap="round" />
                            <circle cx="20" cy="18" r="2.2" fill={BURG_MID} />
                          </svg>
                        </div>
                        {/* Coin orné bas droit */}
                        <div className="absolute bottom-[5%] right-[5%] w-10 h-10 pointer-events-none" style={{ transform: 'rotate(200deg) scaleX(-1)', opacity: 0.75 }}>
                          <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
                            <path d="M4 4 C 12 6, 14 12, 20 14 C 26 12, 28 6, 36 4" stroke={BURG_MID} strokeWidth="0.9" strokeLinecap="round" />
                            <circle cx="20" cy="18" r="2.2" fill={BURG_MID} />
                          </svg>
                        </div>

                        {/* Contenu texte carte RSVP */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center px-[14%]">
                          <p className="font-serif italic text-[13px] sm:text-[15px] mb-1" style={{ color: BURG_MID }}>
                            Avec amour
                          </p>
                          <h2 className="font-luxury font-black leading-[0.92] tracking-wider text-center" style={{
                            fontSize: 'clamp(2.4rem, 8.5vw, 3.6rem)',
                            color: BURG_DARK,
                            letterSpacing: '0.02em',
                          }}>
                            RS
                          </h2>
                          <h2 className="font-luxury font-black leading-[0.92] tracking-wider text-center -mt-1" style={{
                            fontSize: 'clamp(2.4rem, 8.5vw, 3.6rem)',
                            color: BURG_DARK,
                            letterSpacing: '0.02em',
                          }}>
                            VP
                          </h2>
                          <div className="flex items-center gap-2 mt-3 sm:mt-4">
                            <div className="h-px w-6" style={{ background: `${BURG_MID}88` }} />
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
                            <div className="h-px w-6" style={{ background: `${BURG_MID}88` }} />
                          </div>
                        </div>
                      </div>

                      {/* === 3) RABAT TRIANGULAIRE CRÈME (blanc cassé) — POINTE VERS LE BAS, recouvre la carte */}
                      <div className="absolute inset-x-[4%] top-0 h-[32%]" style={{
                        background: `linear-gradient(180deg, #faf4e8 0%, #f0e7d2 100%)`,
                        clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                        boxShadow: `
                          inset 0 2px 4px rgba(255,255,255,0.7),
                          0 8px 18px -10px rgba(90,15,44,0.28)
                        `,
                        zIndex: 5,
                      }} />
                      {/* Petit filet beige sur le bord inférieur du rabat pour la profondeur */}
                      <div className="absolute left-[4%] right-[4%] top-[31.7%] h-[2px]" style={{
                        background: `linear-gradient(90deg, transparent 0%, rgba(120,85,40,0.35) 50%, transparent 100%)`,
                        zIndex: 5,
                      }} />

                      {/* === BOUQUET FLEURS — HAUT-GAUCHE (dessus rabat + enveloppe) */}
                      <div className="absolute -left-[18px] -top-[22px] z-[10] pointer-events-none select-none w-[180px] h-[180px]" style={{ transform: 'rotate(-22deg)' }}>
                        <img src={fleurBordeaux} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 5px 14px rgba(90,15,44,0.5)) saturate(1.08)' }} loading="lazy" />
                      </div>

                      {/* === BOUQUET FLEURS — BAS-DROITE */}
                      <div className="absolute -right-[22px] -bottom-[30px] z-[10] pointer-events-none select-none w-[220px] h-[220px]" style={{ transform: 'rotate(14deg)' }}>
                        <img src={fleurDoree} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 5px 14px rgba(166,109,53,0.45)) saturate(1.12)' }} loading="lazy" />
                      </div>
                      <div className="absolute -right-[2px] -bottom-[2px] z-[11] pointer-events-none select-none w-[110px] h-[110px]" style={{ transform: 'rotate(-6deg)' }}>
                        <img src={fleurBordeaux} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 4px 10px rgba(90,15,44,0.5)) saturate(1.06)' }} loading="lazy" />
                      </div>
                    </div>
                  </div>

                  {/* Confirmation de présence */}
                  <div>
                    <label className="block text-[11px] sm:text-xs font-semibold mb-2.5 tracking-wide" style={{ color: BURG_DARK, opacity: 0.85 }}>
                      Serez-vous présent(e) ?
                    </label>
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => !isConfirmed && handleConfirmRsvp('yes')}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md text-[11px] sm:text-xs font-bold tracking-wide transition-all duration-200 active:scale-[0.97] ${isConfirmed ? 'text-white shadow-lg' : 'text-white'}`}
                        style={{
                          background: `linear-gradient(135deg, ${BURG_MID}, ${BURG_DARK})`,
                          border: `1px solid ${BURG_DARK}`,
                          boxShadow: isConfirmed ? `0 4px 14px -4px ${BURG_DARK}99, inset 0 1px 0 rgba(255,255,255,0.25)` : 'inset 0 1px 0 rgba(255,255,255,0.2)',
                        }}
                      >
                        <span>🤍</span>
                        Oui, je serai là
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmRsvp('no')}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md text-[11px] sm:text-xs font-bold tracking-wide transition-all duration-200 active:scale-[0.97]"
                        style={{
                          background: '#ffffff',
                          border: `1px solid ${BURG_MID}55`,
                          color: BURG_MID,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                        }}
                      >
                        <span>💔</span>
                        Non, désolé(e)
                      </button>
                    </div>
                  </div>

                  {/* Choix de boissons (si activé et personnalisable) */}
                  {drinksEnabled && Array.isArray(safeUserModel.drinkOptions) && safeUserModel.drinkOptions.length > 0 && (
                    <div className="pt-1">
                      <div className="relative w-full">
                        {/* Cadre extérieur bordeaux style carte */}
                        <div className="absolute -top-1 -left-1 -bottom-1 -right-1 rounded-[4px]" style={{
                          background: `linear-gradient(135deg, ${BURG_MID} 0%, #8a2a4a 50%, ${BURG_DARK} 100%)`,
                          opacity: 0.92,
                        }} />
                        {/* Fond intérieur crème */}
                        <div className="relative bg-[#fffdf8] rounded-[2px] p-4 sm:p-5 overflow-hidden" style={{
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
                        }}>
                          {/* Ornement coin gauche */}
                          <div className="absolute -top-12 -left-12 w-[156px] h-[156px] pointer-events-none z-10" style={{ transform: 'rotate(-18deg)' }}>
                            <img src={fleurBordeaux} alt="" className="w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(90,15,44,0.35)]" style={{ filter: 'drop-shadow(0 2px 4px rgba(90,15,44,0.25)) saturate(1.05)' }} loading="lazy" />
                          </div>
                          {/* Ornement coin droit */}
                          <div className="absolute -top-12 -right-12 w-[144px] h-[144px] pointer-events-none z-10" style={{ transform: 'rotate(22deg) scaleX(-1)' }}>
                            <img src={fleurDoree} alt="" className="w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(166,109,53,0.3)]" style={{ filter: 'drop-shadow(0 2px 4px rgba(166,109,53,0.2)) saturate(1.08)' }} loading="lazy" />
                          </div>

                          {/* Titre + séparateur — centrés */}
                          <div className="flex flex-col items-center mb-4">
                            <h2 className="font-luxury font-medium leading-[1.05] text-[18px] sm:text-[22px] tracking-wide text-center" style={{ color: BURG_DARK }}>
                              Boissons
                            </h2>
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="h-px w-6" style={{ background: `${BURG_MID}88` }} />
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: `${BURG_MID}aa` }} />
                              <div className="h-px w-6" style={{ background: `${BURG_MID}88` }} />
                            </div>
                            <div className="flex items-center justify-center w-full mt-2 gap-3">
                              <label className="text-[10.5px] sm:text-[11.5px] font-semibold tracking-wide" style={{ color: BURG_DARK, opacity: 0.78 }}>
                                Choisissez (max 2)
                              </label>
                              <span className="text-[10px] font-bold" style={{ color: BURG_MID }}>
                                {selectedDrink.length}/2
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            {(safeUserModel.drinkOptions || []).map((drink: string) => (
                              <button
                                key={drink}
                                onClick={() => handleDrinkSelection(drink)}
                                className={`flex items-center gap-1.5 px-2 py-2.5 rounded-md transition-all duration-200 text-left group h-full active:scale-95 ${
                                  selectedDrink.includes(drink) ? 'shadow-md' : ''
                                }`}
                                style={{
                                  background: selectedDrink.includes(drink) ? `linear-gradient(180deg, ${BURG_MID}, ${BURG_DARK})` : '#ffffff',
                                  color: selectedDrink.includes(drink) ? '#ffffff' : BURG_DARK,
                                  border: `1px solid ${selectedDrink.includes(drink) ? BURG_DARK : BURG_MID}33`,
                                }}
                              >
                                <Wine
                                  className="h-3.5 w-3.5 flex-shrink-0"
                                  style={{ color: selectedDrink.includes(drink) ? '#fff' : BURG_SOFT }}
                                />
                                <span className="text-[10px] font-bold leading-tight break-words uppercase">{drink}</span>
                              </button>
                            ))}
                          </div>

                          {/* Filet doré en bas */}
                          <svg className="mx-auto mt-4 w-10" viewBox="0 0 40 6" fill="none">
                            <path d="M2 3 Q10 0 20 3 Q30 6 38 3" stroke={GOLD} strokeWidth="0.8" strokeLinecap="round" opacity="0.85" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message (pour les mariés - guest book) */}
                  <div>
                    <label className="block text-[11px] sm:text-xs font-semibold mb-1.5 tracking-wide" style={{ color: BURG_DARK, opacity: 0.85 }}>
                      Votre message
                    </label>
                    <textarea
                      rows={3}
                      value={guestMessage}
                      onChange={(e) => setGuestMessage(e.target.value)}
                      placeholder="Un petit mot pour les mariés..."
                      className="w-full px-4 py-3 rounded-md text-[13px] sm:text-sm outline-none transition-all duration-200 resize-none"
                      style={{
                        background: '#ffffff',
                        border: `1px solid ${BURG_MID}22`,
                        color: BURG_DARK,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <button
                        type="button"
                        onClick={() => setShowGuestBookViewer(true)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10.5px] font-semibold tracking-wide transition-all active:scale-95 hover:opacity-90"
                        style={{
                          color: BURG_MID,
                        }}
                      >
                        <BookOpen className="w-3.5 h-3.5" strokeWidth={2} />
                        <span>Voir le livre d'or</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={isSubmittingMessage || !guestMessage.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: `linear-gradient(135deg, ${BURG_MID}, ${BURG_DARK})`,
                          color: '#ffffff',
                          border: `1px solid ${BURG_DARK}`,
                          boxShadow: isSubmittingMessage || !guestMessage.trim() ? 'none' : `0 4px 14px -4px ${BURG_DARK}99, inset 0 1px 0 rgba(255,255,255,0.22)`,
                        }}
                      >
                        {isSubmittingMessage ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Envoi…</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" strokeWidth={2.2} />
                            <span>Envoyer</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'games':
        return (
          <div className="relative w-full h-full overflow-visible">
            {sectionBgImage(sectionIdx) && (
              <div className="absolute inset-0 z-0 pointer-events-none opacity-12">
                <img src={sectionBgImage(sectionIdx)!} className="w-full h-full object-cover" alt="" />
              </div>
            )}
            <div className="absolute inset-0 z-0" style={{ background: `linear-gradient(180deg, ${CREAM} 0%, ${CREAM_DEEP} 100%)` }} />
            
            <div className="absolute top-[-54px] left-[-48px] z-10 pointer-events-none w-[270px] h-[270px]" style={{ transform: 'rotate(-20deg)' }}>
              <img src={fleurBordeaux} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 4px 12px rgba(90,15,44,0.42)) saturate(1.05)' }} loading="lazy" />
            </div>
            
            <div className="absolute bottom-[-46px] right-[-40px] z-10 pointer-events-none w-[250px] h-[250px]" style={{ transform: 'rotate(18deg) scaleX(-1)' }}>
              <img src={fleurDoree} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 4px 12px rgba(166,109,53,0.38)) saturate(1.08)' }} loading="lazy" />
            </div>

            <div className="relative z-10 min-h-full p-5 sm:p-7 flex flex-col justify-center">
              <div className="w-full max-w-md mx-auto">
                <div
                  className="relative w-full rounded-[36px] overflow-hidden p-[1.5px]"
                  style={{
                    background: `linear-gradient(160deg, ${BURG_MID} 0%, ${BURG_DARK} 48%, ${GOLD} 100%)`,
                    boxShadow: `0 30px 70px -18px ${BURG_DARK}55, 0 18px 40px -10px ${BURG_DARK}35`,
                  }}
                >
                  <div className="relative w-full rounded-[34.5px] overflow-hidden" style={{ background: `linear-gradient(180deg, #fffdf8 0%, ${CREAM} 100%)` }}>
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                        <path d="M2 8 Q2 2 8 2 L14 2 L14 5 Q8 5 8 11 L8 14 L5 14 L5 8 Z" fill={BURG_MID} opacity="0.45" />
                        <path d="M11 11 Q13 7 17 7 Q14 10 14 14 Q10 14 11 11Z" fill={BURG_MID} opacity="0.35" />
                      </svg>
                    </div>
                    <div className="absolute top-3 right-3 pointer-events-none" style={{ transform: 'scaleX(-1)' }}>
                      <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                        <path d="M2 8 Q2 2 8 2 L14 2 L14 5 Q8 5 8 11 L8 14 L5 14 L5 8 Z" fill={BURG_MID} opacity="0.45" />
                        <path d="M11 11 Q13 7 17 7 Q14 10 14 14 Q10 14 11 11Z" fill={BURG_MID} opacity="0.35" />
                      </svg>
                    </div>
                    <div className="absolute bottom-3 left-3 pointer-events-none" style={{ transform: 'scaleY(-1)' }}>
                      <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                        <path d="M2 8 Q2 2 8 2 L14 2 L14 5 Q8 5 8 11 L8 14 L5 14 L5 8 Z" fill={BURG_MID} opacity="0.45" />
                        <path d="M11 11 Q13 7 17 7 Q14 10 14 14 Q10 14 11 11Z" fill={BURG_MID} opacity="0.35" />
                      </svg>
                    </div>
                    <div className="absolute bottom-3 right-3 pointer-events-none" style={{ transform: 'scale(-1,-1)' }}>
                      <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                        <path d="M2 8 Q2 2 8 2 L14 2 L14 5 Q8 5 8 11 L8 14 L5 14 L5 8 Z" fill={BURG_MID} opacity="0.45" />
                        <path d="M11 11 Q13 7 17 7 Q14 10 14 14 Q10 14 11 11Z" fill={BURG_MID} opacity="0.35" />
                      </svg>
                    </div>
                    
                    <div className="absolute inset-0 pointer-events-none opacity-45" style={{
                      background: `radial-gradient(ellipse 75% 45% at 32% 0%, ${BURG_SOFT}25 0%, transparent 62%), radial-gradient(ellipse 60% 38% at 82% 100%, ${BURG_MID}20 0%, transparent 58%)`
                    }}></div>

                    <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: `1px solid ${BURG_MID}25` }}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: BURG_MID, boxShadow: `0 0 10px ${BURG_SOFT}aa` }}></div>
                        <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: GOLD, animationDelay: '0.3s', boxShadow: `0 0 10px ${GOLD}88` }}></div>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border" style={{ background: `${BURG_SOFT}14`, borderColor: `${BURG_MID}35` }}>
                        <Star className="w-3 h-3" style={{ color: GOLD }} fill={GOLD} />
                        <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: BURG_DARK }}>Pour la soirée</span>
                      </div>
                    </div>

                    <div className="relative z-10 p-5 space-y-5">
                      <div className="text-center relative">
                        <div className="relative inline-block mb-4">
                          <div className="relative inline-flex items-center justify-center w-[68px] h-[68px] rounded-[20px] shadow-lg" style={{ background: `linear-gradient(145deg, ${BURG_MID} 0%, ${BURG_DARK} 100%)`, border: `2px solid ${GOLD}55`, boxShadow: `0 12px 26px -10px ${BURG_DARK}88` }}>
                            <Gamepad2 className="w-8 h-8 text-white drop-shadow" strokeWidth={2.2} />
                          </div>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-luxury mb-2" style={{ color: BURG_DARK, letterSpacing: '-0.01em' }}>
                          Jeux & Fun
                        </h2>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className="h-[1px] w-10 sm:w-12" style={{ background: `linear-gradient(90deg, transparent, ${BURG_MID})` }} />
                          <div style={{ color: GOLD }}>✦</div>
                          <div className="h-[1px] w-10 sm:w-12" style={{ background: `linear-gradient(90deg, ${BURG_MID}, transparent)` }} />
                        </div>
                        <p className="text-sm font-semibold tracking-wide" style={{ color: `${BURG_DARK}72` }}>Régalez-vous avant la soirée</p>
                      </div>

                      <div className="space-y-3.5 relative z-10">
                        {games
                          .filter((g: GameConfiguration) => g.isEnabled && g.type !== 'puzzle')
                          .map((game: GameConfiguration, index: number) => {
                            const gameInfo = AVAILABLE_GAMES.find(g => g.type === game.type);
                            const resultsForGame = gameResults[game.id] || [];
                            const hasResultForThisGame = resultsForGame.some(res => res.guestName === invite?.nom && res.gameType === game.type);
                            const isCompleted = completedGames.has(game.id) || hasResultForThisGame;
                            return (
                              <div
                                key={game.id}
                                className="rounded-[26px] overflow-hidden border shadow-lg transition-all duration-300 hover:shadow-2xl group relative active:scale-[0.99]"
                                style={{ 
                                  background: `linear-gradient(180deg, #fffdf8 0%, ${CREAM} 100%)`, 
                                  borderColor: `${BURG_MID}30`,
                                  boxShadow: `0 10px 28px -14px ${BURG_DARK}30, inset 0 1px 0 rgba(255,255,255,0.85)`
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => setCurrentGameId(game.id)}
                                  className="w-full px-5 py-4.5 relative z-10 cursor-pointer text-left bg-transparent border-0 p-0"
                                  style={{ pointerEvents: 'auto' }}
                                >
                                  <div className="flex items-center gap-4">
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setCurrentGameId(game.id); }}
                                      className="rounded-[22px] flex items-center justify-center text-2xl shadow group-hover:scale-110 transition-transform duration-250 flex-shrink-0 cursor-pointer active:scale-95 bg-transparent border-0 p-0"
                                      style={{ background: `linear-gradient(145deg, ${BURG_SOFT}25 0%, ${BURG_MID}18 100%)`, border: `1.5px solid ${BURG_MID}40`, width: '52px', height: '52px', pointerEvents: 'auto' }}
                                    >
                                      {gameInfo?.icon || '🎮'}
                                    </button>
                                    <div className="flex-1 text-center px-1">
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setCurrentGameId(game.id); }}
                                        className="font-extrabold text-base mb-1.5 break-words cursor-pointer select-none active:scale-[0.97] inline-block transition-transform bg-transparent border-0 p-0 text-center"
                                        style={{ color: BURG_DARK, pointerEvents: 'auto' }}
                                      >
                                        {game.title}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setCurrentGameId(game.id); }}
                                        className="text-xs font-medium line-clamp-2 cursor-pointer select-none active:scale-[0.98] transition-transform bg-transparent border-0 p-0 text-center block mx-auto"
                                        style={{ color: `${BURG_DARK}70`, pointerEvents: 'auto' }}
                                      >
                                        {game.description}
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setCurrentGameId(game.id); }}
                                      className="w-9 h-9 rounded-full flex items-center justify-center shadow group-hover:scale-110 group-hover:translate-x-0.5 transition-all duration-250 flex-shrink-0 cursor-pointer active:scale-95 bg-transparent border-0 p-0"
                                      style={{ background: `linear-gradient(145deg, ${BURG_MID} 0%, ${BURG_DARK} 100%)`, boxShadow: `0 8px 18px -8px ${BURG_DARK}80`, pointerEvents: 'auto' }}
                                    >
                                      <ChevronRight className="text-white w-5 h-5" strokeWidth={2.8} />
                                    </button>
                                  </div>
                                  {isCompleted && (
                                    <div className="mt-3 flex justify-center">
                                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border" style={{ background: `rgba(16,185,129,0.12)`, borderColor: `rgba(16,185,129,0.35)` }}>
                                        <Check className="w-4 h-4" style={{ color: '#059669' }} />
                                        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#059669' }}>
                                          Terminé
                                        </span>
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
                </div>
              </div>
            </div>
          </div>
        );

      case 'qr':
        return (
          <div className="relative w-full h-full overflow-visible">
            {sectionBgImage(sectionIdx) && (
              <div className="absolute inset-0 z-0 pointer-events-none opacity-10">
                <img src={sectionBgImage(sectionIdx)!} className="w-full h-full object-cover" alt="" />
              </div>
            )}
            <div className="absolute inset-0 z-0" style={{ background: `linear-gradient(180deg, ${CREAM} 0%, ${CREAM_DEEP} 100%)` }} />
            
            <div className="absolute top-[-50px] right-[-42px] z-10 pointer-events-none w-[250px] h-[250px]" style={{ transform: 'rotate(24deg)' }}>
              <img src={fleurBordeaux} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 4px 12px rgba(90,15,44,0.42)) saturate(1.05)' }} loading="lazy" />
            </div>
            
            <div className="absolute bottom-[-42px] left-[-34px] z-10 pointer-events-none w-[220px] h-[220px]" style={{ transform: 'rotate(-16deg)' }}>
              <img src={fleurDoree} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 4px 12px rgba(166,109,53,0.38)) saturate(1.08)' }} loading="lazy" />
            </div>

            <div className="relative z-10 min-h-full p-5 sm:p-7 flex flex-col justify-between">
              <div className="w-full max-w-md mx-auto">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 border" style={{ background: `${BURG_SOFT}10`, borderColor: `${BURG_MID}30` }}>
                    <QrCode className="w-2.5 h-2.5" style={{ color: BURG_DARK }} />
                    <span className="text-[10px] tracking-[0.25em] uppercase font-semibold" style={{ color: BURG_DARK }}>Souvenir</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-luxury mb-2" style={{ color: BURG_DARK, letterSpacing: '-0.01em' }}>
                    Votre Invitation
                  </h2>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="h-[1px] w-10 sm:w-14" style={{ background: `linear-gradient(90deg, transparent, ${BURG_MID})` }} />
                    <div style={{ color: GOLD }}>✦</div>
                    <div className="h-[1px] w-10 sm:w-14" style={{ background: `linear-gradient(90deg, ${BURG_MID}, transparent)` }} />
                  </div>
                  <p className="text-[11px] sm:text-sm font-medium max-w-md mx-auto" style={{ color: `${BURG_DARK}72` }}>
                    Présentez ce code à l'entrée de l'événement
                  </p>
                </div>

                <div 
                  className="rounded-[32px] p-6 shadow-xl flex flex-col items-center border relative overflow-hidden" 
                  style={{ 
                    background: `linear-gradient(180deg, #fffdf8 0%, ${CREAM} 100%)`,
                    borderColor: `${BURG_MID}35`,
                    boxShadow: `0 20px 50px -18px ${BURG_DARK}40, 0 10px 24px -10px ${BURG_DARK}22`
                  }}
                >
                  <div className="absolute top-2.5 left-2.5 pointer-events-none">
                    <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                      <path d="M2 8 Q2 2 8 2 L14 2 L14 5 Q8 5 8 11 L8 14 L5 14 L5 8 Z" fill={BURG_MID} opacity="0.42" />
                    </svg>
                  </div>
                  <div className="absolute top-2.5 right-2.5 pointer-events-none" style={{ transform: 'scaleX(-1)' }}>
                    <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                      <path d="M2 8 Q2 2 8 2 L14 2 L14 5 Q8 5 8 11 L8 14 L5 14 L5 8 Z" fill={BURG_MID} opacity="0.42" />
                    </svg>
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 pointer-events-none" style={{ transform: 'scaleY(-1)' }}>
                    <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                      <path d="M2 8 Q2 2 8 2 L14 2 L14 5 Q8 5 8 11 L8 14 L5 14 L5 8 Z" fill={BURG_MID} opacity="0.42" />
                    </svg>
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 pointer-events-none" style={{ transform: 'scale(-1,-1)' }}>
                    <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                      <path d="M2 8 Q2 2 8 2 L14 2 L14 5 Q8 5 8 11 L8 14 L5 14 L5 8 Z" fill={BURG_MID} opacity="0.42" />
                    </svg>
                  </div>
                  
                  <div className="absolute inset-0 pointer-events-none opacity-35" style={{
                    background: `radial-gradient(ellipse 65% 40% at 50% 0%, ${BURG_SOFT}20 0%, transparent 58%)`
                  }}></div>
                  
                  <div className="relative z-10 flex items-center space-x-2 mb-5 mt-2">
                    <QrCode className="h-5 w-5" style={{ color: BURG_DARK }} />
                    <h3 className="text-base font-bold" style={{ color: BURG_DARK }}>Code d'Invitation</h3>
                  </div>
                  <div
                    className="bg-white p-3 rounded-[22px] mb-5 w-full max-w-[200px] aspect-square flex items-center justify-center relative"
                    style={{ 
                      border: `1.5px solid ${BURG_MID}35`,
                      boxShadow: `0 0 40px ${BURG_DARK}18, inset 0 0 18px rgba(90,15,44,0.04)`
                    }}
                  >
                    <div className="absolute inset-[3px] rounded-[18px] pointer-events-none" style={{ 
                      border: `1px dashed ${BURG_SOFT}45`
                    }}></div>
                    {qrCodeDataUrl ? (
                      <img src={qrCodeDataUrl} className="w-full h-full object-contain relative z-10 p-1" alt="QR Code" />
                    ) : (
                      <div className="w-full h-full rounded-xl relative z-10" style={{ background: `linear-gradient(135deg, ${CREAM}, ${CREAM_DEEP})`, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                    )}
                  </div>
                  <div className="w-full text-center space-y-1 mb-5 relative z-10">
                    <p className="font-bold text-sm" style={{ color: BURG_DARK }}>{safeInvite.nom}</p>
                    <p className="text-[11px]" style={{ color: `${BURG_DARK}65` }}>Table : {safeInvite.table} • {selectedDrink.length > 0 ? selectedDrink.join(' + ') : 'Boisson à choisir'}</p>
                  </div>
                  <button
                    onClick={downloadQRCode}
                    className="w-full py-3.5 rounded-full font-bold text-xs shadow-lg flex items-center justify-center space-x-3 hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group active:scale-[0.98] text-white"
                    style={{ 
                      background: `linear-gradient(135deg, ${BURG_MID} 0%, ${BURG_DARK} 100%)`,
                      boxShadow: `0 12px 28px -10px ${BURG_DARK}95, inset 0 1px 0 rgba(255,255,255,0.22)`
                    }}
                  >
                    <Download className="h-4 w-4" />
                    <span className="uppercase tracking-[0.15em]">Télécharger</span>
                  </button>
                </div>
              </div>

              <div className="mt-auto pt-6 pb-1 flex justify-center w-full z-10">
                <div 
                  className="px-3 py-2.5 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 shadow-xl border w-full max-w-md rounded-2xl"
                  style={{ 
                    background: `linear-gradient(180deg, #fffdf8 0%, ${CREAM} 100%)`,
                    borderColor: `${BURG_MID}28`,
                    boxShadow: `0 12px 32px -14px ${BURG_DARK}28`
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Heart className="h-3.5 w-3.5" style={{ color: BURG_DARK }} fill={BURG_DARK} />
                    <p className="text-[11px] font-medium text-center" style={{ color: `${BURG_DARK}78` }}>
                      Réalisé par{' '}
                      <a
                        href="https://www.furaha-digital.net/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold hover:underline transition-all"
                        style={{ color: BURG_DARK }}
                      >
                        Furaha Digital
                      </a>
                    </p>
                    <Sparkles className="h-3 w-3" style={{ color: GOLD }} />
                  </div>
                  <div className="h-[1px] w-16 sm:h-4 sm:w-[1px]" style={{ background: `${BURG_MID}25` }}></div>
                  <a href="https://wa.me/243844333917" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 group">
                    <svg className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span className="text-[11px] font-semibold text-emerald-700 hover:underline transition-all">
                      Contactez-nous sur WhatsApp
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen selection:bg-amber-500/30 font-poppins relative overflow-x-hidden"
      style={{
        background: 'linear-gradient(180deg, #faf6f1 0%, #f5efe3 100%)',
      }}
    >
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
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .animate-bounce-slow { animation: bounce-slow 2.8s infinite ease-in-out; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fadeIn 0.5s ease-out both; }
        .animate-zoom-in { animation: zoomIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.5s ease-out both; }
      `}</style>

      <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'radial-gradient(ellipse at center top, rgba(252,211,77,0.04), transparent 60%)' }}></div>

      {safeUserModel.backgroundMusic && (
        <audio ref={audioRef} src={safeUserModel.backgroundMusic} loop preload="auto" />
      )}

      <div className="relative z-20 min-h-screen w-full overflow-x-hidden overflow-y-auto no-scrollbar" style={{
        background: 'linear-gradient(180deg, #faf6f1 0%, #f7f1e8 50%, #fdfaf5 100%)',
      }}>
        <div className="relative mx-auto w-full max-w-[440px] sm:max-w-[480px] min-h-screen pb-24">
          {sectionDefinitions.map((sectionType, idx) => (
            <section
              key={sectionType}
              aria-label={sectionType}
              className="relative w-full"
            >
              {renderPage(sectionType, idx)}
            </section>
          ))}
        </div>
      </div>

      {selectedGalleryPhoto && (
        <PhotoViewer
          photos={galleryPhotos}
          initialPhoto={selectedGalleryPhoto}
          onClose={() => setSelectedGalleryPhoto(null)}
          optimizeImage={optimizeImageFn}
          themeColors={{ primary: colors.primary, secondary: colors.secondary, accent: colors.accent }}
        />
      )}



      {(safeUserModel as any).guestBookEnabled !== false && showGuestBookViewer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/78 backdrop-blur-xl" onClick={() => setShowGuestBookViewer(false)}></div>
          {(() => {
            const BURG_DARK = '#5a0f2c';
            const BURG_MID = '#7a1f3e';
            const BURG_SOFT = '#9a3458';
            const GOLD = '#c89b2f';
            const GOLD_LIGHT = '#d9b35a';
            const CREAM = '#faf5ec';
            const CREAM_DEEP = '#f5efe2';
            return (
              <div className="relative w-full max-w-lg animate-zoom-in">
                {/* Close button */}
                <button
                  onClick={() => setShowGuestBookViewer(false)}
                  className="absolute -top-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center z-20 transition-all hover:scale-110 active:scale-95"
                  style={{
                    background: CREAM,
                    boxShadow: '0 6px 18px -4px rgba(90,15,44,0.55), 0 0 0 1px rgba(90,15,44,0.15)',
                    border: `1px solid ${BURG_MID}33`,
                  }}
                >
                  <X className="h-4 w-4" style={{ color: BURG_DARK }} />
                </button>

                {/* Outer burgundy frame */}
                <div className="absolute -top-1.5 -left-1.5 -bottom-1.5 -right-1.5 rounded-[14px]" style={{
                  background: `linear-gradient(135deg, ${BURG_MID} 0%, #8a2a4a 50%, ${BURG_DARK} 100%)`,
                  boxShadow: '0 50px 120px -30px rgba(90,15,44,0.85), 0 0 0 1px rgba(90,15,44,0.25)',
                }} />

                {/* Inner cream container */}
                <div className="relative rounded-[10px] max-h-[86vh] flex flex-col overflow-hidden" style={{
                  background: `linear-gradient(180deg, ${CREAM} 0%, ${CREAM_DEEP} 100%)`,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
                }}>
                  {/* Ornaments corners */}
                  <div className="absolute -top-14 -left-14 w-[160px] h-[160px] pointer-events-none opacity-90" style={{ transform: 'rotate(-14deg)' }}>
                    <img src={fleurBordeaux} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 3px 8px rgba(90,15,44,0.4)) saturate(1.05)' }} loading="lazy" />
                  </div>
                  <div className="absolute -top-14 -right-14 w-[160px] h-[160px] pointer-events-none opacity-90" style={{ transform: 'rotate(22deg) scaleX(-1)' }}>
                    <img src={fleurDoree} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 3px 8px rgba(166,109,53,0.36)) saturate(1.08)' }} loading="lazy" />
                  </div>
                  <div className="absolute -bottom-14 -left-14 w-[160px] h-[160px] pointer-events-none opacity-85" style={{ transform: 'rotate(160deg) scaleX(-1)' }}>
                    <img src={fleurDoree} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 3px 8px rgba(166,109,53,0.36)) saturate(1.08)' }} loading="lazy" />
                  </div>
                  <div className="absolute -bottom-14 -right-14 w-[160px] h-[160px] pointer-events-none opacity-85" style={{ transform: 'rotate(202deg) scaleX(-1)' }}>
                    <img src={fleurBordeaux} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 3px 8px rgba(90,15,44,0.4)) saturate(1.05)' }} loading="lazy" />
                  </div>

                  {/* Header */}
                  <div className="relative z-10 px-7 pt-7 pb-4">
                    <p className="text-[9px] tracking-[0.28em] uppercase font-black" style={{ color: BURG_MID, opacity: 0.72 }}>
                      Livre d'or
                    </p>
                    <h3 className="font-luxury font-medium leading-tight tracking-wide text-[26px] sm:text-[30px] mt-1" style={{ color: BURG_DARK }}>
                      Mots doux & vœux
                    </h3>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="h-px w-10" style={{ background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
                      <div className="h-px w-10" style={{ background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
                    </div>
                    <p className="mt-3 text-[11.5px] leading-relaxed font-serif italic" style={{ color: '#5c4a36', opacity: 0.9 }}>
                      {guestBookMessages && guestBookMessages.length > 0
                        ? <>{guestBookMessages.length} mot{guestBookMessages.length > 1 ? 's' : ''} d'amour déjà déposés pour les heureux élus.</>
                        : <>Soyez le premier à laisser un mot précieux dans le formulaire ci-contre.</>}
                    </p>
                  </div>

                  {/* Messages scroll list (read-only) */}
                  <div className="flex-1 overflow-y-auto px-5 sm:px-7 pb-6 pt-2 no-scrollbar">
                    {guestBookMessages && guestBookMessages.length > 0 ? (
                      <div className="space-y-5 pb-2 relative z-10">
                        {guestBookMessages.map((msg, index) => {
                          const isMe = msg.inviteId === inviteId;
                          const initials = (msg.nom || 'Inconnu').split(' ').map((n: any) => n ? n[0] : '').join('').substring(0, 2).toUpperCase();
                          const cardStyles = [
                            { bg: '#fff6ee', text: '#9a4c2a', accent: '#b06d3b', border: '#fbe3cc' },
                            { bg: '#fdf1f3', text: '#8b3a4e', accent: `${BURG_MID}`, border: '#f7d1d9' },
                            { bg: '#fdf5f9', text: '#8a3961', accent: '#c26a95', border: '#f5dcea' },
                            { bg: '#fff9ef', text: '#8a5a1a', accent: GOLD, border: '#f8e3b8' },
                          ];
                          const style = cardStyles[index % cardStyles.length];
                          return (
                            <div
                              key={msg.id || index}
                              className={`flex items-start space-x-3 ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}
                              style={{ animationDelay: `${index * 0.08}s` }}
                            >
                              <div className="flex-shrink-0 mt-1 relative">
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center text-[9px] font-black shadow-md border-[1.5px] relative z-10`}
                                  style={{
                                    background: isMe
                                      ? `linear-gradient(135deg, ${BURG_MID}, ${BURG_DARK})`
                                      : `linear-gradient(135deg, ${style.accent}cc, ${style.accent}66)`,
                                    color: '#ffffff',
                                    borderColor: isMe ? BURG_DARK : style.accent + '66',
                                  }}
                                >
                                  {initials || '?'}
                                </div>
                              </div>
                              <div
                                className={`flex-1 p-4 sm:p-4.5 relative transition-all duration-500 ${isMe ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-tl-md'}`}
                                style={{
                                  background: isMe
                                    ? `linear-gradient(135deg, ${BURG_MID}ee, ${BURG_DARK}ee)`
                                    : `linear-gradient(135deg, ${style.bg}, ${style.bg}cc)`,
                                  boxShadow: '0 4px 16px -8px rgba(90,15,44,0.22), inset 0 1px 0 rgba(255,255,255,0.6)',
                                  border: `1px solid ${isMe ? BURG_DARK + '55' : style.border}`,
                                  color: isMe ? '#ffffff' : style.text,
                                }}
                              >
                                <div className="flex justify-between items-center mb-2 gap-3">
                                  <div className="flex flex-col">
                                    {!isMe && (
                                      <span className="text-[10px] font-black uppercase tracking-[0.16em] mb-0.5" style={{ color: isMe ? '#ffffffdd' : style.accent }}>
                                        {msg.nom || 'Invité spécial(e)'}
                                      </span>
                                    )}
                                    <div className="flex items-center space-x-1.5 text-[8px] font-semibold" style={{ opacity: isMe ? 0.7 : 0.75 }}>
                                      <Clock className="h-2 w-2" />
                                      <span>
                                        {msg.timestamp
                                          ? new Date(msg.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                                          : '--'}
                                      </span>
                                    </div>
                                  </div>
                                  <Feather
                                    className="h-3.5 w-3.5 flex-shrink-0 opacity-40"
                                    style={{ color: isMe ? '#ffffff' : style.accent }}
                                  />
                                </div>
                                <p className="text-[13px] sm:text-[13.5px] leading-relaxed font-serif italic" style={{ color: isMe ? '#ffffffee' : style.text }}>
                                  « {msg.message} »
                                </p>
                                {msg.replies && msg.replies.length > 0 && (
                                  <div className="mt-3 space-y-2.5">
                                    {msg.replies.map((r: any, rIdx: number) => {
                                      const adminName = r.authorName || 'Organisateur';
                                      return (
                                        <div
                                          key={r.id || rIdx}
                                          className="relative border-l-[2px] pl-3 py-0.5"
                                          style={{ borderColor: isMe ? 'rgba(255,255,255,0.4)' : style.accent + '77' }}
                                        >
                                          <div className="flex items-center justify-between mb-0.5 gap-2">
                                            <span className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: isMe ? 'rgba(255,255,255,0.92)' : style.accent }}>
                                              {adminName}
                                            </span>
                                            <span className="text-[7.5px] font-semibold flex items-center gap-0.5 whitespace-nowrap" style={{ color: isMe ? 'rgba(255,255,255,0.68)' : (style.text + '88') }}>
                                              <Clock className="h-1.5 w-1.5" />
                                              {r.createdAt
                                                ? new Date(r.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                                                : ''}
                                            </span>
                                          </div>
                                          <p
                                            className="leading-relaxed"
                                            style={{
                                              fontSize: '11px',
                                              color: isMe ? 'rgba(255,255,255,0.9)' : style.text,
                                              fontFamily: "'Georgia', 'Times New Roman', serif",
                                              fontStyle: 'italic',
                                              opacity: 0.88,
                                            }}
                                          >
                                            {r.content}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center py-10 relative z-10">
                        <div className="relative w-24 h-24 mb-5">
                          <div className="absolute -top-10 -left-10 w-[112px] h-[112px] pointer-events-none opacity-70" style={{ transform: 'rotate(-14deg)' }}>
                            <img src={fleurBordeaux} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 2px 5px rgba(90,15,44,0.35)) saturate(1.05)' }} loading="lazy" />
                          </div>
                          <div className="absolute -bottom-10 -right-10 w-[112px] h-[112px] pointer-events-none opacity-70" style={{ transform: 'rotate(22deg) scaleX(-1)' }}>
                            <img src={fleurDoree} alt="" className="w-full h-full object-contain" style={{ filter: 'drop-shadow(0 2px 5px rgba(166,109,53,0.32)) saturate(1.08)' }} loading="lazy" />
                          </div>
                          <div className="relative w-24 h-24 rounded-[20px] flex items-center justify-center shadow-xl" style={{
                            background: `linear-gradient(145deg, #fffdf8 0%, ${CREAM} 100%)`,
                            border: `1px solid ${BURG_MID}33`,
                          }}>
                            <BookOpen className="h-11 w-11" style={{ color: BURG_MID }} strokeWidth={1.7} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-px w-8" style={{ background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
                          <div className="h-px w-8" style={{ background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
                        </div>
                        <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-center" style={{ color: BURG_MID, opacity: 0.85 }}>
                          Livre d'or encore vierge
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bottom footer hint (read-only indicator) */}
                  <div className="relative z-10 px-7 pb-5 pt-2">
                    <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-[10px]" style={{
                      background: `${BURG_MID}10`,
                      border: `1px dashed ${BURG_MID}44`,
                    }}>
                      <Feather className="h-3.5 w-3.5 flex-shrink-0" style={{ color: BURG_MID }} />
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: BURG_MID, opacity: 0.88 }}>
                        Mode lecture seule · écrivez depuis le formulaire
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

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
                ) : ('Supprimer')}
              </button>
            </div>
          </div>
        </div>
      )}

      {currentGameId && (() => {
        const game = games.find(g => g.id === currentGameId);
        if (!game) return null;
        const gameInfo = AVAILABLE_GAMES.find(g => g.type === game.type);
        const currentGameResults = gameResults[game.id] || [];
        const playerResult = currentGameResults.find(res => res.guestName === invite?.nom && res.gameType === game.type);
        const isCompleted = completedGames.has(game.id) || !!playerResult;
        const playerScore = playerResult?.score;
        const handleGameComplete = async () => { setCompletedGames(prev => new Set([...prev, game.id])); };
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
            default: return (
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
              <div className="flex-1 overflow-y-auto p-6 no-scrollbar relative bg-[#faf9f6]">{renderGameContent()}</div>
            </div>
          </div>
        );
      })()}

      {/* === TOAST MODAL STYLE LIVRE === */}
      {showToastModal.isOpen && (() => {
        const BURG_DARK = '#5a0f2c';
        const BURG_MID = '#7a1f3e';
        const GOLD = '#c89b2f';
        const GOLD_LIGHT = '#d9b35a';
        const CREAM = '#faf5ec';
        const CREAM_DEEP = '#f5efe2';
        const isDrink = showToastModal.type === 'drink';
        const isConfirmation = showToastModal.type === 'confirmation';
        const isCancellation = showToastModal.type === 'cancellation';

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={() => setShowToastModal({ ...showToastModal, isOpen: false })}></div>
            <div className="relative w-full max-w-sm animate-zoom-in">
              {/* Close button */}
              <button
                onClick={() => setShowToastModal({ ...showToastModal, isOpen: false })}
                className="absolute -top-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center z-20 transition-all hover:scale-110 active:scale-95"
                style={{
                  background: CREAM,
                  boxShadow: '0 6px 18px -4px rgba(90,15,44,0.55), 0 0 0 1px rgba(90,15,44,0.15)',
                  border: `1px solid ${BURG_MID}33`,
                }}
              >
                <X className="h-4 w-4" style={{ color: BURG_DARK }} />
              </button>

              {/* Outer burgundy frame */}
              <div className="absolute -top-1.5 -left-1.5 -bottom-1.5 -right-1.5 rounded-[14px]" style={{
                background: `linear-gradient(135deg, ${BURG_MID} 0%, #8a2a4a 50%, ${BURG_DARK} 100%)`,
                boxShadow: '0 30px 70px -20px rgba(90,15,44,0.7), 0 0 0 1px rgba(90,15,44,0.2)',
              }} />

              {/* Inner cream content */}
              <div className="relative rounded-[10px] p-6 sm:p-7 text-center overflow-hidden" style={{
                background: `linear-gradient(180deg, ${CREAM} 0%, ${CREAM_DEEP} 100%)`,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
              }}>
                {/* Top-left ornament */}
                <div className="absolute -top-4 -left-4 w-[64px] h-[64px] pointer-events-none opacity-90" style={{ transform: 'rotate(-14deg)' }}>
                  <div className="absolute inset-0 rounded-full" style={{
                    background: `radial-gradient(circle at 32% 28%, #ffe0ef 0%, #e09cb2 48%, ${BURG_MID} 100%)`,
                  }} />
                </div>
                {/* Top-right ornament */}
                <div className="absolute -top-4 -right-4 w-[64px] h-[64px] pointer-events-none opacity-90" style={{ transform: 'rotate(22deg) scaleX(-1)' }}>
                  <div className="absolute inset-0 rounded-full" style={{
                    background: `radial-gradient(circle at 32% 28%, #ffe8c9 0%, #e5b87f 48%, #a66d35 100%)`,
                  }} />
                </div>

                <div className="relative z-10 flex flex-col items-center space-y-4">
                  {/* Icon */}
                  <div className="relative h-20 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center justify-center opacity-25">
                      <div
                        className="w-20 h-20 rounded-full animate-pulse"
                        style={{ backgroundColor: isCancellation ? '#9a3458' : GOLD }}
                      ></div>
                    </div>

                    {isDrink ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(145deg, ${BURG_MID}, ${BURG_DARK})`, boxShadow: `0 6px 16px -4px ${BURG_DARK}88` }}>
                          <Wine className="h-6 w-6 text-white" />
                        </div>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(145deg, ${GOLD}, #a66d35)`, boxShadow: '0 6px 16px -4px rgba(166,109,53,0.6)' }}>
                          <Sparkles className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    ) : isConfirmation ? (
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `radial-gradient(circle at 32% 28%, ${GOLD_LIGHT} 0%, ${GOLD} 48%, #8e6a1c 100%)`, boxShadow: `0 8px 22px -6px rgba(142,106,28,0.65), inset 0 1px 0 rgba(255,255,255,0.35)` }}>
                          <Heart className="h-8 w-8 text-white fill-white" />
                        </div>
                        <Sparkles className="h-5 w-5 absolute -top-1 -right-1" style={{ color: BURG_MID }} />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(145deg, #a4737f, #7a4a56)`, boxShadow: '0 8px 22px -6px rgba(122,74,86,0.6)' }}>
                        <Users className="h-8 w-8 text-white/80" />
                      </div>
                    )}
                  </div>

                  {/* Text content */}
                  <div className="space-y-2">
                    <p className="text-[10px] tracking-[0.2em] uppercase font-black" style={{ color: `${BURG_MID}`, opacity: 0.7 }}>
                      {isDrink ? 'Célébrons ensemble' : isConfirmation ? 'Présence confirmée' : 'Modification prise en compte'}
                    </p>

                    <h2
                      className="text-2xl font-luxury tracking-wide"
                      style={{ color: isCancellation ? '#7a4a56' : BURG_DARK }}
                    >
                      {isDrink ? 'Santé !' : isConfirmation ? 'Merci !' : 'À bientôt !'}
                    </h2>

                    {/* Gold separator */}
                    <div className="flex items-center justify-center gap-2 py-0.5">
                      <div className="h-px w-8" style={{ background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
                      <div className="h-px w-8" style={{ background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
                    </div>

                    <p className="text-sm leading-relaxed font-serif italic" style={{ color: '#5c4a36' }}>
                      {isDrink ? (
                        <>
                          {showToastModal.drink ? (
                            <>Excellent choix, <strong style={{ color: BURG_DARK }}>{showToastModal.drink}</strong> est réservé !</>
                          ) : (
                            <>Choix de boisson retiré avec succès.</>
                          )}
                        </>
                      ) : isConfirmation ? (
                        <>Merci pour votre confirmation, votre présence est <strong style={{ color: BURG_DARK }}>enregistrée</strong>. Nous avons hâte de vous célébrer !</>
                      ) : (
                        <>Nous notons votre indisponibilité. Merci pour votre réponse, <strong style={{ color: '#7a4a56' }}>à bientôt peut-être</strong>.</>
                      )}
                    </p>
                  </div>

                  {/* Mini fermeture auto-indication (pas un bouton cliquable) */}
                  <p className="mt-1 text-[9px] font-bold tracking-[0.25em] uppercase" style={{ color: `${BURG_MID}`, opacity: 0.55 }}>
                    · se ferme automatiquement ·
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {showNotificationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => {
            if (!(permission === 'granted' || token)) {
              localStorage.setItem('furaha_notification_modal_dismissed', 'true');
            }
            setShowNotificationModal(false);
          }} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-slide-up">
            <div className="p-6 text-center" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Ne manquez pas l'événement !</h2>
            </div>
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
              {notificationError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
                  ⚠️ Erreur : {notificationError}
                </div>
              )}
              {(permission === 'granted' || token) ? (
                <>
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
                    ✅ Notifications activées avec succès !
                  </div>
                  <p className="text-slate-600 text-center mb-6">Recevez un rappel automatiquement pour ne pas oublier la date !</p>
                  <button
                    onClick={() => setShowNotificationModal(false)}
                    className="w-full py-3 px-4 text-slate-500 font-medium rounded-xl transition-all hover:bg-slate-100"
                  >
                    Quitter
                  </button>
                </>
              ) : isFCMSupported !== false ? (
                <>
                  <p className="text-slate-600 text-center mb-6">Recevez un rappel automatiquement pour ne pas oublier la date !</p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={async () => { await requestPermission({ inviteId, inviteDocPath }); }}
                      disabled={isNotificationLoading || isFCMSupported === false}
                      className="w-full py-3 px-4 text-white font-semibold rounded-xl shadow-lg transition-all active:scale-95"
                      style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
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
              ) : (
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

export default BookLayout;
