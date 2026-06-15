import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  getDocs
} from 'firebase/firestore';

export interface AppNotification {
  id?: string;
  type: 'confirmation' | 'message' | 'drink' | 'reminder' | 'update';
  recipientId: string; // ID de l'admin ou de l'invité
  senderName: string;
  title: string;
  body: string;
  createdAt: any;
  read: boolean;
  relatedId?: string; // ID de l'invité ou du message lié
}

const NOTIFICATIONS_COLLECTION = 'notifications';

export const notificationService = {
  // Créer une nouvelle notification
  sendNotification: async (notification: Omit<AppNotification, 'createdAt' | 'read'>) => {
    try {
      const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
        ...notification,
        createdAt: serverTimestamp(),
        read: false
      });
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
      return null;
    }
  },

  // Récupérer les notifications pour un utilisateur spécifique
  subscribeToNotifications: (userId: string, callback: (notifications: AppNotification[]) => void) => {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppNotification[];
      callback(notifications);
    });
  },

  // Marquer une notification comme lue
  markAsRead: async (notificationId: string) => {
    try {
      const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
      await updateDoc(docRef, { read: true });
      return true;
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      return false;
    }
  },

  // Marquer toutes les notifications comme lues pour un utilisateur
  markAllAsRead: async (userId: string) => {
    try {
      const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('recipientId', '==', userId),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);
      const batch = snapshot.docs.map(d => updateDoc(doc(db, NOTIFICATIONS_COLLECTION, d.id), { read: true }));
      await Promise.all(batch);
      return true;
    } catch (error) {
      console.error('Erreur lors du marquage groupé:', error);
      return false;
    }
  }
};
