import React, { useState } from 'react';
import { GraduationCap, Calendar, MapPin, Users, BookOpen, Camera, MessageCircle, QrCode, ArrowLeft, Check, Star, Sparkles, Award, User, Eye } from 'lucide-react';
import AuthModal from './AuthModal';
import ToastModal from './ToastModal';
import { useTemplates } from '../hooks/useTemplates';
import { useAuth } from './AuthContext';

interface GraduationTemplateProps {
  onBack: () => void;
  onSelectTemplate: (templateData: any) => void;
  isAuthenticated?: boolean;
}

const GraduationTemplate = ({ onBack, onSelectTemplate, isAuthenticated }: GraduationTemplateProps) => {
  const { createUserTemplate, isLoading } = useTemplates();
  const { user } = useAuth();
  const [selectedDrink, setSelectedDrink] = useState('');
  const [showToastModal, setShowToastModal] = useState(false);
  const [guestMessage, setGuestMessage] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showQRInfo, setShowQRInfo] = useState(false);

  const templateData = {
    id: 'graduation-achievement-premium',
    name: 'Collation Achievement Premium',
    category: 'graduation',
    backgroundImage: 'https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=1200',
    title: 'Collation de Grade - Thomas Martin',
    invitationText: 'Après des années d\'efforts et de persévérance, j\'ai l\'honneur de vous inviter à célébrer l\'obtention de mon diplôme. Votre présence rendrait ce moment encore plus mémorable.',
    eventDate: '10 Septembre 2024',
    eventTime: '14h30',
    eventLocation: 'Université Sorbonne, Amphithéâtre Richelieu, Paris',
    drinkOptions: ['Champagne', 'Vin d\'Honneur', 'Jus de Fruits', 'Eau Pétillante', 'Café', 'Thé'],
    features: [
      'Photo de diplôme',
      'Titre personnalisable',
      'Texte de félicitations',
      'Nom de l\'invité dynamique',
      'Numéro de place automatique',
      'Date et lieu de cérémonie',
      'Livre d\'or interactif',
      'Confirmation de présence',
      'Choix de boisson',
      'QR Code unique',
      'Galerie de souvenirs',
      'Messages de félicitations'
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
    
    try {
      // Créer une copie du template dans Firestore
      const userTemplateId = await createUserTemplate(templateData, {
        guestData: {
          name: '[Nom de l\'invité]',
          tableNumber: '[Numéro de place]',
          qrCode: `GRAD-${Date.now()}`,
          confirmation: 'pending',
          selectedDrink: '',
          message: ''
        }
      });

      if (userTemplateId) {
        // Créer l'objet pour le callback avec l'ID du nouveau template
        const personalizedTemplate = {
          ...templateData,
          id: userTemplateId,
          isPersonalized: true,
          createdAt: new Date().toISOString(),
          guestData: {
            name: '[Nom de l\'invité]',
            tableNumber: '[Numéro de place]'
          }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900/20 to-slate-800 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-r from-emerald-400/10 to-blue-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-gradient-to-r from-emerald-500/10 to-emerald-300/10 rounded-full blur-3xl animate-bounce-slow"></div>
        <div className="absolute top-1/2 left-10 w-24 h-24 bg-gradient-to-r from-blue-400/10 to-emerald-400/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center text-emerald-400 hover:text-emerald-300 transition-all duration-300 group"
            >
              <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              Retour aux catégories
            </button>
            
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400 bg-clip-text text-transparent">
                Modèle Collation Premium
              </h1>
              <p className="text-neutral-300 mt-2">Célébrez vos accomplissements académiques</p>
            </div>

            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center text-emerald-400 hover:text-emerald-300 transition-all duration-300 group"
            >
              Aperçu
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Template Preview */}
            <div className="flex justify-center animate-slide-up">
              <div className="relative">
                {/* Phone Frame */}
                <div className="relative w-80 h-[700px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] p-6 shadow-luxury border border-slate-700">
                  <div className="w-full h-full bg-gradient-to-br from-neutral-50 to-emerald-50/30 rounded-[2rem] overflow-hidden relative shadow-inner">
                    {/* Status Bar */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 h-6 flex items-center justify-between px-6 text-neutral-50 text-xs">
                      <span>9:41</span>
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                      </div>
                    </div>
                    
                    {/* Invitation Content */}
                    <div className="h-full bg-cover bg-center bg-no-repeat relative overflow-y-auto" style={{ backgroundImage: `url(${templateData.backgroundImage})` }}>
                      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70"></div>
                      
                      <div className="relative z-10 p-6 text-center text-white space-y-4">
                  <div className="mb-6">
                    <div className="flex justify-center space-x-2 mb-4">
                      <Sparkles className="h-6 w-6 text-emerald-400 animate-pulse" />
                      <GraduationCap className="h-8 w-8 text-emerald-300" />
                      <Sparkles className="h-6 w-6 text-emerald-400 animate-pulse" />
                    </div>
                    
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent mx-auto mb-4"></div>
                    <div className="flex justify-center space-x-2 mb-4">
                      <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
                      <Award className="h-3 w-3 text-emerald-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
                      <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" style={{ animationDelay: '1s' }} />
                    </div>
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-300 via-emerald-200 to-emerald-300 bg-clip-text text-transparent mb-6 font-luxury drop-shadow-lg">
                    {templateData.title}
                  </h1>

                  {/* Guest Info */}
                  <div className="bg-gradient-to-r from-emerald-900/40 to-emerald-800/40 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-emerald-500/30">
                    <p className="text-emerald-200 text-sm mb-2">Cher(e)</p>
                    <p className="text-xl font-semibold text-emerald-100">[Nom de l'invité]</p>
                    <p className="text-emerald-300 text-sm mt-2">Place n° [Numéro de place]</p>
                  </div>

                  {/* Invitation Text */}
                  <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-emerald-500/20">
                    <p className="text-neutral-200 leading-relaxed text-xs">
                      {templateData.invitationText}
                    </p>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-center text-emerald-200">
                      <Calendar className="h-5 w-5 mr-3 text-emerald-400" />
                      <div className="text-left">
                        <p className="font-semibold">{templateData.eventDate}</p>
                        <p className="text-sm text-emerald-300">{templateData.eventTime}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center text-emerald-200">
                      <MapPin className="h-5 w-5 mr-3 text-emerald-400" />
                      <div className="text-center">
                        <p className="text-xs">{templateData.eventLocation}</p>
                        {templateData.eventAddress && (
                          <p className="text-[10px] text-emerald-300/80 mt-1">{templateData.eventAddress}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RSVP Section */}
                  <div className="bg-gradient-to-r from-emerald-900/50 to-emerald-800/50 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-emerald-500/30">
                    <h3 className="text-emerald-200 font-semibold mb-3 flex items-center justify-center">
                      <Users className="h-4 w-4 mr-2" />
                      Confirmation
                    </h3>
                    <button
                      onClick={handleConfirmation}
                      className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                        isConfirmed
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                          : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg'
                      }`}
                    >
                      {isConfirmed ? (
                        <span className="flex items-center justify-center">
                          <Check className="h-4 w-4 mr-2" />
                          Présence confirmée
                        </span>
                      ) : (
                        'Confirmer ma présence'
                      )}
                    </button>
                  </div>

                  {/* Drink Selection */}
                  <div className="bg-gradient-to-r from-emerald-900/50 to-emerald-800/50 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-emerald-500/30">
                    <h3 className="text-emerald-200 font-semibold mb-3 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Boisson
                    </h3>
                    <select
                      value={selectedDrink}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedDrink(val);
                        if (val) setShowToastModal(true);
                      }}
                      className="w-full bg-slate-800/80 text-emerald-200 border border-emerald-500/30 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-xs"
                    >
                      <option value="">Sélectionnez votre boisson</option>
                      {templateData.drinkOptions.map((drink) => (
                        <option key={drink} value={drink}>{drink}</option>
                      ))}
                    </select>
                  </div>

                  {/* Guest Book */}
                  <div className="bg-gradient-to-r from-emerald-900/50 to-emerald-800/50 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-emerald-500/30">
                    <h3 className="text-emerald-200 font-semibold mb-3 flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Livre d'or
                    </h3>
                    <textarea
                      value={guestMessage}
                      onChange={(e) => setGuestMessage(e.target.value)}
                      placeholder="Message de félicitations..."
                      className="w-full bg-slate-800/80 text-emerald-200 border border-emerald-500/30 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 resize-none text-xs"
                      rows={2}
                    />
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => {
                          if (guestMessage.trim()) {
                            alert('Message envoyé avec succès !');
                            setGuestMessage('');
                          } else {
                            alert('Veuillez écrire un message avant d\'envoyer.');
                          }
                        }}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-semibold text-xs shadow-lg transform hover:scale-105"
                      >
                        <MessageCircle className="h-3 w-3 inline mr-1" />
                        Envoyer
                      </button>
                      <button className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-2 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 font-semibold text-xs">
                        <Camera className="h-3 w-3 inline mr-1" />
                        Photo
                      </button>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="bg-gradient-to-r from-emerald-900/50 to-emerald-800/50 backdrop-blur-sm rounded-2xl p-4 border border-emerald-500/30">
                    <h3 className="text-emerald-200 font-semibold mb-3 flex items-center justify-center">
                      <QrCode className="h-4 w-4 mr-2" />
                      QR Code
                    </h3>
                    <div className="text-center">
                      <div 
                        className="bg-white rounded-xl p-4 inline-block cursor-pointer hover:scale-105 transition-transform duration-300"
                        onClick={() => setShowQRInfo(!showQRInfo)}
                      >
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center">
                          <QrCode className="h-10 w-10 text-emerald-400" />
                        </div>
                      </div>
                      
                      <p className="text-center mt-3 text-emerald-300 text-xs">
                        Cliquez pour scanner
                      </p>
                      
                      {showQRInfo && (
                        <div className="mt-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 animate-slide-up">
                          <div className="text-center mb-3">
                            <h4 className="font-bold text-slate-900 text-sm">Informations Invité</h4>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                              <div className="flex items-center">
                                <User className="h-3 w-3 text-slate-600 mr-2" />
                                <span className="font-medium text-slate-700">Nom:</span>
                              </div>
                              <span className="font-bold text-slate-900">[Nom de l'invité]</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 text-slate-600 mr-2" />
                                <span className="font-medium text-slate-700">Place:</span>
                              </div>
                              <span className="font-bold text-slate-900">[Numéro de place]</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                              <div className="flex items-center">
                                <BookOpen className="h-3 w-3 text-slate-600 mr-2" />
                                <span className="font-medium text-slate-700">Boisson:</span>
                              </div>
                              <span className="font-bold text-slate-900">{selectedDrink || 'Non sélectionnée'}</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowQRInfo(false);
                            }}
                            className="w-full mt-3 bg-slate-600 text-white py-1 rounded-lg hover:bg-slate-700 transition-all duration-300 text-xs font-medium"
                          >
                            Fermer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                    </div>
                  </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full opacity-20 animate-float blur-lg"></div>
                <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full opacity-15 animate-float blur-lg" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/4 -left-6 w-10 h-10 bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full opacity-25 animate-bounce-slow blur-sm"></div>
                <div className="absolute bottom-1/4 -right-4 w-8 h-8 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full opacity-30 animate-float blur-sm" style={{ animationDelay: '2s' }}></div>
              </div>
            </div>

            {/* Template Information */}
            <div className="animate-slide-up">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl shadow-luxury border border-emerald-500/20 p-6">
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full shadow-lg">
                      <GraduationCap className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent mb-2">
                    Collation Premium
                  </h2>
                  <p className="text-neutral-300">Marquez votre réussite académique</p>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <h3 className="text-emerald-400 font-semibold mb-4">Fonctionnalités incluses</h3>
                  <div className="space-y-2">
                    {templateData.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-neutral-300">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3 flex-shrink-0 animate-pulse"></div>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Template Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center bg-gradient-to-br from-emerald-900/30 to-emerald-800/30 rounded-2xl p-4 border border-emerald-500/20">
                    <div className="text-2xl font-bold text-emerald-400">Premium</div>
                    <div className="text-neutral-400 text-sm">Qualité</div>
                  </div>
                  <div className="text-center bg-gradient-to-br from-emerald-900/30 to-emerald-800/30 rounded-2xl p-4 border border-emerald-500/20">
                    <div className="text-2xl font-bold text-emerald-400">12+</div>
                    <div className="text-neutral-400 text-sm">Fonctionnalités</div>
                  </div>
                  <div className="text-center bg-gradient-to-br from-emerald-900/30 to-emerald-800/30 rounded-2xl p-4 border border-emerald-500/20">
                    <div className="text-2xl font-bold text-emerald-400">100%</div>
                    <div className="text-neutral-400 text-sm">Personnalisable</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mb-4">
                  <button
                    onClick={handleSelectTemplate}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 text-white py-4 rounded-2xl hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-600 transition-all duration-500 font-bold text-lg shadow-lg hover:shadow-luxury transform hover:scale-105 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative flex items-center justify-center">
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                          Création en cours...
                        </>
                      ) : (
                        <>
                          <GraduationCap className="h-5 w-5 mr-2" />
                          Choisir ce modèle
                        </>
                      )}
                    </span>
                  </button>
                </div>

                {/* Template Description */}
                <div className="p-4 bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 rounded-2xl border border-emerald-500/20">
                  <h4 className="text-emerald-400 font-semibold mb-3">À propos de ce modèle</h4>
                  <p className="text-neutral-300 text-xs leading-relaxed">
                    Ce modèle premium de collation de grade combine prestige académique et élégance pour 
                    célébrer vos accomplissements. Avec son design sophistiqué et ses fonctionnalités 
                    complètes, il honore dignement cette étape importante de votre parcours.
                  </p>
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

      <ToastModal 
        isOpen={showToastModal}
        onClose={() => setShowToastModal(false)}
        selectedDrink={selectedDrink}
        primaryColor="#10b981"
        secondaryColor="#059669"
      />
    </div>
  );
};

export default GraduationTemplate;