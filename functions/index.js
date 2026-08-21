const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

admin.initializeApp(); // Force deploy - v3

/**
 * Envoyer une notification push PERSONNALISÉE à chaque invité
 * - Avec l'image de fond du couple
 * - Avec le lien DYNAMIQUE vers l'invitation de l'invité
 */
exports.sendReminderToAllGuests = onRequest({
    region: "us-central1"
}, async (req, res) => {
    // Gestion CORS : autoriser les requêtes depuis tous les domaines
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Gérer la requête préflight OPTIONS
    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    // Vérifier la méthode et les données
    if (req.method !== 'POST') {
        return res.status(405).send('Méthode non autorisée');
    }

    const { userId, templateId, title, body } = req.body;
    if (!userId || !templateId) {
        return res.status(400).send('userId et templateId manquants');
    }

    try {
        logger.info('========================================');
        logger.info('🚀 DEBUT DE L\'ENVOI DES NOTIFICATIONS PERSONNALISÉES');
        logger.info('========================================');
        logger.info('userId:', userId);
        logger.info('templateId:', templateId);

        // 1. Récupérer les données de l'événement (pour l'image de fond)
        logger.info('Récupération des données de l\'événement...');
        const eventDoc = await admin.firestore()
            .collection("users")
            .doc(userId)
            .collection("UserModel")
            .doc(templateId)
            .get();
        
        const eventData = eventDoc.data();
        const backgroundImage = eventData?.backgroundImage || eventData?.eventPhoto1 || '';
        const imageUrl = optimizeImageUrl(backgroundImage);
        logger.info('Image de fond du couple:', backgroundImage ? 'trouvée' : 'aucune');
        logger.info('Image optimisée:', imageUrl);

        // 2. Récupérer TOUS les invités
        logger.info('Récupération des invités...');
        const invitesSnapshot = await admin.firestore()
            .collection("users")
            .doc(userId)
            .collection("invites")
            .get();
        
        logger.info('Nombre d\'invités trouvés:', invitesSnapshot.size);

        if (invitesSnapshot.size === 0) {
            logger.info('Aucun invité trouvé');
            return res.status(200).send({ success: true, message: 'Aucun invité trouvé.', sent: 0, failed: 0 });
        }

        // 3. Préparer et envoyer une notification PAR INVITÉ
        const messages = [];
        let invitedWithTokenCount = 0;

        invitesSnapshot.docs.forEach(doc => {
            const inviteData = doc.data();
            const inviteId = doc.id;
            const token = inviteData.fcmToken;
            const guestName = inviteData.nom || 'Cher invité';

            if (token) {
                invitedWithTokenCount++;
                logger.info('---');
                logger.info('Préparation notif pour:', inviteId);
                logger.info('Nom de l\'invité:', guestName);
                logger.info('Token présent:', true);

                // URL DYNAMIQUE vers l'invitation de CET invité !
                const dynamicUrl = `https://furaha-event-831ca.web.app/invitation/${inviteId}`;

                // Message PERSONNALISÉ pour CET invité
                // NOTE : On utilise UNIQUEMENT webpush.notification (pas de bloc notification global)
                // pour éviter l'envoi de DEUX notifications (une sans image, une avec image).
                const message = {
                    token: token,
                    webpush: {
                        notification: {
                            title: title || `Rappel pour vous, ${guestName} !`,
                            body: body || 'Votre invitation vous attend !',
                            icon: 'https://furaha-event-831ca.web.app/favicon.ico'
                        },
                        fcmOptions: {
                            link: dynamicUrl
                        }
                    },
                    data: {
                        url: dynamicUrl,
                        inviteId: inviteId,
                        guestName: guestName
                    }
                };

                // Ajouter l'image si présente
                if (imageUrl) {
                    message.webpush.notification.image = imageUrl;
                }

                messages.push(message);
                logger.info('Message préparé avec URL:', dynamicUrl);
            } else {
                logger.warn('Aucun token pour l\'invité:', inviteId);
            }
        });

        logger.info('========================================');
        logger.info('✅ Nombre total d\'invités avec token:', invitedWithTokenCount);
        logger.info('========================================');

        if (invitedWithTokenCount === 0) {
            return res.status(200).send({ success: true, message: 'Aucun invité n\'a activé les notifications.', sent: 0, failed: 0 });
        }

        // 4. Envoyer TOUS les messages !
        logger.info('Envoi de toutes les notifications...');
        logger.info('Messages préparés:', messages.map((m, i) => ({ index: i, tokenPrefix: m.token.substring(0, 20) + '...' })));
        
        const response = await admin.messaging().sendEach(messages);
        const sentCount = Number(response.successCount) || 0;
        const failedCount = Number(response.failureCount) || 0;

        logger.info('========================================');
        logger.info('🎉 NOTIFICATIONS ENVOYÉES !');
        logger.info(`✅ Succès: ${sentCount}`);
        logger.info(`❌ Échecs: ${failedCount}`);
        logger.info('========================================');

        // Log des erreurs si échec et des succès
        response.responses.forEach((resp, index) => {
            if (resp.error) {
                logger.error(`❌ Erreur pour message ${index}:`, resp.error.message, resp.error.code);
            } else {
                logger.info(`✅ Succès pour message ${index}:`, resp.messageId);
            }
        });

        return res.status(200).send({ 
            success: true, 
            sent: sentCount, 
            failed: failedCount,
            message: sentCount === 0 ? "Aucun invité n'a activé les notifications." : ""
        });

    } catch (error) {
        logger.error('❌ ERREUR GLOBALE lors de l\'envoi des notifs:', error);
        return res.status(500).send({ success: false, error: error.message });
    }
});

/**
 * Optimise l'URL de l'image pour les réseaux sociaux (WhatsApp)
 */
function optimizeImageUrl(url) {
    if (!url) return '';
    
    if (url.includes('cloudinary.com')) {
        return url.replace('/upload/', '/upload/w_1600,h_1200,c_lfill,g_face,q_auto,f_jpg/');
    }
    
    if (url.includes('firebasestorage.googleapis.com')) {
        return url;
    }
    
    return url;
}

function getImageType(url) {
    if (!url) return 'image/jpeg';
    const lower = url.toLowerCase();
    if (lower.includes('.png') || lower.includes('f_png')) return 'image/png';
    if (lower.includes('.webp') || lower.includes('f_webp')) return 'image/webp';
    if (lower.includes('.gif') || lower.includes('f_gif')) return 'image/gif';
    return 'image/jpeg';
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Fonction pour gérer les métadonnées dynamiques (Open Graph) pour le partage d'invitations
 * - Récupère l'image de fond depuis Firestore pour la prévisualisation WhatsApp
 */
exports.shareInvitation = onRequest({
    region: "us-central1"
}, async (req, res) => {
    logger.info("Requête reçue pour shareInvitation:", req.path, req.url);
    
    // Extraire l'inviteId du chemin
    let inviteId = null;
    if (req.path.startsWith('/v/')) {
        inviteId = req.path.substring(3);
    } else if (req.path.startsWith('/invite/')) {
        inviteId = req.path.substring(8);
    } else if (req.path.startsWith('/invitation/')) {
        inviteId = req.path.substring(12);
    }
    
    logger.info("InviteId extrait:", inviteId);
    
    if (!inviteId) {
        logger.warn("Aucun inviteId trouvé");
        return res.redirect('https://furaha-event.com');
    }
    
    try {
        let eventTitle = "Invitation Spéciale";
        let eventDescription = "Vous êtes cordialement invité(e) à un événement spécial !";
        let imageUrl = "https://furaha-event-831ca.web.app/assets/FURAHA-GOLD-CAdZ807y.png";
        let guestName = "Cher invité";
        let userId = null;
        
        // Utiliser une collection group query pour trouver l'invite rapidement
        const invitesCollectionGroup = admin.firestore().collectionGroup('invites');
        const inviteQuery = invitesCollectionGroup.where('id', '==', inviteId);
        const inviteSnapshot = await inviteQuery.limit(1).get();
        
        if (!inviteSnapshot.empty) {
            const inviteDoc = inviteSnapshot.docs[0];
            const inviteData = inviteDoc.data();
            guestName = inviteData.nom || "Cher invité";
            
            // Extraire userId du champ inviteData si disponible, sinon du chemin du document
            userId = inviteData.userId || inviteDoc.ref.parent.parent?.id;
            logger.info("Invité trouvé pour userId:", userId);
            
            if (userId) {
                // Trouver le UserModel (le premier trouvé)
                const userModelsSnapshot = await admin.firestore()
                    .collection("users")
                    .doc(userId)
                    .collection("UserModel")
                    .limit(1)
                    .get();
                
                if (!userModelsSnapshot.empty) {
                    const modelData = userModelsSnapshot.docs[0].data();
                    eventTitle = modelData.title || "Invitation Spéciale";
                    eventDescription = modelData.invitationText || "Vous êtes cordialement invité(e) à un événement spécial !";
                    
                    // Récupérer et optimiser l'image
                    const rawImage = modelData.backgroundImage || modelData.eventPhoto1;
                    if (rawImage) {
                        imageUrl = optimizeImageUrl(rawImage);
                    }
                }
            }
        } else {
            logger.warn("Invité non trouvé avec la collection group query");
        }
        
        logger.info("Données pour les meta tags:");
        logger.info("- Titre:", eventTitle);
        logger.info("- Description:", eventDescription);
        logger.info("- Image:", imageUrl);
        
        const imageType = getImageType(imageUrl);
        const safeTitleRaw = eventTitle && eventTitle.trim().length > 0
            ? eventTitle
            : "Invitation Spéciale";
        const safeImageRaw = imageUrl && imageUrl.trim().length > 0
            ? imageUrl
            : "https://furaha-event-831ca.web.app/assets/FURAHA-GOLD-CAdZ807y.png";
        const safeInviteId = escapeHtml(inviteId);
        const safeTitle = escapeHtml(safeTitleRaw);
        const safeImage = escapeHtml(safeImageRaw);
        const safeImageType = escapeHtml(imageType);
        const ogUrl = escapeHtml(`https://furaha-event-831ca.web.app/invitation/${inviteId}`);
        const redirectUrl = escapeHtml(`/i/${inviteId}`);
        const blankDesc = '\u00a0';

        // Générer la page HTML avec les meta tags Open Graph
        const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle}</title>
    <meta name="description" content="${blankDesc}">
    
    <!-- Open Graph Meta Tags pour les réseaux sociaux -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Furaha Event">
    <meta property="og:url" content="${ogUrl}">
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${blankDesc}">
    <meta property="og:image" content="${safeImage}">
    <meta property="og:image:secure_url" content="${safeImage}">
    <meta property="og:image:type" content="${safeImageType}">
    <meta property="og:image:width" content="1600">
    <meta property="og:image:height" content="1200">
    <meta property="og:locale" content="fr_FR">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${blankDesc}">
    <meta name="twitter:image" content="${safeImage}">
    
    <!-- Redirection automatique vers l'invitation -->
    <script>
        setTimeout(() => {
            window.location.href = '${redirectUrl}';
        }, 100);
    </script>
</head>
<body style="font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);">
    <div style="text-align: center;">
        <h1 style="color: #78350f; font-size: 2rem; margin-bottom: 1rem;">Redirection en cours...</h1>
        <p style="color: #92400e;">Si rien ne se passe automatiquement, <a href="${redirectUrl}" style="color: #92400e; text-decoration: underline;">cliquez ici</a></p>
    </div>
</body>
</html>`;
        
        res.set('Content-Type', 'text/html');
        res.status(200).send(html);
        
    } catch (error) {
        logger.error('Erreur lors de la génération de la page de partage:', error);
        // En cas d'erreur, rediriger quand même vers l'invitation
        return res.redirect(`/invitation/${inviteId}`);
    }
});

// Helper function to send guest book notifications
const sendGuestBookNotificationHelper = async (snapshot, context) => {
  try {
    const messageData = snapshot.data();
    const authorName = messageData.authorName || 'Invité';
    const content = messageData.content || '';

    // Extract userId from the path
    const userId = context.params.userId;
    const authorInviteId = context.params.inviteId;

    logger.info('📖 Nouveau message du livre d\'or pour utilisateur:', userId);
    logger.info('Auteur:', authorName);

    // Get user's template to retrieve background image
    // 1) D'abord : champs à la racine du document users/{uid} (legacy)
    // 2) Fallback : premier document de la collection users/{uid}/UserModel
    let imageUrl = '';
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const templateCustomization = userData.templateCustomization;
      const modelData = userData.modelData;
      if (templateCustomization?.backgroundImage) {
        imageUrl = optimizeImageUrl(templateCustomization.backgroundImage);
      } else if (modelData?.backgroundImage || modelData?.eventPhoto1) {
        const rawImage = modelData.backgroundImage || modelData.eventPhoto1;
        imageUrl = optimizeImageUrl(rawImage);
      }
    }

    // Si toujours pas d'image, chercher dans la collection UserModel (emplacement standard)
    if (!imageUrl) {
      try {
        const userModelsSnap = await admin.firestore()
          .collection('users')
          .doc(userId)
          .collection('UserModel')
          .limit(1)
          .get();
        if (!userModelsSnap.empty) {
          const modelDoc = userModelsSnap.docs[0].data();
          const rawImage = modelDoc.backgroundImage || modelDoc.eventPhoto1;
          if (rawImage) imageUrl = optimizeImageUrl(rawImage);
        }
      } catch (e) {
        logger.warn('Erreur lors de la recherche UserModel pour l\'image (ignoré):', e.message);
      }
    }
    logger.info('Image pour notifications du livre d\'or:', imageUrl || '(aucune)');

    // Get all invites for this user
    const invitesSnapshot = await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('invites')
      .get();

    const messages = [];
    for (const doc of invitesSnapshot.docs) {
      const inviteData = doc.data();
      const token = inviteData.fcmToken;
      const guestName = inviteData.nom || 'Cher invité';
      const inviteId = doc.id;

      // Don't send notification to the author themselves
      if (token && inviteId !== authorInviteId) {
        const dynamicUrl = `https://furaha-event-831ca.web.app/invitation/${inviteId}`;

        // NOTE : On utilise UNIQUEMENT webpush.notification (pas de bloc notification global)
        // pour éviter l'envoi de DEUX notifications (une sans image, une avec image).
        const notificationMessage = {
          token: token,
          webpush: {
            notification: {
              title: `${authorName} a écrit dans le livre d'or !`,
              body: content.length > 100 ? content.substring(0, 97) + '...' : content,
              icon: 'https://furaha-event-831ca.web.app/favicon.ico'
            },
            fcmOptions: {
              link: dynamicUrl
            }
          },
          data: {
            url: dynamicUrl,
            inviteId: inviteId,
            guestName: guestName,
            type: 'guestBookMessage'
          }
        };

        // Ajouter l'image si présente
        if (imageUrl) {
          notificationMessage.webpush.notification.image = imageUrl;
        }

        messages.push(notificationMessage);
      }
    }

    logger.info('Notifications préparées pour', messages.length, 'invités');

    if (messages.length > 0) {
      const response = await admin.messaging().sendEach(messages);
      logger.info('✅ Notifications envoyées:', response.successCount);
      logger.info('❌ Échecs:', response.failureCount);

      // Log détaillé des échecs (pour aider au debug si besoin)
      response.responses.forEach((resp, idx) => {
        if (resp.error) {
          logger.error(`❌ Échec notif ${idx}: code=${resp.error.code}, msg=${resp.error.message}`);
        }
      });
    }
  } catch (error) {
    logger.error('❌ Erreur lors de l\'envoi des notifications du livre d\'or:', error);
  }
};

// Trigger for new guest messages (new collection: guestMessages)
exports.sendGuestBookNotification = onDocumentCreated({
  document: "users/{userId}/invites/{inviteId}/guestMessages/{messageId}",
  region: "europe-west1"
}, sendGuestBookNotificationHelper);

// Trigger for new guest messages (legacy collection: message)
exports.sendLegacyGuestBookNotification = onDocumentCreated({
  document: "users/{userId}/invites/{inviteId}/message/{messageId}",
  region: "europe-west1"
}, sendGuestBookNotificationHelper);

// ============================================================
// GESTION SÉCURISÉE DES UTILISATEURS (ADMIN UNIQUEMENT)
// ============================================================

const ADMIN_REGION = "europe-west1";

/**
 * Vérifie que l'utilisateur appelant est connecté ET a le rôle 'admin'
 */
async function verifyAdmin(req) {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
        throw new Error('UNAUTHORIZED: Token manquant');
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const callerUid = decodedToken.uid;

    const userDoc = await admin.firestore()
        .collection('users')
        .doc(callerUid)
        .get();

    if (!userDoc.exists) {
        throw new Error('UNAUTHORIZED: Profil introuvable');
    }

    const userData = userDoc.data();
    if (userData.role !== 'admin') {
        throw new Error('FORBIDDEN: Droits administrateur requis');
    }

    return callerUid;
}

function applyCors(res) {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Lister tous les utilisateurs (admin uniquement)
 */
exports.adminListUsers = onRequest({ region: ADMIN_REGION }, async (req, res) => {
    applyCors(res);
    if (req.method === 'OPTIONS') return res.status(204).send('');

    try {
        await verifyAdmin(req);

        const pageSize = Number(req.query.limit) || 100;
        const pageToken = req.query.pageToken || undefined;

        // Récupérer les utilisateurs Firebase Auth
        const listUsersResult = await admin.auth().listUsers(pageSize, pageToken);

        // Récupérer les données Firestore associées en parallèle
        const userRecords = listUsersResult.users;
        const firestoreDataPromises = userRecords.map(async (userRecord) => {
            const doc = await admin.firestore()
                .collection('users')
                .doc(userRecord.uid)
                .get();
            const fsData = doc.exists ? doc.data() : {};
            return {
                uid: userRecord.uid,
                email: userRecord.email,
                emailVerified: userRecord.emailVerified,
                disabled: userRecord.disabled,
                createdAt: userRecord.metadata.creationTime,
                lastSignInTime: userRecord.metadata.lastSignInTime,
                firstName: fsData.firstName || '',
                lastName: fsData.lastName || '',
                role: fsData.role || 'user',
                photoURL: fsData.photoURL || userRecord.photoURL || ''
            };
        });

        const users = await Promise.all(firestoreDataPromises);

        return res.status(200).send({
            success: true,
            users,
            nextPageToken: listUsersResult.pageToken || null,
            total: users.length
        });

    } catch (error) {
        logger.error('❌ adminListUsers error:', error.message);
        if (error.message.startsWith('UNAUTHORIZED')) return res.status(401).send({ success: false, error: error.message });
        if (error.message.startsWith('FORBIDDEN')) return res.status(403).send({ success: false, error: error.message });
        return res.status(500).send({ success: false, error: error.message });
    }
});

/**
 * Créer un nouvel utilisateur (admin uniquement)
 * Body: { email, password, firstName, lastName, role? }
 */
exports.adminCreateUser = onRequest({ region: ADMIN_REGION }, async (req, res) => {
    applyCors(res);
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).send({ success: false, error: 'Méthode non autorisée' });

    try {
        await verifyAdmin(req);

        const { email, password, firstName, lastName, role } = req.body;
        if (!email || !password) {
            return res.status(400).send({ success: false, error: 'Email et mot de passe requis' });
        }
        if (password.length < 6) {
            return res.status(400).send({ success: false, error: 'Le mot de passe doit contenir au moins 6 caractères' });
        }

        // Créer l'utilisateur dans Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: `${firstName || ''} ${lastName || ''}`.trim(),
            emailVerified: false,
            disabled: false
        });

        // Créer le document Firestore
        const userData = {
            email,
            firstName: firstName || '',
            lastName: lastName || '',
            createdAt: new Date().toISOString(),
            role: role || 'user'
        };
        await admin.firestore()
            .collection('users')
            .doc(userRecord.uid)
            .set(userData);

        logger.info(`✅ Utilisateur créé par admin: ${email} (${userRecord.uid})`);

        return res.status(200).send({
            success: true,
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                ...userData
            }
        });

    } catch (error) {
        logger.error('❌ adminCreateUser error:', error.message);
        if (error.message.startsWith('UNAUTHORIZED')) return res.status(401).send({ success: false, error: error.message });
        if (error.message.startsWith('FORBIDDEN')) return res.status(403).send({ success: false, error: error.message });
        return res.status(500).send({ success: false, error: error.message });
    }
});

/**
 * Modifier un utilisateur (admin uniquement)
 * Body: { email?, firstName?, lastName?, role?, disabled? }
 */
exports.adminUpdateUser = onRequest({ region: ADMIN_REGION }, async (req, res) => {
    applyCors(res);
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).send({ success: false, error: 'Méthode non autorisée' });

    try {
        await verifyAdmin(req);

        const { uid, email, firstName, lastName, role, disabled } = req.body;
        if (!uid) {
            return res.status(400).send({ success: false, error: 'UID requis' });
        }

        // Mettre à jour Firebase Auth
        const authUpdates = {};
        if (email !== undefined) authUpdates.email = email;
        if (disabled !== undefined) authUpdates.disabled = Boolean(disabled);
        if ((firstName !== undefined || lastName !== undefined)) {
            // Récupérer les valeurs actuelles
            const currentUser = await admin.auth().getUser(uid);
            const parts = currentUser.displayName?.split(' ') || ['', ''];
            authUpdates.displayName = `${firstName ?? parts[0] ?? ''} ${lastName ?? parts[1] ?? ''}`.trim();
        }
        if (Object.keys(authUpdates).length > 0) {
            await admin.auth().updateUser(uid, authUpdates);
        }

        // Mettre à jour Firestore
        const fsUpdates = {};
        if (email !== undefined) fsUpdates.email = email;
        if (firstName !== undefined) fsUpdates.firstName = firstName;
        if (lastName !== undefined) fsUpdates.lastName = lastName;
        if (role !== undefined) fsUpdates.role = role;

        if (Object.keys(fsUpdates).length > 0) {
            await admin.firestore()
                .collection('users')
                .doc(uid)
                .set(fsUpdates, { merge: true });
        }

        logger.info(`✅ Utilisateur mis à jour par admin: ${uid}`);
        return res.status(200).send({ success: true, message: 'Utilisateur mis à jour' });

    } catch (error) {
        logger.error('❌ adminUpdateUser error:', error.message);
        if (error.message.startsWith('UNAUTHORIZED')) return res.status(401).send({ success: false, error: error.message });
        if (error.message.startsWith('FORBIDDEN')) return res.status(403).send({ success: false, error: error.message });
        return res.status(500).send({ success: false, error: error.message });
    }
});

/**
 * Réinitialiser le mot de passe d'un utilisateur (admin uniquement)
 * Body: { uid, newPassword }
 */
exports.adminResetPassword = onRequest({ region: ADMIN_REGION }, async (req, res) => {
    applyCors(res);
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).send({ success: false, error: 'Méthode non autorisée' });

    try {
        await verifyAdmin(req);

        const { uid, newPassword } = req.body;
        if (!uid || !newPassword) {
            return res.status(400).send({ success: false, error: 'UID et nouveau mot de passe requis' });
        }
        if (newPassword.length < 6) {
            return res.status(400).send({ success: false, error: 'Le mot de passe doit contenir au moins 6 caractères' });
        }

        await admin.auth().updateUser(uid, { password: newPassword });

        logger.info(`✅ Mot de passe réinitialisé par admin pour: ${uid}`);
        return res.status(200).send({ success: true, message: 'Mot de passe réinitialisé' });

    } catch (error) {
        logger.error('❌ adminResetPassword error:', error.message);
        if (error.message.startsWith('UNAUTHORIZED')) return res.status(401).send({ success: false, error: error.message });
        if (error.message.startsWith('FORBIDDEN')) return res.status(403).send({ success: false, error: error.message });
        return res.status(500).send({ success: false, error: error.message });
    }
});

/**
 * Activer / Désactiver un utilisateur (admin uniquement)
 * Body: { uid, disabled: boolean }
 */
exports.adminToggleUserDisabled = onRequest({ region: ADMIN_REGION }, async (req, res) => {
    applyCors(res);
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).send({ success: false, error: 'Méthode non autorisée' });

    try {
        await verifyAdmin(req);

        const { uid, disabled } = req.body;
        if (!uid || disabled === undefined) {
            return res.status(400).send({ success: false, error: 'UID et état disabled requis' });
        }

        await admin.auth().updateUser(uid, { disabled: Boolean(disabled) });

        logger.info(`✅ Statut utilisateur changé par admin: ${uid} -> disabled=${disabled}`);
        return res.status(200).send({ success: true, message: `Compte ${disabled ? 'désactivé' : 'activé'}` });

    } catch (error) {
        logger.error('❌ adminToggleUserDisabled error:', error.message);
        if (error.message.startsWith('UNAUTHORIZED')) return res.status(401).send({ success: false, error: error.message });
        if (error.message.startsWith('FORBIDDEN')) return res.status(403).send({ success: false, error: error.message });
        return res.status(500).send({ success: false, error: error.message });
    }
});

/**
 * Supprimer un utilisateur (admin uniquement)
 * Body: { uid }
 */
exports.adminDeleteUser = onRequest({ region: ADMIN_REGION }, async (req, res) => {
    applyCors(res);
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).send({ success: false, error: 'Méthode non autorisée' });

    try {
        await verifyAdmin(req);

        const { uid } = req.body;
        if (!uid) {
            return res.status(400).send({ success: false, error: 'UID requis' });
        }

        // Supprimer Firebase Auth
        await admin.auth().deleteUser(uid);

        // Supprimer le document Firestore
        await admin.firestore()
            .collection('users')
            .doc(uid)
            .delete();

        logger.info(`✅ Utilisateur supprimé par admin: ${uid}`);
        return res.status(200).send({ success: true, message: 'Utilisateur supprimé' });

    } catch (error) {
        logger.error('❌ adminDeleteUser error:', error.message);
        if (error.message.startsWith('UNAUTHORIZED')) return res.status(401).send({ success: false, error: error.message });
        if (error.message.startsWith('FORBIDDEN')) return res.status(403).send({ success: false, error: error.message });
        return res.status(500).send({ success: false, error: error.message });
    }
});
