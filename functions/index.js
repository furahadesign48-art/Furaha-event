const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

admin.initializeApp();

// Cloud function for push notifications disabled
/*
exports.sendPushNotification = onDocumentCreated({
    document: "notifications/{notificationId}",
    region: "us-central1"
}, async (event) => {
    // ... logic removed ...
});
*/

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
 */
exports.shareInvitation = onRequest({
    region: "us-central1"
}, async (req, res) => {
    logger.info("Requête reçue pour shareInvitation:", req.path, req.url);
    
    // Extraire l'inviteId du chemin
    const pathParts = req.path.split('/').filter(part => part !== '');
    const inviteId = pathParts[pathParts.length - 1];

    if (!inviteId || inviteId === 'invitation' || inviteId === 'invite' || inviteId === 'v') {
        logger.warn("ID d'invitation non trouvé dans le chemin:", req.path);
        // On redirige vers l'accueil si pas d'ID
        return res.redirect('/');
    }

    try {
        logger.info(`Tentative de récupération de l'invitation ID: ${inviteId}`);
        
        // Requête collectionGroup pour trouver l'invitation
        // ATTENTION: Cela nécessite absolument un index "Collection Group" sur le champ "id" de la collection "invites"
        const inviteSnapshot = await admin.firestore()
            .collectionGroup("invites")
            .where("id", "==", inviteId)
            .get();

        if (inviteSnapshot.empty) {
            logger.error(`ERREUR: Invitation non trouvée dans TOUTE la base de données pour l'ID: ${inviteId}`);
            return res.redirect(`/invitation/${inviteId}`);
        }

        const inviteDoc = inviteSnapshot.docs[0];
        const inviteData = inviteDoc.data();
        const fullPath = inviteDoc.ref.path;
        
        logger.info(`Document invitation trouvé au chemin: ${fullPath}`);
        
        // Récupérer le userId depuis le chemin: users/{userId}/invites/{inviteId}
        const pathSegments = fullPath.split('/');
        const userId = pathSegments[1]; 
        
        if (!userId) {
            logger.error(`ERREUR: Impossible d'extraire le userId du chemin: ${fullPath}`);
            return res.redirect(`/v/${inviteId}`);
        }

        logger.info(`Recherche du UserModel pour userId: ${userId}`);

        // RÉCUPÉRATION DES MODÈLES (Correction: modelsSnapshot était manquant)
        const modelsSnapshot = await admin.firestore()
            .collection("users")
            .doc(userId)
            .collection("UserModel")
            .get();

        // Recherche du meilleur modèle pour cette invitation
        let modelData = null;
        if (!modelsSnapshot.empty) {
            // Si l'invitation a une catégorie (wedding, birthday, etc.), on cherche le modèle correspondant
            if (inviteData.category) {
                const matchingModel = modelsSnapshot.docs.find(doc => doc.data().category === inviteData.category);
                if (matchingModel) {
                    modelData = matchingModel.data();
                    logger.info(`Modèle correspondant trouvé pour la catégorie ${inviteData.category}: ${matchingModel.id}`);
                }
            }
            
            // Si toujours pas de modèle, on prend le plus récent
            if (!modelData) {
                modelData = modelsSnapshot.docs[0].data();
                logger.info(`Utilisation du modèle par défaut (premier trouvé): ${modelsSnapshot.docs[0].id}`);
            }
        } else {
            logger.warn(`ATTENTION: Aucun document dans users/${userId}/UserModel. Utilisation des valeurs par défaut.`);
        }

        // Métadonnées
        const title = modelData?.title || inviteData.nom || 'Invitation Officielle';
        
        // RECHERCHE DE L'IMAGE - PRIORITÉ AU DASHBOARD (backgroundImage)
        let imageUrl = 'https://firebasestorage.googleapis.com/v0/b/furaha-event-831ca.firebasestorage.app/o/FURAHA-GOLD2.png?alt=media';
        
        if (modelData) {
            // L'utilisateur a précisé que c'est "l'image de fond principale" dans le dashboard
            imageUrl = modelData.backgroundImage || 
                       modelData.invitationPhoto || 
                       modelData.eventPhoto1 || 
                       (modelData.eventPhotos && modelData.eventPhotos.length > 0 ? modelData.eventPhotos[0] : null) ||
                       imageUrl;
        }
        
        const guestName = inviteData.nom || "vous";
        const description = ""; // Suppression de la description pour épurer l'affichage WhatsApp
        
        // Déterminer l'URL du site dynamiquement (pour gérer les sous-hébergements Firebase)
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const siteUrl = `${protocol}://${host}/v/${inviteId}`;

        // Optimisation de l'image avec cache-buster
        const optimizedImageUrl = `${optimizeImageUrl(imageUrl)}${imageUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;

        logger.info(`Génération du HTML pour ${host} avec titre: ${title}, image: ${optimizedImageUrl}`);

        const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    
    <!-- PRIORITÉ ABSOLUE POUR WHATSAPP -->
    <meta property="og:image" content="${optimizedImageUrl}">
    <meta property="og:image:secure_url" content="${optimizedImageUrl}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="600">
    <meta property="og:image:height" content="600">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${siteUrl}?v=${Date.now()}">

    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Autres balises -->
    <meta property="og:site_name" content="Furaha Event">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${optimizedImageUrl}">

    <title>${title}</title>

    <script>
        // Redirection vers l'application réelle (chemin /invitation/ pour éviter la boucle infinie avec /v/)
        window.location.href = '/invitation/${inviteId}';
    </script>
    <style>
        body { font-family: sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f8fafc; color: #334155; }
        .loader { border: 3px solid #f3f3f3; border-top: 3px solid #f59e0b; border-radius: 50%; width: 32px; height: 32px; animation: spin 1s linear infinite; margin-bottom: 16px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="loader"></div>
    <p>Chargement de votre invitation...</p>
</body>
</html>`;

        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.status(200).send(html);

    } catch (error) {
        logger.error("ERREUR CRITIQUE dans shareInvitation:", error);
        // En cas d'erreur, on redirige vers le chemin standard pour charger l'app React
        return res.redirect(`/invitation/${inviteId}`);
    }
});
