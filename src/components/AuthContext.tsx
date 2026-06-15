import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth as useFirebaseAuth, UserData } from '../hooks/useAuth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthContextType {
  user: UserData | null;
  isAuthenticated: boolean;
  emailVerificationSent: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<{ success: boolean; error?: string; user?: UserData; emailVerificationSent?: boolean; message?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resendEmailVerification: () => Promise<{ success: boolean; error?: string; message?: string }>;
  checkEmailVerification: () => Promise<{ success: boolean; error?: string; message?: string }>;
  updateUserProfile: (updates: Partial<Pick<UserData, 'firstName' | 'lastName' | 'invitationMessage'>>) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const firebaseAuth = useFirebaseAuth();

  return (
    <AuthContext.Provider value={firebaseAuth}>
      {children}
    </AuthContext.Provider>
  );
};