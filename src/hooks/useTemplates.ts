import { useState, useEffect, useCallback } from 'react';
import { TemplateService, UserModelService, UserModel, TemplateData, InviteService, Invite, TableService, Table, GuestCategory, GuestCategoryService } from '../services/templateService';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';

export const useTemplates = () => {
  const { user } = useAuth();
  const { canCreateInvite, updateInviteCount, subscription } = useSubscription();
  const [defaultTemplates, setDefaultTemplates] = useState<TemplateData[]>([]);
  const [userModels, setUserModels] = useState<UserModel[]>([]);
  const [userInvites, setUserInvites] = useState<Invite[]>([]);
  const [userTables, setUserTables] = useState<Table[]>([]);
  const [userCategories, setUserCategories] = useState<GuestCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les templates par défaut
  const loadDefaultTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const templates = await TemplateService.getDefaultTemplates();
      setDefaultTemplates(templates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des templates');
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les modèles utilisateur
  const loadUserModels = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const models = await UserModelService.getUserModels(user.id);
      setUserModels(models);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement de vos modèles');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Charger les invités utilisateur
  const loadUserInvites = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const invites = await InviteService.getUserInvites(user.id);
      setUserInvites(invites);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement de vos invités');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Charger les tables utilisateur
  const loadUserTables = useCallback(async () => {
    if (!user) return;
    
    try {
      setError(null);
      const tables = await TableService.getUserTables(user.id);
      setUserTables(tables);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement de vos tables');
    }
  }, [user]);

  // Charger les catégories d'invités
  const loadUserCategories = useCallback(async () => {
    if (!user) return;
    
    try {
      const categories = await GuestCategoryService.getUserCategories(user.id);
      setUserCategories(categories);
    } catch (err) {
      console.error('Erreur chargement catégories:', err);
    }
  }, [user]);

  // Charger les modèles utilisateur (pour compatibilité)
  const loadUserTemplateReferences = async () => {
    if (!user) return [];
    try {
      const models = await UserModelService.getUserModels(user.id);
      return models;
    } catch (err) {
      console.error('Erreur lors du chargement des références des templates:', err);
      return [];
    }
  };

  // Charger templates par catégorie
  const loadTemplatesByCategory = async (category: 'wedding' | 'birthday' | 'graduation') => {
    try {
      setIsLoading(true);
      setError(null);
      const templates = await TemplateService.getTemplatesByCategory(category);
      return templates;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des templates');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Créer un modèle utilisateur
  const createUserModel = async (
    originalTemplate: TemplateData,
    customizations?: Partial<UserModel>
  ): Promise<string | null> => {
    if (!user) {
      setError('Vous devez être connecté pour créer un modèle');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      const modelId = await UserModelService.createUserModel(
        user.id,
        originalTemplate,
        customizations
      );
      
      // Recharger les modèles utilisateur
      await loadUserModels();
      
      return modelId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du modèle');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre à jour un modèle utilisateur
  const updateUserModel = async (
    modelId: string,
    updates: Partial<UserModel>
  ): Promise<boolean> => {
    if (!user) {
      setError('Vous devez être connecté pour modifier un modèle');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      await UserModelService.updateUserModel(user.id, modelId, updates);
      
      // Recharger les modèles utilisateur
      await loadUserModels();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du modèle');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Supprimer un modèle utilisateur
  const deleteUserModel = async (
    modelId: string
  ): Promise<boolean> => {
    if (!user) {
      setError('Vous devez être connecté pour supprimer un modèle');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      await UserModelService.deleteUserModel(user.id, modelId);
      
      // Recharger les modèles utilisateur
      await loadUserModels();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression du modèle');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer un template par défaut spécifique
  const getDefaultTemplate = async (templateId: string): Promise<TemplateData | null> => {
    try {
      setError(null);
      return await TemplateService.getDefaultTemplate(templateId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération du template');
      return null;
    }
  };

  // Récupérer un modèle utilisateur spécifique
  const getUserModel = async (
    modelId: string
  ): Promise<UserModel | null> => {
    if (!user) return null;

    try {
      setError(null);
      return await UserModelService.getUserModel(user.id, modelId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération du modèle');
      return null;
    }
  };

  // Fonctions pour les invités
  const createInvite = async (inviteData: Omit<Invite, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    if (!user) {
      setError('Vous devez être connecté pour créer un invité');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      const inviteId = await InviteService.createInvite(user.id, inviteData);
      
      // Mettre à jour le compteur d'abonnement
      const currentCount = userInvites.length;
      if (subscription) {
        await updateInviteCount(currentCount + 1);
      }
      
      // Recharger les invités
      await loadUserInvites();
      
      return inviteId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de l\'invité');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const bulkCreateInvites = async (invitesData: Omit<Invite, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<boolean> => {
    if (!user) {
      setError('Vous devez être connecté pour créer des invités');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      await InviteService.bulkCreateInvites(user.id, invitesData);
      
      // Mettre à jour le compteur d'abonnement
      const currentCount = userInvites.length;
      if (subscription) {
        await updateInviteCount(currentCount + invitesData.length);
      }
      
      // Recharger les invités
      await loadUserInvites();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création massive des invités');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateInvite = async (inviteId: string, updates: Partial<Invite>): Promise<boolean> => {
    if (!user) {
      setError('Vous devez être connecté pour modifier un invité');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      await InviteService.updateInvite(user.id, inviteId, updates);
      
      // Recharger les invités
      await loadUserInvites();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'invité');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteInvite = async (inviteId: string): Promise<boolean> => {
    if (!user) {
      setError('Vous devez être connecté pour supprimer un invité');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      await InviteService.deleteInvite(user.id, inviteId);
      
      // Recharger les invités
      await loadUserInvites();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'invité');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const bulkDeleteInvites = async (inviteIds: string[]): Promise<boolean> => {
    if (!user) {
      setError('Vous devez être connecté pour supprimer des invités');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      await InviteService.bulkDeleteInvites(user.id, inviteIds);
      
      // Mettre à jour le compteur d'abonnement
      if (subscription) {
        const currentCount = userInvites.length;
        await updateInviteCount(Math.max(0, currentCount - inviteIds.length));
      }
      
      // Recharger les invités
      await loadUserInvites();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression massive des invités');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonctions pour les tables
  const createTable = async (tableData: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    if (!user) {
      setError('Vous devez être connecté pour créer une table');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      const tableId = await TableService.createTable(user.id, tableData);
      
      // Recharger les tables
      await loadUserTables();
      
      return tableId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la table');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTable = async (tableId: string, updates: Partial<Table>): Promise<boolean> => {
    if (!user) {
      setError('Vous devez être connecté pour modifier une table');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      await TableService.updateTable(user.id, tableId, updates);
      
      // Recharger les tables
      await loadUserTables();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la table');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTable = async (tableId: string): Promise<boolean> => {
    if (!user) {
      setError('Vous devez être connecté pour supprimer une table');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      await TableService.deleteTable(user.id, tableId);
      
      // Recharger les tables
      await loadUserTables();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression de la table');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createGuestCategory = async (name: string): Promise<string | null> => {
    if (!user) return null;
    try {
      const id = await GuestCategoryService.createCategory(user.id, name);
      await loadUserCategories();
      return id;
    } catch (err) {
      console.error('Erreur création catégorie:', err);
      return null;
    }
  };

  const deleteGuestCategory = async (categoryId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      await GuestCategoryService.deleteCategory(user.id, categoryId);
      await loadUserCategories();
      return true;
    } catch (err) {
      console.error('Erreur suppression catégorie:', err);
      return false;
    }
  };

  const updateGuestCategory = async (categoryId: string, name: string): Promise<boolean> => {
    if (!user) return false;
    try {
      await GuestCategoryService.updateCategory(user.id, categoryId, name);
      await loadUserCategories();
      return true;
    } catch (err) {
      console.error('Erreur mise à jour catégorie:', err);
      return false;
    }
  };

  // Charger les templates au montage du composant
  useEffect(() => {
    loadDefaultTemplates();
  }, []);

  // Charger les modèles et invités utilisateur quand l'utilisateur change
  useEffect(() => {
    if (user) {
      loadUserModels();
      loadUserInvites();
      loadUserTables();
      loadUserCategories();
    } else {
      setUserModels([]);
      setUserInvites([]);
      setUserTables([]);
      setUserCategories([]);
    }
  }, [user, loadUserModels, loadUserInvites, loadUserTables, loadUserCategories]);

  // Fonction pour forcer le rechargement des données
  const refreshUserData = useCallback(async () => {
    if (user) {
      await Promise.all([
        loadUserModels(),
        loadUserInvites(),
        loadUserTables(),
        loadUserCategories()
      ]);
    }
  }, [user, loadUserModels, loadUserInvites, loadUserTables, loadUserCategories]);

  return {
    defaultTemplates,
    userModels,
    userInvites,
    userTables,
    isLoading,
    error,
    loadDefaultTemplates,
    loadUserModels,
    loadUserInvites,
    loadUserTables,
    loadUserTemplateReferences,
    loadTemplatesByCategory,
    createUserModel,
    updateUserModel,
    deleteUserModel,
    getDefaultTemplate,
    getUserModel,
    createInvite,
    updateInvite,
    deleteInvite,
    bulkDeleteInvites,
    createTable,
    updateTable,
    deleteTable,
    bulkCreateInvites,
    userCategories,
    createGuestCategory,
    updateGuestCategory,
    deleteGuestCategory,
    // Compatibilité avec l'ancien nom
    createUserTemplate: createUserModel,
    userTemplates: userModels,
    clearError: () => setError(null),
    refreshUserData
  };
};