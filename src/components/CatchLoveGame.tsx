import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Trophy, Play, Clock, Heart, Star, Gem, Flower2, Sparkles } from 'lucide-react';
import { GameResult, CatchLoveConfig } from '../services/templateService';

interface CatchLoveGameProps {
  config: CatchLoveConfig;
  userId: string;
  modelId: string;
  inviteId: string;
  guestName: string;
  onComplete?: (score: number) => void;
  onSaveResult?: (score: number) => Promise<void>;
  leaderboard?: GameResult[];
  colors?: { primary: string; secondary: string; accent: string };
  isCompleted?: boolean;
  playerScore?: number;
}

type FallingItemType = 'heart' | 'double_heart' | 'ring' | 'bouquet' | 'couple' | 'champagne' | 'broken' | 'bomb';

interface FallingItem {
  id: number;
  type: FallingItemType;
  left: number;
  top: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  caught: boolean;
  popping: boolean;
}

interface FloatingText {
  id: number;
  text: string;
  color: string;
  left: number;
  top: number;
}

const ITEM_CONFIG: Record<FallingItemType, { score: number; label: string; color: string; emoji: string; bad?: boolean; timeBonus?: number; chance: number }> = {
  heart:         { score: 10, label: '+10',  color: '#ef4444', emoji: '❤️',   chance: 40 },
  double_heart:  { score: 30, label: '+30',  color: '#ec4899', emoji: '💖',   chance: 18 },
  ring:          { score: 50, label: '+50',  color: '#fbbf24', emoji: '💍',   chance: 10 },
  bouquet:       { score: 75, label: '+75',  color: '#a855f7', emoji: '💐',   chance: 6 },
  couple:        { score: 100, label: '+100', color: '#f97316', emoji: '💑',   chance: 3 },
  champagne:     { score: 0, label: '+5s',   color: '#22d3ee', emoji: '🍾',   timeBonus: 5, chance: 5 },
  broken:        { score: -15, label: '-15', color: '#475569', emoji: '💔',   bad: true, chance: 12 },
  bomb:          { score: -30, label: '-30', color: '#0f172a', emoji: '💣',   bad: true, chance: 6 },
};

const DIFFICULTY_PROFILES: Record<string, { baseSpeed: number; spawnRate: number; acceleration: number }> = {
  easy:   { baseSpeed: 0.9, spawnRate: 1100, acceleration: 0.006 },
  normal: { baseSpeed: 1.2, spawnRate: 850,  acceleration: 0.011 },
  hard:   { baseSpeed: 1.6, spawnRate: 620,  acceleration: 0.018 },
};

const CatchLoveGame: React.FC<CatchLoveGameProps> = ({
  config,
  userId,
  modelId,
  inviteId,
  guestName,
  onComplete,
  onSaveResult,
  leaderboard = [],
  colors = { primary: '#f59e0b', secondary: '#d946ef', accent: '#fbbf24' },
  isCompleted: isAlreadyCompleted = false,
  playerScore
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.totalGameTime || 45);
  const [isCompleted, setIsCompleted] = useState(isAlreadyCompleted);
  const [showLeaderboard, setShowLeaderboard] = useState(config.showLeaderboard && isAlreadyCompleted);
  const [showInstructions, setShowInstructions] = useState(!isAlreadyCompleted);
  const [itemsState, setItemsState] = useState<FallingItem[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [particles, setParticles] = useState<Array<{ id: number; left: number; top: number; color: string }>>([]);
  const [showEndAnimation, setShowEndAnimation] = useState(false);
  const [screenShake, setScreenShake] = useState(false);

  const gameAreaRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnRef = useRef<NodeJS.Timeout | null>(null);
  const loopRef = useRef<number | null>(null);
  const itemIdRef = useRef(0);
  const ftIdRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const speedMultiplierRef = useRef(1);
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const itemsRef = useRef<FallingItem[]>([]);
  const tickRef = useRef(0);
  const isMobileRef = useRef<boolean>(
    typeof window !== 'undefined' &&
    (window.innerWidth < 768 || /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent))
  );
  const lowPerfRef = useRef<boolean>(isMobileRef.current);

  const playSound = useCallback((type: 'catch' | 'rare' | 'bonus' | 'bad' | 'win' | 'start') => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;

    switch (type) {
      case 'catch': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(990, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.13);
        break;
      }
      case 'rare': {
        const notes = [659.25, 783.99, 1046.5];
        notes.forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.07);
          gain.gain.setValueAtTime(0.28, ctx.currentTime + i * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.07 + 0.22);
          osc.start(ctx.currentTime + i * 0.07); osc.stop(ctx.currentTime + i * 0.07 + 0.23);
        });
        break;
      }
      case 'bonus': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.22);
        break;
      }
      case 'bad': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.26);
        break;
      }
      case 'win': {
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1568];
        notes.forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.type = i % 2 === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.11);
          gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.11);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.11 + 0.45);
          osc.start(ctx.currentTime + i * 0.11); osc.stop(ctx.currentTime + i * 0.11 + 0.48);
        });
        break;
      }
      case 'start': {
        const notes = [523.25, 783.99];
        notes.forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.1);
          gain.gain.setValueAtTime(0.22, ctx.currentTime + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.2);
          osc.start(ctx.currentTime + i * 0.1); osc.stop(ctx.currentTime + i * 0.1 + 0.22);
        });
        break;
      }
    }
  }, []);

  const vibrate = (pattern: number[]) => { if (navigator.vibrate) try { navigator.vibrate(pattern); } catch {} };

  useEffect(() => {
    setIsCompleted(isAlreadyCompleted);
    if (isAlreadyCompleted) setShowLeaderboard(config.showLeaderboard && isAlreadyCompleted);
  }, [isAlreadyCompleted, config.showLeaderboard]);

  const sortedLeaderboard = useMemo(() => [...leaderboard].sort((a, b) => (b.score || 0) - (a.score || 0)), [leaderboard]);

  const pickItemType = useCallback((): FallingItemType => {
    const total = Object.values(ITEM_CONFIG).reduce((s, c) => s + c.chance, 0);
    let r = Math.random() * total;
    for (const [type, cfg] of Object.entries(ITEM_CONFIG) as Array<[FallingItemType, typeof ITEM_CONFIG[FallingItemType]]>) {
      r -= cfg.chance;
      if (r <= 0) return type;
    }
    return 'heart';
  }, []);

  const MAX_ACTIVE_ITEMS = lowPerfRef.current ? 14 : 22;

  const spawnItem = useCallback(() => {
    if (!gameAreaRef.current) return;
    if (itemsRef.current.filter(i => !i.caught).length >= MAX_ACTIVE_ITEMS) return;
    const areaW = gameAreaRef.current.clientWidth;
    const size = 40 + Math.random() * 22;
    const left = Math.random() * Math.max(1, areaW - size);
    const type = pickItemType();
    const diffProfile = DIFFICULTY_PROFILES[config.difficulty || 'normal'];
    const newItem: FallingItem = {
      id: ++itemIdRef.current,
      type,
      left,
      top: -size - 20,
      speed: (diffProfile.baseSpeed + Math.random() * 0.7) * speedMultiplierRef.current,
      rotation: Math.random() * 360,
      rotationSpeed: lowPerfRef.current ? (Math.random() - 0.5) * 2 : (Math.random() - 0.5) * 4,
      size,
      caught: false,
      popping: false,
    };
    itemsRef.current = [...itemsRef.current, newItem];
  }, [pickItemType, config.difficulty, MAX_ACTIVE_ITEMS]);

  const completeGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    if (loopRef.current !== null) cancelAnimationFrame(loopRef.current);
    timerRef.current = null; spawnRef.current = null; loopRef.current = null;
    playSound('win');
    vibrate([100, 50, 100, 50, 100, 50, 200]);
    setShowEndAnimation(true);
    setTimeout(() => {
      setShowEndAnimation(false);
      setIsCompleted(true);
      setIsPlaying(false);
      if (onComplete) onComplete(score);
      if (onSaveResult) onSaveResult(score);
    }, 2200);
  }, [onComplete, onSaveResult, playSound, score]);

  useEffect(() => {
    if (!isPlaying || isCompleted || showInstructions) return;
    const diffProfile = DIFFICULTY_PROFILES[config.difficulty || 'normal'];

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          completeGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const actualSpawnRate = lowPerfRef.current
      ? diffProfile.spawnRate * 1.35
      : diffProfile.spawnRate;

    spawnRef.current = setInterval(() => {
      spawnItem();
    }, actualSpawnRate);

    let lastTs = performance.now();
    const frameInterval = lowPerfRef.current ? 33 : 16;
    let acc = 0;

    const loop = (ts: number) => {
      const dt = Math.min(64, ts - lastTs);
      lastTs = ts;
      speedMultiplierRef.current = Math.min(lowPerfRef.current ? 2.0 : 2.6, speedMultiplierRef.current + diffProfile.acceleration * dt / 16);
      if (gameAreaRef.current) {
        const areaH = gameAreaRef.current.clientHeight;
        const arr = itemsRef.current;
        const out: FallingItem[] = [];
        for (let i = 0; i < arr.length; i++) {
          const it = arr[i];
          if (it.caught && !it.popping) continue;
          const newTop = it.top + it.speed * dt / 16;
          const newRot = lowPerfRef.current ? it.rotation : it.rotation + it.rotationSpeed * dt / 16;
          if (newTop > areaH + 60) continue;
          it.top = newTop;
          it.rotation = newRot;
          out.push(it);
        }
        itemsRef.current = out;
      }
      tickRef.current++;
      acc += dt;
      if (acc >= frameInterval) {
        acc = 0;
        setItemsState(itemsRef.current);
      }
      loopRef.current = requestAnimationFrame(loop);
    };
    loopRef.current = requestAnimationFrame(loop);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (spawnRef.current) clearInterval(spawnRef.current);
      if (loopRef.current !== null) cancelAnimationFrame(loopRef.current);
      timerRef.current = null; spawnRef.current = null; loopRef.current = null;
    };
  }, [isPlaying, isCompleted, showInstructions, config.difficulty, spawnItem, completeGame]);

  const addFloatingText = (text: string, color: string, left: number, top: number) => {
    const id = ++ftIdRef.current;
    setFloatingTexts(prev => [...prev, { id, text, color, left, top }]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(ft => ft.id !== id)), lowPerfRef.current ? 650 : 900);
  };

  const addParticles = (x: number, y: number, color: string, count = 10) => {
    const finalCount = lowPerfRef.current ? Math.min(6, Math.ceil(count / 2)) : count;
    const newP = Array.from({ length: finalCount }, (_, i) => ({
      id: Date.now() + i + Math.random(),
      left: x, top: y, color,
    }));
    setParticles(prev => [...prev, ...newP]);
    setTimeout(() => {
      const ids = new Set(newP.map(p => p.id));
      setParticles(prev => prev.filter(p => !ids.has(p.id)));
    }, lowPerfRef.current ? 500 : 700);
  };

  const handleItemClick = (item: FallingItem, e: React.MouseEvent | React.TouchEvent) => {
    if (!isPlaying || item.caught) return;
    e.stopPropagation();
    const cfg = ITEM_CONFIG[item.type];

    const target = itemsRef.current.find(it => it.id === item.id);
    if (target) { target.caught = true; target.popping = true; }
    setItemsState([...itemsRef.current]);
    setTimeout(() => {
      itemsRef.current = itemsRef.current.filter(it => it.id !== item.id);
      setItemsState([...itemsRef.current]);
    }, 300);

    let cx = item.left + item.size / 2;
    let cy = item.top + item.size / 2;

    if (cfg.bad) {
      playSound('bad');
      vibrate([200, 100, 150]);
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 280);
      setCombo(0);
      const actual = cfg.score;
      setScore(prev => Math.max(0, prev + actual));
      addFloatingText(cfg.label, cfg.color, cx, cy);
      addParticles(cx, cy, cfg.color, lowPerfRef.current ? 5 : 8);
    } else if (cfg.timeBonus) {
      playSound('bonus');
      vibrate([80, 40, 120]);
      setTimeLeft(prev => prev + (cfg.timeBonus || 0));
      addFloatingText(cfg.label, cfg.color, cx, cy);
      addParticles(cx, cy, cfg.color, lowPerfRef.current ? 7 : 14);
    } else {
      const isRare = item.type === 'ring' || item.type === 'bouquet' || item.type === 'couple';
      if (isRare) playSound('rare'); else playSound('catch');
      vibrate(isRare ? [60, 40, 60, 40, 100] : [40]);

      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(prev => Math.max(prev, newCombo));
      comboTimeoutRef.current = setTimeout(() => setCombo(0), 1800);

      const multiplier = newCombo >= 10 ? 3 : newCombo >= 5 ? 2 : newCombo >= 3 ? 1.5 : 1;
      const gained = Math.round(cfg.score * multiplier);
      setScore(prev => prev + gained);
      const label = multiplier > 1 ? `+${gained} x${multiplier}` : `+${gained}`;
      addFloatingText(label, cfg.color, cx, cy);
      addParticles(cx, cy, cfg.color, isRare ? (lowPerfRef.current ? 10 : 18) : (lowPerfRef.current ? 6 : 10));
    }
  };

  const startGame = () => {
    setScore(0); setCombo(0); setMaxCombo(0);
    setTimeLeft(config.totalGameTime || 45);
    itemsRef.current = []; setItemsState([]); setFloatingTexts([]); setParticles([]);
    speedMultiplierRef.current = 1;
    itemIdRef.current = 0;
    setShowInstructions(false);
    setIsCompleted(false);
    setIsPlaying(true);
    playSound('start');
    vibrate([50, 30, 50]);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const isLowTime = timeLeft <= 10;
  const isCritical = timeLeft <= 5;
  const isLowPerf = lowPerfRef.current;
  const isMobileView = isMobileRef.current;

  return (
    <div className={`relative w-full h-full flex flex-col overflow-hidden rounded-3xl transition-transform ${screenShake ? 'animate-[shake_0.25s_ease-in-out]' : ''}`}>
      <style>{`
        @keyframes floatUp {
          0% { transform: translate(-50%, 0) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -60px) scale(1.5); opacity: 0; }
        }
        @keyframes popBurst {
          0% { transform: scale(1); opacity: 1; }
          60% { transform: scale(1.8); opacity: 0.7; }
          100% { transform: scale(0); opacity: 0; }
        }
        @keyframes particleFly {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0); opacity: 0; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px) rotate(-0.6deg); }
          40% { transform: translateX(8px) rotate(0.6deg); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        @keyframes itemPop {
          0% { transform: scale(1) rotate(var(--r, 0deg)); }
          50% { transform: scale(1.5) rotate(calc(var(--r, 0deg) + 180deg)); opacity: 0.5; }
          100% { transform: scale(0) rotate(calc(var(--r, 0deg) + 360deg)); opacity: 0; }
        }
        @keyframes shinePulse {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.4)); }
          50% { filter: drop-shadow(0 0 16px rgba(251, 191, 36, 0.9)); }
        }
        @keyframes endGlow {
          0% { box-shadow: 0 0 0 rgba(251, 191, 36, 0); }
          50% { box-shadow: 0 0 120px 40px rgba(251, 191, 36, 0.5), 0 0 200px 80px rgba(217, 70, 239, 0.3); }
          100% { box-shadow: 0 0 0 rgba(251, 191, 36, 0); }
        }
        @keyframes bgGradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes blobFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -30px) scale(1.08); }
          66% { transform: translate(-15px, 20px) scale(0.95); }
        }
        @keyframes blobFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 20px) scale(1.1); }
          66% { transform: translate(20px, -25px) scale(0.92); }
        }
        @keyframes blobFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, -20px) scale(1.05); }
        }
        @keyframes sparkleTwinkle {
          0%, 100% { opacity: 0; transform: scale(0.6) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.1) rotate(180deg); }
        }
        @keyframes bgHeartFloat {
          0% { transform: translateY(110%) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: var(--ho, 0.35); }
          90% { opacity: var(--ho, 0.35); }
          100% { transform: translateY(-20%) translateX(var(--hx, 20px)) rotate(360deg); opacity: 0; }
        }
        @keyframes softVignettePulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.85; }
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.06; }
          50% { opacity: 0.1; }
        }
      `}</style>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, #fff1f2 0%, #fef3c7 20%, #fdf4ff 40%, #fce7f3 60%, #fff7ed 80%, #fef3c7 100%)`,
          backgroundSize: isLowPerf ? '100% 100%' : '400% 400%',
          animation: isLowPerf ? 'none' : 'bgGradientShift 18s ease infinite',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 20%, rgba(244, 114, 182, 0.18) 0%, transparent 35%),
            radial-gradient(circle at 85% 15%, rgba(251, 191, 36, 0.15) 0%, transparent 38%),
            radial-gradient(circle at 50% 95%, rgba(168, 85, 247, 0.14) 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(236, 72, 153, 0.16) 0%, transparent 35%)`,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(236, 72, 153, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(236, 72, 153, 0.08) 1px, transparent 1px)`,
          backgroundSize: '42px 42px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          animation: 'gridPulse 6s ease-in-out infinite',
        }}
      />

      {/* Header Controls */}
      <div className="relative z-20 flex items-center justify-between px-3 sm:px-5 py-3 border-b border-neutral-200/60 bg-white/70 backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full shadow-sm transition-colors ${
            isCritical ? 'bg-rose-100 text-rose-700 animate-pulse' :
            isLowTime ? 'bg-amber-100 text-amber-700' :
            'bg-emerald-100 text-emerald-700'
          }`}>
            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-bold text-sm sm:text-base tabular-nums">{formatTime(timeLeft)}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full shadow-sm bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700">
            <Heart className="h-4 w-4 sm:h-5 sm:w-5 fill-rose-500" />
            <span className="font-bold text-sm sm:text-base tabular-nums">{score}</span>
          </div>
          {combo >= 3 && (
            <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full shadow-sm bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500 text-white animate-pulse">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="font-black text-[11px] sm:text-xs">x{combo >= 10 ? 3 : combo >= 5 ? 2 : 1.5} COMBO</span>
            </div>
          )}
        </div>
        {config.showLeaderboard && (
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-all shadow-sm"
            title="Classement"
          >
            <Trophy className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Leaderboard Panel */}
      {showLeaderboard && config.showLeaderboard && (
        <div className="relative z-30 mx-3 sm:mx-5 mt-3 p-3 sm:p-4 rounded-2xl border shadow-lg bg-white/90 backdrop-blur-sm" style={{ borderColor: `${colors.primary}40` }}>
          <h3 className="font-bold mb-2.5 flex items-center gap-2 text-sm sm:text-base" style={{ color: colors.primary }}>
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
            Classement
          </h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {sortedLeaderboard.length === 0 ? (
              <p className="text-neutral-500 text-center py-3 text-xs sm:text-sm">Aucun résultat, sois le premier !</p>
            ) : sortedLeaderboard.slice(0, 10).map((r, i) => (
              <div
                key={r.id}
                className={`flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm ${
                  i === 0 ? 'bg-yellow-50 border border-yellow-200' :
                  i === 1 ? 'bg-neutral-50 border border-neutral-200' :
                  i === 2 ? 'bg-orange-50 border border-orange-200' :
                  'bg-white border border-neutral-100'
                } ${r.guestName === guestName ? 'ring-2 ring-offset-1' : ''}`}
                style={r.guestName === guestName ? { boxShadow: `0 0 0 1px ${colors.primary}`, backgroundColor: `${colors.primary}10` } : {}}
              >
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-black text-[10px] sm:text-xs flex-shrink-0 ${
                    i === 0 ? 'bg-yellow-400 text-yellow-900' :
                    i === 1 ? 'bg-neutral-400 text-white' :
                    i === 2 ? 'bg-orange-400 text-white' :
                    'bg-neutral-200 text-neutral-700'
                  }`}>
                    {i + 1}
                  </div>
                  <span className="font-medium truncate">{r.guestName}</span>
                </div>
                <div className="font-bold ml-2 flex-shrink-0">{r.score}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game Area */}
      <div
        ref={gameAreaRef}
        className={`relative z-10 flex-1 overflow-hidden mx-3 sm:mx-5 my-3 sm:my-4 rounded-2xl sm:rounded-3xl shadow-inner border border-rose-200/60 ${
          isCritical ? 'ring-2 ring-rose-400/70 animate-pulse' : isLowTime ? 'ring-2 ring-amber-400/50' : ''
        } ${showEndAnimation ? 'animate-[endGlow_2s_ease-in-out]' : ''}`}
        style={{
          background: `linear-gradient(160deg, #fff5f7 0%, #fef3c7 25%, #fce7f3 50%, #fdf4ff 75%, #fff1f2 100%)`,
          backgroundSize: isLowPerf ? '100% 100%' : '300% 300%',
          animation: isLowPerf ? 'none' : 'bgGradientShift 14s ease infinite',
        }}
      >
        {/* ===== GAME AREA DECORATIVE BACKGROUND ===== */}
        {/* Animated blobs (simplified on low perf: less blur, no animation, static gradients) */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            top: '-10%', left: '-12%', width: isLowPerf ? '45%' : '55%', height: isLowPerf ? '45%' : '55%',
            background: 'radial-gradient(circle, rgba(251, 113, 133, 0.35) 0%, rgba(244, 114, 182, 0.22) 40%, transparent 70%)',
            filter: `blur(${isLowPerf ? '12px' : '28px'})`,
            animation: isLowPerf ? 'none' : 'blobFloat1 11s ease-in-out infinite',
            zIndex: 1,
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            bottom: '-15%', right: '-8%', width: isLowPerf ? '40%' : '50%', height: isLowPerf ? '40%' : '50%',
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.32) 0%, rgba(217, 70, 239, 0.22) 45%, transparent 70%)',
            filter: `blur(${isLowPerf ? '12px' : '28px'})`,
            animation: isLowPerf ? 'none' : 'blobFloat2 13s ease-in-out infinite',
            zIndex: 1,
          }}
        />
        {!isLowPerf && (
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              top: '45%', right: '-15%', width: '45%', height: '45%',
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.28) 0%, rgba(236, 72, 153, 0.2) 45%, transparent 70%)',
              filter: 'blur(26px)',
              animation: 'blobFloat3 9s ease-in-out infinite',
              zIndex: 1,
            }}
          />
        )}
        {!isLowPerf && (
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              bottom: '35%', left: '-12%', width: '40%', height: '40%',
              background: 'radial-gradient(circle, rgba(244, 114, 182, 0.3) 0%, rgba(251, 191, 36, 0.2) 45%, transparent 70%)',
              filter: 'blur(26px)',
              animation: 'blobFloat2 15s ease-in-out infinite reverse',
              zIndex: 1,
            }}
          />
        )}

        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.6) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.6) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
            maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 70%)',
            zIndex: 2,
          }}
        />

        {/* Twinkling sparkles (reduced on low perf) */}
        {Array.from({ length: isLowPerf ? 10 : 22 }).map((_, i) => {
          const left = (i * 47) % 100;
          const top = (i * 29 + 11) % 100;
          const delay = (i * 0.37) % 4;
          const dur = 2.4 + ((i * 0.43) % 2.2);
          const size = 3 + ((i * 1.7) % 5);
          const hues = ['#fbbf24', '#f472b6', '#a855f7', '#fb7185', '#facc15'];
          const hue = hues[i % hues.length];
          return (
            <div
              key={`sp-${i}`}
              className="absolute pointer-events-none"
              style={{
                left: `${left}%`, top: `${top}%`,
                width: `${size}px`, height: `${size}px`,
                zIndex: 3,
              }}
            >
              <div
                style={{
                  width: '100%', height: '100%',
                  borderRadius: '50%',
                  background: hue,
                  boxShadow: isLowPerf ? undefined : `0 0 ${size * 2}px ${hue}, 0 0 ${size}px rgba(255,255,255,0.8)`,
                  animation: `sparkleTwinkle ${dur}s ease-in-out ${delay}s infinite`,
                }}
              />
            </div>
          );
        })}

        {/* Floating background hearts (non interactive) - reduced on low perf */}
        {(isLowPerf ? ['❤️', '💕', '💖'] : ['❤️', '💕', '💖', '💗', '✨', '💝']).map((emoji, i) => {
          const left = 5 + i * (isLowPerf ? 28 : 16) + ((i * 7) % 8);
          const dur = (isLowPerf ? 16 : 12) + i * 2.5;
          const delay = i * 1.8;
          const hx = ((i % 2 === 0 ? 1 : -1) * (20 + (i * 5) % 30));
          const ho = 0.22 + ((i * 0.07) % 0.2);
          const fsize = 18 + ((i * 5) % 16);
          return (
            <div
              key={`bh-${i}`}
              className="absolute pointer-events-none select-none"
              style={{
                left: `${left}%`, bottom: 0,
                fontSize: `${fsize}px`,
                zIndex: 4,
                animation: `bgHeartFloat ${dur}s ease-in-out ${delay}s infinite`,
                // @ts-ignore
                '--hx': `${hx}px`,
                '--ho': `${ho}`,
              } as React.CSSProperties}
            >
              {emoji}
            </div>
          );
        })}

        {/* Soft vignette glow */}
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl sm:rounded-3xl"
          style={{
            background: `
              radial-gradient(ellipse at center, transparent 45%, rgba(251, 113, 133, 0.12) 75%, rgba(168, 85, 247, 0.1) 100%)`,
            zIndex: 5,
            animation: isLowPerf ? 'none' : 'softVignettePulse 5s ease-in-out infinite',
          }}
        />

        {/* Inner highlight top */}
        <div
          className="absolute inset-x-0 top-0 h-24 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)',
            borderRadius: 'inherit',
            zIndex: 6,
          }}
        />
        {/* ===== END DECORATIVE BACKGROUND ===== */}

        {/* Falling Items */}
        {itemsState.map(item => {
          const cfg = ITEM_CONFIG[item.type];
          const isRare = item.type === 'ring' || item.type === 'bouquet' || item.type === 'couple' || item.type === 'champagne';
          return (
            <button
              key={item.id}
              onClick={(e) => handleItemClick(item, e)}
              onTouchStart={(e) => handleItemClick(item, e)}
              className={`absolute select-none touch-none cursor-pointer ${item.popping ? 'pointer-events-none transition-all duration-300' : ''}`}
              style={{
                left: item.left,
                top: item.top,
                width: item.size,
                height: item.size,
                fontSize: item.size * 0.7,
                lineHeight: 1,
                transform: `rotate(${item.rotation}deg)`,
                animation: item.popping ? `itemPop 0.3s ease-out forwards` : undefined,
                filter: isLowPerf ? undefined : (cfg.bad ? 'grayscale(0.2)' : isRare ? `drop-shadow(0 0 8px ${cfg.color}99)` : undefined),
                zIndex: item.popping ? 40 : 15,
                WebkitTapHighlightColor: 'transparent',
                willChange: 'transform, top, left',
                backfaceVisibility: 'hidden',
                contain: 'layout paint',
              } as React.CSSProperties & { '--r': string }}
              aria-label={cfg.label}
            >
              <span
                className="block w-full h-full flex items-center justify-center"
                style={(!isLowPerf && isRare && !item.popping) ? { animation: 'shinePulse 1.2s ease-in-out infinite' } : undefined}
              >
                {cfg.emoji}
              </span>
            </button>
          );
        })}

        {/* Floating Texts */}
        {floatingTexts.map(ft => (
          <div
            key={ft.id}
            className="absolute pointer-events-none font-black text-sm sm:text-lg z-40"
            style={{
              left: ft.left, top: ft.top, color: ft.color,
              transform: 'translate(-50%, 0)',
              animation: isLowPerf ? 'floatUp 0.65s ease-out forwards' : 'floatUp 0.9s ease-out forwards',
              textShadow: isLowPerf ? '0 1px 2px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.15), 0 0 8px rgba(255,255,255,0.6)',
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden',
            }}
          >
            {ft.text}
          </div>
        ))}

        {/* Particles */}
        {particles.map((p, idx) => {
          const angle = ((p.id * 137.5) % 360) * Math.PI / 180;
          const dist = 40 + ((p.id * 7) % 50);
          const dx = Math.cos(angle) * dist;
          const dy = Math.sin(angle) * dist;
          return (
            <div
              key={p.id}
              className="absolute pointer-events-none rounded-full z-35"
              style={{
                left: p.left, top: p.top, width: 8, height: 8,
                backgroundColor: p.color,
                transform: 'translate(-50%, -50%)',
                animation: isLowPerf ? 'particleFly 0.5s ease-out forwards' : 'particleFly 0.7s ease-out forwards',
                // @ts-ignore
                '--dx': `${dx}px`, '--dy': `${dy}px`,
                boxShadow: isLowPerf ? undefined : `0 0 8px ${p.color}`,
                willChange: 'transform, opacity',
                backfaceVisibility: 'hidden',
              } as React.CSSProperties}
            />
          );
        })}

        {/* Instructions */}
        {showInstructions && !isCompleted && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-white/90 via-rose-50/85 to-amber-50/90 backdrop-blur-sm p-2 sm:p-4">
            <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl bg-white shadow-2xl border border-rose-100 p-3 sm:p-6 overflow-y-auto max-h-full">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-rose-200 to-amber-200 opacity-40 blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-br from-fuchsia-200 to-rose-200 opacity-40 blur-2xl" />

              <div className="relative flex flex-col items-center text-center mb-3 sm:mb-5">
                <div className="text-4xl sm:text-6xl mb-1 sm:mb-2 animate-bounce">💝</div>
                <h2 className="text-xl sm:text-3xl font-black bg-gradient-to-r from-rose-600 via-fuchsia-600 to-amber-600 bg-clip-text text-transparent">
                  Attrape l'Amour
                </h2>
                <p className="mt-1 text-xs sm:text-base text-neutral-600">
                  {guestName ? `Bon jeu ${guestName} !` : 'Prêt pour le fun ?'}
                </p>
              </div>

              <div className="relative space-y-1.5 sm:space-y-2.5 mb-3 sm:mb-6">
                {[
                  { icon: '❤️', label: 'Cœur classique', detail: '+10 pts', color: 'from-rose-100 to-pink-100 text-rose-700 border-rose-200' },
                  { icon: '💖', label: 'Double cœur', detail: '+30 pts', color: 'from-pink-100 to-fuchsia-100 text-fuchsia-700 border-fuchsia-200' },
                  { icon: '💍', label: 'Alliance rare', detail: '+50 pts', color: 'from-amber-100 to-yellow-100 text-amber-700 border-amber-200' },
                  { icon: '💑', label: 'Les mariés', detail: '+100 pts', color: 'from-orange-100 to-amber-100 text-orange-700 border-orange-200' },
                  { icon: '🍾', label: 'Champagne', detail: '+5 secondes', color: 'from-cyan-100 to-sky-100 text-cyan-700 border-cyan-200' },
                  { icon: '💔', label: 'Cœur cassé', detail: '-15 pts ⚠️ évite !', color: 'from-slate-100 to-neutral-100 text-slate-700 border-slate-200' },
                  { icon: '💣', label: 'Bombe', detail: '-30 pts ⚠️ évite !', color: 'from-slate-200 to-slate-300 text-slate-900 border-slate-400' },
                ].map((row, i) => (
                  <div key={i} className={`flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border bg-gradient-to-r ${row.color} text-[11px] sm:text-sm shadow-sm`}>
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <span className="text-base sm:text-xl flex-shrink-0">{row.icon}</span>
                      <span className="font-semibold truncate">{row.label}</span>
                    </div>
                    <span className="font-black tabular-nums flex-shrink-0 ml-2">{row.detail}</span>
                  </div>
                ))}
              </div>

              <div className="relative mb-3 sm:mb-5 px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-fuchsia-200 text-[10px] sm:text-sm text-fuchsia-800 flex items-center gap-1.5 sm:gap-2 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>Enchaîne les captures : x1.5 (3), x2 (5), x3 (10) combo !</span>
              </div>

              <button
                onClick={startGame}
                className="relative w-full py-2.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-rose-500 via-fuchsia-500 to-amber-500 text-white font-black text-sm sm:text-lg shadow-lg sm:shadow-xl shadow-rose-300/40 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 sm:gap-2 overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Play className="h-4 w-4 sm:h-6 sm:w-6 fill-white" />
                COMMENCER
              </button>
            </div>
          </div>
        )}

        {/* Completed Screen */}
        {isCompleted && !showInstructions && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-white/90 via-rose-50/85 to-amber-50/90 backdrop-blur-sm p-2 sm:p-4">
            <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl bg-white shadow-2xl border border-amber-100 p-3 sm:p-6 overflow-y-auto max-h-full text-center">
              <div className="absolute inset-0 pointer-events-none opacity-30">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="absolute text-xl sm:text-3xl" style={{
                    left: `${(i * 53) % 100}%`,
                    top: `${(i * 37) % 100}%`,
                    animation: `floatUp ${2 + (i % 4)}s ease-in-out infinite`,
                    animationDelay: `${(i * 0.15) % 2}s`,
                    opacity: 0.5,
                  }}>{['❤️', '💖', '💍', '✨', '💐'][i % 5]}</div>
                ))}
              </div>

              <div className="relative">
                <div className="flex justify-center mb-1.5 sm:mb-2">
                  <div className="p-2.5 sm:p-3 rounded-full bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 shadow-lg shadow-amber-300/50">
                    <Trophy className="h-7 w-7 sm:h-10 sm:w-10 text-white" />
                  </div>
                </div>
                <h2 className="text-xl sm:text-3xl font-black bg-gradient-to-r from-amber-600 via-rose-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Bravo{guestName ? ` ${guestName}` : ''} !
                </h2>

                <div className="mt-3 sm:mt-5 space-y-2 sm:space-y-2.5">
                  <div className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-rose-100 via-pink-100 to-fuchsia-100 border border-rose-200 shadow-sm">
                    <div className="text-[10px] sm:text-sm text-rose-700 font-medium mb-0.5">Score final</div>
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <Heart className="h-5 w-5 sm:h-8 sm:w-8 fill-rose-600 text-rose-600" />
                      <span className="text-3xl sm:text-5xl font-black text-rose-700 tabular-nums">{score}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                    <div className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-violet-50 border border-violet-200">
                      <div className="text-[9px] sm:text-xs text-violet-700 font-semibold">Combo max</div>
                      <div className="flex items-center justify-center gap-0.5 sm:gap-1 mt-0.5">
                        <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-violet-600" />
                        <span className="text-lg sm:text-2xl font-black text-violet-700 tabular-nums">{maxCombo}</span>
                      </div>
                    </div>
                    <div className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-amber-50 border border-amber-200">
                      <div className="text-[9px] sm:text-xs text-amber-700 font-semibold">Ton score</div>
                      <div className="flex items-center justify-center gap-0.5 sm:gap-1 mt-0.5">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 fill-amber-500" />
                        <span className="text-lg sm:text-2xl font-black text-amber-700 tabular-nums">{playerScore ?? score}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 sm:mt-5 flex flex-col sm:flex-row gap-2 sm:gap-2.5">
                  {config.showLeaderboard && (
                    <button
                      onClick={() => setShowLeaderboard(!showLeaderboard)}
                      className="flex-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:brightness-105 text-white font-bold text-xs sm:text-base shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1 sm:gap-1.5"
                    >
                      <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Classement
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CatchLoveGame;
