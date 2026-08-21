import { useState, useEffect } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  photoURL?: string;
  invitationMessage?: string;
  role?: 'admin' | 'user';
}

const ALLOW_PUBLIC_SIGNUP = (import.meta.env.VITE_ALLOW_PUBLIC_SIGNUP ?? 'false') === 'true';

export const useAuth = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      setError(null);
      console.log('Changement d\'état d\'authentification:', firebaseUser?.email || 'Déconnecté');

      if (firebaseUser) {
        try {
          // Récupérer les données utilisateur depuis Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<UserData, 'id'>;
            setUser({
              id: firebaseUser.uid,
              ...userData
            });
            console.log('Données utilisateur récupérées depuis Firestore');
          } else {
            console.log('Document utilisateur non trouvé, création d\'un profil basique');
            // Si le document n'existe pas, créer un profil basique
            const basicUserData: Omit<UserData, 'id'> = {
              email: firebaseUser.email || '',
              firstName: firebaseUser.displayName?.split(' ')[0] || 'Utilisateur',
              lastName: firebaseUser.displayName?.split(' ')[1] || '',
              createdAt: new Date().toISOString()
            };
            
            // Ajouter photoURL seulement s'il existe
            if (firebaseUser.photoURL) {
              basicUserData.photoURL = firebaseUser.photoURL;
            }
            
            try {
              const newUserDocRef = doc(db, 'users', firebaseUser.uid);
              await setDoc(newUserDocRef, basicUserData);
              console.log('Profil basique créé dans Firestore');
            } catch (firestoreError) {
              console.error('Erreur lors de la création du profil basique:', firestoreError);
              // Continuer même si Firestore échoue
            }
            
            setUser({
              id: firebaseUser.uid,
              ...basicUserData,
              photoURL: firebaseUser.photoURL || undefined
            });
          }
          setFirebaseUser(firebaseUser);
        } catch (error) {
          console.error('Erreur lors de la récupération des données utilisateur:', error);
          
          // Créer un profil temporaire en cas d'erreur Firestore
          console.warn('Création d\'un profil temporaire suite à l\'erreur Firestore');
          const tempUserData: UserData = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            firstName: firebaseUser.displayName?.split(' ')[0] || 'Utilisateur',
            lastName: firebaseUser.displayName?.split(' ')[1] || '',
            createdAt: new Date().toISOString()
          };
          
          // Ajouter photoURL seulement s'il existe pour l'état local
          if (firebaseUser.photoURL) {
            tempUserData.photoURL = firebaseUser.photoURL;
          }
          
          setUser(tempUserData);
          setFirebaseUser(firebaseUser);
        }
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    if (!ALLOW_PUBLIC_SIGNUP) {
      return { success: false, error: 'Les inscriptions sont temporairement fermées.' };
    }
    try {
      setError(null);
      setIsLoading(true);
      console.log('Début de l\'inscription pour:', email);

      // S'assurer que la persistance est configurée avant l'inscription
      await setPersistence(auth, browserLocalPersistence);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const createdFirebaseUser = userCredential.user;
      console.log('Utilisateur Firebase créé:', createdFirebaseUser.uid);

      await updateProfile(createdFirebaseUser, {
        displayName: `${firstName} ${lastName}`
      });
      console.log('Profil Firebase mis à jour');

      const userData: Omit<UserData, 'id'> = {
        email: createdFirebaseUser.email || '',
        firstName,
        lastName,
        createdAt: new Date().toISOString()
      };
      if (createdFirebaseUser.photoURL) {
        userData.photoURL = createdFirebaseUser.photoURL;
      }
      const userDocRef = doc(db, 'users', createdFirebaseUser.uid);
      await setDoc(userDocRef, userData);
      console.log('Document utilisateur créé dans Firestore');

      const newUser: UserData = {
        id: createdFirebaseUser.uid,
        ...userData,
        photoURL: createdFirebaseUser.photoURL || undefined
      };
      setUser(newUser);
      setFirebaseUser(createdFirebaseUser);
      setEmailVerificationSent(false);

      return { success: true, user: newUser };
    } catch {
      const errorMessage = 'Erreur lors de l\'inscription';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const resendEmailVerification = async () => {
    return { success: false, error: 'La vérification par email est désactivée.' };
  };

  const checkEmailVerification = async () => {
    return { success: false, error: 'La vérification par email est désactivée.' };
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      console.log('Tentative de connexion pour:', email);

      // S'assurer que la persistance est configurée avant la connexion
      await setPersistence(auth, browserLocalPersistence);
      
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Connexion Firebase réussie pour:', email);
      
      console.log('Connexion autorisée');
      // L'utilisateur sera automatiquement défini via onAuthStateChanged
      return { success: true };
    } catch {
      const errorMessage = 'Erreur lors de la connexion';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
      setEmailVerificationSent(false);
      return { success: true };
    } catch {
      const errorMessage = 'Erreur lors de la déconnexion';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch {
      const errorMessage = 'Erreur lors de la réinitialisation du mot de passe';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateUserProfile = async (updates: Partial<Pick<UserData, 'firstName' | 'lastName' | 'invitationMessage'>>) => {
    if (!firebaseUser || !user) return { success: false, error: 'Utilisateur non connecté' };

    try {
      setError(null);
      
      // Mettre à jour Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, updates, { merge: true });
      
      // Mettre à jour le profil Firebase si nécessaire
      if (updates.firstName || updates.lastName) {
        const displayName = `${updates.firstName || user.firstName} ${updates.lastName || user.lastName}`;
        await updateProfile(firebaseUser, { displayName });
      }
      
      // Mettre à jour l'état local
      setUser(prev => prev ? { ...prev, ...updates } : null);
      
      return { success: true };
    } catch {
      const errorMessage = 'Erreur lors de la mise à jour du profil';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  return {
    user,
    firebaseUser,
    isAuthenticated: !!user,
    isLoading,
    error,
    emailVerificationSent,
    register,
    login,
    logout,
    resetPassword,
    resendEmailVerification,
    checkEmailVerification,
    updateUserProfile,
    clearError: () => setError(null)
  };
};
