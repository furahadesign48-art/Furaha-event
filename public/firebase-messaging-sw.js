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

console.log('%c🔔 [firebase-messaging-sw.js] Messaging instance:', messaging);

// Écouter les messages en arrière-plan (très important !)
messaging.onBackgroundMessage((payload) => {
    console.log('%c📩 [firebase-messaging-sw.js] Message en arrière-plan reçu !', 'font-size:13px;font-weight:bold;color:blue;');
    console.log('%c📦 Payload complet:', 'font-size:11px;color:gray;', JSON.stringify(payload, null, 2));

    // Créer la notification (forcément afficher !)
    const notificationTitle = payload.notification?.title || payload.data?.title || 'Rappel événement';
    const notificationBody = payload.notification?.body || payload.data?.body || 'Ne manquez pas votre événement !';
    
    console.log('Title:', notificationTitle);
    console.log('Body:', notificationBody);
    
    const notificationOptions = {
        body: notificationBody,
        icon: 'https://furaha-event-831ca.web.app/favicon.ico',
        badge: 'https://furaha-event-831ca.web.app/favicon.ico',
        data: {
            url: payload.data?.url || '/',
            inviteId: payload.data?.inviteId,
            guestName: payload.data?.guestName
        }
    };

    console.log('%c📢 Affichage de la notification avec options:', 'font-size:12px;color:purple;', JSON.stringify(notificationOptions, null, 2));
    
    // Afficher la notification !
    self.registration.showNotification(notificationTitle, notificationOptions)
        .then(() => {
            console.log('%c✅ Notification affichée !', 'font-size:12px;color:green;');
        })
        .catch(err => {
            console.error('%c❌ Erreur d\'affichage de la notification:', 'font-size:12px;color:red;', err);
        });
});

// Écouter les messages en premier plan aussi (pour le SW)
messaging.onMessage((payload) => {
    console.log('%c📩 [firebase-messaging-sw.js] Message reçu dans SW (onMessage)!', 'font-size:13px;font-weight:bold;color:blue;');
    console.log('%c📦 Payload complet:', 'font-size:11px;color:gray;', JSON.stringify(payload, null, 2));
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
                console.log('Clients trouvés:', clientList.length);
                // Si l'app est déjà ouverte, focus dessus et navigue vers l'URL
                for (const client of clientList) {
                    console.log('Client URL:', client.url);
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

// Écouter l'installation du SW
self.addEventListener('install', (event) => {
    console.log('%c🔧 [firebase-messaging-sw.js] SW installé !', 'font-size:12px;color:orange;');
    self.skipWaiting();
});

// Écouter l'activation du SW
self.addEventListener('activate', (event) => {
    console.log('%c🚀 [firebase-messaging-sw.js] SW activé !', 'font-size:12px;color:green;');
    event.waitUntil(self.clients.claim());
});

console.log('%c✅ [firebase-messaging-sw.js] Service Worker DYNAMIQUE prêt !', 'font-size:14px;font-weight:bold;color:green;');
