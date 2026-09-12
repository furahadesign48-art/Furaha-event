import React, { useState, useEffect } from 'react';
import { Heart, Calendar, MapPin, Users, Wine, Camera, MessageCircle, QrCode, ArrowLeft, Check, Sparkles, User, Bell, LayoutDashboard, Volume2, VolumeX, Gamepad2, Trophy, Clock, Gift, Music2, Download, BookOpen, Star, ChevronRight, Eye, Palette, Shield } from 'lucide-react';
import AuthModal from './AuthModal';
import ToastModal from './ToastModal';
import AdminPasswordModal from './AdminPasswordModal';
import { useTemplates } from '../hooks/useTemplates';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';
import InvitationPreview from './InvitationPreview';
import type { UserModel } from '../services/templateService';

interface WeddingTemplateProps {
  onBack: () => void;
  onSelectTemplate: (templateData: unknown) => void;
  isAuthenticated?: boolean;
}

const WeddingTemplate = ({ onBack, onSelectTemplate, isAuthenticated }: WeddingTemplateProps) => {
  const { isDarkMode } = useTheme();
  const { createUserTemplate, isLoading, userModels } = useTemplates();
  const { permission, requestPermission, isLoading: isNotificationLoading } = useNotifications();
  const { user } = useAuth();
  const [selectedDrink, setSelectedDrink] = useState('');
  const [showToastModal, setShowToastModal] = useState(false);
  const [guestMessage, setGuestMessage] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showQRInfo, setShowQRInfo] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<'default' | 'book'>('default');
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [pendingLayout, setPendingLayout] = useState<'default' | 'book'>('default');

  // SÉCURITÉ : Empêcher toute nouvelle création de template si l'utilisateur en a déjà un
  // Évite la réinitialisation accidentelle de designs déjà personnalisés.
  const hasExistingTemplate = isAuthenticated && Array.isArray(userModels) && userModels.length > 0;
  const isCurrentUserAdmin = user?.role === 'admin';

  // Pré-charger le layout depuis le modèle existant
  useEffect(() => {
    if (hasExistingTemplate && userModels && userModels.length > 0) {
      const existingLayout = (userModels[0] as any)?.customizations?.layout;
      if (existingLayout === 'book' || existingLayout === 'default') {
        setSelectedLayout(existingLayout);
      }
    }
  }, [hasExistingTemplate, userModels]);

  const handleLayoutCardClick = (targetLayout: 'default' | 'book') => {
    if (!hasExistingTemplate) {
      setSelectedLayout(targetLayout);
      return;
    }
    if (targetLayout === selectedLayout) {
      return;
    }
    if (isCurrentUserAdmin) {
      setSelectedLayout(targetLayout);
      return;
    }
    setPendingLayout(targetLayout);
    setShowAdminPasswordModal(true);
  };

  const handleAdminPasswordSuccess = () => {
    setSelectedLayout(pendingLayout);
    setShowAdminPasswordModal(false);
  };

  const templateData = {
    id: 'wedding-gold-premium',
    name: 'Mariage Gold Premium',
    category: 'wedding',
    backgroundImage: '/model4.jpg',
    title: 'Mariage de Sophie & Lucas',
    invitationText: 'Nous avons l\'honneur de vous inviter à célébrer notre union dans la joie et l\'amour. Votre présence sera le plus beau des cadeaux pour ce jour si spécial.',
    eventDate: '15 Juin 2024',
    eventTime: '16h00',
    eventLocation: 'Château de Versailles, Versailles',
    eventAddress: 'Place d\'Armes, 78000 Versailles',
    drinkOptions: ['Champagne', 'Vin Rouge', 'Vin Blanc', 'Cocktail Sans Alcool', 'Eau', 'Whisky'],
    features: [
      'Compte à rebours J- animé + photo couple bordure dorée',
      'Galerie 3D Parallax & cartes date effet shine',
      'Maps interactif + RSVP bouton lumineux Shiny',
      'Carte boissons multichoix avec bordure rotative',
      'Livre d\'or moderne + jeux interactifs (Quiz, Memory...)',
      'QR Code invité unique téléchargeable',
      'Musique de fond + notifications push rappel jour J',
      'Navigation sticky + mode offline automatique'
    ]
  };

  const handleConfirmation = () => {
    setIsConfirmed(!isConfirmed);
  };

  const handleSelectTemplate = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    // SÉCURITÉ : Bloquer la re-création si un template existe déjà.
    // Appeler onSelectTemplate directement permet de repartir vers le Dashboard existant.
    if (hasExistingTemplate) {
      const existingCust = (userModels[0] as any)?.customizations || { layout: selectedLayout };
      const existingColors = (userModels[0] as any)?.colors || existingCust.colors || templateData.colors;
      onSelectTemplate({
        ...templateData,
        id: userModels[0].id,
        isPersonalized: true,
        colors: existingColors,
        customizations: existingCust,
        ...(userModels[0] as any)
      });
      return;
    }
    
    try {
      // Créer une copie du template dans Firestore
      const userTemplateId = await createUserTemplate(templateData, {
        guestData: {
          name: '[Nom de l\'invité]',
          tableNumber: '[Numéro de table]',
          qrCode: `WED-${Date.now()}`,
          confirmation: 'pending',
          selectedDrink: '',
          message: ''
        },
        customizations: {
          layout: selectedLayout,
          colors: templateData.colors || {
            primary: '#f59e0b',
            secondary: '#d97706',
            accent: '#f43f5e'
          },
          fonts: {
            title: 'Playfair Display',
            body: 'Inter'
          }
        }
      });

      if (userTemplateId) {
        // Créer l'objet pour le callback avec l'ID du nouveau template ET customizations
        const personalizedTemplate = {
          ...templateData,
          id: userTemplateId,
          isPersonalized: true,
          createdAt: new Date().toISOString(),
          guestData: {
            name: '[Nom de l\'invité]',
            tableNumber: '[Numéro de table]'
          },
          customizations: {
            layout: selectedLayout,
            colors: templateData.colors || {
              primary: '#f59e0b',
              secondary: '#d97706',
              accent: '#f43f5e'
            },
            fonts: {
              title: 'Playfair Display',
              body: 'Inter'
            }
          },
          colors: templateData.colors
        };
        
        onSelectTemplate(personalizedTemplate);
      } else {
        alert('Erreur lors de la création du modèle personnalisé');
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du template:', error);
      alert('Erreur lors de la création de votre modèle personnalisé');
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };
  return (
    <div className={cn(
      "min-h-screen relative overflow-hidden transition-colors duration-500",
      isDarkMode ? 'bg-[#0b0f17]' : 'bg-gradient-to-b from-[#fffaf0] via-white to-[#fff7ed]'
    )}>
      {/* Subtle dot grid pattern — identique à la page d'accueil */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: isDarkMode
            ? 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)'
            : 'radial-gradient(circle at 1px 1px, #78350f 1px, transparent 0)',
          backgroundSize: '26px 26px',
        }}
      />
      {/* Ambient glows larges — identiques style Services/WhyChoose */}
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 right-0 w-[620px] h-[620px] translate-x-1/3 rounded-full blur-3xl"
             style={{
               background: isDarkMode
                 ? 'radial-gradient(closest-side, rgba(251,191,36,0.26), rgba(251,191,36,0) 70%)'
                 : 'radial-gradient(closest-side, rgba(251,191,36,0.22), rgba(251,191,36,0) 70%)',
             }}
        />
        <div className="absolute bottom-24 left-0 w-[580px] h-[580px] -translate-x-1/3 rounded-full blur-3xl"
             style={{
               background: isDarkMode
                 ? 'radial-gradient(closest-side, rgba(217,70,239,0.18), rgba(217,70,239,0) 70%)'
                 : 'radial-gradient(closest-side, rgba(244,114,182,0.14), rgba(244,114,182,0) 70%)',
             }}
        />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full blur-3xl opacity-60 animate-float"
             style={{
               background: isDarkMode
                 ? 'radial-gradient(closest-side, rgba(244,114,182,0.10), rgba(244,114,182,0) 70%)'
                 : 'radial-gradient(closest-side, rgba(244,114,182,0.08), rgba(244,114,182,0) 70%)',
             }}
        />
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className={cn(
                "flex items-center transition-all duration-300 group",
                isDarkMode
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-amber-700 hover:text-amber-600'
              )}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="text-sm">Retour</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold" style={{
                color: isDarkMode ? '#fcd34d' : '#b45309',
                textShadow: isDarkMode ? '0 2px 12px rgba(252,211,77,0.25)' : 'none'
              }}>
                Mariage Gold Premium
                <span className="ml-2 px-2 py-0.5 rounded align-middle text-[10px] font-black uppercase tracking-wider"
                      style={{
                        background: selectedLayout === 'book'
                          ? 'linear-gradient(145deg, #fbbf24, #b45309)'
                          : isDarkMode
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(180,83,9,0.08)',
                        color: selectedLayout === 'book'
                          ? '#0b0f17'
                          : isDarkMode
                          ? 'rgba(255,255,255,0.6)'
                          : 'rgba(180,83,9,0.7)',
                        border: selectedLayout === 'book'
                          ? 'none'
                          : isDarkMode
                          ? '1px solid rgba(255,255,255,0.1)'
                          : '1px solid rgba(180,83,9,0.15)'
                      }}>
                  {selectedLayout === 'book' ? 'Livre' : 'Scroll'}
                </span>
              </h1>
              <p className={cn("mt-1 text-sm transition-colors duration-500",
                isDarkMode ? 'text-neutral-400' : 'text-amber-900/65'
              )}>
                {selectedLayout === 'book' ? 'Expérience Format Livre · Design immersif' : 'Élégance &amp; romantisme pour votre jour J'}
              </p>
            </div>

            <button
              onClick={() => setShowPreview(!showPreview)}
              className={cn(
                "flex items-center gap-1.5 transition-all duration-300 group text-sm",
                isDarkMode
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-amber-700 hover:text-amber-600'
              )}
            >
              <Eye className="h-4 w-4" />
              Aperçu
            </button>
          </div>
        </div>

        {/* Sélecteur de Layout */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex items-center gap-2 mb-4 justify-center">
            <div className="h-px w-12 sm:w-20" style={{ background: isDarkMode
              ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08))'
              : 'linear-gradient(90deg, transparent, rgba(180,83,9,0.18))'
            }}></div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
                 style={{
                   border: isDarkMode ? '1px solid rgba(251,191,36,0.25)' : '1px solid rgba(180,83,9,0.25)',
                   background: isDarkMode
                     ? 'linear-gradient(180deg, rgba(251,191,36,0.1), rgba(251,191,36,0.02))'
                     : 'linear-gradient(180deg, rgba(251,191,36,0.12), rgba(251,191,36,0.02))',
                 }}>
              <LayoutDashboard className="w-3.5 h-3.5" style={{ color: isDarkMode ? '#fbbf24' : '#b45309' }} />
              <span className="font-mono text-[11px] tracking-wide uppercase" style={{ color: isDarkMode ? '#fcd34d' : '#92400e' }}>
                Type d'invitation
              </span>
            </div>
            <div className="h-px w-12 sm:w-20" style={{ background: isDarkMode
              ? 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)'
              : 'linear-gradient(90deg, rgba(180,83,9,0.18), transparent)'
            }}></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {/* Carte 1 : Scroll Classique */}
            <button
              onClick={() => handleLayoutCardClick('default')}
              className={`relative p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 text-left group ${selectedLayout === 'default' ? 'scale-[1.01]' : 'opacity-80 hover:opacity-100'} ${hasExistingTemplate && selectedLayout !== 'default' ? 'hover:border-amber-400/40 cursor-pointer' : !hasExistingTemplate ? 'cursor-pointer' : 'cursor-default'}`}
              style={{
                background: selectedLayout === 'default'
                  ? isDarkMode ? 'rgba(251,191,36,0.10)' : 'rgba(251,191,36,0.12)'
                  : isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(180,83,9,0.04)',
                borderColor: selectedLayout === 'default'
                  ? 'rgba(251,191,36,0.6)'
                  : isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(180,83,9,0.10)',
                boxShadow: selectedLayout === 'default'
                  ? '0 10px 40px -15px rgba(251,191,36,0.35)'
                  : 'none'
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center shrink-0"
                       style={{
                         background: selectedLayout === 'default'
                           ? 'linear-gradient(145deg, rgba(251,191,36,0.3), rgba(251,191,36,0.08))'
                           : isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(180,83,9,0.06)',
                         border: selectedLayout === 'default'
                           ? '1px solid rgba(251,191,36,0.4)'
                           : isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(180,83,9,0.10)'
                       }}>
                    <Sparkles className="w-5 h-5" style={{
                      color: selectedLayout === 'default'
                        ? (isDarkMode ? '#fcd34d' : '#b45309')
                        : (isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(180,83,9,0.55)')
                    }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className={cn("text-sm sm:text-base font-bold leading-tight",
                      isDarkMode ? 'text-white' : 'text-amber-950'
                    )}>
                      Scroll Classique
                    </h3>
                    <p className={cn("text-[11px] sm:text-xs mt-0.5 leading-snug",
                      isDarkMode ? 'text-neutral-400' : 'text-amber-900/65'
                    )}>
                      Format scroll premium · 6 sections cinématiques
                    </p>
                  </div>
                </div>
                {selectedLayout === 'default' && (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0"
                       style={{ background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.5)' }}>
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: isDarkMode ? '#fcd34d' : '#92400e' }} />
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t" style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(180,83,9,0.10)' }}>
                <div className="flex flex-wrap gap-1.5">
                  {['Galeries 3D', 'RSVP lumineux', 'Jeux interactifs'].map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{
                            background: selectedLayout === 'default'
                              ? 'rgba(251,191,36,0.12)'
                              : isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(180,83,9,0.05)',
                            color: selectedLayout === 'default'
                              ? (isDarkMode ? '#fcd34d' : '#92400e')
                              : (isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(180,83,9,0.55)'),
                            border: selectedLayout === 'default'
                              ? '1px solid rgba(251,191,36,0.25)'
                              : isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(180,83,9,0.10)'
                          }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </button>

            {/* Carte 2 : Format Livre */}
            <button
              onClick={() => handleLayoutCardClick('book')}
              className={`relative p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 text-left group ${selectedLayout === 'book' ? 'scale-[1.01]' : 'opacity-80 hover:opacity-100'} ${hasExistingTemplate && selectedLayout !== 'book' ? 'hover:border-amber-400/40 cursor-pointer' : !hasExistingTemplate ? 'cursor-pointer' : 'cursor-default'}`}
              style={{
                background: selectedLayout === 'book'
                  ? isDarkMode ? 'rgba(251,191,36,0.10)' : 'rgba(251,191,36,0.12)'
                  : isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(180,83,9,0.04)',
                borderColor: selectedLayout === 'book'
                  ? 'rgba(251,191,36,0.6)'
                  : isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(180,83,9,0.10)',
                boxShadow: selectedLayout === 'book'
                  ? '0 10px 40px -15px rgba(251,191,36,0.35)'
                  : 'none'
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center shrink-0"
                       style={{
                         background: selectedLayout === 'book'
                           ? 'linear-gradient(145deg, rgba(251,191,36,0.3), rgba(251,191,36,0.08))'
                           : isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(180,83,9,0.06)',
                         border: selectedLayout === 'book'
                           ? '1px solid rgba(251,191,36,0.4)'
                           : isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(180,83,9,0.10)'
                       }}>
                    <BookOpen className="w-5 h-5" style={{
                      color: selectedLayout === 'book'
                        ? (isDarkMode ? '#fcd34d' : '#b45309')
                        : (isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(180,83,9,0.55)')
                    }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className={cn("text-sm sm:text-base font-bold leading-tight flex items-center gap-1.5",
                      isDarkMode ? 'text-white' : 'text-amber-950'
                    )}>
                      Format Livre
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider"
                            style={{
                              background: 'linear-gradient(145deg, #fbbf24, #b45309)',
                              color: '#0b0f17',
                              boxShadow: '0 2px 8px -2px rgba(251,191,36,0.5)'
                            }}>
                        Nouveau
                      </span>
                    </h3>
                    <p className={cn("text-[11px] sm:text-xs mt-0.5 leading-snug",
                      isDarkMode ? 'text-neutral-400' : 'text-amber-900/65'
                    )}>
                      Expérience page-turning · Design élégant &amp; immersif
                    </p>
                  </div>
                </div>
                {selectedLayout === 'book' && (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0"
                       style={{ background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.5)' }}>
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: isDarkMode ? '#fcd34d' : '#92400e' }} />
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t" style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(180,83,9,0.10)' }}>
                <div className="flex flex-wrap gap-1.5">
                  {['Pages tournantes', 'Effets livre', 'Focus Rail'].map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{
                            background: selectedLayout === 'book' ? 'rgba(251,191,36,0.12)' : (isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(180,83,9,0.05)'),
                            color: selectedLayout === 'book'
                              ? (isDarkMode ? '#fcd34d' : '#92400e')
                              : (isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(180,83,9,0.55)'),
                            border: selectedLayout === 'book' ? '1px solid rgba(251,191,36,0.25)' : (isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(180,83,9,0.10)')
                          }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          </div>

          {hasExistingTemplate && (
            <div className="mt-3 text-center">
              {isCurrentUserAdmin ? (
                <p className={cn("text-[11px] font-medium inline-flex items-center gap-1.5",
                  isDarkMode ? 'text-neutral-500' : 'text-amber-900/60'
                )}>
                  <Shield className="w-3.5 h-3.5" style={{ color: isDarkMode ? '#fcd34d' : '#b45309' }} />
                  ✅ <span style={{ color: isDarkMode ? '#fcd34d' : '#92400e', fontWeight: 700 }}>Compte administrateur</span> : changement de format autorisé sans code.
                </p>
              ) : (
                <p className={cn("text-[11px] font-medium inline-flex items-center gap-1.5",
                  isDarkMode ? 'text-neutral-500' : 'text-amber-900/60'
                )}>
                  <Shield className="w-3.5 h-3.5" style={{ color: isDarkMode ? '#fcd34d' : '#b45309' }} />
                  ℹ️ Un design existe déjà. Pour <span style={{ color: isDarkMode ? '#fcd34d' : '#92400e', fontWeight: 700 }}>changer de format</span>, cliquez sur l&apos;autre carte — un <span style={{ color: isDarkMode ? '#fcd34d' : '#92400e', fontWeight: 700 }}>code d&apos;autorisation</span> vous sera demandé.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Template Preview */}
            <div className="flex justify-center lg:justify-end pr-0 lg:pr-4 animate-slide-up">
              <div className="relative">
                {/* Strong Backlight Glows */}
                <div aria-hidden className="absolute -inset-20 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(252,211,77,0.22) 0%, rgba(252,211,77,0.08) 40%, transparent 70%)' }}></div>
                  <div className="absolute top-20 -left-6 w-[320px] h-[320px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.18) 0%, transparent 60%)' }}></div>
                  <div className="absolute bottom-16 -right-4 w-[340px] h-[340px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(217,70,239,0.15) 0%, transparent 60%)' }}></div>
                </div>
                {/* Phone Frame — identique style cartes accueil */}
                <div className="relative w-72 h-[620px] rounded-[2.5rem] p-5 overflow-hidden border group"
                  style={{
                    background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(251,191,36,0.05) inset',
                    transition: 'all 400ms cubic-bezier(0.22,1,0.36,1)',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(251,191,36,0.25)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  {/* Backlight GitHub-style sur le phone frame */}
                  <div aria-hidden className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[92%] h-[60%] pointer-events-none blur-3xl opacity-70"
                       style={{ background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.20) 0%, rgba(251,191,36,0.08) 38%, rgba(251,191,36,0) 70%)' }}></div>
                  <div aria-hidden className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[110%] h-28 pointer-events-none blur-3xl opacity-50"
                       style={{ background: 'radial-gradient(ellipse at center, rgba(244,114,182,0.10) 0%, rgba(244,114,182,0) 70%)' }}></div>
                  <div className="relative w-full h-full bg-gradient-to-br from-neutral-50 to-amber-50/30 rounded-[1.6rem] overflow-y-auto no-scrollbar shadow-inner z-10" style={{ scrollbarWidth: 'none' }}>
                    {/* Status Bar */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 h-5 flex items-center justify-between px-5 text-neutral-50 text-[10px]">
                      <span>9:41</span>
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: '#fcd34d', animationDelay: '0.3s' }}></div>
                        <div className="w-1 h-1 bg-rose-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                      </div>
                    </div>
                    
                    {/* Invitation Content - Reproduction fidèle InvitationPreview */}
                    {selectedLayout === 'default' ? (
                    <div className="h-full bg-slate-900 relative overflow-y-auto no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                      <style>{`
                        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                        @keyframes fall { 0% { transform: translateY(-20px); opacity: 0; } 100% { transform: translateY(100vh); opacity: 0.6; } }
                        @keyframes float-gentle { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
                        @keyframes border-rotate { 0% { --angle: 0deg; } 100% { --angle: 360deg; } }
                        @keyframes shine-sweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                        .animate-fall { animation: fall linear infinite; }
                        .animate-float-gentle { animation: float-gentle 3s ease-in-out infinite; }
                        .no-scrollbar::-webkit-scrollbar { display: none; }
                        .animate-shine-sweep { animation: shine-sweep 2s ease-in-out infinite; }
                      `}</style>

                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] pointer-events-none z-0"></div>

                      {/* ===== SECTION 1 : HEADER + MAIN (Photo + Infos invité + Carte texte blanche) ===== */}
                      <div className="relative w-full">
                        {/* Photo Header avec FallingDots */}
                        <div className="relative w-full h-[55vh] overflow-hidden">
                          <img
                            src={templateData.backgroundImage}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70"></div>
                        </div>

                        {/* Carte invité (Avatar + Nom + Table + Badge Couple) qui chevauche */}
                        <div className="relative z-10 w-full px-3 flex justify-center -mt-14 mb-4">
                          <div className="w-full max-w-[92%] bg-black/60 backdrop-blur-xl rounded-[28px] p-3 border-2 shadow-2xl relative" style={{ borderColor: 'rgba(245,158,11,0.8)' }}>
                            <div className="flex items-center space-x-3 w-full px-1">
                              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold border-2 border-white/20 shadow-lg flex-shrink-0" style={{ background: 'linear-gradient(to br, #f59e0b, #d946ef)' }}>
                                JS
                              </div>
                              <div className="flex flex-col min-w-0 flex-1">
                                <h2 className="text-base font-bold text-white truncate leading-tight">Jessica &amp; Samuel</h2>
                                <div className="flex items-center space-x-2 mt-0.5">
                                  <div className="flex items-center space-x-1 text-white/80">
                                    <Gift className="h-3 w-3" style={{ color: '#fbbf24' }} />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Table : Orchidée 07</p>
                                  </div>
                                  <div className="flex items-center space-x-1 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                                    <Heart className="h-2.5 w-2.5 text-rose-400 fill-rose-400" />
                                    <span className="text-[9px] font-black text-white uppercase tracking-tighter">Couple</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Carte texte blanche (ronde en haut) avec photo ronde + titre + texte + ornements */}
                        <div className="relative z-10 flex justify-center mt-10 px-3 w-full">
                          <div className="bg-white rounded-t-[100px] w-full max-w-md p-6 pt-20 text-center shadow-[0_10px_40px_rgba(0,0,0,0.1)] relative overflow-hidden">
                            {/* Fond papier ligné + petits coeurs */}
                            <div aria-hidden className="absolute inset-0 pointer-events-none z-0 rounded-t-[100px] overflow-hidden">
                              <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0 27px, rgba(236,72,153,0.07) 27px 28px)' }}></div>
                            </div>
                            <div className="space-y-4 relative z-10">
                              {/* Photo ronde avec bordure tournante */}
                              <div className="relative inline-block -mt-[90px] mb-2">
                                <div className="absolute inset-0 rounded-full blur-2xl" style={{ background: 'linear-gradient(to br, rgba(245,158,11,0.2), rgba(217,70,239,0.2))' }}></div>
                                <div className="relative rounded-full p-[2px]" style={{ background: 'conic-gradient(from 0deg, #f59e0b, #d946ef, #fbbf24, #f59e0b)' }}>
                                  <img
                                    src={templateData.backgroundImage}
                                    alt="Couple"
                                    className="w-32 h-32 rounded-full object-cover shadow-2xl bg-white"
                                  />
                                </div>
                              </div>

                              {/* Sous-titre + Titre */}
                              <p className="text-base font-bold" style={{ color: '#f59e0b' }}>💍 Le plus beau jour de nos vies 💍</p>
                              <h1 className="text-2xl font-luxury font-medium leading-tight" style={{ color: '#d946ef' }}>
                                {templateData.title}
                              </h1>
                              {/* Ornement */}
                              <div className="flex justify-center my-2">
                                <div className="h-10 w-28 opacity-80 flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }}></div>
                                  <div className="w-16 h-px mx-2" style={{ background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)' }}></div>
                                  <Heart className="h-3 w-3" style={{ color: '#d946ef' }} fill="#d946ef" />
                                  <div className="w-16 h-px mx-2" style={{ background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)' }}></div>
                                  <div className="w-2 h-2 rounded-full" style={{ background: '#d946ef' }}></div>
                                </div>
                              </div>
                              {/* Texte invitation */}
                              <div className="px-2">
                                <p className="text-xs text-slate-700 leading-snug font-poppins">
                                  {templateData.invitationText}
                                </p>
                              </div>
                              {/* Ornement bas */}
                              <div className="mt-3 flex justify-center">
                                <Sparkles className="h-6 w-6" style={{ color: '#f59e0b' }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ===== SECTION 2 : COUNTDOWN + DATE (JJ MM AA) + MAPS ===== */}
                      <div className="relative z-10 w-full mt-4 px-3 py-6 min-h-[70vh] flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 opacity-95"></div>
                        <div className="w-full max-w-md px-2 relative z-10">
                          <div className="w-full rounded-[28px] p-4 backdrop-blur-2xl border-2 shadow-2xl relative overflow-hidden"
                            style={{ borderColor: 'rgba(245,158,11,0.5)', background: 'linear-gradient(145deg, rgba(0,0,0,0.6), rgba(0,0,0,0.3))' }}>
                            <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl" style={{ backgroundColor: '#f59e0b', opacity: 0.15 }}></div>
                            <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full blur-3xl" style={{ backgroundColor: '#d946ef', opacity: 0.15 }}></div>
                            <div className="w-full space-y-4 relative z-10">
                              {/* Countdown */}
                              <div className="space-y-2">
                                <h2 className="text-center font-luxury tracking-[0.6em] text-xs uppercase" style={{ color: '#f59e0b' }}>✨ J- ✨</h2>
                                <div className="grid grid-cols-4 gap-2 w-full">
                                  {[
                                    { label: 'JOURS', value: 42 },
                                    { label: 'H', value: 12 },
                                    { label: 'MIN', value: 37 },
                                    { label: 'SEC', value: 58 }
                                  ].map((it, i) => (
                                    <div key={i} className="flex flex-col items-center">
                                      <div className="relative w-12 h-12">
                                        <svg className="w-full h-full transform -rotate-90">
                                          <circle cx="24" cy="24" r="20" stroke="rgba(245,158,11,0.15)" strokeWidth="3" fill="none" />
                                          <circle cx="24" cy="24" r="20" stroke="url(#cdg1)" strokeWidth="3" fill="none"
                                            strokeDasharray={`${(it.value/(i===0?365:i===1?24:60))*125.6} 125.6`}
                                            strokeLinecap="round" />
                                          <defs>
                                            <linearGradient id="cdg1" x1="0" y1="0" x2="1" y2="1">
                                              <stop offset="0%" stopColor="#f59e0b" />
                                              <stop offset="100%" stopColor="#d946ef" />
                                            </linearGradient>
                                          </defs>
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center text-lg font-luxury text-white drop-shadow-lg">{String(it.value).padStart(2,'0')}</div>
                                      </div>
                                      <p className="text-[9px] mt-1 font-bold tracking-widest uppercase text-amber-200/70">{it.label}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Cartes JJ/MM/AA */}
                              <div className="grid grid-cols-3 gap-2 w-full">
                                {[
                                  { img: templateData.backgroundImage, val: '15' },
                                  { img: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400', val: '06' },
                                  { img: templateData.backgroundImage, val: '26' }
                                ].map((item, i) => (
                                  <div key={i} className="relative aspect-[3/4] overflow-hidden shadow-2xl border-2 rounded-xl"
                                    style={{ borderColor: 'rgba(245,158,11,0.4)' }}>
                                    <img src={item.img} className="w-full h-full object-cover" alt="" />
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-4xl font-luxury text-white drop-shadow-[0_6px_12px_rgba(0,0,0,0.9)]">{item.val}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Maps + Lieu */}
                              <div className="space-y-2 pt-1">
                                <div className="flex flex-col items-center space-y-2">
                                  <div className="relative group mx-auto cursor-pointer">
                                    <div className="w-11 h-11 bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border-3 shadow-lg rounded-full relative"
                                      style={{ borderColor: '#fbbf24', boxShadow: '0 0 40px rgba(251,191,36,0.4)' }}>
                                      <div className="absolute inset-1.5 rounded-full" style={{ background: 'linear-gradient(145deg, #fbbf24, #d946ef)' }}></div>
                                      <MapPin className="h-5 w-5 relative z-10 text-white drop-shadow-lg" />
                                    </div>
                                    <p className="mt-1 text-center text-[10px] font-bold uppercase tracking-widest" style={{ color: '#fbbf24' }}>Ouvrir dans Maps</p>
                                  </div>
                                  <div className="w-full cursor-pointer group">
                                    <div className="relative overflow-hidden text-center p-3 w-full rounded-[20px] border-2 transition-all duration-400 shadow-lg"
                                      style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))' }}>
                                      <h3 className="text-sm font-bold uppercase mb-1" style={{ color: '#f59e0b' }}>📍 Lieu de réception</h3>
                                      <p className="text-base text-white font-semibold drop-shadow-lg">{templateData.eventLocation}</p>
                                      <p className="text-xs text-white/80 font-medium leading-tight">{templateData.eventAddress}</p>
                                      <div className="inline-flex items-center justify-center space-x-1.5 mt-2" style={{ color: '#f59e0b' }}>
                                        <Clock className="h-4 w-4" />
                                        <p className="font-bold text-sm">{templateData.eventTime}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ===== SECTION 3 : GALERIE 3D PARALLAX ===== */}
                      <div className="relative z-10 w-full mt-0 py-6 overflow-hidden">
                        <div className="relative z-40 flex flex-col items-center justify-center pt-2 pb-3 px-4 pointer-events-none">
                          <div className="text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-[10px] tracking-[0.25em] uppercase font-semibold text-white/70 mb-2">
                              <span className="w-1 h-1 rounded-full" style={{ background: '#f59e0b' }} />
                              Gallery
                              <span className="w-1 h-1 rounded-full" style={{ background: '#d946ef' }} />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-1 bg-clip-text text-transparent"
                              style={{ backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f59e0b 50%, #ffffff 100%)' }}>
                              Nos Moments Précieux
                            </h2>
                            <p className="text-white/50 text-[11px] font-medium max-w-md mx-auto leading-relaxed">C&apos;est à tes côtés que je veux construire ma vie</p>
                          </div>
                        </div>
                        {/* Mini galerie illustrée */}
                        <div className="relative z-10 px-3">
                          <div className="relative h-[420px] w-full perspective-[1200px]">
                            {[
                              { src: templateData.backgroundImage, label: 'Notre première rencontre', color: '#ec4899', y: 0, rotate: -8, z: 0 },
                              { src: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=600', label: 'La demande en mariage', color: '#f59e0b', y: 40, rotate: 5, z: 1 },
                              { src: templateData.backgroundImage, label: 'Notre escapade à Paris', color: '#d946ef', y: 90, rotate: -4, z: 2 },
                              { src: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=600', label: 'Jour J arrive !', color: '#fbbf24', y: 140, rotate: 6, z: 3 }
                            ].map((p, i) => (
                              <div key={i} className="absolute left-1/2 -translate-x-1/2 w-[78%] aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border-2 group cursor-pointer transition-all duration-500 hover:scale-105"
                                style={{
                                  top: p.y,
                                  transform: `translateX(-50%) rotateY(${p.rotate*2}deg) rotateZ(${p.rotate/2}deg) translateZ(${p.z*30}px)`,
                                  borderColor: p.color+'80'
                                }}>
                                <img src={p.src} className="w-full h-full object-cover" alt="" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                  <p className="text-white font-bold text-sm drop-shadow-lg">{p.label}</p>
                                  <Eye className="absolute top-3 right-3 h-5 w-5 text-white/80" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* ===== SECTION 4 : RSVP + BOISSONS ===== */}
                      <div className="relative z-10 min-h-[80vh] flex flex-col items-center pt-10 pb-10 space-y-6 overflow-hidden w-full mt-8 px-3">
                        <div className="relative z-10 w-full max-w-md">
                          {/* RSVP Shiny Button */}
                          <div className="flex flex-col items-center mb-6">
                            <button
                              onClick={handleConfirmation}
                              className={`w-full py-4 rounded-2xl font-bold text-base tracking-wider whitespace-nowrap relative overflow-hidden shadow-2xl active:scale-95 transition-all border ${
                                isConfirmed
                                  ? 'text-white border-emerald-400/60'
                                  : 'text-white'
                              }`}
                              style={{
                                background: isConfirmed
                                  ? 'linear-gradient(135deg, #10b981, #059669)'
                                  : 'linear-gradient(135deg, #f59e0b, #d946ef, #f59e0b)'
                              }}
                            >
                              <span className="relative flex items-center justify-center gap-3">
                                {isConfirmed ? <Check className="w-6 h-6 flex-shrink-0" /> : <Users className="w-6 h-6 flex-shrink-0" />}
                                {isConfirmed ? 'PRÉSENCE CONFIRMÉE' : 'CONFIRMER MA PRÉSENCE'}
                              </span>
                            </button>
                          </div>

                          {/* Boissons - Carte multichoix avec bordure */}
                          <div className="w-full">
                            <div className="relative w-full rounded-[40px] p-[2px]" style={{ background: 'conic-gradient(from 0deg, #f59e0b, #d946ef, #fbbf24, #f59e0b)' }}>
                              <div className="w-full rounded-[40px] p-6 text-white shadow-2xl h-full relative" style={{ background: 'linear-gradient(to bottom right, #f59e0b, #d946ef)' }}>
                                <div className="flex flex-col items-center text-center space-y-3 mb-5">
                                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                                    <Wine className="h-5 w-5 text-white" />
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-bold">Choix de boisson</h3>
                                    <p className="text-xs text-white/70 mt-2">Sélectionnez jusqu&apos;à 2 boissons (couples)</p>
                                    <p className="text-[10px] text-white/50 mt-1">1/2 boisson sélectionnée</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  {templateData.drinkOptions.slice(0,6).map((drink, i) => (
                                    <button key={drink}
                                      className={`flex items-center space-x-1 px-2 py-2.5 rounded-xl transition-all text-left group h-full ${
                                        i===1 ? 'bg-white shadow-lg ring-2 ring-white scale-[1.02]' : 'bg-white text-slate-800 hover:bg-white/90 active:scale-95'
                                      }`}
                                      style={{ color: i===1 ? '#f59e0b' : undefined }}>
                                      <Wine className="h-3.5 w-3.5 flex-shrink-0" style={{ color: i===1 ? '#f59e0b' : '#94a3b8' }} />
                                      <span className="text-[10px] font-bold leading-tight break-words uppercase">{drink}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ===== SECTION 5 : JEUX INTERACTIFS (ARCADE) ===== */}
                      <div className="relative z-10 min-h-[85vh] flex items-center justify-center py-10 overflow-hidden px-3">
                        <div className="relative z-10 w-full max-w-md px-1">
                          <div className="relative w-full rounded-[36px] p-[3px]" style={{ background: 'conic-gradient(from 0deg, #f59e0b, #d946ef, #fbbf24, #f59e0b)' }}>
                            <div className="w-full rounded-[36px] relative overflow-hidden"
                              style={{ background: 'linear-gradient(160deg, #f59e0b 0%, #d946ef 50%, #f59e0b 100%)', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.5)' }}>
                              {/* Glow */}
                              <div className="absolute -top-20 -left-16 w-72 h-72 rounded-full blur-3xl" style={{ backgroundColor: '#f59e0b', opacity: 0.55 }}></div>
                              <div className="absolute top-20 -right-20 w-80 h-80 rounded-full blur-3xl" style={{ backgroundColor: '#d946ef', opacity: 0.5 }}></div>
                              {/* Barre console arcade */}
                              <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-3"
                                style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 60%, transparent 100%)', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f59e0b', boxShadow: '0 0 10px #f59e0b' }}></div>
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#d946ef', boxShadow: '0 0 10px #d946ef' }}></div>
                                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 10px #34d399' }}></div>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/25">
                                  <Star className="w-3 h-3" style={{ color: '#f59e0b' }} fill="#f59e0b" />
                                  <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase">Pour la soirée</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-white/50"></div>
                                  <div className="w-2 h-2 rounded-full bg-white/50"></div>
                                  <div className="w-2 h-2 rounded-full bg-white/50"></div>
                                </div>
                              </div>
                              {/* Coins arcade */}
                              <div className="absolute top-14 left-3 w-6 h-6 border-l-2 border-t-2 rounded-tl-md pointer-events-none z-10" style={{ borderColor: '#f59e0b', opacity: 0.85 }}></div>
                              <div className="absolute top-14 right-3 w-6 h-6 border-r-2 border-t-2 rounded-tr-md pointer-events-none z-10" style={{ borderColor: '#d946ef', opacity: 0.85 }}></div>
                              <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 rounded-bl-md pointer-events-none z-10" style={{ borderColor: '#d946ef', opacity: 0.85 }}></div>
                              <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 rounded-br-md pointer-events-none z-10" style={{ borderColor: '#f59e0b', opacity: 0.85 }}></div>

                              <div className="relative z-10 p-5 space-y-5">
                                <div className="text-center relative">
                                  <div className="relative inline-block mb-4">
                                    <div className="relative inline-flex items-center justify-center w-[72px] h-[72px] rounded-[22px]"
                                      style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.35), rgba(255,255,255,0.08))', border: '2px solid rgba(255,255,255,0.25)', boxShadow: '0 18px 35px -8px rgba(0,0,0,0.5)' }}>
                                      <Gamepad2 className="w-9 h-9 text-white relative z-10 drop-shadow-lg" strokeWidth={2.2} />
                                    </div>
                                  </div>
                                  <h2 className="text-3xl font-black font-luxury mb-3" style={{ color: '#fff', textShadow: '0 4px 12px rgba(245,158,11,0.5)' }}>
                                    Jeux &amp; Fun
                                  </h2>
                                  <p className="text-white/85 text-sm font-semibold">Régalez-vous avant la soirée</p>
                                  <div className="flex items-center justify-center gap-3 mt-4">
                                    <div className="h-px w-12" style={{ background: 'linear-gradient(90deg, transparent, #f59e0b)' }}></div>
                                    <div className="flex items-center gap-1 px-3 py-1 rounded-full backdrop-blur-sm" style={{ background: 'linear-gradient(90deg, rgba(245,158,11,0.4), rgba(217,70,239,0.4))', border: '1px solid rgba(255,255,255,0.3)' }}>
                                      <Trophy className="w-3 h-3 text-white" />
                                      <span className="text-[10px] font-black tracking-[0.25em] text-white uppercase">Jouez</span>
                                    </div>
                                    <div className="h-px w-12" style={{ background: 'linear-gradient(90deg, #d946ef, transparent)' }}></div>
                                  </div>
                                </div>

                                <div className="space-y-4 relative z-10">
                                  {[
                                    { icon: '💘', title: 'Quiz Love Story', desc: 'Testez vos connaissances du couple !', completed: true },
                                    { icon: '🧠', title: 'Memory Match', desc: 'Retrouvez les cartes identiques', completed: false },
                                    { icon: '💝', title: 'Attrape l\'Amour', desc: 'Le jeu d\'arcade fun et rapide', completed: false },
                                    { icon: '🎁', title: 'Vœux & Messages', desc: 'Laissez vos plus beaux vœux', completed: false }
                                  ].map((g, idx) => (
                                    <div key={idx}
                                      className="bg-white/22 backdrop-blur-xl rounded-[30px] overflow-hidden border border-white/30 shadow-lg transition-all hover:scale-[1.02] group relative active:scale-[0.99]">
                                      <button className="w-full px-5 py-5 relative z-10">
                                        <div className="flex items-center gap-4">
                                          <div className="w-14 h-14 rounded-[24px] flex items-center justify-center text-3xl shadow-lg flex-shrink-0"
                                            style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.55), rgba(255,255,255,0.2))', border: '1.5px solid rgba(255,255,255,0.45)' }}>
                                            {g.icon}
                                          </div>
                                          <div className="flex-1 text-center px-1">
                                            <h3 className="text-white font-extrabold text-base mb-1 drop-shadow">{g.title}</h3>
                                            <p className="text-white/90 text-xs font-medium line-clamp-2 drop-shadow">{g.desc}</p>
                                          </div>
                                          <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg flex-shrink-0"
                                            style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.55), rgba(255,255,255,0.22))', border: '1.5px solid rgba(255,255,255,0.4)' }}>
                                            <ChevronRight className="text-white w-6 h-6 drop-shadow" strokeWidth={2.8} />
                                          </div>
                                        </div>
                                        {g.completed && (
                                          <div className="mt-4 flex justify-center">
                                            <div className="inline-flex items-center gap-2 bg-emerald-400/30 px-5 py-2 rounded-full border border-emerald-300/40">
                                              <Check className="text-emerald-200 w-5 h-5" />
                                              <span className="text-emerald-100 text-xs font-bold uppercase tracking-widest">Terminé</span>
                                            </div>
                                          </div>
                                        )}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ===== SECTION 6 : QR CODE + FOOTER ===== */}
                      <div className="relative z-10 min-h-[75vh] flex flex-col items-center justify-center py-10 overflow-hidden px-3">
                        <div className="relative z-10 w-full max-w-md px-3">
                          <div className="bg-black/40 backdrop-blur-xl rounded-[30px] p-6 shadow-xl flex flex-col items-center border-2 mb-6"
                            style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
                            <div className="flex items-center space-x-2 mb-6">
                              <QrCode className="h-6 w-6" style={{ color: '#f59e0b' }} />
                              <h3 className="text-lg font-bold" style={{ color: '#f59e0b' }}>Code d&apos;Invitation</h3>
                            </div>
                            <div className="bg-white p-4 rounded-[20px] shadow-inner mb-6 w-full max-w-[220px] aspect-square flex items-center justify-center relative">
                              <div className="w-full h-full grid grid-cols-9 grid-rows-9 gap-[1px] p-3">
                                {Array.from({ length: 81 }).map((_, i) => {
                                  const x = i % 9, y = Math.floor(i/9);
                                  const isCorner = (x<3&&y<3)||(x>=6&&y<3)||(x<3&&y>=6);
                                  const isPattern = !isCorner && (Math.sin(i*3.14+x*y)>0.2);
                                  return <div key={i} className="rounded-[1px]" style={{ background: (isCorner||isPattern)? '#0f172a' : 'transparent', boxShadow: isCorner? 'inset 0 0 0 2px #fff' : undefined }} />
                                })}
                              </div>
                            </div>
                            <button
                              className="w-full py-4 rounded-[20px] font-bold text-sm shadow-lg flex items-center justify-center space-x-3 hover:scale-[1.03] transition-all relative overflow-hidden group border border-white/20 active:scale-95 text-white"
                              style={{ background: 'linear-gradient(135deg, #f59e0b, #d946ef)' }}>
                              <Download className="h-5 w-5" />
                              <span className="uppercase tracking-[0.15em]">Télécharger</span>
                            </button>
                          </div>
                          {/* Footer Furaha */}
                          <div className="pt-4 pb-8 flex justify-center w-full">
                            <div className="bg-white/90 backdrop-blur-md px-4 py-2 flex items-center justify-center space-x-2 shadow-xl border border-white/20 w-full">
                              <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                              <p className="text-slate-600 text-xs font-medium text-center">
                                Réalisé par <a className="font-bold" style={{ color: '#f59e0b' }}>Furaha Digital</a>
                              </p>
                              <Sparkles className="h-3 w-3 text-amber-400" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ===== FLOATING CONTROLS (Music + Notif + Livre d'Or) ===== */}
                      <div className="fixed bottom-8 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
                        {/* MUSIC */}
                        <div className="pointer-events-auto">
                          <button
                            className="w-10 h-10 rounded-full shadow-md flex items-center justify-center text-white border border-white/50 backdrop-blur-md transform hover:scale-105 transition-all active:scale-95 relative"
                            style={{ background: 'linear-gradient(to br, #f59e0b, #d946ef)' }}>
                            <Volume2 className="h-5 w-5 text-white" />
                          </button>
                        </div>
                        {/* NOTIF */}
                        <div className="pointer-events-auto">
                          <button
                            className="w-10 h-10 rounded-full shadow-md flex items-center justify-center text-white border border-white/50 backdrop-blur-md transform hover:scale-105 transition-all active:scale-95 relative"
                            style={{ background: 'linear-gradient(to br, #d946ef, #f59e0b)' }}>
                            <Bell className="w-5 h-5 text-white" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center border border-white text-[10px] font-bold shadow-sm">
                              ✓
                            </div>
                          </button>
                        </div>
                        {/* LIVRE D'OR */}
                        <div className="relative pointer-events-auto">
                          <button
                            className="w-10 h-10 rounded-full shadow-md flex items-center justify-center text-white border border-white/50 backdrop-blur-md transform hover:scale-105 transition-all active:scale-95 relative z-10"
                            style={{ background: 'linear-gradient(to br, #f59e0b, #d946ef)' }}>
                            <BookOpen className="h-5 w-5 text-white" />
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold border border-white shadow-sm">
                              12
                            </div>
                            <div className="absolute -bottom-1 -left-1">
                              <Sparkles className="h-3 w-3" style={{ color: '#d946ef' }} />
                            </div>
                          </button>
                        </div>
                      </div>

                      <div className="h-12"></div>
                    </div>
                    ) : (
                    <div className="h-full w-full relative overflow-y-auto no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
                      {(() => {
                        const embeddedModel: UserModel = {
                          ...templateData,
                          userId: 'embedded-preview',
                          originalTemplateId: templateData.id,
                          title: templateData.title,
                          backgroundImage: templateData.backgroundImage,
                          invitationText: templateData.invitationText,
                          eventDate: templateData.eventDate,
                          eventTime: templateData.eventTime,
                          eventLocation: templateData.eventLocation,
                          eventAddress: templateData.eventAddress,
                          drinkOptions: templateData.drinkOptions,
                          category: 'wedding',
                          colors: {
                            primary: '#f59e0b',
                            secondary: '#d97706',
                            accent: '#f43f5e',
                          },
                          customizations: {
                            layout: selectedLayout,
                            colors: {
                              primary: '#f59e0b',
                              secondary: '#d97706',
                              accent: '#f43f5e',
                            },
                            fonts: {
                              title: 'Playfair Display',
                              body: 'Inter',
                            },
                          },
                        } as UserModel;
                        return (
                          <InvitationPreview embedded embeddedModel={embeddedModel} />
                        );
                      })()}
                    </div>
                    )}
                  </div>
                </div>
                
                {/* Subtle Decorative Elements */}
                <div aria-hidden className="absolute -top-8 -right-6 w-20 h-20 rounded-full opacity-20 animate-float blur-xl" style={{ background: 'radial-gradient(circle, #fcd34d, transparent)' }}></div>
                <div aria-hidden className="absolute -bottom-6 -left-5 w-16 h-16 rounded-full opacity-18 animate-float blur-xl" style={{ background: 'radial-gradient(circle, #f472b6, transparent)', animationDelay: '1.2s' }}></div>
              </div>
            </div>

            {/* Template Information */}
            <div className="animate-slide-up lg:pl-2">
              <div className="relative rounded-2xl p-5 overflow-hidden border group"
                style={{
                  background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
                  borderColor: 'rgba(255,255,255,0.08)',
                  boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(251,191,36,0.05) inset',
                  transition: 'all 400ms cubic-bezier(0.22,1,0.36,1)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(251,191,36,0.25)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                {/* GitHub-style backlight ambiance sous la carte */}
                <div aria-hidden className="absolute -bottom-12 -left-6 w-[110%] h-[55%] pointer-events-none blur-3xl opacity-70"
                     style={{ background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.22) 0%, rgba(251,191,36,0.08) 38%, rgba(251,191,36,0) 70%)' }}></div>
                <div aria-hidden className="absolute -bottom-20 -left-10 w-[130%] h-32 pointer-events-none blur-3xl opacity-50"
                     style={{ background: 'radial-gradient(ellipse at center, rgba(244,114,182,0.10) 0%, rgba(244,114,182,0) 70%)' }}></div>

                {/* Header Card */}
                <div className="relative z-10 flex items-center gap-4 mb-5 pb-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="relative flex-shrink-0">
                    <div aria-hidden className="absolute -inset-2 rounded-full blur-xl" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.38), transparent 60%)' }}></div>
                    <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                         style={{
                           background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                           boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 10px 28px -10px rgba(251,191,36,0.85)',
                         }}>
                      <Heart className="h-7 w-7" fill="#0b0f17" stroke="#0b0f17" strokeWidth={2} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                      <span className="font-mono text-[11px] text-white/60">templates/<span style={{ color: '#fcd34d' }}>wedding-premium</span>/{selectedLayout === 'book' ? 'book' : 'scroll'}</span>
                    </div>
                    <h2 className="text-xl font-extrabold leading-tight text-white flex items-center gap-2">
                      Gold Premium
                      {selectedLayout === 'book' && (
                        <BookOpen className="w-4 h-4" style={{ color: '#fcd34d' }} />
                      )}
                    </h2>
                    <p className="text-neutral-400 text-[13px] mt-0.5 leading-snug">
                      {selectedLayout === 'book'
                        ? 'Format Livre — expérience page-turning immersive'
                        : 'L\u2019invitation d\u2019exception pour un mariage inoubliable'}
                    </p>
                  </div>
                  <div className="flex-shrink-0 px-3 py-1.5 rounded-full flex items-center gap-1.5"
                       style={{
                         border: '1px solid rgba(251,191,36,0.25)',
                         background: 'linear-gradient(180deg, rgba(251,191,36,0.1), rgba(251,191,36,0.02))',
                       }}>
                    <Sparkles className="h-3.5 w-3.5" style={{ color: '#fbbf24' }} />
                    <span className="text-[11px] font-bold font-mono tracking-wide uppercase" style={{ color: '#fcd34d' }}>Pro</span>
                  </div>
                </div>

                {/* Stats compactes — style carte accueil */}
                <div className="relative z-10 grid grid-cols-3 gap-2.5 mb-5">
                  {[
                    { value: '8+', label: 'Modules', icon: Sparkles },
                    { value: '100%', label: 'Perso', icon: Palette },
                    { value: '24/7', label: 'Offline', icon: LayoutDashboard }
                  ].map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <div key={i} className="rounded-lg p-3 text-center relative overflow-hidden group"
                           style={{
                             background: 'rgba(255,255,255,0.02)',
                             border: '1px solid rgba(255,255,255,0.05)',
                           }}
                           onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(251,191,36,0.25)'; (e.currentTarget as HTMLElement).style.background = 'rgba(251,191,36,0.06)'; }}
                           onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                      >
                        <Icon className="h-4 w-4 mx-auto mb-1.5" style={{ color: '#fcd34d' }} />
                        <div className="text-lg font-black leading-none" style={{ color: '#fcd34d' }}>{s.value}</div>
                        <div className="text-[10px] text-neutral-400 mt-1 font-medium tracking-wider uppercase">{s.label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Features - grille 2 colonnes compacte */}
                <div className="relative z-10 mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08))' }}></div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full"
                         style={{ border: '1px solid rgba(251,191,36,0.22)', background: 'linear-gradient(180deg, rgba(251,191,36,0.08), rgba(251,191,36,0.02))' }}>
                      <Sparkles className="w-3 h-3" style={{ color: '#fbbf24' }} />
                      <h3 className="text-[10.5px] font-bold tracking-[0.18em] uppercase font-mono" style={{ color: '#fcd34d' }}>
                        Contenu inclus
                      </h3>
                    </div>
                    <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)' }}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {templateData.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2 px-2.5 py-2 rounded-md group"
                           style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                           onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(251,191,36,0.18)'; }}
                           onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.04)'; }}
                      >
                        <div className="flex-shrink-0 mt-1 w-1.5 h-1.5 rounded-full group-hover:scale-150 transition-transform" style={{ backgroundColor: '#fcd34d', boxShadow: '0 0 8px rgba(252,211,77,0.5)' }}></div>
                        <span className="text-[12px] text-neutral-300 leading-snug group-hover:text-neutral-200 transition-colors">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section À propos compacte */}
                <div className="relative z-10 rounded-lg p-4 mb-5 overflow-hidden"
                     style={{
                       background: 'rgba(255,255,255,0.02)',
                       border: '1px solid rgba(255,255,255,0.05)',
                     }}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Sparkles className="h-4 w-4 flex-shrink-0" style={{ color: '#fcd34d' }} />
                    <h4 className="text-[13px] font-bold text-white">Expérience Premium</h4>
                    <div className="ml-auto flex items-center gap-1.5 text-[10px] text-white/45">
                      <span className="font-mono">v3.1</span>
                      <span>·</span>
                      <span className="text-rose-400">★ Pro</span>
                    </div>
                  </div>
                  <p className="text-[11.5px] text-neutral-300 leading-relaxed">
                    {selectedLayout === 'book' ? (
                      <>
                        Format <span className="font-semibold" style={{ color: '#fcd34d' }}>Livre page-turning</span> avec
                        pages animées, Focus Rail navigation, cartes tilt interactives, galerie parallaxe unfurling,
                        Typewriter plume, jeux intégrés, musique de fond et notifications push.
                      </>
                    ) : (
                      <>
                        Interface scrollable en <span className="font-semibold" style={{ color: '#fcd34d' }}>6 sections cinématiques</span>,
                        animations fluides, effets de lumière, jeux interactifs, notifications push,
                        musique de fond, livre d&apos;or moderne et cache offline automatique.
                      </>
                    )}
                  </p>
                  <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-[10px] text-neutral-500 italic font-mono">Dashboard : couleurs · photos · texte · boissons · jeux…</span>
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#fcd34d' }}></span>
                      <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                      <span className="w-2 h-2 rounded-full bg-fuchsia-400"></span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons — style CTA ServicesSection exact */}
                <div className="relative z-10 space-y-2.5">
                  {hasExistingTemplate && (
                    <div className="px-3.5 py-2.5 rounded-lg flex items-start space-x-2"
                         style={{
                           background: 'rgba(16,185,129,0.06)',
                           border: '1px solid rgba(16,185,129,0.20)',
                         }}>
                      <Check className="h-4 w-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                      <p className="text-[11px] text-emerald-200 leading-snug">
                        Design existant détecté. Vous retrouverez votre personnalisation sans perte de données.
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleSelectTemplate}
                    disabled={isLoading}
                    className={`w-full py-3.5 rounded-md transition-all duration-300 font-semibold text-[14px] relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${
                      hasExistingTemplate ? 'text-white' : 'text-[#0b0f17]'
                    }`}
                    style={{
                      background: hasExistingTemplate
                        ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)'
                        : 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                      boxShadow: hasExistingTemplate
                        ? '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(16,185,129,0.55), 0 12px 30px -12px rgba(16,185,129,0.65)'
                        : '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 10px 30px -10px rgba(251,191,36,0.55)',
                    }}
                    onMouseEnter={(e) => { if (!isLoading) (e.currentTarget as HTMLElement).style.transform = 'scale(1.015)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                  >
                    <span className="relative flex items-center justify-center gap-2.5">
                      {isLoading ? (
                        <>
                          <div className="w-4.5 h-4.5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                          Chargement...
                        </>
                      ) : hasExistingTemplate ? (
                        <>
                          <LayoutDashboard className="h-4.5 w-4.5" />
                          Accéder à mon Dashboard
                        </>
                      ) : (
                        <>
                          {selectedLayout === 'book' ? (
                            <BookOpen className="h-4.5 w-4.5 fill-current" strokeWidth={2} />
                          ) : (
                            <Heart className="h-4.5 w-4.5 fill-current" strokeWidth={2} />
                          )}
                          {selectedLayout === 'book'
                            ? 'Créer mon modèle Format Livre'
                            : 'Découvrir le modèle Mariage'}
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal d'authentification */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      <AdminPasswordModal
        isOpen={showAdminPasswordModal}
        onClose={() => setShowAdminPasswordModal(false)}
        onSuccess={handleAdminPasswordSuccess}
        targetLayoutLabel={pendingLayout === 'book' ? 'Format Livre' : 'Scroll Classique'}
      />

      <ToastModal 
        isOpen={showToastModal}
        onClose={() => setShowToastModal(false)}
        selectedDrink={selectedDrink}
        primaryColor="#f59e0b"
        secondaryColor="#d97706"
      />
    </div>
  );
};

export default WeddingTemplate;
