import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import ornement5 from '../images/ornement5.png';
import ornement6 from '../images/ornement6.png';
import plume from '../images/plume.png';

// Fallback images if local assets are missing
const pagneImage = 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop';
const photoCouple = 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop';
const motif1 = 'https://www.transparenttextures.com/patterns/cubes.png';
const motif2 = 'https://www.transparenttextures.com/patterns/pinstripe-light.png';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { 
  Heart, 
  Calendar, 
  MapPin, 
  Users, 
  Wine, 
  Camera, 
  MessageCircle, 
  QrCode, 
  Check, 
  Sparkles,
  ArrowLeft,
  Gift,
  GraduationCap,
  User,
  X,
  Eye,
  Download,
  BookOpen,
  Send,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Trash2,
  Clock,
  Feather,
  ChevronDown,
  Info,
  Palette,
  Volume2,
  VolumeX,
  Music as MusicIcon
} from 'lucide-react';
import { UserModelService, InviteService } from '../services/templateService';
import { UserModel, Invite } from '../services/templateService';
import ToastModal from './ToastModal';
import { notificationService } from '../services/notificationService';
import { useNotifications } from '../hooks/useNotifications';
import { FocusRail, FocusRailItem } from './ui/focus-rail';
import { InteractiveTiltCard } from './ui/tilt-card';
import HolographicCard from './ui/holographic-card';
import { BorderRotate } from './ui/animated-gradient-border';
import { ShinyButton } from './ui/shiny-button';
import { TypewriterWithPen } from './ui/typewriter-pen';

// Helper for image optimization
const optimizeImage = (url: string, width: number = 800, quality: number = 70) => {
  if (!url) return '';
  if (url.includes('cloudinary.com')) {
    // Replace /upload/ with /upload/w_{width},q_{quality},f_auto/
    return url.replace('/upload/', `/upload/w_${width},q_${quality},f_auto,c_limit/`);
  }
  return url;
};

// --- UTILITAIRES DÉPLACÉS EN HAUT POUR COMPATIBILITÉ SAFARI ---

const getIconForCategory = (category: string) => {
  switch (category) {
    case 'wedding': return Heart;
    case 'birthday': return Gift;
    case 'graduation': return GraduationCap;
    default: return Heart;
  }
};

const parseLatLngFromString = (s: string): { lat: number; lng: number } | null => {
  if (!s) return null;
  const m = s.match(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/);
  if (m) {
    const lat = parseFloat(m[1]);
    const lng = parseFloat(m[2]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
  }
  return null;
};

const segmentGraphemes = (str: string) => {
  if (!str) return [];
  try {
    // Vérification ultra-stricte pour Safari
    if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
      const seg = new (Intl as any).Segmenter(undefined, { granularity: 'grapheme' });
      return Array.from(seg.segment(str)).map((s: any) => s.segment);
    }
  } catch (e) {}
  return Array.from(str);
};

// --- COMPOSANTS DE SÉCURITÉ ---

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; errorMessage: string | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white rounded-3xl p-8 shadow-2xl border-2 border-rose-500">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Oups ! Une erreur est survenue</h2>
            <p className="text-slate-600 mb-6">L'affichage de l'invitation a rencontré un problème sur ce navigateur. Essayez d'actualiser ou d'utiliser un autre appareil.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors"
            >
              Actualiser la page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- COMPOSANT COMPTE À REBOURS OPTIMISÉ ---
const CountdownTimer = React.memo(({ targetDate, colors }: { targetDate: Date, colors: any }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +targetDate - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };
    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();
    return () => clearInterval(timer);
  }, [targetDate]);

  const countdownItems = [
    { label: 'JOURS', value: timeLeft.days, max: 365 },
    { label: 'HEURES', value: timeLeft.hours, max: 24 },
    { label: 'MINUTES', value: timeLeft.minutes, max: 60 },
    { label: 'SECONDES', value: timeLeft.seconds, max: 60 }
  ];

  return (
    <div className="grid grid-cols-4 gap-2 w-full max-w-md mx-auto">
      {countdownItems.map((item, i) => {
        const percentage = (item.value / item.max) * 100;
        return (
          <div key={i} className="flex flex-col items-center">
            <div className="relative w-14 h-14">
              {/* Progress Circle Background */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="26"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="transparent"
                  className="text-white/5"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="26"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="transparent"
                  strokeDasharray="163.36"
                  strokeDashoffset={163.36 - (163.36 * percentage) / 100}
                  className="transition-all duration-1000 ease-linear"
                  style={{ color: colors.primary }}
                />
              </svg>
              {/* Value Text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-black text-white">{String(item.value).padStart(2, '0')}</span>
              </div>
            </div>
            <span className="text-[7px] font-black text-white/40 tracking-widest mt-2 uppercase">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
});

const RevealOnScroll: React.FC<{ className?: string; animation?: string; delay?: number; repeat?: boolean; children: React.ReactNode }> = React.memo(({ className = '', animation = 'animate-slide-up', delay = 0, repeat = false, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (!repeat) observer.unobserve(entry.target);
        } else if (repeat) {
          setIsVisible(false);
        }
      });
    }, { threshold: 0.1 });
    
    if (domRef.current) observer.observe(domRef.current);
    return () => observer.disconnect();
  }, [repeat]);

  return (
    <div
      ref={domRef}
      className={`${className} transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
});

// --- COMPOSANT PRINCIPAL ---

const InvitationPreview: React.FC<{ embedded?: boolean; embeddedModel?: UserModel | null }> = (props) => {
  return (
    <ErrorBoundary>
      <InvitationPreviewContent {...props} />
    </ErrorBoundary>
  );
};

const InvitationPreviewContent: React.FC<{ embedded?: boolean; embeddedModel?: UserModel | null }> = ({ embedded = false, embeddedModel = null }) => {
  const { inviteId } = useParams<{ inviteId: string }>();
  const navigate = useNavigate();
  const [inviteDocPath, setInviteDocPath] = useState<string | null>(null);
  const { token, permission, requestPermission, isLoading: isNotificationLoading, error, isFCMSupported } = useNotifications();
  const [userModel, setUserModel] = useState<UserModel | null>(embedded ? embeddedModel : null);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    if (embedded && embeddedModel) {
      setUserModel(embeddedModel);
    }
  }, [embedded, embeddedModel]);

  const [invite, setInvite] = useState<Invite | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [typedText, setTypedText] = useState('');
  const [hasTypedOnce, setHasTypedOnce] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState('');
  const [guestMessage, setGuestMessage] = useState('');
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [showGuestBook, setShowGuestBook] = useState(false);
  const [guestBookMessages, setGuestBookMessages] = useState<any[]>([]);
  const [showToastModal, setShowToastModal] = useState<{ isOpen: boolean; type: 'drink' | 'confirmation' | 'cancellation'; drink?: string }>({
    isOpen: false,
    type: 'drink'
  });
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState<string | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  // Etats pour la page d'administration
  const [isAdminView, setIsAdminView] = useState(false);
  const [adminEditingId, setAdminEditingId] = useState<string | null>(null);
  const [adminFilterConfirmed, setAdminFilterConfirmed] = useState(false);

  const invitationTextRef = useRef<HTMLParagraphElement | null>(null);
  const typingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (embedded) { setIsLoading(false); return; }
      if (!inviteId) {
        setDataError("Identifiant d'invitation manquant.");
        setIsLoading(false);
        return;
      }
      
      try {
        const inviteData = await InviteService.getInviteGlobal(inviteId);
        if (inviteData) {
          setInvite(inviteData);
          setInviteDocPath(`users/${inviteData.userId}/invites/${inviteData.id}`);
          setIsConfirmed(inviteData.confirmed);
          setSelectedDrink((inviteData as any).selectedDrink || '');
          const models = await UserModelService.getUserModels(inviteData.userId);
          if (models.length > 0) {
            setUserModel(models[0]);
          } else {
            setDataError("Aucun design d'invitation trouvé pour cet événement.");
          }
        } else {
          setDataError("Invitation introuvable. Veuillez vérifier le lien.");
        }
      } catch (e) { 
        console.error(e); 
        setDataError("Erreur de chargement. Veuillez actualiser la page.");
      } finally { 
        setIsLoading(false); 
      }
    };
    loadData();
  }, [inviteId, embedded]);

  // Sécurité anti-crash - Fallback uniquement si userModel existe mais qu'il manque des champs
   const safeUserModel = userModel || {
     title: 'Invitation',
     backgroundImage: photoCouple,
     category: 'wedding',
     eventLocation: 'Lieu à définir',
     eventAddress: '',
     eventDate: '01.01.2026',
     drinkOptions: [],
     colors: { primary: '#f59e0b', secondary: '#d946ef', accent: '#fbbf24' },
     eventPhotos: []
   };

   // Pre-calculate optimized URLs to avoid repetitive string manipulation during render
   const optimizedBg = useMemo(() => optimizeImage(safeUserModel.backgroundImage, 1200, 80), [safeUserModel.backgroundImage]);
   const optimizedPattern = useMemo(() => safeUserModel.patternBackgroundImage ? optimizeImage(safeUserModel.patternBackgroundImage, 400, 40) : null, [safeUserModel.patternBackgroundImage]);

   const safeInvite = invite || { 
     nom: (userModel as any)?.guestData?.name || 'Invité', 
     table: (userModel as any)?.guestData?.tableNumber || 'Non assigné', 
     confirmed: false, 
     etat: 'simple' 
   };
   const customizations = (safeUserModel as any).customizations || {};
   const colors = customizations.colors || safeUserModel.colors || { primary: '#f59e0b', secondary: '#d946ef', accent: '#fbbf24' };
   
   const galleryPhotos = useMemo(() => {
     const photos = [];
     if (safeUserModel.invitationPhoto) photos.push(safeUserModel.invitationPhoto);
     if (safeUserModel.eventPhoto1) photos.push(safeUserModel.eventPhoto1);
     if (safeUserModel.eventPhoto2) photos.push(safeUserModel.eventPhoto2);
     if (safeUserModel.eventPhoto3) photos.push(safeUserModel.eventPhoto3);
     if (Array.isArray(safeUserModel.eventPhotos)) photos.push(...safeUserModel.eventPhotos);
     return photos.length > 0 ? photos : [photoCouple];
   }, [safeUserModel]);

   const focusRailItems = useMemo<FocusRailItem[]>(() => {
     const romanticMeta = [
       "Un Amour Infini",
       "Moments Précieux",
       "Promesse Éternelle",
       "Battements de Cœur",
       "Regard Complice",
       "Main dans la Main"
     ];
     
     const romanticTexts = [
       "Chaque jour à tes côtés est une nouvelle aventure.",
       "Deux cœurs qui battent à l'unisson pour l'éternité.",
       "Le début de notre plus belle histoire d'amour.",
       "Ton sourire est ma plus belle destination.",
       "Gravé dans nos mémoires pour toujours.",
       "L'amour est le seul voyage qui ne finit jamais."
     ];

     return galleryPhotos.map((photo, index) => ({
       id: index,
       title: "",
       description: "",
       imageSrc: photo,
       meta: ""
     }));
   }, [galleryPhotos, safeUserModel]);

      {/* Souscription aux messages du livre d'or */}
  useEffect(() => {
    const userId = invite?.userId || (userModel as any)?.userId;
    if (userId) {
      const unsub = InviteService.subscribeAllGuestMessages(userId, (messages) => {
        // Trier les messages par timestamp pour s'assurer que les plus récents sont à la fin
        const sortedMessages = [...messages].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        setGuestBookMessages(sortedMessages);
      });
      return () => unsub();
    }
  }, [invite?.userId, userModel]);

  // Scroll to bottom when guest book opens or messages change
  useEffect(() => {
    if (showGuestBook) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [showGuestBook, guestBookMessages]);

  // Logic for background music on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!isMusicPlaying && safeUserModel.backgroundMusic && audioRef.current) {
        audioRef.current.play().then(() => {
          setIsMusicPlaying(true);
        }).catch(err => {
          console.log("Autoplay blocked, waiting for more interaction", err);
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMusicPlaying, safeUserModel.backgroundMusic]);

  // Afficher le modal de notifications une seule fois si non vu et pas encore autorisé
  useEffect(() => {
    console.log('=== DEBUG NOTIFICATION MODAL ===');
    console.log('inviteDocPath:', inviteDocPath);
    console.log('permission:', permission);
    console.log('isLoading:', isLoading);
    console.log('isAdminView:', isAdminView);
    console.log('Notification in window:', 'Notification' in window);
    console.log('Protocol:', window.location.protocol);
    console.log('Is localhost:', window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (inviteDocPath && !isLoading && !isAdminView && isSecure) {
      // Vérifier dans localStorage si l'utilisateur a déjà vu le modal
      const hasSeenModal = localStorage.getItem('furaha_notification_modal_seen');
      console.log('hasSeenModal:', hasSeenModal);
      
      if (!hasSeenModal) {
        console.log('→ Setting timer to show notification modal');
        const timer = setTimeout(() => {
          setShowNotificationModal(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    } else {
      console.log('→ Conditions not met to show modal');
      if (!isSecure) {
        console.warn('→ Site is not served over HTTPS or localhost - notifications will not work!');
      }
    }
  }, [inviteDocPath, permission, isLoading, isAdminView]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      audioRef.current.play();
      setIsMusicPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMusicMuted;
    setIsMusicMuted(!isMusicMuted);
  };

  // Génération du QR Code
  useEffect(() => {
    if (inviteId || embedded) {
      const qrData = `Nom: ${safeInvite.nom}\nTable: ${safeInvite.table}\nBoisson: ${selectedDrink || 'Non choisie'}`;
      QRCode.toDataURL(qrData, { width: 256, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error(err));
    }
  }, [inviteId, embedded, safeInvite.nom, safeInvite.table, selectedDrink]);

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `QR-Invitation-${safeInvite.nom.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Animation de texte sécurisée pour Safari
  useEffect(() => {
    const el = invitationTextRef.current;
    if (!el || !userModel || hasTypedOnce) return;
    const full = String(userModel.invitationText || '');
    
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        let i = 0;
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        typingTimerRef.current = window.setInterval(() => {
          const chars = segmentGraphemes(full);
          if (i < chars.length) {
            setTypedText(prev => prev + chars[i]);
            i++;
          } else {
            clearInterval(typingTimerRef.current!);
            setHasTypedOnce(true);
          }
        }, 30);
      }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [userModel, hasTypedOnce]);

  const handleConfirmation = async () => {
    if (!inviteId || !invite) return;
    const newStatus = !isConfirmed;
    
    // UI Optimiste : On change l'état et on ouvre le modal immédiatement
    setIsConfirmed(newStatus);
    setShowToastModal({
      isOpen: true,
      type: newStatus ? 'confirmation' : 'cancellation'
    });

    try {
      await InviteService.updateInvite(invite.userId, inviteId, { confirmed: newStatus });
    } catch (e) {
      console.error(e);
      // En cas d'erreur, on revient en arrière et on ferme le modal
      setIsConfirmed(!newStatus);
      setShowToastModal({ isOpen: false, type: 'confirmation' });
      
      const notification = document.createElement('div');
      notification.className = 'fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-rose-500 text-white px-6 py-3 rounded-full shadow-2xl font-bold';
      notification.innerText = 'Erreur lors de la confirmation. Veuillez réessayer.';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    }
  };

  const handleDrinkSelection = async (drink: string) => {
    if (!inviteId || !invite) return;
    
    // UI Optimiste : On change l'état et on ouvre le modal immédiatement
    setSelectedDrink(drink);
    setShowToastModal({
      isOpen: true,
      type: 'drink',
      drink: drink
    });

    try {
      await InviteService.updateInviteResponse(invite.userId, inviteId, { selectedDrink: drink });
    } catch (e) { 
      console.error(e);
      // On ne ferme pas forcément le modal en cas d'échec pour la boisson, mais on log l'erreur
    }
  };

  const handleSendMessage = async () => {
    if (!inviteId || !invite || !guestMessage.trim()) return;
    setIsSubmittingMessage(true);
    try {
      await InviteService.createGuestMessage(invite.userId, inviteId, guestMessage);
      setGuestMessage('');
      // Notification personnalisée sans alerte ni modal de boisson
      const notification = document.createElement('div');
      notification.className = 'fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl font-bold animate-bounce';
      notification.innerText = 'Message envoyé !';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  // --- LOGIQUE DE PARSING DE DATE ROBUSTE ---
  const parsedDate = useMemo(() => {
    if (!safeUserModel.eventDate) return { day: '00', month: '00', year: '00', fullDate: new Date() };
    
    const cleanDate = safeUserModel.eventDate.trim();
    
    // Préparer l'heure au format HH:mm (remplacer 'h' par ':')
    const timeStr = (safeUserModel.eventTime || '00:00').replace('h', ':').padStart(5, '0');

    // 1. Essayer le format "7 janvier 2026" (Français long)
    const frenchMonths: { [key: string]: string } = {
      'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04', 'mai': '05', 'juin': '06',
      'juillet': '07', 'août': '08', 'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
    };
    
    const longParts = cleanDate.toLowerCase().split(' ');
    if (longParts.length === 3) {
      const d = longParts[0].replace(/\D/g, '').padStart(2, '0');
      const m = frenchMonths[longParts[1]];
      const y = longParts[2];
      if (m && d && !isNaN(parseInt(y))) {
        const isoStr = `${y}-${m}-${d}T${timeStr}:00`;
        const fDate = new Date(isoStr);
        return {
          day: d,
          month: m,
          year: y.slice(-2),
          fullDate: isNaN(fDate.getTime()) ? new Date() : fDate
        };
      }
    }

    // 2. Essayer les formats avec séparateurs (JJ/MM/AAAA, JJ.MM.AAAA, AAAA-MM-JJ)
    const parts = cleanDate.split(/[./-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) { // AAAA-MM-JJ
        const isoStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}T${timeStr}:00`;
        const fDate = new Date(isoStr);
        return {
          day: parts[2].padStart(2, '0'),
          month: parts[1].padStart(2, '0'),
          year: parts[0].slice(-2),
          fullDate: isNaN(fDate.getTime()) ? new Date() : fDate
        };
      } else { // JJ/MM/AAAA
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        const isoStr = `${y}-${m}-${d}T${timeStr}:00`;
        const fDate = new Date(isoStr);
        return {
          day: d,
          month: m,
          year: y.slice(-2),
          fullDate: isNaN(fDate.getTime()) ? new Date() : fDate
        };
      }
    }
    
    return { day: '00', month: '00', year: '00', fullDate: new Date() };
  }, [safeUserModel.eventDate, safeUserModel.eventTime]);

  const { day: eventDay, month: eventMonth, year: eventYear, fullDate: targetEventDate } = parsedDate;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-poppins animate-pulse">Chargement de votre invitation...</p>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white rounded-3xl p-8 shadow-2xl border-2 border-amber-500">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Info className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Désolé</h2>
          <p className="text-slate-600 mb-6">{dataError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Si l'utilisateur utilise une invitation riche (HTML personnalisé)
  if ((safeUserModel as any).useRichInvitation && (safeUserModel as any).richInvitationHTML) {
    return (
      <div 
        className="rich-invitation-container"
        dangerouslySetInnerHTML={{ __html: (safeUserModel as any).richInvitationHTML }}
      />
    );
  }

  return (
    <div 
      className="min-h-screen overflow-x-hidden selection:bg-amber-500/30 font-poppins relative"
      style={{ 
        backgroundImage: optimizedPattern ? `url(${optimizedPattern})` : 'none',
        backgroundColor: optimizedPattern ? 'transparent' : '#0f172a',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Background Overlay to darken and blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-none z-0"></div>

      {/* Background Music Audio Element */}
      {safeUserModel.backgroundMusic && (
        <audio 
          ref={audioRef} 
          src={safeUserModel.backgroundMusic} 
          loop 
          preload="auto"
        />
      )}

      {/* HEADER SECTION (Image 1 style) */}
      <div className="relative w-full overflow-hidden flex flex-col items-center justify-start">
        <div className="relative w-full h-[92vh] z-0">
          <InteractiveTiltCard 
            image={{ src: optimizedBg, alt: "Background" }}
            tiltFactor={15}
            hoverScale={1.05}
            perspective={1000}
            borderRadius={0}
            glareIntensity={0.5}
            glareSize={100}
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none z-[5]"></div>
        </div>

        {/* Date, Guest Name and Table Card Area - Placed to overlap the bottom of the photo */}
        <div className="relative z-10 w-full px-0 flex flex-col items-center -mt-16 mb-6">
          {/* Flowers / Ornaments from Dashboard - Placed at the very edges of the PAGE */}
          {(safeUserModel.guestInfoLeftImage || ornement5) && (
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
              <img 
                src={optimizeImage(safeUserModel.guestInfoLeftImage || ornement5, 400, 70)} 
                className="h-48 md:h-72 w-auto object-contain object-left" 
                alt="" 
                loading="lazy"
              />
            </div>
          )}
          {(safeUserModel.guestInfoRightImage || ornement5) && (
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
              <img 
                src={optimizeImage(safeUserModel.guestInfoRightImage || ornement5, 400, 70)} 
                className="h-48 md:h-72 w-auto object-contain object-right scale-x-[-1]" 
                alt="" 
                loading="lazy"
              />
            </div>
          )}

          <div className="relative w-full flex justify-center px-4">
            {/* Guest Info Block - Back to its original design */}
            <div 
              className="w-full bg-black/60 backdrop-blur-xl rounded-[30px] p-4 border-2 flex flex-col items-center shadow-[0_0_30px_rgba(0,0,0,0.5)] relative group z-20 mx-auto max-w-[90%]"
              style={{ borderColor: `${colors.primary}cc` }}
            >
              <div className="flex items-center space-x-4 w-full px-2">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white/20 shadow-lg flex-shrink-0"
                  style={{ background: `linear-gradient(to br, ${colors.primary}, ${colors.secondary})` }}
                >
                  {safeInvite.nom.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-white tracking-tight truncate leading-tight">
                    {safeInvite.nom}
                  </h2>
                  <div className="flex items-center space-x-3 mt-0.5">
                    <div className="flex items-center space-x-1.5 text-white/80">
                      <Gift className="h-3 w-3" style={{ color: colors.accent }} />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Table : {safeInvite.table}</p>
                    </div>
                    {safeInvite.etat === 'couple' && (
                      <div className="flex items-center space-x-1 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                        <Heart className="h-2.5 w-2.5 text-rose-400 fill-rose-400" />
                        <span className="text-[9px] font-black text-white uppercase tracking-tighter">Couple</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT SECTION (Rounded container, independent section) */}
      <div className="relative z-10 flex justify-center mt-12 px-4">
        <div className="bg-white rounded-t-[120px] rounded-b-none w-full max-w-lg p-8 text-center shadow-[0_10px_40px_rgba(0,0,0,0.1)]">
          <div className="space-y-6">
            
            <RevealOnScroll className="relative">
              {/* Circular Couple Photo */}
              <div className="relative inline-block mb-8">
                <div 
                  className="absolute inset-0 rounded-full blur-2xl"
                  style={{ background: `linear-gradient(to br, ${colors.primary}33, ${colors.secondary}33)` }}
                ></div>
                <BorderRotate
                  borderRadius={100}
                  borderWidth={3}
                  animationSpeed={3}
                  gradientColors={{
                    primary: colors.primary,
                    secondary: colors.secondary,
                    accent: colors.accent || '#ffffff'
                  }}
                  backgroundColor="#ffffff"
                  className="relative z-10 -mt-24 p-[2px]"
                >
                  <img 
                    src={optimizeImage(safeUserModel.invitationPhoto || photoCouple, 400, 70)} 
                    className="w-48 h-48 rounded-full object-cover shadow-2xl" 
                    alt="Couple" 
                    loading="lazy"
                  />
                </BorderRotate>
              </div>

              {/* Title Style as requested */}
              <h1 
                className="text-3xl font-luxury font-medium leading-tight mb-8"
                style={{ color: colors.primary }}
              >
                {safeUserModel.title}
              </h1>

              {/* Ornement supérieur */}
              <div className="flex justify-center mb-6">
                <img src={ornement5} className="h-12 opacity-80" alt="" />
              </div>

              {/* Reduced text size and handled BBCode/HTML with Typewriter effect */}
              <div className="flex flex-col items-center justify-center w-full">
                <TypewriterWithPen 
                  className="text-base md:text-lg text-slate-700 leading-relaxed font-poppins px-4 max-w-md"
                  penImage={plume}
                  speed={80}
                  htmlContent={(safeUserModel.invitationText || '')
                    .replace(/\[b\]/g, '<strong>').replace(/\[\/b\]/g, '</strong>')
                    .replace(/\[color=(.*?)\]/g, `<span style="color: $1">`).replace(/\[\/color\]/g, '</span>')}
                />
                
                {/* Ornement inférieur après le texte */}
                <div className="mt-8 flex justify-center">
                  <img src={ornement6} className="h-12 opacity-80" alt="" />
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </div>

      {/* UNIFIED COUNTDOWN & MAPS CONTAINER (Image 1 Style - Resized) */}
      <div className="relative z-10 flex justify-center mt-12 px-4">
        <div 
          className="w-full max-w-lg bg-black/40 backdrop-blur-xl border-2 py-8 px-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center rounded-[50px]"
          style={{ borderColor: `${colors.primary}40` }}
        >
          <div className="w-full space-y-8">
            
            {/* Countdown Circles */}
            <div className="space-y-6">
              <h2 
                className="text-center font-bold tracking-[0.4em] text-[10px] uppercase"
                style={{ color: colors.primary }}
              >
                COMING SOON
              </h2>
              
              <CountdownTimer targetDate={targetEventDate} colors={colors} />
            </div>

            {/* 3 Photos with JJ, MM, AA (Image 1 Style) */}
            <RevealOnScroll className="grid grid-cols-3 gap-4 w-full">
              {[
                { img: safeUserModel.eventPhoto1 || photoCouple, val: eventDay },
                { img: safeUserModel.eventPhoto2 || photoCouple, val: eventMonth },
                { img: safeUserModel.eventPhoto3 || photoCouple, val: eventYear }
              ].map((item, i) => (
                <div key={i} className="relative aspect-[3/4.2] overflow-hidden shadow-2xl border border-white/10">
                  <img 
                    src={optimizeImage(item.img, 300, 60)} 
                    className="w-full h-full object-cover" 
                    alt="" 
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-luxury text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                      {item.val}
                    </span>
                  </div>
                </div>
              ))}
            </RevealOnScroll>

            {/* MAPS & LOCATION (Image 1 Style) */}
            <RevealOnScroll className="space-y-6 pt-2">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-white/20 blur-lg animate-pulse"></div>
                  <div className="w-14 h-14 bg-white/5 flex items-center justify-center border border-white/10 shadow-xl relative animate-bounce-slow">
                    <MapPin className="h-7 w-7 text-white animate-pulse" />
                  </div>
                </div>
                
                <HolographicCard className="text-center p-8 w-full">
                   <h3 className="text-xl font-bold tracking-tight text-white uppercase mb-4">Lieu de réception</h3>
                   <p className="text-lg text-white font-medium mb-2">{safeUserModel.eventLocation}</p>
                   {safeUserModel.eventAddress && (
                     <p className="text-sm text-white/70 font-normal mb-6">{safeUserModel.eventAddress}</p>
                   )}
                   <div className="flex items-center justify-center space-x-2" style={{ color: colors.primary }}>
                     <Clock className="h-5 w-5 animate-spin-slow" />
                     <p className="font-bold text-xl">{safeUserModel.eventTime || '18h30'}</p>
                   </div>
                 </HolographicCard>

                <div className="w-full flex flex-col items-center space-y-4">
                  <button 
                    onClick={() => {
                      const query = safeUserModel.eventAddress || safeUserModel.eventLocation;
                      const url = /iPhone|iPad|iPod/.test(navigator.userAgent) 
                        ? `maps://?q=${encodeURIComponent(query)}`
                        : `https://www.google.com/maps?q=${encodeURIComponent(query)}`;
                      window.open(url, '_blank');
                    }}
                    className="w-full py-5 text-white rounded-[30px] font-black text-xs shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex items-center justify-center space-x-3 hover:scale-[1.05] transition-all duration-300 relative overflow-hidden group border border-white/20 active:scale-95"
                    style={{ 
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                      boxShadow: `0 15px 35px -5px ${colors.primary}60`
                    }}
                  >
                    {/* Animated shine effect */}
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"></div>
                    
                    <div className="bg-white/20 p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <span className="uppercase tracking-[0.2em] drop-shadow-md">Ouvrir dans Google Maps</span>
                  </button>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Cliquez pour l'itinéraire</p>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </div>

      {/* Galerie Focus Rail - Pleine Largeur */}
      <div className="relative z-10 w-full mt-12 overflow-hidden">
        <FocusRail 
          items={focusRailItems}
          autoPlay={true}
          loop={true}
          className="h-[500px] md:h-[600px]"
          accentColor={colors.primary}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto px-4 mt-12 space-y-12">
        {/* Confirmation & RSVP (Image 1 style) */}
        <RevealOnScroll className="space-y-6 flex flex-col items-center">
          <ShinyButton 
            onClick={handleConfirmation}
            primaryColor={colors.primary}
            secondaryColor={colors.secondary}
          >
            <div className="flex items-center gap-3">
              {isConfirmed ? (
                <Check className="w-6 h-6 flex-shrink-0 text-emerald-400" />
              ) : (
                <Users className="w-6 h-6 flex-shrink-0" />
              )}
              <span className="text-white text-base md:text-lg font-bold tracking-wider whitespace-nowrap">
                {isConfirmed ? 'PRÉSENCE CONFIRMÉE' : 'CONFIRMER MA PRÉSENCE'}
              </span>
            </div>
          </ShinyButton>

          {/* Drink Selection */}
        <BorderRotate
          borderRadius={40}
          borderWidth={2}
          animationSpeed={5}
          gradientColors={{
            primary: colors.primary,
            secondary: colors.secondary,
            accent: colors.accent || '#ffffff'
          }}
          backgroundColor="transparent"
          className="w-full"
        >
          <div 
            className="w-full rounded-[40px] p-8 text-white shadow-2xl h-full"
            style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.secondary})` }}
          >
            <div className="flex flex-col items-center text-center space-y-4 mb-8">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                <Wine className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Choix de boisson</h3>
                <p className="text-sm text-white/70 mt-2">
                  Sélectionnez votre boisson préférée pour célébrer avec nous.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {safeUserModel.drinkOptions.map((drink) => (
                <button
                  key={drink}
                  onClick={() => handleDrinkSelection(drink)}
                  className={`flex items-center space-x-1.5 px-2 py-2.5 rounded-xl transition-all text-left group h-full ${
                    selectedDrink === drink
                      ? 'bg-white shadow-lg ring-2 ring-white scale-[1.02]'
                      : 'bg-white text-slate-800 hover:bg-white/90'
                  }`}
                  style={{ color: selectedDrink === drink ? colors.primary : undefined }}
                >
                  <Wine 
                    className="h-3.5 w-3.5 flex-shrink-0" 
                    style={{ color: selectedDrink === drink ? colors.primary : '#94a3b8' }} 
                  />
                  <span className="text-[10px] font-bold leading-tight break-words uppercase">{drink}</span>
                </button>
              ))}
            </div>
          </div>
        </BorderRotate>
        </RevealOnScroll>

        {/* QR CODE SECTION (As per Image) */}
        <RevealOnScroll className="relative">
          <BorderRotate
            borderRadius={40}
            borderWidth={2}
            animationSpeed={6}
            gradientColors={{
              primary: colors.primary,
              secondary: colors.secondary,
              accent: colors.accent || '#ffffff'
            }}
            backgroundColor="transparent"
            className="w-full"
          >
            <div 
              className="bg-black/40 backdrop-blur-xl rounded-[40px] p-8 shadow-2xl flex flex-col items-center h-full"
            >
              <div className="flex items-center space-x-3 mb-8">
                <QrCode className="h-6 w-6" style={{ color: colors.primary }} />
                <h3 className="text-xl font-bold" style={{ color: colors.primary }}>Code d'Invitation</h3>
              </div>

              <div className="bg-white p-6 rounded-[30px] shadow-inner mb-8 w-full max-w-[240px] aspect-square flex items-center justify-center">
                {qrCodeDataUrl ? (
                  <img src={qrCodeDataUrl} className="w-full h-full object-contain" alt="QR Code" />
                ) : (
                  <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl" />
                )}
              </div>

              <button
                  onClick={downloadQRCode}
                  className="w-full py-5 rounded-[30px] font-black text-xs shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex items-center justify-center space-x-3 hover:scale-[1.05] transition-all duration-300 relative overflow-hidden group border border-white/20 active:scale-95 text-white"
                  style={{ 
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    boxShadow: `0 15px 35px -5px ${colors.primary}60`
                  }}
                >
                {/* Animated shine effect */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"></div>
                
                <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Download className="h-5 w-5" />
                </div>
                <span className="uppercase tracking-[0.2em] drop-shadow-md">Télécharger QR Code</span>
              </button>
            </div>
          </BorderRotate>
        </RevealOnScroll>

        {/* FOOTER (As per Image) */}
        <div className="pt-8 pb-12 flex justify-center">
          <div className="bg-white/90 backdrop-blur-md rounded-full px-6 py-3 flex items-center space-x-2 shadow-xl border border-white/20">
            <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
            <p className="text-slate-600 text-xs font-medium">
              Réalisé par <a 
                href="https://www.furaha-digital.net/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-bold hover:underline transition-all"
                style={{ color: colors.primary }}
              >
                Furaha Digital
              </a>
            </p>
            <Sparkles className="h-3 w-3 text-amber-400" />
          </div>
        </div>
      </div>

      {/* FULL SCREEN PHOTO VIEWER (Scrollable) */}
      {selectedGalleryPhoto && (
        <div className="fixed inset-0 z-[110] bg-black/95 animate-fade-in">
          <button 
            onClick={() => setSelectedGalleryPhoto(null)}
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white z-[120] hover:bg-white/20 transition-colors"
          >
            <X className="h-8 w-8" />
          </button>
          
          <div className="h-full w-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
            {galleryPhotos.map((photo, i) => (
              <div key={i} className="flex-shrink-0 w-full h-full flex items-center justify-center snap-center p-4">
                <img 
                  src={optimizeImage(photo, 1200, 80)} 
                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-zoom-in" 
                  alt={`Gallery View ${i}`} 
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          
          <div className="absolute bottom-10 left-0 right-0 flex justify-center space-x-2 z-[120]">
            {galleryPhotos.map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full transition-colors ${
                  galleryPhotos[i] === selectedGalleryPhoto ? 'bg-purple-500' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* FLOATING CONTROLS (Music, Notifications & Guest Book) - DESIGN COMPACT */}
      <div className="fixed bottom-8 right-4 z-50 flex flex-col space-y-2">
        {/* MUSIC CONTROL BUTTON (COMPACT) */}
        {safeUserModel.backgroundMusic && (
          <button 
            onClick={toggleMute}
            className={`w-10 h-10 rounded-full shadow-md flex items-center justify-center text-white border border-white/50 backdrop-blur-md transform hover:scale-105 transition-all active:scale-95 relative ${
              isMusicMuted ? 'bg-slate-800/80' : ''
            }`}
            style={{ 
              background: isMusicMuted ? undefined : `linear-gradient(to br, ${colors.primary}, ${colors.secondary})`
            }}
          >
            {isMusicMuted ? (
              <VolumeX className="h-5 w-5 text-white" />
            ) : (
              <Volume2 className={`h-5 w-5 text-white ${isMusicPlaying ? 'animate-pulse' : ''}`} />
            )}
          </button>
        )}

        {/* BOUTON NOTIFICATIONS (COMPACT) */}
        <button 
          onClick={async () => {
            console.log('=== Manual notification button clicked ===');
            setShowNotificationModal(true);
          }}
          className="w-10 h-10 rounded-full shadow-md flex items-center justify-center text-white border border-white/50 backdrop-blur-md transform hover:scale-105 transition-all active:scale-95 relative"
          style={{ 
            background: `linear-gradient(to br, ${colors.secondary}, ${colors.primary})`,
            backgroundColor: colors.secondary // Fallback
          }}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {token && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center border border-white text-[10px] font-bold shadow-sm">
              ✓
            </div>
          )}
        </button>
        
        {/* BOUTON LIVRE D'OR (COMPACT + EFFETS ATTRACTIFS) */}
        <div className="relative group">
          {/* Contour lumineux tournant */}
          <div className="absolute inset-[-4px] rounded-full overflow-hidden pointer-events-none">
            <div 
              className="absolute inset-0 animate-spin-slow"
              style={{ 
                background: `conic-gradient(from 0deg, transparent 70%, ${colors.primary}, ${colors.secondary})`,
                animationDuration: '3s'
              }}
            ></div>
            <div className="absolute inset-[2px] bg-slate-50/10 backdrop-blur-sm rounded-full"></div>
          </div>
          
          <button 
            onClick={() => setShowGuestBook(true)}
            className="w-10 h-10 rounded-full shadow-md flex items-center justify-center text-white border border-white/50 backdrop-blur-md transform hover:scale-105 transition-all active:scale-95 relative z-10"
            style={{ 
              background: `linear-gradient(to br, ${colors.primary}, ${colors.secondary})`,
              backgroundColor: colors.primary // Fallback
            }}
          >
            <BookOpen className="h-5 w-5 text-white" />
            {guestBookMessages.length > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold border border-white shadow-sm animate-bounce">
                {guestBookMessages.length}
              </div>
            )}
            
            {/* Petit sparkle en bas à gauche */}
            <div className="absolute -bottom-1 -left-1 text-white opacity-80">
              <Sparkles className="h-3 w-3" style={{ color: colors.secondary }} />
            </div>
          </button>
        </div>
      </div>

      {/* GUEST BOOK MODAL (Ultra Modern Mode) */}
      {showGuestBook && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowGuestBook(false)}></div>
          <div className="relative bg-[#faf9f6] w-full max-w-lg h-[88vh] rounded-[50px] shadow-[0_30px_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-zoom-in border border-white/30">
            {/* Ultra Premium Artistic Header (Rectangular & Compact) */}
            <div className="relative h-36 flex-shrink-0 overflow-hidden">
              <img 
                src={optimizeImage(safeUserModel.invitationPhoto || photoCouple, 800, 80)} 
                className="w-full h-full object-cover scale-105"
                alt="Header"
                loading="lazy"
              />
              {/* Clean artistic overlay without bottom fade */}
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              
              <div className="absolute inset-0 p-6 flex items-center justify-between text-white">
                <div className="flex items-center space-x-4">
                  <div className="relative group">
                    <div className="absolute inset-[-4px] rounded-full bg-white/20 blur-sm"></div>
                    <div className="w-14 h-14 rounded-full border-2 border-white/80 overflow-hidden shadow-xl relative z-10">
                      <img 
                        src={optimizeImage(safeUserModel.invitationPhoto || photoCouple, 150, 60)} 
                        className="w-full h-full object-cover" 
                        alt="" 
                        loading="lazy"
                      />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] text-white/80 uppercase tracking-[0.4em] font-black">Livre d'Or</p>
                    <h3 className="text-2xl font-luxury tracking-tight drop-shadow-lg">Mots Doux & Vœux</h3>
                  </div>
                </div>

                <button 
                  onClick={() => setShowGuestBook(false)}
                  className="p-2.5 bg-white/10 hover:bg-white/30 backdrop-blur-xl rounded-xl transition-all duration-500 border border-white/20 group shadow-lg"
                >
                  <X className="h-5 w-5 group-hover:rotate-180 transition-transform duration-700" />
                </button>
              </div>
            </div>

            {/* Premium Message Area with Texture */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar relative bg-[#faf9f6]">
              {/* Subtle texture overlay */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${motif1})`, backgroundSize: '200px' }}></div>
              
              {guestBookMessages && guestBookMessages.length > 0 ? (
                <div className="relative z-10 pb-4">
                    {guestBookMessages.map((msg, index) => {
                      const isMe = msg.inviteId === inviteId;
                      const initials = (msg.nom || 'Inconnu').split(' ').map((n: any) => n ? n[0] : '').join('').substring(0, 2).toUpperCase();
                      
                      const cardStyles = [
                        { bg: '#ffffff', text: '#5d4037', accent: '#a68a2d', border: '#f3e5f5' }, // Classic Gold (Darker accent)
                        { bg: '#ffffff', text: '#2c3e50', accent: '#2980b9', border: '#e1f5fe' }, // Royal Blue (Darker accent)
                        { bg: '#ffffff', text: '#1b5e20', accent: '#2e7d32', border: '#e8f5e9' }, // Emerald (Darker accent)
                        { bg: '#ffffff', text: '#4a148c', accent: '#7b1fa2', border: '#f3e5f5' }, // Amethyst (Darker accent)
                      ];
                      
                      const style = cardStyles[index % cardStyles.length];

                      return (
                        <div 
                          key={msg.id || index} 
                          className={`flex items-start space-x-4 mb-8 ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'} animate-slide-up`}
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          {/* Premium Avatar with Wax Seal effect */}
                          <div className="flex-shrink-0 mt-2 relative">
                            <div 
                              className={`w-12 h-12 rounded-full flex items-center justify-center text-[10px] font-black shadow-[0_5px_15px_rgba(0,0,0,0.1)] border-2 border-white relative z-10 transform transition-all group-hover:scale-110`}
                              style={{ 
                                background: isMe ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` : `linear-gradient(135deg, ${style.bg}, ${style.border})`,
                                color: isMe ? '#ffffff' : style.text,
                              }}
                            >
                              {initials || '?'}
                            </div>
                            {/* Decorative ring around avatar */}
                            <div className="absolute inset-[-4px] rounded-full border border-dashed opacity-20 animate-spin-slow" style={{ borderColor: isMe ? colors.primary : style.accent }}></div>
                          </div>

                          <div 
                            className={`flex-1 p-7 relative group transition-all duration-500 hover:shadow-2xl ${
                              isMe ? 'rounded-[30px] rounded-tr-none' : 'rounded-[30px] rounded-tl-none'
                            }`}
                            style={{
                              backgroundColor: '#ffffff',
                              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)',
                              border: `2px solid ${isMe ? colors.primary + '60' : style.accent + '60'}`
                            }}
                          >
                            {/* Decorative Corner Element */}
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                              <Feather className="h-8 w-8" style={{ color: isMe ? colors.primary : style.accent }} />
                            </div>

                            <div className="flex justify-between items-center mb-4">
                              <div className="flex flex-col">
                                {!isMe && (
                                  <span 
                                    className="text-[11px] font-black uppercase tracking-[0.2em] mb-1"
                                    style={{ color: style.text }}
                                  >
                                    {msg.nom || 'Invité de marque'}
                                  </span>
                                )}
                                <div className="flex items-center space-x-2 text-[9px] font-bold text-slate-400">
                                  <Clock className="h-2.5 w-2.5" />
                                  <span>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                </div>
                              </div>
                              {/* Wax Seal style icon for sender */}
                              <div className="w-6 h-6 rounded-full flex items-center justify-center opacity-20" style={{ backgroundColor: isMe ? colors.primary : style.accent }}>
                                <Heart className="h-3 w-3 fill-current" style={{ color: 'white' }} />
                              </div>
                            </div>
                            
                            <p className={`text-[15px] font-medium leading-relaxed italic font-serif ${isMe ? 'text-slate-800' : 'text-slate-700'}`}>
                              "{msg.message}"
                            </p>
                            
                            {/* Subtle accent line at the bottom */}
                            <div 
                              className="absolute bottom-0 left-8 right-8 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                              style={{ background: `linear-gradient(to right, transparent, ${isMe ? colors.primary : style.accent}, transparent)` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 relative z-10">
                  <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl mb-8 border border-slate-50 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-slate-50/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <BookOpen className="h-16 w-16 opacity-10" />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-40 text-center px-12 leading-loose">Écrivez un mot précieux pour les futurs mariés</p>
                </div>
              )}
            </div>

            {/* Luxury Input Area (Refined) */}
            <div className="p-6 bg-white border-t border-slate-100 rounded-b-[50px] shadow-[0_-20px_50px_rgba(0,0,0,0.03)] relative z-20">
              <div 
                className="flex items-center space-x-3 p-2 pl-6 rounded-full border-2 transition-all duration-500 bg-slate-50 focus-within:bg-white focus-within:border-slate-200 focus-within:shadow-xl group"
                style={{ borderColor: '#f1f5f9' }}
              >
                <textarea
                  value={guestMessage}
                  onChange={(e) => setGuestMessage(e.target.value)}
                  placeholder="Écrivez votre message précieux..."
                  className="flex-1 bg-transparent border-none py-3 focus:ring-0 transition-all resize-none h-14 text-sm font-medium text-slate-800 placeholder:text-slate-400 font-serif"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isSubmittingMessage || !guestMessage.trim()}
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 disabled:opacity-30 hover:scale-105 relative overflow-hidden flex-shrink-0"
                  style={{ 
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    color: '#ffffff'
                  }}
                >
                  {isSubmittingMessage ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Send className="h-5 w-5 relative z-10 fill-current group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST MODAL */}
      <ToastModal 
        isOpen={showToastModal.isOpen}
        onClose={() => setShowToastModal({ ...showToastModal, isOpen: false })}
        type={showToastModal.type}
        selectedDrink={showToastModal.drink}
        primaryColor={colors.primary}
        secondaryColor={colors.secondary}
      />

      {/* MODAL DE NOTIFICATION */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay sombre */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              // Fermer le modal sans rien faire et marquer comme vu
              localStorage.setItem('furaha_notification_modal_seen', 'true');
              setShowNotificationModal(false);
            }}
          />
          
          {/* Contenu du modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-slide-up">
            {/* En-tête avec dégradé */}
            <div 
              className="p-6 text-center"
              style={{ 
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` 
              }}
            >
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Ne manquez pas l'événement !</h2>
            </div>
            
            {/* Corps */}
            <div className="p-6">
              {isFCMSupported === false && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-1">Notifications non disponibles</p>
                      <p>Les notifications push ne sont pas prises en charge sur Safari iOS. Utilisez Google Chrome ou un autre navigateur pour activer les rappels.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
                  ⚠️ Erreur : {error}
                </div>
              )}
              
              {token && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
                  ✅ Notifications activées avec succès !
                </div>
              )}
              
              {isFCMSupported !== false && (
                <>
                  <p className="text-slate-600 text-center mb-6">
                    Recevez un rappel automatiquement pour ne pas oublier la date !
                  </p>
                  
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={async () => {
                        localStorage.setItem('furaha_notification_modal_seen', 'true');
                        console.log('=== CLIC SUR BOUTON AUTORISER ===');
                        console.log('inviteId:', inviteId);
                        console.log('inviteDocPath:', inviteDocPath);
                        console.log('invite state:', invite);
                        await requestPermission({ inviteId, inviteDocPath });
                      }}
                      disabled={isNotificationLoading || isFCMSupported === false}
                      className="w-full py-3 px-4 text-white font-semibold rounded-xl shadow-lg transition-all active:scale-95"
                      style={{ 
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` 
                      }}
                    >
                      {isNotificationLoading ? 'Chargement...' : token ? 'Réactiver les rappels' : 'Autoriser les rappels'}
                    </button>
                    
                    <button
                      onClick={() => {
                        localStorage.setItem('furaha_notification_modal_seen', 'true');
                        setShowNotificationModal(false);
                      }}
                      className="w-full py-3 px-4 text-slate-500 font-medium rounded-xl transition-all hover:bg-slate-100"
                    >
                      Plus tard
                    </button>
                  </div>
                </>
              )}
              
              {isFCMSupported === false && (
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="w-full py-3 px-4 text-slate-500 font-medium rounded-xl transition-all hover:bg-slate-100"
                >
                  Fermer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`
        .animate-bounce-slow {
  animation: bounce-slow 3s infinite ease-in-out;
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes vibrate {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }

        .animate-vibrate {
          animation: vibrate 0.3s linear infinite;
          animation-play-state: running;
        }

        .animate-vibrate:hover {
          animation-play-state: paused;
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default InvitationPreview;
