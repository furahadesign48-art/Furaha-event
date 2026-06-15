import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
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
            <div className="flex space-x-4">
              <div className="flex items-center text-gray-300 dark:text-gray-400">
                <div className="relative mr-2">
                  <Mail className="h-5 w-5 text-amber-500 drop-shadow-sm" />
                  <div className="absolute inset-0 animate-pulse">
                    <Mail className="h-5 w-5 text-amber-300 opacity-20" />
                  </div>
                </div>
                <span>contact@furaha-event.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 bg-gradient-to-r from-amber-500 to-amber-400 dark:from-amber-400 dark:to-amber-300 bg-clip-text text-transparent">{t('quick_links') || 'Liens rapides'}</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-300 dark:text-gray-400 hover:text-amber-400 dark:hover:text-amber-300 transition-all duration-300 relative group">
                  {t('about') || 'À propos'}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-400 group-hover:w-full transition-all duration-300"></span>
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 dark:text-gray-400 hover:text-amber-400 dark:hover:text-amber-300 transition-all duration-300 relative group">
                  {t('contact') || 'Contact'}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-400 group-hover:w-full transition-all duration-300"></span>
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 dark:text-gray-400 hover:text-amber-400 dark:hover:text-amber-300 transition-all duration-300 relative group">
                  {t('privacy_policy') || 'Politique de confidentialité'}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-400 group-hover:w-full transition-all duration-300"></span>
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 dark:text-gray-400 hover:text-amber-400 dark:hover:text-amber-300 transition-all duration-300 relative group">
                  {t('terms_of_service') || 'Conditions d\'utilisation'}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-400 group-hover:w-full transition-all duration-300"></span>
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-6 bg-gradient-to-r from-amber-500 to-rose-400 dark:from-amber-400 dark:to-rose-300 bg-clip-text text-transparent">{t('support') || 'Support'}</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-300 dark:text-gray-400 hover:text-rose-400 dark:hover:text-rose-300 transition-all duration-300 relative group">
                  {t('help_center') || 'Centre d\'aide'}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-rose-500 to-amber-400 group-hover:w-full transition-all duration-300"></span>
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 dark:text-gray-400 hover:text-rose-400 dark:hover:text-rose-300 transition-all duration-300 relative group">
                  {t('guides') || 'Guides'}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-rose-500 to-amber-400 group-hover:w-full transition-all duration-300"></span>
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 dark:text-gray-400 hover:text-rose-400 dark:hover:text-rose-300 transition-all duration-300 relative group">
                  {t('tutorials') || 'Tutoriels'}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-rose-500 to-amber-400 group-hover:w-full transition-all duration-300"></span>
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 dark:text-gray-400 hover:text-rose-400 dark:hover:text-rose-300 transition-all duration-300 relative group">
                  {t('faq') || 'FAQ'}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-rose-500 to-amber-400 group-hover:w-full transition-all duration-300"></span>
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
