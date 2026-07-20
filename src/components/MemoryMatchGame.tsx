import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Trophy, Play, Clock, CheckCircle2, Heart, Star } from 'lucide-react';
import { GameResult, MemoryMatchConfig } from '../services/templateService';

interface MemoryMatchGameProps {
  config: MemoryMatchConfig;
  userId: string;
  modelId: string;
  inviteId: string;
  guestName: string;
  onComplete?: (time: number) => void;
  onSaveResult?: (time: number) => Promise<void>;
  leaderboard?: GameResult[];
  colors?: { primary: string; secondary: string; accent: string };
  isCompleted?: boolean;
  playerScore?: number;
}

interface Card {
  id: number;
  imageUrl: string;
  isFlipped: boolean;
  isMatched: boolean;
  isAnimating: boolean;
}

interface FallingItem {
  id: number;
  left: number;
  type: 'flower' | 'garland';
  color: string;
  delay: number;
  duration: number;
  size: number;
}

const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({
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
  const [cards, setCards] = useState<Card[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isCompleted, setIsCompleted] = useState(isAlreadyCompleted);
  const [showLeaderboard, setShowLeaderboard] = useState(config.showLeaderboard && isAlreadyCompleted);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fallingItems, setFallingItems] = useState<FallingItem[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((type: 'flip' | 'match' | 'win' | 'wrong') => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;

    switch (type) {
      case 'flip':
        const oscFlip = ctx.createOscillator();
        const gainFlip = ctx.createGain();
        oscFlip.connect(gainFlip);
        gainFlip.connect(ctx.destination);
        oscFlip.frequency.setValueAtTime(800, ctx.currentTime);
        oscFlip.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gainFlip.gain.setValueAtTime(0.3, ctx.currentTime);
        gainFlip.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        oscFlip.start(ctx.currentTime);
        oscFlip.stop(ctx.currentTime + 0.1);
        break;
      case 'match':
        const oscMatch1 = ctx.createOscillator();
        const gainMatch1 = ctx.createGain();
        const oscMatch2 = ctx.createOscillator();
        const gainMatch2 = ctx.createGain();
        oscMatch1.connect(gainMatch1);
        gainMatch1.connect(ctx.destination);
        oscMatch2.connect(gainMatch2);
        gainMatch2.connect(ctx.destination);
        oscMatch1.frequency.setValueAtTime(523.25, ctx.currentTime);
        oscMatch2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        gainMatch1.gain.setValueAtTime(0.4, ctx.currentTime);
        gainMatch2.gain.setValueAtTime(0.4, ctx.currentTime + 0.1);
        gainMatch1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        gainMatch2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        oscMatch1.start(ctx.currentTime);
        oscMatch1.stop(ctx.currentTime + 0.4);
        oscMatch2.start(ctx.currentTime + 0.1);
        oscMatch2.stop(ctx.currentTime + 0.5);
        break;
      case 'win':
        const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
          gain.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.6);
          osc.start(ctx.currentTime + i * 0.12);
          osc.stop(ctx.currentTime + i * 0.12 + 0.6);
        });
        break;
      case 'wrong':
        const oscWrong = ctx.createOscillator();
        const gainWrong = ctx.createGain();
        oscWrong.connect(gainWrong);
        gainWrong.connect(ctx.destination);
        oscWrong.frequency.setValueAtTime(300, ctx.currentTime);
        oscWrong.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
        gainWrong.gain.setValueAtTime(0.3, ctx.currentTime);
        gainWrong.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        oscWrong.start(ctx.currentTime);
        oscWrong.stop(ctx.currentTime + 0.2);
        break;
    }
  }, []);

  useEffect(() => {
    setIsCompleted(isAlreadyCompleted);
    if (isAlreadyCompleted) {
      setShowLeaderboard(config.showLeaderboard && isAlreadyCompleted);
    }
  }, [isAlreadyCompleted, config.showLeaderboard]);

  const sortedLeaderboard = useMemo(() => {
    return [...leaderboard].sort((a, b) => (a.score || 0) - (b.score || 0));
  }, [leaderboard]);

  const defaultImageUrls = [
    'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1024995/pexels-photo-1024995.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1024996/pexels-photo-1024996.jpeg?auto=compress&cs=tinysrgb&w=400'
  ];

  const validImageUrls = useMemo(() => {
    let images = config.imageUrls || defaultImageUrls;
    while (images.length < 4) {
      images = [...images, ...defaultImageUrls];
    }
    return images.slice(0, Math.min(6, Math.floor(images.length / 2) * 2));
  }, [config.imageUrls]);

  const generateFallingItems = useCallback(() => {
    const newItems: FallingItem[] = [];
    const itemColors = [colors.primary, colors.secondary, colors.accent, '#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181'];
    for (let i = 0; i < 30; i++) {
      newItems.push({
        id: i,
        left: Math.random() * 100,
        type: Math.random() > 0.5 ? 'flower' : 'garland',
        color: itemColors[Math.floor(Math.random() * itemColors.length)],
        delay: Math.random() * 2000,
        duration: 4 + Math.random() * 4,
        size: 12 + Math.random() * 8
      });
    }
    setFallingItems(newItems);
    setTimeout(() => setFallingItems([]), 10000);
  }, [colors]);

  const shuffleArray = useCallback((array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }, []);

  const initializeGame = useCallback((forceRestart = false) => {
    const pairs = validImageUrls.map((url, index) => [
      { id: index * 2, imageUrl: url, isFlipped: false, isMatched: false, isAnimating: false },
      { id: index * 2 + 1, imageUrl: url, isFlipped: false, isMatched: false, isAnimating: false }
    ]).flat();

    const shuffledPairs = shuffleArray(pairs);

    setCards(shuffledPairs);
    setTimeElapsed(0);
    if (!isAlreadyCompleted || forceRestart) {
      setIsCompleted(false);
    }
    setIsPlaying(false);
    setFlippedCards([]);
    setIsProcessing(false);
    setFallingItems([]);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [validImageUrls, shuffleArray, isAlreadyCompleted]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    if (isPlaying && cards.length > 0 && cards.every(card => card.isMatched)) {
      completeGame();
    }
  }, [cards, isPlaying]);

  const completeGame = () => {
    setIsCompleted(true);
    setIsPlaying(false);
    generateFallingItems();
    playSound('win');
    if (timerRef.current) clearInterval(timerRef.current);
    if (onComplete) onComplete(timeElapsed);
    if (onSaveResult) {
      onSaveResult(timeElapsed);
    }
  };

  const startGame = () => {
    setIsPlaying(true);
    timerRef.current = setInterval(() => {
      setTimeElapsed(t => t + 1);
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleCardClick = (cardId: number) => {
    if (!isPlaying || isProcessing || isCompleted) return;

    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    playSound('flip');
    const newCards = cards.map(c =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setIsProcessing(true);
      const [id1, id2] = newFlippedCards;
      const card1 = newCards.find(c => c.id === id1);
      const card2 = newCards.find(c => c.id === id2);

      if (card1 && card2) {
        if (card1.imageUrl === card2.imageUrl) {
          playSound('match');
          const animatingCards = newCards.map(c =>
            c.id === id1 || c.id === id2 ? { ...c, isAnimating: true } : c
          );
          setCards(animatingCards);
          setTimeout(() => {
            setCards(prev => prev.map(c =>
              c.id === id1 || c.id === id2 ? { ...c, isMatched: true, isAnimating: false } : c
            ));
            setFlippedCards([]);
            setIsProcessing(false);
          }, 600);
        } else {
          playSound('wrong');
          setTimeout(() => {
            setCards(prev => prev.map(c =>
              c.id === id1 || c.id === id2 ? { ...c, isFlipped: false } : c
            ));
            setFlippedCards([]);
            setIsProcessing(false);
          }, 1200);
        }
      }
    }
  };

  return (
    <div className="w-full mx-auto relative">
      <style>{`
        @keyframes itemFall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(120vh) rotate(360deg);
            opacity: 0.7;
          }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes glowPulse {
          0%, 100% {
          box-shadow: 0 0 10px ${colors.primary}40, 0 0 20px ${colors.primary}40, 0 0 30px ${colors.secondary}30;
          border-color: ${colors.primary}60;
        }
        50% {
          box-shadow: 0 0 20px ${colors.primary}80, 0 0 40px ${colors.primary}60, 0 0 60px ${colors.secondary}50;
          border-color: ${colors.secondary}80;
        }
      `}</style>

      {/* Falling Flowers & Garlands */}
      {fallingItems.map(item => (
        <div
          key={item.id}
          className="absolute z-50"
          style={{
            left: `${item.left}%`,
            top: 0,
            animation: `itemFall ${item.duration}s ease-in-out forwards`,
            animationDelay: `${item.delay}ms`,
          }}
        >
          {item.type === 'flower' ? (
            <svg width={item.size} height={item.size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="4" fill={item.color} />
              <circle cx="12" cy="6" r="3" fill={item.color} />
              <circle cx="18" cy="12" r="3" fill={item.color} />
              <circle cx="12" cy="18" r="3" fill={item.color} />
              <circle cx="6" cy="12" r="3" fill={item.color} />
              <circle cx="12" cy="12" r="2" fill="#FFD700" />
            </svg>
          ) : (
            <svg width={item.size * 1.5} height={item.size} viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="5" width="40" height="10" rx="5" fill={item.color} opacity="0.8" />
              <circle cx="5" cy="10" r="3" fill={item.color} />
              <circle cx="15" cy="10" r="3" fill={item.color} />
              <circle cx="25" cy="10" r="3" fill={item.color} />
              <circle cx="35" cy="10" r="3" fill={item.color} />
            </svg>
          )}
        </div>
      ))}

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-700">
            <Clock className="h-5 w-5" style={{ color: colors.primary }} />
            <span className="font-bold text-xl">{formatTime(timeElapsed)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {config.showLeaderboard && (
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all duration-300"
            >
              <Trophy className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      {showLeaderboard && config.showLeaderboard && (
        <div className="mb-4 p-3 rounded-[20px]" style={{ backgroundColor: `${colors.primary}15`, border: `1px solid ${colors.primary}30` }}>
          <h3 className="font-bold mb-3 flex items-center gap-2 text-sm" style={{ color: colors.primary }}>
            <Trophy className="h-4 w-4" />
            Classement
          </h3>
          <div className="space-y-2">
            {sortedLeaderboard.length === 0 ? (
              <p className="text-slate-500 text-center py-2 text-xs">
                Aucun résultat pour le moment, soyez le premier !
              </p>
            ) : (
              sortedLeaderboard.map((result, index) => (
                <div
                  key={result.id}
                  className={`flex items-center justify-between p-2 rounded-xl ${
                    index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                    index === 1 ? 'bg-gray-50 border border-gray-200' :
                    index === 2 ? 'bg-orange-50 border border-orange-200' :
                    'bg-white border border-slate-200'
                  } ${result.guestName === guestName ? 'ring-2 ring-offset-1' : ''}`}
                  style={{
                    ...(result.guestName === guestName ? { ringColor: colors.primary, backgroundColor: `${colors.primary}10` } : {})
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-400 text-gray-900' :
                      index === 2 ? 'bg-orange-400 text-orange-900' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-semibold text-slate-800 text-[10px] truncate max-w-[100px]">
                      {result.guestName}
                      {result.guestName === guestName && <span className="ml-1 text-[6px] font-bold" style={{ color: colors.primary }}>(Vous)</span>}
                    </span>
                  </div>
                  <span className="font-bold text-slate-700 text-[10px]">{formatTime(result.score || 0)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Game Content */}
      {isCompleted ? (
        <div className="text-center space-y-5">
          <div>
            <div className="text-3xl font-black mb-3" style={{ color: colors.primary }}>
              {formatTime(playerScore !== undefined ? playerScore : timeElapsed)}
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">Victoire ! 🎉</h3>
            <p className="text-slate-600 mb-4 text-sm">Vous avez trouvé toutes les paires !</p>
          </div>
          
          <div className="flex flex-col gap-2">
            {config.showLeaderboard && !showLeaderboard && (
              <button
                onClick={() => setShowLeaderboard(true)}
                className="w-full py-3 px-4 font-bold rounded-2xl transition-all duration-300 transform hover:scale-[1.01] shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  color: 'white'
                }}
              >
                Voir le Classement 🏆
              </button>
            )}
          </div>
        </div>
      ) : !isPlaying && !isCompleted ? (
        <div className="text-center space-y-5">
          {/* Animated top decoration */}
          <div className="flex justify-center gap-3 mb-1">
            {[1, 2, 3].map((i) => (
              <Star
                key={i}
                className="h-7 w-7"
                style={{
                  color: colors.accent,
                  animation: 'float 2s ease-in-out infinite',
                  animationDelay: `${i * 0.3}s`
                }}
              />
            ))}
          </div>
          
          {/* Super attractive preview image */}
          <div 
            className="relative mx-auto w-40 h-40 rounded-[30px] overflow-hidden shadow-xl cursor-pointer group"
            onClick={startGame}
          >
            <img 
              src={validImageUrls[Math.floor(Math.random() * validImageUrls.length)]} 
              alt="Preview" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="bg-white/90 rounded-full p-5 shadow-lg group-hover:scale-110 transition-all duration-300"
                style={{
                  animation: 'glowPulse 2s ease-in-out infinite'
                }}
              >
                <Play className="h-8 w-8" style={{ color: colors.primary, marginLeft: '8px' }} />
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold" style={{ color: colors.primary }}>
              Jeu de Mémoire
            </h2>
            <p className="text-sm text-slate-600">
              Trouvez les paires de photos le plus rapidement possible !
            </p>
          </div>
          <button
            onClick={startGame}
            className="w-full py-3 px-4 font-bold rounded-2xl transition-all duration-300 transform hover:scale-[1.01] shadow-md"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              color: 'white'
            }}
          >
            Commencer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {cards.map((card, index) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`aspect-square rounded-2xl cursor-pointer perspective-1000 transition-all duration-300 ${
                card.isMatched ? 'opacity-100' : ''
              } ${card.isAnimating ? '' : 'hover:scale-[1.02] hover:shadow-md'}`}
              style={{
                animation: card.isMatched ? 'glowPulse 1.5s ease-in-out infinite' : 'none',
                border: card.isMatched ? `3px solid ${colors.primary}` : 'none'
              }}
            >
              <div className={`card-inner w-full h-full relative transition-transform duration-700 cubic-bezier(0.175, 0.885, 0.32, 1.275) transform-style-preserve-3d ${
                card.isFlipped || card.isMatched ? 'rotate-y-180' : ''
              }`}>
                <div 
                  className="card-front absolute inset-0 flex items-center justify-center rounded-2xl backface-hidden"
                  style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }}
                >
                  <Heart className="h-10 w-10 text-white fill-white" />
                </div>
                <div className="card-back absolute inset-0 rounded-2xl backface-hidden rotate-y-180">
                  <img
                    src={card.imageUrl}
                    alt="Card"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                  {card.isMatched && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl" style={{ backgroundColor: `${colors.primary}40` }}>
                      <CheckCircle2 className="h-12 w-12 text-white drop-shadow-lg" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemoryMatchGame;
