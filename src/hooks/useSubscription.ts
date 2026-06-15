import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './useAuth';

export interface SubscriptionData {
  id: string;
  userId: string;
  plan: 'free' | 'standard' | 'premium';
  status: 'active' | 'inactive' | 'cancelled';
  inviteLimit: number;
  currentInvites: number;
  startDate: string;
  endDate?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    const subscriptionRef = doc(db, 'subscriptions', user.id);
    
    const unsubscribe = onSnapshot(subscriptionRef, async (doc) => {
      try {
        if (doc.exists()) {
          const data = doc.data() as Omit<SubscriptionData, 'id'>;
          setSubscription({
            id: doc.id,
            ...data
          });
        } else {
          // Créer un abonnement gratuit par défaut
          const defaultSubscription: Omit<SubscriptionData, 'id'> = {
            userId: user.id,
            plan: 'free',
            status: 'active',
            inviteLimit: 999999,
            currentInvites: 0,
            startDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await setDoc(subscriptionRef, defaultSubscription);
          setSubscription({
            id: user.id,
            ...defaultSubscription
          });
        }
      } catch (err) {
        console.error('Erreur lors du chargement de l\'abonnement:', err);
        setError('Erreur lors du chargement de l\'abonnement');
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user?.id]);

  const updateInviteCount = async (newCount: number) => {
    if (!user?.id || !subscription) return false;

    try {
      const subscriptionRef = doc(db, 'subscriptions', user.id);
      await setDoc(subscriptionRef, {
        ...subscription,
        currentInvites: newCount,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du compteur:', error);
      return false;
    }
  };

  const canCreateInvite = () => {
    if (!subscription) return false;
    return true; // Tous les plans = illimité
  };

  const getRemainingInvites = () => {
    if (!subscription) return 0;
    return 999999; // Plans payants = illimité
  };

  const upgradeToPremium = async (plan: 'standard' | 'premium') => {
    if (!user?.id) return false;

    try {
      const subscriptionRef = doc(db, 'subscriptions', user.id);
      const newLimit = plan === 'standard' ? 999999 : 999999; // Illimité pour les plans payants
      
      await setDoc(subscriptionRef, {
        ...subscription,
        plan,
        inviteLimit: newLimit,
        status: 'active',
        updatedAt: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à niveau:', error);
      return false;
    }
  };

  return {
    subscription,
    isLoading,
    error,
    updateInviteCount,
    canCreateInvite,
    getRemainingInvites,
    upgradeToPremium,
    clearError: () => setError(null)
  };
};