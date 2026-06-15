import React, { useEffect, useState } from 'react';
import { Wine, Sparkles, X, Heart, CheckCircle2, PartyPopper, Users, AlertTriangle } from 'lucide-react';

interface ToastModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'drink' | 'confirmation' | 'cancellation';
  selectedDrink?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

const ToastModal = ({ 
  isOpen, 
  onClose, 
  type = 'drink',
  selectedDrink = '', 
  primaryColor = '#f59e0b', 
  secondaryColor = '#d97706' 
}: ToastModalProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDrink = type === 'drink';
  const isConfirmation = type === 'confirmation';
  const isCancellation = type === 'cancellation';

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-500 ${show ? 'opacity-100' : 'opacity-0'}`}>
      {/* Overlay sombre avec flou */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose}></div>
      
      {/* Modal Circulaire avec Contour Animé */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center animate-zoom-in">
        
        {/* Animated Light Border Ring */}
        <div className="absolute inset-0 rounded-full bg-white/20 animate-border-light"></div>
        
        {/* Rotating Gradient Border */}
        <div 
          className="absolute inset-[2px] rounded-full overflow-hidden"
          style={{ background: 'transparent' }}
        >
          <div 
            className="absolute inset-[-50%] animate-rotate-conic"
            style={{ 
              background: `conic-gradient(from 0deg, transparent 0%, white 50%, transparent 100%)`
            }}
          ></div>
        </div>

        {/* Modal Inner Body */}
        <div 
          className="absolute inset-[6px] rounded-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center shadow-inner overflow-hidden"
          style={{ border: `1px solid ${primaryColor}40` }}
        >
          {/* Background Ambient Glow */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ background: `radial-gradient(circle at center, ${isCancellation ? '#94a3b8' : primaryColor}, transparent 70%)` }}
          ></div>

          {/* Green Glow Effect (The "Ambient" Touch) */}
          {!isCancellation && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-emerald-500/20 rounded-full blur-[40px] opacity-0 animate-green-glow pointer-events-none"></div>
          )}

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-1 z-20 transition-colors opacity-40 hover:opacity-100"
            style={{ color: isCancellation ? '#94a3b8' : primaryColor }}
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative z-10 flex flex-col items-center">
            {/* Header Text */}
            <div className="mb-2 opacity-0 animate-text-pop" style={{ animationDelay: '0.2s' }}>
              {isCancellation ? (
                <AlertTriangle className="h-4 w-4 mx-auto mb-1 animate-pulse text-slate-400" />
              ) : (
                <Heart className="h-4 w-4 mx-auto mb-1 animate-pulse" style={{ color: primaryColor }} />
              )}
              <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-white/60">
                {isDrink ? 'Célébrons ensemble' : isConfirmation ? 'Présence confirmée' : 'Modification prise en compte'}
              </p>
            </div>

            {/* Animation Section */}
            <div className="relative h-24 flex items-center justify-center mb-4">
              {/* Central Sparkle with Green Glow */}
              {!isCancellation && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <div className="w-12 h-12 bg-emerald-400/30 rounded-full blur-xl opacity-0 animate-green-glow"></div>
                  <Sparkles className="h-8 w-8 text-white opacity-0 animate-sparkle" />
                </div>
              )}

              {isDrink ? (
                /* Glasses for Drink Selection */
                <div className="flex items-center space-x-[-8px]">
                  <div className="animate-toast-left">
                    <Wine className="h-16 w-16 drop-shadow-2xl" style={{ color: primaryColor }} />
                  </div>
                  <div className="animate-toast-right">
                    <Wine className="h-16 w-16 drop-shadow-2xl scale-x-[-1]" style={{ color: secondaryColor }} />
                  </div>
                </div>
              ) : isConfirmation ? (
                /* Icon for Presence Confirmation */
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 animate-ping opacity-20">
                    <CheckCircle2 className="h-16 w-16" style={{ color: primaryColor }} />
                  </div>
                  <div className="animate-zoom-in">
                    <PartyPopper className="h-16 w-16 drop-shadow-2xl" style={{ color: primaryColor }} />
                  </div>
                </div>
              ) : (
                /* Icon for Cancellation */
                <div className="relative flex items-center justify-center">
                  <div className="animate-bounce">
                    <Users className="h-16 w-16 drop-shadow-2xl text-slate-400" />
                  </div>
                </div>
              )}
            </div>

            {/* Main Intuitive Text */}
            <div className="space-y-2 opacity-0 animate-text-pop" style={{ animationDelay: '0.8s' }}>
              <h2 
                className="text-2xl sm:text-3xl font-bold font-luxury"
                style={{ 
                  background: isCancellation ? 'linear-gradient(to right, #fff, #94a3b8, #fff)' : `linear-gradient(to right, #fff, ${primaryColor}, #fff)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundSize: '200% auto'
                }}
              >
                {isDrink ? 'Santé !' : isConfirmation ? 'Merci !' : 'À bientôt !'}
              </h2>
              <p className="text-neutral-300 text-xs sm:text-sm max-w-[160px] mx-auto leading-relaxed">
                {isDrink ? (
                  <>Excellent choix, votre <span className="font-bold" style={{ color: primaryColor }}>{selectedDrink}</span> est réservé !</>
                ) : isConfirmation ? (
                  <>Votre présence est <span className="font-bold" style={{ color: primaryColor }}>confirmée</span>. Nous avons hâte de vous voir !</>
                ) : (
                  <>Votre désistement a été <span className="font-bold text-slate-400">enregistré</span>. Vous nous manquerez !</>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToastModal;
