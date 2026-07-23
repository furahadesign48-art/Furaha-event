import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Clock, Volume2, Heart, Sparkles } from 'lucide-react';
import { GameResult } from '../services/templateService';

const DEFAULT_QUIZ_QUESTIONS = [
  { id: 1, question: "Où avons-nous fait notre première rencontre ?", options: ["Au café", "Au cinéma", "Au parc", "À la bibliothèque"], correctAnswerIndex: 0 },
  { id: 2, question: "Quelle est notre chanson préférée ?", options: ["Unchained Melody", "Perfect", "I Will Always Love You", "All of Me"], correctAnswerIndex: 1 },
  { id: 3, question: "Quel est notre plat préféré à partager ?", options: ["Pizza", "Sushi", "Pâtes", "Tacos"], correctAnswerIndex: 2 },
  { id: 4, question: "Quel est notre film préféré ?", options: ["Le Parfum", "Notting Hill", "Titanic", "Amélie"], correctAnswerIndex: 3 },
];

const playSound = (type: 'correct' | 'incorrect' | 'timer' | 'end') => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext);
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'correct') {
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } else if (type === 'incorrect') {
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } else if (type === 'timer') {
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } else if (type === 'end') {
      // Celebration sound
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.15);
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.3);
      oscillator.frequency.setValueAtTime(1046.5, audioContext.currentTime + 0.45);
      gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.8);
    }
  } catch (e) {}
};

const vibrate = (pattern: number[]) => { if (navigator.vibrate) try { navigator.vibrate(pattern); } catch (e) {} };

interface LoveQuizGameProps {
  config?: any;
  userId: string;
  modelId: string;
  inviteId: string;
  guestName: string;
  onComplete?: (score: number) => void;
  onSaveResult?: (score: number) => Promise<void>;
  leaderboard?: GameResult[];
  colors?: any;
  isCompleted?: boolean;
  playerScore?: number;
}

const LoveQuizGame: React.FC<LoveQuizGameProps> = ({ 
  config, userId, modelId, inviteId, guestName, onComplete, onSaveResult, leaderboard = [], colors, isCompleted: isAlreadyCompleted = false, playerScore
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(isAlreadyCompleted);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showEndAnimation, setShowEndAnimation] = useState(false);
  const [showInstructions, setShowInstructions] = useState(!isAlreadyCompleted);
  
  // Global timer: use totalGameTime from config!
  const questions = (config?.questions && config.questions.length > 0) ? config.questions : DEFAULT_QUIZ_QUESTIONS;
  const totalTime = config?.totalGameTime || 60;
  const [timeLeft, setTimeLeft] = useState(totalTime);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasVibratedAt5Seconds = useRef(false);

  // Global timer effect
  useEffect(() => {
    if (isCompleted || showInstructions) { 
      return; 
    }
    hasVibratedAt5Seconds.current = false;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === 5 && !hasVibratedAt5Seconds.current) {
          hasVibratedAt5Seconds.current = true; playSound('timer'); vibrate([100, 50, 100]);
        }
        if (prev <= 1) {
          completeGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isCompleted, showInstructions]); // Keep timer running across questions!

  useEffect(() => { 
    if (isAlreadyCompleted) {
      setIsCompleted(true); 
      setShowLeaderboard(config?.showLeaderboard && isAlreadyCompleted); 
    } 
  }, [isAlreadyCompleted, config]);
  
  const sortedLeaderboard = React.useMemo(() => [...leaderboard.sort((a, b) => (b.score || 0) - (a.score || 0))], [leaderboard]);

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    const isCorrect = index === questions[currentQuestionIndex].correctAnswerIndex;
    if (isCorrect) { setScore(prev => prev + 1); playSound('correct'); vibrate([100, 50, 100]); }
    else { playSound('incorrect'); vibrate([200, 100]); }
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1); setSelectedAnswer(null);
      } else completeGame();
    }, 400);
  };

  const completeGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    playSound('end');
    vibrate([100, 50, 100, 50, 200]);
    setShowEndAnimation(true);
    setTimeout(() => {
      setShowEndAnimation(false);
      setIsCompleted(true);
      if (onComplete) onComplete(score);
      if (onSaveResult) onSaveResult(score);
    }, 2000);
  };
  
  const isLowTime = timeLeft <= 10;
  const isCriticalTime = timeLeft <= 5;
  
  return (
    <div className="absolute inset-0 flex flex-col bg-slate-900">
      {/* Instructions Modal */}
      {showInstructions && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-6">
              <Heart className="h-16 w-16 mx-auto mb-4" style={{ color: colors?.primary || '#ec4899', fill: colors?.primary || '#ec4899' }} />
              <h2 className="text-2xl font-black text-white mb-2">Love Quiz !</h2>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors?.primary || '#ec4899'}20` }}>
                  <span className="font-bold" style={{ color: colors?.primary || '#ec4899' }}>1</span>
                </div>
                <p className="text-white/80 text-sm">Répondez à {questions.length} questions sur votre couple</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors?.primary || '#ec4899'}20` }}>
                  <span className="font-bold" style={{ color: colors?.primary || '#ec4899' }}>2</span>
                </div>
                <p className="text-white/80 text-sm">Vous avez {totalTime} secondes pour terminer le quiz</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors?.primary || '#ec4899'}20` }}>
                  <span className="font-bold" style={{ color: colors?.primary || '#ec4899' }}>3</span>
                </div>
                <p className="text-white/80 text-sm">Choisissez la bonne réponse parmi les propositions</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors?.primary || '#ec4899'}20` }}>
                  <span className="font-bold" style={{ color: colors?.primary || '#ec4899' }}>4</span>
                </div>
                <p className="text-white/80 text-sm">Votre score sera ajouté au classement !</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowInstructions(false)}
              className="w-full py-4 rounded-xl text-white font-black text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ 
                background: colors?.secondary 
                  ? `linear-gradient(to right, ${colors.primary}, ${colors.secondary})` 
                  : `linear-gradient(to right, ${colors?.primary || '#ec4899'}, ${colors?.primary || '#be185d'})` 
              }}
            >
              Commencer le Quiz ❤️
            </button>
          </div>
        </div>
      )}

      {/* End Animation */}
      {showEndAnimation && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900">
          <div className="animate-bounce mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-2xl animate-pulse"></div>
              <Heart className="h-24 w-24 text-yellow-400 fill-yellow-400" />
            </div>
          </div>
          <div className="flex gap-2 mb-6">
            {[...Array(5)].map((_, i) => (
              <Sparkles 
                key={i} 
                className="h-6 w-6 text-yellow-300 animate-bounce" 
                style={{ animationDelay: `${i * 0.1}s` }} 
              />
            ))}
          </div>
          <h2 className="text-3xl font-black text-white animate-pulse">Félicitations !</h2>
        </div>
      )}
      
      {!showInstructions && (
        <>
          <div className="relative z-10 flex items-center justify-between p-3 gap-2">
            <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
              isCriticalTime ? 'bg-gradient-to-r from-red-600 to-red-700 shadow-lg shadow-red-500/40' :
              isLowTime ? 'bg-gradient-to-r from-orange-600 to-orange-700' :
              'bg-gradient-to-r from-yellow-600 to-yellow-700'
            }`}>
              <Clock className={`h-4 w-4 ${isCriticalTime ? 'animate-pulse' : ''}`} />
              <span className="font-black text-lg text-white">{timeLeft}s</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-full bg-white/10 border border-white/20">
              <Volume2 className="h-4 w-4 text-white/80" />
            </div>
            <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-yellow-400" />
              <span className="font-black text-lg text-white">{score}/{questions.length}</span>
            </div>
          </div>
          
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-3 py-1">
            {showLeaderboard && config?.showLeaderboard ? (
              <div className="w-full max-w-md h-full flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg text-white flex items-center gap-1.5"><Trophy className="h-4 w-4 text-yellow-400" /> Classement</h3>
                  <button onClick={() => setShowLeaderboard(false)} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-1.5 flex-1 overflow-y-auto">
                  {sortedLeaderboard.length === 0 ? <p className="text-white/70 text-center py-2 text-xs">Aucun résultat</p> :
                    sortedLeaderboard.map((result, index) => (
                      <div key={result.id} className={`flex items-center justify-between p-2 rounded-lg bg-white/10 border border-white/20 ${result.guestName === guestName ? 'border-yellow-400/50' : ''}`}>
                        <div className="flex items-center gap-1.5"><span className="font-bold text-md text-yellow-400">{index + 1}</span><span className="font-medium text-white text-xs truncate max-w-[150px]">{result.guestName}</span></div>
                        <span className="font-bold text-md text-white">{result.score || 0}/{questions.length}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            ) : isCompleted ? (
              <div className="text-center w-full max-w-md">
                <h2 className="text-2xl font-black text-white mb-1">
                  {score === questions.length ? "Parfait !" : score >= questions.length/2 ? "Bien joué !" : "C'est fini !"}
                </h2>
                <p className="text-md text-white/80 mb-3">
                  Score final : <span className="font-black text-yellow-400">{playerScore !== undefined ? playerScore : score}/{questions.length}</span>
                </p>
                {config?.showLeaderboard && <button onClick={() => setShowLeaderboard(true)} className="px-5 py-2 rounded-full bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-bold text-md shadow-lg hover:from-yellow-700 hover:to-yellow-800 transition-all">Voir le Classement</button>}
              </div>
            ) : (
              <>
                <h2 className="text-lg md:text-xl font-bold text-white text-center mb-4 leading-tight">
                  {questions[currentQuestionIndex].question}
                </h2>
                <div className="w-full max-w-md grid grid-cols-1 gap-2.5">
                  {questions[currentQuestionIndex].options.map((option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = index === questions[currentQuestionIndex].correctAnswerIndex;
                    const showResult = selectedAnswer !== null;
                    let buttonClass = "bg-white/10 border border-white/20 hover:bg-white/20 text-white";
                    if (showResult) {
                      if (isSelected && isCorrect) buttonClass = "bg-green-500/20 border-green-500 text-white shadow-lg shadow-green-500/30";
                      else if (isSelected) buttonClass = "bg-red-500/20 border-red-500 text-white";
                      else buttonClass = "bg-white/5 border-white/10 text-white/50";
                    } else if (isSelected) buttonClass = "bg-white/30 border-white/50 text-white";
                    return (
                      <button key={index} onClick={() => handleAnswerSelect(index)} disabled={showResult}
                        className={`p-3 rounded-xl font-semibold text-sm transition-all duration-300 ${buttonClass}`}
                      >{option}</button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default LoveQuizGame;
