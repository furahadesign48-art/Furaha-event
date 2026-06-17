const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

admin.initializeApp();

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
                        body: body || 'Votre invitation vous attend !',
                    },
                    webpush: {
                        fcmOptions: {
                            link: dynamicUrl // Le lien sur lequel cliquer !
                        },
                        notification: {
                            title: title || `Rappel pour vous, ${guestName} !`,
                            body: body || 'Votre invitation vous attend !',
                            icon: backgroundImage || 'https://furaha-event-831ca.web.app/favicon.ico',
                            image: backgroundImage, // Image de fond du couple en grand !
                            badge: 'https://furaha-event-831ca.web.app/favicon.ico',
                            vibrate: [200, 100, 200],
                            requireInteraction: true,
                            actions: [
                                {
                                    action: 'open',
                                    title: 'Ouvrir l\'invitation',
                                    icon: 'https://furaha-event-831ca.web.app/favicon.ico'
                                }
                            ]
                        },
                        data: {
                            url: dynamicUrl,
                            inviteId: inviteId,
                            guestName: guestName
                        }
                    }
                };

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
        const response = await admin.messaging().sendEach(messages);
        const sentCount = Number(response.successCount) || 0;
        const failedCount = Number(response.failureCount) || 0;

        logger.info('========================================');
        logger.info('🎉 NOTIFICATIONS ENVOYÉES !');
        logger.info(`✅ Succès: ${sentCount}`);
        logger.info(`❌ Échecs: ${failedCount}`);
        logger.info('========================================');

        // Log des erreurs si échec
        if (failedCount > 0) {
            response.responses.forEach((resp, index) => {
                if (resp.error) {
                    logger.error(`Erreur pour message ${index}:`, resp.error.message);
                }
            });
        }

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
        // Chercher dans quelle collection users se trouve cette invitation
        // On doit d'abord trouver l'userId
        let eventTitle = "Invitation Spéciale";
        let eventDescription = "Vous êtes cordialement invité(e) à un événement spécial !";
        let imageUrl = "https://furaha-event-831ca.web.app/assets/FURAHA-GOLD-CAdZ807y.png";
        
        // Tentative : chercher dans toutes les collections users (pas optimal mais fonctionnel)
        // Pour le moment, on va utiliser une approche simplifiée :
        // 1. On suppose que le guestId contient peut-être une référence ?
        // 2. Sinon, on utilise les données par défaut
        // En réalité, on devrait stocker l'userId dans le document invite
        // Pour l'instant, on va utiliser la méthode par défaut
        
        // Tentative de trouver l'invité dans Firestore
        let guestName = "Cher invité";
        
        // On va chercher dans tous les users (limité à 100 pour éviter les requêtes trop longues)
        const usersSnapshot = await admin.firestore().collection("users").limit(100).get();
        
        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const invitesRef = admin.firestore().collection("users").doc(userId).collection("invites");
            const inviteDoc = await invitesRef.doc(inviteId).get();
            
            if (inviteDoc.exists) {
                logger.info("Invité trouvé pour userId:", userId);
                
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
                
                const inviteData = inviteDoc.data();
                guestName = inviteData.nom || "Cher invité";
                break;
            }
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
            window.location.href = '/invitation/${inviteId}';
        }, 100);
    </script>
</head>
<body style="font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);">
    <div style="text-align: center;">
        <h1 style="color: #78350f; font-size: 2rem; margin-bottom: 1rem;">Redirection en cours...</h1>
        <p style="color: #92400e;">Si rien ne se passe automatiquement, <a href="/invitation/${inviteId}" style="color: #92400e; text-decoration: underline;">cliquez ici</a></p>
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
