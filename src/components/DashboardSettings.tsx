import React, { useState } from 'react';
import { Settings, Languages, Bell, Shield, User, Save, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from './LanguageSelector';


interface DashboardSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}


const DashboardSettings = ({ isOpen, onClose }: DashboardSettingsProps) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('general');

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: t('settings'), icon: Settings },
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
              <h3 className="text-lg font-extrabold tracking-tight text-white mb-4">
                {t('settings')}
              </h3>
              <div className="space-y-4">
                <div
                  className="flex items-center justify-between p-4 rounded-xl border transition-all duration-300"
                  style={{
                    background: 'linear-gradient(180deg, rgba(251,191,36,0.10) 0%, rgba(251,191,36,0.03) 100%)',
                    borderColor: 'rgba(251,191,36,0.2)',
                  }}
                >
                  <div>
                    <h4 className="font-bold text-white">Notifications par email</h4>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>Recevoir des notifications par email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 rounded-full peer transition-all duration-300"
                         style={{
                           background: 'rgba(255,255,255,0.06)',
                           border: '1px solid rgba(255,255,255,0.08)',
                         }}>
                      <div className="peer-checked:bg-gradient-to-r peer-checked:from-amber-400 peer-checked:to-amber-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md"></div>
                    </div>
                  </label>
                </div>
                
                <div
                  className="flex items-center justify-between p-4 rounded-xl border transition-all duration-300"
                  style={{
                    background: 'linear-gradient(180deg, rgba(168,85,247,0.10) 0%, rgba(168,85,247,0.03) 100%)',
                    borderColor: 'rgba(168,85,247,0.2)',
                  }}
                >
                  <div>
                    <h4 className="font-bold text-white">Sauvegarde automatique</h4>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>Sauvegarder automatiquement les modifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 rounded-full peer transition-all duration-300"
                         style={{
                           background: 'rgba(255,255,255,0.06)',
                           border: '1px solid rgba(255,255,255,0.08)',
                         }}>
                      <div className="peer-checked:bg-gradient-to-r peer-checked:from-purple-400 peer-checked:to-indigo-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md"></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'language':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-extrabold tracking-tight text-white mb-4">
                {t('language')}
              </h3>
              <div className="space-y-4">
                <div
                  className="flex items-center justify-between p-4 rounded-xl border transition-all duration-300"
                  style={{
                    background: 'linear-gradient(180deg, rgba(251,191,36,0.10) 0%, rgba(251,191,36,0.03) 100%)',
                    borderColor: 'rgba(251,191,36,0.2)',
                  }}
                >
                  <div className="flex items-center">
                    <Languages className="h-5 w-5 mr-3" style={{ color: '#fcd34d' }} />
                    <div>
                      <h4 className="font-bold text-white">Langue de l'interface</h4>
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>Choisissez votre langue préférée</p>
                    </div>
                  </div>
                  <LanguageSelector />
                </div>
                
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    background: 'linear-gradient(180deg, rgba(168,85,247,0.10) 0%, rgba(168,85,247,0.03) 100%)',
                    borderColor: 'rgba(168,85,247,0.2)',
                  }}
                >
                  <div className="flex items-center mb-2">
                    <Languages className="h-4 w-4 mr-2" style={{ color: '#c084fc' }} />
                    <h4 className="font-bold" style={{ color: '#e9d5ff' }}>Langues disponibles</h4>
                  </div>
                  <ul className="text-sm space-y-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
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
              <h3 className="text-lg font-extrabold tracking-tight text-white mb-4">
                {t('notifications')}
              </h3>
              <div className="space-y-4">
                {[
                  { title: 'Nouvelles confirmations', desc: 'Quand un invité confirme sa présence' },
                  { title: 'Messages des invités', desc: 'Nouveaux messages dans le livre d\'or' },
                  { title: 'Rappels d\'événement', desc: 'Rappels avant vos événements' },
                  { title: 'Mises à jour système', desc: 'Nouvelles fonctionnalités et améliorations' }
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl border transition-all duration-300"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                      borderColor: 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <div>
                      <h4 className="font-bold text-white">{item.title}</h4>
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={index < 2} />
                      <div className="w-11 h-6 rounded-full peer transition-all duration-300"
                           style={{
                             background: 'rgba(255,255,255,0.06)',
                             border: '1px solid rgba(255,255,255,0.08)',
                           }}>
                        <div className="peer-checked:bg-gradient-to-r peer-checked:from-amber-400 peer-checked:to-amber-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md"></div>
                      </div>
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
              <h3 className="text-lg font-extrabold tracking-tight text-white mb-4">
                {t('privacy')}
              </h3>
              <div className="space-y-4">
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    background: 'linear-gradient(180deg, rgba(16,185,129,0.10) 0%, rgba(16,185,129,0.03) 100%)',
                    borderColor: 'rgba(16,185,129,0.22)',
                  }}
                >
                  <div className="flex items-center mb-2">
                    <Shield className="h-4 w-4 mr-2" style={{ color: '#34d399' }} />
                    <h4 className="font-bold" style={{ color: '#a7f3d0' }}>Confidentialité des données</h4>
                  </div>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    Vos données sont chiffrées et sécurisées. Nous ne partageons jamais vos informations personnelles.
                  </p>
                </div>
                
                <div className="space-y-3">
                  {[
                    { title: 'Profil public', desc: 'Permettre aux autres de voir votre profil' },
                    { title: 'Partage d\'événements', desc: 'Autoriser le partage de vos événements' },
                    { title: 'Cookies analytiques', desc: 'Améliorer l\'expérience utilisateur' }
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-xl border transition-all duration-300"
                      style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                        borderColor: 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <div>
                        <h4 className="font-bold text-white">{item.title}</h4>
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked={index === 2} />
                        <div className="w-11 h-6 rounded-full peer transition-all duration-300"
                             style={{
                               background: 'rgba(255,255,255,0.06)',
                               border: '1px solid rgba(255,255,255,0.08)',
                             }}>
                          <div className="peer-checked:bg-gradient-to-r peer-checked:from-emerald-400 peer-checked:to-teal-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md"></div>
                        </div>
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
              <h3 className="text-lg font-extrabold tracking-tight text-white mb-4">
                {t('account')}
              </h3>
              <div className="space-y-4">
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    background: 'linear-gradient(180deg, rgba(236,72,153,0.10) 0%, rgba(236,72,153,0.03) 100%)',
                    borderColor: 'rgba(236,72,153,0.22)',
                  }}
                >
                  <div className="flex items-center mb-2">
                    <User className="h-4 w-4 mr-2" style={{ color: '#f9a8d4' }} />
                    <h4 className="font-bold" style={{ color: '#fbcfe8' }}>Gestion du compte</h4>
                  </div>
                  <div className="space-y-3">
                    <div
                      className="p-4 rounded-lg border"
                      style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                        borderColor: 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#fcd34d' }} />
                        <div>
                          <div className="font-bold text-white mb-1">
                            Changer le mot de passe
                          </div>
                          <div className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                            Pour modifier votre mot de passe, veuillez contacter l'administrateur de la plateforme. Il vous accompagnera dans la procédure de réinitialisation sécurisée.
                          </div>
                        </div>
                      </div>
                    </div>
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
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fade-in"
         style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <div
        className="relative max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-2xl border animate-slide-up"
        style={{
          background: 'linear-gradient(180deg, #111727 0%, #0b0f17 100%)',
          borderColor: 'rgba(255,255,255,0.08)',
          boxShadow: '0 60px 140px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(251,191,36,0.05) inset',
        }}
      >
        <div
          aria-hidden
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[85%] h-56 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.18) 0%, transparent 70%)' }}
        />
        {/* Header */}
        <div
          className="relative z-10 p-6 border-b"
          style={{
            borderColor: 'rgba(255,255,255,0.06)',
            background: 'linear-gradient(180deg, rgba(251,191,36,0.08) 0%, rgba(255,255,255,0.01) 100%)',
          }}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div
                className="relative mr-3 p-2.5 rounded-xl"
                style={{
                  background: 'linear-gradient(180deg, rgba(251,191,36,0.3) 0%, rgba(251,191,36,0.12) 100%)',
                  border: '1px solid rgba(251,191,36,0.35)',
                  boxShadow: '0 0 28px -8px rgba(251,191,36,0.5)',
                }}
              >
                <Settings className="h-6 w-6" style={{ color: '#fcd34d' }} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-white">
                  {t('settings')}
                </h2>
                <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Personnalisez votre expérience
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl transition-all duration-200 hover:scale-110"
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
        </div>

        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div
            className="w-64 border-r p-4"
            style={{
              borderColor: 'rgba(255,255,255,0.06)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            }}
          >
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="w-full flex items-center px-3 py-3 rounded-xl transition-all duration-300 text-sm transform"
                    style={{
                      background: isActive
                        ? 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)'
                        : 'transparent',
                      color: isActive ? '#0b0f17' : 'rgba(255,255,255,0.7)',
                      fontWeight: isActive ? 800 : 600,
                      boxShadow: isActive
                        ? '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 14px 32px -10px rgba(251,191,36,0.6)'
                        : 'none',
                      scale: isActive ? '1.02' : '1',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(251,191,36,0.10)';
                        e.currentTarget.style.color = '#fcd34d';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                      }
                    }}
                  >
                    <IconComponent className="h-4 w-4 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto relative z-10">
            {renderTabContent()}
          </div>
        </div>

        {/* Footer */}
        <div
          className="relative z-10 p-6 border-t"
          style={{
            borderColor: 'rgba(255,255,255,0.06)',
            background: 'linear-gradient(0deg, rgba(251,191,36,0.06) 0%, rgba(255,255,255,0.01) 100%)',
          }}
        >
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl transition-all duration-200 font-bold text-sm transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              {t('cancel')}
            </button>
            <button
              onClick={() => {
                alert('Paramètres sauvegardés !');
                onClose();
              }}
              className="px-4 py-2 rounded-xl transition-all duration-300 font-bold text-sm transform hover:scale-[1.02] active:scale-[0.98] flex items-center"
              style={{
                background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                color: '#0b0f17',
                boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 14px 32px -10px rgba(251,191,36,0.6)',
              }}
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
