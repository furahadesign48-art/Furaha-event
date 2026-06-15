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
  Music
} from 'lucide-react';
import InvitationPreview from './InvitationPreview';
import { UserModel } from '../services/templateService';

declare global {
  interface Window {
    cloudinary: any;
  }
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
  eventPhotos?: string[];
  eventPhoto1?: string;
  eventPhoto2?: string;
  eventPhoto3?: string;
  title: string;
  invitationText: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventAddress?: string;
  backgroundMusic?: string;
  drinkOptions: string[];
  features: string[];
  useRichInvitation?: boolean;
  richInvitationHTML?: string;
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
  const [selectedTextColor, setSelectedTextColor] = useState('#f59e0b');
  const [showQRInfo, setShowQRInfo] = useState(false);
  const [eventPhotoUrlInputs, setEventPhotoUrlInputs] = useState(['', '', '']);
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [bulkGalleryLinksInput, setBulkGalleryLinksInput] = useState('');
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
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
  useEffect(() => {
    if (template.colors) {
      setPrimaryColor(template.colors.primary);
      setSecondaryColor(template.colors.secondary);
      setAccentColor(template.colors.accent);
    } else if (template.customizations?.colors) {
      setPrimaryColor(template.customizations.colors.primary);
      setSecondaryColor(template.customizations.colors.secondary);
      setAccentColor(template.customizations.colors.accent);
    }
  }, [template]);

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

  const handleCloudinaryUpload = (field: keyof TemplateData | 'gallery' | 'eventPhoto1' | 'eventPhoto2' | 'eventPhoto3') => {
    if (!window.cloudinary) {
      showToast('error', 'Le service Cloudinary n\'est pas disponible');
      return;
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: 'dogokmf6m',
        uploadPreset: 'Wedding',
        sources: ['local', 'url', 'camera'],
        showAdvancedOptions: false,
        cropping: false,
        multiple: field === 'gallery',
        defaultSource: 'local',
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
          } else {
            handleInputChange(field as keyof TemplateData, url);
            if (user && customTemplate.id && (field === 'eventPhoto1' || field === 'eventPhoto2' || field === 'eventPhoto3')) {
              const modelRef = doc(db, 'users', user.id, 'UserModel', customTemplate.id);
              await setDoc(modelRef, { [field]: url, updatedAt: serverTimestamp() }, { merge: true });
              onSave({ ...customTemplate, [field]: url });
            }
            showToast('success', 'Image téléchargée avec succès');
          }
        } else if (error) {
          showToast('error', "Erreur lors du téléchargement. Veuillez réessayer.");
        }
      }
    );

    widget.open();
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

  const handleSave = async () => {
    if (!customTemplate.id || !user) return;

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
          layout: 'default'
        },
        updatedAt: serverTimestamp()
      }, { merge: true });

      onSave(customTemplate);
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
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Titre de l'invitation
              </label>
              <input
                type="text"
                value={customTemplate.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                placeholder="Ex: Mariage de Sophie & Lucas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Texte d'invitation
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                <button type="button" onClick={() => wrapSelection('[b]', '[/b]')} className="px-3 py-1 rounded-lg border text-sm">Gras</button>
                <button type="button" onClick={() => wrapSelection('[i]', '[/i]')} className="px-3 py-1 rounded-lg border text-sm">Italique</button>
                <input type="color" value={selectedTextColor} onChange={(e) => setSelectedTextColor(e.target.value)} className="h-9 w-12 p-1 border rounded-lg" />
                <button type="button" onClick={() => wrapSelection(`[color=${selectedTextColor}]`, '[/color]')} className="px-3 py-1 rounded-lg border text-sm">Appliquer couleur</button>
                <button type="button" onClick={clearFormatting} className="ml-auto px-3 py-1 rounded-lg border text-sm">Supprimer formats</button>
              </div>
              <textarea
                value={customTemplate.invitationText}
                onChange={(e) => handleInputChange('invitationText', e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 resize-none"
                placeholder="Rédigez votre message d'invitation..."
                ref={textAreaRef}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nom du template
              </label>
              <input
                type="text"
                value={customTemplate.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                placeholder="Nom de votre template personnalisé"
              />
            </div>
          </div>
        );

      case 'design':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Image de fond
              </label>
              <div className="space-y-3">
                <div className="relative h-24 bg-gradient-to-br from-neutral-100 to-amber-50 rounded-xl border-2 border-dashed border-neutral-300 hover:border-amber-400 transition-all duration-300 group">
                  {customTemplate.backgroundImage ? (
                    <>
                      <img
                        src={customTemplate.backgroundImage}
                        alt="Background preview"
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <button
                        onClick={() => handleInputChange('backgroundImage', '')}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-rose-600 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        title="Retirer l'image de fond"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Camera className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                        <p className="text-neutral-500 text-sm">Aucune image sélectionnée</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCloudinaryUpload('backgroundImage')}
                    className="bg-amber-500 text-white px-3 py-2 text-sm rounded-xl hover:bg-amber-600 transition-all duration-300 font-semibold flex items-center justify-center"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Charger une image
                  </button>
                  
                  <button
                    onClick={() => handleInputChange('backgroundImage', 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1200')}
                    className="bg-neutral-500 text-white px-3 py-2 text-sm rounded-xl hover:bg-neutral-600 transition-all duration-300 font-semibold"
                  >
                    Image par défaut
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-200/50">
              <div className="flex items-center mb-4">
                <Camera className="h-5 w-5 text-amber-600 mr-2" />
                <h3 className="text-lg font-semibold text-amber-800">Téléchargement d'image</h3>
              </div>
              <div className="space-y-2 text-amber-700 text-sm">
                <p>• Formats acceptés : JPEG, PNG, WebP</p>
                <p>• Taille maximale : 5MB</p>
                <p>• L'image sera stockée de manière sécurisée</p>
                <p>• Résolution recommandée : 1200x800px minimum</p>
              </div>
            </div>

            <p className="text-xs font-medium text-slate-600 mb-2">Recommandé</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div
                onClick={() => handleInputChange('backgroundImage', 'https://i.pinimg.com/736x/fd/7a/65/fd7a65aca807295846701baaf4e968da.jpg')}
                className="cursor-pointer group"
              >
                <div className="relative h-16 rounded-xl overflow-hidden border-2 border-transparent group-hover:border-amber-400 transition-all duration-300">
                  <img
                    src="https://i.pinimg.com/736x/fd/7a/65/fd7a65aca807295846701baaf4e968da.jpg"
                    alt="Template 1"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300"></div>
                </div>
                <p className="text-[11px] text-center mt-1 text-slate-600">Romantique</p>
              </div>

              <div
                onClick={() => handleInputChange('backgroundImage', 'https://i.pinimg.com/736x/3e/93/bf/3e93bfe0d8a1532054bce013b6f1f07b.jpg')}
                className="cursor-pointer group"
              >
                <div className="relative h-16 rounded-xl overflow-hidden border-2 border-transparent group-hover:border-amber-400 transition-all duration-300">
                  <img
                    src="https://i.pinimg.com/736x/3e/93/bf/3e93bfe0d8a1532054bce013b6f1f07b.jpg"
                    alt="Template 2"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300"></div>
                </div>
                <p className="text-[11px] text-center mt-1 text-slate-600">Élégant</p>
              </div>

              <div
                onClick={() => handleInputChange('backgroundImage', 'https://i.pinimg.com/1200x/4b/ee/84/4bee8478bb54a57537b1c95b366ea5bc.jpg')}
                className="cursor-pointer group"
              >
                <div className="relative h-16 rounded-xl overflow-hidden border-2 border-transparent group-hover:border-amber-400 transition-all duration-300">
                  <img
                    src="https://i.pinimg.com/1200x/4b/ee/84/4bee8478bb54a57537b1c95b366ea5bc.jpg"
                    alt="Template 3"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300"></div>
                </div>
                <p className="text-[11px] text-center mt-1 text-slate-600">Moderne</p>
              </div>

              <div
                onClick={() => handleInputChange('backgroundImage', 'https://i.pinimg.com/736x/1b/3b/b7/1b3bb7268cca9e4a60e7680a249545d6.jpg')}
                className="cursor-pointer group"
              >
                <div className="relative h-16 rounded-xl overflow-hidden border-2 border-transparent group-hover:border-amber-400 transition-all duration-300">
                  <img
                    src="https://i.pinimg.com/736x/1b/3b/b7/1b3bb7268cca9e4a60e7680a249545d6.jpg"
                    alt="Template 4"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300"></div>
                </div>
                <p className="text-[11px] text-center mt-1 text-slate-600">Classique</p>
              </div>

              <div
                onClick={() => handleInputChange('backgroundImage', 'https://i.pinimg.com/736x/21/10/c9/2110c97858e0272bbf004d3772c95dd2.jpg')}
                className="cursor-pointer group"
              >
                <div className="relative h-16 rounded-xl overflow-hidden border-2 border-transparent group-hover:border-amber-400 transition-all duration-300">
                  <img
                    src="https://i.pinimg.com/736x/21/10/c9/2110c97858e0272bbf004d3772c95dd2.jpg"
                    alt="Texture 1"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300"></div>
                </div>
                <p className="text-[11px] text-center mt-1 text-slate-600">Texture</p>
              </div>

              <div
                onClick={() => handleInputChange('backgroundImage', 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?q=80&w=1200&auto=format&fit=crop')}
                className="cursor-pointer group"
              >
                <div className="relative h-16 rounded-xl overflow-hidden border-2 border-transparent group-hover:border-amber-400 transition-all duration-300">
                  <img
                    src="https://images.unsplash.com/photo-1470770903676-69b98201ea1c?q=80&w=400&auto=format&fit=crop"
                    alt="Bois"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300"></div>
                </div>
                <p className="text-[11px] text-center mt-1 text-slate-600">Bois</p>
              </div>

              <div
                onClick={() => handleInputChange('backgroundImage', 'https://images.unsplash.com/photo-1496302662116-35cc4f36dfaa?q=80&w=1200&auto=format&fit=crop')}
                className="cursor-pointer group"
              >
                <div className="relative h-16 rounded-xl overflow-hidden border-2 border-transparent group-hover:border-amber-400 transition-all duration-300">
                  <img
                    src="https://i.pinimg.com/736x/58/e5/e7/58e5e7042c1d3ee97090114d4081e08e.jpg"
                    alt="Marbre"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300"></div>
                </div>
                <p className="text-[11px] text-center mt-1 text-slate-600">Marbre</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                fond de l'invitation
              </label>
              <div className="space-y-3">
                <div className="relative h-20 bg-gradient-to-br from-neutral-100 to-amber-50 rounded-xl border-2 border-dashed border-neutral-300 hover:border-amber-400 transition-all duration-300 group">
                  {customTemplate.patternBackgroundImage ? (
                    <>
                      <div className="absolute inset-0 rounded-xl" style={{ backgroundImage: `url(${customTemplate.patternBackgroundImage})`, backgroundRepeat: 'repeat', backgroundSize: 'auto' }}></div>
                      <button
                        onClick={() => handleInputChange('patternBackgroundImage', '')}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-rose-600 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        title="Retirer le motif"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Camera className="h-6 w-6 text-neutral-400 mx-auto mb-1" />
                        <p className="text-neutral-500 text-xs">Aucun motif sélectionné</p>
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
                      className={`cursor-pointer group relative rounded-xl transition-all duration-300 ${
                        customTemplate.patternBackgroundImage === url ? 'ring-2 ring-amber-500 ring-offset-2' : ''
                      }`}
                    >
                      <div className="relative h-16 rounded-xl overflow-hidden border-2 border-transparent group-hover:border-amber-400 transition-all duration-300">
                        <div className="absolute inset-0" style={{ backgroundImage: `url(${url})`, backgroundRepeat: 'repeat' }}></div>
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-all duration-300"></div>
                        {customTemplate.patternBackgroundImage === url && (
                          <div className="absolute inset-0 flex items-center justify-center bg-amber-500/20">
                            <Check className="h-6 w-6 text-amber-600 bg-white rounded-full p-1" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-center mt-1 text-slate-600">Motif {idx + 1}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCloudinaryUpload('patternBackgroundImage')}
                    className="bg-amber-500 text-white px-3 py-2 text-sm rounded-xl hover:bg-amber-600 transition-all duration-300 font-semibold flex items-center justify-center"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Charger un motif
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ornement
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="relative h-20 bg-gradient-to-br from-neutral-100 to-amber-50 rounded-xl border-2 border-dashed border-neutral-300 hover:border-amber-400 transition-all duration-300 group">
                    {customTemplate.guestInfoLeftImage ? (
                      <>
                        <img src={customTemplate.guestInfoLeftImage} alt="Aperçu gauche" className="w-full h-full object-contain rounded-xl" />
                        <button
                          onClick={() => handleInputChange('guestInfoLeftImage', '')}
                          className="absolute top-2 right-2 p-1 bg-white/90 hover:bg-white text-rose-600 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Camera className="h-6 w-6 text-neutral-400 mx-auto mb-1" />
                          <p className="text-neutral-500 text-xs">Aucune image sélectionnée</p>
                        </div>
                      </div>
                    )}
                  </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCloudinaryUpload('guestInfoLeftImage')}
                    className="bg-amber-500 text-white px-3 py-2 text-sm rounded-xl hover:bg-amber-600 transition-all duration-300 font-semibold flex items-center justify-center"
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
                        className={`relative h-14 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                          customTemplate.guestInfoLeftImage === url ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-transparent hover:border-amber-400'
                        }`}
                      >
                        <img src={url} alt="Choix ornement gauche" className="w-full h-full object-contain bg-white" />
                        {customTemplate.guestInfoLeftImage === url && (
                          <div className="absolute inset-0 flex items-center justify-center bg-amber-500/10">
                            <Check className="h-4 w-4 text-amber-600 bg-white rounded-full p-0.5" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative h-20 bg-gradient-to-br from-neutral-100 to-amber-50 rounded-xl border-2 border-dashed border-neutral-300 hover:border-amber-400 transition-all duration-300 group">
                    {customTemplate.guestInfoRightImage ? (
                      <>
                        <img src={customTemplate.guestInfoRightImage} alt="Aperçu droite" className="w-full h-full object-contain rounded-xl" />
                        <button
                          onClick={() => handleInputChange('guestInfoRightImage', '')}
                          className="absolute top-2 right-2 p-1 bg-white/90 hover:bg-white text-rose-600 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Camera className="h-6 w-6 text-neutral-400 mx-auto mb-1" />
                          <p className="text-neutral-500 text-xs">Aucune image sélectionnée</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCloudinaryUpload('guestInfoRightImage')}
                      className="bg-amber-500 text-white px-3 py-2 text-sm rounded-xl hover:bg-amber-600 transition-all duration-300 font-semibold flex items-center justify-center"
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
                        className={`relative h-14 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                          customTemplate.guestInfoRightImage === url ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-transparent hover:border-amber-400'
                        }`}
                      >
                        <img src={url} alt="Choix ornement droite" className="w-full h-full object-contain bg-white" />
                        {customTemplate.guestInfoRightImage === url && (
                          <div className="absolute inset-0 flex items-center justify-center bg-amber-500/10">
                            <Check className="h-4 w-4 text-amber-600 bg-white rounded-full p-0.5" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Photo
              </label>
              <div className="space-y-3">
                <div className="relative h-24 rounded-xl border-2 border-dashed border-neutral-300 bg-gradient-to-br from-neutral-100 to-amber-50 flex items-center justify-center group">
                  {customTemplate.invitationPhoto ? (
                    <>
                      <img src={customTemplate.invitationPhoto} alt="Aperçu photo" className="h-20 w-20 rounded-full object-cover shadow-md" />
                      <button
                        onClick={() => handleInputChange('invitationPhoto', '')}
                        className="absolute top-2 right-2 p-1 bg-white/90 hover:bg-white text-rose-600 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center">
                      <Camera className="h-6 w-6 text-neutral-400 mx-auto mb-1" />
                      <p className="text-neutral-500 text-xs">Aucune photo sélectionnée</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCloudinaryUpload('invitationPhoto')}
                    className="bg-amber-500 text-white px-3 py-2 text-sm rounded-xl hover:bg-amber-600 transition-all duration-300 font-semibold flex items-center justify-center"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Charger une photo
                  </button>
                </div>
              </div>
            </div>

            
          </div>
        );

      case 'colors':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-4">
                Couleur principale
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-16 h-12 rounded-xl border-2 border-neutral-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 font-mono"
                  placeholder="#f59e0b"
                />
              </div>
              <p className="text-sm text-slate-500 mt-2">Couleur utilisée pour les éléments principaux et les boutons</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-4">
                Couleur secondaire
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-16 h-12 rounded-xl border-2 border-neutral-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1 px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 font-mono"
                  placeholder="#d97706"
                />
              </div>
              <p className="text-sm text-slate-500 mt-2">Couleur pour les effets de survol et les accents</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-4">
                Couleur d'accent
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-16 h-12 rounded-xl border-2 border-neutral-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1 px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 font-mono"
                  placeholder="#f43f5e"
                />
              </div>
              <p className="text-sm text-slate-500 mt-2">Couleur pour les éléments décoratifs et les icônes</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => {
                  setPrimaryColor('#f59e0b');
                  setSecondaryColor('#d97706');
                  setAccentColor('#f43f5e');
                }}
                className="p-4 rounded-xl border-2 border-neutral-200 hover:border-amber-400 transition-all duration-300 group"
              >
                <div className="flex space-x-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500"></div>
                  <div className="w-6 h-6 rounded-full bg-amber-600"></div>
                  <div className="w-6 h-6 rounded-full bg-rose-500"></div>
                </div>
                <p className="text-sm font-medium text-slate-700 group-hover:text-amber-700">Doré & Rose</p>
              </button>

              <button
                onClick={() => {
                  setPrimaryColor('#8b5cf6');
                  setSecondaryColor('#7c3aed');
                  setAccentColor('#ec4899');
                }}
                className="p-4 rounded-xl border-2 border-neutral-200 hover:border-purple-400 transition-all duration-300 group"
              >
                <div className="flex space-x-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-violet-500"></div>
                  <div className="w-6 h-6 rounded-full bg-violet-600"></div>
                  <div className="w-6 h-6 rounded-full bg-pink-500"></div>
                </div>
                <p className="text-sm font-medium text-slate-700 group-hover:text-purple-700">Violet & Rose</p>
              </button>

              <button
                onClick={() => {
                  setPrimaryColor('#10b981');
                  setSecondaryColor('#059669');
                  setAccentColor('#3b82f6');
                }}
                className="p-4 rounded-xl border-2 border-neutral-200 hover:border-emerald-400 transition-all duration-300 group"
              >
                <div className="flex space-x-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500"></div>
                  <div className="w-6 h-6 rounded-full bg-emerald-600"></div>
                  <div className="w-6 h-6 rounded-full bg-blue-500"></div>
                </div>
                <p className="text-sm font-medium text-slate-700 group-hover:text-emerald-700">Émeraude & Bleu</p>
              </button>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200/50">
              <div className="flex items-center mb-4">
                <Palette className="h-5 w-5 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-purple-800">Personnalisation des couleurs</h3>
              </div>
              <p className="text-purple-700 text-sm">
                Personnalisez les couleurs de votre invitation pour qu'elle corresponde parfaitement à votre thème.
                Les modifications s'appliquent en temps réel dans l'aperçu.
              </p>
            </div>
          </div>
        );

      case 'event':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date de l'événement
                </label>
                <input
                  type="date"
                  value={customTemplate.eventDate && customTemplate.eventDate.includes(' ') ? 
                        customTemplate.eventDate.split(' ')[2] + '-' + 
                        (customTemplate.eventDate.split(' ')[1] === 'Janvier' ? '01' : 
                         customTemplate.eventDate.split(' ')[1] === 'Février' ? '02' :
                         customTemplate.eventDate.split(' ')[1] === 'Mars' ? '03' :
                         customTemplate.eventDate.split(' ')[1] === 'Avril' ? '04' :
                         customTemplate.eventDate.split(' ')[1] === 'Mai' ? '05' :
                         customTemplate.eventDate.split(' ')[1] === 'Juin' ? '06' :
                         customTemplate.eventDate.split(' ')[1] === 'Juillet' ? '07' :
                         customTemplate.eventDate.split(' ')[1] === 'Août' ? '08' :
                         customTemplate.eventDate.split(' ')[1] === 'Septembre' ? '09' :
                         customTemplate.eventDate.split(' ')[1] === 'Octobre' ? '10' :
                         customTemplate.eventDate.split(' ')[1] === 'Novembre' ? '11' :
                         customTemplate.eventDate.split(' ')[1] === 'Décembre' ? '12' : '01') + '-' + 
                        customTemplate.eventDate.split(' ')[0].padStart(2, '0') : ''}
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    const formattedDate = date.toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    });
                    handleInputChange('eventDate', formattedDate);
                  }}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Heure de l'événement
                </label>
                <input
                  type="time"
                  value={customTemplate.eventTime ? customTemplate.eventTime.replace('h', ':') : ''}
                  onChange={(e) => handleInputChange('eventTime', e.target.value.replace(':', 'h'))}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Lieu de l'événement
              </label>
              <input
                type="text"
                value={customTemplate.eventLocation}
                onChange={(e) => handleInputChange('eventLocation', e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                placeholder="Nom du lieu (ex: Château de la Loire)"
              />
              <div className="mt-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">Adresse de l'événement</label>
                <input
                  type="text"
                  value={customTemplate.eventAddress || ''}
                  onChange={(e) => handleInputChange('eventAddress', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                  placeholder="Adresse complète (ex: 123 Rue de la Paix, 75001 Paris)"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Latitude (optionnel)</label>
                  <input
                    type="number"
                    value={customTemplate.eventLat ?? ''}
                    onChange={(e) => handleInputChange('eventLat', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    step="0.000001"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                    placeholder="Ex: -4.3251"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Longitude (optionnel)</label>
                  <input
                    type="number"
                    value={customTemplate.eventLng ?? ''}
                    onChange={(e) => handleInputChange('eventLng', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    step="0.000001"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                    placeholder="Ex: 15.3136"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-200/50">
              <div className="flex items-center mb-4">
                <MapPin className="h-5 w-5 text-amber-600 mr-2" />
                <h3 className="text-lg font-semibold text-amber-800">Informations du lieu</h3>
              </div>
              <p className="text-amber-700 text-sm">
                Assurez-vous que l'adresse est complète et précise pour faciliter l'accès de vos invités.
                Vous pouvez inclure des indications supplémentaires dans le texte d'invitation.
              </p>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Photos sous la date
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[0,1,2].map((idx) => {
                  const field = (idx === 0 ? 'eventPhoto1' : idx === 1 ? 'eventPhoto2' : 'eventPhoto3') as keyof TemplateData;
                  const previewSrc = (customTemplate[field] as string) || customTemplate.eventPhotos?.[idx] || customTemplate.invitationPhoto || customTemplate.backgroundImage;
                  return (
                    <div key={idx} className="space-y-2">
                      <div className="relative h-20 rounded-xl border-2 border-dashed border-neutral-300 bg-gradient-to-br from-neutral-100 to-amber-50 flex items-center justify-center overflow-hidden">
                        {previewSrc ? (
                          <img src={previewSrc} alt={`Aperçu ${idx+1}`} className="h-16 w-24 object-cover rounded-lg shadow" />
                        ) : (
                          <div className="text-center">
                            <Camera className="h-6 w-6 text-neutral-400 mx-auto mb-1" />
                            <p className="text-neutral-500 text-xs">Aucune image</p>
                          </div>
                        )}
                        <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ boxShadow: 'inset 0 0 0 2px rgba(245, 158, 11, 0.15)' }} />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleCloudinaryUpload(field)}
                          className="w-full bg-amber-500 text-white px-3 py-2 text-sm rounded-xl hover:bg-amber-600 transition-all duration-300 font-semibold flex items-center justify-center"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Charger photo {idx + 1}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Galerie du couple
                </label>
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(customTemplate.eventPhotos || []).map((src, idx) => (
                    <div key={`${src}-${idx}`} className="relative rounded-xl overflow-hidden border">
                      <img src={src} alt={`Galerie ${idx+1}`} className="w-full h-24 object-cover" />
                      <button
                        type="button"
                        onClick={() => removeGalleryPhoto(idx)}
                        className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white text-rose-600 shadow"
                        title="Retirer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {!(customTemplate.eventPhotos || []).length && (
                    <div className="text-sm text-slate-500">Aucune photo dans la galerie pour le moment</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCloudinaryUpload('gallery')}
                    className="bg-amber-500 text-white px-3 py-2 text-sm rounded-xl hover:bg-amber-600 transition-all duration-300 font-semibold flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Ajouter des photos à la galerie
                  </button>
                </div>
              </div>
              </div>
          </div>
        );

      case 'options':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-4">
                Options de boissons
              </label>
              
              <div className="space-y-3 mb-4">
                {customTemplate.drinkOptions.map((drink, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gradient-to-r from-neutral-50 to-amber-50/30 rounded-xl p-4 border border-neutral-200/50"
                  >
                    <div className="flex items-center">
                      <Wine className="h-4 w-4 text-amber-600 mr-3" />
                      <span className="text-slate-700 font-medium">{drink}</span>
                    </div>
                    <button
                      onClick={() => removeDrinkOption(index)}
                      className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all duration-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newDrink}
                  onChange={(e) => setNewDrink(e.target.value)}
                  placeholder="Nouvelle option de boisson"
                  className="flex-1 px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                  onKeyPress={(e) => e.key === 'Enter' && addDrinkOption()}
                />
                <button
                  onClick={addDrinkOption}
                  className="bg-amber-500 text-white px-6 py-3 rounded-xl hover:bg-amber-600 transition-all duration-300 font-semibold"
                >
                  Ajouter
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200/50">
              <div className="flex items-center mb-4">
                <Wine className="h-5 w-5 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-purple-800">Gestion des boissons</h3>
              </div>
              <p className="text-purple-700 text-sm">
                Personnalisez les options de boissons selon vos préférences. Vos invités pourront 
                sélectionner leur choix directement depuis l'invitation.
              </p>
            </div>
          </div>
        );

      case 'music':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Musique de fond (Lien direct MP3)
              </label>
              <div className="flex space-x-3 mb-4">
                <input
                  type="text"
                  value={customTemplate.backgroundMusic || ''}
                  onChange={(e) => handleInputChange('backgroundMusic', e.target.value)}
                  placeholder="https://exemple.com/musique.mp3"
                  className="flex-1 px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                />
                {customTemplate.backgroundMusic && (
                  <button
                    onClick={() => handleInputChange('backgroundMusic', '')}
                    className="p-3 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-all"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleCloudinaryUpload('backgroundMusic' as any)}
                  className="flex-1 bg-amber-500 text-white px-4 py-3 rounded-xl hover:bg-amber-600 transition-all duration-300 font-semibold flex items-center justify-center shadow-md"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Télécharger une musique
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
              <div className="flex items-center mb-4">
                <Music className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-blue-800">Conseils Musique</h3>
              </div>
              <div className="space-y-2 text-blue-700 text-sm">
                <p>• Utilisez des fichiers MP3 légers pour un chargement rapide.</p>
                <p>• La musique se lancera automatiquement dès que l'invité commencera à défiler la page.</p>
                <p>• Un bouton de contrôle du son sera visible pour l'invité.</p>
              </div>
            </div>

            {customTemplate.backgroundMusic && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Aperçu Audio</p>
                <audio controls src={customTemplate.backgroundMusic} className="w-full h-10" />
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
        }
      }
    };
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-luxury border border-amber-500/30 overflow-hidden sticky top-8">
        <div className="p-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-amber-400 mb-2">Aperçu en temps réel</h3>
            <p className="text-neutral-300 text-sm">Vos modifications apparaissent instantanément</p>
          </div>
          <div className="flex justify-center">
            <div className="relative w-[400px] h-[820px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] p-6 shadow-luxury border border-slate-700">
              <div className="w-full h-full bg-gradient-to-br from-neutral-50 to-amber-50/30 rounded-[2rem] overflow-y-auto no-scrollbar relative shadow-inner">
                <div className="sticky top-0 z-[150] bg-gradient-to-r from-slate-900 to-slate-800 h-6 flex items-center justify-between px-6 text-neutral-50 text-xs rounded-t-[2rem]">
                  <span>9:41</span>
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                    <div className="w-1 h-1 bg-rose-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
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
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="flex items-center text-amber-600 hover:text-amber-700 transition-all duration-300 group mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            Retour
          </button>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Personnalisation du Template
            </h2>
            <p className="text-slate-600 mt-1">{customTemplate.name}</p>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 font-semibold flex items-center shadow-glow-amber transform hover:scale-105"
        >
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-luxury border border-neutral-200/50 overflow-hidden sticky top-8">
            <div className="p-4 bg-gradient-to-r from-neutral-50 to-amber-50/30 border-b border-neutral-200/50">
              <h3 className="text-base font-semibold text-slate-900">Personnalisation</h3>
              <p className="text-xs text-slate-600 mt-1">Modifiez votre invitation</p>
            </div>
            <nav className="p-3">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg transition-all duration-300 mb-1 text-sm ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-glow-amber'
                        : 'text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                    }`}
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
            
            {/* Quick Actions */}
            <div className="p-3 border-t border-neutral-200/50 bg-gradient-to-r from-neutral-50 to-amber-50/30">
              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all duration-300 text-xs font-medium">
                  <Eye className="h-3 w-3 mr-1" />
                  Aperçu
                </button>
                <button className="flex items-center justify-center px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all duration-300 text-xs font-medium">
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-luxury border border-neutral-200/50 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {tabs.find(tab => tab.id === activeTab)?.label}
              </h3>
              <p className="text-sm text-slate-600">
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
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[1000] px-4 py-3 rounded-xl shadow-glow-amber border ${toast.type === 'success' ? 'bg-white/95 border-emerald-200 text-emerald-700' : toast.type === 'error' ? 'bg-white/95 border-rose-200 text-rose-700' : 'bg-white/95 border-amber-200 text-amber-700'}`}>
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default TemplateCustomization;
