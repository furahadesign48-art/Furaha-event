import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameConfiguration, GameResult } from '../../services/templateService';
import { UserModel, Invite } from '../../services/templateService';
import type { ParallaxGalleryItem } from '../ui/3d-parallax-unfurling-gallery';

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
}) => {
  const primaryColor = colors?.primary || '#f59e0b';
  const secondaryColor = colors?.secondary || '#d946ef';

  const title = safeUserModel?.title || 'Nous nous marions !';
  const subtitle =
    safeUserModel?.invitationTitleSubtitle ||
    'Rejoignez-nous pour célébrer notre union';
  const eventDate = safeUserModel?.eventDate || '';
  const guestName = safeInvite?.nom || 'Invité';
  const guestTable = safeInvite?.table || 'Non assigné';
  const designBgPhoto = optimizedBg || safeUserModel?.backgroundImage || DEFAULT_COUPLE_PHOTO;

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

  const totalPages = 2;
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
        const p = Math.min(1, Math.abs(deltaX) / (viewportWidth * 0.5));
        setFlipProgress(p);
      } else {
        setFlipProgress(0);
      }
    } else {
      if (pageIndex > 0) {
        const p = Math.min(1, Math.abs(deltaX) / (viewportWidth * 0.5));
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
      (typeof window !== 'undefined' ? window.innerWidth : 400) * 0.18;
    if (deltaX < -threshold && pageIndex < totalPages - 1) {
      clearFlipSafety();
      setAnimatingFlip(1);
      flipSafetyTimer.current = window.setTimeout(commitFlip, 1400);
      return;
    } else if (deltaX > threshold && pageIndex > 0) {
      clearFlipSafety();
      setAnimatingFlip(-1);
      flipSafetyTimer.current = window.setTimeout(commitFlip, 1400);
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
      <img
        src="/bouquet1.png"
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          top: isMobile ? '20%' : '18%',
          left: isMobile ? '-2%' : '-3%',
          width: isMobile ? '48%' : '42%',
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
          top: isMobile ? '22%' : '20%',
          right: isMobile ? '0%' : '1%',
          width: isMobile ? '24%' : '22%',
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
          top: isMobile ? '8%' : '7%',
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
          top: '54%',
          left: '50%',
          transform: 'translate(-50%, -46%)',
          width: isMobile ? '76%' : '72%',
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
          bottom: isMobile ? '18%' : '17%',
          left: 0,
          right: 0,
          textAlign: 'center',
          padding: '0 12%',
          zIndex: 6,
        }}
      >
        <div
          style={{
            display: 'inline-block',
            position: 'relative',
            padding: isMobile ? '10px 28px 14px 28px' : '12px 36px 16px 36px',
            backgroundColor: lighterColor(primaryColor, 0.92),
            color: darkerColor(primaryColor, 0.55),
            borderRadius: 2,
            boxShadow: '0 10px 22px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: isMobile ? 4 : 5,
              border: `1px solid ${darkerColor(primaryColor, 0.45)}`,
              borderRadius: 1,
              pointerEvents: 'none',
            }}
          />
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: isMobile ? -12 : -14,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: isMobile ? 20 : 22,
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
              fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
              fontSize: isMobile ? 'clamp(22px, 6.2vw, 36px)' : 'clamp(26px, 3vw, 36px)',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: darkerColor(primaryColor, 0.6),
            }}
          >
            {guestName}
          </h2>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: isMobile ? '12%' : '11%',
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
              height: isMobile ? 14 : 16,
              background: lighterColor(primaryColor, 0.5),
              opacity: 0.7,
            }}
          />
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: isMobile ? 6 : 8,
              padding: isMobile ? '4px 12px 5px 12px' : '5px 16px 6px 16px',
              borderRadius: 999,
              background: `linear-gradient(135deg, ${lighterColor(secondaryColor, 0.2)} 0%, ${lighterColor(primaryColor, 0.12)} 100%)`,
              border: `1px solid ${lighterColor(primaryColor, 0.55)}`,
              boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
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
                fontSize: isMobile ? 'clamp(11px, 2.8vw, 14px)' : '13px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: lighterColor(primaryColor, 0.98),
                fontWeight: 600,
                lineHeight: 1,
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
              height: isMobile ? 14 : 16,
              background: lighterColor(primaryColor, 0.5),
              opacity: 0.7,
            }}
          />
        </div>
      </div>
    </>
  );

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
                perspective: 2200,
                overflow: 'hidden',
                touchAction: 'pan-y',
                zIndex: 1,
              }}
              onPointerDown={onDragStart}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onPointerCancel={onDragEnd}
            >
              {/* Page DESTINATION : la page qui sera visible a la fin du flip */}
              {(() => {
                const dir: 1 | -1 | 0 = isFlipping
                  ? animatingFlip !== 0
                    ? animatingFlip
                    : flipProgress >= 0
                    ? 1
                    : -1
                  : 0;
                const destIndex = dir !== 0 ? pageIndex + dir : pageIndex;
                const showDest = isFlipping && destIndex >= 0 && destIndex < totalPages;
                if (!showDest) return null;
                return (
                  <div
                    key={`page-dest-${destIndex}`}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: secondaryColor,
                      zIndex: 2,
                      overflow: 'hidden',
                    }}
                  >
                    {destIndex === 0 && PAGE_2_CONTENT()}
                    {destIndex === 1 && PAGE_EMPTY(secondaryColor)}
                  </div>
                );
              })()}

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
                  {pageIndex === 1 && PAGE_EMPTY(secondaryColor)}
                </div>
              )}

              {/* OMBRE STATIQUE sous l'emplacement de la page en cours (quand elle est soulevée) */}
              {isFlipping && (() => {
                const direction: 1 | -1 = animatingFlip !== 0 ? animatingFlip : (flipProgress >= 0 ? 1 : -1);
                const rawProgress = animatingFlip !== 0 ? (animatingFlip === 1 ? 1 : -1) : flipProgress;
                const absProgress = Math.abs(rawProgress);
                const isForward = direction === 1;
                const hingeSide = isForward ? 'left' : 'right';
                return (
                  <div
                    key="static-shadow"
                    aria-hidden
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 4,
                      pointerEvents: 'none',
                      background: `
                        radial-gradient(ellipse at ${hingeSide} 50%, rgba(0,0,0,${0.12 + absProgress * 0.30}) 0%, rgba(0,0,0,${0.05 + absProgress * 0.12}) 30%, transparent 62%),
                        linear-gradient(${hingeSide === 'left' ? '90deg' : '270deg'}, rgba(0,0,0,${0.18 + absProgress * 0.18}) 0%, transparent 16%)
                      `,
                      mixBlendMode: 'multiply',
                    }}
                  />
                );
              })()}

              {/* PAGE EN ROTATION (flip 3D) - feuilletage */}
              {isFlipping && (
                (() => {
                  const direction: 1 | -1 = animatingFlip !== 0 ? animatingFlip : (flipProgress >= 0 ? 1 : -1);
                  const rawProgress = animatingFlip !== 0 ? (animatingFlip === 1 ? 1 : -1) : flipProgress;
                  const absProgress = Math.abs(rawProgress);
                  const isForward = direction === 1;
                  const rotateY = isForward ? -180 * absProgress : 180 * absProgress;
                  const hingeSide = isForward ? 'left' : 'right';
                  const mobileSide = isForward ? 'right' : 'left';

                  const curlPctW = 34 + absProgress * 6;
                  const curlPctH = 25 + absProgress * 4;

                  const frontClip = isForward
                    ? `polygon(0 0, 100% 0, 100% ${100 - curlPctH}%, ${100 - curlPctW}% 100%, 0 100%)`
                    : `polygon(0 0, 100% 0, 100% 100%, ${curlPctW}% 100%, 0 ${100 - curlPctH}%)`;

                  const backClip = isForward
                    ? `polygon(0 0, 100% 0, 100% 100%, ${curlPctW}% 100%, 0 ${100 - curlPctH}%)`
                    : `polygon(0 0, 100% 0, 100% ${100 - curlPctH}%, ${100 - curlPctW}% 100%, 0 100%)`;

                  const frontContent = isForward
                    ? pageIndex === 0 ? PAGE_2_CONTENT() : PAGE_EMPTY(secondaryColor)
                    : pageIndex === 1 ? PAGE_EMPTY(secondaryColor) : PAGE_2_CONTENT();

                  const backContent = isForward
                    ? pageIndex + 1 === 1 ? PAGE_EMPTY(secondaryColor) : PAGE_2_CONTENT()
                    : pageIndex === 1 ? PAGE_2_CONTENT() : PAGE_EMPTY(secondaryColor);

                  return (
                    <motion.div
                      key={`flip-drag-${pageIndex}-${direction}`}
                      animate={{ rotateY }}
                      initial={false}
                      onAnimationComplete={() => {
                        if (animatingFlip !== 0) commitFlip();
                      }}
                      transition={
                        isDragging
                          ? { type: false }
                          : { duration: 1.25, ease: [0.18, 0.02, 0.22, 1] }
                      }
                      style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 5,
                        transformOrigin: `${hingeSide} center`,
                        transformStyle: 'preserve-3d',
                        pointerEvents: 'none',
                      }}
                    >
                      <div
                        aria-hidden
                        style={{
                          position: 'absolute',
                          inset: 0,
                          pointerEvents: 'none',
                          zIndex: 6,
                          background: `
                            radial-gradient(ellipse at ${hingeSide === 'left' ? '0%' : '100%'} 50%, rgba(0,0,0,${0.16 + absProgress * 0.22}) 0%, transparent 36%),
                            linear-gradient(${hingeSide === 'left' ? '90deg' : '270deg'}, rgba(0,0,0,${0.05 + absProgress * 0.14}) 0%, transparent 44%)
                          `,
                          mixBlendMode: 'multiply',
                        }}
                      />
                      <div
                        aria-hidden
                        style={{
                          position: 'absolute',
                          inset: 0,
                          pointerEvents: 'none',
                          zIndex: 7,
                          background: `
                            linear-gradient(${mobileSide === 'right' ? '270deg' : '90deg'}, rgba(255,255,255,${0.05 + absProgress * 0.13}) 0%, transparent 50%),
                            radial-gradient(ellipse at ${mobileSide === 'right' ? '96%' : '4%'} 6%, rgba(255,255,255,${0.07 + absProgress * 0.09}) 0%, transparent 46%)
                          `,
                          mixBlendMode: 'screen',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          backgroundColor: secondaryColor,
                          overflow: 'hidden',
                          clipPath: frontClip,
                          WebkitClipPath: frontClip,
                          boxShadow: `${isForward ? '-' : ''}${8 + absProgress * 44}px ${2 + absProgress * 12}px ${34 + absProgress * 64}px rgba(0,0,0,${0.13 + absProgress * 0.38}), inset 0 0 0 1px rgba(0,0,0,${0.04 + absProgress * 0.06})`,
                        }}
                      >
                        {frontContent}
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                          backgroundColor: secondaryColor,
                          overflow: 'hidden',
                          clipPath: backClip,
                          WebkitClipPath: backClip,
                          boxShadow: `inset 0 0 0 1px rgba(0,0,0,${0.05 + absProgress * 0.06})`,
                        }}
                      >
                        {backContent}
                      </div>
                      <div
                        aria-hidden
                        style={{
                          position: 'absolute',
                          inset: 0,
                          pointerEvents: 'none',
                          zIndex: 8,
                          clipPath: frontClip,
                          WebkitClipPath: frontClip,
                          background: `linear-gradient(${hingeSide === 'left' ? '90deg' : '270deg'}, rgba(0,0,0,${0.00 + absProgress * 0.18}) 0%, rgba(0,0,0,${0.11 + absProgress * 0.18}) 0.6%, transparent 2.8%)`,
                        }}
                      />
                      {/* PLI PAPIER - coin mobile bas collé sur la page qui tourne (FACE AVANT) */}
                      <div
                        aria-hidden
                        style={{
                          position: 'absolute',
                          zIndex: 9,
                          [mobileSide === 'right' ? 'right' : 'left']: -3,
                          bottom: -3,
                          width: `${curlPctW + 4}%`,
                          height: `${curlPctH + 4}%`,
                          pointerEvents: 'none',
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: isForward ? 'none' : 'scaleX(-1)',
                        }}
                      >
                        <div
                          aria-hidden
                          style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: secondaryColor,
                            pointerEvents: 'none',
                            maskImage: isForward
                              ? 'linear-gradient(135deg, transparent 36%, rgba(0,0,0,0.85) 62%, #000 76%)'
                              : 'linear-gradient(45deg, transparent 36%, rgba(0,0,0,0.85) 62%, #000 76%)',
                            WebkitMaskImage: isForward
                              ? 'linear-gradient(135deg, transparent 36%, rgba(0,0,0,0.85) 62%, #000 76%)'
                              : 'linear-gradient(45deg, transparent 36%, rgba(0,0,0,0.85) 62%, #000 76%)',
                          }}
                        />
                        <img
                          src="/pli.png"
                          alt=""
                          draggable={false}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            pointerEvents: 'none',
                            userSelect: 'none',
                            mixBlendMode: 'multiply',
                            filter: `drop-shadow(${isForward ? '-' : ''}${3 + absProgress * 12}px ${3 + absProgress * 9}px ${10 + absProgress * 18}px rgba(0,0,0,${0.35 + absProgress * 0.22}))`,
                          }}
                        />
                      </div>
                      {/* PLI PAPIER - miroir sur la face arrière */}
                      <div
                        aria-hidden
                        style={{
                          position: 'absolute',
                          zIndex: 9,
                          [mobileSide === 'right' ? 'left' : 'right']: -3,
                          bottom: -3,
                          width: `${curlPctW + 4}%`,
                          height: `${curlPctH + 4}%`,
                          pointerEvents: 'none',
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: `rotateY(180deg) ${isForward ? 'none' : 'scaleX(-1)'}`,
                        }}
                      >
                        <div
                          aria-hidden
                          style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: secondaryColor,
                            pointerEvents: 'none',
                            maskImage: isForward
                              ? 'linear-gradient(45deg, transparent 36%, rgba(0,0,0,0.85) 62%, #000 76%)'
                              : 'linear-gradient(135deg, transparent 36%, rgba(0,0,0,0.85) 62%, #000 76%)',
                            WebkitMaskImage: isForward
                              ? 'linear-gradient(45deg, transparent 36%, rgba(0,0,0,0.85) 62%, #000 76%)'
                              : 'linear-gradient(135deg, transparent 36%, rgba(0,0,0,0.85) 62%, #000 76%)',
                          }}
                        />
                        <img
                          src="/pli.png"
                          alt=""
                          draggable={false}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            pointerEvents: 'none',
                            userSelect: 'none',
                            mixBlendMode: 'multiply',
                            filter: `drop-shadow(${isForward ? '' : '-'}${3 + absProgress * 12}px ${3 + absProgress * 9}px ${10 + absProgress * 18}px rgba(0,0,0,${0.35 + absProgress * 0.22}))`,
                          }}
                        />
                      </div>
                    </motion.div>
                  );
                })()
              )}

              {/* Indice coin feuilletable (page suivante) — pli.png BAS DROIT FIXE */}
              {!isDragging && !isFlipping && stage === 'page2' && pageIndex < totalPages - 1 && animatingFlip === 0 && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    width: '38%',
                    height: '26%',
                    zIndex: pageIndex === 0 ? 5 : 8,
                    pointerEvents: 'none',
                    opacity: 1,
                  }}
                >
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: secondaryColor,
                      pointerEvents: 'none',
                      maskImage: 'linear-gradient(135deg, transparent 36%, rgba(0,0,0,0.85) 62%, #000 76%)',
                      WebkitMaskImage: 'linear-gradient(135deg, transparent 36%, rgba(0,0,0,0.85) 62%, #000 76%)',
                    }}
                  />
                  <img
                    src="/pli.png"
                    alt=""
                    draggable={false}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      mixBlendMode: 'multiply',
                      filter: 'drop-shadow(-4px 3px 10px rgba(0,0,0,0.35))',
                    }}
                  />
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      right: '-12%',
                      bottom: '-12%',
                      width: '112%',
                      height: '112%',
                      background:
                        'radial-gradient(ellipse at 100% 100%, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.12) 42%, transparent 74%)',
                      transform: 'translateZ(-1px)',
                      zIndex: -1,
                      filter: 'blur(2.5px)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              )}

              {/* Indice coin feuilletable (retour) — pli.png BAS GAUCHE FIXE */}
              {!isDragging && !isFlipping && stage === 'page2' && pageIndex > 0 && animatingFlip === 0 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    bottom: 0,
                    width: '38%',
                    height: '26%',
                    zIndex: pageIndex === 1 ? 5 : 8,
                    pointerEvents: 'none',
                    opacity: 1,
                  }}
                >
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: secondaryColor,
                      pointerEvents: 'none',
                      maskImage: 'linear-gradient(45deg, transparent 36%, rgba(0,0,0,0.85) 62%, #000 76%)',
                      WebkitMaskImage: 'linear-gradient(45deg, transparent 36%, rgba(0,0,0,0.85) 62%, #000 76%)',
                    }}
                  />
                  <img
                    src="/pli.png"
                    alt=""
                    draggable={false}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      transform: 'scaleX(-1)',
                      mixBlendMode: 'multiply',
                      filter: 'drop-shadow(4px 3px 10px rgba(0,0,0,0.35))',
                    }}
                  />
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      left: '-12%',
                      bottom: '-12%',
                      width: '112%',
                      height: '112%',
                      background:
                        'radial-gradient(ellipse at 0% 100%, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.12) 42%, transparent 74%)',
                      transform: 'translateZ(-1px)',
                      zIndex: -1,
                      filter: 'blur(2.5px)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
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
