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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-luxury max-w-md w-full animate-slide-up relative overflow-hidden">
          <div className="relative p-6 border-b border-neutral-200/50 bg-gradient-to-r from-neutral-50 to-amber-50/30">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="relative mr-3">
                  <img src={furahaLogo} alt="Furaha Event Logo" className="h-8 w-8 object-contain animate-glow drop-shadow-lg" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Mot de passe oublié
                  </h2>
                  <p className="text-slate-600 text-sm">
                    Saisissez votre email pour recevoir un lien de réinitialisation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowResetPassword(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
              >
                <X className="h-5 w-5 text-neutral-500" />
              </button>
            </div>
          </div>

          <form onSubmit={handleResetPassword} className="relative p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 ${
                      errors.email ? 'border-rose-500' : 'border-neutral-300'
                    }`}
                    placeholder="votre@email.com"
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-rose-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                  <p className="text-rose-700 text-sm">{error}</p>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-4">
              <button
                type="submit"
                disabled={isLoading}
               className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 text-slate-900 py-3 rounded-xl hover:from-yellow-500 hover:via-amber-500 hover:to-yellow-600 transition-all duration-500 font-bold shadow-lg hover:shadow-2xl transform hover:scale-105 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-yellow-300/50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin mr-2"></div>
                    Envoi en cours...
                  </div>
                ) : (
                  <>
                    Envoyer le lien de réinitialisation
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowResetPassword(false)}
                  className="text-amber-600 hover:text-amber-700 transition-colors duration-300 font-medium"
                >
                  Retour à la connexion
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-luxury max-w-md w-full animate-slide-up relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/20 to-purple-200/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-rose-200/20 to-amber-200/20 rounded-full blur-2xl"></div>
        
        {/* Header */}
       <div className="relative p-6 border-b border-yellow-200/50 bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-100/50">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="relative mr-3">
               <img src={furahaLogo} alt="Furaha Event Logo" className="h-8 w-8 object-contain animate-glow drop-shadow-lg" />
                <div className="absolute inset-0 animate-pulse opacity-30">
                  <img src={furahaLogo} alt="Furaha Event Logo pulse" className="h-8 w-8 object-contain" />
                </div>
              </div>
              <div>
               <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-700 via-amber-700 to-yellow-800 bg-clip-text text-transparent">
                  {isLoginMode ? 'Connexion' : 'Inscription'}
                </h2>
                <p className="text-slate-600 text-sm">
                  {isLoginMode ? 'Accédez à votre espace personnel' : 'Créez votre compte Furaha-Event'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
            >
              <X className="h-5 w-5 text-neutral-500" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="relative p-6">
          <div className="space-y-4">
            {/* Prénom et Nom (inscription seulement) */}
            {!isLoginMode && allowSignup && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Prénom
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 ${
                        errors.firstName ? 'border-rose-500' : 'border-neutral-300'
                      }`}
                      placeholder="Votre prénom"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-rose-500 text-xs mt-1">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nom
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 ${
                        errors.lastName ? 'border-rose-500' : 'border-neutral-300'
                      }`}
                      placeholder="Votre nom"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-rose-500 text-xs mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 ${
                    errors.email ? 'border-rose-500' : 'border-neutral-300'
                  }`}
                  placeholder="votre@email.com"
                />
              </div>
              {errors.email && (
                <p className="text-rose-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 ${
                    errors.password ? 'border-rose-500' : 'border-neutral-300'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-rose-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirmation mot de passe (inscription seulement) */}
            {!isLoginMode && allowSignup && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 ${
                      errors.confirmPassword ? 'border-rose-500' : 'border-neutral-300'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-rose-500 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Erreur générale */}
            {(errors.general || error) && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                <p className="text-rose-700 text-sm">{errors.general || error}</p>
              </div>
            )}
          </div>

          {/* Boutons */}
          <div className="mt-6 space-y-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-900 py-3 rounded-xl hover:from-amber-600 hover:via-amber-700 hover:to-amber-600 transition-all duration-500 font-semibold shadow-glow-amber hover:shadow-luxury transform hover:scale-105 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin mr-2"></div>
                  {isLoginMode ? 'Connexion...' : 'Inscription...'}
                </div>
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <span className="relative flex items-center justify-center">
                    <Sparkles className="h-5 w-5 mr-2" />
                    {isLoginMode ? 'Se connecter' : 'Créer mon compte'}
                  </span>
                </>
              )}
            </button>

            {allowSignup && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-amber-600 hover:text-amber-700 transition-colors duration-300 font-medium"
                >
                  {isLoginMode 
                    ? "Pas encore de compte ? S'inscrire" 
                    : "Déjà un compte ? Se connecter"
                  }
                </button>
              </div>
            )}
          </div>

          {/* Mot de passe oublié (connexion seulement) */}
          {isLoginMode && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowResetPassword(true)}
                className="text-slate-500 hover:text-slate-700 transition-colors duration-300 text-sm"
              >
                Mot de passe oublié ?
              </button>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="relative px-6 pb-6">
          <div className="bg-gradient-to-r from-amber-50 to-rose-50 rounded-2xl p-4 border border-amber-200/50">
            <div className="flex items-center mb-2">
              <img src={furahaLogo} alt="Furaha" className="h-4 w-4 mr-2 object-contain" />
              <h4 className="text-amber-800 font-semibold text-sm">Avantages membre</h4>
            </div>
            <ul className="text-amber-700 text-xs space-y-1">
              <li>• Accès à tous les modèles premium</li>
              <li>• Personnalisation complète</li>
              <li>• Gestion de vos événements</li>
              <li>• Support prioritaire</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
