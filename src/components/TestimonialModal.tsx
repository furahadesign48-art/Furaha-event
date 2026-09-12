import React, { useState, useEffect } from 'react';
import { X, Star, Upload, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';
import {
  testimonialService,
  EVENT_CATEGORIES,
  type EventCategory,
} from '../services/testimonialService';

interface TestimonialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

const CLOUDINARY_CLOUD = 'furaha-digital';

const TestimonialModal = ({ isOpen, onClose, onSubmitted }: TestimonialModalProps) => {
  const { user, isAuthenticated } = useAuth();
  const { isDarkMode } = useTheme();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [eventType, setEventType] = useState<EventCategory>('mariage');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName ? user.lastName[0] : '');
      setError(null);
      setSuccess(false);
    }
    if (!isOpen) {
      setRating(5);
      setHoverRating(0);
      setFirstName('');
      setLastName('');
      setComment('');
      setEventType('mariage');
      setAvatarUrl('');
      setUploadingAvatar(false);
      setSubmitting(false);
      setSuccess(false);
      setError(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const minCommentLength = 15;
  const canSubmit =
    isAuthenticated &&
    firstName.trim().length > 0 &&
    comment.trim().length >= minCommentLength &&
    rating >= 1 &&
    !submitting &&
    !success;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('upload_preset', 'furaha_default');
      form.append('folder', 'avatars');
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
        { method: 'POST', body: form }
      );
      const json = await res.json();
      if (json.secure_url) {
        setAvatarUrl(json.secure_url);
      } else {
        setError('Échec de l\'upload de la photo');
      }
    } catch (err) {
      setError('Erreur de connexion à Cloudinary');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const id = await testimonialService.createTestimonial({
        userId: user?.id || null,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        rating,
        comment: comment.trim(),
        eventType,
        avatarUrl: avatarUrl || undefined,
      });
      if (id) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          onSubmitted?.();
        }, 2200);
      } else {
        setError('Erreur lors de l\'enregistrement. Réessayez.');
      }
    } catch (err) {
      setError('Erreur serveur. Réessayez dans quelques instants.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex sm:items-center justify-center px-2 sm:px-4',
        'items-end sm:items-center'
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-300',
          isDarkMode ? 'bg-black/70' : 'bg-black/50'
        )}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-full max-w-lg overflow-hidden shadow-2xl transition-colors duration-500 animate-[slideUp_0.3s_ease-out]',
          'rounded-t-3xl sm:rounded-2xl',
          isDarkMode
            ? 'bg-gradient-to-b from-[#141a2c] to-[#0d1220] border border-white/10 sm:border-white/10'
            : 'bg-gradient-to-b from-white to-amber-50/30 border border-amber-900/15'
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b transition-colors duration-500',
            isDarkMode ? 'border-white/10' : 'border-amber-900/10'
          )}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: isDarkMode
                  ? 'linear-gradient(135deg, rgba(251,191,36,0.25), rgba(251,191,36,0.05))'
                  : 'linear-gradient(135deg, rgba(251,191,36,0.28), rgba(251,191,36,0.08))',
                border: isDarkMode
                  ? '1px solid rgba(251,191,36,0.3)'
                  : '1px solid rgba(180,83,9,0.25)',
              }}
            >
              <Star
                className="w-4 h-4 sm:w-5 sm:h-5 fill-current"
                style={{ color: isDarkMode ? '#fcd34d' : '#d97706' }}
              />
            </div>
            <div className="min-w-0">
              <h3
                className={cn(
                  'text-[15px] sm:text-lg font-extrabold transition-colors duration-500 truncate',
                  isDarkMode ? 'text-white' : 'text-amber-950'
                )}
              >
                Laisser un avis
              </h3>
              <p
                className={cn(
                  'text-[11px] sm:text-xs transition-colors duration-500 truncate',
                  isDarkMode ? 'text-white/55' : 'text-amber-900/60'
                )}
              >
                Ton expérience compte pour nous ❤️
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn(
              'w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors shrink-0',
              isDarkMode
                ? 'hover:bg-white/10 text-white/70 hover:text-white'
                : 'hover:bg-amber-900/5 text-amber-900/60 hover:text-amber-950'
            )}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Body */}
        <div className={cn(
          'px-4 sm:px-5 py-4 sm:py-5 space-y-4 sm:space-y-5 overflow-y-auto',
          'max-h-[88vh] sm:max-h-[75vh]'
        )}>
          {success ? (
            <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-3 sm:mb-4 animate-bounce"
                style={{
                  background: isDarkMode
                    ? 'radial-gradient(circle, rgba(16,185,129,0.35), rgba(16,185,129,0.08))'
                    : 'radial-gradient(circle, rgba(16,185,129,0.28), rgba(16,185,129,0.06))',
                  border: isDarkMode
                    ? '1px solid rgba(16,185,129,0.4)'
                    : '1px solid rgba(16,185,129,0.35)',
                }}
              >
                <Check className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500" />
              </div>
              <h4
                className={cn(
                  'text-lg sm:text-xl font-extrabold mb-1.5 sm:mb-2',
                  isDarkMode ? 'text-white' : 'text-amber-950'
                )}
              >
                Merci infiniment !
              </h4>
              <p
                className={cn(
                  'text-[13px] sm:text-sm leading-relaxed max-w-[280px] sm:max-w-xs',
                  isDarkMode ? 'text-white/65' : 'text-amber-900/70'
                )}
              >
                Ton avis a été soumis avec succès. Il sera visible sur la plateforme après une rapide validation par notre équipe.
              </p>
            </div>
          ) : (
            <>
              {/* Étoiles */}
              <div>
                <label
                  className={cn(
                    'block text-[13px] sm:text-sm font-bold mb-2 sm:mb-2.5',
                    isDarkMode ? 'text-white/90' : 'text-amber-950'
                  )}
                >
                  Note globale
                </label>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(n)}
                      className="transition-transform hover:scale-110 focus:outline-none active:scale-95"
                    >
                      <Star
                        className={cn(
                          'w-8 h-8 sm:w-9 sm:h-9 transition-colors',
                          (hoverRating || rating) >= n
                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_2px_6px_rgba(251,191,36,0.4)]'
                            : isDarkMode
                            ? 'text-white/20'
                            : 'text-amber-900/15'
                        )}
                      />
                    </button>
                  ))}
                  <span
                    className={cn(
                      'ml-1.5 sm:ml-2 text-[11px] sm:text-xs font-bold',
                      isDarkMode ? 'text-amber-300' : 'text-amber-700'
                    )}
                  >
                    {rating}/5
                  </span>
                </div>
              </div>

              {/* Nom + Prénom */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label
                    className={cn(
                      'block text-[11px] sm:text-xs font-bold mb-1 sm:mb-1.5',
                      isDarkMode ? 'text-white/85' : 'text-amber-950'
                    )}
                  >
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ex: Naomi"
                    className={cn(
                      'w-full px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-sm outline-none transition-colors',
                      isDarkMode
                        ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-amber-400/40'
                        : 'bg-white border border-amber-900/15 text-amber-950 placeholder-amber-900/30 focus:border-amber-500/40'
                    )}
                  />
                </div>
                <div>
                  <label
                    className={cn(
                      'block text-[11px] sm:text-xs font-bold mb-1 sm:mb-1.5',
                      isDarkMode ? 'text-white/85' : 'text-amber-950'
                    )}
                  >
                    Nom / Initiale
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ex: K."
                    maxLength={15}
                    className={cn(
                      'w-full px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-sm outline-none transition-colors',
                      isDarkMode
                        ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-amber-400/40'
                        : 'bg-white border border-amber-900/15 text-amber-950 placeholder-amber-900/30 focus:border-amber-500/40'
                    )}
                  />
                </div>
              </div>

              {/* Type d'événement */}
              <div>
                <label
                  className={cn(
                    'block text-[11px] sm:text-xs font-bold mb-1.5 sm:mb-2',
                    isDarkMode ? 'text-white/85' : 'text-amber-950'
                  )}
                >
                  Type d'événement
                </label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {EVENT_CATEGORIES.map((c) => {
                    const active = eventType === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setEventType(c.value)}
                        className={cn(
                          'px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-all active:scale-95',
                          active
                            ? isDarkMode
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                              : 'bg-amber-100 text-amber-800 border border-amber-400/50'
                            : isDarkMode
                            ? 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                            : 'bg-white text-amber-900/60 border border-amber-900/10 hover:bg-amber-50'
                        )}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Avatar */}
              <div>
                <label
                  className={cn(
                    'block text-[11px] sm:text-xs font-bold mb-1.5 sm:mb-2',
                    isDarkMode ? 'text-white/85' : 'text-amber-950'
                  )}
                >
                  Ta photo (optionnel)
                </label>
                <div className={cn(
                  'flex items-center gap-2.5 sm:gap-3',
                  'flex-col sm:flex-row sm:items-center items-start'
                )}>
                  <div
                    className={cn(
                      'w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center overflow-hidden shrink-0',
                      isDarkMode ? 'bg-white/10' : 'bg-amber-100/50',
                      !avatarUrl && 'border border-dashed ' + (isDarkMode ? 'border-white/20' : 'border-amber-900/20')
                    )}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon
                        className={cn(
                          'w-5 h-5 sm:w-6 sm:h-6',
                          isDarkMode ? 'text-white/30' : 'text-amber-900/30'
                        )}
                      />
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all disabled:opacity-50 active:scale-[0.98]',
                      isDarkMode
                        ? 'bg-white/5 text-white/80 border border-white/10 hover:bg-white/10'
                        : 'bg-amber-50 text-amber-800 border border-amber-900/15 hover:bg-amber-100'
                    )}
                  >
                    {uploadingAvatar ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                        Upload…
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Choisir une photo
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Commentaire */}
              <div>
                <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                  <label
                    className={cn(
                      'text-[11px] sm:text-xs font-bold',
                      isDarkMode ? 'text-white/85' : 'text-amber-950'
                    )}
                  >
                    Ton commentaire *
                  </label>
                  <span
                    className={cn(
                      'text-[10px] font-bold tabular-nums',
                      comment.length >= minCommentLength
                        ? 'text-emerald-500'
                        : isDarkMode
                        ? 'text-white/35'
                        : 'text-amber-900/35'
                    )}
                  >
                    {comment.length} / {minCommentLength} min.
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Parle-nous de ton expérience : personnalisation, réactions des invités, QR check-in…"
                  className={cn(
                    'w-full px-3 sm:px-3.5 py-2.5 sm:py-3 rounded-xl text-[13px] sm:text-sm outline-none resize-none transition-colors',
                    isDarkMode
                      ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-amber-400/40'
                      : 'bg-white border border-amber-900/15 text-amber-950 placeholder-amber-900/30 focus:border-amber-500/40'
                  )}
                />
              </div>

              {error && (
                <div
                  className={cn(
                    'flex items-start gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-medium',
                    isDarkMode
                      ? 'bg-red-500/10 border border-red-500/25 text-red-300'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  )}
                >
                  <AlertCircleFix />
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div
            className={cn(
              'px-4 sm:px-5 py-3 sm:py-4 border-t flex sm:items-center gap-2.5 sm:gap-3 transition-colors duration-500',
              'flex-col sm:flex-row',
              isDarkMode ? 'border-white/10' : 'border-amber-900/10'
            )}
          >
            <button
              onClick={onClose}
              className={cn(
                'w-full sm:flex-1 px-4 py-2.5 sm:py-3 rounded-xl text-sm font-bold transition-colors active:scale-[0.98] order-2 sm:order-1',
                isDarkMode
                  ? 'bg-white/5 text-white/80 border border-white/10 hover:bg-white/10'
                  : 'bg-white text-amber-900/70 border border-amber-900/15 hover:bg-amber-50'
              )}
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={cn(
                'w-full sm:flex-[1.5] inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] order-1 sm:order-2'
              )}
              style={{
                background:
                  'linear-gradient(135deg, #fde68a 0%, #fbbf24 40%, #d97706 70%, #7c3aed 100%)',
                color: '#0b0f17',
                boxShadow: canSubmit
                  ? '0 10px 30px -10px rgba(251,191,36,0.6)'
                  : 'none',
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi en cours…
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 fill-current" />
                  Envoyer mon avis
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const AlertCircleFix = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, marginTop: 1 }}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export default TestimonialModal;
