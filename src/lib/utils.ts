import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Timer,
  Images,
  CheckSquare,
  MessageSquareHeart,
  Gamepad2,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface CardDataItem {
  id: number;
  title: string;
  description: string;
  color: string;
  gradient: string;
  icon: LucideIcon;
  bullets: string[];
}

export const cardData: CardDataItem[] = [
  {
    id: 1,
    title: "Compte à Rebours Animé",
    description:
      "Vos invités voient les jours, heures, minutes et secondes défiler jusqu'au grand jour. Une anticipation visuelle élégante qui crée l'émotion dès l'ouverture de l'invitation.",
    color: "rgba(251, 191, 36, 0.9)",
    gradient:
      "linear-gradient(135deg, #1a1205 0%, #2b1d07 40%, #3a2a0c 100%)",
    icon: Timer,
    bullets: [
      "Jours / Heures / Minutes",
      "Chiffres stylisés",
      "Mise à jour en temps réel",
    ],
  },
  {
    id: 2,
    title: "Galerie Photo 3D Immersive",
    description:
      "Présentez vos plus belles photos dans une galerie 3D parallaxe avec effet de profondeur. Visualiseur plein écran, zoom et défilement fluide pour un rendu premium.",
    color: "rgba(236, 72, 153, 0.9)",
    gradient:
      "linear-gradient(135deg, #1a0513 0%, #2b0a1e 40%, #3d0f28 100%)",
    icon: Images,
    bullets: [
      "Effet parallaxe 3D",
      "Visualiseur plein écran",
      "Galerie circulaire animée",
    ],
  },
  {
    id: 3,
    title: "RSVP Intelligent + Boissons",
    description:
      "Gérez les confirmations en temps réel avec choix du menu boissons par invité (couple ou simple). Statistiques instantanées dans votre dashboard admin.",
    color: "rgba(16, 185, 129, 0.9)",
    gradient:
      "linear-gradient(135deg, #051a10 0%, #082b1b 40%, #0c3d26 100%)",
    icon: CheckSquare,
    bullets: [
      "Confirmation en 1 clic",
      "Simple / Couple",
      "Choix boissons personnalisé",
    ],
  },
  {
    id: 4,
    title: "Livre d'Or Interactif",
    description:
      "Vos invités laissent des messages que vous pouvez consulter et auxquels vous pouvez répondre en tant qu'administrateur. Export PDF disponible pour garder un souvenir imprimé.",
    color: "rgba(59, 130, 246, 0.9)",
    gradient:
      "linear-gradient(135deg, #050e1e 0%, #091733 40%, #0d2149 100%)",
    icon: MessageSquareHeart,
    bullets: [
      "Messages invités en direct",
      "Réponses administrateur",
      "Export PDF souvenir",
    ],
  },
  {
    id: 5,
    title: "Jeux d'Ambiance & Animations",
    description:
      "Quiz couple, Memory des amoureux, Catch Love, Défis photo, Timeline histoire d'amour, générateur de vœux… Des jeux pour animer vos invités avant et pendant l'événement.",
    color: "rgba(168, 85, 247, 0.9)",
    gradient:
      "linear-gradient(135deg, #14061f 0%, #230c33 40%, #321147 100%)",
    icon: Gamepad2,
    bullets: ["Quiz & Memory", "Catch Love & Défis photo", "Timeline & Vœux"],
  },
  {
    id: 6,
    title: "Check-in Invités & Dashboard",
    description:
      "Panneau de contrôle complet : inscription des présents le jour J avec QR Code, gestion des tables, suivi des confirmations, envoi de rappels et export des listes.",
    color: "rgba(249, 115, 22, 0.9)",
    gradient:
      "linear-gradient(135deg, #1c0c04 0%, #2e1506 40%, #421e0a 100%)",
    icon: Users,
    bullets: [
      "Check-in / Check-out",
      "QR Code par invité",
      "Dashboard & Export Excel",
    ],
  },
];
