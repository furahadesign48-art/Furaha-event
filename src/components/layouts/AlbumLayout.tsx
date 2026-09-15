import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, ContactShadows, Environment, SoftShadows, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
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

// ────────────────────────────────────────────────────────────────────────────
// HELPERS COULEURS
// ────────────────────────────────────────────────────────────────────────────
const hexToRgb = (hex: string): THREE.Color => {
  try {
    return new THREE.Color(hex.startsWith('#') ? hex : `#${hex}`);
  } catch {
    return new THREE.Color('#f59e0b');
  }
};

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

// ────────────────────────────────────────────────────────────────────────────
// BLOC DE PAGES (ÉPAISSEUR VISIBLE — SIDE VIEW)
// ────────────────────────────────────────────────────────────────────────────
const PageBlock: React.FC<{
  paperColor: THREE.Color;
  paperEdgeColor: THREE.Color;
  width: number;
  height: number;
  thickness: number;
  isMobile: boolean;
}> = ({ paperColor, paperEdgeColor, width, height, thickness, isMobile }) => {
  const PAGE_COUNT = isMobile ? 12 : 28;
  const PAGE_GAP = thickness / (PAGE_COUNT + 1);

  return (
    <group position={[0, 0, -thickness / 2 + PAGE_GAP]}>
      {Array.from({ length: PAGE_COUNT }).map((_, i) => {
        const z = i * PAGE_GAP;
        const recess = Math.sin(i * 0.55) * 0.0015;
        return (
          <mesh
            key={i}
            position={[recess * 0.1, -recess * 0.05, z]}
            castShadow={i === 0 || i === PAGE_COUNT - 1}
            receiveShadow
          >
            <boxGeometry args={[width - 0.004, height - 0.004, PAGE_GAP * 0.98]} />
            <meshStandardMaterial
              color={i % 3 === 0 ? paperColor : paperEdgeColor}
              roughness={0.88}
              metalness={0.01}
            />
          </mesh>
        );
      })}
    </group>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// DOS DU LIVRE (LEATHER SPINE)
// ────────────────────────────────────────────────────────────────────────────
const BookSpine: React.FC<{
  width: number;
  height: number;
  thickness: number;
  spineColor: THREE.Color;
  primaryRgb: THREE.Color;
}> = ({ width, height, thickness, spineColor, primaryRgb }) => {
  return (
    <group position={[-width / 2 - thickness / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[height, thickness, 0.02]} />
        <meshStandardMaterial
          color={spineColor}
          roughness={0.55}
          metalness={0.18}
        />
      </mesh>

      {/* Bandes dorées sur le dos */}
      {[-0.35, -0.15, 0.15, 0.35].map((t, i) => (
        <mesh key={i} position={[t * height, 0, 0.012]}>
          <boxGeometry args={[height * 0.012, thickness * 0.92, 0.002]} />
          <meshStandardMaterial
            color={primaryRgb}
            roughness={0.25}
            metalness={0.85}
            emissive={primaryRgb}
            emissiveIntensity={0.04}
          />
        </mesh>
      ))}
    </group>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// CONTENU HTML DE LA PAGE DE GARDE (injecté en overlay via drei/Html)
// Fond utilisant la COULEUR PRIMAIRE (version papier clair)
// ────────────────────────────────────────────────────────────────────────────
const FlyleafContent: React.FC<{
  title: string;
  subtitle: string;
  eventDate: string | undefined;
  primaryHex: string;
  width: number;
  height: number;
}> = ({ title, subtitle, eventDate, primaryHex, width, height }) => {
  const paperBg = lighterColor(primaryHex, 0.82);
  const paperBgSoft = lighterColor(primaryHex, 0.9);
  const inkDark = darkerColor(primaryHex, 0.55);
  const inkMid = darkerColor(primaryHex, 0.3);
  const accent = primaryHex;

  return (
    <Html
      transform
      occlude={false}
      position={[0, 0, 0.003]}
      style={{
        width: `${width * 100}px`,
        height: `${height * 100}px`,
        pointerEvents: 'none',
        userSelect: 'none',
        transformStyle: 'preserve-3d',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(ellipse at 15% 8%, ${lighterColor(primaryHex, 0.95)} 0%, transparent 55%),
          radial-gradient(ellipse at 85% 92%, ${lighterColor(primaryHex, 0.96)} 0%, transparent 60%),
          linear-gradient(180deg, ${paperBg} 0%, ${paperBgSoft} 100%)
        `,
        boxShadow: `inset 0 0 120px ${darkerColor(primaryHex, 0.2)}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Texture papier */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.07,
          mixBlendMode: 'multiply',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.7'/%3E%3C/svg%3E")`,
          backgroundSize: '160px 160px',
        }} />

        {/* Double bordure interne */}
        <div style={{
          position: 'absolute',
          inset: `${Math.max(14, width * 4)}px`,
          border: `1px solid ${lighterColor(accent, 0.55)}`,
          boxShadow: `inset 0 0 0 4px ${paperBg}, inset 0 0 0 5px ${lighterColor(accent, 0.8)}`,
          borderRadius: '2px',
          pointerEvents: 'none',
        }} />

        {/* Contenu centré */}
        <div style={{
          position: 'relative',
          width: '72%',
          maxWidth: 360,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '8% 0',
        }}>
          {/* Séparateur étoile */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 26,
          }}>
            <div style={{
              height: 1,
              width: 50,
              background: `linear-gradient(90deg, transparent 0%, ${accent} 100%)`,
            }} />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill={accent} opacity="0.9" />
            </svg>
            <div style={{
              height: 1,
              width: 50,
              background: `linear-gradient(90deg, ${accent} 0%, transparent 100%)`,
            }} />
          </div>

          {/* Mention Album */}
          <div style={{
            marginBottom: 16,
            fontSize: 10,
            letterSpacing: '0.55em',
            textTransform: 'uppercase',
            color: inkMid,
            fontWeight: 500,
          }}>
            Album Souvenir
          </div>

          {/* TITRE PRINCIPAL */}
          <h1 style={{
            margin: '0 0 22px 0',
            fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
            fontSize: 'clamp(22px, 5vw, 34px)',
            fontWeight: 600,
            color: inkDark,
            lineHeight: 1.15,
            letterSpacing: '0.01em',
            textAlign: 'center',
          }}>
            {title}
          </h1>

          {/* Double ligne */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            marginBottom: 20,
          }}>
            <div style={{
              height: 1,
              width: 120,
              background: `linear-gradient(90deg, transparent 0%, ${accent} 20%, ${accent} 80%, transparent 100%)`,
            }} />
            <div style={{
              height: 1.5,
              width: 70,
              background: `linear-gradient(90deg, transparent 0%, ${darkerColor(accent, 0.2)} 50%, transparent 100%)`,
            }} />
          </div>

          {/* SOUS-TITRE */}
          <p style={{
            margin: '0 0 30px 0',
            fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
            fontSize: 'clamp(14px, 2.6vw, 17px)',
            lineHeight: 1.7,
            color: darkerColor(primaryHex, 0.45),
            fontStyle: 'italic',
            letterSpacing: '0.02em',
            maxWidth: 320,
          }}>
            {subtitle}
          </p>

          {/* Ornement couronne */}
          <div style={{ position: 'relative', marginBottom: eventDate ? 24 : 0 }}>
            <svg width="130" height="72" viewBox="0 0 140 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.88">
                <path
                  d="M70 6 C 50 18, 22 22, 8 48 C 14 32, 36 28, 56 30 L 70 38 L 84 30 C 104 28, 126 32, 132 48 C 118 22, 90 18, 70 6 Z"
                  stroke={accent} strokeWidth="1.1" fill="none" strokeLinecap="round"
                />
                <path
                  d="M70 18 C 56 26, 36 30, 28 48 C 34 36, 52 36, 64 37 L 70 42 L 76 37 C 88 36, 106 36, 112 48 C 104 30, 84 26, 70 18 Z"
                  stroke={lighterColor(accent, 0.4)} strokeWidth="0.8" fill="none" opacity="0.65"
                />
                <circle cx="70" cy="46" r="3.6" fill={accent} opacity="0.95" />
                <circle cx="70" cy="46" r="6.4" stroke={accent} strokeWidth="0.8" fill="none" opacity="0.4" />
              </g>
            </svg>
          </div>

          {/* Date */}
          {eventDate && (
            <div style={{
              marginTop: 'auto',
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(11px, 2vw, 13px)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: inkMid,
            }}>
              {eventDate}
            </div>
          )}
        </div>
      </div>
    </Html>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// SCÈNE 3D DU LIVRE (PAGE DE GARDE OUVERTE SUR LE DESSUS)
// ────────────────────────────────────────────────────────────────────────────
const Book3D: React.FC<{
  title: string;
  subtitle: string;
  eventDate: string | undefined;
  primaryHex: string;
  secondaryHex: string;
  isMobile: boolean;
}> = ({ title, subtitle, eventDate, primaryHex, secondaryHex, isMobile }) => {
  const groupRef = useRef<THREE.Group>(null);

  // TAILLE NORMALISÉE 2:3 (livre standard)
  // Avec caméra orthographique, la taille est EXACTE (pas de perspective)
  const SCALE = 1.0;
  const BOOK_W = 2.0 * SCALE;
  const BOOK_H = 2.8 * SCALE;
  const THICKNESS = 0.28 * SCALE;

  const primaryRgb = useMemo(() => hexToRgb(primaryHex), [primaryHex]);
  const coverColor = useMemo(() => new THREE.Color(darkerColor(primaryHex, 0.45)), [primaryHex]);
  const coverDeep = useMemo(() => new THREE.Color(darkerColor(primaryHex, 0.65)), [primaryHex]);
  const paperColor = useMemo(() => new THREE.Color(lighterColor(primaryHex, 0.9)), [primaryHex]);
  const paperEdge = useMemo(() => new THREE.Color(lighterColor(primaryHex, 0.72)), [primaryHex]);
  const spineCol = useMemo(() => new THREE.Color(darkerColor(primaryHex, 0.58)), [primaryHex]);

  // Rotation LÉGÈRE pour voir 3D sans masquer la page
  const baseRotation = isMobile
    ? ([0.0, -0.20, 0.0] as [number, number, number])
    : ([0.0, -0.30, 0.0] as [number, number, number]);

  return (
    <group ref={groupRef} position={[0, 0, 0]} rotation={baseRotation}>
      {/* DOS DU LIVRE */}
      <BookSpine
        width={BOOK_W}
        height={BOOK_H}
        thickness={THICKNESS}
        spineColor={spineCol}
        primaryRgb={primaryRgb}
      />

      {/* PREMIER PLAT (COUVERTURE INFÉRIEURE, SOUS LES PAGES) */}
      <mesh
        position={[0, -THICKNESS / 2 - 0.008, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[BOOK_W + 0.02, BOOK_H + 0.02, 0.012]} />
        <meshStandardMaterial
          color={coverColor}
          roughness={0.48}
          metalness={0.12}
        />
      </mesh>

      {/* BLOC DES PAGES — ÉPAISSEUR RÉELLE VISIBLE */}
      <PageBlock
        paperColor={paperColor}
        paperEdgeColor={paperEdge}
        width={BOOK_W - 0.008}
        height={BOOK_H - 0.008}
        thickness={THICKNESS - 0.02}
        isMobile={isMobile}
      />

      {/* PAGE DU DESSUS — PAGE DE GARDE (FOND = COULEUR PRIMAIRE PAPIER) */}
      <group position={[0, THICKNESS / 2 - 0.005, 0]}>
        {/* Feuille de garde (fond couleur primaire claire) */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <planeGeometry args={[BOOK_W, BOOK_H]} />
          <meshStandardMaterial
            color={lighterColor(primaryHex, 0.82)}
            roughness={0.9}
            metalness={0.02}
          />
        </mesh>

        {/* Contenu typographique (overlay HTML) */}
        <FlyleafContent
          title={title}
          subtitle={subtitle}
          eventDate={eventDate}
          primaryHex={primaryHex}
          width={BOOK_W}
          height={BOOK_H}
        />
      </group>

      {/* BORD DROIT — TRANCHE DES PAGES EN COUPE (effet papier feuilleté) */}
      <mesh
        position={[BOOK_W / 2 + 0.005, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[THICKNESS, BOOK_H]} />
        <meshStandardMaterial
          color={lighterColor(primaryHex, 0.78)}
          roughness={0.95}
        />
      </mesh>

      {/* BORD INFÉRIEUR — TRANCHE (perspective 3D) */}
      <mesh
        position={[0, -BOOK_H / 2 - 0.005, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[BOOK_W, THICKNESS]} />
        <meshStandardMaterial
          color={lighterColor(primaryHex, 0.8)}
          roughness={0.95}
        />
      </mesh>

      {/* RABAT COUVERTURE SUPÉRIEURE LÉGÈREMENT OUVERT (coin relevé — réalisme) */}
      <mesh
        position={[
          BOOK_W * 0.32,
          THICKNESS / 2 + 0.012,
          BOOK_H * 0.38,
        ]}
        rotation={[
          -Math.PI / 4.2,
          0.05,
          Math.PI / 3.2,
        ]}
        castShadow
      >
        <boxGeometry args={[BOOK_W * 0.35, BOOK_H * 0.42, 0.006]} />
        <meshStandardMaterial
          color={coverDeep}
          roughness={0.5}
          metalness={0.14}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ────────────────────────────────────────────────────────────────────────────
const AlbumLayout: React.FC<AlbumLayoutProps> = ({
  safeUserModel,
  colors,
}) => {
  const titleRaw = safeUserModel?.title || 'Album de Mariage';
  const subtitleRaw = safeUserModel?.invitationTitleSubtitle || 'Souvenirs inoubliables';
  const primaryColor = colors?.primary || '#f59e0b';
  const secondaryColor = colors?.secondary || '#d946ef';
  const eventDate = safeUserModel?.eventDate;
  const bgWrap = lighterColor(primaryColor, 0.96);

  // ── Détection responsive Mobile / Desktop ──
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
    // Safari legacy
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, []);

  // ── CAMÉRA ORTHOGRAPHIQUE : ZÉRO perspective, cadrage 100% PRÉVISIBLE ──
  // OrthographicCamera : la taille ne dépend PAS de la distance → taille = zoom
  // Livre : BOOK_H = 2.8 → on choisit zoom pour voir 3.6 de hauteur (soit ~28% de marge)
  // Calcul : zoom = canvasHeight / viewHeight → mais drei gère via propriété `zoom`
  // Mobile : un peu plus de marge (vue plus haute)
  const orthoZoom = isMobile ? 0.95 : 0.85; // zoom > 1 = plus serré; zoom < 1 = plus large
  const orthoPosition: [number, number, number] = isMobile
    ? [0.05, 0.35, 5.5]
    : [0.1, 0.45, 6.0];

  // groundY & contactShadows pour livre BOOK_H=2.8, bas du livre à BOOK_H/2=1.4 sous l'origine
  const groundY = isMobile ? -1.58 : -1.58;
  const contactY = isMobile ? -1.56 : -1.56;
  const contactScale = isMobile ? 8 : 10;

  const canvasDpr = isMobile ? [1, 1] as [number, number] : [1, 2] as [number, number];
  const shadowSize1 = isMobile ? 512 : 2048;
  const shadowSize2 = isMobile ? 256 : 1024;
  const softShadowSamples = isMobile ? 4 : 14;
  const softShadowSize = isMobile ? 8 : 16;
  const ambientIntensity = isMobile ? 0.55 : 0.45;
  const dir1Intensity = isMobile ? 1.1 : 1.35;
  const spotIntensity = isMobile ? 0.7 : 1.0;

  return (
    <div
      data-album-layout-placeholder
      style={{
        width: '100%',
        minHeight: '100vh',
        height: '100%',
        background: `
          radial-gradient(ellipse at 30% 0%, ${lighterColor(primaryColor, 0.9)} 0%, transparent 55%),
          radial-gradient(ellipse at 70% 100%, ${lighterColor(secondaryColor, 0.96)} 0%, transparent 50%),
          linear-gradient(180deg, ${bgWrap} 0%, ${lighterColor(primaryColor, 0.92)} 100%)
        `,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* LABEL INDICATEUR — Mobile : plus discret */}
      {!isMobile && (
        <div style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 11,
          letterSpacing: '0.5em',
          textTransform: 'uppercase',
          color: darkerColor(primaryColor, 0.35),
          zIndex: 5,
          pointerEvents: 'none',
        }}>
          Page de garde · Album 3D
        </div>
      )}

      {/* SCÈNE THREE.JS — CAMÉRA ORTHOGRAPHIQUE (perspective ZÉRO → cadrage garanti) */}
      <Canvas
        shadows
        dpr={canvasDpr}
        gl={{ antialias: !isMobile, alpha: true, powerPreference: isMobile ? 'default' : 'high-performance' }}
        style={{ width: '100%', height: '100vh' }}
      >
        {/* CAMÉRA ORTHOGRAPHIQUE makeDefault — plus de problème de perspective !!! */}
        <OrthographicCamera
          makeDefault
          position={orthoPosition}
          zoom={orthoZoom}
          near={0.1}
          far={100}
        />

        {/* ÉCLAIRAGE RÉALISTE — STUDIO SOFTBOX (livre taille standard 2.0 × 2.8) */}
        <ambientLight intensity={ambientIntensity} color="#fff7ea" />
        <directionalLight
          position={[3.5, 5.5, 4.5]}
          intensity={dir1Intensity}
          color="#fff3dd"
          castShadow={!isMobile}
          shadow-mapSize-width={shadowSize1}
          shadow-mapSize-height={shadowSize1}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
          shadow-camera-near={0.1}
          shadow-camera-far={25}
          shadow-bias={-0.0002}
        />
        <directionalLight
          position={[-3.5, 3.0, -2.5]}
          intensity={0.62}
          color={lighterColor(primaryColor, 0.6)}
        />
        <spotLight
          position={[1.2, 5.0, 2.4]}
          angle={0.5}
          penumbra={1}
          intensity={spotIntensity}
          color="#ffffff"
          castShadow={!isMobile}
          shadow-mapSize-width={shadowSize2}
          shadow-mapSize-height={shadowSize2}
        />
        {!isMobile && (
          <pointLight
            position={[-1.5, 0.8, 2.4]}
            intensity={0.42}
            color={primaryColor}
            distance={10}
          />
        )}

        {/* ENVIRONNEMENT POUR REFLETS (mobile: désactivé pour perf) */}
        {!isMobile && <Environment preset="city" />}
        <SoftShadows size={softShadowSize} samples={softShadowSamples} focus={0.5} />

        {/* SOL VIRTUEL POUR RECEVOIR LES OMBRES PORTÉES */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, groundY, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <shadowMaterial opacity={0.32} />
        </mesh>

        {/* LE LIVRE 3D — TAILLE STANDARD 2:3 */}
        <Book3D
          title={titleRaw}
          subtitle={subtitleRaw}
          eventDate={eventDate}
          primaryHex={primaryColor}
          secondaryHex={secondaryColor}
          isMobile={isMobile}
        />

        {/* OMBRES DE CONTACT SOUS LE LIVRE (réalisme accru) */}
        <ContactShadows
          position={[0, contactY, 0]}
          opacity={isMobile ? 0.5 : 0.62}
          scale={contactScale}
          blur={isMobile ? 2 : 3.2}
          far={4}
          color={darkerColor(primaryColor, 0.5)}
        />

        {/* ── CONTRÔLES ORBIT ── */}
        {/* Mobile: DÉSACTIVÉS pour éviter la boucle de rendu à 60fps en permanence */}
        {/* Desktop: activés temporairement pour vérification */}
        <OrbitControls
          enabled={!isMobile}
          makeDefault
          enablePan={!isMobile}
          enableZoom={!isMobile}
          enableRotate={!isMobile}
          minZoom={0.3}
          maxZoom={3}
          enableDamping={!isMobile}
          dampingFactor={0.08}
        />
      </Canvas>
    </div>
  );
};

export default AlbumLayout;
