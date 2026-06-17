import { useState, useEffect } from 'react';
import { getMessagingInstanceAsync, db } from '../config/firebase';
import { getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export const useNotifications = () => {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFCMSupported, setIsFCMSupported] = useState<boolean | null>(null);

  useEffect(() => {
    // Vérifier la compatibilité FCM au chargement
    const checkSupport = async () => {
      try {
        const supported = await isSupported();
        console.log('📱 FCM supported:', supported);
        setIsFCMSupported(supported);
        
        if ('Notification' in window) {
          setPermission(Notification.permission);
        }
      } catch (e) {
        console.error('❌ Error checking FCM support:', e);
        setIsFCMSupported(false);
      }
    };
    
    checkSupport();
  }, []);

  const requestPermission = async (options?: { 
    userId?: string, 
    inviteId?: string, 
    inviteDocPath?: string 
  }) => {
    console.log('🚀 === requestPermission START ===');
    console.log('📱 isFCMSupported:', isFCMSupported);
    console.log('📱 Service Worker available:', 'serviceWorker' in navigator);
    console.log('📱 Notification API available:', 'Notification' in window);
    setIsLoading(true);
    setError(null);

    try {
      if (isFCMSupported === false) {
        throw new Error('Notifications push non prises en charge sur ce navigateur');
      }

      if (!('Notification' in window)) {
        throw new Error('Notifications non prises en charge sur ce navigateur');
      }

      const messaging = await getMessagingInstanceAsync();
      if (!messaging) {
        throw new Error('Erreur initialisation FCM');
      }

      console.log('🔔 Requesting notification permission...');
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      console.log('✅ Permission result:', permissionResult);

      if (permissionResult !== 'granted') {
        throw new Error('Permission refusée');
      }

      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      console.log('🔑 Using VAPID Key:', vapidKey ? `${vapidKey.slice(0, 20)}...` : 'MISSING!');

      const fcmToken = await getToken(messaging, { vapidKey });
      console.log('🎉 TOKEN RECEIVED:', fcmToken);
      setToken(fcmToken);

      if (options?.inviteDocPath && options?.inviteId) {
        const inviteDocRef = doc(db, options.inviteDocPath);
        const inviteDoc = await getDoc(inviteDocRef);
        if (inviteDoc.exists()) {
          await updateDoc(inviteDocRef, { fcmToken });
          console.log('✅ Token saved to Firestore at:', options.inviteDocPath);
        } else {
          console.error('❌ Invite doc not found:', options.inviteDocPath);
        }
      }

      return fcmToken;
    } catch (err: any) {
      console.error('❌ ERROR in requestPermission:', err);
      let errorMsg = err.message || 'Erreur inconnue';
      
      // Messages d'erreur plus clairs pour iOS/Safari
      if (err.message.includes('not supported')) {
        errorMsg = 'Les notifications push ne sont pas prises en charge sur ce navigateur. Utilisez Chrome ou un autre navigateur.';
      }
      
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { token, permission, requestPermission, isLoading, error, isFCMSupported };
};
