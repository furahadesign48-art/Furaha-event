import React, { useState } from 'react';
import { User, Mail, Calendar, Settings, LogOut, Edit, Save, X, ArrowLeft, Crown } from 'lucide-react';
import { useAuth, UserData } from '../hooks/useAuth';


interface UserProfileProps {
  userData: UserData;
  onLogout: () => void;
  onBack: () => void;
}

const UserProfile = ({ userData, onLogout, onBack }: UserProfileProps) => {
  const { updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: userData.firstName,
    lastName: userData.lastName,
    invitationMessage: userData.invitationMessage || ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const result = await updateUserProfile({
        firstName: editData.firstName,
        lastName: editData.lastName,
        invitationMessage: editData.invitationMessage
      });
      
      if (result.success) {
        setIsEditing(false);
        alert('Profil mis à jour avec succès !');
      } else {
        alert('Erreur lors de la mise à jour : ' + result.error);
      }
    } catch (error) {
      alert('Erreur lors de la mise à jour du profil');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      firstName: userData.firstName,
      lastName: userData.lastName,
      invitationMessage: userData.invitationMessage || ''
    });
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-amber-50/30 to-purple-50/20 dark:from-slate-900 dark:via-slate-800/30 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Bouton retour */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-amber-600 hover:text-amber-700 transition-all duration-300 group"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            Retour
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-luxury border border-neutral-200/50 dark:border-slate-600/50 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-rose-50/30 dark:from-slate-700 dark:to-slate-600 p-8 border-b border-neutral-200/50 dark:border-slate-600/50 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/20 to-purple-200/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-rose-200/20 to-amber-200/20 rounded-full blur-2xl"></div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-glow-amber animate-glow">
              {userData.firstName[0]}{userData.lastName[0]}
              </div>
              <div className="absolute -top-2 -right-2">
                <Crown className="h-6 w-6 text-amber-500 animate-pulse" />
              </div>
            </div>
            <div className="ml-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                {userData.firstName} {userData.lastName}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg">{userData.email}</p>
              <div className="flex items-center mt-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Compte actif</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="p-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 transform hover:scale-110 shadow-lg"
                title="Modifier le profil"
              >
                <Edit className="h-6 w-6" />
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="p-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 transform hover:scale-110 shadow-lg"
                  title="Sauvegarder"
                >
                  {isUpdating ? (
                    <div className="w-6 h-6 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin"></div>
                  ) : (
                    <Save className="h-6 w-6" />
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  className="p-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 transform hover:scale-110 shadow-lg"
                  title="Annuler"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="space-y-8">
          {/* Informations personnelles */}
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
              <div className="relative mr-3">
                <User className="h-6 w-6 text-amber-600 animate-glow drop-shadow-lg" />
                <div className="absolute inset-0 animate-pulse">
                  <User className="h-6 w-6 text-amber-300 opacity-30" />
                </div>
              </div>
              Informations personnelles
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Prénom
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.firstName}
                    onChange={(e) => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-4 border border-neutral-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-lg"
                  />
                ) : (
                  <div className="bg-gradient-to-r from-neutral-50 to-amber-50/30 dark:from-slate-700 dark:to-slate-600 px-4 py-4 rounded-xl border border-neutral-200 dark:border-slate-600 shadow-lg">
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                    {isEditing ? editData.firstName : userData.firstName}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Nom
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.lastName}
                    onChange={(e) => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-4 border border-neutral-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-lg"
                  />
                ) : (
                  <div className="bg-gradient-to-r from-neutral-50 to-amber-50/30 dark:from-slate-700 dark:to-slate-600 px-4 py-4 rounded-xl border border-neutral-200 dark:border-slate-600 shadow-lg">
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                    {isEditing ? editData.lastName : userData.lastName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
              <div className="relative mr-3">
                <Mail className="h-6 w-6 text-amber-600 animate-glow drop-shadow-lg" />
                <div className="absolute inset-0 animate-pulse">
                  <Mail className="h-6 w-6 text-amber-300 opacity-30" />
                </div>
              </div>
              Contact
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Adresse email
              </label>
              <div className="bg-gradient-to-r from-neutral-50 to-amber-50/30 dark:from-slate-700 dark:to-slate-600 px-4 py-4 rounded-xl border border-neutral-200 dark:border-slate-600 shadow-lg">
                <span className="text-slate-900 dark:text-slate-100 font-medium">
                {userData.email}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center">
                <Settings className="h-3 w-3 mr-1" />
                L'email ne peut pas être modifié
              </p>
            </div>
          </div>

          {/* Personnalisation des invitations */}
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
              <div className="relative mr-3">
                <Settings className="h-6 w-6 text-amber-600 animate-glow drop-shadow-lg" />
                <div className="absolute inset-0 animate-pulse">
                  <Settings className="h-6 w-6 text-amber-300 opacity-30" />
                </div>
              </div>
              Personnalisation des invitations
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Message d'invitation par défaut
              </label>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 italic">
                Ce texte apparaîtra dans vos invitations WhatsApp avant le lien.
              </p>
              {isEditing ? (
                <textarea
                  value={editData.invitationMessage}
                  onChange={(e) => setEditData(prev => ({ ...prev, invitationMessage: e.target.value }))}
                  placeholder="Nous sommes heureux de vous inviter à célébrer ce moment avec nous."
                  rows={4}
                  className="w-full px-4 py-4 border border-neutral-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-lg resize-none"
                />
              ) : (
                <div className="bg-gradient-to-r from-neutral-50 to-amber-50/30 dark:from-slate-700 dark:to-slate-600 px-4 py-4 rounded-xl border border-neutral-200 dark:border-slate-600 shadow-lg">
                  <span className="text-slate-900 dark:text-slate-100 font-medium whitespace-pre-wrap">
                    {userData.invitationMessage || "Nous sommes heureux de vous inviter à célébrer ce moment avec nous."}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Informations du compte - Simplifié */}
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
              <div className="relative mr-3">
                <Calendar className="h-6 w-6 text-amber-600 animate-glow drop-shadow-lg" />
                <div className="absolute inset-0 animate-pulse">
                  <Calendar className="h-6 w-6 text-amber-300 opacity-30" />
                </div>
              </div>
              Informations du compte
            </h3>
            
            <div className="max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Membre depuis
                </label>
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-slate-700 dark:to-slate-600 px-6 py-4 rounded-xl border border-emerald-200 dark:border-slate-600 shadow-lg">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mr-3" />
                    <span className="text-slate-900 dark:text-slate-100 font-medium text-lg">
                  {formatDate(userData.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-neutral-50 to-amber-50/30 dark:from-slate-700 dark:to-slate-600 p-8 border-t border-neutral-200/50 dark:border-slate-600/50">
        <button
          onClick={onLogout}
          className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white py-4 rounded-xl hover:from-rose-600 hover:to-rose-700 transition-all duration-300 font-semibold flex items-center justify-center shadow-glow-rose transform hover:scale-105 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <span className="relative flex items-center">
            <LogOut className="h-5 w-5 mr-3" />
          Se déconnecter
          </span>
        </button>
      </div>
      </div>
      </div>
    </div>
  );
};

export default UserProfile;
