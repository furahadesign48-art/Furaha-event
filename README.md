Furaha-Event3

Pour utiliser l'authentification Firebase, vous devez :
## Configuration Firebase

✅ **Configuration terminée !**

Le projet est maintenant configuré avec Firebase :
- **Projet Firebase** : furaha-event-831ca
- **Authentification** : Email/Mot de passe activée
- **Firestore** : Base de données configurée
- **Persistance** : Session utilisateur maintenue automatiquement

### Variables d'environnement requises

Les variables d'environnement sont déjà configurées dans le fichier `.env` :

```
VITE_FIREBASE_API_KEY=AIzaSyBtWKFZ78KtLA_WKEkNBpJWS1LQVUMWQXc
VITE_FIREBASE_AUTH_DOMAIN=furaha-event-831ca.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=furaha-event-831ca
VITE_FIREBASE_STORAGE_BUCKET=furaha-event-831ca.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=369854399050
VITE_FIREBASE_APP_ID=1:369854399050:web:9dd985ac0fd2a26a8e9cb3
```

### Fonctionnalités d'authentification

- ✅ **Inscription** avec email/mot de passe
- ✅ **Connexion** avec email/mot de passe  
- ✅ **Réinitialisation** de mot de passe
- ✅ **Persistance** de session (l'utilisateur reste connecté)
- ✅ **Déconnexion** manuelle
- ✅ **Gestion** des profils utilisateur

### Règles Firestore

Ajoutez ces règles dans votre console Firebase Firestore :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Règles pour la collection users
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Règles pour les événements et invitations
    match /events/{eventId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    match /invitations/{invitationId} {
      allow read, write: if request.auth != null;
    }
  }
}
```