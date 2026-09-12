import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  KeyRound,
  Ban,
  CheckCircle,
  XCircle,
  Search,
  Crown,
  UserX,
  UserCheck,
  Save,
  X,
  RefreshCw,
  Shield,
  Mail,
  Calendar,
  Clock
} from 'lucide-react';
import { auth } from '../config/firebase';
import ConfirmationModal from './ConfirmationModal';
import { UserModelService } from '../services/templateService';

const REGION = 'europe-west1';
const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const FUNCTIONS_BASE = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;

interface ManagedUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  disabled: boolean;
  createdAt: string;
  lastSignInTime: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  photoURL?: string;
}

interface Toast {
  type: 'success' | 'error' | 'info';
  message: string;
}

const callAdminFunction = async (
  endpoint: string,
  body?: Record<string, any>,
  method: 'GET' | 'POST' = 'POST'
) => {
  if (!auth.currentUser) {
    throw new Error('Non authentifié');
  }
  const idToken = await auth.currentUser.getIdToken(true);
  const url = method === 'GET' && body
    ? `${FUNCTIONS_BASE}/${endpoint}?${new URLSearchParams(body as any).toString()}`
    : `${FUNCTIONS_BASE}/${endpoint}`;

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    ...(method === 'POST' && body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({ success: false, error: 'Réponse invalide' }));
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Erreur ${res.status}`);
  }
  return data;
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<Toast | null>(null);
  const [userEventDates, setUserEventDates] = useState<Record<string, string | null>>({});
  const [isLoadingDates, setIsLoadingDates] = useState(false);

  // Create user modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user' as 'admin' | 'user',
  });
  const [isCreating, setIsCreating] = useState(false);

  // Edit user modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [editForm, setEditForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'user' as 'admin' | 'user',
  });
  const [isEditing, setIsEditing] = useState(false);

  // Reset password modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUser, setResetUser] = useState<ManagedUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Confirm modals
  const [deleteConfirmation, setDeleteConfirmation] = useState<ManagedUser | null>(null);
  const [toggleConfirmation, setToggleConfirmation] = useState<ManagedUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const showToast = (type: Toast['type'], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const formatLongDate = (s: string) => {
    if (!s) return '—';
    try {
      const monthMap: Record<string, string> = {
        '01': 'janvier', '02': 'février', '03': 'mars', '04': 'avril',
        '05': 'mai', '06': 'juin', '07': 'juillet', '08': 'août',
        '09': 'septembre', '10': 'octobre', '11': 'novembre', '12': 'décembre',
        'jan': 'janvier', 'fév': 'février', 'fev': 'février', 'mar': 'mars',
        'avr': 'avril', 'mai': 'mai', 'jui': 'juin', 'juil': 'juillet',
        'aoû': 'août', 'aou': 'août', 'sep': 'septembre', 'oct': 'octobre',
        'nov': 'novembre', 'déc': 'décembre', 'dec': 'décembre',
      };

      const clean = s.trim().replace(/\s+/g, ' ');
      const parsed = Date.parse(clean);
      if (!isNaN(parsed)) {
        const d = new Date(parsed);
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      }

      const match = clean.match(/^(\d{1,2})[\s.\-/]+([a-zA-Z\u00e9\u00ea\u00eb\u00e8]+)[\s.\-/]+(\d{4})$/);
      if (match) {
        const day = match[1];
        const monthRaw = match[2].toLowerCase();
        const year = match[3];
        const monthFull =
          (Object.keys(monthMap).find(k =>
            k === monthRaw.slice(0, 3) || monthRaw.startsWith(k)
          ) && monthMap[Object.keys(monthMap).find(k =>
            k === monthRaw.slice(0, 3) || monthRaw.startsWith(k)
          )!]) || monthRaw;
        return `${parseInt(day, 10)} ${monthFull} ${year}`;
      }

      return clean;
    } catch {
      return s;
    }
  };

  const loadUserEventDates = useCallback(async (userList: ManagedUser[]) => {
    if (userList.length === 0) return;
    setIsLoadingDates(true);
    try {
      const results: Record<string, string | null> = {};
      const promises = userList.map(async (u) => {
        try {
          const models = await UserModelService.getUserModels(u.uid);
          const dates = models
            .map(m => m.eventDate)
            .filter((d): d is string => !!d && d.trim() !== '');
          if (dates.length === 0) {
            results[u.uid] = null;
            return;
          }
          const sortedDates = dates
            .map(d => {
              const p = Date.parse(d.replace(/(\d+)\s+([a-zA-ZÀ-ÿ]+)\s+(\d{4})/, (_, day, month, year) => {
                const map: Record<string, string> = {
                  janvier: '01', février: '02', fevrier: '02', mars: '03', avril: '04',
                  mai: '05', juin: '06', juillet: '07', août: '08', aout: '08',
                  septembre: '09', octobre: '10', novembre: '11', décembre: '12', decembre: '12',
                };
                const mm = map[month.toLowerCase()] || '01';
                return `${year}-${mm}-${day.padStart(2, '0')}`;
              }));
              return { raw: d, parsed: isNaN(p) ? Infinity : p };
            })
            .sort((a, b) => a.parsed - b.parsed);
          results[u.uid] = formatLongDate(sortedDates[0].raw);
        } catch {
          results[u.uid] = null;
        }
      });
      await Promise.all(promises);
      setUserEventDates(results);
    } catch (err) {
      console.error('Erreur chargement dates événements:', err);
    } finally {
      setIsLoadingDates(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await callAdminFunction('adminListUsers', { limit: 100 }, 'GET');
      const userList: ManagedUser[] = data.users || [];
      setUsers(userList);
      loadUserEventDates(userList);
    } catch (err: any) {
      console.error('Erreur chargement users:', err);
      showToast('error', err.message || 'Impossible de charger les utilisateurs');
    } finally {
      setIsLoading(false);
    }
  }, [loadUserEventDates]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter(u => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase();
    return (
      u.email.toLowerCase().includes(s) ||
      u.firstName.toLowerCase().includes(s) ||
      u.lastName.toLowerCase().includes(s) ||
      u.uid.toLowerCase().includes(s)
    );
  });

  // --- CREATE ---
  const handleCreate = async () => {
    if (!createForm.email || !createForm.password) {
      showToast('error', 'Email et mot de passe requis');
      return;
    }
    if (createForm.password.length < 6) {
      showToast('error', 'Mot de passe trop court (min. 6 caractères)');
      return;
    }
    setIsCreating(true);
    try {
      await callAdminFunction('adminCreateUser', createForm);
      showToast('success', 'Utilisateur créé avec succès');
      setShowCreateModal(false);
      setCreateForm({ email: '', password: '', firstName: '', lastName: '', role: 'user' });
      await loadUsers();
    } catch (err: any) {
      showToast('error', err.message || 'Échec de la création');
    } finally {
      setIsCreating(false);
    }
  };

  // --- EDIT ---
  const openEdit = (u: ManagedUser) => {
    setEditingUser(u);
    setEditForm({
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
    });
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    if (!editingUser) return;
    setIsEditing(true);
    try {
      await callAdminFunction('adminUpdateUser', {
        uid: editingUser.uid,
        ...editForm,
      });
      showToast('success', 'Utilisateur mis à jour');
      setShowEditModal(false);
      setEditingUser(null);
      await loadUsers();
    } catch (err: any) {
      showToast('error', err.message || 'Échec de la mise à jour');
    } finally {
      setIsEditing(false);
    }
  };

  // --- RESET PASSWORD ---
  const openReset = (u: ManagedUser) => {
    setResetUser(u);
    setNewPassword('');
    setShowResetModal(true);
  };

  const handleReset = async () => {
    if (!resetUser || !newPassword) return;
    if (newPassword.length < 6) {
      showToast('error', 'Mot de passe trop court (min. 6 caractères)');
      return;
    }
    setIsResetting(true);
    try {
      await callAdminFunction('adminResetPassword', {
        uid: resetUser.uid,
        newPassword,
      });
      showToast('success', 'Mot de passe réinitialisé');
      setShowResetModal(false);
      setResetUser(null);
      setNewPassword('');
    } catch (err: any) {
      showToast('error', err.message || 'Échec de la réinitialisation');
    } finally {
      setIsResetting(false);
    }
  };

  // --- TOGGLE DISABLED ---
  const handleToggleConfirm = async () => {
    if (!toggleConfirmation) return;
    setIsToggling(true);
    try {
      await callAdminFunction('adminToggleUserDisabled', {
        uid: toggleConfirmation.uid,
        disabled: !toggleConfirmation.disabled,
      });
      showToast('success', toggleConfirmation.disabled ? 'Compte activé' : 'Compte désactivé');
      setToggleConfirmation(null);
      await loadUsers();
    } catch (err: any) {
      showToast('error', err.message || 'Échec');
    } finally {
      setIsToggling(false);
    }
  };

  // --- DELETE ---
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation) return;
    setIsDeleting(true);
    try {
      await callAdminFunction('adminDeleteUser', { uid: deleteConfirmation.uid });
      showToast('success', 'Utilisateur supprimé');
      setDeleteConfirmation(null);
      await loadUsers();
    } catch (err: any) {
      showToast('error', err.message || 'Échec de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (s: string) => {
    if (!s) return '—';
    try {
      return new Date(s).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return s;
    }
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] animate-fade-in">
          <div
            className={`rounded-xl px-4 py-3 shadow-2xl border flex items-center space-x-2 max-w-sm ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700/50 dark:text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/30 dark:border-rose-700/50 dark:text-rose-200'
                : 'bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-900/30 dark:border-sky-700/50 dark:text-sky-200'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="h-4 w-4 flex-shrink-0" />}
            {toast.type === 'error' && <XCircle className="h-4 w-4 flex-shrink-0" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  Gestion des utilisateurs
                </h2>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                  {users.length} compte{users.length > 1 ? 's' : ''} enregistré{users.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Rechercher..."
                className="w-full sm:w-64 pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
              />
            </div>

            <button
              onClick={loadUsers}
              disabled={isLoading}
              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-300 dark:hover:border-amber-600/50 transition-all disabled:opacity-50"
              title="Actualiser"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouveau</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800/60 rounded-2xl shadow-luxury border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-200/60 dark:border-slate-700/60">
                <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
                  Email
                </th>
                <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Créé le</span>
                  </div>
                </th>
                <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>Dernière co.</span>
                  </div>
                </th>
                <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-right px-3 md:px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-slate-500 dark:text-slate-400">
                    <RefreshCw className="h-6 w-6 mx-auto animate-spin mb-2 opacity-50" />
                    <p className="text-sm">Chargement...</p>
                  </td>
                </tr>
              )}
              {!isLoading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <Users className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {searchTerm ? 'Aucun utilisateur ne correspond' : 'Aucun utilisateur'}
                    </p>
                  </td>
                </tr>
              )}
              {!isLoading &&
                filteredUsers.map(u => {
                  const isCurrent = auth.currentUser?.uid === u.uid;
                  return (
                    <tr
                      key={u.uid}
                      className="hover:bg-amber-50/40 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-3 md:px-4 py-3 md:py-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`h-9 w-9 md:h-10 md:w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                              u.role === 'admin'
                                ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/30'
                                : 'bg-gradient-to-br from-slate-400 to-slate-600 shadow-md'
                            }`}
                          >
                            {u.firstName?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {u.firstName || u.lastName
                                  ? `${u.firstName} ${u.lastName}`.trim()
                                  : '(Sans nom)'}
                              </p>
                              {u.role === 'admin' && (
                                <Crown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                              )}
                              {isCurrent && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 font-medium flex-shrink-0">
                                  Vous
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate md:hidden">
                              {u.email}
                            </p>
                            <div className="flex items-center space-x-1 mt-1">
                              <Calendar className="h-3 w-3 text-amber-500/80 flex-shrink-0" />
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                {isLoadingDates && !(u.uid in userEventDates) ? (
                                  <span className="opacity-60">expiration : chargement...</span>
                                ) : userEventDates[u.uid] ? (
                                  <>
                                    expiration :{' '}
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                      {userEventDates[u.uid]}
                                    </span>
                                  </>
                                ) : (
                                  <span className="italic opacity-60">expiration : —</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4 hidden md:table-cell">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <span className="text-sm text-slate-700 dark:text-slate-300 break-all">
                            {u.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4 hidden lg:table-cell">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(u.createdAt)}
                        </span>
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4 hidden lg:table-cell">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(u.lastSignInTime)}
                        </span>
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {u.disabled ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] md:text-xs px-2 py-1 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 font-medium">
                              <Ban className="h-3 w-3" />
                              <span>Désactivé</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-[10px] md:text-xs px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium">
                              <CheckCircle className="h-3 w-3" />
                              <span>Actif</span>
                            </span>
                          )}
                          {u.role === 'admin' ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] md:text-xs px-2 py-1 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-medium">
                              <Shield className="h-3 w-3" />
                              <span>Admin</span>
                            </span>
                          ) : (
                            <span className="inline-flex text-[10px] md:text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300 font-medium">
                              Utilisateur
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => openEdit(u)}
                            className="p-1.5 md:p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openReset(u)}
                            className="p-1.5 md:p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                            title="Réinitialiser le mot de passe"
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setToggleConfirmation(u)}
                            className={`p-1.5 md:p-2 rounded-lg transition-all ${
                              u.disabled
                                ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                : 'text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                            }`}
                            title={u.disabled ? 'Activer' : 'Désactiver'}
                          >
                            {u.disabled ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmation(u)}
                            disabled={isCurrent}
                            className="p-1.5 md:p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isCurrent ? 'Impossible de supprimer votre propre compte' : 'Supprimer'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-zoom-in border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-amber-50 to-slate-50 dark:from-slate-800 dark:to-slate-800/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-amber-500" />
                  <span>Nouvel utilisateur</span>
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={createForm.firstName}
                    onChange={e => setCreateForm({ ...createForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={createForm.lastName}
                    onChange={e => setCreateForm({ ...createForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
                  placeholder="john@exemple.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Mot de passe * (min. 6 car.)
                </label>
                <input
                  type="text"
                  value={createForm.password}
                  onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all font-mono"
                  placeholder="••••••"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Rôle
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, role: 'user' })}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all border ${
                      createForm.role === 'user'
                        ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white'
                        : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                    }`}
                  >
                    Utilisateur
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, role: 'admin' })}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all border ${
                      createForm.role === 'admin'
                        ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700/50 text-amber-800 dark:text-amber-200'
                        : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-900/10'
                    }`}
                  >
                    <span className="flex items-center justify-center space-x-1">
                      <Crown className="h-3.5 w-3.5" />
                      <span>Admin</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/30 flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-xl shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Créer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-zoom-in border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-sky-50 to-slate-50 dark:from-slate-800 dark:to-slate-800/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Edit className="h-5 w-5 text-sky-500" />
                  <span>Modifier l'utilisateur</span>
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                {editingUser.email}
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={e => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                  Rôle
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, role: 'user' })}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all border ${
                      editForm.role === 'user'
                        ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white'
                        : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                    }`}
                  >
                    Utilisateur
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, role: 'admin' })}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all border ${
                      editForm.role === 'admin'
                        ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700/50 text-amber-800 dark:text-amber-200'
                        : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-900/10'
                    }`}
                  >
                    <span className="flex items-center justify-center space-x-1">
                      <Crown className="h-3.5 w-3.5" />
                      <span>Admin</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/30 flex justify-end space-x-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleEdit}
                disabled={isEditing}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white text-sm font-medium rounded-xl shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEditing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Enregistrer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showResetModal && resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-zoom-in border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-slate-50 dark:from-slate-800 dark:to-slate-800/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <KeyRound className="h-5 w-5 text-purple-500" />
                  <span>Réinitialiser le mot de passe</span>
                </h3>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                {resetUser.email}
              </p>
            </div>
            <div className="p-5">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Nouveau mot de passe (min. 6 caractères)
              </label>
              <input
                type="text"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all font-mono"
                placeholder="••••••"
              />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Partagez ce mot de passe à l'utilisateur de manière sécurisée.
              </p>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/30 flex justify-end space-x-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-sm font-medium rounded-xl shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResetting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                <span>Réinitialiser</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODALS */}
      <ConfirmationModal
        isOpen={!!deleteConfirmation}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer cet utilisateur ?"
        message={
          deleteConfirmation
            ? `Êtes-vous sûr de vouloir supprimer définitivement le compte de ${deleteConfirmation.email} ? Cette action est irréversible et supprimera toutes ses données.`
            : ''
        }
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        isLoading={isDeleting}
      />

      <ConfirmationModal
        isOpen={!!toggleConfirmation}
        onClose={() => setToggleConfirmation(null)}
        onConfirm={handleToggleConfirm}
        title={
          toggleConfirmation?.disabled
            ? 'Réactiver ce compte ?'
            : 'Désactiver ce compte ?'
        }
        message={
          toggleConfirmation
            ? toggleConfirmation.disabled
              ? `Réactiver le compte de ${toggleConfirmation.email} lui permettra de se reconnecter.`
              : `Désactiver le compte de ${toggleConfirmation.email} l'empêchera de se connecter jusqu'à sa réactivation.`
            : ''
        }
        confirmText={toggleConfirmation?.disabled ? 'Activer' : 'Désactiver'}
        cancelText="Annuler"
        type="warning"
        isLoading={isToggling}
      />
    </div>
  );
};

export default UserManagement;
