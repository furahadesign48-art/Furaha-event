import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

setPersistence(auth, browserLocalPersistence).catch(e => console.warn('Persistence init error:', e));

// FCM Setup
let messagingInstance: ReturnType<typeof getMessaging> | null = null;
let initPromise: Promise<ReturnType<typeof getMessaging> | null> | null = null;

const initFcm = async () => {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.log('FCM not supported');
      return null;
    }

    // Register SW first
    if ('serviceWorker' in navigator) {
      try {
        const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('✅ SW registered');
        messagingInstance = getMessaging(app, { serviceWorkerRegistration: swReg });
      } catch (e) {
        console.warn('SW reg error (trying without sw):', e);
        messagingInstance = getMessaging(app);
      }
    } else {
      messagingInstance = getMessaging(app);
    }

    // Gérer les NOTIFICATIONS EN PREMIER PLAN (l'app est ouverte)
    if (messagingInstance) {
        onMessage(messagingInstance, (payload) => {
            console.log('%c📩 [FCM] Message en PREMIER PLAN reçu !', 'font-size:13px;font-weight:bold;color:blue;');
            console.log('%c📦 Payload complet:', 'font-size:11px;color:gray;', JSON.stringify(payload, null, 2));

            // Afficher une notification même si l'app est ouverte !
            if (Notification.permission === 'granted') {
                const notificationTitle = payload.notification?.title || payload.data?.title || 'Rappel événement';
                const notificationBody = payload.notification?.body || payload.data?.body || 'Ne manquez pas votre événement !';
                
                console.log('Notification Title:', notificationTitle);
                console.log('Notification Body:', notificationBody);
                
                const notificationOptions = {
                    body: notificationBody,
                    icon: 'https://furaha-event-831ca.web.app/favicon.ico',
                    data: {
                        url: payload.data?.url || '/',
                        inviteId: payload.data?.inviteId,
                        guestName: payload.data?.guestName
                    }
                };

                console.log('%c📢 Affichage de la notification en premier plan !', 'font-size:12px;color:purple;');
                const notification = new Notification(notificationTitle, notificationOptions);
                
                // Gérer le clic sur la notification en premier plan
                notification.onclick = (event) => {
                    console.log('%c👆 Clic sur notification en premier plan !', 'font-size:12px;font-weight:bold;color:cyan;');
                    notification.close();
                    
                    // Rediriger vers l'invitation dynamique !
                    const targetUrl = event.target?.data?.url || '/';
                    if (targetUrl && targetUrl !== '/') {
                        window.location.href = targetUrl;
                    } else {
                        window.focus();
                    }
                };
            }
        });
        console.log('✅ Listener de notification en premier plan DYNAMIQUE configuré');
    }

    console.log('✅ FCM initialized');
    return messagingInstance;
  } catch (e) {
    console.error('FCM init error:', e);
    return null;
  }
};

initPromise = initFcm();

export const getMessagingInstance = () => messagingInstance;
export const getMessagingInstanceAsync = async () => {
  if (messagingInstance) return messagingInstance;
  if (initPromise) return initPromise;
  return null;
};

console.log('✅ Firebase initialized for project:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
export default app;
