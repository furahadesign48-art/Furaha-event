import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameConfiguration, GameResult } from '../../services/templateService';
import { UserModel, Invite } from '../../services/templateService';
import type { ParallaxGalleryItem } from '../ui/3d-parallax-unfurling-gallery';
import { TypewriterWithPen } from '../ui/typewriter-pen';
import plume from '../../images/plume.png';

export interface AlbumLayoutProps {
  safeUserModel: any;
  safeInvite: any;
  colors: any;
  optimizedBg: string;
  optimizedPattern: string | null;
  optimizedHeaderSectionBg: string | null;
  optimizedTextSectionBg: string | null;
  optimizedDateLocationSectionBg: string | null;
  optimizedGallerySectionBg: string | null;
  optimizedRsvpDrinksSectionBg: string | null;
  optimizedGamesSectionBg: string | null;
  optimizedQrFooterSectionBg: string | null;
  optimizedAccommodationSectionBg: string | null;
  parallaxGalleryItems: ParallaxGalleryItem[];
  galleryPhotos: string[];
  eventDay: string;
  eventMonth: string;
  eventYear: string;
  targetEventDate: Date;
  qrCodeDataUrl: string;
  isOfflineMode: boolean;
  retryCountdown: number | null;
  isConfirmed: boolean;
  selectedDrink: string[];
  guestBookMessages: any[];
  editingMessageId: string | null;
  editingText: string;
  showDeleteConfirm: { isOpen: boolean; message: any | null };
  showToastModal: { isOpen: boolean; type: 'drink' | 'confirmation' | 'cancellation'; drink?: string };
  selectedGalleryPhoto: string | null;
  isMusicPlaying: boolean;
  isMusicMuted: boolean;
  showNotificationModal: boolean;
  isFCMSupported: boolean | null;
  permission: NotificationPermission;
  token: string | null;
  isNotificationLoading: boolean;
  notificationError: string | null;
  showGuestBook: boolean;
  currentGameId: string | null;
  games: GameConfiguration[];
  gameResults: Record<string, GameResult[]>;
  completedGames: Set<string>;
  invite: Invite | null;
  inviteId: string | undefined;
  userModel: UserModel | null;
  isAdminView: boolean;
  isSubmittingMessage: boolean;
  guestMessage: string;
  sectionRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  messagesEndRef: React.MutableRefObject<HTMLDivElement | null>;
  setShowToastModal: (v: { isOpen: boolean; type: 'drink' | 'confirmation' | 'cancellation'; drink?: string }) => void;
  setSelectedGalleryPhoto: (v: string | null) => void;
  setShowGuestBook: (v: boolean) => void;
  setShowNotificationModal: (v: boolean) => void;
  setCurrentGameId: (v: string | null) => void;
  setEditingMessageId: (v: string | null) => void;
  setEditingText: (v: string) => void;
  setShowDeleteConfirm: (v: { isOpen: boolean; message: any | null }) => void;
  setGuestMessage: (v: string) => void;
  toggleMute: () => void;
  toggleMusic: () => void;
  requestPermission: (ctx: { inviteId?: string; inviteDocPath?: string | null }) => Promise<void>;
  inviteDocPath: string | null;
  handleConfirmation: () => void;
  handleDrinkSelection: (drink: string) => void;
  handleSendMessage: () => void;
  handleEditMessage: (msg: any) => void;
  handleSaveEdit: (msg: any) => void;
  handleDeleteMessage: (msg: any) => void;
  confirmDelete: () => void;
  downloadQRCode: () => void;
  downloadInvitationJpg?: () => void;
  optimizeImageFn: (url: string, w?: number, q?: number) => string;
  isAdminFeatureUsed?: boolean;
}

const lighterColor = (hex: string, amt = 0.85): string => {
  try {
    const c = (hex || '#').replace('#', '');
    if (c.length < 6) return hex || '#ffffff';
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const nr = Math.min(255, Math.round(r + (255 - r) * amt));
    const ng = Math.min(255, Math.round(g + (255 - g) * amt));
    const nb = Math.min(255, Math.round(b + (255 - b) * amt));
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
  } catch {
    return hex || '#ffffff';
  }
};

const darkerColor = (hex: string, amt = 0.3): string => {
  try {
    const c = (hex || '#').replace('#', '');
    if (c.length < 6) return hex || '#000000';
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const nr = Math.max(0, Math.round(r * (1 - amt)));
    const ng = Math.max(0, Math.round(g * (1 - amt)));
    const nb = Math.max(0, Math.round(b * (1 - amt)));
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
  } catch {
    return hex || '#000000';
  }
};

const DEFAULT_COUPLE_PHOTO =
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop';

const AlbumLayout: React.FC<AlbumLayoutProps> = ({
  safeUserModel,
  safeInvite,
  colors,
  optimizedBg,
  optimizeImageFn,
  galleryPhotos,
  targetEventDate,
  isMusicPlaying,
  isMusicMuted,
  audioRef,
  toggleMute,
  toggleMusic,
}) => {
  const primaryColor = colors?.primary || '#f59e0b';
  const secondaryColor = colors?.secondary || '#d946ef';
  const accentColor = colors?.accent || lighterColor(primaryColor, 0.35);

  const title = safeUserModel?.title || 'Nous nous marions !';
  const subtitle =
    safeUserModel?.invitationTitleSubtitle ||
    'Rejoignez-nous pour célébrer notre union';
  const eventDate = safeUserModel?.eventDate || '';
  const eventTime = (safeUserModel as any)?.eventTime || '';
  const eventLocation = (safeUserModel as any)?.eventLocation || '';
  const eventAddress = (safeUserModel as any)?.eventAddress || '';
  const guestName = safeInvite?.nom || 'Invité';
  const guestTable = safeInvite?.table || 'Non assigné';
  const guestEtat = safeInvite?.etat || 'simple';
  const designBgPhoto = optimizedBg || safeUserModel?.backgroundImage || DEFAULT_COUPLE_PHOTO;
  const backgroundMusic = safeUserModel?.backgroundMusic || '';

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 767px)');
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, []);

  const [stage, setStage] = useState<'envelope' | 'opening' | 'page2'>('envelope');
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [flipProgress, setFlipProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [animatingFlip, setAnimatingFlip] = useState<0 | 1 | -1>(0);
  const dragStartX = React.useRef<number>(0);
  const currentDragX = React.useRef<number>(0);
  const flipSafetyTimer = React.useRef<number | null>(null);
  const invitationAnimLockRef = React.useRef(false);
  const invitationAnimTimerRef = React.useRef<number | null>(null);
  const [invitationStaticTick, setInvitationStaticTick] = useState(0);

  // ============================================
  // ANIMATION PLUME INVITATION : une seule fois
  // Doit être HOOK TOP-LEVEL (pas dans PAGE_3_CONTENT !)
  // pour respecter Rules of Hooks
  // ============================================
  const invitationTextGlobal = safeUserModel?.invitationText || '';
  const estPlumeChars = Math.max(
    200,
    String(invitationTextGlobal || '').replace(/<[^>]*>/g, '').length
  );
  const estPlumeMs = estPlumeChars * 50 + 2000;

  useEffect(() => {
    if (pageIndex === 1 && !invitationAnimLockRef.current) {
      if (invitationAnimTimerRef.current !== null) {
        window.clearTimeout(invitationAnimTimerRef.current);
      }
      invitationAnimTimerRef.current = window.setTimeout(() => {
        if (!invitationAnimLockRef.current) {
          invitationAnimLockRef.current = true;
          setInvitationStaticTick((n) => n + 1);
        }
      }, estPlumeMs);
    }
    // Cleanup: si on quitte la page avant la fin, on lock immédiatement pour pas rejouer au retour
    return () => {};
  }, [pageIndex, estPlumeMs]);

  // Lock immédiat si on quitte pageIndex===1 avant la fin
  useEffect(() => {
    if (pageIndex !== 1) {
      if (invitationAnimTimerRef.current !== null) {
        window.clearTimeout(invitationAnimTimerRef.current);
        invitationAnimTimerRef.current = null;
        if (!invitationAnimLockRef.current) {
          invitationAnimLockRef.current = true;
          setInvitationStaticTick((n) => n + 1);
        }
      }
    }
  }, [pageIndex]);

  const totalPages = 4;
  const isFlipping = Math.abs(flipProgress) > 0.001 || animatingFlip !== 0;

  const clearFlipSafety = () => {
    if (flipSafetyTimer.current !== null) {
      window.clearTimeout(flipSafetyTimer.current);
      flipSafetyTimer.current = null;
    }
  };

  const handleOpenEnvelope = () => {
    if (stage !== 'envelope') return;
    clearFlipSafety();
    setPageIndex(0);
    setFlipProgress(0);
    setAnimatingFlip(0);
    setStage('opening');
    setTimeout(() => setStage('page2'), 1500);
  };

  const commitFlip = () => {
    clearFlipSafety();
    if (animatingFlip === 1 && pageIndex < totalPages - 1) {
      setPageIndex((p) => p + 1);
    } else if (animatingFlip === -1 && pageIndex > 0) {
      setPageIndex((p) => p - 1);
    }
    setFlipProgress(0);
    setAnimatingFlip(0);
  };

  const onDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (stage !== 'page2' || animatingFlip !== 0) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStartX.current = e.clientX;
    currentDragX.current = e.clientX;
    setIsDragging(true);
  };

  const onDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || stage !== 'page2' || animatingFlip !== 0) return;
    currentDragX.current = e.clientX;
    const deltaX = currentDragX.current - dragStartX.current;
    const viewportWidth =
      typeof window !== 'undefined' ? window.innerWidth : 400;
    if (deltaX < 0) {
      if (pageIndex < totalPages - 1) {
        const p = Math.min(1, Math.abs(deltaX) / (viewportWidth * 0.32));
        setFlipProgress(p);
      } else {
        setFlipProgress(0);
      }
    } else {
      if (pageIndex > 0) {
        const p = Math.min(1, Math.abs(deltaX) / (viewportWidth * 0.32));
        setFlipProgress(-p);
      } else {
        setFlipProgress(0);
      }
    }
  };

  const onDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || stage !== 'page2') return;
    setIsDragging(false);
    const deltaX = currentDragX.current - dragStartX.current;
    const threshold =
      (typeof window !== 'undefined' ? window.innerWidth : 400) * 0.11;
    if (deltaX < -threshold && pageIndex < totalPages - 1) {
      clearFlipSafety();
      setAnimatingFlip(1);
      flipSafetyTimer.current = window.setTimeout(commitFlip, 700);
      return;
    } else if (deltaX > threshold && pageIndex > 0) {
      clearFlipSafety();
      setAnimatingFlip(-1);
      flipSafetyTimer.current = window.setTimeout(commitFlip, 700);
      return;
    }
    setFlipProgress(0);
  };

  const envelopeColor = primaryColor;

  const PAGE_EMPTY = (bgColor: string) => (
    <>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0'/></filter><rect width='300' height='300' filter='url(%23n)'/></svg>"), url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='500' height='500' viewBox='0 0 500 500'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.18' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.06 0'/></filter><rect width='500' height='500' filter='url(%23f)'/></svg>")`,
          backgroundSize: '300px 300px, 500px 500px',
          backgroundRepeat: 'repeat, repeat',
          mixBlendMode: 'multiply',
          opacity: 0.95,
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: `
            radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 55%),
            radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.22) 0%, transparent 60%)
          `,
        }}
      />
    </>
  );

  const PAGE_2_CONTENT = () => (
    <>
      {PAGE_EMPTY(secondaryColor)}
      {backgroundMusic && (
        <audio ref={audioRef} src={backgroundMusic} loop preload="auto" />
      )}
      <img
        src="/bouquet1.png"
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          top: isMobile ? '17%' : '15%',
          left: isMobile ? '-2%' : '-3%',
          width: isMobile ? '45%' : '40%',
          height: 'auto',
          transform: 'rotate(-8deg)',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 2,
          filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.18))',
        }}
      />
      <img
        src="/bouquet3.png"
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          top: isMobile ? '19%' : '17%',
          right: isMobile ? '0%' : '1%',
          width: isMobile ? '22%' : '20%',
          height: 'auto',
          transform: 'rotate(22deg)',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 2,
          filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.15))',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: isMobile ? '6%' : '5%',
          left: 0,
          right: 0,
          textAlign: 'center',
          padding: '0 12%',
          zIndex: 6,
        }}
      >
        {subtitle && (
          <div
            style={{
              marginBottom: isMobile ? 10 : 12,
              fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
              fontSize: isMobile ? 'clamp(12px, 3vw, 16px)' : '15px',
              letterSpacing: '0.28em',
              color: lighterColor(primaryColor, 0.85),
              fontWeight: 500,
              textTransform: 'uppercase',
              textShadow: '0 1px 4px rgba(0,0,0,0.12)',
            }}
          >
            ❦ {subtitle} ❦
          </div>
        )}
        <h1
          style={{
            margin: 0,
            fontFamily:
              "'Great Vibes', 'Dancing Script', 'Parisienne', 'Playfair Display', 'Cormorant Garamond', Georgia, cursive, serif",
            fontSize: isMobile ? 'clamp(36px, 9vw, 58px)' : 'clamp(42px, 5vw, 60px)',
            fontWeight: 400,
            color: lighterColor(primaryColor, 0.97),
            lineHeight: 1,
            letterSpacing: '0.01em',
            textShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          {title}
        </h1>
        {eventDate && (
          <div
            style={{
              marginTop: isMobile ? 14 : 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? 10 : 14,
            }}
          >
            <div
              aria-hidden
              style={{
                flex: 1,
                maxWidth: 60,
                height: 1,
                background: `linear-gradient(90deg, transparent 0%, ${lighterColor(primaryColor, 0.5)} 100%)`,
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 8 : 10,
              }}
            >
              <span
                aria-hidden
                style={{
                  fontSize: isMobile ? 14 : 16,
                  color: lighterColor(primaryColor, 0.75),
                }}
              >
                ❧
              </span>
              <div
                style={{
                  fontFamily: "'Great Vibes', 'Dancing Script', 'Parisienne', cursive",
                  fontSize: isMobile ? 'clamp(22px, 5.8vw, 34px)' : 'clamp(24px, 3vw, 36px)',
                  color: lighterColor(primaryColor, 0.96),
                  fontWeight: 400,
                  letterSpacing: '0.02em',
                  lineHeight: 1,
                  textShadow: '0 2px 6px rgba(0,0,0,0.2)',
                }}
              >
                {eventDate}
              </div>
              <span
                aria-hidden
                style={{
                  fontSize: isMobile ? 14 : 16,
                  color: lighterColor(primaryColor, 0.75),
                  transform: 'scaleX(-1)',
                }}
              >
                ❧
              </span>
            </div>
            <div
              aria-hidden
              style={{
                flex: 1,
                maxWidth: 60,
                height: 1,
                background: `linear-gradient(90deg, ${lighterColor(primaryColor, 0.5)} 0%, transparent 100%)`,
              }}
            />
          </div>
        )}
      </div>
      <div
        style={{
          position: 'absolute',
          top: '49%',
          left: '50%',
          transform: 'translate(-50%, -46%)',
          width: isMobile ? '72%' : '68%',
          aspectRatio: '4 / 5',
          zIndex: 5,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(ellipse at 20% 10%, rgba(255,255,255,0.45) 0%, transparent 45%),
              linear-gradient(160deg, #f8ebd2 0%, #e8d2ac 35%, #dcc192 68%, #cda975 100%)
            `,
            backgroundColor: '#f0dfc4',
            borderRadius: isMobile ? 6 : 8,
            boxShadow:
              '0 30px 70px rgba(0,0,0,0.42), 0 14px 28px rgba(0,0,0,0.28), 0 4px 10px rgba(0,0,0,0.18), inset 0 2px 0 rgba(255,255,255,0.75), inset 0 -3px 14px rgba(0,0,0,0.12)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '38%',
            background: `
              linear-gradient(180deg, ${darkerColor('#f0dfc4', 0.14)} 0%, ${darkerColor('#f0dfc4', 0.08)} 55%, ${lighterColor('#f0dfc4', 0.02)} 100%)
            `,
            backgroundColor: '#e6d2b3',
            clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            zIndex: 1,
            boxShadow: 'inset 0 -6px 14px rgba(0,0,0,0.16)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '62%',
            zIndex: 4,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `
                linear-gradient(135deg, rgba(255,252,242,0.5) 0%, transparent 30%),
                linear-gradient(135deg, #f5e6cc 0%, #ecd8b7 55%, #d4b888 100%)
              `,
              clipPath: 'polygon(0 0, 0 100%, 100% 100%, 50% 0)',
              boxShadow:
                'inset -2px 0 0 rgba(0,0,0,0.10), inset 3px 3px 0 rgba(255,255,255,0.35), 0 0 0 rgba(0,0,0,0)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `
                linear-gradient(225deg, rgba(255,252,242,0.4) 0%, transparent 30%),
                linear-gradient(225deg, #f5e6cc 0%, #ead3ad 55%, #d4b381 100%)
              `,
              clipPath: 'polygon(100% 0, 0 100%, 100% 100%)',
              boxShadow:
                'inset 2px 0 0 rgba(0,0,0,0.10), inset -3px 3px 0 rgba(255,255,255,0.35), 0 0 0 rgba(0,0,0,0)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: '1px',
              background:
                'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.18) 48%, rgba(0,0,0,0.22) 50%, rgba(0,0,0,0.18) 52%, transparent 100%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: '1px',
              transform: 'translateX(-0.5px)',
              background:
                'linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.08) 60%, transparent 100%)',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            top: '-16%',
            left: '8%',
            right: '8%',
            aspectRatio: '3 / 4',
            backgroundColor: '#ffffff',
            padding: isMobile ? '5% 5% 18% 5%' : '4% 4% 16% 4%',
            boxSizing: 'border-box',
            transform: 'rotate(-6deg)',
            boxShadow:
              '0 12px 28px rgba(0,0,0,0.3), 0 4px 10px rgba(0,0,0,0.18)',
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#111',
              overflow: 'hidden',
              backgroundImage: `url(${designBgPhoto})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'saturate(0.9)',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            top: '22%',
            left: '50%',
            width: isMobile ? '34%' : '30%',
            aspectRatio: '3 / 4',
            zIndex: 3,
            transform: 'rotate(12deg)',
            filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.25))',
          }}
        >
          <svg
            viewBox="0 0 300 400"
            preserveAspectRatio="none"
            style={{ width: '100%', height: '100%', display: 'block' }}
          >
            <defs>
              <linearGradient id="labelBgGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={lighterColor(secondaryColor, 0.15)} />
                <stop offset="55%" stopColor={secondaryColor} />
                <stop offset="100%" stopColor={darkerColor(secondaryColor, 0.18)} />
              </linearGradient>
              <filter id="labelInnerShadow">
                <feOffset dx="0" dy="2" />
                <feGaussianBlur stdDeviation="3" result="offset-blur" />
                <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                <feFlood floodColor="rgba(0,0,0,0.35)" result="color" />
                <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                <feComposite operator="over" in="shadow" in2="SourceGraphic" />
              </filter>
            </defs>
            <path
              d="M 24 8 C 40 -2, 62 2, 76 10 C 94 0, 118 0, 134 10 C 152 -2, 176 -2, 194 10 C 212 0, 236 0, 254 10 C 272 -2, 288 6, 292 24 C 302 44, 298 66, 290 82 C 302 100, 302 126, 290 146 C 302 164, 302 190, 290 210 C 302 228, 302 254, 290 274 C 302 292, 302 318, 290 338 C 298 358, 302 378, 292 394 C 284 406, 266 406, 250 398 C 234 410, 210 410, 194 398 C 176 410, 152 410, 134 398 C 118 410, 94 410, 76 398 C 60 410, 36 410, 22 396 C 6 390, 2 370, 10 350 C -2 332, -2 306, 10 286 C -2 268, -2 242, 10 222 C -2 204, -2 178, 10 158 C -2 140, -2 114, 10 94 C -2 76, 2 52, 10 34 C 2 18, 8 14, 24 8 Z"
              fill="url(#labelBgGrad)"
              filter="url(#labelInnerShadow)"
              stroke={lighterColor(secondaryColor, 0.45)}
              strokeWidth="2"
            />
            <path
              d="M 44 28 C 60 20, 82 24, 96 32 C 114 22, 138 22, 154 32 C 172 20, 196 20, 214 32 C 232 22, 256 22, 272 32 L 274 50 C 264 62, 264 84, 274 102 L 274 120 C 264 138, 264 162, 274 180 L 274 198 C 264 216, 264 240, 274 258 L 274 276 C 264 294, 264 318, 274 336 L 272 356 C 256 366, 232 366, 214 356 C 196 368, 172 368, 154 356 C 138 368, 114 368, 96 356 C 80 368, 56 368, 40 356 L 28 338 C 38 320, 38 296, 28 278 L 28 260 C 38 242, 38 218, 28 200 L 28 182 C 38 164, 38 140, 28 122 L 28 104 C 38 86, 38 62, 28 44 Z"
              fill="none"
              stroke={lighterColor(secondaryColor, 0.65)}
              strokeWidth="1.2"
              opacity="0.9"
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: isMobile ? '16% 12%' : '14% 10%',
              boxSizing: 'border-box',
              gap: isMobile ? 4 : 6,
            }}
          >
            <span
              style={{
                fontFamily: "'Great Vibes', 'Dancing Script', 'Parisienne', cursive",
                fontSize: isMobile ? 'clamp(22px, 6.8vw, 38px)' : 'clamp(20px, 2.4vw, 30px)',
                color: lighterColor(secondaryColor, 0.98),
                fontWeight: 400,
                lineHeight: 1,
                textShadow: '0 2px 4px rgba(0,0,0,0.35)',
              }}
            >
              Save
            </span>
            <span
              style={{
                fontFamily: "'Great Vibes', 'Dancing Script', 'Parisienne', cursive",
                fontSize: isMobile ? 'clamp(22px, 6.8vw, 38px)' : 'clamp(20px, 2.4vw, 30px)',
                color: lighterColor(secondaryColor, 0.98),
                fontWeight: 400,
                lineHeight: 1,
                textShadow: '0 2px 4px rgba(0,0,0,0.35)',
              }}
            >
              The
            </span>
            <span
              style={{
                fontFamily: "'Great Vibes', 'Dancing Script', 'Parisienne', cursive",
                fontSize: isMobile ? 'clamp(22px, 6.8vw, 38px)' : 'clamp(20px, 2.4vw, 30px)',
                color: lighterColor(secondaryColor, 0.98),
                fontWeight: 400,
                lineHeight: 1,
                textShadow: '0 2px 4px rgba(0,0,0,0.35)',
              }}
            >
              Date
            </span>
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            top: '-5%',
            right: '-2%',
            width: isMobile ? '32%' : '28%',
            aspectRatio: '1 / 1',
            zIndex: 7,
            backgroundImage: "url('/bouquet4.png')",
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            transform: 'rotate(35deg) scaleX(-1)',
            filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.2))',
            opacity: 0.95,
            pointerEvents: 'none',
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: isMobile ? '28.5%' : '27.5%',
          left: 0,
          right: 0,
          textAlign: 'center',
          padding: '0 12%',
          zIndex: 6,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? 10 : 14,
            flexWrap: 'wrap',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              position: 'relative',
              padding: isMobile ? '7px 11px 9px 18px' : '8px 13px 11px 26px',
              backgroundColor: lighterColor(primaryColor, 0.92),
              color: darkerColor(primaryColor, 0.55),
              borderRadius: 2,
              boxShadow: '0 10px 22px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)',
              maxWidth: isMobile ? '86%' : '72%',
              gap: isMobile ? 7 : 11,
            }}
          >
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: isMobile ? 3 : 4,
                border: `1px solid ${darkerColor(primaryColor, 0.45)}`,
                borderRadius: 1,
                pointerEvents: 'none',
              }}
            />
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: isMobile ? -9 : -11,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: isMobile ? 16 : 18,
                color: lighterColor(primaryColor, 0.95),
                lineHeight: 1,
                textShadow: '0 1px 3px rgba(0,0,0,0.35)',
              }}
            >
              ❦
            </div>
            <h2
              style={{
                margin: 0,
                flex: 1,
                minWidth: 0,
                fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                fontSize: isMobile ? 'clamp(13px, 3.8vw, 22px)' : 'clamp(16px, 1.9vw, 23px)',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: darkerColor(primaryColor, 0.6),
                whiteSpace: 'normal',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.15,
                wordBreak: 'break-word',
              }}
            >
              {guestName}
            </h2>
            {guestEtat === 'couple' && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  gap: isMobile ? 3 : 4,
                  padding: isMobile ? '2px 6px 2px 6px' : '2px 8px 3px 8px',
                  borderRadius: 999,
                  background: `linear-gradient(135deg, ${lighterColor(secondaryColor, 0.25)} 0%, ${lighterColor(primaryColor, 0.15)} 100%)`,
                  border: `1px solid ${lighterColor(secondaryColor, 0.6)}`,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }}
              >
                <svg
                  width={isMobile ? 8 : 9}
                  height={isMobile ? 8 : 9}
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M12 21s-7-4.35-9.33-8.5C.64 8.66 3 5 6.35 5c1.8 0 3.39.93 4.3 2.36.15.23.27.47.35.72.08-.25.2-.49.35-.72C12.26 5.93 13.85 5 15.65 5 19 5 21.36 8.66 21.33 12.5 19 16.65 12 21 12 21z"
                    stroke={lighterColor(secondaryColor, 0.95)}
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={lighterColor(secondaryColor, 0.25)}
                  />
                </svg>
                <span
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: isMobile ? 'clamp(7.5px, 1.9vw, 9.5px)' : '9px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: lighterColor(primaryColor, 0.98),
                    fontWeight: 600,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Couple
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: isMobile ? '24.5%' : '23.5%',
          left: 0,
          right: 0,
          textAlign: 'center',
          padding: '0 12%',
          zIndex: 6,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? 8 : 10,
          }}
        >
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              width: 1,
              height: isMobile ? 13 : 15,
              background: lighterColor(primaryColor, 0.5),
              opacity: 0.7,
            }}
          />
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: isMobile ? 5 : 7,
              padding: isMobile ? '2.5px 10px 3.5px 10px' : '3.5px 13px 4.5px 13px',
              borderRadius: 999,
              background: `linear-gradient(135deg, ${lighterColor(secondaryColor, 0.2)} 0%, ${lighterColor(primaryColor, 0.12)} 100%)`,
              border: `1px solid ${lighterColor(primaryColor, 0.55)}`,
              boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
              maxWidth: isMobile ? '62%' : '46%',
            }}
          >
            <svg
              width={isMobile ? 10 : 12}
              height={isMobile ? 10 : 12}
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
              style={{ flexShrink: 0 }}
            >
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke={lighterColor(primaryColor, 0.97)}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M6 6L9 3M18 6L15 3M9 3a2 2 0 0 1 3 0M15 3a2 2 0 0 0 3 0"
                stroke={lighterColor(primaryColor, 0.85)}
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: isMobile ? 'clamp(9.5px, 2.3vw, 12px)' : '11.5px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: lighterColor(primaryColor, 0.98),
                fontWeight: 600,
                lineHeight: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Table {guestTable}
            </span>
          </div>
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              width: 1,
              height: isMobile ? 13 : 15,
              background: lighterColor(primaryColor, 0.5),
              opacity: 0.7,
            }}
          />
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: isMobile ? '3%' : '2.5%',
          left: 0,
          right: 0,
          textAlign: 'center',
          padding: '0 10%',
          zIndex: 8,
        }}
      >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? 8 : 14,
              width: '100%',
            }}
          >
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleMusic();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: isMobile ? 4 : 6,
                cursor: 'pointer',
                color: lighterColor(primaryColor, 0.95),
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))',
                touchAction: 'none',
              }}
              aria-label="Piste précédente"
            >
              <svg
                width={isMobile ? 22 : 26}
                height={isMobile ? 22 : 26}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M19 20L9 12l10-8v16zM5 4v16"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div
              style={{
                position: 'relative',
                width: isMobile ? 82 : 108,
                height: isMobile ? 82 : 108,
                flexShrink: 0,
                display: 'inline-block',
                filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.35))',
              }}
            >
              <svg
                viewBox="0 0 120 120"
                width="100%"
                height="100%"
                style={{
                  display: 'block',
                  animation: 'albumSpin 3.6s linear infinite',
                  animationPlayState: isMusicPlaying ? 'running' : 'paused',
                  transformOrigin: '50% 50%',
                }}
              >
                <defs>
                  <radialGradient id="vinylBlack" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#1a1a1a" />
                    <stop offset="55%" stopColor="#0a0a0a" />
                    <stop offset="100%" stopColor="#000000" />
                  </radialGradient>
                  <radialGradient id="vinylGold" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fff4c7" />
                    <stop offset="35%" stopColor="#f0c76a" />
                    <stop offset="70%" stopColor="#c79637" />
                    <stop offset="100%" stopColor="#8a6117" />
                  </radialGradient>
                </defs>
                <circle cx="60" cy="60" r="58" fill="url(#vinylBlack)" />
                <circle cx="60" cy="60" r="55" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.6" />
                <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.6" />
                <circle cx="60" cy="60" r="41" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.6" />
                <circle cx="60" cy="60" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.6" />
                <circle cx="60" cy="60" r="26" fill="url(#vinylGold)" />
                <circle cx="60" cy="60" r="26" fill="none" stroke={darkerColor(primaryColor, 0.2)} strokeWidth="1" />
                <circle cx="60" cy="60" r="7" fill="#050505" />
                <circle cx="60" cy="60" r="3" fill="#111111" />
              </svg>
              <button
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  toggleMusic();
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  margin: 'auto',
                  width: isMobile ? 30 : 40,
                  height: isMobile ? 30 : 40,
                  borderRadius: '50%',
                  border: `1.5px solid ${lighterColor(primaryColor, 0.4)}`,
                  background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.18) 0%, rgba(0,0,0,0.18) 100%), rgba(0,0,0,0.55)`,
                  backdropFilter: 'blur(2px)',
                  cursor: 'pointer',
                  color: lighterColor(primaryColor, 0.98),
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow:
                    '0 4px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
                  touchAction: 'none',
                }}
                aria-label={isMusicPlaying ? 'Pause' : 'Lecture'}
              >
                {isMusicPlaying ? (
                  <svg
                    width={isMobile ? 12 : 16}
                    height={isMobile ? 12 : 16}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <svg
                    width={isMobile ? 12 : 16}
                    height={isMobile ? 12 : 16}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M8 5.14v13.72a1 1 0 0 0 1.52.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z" />
                  </svg>
                )}
              </button>
            </div>
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleMusic();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: isMobile ? 4 : 6,
                cursor: 'pointer',
                color: lighterColor(primaryColor, 0.95),
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))',
                touchAction: 'none',
              }}
              aria-label="Piste suivante"
            >
              <svg
                width={isMobile ? 22 : 26}
                height={isMobile ? 22 : 26}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M5 4l10 8-10 8V4zM19 4v16"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <div
            style={{
              marginTop: isMobile ? 6 : 8,
              fontFamily: "'Great Vibes', 'Dancing Script', 'Parisienne', cursive",
              fontSize: isMobile ? 'clamp(16px, 4.6vw, 26px)' : 'clamp(18px, 2.4vw, 30px)',
              color: lighterColor(secondaryColor, 0.98),
              lineHeight: 1,
              textShadow: '0 2px 6px rgba(0,0,0,0.3)',
              letterSpacing: '0.01em',
            }}
          >
            Le son de l'amour
          </div>
        </div>
      <style>{`
        @keyframes albumSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );

  const PAGE_3_CONTENT = () => {
    const photo1 =
      galleryPhotos && galleryPhotos[0]
        ? optimizeImageFn(galleryPhotos[0], 600, 80)
        : designBgPhoto;
    const photo2 =
      galleryPhotos && galleryPhotos[1]
        ? optimizeImageFn(galleryPhotos[1], 600, 80)
        : galleryPhotos && galleryPhotos[0]
        ? optimizeImageFn(galleryPhotos[0], 600, 80)
        : designBgPhoto;

    const invitationText = safeUserModel?.invitationText || '';
    const htmlContent = String(invitationText)
      .replace(/\[b\]/g, '<strong>')
      .replace(/\[\/b\]/g, '</strong>')
      .replace(/\[color=(.*?)\]/g, '<span style="color: $1">')
      .replace(/\[\/color\]/g, '</span>');

    // Animation plume UNE SEULE FOIS : lock & tick sont gérés au top-level
    // (pour Rules of Hooks). On lit ici le résultat.
    const useStaticInvitation = invitationAnimLockRef.current;
    void invitationStaticTick;

    return (
      <>
        {PAGE_EMPTY(secondaryColor)}

        {/* Bouquet droit — tout en haut au coin haut-droite derrière les photos */}
        <img
          src="/bouquet2.png"
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            top: isMobile ? '5%' : '3%',
            right: isMobile ? '-2%' : '-3%',
            width: isMobile ? '34%' : '30%',
            height: 'auto',
            transform: 'rotate(18deg)',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 2,
            filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))',
            opacity: 0.95,
          }}
        />

        {/* 2 Polaroid galerie avec l'effet chevauchement comme sur le design */}
        <div
          style={{
            position: 'absolute',
            top: isMobile ? '6%' : '5%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: isMobile ? '88%' : '82%',
            maxWidth: 420,
            aspectRatio: '1 / 1.1',
            zIndex: 5,
            pointerEvents: 'none',
          }}
        >
          {/* Polaroid 1 — photo 1, penché à gauche */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: isMobile ? '-2%' : '0%',
              width: isMobile ? '60%' : '58%',
              aspectRatio: '3 / 4',
              backgroundColor: '#ffffff',
              padding: isMobile ? '4% 4% 14% 4%' : '3.5% 3.5% 12% 3.5%',
              boxSizing: 'border-box',
              transform: 'rotate(-8deg)',
              boxShadow:
                '0 14px 34px rgba(0,0,0,0.32), 0 5px 14px rgba(0,0,0,0.22), 0 2px 4px rgba(0,0,0,0.12)',
              zIndex: 2,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                backgroundImage: `url(${photo1})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: '#111',
              }}
            />
          </div>

          {/* Polaroid 2 — photo 2, N&B, penché à droite, chevauche */}
          <div
            style={{
              position: 'absolute',
              top: isMobile ? '14%' : '12%',
              right: isMobile ? '-2%' : '0%',
              width: isMobile ? '60%' : '58%',
              aspectRatio: '3 / 4',
              backgroundColor: '#ffffff',
              padding: isMobile ? '4% 4% 14% 4%' : '3.5% 3.5% 12% 3.5%',
              boxSizing: 'border-box',
              transform: 'rotate(7deg)',
              boxShadow:
                '0 16px 36px rgba(0,0,0,0.34), 0 6px 16px rgba(0,0,0,0.24), 0 2px 5px rgba(0,0,0,0.14)',
              zIndex: 3,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                backgroundImage: `url(${photo2})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: '#111',
                filter: 'grayscale(1) contrast(1.03) brightness(0.98)',
              }}
            />
          </div>



          {/* Bague (bagues.png) */}
          <img
            src="/bagues.png"
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: '50%',
              top: isMobile ? '76%' : '74%',
              transform: 'translate(-50%, 0) rotate(-6deg)',
              width: isMobile ? '22%' : '20%',
              height: 'auto',
              zIndex: 5,
              pointerEvents: 'none',
              userSelect: 'none',
              filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.3))',
            }}
          />
        </div>

        {/* Carte blanche texte invitation — LARGEUR RÉDUITE + TOP COMMENCE PLUS HAUT; police rotique; plume UNE FOIS */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: isMobile ? '40%' : '38%',
            bottom: isMobile ? '2%' : '1.5%',
            margin: '0 auto',
            width: isMobile ? '78%' : '74%',
            maxWidth: 390,
            zIndex: 3,
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              padding: isMobile ? '34px 22px 22px 22px' : '40px 30px 26px 30px',
              background: `
                radial-gradient(ellipse at 20% 0%, rgba(255,255,255,0.9) 0%, transparent 55%),
                radial-gradient(ellipse at 80% 100%, rgba(255,255,255,0.85) 0%, transparent 60%),
                linear-gradient(180deg, #fefbf4 0%, #faf3e2 55%, #f6edd5 100%)
              `,
              backgroundColor: '#fefbf4',
              borderRadius: 3,
              boxShadow:
                '0 34px 70px rgba(0,0,0,0.34), 0 16px 34px rgba(0,0,0,0.22), 0 6px 14px rgba(0,0,0,0.14), 0 2px 5px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -2px 8px rgba(175,140,80,0.08)',
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
          >
            {/* Texture papier luxe grain fin */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260' viewBox='0 0 260 260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.68 0 0 0 0 0.55 0 0 0 0 0.35 0 0 0 0.09 0'/></filter><rect width='260' height='260' filter='url(%23n)'/></svg>")`,
                backgroundSize: '260px 260px',
                backgroundRepeat: 'repeat',
                mixBlendMode: 'multiply',
                opacity: 0.55,
              }}
            />
            {/* Cachet lumière haut */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '40%',
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 55%, transparent 100%)',
                pointerEvents: 'none',
              }}
            />
            {/* Double encadrement luxe */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: isMobile ? 8 : 10,
                border: `1px solid ${lighterColor(darkerColor(primaryColor, 0.12), 0.15)}`,
                borderRadius: 2,
                pointerEvents: 'none',
                boxShadow: `inset 0 0 0 4px rgba(255,255,255,0.25), inset 0 0 0 5px ${lighterColor(darkerColor(primaryColor, 0.25), 0.4)}`,
              }}
            />
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: isMobile ? 14 : 18,
                border: `1px solid ${lighterColor(darkerColor(primaryColor, 0.3), 0.3)}`,
                borderRadius: 1,
                pointerEvents: 'none',
                opacity: 0.6,
              }}
            />
            {/* Coins ornés */}
            <svg
              aria-hidden
              viewBox="0 0 60 60"
              style={{
                position: 'absolute',
                top: isMobile ? 10 : 12,
                left: isMobile ? 10 : 12,
                width: isMobile ? 36 : 42,
                height: isMobile ? 36 : 42,
                pointerEvents: 'none',
                overflow: 'visible',
              }}
            >
              <g
                fill="none"
                stroke={lighterColor(darkerColor(primaryColor, 0.2), 0.35)}
                strokeWidth="1"
                strokeLinecap="round"
              >
                <path d="M4 28 C 4 14, 14 4, 28 4" />
                <path d="M4 42 C 4 36, 10 30, 16 24 M24 16 C 30 10, 36 4, 42 4" opacity="0.75" />
                <circle cx="30" cy="30" r="2.5" fill={lighterColor(darkerColor(primaryColor, 0.1), 0.45)} stroke="none" opacity="0.85" />
                <circle cx="44" cy="12" r="1.4" fill={lighterColor(darkerColor(primaryColor, 0.1), 0.55)} stroke="none" />
              </g>
            </svg>
            <svg
              aria-hidden
              viewBox="0 0 60 60"
              style={{
                position: 'absolute',
                top: isMobile ? 10 : 12,
                right: isMobile ? 10 : 12,
                width: isMobile ? 36 : 42,
                height: isMobile ? 36 : 42,
                pointerEvents: 'none',
                overflow: 'visible',
                transform: 'scaleX(-1)',
              }}
            >
              <g
                fill="none"
                stroke={lighterColor(darkerColor(primaryColor, 0.2), 0.35)}
                strokeWidth="1"
                strokeLinecap="round"
              >
                <path d="M4 28 C 4 14, 14 4, 28 4" />
                <path d="M4 42 C 4 36, 10 30, 16 24 M24 16 C 30 10, 36 4, 42 4" opacity="0.75" />
                <circle cx="30" cy="30" r="2.5" fill={lighterColor(darkerColor(primaryColor, 0.1), 0.45)} stroke="none" opacity="0.85" />
                <circle cx="44" cy="12" r="1.4" fill={lighterColor(darkerColor(primaryColor, 0.1), 0.55)} stroke="none" />
              </g>
            </svg>
            <svg
              aria-hidden
              viewBox="0 0 60 60"
              style={{
                position: 'absolute',
                bottom: isMobile ? 10 : 12,
                left: isMobile ? 10 : 12,
                width: isMobile ? 36 : 42,
                height: isMobile ? 36 : 42,
                pointerEvents: 'none',
                overflow: 'visible',
                transform: 'scaleY(-1)',
              }}
            >
              <g
                fill="none"
                stroke={lighterColor(darkerColor(primaryColor, 0.2), 0.35)}
                strokeWidth="1"
                strokeLinecap="round"
              >
                <path d="M4 28 C 4 14, 14 4, 28 4" />
                <path d="M4 42 C 4 36, 10 30, 16 24 M24 16 C 30 10, 36 4, 42 4" opacity="0.75" />
                <circle cx="30" cy="30" r="2.5" fill={lighterColor(darkerColor(primaryColor, 0.1), 0.45)} stroke="none" opacity="0.85" />
                <circle cx="44" cy="12" r="1.4" fill={lighterColor(darkerColor(primaryColor, 0.1), 0.55)} stroke="none" />
              </g>
            </svg>
            <svg
              aria-hidden
              viewBox="0 0 60 60"
              style={{
                position: 'absolute',
                bottom: isMobile ? 10 : 12,
                right: isMobile ? 10 : 12,
                width: isMobile ? 36 : 42,
                height: isMobile ? 36 : 42,
                pointerEvents: 'none',
                overflow: 'visible',
                transform: 'scale(-1, -1)',
              }}
            >
              <g
                fill="none"
                stroke={lighterColor(darkerColor(primaryColor, 0.2), 0.35)}
                strokeWidth="1"
                strokeLinecap="round"
              >
                <path d="M4 28 C 4 14, 14 4, 28 4" />
                <path d="M4 42 C 4 36, 10 30, 16 24 M24 16 C 30 10, 36 4, 42 4" opacity="0.75" />
                <circle cx="30" cy="30" r="2.5" fill={lighterColor(darkerColor(primaryColor, 0.1), 0.45)} stroke="none" opacity="0.85" />
                <circle cx="44" cy="12" r="1.4" fill={lighterColor(darkerColor(primaryColor, 0.1), 0.55)} stroke="none" />
              </g>
            </svg>
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: isMobile ? 6 : 7,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: isMobile ? 16 : 18,
                color: lighterColor(darkerColor(primaryColor, 0.15), 0.45),
                lineHeight: 1,
                textShadow: '0 1px 2px rgba(255,255,255,0.7), 0 1px 0 rgba(120,90,40,0.18)',
                zIndex: 2,
              }}
            >
              ❦
            </div>
            <div
              style={{
                position: 'relative',
                height: '100%',
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollbarWidth: 'thin',
              }}
            >
              {subtitle && (
                <div
                  style={{
                    marginBottom: isMobile ? 6 : 8,
                    marginTop: isMobile ? 18 : 22,
                    fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                    fontSize: isMobile ? 'clamp(11px, 2.6vw, 14px)' : '13px',
                    letterSpacing: '0.22em',
                    color: secondaryColor,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    lineHeight: 1.3,
                  }}
                >
                  {subtitle}
                </div>
              )}
              {title && (
                <h2
                  style={{
                    margin: 0,
                    marginBottom: isMobile ? 10 : 14,
                    fontFamily:
                      "'Great Vibes', 'Dancing Script', 'Parisienne', 'Playfair Display', 'Cormorant Garamond', Georgia, cursive, serif",
                    fontSize: isMobile ? 'clamp(28px, 7vw, 44px)' : 'clamp(32px, 3.8vw, 48px)',
                    fontWeight: 400,
                    color: secondaryColor,
                    lineHeight: 1.05,
                    letterSpacing: '0.01em',
                    textAlign: 'center',
                  }}
                >
                  {title}
                </h2>
              )}
              {!invitationText ? (
                <div
                  style={{
                    fontFamily: "'Great Vibes', 'Parisienne', 'Dancing Script', cursive",
                    fontSize: isMobile ? 19 : 21,
                    lineHeight: 1.25,
                    textAlign: 'center',
                    color: '#000000',
                    fontStyle: 'italic',
                    padding: '12px 4px',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  Votre texte d'invitation apparaîtra ici…
                </div>
              ) : useStaticInvitation ? (
                <div
                  className={
                    isMobile
                      ? 'w-full [&>p]:my-1 [&>p]:mb-1.5'
                      : 'w-full [&>p]:my-1 [&>p]:mb-2'
                  }
                  style={{
                    color: '#000000',
                    fontFamily:
                      "'Great Vibes', 'Parisienne', 'Dancing Script', cursive",
                    textAlign: 'center',
                    fontSize: isMobile ? 19 : 21,
                    lineHeight: 1.25,
                  }}
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              ) : (
                <TypewriterWithPen
                  className={
                    isMobile
                      ? 'w-full [&>p]:my-1 [&>p]:mb-1.5'
                      : 'w-full [&>p]:my-1 [&>p]:mb-2'
                  }
                  style={{
                    color: '#000000',
                    fontFamily:
                      "'Great Vibes', 'Parisienne', 'Dancing Script', cursive",
                    textAlign: 'center',
                    fontSize: isMobile ? 19 : 21,
                    lineHeight: 1.25,
                  }}
                  penImage={plume}
                  speed={48}
                  htmlContent={htmlContent}
                />
              )}
            </div>
            <div
              aria-hidden
              style={{
                position: 'absolute',
                bottom: isMobile ? 6 : 7,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: isMobile ? 14 : 16,
                color: lighterColor(darkerColor(primaryColor, 0.15), 0.48),
                lineHeight: 1,
                textShadow: '0 1px 2px rgba(255,255,255,0.7), 0 1px 0 rgba(120,90,40,0.18)',
                zIndex: 2,
              }}
            >
              ❧
            </div>
          </div>
        </div>

        {/* Fleur gauche bouquet3 — remontée, au-dessus de la carte du texte d'invitation */}
        <img
          src="/bouquet3.png"
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            top: isMobile ? '38%' : '36%',
            left: isMobile ? '-4%' : '-6%',
            width: isMobile ? '36%' : '32%',
            height: 'auto',
            transform: 'rotate(-14deg)',
            zIndex: 4,
            pointerEvents: 'none',
            userSelect: 'none',
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.28))',
            opacity: 0.97,
          }}
        />
      </>
    );
  };

  const PAGE_4_CONTENT = () => {
    const photo1 =
      (safeUserModel as any)?.invitationTextPhoto
        ? optimizeImageFn((safeUserModel as any).invitationTextPhoto, 600, 80)
        : designBgPhoto;
    const photo1Title = (safeUserModel as any)?.invitationTextPhotoTitle || '';
    const photo1Subtitle = (safeUserModel as any)?.invitationTextPhotoSubtitle || '';

    const photo2 =
      (safeUserModel as any)?.invitationTextPhoto2
        ? optimizeImageFn((safeUserModel as any).invitationTextPhoto2, 600, 80)
        : (safeUserModel as any)?.invitationTextPhoto
        ? optimizeImageFn((safeUserModel as any).invitationTextPhoto, 600, 80)
        : designBgPhoto;
    const photo2Title = (safeUserModel as any)?.invitationTextPhoto2Title || '';
    const photo2Subtitle = (safeUserModel as any)?.invitationTextPhoto2Subtitle || '';

    return (
      <>
        {/* Fond global : page blanche entière */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#ffffff',
            zIndex: 0,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='280' height='280' viewBox='0 0 280 280'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.85 0 0 0 0 0.82 0 0 0 0 0.74 0 0 0 0.07 0'/></filter><rect width='280' height='280' filter='url(%23n)'/></svg>")`,
            backgroundSize: '280px 280px',
            backgroundRepeat: 'repeat',
            mixBlendMode: 'multiply',
            opacity: 0.5,
          }}
        />

        {/* Bande latérale gauche couleur secondaire — ÉPAISSEUR AUGMENTÉE */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: isMobile ? '18%' : '22%',
            background: `linear-gradient(180deg, ${secondaryColor} 0%, ${darkerColor(secondaryColor, 0.08)} 100%)`,
            zIndex: 1,
            boxShadow: `${isMobile ? '3px' : '4px'} 0 ${isMobile ? '14px' : '18px'} rgba(0,0,0,0.12)`,
          }}
        />
        {/* Contour OR SEULEMENT à l'extrémité droite — REMPLI ENTIÈREMENT (pas d'espace blanc entre les traits) + PLUS ÉPAIS */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: isMobile ? '18%' : '22%',
            width: isMobile ? 8 : 10,
            zIndex: 2,
            display: 'flex',
            pointerEvents: 'none',
            /* Fond DÉGRADÉ OR MÉTALLIQUE qui remplit TOUT l'espace (plus de blanc entre les traits) */
            background: `linear-gradient(
              90deg,
              rgba(255,255,255,0.18) 0%,
              #b98d31 5%,
              #f4d977 14%,
              #fff2b8 28%,
              #ffd970 42%,
              #fff2b8 58%,
              #f4d977 72%,
              #ffe9a6 86%,
              #d6b057 96%,
              #9b7520 100%
            )`,
            boxShadow: `${isMobile ? '1.5px' : '2px'} 0 ${isMobile ? '7px' : '9px'} rgba(180,135,50,0.42), 0 0 ${isMobile ? '3px' : '4px'} rgba(255,220,120,0.35)`,
          }}
        >
          {/* Rehaut OR supplémentaire brillant (filet gauche, bien visible) */}
          <div
            aria-hidden
            style={{
              width: 2,
              height: '100%',
              background: `linear-gradient(
                180deg,
                #a37d27 0%,
                #fff2b8 45%,
                #ffd970 50%,
                #fff2b8 55%,
                #a37d27 100%
              )`,
            }}
          />
          <div aria-hidden style={{ flex: 1, height: '100%' }} />
          {/* Rehaut OR supplémentaire foncé (filet droit externe) */}
          <div
            aria-hidden
            style={{
              width: 2,
              height: '100%',
              background: `linear-gradient(
                180deg,
                #8a671c 0%,
                #c59a3c 45%,
                #f4d977 50%,
                #c59a3c 55%,
                #8a671c 100%
              )`,
            }}
          />
        </div>

        {/* bouquet5 — coin haut-droit */}
        <img
          src="/bouquet5.png"
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            top: isMobile ? '-7%' : '-9%',
            right: isMobile ? '-12%' : '-15%',
            width: isMobile ? '58%' : '54%',
            height: 'auto',
            transform: 'rotate(14deg)',
            zIndex: 2,
            pointerEvents: 'none',
            userSelect: 'none',
            filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.18))',
            opacity: 0.99,
          }}
        />
        {/* bouquet5 — coin bas-gauche, devant la bande secondaire */}
        <img
          src="/bouquet5.png"
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            bottom: isMobile ? '-7%' : '-9%',
            left: isMobile ? '-14%' : '-17%',
            width: isMobile ? '56%' : '52%',
            height: 'auto',
            transform: 'rotate(-18deg)',
            zIndex: 3,
            pointerEvents: 'none',
            userSelect: 'none',
            filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.2))',
            opacity: 0.99,
          }}
        />

        {/* Contenu principal : 2 photos + titre/sous-titre — DESCENDU UN PEU (plus de padding-top) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: isMobile ? '18%' : '22%',
            right: 0,
            zIndex: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: isMobile ? '46px 18px 28px 14px' : '56px 24px 34px 20px',
            boxSizing: 'border-box',
            gap: isMobile ? 18 : 22,
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
          }}
        >
          {/* Photo 2 (bloc 4,5,6) — PREMIER en haut */}
          <div
            style={{
              width: '100%',
              maxWidth: 340,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: isMobile ? 6 : 8,
            }}
          >
            {photo2Title && (
              <div
                style={{
                  fontFamily: "'Great Vibes', 'Dancing Script', 'Parisienne', cursive",
                  fontSize: isMobile ? 'clamp(24px, 6.8vw, 36px)' : 'clamp(26px, 3vw, 38px)',
                  color: secondaryColor,
                  lineHeight: 1,
                  textAlign: 'center',
                  letterSpacing: '0.01em',
                  textShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                {photo2Title}
              </div>
            )}
            {photo2Subtitle && (
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                  fontSize: isMobile ? 'clamp(11px, 2.8vw, 14px)' : '13px',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: '#1f2937',
                  textAlign: 'center',
                  fontWeight: 600,
                  lineHeight: 1.3,
                }}
              >
                {photo2Subtitle}
              </div>
            )}
            <img
              src={photo2}
              alt=""
              draggable={false}
              style={{
                marginTop: isMobile ? 4 : 6,
                width: '56%',
                maxWidth: 210,
                height: 'auto',
                display: 'block',
                backgroundColor: 'transparent',
                boxShadow: 'none',
                border: 'none',
                outline: 'none',
                transform: 'none',
                objectFit: 'contain',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />
          </div>

          {/* Séparateur décoratif */}
          <div
            aria-hidden
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? 10 : 12,
              width: '100%',
              maxWidth: 260,
              color: lighterColor(darkerColor(primaryColor, 0.15), 0.5),
            }}
          >
            <div
              aria-hidden
              style={{
                flex: 1,
                height: 1,
                background: `linear-gradient(90deg, transparent 0%, ${lighterColor(darkerColor(primaryColor, 0.2), 0.4)} 100%)`,
              }}
            />
            <span style={{ fontSize: isMobile ? 16 : 18, lineHeight: 1 }}>❦</span>
            <div
              aria-hidden
              style={{
                flex: 1,
                height: 1,
                background: `linear-gradient(90deg, ${lighterColor(darkerColor(primaryColor, 0.2), 0.4)} 0%, transparent 100%)`,
              }}
            />
          </div>

          {/* Photo 1 (bloc 1,2,3) — DEUXIÈME en dessous */}
          <div
            style={{
              width: '100%',
              maxWidth: 340,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: isMobile ? 6 : 8,
            }}
          >
            {photo1Title && (
              <div
                style={{
                  fontFamily: "'Great Vibes', 'Dancing Script', 'Parisienne', cursive",
                  fontSize: isMobile ? 'clamp(24px, 6.8vw, 36px)' : 'clamp(26px, 3vw, 38px)',
                  color: secondaryColor,
                  lineHeight: 1,
                  textAlign: 'center',
                  letterSpacing: '0.01em',
                  textShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                {photo1Title}
              </div>
            )}
            {photo1Subtitle && (
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                  fontSize: isMobile ? 'clamp(11px, 2.8vw, 14px)' : '13px',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: '#1f2937',
                  textAlign: 'center',
                  fontWeight: 600,
                  lineHeight: 1.3,
                }}
              >
                {photo1Subtitle}
              </div>
            )}
            <img
              src={photo1}
              alt=""
              draggable={false}
              style={{
                marginTop: isMobile ? 4 : 6,
                width: '64%',
                maxWidth: 240,
                height: 'auto',
                display: 'block',
                backgroundColor: 'transparent',
                boxShadow: 'none',
                border: 'none',
                outline: 'none',
                transform: 'none',
                objectFit: 'contain',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />
          </div>
        </div>
      </>
    );
  };

  const PAGE_5_CONTENT = () => {
    const targetDate = (() => {
      if (targetEventDate instanceof Date && !isNaN(targetEventDate.getTime())) {
        return targetEventDate;
      }
      try {
        if (eventDate) {
          const parsed = new Date(eventDate);
          if (!isNaN(parsed.getTime())) return parsed;
        }
      } catch {}
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d;
    })();

    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const dayOfMonth = targetDate.getDate();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthNamesLong = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ];
    const dayHeaders = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];

    const calendarCells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) calendarCells.push(null);
    for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
    while (calendarCells.length % 7 !== 0) calendarCells.push(null);

    const openMaps = () => {
      const query = eventAddress || eventLocation || '';
      if (!query) return;
      const isIOS = /iPhone|iPad|iPod/.test(typeof navigator !== 'undefined' ? navigator.userAgent : '');
      const url = isIOS
        ? `maps://?q=${encodeURIComponent(query)}`
        : `https://www.google.com/maps?q=${encodeURIComponent(query)}`;
      if (typeof window !== 'undefined') window.open(url, '_blank');
    };

    return (
      <>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#ffffff',
            zIndex: 0,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='280' height='280' viewBox='0 0 280 280'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.85 0 0 0 0 0.82 0 0 0 0 0.74 0 0 0 0.07 0'/></filter><rect width='280' height='280' filter='url(%23n)'/></svg>")`,
            backgroundSize: '280px 280px',
            backgroundRepeat: 'repeat',
            mixBlendMode: 'multiply',
            opacity: 0.4,
          }}
        />

        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: isMobile ? '6%' : '7%',
            background: `linear-gradient(180deg, ${secondaryColor} 0%, ${darkerColor(secondaryColor, 0.08)} 100%)`,
            zIndex: 1,
            boxShadow: `${isMobile ? '2px' : '3px'} 0 ${isMobile ? '10px' : '14px'} rgba(0,0,0,0.10)`,
          }}
        />

        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: isMobile ? '6%' : '7%',
            width: isMobile ? 5 : 7,
            zIndex: 2,
            display: 'flex',
            pointerEvents: 'none',
            background: `linear-gradient(
              90deg,
              rgba(255,255,255,0.18) 0%,
              ${darkerColor(accentColor, 0.2)} 5%,
              ${lighterColor(accentColor, 0.4)} 14%,
              ${lighterColor(accentColor, 0.7)} 28%,
              ${accentColor} 42%,
              ${lighterColor(accentColor, 0.7)} 58%,
              ${lighterColor(accentColor, 0.4)} 72%,
              ${lighterColor(accentColor, 0.55)} 86%,
              ${darkerColor(accentColor, 0.12)} 96%,
              ${darkerColor(accentColor, 0.3)} 100%
            )`,
            boxShadow: `${isMobile ? '1px' : '1.5px'} 0 ${isMobile ? '5px' : '7px'} rgba(0,0,0,0.25), 0 0 ${isMobile ? '2px' : '3px'} rgba(255,220,120,0.25)`,
          }}
        />

        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: isMobile ? '9%' : '11%',
            height: '50%',
            background: `linear-gradient(180deg, ${lighterColor(primaryColor, 0.12)} 0%, ${primaryColor} 100%)`,
            zIndex: 1,
            pointerEvents: 'none',
            boxShadow: `-${isMobile ? '2px' : '3px'} 0 ${isMobile ? '10px' : '14px'} rgba(0,0,0,0.08)`,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: isMobile ? '9%' : '11%',
            height: '50%',
            background: `linear-gradient(180deg, ${secondaryColor} 0%, ${darkerColor(secondaryColor, 0.1)} 100%)`,
            zIndex: 1,
            pointerEvents: 'none',
            boxShadow: `-${isMobile ? '2px' : '3px'} 0 ${isMobile ? '10px' : '14px'} rgba(0,0,0,0.08)`,
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: isMobile ? '6%' : '7%',
            right: isMobile ? '9%' : '11%',
            zIndex: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: isMobile ? '18px 10px 22px 10px' : '22px 16px 28px 16px',
            boxSizing: 'border-box',
            gap: isMobile ? 12 : 14,
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
          }}
        >
          <img
            src="/fleur_doree.png"
            alt=""
            aria-hidden
            style={{
              position: 'absolute',
              top: isMobile ? '-20px' : '-24px',
              left: isMobile ? '-10px' : '-16px',
              width: isMobile ? 'clamp(210px, 66vw, 330px)' : 'clamp(240px, 42vw, 360px)',
              height: 'auto',
              zIndex: 1,
              pointerEvents: 'none',
              userSelect: 'none',
              transform: 'rotate(-18deg)',
              opacity: 0.98,
              filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.18))',
            }}
          />
          <div
            style={{
              position: 'relative',
              width: '90%',
              maxWidth: 300,
              aspectRatio: '3 / 4',
              zIndex: 2,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            <svg
              viewBox="0 0 300 400"
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                display: 'block',
                pointerEvents: 'none',
              }}
            >
              <defs>
                <clipPath id="archClip5">
                  <path d="M 0 400 L 0 160 C 0 70 70 0 150 0 C 230 0 300 70 300 160 L 300 400 Z" />
                </clipPath>
                <linearGradient id="archBorder5" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={lighterColor(secondaryColor, 0.25)} />
                  <stop offset="50%" stopColor={secondaryColor} />
                  <stop offset="100%" stopColor={darkerColor(secondaryColor, 0.2)} />
                </linearGradient>
              </defs>
              <g clipPath="url(#archClip5)">
                <image
                  href={designBgPhoto}
                  x="0"
                  y="0"
                  width="300"
                  height="400"
                  preserveAspectRatio="xMidYMid slice"
                />
              </g>
              <path
                d="M 0 400 L 0 160 C 0 70 70 0 150 0 C 230 0 300 70 300 160 L 300 400"
                fill="none"
                stroke="url(#archBorder5)"
                strokeWidth="3"
                opacity="0.95"
              />
            </svg>
            <div
              aria-hidden
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: isMobile ? '10%' : '12%',
                textAlign: 'center',
                pointerEvents: 'none',
                zIndex: 3,
              }}
            >
              <span
                style={{
                  fontFamily: "'Great Vibes', 'Dancing Script', 'Parisienne', cursive",
                  fontSize: isMobile ? 'clamp(26px, 8vw, 44px)' : 'clamp(28px, 3vw, 42px)',
                  color: '#ffffff',
                  fontWeight: 400,
                  lineHeight: 1,
                  letterSpacing: '0.01em',
                  fontStyle: 'italic',
                  textShadow:
                    '0 2px 8px rgba(0,0,0,0.55), 0 0 1px rgba(0,0,0,0.6)',
                }}
              >
                save the date
              </span>
            </div>
          </div>

          <div
            style={{
              width: '86%',
              maxWidth: 250,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: isMobile ? 5 : 6,
              zIndex: 3,
            }}
          >
            <div
              style={{
                width: '100%',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  fontSize: isMobile ? 'clamp(16px, 4.8vw, 22px)' : 'clamp(17px, 2.2vw, 22px)',
                  fontWeight: 700,
                  color: secondaryColor,
                  lineHeight: 1,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'inline-block',
                }}
              >
                {monthNamesLong[month]}
              </span>
              <span
                style={{
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  fontSize: isMobile ? 'clamp(16px, 4.8vw, 22px)' : 'clamp(17px, 2.2vw, 22px)',
                  fontWeight: 400,
                  color: secondaryColor,
                  lineHeight: 1,
                  letterSpacing: '0.04em',
                  marginLeft: isMobile ? 10 : 12,
                  display: 'inline-block',
                }}
              >
                {year}
              </span>
            </div>

            <div
              style={{
                position: 'relative',
                width: '100%',
                padding: isMobile ? '8px 6px 10px 6px' : '10px 8px 12px 8px',
                boxSizing: 'border-box',
                border: `1.2px solid ${secondaryColor}`,
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  columnGap: isMobile ? 1 : 1,
                  rowGap: isMobile ? 2 : 3,
                  marginBottom: isMobile ? 4 : 5,
                }}
              >
                {dayHeaders.map((h) => (
                  <div
                    key={h}
                    style={{
                      textAlign: 'center',
                      fontFamily: 'Arial, Helvetica, sans-serif',
                      fontSize: isMobile ? 'clamp(8px, 2.4vw, 11px)' : '10px',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      color: '#ffffff',
                      padding: isMobile ? '3px 1px' : '4px 2px',
                      backgroundColor: secondaryColor,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.12)`,
                    }}
                  >
                    {h}
                  </div>
                ))}
              </div>

              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  columnGap: 0,
                  rowGap: 0,
                }}
              >
                {calendarCells.map((cell, idx) => {
                  const isTarget = cell === dayOfMonth;
                  return (
                    <div
                      key={idx}
                      style={{
                        height: isMobile ? 'clamp(22px, 6vw, 30px)' : '26px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      {cell !== null && isTarget && (
                        <svg
                          aria-hidden
                          viewBox="0 0 32 32"
                          preserveAspectRatio="xMidYMid meet"
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: isMobile ? '110%' : '104%',
                            height: isMobile ? '110%' : '104%',
                            display: 'block',
                            pointerEvents: 'none',
                          }}
                        >
                          <path
                            d="M 16 28 C 8 22 2 17.5 2 11.5 C 2 7 5.5 3.5 10 3.5 C 13 3.5 15.2 5.3 16 7.5 C 16.8 5.3 19 3.5 22 3.5 C 26.5 3.5 30 7 30 11.5 C 30 17.5 24 22 16 28 Z"
                            fill={primaryColor}
                            opacity="0.95"
                          />
                        </svg>
                      )}
                      {cell !== null && (
                        <span
                          style={{
                            position: 'relative',
                            zIndex: 2,
                            fontFamily: 'Arial, Helvetica, sans-serif',
                            fontSize: isMobile ? 'clamp(11px, 3.2vw, 15px)' : '14px',
                            fontWeight: isTarget ? 800 : 600,
                            color: '#111827',
                            lineHeight: 1,
                          }}
                        >
                          {cell}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            aria-hidden
            style={{
              width: '100%',
              maxWidth: 320,
              height: 1,
              background: `linear-gradient(90deg, transparent 0%, ${secondaryColor} 50%, transparent 100%)`,
              opacity: 0.55,
              zIndex: 3,
            }}
          />

          {eventLocation && (
            <div
              style={{
                width: '100%',
                maxWidth: 320,
                zIndex: 3,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                  fontSize: isMobile ? 'clamp(13px, 3.4vw, 17px)' : 'clamp(14px, 1.8vw, 18px)',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: secondaryColor,
                  lineHeight: 1.35,
                  textAlign: 'center',
                }}
              >
                {eventLocation}
              </div>
            </div>
          )}

          {eventTime && (
            <div
              style={{
                width: '100%',
                maxWidth: 320,
                zIndex: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? 4 : 5,
                marginTop: isMobile ? -1 : -2,
              }}
            >
              <svg
                width={isMobile ? 12 : 14}
                height={isMobile ? 12 : 14}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <circle
                  cx="12"
                  cy="12"
                  r="8.5"
                  fill="none"
                  stroke={primaryColor}
                  strokeWidth="2"
                />
                <path
                  d="M12 7 V12 L15.5 14.2"
                  stroke={primaryColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                  fontSize: isMobile ? 'clamp(13px, 3.4vw, 17px)' : 'clamp(14px, 1.8vw, 18px)',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  color: secondaryColor,
                  lineHeight: 1.3,
                  textAlign: 'center',
                }}
              >
                {eventTime}
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: isMobile ? 2 : 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3,
            }}
          >
            <button
              type="button"
              onClick={openMaps}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: isMobile ? 6 : 8,
                padding: isMobile ? '7px 16px 8px 16px' : '8px 20px 9px 20px',
                borderRadius: 999,
                background: `linear-gradient(135deg, ${lighterColor(secondaryColor, 0.15)} 0%, ${secondaryColor} 100%)`,
                color: lighterColor(secondaryColor, 0.98),
                border: `1px solid ${lighterColor(secondaryColor, 0.5)}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.2)',
                cursor: 'pointer',
                fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                fontSize: isMobile ? 'clamp(11px, 2.8vw, 14px)' : '13px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                lineHeight: 1,
                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  '0 6px 16px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.25)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  '0 4px 12px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.2)';
              }}
            >
              <svg
                width={isMobile ? 12 : 14}
                height={isMobile ? 12 : 14}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              <span>Maps</span>
            </button>
          </div>
        </div>
      </>
    );
  };

  const viewportW = isMobile ? '100%' : 'min(100%, 480px)';
  const viewportH = isMobile ? '100%' : 'min(100%, 850px)';

  return (
    <div
      data-album-layout-placeholder
      style={{
        width: '100%',
        minHeight: '100vh',
        height: '100vh',
        background: `
          radial-gradient(ellipse at 30% 0%, ${lighterColor(primaryColor, 0.9)} 0%, transparent 55%),
          radial-gradient(ellipse at 70% 100%, ${lighterColor(secondaryColor, 0.96)} 0%, transparent 50%),
          linear-gradient(180deg, ${lighterColor(primaryColor, 0.96)} 0%, ${lighterColor(primaryColor, 0.92)} 100%)
        `,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: viewportW,
          height: viewportH,
          overflow: 'hidden',
        }}
      >
        {/* ========== PAGES FEUILLET�ES (book flip) : page 2 actuelle + page 3 vide ========== */}
        <AnimatePresence>
          {stage !== 'envelope' && (
            <motion.div
              key="book-pages-wrapper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
              style={{
                position: 'absolute',
                inset: 0,
                perspective: 1300,
                perspectiveOrigin: '50% 50%',
                overflow: 'hidden',
                touchAction: 'pan-y',
                zIndex: 1,
              }}
              onPointerDown={onDragStart}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onPointerCancel={onDragEnd}
            >
              {/* Page N (courante) - fond fixe SEULEMENT SI PAS DE FEUILLETAGE EN COURS */}
              {!isFlipping && (
                <div
                  key={`page-static-${pageIndex}`}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: secondaryColor,
                    zIndex: 3,
                    overflow: 'hidden',
                  }}
                >
                  {pageIndex === 0 && PAGE_2_CONTENT()}
                  {pageIndex === 1 && PAGE_3_CONTENT()}
                  {pageIndex === 2 && PAGE_4_CONTENT()}
                  {pageIndex === 3 && PAGE_5_CONTENT()}
                </div>
              )}

              {/* CUBE 3D STYLE WHATSAPP : rotation gauche ↔ droite */}
              {isFlipping && (
                (() => {
                  const direction: 1 | -1 = animatingFlip !== 0 ? animatingFlip : (flipProgress >= 0 ? 1 : -1);
                  const rawProgress = animatingFlip !== 0 ? (animatingFlip === 1 ? 1 : -1) : flipProgress;
                  const absProgress = Math.abs(rawProgress);
                  const isForward = direction === 1;

                  const hinge = isForward ? 'left' : 'right';
                  const hingeOrigin = `${hinge} center`;

                  const currentRotateY = isForward
                    ? -90 * absProgress
                    : 90 * absProgress;
                  const incomingRotateY = isForward
                    ? 90 - 90 * absProgress
                    : -90 + 90 * absProgress;

                  const currentContent =
                    pageIndex === 0
                      ? PAGE_2_CONTENT()
                      : pageIndex === 1
                      ? PAGE_3_CONTENT()
                      : pageIndex === 2
                      ? PAGE_4_CONTENT()
                      : PAGE_5_CONTENT();
                  const nextContent = isForward
                    ? pageIndex + 1 === 1
                      ? PAGE_3_CONTENT()
                      : pageIndex + 1 === 2
                      ? PAGE_4_CONTENT()
                      : pageIndex + 1 === 3
                      ? PAGE_5_CONTENT()
                      : PAGE_2_CONTENT()
                    : pageIndex - 1 === 0
                    ? PAGE_2_CONTENT()
                    : pageIndex - 1 === 1
                    ? PAGE_3_CONTENT()
                    : pageIndex - 1 === 2
                    ? PAGE_4_CONTENT()
                    : PAGE_5_CONTENT();

                  const transitionCommon = isDragging
                    ? { type: false }
                    : { duration: 0.6, ease: [0.22, 0.08, 0.3, 1] };

                  const darkSide = hinge === 'right' ? '270deg' : '90deg';
                  const lightSide = hinge === 'right' ? '90deg' : '270deg';

                  return (
                    <>
                      {/* Face de destination (collée sur la même arête, arrive par derrière le pivot) */}
                      <motion.div
                        key={`incoming-${pageIndex}-${direction}`}
                        animate={{ rotateY: incomingRotateY }}
                        initial={false}
                        transition={transitionCommon}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          zIndex: 4,
                          transformOrigin: hingeOrigin,
                          transformStyle: 'preserve-3d',
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          pointerEvents: 'none',
                          backgroundColor: secondaryColor,
                          overflow: 'hidden',
                        }}
                      >
                        {nextContent}
                        <div
                          aria-hidden
                          style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            background: `linear-gradient(${lightSide}, rgba(0,0,0,${0.38 - absProgress * 0.28}) 0%, rgba(0,0,0,${0.08 - absProgress * 0.06}) 25%, transparent 60%)`,
                            mixBlendMode: 'multiply',
                          }}
                        />
                      </motion.div>

                      {/* Face courante (pivot VERS L'AVANT, sort du côté opposé à l'arête) */}
                      <motion.div
                        key={`current-${pageIndex}-${direction}`}
                        animate={{ rotateY: currentRotateY }}
                        initial={false}
                        onAnimationComplete={() => {
                          if (animatingFlip !== 0) commitFlip();
                        }}
                        transition={transitionCommon}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          zIndex: 5,
                          transformOrigin: hingeOrigin,
                          transformStyle: 'preserve-3d',
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          pointerEvents: 'none',
                          backgroundColor: secondaryColor,
                          overflow: 'hidden',
                        }}
                      >
                        {currentContent}
                        <div
                          aria-hidden
                          style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            background: `linear-gradient(${darkSide}, rgba(0,0,0,${0.02 + absProgress * 0.40}) 0%, rgba(0,0,0,${0.01 + absProgress * 0.16}) 28%, transparent 60%)`,
                            mixBlendMode: 'multiply',
                          }}
                        />
                        <div
                          aria-hidden
                          style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            background: `linear-gradient(${lightSide}, rgba(255,255,255,${0.05 + absProgress * 0.12}) 0%, transparent 60%)`,
                            mixBlendMode: 'screen',
                          }}
                        />
                        <div
                          aria-hidden
                          style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            width: 1,
                            [hinge]: 0,
                            background: `linear-gradient(180deg, rgba(0,0,0,${0.06 + absProgress * 0.22}) 0%, rgba(0,0,0,${0.18 + absProgress * 0.40}) 50%, rgba(0,0,0,${0.06 + absProgress * 0.22}) 100%)`,
                            boxShadow: `${hinge === 'right' ? '-' : ''}${1 + absProgress * 3}px 0 ${3 + absProgress * 12}px rgba(0,0,0,${0.08 + absProgress * 0.32})`,
                          }}
                        />
                      </motion.div>
                    </>
                  );
                })()
              )}



              {/* Petit rep�re page en bas */}
              <div
                style={{
                  position: 'absolute',
                  bottom: isMobile ? 12 : 14,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 8,
                  zIndex: 50,
                  pointerEvents: 'none',
                }}
              >
                {Array.from({ length: totalPages }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      width: i === pageIndex ? 22 : 6,
                      height: 6,
                      borderRadius: 99,
                      backgroundColor:
                        i === pageIndex
                          ? lighterColor(primaryColor, 0.95)
                          : lighterColor(primaryColor, 0.4),
                    }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========== PAGE 1 : ENVELOPPE (avec animation d'ouverture) ========== */}
        <AnimatePresence>
          {stage !== 'page2' && (
            <motion.div
              key="envelope-scene"
              initial={{ opacity: 1 }}
              exit={{
                opacity: 0,
                transition: { duration: 0.5, delay: 0.6, ease: 'easeInOut' },
              }}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 10,
                cursor: stage === 'envelope' ? 'pointer' : 'default',
                perspective: 1800,
              }}
              onClick={handleOpenEnvelope}
            >
              {/* Fond couleur enveloppe - fond statique qui s'estompe */}
              <motion.div
                animate={
                  stage === 'opening'
                    ? { opacity: [1, 0.7, 0] }
                    : {}
                }
                transition={{
                  duration: 1.5,
                  times: [0, 0.5, 1],
                  ease: 'easeInOut',
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: envelopeColor,
                }}
              />
              {/* Texture enveloppe - fond statique qui s'estompe */}
              <motion.img
                src="/enveloppe.png"
                alt="Enveloppe"
                animate={
                  stage === 'opening'
                    ? { opacity: [1, 0.7, 0] }
                    : {}
                }
                transition={{
                  duration: 1.5,
                  times: [0, 0.5, 1],
                  ease: 'easeInOut',
                }}
                draggable={false}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  mixBlendMode: 'multiply',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  WebkitUserDrag: 'none',
                }}
              />
              {/* Badge - position fixe, il se soulève légèrement puis s'estompe */}
              <motion.img
                src="/badge.png"
                alt="Badge"
                draggable={false}
                initial={false}
                animate={
                  stage === 'opening'
                    ? {
                        y: [0, -4, 0],
                        opacity: [1, 1, 0.95, 0],
                        transition: {
                          duration: 1.3,
                          times: [0, 0.15, 0.35, 1],
                          ease: 'easeInOut',
                        },
                      }
                    : {}
                }
                style={{
                  position: 'absolute',
                  top: isMobile ? '49%' : '47%',
                  left: isMobile ? '32%' : '30%',
                  transform: 'translate(-50%, -50%)',
                  width: isMobile ? '38%' : '36%',
                  maxWidth: isMobile ? 220 : 200,
                  height: 'auto',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  WebkitUserDrag: 'none',
                  filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.25))',
                  zIndex: 2,
                }}
              />
              {/* Rabat qui s'ouvre vers le haut par-dessus (animation flip 3D réaliste) */}
              {stage === 'opening' && (
                <motion.div
                  key="flap"
                  initial={{ rotateX: 0 }}
                  animate={{ rotateX: 180 }}
                  transition={{
                    duration: 1.15,
                    ease: [0.55, 0, 0.35, 1],
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '60%',
                    transformOrigin: 'top center',
                    transformPerspective: 2400,
                    transformStyle: 'preserve-3d',
                    zIndex: 4,
                    pointerEvents: 'none',
                    willChange: 'transform',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: envelopeColor,
                      clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
                    }}
                  />
                  <img
                    src="/enveloppe.png"
                    alt=""
                    draggable={false}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      mixBlendMode: 'multiply',
                      clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                      pointerEvents: 'none',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                  />
                </motion.div>
              )}

              {/* Indice "Touchez pour ouvrir" - pulse doux */}
              {stage === 'envelope' && (
                <motion.div
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: [0.55, 1, 0.55], y: [0, -3, 0] }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{
                    position: 'absolute',
                    bottom: isMobile ? '8%' : '7%',
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    color: lighterColor(primaryColor, 0.98),
                    fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                    fontSize: isMobile ? 'clamp(11px, 2.8vw, 14px)' : '13px',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    fontWeight: 500,
                    textShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    zIndex: 5,
                    pointerEvents: 'none',
                  }}
                >
                  Touchez pour ouvrir
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AlbumLayout;
