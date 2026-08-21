import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Sparkles } from 'lucide-react';
import furahaLogo from '../images/FURAHA-GOLD.png';
import { useAuth } from './AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
  const { login, register, resetPassword, error, clearError } = useAuth();
  const allowSignup = (import.meta.env.VITE_ALLOW_PUBLIC_SIGNUP ?? 'false') === 'true';
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResetPassword, setShowResetPassword] = useState(false);

  

  if (!isOpen) return null;

  

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    // Validation mot de passe
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    // Validation pour l'inscription
    if (!isLoginMode) {
      if (!formData.firstName) {
        newErrors.firstName = 'Le prénom est requis';
      }
      if (!formData.lastName) {
        newErrors.lastName = 'Le nom est requis';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirmez votre mot de passe';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    clearError();
    console.log('Soumission du formulaire:', isLoginMode ? 'Connexion' : 'Inscription');

    try {
      if (isLoginMode) {
        const result = await login(formData.email, formData.password);
        console.log('Résultat de la connexion:', result);
        if (result.success) {
          onSuccess();
          onClose();
        } else {
          setErrors({ general: result.error || 'Erreur de connexion' });
        }
      } else {
        if (!allowSignup) {
          setErrors({ general: 'Les inscriptions sont temporairement fermées.' });
          return;
        }
        const result = await register(formData.email, formData.password, formData.firstName, formData.lastName);
        console.log('Résultat de l\'inscription:', result);
        if (result.success) {
          onSuccess();
          onClose();
        } else {
          console.error('Erreur d\'inscription:', result.error);
          setErrors({ general: result.error || 'Erreur d\'inscription' });
        }
      }
    } catch (error) {
      console.error('Erreur dans handleSubmit:', error);
      setErrors({ general: 'Une erreur est survenue. Veuillez réessayer.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setErrors({ email: 'Veuillez saisir votre adresse email' });
      return;
    }
    
    const result = await resetPassword(formData.email);
    if (result.success) {
      alert('Un email de réinitialisation a été envoyé à votre adresse email.');
      setShowResetPassword(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const switchMode = () => {
    if (!allowSignup) return;
    setIsLoginMode(!isLoginMode);
    setShowResetPassword(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
  };

  if (showResetPassword) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fade-in"
           style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}>
        <div className="w-full max-w-md animate-slide-up relative rounded-2xl sm:rounded-3xl overflow-hidden"
             style={{
               background: 'linear-gradient(180deg, #111727 0%, #0b0f17 100%)',
               border: '1px solid rgba(167,139,250,0.35)',
               boxShadow: '0 50px 120px -30px rgba(0,0,0,0.85), 0 0 0 1px rgba(251,191,36,0.06) inset, 0 0 0 1px rgba(167,139,250,0.12), 0 0 32px rgba(167,139,250,0.35), 0 0 72px rgba(167,139,250,0.2)',
             }}>
          <div
            aria-hidden
            className="absolute -top-20 left-1/2 -translate-x-1/2 w-[85%] h-40 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.28) 0%, transparent 70%)' }}
          />
          <div className="relative p-5 sm:p-6 flex justify-between items-center border-b"
               style={{
                 borderColor: 'rgba(255,255,255,0.06)',
                 background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
               }}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={furahaLogo} alt="Furaha Event Logo" className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
                     style={{ filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.45))' }} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Mot de passe oublié
                </h2>
                <p className="text-[11px] sm:text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.48)' }}>
                  Saisissez votre email pour recevoir un lien
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowResetPassword(false)}
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

          <form onSubmit={handleResetPassword} className="relative p-5 sm:p-6">
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5" style={{ color: 'rgba(251,191,36,0.55)' }} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 text-sm outline-none placeholder:text-white/25 text-white"
                    style={{
                      background: errors.email ? 'rgba(244,63,94,0.06)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${errors.email ? 'rgba(244,63,94,0.45)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = errors.email ? 'rgba(244,63,94,0.45)' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                    placeholder="votre@email.com"
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] mt-1.5" style={{ color: '#fda4af' }}>{errors.email}</p>
                )}
              </div>

              {error && (
                <div className="rounded-xl p-4"
                     style={{
                       background: 'rgba(244,63,94,0.08)',
                       border: '1px solid rgba(244,63,94,0.3)',
                     }}>
                  <p className="text-xs sm:text-sm" style={{ color: '#fda4af' }}>{error}</p>
                </div>
              )}
            </div>

            <div className="mt-6 sm:mt-7 space-y-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 sm:py-3 rounded-xl font-black text-sm sm:text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{
                  background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                  color: '#0b0f17',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.35) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 14px 36px -12px rgba(251,191,36,0.7), 0 0 48px rgba(251,191,36,0.22)',
                }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 rounded-full animate-spin mr-2"
                         style={{ borderColor: 'rgba(11,15,23,0.3)', borderTopColor: '#0b0f17' }}></div>
                    Envoi en cours...
                  </div>
                ) : (
                  'Envoyer le lien de réinitialisation'
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowResetPassword(false)}
                  className="font-bold text-xs sm:text-sm transition-colors duration-300 hover:underline"
                  style={{ color: '#fcd34d' }}
                >
                  ← Retour à la connexion
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fade-in"
         style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md animate-slide-up relative rounded-2xl sm:rounded-3xl overflow-hidden max-h-[92vh] overflow-y-auto no-scrollbar"
           style={{
             background: 'linear-gradient(180deg, #111727 0%, #0b0f17 100%)',
             border: '1px solid rgba(167,139,250,0.35)',
             boxShadow: '0 50px 120px -30px rgba(0,0,0,0.85), 0 0 0 1px rgba(251,191,36,0.06) inset, 0 0 0 1px rgba(167,139,250,0.12), 0 0 32px rgba(167,139,250,0.35), 0 0 72px rgba(167,139,250,0.2)',
           }}>
        {/* Effets backlight radiaux */}
        <div
          aria-hidden
          className="absolute -top-20 -right-8 w-48 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.28) 0%, transparent 70%)' }}
        />
        <div
          aria-hidden
          className="absolute -bottom-16 -left-8 w-44 h-44 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.22) 0%, transparent 70%)' }}
        />

        {/* Header */}
        <div className="relative p-5 sm:p-6 flex justify-between items-center border-b"
             style={{
               borderColor: 'rgba(255,255,255,0.06)',
               background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
             }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={furahaLogo} alt="Furaha Event Logo" className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
                   style={{ filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.45))' }} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {isLoginMode ? 'Connexion' : 'Inscription'}
              </h2>
              <p className="text-[11px] sm:text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.48)' }}>
                {isLoginMode ? 'Accédez à votre espace personnel' : 'Créez votre compte Furaha-Event'}
              </p>
            </div>
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

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="relative p-5 sm:p-6">
          <div className="space-y-4 sm:space-y-5">
            {!isLoginMode && allowSignup && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    Prénom
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5" style={{ color: 'rgba(251,191,36,0.55)' }} />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 text-sm outline-none placeholder:text-white/25 text-white"
                      style={{
                        background: errors.firstName ? 'rgba(244,63,94,0.06)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${errors.firstName ? 'rgba(244,63,94,0.45)' : 'rgba(255,255,255,0.08)'}`,
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = errors.firstName ? 'rgba(244,63,94,0.45)' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                      placeholder="Votre prénom"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-[11px] mt-1.5" style={{ color: '#fda4af' }}>{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    Nom
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5" style={{ color: 'rgba(251,191,36,0.55)' }} />
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 text-sm outline-none placeholder:text-white/25 text-white"
                      style={{
                        background: errors.lastName ? 'rgba(244,63,94,0.06)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${errors.lastName ? 'rgba(244,63,94,0.45)' : 'rgba(255,255,255,0.08)'}`,
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = errors.lastName ? 'rgba(244,63,94,0.45)' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                      placeholder="Votre nom"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-[11px] mt-1.5" style={{ color: '#fda4af' }}>{errors.lastName}</p>
                  )}
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5" style={{ color: 'rgba(251,191,36,0.55)' }} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 text-sm outline-none placeholder:text-white/25 text-white"
                  style={{
                    background: errors.email ? 'rgba(244,63,94,0.06)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${errors.email ? 'rgba(244,63,94,0.45)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = errors.email ? 'rgba(244,63,94,0.45)' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  placeholder="votre@email.com"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] mt-1.5" style={{ color: '#fda4af' }}>{errors.email}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5" style={{ color: 'rgba(251,191,36,0.55)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full pl-10 sm:pl-11 pr-12 py-2.5 sm:py-3 rounded-xl transition-all duration-200 text-sm outline-none placeholder:text-white/25 text-white"
                  style={{
                    background: errors.password ? 'rgba(244,63,94,0.06)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${errors.password ? 'rgba(244,63,94,0.45)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = errors.password ? 'rgba(244,63,94,0.45)' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-200"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#fcd34d'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                >
                  {showPassword ? <EyeOff className="h-4 sm:h-5 w-4 sm:w-5" /> : <Eye className="h-4 sm:h-5 w-4 sm:w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] mt-1.5" style={{ color: '#fda4af' }}>{errors.password}</p>
              )}
            </div>

            {/* Confirmation mot de passe */}
            {!isLoginMode && allowSignup && (
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5" style={{ color: 'rgba(251,191,36,0.55)' }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full pl-10 sm:pl-11 pr-12 py-2.5 sm:py-3 rounded-xl transition-all duration-200 text-sm outline-none placeholder:text-white/25 text-white"
                    style={{
                      background: errors.confirmPassword ? 'rgba(244,63,94,0.06)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${errors.confirmPassword ? 'rgba(244,63,94,0.45)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = errors.confirmPassword ? 'rgba(244,63,94,0.45)' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-200"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#fcd34d'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 sm:h-5 w-4 sm:w-5" /> : <Eye className="h-4 sm:h-5 w-4 sm:w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] mt-1.5" style={{ color: '#fda4af' }}>{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Erreur générale */}
            {(errors.general || error) && (
              <div className="rounded-xl p-4"
                   style={{
                     background: 'rgba(244,63,94,0.08)',
                     border: '1px solid rgba(244,63,94,0.3)',
                   }}>
                <p className="text-xs sm:text-sm" style={{ color: '#fda4af' }}>{errors.general || error}</p>
              </div>
            )}
          </div>

          {/* Boutons */}
          <div className="mt-6 sm:mt-7 space-y-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 sm:py-3 rounded-xl font-black text-sm sm:text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{
                background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                color: '#0b0f17',
                boxShadow: '0 1px 0 rgba(255,255,255,0.35) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 14px 36px -12px rgba(251,191,36,0.7), 0 0 48px rgba(251,191,36,0.22)',
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 rounded-full animate-spin mr-2"
                       style={{ borderColor: 'rgba(11,15,23,0.3)', borderTopColor: '#0b0f17' }}></div>
                  {isLoginMode ? 'Connexion...' : 'Inscription...'}
                </div>
              ) : (
                <span className="flex items-center justify-center">
                  <Sparkles className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
                  {isLoginMode ? 'Se connecter' : 'Créer mon compte'}
                </span>
              )}
            </button>

            {allowSignup && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={switchMode}
                  className="font-bold text-xs sm:text-sm transition-colors duration-300 hover:underline"
                  style={{ color: '#fcd34d' }}
                >
                  {isLoginMode
                    ? "Pas encore de compte ? S'inscrire"
                    : "Déjà un compte ? Se connecter"
                  }
                </button>
              </div>
            )}
          </div>

          {/* Mot de passe oublié */}
          {isLoginMode && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowResetPassword(true)}
                className="text-xs sm:text-sm transition-colors duration-300 hover:underline"
                style={{ color: 'rgba(255,255,255,0.5)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#fcd34d'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
              >
                Mot de passe oublié ?
              </button>
            </div>
          )}
        </form>

        {/* Footer Avantages membre */}
        <div className="relative px-5 sm:px-6 pb-5 sm:pb-6">
          <div className="relative rounded-2xl p-4 overflow-hidden"
               style={{
                 background: 'linear-gradient(180deg, rgba(251,191,36,0.08) 0%, rgba(251,191,36,0.03) 100%)',
                 border: '1px solid rgba(251,191,36,0.22)',
                 boxShadow: '0 0 40px -12px rgba(251,191,36,0.18) inset',
               }}>
            <div
              aria-hidden
              className="absolute -top-8 -right-4 w-24 h-24 rounded-full blur-2xl pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)' }}
            />
            <div className="relative z-10 flex items-center mb-2.5">
              <img src={furahaLogo} alt="Furaha" className="h-4 w-4 mr-2 object-contain" />
              <h4 className="font-black text-sm" style={{ color: '#fcd34d' }}>Avantages membre</h4>
            </div>
            <ul className="text-xs sm:text-[13px] space-y-1.5 relative z-10" style={{ color: 'rgba(255,255,255,0.72)' }}>
              <li className="flex items-start gap-2">
                <span style={{ color: '#fcd34d' }}>•</span>
                Accès à tous les modèles premium
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#fcd34d' }}>•</span>
                Personnalisation complète
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#fcd34d' }}>•</span>
                Gestion de vos événements
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#fcd34d' }}>•</span>
                Support prioritaire
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
