import React, { useState } from 'react';
import { Menu, X, Crown, User, LogOut, Settings } from 'lucide-react';
import furahaLogo from '../images/FURAHA-GOLD.png';
import { useAuth } from './AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '../contexts/LanguageContext';


interface HeaderProps {
  onLogin?: () => void;
}

const Header = ({ onLogin }: HeaderProps) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { subscription, getRemainingInvites } = useSubscription();
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Fermer le menu utilisateur en cliquant à l'extérieur
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
  };

  return (
<header className="fixed top-0 left-0 right-0 bg-gradient-to-r from-neutral-50/95 via-amber-50/90 to-neutral-50/95 dark:from-slate-800/95 dark:via-slate-700/90 dark:to-slate-800/95 backdrop-blur-xl shadow-luxury border-b border-amber-200/30 dark:border-slate-600/30 z-50 animate-fade-in transition-colors duration-300">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
      
      {/* Logo personnalisé */}
      <div className="flex items-center space-x-2">
        <div className="relative">
          <img 
            src={furahaLogo}
            alt="Furaha Event Logo" 
            className="h-12 w-12 object-contain drop-shadow-lg animate-glow"
          />
          <div className="absolute inset-0 animate-pulse opacity-50">
            <img 
              src={furahaLogo}
              alt="Furaha Event Logo pulse" 
              className="h-12 w-12 object-contain"
            />
          </div>
        </div>

        <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-amber-700 to-slate-900 dark:from-slate-100 dark:via-amber-300 dark:to-slate-100 bg-clip-text text-transparent">
          Furaha-Event
        </span>
        </div>


          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/" className="text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-300 font-medium relative group">
              {t('home') || 'Accueil'}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-600 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#services" className="text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-300 font-medium relative group">
              {t('templates') || 'Modèles'}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-600 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#pricing" className="text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-300 font-medium relative group">
              {t('pricing') || 'Prix'}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-600 group-hover:w-full transition-all duration-300"></span>
            </a>
            
            {/* Bouton de basculement du thème */}
            <ThemeToggle />
            
            {/* Sélecteur de langue */}
            <LanguageSelector />
            
            {/* Bouton de connexion ou menu utilisateur */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 px-4 py-2 rounded-full hover:from-amber-600 hover:to-amber-700 transition-all duration-300 font-medium shadow-glow-amber hover:shadow-luxury transform hover:scale-105"
                >
                  <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-amber-400 font-bold text-sm">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <span className="hidden sm:block">{user.firstName}</span>
                </button>
                
                {/* Menu déroulant utilisateur */}
                {showUserMenu && (
                  <div className="user-menu absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-luxury border border-neutral-200/50 dark:border-slate-600/50 py-2 z-50 animate-slide-up">
                    <div className="px-4 py-3 border-b border-neutral-200/50 dark:border-slate-600/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <button
                        onClick={() => {
                          console.log('Clic sur Mon Dashboard');
                          setShowUserMenu(false);
                          onLogin && onLogin();
                        }}
                        className="w-full flex items-center px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-amber-700 dark:hover:text-amber-400 transition-all duration-200"
                      >
                        <User className="h-4 w-4 mr-3" />
                        {t('dashboard')}
                      </button>
                      
                      {/* Affichage du plan et des invitations restantes */}
                      {subscription && (
                        <div className="px-4 py-2 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 mx-2 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                                Plan {subscription.plan === 'free' ? 'Gratuit' : subscription.plan}
                              </p>
                              {subscription.plan === 'free' && (
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                  {getRemainingInvites()} invitations restantes
                                </p>
                              )}
                            </div>
                            <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          </div>
                        </div>
                      )}
                      
                      <hr className="my-2 border-neutral-200/50 dark:border-slate-600/50" />
                      
                      <button
                        onClick={() => {
                          console.log('Clic sur Se déconnecter');
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center px-4 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-700 dark:hover:text-rose-300 transition-all duration-200"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        {t('logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={onLogin}
               className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 text-slate-900 px-6 py-2 rounded-full hover:from-yellow-500 hover:via-amber-500 hover:to-yellow-600 transition-all duration-300 font-medium shadow-lg hover:shadow-2xl transform hover:scale-105 relative overflow-hidden group border border-yellow-300/50"
              >
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
               <span className="relative font-semibold">
                {t('login') || 'Connexion'}
               </span>
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-slate-900" />
            ) : (
              <Menu className="h-6 w-6 text-slate-900" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 animate-slide-up bg-gradient-to-r from-neutral-50/95 via-amber-50/90 to-neutral-50/95 dark:from-slate-800/95 dark:via-slate-700/90 dark:to-slate-800/95 backdrop-blur-xl">
            <nav className="flex flex-col space-y-4">
              <a href="#" className="text-slate-700 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors duration-300 font-medium px-4 py-2">
                {t('home') || 'Accueil'}
              </a>
              <a href="#" className="text-slate-700 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors duration-300 font-medium px-4 py-2">
                {t('templates') || 'Modèles'}
              </a>
              <a href="#" className="text-slate-700 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors duration-300 font-medium px-4 py-2">
                {t('pricing') || 'Prix'}
              </a>
              
              {/* Bouton de basculement du thème mobile */}
              <div className="px-4 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{t('theme')}</span>
                  <ThemeToggle />
                </div>
              </div>
              
              {/* Sélecteur de langue mobile */}
              <div className="px-4 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{t('language')}</span>
                  <LanguageSelector />
                </div>
              </div>
              
              {isAuthenticated && user ? (
                <div className="mx-4 space-y-2">
                  <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-xl">
                    <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{user.email}</p>
                      {subscription?.plan === 'free' && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          {getRemainingInvites()}/5 invitations
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (onLogin) {
                        onLogin();
                      }
                    }}
                    className="w-full bg-amber-500 text-slate-900 px-4 py-2 rounded-xl hover:bg-amber-600 transition-all duration-300 font-medium flex items-center justify-center"
                  >
                    <User className="h-4 w-4 mr-2" />
                    {t('dashboard')}
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full bg-rose-500 text-white px-4 py-2 rounded-xl hover:bg-rose-600 transition-all duration-300 font-medium flex items-center justify-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('logout')}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    onLogin?.();
                  }}
                 className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 text-slate-900 px-6 py-2 rounded-full hover:from-yellow-500 hover:via-amber-500 hover:to-yellow-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-2xl mx-4 border border-yellow-300/50 relative overflow-hidden group"
                >
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                 <span className="relative">
                  {t('login') || 'Connexion'}
                 </span>
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
