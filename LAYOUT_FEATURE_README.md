# 🌟 Furaha-Event — Feature Multi-Layout / BookLayout

> Documentation dédiée au nouveau système de layout modulable (invitation format « Livre »).
> Aucun impact sur les invitations existantes (tout est derrière feature-flag + whitelist UID).

---

## 📋 Résumé
Anciennement, tout le JSX de rendu d'une invitation résidait dans `InvitationPreview.tsx` (près de 4000 lignes). L'infrastructure a été refactorisée pour permettre **plusieurs types/layouts d'invitation** (un format scroll classique, un format « Livre » à venir), avec une **approche ultra-sécurisée** :

- Zéro toucher à la logique métier (handlers, states, exports, parsing, Firebase)
- Zéro régression pour les utilisateurs existants (feature-flag + whitelist)
- Séparation stricte des responsabilités

---

## 🏗️ Architecture

### Arborescence nouvelle
```
src/
├── components/
│   ├── InvitationPreview.tsx         ← AIGUILLAGE (layout selector + orchestrateur)
│   ├── TemplateCustomization.tsx     ← Sélecteur layout (UI design tab, caché par défaut)
│   └── layouts/
│       ├── ClassicScrollLayout.tsx   ← Layout historique (rendu scroll premium)
│       └── BookLayout.tsx            ← NOUVEAU layout — Format Livre (WIP)
└── services/
    └── templateService.ts            ← Interface UserModel.customizations.layout (existe déjà)
```

### Pipeline de rendu (InvitationPreview)
```
                        ┌─────────────────────────────────────┐
                        │ 1. Cas isLoading / dataError / rich │
                        │    — rendu inline (HORS layouts)    │
                        └──────────────────┬──────────────────┘
                                           ▼
                        ┌─────────────────────────────────────┐
                        │ 2. Feature-flag + Whitelist UID     │
                        │    FEATURE_FLAG_BOOK_ENABLED        │
                        │    BOOK_WHITELIST_UIDS              │
                        └──────────────────┬──────────────────┘
                                           ▼
                        ┌─────────────────────────────────────┐
                        │ 3. rawLayout (customizations.layout)│
                        │    └─ 'default' | 'book'            │
                        └──────────────────┬──────────────────┘
                                           ▼
              ┌────────────────────────────┴────────────────────────────┐
              ▼                                                         ▼
     ┌──────────────────┐                                    ┌──────────────────┐
     │ effectiveLayout  │                                    │ effectiveLayout  │
     │    = 'default'   │                                    │     = 'book'     │
     └────────┬─────────┘                                    └────────┬─────────┘
              ▼                                                       ▼
  <ClassicScrollLayout {...allProps} />                    <BookLayout {...allProps} />
```

---

## 🚦 Feature-Flags & Interrupteurs
*(Pour tester/activer la feature, ces 3 switches doivent être modifiés)*

| # | Constant | Fichier | Ligne | Valeur TEST | Valeur PROD | Effet |
|---|---|---|---|---|---|---|
| 1 | `SHOW_LAYOUT_SELECTOR` | `TemplateCustomization.tsx` | 126 | `true` | `false` | Affiche/masque le sélecteur de layout dans l'onglet **Design** |
| 2 | `FEATURE_FLAG_BOOK_ENABLED` | `InvitationPreview.tsx` | 1869 | `true` | `false` | Active/désactive la branche BookLayout côté rendu |
| 3 | `BOOK_WHITELIST_UIDS` | `InvitationPreview.tsx` | 1870 | `['TON_UID_FIREBASE']` | `[]` | Restreint BookLayout à certains utilisateurs (testeurs) |

> ⚠️ **Règle d'or :** Toujours conserver whitelist + feature-flag tant que BookLayout n'est pas terminé. Sans ça, TOUS les utilisateurs en custom `layout:book` recevraient un rendu WIP.

### Test rapide (sans activer le sélecteur UI)
Si tu veux forcer BookLayout localement pour **n'importe quel template**, sur une URL spécifique :
1. Dans `InvitationPreview.tsx`, ligne 1874 : temporairement `const effectiveLayout = 'book'`
2. Toutes les invitations (même historiques) rendront BookLayout (très pratique pour prototyper)
3. **Ne jamais commit ce bypass**

---

## 🧩 Interface Props partagée
Les deux layouts reçoivent **strictement les mêmes 70+ props** via leurs interfaces TypeScript :
- `ClassicScrollLayoutProps` (ClassicScrollLayout.tsx)
- `BookLayoutProps` (BookLayout.tsx)

**Important :** Si tu dois passer une **nouvelle donnée** à un layout, tu dois :
1. L'ajouter aux 2 interfaces props
2. L'ajouter aux 2 appels JSX (`<ClassicScrollLayout>` ET `<BookLayout>` dans InvitationPreview)
3. La documenter ici

Les props groupent par famille :
- **Données** : `safeUserModel`, `safeInvite`, `colors`, `galleryPhotos`, `parallaxGalleryItems`
- **Formatage** : `optimizedBg`, `optimizedPattern`, tous les `*SectionBg`
- **States UI** : `isConfirmed`, `selectedDrink`, `guestBookMessages`, `selectedGalleryPhoto`, `showGuestBook`, `showNotificationModal`
- **États lecture** : `isOfflineMode`, `retryCountdown`, `isMusicPlaying`, `isMusicMuted`, `permission`, `token`, `isNotificationLoading`, `notificationError`
- **Jeux** : `currentGameId`, `games`, `gameResults`, `completedGames`
- **Context / Refs** : `invite`, `inviteId`, `userModel`, `isAdminView`, `isSubmittingMessage`, `sectionRefs`, `audioRef`, `messagesEndRef`
- **Callbacks handlers (IMPORTANT : ne jamais réimplémenter dans un layout)** : `handleConfirmation`, `handleDrinkSelection`, `handleSendMessage`, `handleEditMessage`, `handleSaveEdit`, `handleDeleteMessage`, `confirmDelete`, `downloadQRCode`, `toggleMute`, `requestPermission`
- **Setters states (UI seulement)** : tous les `set*` préfixés
- **Helpers** : `optimizeImageFn`

> 🔒 **Règle d'or 2 :** Toute la logique métier RESTE dans InvitationPreview. Les layouts ne sont QUE des couches de rendu JSX. Pas de logique Firestore / sauvegarde / parsing dans un layout.

---

## 🖌️ Où coder le rendu BookLayout ?
Tout se passe dans le `return()` de `BookLayout.tsx`. Le fichier a déjà été initialisé avec :
- **Tous les imports** (lucide-react, sous-composants de jeux, animations framer-motion, FallingDots, Countdown, FallingDots, PhotoViewer, ParallaxGallery…)
- **Tous les sous-composants internes** de ClassicScrollLayout réimplémentables au besoin (CountdownTimer, RevealOnScroll, FallingDots, les 7 jeux, PhotoViewer)
- **Un placeholder WIP** (tu peux le remplacer entièrement par le JSX Livre final)

### Quand tu ajouteras une section
Tu peux suppprimer le placeholder actuel :
```tsx
<div className="relative z-10 w-full px-4 py-12 ...">
   ...badge Work in progress...
</div>
```

Et le remplacer par tes sections `<section>` dans le conteneur principal. Toutes les props sont déjà destructurées en haut du composant, donc directement accessibles.

---

## 🧬 Comment ça s'enregistre dans Firebase ?
Le champ `layout` est stocké dans :
```
users/{userId}/userModels/{modelId}.customizations.layout
```

Valeurs possibles (string) :
- `"default"` — layout scroll classique (TOUTES les invitations actuelles ont ça ou undefined → default)
- `"book"` — layout livre

### Rétro-compatibilité
Tous les modèles utilisateur existants **n'ont pas** `customizations.layout`. C'est géré :
```ts
const rawLayout = (safeUserModel as any).customizations?.layout || 'default';
```
Donc `undefined` → retombe sur `'default'` → aucun impact.

---

## 🧪 Procédure de test complet (book layout activé)

1. Ouvrir `InvitationPreview.tsx` → ligne 1870 :
   ```ts
   BOOK_WHITELIST_UIDS = ['tR9moiEXAMPLEtONuID']; // colle ton UID Firebase
   ```
2. Ligne 1869 : `FEATURE_FLAG_BOOK_ENABLED = true`
3. Ouvrir `TemplateCustomization.tsx` → ligne 126 : `SHOW_LAYOUT_SELECTOR = true`
4. Démarrer l'app en local :
   ```bash
   npm run dev
   ```
5. Connecte-toi avec le compte dont l'UID est whitelisté
6. Crée / édite un template d'invitation → onglet **Design**
   → tu devrais voir **« Type d'invitation (layout) »** avec 2 cartes :
   - ✅ Scroll Classique (par défaut)
   - ⭐ Livre (Nouveau)
7. Sélectionne **Livre** → clique sur **Enregistrer**
8. Prévisualise l'invitation → le rendu bascule sur `BookLayout.tsx`
9. Itère sur le JSX de BookLayout.tsx → HMR, pas besoin de refresh

---

## ✅ Checklist avant sortie BookLayout en production

- [ ] Layout Book terminé (toutes les sections implémentées)
- [ ] Tests manuels : scroll, musique, QR, RSVP, confirmer/annuler présence, Livre d'or, notifications, Jeux
- [ ] Mobile-first : responsive testé sur iPhone SE + Galaxy S
- [ ] Export PDF/Excel via GuestExportModal fonctionne toujours
- [ ] Build Vite : `exit code 0`
- [ ] `SHOW_LAYOUT_SELECTOR = true`
- [ ] `FEATURE_FLAG_BOOK_ENABLED = true`
- [ ] `BOOK_WHITELIST_UIDS = []` (retire la whitelist)
- [ ] Tests utilisateurs finaux OK
- [ ] TAG git (ex: `v1.1.0-BOOK-LAYOUT`)

---

## 📝 Fichiers concernés
| Fichier | Rôle |
|---|---|
| [InvitationPreview.tsx](src/components/InvitationPreview.tsx) | Orchestrateur + aiguillage multi-layout (NE PAS toucher à la logique métier) |
| [ClassicScrollLayout.tsx](src/components/layouts/ClassicScrollLayout.tsx) | Rendu scroll classique — stable |
| [BookLayout.tsx](src/components/layouts/BookLayout.tsx) | Rendu Livre — en cours |
| [TemplateCustomization.tsx](src/components/TemplateCustomization.tsx) | UI sélecteur layout (design tab) + persistence Firestore |
| [templateService.ts](src/services/templateService.ts) | Typage `UserModel.customizations.layout?: string` (ligne 78) |

---

## 🎬 Commandes utiles
```bash
# Démarrer en local
npm run dev

# Build de prod (avant commit)
npm run build

# Lancer les commandes de l'app
cat package.json
```
