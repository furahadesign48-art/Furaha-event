import React, { useState, useRef, useEffect } from 'react';
import { X, Lock, Shield, AlertCircle } from 'lucide-react';

const DEFAULT_ADMIN_PASSWORD =
  (import.meta.env.VITE_ADMIN_LAYOUT_PASSWORD as string | undefined) || 'FurahaAdmin2026!';

export const verifyAdminLayoutPassword = (input: string): boolean => {
  return input === DEFAULT_ADMIN_PASSWORD;
};

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetLayoutLabel: string;
}

const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetLayoutLabel,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      setIsVerifying(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Veuillez saisir le mot de passe.');
      return;
    }
    setIsVerifying(true);
    setError('');
    await new Promise((r) => setTimeout(r, 450));
    if (verifyAdminLayoutPassword(password)) {
      setIsVerifying(false);
      onSuccess();
    } else {
      setIsVerifying(false);
      setError('Mot de passe incorrect.');
      inputRef.current?.select();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-[60] animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.76)', backdropFilter: 'blur(10px)' }}
    >
      <div
        className="w-full max-w-sm animate-slide-up relative rounded-2xl sm:rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #111727 0%, #0b0f17 100%)',
          border: '1px solid rgba(251,191,36,0.28)',
          boxShadow:
            '0 50px 120px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(251,191,36,0.06) inset, 0 0 28px rgba(251,191,36,0.22), 0 0 64px rgba(251,191,36,0.10)',
        }}
      >
        <div
          aria-hidden
          className="absolute -top-16 -right-6 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.26) 0%, transparent 70%)' }}
        />
        <div
          aria-hidden
          className="absolute -bottom-14 -left-6 w-36 h-36 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(217,70,239,0.18) 0%, transparent 70%)' }}
        />

        <div className="relative p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div
              className="p-2.5 sm:p-3 rounded-2xl"
              style={{
                background:
                  'linear-gradient(145deg, rgba(251,191,36,0.22), rgba(251,191,36,0.06))',
                border: '1px solid rgba(251,191,36,0.35)',
              }}
            >
              <Shield className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: '#fcd34d' }} />
            </div>
            <button
              onClick={onClose}
              disabled={isVerifying}
              className="p-2 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.55)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(244,63,94,0.15)';
                e.currentTarget.style.color = '#fda4af';
                e.currentTarget.style.borderColor = 'rgba(244,63,94,0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <h3 className="text-lg sm:text-xl font-black tracking-tight text-white mb-1.5">
            Autorisation requise
          </h3>

          <p
            className="text-sm sm:text-[15px] leading-relaxed mb-4"
            style={{ color: 'rgba(255,255,255,0.72)' }}
          >
            Pour modifier le format vers{' '}
            <span className="font-bold" style={{ color: '#fcd34d' }}>
              « {targetLayoutLabel} »
            </span>
            , veuillez saisir le code d&apos;autorisation administrateur.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label
                className="block text-xs sm:text-sm font-semibold mb-1.5"
                style={{ color: 'rgba(255,255,255,0.78)' }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" style={{ color: '#fcd34d' }} />
                  Mot de passe
                </span>
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="password"
                  autoComplete="off"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  disabled={isVerifying}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 rounded-xl text-sm sm:text-base font-medium text-white outline-none transition-all duration-200 disabled:opacity-60"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: error
                      ? '1px solid rgba(244,63,94,0.55)'
                      : '1px solid rgba(255,255,255,0.10)',
                    boxShadow: error
                      ? '0 0 0 3px rgba(244,63,94,0.12)'
                      : '0 0 0 3px transparent',
                  }}
                  onFocus={(e) => {
                    if (!error) {
                      e.currentTarget.style.borderColor = 'rgba(251,191,36,0.55)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.10)';
                    }
                  }}
                  onBlur={(e) => {
                    if (!error) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px transparent';
                    }
                  }}
                />
              </div>
              {error && (
                <div
                  className="mt-2 flex items-start gap-1.5 text-xs font-medium"
                  style={{ color: '#fda4af' }}
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:space-x-3 gap-2 sm:gap-0 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={isVerifying}
                className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.82)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onMouseEnter={(e) => {
                  if (!isVerifying) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(251,191,36,0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 rounded-xl font-black text-sm sm:text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{
                  background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                  color: '#0b0f17',
                  border: '1px solid rgba(251,191,36,0.55)',
                  boxShadow:
                    '0 1px 0 rgba(255,255,255,0.35) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 16px 36px -12px rgba(245,158,11,0.75), 0 0 40px rgba(251,191,36,0.22)',
                }}
                onMouseEnter={(e) => {
                  if (!isVerifying) {
                    e.currentTarget.style.background =
                      'linear-gradient(180deg, #fde68a 0%, #fbbf24 100%)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isVerifying) {
                    e.currentTarget.style.background =
                      'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)';
                  }
                }}
              >
                {isVerifying ? (
                  <div className="flex items-center justify-center">
                    <div
                      className="w-5 h-5 border-2 rounded-full animate-spin mr-2"
                      style={{
                        borderColor: 'rgba(11,15,23,0.3)',
                        borderTopColor: '#0b0f17',
                      }}
                    />
                    Vérification...
                  </div>
                ) : (
                  'Confirmer'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminPasswordModal;
