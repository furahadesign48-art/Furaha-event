import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db, storage } from '../config/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Download, 
  Upload, 
  Palette, 
  Type, 
  Calendar, 
  MapPin, 
  Users, 
  Wine, 
  MessageCircle, 
  QrCode,
  Heart,
  Sparkles,
  Camera,
  Check,
  X,
  Trash2,
  Music,
  Plus,
  ChevronUp,
  ChevronDown,
  Hotel,
  Mail,
  Globe,
  Shield,
  Video,
  RefreshCw,
  Building
} from 'lucide-react';
import InvitationPreview from './InvitationPreview';
import AdminPasswordModal from './AdminPasswordModal';
import { UserModel } from '../services/templateService';

declare global {
  interface Window {
    cloudinary: any;
  }
}

interface Accommodation {
  id: string;
  name: string;
  address: string;
  email?: string;
  websiteUrl?: string;
  priceHint?: string;
  badge?: string;
  note?: string;
  orderIndex: number;
  image?: string;
}

interface UsefulAddress {
  id: string;
  name: string;
  address: string;
  icon?: 'plane' | 'train' | 'car' | 'taxi' | 'info';
  details?: string;
  orderIndex: number;
}

interface TemplateData {
  id: string;
  name: string;
  category: string;
  backgroundImage: string;
  patternBackgroundImage?: string;
  guestInfoLeftImage?: string;
  guestInfoRightImage?: string;
  invitationPhoto?: string;
  invitationVideo?: string;
  eventPhotos?: string[];
  eventVideos?: string[];
  eventPhoto1?: string;
  eventPhoto2?: string;
  eventPhoto3?: string;
  eventVenuePhoto?: string;
  invitationTextPhoto?: string;
  invitationTextPhotoTitle?: string;
  invitationTextPhotoSubtitle?: string;
  invitationTextPhoto2?: string;
  invitationTextPhoto2Title?: string;
  invitationTextPhoto2Subtitle?: string;
  invitationTitleSubtitle?: string;
  title: string;
  invitationText: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventAddress?: string;
  eventLat?: number;
  eventLng?: number;
  backgroundMusic?: string;
  drinkOptions: string[];
  features: string[];
  useRichInvitation?: boolean;
  richInvitationHTML?: string;
  accommodationEnabled?: boolean;
  accommodations?: Accommodation[];
  usefulAddressesEnabled?: boolean;
  usefulAddresses?: UsefulAddress[];
  headerSectionBackground?: string;
  textSectionBackground?: string;
  dateLocationSectionBackground?: string;
  gallerySectionBackground?: string;
  rsvpDrinksSectionBackground?: string;
  gamesSectionBackground?: string;
  qrFooterSectionBackground?: string;
  accommodationSectionBackground?: string;
  // Section visibility toggles (header & QR are always visible)
  couplePhotoEnabled?: boolean;
  invitationTextEnabled?: boolean;
  countdownEnabled?: boolean;
  galleryEnabled?: boolean;
  rsvpEnabled?: boolean;
  drinksEnabled?: boolean;
  gamesEnabled?: boolean;
  guestBookEnabled?: boolean;
  notificationEnabled?: boolean;
  fallingDotsEnabled?: boolean;
}

interface TemplateCustomizationProps {
  template: TemplateData;
  onBack: () => void;
  onSave: (customizedTemplate: TemplateData) => void;
}

const TemplateCustomization = ({ template, onBack, onSave }: TemplateCustomizationProps) => {
  const { user } = useAuth();
  const [customTemplate, setCustomTemplate] = useState<TemplateData>(template);
  const [activeTab, setActiveTab] = useState('general');
  const [selectedDrink, setSelectedDrink] = useState('');
  const [guestMessage, setGuestMessage] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [newDrink, setNewDrink] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#f59e0b'); // amber-500
  const [secondaryColor, setSecondaryColor] = useState('#d97706'); // amber-600
  const [accentColor, setAccentColor] = useState('#f43f5e'); // rose-500
  const [selectedLayout, setSelectedLayout] = useState<'default' | 'book' | 'album'>('default');
  const SHOW_LAYOUT_SELECTOR = true;
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [pendingLayout, setPendingLayout] = useState<'default' | 'book' | 'album'>('default');
  const isCurrentUserAdmin = user?.role === 'admin';
  const [selectedTextColor, setSelectedTextColor] = useState('#f59e0b');
  const [showQRInfo, setShowQRInfo] = useState(false);
  const [eventPhotoUrlInputs, setEventPhotoUrlInputs] = useState(['', '', '']);
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [bulkGalleryLinksInput, setBulkGalleryLinksInput] = useState('');
  const [galleryVideoUrlInput, setGalleryVideoUrlInput] = useState('');
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isUploadingGalleryVideo, setIsUploadingGalleryVideo] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const musicFileInputRef = useRef<HTMLInputElement | null>(null);
  const eventPhoto1InputRef = useRef<HTMLInputElement | null>(null);
  const eventPhoto2InputRef = useRef<HTMLInputElement | null>(null);
  const eventPhoto3InputRef = useRef<HTMLInputElement | null>(null);
  const eventVenuePhotoInputRef = useRef<HTMLInputElement | null>(null);
  const accommodationImageInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingLocalMusic, setIsUploadingLocalMusic] = useState(false);
  const [isUploadingLocalMedia, setIsUploadingLocalMedia] = useState<string | null>(null);
  const pendingAccommodationIdRef = useRef<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 2500);
  };
  const wrapSelection = (openTag: string, closeTag: string) => {
    const ta = textAreaRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const val = customTemplate.invitationText || '';
    const before = val.slice(0, start);
    const sel = val.slice(start, end);
    const after = val.slice(end);
    const next = `${before}${openTag}${sel}${closeTag}${after}`;
    handleInputChange('invitationText', next);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = start + openTag.length;
      ta.selectionEnd = end + openTag.length;
    }, 0);
  };
  const clearFormatting = () => {
    const val = customTemplate.invitationText || '';
    const stripped = val
      .replace(/\[b\]/gi, '')
      .replace(/\[\/b\]/gi, '')
      .replace(/\[i\]/gi, '')
      .replace(/\[\/i\]/gi, '')
      .replace(/\[color\s*=#[0-9a-fA-F]{3,6}\]/gi, '')
      .replace(/\[\/color\]/gi, '');
    handleInputChange('invitationText', stripped);
  };

  // Initialiser les couleurs depuis le template au chargement
  // PrioritÃ©: customizations.colors > colors > champs Ã  la racine
  useEffect(() => {
    const tAny = template as any;
    const custoColors = tAny.customizations?.colors;
    const objColors = tAny.colors;
    // Source la plus fiable en prioritÃ©
    const p = custoColors?.primary ?? objColors?.primary ?? tAny.primaryColor ?? '#f59e0b';
    const s = custoColors?.secondary ?? objColors?.secondary ?? tAny.secondaryColor ?? '#d97706';
    const a = custoColors?.accent ?? objColors?.accent ?? tAny.accentColor ?? '#f43f5e';
    setPrimaryColor(p);
    setSecondaryColor(s);
    setAccentColor(a);
    const raw = tAny.customizations?.layout ?? tAny.layout ?? 'default';
    setSelectedLayout(raw === 'book' || raw === 'album' ? raw : 'default');
  }, [template]);

  const handleLayoutSelectorClick = (targetLayout: 'default' | 'book' | 'album') => {
    if (targetLayout === selectedLayout) return;
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

  const tabs = [
    { id: 'general', label: 'Général', icon: Type },
    { id: 'design', label: 'Design', icon: Palette },
    { id: 'colors', label: 'Couleurs', icon: Palette },
    { id: 'event', label: 'Événement', icon: Calendar },
    { id: 'options', label: 'Options', icon: Wine },
    { id: 'music', label: 'Musique', icon: Music }
  ];

  const handleInputChange = (field: keyof TemplateData, value: any) => {
    setCustomTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCloudinaryUpload = (field: keyof TemplateData | 'gallery' | 'galleryVideo' | 'eventPhoto1' | 'eventPhoto2' | 'eventPhoto3' | 'eventVenuePhoto' | 'invitationVideo', accId?: string) => {
    if (!window.cloudinary) {
      showToast('error', 'Le service Cloudinary n\'est pas disponible');
      return;
    }

    const isVideoField = field === 'galleryVideo' || field === 'invitationVideo';
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: 'dogokmf6m',
        uploadPreset: 'Wedding',
        sources: ['local', 'url', ...(isVideoField ? [] : ['camera'])],
        showAdvancedOptions: false,
        cropping: false,
        multiple: field === 'gallery' || field === 'galleryVideo',
        defaultSource: 'local',
        resourceType: isVideoField ? 'video' : 'auto',
        styles: {
          palette: {
            window: '#FFFFFF',
            windowBorder: '#90A0B3',
            tabIcon: '#F59E0B',
            menuIcons: '#5A616A',
            textDark: '#000000',
            textLight: '#FFFFFF',
            link: '#F59E0B',
            action: '#F59E0B',
            inactiveTabIcon: '#0E2F5A',
            error: '#F44235',
            inProgress: '#F59E0B',
            complete: '#20B832',
            sourceBg: '#E4EBF1'
          },
          fonts: {
            default: null,
            "'Poppins', sans-serif": {
              url: 'https://fonts.googleapis.com/css?family=Poppins',
              active: true
            }
          }
        }
      },
      async (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          const url = result.info.secure_url;
          
          if (field === 'gallery') {
            const next = [...(customTemplate.eventPhotos || []), url];
            const updated = { ...customTemplate, eventPhotos: next } as TemplateData;
            setCustomTemplate(updated);
            if (user && customTemplate.id) {
              const modelRef = doc(db, 'users', user.id, 'UserModel', customTemplate.id);
              await setDoc(modelRef, { eventPhotos: next, updatedAt: serverTimestamp() }, { merge: true });
              onSave(updated);
            }
            showToast('success', 'Image ajoutée à la galerie');
          } else if (field === 'galleryVideo') {
            const next = [...(customTemplate.eventVideos || []), url];
            const updated = { ...customTemplate, eventVideos: next } as TemplateData;
            setCustomTemplate(updated);
            if (user && customTemplate.id) {
              const modelRef = doc(db, 'users', user.id, 'UserModel', customTemplate.id);
              await setDoc(modelRef, { eventVideos: next, updatedAt: serverTimestamp() }, { merge: true });
              onSave(updated);
            }
            showToast('success', 'Vidéo ajoutée à la galerie');
          } else if (accId) {
            const list = (customTemplate.accommodations || []).map(a =>
              a.id === accId ? { ...a, image: url } : a
            );
            const updated = { ...customTemplate, accommodations: list } as TemplateData;
            setCustomTemplate(updated);
            if (user && customTemplate.id) {
              try {
                const modelRef = doc(db, 'users', user.id, 'UserModel', customTemplate.id);
                await setDoc(modelRef, { accommodations: list, updatedAt: serverTimestamp() }, { merge: true });
                onSave(updated);
              } catch {}
            }
            showToast('success', 'Image hébergement téléchargée');
          } else {
            handleInputChange(field as keyof TemplateData, url);
            if (user && customTemplate.id && (field === 'eventPhoto1' || field === 'eventPhoto2' || field === 'eventPhoto3' || field === 'eventVenuePhoto' || field === 'invitationTextPhoto' || field === 'invitationTextPhoto2' || field === 'invitationVideo')) {
              const modelRef = doc(db, 'users', user.id, 'UserModel', customTemplate.id);
              await setDoc(modelRef, { [field]: url, updatedAt: serverTimestamp() }, { merge: true });
              onSave({ ...customTemplate, [field]: url });
            }
            showToast('success', isVideoField ? 'Vidéo téléchargée avec succès' : 'Image téléchargée avec succès');
          }
        } else if (error) {
          showToast('error', "Erreur lors du téléchargement. Veuillez réessayer.");
        }
      }
    );

    widget.open();
  };

  const handleLocalMusicUpload = async (file: File) => {
    if (!file) return;
    if (!user || !customTemplate.id) {
      showToast('error', 'Vous devez être connecté');
      return;
    }
    const maxSizeBytes = 6 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      showToast('error', 'Fichier trop volumineux (max 6 Mo)');
      return;
    }
    if (!file.type.startsWith('audio/')) {
      showToast('error', 'Veuillez sélectionner un fichier audio');
      return;
    }
    setIsUploadingLocalMusic(true);
    try {
      const extFromName = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : undefined;
      const ext = extFromName || (file.type === 'audio/mpeg' || file.type === 'audio/mp3' ? 'mp3' : 'm4a');
      const storagePath = `users/${user.id}/templates/${customTemplate.id}/backgroundMusic-${Date.now()}.${ext}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file, { contentType: file.type || 'audio/mpeg' });
      const downloadUrl = await getDownloadURL(storageRef);
      handleInputChange('backgroundMusic', downloadUrl);
      const modelRef = doc(db, 'users', user.id, 'UserModel', customTemplate.id);
      await setDoc(modelRef, { backgroundMusic: downloadUrl, updatedAt: serverTimestamp() }, { merge: true });
      onSave({ ...customTemplate, backgroundMusic: downloadUrl });
      showToast('success', 'Musique téléchargée avec succès');
    } catch (e) {
      showToast('error', 'Erreur lors de la sauvegarde de la musique');
    } finally {
      setIsUploadingLocalMusic(false);
      if (musicFileInputRef.current) musicFileInputRef.current.value = '';
    }
  };

  const handleLocalMediaUpload = async (
    field: 'eventPhoto1' | 'eventPhoto2' | 'eventPhoto3' | 'eventVenuePhoto' | 'accommodationImage',
    file: File
  ) => {
    if (!file) return;
    if (!user || !customTemplate.id) {
      showToast('error', 'Vous devez être connecté');
      return;
    }
    const maxSizeBytes = 6 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      showToast('error', 'Fichier trop volumineux (max 6 Mo)');
      return;
    }
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Veuillez sélectionner une image');
      return;
    }
    const loadingKey =
      field === 'accommodationImage'
        ? `acc:${pendingAccommodationIdRef.current || 'new'}`
        : field;
    setIsUploadingLocalMedia(loadingKey);
    try {
      const extFromName = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : undefined;
      const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
      };
      const ext = extFromName || mimeToExt[file.type] || 'jpg';
      const accId = field === 'accommodationImage' ? pendingAccommodationIdRef.current || 'default' : '';
      const storagePath =
        field === 'accommodationImage'
          ? `users/${user.id}/templates/${customTemplate.id}/accommodations/${accId}-${Date.now()}.${ext}`
          : `users/${user.id}/templates/${customTemplate.id}/${field}-${Date.now()}.${ext}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file, { contentType: file.type || 'image/jpeg' });
      const downloadUrl = await getDownloadURL(storageRef);
      if (field === 'accommodationImage') {
        const accIdToApply = pendingAccommodationIdRef.current;
        const list = (customTemplate.accommodations || []).map(a =>
          a.id === accIdToApply ? { ...a, image: downloadUrl } : a
        );
        const updated = { ...customTemplate, accommodations: list } as TemplateData;
        setCustomTemplate(updated);
        if (user && customTemplate.id) {
          try {
            const modelRef = doc(db, 'users', user.id, 'UserModel', customTemplate.id);
            await setDoc(modelRef, { accommodations: list, updatedAt: serverTimestamp() }, { merge: true });
            onSave(updated);
          } catch {}
        }
        showToast('success', 'Image hébergement téléchargée');
      } else {
        handleInputChange(field as keyof TemplateData, downloadUrl);
        if (user && customTemplate.id) {
          const modelRef = doc(db, 'users', user.id, 'UserModel', customTemplate.id);
          await setDoc(modelRef, { [field]: downloadUrl, updatedAt: serverTimestamp() }, { merge: true });
          onSave({ ...customTemplate, [field]: downloadUrl });
        }
        showToast('success', 'Image téléchargée avec succès');
      }
    } catch (e) {
      showToast('error', 'Erreur lors de la sauvegarde');
    } finally {
      setIsUploadingLocalMedia(null);
      pendingAccommodationIdRef.current = null;
      [
        eventPhoto1InputRef,
        eventPhoto2InputRef,
        eventPhoto3InputRef,
        eventVenuePhotoInputRef,
        accommodationImageInputRef,
      ].forEach(refObj => {
        if (refObj.current) refObj.current.value = '';
      });
    }
  };

  const addDrinkOption = () => {
    if (newDrink.trim() && !customTemplate.drinkOptions.includes(newDrink.trim())) {
      handleInputChange('drinkOptions', [...customTemplate.drinkOptions, newDrink.trim()]);
      setNewDrink('');
    }
  };

  const removeDrinkOption = (index: number) => {
    const newOptions = customTemplate.drinkOptions.filter((_, i) => i !== index);
    handleInputChange('drinkOptions', newOptions);
  };

  const applyEventPhotoViaLink = async (idx: number, url: string) => {
    if (!user || !customTemplate.id) { showToast('error', 'Vous devez être connecté'); return; }
    const field = (idx === 0 ? 'eventPhoto1' : idx === 1 ? 'eventPhoto2' : 'eventPhoto3') as keyof TemplateData;
    
    // Utilisation de la mise à jour fonctionnelle pour éviter les problèmes de concurrence
    setCustomTemplate(prev => {
      const updated = { ...prev, [field]: url };
      // On déclenche la sauvegarde Firestore ici ou après le set state, 
      // mais pour garder la cohérence avec le reste du code on le fait dans le corps de la fonction principale
      return updated;
    });

    const inputs = [...eventPhotoUrlInputs];
    inputs[idx] = url;
    setEventPhotoUrlInputs(inputs);
    
    try {
      const modelRef = doc(db, 'users', user.id, 'UserModel', customTemplate.id);
      await setDoc(modelRef, {
        [field]: url,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // On doit reconstruire l'objet updated pour onSave car le state n'est pas encore mis à jour dans cette closure
      const updatedForSave = { ...customTemplate, [field]: url };
      onSave(updatedForSave);
      
      showToast('success', `Lien appliqué à la photo ${idx + 1}`);
    } catch {
      showToast('error', 'Erreur lors de la sauvegarde du lien');
    }
  };

  const applyAllEventPhotos = async () => {
    if (!user || !customTemplate.id) { showToast('error', 'Vous devez être connecté'); return; }

    const updates: any = {};
    let hasError = false;

    eventPhotoUrlInputs.forEach((url, idx) => {
      const trimmed = url.trim();
      if (trimmed && !/^https?:\/\//i.test(trimmed)) {
        hasError = true;
      }
      const field = idx === 0 ? 'eventPhoto1' : idx === 1 ? 'eventPhoto2' : 'eventPhoto3';
      updates[field] = trimmed;
    });

    if (hasError) {
      showToast('error', 'Veuillez vérifier que tous les liens sont valides (commencent par http:// ou https://)');
      return;
    }

    // Mise à jour locale avec functional update
    setCustomTemplate(prev => ({ ...prev, ...updates }));

    try {
      const modelRef = doc(db, 'users', user.id, 'UserModel', customTemplate.id);
      await setDoc(modelRef, {
        ...updates,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Appel onSave avec les nouvelles valeurs
      onSave({ ...customTemplate, ...updates });
      showToast('success', 'Les 3 photos ont été mises à jour');
    } catch (error) {
      console.error('Erreur sauvegarde photos:', error);
      showToast('error', 'Erreur lors de la sauvegarde');
    }
  };

  const addGalleryPhotoViaLink = async () => {
    const url = galleryUrlInput.trim();
    if (!user || !customTemplate.id) { showToast('error', 'Vous devez être connecté'); return; }
    if (!url || !/^https?:\/\//i.test(url)) { showToast('error', 'Veuillez saisir un lien http(s) valide'); return; }
    const next = [...(customTemplate.eventPhotos || []), url];
    const updated = { ...customTemplate, eventPhotos: next } as TemplateData;
    setCustomTemplate(updated);
    try {
      const modelRef = doc(db, 'users', user.id, 'UserModel', customTemplate.id);
      await setDoc(modelRef, { eventPhotos: next, updatedAt: serverTimestamp() }, { merge: true });
      onSave(updated);
      setGalleryUrlInput('');
      showToast('success', 'Photo ajoutée à la galerie');
    } catch {
      showToast('error', 'Erreur lors de la sauvegarde du lien');
    }
  };

  const addGalleryPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      if (!user) showToast('error', 'Vous devez être connecté pour télécharger une image');
      return;
    }
    if (!file.type.startsWith('image/')) { showToast('error', 'Veuillez sélectionner un fichier image valide'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('error', "L'image ne doit pas dépasser 5MB"); return; }
    try {
      setIsUploadingGallery(true);
      const timestamp = Date.now();
      const fileName = `template-gallery/${user.id}/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      const next = [...(customTemplate.eventPhotos || []), downloadURL];
      const updated = { ...customTemplate, eventPhotos: next } as TemplateData;
      setCustomTemplate(updated);
      const modelRef = doc(db, 'users', user.id, 'UserModel', customTemplate.id);
      await setDoc(modelRef, { eventPhotos: next, updatedAt: serverTimestamp() }, { merge: true });
      onSave(updated);
      showToast('success', 'Image ajoutée à la galerie');
    } catch {
      showToast('error', "Erreur lors du téléchargement de l'image. Veuillez réessayer.");
    } finally {
      setIsUploadingGallery(false);
      if (event.target) event.target.value = '';
    }
  };

  const removeGalleryPhoto = async (idx: number) => {
    if (!user || !customTemplate.id) { showToast('error', 'Vous devez être connecté'); return; }
    const next = (customTemplate.eventPhotos || []).filter((_, i) => i !== idx);
    const updated = { ...customTemplate, eventPhotos: next } as TemplateData;
    setCustomTemplate(updated);
    try {
      const modelRef = doc(db, 'users', user.id, 'UserModel', customTemplate.id);
      await setDoc(modelRef, { eventPhotos: next, updatedAt: serverTimestamp() }, { merge: true });
      onSave(updated);
      showToast('success', 'Photo retirée de la galerie');
    } catch {
      showToast('error', 'Erreur lors de la mise à jour de la galerie');
    }
  };
  
  const addGalleryPhotosViaBulkLinks = async () => {
    if (!user || !customTemplate.id) { showToast('error', 'Vous devez être connecté'); return; }
    const raw = bulkGalleryLinksInput.trim();
    if (!raw) return;
    const parts = raw.split(/[\n,; ]+/).map(s => s.trim()).filter(s => /^https?:\/\//i.test(s));
    if (!parts.length) { showToast('error', 'Aucun lien valide détecté'); return; }
    const existing = new Set(customTemplate.eventPhotos || []);
    const toAdd = parts.filter(p => !existing.has(p));
    const next = [...(customTemplate.eventPhotos || []), ...toAdd];
    const updated = { ...customTemplate, eventPhotos: next } as TemplateData;
    setCustomTemplate(updated);
    try {
      const modelRef = doc(db, 'users', user.id, 'UserModel', customTemplate.id);
      await setDoc(modelRef, { eventPhotos: next, updatedAt: serverTimestamp() }, { merge: true });
      onSave(updated);
      setBulkGalleryLinksInput('');
      showToast('success', `${toAdd.length} lien(s) ajouté(s) à la galerie`);
    } catch {
      showToast('error', 'Erreur lors de la sauvegarde des liens');
    }
  };

  const addGalleryVideoViaLink = async () => {
    const url = galleryVideoUrlInput.trim();
    if (!user || !customTemplate.id) { showToast('error', 'Vous devez être connecté'); return; }
    if (!url || !/^https?:\/\//i.test(url)) { showToast('error', 'Veuillez saisir un lien http(s) valide'); return; }
    const next = [...(customTemplate.eventVideos || []), url];
    const updated = { ...customTemplate, eventVideos: next } as TemplateData;
    setCustomTemplate(updated);
    try {
      const modelRef = doc(db, 'users', user.id, 'UserModel', customTemplate.id);
      await setDoc(modelRef, { eventVideos: next, updatedAt: serverTimestamp() }, { merge: true });
      onSave(updated);
      setGalleryVideoUrlInput('');
      showToast('success', 'Vidéo ajoutée à la galerie');
    } catch {
      showToast('error', 'Erreur lors de la sauvegarde du lien');
    }
  };

  const addGalleryVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      if (!user) showToast('error', 'Vous devez être connecté pour télécharger une vidéo');
      return;
    }
    if (!file.type.startsWith('video/')) { showToast('error', 'Veuillez sélectionner un fichier vidéo valide'); return; }
    if (file.size > 50 * 1024 * 1024) { showToast('error', 'La vidéo ne doit pas dépasser 50MB'); return; }
    try {
      setIsUploadingGalleryVideo(true);
      const timestamp = Date.now();
      const fileName = `template-gallery-videos/${user.id}/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      const next = [...(customTemplate.eventVideos || []), downloadURL];
      const updated = { ...customTemplate, eventVideos: next } as TemplateData;
      setCustomTemplate(updated);
      const modelRef = doc(db, 'users', user.id, 'UserModel', customTemplate.id);
      await setDoc(modelRef, { eventVideos: next, updatedAt: serverTimestamp() }, { merge: true });
      onSave(updated);
      showToast('success', 'Vidéo ajoutée à la galerie');
    } catch {
      showToast('error', "Erreur lors du téléchargement de la vidéo. Veuillez réessayer.");
    } finally {
      setIsUploadingGalleryVideo(false);
      if (event.target) event.target.value = '';
    }
  };

  const removeGalleryVideo = async (idx: number) => {
    if (!user || !customTemplate.id) { showToast('error', 'Vous devez être connecté'); return; }
    const next = (customTemplate.eventVideos || []).filter((_, i) => i !== idx);
    const updated = { ...customTemplate, eventVideos: next } as TemplateData;
    setCustomTemplate(updated);
    try {
      const modelRef = doc(db, 'users', user.id, 'UserModel', customTemplate.id);
      await setDoc(modelRef, { eventVideos: next, updatedAt: serverTimestamp() }, { merge: true });
      onSave(updated);
      showToast('success', 'Vidéo retirée de la galerie');
    } catch {
      showToast('error', 'Erreur lors de la mise à jour de la galerie');
    }
  };

  /* ========= Handlers Hébergements ========= */
  const persistAccommodations = async (nextList: Accommodation[]) => {
    const updated = { ...customTemplate, accommodations: nextList } as TemplateData;
    setCustomTemplate(updated);
    if (user && customTemplate.id) {
      try {
        const modelRef = doc(db, 'users', user.id, 'UserModel', customTemplate.id);
        await setDoc(modelRef, { accommodations: nextList, updatedAt: serverTimestamp() }, { merge: true });
        onSave(updated);
      } catch {}
    }
  };

  const addAccommodation = () => {
    const list = customTemplate.accommodations ? [...customTemplate.accommodations] : [];
    const newAcc: Accommodation = {
      id: 'acc_' + Math.random().toString(36).slice(2, 10),
      name: '',
      address: '',
      email: '',
      websiteUrl: '',
      priceHint: '',
      badge: '',
      note: '',
      orderIndex: list.length
    };
    persistAccommodations([...list, newAcc]);
  };

  const removeAccommodation = (id: string) => {
    const list = (customTemplate.accommodations || []).filter(a => a.id !== id);
    const reordered = list.map((a, i) => ({ ...a, orderIndex: i }));
    persistAccommodations(reordered);
  };

  const updateAccommodation = (id: string, patch: Partial<Accommodation>) => {
    const list = (customTemplate.accommodations || []).map(a =>
      a.id === id ? { ...a, ...patch } : a
    );
    const updated = { ...customTemplate, accommodations: list } as TemplateData;
    setCustomTemplate(updated);
  };

  const reorderAccommodation = (index: number, direction: -1 | 1) => {
    const list = [...(customTemplate.accommodations || [])].sort((a,b)=>a.orderIndex-b.orderIndex);
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= list.length) return;
    [list[index], list[newIdx]] = [list[newIdx], list[index]];
    const reordered = list.map((a, i) => ({ ...a, orderIndex: i }));
    persistAccommodations(reordered);
  };

  /* ========= Handlers Adresses Utiles ========= */
  const persistUsefulAddresses = async (nextList: UsefulAddress[]) => {
    const updated = { ...customTemplate, usefulAddresses: nextList } as TemplateData;
    setCustomTemplate(updated);
    if (user && customTemplate.id) {
      try {
        const modelRef = doc(db, 'users', user.id, 'UserModel', customTemplate.id);
        await setDoc(modelRef, { usefulAddresses: nextList, updatedAt: serverTimestamp() }, { merge: true });
        onSave(updated);
      } catch {}
    }
  };

  const addUsefulAddress = () => {
    const list = customTemplate.usefulAddresses ? [...customTemplate.usefulAddresses] : [];
    const newAddr: UsefulAddress = {
      id: 'ua_' + Math.random().toString(36).slice(2, 10),
      name: '',
      address: '',
      icon: 'info',
      details: '',
      orderIndex: list.length
    };
    persistUsefulAddresses([...list, newAddr]);
  };

  const removeUsefulAddress = (id: string) => {
    const list = (customTemplate.usefulAddresses || []).filter(a => a.id !== id);
    const reordered = list.map((a, i) => ({ ...a, orderIndex: i }));
    persistUsefulAddresses(reordered);
  };

  const updateUsefulAddress = (id: string, patch: Partial<UsefulAddress>) => {
    const list = (customTemplate.usefulAddresses || []).map(a =>
      a.id === id ? { ...a, ...patch } : a
    );
    const updated = { ...customTemplate, usefulAddresses: list } as TemplateData;
    setCustomTemplate(updated);
  };

  const reorderUseful = (index: number, direction: -1 | 1) => {
    const list = [...(customTemplate.usefulAddresses || [])].sort((a,b)=>a.orderIndex-b.orderIndex);
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= list.length) return;
    [list[index], list[newIdx]] = [list[newIdx], list[index]];
    const reordered = list.map((a, i) => ({ ...a, orderIndex: i }));
    persistUsefulAddresses(reordered);
  };

  const handleSave = async () => {
    if (!customTemplate.id || !user) {
      showToast('error', !user ? 'Utilisateur non connecté, reconnectez-vous.' : 'Modèle invalide, retournez à l\'étape précédente.');
      return;
    }

  const modelRef = doc(db, 'users', user.id, 'UserModel', customTemplate.id);

  const safeTemplate: Partial<TemplateData> = {};
  Object.entries(customTemplate as Record<string, unknown>).forEach(([k, v]) => {
    if (typeof v !== 'undefined') (safeTemplate as Record<string, unknown>)[k] = v;
  });

    try {
      await setDoc(modelRef, {
        ...safeTemplate,
        colors: {
          primary: primaryColor,
          secondary: secondaryColor,
          accent: accentColor
        },
        customizations: {
          colors: {
            primary: primaryColor,
            secondary: secondaryColor,
            accent: accentColor
          },
          fonts: {
            title: 'Playfair Display',
            body: 'Inter'
          },
          layout: selectedLayout
        },
        updatedAt: serverTimestamp()
      }, { merge: true });

      const saved: TemplateData & { customizations?: { layout?: string; colors?: any; fonts?: any } } = {
        ...customTemplate,
        customizations: {
          colors: {
            primary: primaryColor,
            secondary: secondaryColor,
            accent: accentColor
          },
          fonts: {
            title: 'Playfair Display',
            body: 'Inter'
          },
          layout: selectedLayout
        }
      };
      onSave(saved as TemplateData);
      setToast({ type: 'success', message: 'Template sauvegardé avec succès !' });
      window.setTimeout(() => setToast(null), 2500);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du template:', error);
      setToast({ type: 'error', message: 'Erreur lors de la sauvegarde du template.' });
      window.setTimeout(() => setToast(null), 2500);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Sous-titre au-dessus du titre
              </label>
              <input
                type="text"
                value={customTemplate.invitationTitleSubtitle || ''}
                onChange={(e) => handleInputChange('invitationTitleSubtitle', e.target.value)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                placeholder="Ex: Nous avons le plaisir de vous inviter à"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Titre de l'invitation
              </label>
              <input
                type="text"
                value={customTemplate.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                placeholder="Ex: Mariage de Sophie & Lucas"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Photo dans la zone de texte
              </label>
              <div className="space-y-2.5 sm:space-y-3">
                {/* Titre de la photo */}
                <div>
                  <label className="block text-xs font-medium mb-0.5 sm:mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    Titre de la photo
                  </label>
                  <input
                    type="text"
                    value={customTemplate.invitationTextPhotoTitle || ''}
                    onChange={(e) => handleInputChange('invitationTextPhotoTitle', e.target.value)}
                    className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 outline-none"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                    placeholder="Ex: Motif de pagne"
                  />
                </div>

                {/* Sous-titre de la photo */}
                <div>
                  <label className="block text-xs font-medium mb-0.5 sm:mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    Sous-titre de la photo
                  </label>
                  <input
                    type="text"
                    value={(customTemplate as any).invitationTextPhotoSubtitle || ''}
                    onChange={(e) => handleInputChange('invitationTextPhotoSubtitle' as any, e.target.value)}
                    className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 outline-none"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                    placeholder="Ex: Notre tradition"
                  />
                </div>

                {/* Lien direct + suppression */}
                <div className="flex space-x-2.5 sm:space-x-3">
                  <input
                    type="text"
                    value={customTemplate.invitationTextPhoto || ''}
                    onChange={(e) => handleInputChange('invitationTextPhoto', e.target.value)}
                    placeholder="https://exemple.com/photo.jpg"
                    className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 outline-none text-xs sm:text-sm"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  {customTemplate.invitationTextPhoto && (
                    <button
                      onClick={() => handleInputChange('invitationTextPhoto', '')}
                      className="p-2.5 sm:p-3 rounded-xl border transition-all duration-200"
                      style={{ borderColor: 'rgba(236,72,153,0.25)', color: 'rgba(255,255,255,0.55)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(236,72,153,0.1)'; e.currentTarget.style.color = '#f9a8d4'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.4)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.25)'; }}
                    >
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  )}
                </div>

                {/* Aperçu et upload */}
                <div className="relative h-20 sm:h-24 rounded-xl border-2 border-dashed transition-all duration-300 group"
                     style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(251,191,36,0.03) 100%)' }}
                     onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.5)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                >
                  {customTemplate.invitationTextPhoto ? (
                    <>
                      <img
                        src={customTemplate.invitationTextPhoto}
                        alt="Aperçu photo texte"
                        className="w-full h-full object-contain rounded-xl"
                      />
                      <button
                        onClick={() => handleInputChange('invitationTextPhoto', '')}
                        className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 p-1 sm:p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: 'rgba(15,23,42,0.9)', color: '#fda4af' }}
                        title="Retirer la photo"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Camera className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1.5 sm:mb-2" style={{ color: 'rgba(255,255,255,0.35)' }} />
                        <p className="text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Aucune photo sélectionnée</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCloudinaryUpload('invitationTextPhoto')}
                    className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-xl transition-all duration-300 font-semibold flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                      color: '#0b0f17',
                      boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 8px 20px -8px rgba(251,191,36,0.55)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5 sm:h-4 sm:w-4 sm:mr-2" />
                    Charger une photo
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Photo 2 dans la zone de texte
              </label>
              <div className="space-y-2.5 sm:space-y-3">
                {/* Titre de la photo 2 */}
                <div>
                  <label className="block text-xs font-medium mb-0.5 sm:mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    Titre de la photo 2
                  </label>
                  <input
                    type="text"
                    value={(customTemplate as any).invitationTextPhoto2Title || ''}
                    onChange={(e) => handleInputChange('invitationTextPhoto2Title' as any, e.target.value)}
                    className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 outline-none"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                    placeholder="Ex: Deuxième motif"
                  />
                </div>

                {/* Sous-titre de la photo 2 */}
                <div>
                  <label className="block text-xs font-medium mb-0.5 sm:mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    Sous-titre de la photo 2
                  </label>
                  <input
                    type="text"
                    value={(customTemplate as any).invitationTextPhoto2Subtitle || ''}
                    onChange={(e) => handleInputChange('invitationTextPhoto2Subtitle' as any, e.target.value)}
                    className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 outline-none"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                    placeholder="Ex: Sous-titre 2"
                  />
                </div>

                {/* Lien direct + suppression */}
                <div className="flex space-x-2.5 sm:space-x-3">
                  <input
                    type="text"
                    value={(customTemplate as any).invitationTextPhoto2 || ''}
                    onChange={(e) => handleInputChange('invitationTextPhoto2' as any, e.target.value)}
                    placeholder="https://exemple.com/photo.jpg"
                    className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 outline-none text-xs sm:text-sm"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  {(customTemplate as any).invitationTextPhoto2 && (
                    <button
                      onClick={() => handleInputChange('invitationTextPhoto2' as any, '')}
                      className="p-2.5 sm:p-3 rounded-xl border transition-all duration-200"
                      style={{ borderColor: 'rgba(236,72,153,0.25)', color: 'rgba(255,255,255,0.55)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(236,72,153,0.1)'; e.currentTarget.style.color = '#f9a8d4'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.4)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.25)'; }}
                    >
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  )}
                </div>

                {/* Aperçu et upload photo 2 */}
                <div className="relative h-20 sm:h-24 rounded-xl border-2 border-dashed transition-all duration-300 group"
                     style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(251,191,36,0.03) 100%)' }}
                     onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.5)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                >
                  {(customTemplate as any).invitationTextPhoto2 ? (
                    <>
                      <img
                        src={(customTemplate as any).invitationTextPhoto2}
                        alt="Aperçu photo texte 2"
                        className="w-full h-full object-contain rounded-xl"
                      />
                      <button
                        onClick={() => handleInputChange('invitationTextPhoto2' as any, '')}
                        className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 p-1 sm:p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: 'rgba(15,23,42,0.9)', color: '#fda4af' }}
                        title="Retirer la photo"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Camera className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1.5 sm:mb-2" style={{ color: 'rgba(255,255,255,0.35)' }} />
                        <p className="text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Aucune photo sélectionnée</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCloudinaryUpload('invitationTextPhoto2')}
                    className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-xl transition-all duration-300 font-semibold flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                      color: '#0b0f17',
                      boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 8px 20px -8px rgba(251,191,36,0.55)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5 sm:h-4 sm:w-4 sm:mr-2" />
                    Charger une photo
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Texte d'invitation
              </label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <button type="button" onClick={() => wrapSelection('[b]', '[/b]')}
                        className="px-2 py-1 rounded-lg text-xs sm:text-sm font-medium transition-all"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.12)'; e.currentTarget.style.color = '#fcd34d'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                >Gras</button>
                <button type="button" onClick={() => wrapSelection('[i]', '[/i]')}
                        className="px-2 py-1 rounded-lg text-xs sm:text-sm font-medium transition-all"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.12)'; e.currentTarget.style.color = '#fcd34d'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                >Italique</button>
                <input type="color" value={selectedTextColor} onChange={(e) => setSelectedTextColor(e.target.value)}
                       className="h-7 w-9 sm:h-9 sm:w-12 p-0.5 rounded-lg cursor-pointer"
                       style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
                <button type="button" onClick={() => wrapSelection(`[color=${selectedTextColor}]`, '[/color]')}
                        className="px-2 py-1 rounded-lg text-xs sm:text-sm font-medium transition-all"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.12)'; e.currentTarget.style.color = '#fcd34d'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                >Couleur</button>
                <button type="button" onClick={clearFormatting}
                        className="ml-auto px-2 py-1 rounded-lg text-xs sm:text-sm font-medium transition-all"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(236,72,153,0.12)'; e.currentTarget.style.color = '#f9a8d4'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                >Réinitialiser</button>
              </div>
              <textarea
                value={customTemplate.invitationText}
                onChange={(e) => handleInputChange('invitationText', e.target.value)}
                rows={5}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 resize-none text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                placeholder="Rédigez votre message d'invitation..."
                ref={textAreaRef}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Nom du template
              </label>
              <input
                type="text"
                value={customTemplate.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                placeholder="Nom de votre template personnalisé"
              />
            </div>
          </div>
        );

      case 'design':
        return (
          <div className="space-y-4 sm:space-y-6">
            {SHOW_LAYOUT_SELECTOR && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  <span className="inline-flex items-center gap-1.5">
                    Type d'invitation (layout)
                    <Shield className="w-3.5 h-3.5" style={{ color: '#fcd34d' }} />
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <button
                    onClick={() => handleLayoutSelectorClick('default')}
                    className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 text-left ${selectedLayout === 'default' ? 'scale-[1.02]' : 'opacity-80 hover:opacity-100 hover:border-amber-400/40'}`}
                    style={{
                      background: selectedLayout === 'default' ? 'rgba(251,191,36,0.10)' : 'rgba(255,255,255,0.03)',
                      borderColor: selectedLayout === 'default' ? 'rgba(251,191,36,0.6)' : 'rgba(255,255,255,0.08)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <span className="text-xs sm:text-sm font-bold text-white">Scroll Classique</span>
                      {selectedLayout === 'default' && <Check className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#fcd34d' }} />}
                    </div>
                    <p className="text-[10px] sm:text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      Défilement vertical premium
                    </p>
                  </button>
                  <button
                    onClick={() => handleLayoutSelectorClick('book')}
                    className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 text-left ${selectedLayout === 'book' ? 'scale-[1.02]' : 'opacity-80 hover:opacity-100 hover:border-amber-400/40'}`}
                    style={{
                      background: selectedLayout === 'book' ? 'rgba(251,191,36,0.10)' : 'rgba(255,255,255,0.03)',
                      borderColor: selectedLayout === 'book' ? 'rgba(251,191,36,0.6)' : 'rgba(255,255,255,0.08)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <span className="text-xs sm:text-sm font-bold text-white">Livre</span>
                      <div className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold tracking-wider uppercase" style={{ background: 'rgba(252,211,77,0.18)', color: '#fcd34d' }}>
                          Nouveau
                        </span>
                        {selectedLayout === 'book' && <Check className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#fcd34d' }} />}
                      </div>
                    </div>
                    <p className="text-[10px] sm:text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      Format livre avec animations
                    </p>
                  </button>
                  <button
                    onClick={() => handleLayoutSelectorClick('album')}
                    className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 text-left ${selectedLayout === 'album' ? 'scale-[1.02]' : 'opacity-80 hover:opacity-100 hover:border-amber-400/40'}`}
                    style={{
                      background: selectedLayout === 'album' ? 'rgba(251,191,36,0.10)' : 'rgba(255,255,255,0.03)',
                      borderColor: selectedLayout === 'album' ? 'rgba(251,191,36,0.6)' : 'rgba(255,255,255,0.08)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <span className="text-xs sm:text-sm font-bold text-white">Album</span>
                      <div className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold tracking-wider uppercase" style={{ background: 'rgba(252,211,77,0.18)', color: '#fcd34d' }}>
                          Nouveau
                        </span>
                        {selectedLayout === 'album' && <Check className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#fcd34d' }} />}
                      </div>
                    </div>
                    <p className="text-[10px] sm:text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      Format album photo livre
                    </p>
                  </button>
                </div>
                <div
                  className="mt-2.5 p-2.5 sm:p-3 rounded-lg flex items-start gap-2"
                  style={{
                    background: isCurrentUserAdmin
                      ? 'rgba(34,197,94,0.08)'
                      : 'rgba(251,191,36,0.05)',
                    border: isCurrentUserAdmin
                      ? '1px solid rgba(34,197,94,0.3)'
                      : '1px solid rgba(251,191,36,0.18)',
                  }}
                >
                  <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: isCurrentUserAdmin ? '#4ade80' : '#fcd34d' }} />
                  {isCurrentUserAdmin ? (
                    <p className="text-[10.5px] sm:text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      ✅ <span style={{ color: '#4ade80', fontWeight: 700 }}>Compte administrateur</span> : changement de format autorisé sans code.
                    </p>
                  ) : (
                    <p className="text-[10.5px] sm:text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      Le <span style={{ color: '#fcd34d', fontWeight: 700 }}>changement de format</span> est soumis à un code d&apos;autorisation administrateur.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Image de fond
              </label>
              <div className="space-y-2.5 sm:space-y-3">
                {/* Lien direct + suppression */}
                <div className="flex space-x-2.5 sm:space-x-3">
                  <input
                    type="text"
                    value={customTemplate.backgroundImage || ''}
                    onChange={(e) => handleInputChange('backgroundImage', e.target.value)}
                    placeholder="https://exemple.com/image.jpg"
                    className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 outline-none text-xs sm:text-sm"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  {customTemplate.backgroundImage && (
                    <button
                      onClick={() => handleInputChange('backgroundImage', '')}
                      className="p-2.5 sm:p-3 rounded-xl border transition-all duration-200"
                      style={{ borderColor: 'rgba(236,72,153,0.25)', color: 'rgba(255,255,255,0.55)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(236,72,153,0.1)'; e.currentTarget.style.color = '#f9a8d4'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.4)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.25)'; }}
                    >
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  )}
                </div>

                <div className="relative h-20 sm:h-24 rounded-xl border-2 border-dashed transition-all duration-300 group"
                     style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(251,191,36,0.03) 100%)' }}
                     onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.5)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                >
                  {customTemplate.backgroundImage ? (
                    <>
                      <img
                        src={customTemplate.backgroundImage}
                        alt="Background preview"
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <button
                        onClick={() => handleInputChange('backgroundImage', '')}
                        className="absolute top-2 right-2 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: 'rgba(15,23,42,0.9)', color: '#fda4af' }}
                        title="Retirer l'image de fond"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Camera className="h-8 w-8 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.35)' }} />
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Aucune image sélectionnée</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCloudinaryUpload('backgroundImage')}
                    className="px-3 py-2 text-sm rounded-xl transition-all duration-300 font-semibold flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                      color: '#0b0f17',
                      boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 8px 20px -8px rgba(251,191,36,0.55)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Charger une image
                  </button>
                  
                  <button
                    onClick={() => handleInputChange('backgroundImage', 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1200')}
                    className="px-3 py-2 text-sm rounded-xl transition-all duration-300 font-semibold"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.1)'; e.currentTarget.style.color = '#fcd34d'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                  >
                    Image par défaut
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
              <div className="flex items-center mb-4">
                <Camera className="h-5 w-5 mr-2" style={{ color: '#fcd34d' }} />
                <h3 className="text-lg font-semibold" style={{ color: '#fcd34d' }}>Téléchargement d'image</h3>
              </div>
              <div className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                <p>• Formats acceptés : JPEG, PNG, WebP</p>
                <p>• Taille maximale : 5MB</p>
                <p>• L'image sera stockée de manière sécurisée</p>
                <p>• Résolution recommandée : 1200x800px minimum</p>
              </div>
            </div>

            <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>Recommandé</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div
                onClick={() => handleInputChange('backgroundImage', 'https://i.pinimg.com/736x/fd/7a/65/fd7a65aca807295846701baaf4e968da.jpg')}
                className="cursor-pointer group"
              >
                <div className="relative h-16 rounded-xl overflow-hidden border-2 transition-all duration-300"
                     style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                     onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <img
                    src="https://i.pinimg.com/736x/fd/7a/65/fd7a65aca807295846701baaf4e968da.jpg"
                    alt="Template 1"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <p className="text-[11px] text-center mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Romantique</p>
              </div>

              <div
                onClick={() => handleInputChange('backgroundImage', 'https://i.pinimg.com/736x/3e/93/bf/3e93bfe0d8a1532054bce013b6f1f07b.jpg')}
                className="cursor-pointer group"
              >
                <div className="relative h-16 rounded-xl overflow-hidden border-2 transition-all duration-300"
                     style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                     onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <img
                    src="https://i.pinimg.com/736x/3e/93/bf/3e93bfe0d8a1532054bce013b6f1f07b.jpg"
                    alt="Template 2"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <p className="text-[11px] text-center mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Élégant</p>
              </div>

              <div
                onClick={() => handleInputChange('backgroundImage', 'https://i.pinimg.com/1200x/4b/ee/84/4bee8478bb54a57537b1c95b366ea5bc.jpg')}
                className="cursor-pointer group"
              >
                <div className="relative h-16 rounded-xl overflow-hidden border-2 transition-all duration-300"
                     style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                     onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <img
                    src="https://i.pinimg.com/1200x/4b/ee/84/4bee8478bb54a57537b1c95b366ea5bc.jpg"
                    alt="Template 3"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <p className="text-[11px] text-center mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Moderne</p>
              </div>

              <div
                onClick={() => handleInputChange('backgroundImage', 'https://i.pinimg.com/736x/1b/3b/b7/1b3bb7268cca9e4a60e7680a249545d6.jpg')}
                className="cursor-pointer group"
              >
                <div className="relative h-16 rounded-xl overflow-hidden border-2 transition-all duration-300"
                     style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                     onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <img
                    src="https://i.pinimg.com/736x/1b/3b/b7/1b3bb7268cca9e4a60e7680a249545d6.jpg"
                    alt="Template 4"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <p className="text-[11px] text-center mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Classique</p>
              </div>

              <div
                onClick={() => handleInputChange('backgroundImage', 'https://i.pinimg.com/736x/21/10/c9/2110c97858e0272bbf004d3772c95dd2.jpg')}
                className="cursor-pointer group"
              >
                <div className="relative h-16 rounded-xl overflow-hidden border-2 transition-all duration-300"
                     style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                     onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <img
                    src="https://i.pinimg.com/736x/21/10/c9/2110c97858e0272bbf004d3772c95dd2.jpg"
                    alt="Texture 1"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <p className="text-[11px] text-center mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Texture</p>
              </div>

              <div
                onClick={() => handleInputChange('backgroundImage', 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?q=80&w=1200&auto=format&fit=crop')}
                className="cursor-pointer group"
              >
                <div className="relative h-16 rounded-xl overflow-hidden border-2 transition-all duration-300"
                     style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                     onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1470770903676-69b98201ea1c?q=80&w=400&auto=format&fit=crop"
                    alt="Bois"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <p className="text-[11px] text-center mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Bois</p>
              </div>

              <div
                onClick={() => handleInputChange('backgroundImage', 'https://images.unsplash.com/photo-1496302662116-35cc4f36dfaa?q=80&w=1200&auto=format&fit=crop')}
                className="cursor-pointer group"
              >
                <div className="relative h-16 rounded-xl overflow-hidden border-2 transition-all duration-300"
                     style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                     onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <img
                    src="https://i.pinimg.com/736x/58/e5/e7/58e5e7042c1d3ee97090114d4081e08e.jpg"
                    alt="Marbre"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <p className="text-[11px] text-center mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Marbre</p>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                fond de l'invitation
              </label>
              <div className="space-y-3">
                {/* Lien direct + suppression */}
                <div className="flex space-x-2.5 sm:space-x-3">
                  <input
                    type="text"
                    value={customTemplate.patternBackgroundImage || ''}
                    onChange={(e) => handleInputChange('patternBackgroundImage', e.target.value)}
                    placeholder="https://exemple.com/motif.jpg"
                    className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 outline-none text-xs sm:text-sm"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  {customTemplate.patternBackgroundImage && (
                    <button
                      onClick={() => handleInputChange('patternBackgroundImage', '')}
                      className="p-2.5 sm:p-3 rounded-xl border transition-all duration-200"
                      style={{ borderColor: 'rgba(236,72,153,0.25)', color: 'rgba(255,255,255,0.55)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(236,72,153,0.1)'; e.currentTarget.style.color = '#f9a8d4'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.4)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.25)'; }}
                    >
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  )}
                </div>

                <div className="relative h-20 rounded-xl border-2 border-dashed transition-all duration-300 group"
                     style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(251,191,36,0.03) 100%)' }}
                     onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.5)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                >
                  {customTemplate.patternBackgroundImage ? (
                    <>
                      <div className="absolute inset-0 rounded-xl" style={{ backgroundImage: `url(${customTemplate.patternBackgroundImage})`, backgroundRepeat: 'repeat', backgroundSize: 'auto' }}></div>
                      <button
                        onClick={() => handleInputChange('patternBackgroundImage', '')}
                        className="absolute top-2 right-2 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: 'rgba(15,23,42,0.9)', color: '#fda4af' }}
                        title="Retirer le motif"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Camera className="h-6 w-6 mx-auto mb-1" style={{ color: 'rgba(255,255,255,0.35)' }} />
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Aucun motif sélectionné</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    'https://i.pinimg.com/736x/bf/f9/e3/bff9e3235564e35dc48d6d56cef45e27.jpg',
                    'https://i.pinimg.com/1200x/77/5c/e1/775ce17116b08099ee61143711399fc6.jpg',
                    'https://i.pinimg.com/736x/76/ee/f9/76eef9788c161d5fd33b055f2f9eb1df.jpg',
                    'https://i.pinimg.com/1200x/55/33/8e/55338e3ed0f63de870b91a8b47fb70a3.jpg'
                  ].map((url, idx) => (
                    <div
                      key={url}
                      onClick={() => handleInputChange('patternBackgroundImage', url)}
                      className={`cursor-pointer group relative rounded-xl transition-all duration-300`}
                    >
                      <div className="relative h-16 rounded-xl overflow-hidden border-2 transition-all duration-300"
                           style={{ borderColor: customTemplate.patternBackgroundImage === url ? 'rgba(251,191,36,0.45)' : 'rgba(255,255,255,0.08)' }}
                           onMouseEnter={(e) => { if (customTemplate.patternBackgroundImage !== url) e.currentTarget.style.borderColor = 'rgba(251,191,36,0.4)'; }}
                           onMouseLeave={(e) => { if (customTemplate.patternBackgroundImage !== url) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                      >
                        <div className="absolute inset-0" style={{ backgroundImage: `url(${url})`, backgroundRepeat: 'repeat' }}></div>
                        {customTemplate.patternBackgroundImage === url && (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.15)' }}>
                            <Check className="h-6 w-6 rounded-full p-1" style={{ background: '#0d1220', color: '#fcd34d', border: '1px solid rgba(255,255,255,0.08)' }} />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-center mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Motif {idx + 1}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCloudinaryUpload('patternBackgroundImage')}
                    className="px-3 py-2 text-sm rounded-xl transition-all duration-300 font-semibold flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                      color: '#0b0f17',
                      boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 8px 20px -8px rgba(251,191,36,0.55)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Charger un motif
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Ornement
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {/* Lien direct + suppression */}
                  <div className="flex space-x-2.5 sm:space-x-3">
                    <input
                      type="text"
                      value={customTemplate.guestInfoLeftImage || ''}
                      onChange={(e) => handleInputChange('guestInfoLeftImage', e.target.value)}
                      placeholder="https://exemple.com/ornement.png"
                      className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 outline-none text-xs sm:text-sm"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                    {customTemplate.guestInfoLeftImage && (
                      <button
                        onClick={() => handleInputChange('guestInfoLeftImage', '')}
                        className="p-2.5 sm:p-3 rounded-xl border transition-all duration-200"
                        style={{ borderColor: 'rgba(236,72,153,0.25)', color: 'rgba(255,255,255,0.55)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(236,72,153,0.1)'; e.currentTarget.style.color = '#f9a8d4'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.4)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.25)'; }}
                      >
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    )}
                  </div>

                  <div className="relative h-20 rounded-xl border-2 border-dashed transition-all duration-300 group"
                       style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(251,191,36,0.03) 100%)' }}
                       onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.5)'; }}
                       onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                  >
                    {customTemplate.guestInfoLeftImage ? (
                      <>
                        <img src={customTemplate.guestInfoLeftImage} alt="Aperçu gauche" className="w-full h-full object-contain rounded-xl" />
                        <button
                          onClick={() => handleInputChange('guestInfoLeftImage', '')}
                          className="absolute top-2 right-2 p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ background: 'rgba(15,23,42,0.9)', color: '#fda4af' }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Camera className="h-6 w-6 mx-auto mb-1" style={{ color: 'rgba(255,255,255,0.35)' }} />
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Aucune image sélectionnée</p>
                        </div>
                      </div>
                    )}
                  </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCloudinaryUpload('guestInfoLeftImage')}
                    className="px-3 py-2 text-sm rounded-xl transition-all duration-300 font-semibold flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                      color: '#0b0f17',
                      boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 8px 20px -8px rgba(251,191,36,0.55)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Charger
                  </button>
                </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      'https://freepngimg.com/thumb/decorations/144328-floral-decoration-wedding-free-hq-image.png',
                      'https://res.cloudinary.com/dn2mip7vl/image/upload/v1765292868/Pngtree_watercolor_flower_yellow_flowers_png_4049363_xqbt0j.png',
                      'https://res.cloudinary.com/dn2mip7vl/image/upload/v1765292867/roses_vm18pz.png',
                      'https://res.cloudinary.com/dn2mip7vl/image/upload/v1765292835/Pngtree_minimalist_green_leaf_corner_border_17921011_zqesc8.png',
                      'https://res.cloudinary.com/dn2mip7vl/image/upload/v1765292769/baguess_or5rzl.png'
                    ].map((url) => (
                      <button
                        key={url}
                        onClick={() => handleInputChange('guestInfoLeftImage', url)}
                        className="relative h-14 rounded-xl overflow-hidden border-2 transition-all duration-300"
                        style={{ borderColor: customTemplate.guestInfoLeftImage === url ? 'rgba(251,191,36,0.45)' : 'rgba(255,255,255,0.08)' }}
                        onMouseEnter={(e) => { if (customTemplate.guestInfoLeftImage !== url) e.currentTarget.style.borderColor = 'rgba(251,191,36,0.4)'; }}
                        onMouseLeave={(e) => { if (customTemplate.guestInfoLeftImage !== url) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                      >
                        <img src={url} alt="Choix ornement gauche" className="w-full h-full object-contain bg-white" />
                        {customTemplate.guestInfoLeftImage === url && (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.15)' }}>
                            <Check className="h-4 w-4 rounded-full p-0.5" style={{ background: '#0d1220', color: '#fcd34d', border: '1px solid rgba(255,255,255,0.08)' }} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Lien direct + suppression */}
                  <div className="flex space-x-2.5 sm:space-x-3">
                    <input
                      type="text"
                      value={customTemplate.guestInfoRightImage || ''}
                      onChange={(e) => handleInputChange('guestInfoRightImage', e.target.value)}
                      placeholder="https://exemple.com/ornement.png"
                      className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 outline-none text-xs sm:text-sm"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                    {customTemplate.guestInfoRightImage && (
                      <button
                        onClick={() => handleInputChange('guestInfoRightImage', '')}
                        className="p-2.5 sm:p-3 rounded-xl border transition-all duration-200"
                        style={{ borderColor: 'rgba(236,72,153,0.25)', color: 'rgba(255,255,255,0.55)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(236,72,153,0.1)'; e.currentTarget.style.color = '#f9a8d4'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.4)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.25)'; }}
                      >
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    )}
                  </div>

                  <div className="relative h-20 rounded-xl border-2 border-dashed transition-all duration-300 group"
                       style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(251,191,36,0.03) 100%)' }}
                       onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.5)'; }}
                       onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                  >
                    {customTemplate.guestInfoRightImage ? (
                      <>
                        <img src={customTemplate.guestInfoRightImage} alt="Aperçu droite" className="w-full h-full object-contain rounded-xl" />
                        <button
                          onClick={() => handleInputChange('guestInfoRightImage', '')}
                          className="absolute top-2 right-2 p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ background: 'rgba(15,23,42,0.9)', color: '#fda4af' }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Camera className="h-6 w-6 mx-auto mb-1" style={{ color: 'rgba(255,255,255,0.35)' }} />
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Aucune image sélectionnée</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCloudinaryUpload('guestInfoRightImage')}
                      className="px-3 py-2 text-sm rounded-xl transition-all duration-300 font-semibold flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                        color: '#0b0f17',
                        boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 8px 20px -8px rgba(251,191,36,0.55)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Charger
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      'https://freepngimg.com/thumb/decorations/144328-floral-decoration-wedding-free-hq-image.png',
                      'https://res.cloudinary.com/dn2mip7vl/image/upload/v1765292868/Pngtree_watercolor_flower_yellow_flowers_png_4049363_xqbt0j.png',
                      'https://res.cloudinary.com/dn2mip7vl/image/upload/v1765292867/roses_vm18pz.png',
                      'https://res.cloudinary.com/dn2mip7vl/image/upload/v1765292835/Pngtree_minimalist_green_leaf_corner_border_17921011_zqesc8.png',
                      'https://res.cloudinary.com/dn2mip7vl/image/upload/v1765292769/baguess_or5rzl.png'
                    ].map((url) => (
                      <button
                        key={url}
                        onClick={() => handleInputChange('guestInfoRightImage', url)}
                        className="relative h-14 rounded-xl overflow-hidden border-2 transition-all duration-300"
                        style={{ borderColor: customTemplate.guestInfoRightImage === url ? 'rgba(251,191,36,0.45)' : 'rgba(255,255,255,0.08)' }}
                        onMouseEnter={(e) => { if (customTemplate.guestInfoRightImage !== url) e.currentTarget.style.borderColor = 'rgba(251,191,36,0.4)'; }}
                        onMouseLeave={(e) => { if (customTemplate.guestInfoRightImage !== url) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                      >
                        <img src={url} alt="Choix ornement droite" className="w-full h-full object-contain bg-white" />
                        {customTemplate.guestInfoRightImage === url && (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.15)' }}>
                            <Check className="h-4 w-4 rounded-full p-0.5" style={{ background: '#0d1220', color: '#fcd34d', border: '1px solid rgba(255,255,255,0.08)' }} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Photo
              </label>
              <div className="space-y-3">
                {/* Lien direct + suppression */}
                <div className="flex space-x-2.5 sm:space-x-3">
                  <input
                    type="text"
                    value={customTemplate.invitationPhoto || ''}
                    onChange={(e) => handleInputChange('invitationPhoto', e.target.value)}
                    placeholder="https://exemple.com/photo.jpg"
                    className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 outline-none text-xs sm:text-sm"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  {customTemplate.invitationPhoto && (
                    <button
                      onClick={() => handleInputChange('invitationPhoto', '')}
                      className="p-2.5 sm:p-3 rounded-xl border transition-all duration-200"
                      style={{ borderColor: 'rgba(236,72,153,0.25)', color: 'rgba(255,255,255,0.55)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(236,72,153,0.1)'; e.currentTarget.style.color = '#f9a8d4'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.4)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.25)'; }}
                    >
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  )}
                </div>

                <div className="relative h-24 rounded-xl border-2 border-dashed transition-all duration-300 flex items-center justify-center group"
                     style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(251,191,36,0.03) 100%)' }}
                     onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.5)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                >
                  {customTemplate.invitationPhoto ? (
                    <>
                      <img src={customTemplate.invitationPhoto} alt="Aperçu photo" className="h-20 w-20 rounded-full object-cover shadow-md" />
                      <button
                        onClick={() => handleInputChange('invitationPhoto', '')}
                        className="absolute top-2 right-2 p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: 'rgba(15,23,42,0.9)', color: '#fda4af' }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center">
                      <Camera className="h-6 w-6 mx-auto mb-1" style={{ color: 'rgba(255,255,255,0.35)' }} />
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Aucune photo sélectionnée</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCloudinaryUpload('invitationPhoto')}
                    className="px-3 py-2 text-sm rounded-xl transition-all duration-300 font-semibold flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                      color: '#0b0f17',
                      boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 8px 20px -8px rgba(251,191,36,0.55)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Charger une photo
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <label className="block text-xs sm:text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Vidéo en-tête (optionnel)
              </label>
              <p className="text-[10px] mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>
                MP4 ou WebM en boucle, sans son. Remplace la photo de fond en haut.
              </p>
              <div className="space-y-3">
                {/* Lien direct + suppression */}
                <div className="flex space-x-2.5 sm:space-x-3">
                  <input
                    type="text"
                    value={(customTemplate as any).invitationVideo || ''}
                    onChange={(e) => handleInputChange('invitationVideo' as any, e.target.value)}
                    placeholder="https://exemple.com/video.mp4"
                    className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 outline-none text-xs sm:text-sm"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  {(customTemplate as any).invitationVideo && (
                    <button
                      onClick={() => handleInputChange('invitationVideo' as any, '')}
                      className="p-2.5 sm:p-3 rounded-xl border transition-all duration-200"
                      style={{ borderColor: 'rgba(236,72,153,0.25)', color: 'rgba(255,255,255,0.55)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(236,72,153,0.1)'; e.currentTarget.style.color = '#f9a8d4'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.4)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.25)'; }}
                    >
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  )}
                </div>

                <div className="relative h-24 rounded-xl border-2 border-dashed transition-all duration-300 flex items-center justify-center group"
                     style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(251,191,36,0.03) 100%)' }}
                     onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.5)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                >
                  {(customTemplate as any).invitationVideo ? (
                    <>
                      <video
                        src={(customTemplate as any).invitationVideo}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="h-20 w-28 rounded-lg object-cover shadow-md"
                      />
                      <button
                        onClick={() => handleInputChange('invitationVideo' as any, '')}
                        className="absolute top-2 right-2 p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: 'rgba(15,23,42,0.9)', color: '#fda4af' }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center">
                      <Video className="h-6 w-6 mx-auto mb-1" style={{ color: 'rgba(255,255,255,0.35)' }} />
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Aucune vidéo sélectionnée</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCloudinaryUpload('invitationVideo')}
                    className="px-3 py-2 text-sm rounded-xl transition-all duration-300 font-semibold flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                      color: '#0b0f17',
                      boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 8px 20px -8px rgba(251,191,36,0.55)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Charger une vidéo
                  </button>
                </div>
              </div>
            </div>

            {/* Section backgrounds */}
            <div className="pt-6 mt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
                <Palette className="h-5 w-5" style={{ color: '#fcd34d' }} />
                Fonds par section
              </h3>
              <div className="space-y-5">
                {[
                  { field: 'headerSectionBackground', label: 'Section Header (Accueil)' },
                  { field: 'textSectionBackground', label: 'Section Texte d\'invitation' },
                  { field: 'dateLocationSectionBackground', label: 'Section Date & Lieu' },
                  { field: 'gallerySectionBackground', label: 'Section Galerie' },
                  { field: 'rsvpDrinksSectionBackground', label: 'Section RSVP & Boissons' },
                  { field: 'gamesSectionBackground', label: 'Section Jeux' },
                  { field: 'qrFooterSectionBackground', label: 'Section QR Code & Footer' },
                  { field: 'accommodationSectionBackground', label: 'Section Hébergements & Adresses Utiles' },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <label className="block text-xs sm:text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                      {label}
                    </label>
                    <div className="space-y-3">
                      {/* Lien direct + suppression */}
                      <div className="flex space-x-2.5 sm:space-x-3">
                        <input
                          type="text"
                          value={(customTemplate as any)[field] || ''}
                          onChange={(e) => handleInputChange(field as keyof TemplateData, e.target.value)}
                          placeholder="https://exemple.com/image.jpg"
                          className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 outline-none text-xs sm:text-sm"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                        {(customTemplate as any)[field] && (
                          <button
                            onClick={() => handleInputChange(field as keyof TemplateData, '')}
                            className="p-2.5 sm:p-3 rounded-xl border transition-all duration-200"
                            style={{ borderColor: 'rgba(236,72,153,0.25)', color: 'rgba(255,255,255,0.55)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(236,72,153,0.1)'; e.currentTarget.style.color = '#f9a8d4'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.4)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.25)'; }}
                          >
                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        )}
                      </div>

                      <div className="relative h-20 rounded-xl border-2 border-dashed transition-all duration-300 group"
                           style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(251,191,36,0.03) 100%)' }}
                           onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.5)'; }}
                           onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                      >
                        {(customTemplate as any)[field] ? (
                          <>
                            <img
                              src={(customTemplate as any)[field]}
                              alt="Background preview"
                              className="w-full h-full object-cover rounded-xl"
                            />
                            <button
                              onClick={() => handleInputChange(field as keyof TemplateData, '')}
                              className="absolute top-2 right-2 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              style={{ background: 'rgba(15,23,42,0.9)', color: '#fda4af' }}
                              title="Retirer l'image de fond"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <Camera className="h-6 w-6 mx-auto mb-1" style={{ color: 'rgba(255,255,255,0.35)' }} />
                              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Aucune image sélectionnée</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleCloudinaryUpload(field as keyof TemplateData)}
                          className="px-3 py-2 text-sm rounded-xl transition-all duration-300 font-semibold flex items-center justify-center"
                          style={{
                            background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                            color: '#0b0f17',
                            boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 8px 20px -8px rgba(251,191,36,0.55)',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Charger une image
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            
          </div>
        );

      case 'colors':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2 sm:mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Couleur principale
              </label>
              <div className="flex items-center space-x-3 sm:space-x-4">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-9 sm:w-16 sm:h-12 rounded-xl cursor-pointer p-0.5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 font-mono text-xs sm:text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  placeholder="#f59e0b"
                />
              </div>
              <p className="text-xs sm:text-sm mt-1.5 sm:mt-2" style={{ color: 'rgba(255,255,255,0.55)' }}>Couleur utilisée pour les éléments principaux et les boutons</p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2 sm:mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Couleur secondaire
              </label>
              <div className="flex items-center space-x-3 sm:space-x-4">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-12 h-9 sm:w-16 sm:h-12 rounded-xl cursor-pointer p-0.5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 font-mono text-xs sm:text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  placeholder="#d97706"
                />
              </div>
              <p className="text-xs sm:text-sm mt-1.5 sm:mt-2" style={{ color: 'rgba(255,255,255,0.55)' }}>Couleur pour les effets de survol et les accents</p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2 sm:mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Couleur d'accent
              </label>
              <div className="flex items-center space-x-3 sm:space-x-4">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-12 h-9 sm:w-16 sm:h-12 rounded-xl cursor-pointer p-0.5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 font-mono text-xs sm:text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  placeholder="#f43f5e"
                />
              </div>
              <p className="text-xs sm:text-sm mt-1.5 sm:mt-2" style={{ color: 'rgba(255,255,255,0.55)' }}>Couleur pour les éléments décoratifs et les icônes</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
              <button
                onClick={() => {
                  setPrimaryColor('#f59e0b');
                  setSecondaryColor('#d97706');
                  setAccentColor('#f43f5e');
                }}
                className="p-3 sm:p-4 rounded-xl border-2 transition-all duration-300"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                <div className="flex space-x-1.5 sm:space-x-2 mb-1.5 sm:mb-2">
                  <div className="w-4.5 h-4.5 sm:w-6 sm:h-6 rounded-full bg-amber-500"></div>
                  <div className="w-4.5 h-4.5 sm:w-6 sm:h-6 rounded-full bg-amber-600"></div>
                  <div className="w-4.5 h-4.5 sm:w-6 sm:h-6 rounded-full bg-rose-500"></div>
                </div>
                <p className="text-xs sm:text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}
                   onMouseEnter={(e) => { e.currentTarget.style.color = '#fcd34d'; }}
                   onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                >Doré & Rose</p>
              </button>

              <button
                onClick={() => {
                  setPrimaryColor('#8b5cf6');
                  setSecondaryColor('#7c3aed');
                  setAccentColor('#ec4899');
                }}
                className="p-3 sm:p-4 rounded-xl border-2 transition-all duration-300"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                <div className="flex space-x-1.5 sm:space-x-2 mb-1.5 sm:mb-2">
                  <div className="w-4.5 h-4.5 sm:w-6 sm:h-6 rounded-full bg-violet-500"></div>
                  <div className="w-4.5 h-4.5 sm:w-6 sm:h-6 rounded-full bg-violet-600"></div>
                  <div className="w-4.5 h-4.5 sm:w-6 sm:h-6 rounded-full bg-pink-500"></div>
                </div>
                <p className="text-xs sm:text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}
                   onMouseEnter={(e) => { e.currentTarget.style.color = '#c4b5fd'; }}
                   onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                >Violet & Rose</p>
              </button>

              <button
                onClick={() => {
                  setPrimaryColor('#10b981');
                  setSecondaryColor('#059669');
                  setAccentColor('#3b82f6');
                }}
                className="p-3 sm:p-4 rounded-xl border-2 transition-all duration-300"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                <div className="flex space-x-1.5 sm:space-x-2 mb-1.5 sm:mb-2">
                  <div className="w-4.5 h-4.5 sm:w-6 sm:h-6 rounded-full bg-emerald-500"></div>
                  <div className="w-4.5 h-4.5 sm:w-6 sm:h-6 rounded-full bg-emerald-600"></div>
                  <div className="w-4.5 h-4.5 sm:w-6 sm:h-6 rounded-full bg-blue-500"></div>
                </div>
                <p className="text-xs sm:text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}
                   onMouseEnter={(e) => { e.currentTarget.style.color = '#6ee7b7'; }}
                   onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                >Émeraude & Bleu</p>
              </button>
            </div>

            <div className="rounded-2xl p-3 sm:p-6" style={{ background: 'rgba(217,70,239,0.06)', border: '1px solid rgba(217,70,239,0.15)' }}>
              <div className="flex items-center mb-2 sm:mb-4">
                <Palette className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" style={{ color: '#e9a4f2' }} />
                <h3 className="text-base sm:text-lg font-semibold" style={{ color: '#e9a4f2' }}>Personnalisation des couleurs</h3>
              </div>
              <p className="text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Personnalisez les couleurs de votre invitation pour qu'elle corresponde parfaitement à votre thème.
                Les modifications s'appliquent en temps réel dans l'aperçu.
              </p>
            </div>
          </div>
        );

      case 'event':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Date de l'événement
                </label>
                <input
                  type="date"
                  value={(() => {
                    if (!customTemplate.eventDate || !customTemplate.eventDate.includes(' ')) return '';
                    const parts = customTemplate.eventDate.split(' ');
                    if (parts.length < 3) return '';
                    const monthMap: { [key: string]: string } = {
                      'janvier': '01', 'fevrier': '02', 'février': '02', 'mars': '03', 'avril': '04', 'mai': '05', 'juin': '06',
                      'juillet': '07', 'aout': '08', 'août': '08', 'septembre': '09', 'octobre': '10', 'novembre': '11', 'decembre': '12', 'décembre': '12',
                      'Janvier': '01', 'Fevrier': '02', 'Février': '02', 'Mars': '03', 'Avril': '04', 'Mai': '05', 'Juin': '06',
                      'Juillet': '07', 'Aout': '08', 'Août': '08', 'Septembre': '09', 'Octobre': '10', 'Novembre': '11', 'Decembre': '12', 'Décembre': '12'
                    };
                    const monthNum = monthMap[parts[1]] || '01';
                    return parts[2] + '-' + monthNum + '-' + parts[0].padStart(2, '0');
                  })()}
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    const formattedDate = date.toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    });
                    handleInputChange('eventDate', formattedDate);
                  }}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 outline-none text-sm"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Heure de l'événement
                </label>
                <input
                  type="time"
                  value={customTemplate.eventTime ? customTemplate.eventTime.replace('h', ':') : ''}
                  onChange={(e) => handleInputChange('eventTime', e.target.value.replace(':', 'h'))}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 outline-none text-sm"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Lieu de l'événement
              </label>
              <input
                type="text"
                value={customTemplate.eventLocation}
                onChange={(e) => handleInputChange('eventLocation', e.target.value)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                placeholder="Nom du lieu (ex: Château de la Loire)"
              />
              <div className="mt-2.5 sm:mt-3">
                <label className="block text-xs font-semibold mb-0.5 sm:mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Adresse de l'événement</label>
                <input
                  type="text"
                  value={customTemplate.eventAddress || ''}
                  onChange={(e) => handleInputChange('eventAddress', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl transition-all duration-200 outline-none text-xs sm:text-sm"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  placeholder="Adresse complète (ex: 123 Rue de la Paix, 75001 Paris)"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-2.5 sm:mt-3">
                <div>
                  <label className="block text-xs font-semibold mb-0.5 sm:mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Latitude (optionnel)</label>
                  <input
                    type="number"
                    value={customTemplate.eventLat ?? ''}
                    onChange={(e) => handleInputChange('eventLat', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    step="0.000001"
                    className="w-full px-3 py-2 rounded-xl transition-all duration-200 outline-none text-xs sm:text-sm"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                    placeholder="Ex: -4.3251"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-0.5 sm:mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Longitude (optionnel)</label>
                  <input
                    type="number"
                    value={customTemplate.eventLng ?? ''}
                    onChange={(e) => handleInputChange('eventLng', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    step="0.000001"
                    className="w-full px-3 py-2 rounded-xl transition-all duration-200 outline-none text-xs sm:text-sm"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                    placeholder="Ex: 15.3136"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Photo de la salle
              </label>
              <div className="space-y-1.5 sm:space-y-2">
                {/* Lien direct + suppression */}
                <div className="flex space-x-2.5 sm:space-x-3">
                  <input
                    type="text"
                    value={customTemplate.eventVenuePhoto || ''}
                    onChange={(e) => handleInputChange('eventVenuePhoto', e.target.value)}
                    placeholder="https://exemple.com/photo.jpg"
                    className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 outline-none text-xs sm:text-sm"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  {customTemplate.eventVenuePhoto && (
                    <button
                      type="button"
                      onClick={() => handleInputChange('eventVenuePhoto', '')}
                      className="p-2.5 sm:p-3 rounded-xl border transition-all duration-200"
                      style={{ borderColor: 'rgba(236,72,153,0.25)', color: 'rgba(255,255,255,0.55)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(236,72,153,0.1)'; e.currentTarget.style.color = '#f9a8d4'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.4)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.25)'; }}
                    >
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  )}
                </div>

                <div className="relative h-24 sm:h-28 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all duration-300"
                     style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(251,191,36,0.03) 100%)' }}
                     onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.5)'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                >
                  {customTemplate.eventVenuePhoto ? (
                    <img src={customTemplate.eventVenuePhoto} alt="Aperçu salle" className="h-full w-full object-cover rounded-lg" />
                  ) : (
                    <div className="text-center">
                      <Building className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-0.5 sm:mb-1" style={{ color: 'rgba(255,255,255,0.35)' }} />
                      <p className="text-[10px] sm:text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Aucune image</p>
                    </div>
                  )}
                  <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ boxShadow: 'inset 0 0 0 2px rgba(251, 191, 36, 0.15)' }} />
                </div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <button
                    type="button"
                    disabled={isUploadingLocalMedia === 'eventVenuePhoto'}
                    onClick={() => eventVenuePhotoInputRef.current?.click()}
                    className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-xl transition-all duration-300 font-semibold flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                      color: '#0b0f17',
                      boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 8px 20px -8px rgba(251,191,36,0.55)',
                    }}
                    onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.filter = 'brightness(1.08)'; }}
                    onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.filter = 'brightness(1)'; }}
                  >
                    {isUploadingLocalMedia === 'eventVenuePhoto' ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5 sm:h-4 sm:w-4 sm:mr-2 animate-spin" />
                        Chargement…
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5 mr-1.5 sm:h-4 sm:w-4 sm:mr-2" />
                        {customTemplate.eventVenuePhoto ? 'Changer la photo' : 'Charger une photo'}
                      </>
                    )}
                  </button>
                  <input
                    ref={eventVenuePhotoInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleLocalMediaUpload('eventVenuePhoto', file);
                    }}
                  />
                  {customTemplate.eventVenuePhoto && (
                    <button
                      type="button"
                      onClick={() => handleInputChange('eventVenuePhoto', '')}
                      className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-xl transition-all duration-300 font-semibold flex items-center justify-center border"
                      style={{
                        borderColor: 'rgba(236, 72, 153, 0.3)',
                        color: '#fda4af',
                        background: 'rgba(236, 72, 153, 0.05)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(236, 72, 153, 0.15)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(236, 72, 153, 0.05)'; }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-3 sm:p-6 border" style={{ background: 'rgba(251,191,36,0.06)', borderColor: 'rgba(251,191,36,0.15)' }}>
              <div className="flex items-center mb-2 sm:mb-4">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" style={{ color: '#fcd34d' }} />
                <h3 className="text-base sm:text-lg font-semibold" style={{ color: '#fcd34d' }}>Informations du lieu</h3>
              </div>
              <p className="text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Assurez-vous que l'adresse est complète et précise pour faciliter l'accès de vos invités.
                Vous pouvez inclure des indications supplémentaires dans le texte d'invitation.
              </p>
            </div>

            {/* ============ HÉBERGEMENTS PROCHES ============ */}
            <div className="pt-4 sm:pt-6 mt-4 sm:mt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center">
                  <Hotel className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" style={{ color: '#fcd34d' }} />
                  <h3 className="text-base sm:text-lg font-semibold" style={{ color: '#ffffff' }}>Hébergements & Adresses Utiles</h3>
                </div>
              </div>

              {/* Toggle Hébergements */}
              <div className="rounded-xl p-3 sm:p-4 border mb-3 sm:mb-4" style={{ background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)', borderColor: 'rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base flex items-center gap-2" style={{ color: '#ffffff' }}>
                      <Hotel className="h-4 w-4" style={{ color: '#fcd34d' }} />
                      Section Hébergements recommandés
                    </h4>
                    <p className="text-xs sm:text-sm mt-0.5 sm:mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      Proposez des hôtels ou chambres d'hôtes à proximité de la salle
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInputChange('accommodationEnabled' as any, !customTemplate.accommodationEnabled)}
                    className="relative w-11 sm:w-12 h-6 sm:h-7 rounded-full transition-colors duration-200 flex-shrink-0 ml-3"
                    style={{ background: customTemplate.accommodationEnabled ? '#f59e0b' : 'rgba(255,255,255,0.12)' }}
                  >
                    <span
                      className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-md transition-transform duration-200"
                      style={{ background: '#ffffff', transform: customTemplate.accommodationEnabled ? 'translateX(20px)' : 'translateX(0)' }}
                    />
                  </button>
                </div>

                {customTemplate.accommodationEnabled && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t space-y-2.5 sm:space-y-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    {(customTemplate.accommodations || []).sort((a,b)=>a.orderIndex-b.orderIndex).map((acc, idx) => (
                      <div key={acc.id} className="rounded-xl p-3 sm:p-4 border space-y-2.5 sm:space-y-3" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(251,191,36,0.14)' }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs sm:text-sm font-bold" style={{ color: '#fcd34d' }}>Hébergement #{idx+1}</div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              disabled={idx===0}
                              onClick={() => reorderAccommodation(idx, -1)}
                              className="p-1 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                              style={{ color: 'rgba(255,255,255,0.55)' }}
                              onMouseEnter={(e) => { if (idx !== 0) e.currentTarget.style.background = 'rgba(251,191,36,0.1)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                            <button
                              type="button"
                              disabled={idx===(customTemplate.accommodations?.length || 0)-1}
                              onClick={() => reorderAccommodation(idx, 1)}
                              className="p-1 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                              style={{ color: 'rgba(255,255,255,0.55)' }}
                              onMouseEnter={(e) => { if (idx !== (customTemplate.accommodations?.length || 0)-1) e.currentTarget.style.background = 'rgba(251,191,36,0.1)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeAccommodation(acc.id)}
                              className="p-1 rounded-lg transition-all duration-200"
                              style={{ color: 'rgba(255,255,255,0.55)' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(236,72,153,0.1)'; e.currentTarget.style.color = '#f9a8d4'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
                              title="Supprimer"
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Nom de l'établissement *</label>
                            <input
                              type="text"
                              value={acc.name}
                              onChange={(e) => updateAccommodation(acc.id, { name: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 outline-none"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                              placeholder="Ex: Hôtel du Parc & Spa"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Adresse complète *</label>
                            <input
                              type="text"
                              value={acc.address}
                              onChange={(e) => updateAccommodation(acc.id, { address: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 outline-none"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                              placeholder="Ex: 123 Av. des Champs-Élysées, 75008 Paris"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-0.5 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                              <Mail className="h-3 w-3" /> Email réservation
                            </label>
                            <input
                              type="email"
                              value={acc.email || ''}
                              onChange={(e) => updateAccommodation(acc.id, { email: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 outline-none"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                              placeholder="reception@hotel-parc.com"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-0.5 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                              <Globe className="h-3 w-3" /> Site web / Booking
                            </label>
                            <input
                              type="url"
                              value={acc.websiteUrl || ''}
                              onChange={(e) => updateAccommodation(acc.id, { websiteUrl: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 outline-none"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                              placeholder="https://..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Tarif indicatif</label>
                            <input
                              type="text"
                              value={acc.priceHint || ''}
                              onChange={(e) => updateAccommodation(acc.id, { priceHint: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 outline-none"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                              placeholder="Ex: ~130€/nuit"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Badge</label>
                            <input
                              type="text"
                              value={acc.badge || ''}
                              onChange={(e) => updateAccommodation(acc.id, { badge: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 outline-none"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                              placeholder="Ex: Partenaire | 5 min"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                              <Camera className="h-3 w-3 inline mr-1" /> Photo de l'établissement
                            </label>
                            {/* Lien direct + suppression */}
                            <div className="flex space-x-2.5 sm:space-x-3 mb-1.5 sm:mb-2">
                              <input
                                type="text"
                                value={acc.image || ''}
                                onChange={(e) => updateAccommodation(acc.id, { image: e.target.value })}
                                placeholder="https://exemple.com/photo.jpg"
                                className="flex-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl transition-all duration-200 outline-none text-[10px] sm:text-xs"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                              />
                              {acc.image && (
                                <button
                                  type="button"
                                  onClick={() => updateAccommodation(acc.id, { image: '' })}
                                  className="p-1.5 sm:p-2 rounded-xl border transition-all duration-200"
                                  style={{ borderColor: 'rgba(236,72,153,0.25)', color: 'rgba(255,255,255,0.55)' }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(236,72,153,0.1)'; e.currentTarget.style.color = '#f9a8d4'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.4)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.25)'; }}
                                >
                                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </button>
                              )}
                            </div>

                            <div className="relative h-20 sm:h-24 rounded-xl border-2 border-dashed transition-all duration-300 group overflow-hidden"
                                 style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(251,191,36,0.03) 100%)' }}
                                 onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.5)'; }}
                                 onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                            >
                              {acc.image ? (
                                <>
                                  <img
                                    src={acc.image}
                                    alt="Photo hébergement"
                                    className="w-full h-full object-cover rounded-xl"
                                  />
                                  <button
                                    onClick={() => updateAccommodation(acc.id, { image: '' })}
                                    className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 p-1 sm:p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    style={{ background: 'rgba(15,23,42,0.9)', color: '#fda4af' }}
                                    title="Retirer la photo"
                                  >
                                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </button>
                                </>
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <div className="text-center">
                                    <Camera className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1.5 sm:mb-2" style={{ color: 'rgba(255,255,255,0.35)' }} />
                                    <p className="text-[10px] sm:text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Aucune photo</p>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="mt-1.5">
                              <button
                                type="button"
                                disabled={isUploadingLocalMedia === `acc:${acc.id}`}
                                onClick={() => {
                                  pendingAccommodationIdRef.current = acc.id;
                                  accommodationImageInputRef.current?.click();
                                }}
                                className="px-2.5 py-1.5 text-[10px] sm:text-xs rounded-xl transition-all duration-300 font-semibold flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{
                                  background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                                  color: '#0b0f17',
                                  boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 6px 16px -6px rgba(251,191,36,0.55)',
                                }}
                                onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.filter = 'brightness(1.08)'; }}
                                onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.filter = 'brightness(1)'; }}
                              >
                                {isUploadingLocalMedia === `acc:${acc.id}` ? (
                                  <>
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    Chargement…
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-3 w-3 mr-1" />
                                    Charger photo
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Note privée (non affichée)</label>
                            <input
                              type="text"
                              value={acc.note || ''}
                              onChange={(e) => updateAccommodation(acc.id, { note: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 outline-none"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                              placeholder="Ex: Prévenir mariage Lucie & Paul"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addAccommodation}
                      className="w-full py-2.5 sm:py-3 rounded-xl border-2 border-dashed transition-all text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2"
                      style={{ borderColor: 'rgba(251,191,36,0.35)', color: '#fcd34d' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.08)'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.5)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.35)'; }}
                    >
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                      Ajouter un hébergement
                    </button>
                  </div>
                )}
              </div>

              {/* Toggle Adresses Utiles */}
              <div className="rounded-xl p-3 sm:p-4 border" style={{ background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)', borderColor: 'rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base flex items-center gap-2" style={{ color: '#ffffff' }}>
                      <MapPin className="h-4 w-4" style={{ color: '#fcd34d' }} />
                      Adresses utiles (gare, aéroport, parking)
                    </h4>
                    <p className="text-xs sm:text-sm mt-0.5 sm:mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      Informations supplémentaires pour les invités en voyage
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInputChange('usefulAddressesEnabled' as any, !customTemplate.usefulAddressesEnabled)}
                    className="relative w-11 sm:w-12 h-6 sm:h-7 rounded-full transition-colors duration-200 flex-shrink-0 ml-3"
                    style={{ background: customTemplate.usefulAddressesEnabled ? '#f59e0b' : 'rgba(255,255,255,0.12)' }}
                  >
                    <span
                      className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-md transition-transform duration-200"
                      style={{ background: '#ffffff', transform: customTemplate.usefulAddressesEnabled ? 'translateX(20px)' : 'translateX(0)' }}
                    />
                  </button>
                </div>

                {customTemplate.usefulAddressesEnabled && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t space-y-2.5 sm:space-y-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    {(customTemplate.usefulAddresses || []).sort((a,b)=>a.orderIndex-b.orderIndex).map((addr, idx) => (
                      <div key={addr.id} className="rounded-xl p-3 sm:p-4 border space-y-2.5" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs sm:text-sm font-bold" style={{ color: '#fcd34d' }}>Adresse utile #{idx+1}</div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button type="button" disabled={idx===0} onClick={() => reorderUseful(idx, -1)} className="p-1 rounded-lg disabled:opacity-30 transition-all duration-200"
                              style={{ color: 'rgba(255,255,255,0.55)' }}
                              onMouseEnter={(e) => { if (idx !== 0) e.currentTarget.style.background = 'rgba(251,191,36,0.1)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" disabled={idx===(customTemplate.usefulAddresses?.length||0)-1} onClick={() => reorderUseful(idx, 1)} className="p-1 rounded-lg disabled:opacity-30 transition-all duration-200"
                              style={{ color: 'rgba(255,255,255,0.55)' }}
                              onMouseEnter={(e) => { if (idx !== (customTemplate.usefulAddresses?.length || 0)-1) e.currentTarget.style.background = 'rgba(251,191,36,0.1)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => removeUsefulAddress(addr.id)} className="p-1 rounded-lg transition-all duration-200"
                              style={{ color: 'rgba(255,255,255,0.55)' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(236,72,153,0.1)'; e.currentTarget.style.color = '#f9a8d4'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Nom *</label>
                            <input type="text" value={addr.name} onChange={(e) => updateUsefulAddress(addr.id, { name: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 outline-none"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                              placeholder="Ex: Aéroport Roissy CDG" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Adresse</label>
                            <input type="text" value={addr.address} onChange={(e) => updateUsefulAddress(addr.id, { address: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 outline-none"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                              placeholder="Adresse ou nom du lieu" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Icône</label>
                            <select value={addr.icon || 'info'} onChange={(e) => updateUsefulAddress(addr.id, { icon: e.target.value as any })}
                              className="w-full px-3 py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 outline-none appearance-none"
                              style={{ background: '#0d1220', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}
                              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                              <option value="info" style={{ background: '#0d1220', color: '#ffffff' }}>ℹ️ Info</option>
                              <option value="plane" style={{ background: '#0d1220', color: '#ffffff' }}>✈️ Avion</option>
                              <option value="train" style={{ background: '#0d1220', color: '#ffffff' }}>🚆 Train</option>
                              <option value="car" style={{ background: '#0d1220', color: '#ffffff' }}>🚗 Voiture / Parking</option>
                              <option value="taxi" style={{ background: '#0d1220', color: '#ffffff' }}>🚕 Taxi</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Détails complémentaires</label>
                            <input type="text" value={addr.details || ''} onChange={(e) => updateUsefulAddress(addr.id, { details: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 outline-none"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                              placeholder="Ex: 45 min de la salle" />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button type="button" onClick={addUsefulAddress}
                      className="w-full py-2.5 sm:py-3 rounded-xl border-2 border-dashed transition-all text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2"
                      style={{ borderColor: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.65)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.08)'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.5)'; e.currentTarget.style.color = '#fcd34d'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
                    >
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                      Ajouter une adresse utile
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 sm:mt-6">
              <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Photos sous la date
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                {[0,1,2].map((idx) => {
                  const field = (idx === 0 ? 'eventPhoto1' : idx === 1 ? 'eventPhoto2' : 'eventPhoto3') as keyof TemplateData;
                  const previewSrc = (customTemplate[field] as string) || customTemplate.eventPhotos?.[idx] || customTemplate.invitationPhoto || customTemplate.backgroundImage;
                  return (
                    <div key={idx} className="space-y-1.5 sm:space-y-2">
                      {/* Lien direct + suppression */}
                      <div className="flex space-x-2.5 sm:space-x-3">
                        <input
                          type="text"
                          value={(customTemplate[field] as string) || ''}
                          onChange={(e) => handleInputChange(field, e.target.value)}
                          placeholder="https://exemple.com/photo.jpg"
                          className="flex-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl transition-all duration-200 outline-none text-[10px] sm:text-xs"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                        {(customTemplate[field] as string) && (
                          <button
                            type="button"
                            onClick={() => handleInputChange(field, '')}
                            className="p-1.5 sm:p-2 rounded-xl border transition-all duration-200"
                            style={{ borderColor: 'rgba(236,72,153,0.25)', color: 'rgba(255,255,255,0.55)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(236,72,153,0.1)'; e.currentTarget.style.color = '#f9a8d4'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.4)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.25)'; }}
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        )}
                      </div>

                      <div className="relative h-16 sm:h-20 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all duration-300"
                           style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(251,191,36,0.03) 100%)' }}
                           onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.5)'; }}
                           onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                      >
                        {previewSrc ? (
                          <img src={previewSrc} alt={`Aperçu ${idx+1}`} className="h-12 w-20 sm:h-16 sm:w-24 object-cover rounded-lg shadow" />
                        ) : (
                          <div className="text-center">
                            <Camera className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-0.5 sm:mb-1" style={{ color: 'rgba(255,255,255,0.35)' }} />
                            <p className="text-[10px] sm:text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Aucune image</p>
                          </div>
                        )}
                        <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ boxShadow: 'inset 0 0 0 2px rgba(251, 191, 36, 0.15)' }} />
                      </div>
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <button
                          type="button"
                          disabled={isUploadingLocalMedia === field}
                          onClick={() => {
                            const refObj =
                              idx === 0 ? eventPhoto1InputRef :
                              idx === 1 ? eventPhoto2InputRef :
                              eventPhoto3InputRef;
                            refObj.current?.click();
                          }}
                          className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-xl transition-all duration-300 font-semibold flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                          style={{
                            background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                            color: '#0b0f17',
                            boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 8px 20px -8px rgba(251,191,36,0.55)',
                          }}
                          onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.filter = 'brightness(1.08)'; }}
                          onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.filter = 'brightness(1)'; }}
                        >
                          {isUploadingLocalMedia === field ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 mr-1.5 sm:h-4 sm:w-4 sm:mr-2 animate-spin" />
                              Chargement…
                            </>
                          ) : (
                            <>
                              <Upload className="h-3.5 w-3.5 mr-1.5 sm:h-4 sm:w-4 sm:mr-2" />
                              Charger photo {idx + 1}
                            </>
                          )}
                        </button>
                        <input
                          ref={
                            idx === 0 ? eventPhoto1InputRef :
                            idx === 1 ? eventPhoto2InputRef :
                            eventPhoto3InputRef
                          }
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void handleLocalMediaUpload(field as any, file);
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              </div>

              <div className="mt-4 sm:mt-6">
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Galerie du couple
                </label>
              <div className="space-y-2.5 sm:space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
                  {(customTemplate.eventPhotos || []).map((src, idx) => (
                    <div key={`${src}-${idx}`} className="relative rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                      <img src={src} alt={`Galerie ${idx+1}`} className="w-full h-20 sm:h-24 object-cover" />
                      <button
                        type="button"
                        onClick={() => removeGalleryPhoto(idx)}
                        className="absolute top-1.5 right-1.5 p-1.5 rounded-full shadow transition-all duration-200"
                        style={{ background: 'rgba(15,23,42,0.9)', color: '#fda4af' }}
                        title="Retirer"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  ))}
                  {!(customTemplate.eventPhotos || []).length && (
                    <div className="text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Aucune photo dans la galerie pour le moment</div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => handleCloudinaryUpload('gallery')}
                    className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-xl transition-all duration-300 font-semibold flex items-center gap-1.5 sm:gap-2"
                    style={{
                      background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                      color: '#0b0f17',
                      boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 8px 20px -8px rgba(251,191,36,0.55)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                  >
                    <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Ajouter des photos à la galerie
                  </button>
                </div>
              </div>
              </div>

              <div className="mt-4 sm:mt-6">
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  <span className="flex items-center gap-1.5"><Video className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: '#fcd34d' }} />Vidéos de la galerie</span>
                </label>
              <div className="space-y-2.5 sm:space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
                  {(customTemplate.eventVideos || []).map((src, idx) => (
                    <div key={`${src}-${idx}`} className="relative rounded-xl overflow-hidden group" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                      <video src={src} className="w-full h-20 sm:h-24 object-cover" muted loop playsInline preload="metadata" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-black/60 backdrop-blur-sm border border-white/25 text-white shadow-lg">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="translate-x-[1px]"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeGalleryVideo(idx)}
                        className="absolute top-1.5 right-1.5 p-1.5 rounded-full shadow transition-all duration-200 opacity-0 group-hover:opacity-100"
                        style={{ background: 'rgba(15,23,42,0.9)', color: '#fda4af' }}
                        title="Retirer"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  ))}
                  {!(customTemplate.eventVideos || []).length && (
                    <div className="text-xs sm:text-sm col-span-2 md:col-span-3" style={{ color: 'rgba(255,255,255,0.45)' }}>Aucune vidéo dans la galerie pour le moment</div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleCloudinaryUpload('galleryVideo')}
                    className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-xl transition-all duration-300 font-semibold flex items-center gap-1.5 sm:gap-2"
                    style={{
                      background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                      color: '#0b0f17',
                      boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 8px 20px -8px rgba(251,191,36,0.55)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                  >
                    <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Ajouter des vidéos
                  </button>
                  <label className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-xl transition-all duration-300 font-semibold flex items-center gap-1.5 sm:gap-2 cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.85)', borderColor: 'rgba(255,255,255,0.12)' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}>
                    {isUploadingGalleryVideo ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" style={{ color: '#fcd34d' }} />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Upload vidéo local
                      </>
                    )}
                    <input type="file" accept="video/*" className="hidden" onChange={addGalleryVideoUpload} disabled={isUploadingGalleryVideo} />
                  </label>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <input
                    type="text"
                    value={galleryVideoUrlInput}
                    onChange={(e) => setGalleryVideoUrlInput(e.target.value)}
                    placeholder="Lien direct vidéo (https://...mp4)"
                    className="flex-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl transition-all duration-200 outline-none text-xs sm:text-sm"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                    onKeyDown={(e) => { if (e.key === 'Enter') addGalleryVideoViaLink(); }}
                  />
                  <button
                    type="button"
                    onClick={addGalleryVideoViaLink}
                    className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 border"
                    style={{ background: 'rgba(251,191,36,0.1)', color: '#fcd34d', borderColor: 'rgba(251,191,36,0.35)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.1)'; }}
                  >
                    Ajouter
                  </button>
                </div>
                <p className="text-[10px] sm:text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Formats supportés : MP4, WebM, MOV. Taille max recommandée : 50MB. Les vidéos sont affichées en mute dans la prévisualisation.
                </p>
              </div>
              </div>
          </div>
        );

      case 'options':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2 sm:mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Options de boissons
              </label>
              
              <div className="space-y-2.5 sm:space-y-3 mb-3 sm:mb-4">
                {customTemplate.drinkOptions.map((drink, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-xl p-3 sm:p-4 border transition-all duration-300 group"
                    style={{ background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)', borderColor: 'rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.25)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                  >
                    <div className="flex items-center">
                      <Wine className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2.5 sm:mr-3" style={{ color: '#fcd34d' }} />
                      <span className="font-medium text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>{drink}</span>
                    </div>
                    <button
                      onClick={() => removeDrinkOption(index)}
                      className="p-1.5 sm:p-2 rounded-lg transition-all duration-200"
                      style={{ color: 'rgba(255,255,255,0.45)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(236,72,153,0.1)'; e.currentTarget.style.color = '#f9a8d4'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
                    >
                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex space-x-2.5 sm:space-x-3">
                <input
                  type="text"
                  value={newDrink}
                  onChange={(e) => setNewDrink(e.target.value)}
                  placeholder="Nouvelle option de boisson"
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 outline-none text-xs sm:text-sm"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  onKeyPress={(e) => e.key === 'Enter' && addDrinkOption()}
                />
                <button
                  onClick={addDrinkOption}
                  className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-300 font-semibold text-xs sm:text-sm flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                    color: '#0b0f17',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 8px 20px -8px rgba(251,191,36,0.55)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Ajouter
                </button>
              </div>
            </div>

            <div className="rounded-2xl p-3 sm:p-6 border" style={{ background: 'rgba(217,70,239,0.06)', borderColor: 'rgba(217,70,239,0.18)' }}>
              <div className="flex items-center mb-2 sm:mb-4">
                <Wine className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" style={{ color: '#e9a4f2' }} />
                <h3 className="text-base sm:text-lg font-semibold" style={{ color: '#e9a4f2' }}>Gestion des boissons</h3>
              </div>
              <p className="text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Personnalisez les options de boissons selon vos préférences. Vos invités pourront 
                sélectionner leur choix directement depuis l'invitation.
              </p>
            </div>

            <div className="rounded-2xl p-3 sm:p-5 sm:p-6 border" style={{ background: 'rgba(251,191,36,0.06)', borderColor: 'rgba(251,191,36,0.18)' }}>
              <div className="flex items-center mb-3 sm:mb-5">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" style={{ color: '#fcd34d' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M15 3v18M3 9h18M3 15h18" /></svg>
                <h3 className="text-base sm:text-lg font-semibold" style={{ color: '#fcd34d' }}>Sections de l'invitation</h3>
              </div>
              <p className="text-xs sm:text-sm mb-4 sm:mb-5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Activez ou désactivez les sections selon vos besoins (Entête et QR Code toujours visibles).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
                {[
                  { field: 'couplePhotoEnabled' as const, label: 'Photo du Couple', icon: '📸' },
                  { field: 'invitationTextEnabled' as const, label: 'Texte d\'invitation', icon: '💌' },
                  { field: 'countdownEnabled' as const, label: 'Compte à rebours + Lieu', icon: '⏰' },
                  { field: 'galleryEnabled' as const, label: 'Galerie Photos', icon: '🖼️' },
                  { field: 'rsvpEnabled' as const, label: 'Confirmation de présence', icon: '✅' },
                  { field: 'drinksEnabled' as const, label: 'Choix des boissons', icon: '🍷' },
                  { field: 'gamesEnabled' as const, label: 'Jeux & Fun', icon: '🎮' },
                  { field: 'guestBookEnabled' as const, label: 'Livre d\'Or', icon: '📖' },
                  { field: 'notificationEnabled' as const, label: 'Bouton Notifications', icon: '🔔' },
                  { field: 'fallingDotsEnabled' as const, label: 'Effet Points Tombants', icon: '✨' },
                ].map(({ field, label, icon }) => {
                  const val = (customTemplate as any)[field] !== false;
                  return (
                    <div
                      key={field}
                      className="flex items-center justify-between rounded-xl p-2.5 sm:p-3 sm:px-4 border transition-all duration-300 group"
                      style={{ background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)', borderColor: 'rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.25)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                    >
                      <div className="flex items-center min-w-0">
                        <span className="mr-1.5 sm:mr-2 text-sm sm:text-base flex-shrink-0">{icon}</span>
                        <span className="font-medium text-[11px] sm:text-sm truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>{label}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleInputChange(field, !val)}
                        className="w-10 sm:w-11 h-6 sm:h-6 rounded-full relative transition-all duration-300 flex-shrink-0 ml-2 active:scale-95"
                        style={{ background: val ? 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)' : 'rgba(255,255,255,0.12)', boxShadow: val ? '0 0 0 1px rgba(251,191,36,0.5), 0 6px 14px -8px rgba(251,191,36,0.6)' : 'inset 0 1px 0 rgba(255,255,255,0.06)' }}
                      >
                        <span
                          className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300"
                          style={{ background: '#ffffff', left: val ? 'calc(100% - 22px)' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'music':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Musique de fond (Lien direct MP3)
              </label>
              <div className="flex space-x-2.5 sm:space-x-3 mb-3 sm:mb-4">
                <input
                  type="text"
                  value={customTemplate.backgroundMusic || ''}
                  onChange={(e) => handleInputChange('backgroundMusic', e.target.value)}
                  placeholder="https://exemple.com/musique.mp3"
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 outline-none text-xs sm:text-sm"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                {customTemplate.backgroundMusic && (
                  <button
                    onClick={() => handleInputChange('backgroundMusic', '')}
                    className="p-2.5 sm:p-3 rounded-xl border transition-all duration-200"
                    style={{ borderColor: 'rgba(236,72,153,0.25)', color: 'rgba(255,255,255,0.55)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(236,72,153,0.1)'; e.currentTarget.style.color = '#f9a8d4'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.4)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.25)'; }}
                  >
                    <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-3 sm:space-x-4">
                <button
                  onClick={() => musicFileInputRef.current?.click()}
                  disabled={isUploadingLocalMusic}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-300 font-semibold flex items-center justify-center text-xs sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                    color: '#0b0f17',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 8px 20px -8px rgba(251,191,36,0.55)',
                  }}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.filter = 'brightness(1.08)'; }}
                  onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.filter = 'brightness(1)'; }}
                >
                  <Upload className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                  {isUploadingLocalMusic ? 'Chargement…' : 'Télécharger une musique'}
                </button>
                <input
                  ref={musicFileInputRef}
                  type="file"
                  accept="audio/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleLocalMusicUpload(file);
                  }}
                />
              </div>
            </div>

            <div className="rounded-2xl p-3 sm:p-6 border" style={{ background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.2)' }}>
              <div className="flex items-center mb-2 sm:mb-4">
                <Music className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" style={{ color: '#93c5fd' }} />
                <h3 className="text-base sm:text-lg font-semibold" style={{ color: '#93c5fd' }}>Conseils Musique</h3>
              </div>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <p>• Utilisez des fichiers MP3 légers pour un chargement rapide.</p>
                <p>• La musique se lancera automatiquement dès que l'invité commencera à défiler la page.</p>
                <p>• Un bouton de contrôle du son sera visible pour l'invité.</p>
              </div>
            </div>

            {customTemplate.backgroundMusic && (
              <div className="p-3 sm:p-4 rounded-xl border" style={{ background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)', borderColor: 'rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
                <p className="text-[10px] sm:text-xs font-bold mb-1.5 sm:mb-2 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.55)' }}>Aperçu Audio</p>
                <audio controls src={customTemplate.backgroundMusic} className="w-full h-8 sm:h-10" />
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  useEffect(() => {
    if (!user || !template?.id) return;
    const modelRef = doc(db, 'users', user.id, 'UserModel', template.id);
    (async () => {
      try {
        const snap = await getDoc(modelRef);
        if (snap.exists()) {
          const data = snap.data() as Partial<TemplateData>;
          setCustomTemplate(prev => ({ ...prev, ...data }));
          setEventPhotoUrlInputs([
            (data.eventPhoto1 as string) || '',
            (data.eventPhoto2 as string) || '',
            (data.eventPhoto3 as string) || ''
          ]);
          // SYNCHRONISER les couleurs et le layout depuis Firestore (source de vÃ©ritÃ©)
          // Sans Ã§a, les useState gardent leurs valeurs par dÃ©faut et Ã©crasent
          // les vraies couleurs en base si on modifie un autre champ.
          const dAny = data as any;
          const custoColors = dAny.customizations?.colors;
          const objColors = dAny.colors;
          const p = custoColors?.primary ?? objColors?.primary ?? dAny.primaryColor;
          const s = custoColors?.secondary ?? objColors?.secondary ?? dAny.secondaryColor;
          const a = custoColors?.accent ?? objColors?.accent ?? dAny.accentColor;
          if (p) setPrimaryColor(p);
          if (s) setSecondaryColor(s);
          if (a) setAccentColor(a);
          const rawLayout = dAny.customizations?.layout ?? dAny.layout;
          if (rawLayout === 'book' || rawLayout === 'album') setSelectedLayout(rawLayout);
        }
      } catch (e) {
        console.warn('Erreur de rechargement du modèle utilisateur:', e);
      }
    })();
  }, [user, template?.id]);

  const renderPreview = () => {
    const embeddedModel: UserModel = {
      ...customTemplate,
      userId: user?.id || 'embedded',
      originalTemplateId: customTemplate.id,
      colors: {
        primary: primaryColor,
        secondary: secondaryColor,
        accent: accentColor
      },
      customizations: {
        colors: {
          primary: primaryColor,
          secondary: secondaryColor,
          accent: accentColor
        },
        layout: selectedLayout
      }
    };
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-luxury border border-amber-500/30 overflow-hidden sticky top-8">
        <div className="p-3 sm:p-4">
          <div className="text-center mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-amber-400 mb-1.5 sm:mb-2">Aperçu en temps réel</h3>
            <p className="text-neutral-300 text-xs sm:text-sm">Vos modifications apparaissent instantanément</p>
          </div>
          <div className="flex justify-center">
            <div className="relative w-[300px] sm:w-[400px] h-[615px] sm:h-[820px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.25rem] sm:rounded-[3rem] p-4 sm:p-6 shadow-luxury border border-slate-700">
              <div className="w-full h-full bg-gradient-to-br from-neutral-50 to-amber-50/30 rounded-[1.5rem] sm:rounded-[2rem] overflow-y-auto no-scrollbar relative shadow-inner">
                <div className="sticky top-0 z-[150] bg-gradient-to-r from-slate-900 to-slate-800 h-4.5 sm:h-6 flex items-center justify-between px-4 sm:px-6 text-neutral-50 text-[10px] sm:text-xs rounded-t-[1.5rem] sm:rounded-t-[2rem]">
                  <span>9:41</span>
                  <div className="flex space-x-0.75 sm:space-x-1">
                    <div className="w-0.75 h-0.75 sm:w-1 sm:h-1 bg-emerald-400 rounded-full animate-pulse"></div>
                    <div className="w-0.75 h-0.75 sm:w-1 sm:h-1 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                    <div className="w-0.75 h-0.75 sm:w-1 sm:h-1 bg-rose-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                  </div>
                </div>
                <div className="w-full">
                  <InvitationPreview embedded embeddedModel={embeddedModel} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in min-h-screen" style={{
      color: '#ffffff',
      background: '#0b0f17',
      backgroundImage: `radial-gradient(circle at 20% 0%, rgba(252,211,77,0.10), transparent 55%),
                       radial-gradient(circle at 80% 10%, rgba(244,114,182,0.10), transparent 55%),
                       radial-gradient(circle at 50% 100%, rgba(217,70,239,0.08), transparent 60%),
                       radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)`,
      backgroundSize: 'auto, auto, auto, 22px 22px'
    }}>
      {/* Header Sticky (Desktop: bouton Sauvegarder toujours accessible) */}
      <div
        className="sticky top-0 z-50 mb-4 sm:mb-6 -mx-0 sm:-mx-4 px-0 sm:px-4 py-3 sm:py-4 backdrop-blur-xl border-b"
        style={{
          background: 'rgba(11, 15, 23, 0.85)',
          borderColor: 'rgba(255,255,255,0.06)',
          boxShadow: '0 10px 40px -20px rgba(0,0,0,0.7)',
        }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 max-w-full">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="flex items-center transition-all duration-300 group mr-3"
              style={{ color: '#fcd34d' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#fbbf24'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#fcd34d'; }}
            >
              <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="text-sm font-medium">Retour</span>
            </button>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                Personnalisation du Template
              </h2>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{customTemplate.name}</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all duration-300 font-semibold flex items-center text-sm"
            style={{
              background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
              color: '#0b0f17',
              boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 10px 24px -10px rgba(251,191,36,0.65)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="lg:hidden mb-4">
        <div className="rounded-xl overflow-hidden border"
             style={{
               background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
               borderColor: 'rgba(255,255,255,0.08)',
               boxShadow: '0 20px 60px -25px rgba(0,0,0,0.6), 0 0 0 1px rgba(251,191,36,0.04) inset',
             }}>
          <nav className="p-2 flex overflow-x-auto gap-1.5">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-shrink-0 flex items-center px-3 py-1.5 rounded-lg transition-all duration-300 text-xs font-semibold"
                  style={{
                    background: activeTab === tab.id ? 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)' : 'rgba(255,255,255,0.02)',
                    color: activeTab === tab.id ? '#0b0f17' : 'rgba(255,255,255,0.7)',
                    boxShadow: activeTab === tab.id ? '0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 16px -8px rgba(251,191,36,0.6)' : 'none',
                  }}
                  onMouseEnter={(e) => { if (activeTab !== tab.id) { e.currentTarget.style.background = 'rgba(251,191,36,0.1)'; e.currentTarget.style.color = '#fcd34d'; } }}
                  onMouseLeave={(e) => { if (activeTab !== tab.id) { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; } }}
                >
                  <IconComponent className="h-3.5 w-3.5 mr-1.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Sidebar Navigation (Desktop only) */}
        <div className="lg:col-span-1 hidden lg:block">
          <div className="rounded-xl overflow-hidden border sticky top-8"
               style={{
                 background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
                 borderColor: 'rgba(255,255,255,0.08)',
                 boxShadow: '0 30px 80px -30px rgba(0,0,0,0.75), 0 0 0 1px rgba(251,191,36,0.04) inset',
               }}>
            <div className="p-3 sm:p-4 border-b"
                 style={{
                   borderColor: 'rgba(255,255,255,0.06)',
                   background: 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(255,255,255,0) 70%)',
                 }}>
              <h3 className="text-sm sm:text-base font-bold text-white">Personnalisation</h3>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Modifiez votre invitation</p>
            </div>
            <nav className="p-2.5 sm:p-3">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="w-full flex items-center px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-300 mb-0.5 sm:mb-1 text-xs sm:text-sm font-medium"
                    style={{
                      background: activeTab === tab.id ? 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)' : 'transparent',
                      color: activeTab === tab.id ? '#0b0f17' : 'rgba(255,255,255,0.7)',
                      boxShadow: activeTab === tab.id ? '0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 16px -8px rgba(251,191,36,0.6)' : 'none',
                    }}
                    onMouseEnter={(e) => { if (activeTab !== tab.id) { e.currentTarget.style.background = 'rgba(251,191,36,0.08)'; e.currentTarget.style.color = '#fcd34d'; } }}
                    onMouseLeave={(e) => { if (activeTab !== tab.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; } }}
                  >
                    <IconComponent className="h-3.5 w-3.5 mr-1.5 sm:h-4 sm:w-4 sm:mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Quick Actions (Desktop only) */}
            <div className="p-2.5 sm:p-3 border-t"
                 style={{
                   borderColor: 'rgba(255,255,255,0.06)',
                   background: 'rgba(255,255,255,0.015)',
                 }}>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                <button className="flex items-center justify-center px-2.5 py-1.5 rounded-lg transition-all duration-300 text-xs font-semibold"
                        style={{ background: 'rgba(217,70,239,0.14)', color: '#e9a4f2', border: '1px solid rgba(217,70,239,0.22)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(217,70,239,0.22)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(217,70,239,0.14)'; }}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Aperçu
                </button>
                <button className="flex items-center justify-center px-2.5 py-1.5 rounded-lg transition-all duration-300 text-xs font-semibold"
                        style={{ background: 'rgba(16,185,129,0.14)', color: '#8af0cc', border: '1px solid rgba(16,185,129,0.22)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.22)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.14)'; }}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border p-4 sm:p-6"
               style={{
                 background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
                 borderColor: 'rgba(255,255,255,0.08)',
                 boxShadow: '0 30px 80px -30px rgba(0,0,0,0.75), 0 0 0 1px rgba(251,191,36,0.04) inset',
               }}>
            <div className="mb-3 sm:mb-4 pb-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight mb-0.5 sm:mb-1" style={{ color: '#ffffff' }}>
                {tabs.find(tab => tab.id === activeTab)?.label}
              </h3>
              <p className="text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {activeTab === 'general' && 'Modifiez le contenu principal de votre invitation'}
                {activeTab === 'design' && 'Personnalisez l\'apparence visuelle'}
                {activeTab === 'colors' && 'Ajustez la palette de couleurs'}
                {activeTab === 'event' && 'Configurez les détails de l\'événement'}
                {activeTab === 'options' && 'Gérez les options pour vos invités'}
                {activeTab === 'music' && 'Ajoutez une musique d\'ambiance pour vos invités'}
              </p>
            </div>
            {renderTabContent()}
          </div>
        </div>

        {/* Real-time Preview */}
        <div className="lg:col-span-1">
          {renderPreview()}
        </div>
      </div>
      <AdminPasswordModal
        isOpen={showAdminPasswordModal}
        onClose={() => setShowAdminPasswordModal(false)}
        onSuccess={handleAdminPasswordSuccess}
        targetLayoutLabel={pendingLayout === 'book' ? 'Format Livre' : pendingLayout === 'album' ? 'Format Album' : 'Scroll Classique'}
      />
      {toast && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-[1000] px-3 py-2 sm:px-4 sm:py-3 rounded-xl border text-xs sm:text-sm"
             style={{
               background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
               borderColor: toast.type === 'success' ? 'rgba(16,185,129,0.4)' : toast.type === 'error' ? 'rgba(236,72,153,0.4)' : 'rgba(251,191,36,0.4)',
               color: toast.type === 'success' ? '#8af0cc' : toast.type === 'error' ? '#f9a8d4' : '#fcd34d',
               boxShadow: '0 20px 60px -20px rgba(0,0,0,0.85)',
             }}>
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default TemplateCustomization;
