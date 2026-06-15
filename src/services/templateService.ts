import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface TemplateData {
  id: string;
  name: string;
  category: 'wedding' | 'birthday' | 'graduation';
  backgroundImage: string;
  patternBackgroundImage?: string;
  guestInfoLeftImage?: string;
  guestInfoRightImage?: string;
  invitationPhoto?: string;
  eventPhotos?: string[];
  eventPhoto1?: string;
  eventPhoto2?: string;
  eventPhoto3?: string;
  title: string;
  invitationText: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventAddress?: string;
  eventLat?: number;
  eventLng?: number;
  backgroundMusic?: string;
  drinkOptions: string[];
  features: string[];
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  isDefault?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface UserModel extends TemplateData {
  userId: string;
  originalTemplateId: string;
  customizations?: {
    colors?: {
      primary: string;
      secondary: string;
      accent: string;
    };
    fonts?: {
      title: string;
      body: string;
    };
    layout?: string;
  };
}

export interface Invite {
  id: string;
  nom: string;
  table: string;
  etat: 'simple' | 'couple';
  confirmed: boolean;
  category?: string;
  statut?: 'pending' | 'confirmed' | 'declined';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GuestCategory {
  id: string;
  name: string;
  createdAt: Timestamp;
}

export interface Table {
  id: number;
  docId?: string;
  name: string;
  seats: number;
  assignedGuests: any[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
// Service pour les templates par défaut
export class TemplateService {
  private static readonly TEMPLATES_COLLECTION = 'templates';

  // Sauvegarder un template par défaut
  static async saveDefaultTemplate(template: TemplateData): Promise<void> {
    try {
      const templateRef = doc(db, this.TEMPLATES_COLLECTION, template.id);
      const templateData = {
        ...template,
        isDefault: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(templateRef, templateData);
      console.log('Template par défaut sauvegardé:', template.id);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du template:', error);
      throw new Error('Impossible de sauvegarder le template');
    }
  }

  // Récupérer tous les templates par défaut
  static async getDefaultTemplates(): Promise<TemplateData[]> {
    try {
      const templatesRef = collection(db, this.TEMPLATES_COLLECTION);
      const q = query(
        templatesRef, 
        where('isDefault', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const templates: TemplateData[] = [];
      
      querySnapshot.forEach((doc) => {
        templates.push({
          id: doc.id,
          ...doc.data()
        } as TemplateData);
      });
      
      return templates.sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des templates:', error);
      throw new Error('Impossible de récupérer les templates');
    }
  }

  // Récupérer un template par défaut par ID
  static async getDefaultTemplate(templateId: string): Promise<TemplateData | null> {
    try {
      const templateRef = doc(db, this.TEMPLATES_COLLECTION, templateId);
      const templateDoc = await getDoc(templateRef);
      
      if (templateDoc.exists()) {
        return {
          id: templateDoc.id,
          ...templateDoc.data()
        } as TemplateData;
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération du template:', error);
      throw new Error('Impossible de récupérer le template');
    }
  }

  // Récupérer templates par catégorie
  static async getTemplatesByCategory(category: 'wedding' | 'birthday' | 'graduation'): Promise<TemplateData[]> {
    try {
      const templatesRef = collection(db, this.TEMPLATES_COLLECTION);
      const q = query(
        templatesRef,
        where('category', '==', category),
        where('isDefault', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const templates: TemplateData[] = [];
      
      querySnapshot.forEach((doc) => {
        templates.push({
          id: doc.id,
          ...doc.data()
        } as TemplateData);
      });
      
      return templates;
    } catch (error) {
      console.error('Erreur lors de la récupération des templates par catégorie:', error);
      throw new Error('Impossible de récupérer les templates');
    }
  }
}

// Service pour les modèles utilisateur (nouvelle structure)
export class UserModelService {
  private static readonly USERS_COLLECTION = 'users';

  // Créer un modèle utilisateur
  static async createUserModel(
    userId: string, 
    originalTemplate: TemplateData,
    customizations?: Partial<UserModel>
  ): Promise<string> {
    try {
      const modelId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const userModel: UserModel = {
        ...originalTemplate,
        id: modelId,
        userId,
        originalTemplateId: originalTemplate.id,
        customizations: {
          colors: originalTemplate.colors || {
            primary: '#f59e0b',
            secondary: '#d97706',
            accent: '#f43f5e'
          },
          fonts: {
            title: 'Playfair Display',
            body: 'Inter'
          },
          layout: 'default'
        },
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        ...customizations
      };

      // Sauvegarder dans users/{userId}/UserModel/{modelId}
      const modelRef = doc(db, this.USERS_COLLECTION, userId, 'UserModel', modelId);
      await setDoc(modelRef, userModel);
      
      console.log('Modèle utilisateur créé:', modelId);
      return modelId;
    } catch (error) {
      console.error('Erreur lors de la création du modèle utilisateur:', error);
      throw new Error('Impossible de créer le modèle personnalisé');
    }
  }

  // Récupérer tous les modèles d'un utilisateur
  static async getUserModels(userId: string): Promise<UserModel[]> {
    try {
      console.log('Chargement des modèles pour l\'utilisateur:', userId);
      const modelsRef = collection(db, this.USERS_COLLECTION, userId, 'UserModel');
      const querySnapshot = await getDocs(modelsRef);
      
      const models: UserModel[] = [];
      querySnapshot.forEach((doc) => {
        console.log('Modèle trouvé:', doc.id, doc.data());
        models.push({
          id: doc.id,
          ...doc.data()
        } as UserModel);
      });
      
      console.log('Total modèles chargés:', models.length);
      return models.sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des modèles utilisateur:', error);
      throw new Error('Impossible de récupérer vos modèles');
    }
  }

  // Récupérer un modèle utilisateur spécifique
  static async getUserModel(userId: string, modelId: string): Promise<UserModel | null> {
    try {
      const modelRef = doc(db, this.USERS_COLLECTION, userId, 'UserModel', modelId);
      const modelDoc = await getDoc(modelRef);
      
      if (modelDoc.exists()) {
        return {
          id: modelDoc.id,
          ...modelDoc.data()
        } as UserModel;
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération du modèle utilisateur:', error);
      throw new Error('Impossible de récupérer le modèle');
    }
  }

  // Mettre à jour un modèle utilisateur
  static async updateUserModel(
    userId: string,
    modelId: string,
    updates: Partial<UserModel>
  ): Promise<void> {
    try {
      const modelRef = doc(db, this.USERS_COLLECTION, userId, 'UserModel', modelId);
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(modelRef, updateData);
      console.log('Modèle utilisateur mis à jour:', modelId);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du modèle:', error);
      throw new Error('Impossible de mettre à jour le modèle');
    }
  }

  // Supprimer un modèle utilisateur
  static async deleteUserModel(userId: string, modelId: string): Promise<void> {
    try {
      const modelRef = doc(db, this.USERS_COLLECTION, userId, 'UserModel', modelId);
      await deleteDoc(modelRef);
      console.log('Modèle utilisateur supprimé:', modelId);
    } catch (error) {
      console.error('Erreur lors de la suppression du modèle:', error);
      throw new Error('Impossible de supprimer le modèle');
    }
  }
}

// Service pour les invités
export class InviteService {
  private static readonly USERS_COLLECTION = 'users';

  // Créer plusieurs invités (bulk)
  static async bulkCreateInvites(userId: string, invitesData: Omit<Invite, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    try {
      const promises = invitesData.map(data => this.createInvite(userId, data));
      await Promise.all(promises);
    } catch (error) {
      console.error('Erreur lors de la création massive d\'invités:', error);
      throw new Error('Impossible de créer les invités en masse');
    }
  }

  // Créer un invité
  static async createInvite(userId: string, inviteData: Omit<Invite, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const inviteId = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('Création de l\'invitation avec ID:', inviteId, 'pour l\'utilisateur:', userId);
      
      const invite: Invite = {
        id: inviteId,
        ...inviteData,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      // Sauvegarder dans users/{userId}/invites/{inviteId}
      const inviteRef = doc(db, this.USERS_COLLECTION, userId, 'invites', inviteId);
      await setDoc(inviteRef, invite);
      
      console.log('Invitation créée avec succès:', inviteId);
      return inviteId;
    } catch (error) {
      console.error('Erreur lors de la création de l\'invité:', error);
      throw new Error('Impossible de créer l\'invité');
    }
  }

  // Récupérer tous les invités d'un utilisateur
  static async getUserInvites(userId: string): Promise<Invite[]> {
    try {
      console.log('Chargement des invités pour l\'utilisateur:', userId);
      const invitesRef = collection(db, this.USERS_COLLECTION, userId, 'invites');
      const querySnapshot = await getDocs(invitesRef);
      
      const invites: Invite[] = [];
      querySnapshot.forEach((doc) => {
        console.log('Invité trouvé:', doc.id, doc.data());
        invites.push({
          id: doc.id,
          ...doc.data()
        } as Invite);
      });
      
      console.log('Total invités chargés:', invites.length);
      return invites.sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des invités:', error);
      throw new Error('Impossible de récupérer les invités');
    }
  }

  // Récupérer un invité spécifique
  static async getInvite(userId: string, inviteId: string): Promise<(Invite & { userId: string }) | null> {
    try {
      const inviteRef = doc(db, this.USERS_COLLECTION, userId, 'invites', inviteId);
      const inviteDoc = await getDoc(inviteRef);
      
      if (inviteDoc.exists()) {
        return {
          id: inviteDoc.id,
          userId: userId,
          ...inviteDoc.data()
        } as (Invite & { userId: string });
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'invité:', error);
      throw new Error('Impossible de récupérer l\'invité');
    }
  }

  // Nouvelle méthode pour récupérer un invité par ID global (recherche dans tous les utilisateurs)
  static async getInviteGlobal(inviteId: string): Promise<(Invite & { userId: string }) | null> {
    try {
      console.log('Recherche de l\'invitation:', inviteId);
      
      // Rechercher dans tous les utilisateurs (méthode temporaire pour debug)
      const usersRef = collection(db, this.USERS_COLLECTION);
      const usersSnapshot = await getDocs(usersRef);
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        console.log('Vérification utilisateur:', userId);
        
        try {
          const inviteRef = doc(db, this.USERS_COLLECTION, userId, 'invites', inviteId);
          const inviteDoc = await getDoc(inviteRef);
          
          if (inviteDoc.exists()) {
            console.log('Invitation trouvée pour l\'utilisateur:', userId);
            const inviteData = inviteDoc.data();
            return {
              id: inviteDoc.id,
              userId: userId,
              ...inviteData
            } as (Invite & { userId: string });
          }
        } catch (error) {
          console.log('Erreur lors de la vérification pour l\'utilisateur', userId, ':', error);
          continue;
        }
      }
      
      console.log('Invitation non trouvée dans tous les utilisateurs');
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération globale de l\'invité:', error);
      throw new Error('Impossible de récupérer l\'invité');
    }
  }

  // Mettre à jour un invité
  static async updateInvite(
    userId: string,
    inviteId: string,
    updates: Partial<Invite>
  ): Promise<void> {
    try {
      const inviteRef = doc(db, this.USERS_COLLECTION, userId, 'invites', inviteId);
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(inviteRef, updateData);
      console.log('Invité mis à jour:', inviteId);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'invité:', error);
      throw new Error('Impossible de mettre à jour l\'invité');
    }
  }

  // Supprimer un invité
  static async deleteInvite(userId: string, inviteId: string): Promise<void> {
    try {
      const inviteRef = doc(db, this.USERS_COLLECTION, userId, 'invites', inviteId);
      await deleteDoc(inviteRef);
      
      console.log('Invité supprimé:', inviteId);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'invité:', error);
      throw new Error('Impossible de supprimer l\'invité');
    }
  }

  // Supprimer plusieurs invités
  static async bulkDeleteInvites(userId: string, inviteIds: string[]): Promise<void> {
    try {
      const batchSize = 500;
      for (let i = 0; i < inviteIds.length; i += batchSize) {
        const batch = writeBatch(db);
        const currentBatch = inviteIds.slice(i, i + batchSize);
        
        currentBatch.forEach(inviteId => {
          const inviteRef = doc(db, this.USERS_COLLECTION, userId, 'invites', inviteId);
          batch.delete(inviteRef);
        });
        
        await batch.commit();
      }
      console.log(`${inviteIds.length} invités supprimés en masse`);
    } catch (error) {
      console.error('Erreur lors de la suppression massive des invités:', error);
      throw new Error('Impossible de supprimer les invités en masse');
    }
  }

  // Mettre à jour les informations d'un invité (confirmation, boissons, vœux)
  static async updateInviteResponse(
    userId: string,
    inviteId: string,
    responseData: {
      confirmed?: boolean;
      statut?: 'pending' | 'confirmed' | 'declined';
      boissons?: string;
      voeux?: string;
      selectedDrink?: string;
      message?: string;
    }
  ): Promise<void> {
    try {
      const inviteRef = doc(db, this.USERS_COLLECTION, userId, 'invites', inviteId);
      
      const updateData = {
        ...responseData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(inviteRef, updateData);
      console.log('Réponse de l\'invité mise à jour:', inviteId);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la réponse:', error);
      throw new Error('Impossible de mettre à jour la réponse');
    }
  }

  static async createGuestMessage(
    userId: string,
    inviteId: string,
    content: string
  ): Promise<string> {
    try {
      const messageId = `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const inviteRef = doc(db, this.USERS_COLLECTION, userId, 'invites', inviteId);
      const inviteSnap = await getDoc(inviteRef);
      const authorName = inviteSnap.exists() ? (inviteSnap.data().nom as string) : 'Invité';
      const messageRef = doc(db, this.USERS_COLLECTION, userId, 'invites', inviteId, 'guestMessages', messageId);
      await setDoc(messageRef, {
        id: messageId,
        inviteId,
        authorName,
        authorInviteId: inviteId,
        content,
        likes: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('Message du livre d\'or créé:', messageId);
      return messageId;
    } catch (error) {
      console.error('Erreur lors de la création du message:', error);
      throw new Error('Impossible de créer le message');
    }
  }

  static async getAllGuestMessages(
    userId: string
  ): Promise<Array<{ id: string; inviteId: string; nom: string; message: string; timestamp: string; likes: string[]; source: 'legacy_field' | 'legacy_collection' | 'new_collection'; replyCount: number; guestType?: 'simple' | 'couple' }>> {
    try {
      const invitesRef = collection(db, this.USERS_COLLECTION, userId, 'invites');
      const invitesSnap = await getDocs(invitesRef);
      const results: Array<{ id: string; inviteId: string; nom: string; message: string; timestamp: string; likes: string[]; source: 'legacy_field' | 'legacy_collection' | 'new_collection'; replyCount: number; guestType?: 'simple' | 'couple' }> = [];
      for (const inv of invitesSnap.docs) {
        const invId = inv.id;
        const invData = inv.data();
        const invName = (invData.nom as string) || 'Invité';
        const invType = (invData.etat as 'simple' | 'couple') || 'simple';
        const legacyMsgsRef = collection(db, this.USERS_COLLECTION, userId, 'invites', invId, 'message');
        const legacyMsgsSnap = await getDocs(legacyMsgsRef);
        const hasLegacyFieldDoc = legacyMsgsSnap.docs.some((d) => d.id === 'legacy_field');
        const legacyFieldMessage = (invData.message as string) || '';
        const legacyFieldUpdated = invData.updatedAt instanceof Timestamp ? invData.updatedAt.toDate().toISOString() : new Date().toISOString();
        if (!hasLegacyFieldDoc && legacyFieldMessage && legacyFieldMessage.trim()) {
          results.push({
            id: `legacy_field_${invId}`,
            inviteId: invId,
            nom: invName,
            message: legacyFieldMessage,
            timestamp: legacyFieldUpdated,
            likes: [],
            source: 'legacy_field',
            replyCount: 0,
            guestType: invType
          });
        }
        const msgsRef = collection(db, this.USERS_COLLECTION, userId, 'invites', invId, 'guestMessages');
        const msgsSnap = await getDocs(msgsRef);
        for (const m of msgsSnap.docs) {
          const d = m.data() as { createdAt?: Timestamp; authorName?: string; content?: string; likes?: string[] };
          const created = d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : new Date().toISOString();
          const repliesRef = collection(db, this.USERS_COLLECTION, userId, 'invites', invId, 'guestMessages', m.id, 'replies');
          const repliesSnap = await getDocs(repliesRef);
          results.push({
            id: m.id,
            inviteId: invId,
            nom: d.authorName ?? invName,
            message: d.content ?? '',
            timestamp: created,
            likes: Array.isArray(d.likes) ? d.likes : [],
            source: 'new_collection',
            replyCount: repliesSnap.size,
            guestType: invType
          });
        }
        for (const m of legacyMsgsSnap.docs) {
          const d = m.data() as { createdAt?: Timestamp; authorName?: string; content?: string; likes?: string[] };
          const created = d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : new Date().toISOString();
          const repliesRef = collection(db, this.USERS_COLLECTION, userId, 'invites', invId, 'message', m.id, 'replies');
          const repliesSnap = await getDocs(repliesRef);
          results.push({
            id: m.id,
            inviteId: invId,
            nom: d.authorName ?? invName,
            message: d.content ?? '',
            timestamp: created,
            likes: Array.isArray(d.likes) ? d.likes : [],
            source: 'legacy_collection',
            replyCount: repliesSnap.size,
            guestType: invType
          });
        }
      }
      results.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      return results.filter((r) => r.message && r.message.trim());
    } catch (error) {
      console.error('Erreur lors du chargement des messages du livre d\'or:', error);
      throw new Error('Impossible de charger les messages');
    }
  }

  static async likeGuestMessage(
    userId: string,
    inviteId: string,
    messageId: string,
    likerInviteId: string
  ): Promise<void> {
    try {
      const messageRef = doc(db, this.USERS_COLLECTION, userId, 'invites', inviteId, 'guestMessages', messageId);
      const messageSnap = await getDoc(messageRef);
      if (!messageSnap.exists()) return;
      const data = messageSnap.data() as { likes?: string[] };
      const likes: string[] = Array.isArray(data.likes) ? data.likes as string[] : [];
      if (likes.includes(likerInviteId)) return;
      await updateDoc(messageRef, {
        likes: [...likes, likerInviteId],
        updatedAt: serverTimestamp()
      });
      console.log('Like enregistré pour le message:', messageId);
    } catch (error) {
      console.error('Erreur lors du like du message:', error);
      throw new Error('Impossible de liker le message');
    }
  }

  static async likeLegacyGuestMessage(
    userId: string,
    inviteId: string,
    messageId: string,
    likerInviteId: string
  ): Promise<void> {
    try {
      const messageRef = doc(db, this.USERS_COLLECTION, userId, 'invites', inviteId, 'message', messageId);
      const messageSnap = await getDoc(messageRef);
      if (!messageSnap.exists()) return;
      const data = messageSnap.data() as { likes?: string[] };
      const likes: string[] = Array.isArray(data.likes) ? data.likes : [];
      if (likes.includes(likerInviteId)) return;
      await updateDoc(messageRef, {
        likes: [...likes, likerInviteId],
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Erreur lors du like (legacy) du message:', error);
      throw new Error('Impossible de liker le message');
    }
  }

  static async deleteLegacyGuestMessage(
    userId: string,
    inviteId: string,
    messageId: string
  ): Promise<void> {
    try {
      const messageRef = doc(db, this.USERS_COLLECTION, userId, 'invites', inviteId, 'message', messageId);
      await deleteDoc(messageRef);
    } catch (error) {
      console.error('Erreur lors de la suppression du message (legacy):', error);
      throw new Error('Impossible de supprimer le message');
    }
  }

  static async replyToGuestMessage(
    userId: string,
    inviteId: string,
    messageId: string,
    replierInviteId: string,
    content: string
  ): Promise<string> {
    try {
      const replyId = `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const replierInviteRef = doc(db, this.USERS_COLLECTION, userId, 'invites', replierInviteId);
      const invSnap = await getDoc(replierInviteRef);
      const authorName = invSnap.exists() ? (invSnap.data().nom as string) : 'Invité';
      const replyRef = doc(db, this.USERS_COLLECTION, userId, 'invites', inviteId, 'guestMessages', messageId, 'replies', replyId);
      await setDoc(replyRef, {
        id: replyId,
        content,
        authorInviteId: replierInviteId,
        authorName,
        createdAt: serverTimestamp()
      });
      console.log('Réponse ajoutée au message:', messageId);
      return replyId;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la réponse:', error);
      throw new Error('Impossible d\'ajouter la réponse');
    }
  }

  static async deleteGuestMessage(
    userId: string,
    inviteId: string,
    messageId: string
  ): Promise<void> {
    try {
      const messageRef = doc(db, this.USERS_COLLECTION, userId, 'invites', inviteId, 'guestMessages', messageId);
      await deleteDoc(messageRef);
    } catch (error) {
      console.error('Erreur lors de la suppression du message:', error);
      throw new Error('Impossible de supprimer le message');
    }
  }

  static async replyToLegacyGuestMessage(
    userId: string,
    inviteId: string,
    messageId: string,
    replierInviteId: string,
    content: string
  ): Promise<string> {
    try {
      const replyId = `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const replierInviteRef = doc(db, this.USERS_COLLECTION, userId, 'invites', replierInviteId);
      const invSnap = await getDoc(replierInviteRef);
      const authorName = invSnap.exists() ? (invSnap.data().nom as string) : 'Invité';
      const replyRef = doc(db, this.USERS_COLLECTION, userId, 'invites', inviteId, 'message', messageId, 'replies', replyId);
      await setDoc(replyRef, {
        id: replyId,
        content,
        authorInviteId: replierInviteId,
        authorName,
        createdAt: serverTimestamp()
      });
      return replyId;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la réponse (legacy):', error);
      throw new Error('Impossible d\'ajouter la réponse');
    }
  }

  static async getMessageReplies(
    userId: string,
    inviteId: string,
    messageId: string
  ): Promise<Array<{ id: string; content: string; authorName: string; createdAt: string }>> {
    try {
      const repliesRef = collection(db, this.USERS_COLLECTION, userId, 'invites', inviteId, 'guestMessages', messageId, 'replies');
      const repliesSnap = await getDocs(repliesRef);
      const results: Array<{ id: string; content: string; authorName: string; createdAt: string }> = [];
      repliesSnap.forEach((r) => {
        const d = r.data() as { createdAt?: Timestamp; content?: string; authorName?: string };
        const created = d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : new Date().toISOString();
        results.push({ id: r.id, content: d.content ?? '', authorName: d.authorName ?? 'Invité', createdAt: created });
      });
      results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return results;
    } catch (error) {
      console.error('Erreur lors du chargement des réponses du message:', error);
      throw new Error('Impossible de charger les réponses');
    }
  }

  static async getLegacyMessageReplies(
    userId: string,
    inviteId: string,
    messageId: string
  ): Promise<Array<{ id: string; content: string; authorName: string; createdAt: string }>> {
    try {
      const repliesRef = collection(db, this.USERS_COLLECTION, userId, 'invites', inviteId, 'message', messageId, 'replies');
      const repliesSnap = await getDocs(repliesRef);
      const results: Array<{ id: string; content: string; authorName: string; createdAt: string }> = [];
      repliesSnap.forEach((r) => {
        const d = r.data() as { createdAt?: Timestamp; content?: string; authorName?: string };
        const created = d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : new Date().toISOString();
        results.push({ id: r.id, content: d.content ?? '', authorName: d.authorName ?? 'Invité', createdAt: created });
      });
      results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return results;
    } catch (error) {
      console.error('Erreur lors du chargement des réponses (legacy) du message:', error);
      throw new Error('Impossible de charger les réponses');
    }
  }

  static async createLegacyGuestMessage(
    userId: string,
    inviteId: string,
    content: string
  ): Promise<string> {
    try {
      const messageId = `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const inviteRef = doc(db, this.USERS_COLLECTION, userId, 'invites', inviteId);
      const inviteSnap = await getDoc(inviteRef);
      const authorName = inviteSnap.exists() ? (inviteSnap.data().nom as string) : 'Invité';
      const messageRef = doc(db, this.USERS_COLLECTION, userId, 'invites', inviteId, 'message', messageId);
      await setDoc(messageRef, {
        id: messageId,
        inviteId,
        authorName,
        authorInviteId: inviteId,
        content,
        likes: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return messageId;
    } catch (error) {
      console.error('Erreur lors de la création du message (legacy):', error);
      throw new Error('Impossible de créer le message');
    }
  }

  static async ensureLegacyFieldMessageDoc(
    userId: string,
    inviteId: string
  ): Promise<string> {
    try {
      const inviteRef = doc(db, this.USERS_COLLECTION, userId, 'invites', inviteId);
      const inviteSnap = await getDoc(inviteRef);
      if (!inviteSnap.exists()) return '';
      const data = inviteSnap.data() as { nom?: string; message?: string; updatedAt?: Timestamp };
      const content = (data.message || '').trim();
      if (!content) return '';
      const authorName = data.nom || 'Invité';
      const legacyDocRef = doc(db, this.USERS_COLLECTION, userId, 'invites', inviteId, 'message', 'legacy_field');
      const legacySnap = await getDoc(legacyDocRef);
      if (legacySnap.exists()) {
        return 'legacy_field';
      }
      const createdAtIso = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : new Date().toISOString();
      await setDoc(legacyDocRef, {
        id: 'legacy_field',
        inviteId,
        authorName,
        content,
        likes: [],
        origin: 'legacy_field',
        createdAt: serverTimestamp(),
        migratedFromFieldAt: createdAtIso
      });
      return 'legacy_field';
    } catch (error) {
      console.error('Erreur ensureLegacyFieldMessageDoc:', error);
      throw new Error('Impossible de préparer le message hérité');
    }
  }

  static async migrateLegacyFieldMessages(userId: string): Promise<number> {
    try {
      const invitesRef = collection(db, this.USERS_COLLECTION, userId, 'invites');
      const invitesSnap = await getDocs(invitesRef);
      let migrated = 0;
      for (const inv of invitesSnap.docs) {
        const invId = inv.id;
        const data = inv.data() as { message?: string };
        const content = (data.message || '').trim();
        if (!content) continue;
        const legacyDocRef = doc(db, this.USERS_COLLECTION, userId, 'invites', invId, 'message', 'legacy_field');
        const existing = await getDoc(legacyDocRef);
        if (existing.exists()) continue;
        await this.ensureLegacyFieldMessageDoc(userId, invId);
        migrated++;
      }
      return migrated;
    } catch (error) {
      console.error('Erreur lors de la migration des messages hérités:', error);
      throw new Error('Migration des messages hérités échouée');
    }
  }

  static subscribeAllGuestMessages(
    userId: string,
    onUpdate: (messages: Array<{ id: string; inviteId: string; nom: string; message: string; timestamp: string; likes: string[]; source: 'legacy_collection' | 'new_collection'; replyCount: number; guestType?: 'simple' | 'couple' }>) => void
  ): () => void {
    const invitesRef = collection(db, this.USERS_COLLECTION, userId, 'invites');
    const subUnsubs: Record<string, Array<() => void>> = {};
    const messagesByInvite: Record<string, Array<{ id: string; inviteId: string; nom: string; message: string; timestamp: string; likes: string[]; source: 'legacy_collection' | 'new_collection'; replyCount: number; guestType?: 'simple' | 'couple' }>> = {};
    const replyCounts: Record<string, number> = {};

    const recompute = () => {
      const all: Array<{ id: string; inviteId: string; nom: string; message: string; timestamp: string; likes: string[]; source: 'legacy_collection' | 'new_collection'; replyCount: number; guestType?: 'simple' | 'couple' }> = [];
      Object.values(messagesByInvite).forEach((arr) => all.push(...arr));
      all.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      onUpdate(all);
    };

    const unsubInvites = onSnapshot(invitesRef, async (snap) => {
      const currentInviteIds = new Set<string>();
      snap.docs.forEach((d) => currentInviteIds.add(d.id));

      Object.keys(subUnsubs).forEach((invId) => {
        if (!currentInviteIds.has(invId)) {
          subUnsubs[invId]?.forEach((u) => u());
          delete subUnsubs[invId];
          delete messagesByInvite[invId];
        }
      });

      for (const d of snap.docs) {
        const invId = d.id;
        const invData = d.data();
        const invName = (invData.nom as string) || 'Invité';
        const invType = (invData.etat as 'simple' | 'couple') || 'simple';
        if (!subUnsubs[invId]) subUnsubs[invId] = [];

        subUnsubs[invId].forEach((u) => u());
        subUnsubs[invId] = [];
        messagesByInvite[invId] = messagesByInvite[invId] || [];

        const legacyRef = collection(db, this.USERS_COLLECTION, userId, 'invites', invId, 'message');
        const unsubLegacy = onSnapshot(legacyRef, (legacySnap) => {
          const arr: Array<{ id: string; inviteId: string; nom: string; message: string; timestamp: string; likes: string[]; source: 'legacy_collection' | 'new_collection'; replyCount: number; guestType?: 'simple' | 'couple' }> = [];
          for (const docSnap of legacySnap.docs) {
            const d = docSnap.data() as { createdAt?: Timestamp; authorName?: string; content?: string; likes?: string[] };
            const created = d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : new Date().toISOString();
            const key = `${invId}:${docSnap.id}`;
            arr.push({
              id: docSnap.id,
              inviteId: invId,
              nom: d.authorName ?? invName,
              message: d.content ?? '',
              timestamp: created,
              likes: Array.isArray(d.likes) ? d.likes : [],
              source: 'legacy_collection',
              replyCount: replyCounts[key] || 0,
              guestType: invType
            });
            const repliesRef = collection(db, this.USERS_COLLECTION, userId, 'invites', invId, 'message', docSnap.id, 'replies');
            const unsubReplies = onSnapshot(repliesRef, (rs) => {
              replyCounts[key] = rs.size;
              const current = messagesByInvite[invId] || [];
              messagesByInvite[invId] = current.map((m) => m.id === docSnap.id && m.source === 'legacy_collection' ? { ...m, replyCount: replyCounts[key] } : m);
              recompute();
            });
            subUnsubs[invId].push(unsubReplies);
          }
          const others = messagesByInvite[invId]?.filter((m) => m.source !== 'legacy_collection') || [];
          messagesByInvite[invId] = [...arr, ...others];
          recompute();
        });
        subUnsubs[invId].push(unsubLegacy);

        const newRef = collection(db, this.USERS_COLLECTION, userId, 'invites', invId, 'guestMessages');
        const unsubNew = onSnapshot(newRef, (newSnap) => {
          const arr: Array<{ id: string; inviteId: string; nom: string; message: string; timestamp: string; likes: string[]; source: 'legacy_collection' | 'new_collection'; replyCount: number; guestType?: 'simple' | 'couple' }> = [];
          for (const docSnap of newSnap.docs) {
            const d = docSnap.data() as { createdAt?: Timestamp; authorName?: string; content?: string; likes?: string[] };
            const created = d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : new Date().toISOString();
            const key = `${invId}:${docSnap.id}`;
            arr.push({
              id: docSnap.id,
              inviteId: invId,
              nom: d.authorName ?? invName,
              message: d.content ?? '',
              timestamp: created,
              likes: Array.isArray(d.likes) ? d.likes : [],
              source: 'new_collection',
              replyCount: replyCounts[key] || 0,
              guestType: invType
            });
            const repliesRef = collection(db, this.USERS_COLLECTION, userId, 'invites', invId, 'guestMessages', docSnap.id, 'replies');
            const unsubReplies = onSnapshot(repliesRef, (rs) => {
              replyCounts[key] = rs.size;
              const current = messagesByInvite[invId] || [];
              messagesByInvite[invId] = current.map((m) => m.id === docSnap.id && m.source === 'new_collection' ? { ...m, replyCount: replyCounts[key] } : m);
              recompute();
            });
            subUnsubs[invId].push(unsubReplies);
          }
          const others = messagesByInvite[invId]?.filter((m) => m.source !== 'new_collection') || [];
          messagesByInvite[invId] = [...arr, ...others];
          recompute();
        });
        subUnsubs[invId].push(unsubNew);
      }
    });

    return () => {
      unsubInvites();
      Object.values(subUnsubs).forEach((arr) => arr.forEach((u) => u()));
    };
  }

  static subscribeMessageReplies(
    userId: string,
    inviteId: string,
    messageId: string,
    source: 'legacy_collection' | 'new_collection',
    onUpdate: (replies: Array<{ id: string; content: string; authorName: string; createdAt: string }>) => void
  ): () => void {
    const basePath = source === 'legacy_collection'
      ? ['message', messageId, 'replies']
      : ['guestMessages', messageId, 'replies'];
    const repliesRef = collection(db, this.USERS_COLLECTION, userId, 'invites', inviteId, ...basePath);
    const unsub = onSnapshot(repliesRef, (snap) => {
      const arr: Array<{ id: string; content: string; authorName: string; createdAt: string }> = [];
      for (const d of snap.docs) {
        const data = d.data() as { createdAt?: Timestamp; content?: string; authorName?: string };
        const created = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString();
        arr.push({ id: d.id, content: data.content ?? '', authorName: data.authorName ?? 'Invité', createdAt: created });
      }
      arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      onUpdate(arr);
    });
    return unsub;
  }
}

// Service pour les tables
export class TableService {
  private static readonly USERS_COLLECTION = 'users';
  private static hashToSafeInt(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) % 9007199254740991;
    }
    return h;
  }

  // Créer une table
  static async createTable(userId: string, tableData: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const tableId = `table_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      console.log('Création de la table avec ID:', tableId, 'pour l\'utilisateur:', userId);
      
      const table: Table = {
        id: this.hashToSafeInt(tableId),
        ...tableData,
        assignedGuests: tableData.assignedGuests || [],
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      // Sauvegarder dans users/{userId}/Tables/{tableId}
      const tableRef = doc(db, this.USERS_COLLECTION, userId, 'Tables', tableId);
      await setDoc(tableRef, table);
      
      console.log('Table créée avec succès:', tableId);
      return tableId;
    } catch (error) {
      console.error('Erreur lors de la création de la table:', error);
      throw new Error('Impossible de créer la table');
    }
  }

  // Récupérer toutes les tables d'un utilisateur
  static async getUserTables(userId: string): Promise<Table[]> {
    try {
      console.log('Chargement des tables pour l\'utilisateur:', userId);
      const tablesRef = collection(db, this.USERS_COLLECTION, userId, 'Tables');
      const querySnapshot = await getDocs(tablesRef);
      
      const tables: Table[] = [];
      querySnapshot.forEach((doc) => {
        console.log('Table trouvée:', doc.id, doc.data());
        const raw = doc.data() as Partial<Table>;
        const stableId = (typeof raw.id === 'number' && !Number.isNaN(raw.id))
          ? raw.id
          : TableService.hashToSafeInt(doc.id);
        const table: Table = {
          docId: doc.id,
          name: String(raw.name || ''),
          seats: typeof raw.seats === 'number' ? raw.seats : 0,
          assignedGuests: Array.isArray(raw.assignedGuests) ? raw.assignedGuests : [],
          createdAt: (raw.createdAt as Timestamp) || serverTimestamp() as Timestamp,
          updatedAt: (raw.updatedAt as Timestamp) || serverTimestamp() as Timestamp,
          id: stableId
        };
        tables.push(table);
      });
      
      console.log('Total tables chargées:', tables.length);
      return tables.sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des tables:', error);
      throw new Error('Impossible de récupérer les tables');
    }
  }

  // Mettre à jour une table
  static async updateTable(
    userId: string,
    tableId: string,
    updates: Partial<Table>
  ): Promise<void> {
    try {
      const tableRef = doc(db, this.USERS_COLLECTION, userId, 'Tables', tableId);
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(tableRef, updateData);
      console.log('Table mise à jour:', tableId);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la table:', error);
      throw new Error('Impossible de mettre à jour la table');
    }
  }

  // Supprimer une table
  static async deleteTable(userId: string, tableId: string): Promise<void> {
    try {
      const tableRef = doc(db, this.USERS_COLLECTION, userId, 'Tables', tableId);
      await deleteDoc(tableRef);
      
      console.log('Table supprimée:', tableId);
    } catch (error) {
      console.error('Erreur lors de la suppression de la table:', error);
      throw new Error('Impossible de supprimer la table');
    }
  }
}

// Service pour les abonnements
export class SubscriptionService {
  private static readonly SUBSCRIPTIONS_COLLECTION = 'subscriptions';

  static async createSubscription(userId: string, plan: 'free' | 'standard' | 'premium') {
    try {
      const subscriptionRef = doc(db, this.SUBSCRIPTIONS_COLLECTION, userId);
      const inviteLimit = plan === 'free' ? 5 : 999999;
      
      const subscriptionData = {
        userId,
        plan,
        status: 'active',
        inviteLimit,
        currentInvites: 0,
        startDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(subscriptionRef, subscriptionData);
      console.log('Abonnement créé:', userId);
    } catch (error) {
      console.error('Erreur lors de la création de l\'abonnement:', error);
      throw new Error('Impossible de créer l\'abonnement');
    }
  }

  static async updateSubscription(userId: string, updates: any) {
    try {
      const subscriptionRef = doc(db, this.SUBSCRIPTIONS_COLLECTION, userId);
      await updateDoc(subscriptionRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      console.log('Abonnement mis à jour:', userId);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'abonnement:', error);
      throw new Error('Impossible de mettre à jour l\'abonnement');
    }
  }
}
// Fonction utilitaire pour initialiser les templates par défaut
export const initializeDefaultTemplates = async (): Promise<void> => {
  try {
    // Template Mariage
    const weddingTemplate: TemplateData = {
      id: 'wedding-gold-premium',
      name: 'Mariage Gold Premium',
      category: 'wedding',
      backgroundImage: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1200',
      title: 'Mariage de [Prénom Mariée] & [Prénom Marié]',
      invitationText: 'Nous avons l\'honneur de vous inviter à célébrer notre union dans la joie et l\'amour. Votre présence sera le plus beau des cadeaux pour ce jour si spécial.',
      eventDate: '[Date de l\'événement]',
      eventTime: '[Heure de l\'événement]',
      eventLocation: '[Lieu de l\'événement]',
      drinkOptions: ['Champagne', 'Vin Rouge', 'Vin Blanc', 'Cocktail Sans Alcool', 'Eau'],
      features: [
        'Photo de fond romantique',
        'Titre personnalisable',
        'Texte d\'invitation modifiable',
        'Nom de l\'invité dynamique',
        'Numéro de table automatique',
        'Date et lieu de l\'événement',
        'Livre d\'or interactif',
        'Confirmation de présence',
        'Choix de boisson',
        'QR Code unique'
      ],
      colors: {
        primary: '#f59e0b',
        secondary: '#d97706',
        accent: '#f43f5e'
      }
    };

    // Template Anniversaire
    const birthdayTemplate: TemplateData = {
      id: 'birthday-celebration-premium',
      name: 'Anniversaire Celebration Premium',
      category: 'birthday',
      backgroundImage: 'https://images.pexels.com/photos/1729808/pexels-photo-1729808.jpeg?auto=compress&cs=tinysrgb&w=1200',
      title: 'Joyeux Anniversaire [Prénom] !',
      invitationText: 'Venez célébrer avec moi cette journée spéciale ! Votre présence sera le plus beau des cadeaux pour marquer mes [Âge] ans dans la joie et la bonne humeur.',
      eventDate: '[Date de l\'événement]',
      eventTime: '[Heure de l\'événement]',
      eventLocation: '[Lieu de l\'événement]',
      drinkOptions: ['Cocktail Signature', 'Champagne', 'Vin Rouge', 'Vin Blanc', 'Jus de Fruits', 'Eau'],
      features: [
        'Photo de fond festive',
        'Titre personnalisable',
        'Texte d\'invitation modifiable',
        'Nom de l\'invité dynamique',
        'Numéro de table automatique',
        'Date et lieu de l\'événement',
        'Livre d\'or interactif',
        'Confirmation de présence',
        'Choix de boisson',
        'QR Code unique',
        'Galerie de souvenirs',
        'Vœux des invités'
      ],
      colors: {
        primary: '#8b5cf6',
        secondary: '#7c3aed',
        accent: '#ec4899'
      }
    };

    // Template Collation
    const graduationTemplate: TemplateData = {
      id: 'graduation-achievement-premium',
      name: 'Collation Achievement Premium',
      category: 'graduation',
      backgroundImage: 'https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=1200',
      title: 'Collation de Grade - [Prénom] [Nom]',
      invitationText: 'Après des années d\'efforts et de persévérance, j\'ai l\'honneur de vous inviter à célébrer l\'obtention de mon diplôme. Votre présence rendrait ce moment encore plus mémorable.',
      eventDate: '[Date de l\'événement]',
      eventTime: '[Heure de l\'événement]',
      eventLocation: '[Lieu de l\'événement]',
      drinkOptions: ['Champagne', 'Vin d\'Honneur', 'Jus de Fruits', 'Eau Pétillante', 'Café', 'Thé'],
      features: [
        'Photo de diplôme',
        'Titre personnalisable',
        'Texte de félicitations',
        'Nom de l\'invité dynamique',
        'Numéro de place automatique',
        'Date et lieu de cérémonie',
        'Livre d\'or interactif',
        'Confirmation de présence',
        'Choix de boisson',
        'QR Code unique',
        'Galerie de souvenirs',
        'Messages de félicitations'
      ],
      colors: {
        primary: '#10b981',
        secondary: '#059669',
        accent: '#3b82f6'
      }
    };

    // Sauvegarder tous les templates par défaut
    await Promise.all([
      TemplateService.saveDefaultTemplate(weddingTemplate),
      TemplateService.saveDefaultTemplate(birthdayTemplate),
      TemplateService.saveDefaultTemplate(graduationTemplate)
    ]);

    console.log('Templates par défaut initialisés avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des templates:', error);
  }
};

// Service pour les catégories d'invités
export class GuestCategoryService {
  private static readonly USERS_COLLECTION = 'users';

  // Créer une catégorie
  static async createCategory(userId: string, name: string): Promise<string> {
    try {
      const categoryId = `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const categoryRef = doc(db, this.USERS_COLLECTION, userId, 'guestCategories', categoryId);
      
      await setDoc(categoryRef, {
        id: categoryId,
        name,
        createdAt: serverTimestamp()
      });
      
      return categoryId;
    } catch (error) {
      console.error('Erreur lors de la création de la catégorie:', error);
      throw new Error('Impossible de créer la catégorie');
    }
  }

  // Récupérer les catégories d'un utilisateur
  static async getUserCategories(userId: string): Promise<GuestCategory[]> {
    try {
      const categoriesRef = collection(db, this.USERS_COLLECTION, userId, 'guestCategories');
      const q = query(categoriesRef, orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      const categories: GuestCategory[] = [];
      querySnapshot.forEach((doc) => {
        categories.push(doc.data() as GuestCategory);
      });
      
      return categories;
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      return [];
    }
  }

  // Supprimer une catégorie
  static async deleteCategory(userId: string, categoryId: string): Promise<void> {
    try {
      const categoryRef = doc(db, this.USERS_COLLECTION, userId, 'guestCategories', categoryId);
      await deleteDoc(categoryRef);
    } catch (error) {
      console.error('Erreur lors de la suppression de la catégorie:', error);
      throw new Error('Impossible de supprimer la catégorie');
    }
  }

  // Mettre à jour une catégorie
  static async updateCategory(userId: string, categoryId: string, name: string): Promise<void> {
    try {
      const categoryRef = doc(db, this.USERS_COLLECTION, userId, 'guestCategories', categoryId);
      await updateDoc(categoryRef, {
        name,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la catégorie:', error);
      throw new Error('Impossible de mettre à jour la catégorie');
    }
  }
}

// Maintenir la compatibilité avec l'ancien service
export const UserTemplateService = UserModelService;
