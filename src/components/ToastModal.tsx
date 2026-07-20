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
      
      {/* Modal Moderne */}
      <div className="relative w-full max-w-sm animate-zoom-in">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center z-20 transition-colors hover:scale-110"
        >
          <X className="h-4 w-4 text-slate-800" />
        </button>
        
        {/* Modal Body */}
        <div 
          className="bg-slate-900 rounded-3xl p-6 text-center shadow-2xl border border-white/10 overflow-hidden"
        >
          {/* Background Gradient Glow */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ background: `radial-gradient(circle at top, ${isCancellation ? '#94a3b8' : primaryColor}30, transparent 70%)` }}
          ></div>
          
          <div className="relative z-10 flex flex-col items-center space-y-4">
            {/* Icon Animation */}
            <div className="relative h-20 flex items-center justify-center">
              {!isCancellation && (
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  <div 
                    className="w-20 h-20 rounded-full animate-pulse"
                    style={{ backgroundColor: primaryColor }}
                  ></div>
                </div>
              )}
              
              {isDrink ? (
                <div className="flex items-center space-x-2">
                  <Wine className="h-10 w-10" style={{ color: primaryColor }} />
                  <Wine className="h-10 w-10" style={{ color: secondaryColor }} />
                </div>
              ) : isConfirmation ? (
                <div className="relative">
                  <PartyPopper className="h-12 w-12" style={{ color: primaryColor }} />
                  <Sparkles className="h-4 w-4 absolute -top-1 -right-1 text-yellow-400" />
                </div>
              ) : (
                <Users className="h-12 w-12 text-slate-400" />
              )}
            </div>
            
            {/* Text Content */}
            <div className="space-y-2">
              <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-white/60">
                {isDrink ? 'Célébrons ensemble' : isConfirmation ? 'Présence confirmée' : 'Modification prise en compte'}
              </p>
              
              <h2 
                className="text-2xl font-bold"
                style={{ color: isCancellation ? '#94a3b8' : primaryColor }}
              >
                {isDrink ? 'Santé !' : isConfirmation ? 'Merci !' : 'À bientôt !'}
              </h2>
              
              <p className="text-neutral-300 text-sm">
                {isDrink ? (
                  <>
                    {selectedDrink ? 
                      `Excellent choix, ${selectedDrink} est réservé !` : 
                      "Choix de boisson retiré !"
                    }
                  </>
                ) : isConfirmation ? (
                  <>Votre présence est <span className="font-bold" style={{ color: primaryColor }}>confirmée</span>. Nous avons hâte de vous voir !</>
                ) : (
                  <>Votre désistement a été <span className="font-bold text-slate-400">enregistré</span>.</>
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