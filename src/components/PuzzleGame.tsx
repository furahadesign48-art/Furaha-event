import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, Play, Clock, CheckCircle2, Timer } from 'lucide-react';
import { GameResult, PuzzleConfig } from '../services/templateService';

interface PuzzleGameProps {
  config: PuzzleConfig;
  userId: string;
  modelId: string;
  inviteId: string;
  guestName: string;
  onComplete?: (time: number) => void;
  onSaveResult?: (time: number) => Promise<void>;
  leaderboard?: GameResult[];
  isCompleted?: boolean;
  playerScore?: number;
}

interface PuzzlePiece {
  id: number;
  correctRow: number;
  correctCol: number;
  currentRow: number;
  currentCol: number;
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

const PuzzleGame: React.FC<PuzzleGameProps> = ({ 
  config, 
  userId, 
  modelId, 
  inviteId, 
  guestName,
  onComplete, 
  onSaveResult,
  leaderboard = [],
  isCompleted: isAlreadyCompleted = false,
  playerScore
}) => {
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isCompleted, setIsCompleted] = useState(isAlreadyCompleted);
  const [showLeaderboard, setShowLeaderboard] = useState(config.showLeaderboard && isAlreadyCompleted);
  const [fallingItems, setFallingItems] = useState<FallingItem[]>([]);
  const timerRef = useRef<number | null>(null);
  const [draggedPieceId, setDraggedPieceId] = useState<number | null>(null);
  const gridSize = config.gridSize || 3;

  // Sync state with prop
  useEffect(() => {
    setIsCompleted(isAlreadyCompleted);
    if (isAlreadyCompleted) {
      setShowLeaderboard(config.showLeaderboard && isAlreadyCompleted);
    }
  }, [isAlreadyCompleted, config.showLeaderboard]);

  // Sorted leaderboard
  const sortedLeaderboard = React.useMemo(() => {
    return [...leaderboard].sort((a, b) => (a.score || 0) - (b.score || 0));
  }, [leaderboard]);

  // Fallback image
  const defaultImageUrl = 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800';
  const imageUrl = config.imageUrl && config.imageUrl.length > 0 ? config.imageUrl : defaultImageUrl;

  // Generate falling items
  const generateFallingItems = useCallback(() => {
    const newItems: FallingItem[] = [];
    const itemColors = ['#f59e0b', '#d946ef', '#fbbf24', '#FFD700', '#FF6B6B', '#4ECDC4'];
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
  }, []);

  // Initialize the puzzle
  const initializePuzzle = useCallback(() => {
    const newPieces: PuzzlePiece[] = [];
    const positions = [];
    
    // Create all positions
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        positions.push({ row, col });
      }
    }
    
    // Shuffle positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    // Create pieces
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const id = row * gridSize + col;
        const position = positions[id];
        newPieces.push({
          id,
          correctRow: row,
          correctCol: col,
          currentRow: position.row,
          currentCol: position.col
        });
      }
    }
    
    setPieces(newPieces);
    setTimeElapsed(0);
    setMoves(0);
    setIsCompleted(false);
    setIsPlaying(false);
    setFallingItems([]);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [gridSize]);

  useEffect(() => {
    initializePuzzle();
  }, [initializePuzzle]);

  // Check if puzzle is completed
  const checkCompletion = (piecesArray: PuzzlePiece[]) => {
    return piecesArray.every(p => 
      p.currentRow === p.correctRow && p.currentCol === p.correctCol
    );
  };

  const completeGame = () => {
    setIsCompleted(true);
    setIsPlaying(false);
    generateFallingItems();
    if (timerRef.current) clearInterval(timerRef.current);
    if (onComplete) onComplete(timeElapsed);
    if (onSaveResult) {
      onSaveResult(timeElapsed);
    }
  };

  const startGame = () => {
    setIsPlaying(true);
    timerRef.current = window.setInterval(() => {
      setTimeElapsed(t => t + 1);
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Handle drag and drop
  const handleDragStart = (e: React.DragEvent, pieceId: number) => {
    setDraggedPieceId(pieceId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (targetRow: number, targetCol: number) => {
    if (!draggedPieceId || !isPlaying || isCompleted) return;
    
    const draggedPiece = pieces.find(p => p.id === draggedPieceId);
    const targetPiece = pieces.find(p => 
      p.currentRow === targetRow && p.currentCol === targetCol
    );
    
    if (!draggedPiece || !targetPiece) return;
    
    // Swap positions
    const newPieces = pieces.map(p => {
      if (p.id === draggedPieceId) {
        return { ...p, currentRow: targetRow, currentCol: targetCol };
      }
      if (p.id === targetPiece.id) {
        return { ...p, currentRow: draggedPiece.currentRow, currentCol: draggedPiece.currentCol };
      }
      return p;
    });
    
    setPieces(newPieces);
    setMoves(m => m + 1);
    setDraggedPieceId(null);
    
    if (checkCompletion(newPieces)) {
      completeGame();
    }
  };

  // Handle click to swap
  const handlePieceClick = (clickedPiece: PuzzlePiece) => {
    if (!isPlaying || isCompleted) return;
    
    // Find the first piece that's out of place to swap
    const pieceToSwap = pieces.find(p => 
      p.id !== clickedPiece.id && 
      (p.currentRow !== p.correctRow || p.currentCol !== p.correctCol)
    );
    
    if (!pieceToSwap) return;
    
    const newPieces = pieces.map(p => {
      if (p.id === clickedPiece.id) {
        return { ...p, currentRow: pieceToSwap.currentRow, currentCol: pieceToSwap.currentCol };
      }
      if (p.id === pieceToSwap.id) {
        return { ...p, currentRow: clickedPiece.currentRow, currentCol: clickedPiece.currentCol };
      }
      return p;
    });
    
    setPieces(newPieces);
    setMoves(m => m + 1);
    
    if (checkCompletion(newPieces)) {
      completeGame();
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-700">
            <Clock className="h-5 w-5 text-amber-600" />
            <span className="font-bold text-xl">{formatTime(timeElapsed)}</span>
          </div>
          <div className="text-slate-600 font-medium text-base">
            {moves} {moves === 1 ? 'coup' : 'coups'}
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
        <div className="mb-6 p-3 rounded-[20px] bg-amber-50 border border-amber-200">
          <h3 className="font-bold mb-3 flex items-center gap-2 text-amber-800 text-sm">
            <Trophy className="h-4 w-4 text-amber-600" />
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
                  } ${result.guestName === guestName ? 'ring-2 ring-offset-1 ring-amber-500' : ''}`}
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
                      {result.guestName === guestName && <span className="ml-1 text-[6px] font-bold text-slate-500">(Vous)</span>}
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
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <CheckCircle2 className="h-12 w-12 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Félicitations ! 🎉</h3>
            <p className="text-slate-600 mb-1 text-sm">Tu as terminé le puzzle !</p>
            <div className="text-2xl font-black text-amber-600">{formatTime(playerScore !== undefined ? playerScore : timeElapsed)}</div>
          </div>
          
          <div className="flex flex-col gap-2">
            {config.showLeaderboard && !showLeaderboard && (
              <button
                onClick={() => setShowLeaderboard(true)}
                className="w-full py-3 px-4 font-bold text-base rounded-2xl transition-all duration-300 transform hover:scale-[1.01] shadow-md bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700"
              >
                Voir le Classement
              </button>
            )}
          </div>
        </div>
      ) : !isPlaying && !isCompleted ? (
        <div className="text-center space-y-8">
          <div className="relative mx-auto w-56 h-56 sm:w-64 sm:h-64 rounded-[36px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
            <img 
              src={imageUrl} 
              alt="Puzzle Preview" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="bg-white/90 rounded-full p-6 shadow-xl">
                <Play className="h-10 w-10 text-amber-600 ml-1" />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Prêt ?</h3>
            <p className="text-slate-600 text-sm sm:text-base">Glisse les pièces ou clique pour échanger !</p>
          </div>
          <button
            onClick={startGame}
            className="w-full py-4 sm:py-5 px-6 font-bold text-base sm:text-lg rounded-[36px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white transition-all duration-300 transform hover:scale-[1.02]"
          >
            Commencer le Puzzle
          </button>
        </div>
      ) : (
        <div 
          className="relative mx-auto bg-slate-100 rounded-[36px] overflow-hidden shadow-inner"
          style={{ aspectRatio: '1/1', width: '100%', maxWidth: '400px' }}
        >
          {/* Grid target areas */}
          {Array.from({ length: gridSize }).map((_, row) =>
            Array.from({ length: gridSize }).map((_, col) => (
              <div
                key={`${row}-${col}`}
                className="absolute border border-dashed border-slate-300 rounded-[8px]"
                style={{
                  width: `${100 / gridSize}%`,
                  height: `${100 / gridSize}%`,
                  left: `${col * (100 / gridSize)}%`,
                  top: `${row * (100 / gridSize)}%`
                }}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(row, col)}
              />
            ))
          )}
          
          {/* Puzzle pieces */}
          {pieces.map(piece => (
            <div
              key={piece.id}
              draggable
              onDragStart={(e) => handleDragStart(e, piece.id)}
              onClick={() => handlePieceClick(piece)}
              className={`absolute transition-all duration-200 ease-out cursor-pointer overflow-hidden border border-white/50 shadow-md rounded-[8px] ${
                piece.currentRow === piece.correctRow && piece.currentCol === piece.correctCol 
                  ? 'ring-2 ring-green-400' 
                  : ''
              } ${draggedPieceId === piece.id ? 'opacity-50 z-[100] scale-105 shadow-2xl' : 'hover:scale-[1.02] hover:shadow-lg'}`}
              style={{
                width: `${100 / gridSize}%`,
                height: `${100 / gridSize}%`,
                left: `${piece.currentCol * (100 / gridSize)}%`,
                top: `${piece.currentRow * (100 / gridSize)}%`,
                zIndex: draggedPieceId === piece.id ? 100 : 10,
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                backgroundPosition: `${piece.correctCol * 100}% ${piece.correctRow * 100}%`,
                backgroundRepeat: 'no-repeat'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PuzzleGame;
