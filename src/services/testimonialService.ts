import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  limit,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';

export interface Testimonial {
  id?: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  rating: number;
  comment: string;
  eventType: string;
  avatarUrl?: string;
  approved: boolean;
  createdAt: any;
  updatedAt?: any;
}

export type EventCategory =
  | 'mariage'
  | 'anniversaire'
  | 'graduation'
  | 'bapteme'
  | 'corporate'
  | 'autre';

export const EVENT_CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: 'mariage', label: 'Mariage' },
  { value: 'anniversaire', label: 'Anniversaire' },
  { value: 'graduation', label: 'Graduation' },
  { value: 'bapteme', label: 'Baptême' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'autre', label: 'Autre' },
];

const TESTIMONIALS_COLLECTION = 'testimonials';

export const testimonialService = {
  createTestimonial: async (
    data: Omit<Testimonial, 'id' | 'approved' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      const docRef = await addDoc(collection(db, TESTIMONIALS_COLLECTION), {
        ...data,
        approved: false,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de la création de l\'avis:', error);
      return null;
    }
  },

  getApprovedTestimonials: async (maxCount: number = 12) => {
    try {
      const q = query(
        collection(db, TESTIMONIALS_COLLECTION),
        where('approved', '==', true),
        limit(maxCount)
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Testimonial[];
      results.sort((a, b) => {
        const ta = a.createdAt?.toDate?.()?.getTime() ?? new Date(a.createdAt ?? 0).getTime();
        const tb = b.createdAt?.toDate?.()?.getTime() ?? new Date(b.createdAt ?? 0).getTime();
        return tb - ta;
      });
      return results;
    } catch (error) {
      console.error('Erreur lors de la récupération des avis:', error);
      return [];
    }
  },

  getPendingTestimonials: async () => {
    try {
      const q = query(
        collection(db, TESTIMONIALS_COLLECTION),
        where('approved', '==', false)
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Testimonial[];
      results.sort((a, b) => {
        const ta = a.createdAt?.toDate?.()?.getTime() ?? new Date(a.createdAt ?? 0).getTime();
        const tb = b.createdAt?.toDate?.()?.getTime() ?? new Date(b.createdAt ?? 0).getTime();
        return tb - ta;
      });
      return results;
    } catch (error) {
      console.error('Erreur lors de la récupération des avis en attente:', error);
      return [];
    }
  },

  approveTestimonial: async (testimonialId: string) => {
    try {
      const docRef = doc(db, TESTIMONIALS_COLLECTION, testimonialId);
      await updateDoc(docRef, {
        approved: true,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la validation de l\'avis:', error);
      return false;
    }
  },

  deleteTestimonial: async (testimonialId: string) => {
    try {
      const docRef = doc(db, TESTIMONIALS_COLLECTION, testimonialId);
      await updateDoc(docRef, {
        approved: false,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error('Erreur lors du masquage de l\'avis:', error);
      return false;
    }
  },
};
