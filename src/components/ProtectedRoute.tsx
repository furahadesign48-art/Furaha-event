import React from 'react';
import { useAuth } from './AuthContext';
import { Crown, Sparkles, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ProtectedRoute = ({ children, fallback }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-amber-50/30 to-purple-50/20 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative mb-6">
            <Crown className="h-16 w-16 text-amber-500 animate-glow drop-shadow-lg mx-auto" />
            <div className="absolute inset-0 animate-ping">
              <Crown className="h-16 w-16 text-amber-300 opacity-30 mx-auto" />
            </div>
          </div>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-slate-600 font-medium">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-amber-50/30 to-purple-50/20 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center animate-fade-in">
          <div className="bg-white rounded-3xl shadow-luxury border border-neutral-200/50 p-8 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/20 to-purple-200/20 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-rose-200/20 to-amber-200/20 rounded-full blur-2xl"></div>
            
            <div className="relative">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="p-4 bg-gradient-to-r from-amber-500 to-rose-500 rounded-full shadow-glow-amber">
                    <Lock className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Sparkles className="h-6 w-6 text-amber-500 animate-pulse" />
                  </div>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4">
                Accès Restreint
              </h2>
              
              <p className="text-slate-600 mb-6 leading-relaxed">
                Vous devez être connecté pour accéder à cette fonctionnalité. 
                Créez votre compte ou connectez-vous pour continuer.
              </p>
              
              <div className="bg-gradient-to-r from-amber-50 to-rose-50 rounded-2xl p-4 border border-amber-200/50 mb-6">
                <div className="flex items-center mb-2">
                  <Crown className="h-4 w-4 text-amber-600 mr-2" />
                  <h4 className="text-amber-800 font-semibold text-sm">Avantages membre</h4>
                </div>
                <ul className="text-amber-700 text-xs space-y-1 text-left">
                  <li>• Accès à tous les modèles premium</li>
                  <li>• Personnalisation complète</li>
                  <li>• Gestion de vos événements</li>
                  <li>• Support prioritaire</li>
                </ul>
              </div>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-900 py-3 rounded-xl hover:from-amber-600 hover:via-amber-700 hover:to-amber-600 transition-all duration-500 font-semibold shadow-glow-amber hover:shadow-luxury transform hover:scale-105 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative flex items-center justify-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Se connecter
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;