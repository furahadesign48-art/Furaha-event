# Règles Firestore pour les Templates

Ajoutez ces règles dans votre console Firebase Firestore :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Règles pour la collection users
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Sous-collection invites
      match /invites/{inviteId} {
        allow read: if true; // Lecture publique pour permettre l'accès aux invitations
        allow write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Sous-collection UserModel
      match /UserModel/{modelId} {
        allow read: if true; // Lecture publique pour permettre l'accès aux modèles d'invitation
        allow write: if request.auth != null && request.auth.uid == userId;
      }
      
      // Sous-collection Tables
      match /Tables/{tableId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Règles pour les templates par défaut (lecture seule pour tous les utilisateurs authentifiés)
    match /templates/{templateId} {
      allow read: if request.auth != null;
      allow write: if false; // Seuls les administrateurs peuvent écrire (via console ou fonctions cloud)
    }
    
    // Règles pour les modèles utilisateur
    match /userModels/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Sous-collections pour chaque catégorie
      match /wedding/{templateId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /birthday/{templateId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /graduation/{templateId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Règles pour les événements et invitations (si nécessaire)
    match /events/{eventId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    match /invitations/{invitationId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Structure des données

### Collection `templates` (templates par défaut)
```
templates/
  ├── wedding-gold-premium/
  │   ├── id: "wedding-gold-premium"
  │   ├── name: "Mariage Gold Premium"
  │   ├── category: "wedding"
  │   ├── backgroundImage: "url"
  │   ├── title: "Mariage de [Prénom Mariée] & [Prénom Marié]"
  │   ├── invitationText: "..."
  │   ├── eventDate: "[Date de l'événement]"
  │   ├── eventTime: "[Heure de l'événement]"
  │   ├── eventLocation: "[Lieu de l'événement]"
  │   ├── drinkOptions: ["Champagne", "Vin Rouge", ...]
  │   ├── features: ["Photo de fond romantique", ...]
  │   ├── colors: { primary: "#f59e0b", secondary: "#d97706", accent: "#f43f5e" }
  │   ├── isDefault: true
  │   ├── createdAt: timestamp
  │   └── updatedAt: timestamp
  │
  ├── birthday-celebration-premium/
  └── graduation-achievement-premium/
```

### Collection `userModels` (modèles utilisateur)
```
userModels/
  └── {userId}/
      ├── wedding/
      │   └── {templateId}/
      │       ├── id: "wedding_1234567890_abc123"
      │       ├── userId: "user123"
      │       ├── originalTemplateId: "wedding-gold-premium"
      │       ├── name: "Mariage Gold Premium"
      │       ├── category: "wedding"
      │       ├── backgroundImage: "url"
      │       ├── title: "Mariage de Sophie & Lucas"
      │       ├── invitationText: "..."
      │       ├── eventDate: "15 Juin 2024"
      │       ├── eventTime: "16h00"
      │       ├── eventLocation: "Château de Versailles"
      │       ├── drinkOptions: ["Champagne", ...]
      │       ├── features: [...]
      │       ├── guestData: {
      │       │   name: "[Nom de l'invité]",
      │       │   tableNumber: "[Numéro de table]",
      │       │   qrCode: "WED-1234567890",
      │       │   confirmation: "pending",
      │       │   selectedDrink: "",
      │       │   message: ""
      │       │ }
      │       ├── customizations: {
      │       │   colors: { primary: "#f59e0b", ... },
      │       │   fonts: { title: "Playfair Display", ... },
      │       │   layout: "default"
      │       │ }
      │       ├── createdAt: timestamp
      │       └── updatedAt: timestamp
      │
      ├── birthday/
      └── graduation/
```

## Avantages de cette structure

1. **Séparation claire** : Templates par défaut séparés des modèles utilisateur
2. **Sécurité** : Chaque utilisateur ne peut accéder qu'à ses propres modèles
3. **Évolutivité** : Facile d'ajouter de nouveaux templates ou catégories
4. **Performance** : Requêtes optimisées par catégorie
5. **Indépendance** : Chaque copie utilisateur est complètement indépendante
6. **Personnalisation** : Support complet des customizations utilisateur