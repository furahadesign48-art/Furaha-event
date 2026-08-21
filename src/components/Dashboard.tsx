import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  Settings, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Crown, 
  Sparkles,
  ChevronDown,
  MessageCircle,
  Wine,
  Download,
  User,
  Table,
  LogOut,
  ArrowLeft,
  X,
  Heart,
  Send,
  Mail,
  MessageSquare,
  Copy,
  Search,
  Filter,
  Tag,
  Check,
  FileSpreadsheet,
  Bell,
  Gamepad2,
  Trophy,
  Save,
  Image as ImageIcon,
  BarChart3,
  RefreshCw,
  Clock,
  Shield
} from 'lucide-react';
import { GameService, AVAILABLE_GAMES, GameConfiguration, LoveQuizConfig, MemoryMatchConfig } from '../services/templateService';
import UserProfile from './UserProfile';
import TableManagement from './TableManagement';
import TemplateCustomization from './TemplateCustomization';
import UpgradeModal from './UpgradeModal';
import ConfirmationModal from './ConfirmationModal';
import DashboardSettings from './DashboardSettings';
import { useTemplates } from '../hooks/useTemplates';
import { useAuth } from './AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { useNotifications } from '../hooks/useNotifications';
import { UserData } from '../hooks/useAuth';
import { notificationService, AppNotification } from '../services/notificationService';
import { storage } from '../config/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import furahaLogo from '../images/FURAHA-GOLD.png';
import GuestMessagesViewer from './GuestMessagesViewer';
import GuestExportModal from './GuestExportModal';
import GuestImportModal from './GuestImportModal';
import UserManagement from './UserManagement';

interface TemplateData {
  id: string;
  name: string;
  category: string;
  backgroundImage: string;
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
  drinkOptions: string[];
  features: string[];
  isPersonalized?: boolean;
  createdAt?: string;
  guestData?: {
    name: string;
    tableNumber: string;
  };
}

interface Guest {
  id: string;
  nom: string;
  table: string;
  etat: 'simple' | 'couple';
  confirmed: boolean;
  category?: string;
}

interface Table {
  id: number;
  docId?: string;
  name: string;
  seats: number;
  assignedGuests: any[];
}

interface DashboardProps {
  selectedTemplate?: TemplateData | null;
  userData: UserData | null;
  onLogout: () => void;
  onBackToHome?: () => void;
}

const Dashboard = ({ selectedTemplate, userData: propUserData, onLogout, onBackToHome }: DashboardProps) => {
  const { user: authUser } = useAuth();
  console.log('=== Dashboard rendering, authUser:', authUser);
  // Use auth user first, then prop user
  const userData = authUser || propUserData;
  const { 
    userModels, 
    userInvites, 
    userTables,
    createInvite, 
    updateInvite, 
    deleteInvite,
    createTable,
    updateTable,
    deleteTable,
    updateUserModel,
    deleteUserModel,
    bulkCreateInvites,
    userCategories,
    createGuestCategory,
    updateGuestCategory,
    deleteGuestCategory,
    bulkDeleteInvites,
    isLoading,
    error,
    refreshUserData
  } = useTemplates();
  
  const { subscription, canCreateInvite, getRemainingInvites } = useSubscription();
  const { permission, requestPermission, isLoading: isNotificationLoading } = useNotifications(userData?.uid);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateData | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [newGuest, setNewGuest] = useState({ nom: '', table: '', etat: 'simple' as 'simple' | 'couple', category: '' });
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categorySearchInput, setCategorySearchInput] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [tableSearchInput, setTableSearchInput] = useState('');
  const [showTableDropdown, setShowTableDropdown] = useState(false);
  const [quickAddCategoryMode, setQuickAddCategoryMode] = useState(false);
  const [quickAddCategoryName, setQuickAddCategoryName] = useState('');
  const [quickAddTableMode, setQuickAddTableMode] = useState(false);
  const [quickAddTableName, setQuickAddTableName] = useState('');
  const [quickAddTableSeats, setQuickAddTableSeats] = useState<number>(8);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [openGuestActionsId, setOpenGuestActionsId] = useState<string | null>(null);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBulkSendModal, setShowBulkSendModal] = useState(false);
  const [sentGuestIds, setSentGuestIds] = useState<string[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('Rappel important');
  const [reminderBody, setReminderBody] = useState('Ne manquez pas notre événement !');
  const [reminderUrl, setReminderUrl] = useState('');
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  
  // États pour la recherche et le tri des invités
  const [guestSearchTerm, setGuestSearchTerm] = useState('');
  const [guestFilterStatus, setGuestFilterStatus] = useState<'all' | 'confirmed' | 'pending'>('all');
  const [guestFilterCategory, setGuestFilterCategory] = useState<string>('all');
  const [guestSortBy, setGuestSortBy] = useState<'name' | 'table' | 'category'>('name');
  const [guestFilterTable, setGuestFilterTable] = useState<string>('all');
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // États pour la gestion des jeux
  const [selectedModelForGames, setSelectedModelForGames] = useState<string | null>(null);
  const [games, setGames] = useState<GameConfiguration[]>([]);
  const [editingGame, setEditingGame] = useState<GameConfiguration | null>(null);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [isUploadingPuzzle, setIsUploadingPuzzle] = useState(false);
  const [gameResults, setGameResults] = useState<Record<string, any[]>>({}); // key is gameId, value is list of results
  const [selectedGameForResults, setSelectedGameForResults] = useState<string | null>(null);

  // Extraire toutes les catégories uniques présentes dans la liste des invités (pour inclure celles d'Excel)
  const availableCategories = useMemo(() => {
    const guestCats = guests
      .map(g => g.category)
      .filter((cat): cat is string => !!cat && cat.trim() !== '');
    
    const uniqueGuestCats = Array.from(new Set(guestCats));
    const combined = [...userCategories.map(c => c.name)];
    
    uniqueGuestCats.forEach(cat => {
      if (!combined.includes(cat)) combined.push(cat);
    });
    
    return combined.sort();
  }, [guests, userCategories]);

  // Extraire toutes les tables uniques présentes dans la liste des invités (pour inclure celles d'Excel)
  const availableTables = useMemo(() => {
    const guestTables = guests
      .map(g => g.table)
      .filter((t): t is string => !!t && t !== 'Non assigné' && t.trim() !== '');
    
    const uniqueGuestTables = Array.from(new Set(guestTables));
    const combined = tables.map(t => ({ name: t.name, seats: t.seats, id: t.id }));
    
    uniqueGuestTables.forEach(tableName => {
      if (!combined.find(t => t.name === tableName)) {
        combined.push({ name: tableName, seats: 0, id: Number(Date.now() + Math.random()) });
      }
    });
    
    return combined.sort((a, b) => a.name.localeCompare(b.name));
  }, [guests, tables]);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
    isLoading: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger',
    isLoading: false
  });
  const toastTimer = React.useRef<number | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string, duration = 3000) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ type, message });
    toastTimer.current = window.setTimeout(() => {
      setToast(null);
      toastTimer.current = null;
    }, duration);
  };

  // Synchroniser les données avec les hooks
  useEffect(() => {
    if (userInvites) {
      const formattedGuests = userInvites.map(invite => ({
        id: invite.id,
        nom: invite.nom,
        table: invite.table,
        etat: invite.etat,
        confirmed: invite.confirmed,
        category: invite.category
      }));
      setGuests(formattedGuests);
    }
  }, [userInvites]);

  useEffect(() => {
    if (userTables) {
      const formattedTables = userTables.map(table => ({
        id: table.id,
        docId: table.docId,
        name: table.name,
        seats: table.seats,
        assignedGuests: table.assignedGuests || []
      }));
      setTables(formattedTables);
    }
  }, [userTables]);

  // Rafraîchir les données au montage
  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  // Souscrire aux notifications
  useEffect(() => {
    if (userData?.uid) {
      const unsubscribe = notificationService.subscribeToNotifications(userData.uid, (newNotifications) => {
        setNotifications(newNotifications);
      });
      return () => unsubscribe();
    }
  }, [userData?.uid]);

  // Initialiser le modèle sélectionné pour les jeux
  useEffect(() => {
    if (userModels.length > 0 && !selectedModelForGames) {
      setSelectedModelForGames(userModels[0].id);
    }
  }, [userModels]);

  // Charger les jeux et leurs résultats quand le modèle sélectionné change
  const loadGames = async (modelId: string) => {
    const userId = userData?.id;
    console.log('=== loadGames userId:', userId);
    if (!userId) return;
    setIsLoadingGames(true);
    try {
      console.log('=== loadGames called for modelId:', modelId);
      const loadedGames = await GameService.getModelGames(userId, modelId);
      console.log('=== loadedGames:', loadedGames);
      setGames(loadedGames);
      
      // Load results for each game
      const resultsMap: Record<string, any[]> = {};
      for (const game of loadedGames) {
        if (game.type === 'love-quiz' || game.type === 'memory-match' || game.type === 'catch-love') {
          try {
            const results = await GameService.getPuzzleResults(userId, modelId, game.id);
            resultsMap[game.id] = results;
          } catch (err) {
            console.error(`Error loading results for game ${game.id}`, err);
            resultsMap[game.id] = [];
          }
        }
      }
      setGameResults(resultsMap);
      
      // Auto add love-quiz game if no games are present
      if (loadedGames.length === 0) {
        console.log('=== No games, adding love-quiz...');
        await GameService.addGameToModel(userId, modelId, 'love-quiz');
        const updatedGames = await GameService.getModelGames(userId, modelId);
        console.log('=== updatedGames:', updatedGames);
        setGames(updatedGames);
        
        // Load results for the new love-quiz game
        if (updatedGames.length > 0) {
          const newResults = await GameService.getPuzzleResults(userId, modelId, updatedGames[0].id);
          setGameResults({ [updatedGames[0].id]: newResults });
        }
      }
    } catch (error) {
      console.error('Erreur chargement des jeux:', error);
    } finally {
      setIsLoadingGames(false);
    }
  };

  // Auto-select first model when user models are available
  useEffect(() => {
    console.log('=== selectedModelForGames useEffect, userModels:', userModels, 'selectedModelForGames:', selectedModelForGames);
    if (userModels.length > 0 && !selectedModelForGames) {
      console.log('=== Setting selectedModelForGames to:', userModels[0].id);
      setSelectedModelForGames(userModels[0].id);
    }
  }, [userModels]);

  useEffect(() => {
    console.log('=== loadGames useEffect, selectedModelForGames:', selectedModelForGames, 'userData?.id:', userData?.id);
    if (selectedModelForGames && userData?.id) {
      console.log('=== Calling loadGames...');
      loadGames(selectedModelForGames);
    }
  }, [selectedModelForGames, userData?.id]);

  // Gestion des jeux
  const handleAddGame = async (gameType: any) => {
    const userId = userData?.id;
    if (!userId || !selectedModelForGames) return;
    setIsAddingGame(true);
    try {
      await GameService.addGameToModel(userId, selectedModelForGames, gameType);
      await loadGames(selectedModelForGames);
      await refreshUserData();
      showToast('success', 'Jeu ajouté avec succès');
      setShowAddGameModal(false);
    } catch (error: any) {
      console.error('Erreur ajout jeu:', error);
      showToast('error', `Erreur: ${error.message}`);
    } finally {
      setIsAddingGame(false);
    }
  };

  const handleUpdateGame = async (updates: Partial<GameConfiguration>) => {
    const userId = userData?.id;
    if (!userId || !selectedModelForGames || !editingGame) return;
    try {
      await GameService.updateGameConfig(userId, selectedModelForGames, editingGame.id, updates);
      await loadGames(selectedModelForGames);
      setEditingGame(null);
      showToast('success', 'Jeu mis à jour avec succès');
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      showToast('error', 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    const userId = userData?.id;
    if (!userId || !selectedModelForGames) return;
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce jeu ?')) {
      try {
        await GameService.removeGameFromModel(userId, selectedModelForGames, gameId);
        await loadGames(selectedModelForGames);
        await refreshUserData();
        showToast('success', 'Jeu supprimé avec succès');
      } catch (error) {
        console.error('Erreur suppression:', error);
        showToast('error', 'Erreur lors de la suppression');
      }
    }
  };
  
  const refreshGameResults = async (gameId: string) => {
    const userId = userData?.id;
    if (!userId || !selectedModelForGames) return;
    try {
      const results = await GameService.getPuzzleResults(userId, selectedModelForGames, gameId);
      setGameResults(prev => ({ ...prev, [gameId]: results }));
      showToast('success', 'Classement mis à jour');
    } catch (err) {
      console.error('Erreur lors du rafraîchissement:', err);
      showToast('error', 'Erreur lors du rafraîchissement');
    }
  };

  const renderGames = () => {
    console.log('=== renderGames games:', games);
    const memoryMatchGame = games.find(g => g.type === 'memory-match');
    console.log('=== renderGames memoryMatchGame:', memoryMatchGame);
    
    return (
      <div className="animate-fade-in space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
          <div>
            <h3 className="text-lg md:text-2xl font-extrabold tracking-tight text-white">
              Configuration des Jeux
            </h3>
            <p className="text-xs md:text-sm text-white/55 mt-1">Configurez les jeux pour vos invités</p>
          </div>
        </div>

        {/* Sélection du modèle */}
        <div className="relative rounded-lg md:rounded-2xl p-3 md:p-6 overflow-hidden border group"
             style={{
               background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
               borderColor: 'rgba(255,255,255,0.08)',
               boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(251,191,36,0.04) inset',
               transition: 'all 400ms cubic-bezier(0.22,1,0.36,1)',
             }}
             onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(251,191,36,0.22)'; }}
             onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
        >
          <div aria-hidden className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[92%] h-[40%] pointer-events-none blur-3xl opacity-55"
               style={{ background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.18) 0%, rgba(251,191,36,0.05) 38%, rgba(251,191,36,0) 70%)' }}></div>
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 relative z-10">
            <div className="p-1.5 md:p-2 rounded-lg flex items-center justify-center"
                 style={{
                   background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                   boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 8px 20px -8px rgba(251,191,36,0.65)',
                 }}>
              <Gamepad2 className="h-4 md:h-5 w-4 md:w-5 text-[#0b0f17]" />
            </div>
            <h4 className="font-semibold text-white text-sm md:text-base">Modèle sélectionné</h4>
          </div>
          <div className="flex flex-wrap gap-1.5 md:gap-2 relative z-10">
            {userModels.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  console.log('=== Model button clicked:', model.id);
                  setSelectedModelForGames(model.id);
                }}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl border-2 transition-all duration-300 font-medium text-xs md:text-sm ${
                  selectedModelForGames === model.id ? '' : ''
                }`}
                style={{
                  borderColor: selectedModelForGames === model.id ? 'rgba(251,191,36,0.6)' : 'rgba(255,255,255,0.08)',
                  background: selectedModelForGames === model.id ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.02)',
                  color: selectedModelForGames === model.id ? '#fcd34d' : 'rgba(255,255,255,0.75)',
                }}
              >
                {model.name}
              </button>
            ))}
          </div>
        </div>

        {isLoadingGames ? (
          <div className="relative rounded-lg md:rounded-2xl p-3 md:p-6 flex items-center justify-center py-8 md:py-12 overflow-hidden border"
               style={{
                 background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
                 borderColor: 'rgba(255,255,255,0.08)',
               }}>
            <div className="w-8 md:w-10 h-8 md:h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {/* Love Quiz Game */}
            {(() => {
              const loveQuizGame = games.find(g => g.type === 'love-quiz');
              if (!loveQuizGame) return null;
              return (
                <div className="relative rounded-lg md:rounded-2xl p-3 md:p-6 overflow-hidden border group"
                     style={{
                       background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
                       borderColor: 'rgba(255,255,255,0.08)',
                       boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(236,72,153,0.04) inset',
                       transition: 'all 400ms cubic-bezier(0.22,1,0.36,1)',
                     }}
                     onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(236,72,153,0.28)'; }}
                     onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <div aria-hidden className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-[88%] h-[45%] pointer-events-none blur-3xl opacity-60"
                       style={{ background: 'radial-gradient(ellipse at center, rgba(236,72,153,0.20) 0%, rgba(236,72,153,0.05) 38%, rgba(236,72,153,0) 70%)' }}></div>
                  <div className="flex flex-wrap items-center justify-between gap-2 md:gap-0 mb-4 md:mb-6 relative z-10">
                    <h4 className="font-semibold text-white flex items-center gap-1.5 md:gap-2 text-sm md:text-base">
                      <Heart className="h-4 md:h-5 w-4 md:w-5 text-rose-400 fill-rose-400" />
                      Love Quiz
                    </h4>
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      <button
                        onClick={() => setSelectedGameForResults(selectedGameForResults === loveQuizGame.id ? null : loveQuizGame.id)}
                        className="text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl transition-all duration-300 font-semibold flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                        style={{
                          background: 'linear-gradient(180deg, #3b82f6 0%, #4f46e5 100%)',
                          boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 0 0 1px rgba(59,130,246,0.5), 0 8px 20px -8px rgba(59,130,246,0.6)',
                        }}
                      >
                        <Trophy className="h-3.5 md:h-4 w-3.5 md:w-4" />
                        {selectedGameForResults === loveQuizGame.id ? 'Cacher' : 'Classement'}
                      </button>
                      <button
                        onClick={() => setEditingGame(loveQuizGame)}
                        className="text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl transition-all duration-300 font-semibold flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                        style={{
                          background: 'linear-gradient(180deg, #f43f5e 0%, #db2777 100%)',
                          boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 0 0 1px rgba(244,63,94,0.5), 0 8px 20px -8px rgba(244,63,94,0.6)',
                        }}
                      >
                        <Edit className="h-3.5 md:h-4 w-3.5 md:w-4" />
                        Config
                      </button>
                      <button
                        onClick={() => handleDeleteGame(loveQuizGame.id)}
                        className="text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl transition-all duration-300 font-semibold flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                        style={{
                          background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
                          boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 0 0 1px rgba(239,68,68,0.5), 0 8px 20px -8px rgba(239,68,68,0.6)',
                        }}
                      >
                        <Trash2 className="h-3.5 md:h-4 w-3.5 md:w-4" />
                        Suppr
                      </button>
                    </div>
                  </div>

                  <div className="relative rounded-lg md:rounded-xl border p-3 md:p-4"
                       style={{
                         background: 'linear-gradient(180deg, rgba(236,72,153,0.06), rgba(236,72,153,0.02))',
                         borderColor: 'rgba(255,255,255,0.06)',
                       }}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                          <h5 className="font-semibold text-white text-sm md:text-base">
                            {loveQuizGame.title}
                          </h5>
                          <span className={`px-1.5 md:px-2 py-0.5 rounded-full text-[9px] md:text-xs font-medium ${
                            loveQuizGame.isEnabled ? '' : ''
                          }`}
                          style={{
                            background: loveQuizGame.isEnabled ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                            color: loveQuizGame.isEnabled ? '#6ee7b7' : 'rgba(255,255,255,0.55)',
                            border: loveQuizGame.isEnabled ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(255,255,255,0.08)',
                          }}>
                            {loveQuizGame.isEnabled ? '✓' : '✗'}
                          </span>
                        </div>
                        <p className="text-xs md:text-sm text-white/60 mb-2 md:mb-3">{loveQuizGame.description}</p>
                        {(loveQuizGame as LoveQuizConfig).questions && (loveQuizGame as LoveQuizConfig).questions.length > 0 && (
                          <div className="mt-1.5 md:mt-2 space-y-1.5 md:space-y-2">
                            {(loveQuizGame as LoveQuizConfig).questions.slice(0, 2).map((q, i) => (
                              <div key={i} className="p-1.5 md:p-2 rounded-lg border text-xs md:text-sm text-white/75"
                                   style={{
                                     background: 'rgba(255,255,255,0.03)',
                                     borderColor: 'rgba(255,255,255,0.06)',
                                   }}>
                                {i+1}. {q.question}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Leaderboard section */}
                  {selectedGameForResults === loveQuizGame.id && (
                    <div className="mt-4 md:mt-6 border-t pt-3 md:pt-4 relative z-10"
                         style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center justify-between mb-3 md:mb-4">
                        <h5 className="font-semibold text-white flex items-center gap-1.5 md:gap-2 text-sm md:text-base">
                          <Trophy className="h-4 md:h-5 w-4 md:w-5" style={{ color: '#fcd34d' }} />
                          Classement
                        </h5>
                        <button
                          onClick={() => refreshGameResults(loveQuizGame.id)}
                          className="p-1.5 md:p-2 rounded-lg transition-all flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                          style={{
                            background: 'rgba(59,130,246,0.12)',
                            color: '#93c5fd',
                            border: '1px solid rgba(59,130,246,0.22)',
                          }}
                        >
                          <RefreshCw className="h-3.5 md:h-4 w-3.5 md:w-4" />
                          <span className="hidden sm:inline text-xs font-semibold">Rafraîchir</span>
                        </button>
                      </div>
                      {gameResults[loveQuizGame.id] && gameResults[loveQuizGame.id].length > 0 ? (
                        <div className="space-y-1.5 md:space-y-2">
                          {gameResults[loveQuizGame.id].sort((a, b) => (b.score || 0) - (a.score || 0)).map((result, index) => (
                            <div 
                              key={result.id} 
                              className="flex items-center justify-between p-2 md:p-3 rounded-lg md:rounded-xl border"
                              style={{
                                background: 'rgba(255,255,255,0.03)',
                                borderColor: 'rgba(255,255,255,0.06)',
                              }}
                            >
                              <div className="flex items-center gap-2 md:gap-3">
                                <div className={`w-6 md:w-8 h-6 md:h-8 rounded-full flex items-center justify-center font-bold text-[10px] md:text-xs ${
                                  index === 0 ? 'bg-yellow-400 text-yellow-900' : 
                                  index === 1 ? 'bg-gray-400 text-gray-900' : 
                                  index === 2 ? 'bg-orange-400 text-orange-900' : 
                                  'bg-slate-300 text-slate-700'
                                }`}>
                                  {index + 1}
                                </div>
                                <span className="font-semibold text-white/85 text-xs md:text-sm">
                                  {result.guestName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 md:gap-2">
                                <span className="font-semibold text-white/75 text-xs md:text-sm">
                                  {result.score || 0}/{(loveQuizGame as LoveQuizConfig).questions.length}
                                </span>
                                <button
                                  onClick={async () => {
                                    if (!userData?.id || !selectedModelForGames) return;
                                    try {
                                      await GameService.deleteGuestGameResults(userData.id, selectedModelForGames, loveQuizGame.id, result.guestName);
                                      await loadGames(selectedModelForGames);
                                      showToast('success', 'Résultat de l\'invité réinitialisé');
                                    } catch (err) {
                                      console.error('Erreur lors de la réinitialisation:', err);
                                      showToast('error', 'Erreur lors de la réinitialisation');
                                    }
                                  }}
                                  className="p-1 md:p-1.5 rounded-lg transition-all"
                                  style={{
                                    background: 'rgba(239,68,68,0.12)',
                                    color: '#fca5a5',
                                    border: '1px solid rgba(239,68,68,0.2)',
                                  }}
                                >
                                  <Trash2 className="h-3 md:h-3.5 w-3 md:w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white/50 text-xs md:text-sm text-center py-3 md:py-4">
                          Aucun joueur n'a encore terminé ce jeu.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Add Love Quiz button if not present */}
            {!games.find(g => g.type === 'love-quiz') && (
              <div className="relative rounded-2xl p-6 text-center overflow-hidden border group"
                   style={{
                     background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
                     borderColor: 'rgba(255,255,255,0.08)',
                     boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7)',
                     transition: 'all 400ms cubic-bezier(0.22,1,0.36,1)',
                   }}
                   onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(236,72,153,0.28)'; }}
                   onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                <div className="text-2xl text-rose-400/70 mb-3">💕</div>
                <h4 className="font-semibold text-white mb-2">Love Quiz</h4>
                <p className="text-white/55 mb-4">Ajoutez le quiz sur le couple à votre modèle</p>
                <button
                  onClick={async () => {
                    try {
                      const userId = userData?.id;
                      if (!userId || !selectedModelForGames) {
                        return;
                      }
                      await GameService.addGameToModel(userId, selectedModelForGames, 'love-quiz');
                      await loadGames(selectedModelForGames);
                    } catch (error) {
                      console.error('=== Error adding love quiz:', error);
                      alert('Erreur lors de l\'ajout du love quiz : ' + (error as Error).message);
                    }
                  }}
                  className="text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold flex items-center gap-2 mx-auto"
                  style={{
                    background: 'linear-gradient(180deg, #f43f5e 0%, #db2777 100%)',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(244,63,94,0.55), 0 10px 24px -10px rgba(244,63,94,0.65)',
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Ajouter Love Quiz
                </button>
              </div>
            )}

            {/* Memory Match Game */}
            {memoryMatchGame ? (
              <div className="relative rounded-2xl p-6 overflow-hidden border group"
                   style={{
                     background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
                     borderColor: 'rgba(255,255,255,0.08)',
                     boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(236,72,153,0.04) inset',
                     transition: 'all 400ms cubic-bezier(0.22,1,0.36,1)',
                   }}
                   onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(236,72,153,0.28)'; }}
                   onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                <div aria-hidden className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-[88%] h-[45%] pointer-events-none blur-3xl opacity-55"
                     style={{ background: 'radial-gradient(ellipse at center, rgba(236,72,153,0.18) 0%, rgba(236,72,153,0.05) 38%, rgba(236,72,153,0) 70%)' }}></div>
                <div className="flex flex-wrap items-center justify-between mb-6 gap-3 relative z-10">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <Heart className="h-5 w-5 text-pink-400 fill-pink-400" />
                    Love Memory Match
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedGameForResults(selectedGameForResults === memoryMatchGame.id ? null : memoryMatchGame.id)}
                      className="text-white px-4 py-2 rounded-xl transition-all duration-300 font-semibold flex items-center gap-2 text-sm"
                      style={{
                        background: 'linear-gradient(180deg, #3b82f6 0%, #4f46e5 100%)',
                        boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 0 0 1px rgba(59,130,246,0.5), 0 8px 20px -8px rgba(59,130,246,0.6)',
                      }}
                    >
                      <Trophy className="h-4 w-4" />
                      {selectedGameForResults === memoryMatchGame.id ? 'Cacher' : 'Classement'}
                    </button>
                    <button
                      onClick={() => setEditingGame(memoryMatchGame)}
                      className="text-white px-4 py-2 rounded-xl transition-all duration-300 font-semibold flex items-center gap-2 text-sm"
                      style={{
                        background: 'linear-gradient(180deg, #ec4899 0%, #db2777 100%)',
                        boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 0 0 1px rgba(236,72,153,0.5), 0 8px 20px -8px rgba(236,72,153,0.6)',
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      Configurer
                    </button>
                    <button
                      onClick={() => handleDeleteGame(memoryMatchGame.id)}
                      className="text-white px-4 py-2 rounded-xl transition-all duration-300 font-semibold flex items-center gap-2 text-sm"
                      style={{
                        background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
                        boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 0 0 1px rgba(239,68,68,0.5), 0 8px 20px -8px rgba(239,68,68,0.6)',
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  </div>
                </div>

                <div className="relative rounded-xl border p-4"
                     style={{
                       background: 'linear-gradient(180deg, rgba(236,72,153,0.06), rgba(236,72,153,0.02))',
                       borderColor: 'rgba(255,255,255,0.06)',
                     }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-semibold text-white">
                          {memoryMatchGame.title}
                        </h5>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium`}
                              style={{
                                background: memoryMatchGame.isEnabled ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                                color: memoryMatchGame.isEnabled ? '#6ee7b7' : 'rgba(255,255,255,0.55)',
                                border: memoryMatchGame.isEnabled ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(255,255,255,0.08)',
                              }}>
                          {memoryMatchGame.isEnabled ? 'Activé' : 'Désactivé'}
                        </span>
                      </div>
                      <p className="text-sm text-white/60 mb-3">{memoryMatchGame.description}</p>
                      {(memoryMatchGame as MemoryMatchConfig).imageUrls && (memoryMatchGame as MemoryMatchConfig).imageUrls.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {(memoryMatchGame as MemoryMatchConfig).imageUrls.slice(0, 4).map((url, i) => (
                            <img 
                              key={i}
                              src={url} 
                              alt={`Memory ${i+1}`} 
                              className="w-full h-12 object-cover rounded-lg border"
                              style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Leaderboard section */}
                {selectedGameForResults === memoryMatchGame.id && (
                  <div className="mt-6 border-t pt-4 relative z-10"
                       style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-semibold text-white flex items-center gap-2">
                        <Trophy className="h-5 w-5" style={{ color: '#fcd34d' }} />
                        Classement
                      </h5>
                      <button
                        onClick={() => refreshGameResults(memoryMatchGame.id)}
                        className="p-2 rounded-lg transition-all flex items-center gap-2"
                        style={{
                          background: 'rgba(59,130,246,0.12)',
                          color: '#93c5fd',
                          border: '1px solid rgba(59,130,246,0.22)',
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span className="text-xs font-semibold">Rafraîchir</span>
                      </button>
                    </div>
                    {gameResults[memoryMatchGame.id] && gameResults[memoryMatchGame.id].length > 0 ? (
                      <div className="space-y-2">
                        {gameResults[memoryMatchGame.id].sort((a, b) => (a.score || 0) - (b.score || 0)).map((result, index) => (
                          <div 
                            key={result.id} 
                            className="flex items-center justify-between p-3 rounded-xl border"
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              borderColor: 'rgba(255,255,255,0.06)',
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                index === 0 ? 'bg-yellow-400 text-yellow-900' : 
                                index === 1 ? 'bg-gray-400 text-gray-900' : 
                                index === 2 ? 'bg-orange-400 text-orange-900' : 
                                'bg-slate-300 text-slate-700'
                              }`}>
                                {index + 1}
                              </div>
                              <span className="font-semibold text-white/85 text-sm">
                                {result.guestName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white/75 text-sm">
                                {(() => {
                                  const seconds = result.score || 0;
                                  const mins = Math.floor(seconds / 60);
                                  const secs = Math.floor(seconds % 60);
                                  return `${mins}:${secs.toString().padStart(2, '0')}`;
                                })()}
                              </span>
                              <button
                                onClick={async () => {
                                  if (!userData?.id || !selectedModelForGames) return;
                                  try {
                                    await GameService.deleteGuestGameResults(userData.id, selectedModelForGames, memoryMatchGame.id, result.guestName);
                                    await loadGames(selectedModelForGames);
                                    showToast('success', 'Résultat réinitialisé');
                                  } catch (err) {
                                    showToast('error', 'Erreur réinitialisation');
                                  }
                                }}
                                className="p-1.5 rounded-lg transition-all"
                                style={{
                                  background: 'rgba(239,68,68,0.12)',
                                  color: '#fca5a5',
                                  border: '1px solid rgba(239,68,68,0.2)',
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/50 text-sm text-center py-4">
                        Aucun joueur n'a encore terminé ce jeu.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative rounded-2xl p-6 text-center overflow-hidden border group"
                   style={{
                     background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
                     borderColor: 'rgba(255,255,255,0.08)',
                     boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7)',
                     transition: 'all 400ms cubic-bezier(0.22,1,0.36,1)',
                   }}
                   onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(236,72,153,0.28)'; }}
                   onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                <div className="text-2xl text-pink-400/70 mb-3">💝</div>
                <h4 className="font-semibold text-white mb-2">Love Memory Match</h4>
                <p className="text-white/55 mb-4">Ajoutez le jeu de memory match à votre modèle</p>
                <button
                  onClick={async () => {
                    try {
                      const userId = userData?.id;
                      if (!userId || !selectedModelForGames) {
                        return;
                      }
                      await GameService.addGameToModel(userId, selectedModelForGames, 'memory-match');
                      await loadGames(selectedModelForGames);
                    } catch (error) {
                      alert('Erreur lors de l\'ajout : ' + (error as Error).message);
                    }
                  }}
                  className="text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold flex items-center gap-2 mx-auto"
                  style={{
                    background: 'linear-gradient(180deg, #ec4899 0%, #db2777 100%)',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(236,72,153,0.55), 0 10px 24px -10px rgba(236,72,153,0.65)',
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Ajouter Memory Match
                </button>
              </div>
            )}

            {/* Catch Love Game */}
            {(() => {
              const catchLoveGame = games.find(g => g.type === 'catch-love');
              if (!catchLoveGame) return null;
              const config = catchLoveGame as any;
              return (
                <div className="relative rounded-lg md:rounded-2xl p-3 md:p-6 overflow-hidden border group"
                     style={{
                       background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
                       borderColor: 'rgba(255,255,255,0.08)',
                       boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(217,70,239,0.04) inset',
                       transition: 'all 400ms cubic-bezier(0.22,1,0.36,1)',
                     }}
                     onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(217,70,239,0.28)'; }}
                     onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <div aria-hidden className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-[88%] h-[45%] pointer-events-none blur-3xl opacity-55"
                       style={{ background: 'radial-gradient(ellipse at center, rgba(217,70,239,0.18) 0%, rgba(251,191,36,0.08) 38%, rgba(217,70,239,0) 70%)' }}></div>
                  <div className="flex flex-wrap items-center justify-between gap-2 md:gap-0 mb-4 md:mb-6 relative z-10">
                    <h4 className="font-semibold text-white flex items-center gap-1.5 md:gap-2 text-sm md:text-base">
                      <Sparkles className="h-4 md:h-5 w-4 md:w-5" style={{ color: '#e879f9' }} />
                      Attrape l'Amour
                    </h4>
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      <button
                        onClick={() => setSelectedGameForResults(selectedGameForResults === catchLoveGame.id ? null : catchLoveGame.id)}
                        className="text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl transition-all duration-300 font-semibold flex items-center gap-1.5 md:gap-2 text-xs md:text-sm hover:brightness-110"
                        style={{
                          background: 'linear-gradient(180deg, #d946ef 0%, #ec4899 50%, #f59e0b 100%)',
                          boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 0 0 1px rgba(217,70,239,0.45), 0 8px 20px -8px rgba(217,70,239,0.55)',
                        }}
                      >
                        <Trophy className="h-3.5 md:h-4 w-3.5 md:w-4" />
                        {selectedGameForResults === catchLoveGame.id ? 'Cacher' : 'Classement'}
                      </button>
                      <button
                        onClick={() => setEditingGame(catchLoveGame)}
                        className="text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl transition-all duration-300 font-semibold flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                        style={{
                          background: 'linear-gradient(180deg, #d946ef 0%, #7c3aed 100%)',
                          boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 0 0 1px rgba(217,70,239,0.5), 0 8px 20px -8px rgba(217,70,239,0.6)',
                        }}
                      >
                        <Edit className="h-3.5 md:h-4 w-3.5 md:w-4" />
                        Config
                      </button>
                      <button
                        onClick={() => handleDeleteGame(catchLoveGame.id)}
                        className="text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl transition-all duration-300 font-semibold flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                        style={{
                          background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
                          boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 0 0 1px rgba(239,68,68,0.5), 0 8px 20px -8px rgba(239,68,68,0.6)',
                        }}
                      >
                        <Trash2 className="h-3.5 md:h-4 w-3.5 md:w-4" />
                        Suppr
                      </button>
                    </div>
                  </div>

                  <div className="relative rounded-lg md:rounded-xl border p-3 md:p-4"
                       style={{
                         background: 'linear-gradient(180deg, rgba(217,70,239,0.05) 0%, rgba(251,191,36,0.04) 100%)',
                         borderColor: 'rgba(255,255,255,0.06)',
                       }}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2 flex-wrap">
                          <h5 className="font-semibold text-white text-sm md:text-base">
                            {catchLoveGame.title}
                          </h5>
                          <span className="px-1.5 md:px-2 py-0.5 rounded-full text-[9px] md:text-xs font-medium"
                                style={{
                                  background: catchLoveGame.isEnabled ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                                  color: catchLoveGame.isEnabled ? '#6ee7b7' : 'rgba(255,255,255,0.55)',
                                  border: catchLoveGame.isEnabled ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(255,255,255,0.08)',
                                }}>
                            {catchLoveGame.isEnabled ? '✓' : '✗'}
                          </span>
                          <span className="px-1.5 md:px-2 py-0.5 rounded-full text-[9px] md:text-xs font-medium"
                                style={{
                                  background: 'rgba(34,211,238,0.12)',
                                  color: '#67e8f9',
                                  border: '1px solid rgba(34,211,238,0.28)',
                                }}>
                            ⏱ {config.totalGameTime || 45}s
                          </span>
                          <span className="px-1.5 md:px-2 py-0.5 rounded-full text-[9px] md:text-xs font-medium"
                                style={{
                                  background: 'rgba(251,191,36,0.12)',
                                  color: '#fcd34d',
                                  border: '1px solid rgba(251,191,36,0.28)',
                                }}>
                            {config.difficulty === 'easy' ? 'Facile' : config.difficulty === 'hard' ? 'Difficile' : 'Normal'}
                          </span>
                        </div>
                        <p className="text-xs md:text-sm text-white/60 mb-1.5 md:mb-2">{catchLoveGame.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {['❤️','💖','💍','💑','💐','🍾','💔','💣'].map((e, i) => (
                            <span key={i} className="text-lg md:text-xl opacity-90">{e}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedGameForResults === catchLoveGame.id && (
                    <div className="mt-4 md:mt-6 border-t pt-3 md:pt-4 relative z-10"
                         style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center justify-between mb-3 md:mb-4">
                        <h5 className="font-semibold text-white flex items-center gap-1.5 md:gap-2 text-sm md:text-base">
                          <Trophy className="h-4 md:h-5 w-4 md:w-5" style={{ color: '#fcd34d' }} />
                          Classement
                        </h5>
                        <button
                          onClick={() => refreshGameResults(catchLoveGame.id)}
                          className="p-1.5 md:p-2 rounded-lg transition-all flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                          style={{
                            background: 'rgba(217,70,239,0.12)',
                            color: '#e879f9',
                            border: '1px solid rgba(217,70,239,0.22)',
                          }}
                        >
                          <RefreshCw className="h-3.5 md:h-4 w-3.5 md:w-4" />
                          <span className="hidden sm:inline text-xs font-semibold">Rafraîchir</span>
                        </button>
                      </div>
                      {gameResults[catchLoveGame.id] && gameResults[catchLoveGame.id].length > 0 ? (
                        <div className="space-y-1.5 md:space-y-2">
                          {[...gameResults[catchLoveGame.id]].sort((a, b) => (b.score || 0) - (a.score || 0)).map((result, index) => (
                            <div
                              key={result.id}
                              className="flex items-center justify-between p-2 md:p-3 rounded-lg md:rounded-xl border"
                              style={{
                                background: 'rgba(255,255,255,0.03)',
                                borderColor: 'rgba(255,255,255,0.06)',
                              }}
                            >
                              <div className="flex items-center gap-2 md:gap-3">
                                <div className={`w-6 md:w-8 h-6 md:h-8 rounded-full flex items-center justify-center font-bold text-[10px] md:text-xs ${
                                  index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                  index === 1 ? 'bg-gray-400 text-gray-900' :
                                  index === 2 ? 'bg-orange-400 text-orange-900' :
                                  'bg-slate-300 text-slate-700'
                                }`}>
                                  {index + 1}
                                </div>
                                <span className="font-semibold text-white/85 text-xs md:text-sm truncate max-w-[180px]">
                                  {result.guestName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 md:gap-2">
                                <span className="font-bold text-sm md:text-base tabular-nums" style={{ color: '#fda4af' }}>
                                  {result.score || 0} pts
                                </span>
                                <button
                                  onClick={async () => {
                                    if (!userData?.id || !selectedModelForGames) return;
                                    try {
                                      await GameService.deleteGuestGameResults(userData.id, selectedModelForGames, catchLoveGame.id, result.guestName);
                                      await loadGames(selectedModelForGames);
                                      showToast('success', 'Résultat réinitialisé');
                                    } catch (err) {
                                      showToast('error', 'Erreur réinitialisation');
                                    }
                                  }}
                                  className="p-1 md:p-1.5 rounded-lg transition-all"
                                  style={{
                                    background: 'rgba(239,68,68,0.12)',
                                    color: '#fca5a5',
                                    border: '1px solid rgba(239,68,68,0.2)',
                                  }}
                                >
                                  <Trash2 className="h-3 md:h-3.5 w-3 md:w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white/50 text-xs md:text-sm text-center py-3 md:py-4">
                          Aucun joueur n'a encore terminé ce jeu.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Add Catch Love button if not present */}
            {!games.find(g => g.type === 'catch-love') && (
              <div className="relative rounded-2xl p-6 text-center overflow-hidden border group"
                   style={{
                     background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
                     borderColor: 'rgba(255,255,255,0.08)',
                     boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7)',
                     transition: 'all 400ms cubic-bezier(0.22,1,0.36,1)',
                   }}
                   onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(217,70,239,0.28)'; }}
                   onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                <div className="text-2xl mb-3" style={{ color: 'rgba(232,121,249,0.7)' }}>💖</div>
                <h4 className="font-semibold text-white mb-2">Attrape l'Amour</h4>
                <p className="text-white/55 mb-4">Jeu de réflexes fun pour les invités</p>
                <button
                  onClick={async () => {
                    try {
                      const userId = userData?.id;
                      if (!userId || !selectedModelForGames) return;
                      await GameService.addGameToModel(userId, selectedModelForGames, 'catch-love');
                      await loadGames(selectedModelForGames);
                    } catch (error) {
                      alert('Erreur lors de l\'ajout : ' + (error as Error).message);
                    }
                  }}
                  className="text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold flex items-center gap-2 mx-auto hover:brightness-110"
                  style={{
                    background: 'linear-gradient(180deg, #d946ef 0%, #ec4899 50%, #f59e0b 100%)',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(217,70,239,0.5), 0 10px 24px -10px rgba(217,70,239,0.6)',
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Ajouter Attrape l'Amour
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal d'édition de jeu */}
        {editingGame && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up border"
                 style={{
                   background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
                   borderColor: 'rgba(255,255,255,0.08)',
                   boxShadow: '0 40px 120px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(251,191,36,0.06) inset',
                 }}>
              <div className={`p-6 border-b flex justify-between items-center rounded-t-2xl`}
                   style={{
                     borderColor: 'rgba(255,255,255,0.06)',
                     background: editingGame.type === 'memory-match'
                       ? 'linear-gradient(135deg, rgba(236,72,153,0.1) 0%, rgba(255,255,255,0) 70%)'
                       : editingGame.type === 'love-quiz'
                       ? 'linear-gradient(135deg, rgba(244,63,94,0.1) 0%, rgba(255,255,255,0) 70%)'
                       : editingGame.type === 'catch-love'
                       ? 'linear-gradient(135deg, rgba(217,70,239,0.12) 0%, rgba(251,191,36,0.06) 50%, rgba(255,255,255,0) 80%)'
                       : 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(255,255,255,0) 70%)',
                   }}>
                <h3 className="text-xl font-extrabold tracking-tight text-white">
                  {editingGame.type === 'memory-match' ? 'Configurer Memory Match' : 
                   editingGame.type === 'love-quiz' ? 'Configurer Love Quiz' : 
                   editingGame.type === 'catch-love' ? 'Configurer Attrape l\'Amour' :
                   'Configurer le Puzzle'}
                </h3>
                <button onClick={() => setEditingGame(null)} className="p-2 rounded-lg transition-all duration-200"
                        style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Titre</label>
                  <input
                    type="text"
                    value={editingGame.title}
                    onChange={(e) => setEditingGame({ ...editingGame, title: e.target.value })}
                    className={`w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 ${
                      editingGame.type === 'memory-match' 
                        ? 'focus:ring-pink-500' 
                        : editingGame.type === 'love-quiz'
                          ? 'focus:ring-rose-500'
                          : editingGame.type === 'catch-love'
                          ? 'focus:ring-fuchsia-500'
                          : 'focus:ring-amber-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    value={editingGame.description}
                    onChange={(e) => setEditingGame({ ...editingGame, description: e.target.value })}
                    className={`w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 ${
                      editingGame.type === 'memory-match' 
                        ? 'focus:ring-pink-500' 
                        : editingGame.type === 'love-quiz'
                          ? 'focus:ring-rose-500'
                          : editingGame.type === 'catch-love'
                          ? 'focus:ring-fuchsia-500'
                          : 'focus:ring-amber-500'
                    } min-h-[100px]`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="game-enabled"
                    checked={editingGame.isEnabled}
                    onChange={(e) => setEditingGame({ ...editingGame, isEnabled: e.target.checked })}
                    className={`w-5 h-5 rounded border-neutral-300 focus:ring-2 ${
                      editingGame.type === 'memory-match' 
                        ? 'text-pink-600 focus:ring-pink-500' 
                        : editingGame.type === 'love-quiz'
                          ? 'text-rose-600 focus:ring-rose-500'
                          : editingGame.type === 'catch-love'
                          ? 'text-fuchsia-600 focus:ring-fuchsia-500'
                          : 'text-amber-600 focus:ring-amber-500'
                    }`}
                  />
                  <label htmlFor="game-enabled" className="text-sm font-medium text-slate-700">Activer le jeu</label>
                </div>

                {/* Config spécifique au jeu */}
                <div className="space-y-4 pt-4 border-t border-neutral-200">
                  {editingGame.type === 'puzzle' ? (
                    <>
                      <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Configuration du Puzzle
                      </h4>
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Image du Puzzle</label>
                        <div className="flex gap-3">
                          <label className={`flex-1 px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-semibold border ${isUploadingPuzzle ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-300' : 'bg-amber-100 text-amber-700 cursor-pointer hover:bg-amber-200 border-amber-300'}`}>
                            {isUploadingPuzzle ? (
                              <>
                                <svg className="animate-spin h-5 w-5 text-amber-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Envoi en cours...
                              </>
                            ) : (
                              <>
                                <ImageIcon className="h-5 w-5" />
                                Importer une image
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={isUploadingPuzzle}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file && userData?.id && !isUploadingPuzzle) {
                                  setIsUploadingPuzzle(true);
                                  try {
                                    // Créer une référence dans Firebase Storage
                                    const storageRef = ref(storage, `users/${userData.id}/puzzles/${Date.now()}-${file.name}`);
                                    
                                    // Lire le fichier en data URL pour l'upload
                                    const reader = new FileReader();
                                    reader.onload = async (event) => {
                                      const dataUrl = event.target?.result as string;
                                      
                                      try {
                                        // Upload vers Firebase Storage
                                        await uploadString(storageRef, dataUrl, 'data_url');
                                        
                                        // Récupérer l'URL de téléchargement
                                        const downloadUrl = await getDownloadURL(storageRef);
                                        
                                        // Mettre à jour la configuration du jeu avec l'URL Storage
                                        setEditingGame({ ...editingGame, imageUrl: downloadUrl } as PuzzleConfig);
                                      } catch (uploadError) {
                                        console.error('Erreur lors de l\'upload (règles Storage):', uploadError);
                                        alert('Impossible d\'uploader l\'image (règles de sécurité). Utilisation de l\'image par défaut.');
                                        // Fallback vers l'image par défaut du puzzle
                                        setEditingGame({ 
                                          ...editingGame, 
                                          imageUrl: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800' 
                                        } as PuzzleConfig);
                                      } finally {
                                        setIsUploadingPuzzle(false);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  } catch (error) {
                                    console.error('Erreur lors de l\'upload de l\'image:', error);
                                    alert('Erreur lors de l\'upload de l\'image.');
                                    setIsUploadingPuzzle(false);
                                  }
                                }
                              }}
                            />
                          </label>
                        </div>
                        {(editingGame as PuzzleConfig).imageUrl && (
                          <div className="mt-3 rounded-xl overflow-hidden border border-neutral-200">
                            <img 
                              src={(editingGame as PuzzleConfig).imageUrl} 
                              alt="Preview" 
                              className="w-full h-40 object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Taille de la grille</label>
                        <select
                          value={(editingGame as PuzzleConfig).gridSize}
                          onChange={(e) => setEditingGame({ ...editingGame, gridSize: Number(e.target.value) as 3 | 4 | 5 } as PuzzleConfig)}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                        >
                          <option value={3}>3x3 (Facile)</option>
                          <option value={4}>4x4 (Moyen)</option>
                          <option value={5}>5x5 (Difficile)</option>
                        </select>
                      </div>
                    </>
                  ) : editingGame.type === 'love-quiz' ? (
                    <>
                      <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Heart className="h-5 w-5" />
                        Configuration Love Quiz
                      </h4>
                      <div className="space-y-4">
                        {/* Temps total du jeu */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Temps total du jeu (secondes)</label>
                          <input
                            type="number"
                            min="30"
                            max="300"
                            value={(editingGame as any).totalGameTime || 60}
                            onChange={(e) => setEditingGame({ ...editingGame, totalGameTime: Number(e.target.value) } as any)}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                          />
                        </div>
                        {/* Questions */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-slate-700">Questions</label>
                            <button
                              onClick={() => {
                                const currentQuestions = (editingGame as any).questions || [];
                                setEditingGame({
                                  ...editingGame,
                                  questions: [
                                    ...currentQuestions,
                                    {
                                      id: `q-${Date.now()}`,
                                      question: '',
                                      options: ['', ''],
                                      correctAnswerIndex: 0
                                    }
                                  ]
                                } as any);
                              }}
                              className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-sm font-semibold hover:bg-rose-200 transition-colors flex items-center gap-1"
                            >
                              <Plus className="h-4 w-4" />
                              Ajouter une question
                            </button>
                          </div>
                          
                          <div className="space-y-4">
                            {((editingGame as any).questions || []).map((q: any, i: number) => (
                              <div key={q.id || i} className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-3">
                                <div className="flex justify-between items-start">
                                  <div className="font-semibold text-slate-700 text-sm">Question {i+1}</div>
                                  <button
                                    onClick={() => {
                                      const currentQuestions = (editingGame as any).questions || [];
                                      setEditingGame({
                                        ...editingGame,
                                        questions: currentQuestions.filter((_: any, idx: number) => idx !== i)
                                      } as any);
                                    }}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={q.question}
                                  onChange={(e) => {
                                    const currentQuestions = (editingGame as any).questions || [];
                                    const newQuestions = [...currentQuestions];
                                    newQuestions[i] = { ...q, question: e.target.value };
                                    setEditingGame({ ...editingGame, questions: newQuestions } as any);
                                  }}
                                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-rose-500 text-sm"
                                  placeholder="Entrez la question"
                                />
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-slate-500">Réponses</span>
                                    {q.options.length < 6 && (
                                      <button
                                        onClick={() => {
                                          const currentQuestions = (editingGame as any).questions || [];
                                          const newQuestions = [...currentQuestions];
                                          const newOptions = [...q.options, ''];
                                          newQuestions[i] = { ...q, options: newOptions };
                                          setEditingGame({ ...editingGame, questions: newQuestions } as any);
                                        }}
                                        className="px-2 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-200 transition-colors flex items-center gap-1"
                                      >
                                        <Plus className="h-3 w-3" />
                                        Ajouter réponse
                                      </button>
                                    )}
                                  </div>
                                  {q.options.map((opt: string, j: number) => (
                                    <div key={j} className="flex gap-2 items-center">
                                      <div className="flex-shrink-0">
                                        <input
                                          type="radio"
                                          name={`correct-${i}`}
                                          checked={q.correctAnswerIndex === j}
                                          onChange={() => {
                                            const currentQuestions = (editingGame as any).questions || [];
                                            const newQuestions = [...currentQuestions];
                                            newQuestions[i] = { ...q, correctAnswerIndex: j };
                                            setEditingGame({ ...editingGame, questions: newQuestions } as any);
                                          }}
                                          className="text-rose-600 focus:ring-rose-500"
                                        />
                                      </div>
                                      <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => {
                                          const currentQuestions = (editingGame as any).questions || [];
                                          const newQuestions = [...currentQuestions];
                                          const newOptions = [...q.options];
                                          newOptions[j] = e.target.value;
                                          newQuestions[i] = { ...q, options: newOptions };
                                          setEditingGame({ ...editingGame, questions: newQuestions } as any);
                                        }}
                                        className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-rose-500 text-sm"
                                        placeholder={`Option ${String.fromCharCode(65 + j)}`}
                                      />
                                      {q.options.length > 2 && (
                                        <button
                                          onClick={() => {
                                            const currentQuestions = (editingGame as any).questions || [];
                                            const newQuestions = [...currentQuestions];
                                            const newOptions = [...q.options];
                                            newOptions.splice(j, 1);
                                            // Adjust correct answer index if needed
                                            let newCorrectIndex = q.correctAnswerIndex;
                                            if (j < q.correctAnswerIndex) {
                                              newCorrectIndex = q.correctAnswerIndex - 1;
                                            } else if (j === q.correctAnswerIndex) {
                                              newCorrectIndex = 0;
                                            }
                                            newQuestions[i] = { ...q, options: newOptions, correctAnswerIndex: newCorrectIndex };
                                            setEditingGame({ ...editingGame, questions: newQuestions } as any);
                                          }}
                                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : editingGame.type === 'catch-love' ? (
                    <>
                      <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-fuchsia-600" />
                        Configuration Attrape l'Amour
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Temps total du jeu (secondes)</label>
                          <input
                            type="number"
                            min="15"
                            max="180"
                            value={(editingGame as any).totalGameTime || 45}
                            onChange={(e) => setEditingGame({ ...editingGame, totalGameTime: Number(e.target.value) } as any)}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-fuchsia-500"
                          />
                          <p className="text-xs text-slate-500 mt-1">Entre 15s et 180s (défaut : 45s)</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Difficulté</label>
                          <select
                            value={(editingGame as any).difficulty || 'normal'}
                            onChange={(e) => setEditingGame({ ...editingGame, difficulty: e.target.value as any } as any)}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-fuchsia-500"
                          >
                            <option value="easy">🌱 Facile (débutant)</option>
                            <option value="normal">⚡ Normal (équilibré)</option>
                            <option value="hard">🔥 Difficile (expert)</option>
                          </select>
                          <p className="text-xs text-slate-500 mt-1">
                            Facile : chute lente / Normal : moyen / Difficile : rapide et intense
                          </p>
                        </div>

                        <div className="bg-gradient-to-r from-rose-50 to-fuchsia-50/50 rounded-xl p-4 border border-fuchsia-200/50">
                          <h5 className="font-semibold text-sm text-slate-800 mb-2">Objets disponibles</h5>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              ['❤️', '+10 pts'],
                              ['💖', '+30 pts'],
                              ['💍', '+50 pts'],
                              ['💑', '+100 pts'],
                              ['💐', '+75 pts'],
                              ['🍾', '+5s temps'],
                              ['💔', '-15 pts ❌'],
                              ['💣', '-30 pts ❌'],
                            ].map(([e, t], i) => (
                              <div key={i} className="rounded-lg border p-2 text-center"
                                   style={{
                                     background: 'rgba(255,255,255,0.02)',
                                     borderColor: 'rgba(255,255,255,0.08)',
                                     boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset',
                                   }}>
                                <div className="text-xl">{e}</div>
                                <div className="text-[10px] font-bold text-white/75 mt-0.5">{t}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Heart className="h-5 w-5" />
                        Configuration Memory Match
                      </h4>
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Images du jeu (ajoutez au moins 4)</label>
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          {(editingGame as MemoryMatchConfig).imageUrls?.map((url, i) => (
                            <div key={i} className="relative">
                              <img src={url} alt={`Image ${i+1}`} className="w-full h-16 object-cover rounded-lg border border-neutral-200" />
                              <button
                                onClick={() => {
                                  const newUrls = [...(editingGame as MemoryMatchConfig).imageUrls];
                                  newUrls.splice(i, 1);
                                  setEditingGame({ ...editingGame, imageUrls: newUrls } as MemoryMatchConfig);
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                        <label className={`flex-1 px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-semibold border ${isUploadingPuzzle ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-300' : 'bg-pink-100 text-pink-700 cursor-pointer hover:bg-pink-200 border-pink-300'}`}>
                          {isUploadingPuzzle ? (
                            <>
                              <svg className="animate-spin h-5 w-5 text-pink-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Envoi en cours...
                            </>
                          ) : (
                            <>
                              <Plus className="h-5 w-5" />
                              Ajouter une image
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            disabled={isUploadingPuzzle}
                            onChange={async (e) => {
                              const files = e.target.files;
                              if (!files || files.length === 0 || !userData?.id) return;
                              
                              setIsUploadingPuzzle(true);
                              const currentUrls = [...((editingGame as MemoryMatchConfig).imageUrls || [])];
                              
                              try {
                                for (let i = 0; i < files.length; i++) {
                                  const file = files[i];
                                  const storageRef = ref(storage, `users/${userData.id}/memory/${Date.now()}-${file.name}`);
                                  
                                  const reader = new FileReader();
                                  const dataUrl = await new Promise<string>((resolve, reject) => {
                                    reader.onload = (event) => resolve(event.target?.result as string);
                                    reader.onerror = reject;
                                    reader.readAsDataURL(file);
                                  });
                                  
                                  await uploadString(storageRef, dataUrl, 'data_url');
                                  const downloadUrl = await getDownloadURL(storageRef);
                                  currentUrls.push(downloadUrl);
                                }
                                
                                setEditingGame({ ...editingGame, imageUrls: currentUrls } as MemoryMatchConfig);
                              } catch (uploadError) {
                                console.error('Erreur lors de l\'upload:', uploadError);
                                alert('Erreur lors de l\'upload des images.');
                              } finally {
                                setIsUploadingPuzzle(false);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </>
                  )}
                  
                  {/* Show Leaderboard pour les jeux */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="show-leaderboard"
                      checked={
                        editingGame.type === 'puzzle' 
                          ? (editingGame as PuzzleConfig).showLeaderboard 
                          : editingGame.type === 'love-quiz'
                            ? (editingGame as any).showLeaderboard
                            : editingGame.type === 'catch-love'
                            ? (editingGame as any).showLeaderboard
                            : (editingGame as MemoryMatchConfig).showLeaderboard
                      }
                      onChange={(e) => {
                        if (editingGame.type === 'puzzle') {
                          setEditingGame({ ...editingGame, showLeaderboard: e.target.checked } as PuzzleConfig);
                        } else if (editingGame.type === 'love-quiz') {
                          setEditingGame({ ...editingGame, showLeaderboard: e.target.checked } as any);
                        } else if (editingGame.type === 'catch-love') {
                          setEditingGame({ ...editingGame, showLeaderboard: e.target.checked } as any);
                        } else {
                          setEditingGame({ ...editingGame, showLeaderboard: e.target.checked } as MemoryMatchConfig);
                        }
                      }}
                      className={`w-5 h-5 rounded border-neutral-300 focus:ring-2 ${
                        editingGame.type === 'memory-match' 
                          ? 'text-pink-600 focus:ring-pink-500' 
                          : editingGame.type === 'love-quiz'
                            ? 'text-rose-600 focus:ring-rose-500'
                            : editingGame.type === 'catch-love'
                            ? 'text-fuchsia-600 focus:ring-fuchsia-500'
                            : 'text-amber-600 focus:ring-amber-500'
                      }`}
                    />
                    <label htmlFor="show-leaderboard" className="text-sm font-medium text-slate-700">Afficher le classement</label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setEditingGame(null)}
                    className="px-4 py-2 rounded-xl border border-neutral-300 text-slate-700 hover:bg-neutral-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleUpdateGame(editingGame)}
                    className={`px-6 py-2 rounded-xl text-white hover:opacity-90 font-semibold flex items-center gap-2 ${
                      editingGame.type === 'memory-match' 
                        ? 'bg-gradient-to-r from-pink-500 to-rose-600' 
                        : editingGame.type === 'love-quiz'
                          ? 'bg-gradient-to-r from-rose-500 to-pink-600'
                          : editingGame.type === 'catch-love'
                          ? 'bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-500'
                          : 'bg-gradient-to-r from-amber-500 to-orange-600'
                    }`}
                  >
                    <Save className="h-4 w-4" />
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleAddGuest = async () => {
    // Vérifier si un invité avec le même nom existe déjà (sauf si c'est l'invité en cours de modification)
    const normalizedNewName = newGuest.nom.trim().toLowerCase();
    const duplicateGuest = guests.find(g => {
      const isSameName = g.nom.trim().toLowerCase() === normalizedNewName;
      const isNotEditingGuest = editingGuestId ? String(g.id) !== String(editingGuestId) : true;
      return isSameName && isNotEditingGuest;
    });

    if (duplicateGuest) {
      showToast('error', `Un invité nommé "${newGuest.nom}" existe déjà.`, 5000);
      return;
    }

    // Vérifier la capacité de la table avant d'ajouter/modifier
    if (newGuest.table && newGuest.table !== 'Non assigné') {
      const targetTable = tables.find(t => t.name === newGuest.table);
      if (targetTable) {
        // Exclure l'invité actuel en cas de modification
        // On s'assure de convertir les IDs en string pour la comparaison
        const tableGuests = guests.filter(g => {
           const isSameTable = g.table === newGuest.table;
           const isNotEditingGuest = editingGuestId ? String(g.id) !== String(editingGuestId) : true;
           return isSameTable && isNotEditingGuest;
        });
        
        const currentOccupiedSeats = tableGuests.reduce((total, guest) => {
          return total + (guest.etat === 'couple' ? 2 : 1);
        }, 0);
        
        const newGuestSeats = newGuest.etat === 'couple' ? 2 : 1;
        
        if (Number(targetTable.seats) > 0 && currentOccupiedSeats + newGuestSeats > Number(targetTable.seats)) {
          showToast('error', `Table "${newGuest.table}" complète (${currentOccupiedSeats}/${targetTable.seats}). Ajout impossible.`, 5000);
          return;
        }
      }
    }

    setIsAddingGuest(true);
    try {
      if (editingGuestId) {
        const success = await updateInvite(editingGuestId, {
          nom: newGuest.nom,
          table: newGuest.table || 'Non assigné',
          etat: newGuest.etat,
          category: newGuest.category
        });

        if (success) {
          setNewGuest({ nom: '', table: '', etat: 'simple', category: '' });
          setEditingGuestId(null);
          closeAddGuestModal();
          await refreshUserData();
          showToast('success', 'Invité modifié avec succès');
        } else {
          showToast('error', 'Erreur lors de la modification');
        }
      } else {
        const inviteId = await createInvite({
          nom: newGuest.nom,
          table: newGuest.table || 'Non assigné',
          etat: newGuest.etat,
          confirmed: false,
          category: newGuest.category
        });

        if (inviteId) {
          setNewGuest({ nom: '', table: '', etat: 'simple', category: '' });
          closeAddGuestModal();
          await refreshUserData();
          showToast('success', 'Invité ajouté avec succès');
        } else {
          showToast('error', 'Erreur lors de l\'ajout');
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
      showToast('error', 'Une erreur est survenue');
    } finally {
      setIsAddingGuest(false);
    }
  };

  const closeAddGuestModal = () => {
    setShowAddGuestModal(false);
    setNewGuest({ nom: '', table: '', etat: 'simple', category: '' });
    setEditingGuestId(null);
    setCategorySearchInput('');
    setTableSearchInput('');
    setQuickAddCategoryMode(false);
    setQuickAddCategoryName('');
    setQuickAddTableMode(false);
    setQuickAddTableName('');
    setQuickAddTableSeats(8);
  };

  const openAddGuestModal = () => {
    setNewGuest({ nom: '', table: '', etat: 'simple', category: '' });
    setEditingGuestId(null);
    setCategorySearchInput('');
    setTableSearchInput('');
    setQuickAddCategoryMode(false);
    setQuickAddCategoryName('');
    setQuickAddTableMode(false);
    setQuickAddTableName('');
    setQuickAddTableSeats(8);
    setShowAddGuestModal(true);
  };

  const openEditGuestModal = (guest: Guest) => {
    setNewGuest({
      nom: guest.nom,
      table: guest.table,
      etat: guest.etat,
      category: guest.category || ''
    });
    setEditingGuestId(guest.id);
    setCategorySearchInput(guest.category || '');
    setTableSearchInput(guest.table || '');
    setQuickAddCategoryMode(false);
    setQuickAddCategoryName('');
    setQuickAddTableMode(false);
    setQuickAddTableName('');
    setQuickAddTableSeats(8);
    setShowAddGuestModal(true);
  };

  const handleDeleteGuest = (guestId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer l\'invité',
      message: 'Êtes-vous sûr de vouloir supprimer cet invité ? Cette action est irréversible.',
      type: 'danger',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          const success = await deleteInvite(guestId);
          if (success) {
            await refreshUserData();
            showToast('success', 'Invité supprimé avec succès');
          } else {
            showToast('error', 'Erreur lors de la suppression');
          }
        } catch (error) {
          console.error('Erreur:', error);
          showToast('error', 'Erreur lors de la suppression');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
        }
      }
    });
  };

  const handleBulkImport = async (parsedGuests: any[]) => {
    if (!subscription) return;
    
    // 1. Check subscription limits
    const remaining = getRemainingInvites();
    if (subscription.plan === 'free' && parsedGuests.length > remaining) {
      showToast('error', `Votre plan gratuit ne permet d'ajouter que ${remaining} invités supplémentaires.`);
      return;
    }

    try {
      // 2. Filter out duplicates (by name)
      const existingNames = new Set(guests.map(g => g.nom.trim().toLowerCase()));
      const uniqueNewGuests = parsedGuests.filter(g => !existingNames.has(g.nom.trim().toLowerCase()));
      
      if (uniqueNewGuests.length === 0) {
        showToast('info', "Tous les invités du fichier existent déjà dans votre liste.");
        setShowImportModal(false);
        return;
      }

      // 3. Prepare data and check table capacities
      const tableOccupancy: Record<string, number> = {};
      // Current occupancy
      guests.forEach(g => {
        if (g.table && g.table !== 'Non assigné') {
          tableOccupancy[g.table] = (tableOccupancy[g.table] || 0) + (g.etat === 'couple' ? 2 : 1);
        }
      });

      const tableCapacities: Record<string, number> = {};
      tables.forEach(t => {
        tableCapacities[t.name] = t.seats;
      });

      const finalNewGuests: any[] = [];
      const overCapacityTables = new Set<string>();

      uniqueNewGuests.forEach(g => {
        const tableName = g.table || 'Non assigné';
        const seatsNeeded = g.etat === 'couple' ? 2 : 1;

        if (tableName !== 'Non assigné' && tableCapacities[tableName]) {
          const currentTotal = (tableOccupancy[tableName] || 0) + seatsNeeded;
          if (currentTotal > tableCapacities[tableName]) {
            overCapacityTables.add(tableName);
            // On l'ajoute quand même mais sans table si on veut, ou on l'ignore.
            // Pour être cohérent avec handleAddGuest, on pourrait l'ignorer ou le mettre en "Non assigné"
            finalNewGuests.push({ ...g, table: 'Non assigné' });
          } else {
            tableOccupancy[tableName] = currentTotal;
            finalNewGuests.push(g);
          }
        } else {
          finalNewGuests.push(g);
        }
      });

      if (overCapacityTables.size > 0) {
        showToast('info', `Certaines tables (${Array.from(overCapacityTables).join(', ')}) sont pleines. Les invités concernés ont été mis en "Non assigné".`, 6000);
      }

      const invitesData = finalNewGuests.map(g => {
        const statusStr = String(g.statut || '').toLowerCase();
        return {
          nom: g.nom,
          table: g.table || 'Non assigné',
          category: g.category || '',
          etat: (g.etat === 'couple' ? 'couple' : 'simple') as 'simple' | 'couple',
          confirmed: statusStr.includes('conf') || false,
          statut: statusStr.includes('conf') ? 'confirmed' : 
                  statusStr.includes('decl') ? 'declined' : 'pending'
        };
      });

      // 4. Bulk create
      const success = await bulkCreateInvites(invitesData);
      if (success) {
        const skippedCount = parsedGuests.length - uniqueNewGuests.length;
        const message = skippedCount > 0 
          ? `${uniqueNewGuests.length} invités importés (${skippedCount} doublons ignorés).`
          : `${parsedGuests.length} invités ont été importés avec succès !`;
        
        showToast('success', message);
        setShowImportModal(false);
        await refreshUserData();
      } else {
        showToast('error', "Une erreur est survenue lors de l'importation.");
      }
    } catch (err) {
      console.error('Bulk import error:', err);
      showToast('error', "Une erreur est survenue lors de l'importation.");
    }
  };

  const handleSendReminder = async () => {
    if (!userData?.id) {
      showToast('error', 'Vous devez être connecté pour envoyer des notifications.');
      return;
    }

    if (userModels.length === 0) {
      showToast('error', 'Aucun modèle d\'événement trouvé.');
      return;
    }

    setIsSendingReminder(true);
    try {
      // Call your Firebase Cloud Function!
      const functionUrl = 'https://us-central1-furaha-event-831ca.cloudfunctions.net/sendReminderToAllGuests';
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          templateId: userModels[0].id,
          title: reminderTitle,
          body: reminderBody
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.message) {
          showToast('info', result.message);
        } else {
          showToast('success', `Notifications envoyées ! (${result.sent} envoyées, ${result.failed} échecs)`);
        }
        setShowReminderModal(false);
      } else {
        showToast('error', 'Erreur lors de l\'envoi des notifications.');
      }
    } catch (err) {
      console.error('Reminder error:', err);
      showToast('error', 'Erreur lors de l\'envoi des notifications.');
    } finally {
      setIsSendingReminder(false);
    }
  };

  const handleSaveTable = async (table: Table) => {
    try {
      const existingTable = tables.find(t => (t.docId && table.docId) ? t.docId === table.docId : t.id === table.id);
      if (existingTable) {
        // Mettre à jour
        const updateId = existingTable.docId || table.id.toString();
        const success = await updateTable(updateId, {
          name: table.name,
          seats: table.seats,
          assignedGuests: table.assignedGuests
        });
        if (!success) {
          throw new Error('Échec de la mise à jour');
        }
        showToast('success', 'Table mise à jour avec succès');
      } else {
        // Créer
        const tableId = await createTable({
          name: table.name,
          seats: table.seats,
          assignedGuests: table.assignedGuests
        });
        if (!tableId) {
          throw new Error('Échec de la création');
        }
        showToast('success', 'Table créée avec succès');
      }
      await refreshUserData();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la table:', error);
      showToast('error', 'Erreur lors de la sauvegarde de la table');
      throw error;
    }
  };

  const handleDeleteTable = (tableId: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer la table',
      message: 'Êtes-vous sûr de vouloir supprimer cette table ? Cette action est irréversible.',
      type: 'danger',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          const existingTable = tables.find(t => t.id === tableId);
          const deleteId = existingTable?.docId || tableId.toString();
          const success = await deleteTable(deleteId);
          if (success) {
            await refreshUserData();
            showToast('success', 'Table supprimée avec succès');
          } else {
            showToast('error', 'Erreur lors de la suppression de la table');
          }
        } catch (error) {
          console.error('Erreur lors de la suppression de la table:', error);
          showToast('error', 'Erreur lors de la suppression de la table');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
        }
      }
    });
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      if (editingCategoryId) {
        await updateGuestCategory(editingCategoryId, newCategoryName);
        showToast('success', 'Catégorie mise à jour');
        setEditingCategoryId(null);
      } else {
        await createGuestCategory(newCategoryName);
        showToast('success', 'Catégorie ajoutée');
      }
      setNewCategoryName('');
      await refreshUserData();
    } catch (error) {
      console.error('Erreur sauvegarde catégorie:', error);
      showToast('error', 'Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteCategoryWrapper = async (categoryId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        await deleteGuestCategory(categoryId);
        await refreshUserData();
        showToast('success', 'Catégorie supprimée');
      } catch (error) {
        console.error('Erreur suppression catégorie:', error);
        showToast('error', 'Erreur lors de la suppression');
      }
    }
  };



  const handleEditTemplate = (template: TemplateData) => {
    setEditingTemplate(template);
  };

  const handleBulkDelete = async () => {
    if (selectedGuestIds.length === 0) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Suppression groupée',
      message: `Êtes-vous sûr de vouloir supprimer les ${selectedGuestIds.length} invités sélectionnés ? Cette action est irréversible.`,
      type: 'danger',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
          const success = await bulkDeleteInvites(selectedGuestIds);
          if (success) {
            setSelectedGuestIds([]);
            showToast('success', `${selectedGuestIds.length} invités supprimés avec succès`);
            await refreshUserData();
          } else {
            showToast('error', 'Une erreur est survenue lors de la suppression');
          }
        } catch (error) {
          console.error('Erreur lors de la suppression groupée:', error);
          showToast('error', 'Erreur lors de la suppression');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
        }
      }
    });
  };

  const toggleGuestSelection = (guestId: string) => {
    setSelectedGuestIds(prev => 
      prev.includes(guestId) 
        ? prev.filter(id => id !== guestId) 
        : [...prev, guestId]
    );
  };

  const toggleSelectAll = (filteredGuests: Guest[]) => {
    if (selectedGuestIds.length === filteredGuests.length) {
      setSelectedGuestIds([]);
    } else {
      setSelectedGuestIds(filteredGuests.map(g => g.id));
    }
  };

  const handleSaveTemplate = async (customizedTemplate: TemplateData) => {
    if (!editingTemplate) return;
    
    try {
      const updates: Partial<TemplateData> = {};
      if (typeof customizedTemplate.title !== 'undefined') updates.title = customizedTemplate.title;
      if (typeof customizedTemplate.invitationText !== 'undefined') updates.invitationText = customizedTemplate.invitationText;
      if (typeof customizedTemplate.eventDate !== 'undefined') updates.eventDate = customizedTemplate.eventDate;
      if (typeof customizedTemplate.eventTime !== 'undefined') updates.eventTime = customizedTemplate.eventTime;
      if (typeof customizedTemplate.eventLocation !== 'undefined') updates.eventLocation = customizedTemplate.eventLocation;
      if (typeof customizedTemplate.eventAddress !== 'undefined') updates.eventAddress = customizedTemplate.eventAddress;
      if (typeof customizedTemplate.backgroundImage !== 'undefined') updates.backgroundImage = customizedTemplate.backgroundImage;
      if (typeof customizedTemplate.patternBackgroundImage !== 'undefined') updates.patternBackgroundImage = customizedTemplate.patternBackgroundImage;
      if (typeof customizedTemplate.guestInfoLeftImage !== 'undefined') updates.guestInfoLeftImage = customizedTemplate.guestInfoLeftImage;
      if (typeof customizedTemplate.guestInfoRightImage !== 'undefined') updates.guestInfoRightImage = customizedTemplate.guestInfoRightImage;
      if (typeof customizedTemplate.invitationPhoto !== 'undefined') updates.invitationPhoto = customizedTemplate.invitationPhoto;
      if (typeof customizedTemplate.eventPhotos !== 'undefined') updates.eventPhotos = customizedTemplate.eventPhotos;
      if (typeof customizedTemplate.eventPhoto1 !== 'undefined') updates.eventPhoto1 = customizedTemplate.eventPhoto1;
      if (typeof customizedTemplate.eventPhoto2 !== 'undefined') updates.eventPhoto2 = customizedTemplate.eventPhoto2;
      if (typeof customizedTemplate.eventPhoto3 !== 'undefined') updates.eventPhoto3 = customizedTemplate.eventPhoto3;
      if (typeof customizedTemplate.drinkOptions !== 'undefined') updates.drinkOptions = customizedTemplate.drinkOptions;
      if (typeof customizedTemplate.name !== 'undefined') updates.name = customizedTemplate.name;

      const success = await updateUserModel(editingTemplate.id, updates);

      if (success) {
        await refreshUserData();
        showToast('success', 'Template sauvegardé');
      } else {
        showToast('error', 'Erreur lors de la sauvegarde du template');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showToast('error', 'Erreur lors de la sauvegarde du template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
      try {
        const success = await deleteUserModel(templateId);
        if (success) {
          await refreshUserData();
        } else {
          showToast('error', 'Erreur lors de la suppression du template');
        }
      } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showToast('error', 'Erreur lors de la suppression du template');
      }
    }
  };

  const generateInvitationLink = (templateId: string, guestId: string) => {
    const baseUrl = window.location.origin;
    // Ajout d'un paramètre de version court pour forcer le rafraîchissement WhatsApp sans trop allonger le lien
    const v = Math.floor(Date.now() / 60000) % 1000; // Change toutes les minutes, 3 chiffres max
    return `${baseUrl}/v/${guestId}?v=${v}`;
  };

  const buildConciseMessage = (guest: Guest) => {
    const invitationLink = generateInvitationLink(userModels[0]?.id || 'demo', guest.id);
    const guestLabel = guest.etat === 'couple' ? `Couple ${guest.nom}` : guest.nom;
    
    const messageBody = userData?.invitationMessage || "Nous sommes heureux de vous inviter à célébrer ce moment avec nous.";
    
    return `Bonjour *${guestLabel}* 💌\n\n${messageBody}\n\nVotre invitation :\n👉 ${invitationLink}`;
  };

  const formatNotificationDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const sendWhatsAppInvitation = (guest: Guest) => {
    const composed = buildConciseMessage(guest);
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(composed)}`;
    window.open(whatsappUrl, '_blank');
  };

  const buildWhatsAppMessage = (guest: Guest) => {
    return buildConciseMessage(guest);
  };

  const copyInvitationWithPreview = async (guest: Guest) => {
    const invitationLink = generateInvitationLink(userModels[0]?.id || 'demo', guest.id);
    const guestLabel = guest.etat === 'couple' ? `Couple ${guest.nom}` : guest.nom;
    
    const messageBody = userData?.invitationMessage || "Nous sommes heureux de vous inviter à célébrer ce moment avec nous.";
    const message = `Bonjour *${guestLabel}* 💌\n\n${messageBody}\n\nVotre invitation :\n👉 ${invitationLink}`;

    try {
      await navigator.clipboard.writeText(message);
      showToast('success', 'Invitation copiée ! Vous pouvez la coller sur WhatsApp.');
    } catch {
      showToast('error', 'Copie impossible.');
    }
  };

  const copyThumbnailLink = async () => {
    const imageUrl = furahaLogo as unknown as string;
    try {
      await navigator.clipboard.writeText(imageUrl);
      showToast('info', 'Lien vignette copié. Collez le lien, attendez la vignette.');
    } catch {
      showToast('error', 'Copie du lien impossible.');
    }
  };

  const handleShareInvitation = async (guest: Guest) => {
    const invitationLink = generateInvitationLink(userModels[0]?.id || 'demo', guest.id);
    const guestLabel = guest.etat === 'couple' ? `Couple ${guest.nom}` : guest.nom;
    
    const messageBody = userData?.invitationMessage || "Nous sommes heureux de vous inviter à célébrer ce moment avec nous.";
    const message = `Bonjour *${guestLabel}* 💌\n\n${messageBody}\n\nVotre invitation :\n👉 ${invitationLink}`;

    // 1. Copier automatiquement au presse-papier (Sécurité)
    try {
      await navigator.clipboard.writeText(message);
    } catch (e) {
      console.error("Échec de la copie", e);
    }

    // 2. Partage natif du texte uniquement
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Invitation',
          text: message
        });
        showToast('success', 'Invitation partagée !');
        return;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error("Erreur partage:", error);
        } else {
          return; // L'utilisateur a annulé le partage
        }
      }
    }

    // Fallback : Ouverture directe WhatsApp
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const generateShareCard = async (guest: Guest) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dessiner la photo du couple (si disponible)
    const photoUrl = userModels[0]?.eventPhoto1 || userModels[0]?.backgroundImage;
    if (photoUrl) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = photoUrl;
        });

        // Dessiner l'image en couvrant la moitié gauche ou tout le fond avec opacité
        ctx.save();
        ctx.globalAlpha = 0.8;
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        ctx.restore();
      } catch (e) {
        console.error("Erreur chargement image pour la carte:", e);
      }
    }

    // Overlay dégradé pour la lisibilité
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'rgba(0,0,0,0.7)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bordure élégante
    ctx.strokeStyle = '#d4af37'; // Or
    ctx.lineWidth = 20;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Texte
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';

    // Titre de l'événement
    ctx.font = 'bold 60px "Playfair Display", serif';
    ctx.fillText((userModels[0]?.title || 'Notre Mariage').toUpperCase(), canvas.width / 2, 200);

    // Nom de l'invité
    ctx.font = 'italic 45px "Great Vibes", cursive';
    ctx.fillStyle = '#d4af37';
    ctx.fillText(`Invitation pour ${guest.nom}`, canvas.width / 2, 320);

    // Message
    ctx.fillStyle = '#ffffff';
    ctx.font = '30px "Inter", sans-serif';
    ctx.fillText("Nous serions honorés de vous compter parmi nos invités", canvas.width / 2, 420);
    
    // Logo Furaha (optionnel)
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText("FURAHA-EVENT", canvas.width / 2, 550);

    // Télécharger l'image
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const link = document.createElement('a');
    link.download = `invitation-${guest.nom.replace(/\s+/g, '-')}.jpg`;
    link.href = dataUrl;
    link.click();
    showToast('success', 'Carte de partage générée ! Envoyez cette image avec le lien.');
  };

  const sendEmailInvitation = (guest: Guest) => {
    const invitationLink = generateInvitationLink(userModels[0]?.id || 'demo', guest.id);
    const eventName = userModels[0]?.title || 'Notre Événement Spécial';
    const eventDate = userModels[0]?.eventDate || 'Bientôt';
    const eventTime = userModels[0]?.eventTime || 'Heure à confirmer';
    const eventLocation = userModels[0]?.eventLocation || 'Lieu à confirmer';
    
    const subject = `Invitation Spéciale - ${eventName}`;
    const body = `Bonjour ${guest.nom},

Vous êtes cordialement invité(e) à notre événement spécial !

DÉTAILS DE L'ÉVÉNEMENT :
Événement : ${eventName}
Date : ${eventDate}
Heure : ${eventTime}
Lieu : ${eventLocation}
Table assignée : ${guest.table}

VOTRE INVITATION PERSONNALISÉE :
Cliquez sur le lien ci-dessous pour accéder à votre invitation interactive où vous pourrez :
• Confirmer votre présence
• Choisir votre boisson préférée
• Laisser un message dans notre livre d'or
• Voir tous les détails de l'événement

👉 ${invitationLink}

Nous sommes impatients de célébrer ce moment spécial avec vous !

Avec toute notre affection,
L'équipe organisatrice

---
Cette invitation a été créée avec Furaha-Event
Découvrez nos services : https://furaha-event.com`;

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const sendAllInvitations = (method: 'whatsapp' | 'email') => {
    if (guests.length === 0) {
      showToast('info', 'Aucun invité à qui envoyer les invitations');
      return;
    }
    
    const confirmMessage = `Êtes-vous sûr de vouloir envoyer les invitations par ${method === 'whatsapp' ? 'WhatsApp' : 'Email'} à tous les ${guests.length} invités ?`;
    
    if (window.confirm(confirmMessage)) {
      guests.forEach(guest => {
        if (method === 'whatsapp') {
          sendWhatsAppInvitation(guest);
        } else {
          sendEmailInvitation(guest);
        }
      });
      
      showToast('success', `Invitations ${method === 'whatsapp' ? 'WhatsApp' : 'Email'} envoyées à tous les invités !`);
    }
  };

  // Gestion de la déconnexion : confirmation avant appel
  const openLogoutConfirm = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Se déconnecter ?',
      message: 'Vous allez être déconnecté de votre tableau de bord. Voulez-vous continuer ?',
      type: 'warning',
      isLoading: false,
      onConfirm: () => {
        onLogout();
      },
      onClose: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    } as any);
  };

  if (showProfile && userData) {
    return <UserProfile userData={userData} onLogout={openLogoutConfirm} onBack={() => setShowProfile(false)} />;
  }

  if (editingTemplate) {
    return (
      <TemplateCustomization
        template={editingTemplate}
        onBack={() => setEditingTemplate(null)}
        onSave={handleSaveTemplate}
      />
    );
  }

  const isAdmin = userData?.role === 'admin';
  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'templates', label: 'Design', icon: Sparkles },
    { id: 'guests', label: 'Invités', icon: Users },
    { id: 'tables', label: 'Tables', icon: Table },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'games', label: 'Jeux', icon: Gamepad2 },
    ...(isAdmin ? [{ id: 'users', label: 'Utilisateurs', icon: Shield }] : [])
  ];



const renderOverview = () => {
  // renvoie le nombre de personnes pour un invité donné
  const guestCount = (g: any) => {
    // Cas classique booléen
    if (g.isCouple === true) return 2;

    // Cas où tu utilises "etat" comme dans ton exemple
    if (typeof g.etat === 'string' && g.etat.toLowerCase() === 'couple') return 2;

    // Cas générique si tu stockes directement un count
    if (typeof g.count !== 'undefined') {
      const n = Number(g.count);
      if (!Number.isNaN(n) && n > 0) return n;
    }

    // Par défaut : 1 personne
    return 1;
  };

  // normaliser la valeur de "confirmé"
  const isConfirmed = (g: any) =>
    g.confirmed === true ||
    g.confirmed === 'true' ||
    g.confirmed === 1 ||
    (typeof g.status === 'string' && g.status.toLowerCase() === 'confirmed');

  const totalGuests = guests.reduce((sum: number, g: any) => sum + guestCount(g), 0);
  const confirmedGuests = guests.reduce(
    (sum: number, g: any) => sum + (isConfirmed(g) ? guestCount(g) : 0),
    0
  );
  const pendingGuests = totalGuests - confirmedGuests;
  
  // Compter toutes les tables uniques (définies + importées)
  const uniqueTableNames = new Set([
    ...tables.map(t => t.name),
    ...guests.map(g => g.table).filter(t => t && t !== 'Non assigné')
  ]);
  const totalTables = uniqueTableNames.size;

  // --- STATS BOISSONS ---
  const drinkOptions: string[] =
    (selectedTemplate?.drinkOptions as string[] | undefined) ||
    (userModels[0]?.drinkOptions as string[] | undefined) ||
    [];

  const drinkCounts: Record<string, number> = {};
  let guestsWithDrinkResponse = 0;

  userInvites.forEach((inv: any) => {
    const raw = (inv.selectedDrink as string) || '';
    if (raw && raw.trim() !== '') {
      guestsWithDrinkResponse++;
      const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
      parts.forEach(d => {
        drinkCounts[d] = (drinkCounts[d] || 0) + 1;
      });
    }
  });

  const totalInvitesForStats = userInvites.length;

  // Combiner les options définies + celles trouvées dans les réponses
  const allDrinkNames = Array.from(new Set([
    ...drinkOptions,
    ...Object.keys(drinkCounts)
  ]));

  const drinkStats = allDrinkNames
    .map(name => ({ name, count: drinkCounts[name] || 0 }))
    .sort((a, b) => b.count - a.count);

  const maxDrinkCount = Math.max(1, ...drinkStats.map(s => s.count));
  const drinkResponseRate = totalInvitesForStats > 0
    ? Math.round((guestsWithDrinkResponse / totalInvitesForStats) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Total Invités */}
        <div className="relative rounded-2xl p-4 md:p-5 overflow-hidden border group"
             style={{
               background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
               borderColor: 'rgba(255,255,255,0.08)',
               boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(251,191,36,0.04) inset',
               transition: 'all 400ms cubic-bezier(0.22,1,0.36,1)',
             }}
             onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(251,191,36,0.30)'; }}
             onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
        >
          <div aria-hidden className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full blur-3xl opacity-60 pointer-events-none" style={{ background: 'radial-gradient(closest-side, rgba(251,191,36,0.28), rgba(251,191,36,0) 70%)' }}></div>
          <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left relative z-10">
            <div className="p-2.5 md:p-3 rounded-xl mb-2 md:mb-0 md:mr-4 flex items-center justify-center relative"
                 style={{
                   background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                   boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 10px 24px -10px rgba(251,191,36,0.85)',
                 }}>
              <Users className="h-5 w-5 md:h-5.5 md:w-5.5 text-[#0b0f17]" />
            </div>
            <div>
              <p className="text-[11px] md:text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(252,211,77,0.9)' }}>Total</p>
              <p className="text-2xl md:text-3xl font-black mt-0.5 leading-tight" style={{ color: '#ffffff' }}>{totalGuests}</p>
            </div>
          </div>
        </div>

        {/* Confirmés */}
        <div className="relative rounded-2xl p-4 md:p-5 overflow-hidden border group"
             style={{
               background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
               borderColor: 'rgba(255,255,255,0.08)',
               boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(16,185,129,0.04) inset',
               transition: 'all 400ms cubic-bezier(0.22,1,0.36,1)',
             }}
             onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(16,185,129,0.30)'; }}
             onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
        >
          <div aria-hidden className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full blur-3xl opacity-50 pointer-events-none" style={{ background: 'radial-gradient(closest-side, rgba(16,185,129,0.22), rgba(16,185,129,0) 70%)' }}></div>
          <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left relative z-10">
            <div className="p-2.5 md:p-3 rounded-xl mb-2 md:mb-0 md:mr-4 flex items-center justify-center"
                 style={{
                   background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                   boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(16,185,129,0.55), 0 10px 24px -10px rgba(16,185,129,0.65)',
                 }}>
              <User className="h-5 w-5 md:h-5.5 md:w-5.5 text-white" />
            </div>
            <div>
              <p className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-emerald-300/90">Confirmés</p>
              <p className="text-2xl md:text-3xl font-black mt-0.5 leading-tight text-white">{confirmedGuests}</p>
            </div>
          </div>
        </div>

        {/* En attente */}
        <div className="relative rounded-2xl p-4 md:p-5 overflow-hidden border group"
             style={{
               background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
               borderColor: 'rgba(255,255,255,0.08)',
               boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(168,85,247,0.04) inset',
               transition: 'all 400ms cubic-bezier(0.22,1,0.36,1)',
             }}
             onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(168,85,247,0.30)'; }}
             onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
        >
          <div aria-hidden className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full blur-3xl opacity-50 pointer-events-none" style={{ background: 'radial-gradient(closest-side, rgba(168,85,247,0.22), rgba(168,85,247,0) 70%)' }}></div>
          <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left relative z-10">
            <div className="p-2.5 md:p-3 rounded-xl mb-2 md:mb-0 md:mr-4 flex items-center justify-center"
                 style={{
                   background: 'linear-gradient(180deg, #a855f7 0%, #7c3aed 100%)',
                   boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(168,85,247,0.55), 0 10px 24px -10px rgba(168,85,247,0.65)',
                 }}>
              <Calendar className="h-5 w-5 md:h-5.5 md:w-5.5 text-white" />
            </div>
            <div>
              <p className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-purple-300/90">Attente</p>
              <p className="text-2xl md:text-3xl font-black mt-0.5 leading-tight text-white">{pendingGuests}</p>
            </div>
          </div>
        </div>

        {/* Tables */}
        <div className="relative rounded-2xl p-4 md:p-5 overflow-hidden border group"
             style={{
               background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
               borderColor: 'rgba(255,255,255,0.08)',
               boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(244,114,182,0.04) inset',
               transition: 'all 400ms cubic-bezier(0.22,1,0.36,1)',
             }}
             onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(244,114,182,0.30)'; }}
             onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
        >
          <div aria-hidden className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full blur-3xl opacity-50 pointer-events-none" style={{ background: 'radial-gradient(closest-side, rgba(244,114,182,0.22), rgba(244,114,182,0) 70%)' }}></div>
          <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left relative z-10">
            <div className="p-2.5 md:p-3 rounded-xl mb-2 md:mb-0 md:mr-4 flex items-center justify-center"
                 style={{
                   background: 'linear-gradient(180deg, #ec4899 0%, #db2777 100%)',
                   boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(236,72,153,0.55), 0 10px 24px -10px rgba(236,72,153,0.65)',
                 }}>
              <Table className="h-5 w-5 md:h-5.5 md:w-5.5 text-white" />
            </div>
            <div>
              <p className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-rose-300/90">Tables</p>
              <p className="text-2xl md:text-3xl font-black mt-0.5 leading-tight text-white">{totalTables}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== STATS BOISSONS ===== */}
      <div className="relative rounded-2xl overflow-hidden p-3 md:p-4.5 border group"
           style={{
             background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
             borderColor: 'rgba(255,255,255,0.08)',
             boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(251,191,36,0.04) inset',
             transition: 'all 400ms cubic-bezier(0.22,1,0.36,1)',
           }}
           onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(251,191,36,0.22)'; }}
           onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
      >
        {/* GitHub-style backlight */}
        <div aria-hidden className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[92%] h-[40%] pointer-events-none blur-3xl opacity-65"
             style={{ background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.20) 0%, rgba(251,191,36,0.06) 38%, rgba(251,191,36,0) 70%)' }}></div>
        <div className="flex items-center justify-between mb-2.5 md:mb-3 relative z-10">
          <div className="flex items-center">
            <div className="p-1.5 md:p-2 rounded-lg mr-2 md:mr-3 flex items-center justify-center"
                 style={{
                   background: 'linear-gradient(180deg, #ec4899 0%, #f43f5e 100%)',
                   boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(236,72,153,0.5), 0 8px 20px -8px rgba(236,72,153,0.65)',
                 }}>
              <Wine className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm md:text-lg font-extrabold text-white leading-tight">
                Boissons
              </h3>
              <p className="text-[10px] md:text-xs text-white/50 leading-none mt-0.5">
                {guestsWithDrinkResponse} / {totalInvitesForStats}
                <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{
                  background: 'rgba(251,191,36,0.12)',
                  color: '#fcd34d',
                  border: '1px solid rgba(251,191,36,0.25)',
                }}>
                  {drinkResponseRate}%
                </span>
              </p>
            </div>
          </div>
          {userModels.length > 0 && drinkOptions.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] md:text-xs font-semibold"
                  style={{
                    background: 'rgba(236,72,153,0.08)',
                    color: '#f9a8d4',
                    border: '1px solid rgba(236,72,153,0.22)',
                  }}>
              {drinkOptions.length} option{drinkOptions.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {drinkStats.length === 0 ? (
          <div className="text-center py-4 md:py-6 rounded-xl border border-dashed relative z-10"
               style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <Wine className="h-8 w-8 md:h-10 md:w-10 text-white/30 mx-auto mb-2 opacity-80" />
            <p className="text-xs md:text-sm font-medium text-white/45">
              Aucune réponse de boisson
            </p>
          </div>
        ) : (
          <div className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-2.5">
              {drinkStats.map((stat, i) => {
                const percent = Math.round((stat.count / maxDrinkCount) * 100);
                const exactPercent = guestsWithDrinkResponse > 0
                  ? Math.round((stat.count / Math.max(1, guestsWithDrinkResponse)) * 100)
                  : 0;

                const barColor = i === 0
                  ? ['#fcd34d', '#f59e0b', '#fb923c']
                  : i === 1
                  ? ['#fb7185', '#ec4899', '#d946ef']
                  : i === 2
                  ? ['#c084fc', '#a855f7', '#6366f1']
                  : i === 3
                  ? ['#34d399', '#14b8a6', '#06b6d4']
                  : ['#38bdf8', '#3b82f6', '#6366f1'];

                return (
                  <div
                    key={stat.name}
                    className="p-2 md:p-2.5 rounded-xl border bg-black/20 hover:bg-white/5 transition-all duration-200 group"
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(251,191,36,0.18)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
                  >
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <div className="flex items-center min-w-0">
                        <span className="inline-flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full mr-1.5 md:mr-2 text-[10px] md:text-xs font-extrabold shrink-0"
                              style={{
                                background: `linear-gradient(180deg, ${barColor[0]}33, ${barColor[1]}1a)`,
                                color: '#fcd34d',
                                border: `1px solid rgba(251,191,36,0.22)`,
                              }}>
                          {i + 1}
                        </span>
                        <h4 className="font-semibold text-xs md:text-sm text-white truncate">
                          {stat.name}
                        </h4>
                      </div>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] md:text-xs font-bold border shrink-0"
                            style={{
                              background: `linear-gradient(180deg, ${barColor[0]}15, ${barColor[1]}0a)`,
                              borderColor: 'rgba(255,255,255,0.08)',
                              color: '#fff',
                            }}>
                        {stat.count}
                        <span className="ml-1 opacity-70 font-medium">
                          · {exactPercent}%
                        </span>
                      </span>
                    </div>
                    <div className="relative h-1.5 md:h-2 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="absolute inset-y-0 left-0 rounded-full shadow-inner transition-all duration-700 ease-out"
                        style={{
                          width: `${percent}%`,
                          background: `linear-gradient(90deg, ${barColor[0]}, ${barColor[1]}, ${barColor[2]})`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {totalInvitesForStats > guestsWithDrinkResponse && (
              <div className="mt-2.5 md:mt-3 pt-2.5 relative z-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] md:text-xs font-medium text-white/45 flex items-center">
                    <Clock className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1 opacity-75" />
                    En attente
                  </span>
                  <span className="text-[10px] md:text-xs font-semibold text-white/55">
                    {totalInvitesForStats - guestsWithDrinkResponse}
                  </span>
                </div>
                <div className="relative h-1.5 md:h-2 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="absolute inset-y-0 left-0 rounded-full shadow-inner transition-all duration-700 ease-out"
                    style={{
                      width: `${totalInvitesForStats > 0 ? Math.round(((totalInvitesForStats - guestsWithDrinkResponse) / totalInvitesForStats) * 100) : 0}%`,
                      background: 'linear-gradient(90deg, rgba(255,255,255,0.25), rgba(255,255,255,0.45), rgba(255,255,255,0.25))',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* ===== FIN STATS BOISSONS ===== */}

        {/* Actions rapides */}
        <div className="relative rounded-2xl overflow-hidden border p-4 md:p-6"
             style={{
               background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
               borderColor: 'rgba(255,255,255,0.08)',
               boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(251,191,36,0.04) inset',
             }}>
          <div aria-hidden className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[92%] h-[45%] pointer-events-none blur-3xl opacity-55"
               style={{ background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.22) 0%, rgba(251,191,36,0.05) 38%, rgba(251,191,36,0) 70%)' }}></div>
          <h3 className="relative z-10 text-lg md:text-xl font-extrabold tracking-tight text-white mb-4 md:mb-6">
            Actions rapides
          </h3>
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            <button
              onClick={openAddGuestModal}
              className="p-3 md:p-4 rounded-xl transition-all duration-300 font-semibold flex flex-col md:flex-row items-center justify-center transform hover:scale-[1.03] text-sm md:text-base"
              style={{
                background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                color: '#0b0f17',
                boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 10px 26px -10px rgba(251,191,36,0.55)',
              }}
            >
              <Plus className="h-5 w-5 md:mr-2 mb-1 md:mb-0" />
              <span>Invité</span>
            </button>
            
            <button
              onClick={() => setActiveTab('tables')}
              className="p-3 md:p-4 rounded-xl transition-all duration-300 font-semibold flex flex-col md:flex-row items-center justify-center transform hover:scale-[1.03] text-sm md:text-base"
              style={{
                background: 'linear-gradient(180deg, #a855f7 0%, #7c3aed 100%)',
                color: '#ffffff',
                boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 0 0 1px rgba(168,85,247,0.45), 0 10px 26px -10px rgba(168,85,247,0.55)',
              }}
            >
              <Table className="h-5 w-5 md:mr-2 mb-1 md:mb-0" />
              <span>Tables</span>
            </button>
            
            <button
              onClick={() => setActiveTab('templates')}
              className="p-3 md:p-4 rounded-xl transition-all duration-300 font-semibold flex flex-col md:flex-row items-center justify-center transform hover:scale-[1.03] text-sm md:text-base"
              style={{
                background: 'linear-gradient(180deg, #ec4899 0%, #e11d48 100%)',
                color: '#ffffff',
                boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 0 0 1px rgba(236,72,153,0.45), 0 10px 26px -10px rgba(236,72,153,0.55)',
              }}
            >
              <Eye className="h-5 w-5 md:mr-2 mb-1 md:mb-0" />
              <span>Design</span>
            </button>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => window.open(`/checkin/${userData?.id}`, '_blank')}
                className="p-3 md:p-4 rounded-xl transition-all duration-300 font-semibold flex flex-col md:flex-row items-center justify-center transform hover:scale-[1.03] text-sm md:text-base"
                style={{
                  background: 'linear-gradient(180deg, #10b981 0%, #0d9488 100%)',
                  color: '#ffffff',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 0 0 1px rgba(16,185,129,0.45), 0 10px 26px -10px rgba(16,185,129,0.55)',
                }}
              >
                <Check className="h-5 w-5 md:mr-2 mb-1 md:mb-0" />
                <span>Check-in</span>
              </button>
              <button
                onClick={async () => {
                  const url = `${window.location.origin}/checkin/${userData?.id}`;
                  try {
                    await navigator.clipboard.writeText(url);
                    showToast('success', 'Lien Check-in copié dans le presse-papier');
                  } catch {
                    const textarea = document.createElement('textarea');
                    textarea.value = url;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    showToast('success', 'Lien Check-in copié dans le presse-papier');
                  }
                }}
                className="px-3 py-2 rounded-lg transition-all duration-300 font-semibold flex items-center justify-center gap-1.5 text-xs"
                style={{
                  background: 'rgba(16,185,129,0.1)',
                  color: '#6ee7b7',
                  border: '1px solid rgba(16,185,129,0.3)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.16)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.1)'; }}
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copier le lien</span>
              </button>
            </div>

            <button
              onClick={() => setShowReminderModal(true)}
              className="p-3 md:p-4 rounded-xl transition-all duration-300 font-semibold flex flex-col md:flex-row items-center justify-center transform hover:scale-[1.03] text-sm md:text-base"
              style={{
                background: 'linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%)',
                color: '#ffffff',
                boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 0 0 1px rgba(14,165,233,0.45), 0 10px 26px -10px rgba(14,165,233,0.55)',
              }}
            >
              <Calendar className="h-5 w-5 md:mr-2 mb-1 md:mb-0" />
              <span>Rappel</span>
            </button>
          </div>
        </div>

        {/* Template sélectionné */}
        {selectedTemplate && (
          <div className="relative rounded-2xl overflow-hidden border p-4 md:p-6"
               style={{
                 background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
                 borderColor: 'rgba(255,255,255,0.08)',
                 boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(251,191,36,0.04) inset',
               }}>
            <div aria-hidden className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[92%] h-[45%] pointer-events-none blur-3xl opacity-55"
                 style={{ background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.22) 0%, rgba(251,191,36,0.05) 38%, rgba(251,191,36,0) 70%)' }}></div>
            <h3 className="relative z-10 text-lg md:text-xl font-extrabold tracking-tight text-white mb-4 md:mb-6">
              Template sélectionné
            </h3>
            <div className="relative z-10 rounded-xl p-4 md:p-6 border"
                 style={{
                   background: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(236,72,153,0.04) 60%, rgba(251,191,36,0.02) 100%)',
                   borderColor: 'rgba(251,191,36,0.22)',
                 }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0">
                  <h4 className="text-base md:text-lg font-semibold text-white mb-1 md:mb-2 truncate">{selectedTemplate.name}</h4>
                  <p className="text-sm text-white/65 mb-3 md:mb-4 truncate">{selectedTemplate.title}</p>
                  <div className="flex items-center space-x-4 text-xs md:text-sm text-white/60">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1" style={{ color: '#fcd34d' }} />
                      <span>{selectedTemplate.eventDate}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-3 w-3 md:h-4 md:w-4 mr-1" style={{ color: '#fcd34d' }} />
                      <span>{selectedTemplate.eventTime}</span>
                    </div>
                  </div>
                </div>
                <div className="flex sm:flex-col lg:flex-row gap-2">
                  <button
                    onClick={() => handleEditTemplate(selectedTemplate)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg transition-all duration-300 font-semibold flex items-center justify-center text-sm"
                    style={{
                      background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                      color: '#0b0f17',
                      boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 10px 24px -10px rgba(251,191,36,0.55)',
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Personnaliser
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activité récente */}
        <div className="relative rounded-2xl overflow-hidden border p-6"
             style={{
               background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
               borderColor: 'rgba(255,255,255,0.08)',
               boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(251,191,36,0.04) inset',
             }}>
          <div aria-hidden className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[92%] h-[45%] pointer-events-none blur-3xl opacity-50"
               style={{ background: 'radial-gradient(ellipse at center, rgba(236,72,153,0.2) 0%, rgba(236,72,153,0.04) 38%, rgba(236,72,153,0) 70%)' }}></div>
          <h3 className="relative z-10 text-xl font-extrabold tracking-tight text-white mb-6">
            Activité récente
          </h3>
          <div className="relative z-10 space-y-3">
            {guests.slice(0, 5).map((guest, index) => (
              <div
                key={guest.id}
                className="flex items-center justify-between p-4 rounded-xl border animate-slide-up group"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  background: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.06)',
                  transition: 'all 300ms cubic-bezier(0.22,1,0.36,1)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.22)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm`}
                       style={{
                         background: guest.etat === 'couple'
                           ? 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)'
                           : 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)',
                         boxShadow: guest.etat === 'couple'
                           ? '0 8px 22px -6px rgba(236,72,153,0.55)'
                           : '0 8px 22px -6px rgba(251,191,36,0.5)',
                       }}>
                    {guest.nom.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-white">{guest.nom}</p>
                    <p className="text-sm text-white/55">Table: {guest.table}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold`}
                      style={{
                        background: guest.confirmed
                          ? 'rgba(16,185,129,0.15)'
                          : 'rgba(251,191,36,0.15)',
                        color: guest.confirmed ? '#6ee7b7' : '#fcd34d',
                        border: `1px solid ${guest.confirmed ? 'rgba(16,185,129,0.35)' : 'rgba(251,191,36,0.35)'}`,
                      }}>
                  {guest.confirmed ? 'Confirmé' : 'En attente'}
                </span>
              </div>
            ))}
            
            {guests.length === 0 && (
              <div className="relative z-10 text-center py-8">
                <Users className="h-16 w-16 mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.25)' }} />
                <h4 className="text-lg font-semibold text-white/70 mb-2">Aucun invité ajouté</h4>
                <p className="text-white/50 mb-6">Commencez par ajouter vos premiers invités</p>
                <button
                  onClick={openAddGuestModal}
                  className="px-6 py-3 rounded-xl transition-all duration-300 font-semibold"
                  style={{
                    background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                    color: '#0b0f17',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 10px 28px -10px rgba(251,191,36,0.55)',
                  }}
                >
                  Ajouter un invité
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTemplates = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-extrabold tracking-tight text-white">
            Mes Templates
          </h3>
          <p className="text-white/55 mt-1">Gérez vos modèles d'invitation personnalisés</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userModels.map((template, index) => (
          <div
            key={template.id}
            className="relative rounded-2xl overflow-hidden border group animate-slide-up"
            style={{
              background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
              borderColor: 'rgba(255,255,255,0.08)',
              boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(251,191,36,0.04) inset',
              transition: 'all 400ms cubic-bezier(0.22,1,0.36,1)',
              animationDelay: `${index * 0.1}s`,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(251,191,36,0.30)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
          >
            <div aria-hidden className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[92%] h-[45%] pointer-events-none blur-3xl opacity-60"
                 style={{ background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.22) 0%, rgba(251,191,36,0.06) 38%, rgba(251,191,36,0) 70%)' }}></div>
            <div className="relative h-48 overflow-hidden border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <img
                src={template.backgroundImage}
                alt={template.name}
                className="w-full h-full object-cover hover:scale-[1.04] transition-transform duration-700"
              />
              <div className="absolute inset-0"
                   style={{
                     background: 'linear-gradient(180deg, rgba(10,13,20,0.05) 0%, rgba(10,13,20,0.5) 55%, rgba(10,13,20,0.92) 100%)',
                   }}
              />
              <div className="absolute bottom-4 left-4 right-4">
                <h4 className="text-white font-bold text-lg drop-shadow-lg">{template.title}</h4>
              </div>
            </div>
            
            <div className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h5 className="font-semibold text-white">{template.name}</h5>
                  <p className="text-sm text-white/55 capitalize">{template.category}</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: 'rgba(251,191,36,0.12)',
                        color: '#fcd34d',
                        border: '1px solid rgba(251,191,36,0.28)',
                      }}>
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </span>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditTemplate(template)}
                  className="flex-1 px-3 py-2.5 rounded-lg transition-all duration-300 font-semibold flex items-center justify-center text-sm group-hover:scale-[1.01]"
                  style={{
                    background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                    color: '#0b0f17',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 10px 24px -10px rgba(251,191,36,0.55)',
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {userModels.length === 0 && (
        <div className="relative rounded-2xl p-12 text-center overflow-hidden border"
             style={{
               background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
               borderColor: 'rgba(255,255,255,0.08)',
             }}>
          <Sparkles className="h-16 w-16 mx-auto mb-4" style={{ color: 'rgba(252,211,77,0.55)' }} />
          <h3 className="text-lg font-semibold text-white/80 mb-2">Aucun template personnalisé</h3>
          <p className="text-white/50 mb-6">Créez votre premier template en sélectionnant un modèle</p>
          <button
            onClick={() => onBackToHome ? onBackToHome() : window.location.reload()}
            className="px-6 py-3 rounded-lg transition-all duration-300 font-semibold"
            style={{
              background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
              color: '#0b0f17',
              boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 10px 30px -10px rgba(251,191,36,0.55)',
            }}
          >
            Retour à l'accueil
          </button>
        </div>
      )}
    </div>
  );

  const renderGuests = () => {
    // Filtrage et tri des invités
    const filteredGuests = guests.filter(guest => {
      const matchesSearch = 
        guest.nom.toLowerCase().includes(guestSearchTerm.toLowerCase()) || 
        guest.table.toLowerCase().includes(guestSearchTerm.toLowerCase());
      
      const matchesStatus = guestFilterStatus === 'all' 
        ? true 
        : guestFilterStatus === 'confirmed' ? guest.confirmed : !guest.confirmed;

      const matchesCategory = guestFilterCategory === 'all'
        ? true
        : guest.category === guestFilterCategory;
      
      const matchesTable = guestFilterTable === 'all'
        ? true
        : guest.table === guestFilterTable;
      
      return matchesSearch && matchesStatus && matchesCategory && matchesTable;
    }).sort((a, b) => {
      if (guestSortBy === 'name') return a.nom.localeCompare(b.nom);
      if (guestSortBy === 'table') return a.table.localeCompare(b.table);
      if (guestSortBy === 'category') return (a.category || '').localeCompare(b.category || '');
      return 0;
    });

    return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-extrabold tracking-tight text-white">
            Gestion des Invités
          </h3>
          <p className="text-white/55 mt-1">Ajoutez et gérez vos invités</p>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="relative rounded-2xl overflow-hidden border p-3 md:p-4"
           style={{
             background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
             borderColor: 'rgba(255,255,255,0.08)',
             boxShadow: '0 20px 60px -30px rgba(0,0,0,0.6)',
           }}>
        <div aria-hidden className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[92%] h-[55%] pointer-events-none blur-3xl opacity-50"
             style={{ background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.18) 0%, rgba(251,191,36,0.04) 38%, rgba(251,191,36,0) 70%)' }}></div>
        <div className="relative z-10 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: 'rgba(255,255,255,0.4)' }} />
            <input
              type="text"
              placeholder="Rechercher un nom..."
              value={guestSearchTerm}
              onChange={(e) => setGuestSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg transition-all duration-200 text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#ffffff',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <div className="relative flex-shrink-0">
              <select
                value={guestFilterStatus}
                onChange={(e) => setGuestFilterStatus(e.target.value as any)}
                className="pl-3 pr-8 py-2 rounded-full appearance-none text-xs font-semibold outline-none cursor-pointer guest-filter-select"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                <option value="all">Tous statuts</option>
                <option value="confirmed">Confirmés</option>
                <option value="pending">Attente</option>
              </select>
              <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: 'rgba(255,255,255,0.4)' }} />
            </div>

            <div className="relative flex-shrink-0">
              <select
                value={guestFilterTable}
                onChange={(e) => setGuestFilterTable(e.target.value)}
                className="pl-3 pr-8 py-2 rounded-full appearance-none text-xs font-semibold outline-none cursor-pointer guest-filter-select"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                <option value="all">Toutes tables</option>
                {availableTables.map((table) => (
                  <option key={table.name} value={table.name}>{table.name}</option>
                ))}
              </select>
              <Table className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: 'rgba(255,255,255,0.4)' }} />
            </div>

            <div className="relative flex-shrink-0">
              <select
                value={guestFilterCategory}
                onChange={(e) => setGuestFilterCategory(e.target.value)}
                className="pl-3 pr-8 py-2 rounded-full appearance-none text-xs font-semibold outline-none cursor-pointer guest-filter-select"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                <option value="all">Catégories</option>
                {availableCategories.map(catName => (
                  <option key={catName} value={catName}>{catName}</option>
                ))}
              </select>
              <Tag className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: 'rgba(255,255,255,0.4)' }} />
            </div>

            <div className="relative flex-shrink-0">
              <select
                value={guestSortBy}
                onChange={(e) => setGuestSortBy(e.target.value as any)}
                className="pl-3 pr-8 py-2 rounded-full appearance-none text-xs font-semibold outline-none cursor-pointer guest-sort-select"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                <option value="name">Trier par nom</option>
                <option value="table">Trier par table</option>
                <option value="category">Trier par catégorie</option>
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 pointer-events-none font-bold text-[8px]" style={{ color: 'rgba(255,255,255,0.4)' }}>AZ</div>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'actions groupées */}
      {selectedGuestIds.length > 0 && (
        <div className="px-4 md:px-6 py-3 md:py-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-up sticky top-20 z-30 border"
             style={{
               background: 'linear-gradient(135deg, rgba(251,191,36,0.22) 0%, rgba(245,158,11,0.14) 100%)',
               borderColor: 'rgba(251,191,36,0.35)',
               boxShadow: '0 20px 60px -20px rgba(251,191,36,0.35), 0 0 0 1px rgba(251,191,36,0.12) inset',
               backdropFilter: 'blur(12px)',
             }}>
          <div className="flex items-center">
            <div className="p-2 rounded-lg mr-3 md:mr-4" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <Users className="h-4 w-4 md:h-5 md:w-5" style={{ color: '#fcd34d' }} />
            </div>
            <div>
              <p className="font-extrabold text-sm md:text-base text-white">{selectedGuestIds.length} sélectionné{selectedGuestIds.length > 1 ? 's' : ''}</p>
              <p className="text-[10px] md:text-xs text-white/60">Actions groupées disponibles</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-3 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedGuestIds([])}
              className="flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-xl transition-all duration-200 text-xs md:text-sm font-semibold whitespace-nowrap"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              Annuler
            </button>
            <button
              onClick={() => {
                setSentGuestIds([]);
                setShowBulkSendModal(true);
              }}
              className="flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-xl transition-all duration-200 text-xs md:text-sm font-bold flex items-center justify-center whitespace-nowrap"
              style={{
                background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                color: '#0b0f17',
                boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 10px 24px -10px rgba(251,191,36,0.55)',
              }}
            >
              <MessageSquare className="h-4 w-4 mr-1.5 md:mr-2" />
              Partager
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-xl transition-all duration-200 text-xs md:text-sm font-bold flex items-center justify-center whitespace-nowrap"
              style={{
                background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
                color: '#ffffff',
                boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 0 0 1px rgba(239,68,68,0.45), 0 10px 24px -10px rgba(239,68,68,0.5)',
              }}
            >
              <Trash2 className="h-4 w-4 mr-1.5 md:mr-2" />
              Supprimer
            </button>
          </div>
        </div>
      )}

      {/* Formulaire d'ajout d'invité */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h4 className="text-base sm:text-lg font-semibold text-white">
            Liste des invités ({filteredGuests.length} / {guests.length})
          </h4>
          <p className="text-white/55 text-xs sm:text-sm">Gérez vos invités et leurs confirmations</p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap lg:flex-nowrap gap-1.5 sm:gap-2 md:gap-3 w-full lg:w-auto">
          <button
            onClick={() => setShowCategoryManager(true)}
            className="flex-1 sm:flex-none px-2 sm:px-3 md:px-4 py-1.5 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl transition-all duration-300 font-semibold flex items-center justify-center text-[10px] sm:text-xs md:text-sm"
            style={{
              background: 'rgba(255,255,255,0.03)',
              color: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.25)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            <Tag className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1 sm:mr-1.5 md:mr-2" style={{ color: '#a78bfa' }} />
            Catégories
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex-1 sm:flex-none px-2 sm:px-3 md:px-4 py-1.5 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl transition-all duration-300 font-semibold flex items-center justify-center text-[10px] sm:text-xs md:text-sm"
            style={{
              background: 'rgba(255,255,255,0.03)',
              color: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.25)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            <FileSpreadsheet className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1 sm:mr-1.5 md:mr-2" style={{ color: '#34d399' }} />
            Importer
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex-1 sm:flex-none px-2 sm:px-3 md:px-4 py-1.5 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl transition-all duration-300 font-semibold flex items-center justify-center text-[10px] sm:text-xs md:text-sm"
            style={{
              background: 'rgba(255,255,255,0.03)',
              color: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.25)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1 sm:mr-1.5 md:mr-2" style={{ color: '#60a5fa' }} />
            Exporter
          </button>
          <button
            onClick={() => setShowReminderModal(true)}
            className="flex-1 sm:flex-none px-2 sm:px-3 md:px-4 py-1.5 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl transition-all duration-300 font-semibold flex items-center justify-center text-[10px] sm:text-xs md:text-sm transform hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(180deg, #a855f7 0%, #7c3aed 100%)',
              color: '#ffffff',
              boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 0 0 1px rgba(168,85,247,0.45), 0 10px 28px -10px rgba(168,85,247,0.55)',
            }}
          >
            <Bell className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1 sm:mr-1.5 md:mr-2" />
            Rappel
          </button>
          <button
            onClick={openAddGuestModal}
            className="col-span-2 sm:flex-none px-3 sm:px-4 md:px-6 py-1.5 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl transition-all duration-300 font-semibold flex items-center justify-center transform hover:scale-[1.02] text-[10px] sm:text-xs md:text-sm"
            style={{
              background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
              color: '#0b0f17',
              boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 10px 30px -10px rgba(251,191,36,0.55)',
            }}
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1 sm:mr-1.5 md:mr-2" />
            Ajouter invité
          </button>
        </div>
      </div>

      {/* Liste des invités */}
      <div className="relative rounded-2xl sm:overflow-hidden border"
           style={{
             background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
             borderColor: 'rgba(255,255,255,0.08)',
             boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(251,191,36,0.03) inset',
           }}>
        <div aria-hidden className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[92%] h-[40%] pointer-events-none blur-3xl opacity-50"
             style={{ background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.2) 0%, rgba(251,191,36,0.04) 38%, rgba(251,191,36,0) 70%)' }}></div>
        <div className="relative z-10 px-3 py-2 sm:p-6 border-b flex items-center justify-between rounded-t-2xl"
             style={{
               borderColor: 'rgba(255,255,255,0.06)',
               background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
             }}>
          <h4 className="text-sm sm:text-lg font-semibold text-white">Liste des invités</h4>
          {filteredGuests.length > 0 && (
            <button
              onClick={() => toggleSelectAll(filteredGuests)}
              className="text-xs sm:text-sm font-semibold transition-colors flex items-center"
              style={{ color: '#fcd34d' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#fbbf24'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#fcd34d'; }}
            >
              <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-2 mr-1.5 sm:mr-2 flex items-center justify-center transition-all ${
                selectedGuestIds.length === filteredGuests.length 
                  ? '' 
                  : ''
              }`}
                   style={{
                     borderColor: selectedGuestIds.length === filteredGuests.length ? '#f59e0b' : 'rgba(255,255,255,0.25)',
                     background: selectedGuestIds.length === filteredGuests.length ? 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)' : 'transparent',
                     boxShadow: selectedGuestIds.length === filteredGuests.length ? '0 6px 18px -4px rgba(251,191,36,0.5)' : 'none',
                   }}>
                {selectedGuestIds.length === filteredGuests.length && <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" style={{ color: '#0b0f17' }} />}
              </div>
              <span className="hidden sm:inline">{selectedGuestIds.length === filteredGuests.length ? 'Tout désélectionner' : 'Tout sélectionner'}</span>
              <span className="sm:hidden">{selectedGuestIds.length === filteredGuests.length ? 'Tout' : 'Tout'}</span>
            </button>
          )}
        </div>
        
        <div className="relative z-10">
          {filteredGuests.map((guest, index) => (
            <div
              key={guest.id}
              className={`px-3 py-2 sm:p-6 transition-all duration-300 animate-slide-up flex items-center border-t ${index === filteredGuests.length - 1 ? 'sm:rounded-b-none rounded-b-2xl' : ''}`}
              style={{
                animationDelay: `${index * 0.05}s`,
                borderColor: selectedGuestIds.includes(guest.id) ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.05)',
                background: selectedGuestIds.includes(guest.id)
                  ? 'linear-gradient(90deg, rgba(251,191,36,0.08) 0%, rgba(251,191,36,0.02) 60%, rgba(251,191,36,0) 100%)'
                  : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!selectedGuestIds.includes(guest.id)) {
                  e.currentTarget.style.background = 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 60%, rgba(255,255,255,0) 100%)';
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedGuestIds.includes(guest.id)) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {/* Checkbox de sélection */}
              <button
                onClick={() => toggleGuestSelection(guest.id)}
                className="mr-2 sm:mr-4 flex-shrink-0"
              >
                <div className={`w-4 h-4 sm:w-6 sm:h-6 rounded-lg border-2 flex items-center justify-center transition-all`}
                     style={{
                       borderColor: selectedGuestIds.includes(guest.id) ? '#f59e0b' : 'rgba(255,255,255,0.25)',
                       background: selectedGuestIds.includes(guest.id) ? 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)' : 'transparent',
                       boxShadow: selectedGuestIds.includes(guest.id) ? '0 6px 18px -4px rgba(251,191,36,0.5)' : 'none',
                     }}>
                  {selectedGuestIds.includes(guest.id) && <Check className="h-2.5 w-2.5 sm:h-4 sm:w-4" style={{ color: '#0b0f17' }} />}
                </div>
              </button>

              <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="flex items-center">
                  <div className={`w-7 h-7 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-semibold text-[10px] sm:text-base`}
                       style={{
                         background: guest.etat === 'couple'
                           ? 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)'
                           : 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)',
                         boxShadow: guest.etat === 'couple'
                           ? '0 8px 22px -6px rgba(236,72,153,0.55)'
                           : '0 8px 22px -6px rgba(251,191,36,0.5)',
                       }}>
                    {guest.nom.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div className="ml-2 sm:ml-4 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="font-semibold text-white text-sm sm:text-lg truncate max-w-[150px] sm:max-w-none">{guest.nom}</h5>
                      
                      <div className="sm:hidden flex items-center gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold`}
                              style={{
                                background: guest.confirmed
                                  ? 'rgba(16,185,129,0.15)'
                                  : 'rgba(251,191,36,0.15)',
                                color: guest.confirmed ? '#6ee7b7' : '#fcd34d',
                                border: `1px solid ${guest.confirmed ? 'rgba(16,185,129,0.35)' : 'rgba(251,191,36,0.35)'}`,
                              }}>
                          {guest.confirmed ? '✓' : '!'}
                        </span>
                        
                        <button
                          onClick={() => copyInvitationWithPreview(guest)}
                          className="p-1.5 rounded-lg transition-all duration-200"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                          aria-label="Copier le message"
                          title="Copier le message"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>

                        <div className={`relative ${openGuestActionsId === guest.id ? 'z-[60]' : 'z-10'}`}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenGuestActionsId(openGuestActionsId === guest.id ? null : guest.id);
                            }}
                            className="p-1.5 rounded-lg transition-all duration-200 flex items-center"
                            style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.22)', color: '#fcd34d' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.2)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.12)'; }}
                          >
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${openGuestActionsId === guest.id ? 'rotate-180' : ''}`} />
                          </button>

                          {openGuestActionsId === guest.id && (
                            <div className="absolute right-0 mt-2 w-40 rounded-2xl z-[100] overflow-hidden animate-fade-in py-2 border"
                                 style={{
                                   background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
                                   borderColor: 'rgba(255,255,255,0.08)',
                                   boxShadow: '0 20px 60px -20px rgba(0,0,0,0.8)',
                                 }}>
                              <button
                                onClick={() => { handleShareInvitation(guest); setOpenGuestActionsId(null); }}
                                className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center transition-colors"
                                style={{ color: '#6ee7b7' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                              >
                                <MessageSquare className="h-3.5 w-3.5 mr-2" />
                                WhatsApp
                              </button>
                              <button
                                onClick={() => { sendEmailInvitation(guest); setOpenGuestActionsId(null); }}
                                className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center transition-colors"
                                style={{ color: '#93c5fd' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                              >
                                <Mail className="h-3.5 w-3.5 mr-2" />
                                Email
                              </button>
                              <div className="h-[1px] my-1 mx-2" style={{ background: 'rgba(255,255,255,0.06)' }}></div>
                              <button
                                onClick={() => { openEditGuestModal(guest); setOpenGuestActionsId(null); }}
                                className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center transition-colors"
                                style={{ color: '#fcd34d' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.08)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                              >
                                <Edit className="h-3.5 w-3.5 mr-2" />
                                Modifier
                              </button>
                              <button
                                onClick={() => { handleDeleteGuest(guest.id); setOpenGuestActionsId(null); }}
                                className="w-full px-3 py-2 text-left text-xs font-semibold flex items-center transition-colors"
                                style={{ color: '#fca5a5' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center flex-wrap gap-1 sm:gap-4 text-[10px] sm:text-sm text-white/60">
                      <span>Table: {guest.table}</span>
                      {guest.category && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] sm:text-xs font-semibold"
                              style={{
                                background: 'rgba(168,85,247,0.12)',
                                color: '#c4b5fd',
                                border: '1px solid rgba(168,85,247,0.28)',
                              }}>
                          <Tag className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                          {guest.category}
                        </span>
                      )}
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] sm:text-xs font-semibold`}
                            style={{
                              background: guest.etat === 'couple'
                                ? 'rgba(236,72,153,0.12)'
                                : 'rgba(59,130,246,0.12)',
                              color: guest.etat === 'couple' ? '#f9a8d4' : '#93c5fd',
                              border: `1px solid ${guest.etat === 'couple' ? 'rgba(236,72,153,0.3)' : 'rgba(59,130,246,0.3)'}`,
                            }}>
                        {guest.etat === 'couple' ? 'Couple' : 'Simple'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="hidden sm:flex items-center sm:flex-shrink-0 flex-wrap gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold`}
                        style={{
                          background: guest.confirmed
                            ? 'rgba(16,185,129,0.15)'
                            : 'rgba(251,191,36,0.15)',
                          color: guest.confirmed ? '#6ee7b7' : '#fcd34d',
                          border: `1px solid ${guest.confirmed ? 'rgba(16,185,129,0.35)' : 'rgba(251,191,36,0.35)'}`,
                        }}>
                    {guest.confirmed ? '✓' : '!'}
                  </span>
                  
                  <button
                    onClick={() => copyInvitationWithPreview(guest)}
                    className="p-2.5 rounded-xl transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    aria-label="Copier le message"
                    title="Copier le message"
                  >
                    <Copy className="h-5 w-5" />
                  </button>

                  <div className={`relative ${openGuestActionsId === guest.id ? 'z-[60]' : 'z-10'}`}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenGuestActionsId(openGuestActionsId === guest.id ? null : guest.id);
                      }}
                      className="p-2.5 rounded-xl transition-all duration-200 flex items-center"
                      style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.22)', color: '#fcd34d' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.2)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.12)'; }}
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${openGuestActionsId === guest.id ? 'rotate-180' : ''}`} />
                    </button>

                    {openGuestActionsId === guest.id && (
                      <div className="absolute right-0 mt-2 w-48 rounded-2xl z-[100] overflow-hidden animate-fade-in py-2 border"
                           style={{
                             background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
                             borderColor: 'rgba(255,255,255,0.08)',
                             boxShadow: '0 20px 60px -20px rgba(0,0,0,0.8)',
                           }}>
                        <button
                          onClick={() => { handleShareInvitation(guest); setOpenGuestActionsId(null); }}
                          className="w-full px-4 py-2 text-left text-sm font-semibold flex items-center transition-colors"
                          style={{ color: '#6ee7b7' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <MessageSquare className="h-4 w-4 mr-3" />
                          WhatsApp
                        </button>
                        <button
                          onClick={() => { sendEmailInvitation(guest); setOpenGuestActionsId(null); }}
                          className="w-full px-4 py-2 text-left text-sm font-semibold flex items-center transition-colors"
                          style={{ color: '#93c5fd' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Mail className="h-4 w-4 mr-3" />
                          Email
                        </button>
                        <div className="h-[1px] my-1 mx-2" style={{ background: 'rgba(255,255,255,0.06)' }}></div>
                        <button
                          onClick={() => { openEditGuestModal(guest); setOpenGuestActionsId(null); }}
                          className="w-full px-4 py-2 text-left text-sm font-semibold flex items-center transition-colors"
                          style={{ color: '#fcd34d' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.08)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Edit className="h-4 w-4 mr-3" />
                          Modifier
                        </button>
                        <button
                          onClick={() => { handleDeleteGuest(guest.id); setOpenGuestActionsId(null); }}
                          className="w-full px-4 py-2 text-left text-sm font-semibold flex items-center transition-colors"
                          style={{ color: '#fca5a5' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Trash2 className="h-4 w-4 mr-3" />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleShareInvitation(guest)}
                      className="p-2 rounded-lg transition-all duration-200 transform hover:scale-110"
                      style={{ color: '#34d399' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      aria-label="Partager l'invitation"
                      title="Partager l'invitation"
                    >
                      <MessageSquare className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => sendEmailInvitation(guest)}
                      className="p-2 rounded-lg transition-all duration-200 transform hover:scale-110"
                      style={{ color: '#60a5fa' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      aria-label="Envoyer par Email"
                      title="Envoyer par Email"
                    >
                      <Mail className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => openEditGuestModal(guest)}
                      className="p-2 rounded-lg transition-all duration-200 transform hover:scale-110"
                      style={{ color: '#fbbf24' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      aria-label="Modifier l'invité"
                      title="Modifier l'invité"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteGuest(guest.id)}
                      className="p-2 rounded-lg transition-all duration-200 transform hover:scale-110"
                      style={{ color: '#f87171' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      aria-label="Supprimer l'invité"
                      title="Supprimer l'invité"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {guests.length === 0 && (
          <div className="relative z-10 p-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.25)' }} />
            <h3 className="text-lg font-semibold text-white/70 mb-2">Aucun invité ajouté</h3>
            <p className="text-white/50">Commencez par ajouter vos premiers invités</p>
          </div>
        )}
      </div>
    </div>
  );
  };

  const renderTables = () => (
    <div className="animate-fade-in">
      <TableManagement
        tables={tables}
        setTables={setTables}
        guests={guests}
        onSaveTable={handleSaveTable}
        onDeleteTable={handleDeleteTable}
        isLoading={isLoading}
      />
    </div>
  );



  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'templates':
        return renderTemplates();
      case 'guests':
        return renderGuests();
      case 'tables':
        return renderTables();
      case 'messages':
        return (
          <div className="animate-fade-in max-w-5xl mx-auto">
            <GuestMessagesViewer />
          </div>
        );
      case 'games':
        return renderGames();
      case 'users':
        return isAdmin ? (
          <div className="animate-fade-in">
            <UserManagement />
          </div>
        ) : renderOverview();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] relative overflow-hidden">
      <style>{`
        .guest-filter-select option,
        .guest-sort-select option {
          background-color: #ffffff;
          color: #0b0f17;
        }
      `}</style>
      {/* Subtle dot grid pattern — identique à la page d'accueil */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '26px 26px',
        }}
      />
      {/* Ambient glows larges — identiques style Services/WhyChoose */}
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 right-0 w-[620px] h-[620px] translate-x-1/3 rounded-full blur-3xl"
             style={{
               background:
                 'radial-gradient(closest-side, rgba(251,191,36,0.22), rgba(251,191,36,0) 70%)',
             }}
        />
        <div className="absolute bottom-40 left-0 w-[580px] h-[580px] -translate-x-1/3 rounded-full blur-3xl"
             style={{
               background:
                 'radial-gradient(closest-side, rgba(217,70,239,0.15), rgba(217,70,239,0) 70%)',
             }}
        />
        <div className="absolute top-2/3 left-1/3 w-[400px] h-[400px] rounded-full blur-3xl opacity-55 animate-float"
             style={{
               background:
                 'radial-gradient(closest-side, rgba(244,114,182,0.10), rgba(244,114,182,0) 70%)',
             }}
        />
      </div>
      {/* Header */}
      <header className="relative z-10 backdrop-blur-xl border-b" style={{
        background: 'linear-gradient(180deg, rgba(17,23,39,0.92) 0%, rgba(13,18,32,0.92) 100%)',
        borderColor: 'rgba(255,255,255,0.05)',
        boxShadow: '0 0 0 1px rgba(251,191,36,0.05) inset'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onBackToHome ? onBackToHome() : window.location.reload()}
                className="flex items-center text-amber-600 hover:text-amber-700 transition-all duration-300 group"
              >
                <ArrowLeft className="h-5 w-5 md:mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="hidden md:inline">Retour à l'accueil</span>
              </button>
              
              <div className="flex items-center space-x-1 md:space-x-2">
                <div className="relative">
                  <Crown className="h-6 w-6 md:h-8 md:w-8 text-amber-500 animate-glow drop-shadow-lg" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm md:text-xl font-bold bg-gradient-to-r from-slate-900 via-amber-700 to-slate-900 dark:from-slate-100 dark:via-amber-300 dark:to-slate-100 bg-clip-text text-transparent truncate max-w-[120px] md:max-w-none">
                    Furaha-Event
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-1.5 md:p-2 rounded-lg transition-all duration-200 relative"
                  style={{
                    color: showNotifications ? '#fcd34d' : 'rgba(255,255,255,0.65)',
                    background: showNotifications ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#fcd34d'; e.currentTarget.style.background = 'rgba(251,191,36,0.12)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = showNotifications ? '#fcd34d' : 'rgba(255,255,255,0.65)'; e.currentTarget.style.background = showNotifications ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.03)'; }}
                >
                  <Bell className="h-5 w-5" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 animate-pulse" style={{ background: '#ef4444', boxShadow: '0 0 0 2px #0d1220' }}></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 md:w-80 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in border"
                       style={{
                         background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
                         borderColor: 'rgba(255,255,255,0.08)',
                         boxShadow: '0 30px 80px -30px rgba(0,0,0,0.9)',
                       }}>
                    <div className="p-3 md:p-4 border-b flex justify-between items-center"
                         style={{
                           borderColor: 'rgba(255,255,255,0.06)',
                           background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
                         }}>
                      <h3 className="font-extrabold text-white text-sm md:text-base tracking-tight">Notifications</h3>
                      <button 
                        onClick={() => notificationService.markAllAsRead(userData?.uid || '')}
                        className="text-[10px] md:text-xs font-semibold transition-colors"
                        style={{ color: '#fcd34d' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#fbbf24'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#fcd34d'; }}
                      >
                        Tout marquer lu
                      </button>
                    </div>
                    <div className="max-h-64 md:max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div 
                            key={notification.id}
                            onClick={() => {
                              if (notification.id) notificationService.markAsRead(notification.id);
                              setShowNotifications(false);
                            }}
                            className={`p-3 md:p-4 border-b cursor-pointer transition-colors duration-200`}
                            style={{
                              borderColor: 'rgba(255,255,255,0.05)',
                              background: !notification.read ? 'rgba(251,191,36,0.06)' : 'transparent',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = !notification.read ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.03)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = !notification.read ? 'rgba(251,191,36,0.06)' : 'transparent'; }}
                          >
                            <div className="flex items-start">
                              <div className={`p-1.5 md:p-2 rounded-lg mr-2 md:mr-3`}
                                   style={{
                                     background: notification.type === 'confirmation'
                                       ? 'rgba(16,185,129,0.15)'
                                       : notification.type === 'message'
                                       ? 'rgba(59,130,246,0.15)'
                                       : 'rgba(251,191,36,0.15)',
                                     color: notification.type === 'confirmation'
                                       ? '#6ee7b7'
                                       : notification.type === 'message'
                                       ? '#93c5fd'
                                       : '#fcd34d',
                                   }}>
                                {notification.type === 'confirmation' ? <Check className="h-3 w-3 md:h-4 md:w-4" /> :
                                 notification.type === 'message' ? <MessageSquare className="h-3 w-3 md:h-4 md:w-4" /> :
                                 <Bell className="h-3 w-3 md:h-4 md:w-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs md:text-sm font-semibold text-white truncate">{notification.title}</p>
                                <p className="text-[10px] md:text-xs text-white/55 line-clamp-2">{notification.body}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 md:p-8 text-center">
                          <Bell className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.25)' }} />
                          <p className="text-xs md:text-sm text-white/45">Aucune notification</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowSettings(true)}
                className="hidden md:block p-2 rounded-lg transition-all duration-200"
                style={{ color: 'rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#fcd34d'; e.currentTarget.style.background = 'rgba(251,191,36,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
              >
                <Settings className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center space-x-1.5 md:space-x-2 text-[#0b0f17] p-1.5 md:px-4 md:py-2 rounded-lg transition-all duration-300 font-semibold group"
                style={{
                  background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 10px 30px -10px rgba(251,191,36,0.55)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >
                {userData && (
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-[#0b0f17] rounded-full flex items-center justify-center font-bold text-[8px] md:text-xs" style={{ color: '#fcd34d' }}>
                    {userData.firstName[0]}{userData.lastName[0]}
                  </div>
                )}
                <span className="hidden md:block text-xs md:text-sm">Profil</span>
              </button>
              
              <button
                onClick={openLogoutConfirm}
                className="p-1.5 md:p-2 rounded-lg transition-all duration-200"
                style={{ color: 'rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#fca5a5'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                title="Se déconnecter"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation - Desktop only (hidden on mobile) */}
      <nav className="relative z-10 hidden md:block sticky top-16 z-40 border-b" style={{
        background: 'linear-gradient(180deg, rgba(17,23,39,0.95) 0%, rgba(13,18,32,0.95) 100%)',
        borderColor: 'rgba(255,255,255,0.05)',
        boxShadow: '0 0 0 1px rgba(251,191,36,0.03) inset'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-amber-500'
                      : 'border-transparent hover:border-white/10'
                  }`}
                  style={{
                    color: activeTab === tab.id ? '#fcd34d' : 'rgba(255,255,255,0.55)'
                  }}
                  onMouseEnter={(e) => { if (activeTab !== tab.id) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)'; }}
                  onMouseLeave={(e) => { if (activeTab !== tab.id) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)'; }}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Bottom Navigation - Mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-lg border-t z-[60] pb-safe" style={{
        background: 'linear-gradient(180deg, rgba(17,23,39,0.94) 0%, rgba(13,18,32,0.96) 100%)',
        borderColor: 'rgba(251,191,36,0.08)',
      }}>
        <div className="flex justify-around items-center h-16">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300`}
                style={{ color: isActive ? '#fcd34d' : 'rgba(255,255,255,0.5)' }}
              >
                <div className={`p-1 rounded-lg`} style={{ background: isActive ? 'rgba(251,191,36,0.12)' : 'transparent' }}>
                  <IconComponent className={`h-5 w-5 ${isActive ? 'scale-110' : ''}`} />
                </div>
                <span className="text-[10px] font-medium">{tab.label === 'Vue d\'ensemble' ? 'Accueil' : tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        {renderTabContent()}
      </main>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[1000] px-4 py-3 rounded-xl border backdrop-blur-xl animate-fade-in`}
             style={{
               background: toast.type === 'success'
                 ? 'linear-gradient(180deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.1) 100%)'
                 : toast.type === 'error'
                 ? 'linear-gradient(180deg, rgba(239,68,68,0.2) 0%, rgba(239,68,68,0.1) 100%)'
                 : 'linear-gradient(180deg, rgba(251,191,36,0.2) 0%, rgba(251,191,36,0.1) 100%)',
               borderColor: toast.type === 'success'
                 ? 'rgba(16,185,129,0.35)'
                 : toast.type === 'error'
                 ? 'rgba(239,68,68,0.35)'
                 : 'rgba(251,191,36,0.35)',
               color: toast.type === 'success'
                 ? '#6ee7b7'
                 : toast.type === 'error'
                 ? '#fca5a5'
                 : '#fcd34d',
               boxShadow: '0 20px 60px -20px rgba(0,0,0,0.6)',
             }}>
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Modals */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={subscription?.plan || 'free'}
        remainingInvites={getRemainingInvites()}
      />

      <DashboardSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        isLoading={confirmModal.isLoading}
      />



      {/* Modal d'ajout d'invité */}
      {showAddGuestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="rounded-2xl max-w-md w-full animate-slide-up border overflow-hidden"
               style={{
                 background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
                 borderColor: 'rgba(255,255,255,0.08)',
                 boxShadow: '0 40px 120px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(251,191,36,0.06) inset',
               }}>
            <div className="p-6 border-b flex justify-between items-center"
                 style={{
                   borderColor: 'rgba(255,255,255,0.06)',
                   background: 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(255,255,255,0) 70%)',
                 }}>
              <div className="flex justify-between items-center w-full">
                <h3 className="text-xl font-extrabold tracking-tight text-white">{editingGuestId ? 'Modifier l\'invité' : 'Ajouter un invité'}</h3>
                <button
                  onClick={() => closeAddGuestModal()}
                  className="p-2 rounded-lg transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={newGuest.nom}
                    onChange={(e) => setNewGuest({ ...newGuest, nom: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl transition-all duration-200 outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#ffffff',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                    placeholder="Ex: Sophie Martin"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">
                    Catégorie
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={categorySearchInput}
                      onChange={(e) => {
                        setCategorySearchInput(e.target.value);
                        setShowCategoryDropdown(true);
                      }}
                      onFocus={(e) => {
                        setShowCategoryDropdown(true);
                        e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)';
                      }}
                      onBlur={(e) => {
                        if (!quickAddCategoryMode) {
                          setTimeout(() => setShowCategoryDropdown(false), 200);
                        }
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      className="w-full px-4 py-3 rounded-xl transition-all duration-200 outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#ffffff',
                      }}
                      placeholder="Rechercher ou ajouter une catégorie..."
                    />
                    {showCategoryDropdown && (
                      <div
                        className="absolute z-10 w-full mt-1 rounded-xl border overflow-hidden"
                        style={{
                          background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
                          borderColor: 'rgba(255,255,255,0.08)',
                          boxShadow: '0 20px 60px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(251,191,36,0.04) inset',
                        }}
                      >
                        <div className="max-h-64 overflow-y-auto">
                          <div
                            className="px-3 py-2 border-b"
                            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                          >
                            {!quickAddCategoryMode ? (
                              <button
                                key="quick-add-category"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setQuickAddCategoryName(categorySearchInput.trim() || '');
                                  setQuickAddCategoryMode(true);
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
                                style={{
                                  color: '#fcd34d',
                                  background:
                                    'linear-gradient(180deg, rgba(251,191,36,0.12) 0%, rgba(251,191,36,0.04) 100%)',
                                  border: '1px solid rgba(251,191,36,0.2)',
                                }}
                              >
                                <Plus className="w-4 h-4" />
                                <span className="font-semibold text-sm">Nouvelle catégorie</span>
                              </button>
                            ) : (
                              <div className="space-y-2">
                              <input
                                autoFocus
                                type="text"
                                value={quickAddCategoryName}
                                onChange={(e) => setQuickAddCategoryName(e.target.value)}
                                onMouseDown={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && quickAddCategoryName.trim()) {
                                    e.preventDefault();
                                    const newCat = quickAddCategoryName.trim();
                                    createGuestCategory(newCat).then(async () => {
                                      await refreshUserData();
                                      setNewGuest({ ...newGuest, category: newCat });
                                      setCategorySearchInput(newCat);
                                      setQuickAddCategoryMode(false);
                                      setQuickAddCategoryName('');
                                      setShowCategoryDropdown(false);
                                    });
                                  }
                                  if (e.key === 'Escape') {
                                    setQuickAddCategoryMode(false);
                                    setQuickAddCategoryName('');
                                  }
                                }}
                                className="w-full px-3 py-2 rounded-lg outline-none text-sm"
                                style={{
                                  background: 'rgba(255,255,255,0.04)',
                                  border: '1px solid rgba(251,191,36,0.3)',
                                  color: '#ffffff',
                                }}
                                placeholder="Nom de la catégorie..."
                              />
                              <div className="flex gap-2">
                                <button
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={async () => {
                                    const newCat = quickAddCategoryName.trim();
                                    if (!newCat) return;
                                    await createGuestCategory(newCat);
                                    await refreshUserData();
                                    setNewGuest({ ...newGuest, category: newCat });
                                    setCategorySearchInput(newCat);
                                    setQuickAddCategoryMode(false);
                                    setQuickAddCategoryName('');
                                    setShowCategoryDropdown(false);
                                  }}
                                  disabled={!quickAddCategoryName.trim()}
                                  className="flex-1 px-3 py-1.5 rounded-lg font-semibold text-xs text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  style={{
                                    background:
                                      'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                                    color: '#0b0f17',
                                  }}
                                >
                                  Créer
                                </button>
                                <button
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setQuickAddCategoryMode(false);
                                    setQuickAddCategoryName('');
                                  }}
                                  className="px-3 py-1.5 rounded-lg font-medium text-xs text-sm transition-all"
                                  style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'rgba(255,255,255,0.7)',
                                  }}
                                >
                                  Annuler
                                </button>
                              </div>
                            </div>
                            )}
                          </div>

                        <button
                          key="no-category"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setNewGuest({ ...newGuest, category: '' });
                            setCategorySearchInput('');
                            setShowCategoryDropdown(false);
                            setQuickAddCategoryMode(false);
                          }}
                          className="w-full text-left px-4 py-2 transition-colors text-white/55"
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.08)'; e.currentTarget.style.color = '#fcd34d'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
                        >
                          Aucune catégorie
                        </button>
                        {availableCategories
                          .filter(cat => cat.toLowerCase().includes(categorySearchInput.toLowerCase()))
                          .map((catName) => (
                            <button
                              key={catName}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setNewGuest({ ...newGuest, category: catName });
                                setCategorySearchInput(catName);
                                setShowCategoryDropdown(false);
                                setQuickAddCategoryMode(false);
                              }}
                              className="w-full text-left px-4 py-2 transition-colors"
                              style={{
                                background: newGuest.category === catName ? 'rgba(251,191,36,0.12)' : 'transparent',
                                color: newGuest.category === catName ? '#fcd34d' : 'rgba(255,255,255,0.8)',
                                borderLeft: newGuest.category === catName ? '2px solid #fcd34d' : '2px solid transparent',
                              }}
                              onMouseEnter={(e) => { if (newGuest.category !== catName) { e.currentTarget.style.background = 'rgba(251,191,36,0.06)'; e.currentTarget.style.color = '#fcd34d'; } }}
                              onMouseLeave={(e) => { if (newGuest.category !== catName) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; } }}
                            >
                              {catName}
                            </button>
                          ))}
                        {categorySearchInput.trim() && !availableCategories.includes(categorySearchInput.trim()) && !quickAddCategoryMode && (
                          <button
                            key="add-category"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={async () => {
                              const newCat = categorySearchInput.trim();
                              await createGuestCategory(newCat);
                              await refreshUserData();
                              setNewGuest({ ...newGuest, category: newCat });
                              setCategorySearchInput(newCat);
                              setShowCategoryDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 transition-colors font-semibold"
                            style={{
                              color: '#fcd34d',
                              borderTop: '1px solid rgba(255,255,255,0.06)',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            + Ajouter "{categorySearchInput.trim()}"
                          </button>
                        )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">
                    Table
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tableSearchInput}
                      onChange={(e) => {
                        setTableSearchInput(e.target.value);
                        setShowTableDropdown(true);
                      }}
                      onFocus={(e) => {
                        setShowTableDropdown(true);
                        e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)';
                      }}
                      onBlur={(e) => {
                        if (!quickAddTableMode) {
                          setTimeout(() => setShowTableDropdown(false), 200);
                        }
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      className="w-full px-4 py-3 rounded-xl transition-all duration-200 outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#ffffff',
                      }}
                      placeholder="Rechercher ou ajouter une table..."
                    />
                    {showTableDropdown && (
                      <div
                        className="absolute z-10 w-full mt-1 rounded-xl border overflow-hidden"
                        style={{
                          background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
                          borderColor: 'rgba(255,255,255,0.08)',
                          boxShadow: '0 20px 60px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(251,191,36,0.04) inset',
                        }}
                      >
                        <div className="max-h-64 overflow-y-auto">
                          <div
                            className="px-3 py-2 border-b"
                            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                          >
                            {!quickAddTableMode ? (
                              <button
                                key="quick-add-table"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setQuickAddTableName(tableSearchInput.trim() || '');
                                  setQuickAddTableSeats(8);
                                  setQuickAddTableMode(true);
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
                                style={{
                                  color: '#fcd34d',
                                  background:
                                    'linear-gradient(180deg, rgba(251,191,36,0.12) 0%, rgba(251,191,36,0.04) 100%)',
                                  border: '1px solid rgba(251,191,36,0.2)',
                                }}
                              >
                                <Plus className="w-4 h-4" />
                                <span className="font-semibold text-sm">Nouvelle table</span>
                              </button>
                            ) : (
                              <div className="space-y-2">
                                <input
                                  autoFocus
                                  type="text"
                                  value={quickAddTableName}
                                  onChange={(e) => setQuickAddTableName(e.target.value)}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onKeyDown={async (e) => {
                                    if (e.key === 'Enter' && quickAddTableName.trim()) {
                                      e.preventDefault();
                                      const newTableName = quickAddTableName.trim();
                                      await createTable({
                                        name: newTableName,
                                        seats: Number(quickAddTableSeats) || 8,
                                      });
                                      await refreshUserData();
                                      setNewGuest({ ...newGuest, table: newTableName });
                                      setTableSearchInput(newTableName);
                                      setQuickAddTableMode(false);
                                      setQuickAddTableName('');
                                      setShowTableDropdown(false);
                                    }
                                    if (e.key === 'Escape') {
                                      setQuickAddTableMode(false);
                                      setQuickAddTableName('');
                                    }
                                  }}
                                  className="w-full px-3 py-2 rounded-lg outline-none text-sm"
                                  style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(251,191,36,0.3)',
                                    color: '#ffffff',
                                  }}
                                  placeholder="Nom de la table (ex: Table des mariés)"
                                />
                                <div className="flex items-center gap-2">
                                  <span
                                    className="text-xs shrink-0"
                                    style={{ color: 'rgba(255,255,255,0.6)' }}
                                  >
                                    Places :
                                  </span>
                                  <input
                                    type="number"
                                    min={1}
                                    max={99}
                                    value={quickAddTableSeats}
                                    onChange={(e) => {
                                      const v = Number(e.target.value);
                                      setQuickAddTableSeats(
                                        isNaN(v) ? 8 : Math.max(1, Math.min(99, v))
                                      );
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onKeyDown={async (e) => {
                                      if (e.key === 'Enter' && quickAddTableName.trim()) {
                                        e.preventDefault();
                                        const newTableName = quickAddTableName.trim();
                                        await createTable({
                                          name: newTableName,
                                          seats: Number(quickAddTableSeats) || 8,
                                        });
                                        await refreshUserData();
                                        setNewGuest({ ...newGuest, table: newTableName });
                                        setTableSearchInput(newTableName);
                                        setQuickAddTableMode(false);
                                        setQuickAddTableName('');
                                        setShowTableDropdown(false);
                                      }
                                    }}
                                    className="flex-1 w-full px-3 py-1.5 rounded-lg outline-none text-sm"
                                    style={{
                                      background: 'rgba(255,255,255,0.04)',
                                      border: '1px solid rgba(255,255,255,0.12)',
                                      color: '#ffffff',
                                    }}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={async () => {
                                      const newTableName = quickAddTableName.trim();
                                      if (!newTableName) return;
                                      await createTable({
                                        name: newTableName,
                                        seats: Number(quickAddTableSeats) || 8,
                                      });
                                      await refreshUserData();
                                      setNewGuest({ ...newGuest, table: newTableName });
                                      setTableSearchInput(newTableName);
                                      setQuickAddTableMode(false);
                                      setQuickAddTableName('');
                                      setShowTableDropdown(false);
                                    }}
                                    disabled={!quickAddTableName.trim()}
                                    className="flex-1 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                      background:
                                        'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                                      color: '#0b0f17',
                                    }}
                                  >
                                    Créer
                                  </button>
                                  <button
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                      setQuickAddTableMode(false);
                                      setQuickAddTableName('');
                                    }}
                                    className="px-3 py-1.5 rounded-lg font-medium text-xs transition-all"
                                    style={{
                                      background: 'rgba(255,255,255,0.04)',
                                      border: '1px solid rgba(255,255,255,0.1)',
                                      color: 'rgba(255,255,255,0.7)',
                                    }}
                                  >
                                    Annuler
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                        <button
                          key="select-table"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setNewGuest({ ...newGuest, table: '' });
                            setTableSearchInput('');
                            setShowTableDropdown(false);
                            setQuickAddTableMode(false);
                          }}
                          className="w-full text-left px-4 py-2 transition-colors text-white/55"
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.08)'; e.currentTarget.style.color = '#fcd34d'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
                        >
                          Sélectionner une table
                        </button>
                        <button
                          key="no-table"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setNewGuest({ ...newGuest, table: 'Non assigné' });
                            setTableSearchInput('Non assigné');
                            setShowTableDropdown(false);
                            setQuickAddTableMode(false);
                          }}
                          className="w-full text-left px-4 py-2 transition-colors text-white/55"
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.08)'; e.currentTarget.style.color = '#fcd34d'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
                        >
                          Non assigné
                        </button>
                        {availableTables
                          .filter(table => table.name.toLowerCase().includes(tableSearchInput.toLowerCase()))
                          .map((table) => {
                            const tableGuests = guests.filter(g => {
                              const isSameTable = g.table === table.name;
                              const isNotEditingGuest = editingGuestId ? String(g.id) !== String(editingGuestId) : true;
                              return isSameTable && isNotEditingGuest;
                            });
                            const currentOccupiedSeats = tableGuests.reduce((total, guest) => {
                              return total + (guest.etat === 'couple' ? 2 : 1);
                            }, 0);
                            
                            const remainingSeats = table.seats > 0 ? Math.max(Number(table.seats) - currentOccupiedSeats, 0) : null;

                            return (
                              <button
                                key={table.id}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setNewGuest({ ...newGuest, table: table.name });
                                  setTableSearchInput(table.name);
                                  setShowTableDropdown(false);
                                  setQuickAddTableMode(false);
                                }}
                                className="w-full text-left px-4 py-2 transition-colors"
                                style={{
                                  background: newGuest.table === table.name ? 'rgba(251,191,36,0.12)' : 'transparent',
                                  color: newGuest.table === table.name ? '#fcd34d' : 'rgba(255,255,255,0.8)',
                                  borderLeft: newGuest.table === table.name ? '2px solid #fcd34d' : '2px solid transparent',
                                }}
                                onMouseEnter={(e) => { if (newGuest.table !== table.name) { e.currentTarget.style.background = 'rgba(251,191,36,0.06)'; e.currentTarget.style.color = '#fcd34d'; } }}
                                onMouseLeave={(e) => { if (newGuest.table !== table.name) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; } }}
                              >
                                {table.name} {remainingSeats !== null ? <span style={{ color: 'rgba(255,255,255,0.45)' }}>({remainingSeats} restantes)</span> : ''}
                              </button>
                            );
                          })}
                        {tableSearchInput.trim() && !availableTables.find(t => t.name === tableSearchInput.trim()) && tableSearchInput.trim() !== 'Non assigné' && !quickAddTableMode && (
                          <button
                            key="add-table"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setQuickAddTableName(tableSearchInput.trim());
                              setQuickAddTableSeats(8);
                              setQuickAddTableMode(true);
                            }}
                            className="w-full text-left px-4 py-2 transition-colors font-semibold"
                            style={{
                              color: '#fcd34d',
                              borderTop: '1px solid rgba(255,255,255,0.06)',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            + Ajouter "{tableSearchInput.trim()}"
                          </button>
                        )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-2">
                    Statut
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewGuest({ ...newGuest, etat: 'simple' })}
                      className="flex items-center justify-center px-4 py-3 rounded-xl border-2 transition-all duration-300 font-medium"
                      style={{
                        borderColor: newGuest.etat === 'simple' ? 'rgba(16,185,129,0.6)' : 'rgba(255,255,255,0.08)',
                        background: newGuest.etat === 'simple' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.02)',
                        color: newGuest.etat === 'simple' ? '#6ee7b7' : 'rgba(255,255,255,0.75)',
                        boxShadow: newGuest.etat === 'simple' ? '0 0 0 1px rgba(16,185,129,0.25), 0 8px 20px -8px rgba(16,185,129,0.4)' : 'none',
                      }}
                      onMouseEnter={(e) => { if (newGuest.etat !== 'simple') { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.35)'; e.currentTarget.style.color = '#6ee7b7'; } }}
                      onMouseLeave={(e) => { if (newGuest.etat !== 'simple') { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; } }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Simple
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setNewGuest({ ...newGuest, etat: 'couple' })}
                      className="flex items-center justify-center px-4 py-3 rounded-xl border-2 transition-all duration-300 font-medium"
                      style={{
                        borderColor: newGuest.etat === 'couple' ? 'rgba(236,72,153,0.6)' : 'rgba(255,255,255,0.08)',
                        background: newGuest.etat === 'couple' ? 'rgba(236,72,153,0.12)' : 'rgba(255,255,255,0.02)',
                        color: newGuest.etat === 'couple' ? '#f9a8d4' : 'rgba(255,255,255,0.75)',
                        boxShadow: newGuest.etat === 'couple' ? '0 0 0 1px rgba(236,72,153,0.25), 0 8px 20px -8px rgba(236,72,153,0.4)' : 'none',
                      }}
                      onMouseEnter={(e) => { if (newGuest.etat !== 'couple') { e.currentTarget.style.borderColor = 'rgba(236,72,153,0.35)'; e.currentTarget.style.color = '#f9a8d4'; } }}
                      onMouseLeave={(e) => { if (newGuest.etat !== 'couple') { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; } }}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Couple
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => closeAddGuestModal()}
                  className="flex-1 px-4 py-3 rounded-xl transition-all duration-300 font-medium border"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.75)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddGuest}
                  disabled={isAddingGuest || !newGuest.nom.trim()}
                  className="flex-1 px-4 py-3 rounded-xl transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: isAddingGuest || !newGuest.nom.trim() ? 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)' : 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                    color: '#0b0f17',
                    boxShadow: isAddingGuest || !newGuest.nom.trim() ? 'none' : '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 10px 24px -10px rgba(251,191,36,0.65)',
                  }}
                  onMouseEnter={(e) => { if (!isAddingGuest && newGuest.nom.trim()) { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.transform = 'scale(1.02)'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  {isAddingGuest ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-[#0b0f17]/30 border-t-[#0b0f17] rounded-full animate-spin mr-2"></div>
                      {editingGuestId ? 'Modification...' : 'Ajout...'}
                    </div>
                  ) : (
                    editingGuestId ? 'Modifier' : 'Ajouter'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal gestion des catégories */}
      {showCategoryManager && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="rounded-2xl max-w-sm w-full animate-slide-up border overflow-hidden"
               style={{
                 background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
                 borderColor: 'rgba(255,255,255,0.08)',
                 boxShadow: '0 40px 120px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(251,191,36,0.06) inset',
               }}>
            <div className="p-6 border-b flex justify-between items-center"
                 style={{
                   borderColor: 'rgba(255,255,255,0.06)',
                   background: 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(255,255,255,0) 70%)',
                 }}>
              <div className="flex justify-between items-center w-full">
                <h3 className="text-xl font-extrabold tracking-tight text-white">Gérer les catégories</h3>
                <button
                  onClick={() => setShowCategoryManager(false)}
                  className="p-2 rounded-lg transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl transition-all duration-200 outline-none text-white"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#ffffff',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  placeholder={editingCategoryId ? "Modifier la catégorie..." : "Nouvelle catégorie..."}
                />
                <button
                  onClick={handleSaveCategory}
                  disabled={!newCategoryName.trim()}
                  className="text-[#0b0f17] px-4 py-2 rounded-xl transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: editingCategoryId
                      ? 'linear-gradient(180deg, #34d399 0%, #10b981 100%)'
                      : 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                    boxShadow: editingCategoryId
                      ? '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(16,185,129,0.5), 0 8px 20px -8px rgba(16,185,129,0.6)'
                      : '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 8px 20px -8px rgba(251,191,36,0.65)',
                  }}
                >
                  {editingCategoryId ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </button>
                {editingCategoryId && (
                  <button
                    onClick={() => {
                      setNewCategoryName('');
                      setEditingCategoryId(null);
                    }}
                    className="px-4 py-2 rounded-xl transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.7)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {userCategories.map(cat => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 rounded-xl border"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderColor: 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <span className="font-semibold text-white/85">{cat.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setNewCategoryName(cat.name);
                          setEditingCategoryId(cat.id);
                        }}
                        className="p-2 rounded-lg transition-all duration-200"
                        style={{
                          background: 'rgba(251,191,36,0.12)',
                          color: '#fcd34d',
                          border: '1px solid rgba(251,191,36,0.2)',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.12)'; }}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategoryWrapper(cat.id)}
                        className="p-2 rounded-lg transition-all duration-200"
                        style={{
                          background: 'rgba(244,63,94,0.12)',
                          color: '#fda4af',
                          border: '1px solid rgba(244,63,94,0.2)',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.12)'; }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {userCategories.length === 0 && (
                  <p className="text-center text-white/40 py-4 text-sm">Aucune catégorie personnalisée</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'export des invités */}
      <GuestExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        guests={guests}
        tables={tables}
        categories={userCategories}
      />
      <GuestImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleBulkImport}
        categories={userCategories}
        tables={tables}
        existingGuests={guests}
      />

      {/* Modal de rappel push */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full flex flex-col overflow-hidden animate-zoom-in">
            {/* Header */}
            <div className="p-6 border-b border-neutral-100 bg-gradient-to-r from-purple-50 to-violet-50/30">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="bg-purple-500 p-2.5 rounded-2xl mr-4 shadow-lg shadow-purple-200">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">Envoyer un rappel</h2>
                    <p className="text-slate-500 text-sm font-medium">Notification push à tous les invités</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowReminderModal(false)}
                  className="p-2 hover:bg-white rounded-xl transition-all text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Titre de la notification</label>
                <input
                  type="text"
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-sm"
                  placeholder="Rappel événement"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                <textarea
                  value={reminderBody}
                  onChange={(e) => setReminderBody(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-sm resize-none"
                  placeholder="Message de rappel..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Lien de redirection (optionnel)</label>
                <input
                  type="text"
                  value={reminderUrl}
                  onChange={(e) => setReminderUrl(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-sm"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-neutral-100 bg-gradient-to-r from-white to-neutral-50">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="flex-1 px-5 py-3 bg-white border border-neutral-300 text-slate-700 font-semibold rounded-xl hover:bg-neutral-50 transition-all duration-200"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSendReminder}
                  disabled={isSendingReminder}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingReminder ? "Envoi en cours..." : "Envoyer le rappel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'envoi en masse WhatsApp */}
      {showBulkSendModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-zoom-in">
            {/* Header */}
            <div className="p-6 border-b border-neutral-100 bg-gradient-to-r from-amber-50 to-orange-50/30">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="bg-amber-500 p-2.5 rounded-2xl mr-4 shadow-lg shadow-amber-200">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">Assistant d'envoi</h2>
                    <p className="text-slate-500 text-sm font-medium">{selectedGuestIds.length} invitations à partager</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowBulkSendModal(false)}
                  className="p-2 hover:bg-white rounded-xl transition-all text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className="px-6 pt-6">
              <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50 flex items-start">
                <div className="bg-blue-100 p-1.5 rounded-lg mr-3 flex-shrink-0">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Cliquez sur <b>"Envoyer"</b> pour chaque invité. Cela ouvrira WhatsApp avec le message prêt. Envoyez-le à votre contact, puis revenez ici pour l'invité suivant.
                </p>
              </div>
            </div>

            {/* List */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="space-y-3">
                {guests.filter(g => selectedGuestIds.includes(g.id)).map((guest) => {
                  const isSent = sentGuestIds.includes(guest.id);
                  return (
                    <div 
                      key={guest.id} 
                      className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                        isSent 
                          ? 'bg-emerald-50/50 border-emerald-100 opacity-75' 
                          : 'bg-white border-neutral-100 hover:border-amber-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm mr-3 transition-colors ${
                          isSent ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-600'
                        }`}>
                          {guest.nom.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-bold text-sm truncate ${isSent ? 'text-emerald-700' : 'text-slate-900'}`}>
                            {guest.nom}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                            Table: {guest.table}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const composed = buildConciseMessage(guest);
                          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(composed)}`;
                          window.open(whatsappUrl, '_blank');
                          if (!isSent) setSentGuestIds(prev => [...prev, guest.id]);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center shadow-sm ${
                          isSent 
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                            : 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-100'
                        }`}
                      >
                        {isSent ? (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1.5" />
                            Renvoyer
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5 mr-1.5" />
                            Envoyer
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-neutral-100 bg-neutral-50/50">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-slate-600">
                  Progression : <span className="text-slate-900 font-bold">{sentGuestIds.length} / {selectedGuestIds.length}</span>
                </div>
                <div className="h-2 w-32 bg-neutral-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(sentGuestIds.length / selectedGuestIds.length) * 100}%` }}
                  ></div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowBulkSendModal(false);
                  setSelectedGuestIds([]);
                }}
                className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg"
              >
                Terminer et fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
