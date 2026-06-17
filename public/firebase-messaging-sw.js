// Service Worker pour FCM - Configuration complète et DYNAMIQUE
console.log('%c🔔 [firebase-messaging-sw.js] Chargement du Service Worker...', 'font-size:14px;font-weight:bold;color:orange;');

// Import des SDKs Firebase compatibles avec Service Workers
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Configuration Firebase (même que frontend)
const firebaseConfig = {
    apiKey: "AIzaSyBtWKFZ78KtLA_WKEkNBpJWS1LQVUMWQXc",
    authDomain: "furaha-event-831ca.firebaseapp.com",
    projectId: "furaha-event-831ca",
    storageBucket: "furaha-event-831ca.firebasestorage.app",
    messagingSenderId: "369854399050",
    appId: "1:369854399050:web:9dd985ac0fd2a26a8e9cb3"
};

// Initialiser Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('%c✅ [firebase-messaging-sw.js] Firebase initialisé avec succès !', 'font-size:12px;color:green;');
} catch (error) {
    console.error('%c❌ [firebase-messaging-sw.js] Erreur d\'initialisation Firebase:', 'font-size:12px;color:red;', error);
}

const messaging = firebase.messaging();

// Écouter les messages en arrière-plan (très important !)
messaging.onBackgroundMessage((payload) => {
    console.log('%c📩 [firebase-messaging-sw.js] Message en arrière-plan reçu !', 'font-size:13px;font-weight:bold;color:blue;');
    console.log('%c📦 Payload complet:', 'font-size:11px;color:gray;', payload);

    // Créer la notification (forcément afficher !)
    const notificationTitle = payload.notification?.title || 'Rappel événement';
    const notificationOptions = {
        body: payload.notification?.body || 'Ne manquez pas votre événement !',
        icon: payload.notification?.icon || 'https://furaha-event-831ca.web.app/favicon.ico',
        badge: 'https://furaha-event-831ca.web.app/favicon.ico',
        image: payload.notification?.image, // Photo du couple !
        data: {
            url: payload.data?.url || '/',
            inviteId: payload.data?.inviteId,
            guestName: payload.data?.guestName
        },
        vibrate: [200, 100, 200], // Faire vibrer le téléphone
        tag: 'furaha-event-notification', // Éviter les doublons
        renotify: true,
        requireInteraction: true, // Forcer la notification à rester affichée
        actions: [
            {
                action: 'open',
                title: 'Ouvrir l\'invitation',
                icon: 'https://furaha-event-831ca.web.app/favicon.ico'
            }
        ]
    };

    console.log('%c📢 Affichage de la notification avec options:', 'font-size:12px;color:purple;', notificationOptions);
    
    // Afficher la notification !
    self.registration.showNotification(notificationTitle, notificationOptions)
        .then(() => {
            console.log('%c✅ Notification affichée !', 'font-size:12px;color:green;');
        })
        .catch(err => {
            console.error('%c❌ Erreur d\'affichage de la notification:', 'font-size:12px;color:red;', err);
        });
});

// Gérer le clic sur la notification ET sur le bouton « Ouvrir l'invitation »
self.addEventListener('notificationclick', (event) => {
    console.log('%c👆 [firebase-messaging-sw.js] Clic sur la notification (action:', event.action, ')', 'font-size:12px;font-weight:bold;color:cyan;');
    console.log('%c📦 Données de la notification:', 'font-size:11px;color:gray;', event.notification.data);
    
    event.notification.close();
    
    const targetUrl = event.notification.data?.url || '/';
    console.log('%c🔗 Redirection vers:', targetUrl, 'font-size:12px;color:blue;');
    
    // Ouvrir l'application (ou focus si déjà ouverte)
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                // Si l'app est déjà ouverte, focus dessus et navigue vers l'URL
                for (const client of clientList) {
                    if (client.url && client.url.includes('furaha-event')) {
                        console.log('%c✅ App déjà ouverte, focus dessus !', 'font-size:12px;color:green;');
                        client.navigate(targetUrl);
                        return client.focus();
                    }
                }
                // Sinon ouvrir une nouvelle fenêtre avec l'URL dynamique
                if (clients.openWindow) {
                    console.log('%c🆕 Ouvrir nouvelle fenêtre avec URL:', targetUrl, 'font-size:12px;color:blue;');
                    return clients.openWindow(targetUrl);
                }
            })
    );
});

console.log('%c✅ [firebase-messaging-sw.js] Service Worker DYNAMIQUE prêt !', 'font-size:14px;font-weight:bold;color:green;');
