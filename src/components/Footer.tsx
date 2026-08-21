import React from 'react';
import { Mail, Phone, MapPin, Facebook } from 'lucide-react';
import furahaLogo from '../images/FURAHA-GOLD.png';
import { useLanguage } from '../contexts/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-neutral-50 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-20 w-32 h-32 bg-gradient-to-r from-amber-500/10 to-purple-500/10 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-28 h-28 bg-gradient-to-r from-rose-500/10 to-amber-500/10 rounded-full blur-2xl animate-bounce-slow"></div>
      </div>
      
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="relative">
                <img src={furahaLogo} alt="Furaha Event Logo" className="h-10 w-10 object-contain drop-shadow-lg animate-glow" />
                <div className="absolute inset-0 animate-pulse">
                  <img src={furahaLogo} alt="Furaha Event Logo pulse" className="h-10 w-10 object-contain opacity-30" />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-neutral-50 via-amber-200 to-neutral-50 bg-clip-text text-transparent">
                Furaha-Event
              </span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md leading-relaxed backdrop-blur-sm bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
              {t('footer_description') || 'Créez des invitations digitales exceptionnelles qui marquent les esprits. Votre événement mérite une invitation à la hauteur de son importance.'}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="mailto:furahadesign48@gmail.com"
                className="flex items-center text-gray-300 dark:text-gray-400 hover:text-amber-300 transition-colors duration-300"
              >
                <div className="relative mr-2">
                  <Mail className="h-5 w-5 text-amber-500 drop-shadow-sm" />
                  <div className="absolute inset-0 animate-pulse">
                    <Mail className="h-5 w-5 text-amber-300 opacity-20" />
                  </div>
                </div>
                <span>furahadesign48@gmail.com</span>
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61580901819765&locale=fr_FR"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 hover:scale-110"
                style={{
                  background: 'linear-gradient(180deg, rgba(59,130,246,0.18), rgba(59,130,246,0.06))',
                  border: '1px solid rgba(59,130,246,0.35)',
                  boxShadow: '0 10px 24px -12px rgba(59,130,246,0.55)',
                }}
                aria-label="Facebook Furaha-Event"
              >
                <Facebook className="h-5 w-5" style={{ color: '#93c5fd' }} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 bg-gradient-to-r from-amber-500 to-amber-400 dark:from-amber-400 dark:to-amber-300 bg-clip-text text-transparent">{t('quick_links') || 'Liens rapides'}</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://wa.me/243844333917"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 dark:text-gray-400 hover:text-amber-400 dark:hover:text-amber-300 transition-all duration-300 relative group"
                >
                  {t('contact') || 'Contact'}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-400 group-hover:w-full transition-all duration-300"></span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.furaha-digital.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 dark:text-gray-400 hover:text-amber-400 dark:hover:text-amber-300 transition-all duration-300 relative group"
                >
                  Autres Services
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-400 group-hover:w-full transition-all duration-300"></span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gradient-to-r from-gray-800 via-amber-800/30 to-gray-800 dark:from-gray-900 dark:via-amber-900/30 dark:to-gray-900 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-4 md:mb-0">
              {t('copyright') || '© 2025 Furaha-Event. Tous droits réservés.'}
            </p>
            
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-amber-400 dark:hover:text-amber-300 transition-all duration-300 text-sm relative group">
                {t('legal_notice') || 'Mentions légales'}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-amber-400 dark:hover:text-amber-300 transition-all duration-300 text-sm relative group">
                {t('cookies') || 'Cookies'}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-amber-400 dark:hover:text-amber-300 transition-all duration-300 text-sm relative group">
                {t('accessibility') || 'Accessibilité'}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300"></span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
