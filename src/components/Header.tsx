import React, { useState } from 'react';
import { Menu, X, Crown, User, LogOut, Settings } from 'lucide-react';
import furahaLogo from '../images/FURAHA-GOLD.png';
import { useAuth } from './AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '../contexts/LanguageContext';
import ConfirmationModal from './ConfirmationModal';


interface HeaderProps {
  onLogin?: () => void;
}

const Header = ({ onLogin }: HeaderProps) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { subscription, getRemainingInvites } = useSubscription();
  const { t } = useLanguage();
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
<header className="fixed top-0 left-0 right-0 bg-[#0b0f17]/80 backdrop-blur-xl border-b border-white/5 z-50 animate-fade-in">
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
                backgroundImage: 'linear-gradient(135deg,#ffffff 0%, #fde68a 50%, #fbbf24 100%)',
              }}
        >
          Furaha-Event
        </span>
        </div>


          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-7">
            <a href="/" className="text-white/70 hover:text-amber-300 transition-all duration-300 text-sm font-medium">
              {t('home') || 'Accueil'}
            </a>
            <a href="#services" className="text-white/70 hover:text-amber-300 transition-all duration-300 text-sm font-medium">
              {t('templates') || 'Modèles'}
            </a>
            <a href="#features" className="text-white/70 hover:text-amber-300 transition-all duration-300 text-sm font-medium">
              {t('features') || 'Fonctionnalités'}
            </a>
            
            {/* Sélecteur de langue */}
            <LanguageSelector />
            
            {/* Bouton de connexion ou menu utilisateur */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all duration-300 font-medium text-sm"
                  style={{
                    border: '1px solid rgba(251,191,36,0.35)',
                    background:
                      'linear-gradient(180deg, rgba(251,191,36,0.14), rgba(251,191,36,0.04))',
                    color: '#fde68a',
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
                         background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
                         border: '1px solid rgba(255,255,255,0.08)',
                         boxShadow: '0 20px 60px -20px rgba(0,0,0,0.8)',
                       }}
                  >
                    <div className="px-4 py-3 border-b border-white/5">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                             style={{ background: 'linear-gradient(145deg,#f59e0b,#d946ef)' }}
                        >
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-white/50">{user.email}</p>
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
                        className="w-full flex items-center px-4 py-2 text-white/80 hover:bg-white/5 hover:text-amber-300 transition-all duration-200 text-sm"
                      >
                        <User className="h-4 w-4 mr-3" />
                        {t('dashboard')}
                      </button>
                      
                      <hr className="my-2 border-white/5" />
                      
                      <button
                        onClick={() => {
                          console.log('Clic sur Se déconnecter');
                          handleLogoutClick();
                        }}
                        className="w-full flex items-center px-4 py-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200 text-sm"
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
                  boxShadow:
                    '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 8px 24px -8px rgba(251,191,36,0.5)',
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
            className="md:hidden p-2 rounded-md hover:bg-white/5 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5 text-white" />
            ) : (
              <Menu className="h-5 w-5 text-white" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 animate-slide-up"
               style={{
                 background: 'rgba(11,15,23,0.98)',
                 borderTop: '1px solid rgba(255,255,255,0.06)',
                 backdropFilter: 'blur(20px)',
               }}
          >
            <nav className="flex flex-col space-y-1">
              <a href="#" className="text-white/80 hover:text-amber-300 hover:bg-white/5 transition-colors duration-300 font-medium px-4 py-2.5 rounded-md text-sm">
                {t('home') || 'Accueil'}
              </a>
              <a href="#services" className="text-white/80 hover:text-amber-300 hover:bg-white/5 transition-colors duration-300 font-medium px-4 py-2.5 rounded-md text-sm">
                {t('templates') || 'Modèles'}
              </a>
              <a href="#features" className="text-white/80 hover:text-amber-300 hover:bg-white/5 transition-colors duration-300 font-medium px-4 py-2.5 rounded-md text-sm">
                {t('features') || 'Fonctionnalités'}
              </a>
              
              {/* Sélecteur de langue mobile */}
              <div className="px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm font-medium">{t('language')}</span>
                  <LanguageSelector />
                </div>
              </div>
              
              {isAuthenticated && user ? (
                <div className="mx-4 mt-2 space-y-2">
                  <div className="flex items-center space-x-3 px-3 py-3 rounded-lg"
                       style={{
                         background: 'linear-gradient(180deg, rgba(251,191,36,0.12), rgba(251,191,36,0.04))',
                         border: '1px solid rgba(251,191,36,0.18)',
                       }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                         style={{ background: 'linear-gradient(145deg,#f59e0b,#d946ef)' }}
                    >
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-white/50 truncate">{user.email}</p>
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
                    className="w-full bg-rose-500/90 text-white px-4 py-2.5 rounded-lg hover:bg-rose-500 transition-all duration-300 font-medium flex items-center justify-center text-sm"
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
