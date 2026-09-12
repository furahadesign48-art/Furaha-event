import React, { useState } from 'react';
import { Menu, X, Crown, User, LogOut, Settings } from 'lucide-react';
import furahaLogo from '../images/FURAHA-GOLD.png';
import { useAuth } from './AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';
import ConfirmationModal from './ConfirmationModal';


interface HeaderProps {
  onLogin?: () => void;
}

const Header = ({ onLogin }: HeaderProps) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { subscription, getRemainingInvites } = useSubscription();
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const handleLogoutClick = () => {
    setShowUserMenu(false);
    setIsMenuOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <>
<header className={cn(
  "fixed top-0 left-0 right-0 z-50 animate-fade-in backdrop-blur-xl border-b transition-colors duration-500",
  isDarkMode
    ? "bg-[#0b0f17]/80 border-white/5"
    : "bg-amber-50/85 border-amber-900/10"
)}>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
      
      {/* Logo personnalisé */}
      <div className="flex items-center space-x-2">
        <div className="relative">
          <img 
            src={furahaLogo}
            alt="Furaha Event Logo" 
            className="h-10 w-10 object-contain drop-shadow-lg"
          />
        </div>

        <span className="text-xl font-bold bg-clip-text text-transparent"
              style={{
                backgroundImage: isDarkMode
                  ? 'linear-gradient(135deg,#ffffff 0%, #fde68a 50%, #fbbf24 100%)'
                  : 'linear-gradient(135deg,#78350f 0%, #b45309 50%, #d97706 100%)',
              }}
        >
          Furaha-Event
        </span>
        </div>


          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-7">
            <a href="/" className={cn(
              "transition-all duration-300 text-sm font-medium hover:text-amber-500",
              isDarkMode ? "text-white/70 hover:text-amber-300" : "text-amber-950/75 hover:text-amber-600"
            )}>
              {t('home') || 'Accueil'}
            </a>
            <a href="#services" className={cn(
              "transition-all duration-300 text-sm font-medium",
              isDarkMode ? "text-white/70 hover:text-amber-300" : "text-amber-950/75 hover:text-amber-600"
            )}>
              {t('templates') || 'Modèles'}
            </a>
            <a href="#features" className={cn(
              "transition-all duration-300 text-sm font-medium",
              isDarkMode ? "text-white/70 hover:text-amber-300" : "text-amber-950/75 hover:text-amber-600"
            )}>
              {t('features') || 'Fonctionnalités'}
            </a>
            
            {/* Sélecteur de langue */}
            <LanguageSelector />

            {/* Toggle mode sombre/clair */}
            <ThemeToggle />
            
            {/* Bouton de connexion ou menu utilisateur */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all duration-300 font-medium text-sm"
                  style={{
                    border: isDarkMode ? '1px solid rgba(251,191,36,0.35)' : '1px solid rgba(180,83,9,0.25)',
                    background: isDarkMode
                      ? 'linear-gradient(180deg, rgba(251,191,36,0.14), rgba(251,191,36,0.04))'
                      : 'linear-gradient(180deg, rgba(251,191,36,0.20), rgba(251,191,36,0.08))',
                    color: isDarkMode ? '#fde68a' : '#78350f',
                  }}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                       style={{
                         background: 'linear-gradient(145deg,#fbbf24,#d97706)',
                         color: '#0b0f17',
                       }}
                  >
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <span className="hidden sm:block">{user.firstName}</span>
                </button>
                
                {/* Menu déroulant utilisateur */}
                {showUserMenu && (
                  <div className="user-menu absolute right-0 mt-2 w-64 rounded-xl py-2 z-50 animate-slide-up"
                       style={{
                         background: isDarkMode
                           ? 'linear-gradient(180deg, #111727 0%, #0d1220 100%)'
                           : 'linear-gradient(180deg, #fffaf0 0%, #fff7ed 100%)',
                         border: isDarkMode
                           ? '1px solid rgba(255,255,255,0.08)'
                           : '1px solid rgba(180,83,9,0.18)',
                         boxShadow: isDarkMode
                           ? '0 20px 60px -20px rgba(0,0,0,0.8)'
                           : '0 20px 60px -20px rgba(180,83,9,0.25)',
                       }}
                  >
                    <div className="px-4 py-3 border-b" style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(180,83,9,0.10)' }}>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                             style={{ background: 'linear-gradient(145deg,#f59e0b,#d946ef)' }}
                        >
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <p className={cn("font-semibold", isDarkMode ? "text-white" : "text-amber-950")}>{user.firstName} {user.lastName}</p>
                          <p className={cn("text-sm", isDarkMode ? "text-white/50" : "text-amber-900/55")}>{user.email}</p>
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
                        className={cn(
                          "w-full flex items-center px-4 py-2 transition-all duration-200 text-sm",
                          isDarkMode
                            ? "text-white/80 hover:bg-white/5 hover:text-amber-300"
                            : "text-amber-950/85 hover:bg-amber-100/60 hover:text-amber-600"
                        )}
                      >
                        <User className="h-4 w-4 mr-3" />
                        {t('dashboard')}
                      </button>
                      
                      <hr className="my-2" style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(180,83,9,0.10)' }} />
                      
                      <button
                        onClick={() => {
                          console.log('Clic sur Se déconnecter');
                          handleLogoutClick();
                        }}
                        className={cn(
                          "w-full flex items-center px-4 py-2 transition-all duration-200 text-sm",
                          isDarkMode
                            ? "text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                            : "text-rose-600 hover:bg-rose-50 hover:text-rose-500"
                        )}
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
                className="px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 hover:scale-[1.03]"
                style={{
                  background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                  color: '#0b0f17',
                  boxShadow: isDarkMode
                    ? '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 8px 24px -8px rgba(251,191,36,0.5)'
                    : '0 1px 0 rgba(255,255,255,0.4) inset, 0 0 0 1px rgba(180,83,9,0.25), 0 8px 24px -8px rgba(180,83,9,0.25)',
                }}
              >
               <span className="font-semibold">
                {t('login') || 'Connexion'}
               </span>
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className={cn(
              "md:hidden p-2 rounded-md transition-colors",
              isDarkMode ? "hover:bg-white/5" : "hover:bg-amber-900/5"
            )}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className={cn("h-5 w-5", isDarkMode ? "text-white" : "text-amber-900")} />
            ) : (
              <Menu className={cn("h-5 w-5", isDarkMode ? "text-white" : "text-amber-900")} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 animate-slide-up"
               style={{
                 background: isDarkMode ? 'rgba(11,15,23,0.98)' : 'rgba(255,251,235,0.98)',
                 borderTop: isDarkMode
                   ? '1px solid rgba(255,255,255,0.06)'
                   : '1px solid rgba(180,83,9,0.10)',
                 backdropFilter: 'blur(20px)',
               }}
          >
            <nav className="flex flex-col space-y-1">
              <a href="#" className={cn(
                "hover:bg-white/5 transition-colors duration-300 font-medium px-4 py-2.5 rounded-md text-sm",
                isDarkMode
                  ? "text-white/80 hover:text-amber-300"
                  : "text-amber-950/85 hover:text-amber-600 hover:bg-amber-900/5"
              )}>
                {t('home') || 'Accueil'}
              </a>
              <a href="#services" className={cn(
                "hover:bg-white/5 transition-colors duration-300 font-medium px-4 py-2.5 rounded-md text-sm",
                isDarkMode
                  ? "text-white/80 hover:text-amber-300"
                  : "text-amber-950/85 hover:text-amber-600 hover:bg-amber-900/5"
              )}>
                {t('templates') || 'Modèles'}
              </a>
              <a href="#features" className={cn(
                "hover:bg-white/5 transition-colors duration-300 font-medium px-4 py-2.5 rounded-md text-sm",
                isDarkMode
                  ? "text-white/80 hover:text-amber-300"
                  : "text-amber-950/85 hover:text-amber-600 hover:bg-amber-900/5"
              )}>
                {t('features') || 'Fonctionnalités'}
              </a>
              
              {/* Sélecteur de langue mobile */}
              <div className="px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm font-medium", isDarkMode ? "text-white/70" : "text-amber-950/70")}>{t('language')}</span>
                  <LanguageSelector />
                </div>
              </div>
              
              {/* Toggle thème mobile */}
              <div className="px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm font-medium", isDarkMode ? "text-white/70" : "text-amber-950/70")}>{t('theme')}</span>
                  <ThemeToggle />
                </div>
              </div>
              
              {isAuthenticated && user ? (
                <div className="mx-4 mt-2 space-y-2">
                  <div className="flex items-center space-x-3 px-3 py-3 rounded-lg"
                       style={{
                         background: isDarkMode
                           ? 'linear-gradient(180deg, rgba(251,191,36,0.12), rgba(251,191,36,0.04))'
                           : 'linear-gradient(180deg, rgba(251,191,36,0.20), rgba(251,191,36,0.08))',
                         border: isDarkMode
                           ? '1px solid rgba(251,191,36,0.18)'
                           : '1px solid rgba(180,83,9,0.20)',
                       }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                         style={{ background: 'linear-gradient(145deg,#f59e0b,#d946ef)' }}
                    >
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className={cn("font-semibold text-sm truncate", isDarkMode ? "text-white" : "text-amber-950")}>{user.firstName} {user.lastName}</p>
                      <p className={cn("text-xs truncate", isDarkMode ? "text-white/50" : "text-amber-900/55")}>{user.email}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (onLogin) {
                        onLogin();
                      }
                    }}
                    className="w-full text-[#0b0f17] px-4 py-2.5 rounded-lg transition-all duration-300 font-medium flex items-center justify-center text-sm"
                    style={{
                      background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {t('dashboard')}
                  </button>
                  
                  <button
                    onClick={() => {
                      handleLogoutClick();
                    }}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-lg transition-all duration-300 font-medium flex items-center justify-center text-sm",
                      isDarkMode
                        ? "bg-rose-500/90 text-white hover:bg-rose-500"
                        : "bg-rose-500 text-white hover:bg-rose-600"
                    )}
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
                  className="mx-4 mt-2 px-5 py-2.5 rounded-lg transition-all duration-300 font-semibold text-sm text-[#0b0f17]"
                  style={{
                    background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                  }}
                >
                 <span>
                  {t('login') || 'Connexion'}
                 </span>
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>

    <ConfirmationModal
      isOpen={showLogoutConfirm}
      onClose={() => setShowLogoutConfirm(false)}
      onConfirm={handleLogoutConfirm}
      title="Se déconnecter ?"
      message="Vous allez être déconnecté de votre compte. Voulez-vous continuer ?"
      confirmText="Se déconnecter"
      cancelText="Annuler"
      type="warning"
      isLoading={isLoggingOut}
    />
    </>
  );
};

export default Header;
