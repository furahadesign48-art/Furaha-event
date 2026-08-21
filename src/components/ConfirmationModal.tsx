import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'danger',
  isLoading = false
}) => {
  if (!isOpen) return null;

  const accentStyles = {
    danger: {
      badge: { bg: 'rgba(244,63,94,0.15)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.35)' },
      button: {
        background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
        color: '#ffffff',
        border: '1px solid rgba(248,113,113,0.5)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 0 0 1px rgba(239,68,68,0.45), 0 16px 36px -12px rgba(220,38,38,0.75), 0 0 40px rgba(239,68,68,0.22)',
      },
      buttonHover: { background: 'linear-gradient(180deg, #f87171 0%, #ef4444 100%)' },
    },
    warning: {
      badge: { bg: 'rgba(251,191,36,0.15)', color: '#fcd34d', border: '1px solid rgba(251,191,36,0.35)' },
      button: {
        background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
        color: '#0b0f17',
        border: '1px solid rgba(251,191,36,0.55)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.35) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 16px 36px -12px rgba(245,158,11,0.75), 0 0 40px rgba(251,191,36,0.22)',
      },
      buttonHover: { background: 'linear-gradient(180deg, #fde68a 0%, #fbbf24 100%)' },
    },
    info: {
      badge: { bg: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.35)' },
      button: {
        background: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)',
        color: '#ffffff',
        border: '1px solid rgba(96,165,250,0.55)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(37,99,235,0.45), 0 16px 36px -12px rgba(37,99,235,0.75), 0 0 40px rgba(59,130,246,0.22)',
      },
      buttonHover: { background: 'linear-gradient(180deg, #93c5fd 0%, #3b82f6 100%)' },
    },
  }[type];

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[60] animate-fade-in"
         style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm animate-slide-up relative rounded-2xl sm:rounded-3xl overflow-hidden"
           style={{
             background: 'linear-gradient(180deg, #111727 0%, #0b0f17 100%)',
             border: '1px solid rgba(167,139,250,0.35)',
             boxShadow: '0 50px 120px -30px rgba(0,0,0,0.85), 0 0 0 1px rgba(251,191,36,0.05) inset, 0 0 0 1px rgba(167,139,250,0.12), 0 0 28px rgba(167,139,250,0.35), 0 0 64px rgba(167,139,250,0.2)',
           }}>
        {/* Effets backlight radiaux */}
        <div
          aria-hidden
          className="absolute -top-16 -right-6 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.24) 0%, transparent 70%)' }}
        />
        <div
          aria-hidden
          className="absolute -bottom-14 -left-6 w-36 h-36 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.22) 0%, transparent 70%)' }}
        />

        <div className="relative p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 sm:p-3 rounded-2xl" style={accentStyles.badge}>
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.55)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.15)'; e.currentTarget.style.color = '#fda4af'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.35)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <h3 className="text-lg sm:text-xl font-black tracking-tight text-white mb-2">
            {title}
          </h3>
          
          <p className="text-sm sm:text-[15px] mb-5 sm:mb-6 leading-relaxed" style={{ color: 'rgba(255,255,255,0.68)' }}>
            {message}
          </p>

          <div className="flex flex-col-reverse sm:flex-row sm:space-x-3 gap-2 sm:gap-0">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.82)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.3)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 rounded-xl font-black text-sm sm:text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={accentStyles.button}
              onMouseEnter={(e) => { if (!isLoading) Object.assign(e.currentTarget.style, accentStyles.buttonHover); }}
              onMouseLeave={(e) => { if (!isLoading) Object.assign(e.currentTarget.style, accentStyles.button); }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 rounded-full animate-spin mr-2"
                       style={{
                         borderColor: type === 'warning' ? 'rgba(11,15,23,0.3)' : 'rgba(255,255,255,0.3)',
                         borderTopColor: type === 'warning' ? '#0b0f17' : '#ffffff',
                       }}></div>
                  Traitement...
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
