import React, { useState } from 'react';
import { Settings, Sun, Moon, Languages, Bell, Shield, User, Save, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';
import { getAuth, sendPasswordResetEmail } from "firebase/auth";


interface DashboardSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const handlePasswordReset = async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user?.email) {
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert("📩 Un email de réinitialisation a été envoyé à " + user.email);
    } catch (error: any) {
      console.error("Erreur reset password:", error);
      alert("⚠️ Impossible d’envoyer l’email : " + error.message);
    }
  } else {
    alert("⚠️ Aucun email associé à ce compte.");
  }
};


const DashboardSettings = ({ isOpen, onClose }: DashboardSettingsProps) => {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('general');

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: t('settings'), icon: Settings },
    { id: 'appearance', label: t('theme'), icon: isDarkMode ? Moon : Sun },
    { id: 'language', label: t('language'), icon: Languages },
    { id: 'notifications', label: t('notifications'), icon: Bell },
    { id: 'privacy', label: t('privacy'), icon: Shield },
    { id: 'account', label: t('account'), icon: User }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                {t('settings')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-slate-700 dark:to-slate-600 rounded-xl border border-amber-200/50 dark:border-slate-600/50">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">Notifications par email</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Recevoir des notifications par email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-slate-700 dark:to-slate-600 rounded-xl border border-purple-200/50 dark:border-slate-600/50">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">Sauvegarde automatique</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Sauvegarder automatiquement les modifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                {t('theme')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-slate-700 dark:to-slate-600 rounded-xl border border-amber-200/50 dark:border-slate-600/50">
                  <div className="flex items-center">
                    {isDarkMode ? (
                      <Moon className="h-5 w-5 text-slate-600 dark:text-slate-300 mr-3" />
                    ) : (
                      <Sun className="h-5 w-5 text-amber-600 mr-3" />
                    )}
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">
                        {isDarkMode ? t('dark_mode') : t('light_mode')}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {isDarkMode ? 'Interface sombre pour les yeux' : 'Interface claire et lumineuse'}
                      </p>
                    </div>
                  </div>
                  <ThemeToggle />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white border-2 border-amber-200 rounded-xl cursor-pointer hover:border-amber-400 transition-all duration-300">
                    <div className="w-full h-20 bg-gradient-to-br from-neutral-50 to-amber-50 rounded-lg mb-3 border border-neutral-200"></div>
                    <p className="text-sm font-medium text-slate-900 text-center">{t('light_mode')}</p>
                  </div>
                  
                  <div className="p-4 bg-slate-800 border-2 border-slate-600 rounded-xl cursor-pointer hover:border-slate-400 transition-all duration-300">
                    <div className="w-full h-20 bg-gradient-to-br from-slate-700 to-slate-600 rounded-lg mb-3 border border-slate-600"></div>
                    <p className="text-sm font-medium text-slate-100 text-center">{t('dark_mode')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'language':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                {t('language')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-slate-700 dark:to-slate-600 rounded-xl border border-amber-200/50 dark:border-slate-600/50">
                  <div className="flex items-center">
                    <Languages className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-3" />
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">Langue de l'interface</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Choisissez votre langue préférée</p>
                    </div>
                  </div>
                  <LanguageSelector />
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-slate-700 dark:to-slate-600 rounded-xl p-4 border border-purple-200/50 dark:border-slate-600/50">
                  <div className="flex items-center mb-2">
                    <Languages className="h-4 w-4 text-purple-600 dark:text-purple-400 mr-2" />
                    <h4 className="font-medium text-purple-800 dark:text-purple-300">Langues disponibles</h4>
                  </div>
                  <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                    <li>🇫🇷 Français</li>
                    <li>🇺🇸 English</li>
                    <li>🇪🇸 Español</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                {t('notifications')}
              </h3>
              <div className="space-y-4">
                {[
                  { title: 'Nouvelles confirmations', desc: 'Quand un invité confirme sa présence' },
                  { title: 'Messages des invités', desc: 'Nouveaux messages dans le livre d\'or' },
                  { title: 'Rappels d\'événement', desc: 'Rappels avant vos événements' },
                  { title: 'Mises à jour système', desc: 'Nouvelles fonctionnalités et améliorations' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-neutral-50 to-amber-50 dark:from-slate-700 dark:to-slate-600 rounded-xl border border-neutral-200/50 dark:border-slate-600/50">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">{item.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={index < 2} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                {t('privacy')}
              </h3>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-slate-700 dark:to-slate-600 rounded-xl p-4 border border-emerald-200/50 dark:border-slate-600/50">
                  <div className="flex items-center mb-2">
                    <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mr-2" />
                    <h4 className="font-medium text-emerald-800 dark:text-emerald-300">Confidentialité des données</h4>
                  </div>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    Vos données sont chiffrées et sécurisées. Nous ne partageons jamais vos informations personnelles.
                  </p>
                </div>
                
                <div className="space-y-3">
                  {[
                    { title: 'Profil public', desc: 'Permettre aux autres de voir votre profil' },
                    { title: 'Partage d\'événements', desc: 'Autoriser le partage de vos événements' },
                    { title: 'Cookies analytiques', desc: 'Améliorer l\'expérience utilisateur' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-neutral-50 to-amber-50 dark:from-slate-700 dark:to-slate-600 rounded-xl border border-neutral-200/50 dark:border-slate-600/50">
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">{item.title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked={index === 2} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'account':
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          {t('account')}
        </h3>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-rose-50 to-rose-100 dark:from-slate-700 dark:to-slate-600 rounded-xl p-4 border border-rose-200/50 dark:border-slate-600/50">
            <div className="flex items-center mb-2">
              <User className="h-4 w-4 text-rose-600 dark:text-rose-400 mr-2" />
              <h4 className="font-medium text-rose-800 dark:text-rose-300">Gestion du compte</h4>
            </div>
            <div className="space-y-3">
              <button
                onClick={handlePasswordReset}
                className="w-full text-left p-3 bg-white dark:bg-slate-800 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-700 transition-all duration-200 border border-rose-200/50 dark:border-slate-600/50"
              >
                <div className="font-medium text-slate-900 dark:text-slate-100">
                  Changer le mot de passe
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Recevez un lien par email pour modifier votre mot de passe
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );


      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-luxury max-w-4xl w-full max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200/50 dark:border-slate-600/50 bg-gradient-to-r from-neutral-50 to-amber-50/30 dark:from-slate-700 dark:to-slate-600">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="relative mr-3">
                <Settings className="h-6 w-6 text-amber-500 animate-glow drop-shadow-lg" />
                <div className="absolute inset-0 animate-pulse">
                  <Settings className="h-6 w-6 text-amber-300 opacity-30" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  {t('settings')}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Personnalisez votre expérience
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200"
            >
              <X className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
            </button>
          </div>
        </div>

        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-64 bg-gradient-to-b from-neutral-50 to-amber-50/30 dark:from-slate-700 dark:to-slate-600 border-r border-neutral-200/50 dark:border-slate-600/50 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-3 rounded-xl transition-all duration-300 text-sm ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-glow-amber transform scale-105'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-600 hover:text-amber-700 dark:hover:text-amber-400'
                    }`}
                  >
                    <IconComponent className="h-4 w-4 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {renderTabContent()}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-200/50 dark:border-slate-600/50 bg-gradient-to-r from-neutral-50 to-amber-50/30 dark:from-slate-700 dark:to-slate-600">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-neutral-300 dark:border-slate-600 text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-50 dark:hover:bg-slate-700 transition-all duration-200 font-medium"
            >
              {t('cancel')}
            </button>
            <button
              onClick={() => {
                // Sauvegarder les paramètres
                alert('Paramètres sauvegardés !');
                onClose();
              }}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 font-medium shadow-glow-amber transform hover:scale-105 flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSettings;