const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

admin.initializeApp(); // Force deploy

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
        logger.info('Image de fond du couple:', backgroundImage ? 'trouvée' : 'aucune');

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
                const message = {
                    token: token,
                    notification: {
                        title: title || `Rappel pour vous, ${guestName} !`,
                        body: body || 'Votre invitation vous attend !'
                    },
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
    
    // Si c'est du Cloudinary, on force le redimensionnement et la compression
    if (url.includes('cloudinary.com')) {
        // On remplace /upload/ par /upload/w_600,h_600,c_fill,q_auto,f_jpg/ pour une miniature légère
        return url.replace('/upload/', '/upload/w_600,h_600,c_fill,q_auto,f_jpg/');
    }
    
    // Si c'est du Firebase Storage, on s'assure que c'est l'URL media
    if (url.includes('firebasestorage.googleapis.com')) {
        return url; // Déjà optimisé par Firebase en général
    }
    
    return url;
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
        
        // Générer la page HTML avec les meta tags Open Graph
        const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${eventTitle}</title>
    
    <!-- Open Graph Meta Tags pour les réseaux sociaux -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://furaha-event-831ca.web.app/invitation/${inviteId}">
    <meta property="og:title" content="${eventTitle}">
    <meta property="og:description" content="">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${eventTitle}">
    <meta name="twitter:description" content="">
    <meta name="twitter:image" content="${imageUrl}">
    
    <!-- Redirection automatique vers l'invitation -->
    <script>
        setTimeout(() => {
            window.location.href = '/i/${inviteId}';
        }, 100);
    </script>
</head>
<body style="font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);">
    <div style="text-align: center;">
        <h1 style="color: #78350f; font-size: 2rem; margin-bottom: 1rem;">Redirection en cours...</h1>
        <p style="color: #92400e;">Si rien ne se passe automatiquement, <a href="/i/${inviteId}" style="color: #92400e; text-decoration: underline;">cliquez ici</a></p>
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
    logger.info('Image pour notifications du livre d\'or:', imageUrl);
    
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
        
        const notificationMessage = {
          token: token,
          notification: {
            title: `${authorName} a écrit dans le livre d'or !`,
            body: content.length > 100 ? content.substring(0, 97) + '...' : content
          },
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
