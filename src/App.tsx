import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './components/Header';
import NewHeroSection from './components/NewHeroSection';
import ServicesSection from './components/ServicesSection';
import WhyChooseSection from './components/WhyChooseSection';
import DemoVideoSection from './components/DemoVideoSection';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import WeddingTemplate from './components/WeddingTemplate';
import AuthModal from './components/AuthModal';
import InvitationPreview from './components/InvitationPreview';
import GuestCheckin from './components/GuestCheckin';
import ProtectedRoute from './components/ProtectedRoute';
import TestimonialsSection from './components/TestimonialsSection';
import { AuthProvider, useAuth } from './components/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { useTheme } from './contexts/ThemeContext';
import { useLanguage } from './contexts/LanguageContext';
import { cn } from './lib/utils';

interface TemplateData {
  id: string;
  name: string;
  category: string;
  backgroundImage: string;
  title: string;
  invitationText: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventAddress?: string;
  eventLat?: number;
  eventLng?: number;
  drinkOptions: string[];
  features: string[];
}

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  role?: 'admin' | 'user';
}

function AppContent() {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const { language } = useLanguage();
  const [showDashboard, setShowDashboard] = useState(false);
  const [showWeddingTemplate, setShowWeddingTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(null);
  const [pendingTemplate, setPendingTemplate] = useState<TemplateData | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Appliquer la classe dark au document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Appliquer la langue au document
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const handleLogin = () => {
    if (isAuthenticated) {
      setShowDashboard(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (pendingTemplate) {
      setSelectedTemplate(pendingTemplate);
      setPendingTemplate(null);
    }
    setShowDashboard(true);
  };

  const handleLogout = async () => {
    await logout();
    setShowDashboard(false);
    setShowWeddingTemplate(false);
    setSelectedTemplate(null);
    setPendingTemplate(null);
  };

  const handleTemplateSelection = (templateData: TemplateData) => {
    if (!isAuthenticated) {
      setPendingTemplate(templateData);
      setShowAuthModal(true);
      return;
    }
    setSelectedTemplate(templateData);
    setShowWeddingTemplate(false);
    setShowDashboard(true);
  };

  if (showDashboard) {
    return (
      <ProtectedRoute>
        <Dashboard 
          selectedTemplate={selectedTemplate} 
          userData={user}
          onLogout={handleLogout}
          onBackToHome={() => setShowDashboard(false)}
        />
      </ProtectedRoute>
    );
  }

  if (showWeddingTemplate) {
    return (
      <WeddingTemplate 
        onBack={() => setShowWeddingTemplate(false)}
        onSelectTemplate={handleTemplateSelection}
        isAuthenticated={isAuthenticated}
      />
    );
  }

  return (
    <div className={cn(
      "min-h-screen font-elegant transition-colors duration-500",
      isDarkMode
        ? "bg-[#0b0f17]"
        : "bg-gradient-to-b from-amber-50 via-white to-amber-50"
    )}>
      <Header 
        onLogin={handleLogin}
      />
      <main>
        <NewHeroSection />
        <ServicesSection 
          onViewWeddingTemplate={() => setShowWeddingTemplate(true)}
        />
        <WhyChooseSection />
        <DemoVideoSection />
        <TestimonialsSection />
      </main>
      <Footer />

      {/* Modal d'authentification */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); setPendingTemplate(null); }}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<AppContent />} />
            <Route path="/invitation/:inviteId" element={<InvitationPreview />} />
            <Route path="/invite/:inviteId" element={<InvitationPreview />} />
            <Route path="/v/:inviteId" element={<InvitationPreview />} />
            <Route path="/i/:inviteId" element={<InvitationPreview />} />
            <Route path="/checkin/:userId" element={
              <ProtectedRoute>
                <GuestCheckin />
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
