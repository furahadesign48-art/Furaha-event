import React, { useState } from 'react';
import { User, Mail, Calendar, Settings, LogOut, Edit, Save, X, ArrowLeft, Crown, Shield } from 'lucide-react';
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
    <div
      className="min-h-screen p-4 sm:p-6 lg:p-8 animate-fade-in"
      style={{
        background: 'radial-gradient(ellipse at top, rgba(251,191,36,0.12) 0%, transparent 55%), linear-gradient(180deg, #0a0f1c 0%, #0b0f17 100%)',
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Bouton retour */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center transition-all duration-300 group font-bold"
            style={{ color: '#fcd34d' }}
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            Retour
          </button>
        </div>

        <div
          className="rounded-3xl border overflow-hidden animate-slide-up"
          style={{
            background: 'linear-gradient(180deg, #111727 0%, #0b0f17 100%)',
            borderColor: 'rgba(255,255,255,0.08)',
            boxShadow: '0 60px 140px -30px rgba(0,0,0,0.85), 0 0 0 1px rgba(251,191,36,0.04) inset',
          }}
        >
      {/* Header */}
      <div
        className="p-8 border-b relative overflow-hidden"
        style={{
          borderColor: 'rgba(255,255,255,0.06)',
          background: 'linear-gradient(180deg, rgba(251,191,36,0.08) 0%, rgba(236,72,153,0.05) 60%, rgba(255,255,255,0.01) 100%)',
        }}
      >
        {/* Background decorative elements */}
        <div
          aria-hidden
          className="absolute top-0 right-0 w-56 h-56 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.22) 0%, transparent 70%)' }}
        />
        <div
          aria-hidden
          className="absolute bottom-0 left-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.20) 0%, transparent 70%)' }}
        />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center min-w-0">
            <div className="relative flex-shrink-0">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white font-extrabold text-2xl"
                style={{
                  background: 'linear-gradient(135deg, #fcd34d 0%, #ec4899 100%)',
                  boxShadow: '0 18px 45px -12px rgba(251,191,36,0.6), 0 0 0 3px rgba(251,191,36,0.2)',
                }}
              >
              {userData.firstName[0]}{userData.lastName[0]}
              </div>
              <div className="absolute -top-2 -right-2">
                <Crown className="h-6 w-6 animate-pulse" style={{ color: '#fcd34d', filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.7))' }} />
              </div>
            </div>
            <div className="ml-6 min-w-0">
              <h2 className="text-2xl font-extrabold tracking-tight text-white truncate">
                {userData.firstName} {userData.lastName}
              </h2>
              <p className="text-lg mt-1 truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>{userData.email}</p>
              <div className="flex items-center mt-2">
                <div className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{ background: '#34d399', boxShadow: '0 0 12px rgba(52,211,153,0.7)' }} />
                <span className="text-sm font-bold" style={{ color: '#6ee7b7' }}>Compte actif</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2 flex-shrink-0 ml-4">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="p-3 rounded-xl transition-all duration-200 transform hover:scale-110"
                style={{
                  color: '#fcd34d',
                  background: 'rgba(251,191,36,0.10)',
                  border: '1px solid rgba(251,191,36,0.3)',
                  boxShadow: '0 10px 24px -10px rgba(251,191,36,0.5)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.18)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.10)'; }}
                title="Modifier le profil"
              >
                <Edit className="h-6 w-6" />
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="p-3 rounded-xl transition-all duration-200 transform hover:scale-110 disabled:opacity-50 disabled:transform-none"
                  style={{
                    color: '#34d399',
                    background: 'rgba(16,185,129,0.12)',
                    border: '1px solid rgba(16,185,129,0.35)',
                    boxShadow: '0 10px 24px -10px rgba(16,185,129,0.5)',
                  }}
                  onMouseEnter={(e) => { if (!isUpdating) e.currentTarget.style.background = 'rgba(16,185,129,0.22)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.12)'; }}
                  title="Sauvegarder"
                >
                  {isUpdating ? (
                    <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(52,211,153,0.3)', borderTopColor: '#34d399' }} />
                  ) : (
                    <Save className="h-6 w-6" />
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  className="p-3 rounded-xl transition-all duration-200 transform hover:scale-110"
                  style={{
                    color: '#fda4af',
                    background: 'rgba(244,63,94,0.12)',
                    border: '1px solid rgba(244,63,94,0.3)',
                    boxShadow: '0 10px 24px -10px rgba(244,63,94,0.5)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.22)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.12)'; }}
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
      <div className="p-8 relative z-10">
        <div className="space-y-8">
          {/* Informations personnelles */}
          <div>
            <h3 className="text-xl font-extrabold tracking-tight text-white mb-6 flex items-center">
              <div
                className="relative mr-3 p-2 rounded-xl"
                style={{
                  background: 'rgba(251,191,36,0.15)',
                  border: '1px solid rgba(251,191,36,0.3)',
                  boxShadow: '0 0 22px -8px rgba(251,191,36,0.5)',
                }}
              >
                <User className="h-6 w-6" style={{ color: '#fcd34d' }} />
              </div>
              Informations personnelles
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-3" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  Prénom
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.firstName}
                    onChange={(e) => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-4 rounded-xl transition-all duration-200 text-white outline-none text-base"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                ) : (
                  <div
                    className="px-4 py-4 rounded-xl border"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                      borderColor: 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <span className="text-white font-bold">
                    {isEditing ? editData.firstName : userData.firstName}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold mb-3" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  Nom
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.lastName}
                    onChange={(e) => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-4 rounded-xl transition-all duration-200 text-white outline-none text-base"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                ) : (
                  <div
                    className="px-4 py-4 rounded-xl border"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                      borderColor: 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <span className="text-white font-bold">
                    {isEditing ? editData.lastName : userData.lastName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-extrabold tracking-tight text-white mb-6 flex items-center">
              <div
                className="relative mr-3 p-2 rounded-xl"
                style={{
                  background: 'rgba(251,191,36,0.15)',
                  border: '1px solid rgba(251,191,36,0.3)',
                  boxShadow: '0 0 22px -8px rgba(251,191,36,0.5)',
                }}
              >
                <Mail className="h-6 w-6" style={{ color: '#fcd34d' }} />
              </div>
              Contact
            </h3>
            
            <div>
              <label className="block text-sm font-bold mb-3" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Adresse email
              </label>
              <div
                className="px-4 py-4 rounded-xl border"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <span className="text-white font-bold">
                {userData.email}
                </span>
              </div>
              <p className="text-xs mt-2 flex items-center font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>
                <Settings className="h-3 w-3 mr-1" />
                L'email ne peut pas être modifié
              </p>

              {/* Sécurité / Mot de passe */}
              <div className="mt-6">
                <label className="block text-sm font-bold mb-3" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  Sécurité du compte
                </label>
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    background: 'linear-gradient(180deg, rgba(16,185,129,0.10) 0%, rgba(16,185,129,0.03) 100%)',
                    borderColor: 'rgba(16,185,129,0.2)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#34d399' }} />
                    <div>
                      <div className="font-bold text-white mb-1">
                        Mot de passe
                      </div>
                      <div className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        Pour modifier votre mot de passe, veuillez contacter l'administrateur de la plateforme. Il vous accompagnera dans la procédure de réinitialisation sécurisée.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Personnalisation des invitations */}
          <div>
            <h3 className="text-xl font-extrabold tracking-tight text-white mb-6 flex items-center">
              <div
                className="relative mr-3 p-2 rounded-xl"
                style={{
                  background: 'rgba(251,191,36,0.15)',
                  border: '1px solid rgba(251,191,36,0.3)',
                  boxShadow: '0 0 22px -8px rgba(251,191,36,0.5)',
                }}
              >
                <Settings className="h-6 w-6" style={{ color: '#fcd34d' }} />
              </div>
              Personnalisation des invitations
            </h3>
            
            <div>
              <label className="block text-sm font-bold mb-3" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Message d'invitation par défaut
              </label>
              <p className="text-sm mb-4 italic" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Ce texte apparaîtra dans vos invitations WhatsApp avant le lien.
              </p>
              {isEditing ? (
                <textarea
                  value={editData.invitationMessage}
                  onChange={(e) => setEditData(prev => ({ ...prev, invitationMessage: e.target.value }))}
                  placeholder="Nous sommes heureux de vous inviter à célébrer ce moment avec nous."
                  rows={4}
                  className="w-full px-4 py-4 rounded-xl transition-all duration-200 text-white outline-none resize-none"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              ) : (
                <div
                  className="px-4 py-4 rounded-xl border"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <span className="text-white font-bold whitespace-pre-wrap">
                    {userData.invitationMessage || "Nous sommes heureux de vous inviter à célébrer ce moment avec nous."}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Informations du compte */}
          <div>
            <h3 className="text-xl font-extrabold tracking-tight text-white mb-6 flex items-center">
              <div
                className="relative mr-3 p-2 rounded-xl"
                style={{
                  background: 'rgba(251,191,36,0.15)',
                  border: '1px solid rgba(251,191,36,0.3)',
                  boxShadow: '0 0 22px -8px rgba(251,191,36,0.5)',
                }}
              >
                <Calendar className="h-6 w-6" style={{ color: '#fcd34d' }} />
              </div>
              Informations du compte
            </h3>
            
            <div className="max-w-md">
              <div>
                <label className="block text-sm font-bold mb-3" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  Membre depuis
                </label>
                <div
                  className="px-6 py-4 rounded-xl border"
                  style={{
                    background: 'linear-gradient(180deg, rgba(16,185,129,0.10) 0%, rgba(16,185,129,0.03) 100%)',
                    borderColor: 'rgba(16,185,129,0.2)',
                  }}
                >
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-3" style={{ color: '#34d399' }} />
                    <span className="text-white font-bold text-lg">
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
      <div
        className="p-8 border-t relative z-10"
        style={{
          borderColor: 'rgba(255,255,255,0.06)',
          background: 'linear-gradient(0deg, rgba(244,63,94,0.06) 0%, rgba(255,255,255,0.01) 100%)',
        }}
      >
        <button
          onClick={onLogout}
          className="w-full py-4 rounded-xl transition-all duration-300 font-extrabold flex items-center justify-center transform hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden group"
          style={{
            background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
            color: '#ffffff',
            border: '1px solid rgba(248,113,113,0.5)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 20px 50px -12px rgba(220,38,38,0.7)',
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
          />
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
