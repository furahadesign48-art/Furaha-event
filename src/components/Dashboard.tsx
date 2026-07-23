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
  RefreshCw
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
        if (game.type === 'love-quiz' || game.type === 'memory-match') {
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
            <h3 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Configuration des Jeux
            </h3>
            <p className="text-xs md:text-sm text-slate-600 mt-1">Configurez les jeux pour vos invités</p>
          </div>
        </div>

        {/* Sélection du modèle */}
        <div className="bg-white rounded-lg md:rounded-2xl shadow-luxury border border-neutral-200/50 p-3 md:p-6">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="p-1.5 md:p-2 bg-amber-100 rounded-lg">
              <Gamepad2 className="h-4 md:h-5 w-4 md:w-5 text-amber-600" />
            </div>
            <h4 className="font-semibold text-slate-900 text-sm md:text-base">Modèle sélectionné</h4>
          </div>
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {userModels.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  console.log('=== Model button clicked:', model.id);
                  setSelectedModelForGames(model.id);
                }}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl border-2 transition-all duration-300 font-medium text-xs md:text-sm ${
                  selectedModelForGames === model.id
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-neutral-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50'
                }`}
              >
                {model.name}
              </button>
            ))}
          </div>
        </div>

        {isLoadingGames ? (
          <div className="bg-white rounded-lg md:rounded-2xl shadow-luxury border border-neutral-200/50 p-3 md:p-6 flex items-center justify-center py-8 md:py-12">
            <div className="w-8 md:w-10 h-8 md:h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {/* Love Quiz Game */}
            {(() => {
              const loveQuizGame = games.find(g => g.type === 'love-quiz');
              if (!loveQuizGame) return null;
              return (
                <div className="bg-white rounded-lg md:rounded-2xl shadow-luxury border border-neutral-200/50 p-3 md:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 md:gap-0 mb-4 md:mb-6">
                    <h4 className="font-semibold text-slate-900 flex items-center gap-1.5 md:gap-2 text-sm md:text-base">
                      <Heart className="h-4 md:h-5 w-4 md:w-5 text-rose-600 fill-rose-600" />
                      Love Quiz
                    </h4>
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      <button
                        onClick={() => setSelectedGameForResults(selectedGameForResults === loveQuizGame.id ? null : loveQuizGame.id)}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                      >
                        <Trophy className="h-3.5 md:h-4 w-3.5 md:w-4" />
                        {selectedGameForResults === loveQuizGame.id ? 'Cacher' : 'Classement'}
                      </button>
                      <button
                        onClick={() => setEditingGame(loveQuizGame)}
                        className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all duration-300 font-semibold flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                      >
                        <Edit className="h-3.5 md:h-4 w-3.5 md:w-4" />
                        Config
                      </button>
                      <button
                        onClick={() => handleDeleteGame(loveQuizGame.id)}
                        className="bg-red-500 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl hover:bg-red-600 transition-all duration-300 font-semibold flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                      >
                        <Trash2 className="h-3.5 md:h-4 w-3.5 md:w-4" />
                        Suppr
                      </button>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-neutral-50 to-rose-50/30 rounded-lg md:rounded-xl border border-neutral-200/50 p-3 md:p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                          <h5 className="font-semibold text-slate-900 text-sm md:text-base">
                            {loveQuizGame.title}
                          </h5>
                          <span className={`px-1.5 md:px-2 py-0.5 rounded-full text-[9px] md:text-xs font-medium ${
                            loveQuizGame.isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-700'
                          }`}>
                            {loveQuizGame.isEnabled ? '✓' : '✗'}
                          </span>
                        </div>
                        <p className="text-xs md:text-sm text-slate-600 mb-2 md:mb-3">{loveQuizGame.description}</p>
                        {(loveQuizGame as LoveQuizConfig).questions && (loveQuizGame as LoveQuizConfig).questions.length > 0 && (
                          <div className="mt-1.5 md:mt-2 space-y-1.5 md:space-y-2">
                            {(loveQuizGame as LoveQuizConfig).questions.slice(0, 2).map((q, i) => (
                              <div key={i} className="p-1.5 md:p-2 rounded-lg bg-white border border-neutral-200 text-xs md:text-sm text-slate-700">
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
                    <div className="mt-4 md:mt-6 border-t border-neutral-200 pt-3 md:pt-4">
                      <div className="flex items-center justify-between mb-3 md:mb-4">
                        <h5 className="font-semibold text-slate-900 flex items-center gap-1.5 md:gap-2 text-sm md:text-base">
                          <Trophy className="h-4 md:h-5 w-4 md:w-5 text-amber-600" />
                          Classement
                        </h5>
                        <button
                          onClick={() => refreshGameResults(loveQuizGame.id)}
                          className="p-1.5 md:p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
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
                              className="flex items-center justify-between p-2 md:p-3 rounded-lg md:rounded-xl bg-neutral-50 border border-neutral-200"
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
                                <span className="font-semibold text-slate-800 text-xs md:text-sm">
                                  {result.guestName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 md:gap-2">
                                <span className="font-semibold text-slate-700 text-xs md:text-sm">
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
                                  className="p-1 md:p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
                                >
                                  <Trash2 className="h-3 md:h-3.5 w-3 md:w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-xs md:text-sm text-center py-3 md:py-4">
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
              <div className="bg-white rounded-2xl shadow-luxury border border-neutral-200/50 p-6 text-center">
                <div className="text-2xl text-neutral-400 mb-3">💕</div>
                <h4 className="font-semibold text-neutral-700 mb-2">Love Quiz</h4>
                <p className="text-neutral-500 mb-4">Ajoutez le quiz sur le couple à votre modèle</p>
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
                  className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all duration-300 font-semibold flex items-center gap-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter Love Quiz
                </button>
              </div>
            )}

            {/* Memory Match Game */}
            {memoryMatchGame ? (
              <div className="bg-white rounded-2xl shadow-luxury border border-neutral-200/50 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-pink-600 fill-pink-600" />
                    Love Memory Match
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedGameForResults(selectedGameForResults === memoryMatchGame.id ? null : memoryMatchGame.id)}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold flex items-center gap-2"
                    >
                      <Trophy className="h-4 w-4" />
                      {selectedGameForResults === memoryMatchGame.id ? 'Cacher Classement' : 'Voir Classement'}
                    </button>
                    <button
                      onClick={() => setEditingGame(memoryMatchGame)}
                      className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-4 py-2 rounded-xl hover:from-pink-600 hover:to-rose-700 transition-all duration-300 font-semibold flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Configurer
                    </button>
                    <button
                      onClick={() => handleDeleteGame(memoryMatchGame.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition-all duration-300 font-semibold flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-neutral-50 to-pink-50/30 rounded-xl border border-neutral-200/50 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-semibold text-slate-900">
                          {memoryMatchGame.title}
                        </h5>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          memoryMatchGame.isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-700'
                        }`}>
                          {memoryMatchGame.isEnabled ? 'Activé' : 'Désactivé'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{memoryMatchGame.description}</p>
                      {(memoryMatchGame as MemoryMatchConfig).imageUrls && (memoryMatchGame as MemoryMatchConfig).imageUrls.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {(memoryMatchGame as MemoryMatchConfig).imageUrls.slice(0, 4).map((url, i) => (
                            <img 
                              key={i}
                              src={url} 
                              alt={`Memory ${i+1}`} 
                              className="w-full h-12 object-cover rounded-lg border border-neutral-200"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Leaderboard section */}
                {selectedGameForResults === memoryMatchGame.id && (
                  <div className="mt-6 border-t border-neutral-200 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-600" />
                        Classement des joueurs
                      </h5>
                      <button
                        onClick={() => refreshGameResults(memoryMatchGame.id)}
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all flex items-center gap-2"
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
                            className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200"
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
                              <span className="font-semibold text-slate-800 text-sm">
                                {result.guestName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-700 text-sm">
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
                                    showToast('success', 'Résultat de l\'invité réinitialisé');
                                  } catch (err) {
                                    console.error('Erreur lors de la réinitialisation:', err);
                                    showToast('error', 'Erreur lors de la réinitialisation');
                                  }
                                }}
                                className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm text-center py-4">
                        Aucun joueur n'a encore terminé ce jeu.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-luxury border border-neutral-200/50 p-6 text-center">
                <div className="text-2xl text-neutral-400 mb-3">💝</div>
                <h4 className="font-semibold text-neutral-700 mb-2">Love Memory Match</h4>
                <p className="text-neutral-500 mb-4">Ajoutez le jeu de memory match à votre modèle</p>
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
                      console.error('=== Error adding memory match:', error);
                      alert('Erreur lors de l\'ajout du memory match : ' + (error as Error).message);
                    }
                  }}
                  className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-6 py-3 rounded-xl hover:from-pink-600 hover:to-rose-700 transition-all duration-300 font-semibold flex items-center gap-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter Memory Match
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal d'édition de jeu */}
        {editingGame && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-luxury max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
              <div className={`p-6 border-b border-neutral-200/50 flex justify-between items-center ${
                editingGame.type === 'memory-match' 
                  ? 'bg-gradient-to-r from-neutral-50 to-pink-50/30' 
                  : editingGame.type === 'love-quiz'
                  ? 'bg-gradient-to-r from-neutral-50 to-rose-50/30'
                  : 'bg-gradient-to-r from-neutral-50 to-amber-50/30'
              }`}>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingGame.type === 'memory-match' ? 'Configurer Memory Match' : 
                   editingGame.type === 'love-quiz' ? 'Configurer Love Quiz' : 
                   'Configurer le Puzzle'}
                </h3>
                <button onClick={() => setEditingGame(null)} className="p-2 hover:bg-neutral-100 rounded-lg">
                  <X className="h-5 w-5 text-neutral-500" />
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
                            : (editingGame as MemoryMatchConfig).showLeaderboard
                      }
                      onChange={(e) => {
                        if (editingGame.type === 'puzzle') {
                          setEditingGame({ ...editingGame, showLeaderboard: e.target.checked } as PuzzleConfig);
                        } else if (editingGame.type === 'love-quiz') {
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
          setShowAddGuestModal(false);
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
          setShowAddGuestModal(false);
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

  const openAddGuestModal = () => {
    setNewGuest({ nom: '', table: '', etat: 'simple', category: '' });
    setEditingGuestId(null);
    setCategorySearchInput('');
    setTableSearchInput('');
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
    
    return `_Bonjour_ *${guestLabel}* 💌\n\n_${messageBody}_\n\n_Votre invitation :_\n👉 _${invitationLink}_`;
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
    const message = `_Bonjour_ *${guestLabel}* 💌\n\n_${messageBody}_\n\n_Votre invitation :_\n👉 _${invitationLink}_`;

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
    const message = `_Bonjour_ *${guestLabel}* 💌\n\n_${messageBody}_\n\n_Votre invitation :_\n👉 _${invitationLink}_`;

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

  if (showProfile && userData) {
    return <UserProfile userData={userData} onLogout={onLogout} onBack={() => setShowProfile(false)} />;
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

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'templates', label: 'Design', icon: Sparkles },
    { id: 'guests', label: 'Invités', icon: Users },
    { id: 'tables', label: 'Tables', icon: Table },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'games', label: 'Jeux', icon: Gamepad2 }
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Invités */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 md:p-6 border border-amber-200/50 shadow-lg">
          <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left">
            <div className="p-2 md:p-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl mb-2 md:mb-0 md:mr-4">
              <Users className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div>
              <p className="text-amber-700 text-xs md:text-sm font-medium">Total</p>
              <p className="text-xl md:text-3xl font-bold text-amber-900">{totalGuests}</p>
            </div>
          </div>
        </div>

        {/* Confirmés */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 md:p-6 border border-emerald-200/50 shadow-lg">
          <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left">
            <div className="p-2 md:p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl mb-2 md:mb-0 md:mr-4">
              <User className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div>
              <p className="text-emerald-700 text-xs md:text-sm font-medium">Confirmés</p>
              <p className="text-xl md:text-3xl font-bold text-emerald-900">{confirmedGuests}</p>
            </div>
          </div>
        </div>

        {/* En attente */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 md:p-6 border border-purple-200/50 shadow-lg">
          <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left">
            <div className="p-2 md:p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl mb-2 md:mb-0 md:mr-4">
              <Calendar className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div>
              <p className="text-purple-700 text-xs md:text-sm font-medium">Attente</p>
              <p className="text-xl md:text-3xl font-bold text-purple-900">{pendingGuests}</p>
            </div>
          </div>
        </div>

        {/* Tables */}
        <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl p-4 md:p-6 border border-rose-200/50 shadow-lg">
          <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left">
            <div className="p-2 md:p-3 bg-gradient-to-r from-rose-500 to-rose-600 rounded-xl mb-2 md:mb-0 md:mr-4">
              <Table className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div>
              <p className="text-rose-700 text-xs md:text-sm font-medium">Tables</p>
              <p className="text-xl md:text-3xl font-bold text-rose-900">{totalTables}</p>
            </div>
          </div>
        </div>
      </div>

        {/* Actions rapides */}
        <div className="bg-white rounded-2xl shadow-luxury border border-neutral-200/50 p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4 md:mb-6">
            Actions rapides
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            <button
              onClick={openAddGuestModal}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-3 md:p-4 rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 font-semibold flex flex-col md:flex-row items-center justify-center shadow-glow-amber transform hover:scale-105 text-sm md:text-base"
            >
              <Plus className="h-5 w-5 md:mr-2 mb-1 md:mb-0" />
              <span>Invité</span>
            </button>
            
            <button
              onClick={() => setActiveTab('tables')}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-3 md:p-4 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 font-semibold flex flex-col md:flex-row items-center justify-center shadow-lg transform hover:scale-105 text-sm md:text-base"
            >
              <Table className="h-5 w-5 md:mr-2 mb-1 md:mb-0" />
              <span>Tables</span>
            </button>
            
            <button
              onClick={() => setActiveTab('templates')}
              className="bg-gradient-to-r from-rose-500 to-rose-600 text-white p-3 md:p-4 rounded-xl hover:from-rose-600 hover:to-rose-700 transition-all duration-300 font-semibold flex flex-col md:flex-row items-center justify-center shadow-lg transform hover:scale-105 text-sm md:text-base"
            >
              <Eye className="h-5 w-5 md:mr-2 mb-1 md:mb-0" />
              <span>Design</span>
            </button>

            <button
              onClick={() => window.open(`/checkin/${userData?.id}`, '_blank')}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-3 md:p-4 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 font-semibold flex flex-col md:flex-row items-center justify-center shadow-lg transform hover:scale-105 text-sm md:text-base"
            >
              <Check className="h-5 w-5 md:mr-2 mb-1 md:mb-0" />
              <span>Check-in</span>
            </button>

            <button
              onClick={() => setShowReminderModal(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-3 md:p-4 rounded-xl hover:from-teal-600 hover:to-emerald-700 transition-all duration-300 font-semibold flex flex-col md:flex-row items-center justify-center shadow-lg transform hover:scale-105 text-sm md:text-base"
            >
              <Calendar className="h-5 w-5 md:mr-2 mb-1 md:mb-0" />
              <span>Rappel</span>
            </button>
          </div>
        </div>

        {/* Template sélectionné */}
        {selectedTemplate && (
          <div className="bg-white rounded-2xl shadow-luxury border border-neutral-200/50 p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4 md:mb-6">
              Template sélectionné
            </h3>
            <div className="bg-gradient-to-r from-amber-50 to-rose-50/30 rounded-xl p-4 md:p-6 border border-amber-200/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0">
                  <h4 className="text-base md:text-lg font-semibold text-slate-900 mb-1 md:mb-2 truncate">{selectedTemplate.name}</h4>
                  <p className="text-sm text-slate-600 mb-3 md:mb-4 truncate">{selectedTemplate.title}</p>
                  <div className="flex items-center space-x-4 text-xs md:text-sm text-slate-600">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                      <span>{selectedTemplate.eventDate}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                      <span>{selectedTemplate.eventTime}</span>
                    </div>
                  </div>
                </div>
                <div className="flex sm:flex-col lg:flex-row gap-2">
                  <button
                    onClick={() => handleEditTemplate(selectedTemplate)}
                    className="flex-1 sm:flex-none bg-amber-500 text-white px-4 py-2.5 rounded-lg hover:bg-amber-600 transition-all duration-300 font-semibold flex items-center justify-center text-sm"
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
        <div className="bg-white rounded-2xl shadow-luxury border border-neutral-200/50 p-6">
          <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-6">
            Activité récente
          </h3>
          <div className="space-y-4">
            {guests.slice(0, 5).map((guest, index) => (
              <div
                key={guest.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-neutral-50 to-amber-50/30 rounded-xl border border-neutral-200/50 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg ${
                    guest.etat === 'couple' 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500' 
                      : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`}>
                    {guest.nom.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-slate-900">{guest.nom}</p>
                    <p className="text-sm text-slate-600">Table: {guest.table}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  guest.confirmed 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {guest.confirmed ? 'Confirmé' : 'En attente'}
                </span>
              </div>
            ))}
            
            {guests.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-neutral-500 mb-2">Aucun invité ajouté</h4>
                <p className="text-neutral-400 mb-6">Commencez par ajouter vos premiers invités</p>
                <button
                  onClick={openAddGuestModal}
                  className="bg-amber-500 text-white px-6 py-3 rounded-xl hover:bg-amber-600 transition-all duration-300 font-semibold"
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
          <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Mes Templates
          </h3>
          <p className="text-slate-600 mt-1">Gérez vos modèles d'invitation personnalisés</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userModels.map((template, index) => (
          <div
            key={template.id}
            className="bg-white rounded-2xl shadow-luxury border border-neutral-200/50 overflow-hidden hover:shadow-glow-amber transition-all duration-500 animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={template.backgroundImage}
                alt={template.name}
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <h4 className="text-white font-bold text-lg drop-shadow-lg">{template.title}</h4>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h5 className="font-semibold text-slate-900">{template.name}</h5>
                  <p className="text-sm text-slate-600 capitalize">{template.category}</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </span>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditTemplate(template)}
                  className="flex-1 bg-amber-100 text-amber-700 px-3 py-2 rounded-lg hover:bg-amber-200 transition-all duration-200 font-medium flex items-center justify-center text-sm"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="flex-1 bg-rose-100 text-rose-700 px-3 py-2 rounded-lg hover:bg-rose-200 transition-all duration-200 font-medium flex items-center justify-center text-sm"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {userModels.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-500 mb-2">Aucun template personnalisé</h3>
          <p className="text-neutral-400 mb-6">Créez votre premier template en sélectionnant un modèle</p>
          <button
            onClick={() => onBackToHome ? onBackToHome() : window.location.reload()}
            className="bg-amber-500 text-white px-6 py-3 rounded-xl hover:bg-amber-600 transition-all duration-300 font-semibold"
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
          <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Gestion des Invités
          </h3>
          <p className="text-slate-600 mt-1">Ajoutez et gérez vos invités</p>
        </div>
        
        {subscription && subscription.plan === 'free' && (
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200/50">
            <div className="flex items-center">
              <Crown className="h-5 w-5 text-amber-600 mr-2" />
              <div>
                <p className="text-amber-800 font-semibold text-sm">Plan Gratuit</p>
                <p className="text-amber-700 text-xs">{getRemainingInvites()} invitations restantes</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200/50 p-3 md:p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Rechercher un nom..."
              value={guestSearchTerm}
              onChange={(e) => setGuestSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-sm"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <div className="relative flex-shrink-0">
              <select
                value={guestFilterStatus}
                onChange={(e) => setGuestFilterStatus(e.target.value as any)}
                className="pl-3 pr-8 py-1.5 border border-neutral-300 rounded-full focus:ring-2 focus:ring-amber-500 appearance-none bg-white text-xs font-medium"
              >
                <option value="all">Tous statuts</option>
                <option value="confirmed">Confirmés</option>
                <option value="pending">Attente</option>
              </select>
              <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-neutral-400 pointer-events-none" />
            </div>

            <div className="relative flex-shrink-0">
              <select
                value={guestFilterTable}
                onChange={(e) => setGuestFilterTable(e.target.value)}
                className="pl-3 pr-8 py-1.5 border border-neutral-300 rounded-full focus:ring-2 focus:ring-amber-500 appearance-none bg-white text-xs font-medium"
              >
                <option value="all">Toutes tables</option>
                {availableTables.map((table) => (
                  <option key={table.name} value={table.name}>{table.name}</option>
                ))}
              </select>
              <Table className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-neutral-400 pointer-events-none" />
            </div>

            <div className="relative flex-shrink-0">
              <select
                value={guestFilterCategory}
                onChange={(e) => setGuestFilterCategory(e.target.value)}
                className="pl-3 pr-8 py-1.5 border border-neutral-300 rounded-full focus:ring-2 focus:ring-amber-500 appearance-none bg-white text-xs font-medium"
              >
                <option value="all">Catégories</option>
                {availableCategories.map(catName => (
                  <option key={catName} value={catName}>{catName}</option>
                ))}
              </select>
              <Tag className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-neutral-400 pointer-events-none" />
            </div>

            <div className="relative flex-shrink-0">
              <select
                value={guestSortBy}
                onChange={(e) => setGuestSortBy(e.target.value as any)}
                className="pl-3 pr-8 py-1.5 border border-neutral-300 rounded-full focus:ring-2 focus:ring-amber-500 appearance-none bg-white text-xs font-medium"
              >
                <option value="name">Trier par nom</option>
                <option value="table">Trier par table</option>
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-neutral-400 pointer-events-none font-bold text-[8px]">AZ</div>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'actions groupées */}
      {selectedGuestIds.length > 0 && (
        <div className="bg-amber-600 text-white px-4 md:px-6 py-3 md:py-4 rounded-2xl shadow-luxury-amber flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-up sticky top-20 z-30">
          <div className="flex items-center">
            <div className="bg-white/20 p-2 rounded-lg mr-3 md:mr-4">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm md:text-base">{selectedGuestIds.length} sélectionné{selectedGuestIds.length > 1 ? 's' : ''}</p>
              <p className="text-amber-100 text-[10px] md:text-xs">Actions groupées disponibles</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-3 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedGuestIds([])}
              className="flex-1 sm:flex-none px-3 md:px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 text-xs md:text-sm font-medium whitespace-nowrap"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                setSentGuestIds([]);
                setShowBulkSendModal(true);
              }}
              className="flex-1 sm:flex-none px-3 md:px-4 py-2 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all duration-200 text-xs md:text-sm font-bold flex items-center justify-center shadow-lg whitespace-nowrap"
            >
              <MessageSquare className="h-4 w-4 mr-1.5 md:mr-2" />
              Partager
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex-1 sm:flex-none px-3 md:px-4 py-2 bg-rose-500 hover:bg-rose-600 rounded-xl transition-all duration-200 text-xs md:text-sm font-bold flex items-center justify-center shadow-lg whitespace-nowrap"
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
          <h4 className="text-base sm:text-lg font-semibold text-slate-900">
            Liste des invités ({filteredGuests.length} / {guests.length})
          </h4>
          <p className="text-slate-600 text-xs sm:text-sm">Gérez vos invités et leurs confirmations</p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap lg:flex-nowrap gap-1.5 sm:gap-2 md:gap-3 w-full lg:w-auto">
          <button
            onClick={() => setShowCategoryManager(true)}
            className="flex-1 sm:flex-none bg-white text-slate-700 border border-neutral-300 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl hover:bg-neutral-50 transition-all duration-300 font-semibold flex items-center justify-center shadow-sm text-[10px] sm:text-xs md:text-sm"
          >
            <Tag className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1 sm:mr-1.5 md:mr-2" />
            Catégories
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex-1 sm:flex-none bg-white text-slate-700 border border-neutral-300 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl hover:bg-neutral-50 transition-all duration-300 font-semibold flex items-center justify-center shadow-sm text-[10px] sm:text-xs md:text-sm"
          >
            <FileSpreadsheet className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1 sm:mr-1.5 md:mr-2" />
            Importer
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex-1 sm:flex-none bg-white text-slate-700 border border-neutral-300 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl hover:bg-neutral-50 transition-all duration-300 font-semibold flex items-center justify-center shadow-sm text-[10px] sm:text-xs md:text-sm"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1 sm:mr-1.5 md:mr-2" />
            Exporter
          </button>
          <button
            onClick={() => setShowReminderModal(true)}
            className="flex-1 sm:flex-none bg-gradient-to-r from-purple-500 to-purple-600 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 font-semibold flex items-center justify-center shadow-glow-purple text-[10px] sm:text-xs md:text-sm"
          >
            <Bell className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1 sm:mr-1.5 md:mr-2" />
            Rappel
          </button>
          <button
            onClick={openAddGuestModal}
            className="col-span-2 sm:flex-none bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 sm:px-4 md:px-6 py-1.5 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 font-semibold flex items-center justify-center shadow-glow-amber transform hover:scale-105 text-[10px] sm:text-xs md:text-sm"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1 sm:mr-1.5 md:mr-2" />
            Ajouter invité
          </button>
        </div>
      </div>

      {/* Liste des invités */}
      <div className="bg-white rounded-2xl shadow-luxury border border-neutral-200/50 overflow-hidden">
        <div className="px-3 py-2 sm:p-6 border-b border-neutral-200/50 bg-gradient-to-r from-neutral-50 to-amber-50/30 flex items-center justify-between">
          <h4 className="text-sm sm:text-lg font-semibold text-slate-900">Liste des invités</h4>
          {filteredGuests.length > 0 && (
            <button
              onClick={() => toggleSelectAll(filteredGuests)}
              className="text-xs sm:text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors flex items-center"
            >
              <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-2 mr-1.5 sm:mr-2 flex items-center justify-center transition-all ${
                selectedGuestIds.length === filteredGuests.length 
                  ? 'bg-amber-500 border-amber-500' 
                  : 'border-neutral-300'
              }`}>
                {selectedGuestIds.length === filteredGuests.length && <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />}
              </div>
              <span className="hidden sm:inline">{selectedGuestIds.length === filteredGuests.length ? 'Tout désélectionner' : 'Tout sélectionner'}</span>
              <span className="sm:hidden">{selectedGuestIds.length === filteredGuests.length ? 'Tout' : 'Tout'}</span>
            </button>
          )}
        </div>
        
        <div className="divide-y divide-neutral-200/50">
          {filteredGuests.map((guest, index) => (
            <div
              key={guest.id}
              className={`px-3 py-2 sm:p-6 transition-all duration-300 animate-slide-up flex items-center ${
                selectedGuestIds.includes(guest.id) 
                  ? 'bg-amber-50/50' 
                  : 'hover:bg-gradient-to-r hover:from-neutral-50/50 hover:to-amber-50/30'
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Checkbox de sélection */}
              <button
                onClick={() => toggleGuestSelection(guest.id)}
                className="mr-2 sm:mr-4 flex-shrink-0"
              >
                <div className={`w-4 h-4 sm:w-6 sm:h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                  selectedGuestIds.includes(guest.id) 
                    ? 'bg-amber-500 border-amber-500 shadow-glow-amber' 
                    : 'border-neutral-300 hover:border-amber-400'
                }`}>
                  {selectedGuestIds.includes(guest.id) && <Check className="h-2.5 w-2.5 sm:h-4 sm:w-4 text-white" />}
                </div>
              </button>

              <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="flex items-center">
                  <div className={`w-7 h-7 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-semibold shadow-lg text-[10px] sm:text-base ${
                    guest.etat === 'couple' 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500' 
                      : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`}>
                    {guest.nom.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div className="ml-2 sm:ml-4">
                    <h5 className="font-semibold text-slate-900 text-sm sm:text-lg truncate max-w-[150px] sm:max-w-none">{guest.nom}</h5>
                    <div className="flex items-center flex-wrap gap-1 sm:gap-4 text-[10px] sm:text-sm text-slate-600">
                      <span>Table: {guest.table}</span>
                      {guest.category && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] sm:text-xs font-medium bg-purple-100 text-purple-800">
                          <Tag className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                          {guest.category}
                        </span>
                      )}
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] sm:text-xs font-medium ${
                        guest.etat === 'couple' 
                          ? 'bg-pink-100 text-pink-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {guest.etat === 'couple' ? 'Couple' : 'Simple'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center sm:flex-shrink-0 flex-wrap gap-1.5 sm:gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-sm font-medium ${
                    guest.confirmed 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {guest.confirmed ? '✓' : '!'}
                  </span>
                  
                  {/* Bouton Copier sorti de l'action pour accès rapide sur mobile */}
                  <button
                    onClick={() => copyInvitationWithPreview(guest)}
                    className="p-1.5 sm:p-2.5 bg-slate-100 text-slate-700 rounded-lg sm:rounded-xl hover:bg-slate-200 transition-all duration-200 shadow-sm"
                    aria-label="Copier le message"
                    title="Copier le message"
                  >
                    <Copy className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                  </button>

                  <div className={`relative ${openGuestActionsId === guest.id ? 'z-[60]' : 'z-10'}`}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenGuestActionsId(openGuestActionsId === guest.id ? null : guest.id);
                      }}
                      className="p-1.5 sm:p-2.5 bg-amber-100 text-amber-700 rounded-lg sm:rounded-xl hover:bg-amber-200 transition-all duration-200 shadow-sm flex items-center"
                    >
                      <ChevronDown className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-300 ${openGuestActionsId === guest.id ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Menu Actions repositionné et stylisé */}
                    {openGuestActionsId === guest.id && (
                      <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-2xl shadow-2xl border border-neutral-100 z-[100] overflow-hidden animate-fade-in py-2">
                        <button
                          onClick={() => { handleShareInvitation(guest); setOpenGuestActionsId(null); }}
                          className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-green-600 hover:bg-green-50 flex items-center transition-colors"
                        >
                          <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3" />
                          WhatsApp
                        </button>
                        <button
                          onClick={() => { sendEmailInvitation(guest); setOpenGuestActionsId(null); }}
                          className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-blue-600 hover:bg-blue-50 flex items-center transition-colors"
                        >
                          <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3" />
                          Email
                        </button>
                        <div className="h-[1px] bg-neutral-100 my-1 mx-2"></div>
                        <button
                          onClick={() => { openEditGuestModal(guest); setOpenGuestActionsId(null); }}
                          className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-amber-600 hover:bg-amber-50 flex items-center transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3" />
                          Modifier
                        </button>
                        <button
                          onClick={() => { handleDeleteGuest(guest.id); setOpenGuestActionsId(null); }}
                          className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3" />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="hidden sm:flex items-center space-x-3">
                    <button
                      onClick={() => handleShareInvitation(guest)}
                      className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                      aria-label="Partager l'invitation"
                      title="Partager l'invitation"
                    >
                      <MessageSquare className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => sendEmailInvitation(guest)}
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                      aria-label="Envoyer par Email"
                      title="Envoyer par Email"
                    >
                      <Mail className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => openEditGuestModal(guest)}
                      className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                      aria-label="Modifier l'invité"
                      title="Modifier l'invité"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteGuest(guest.id)}
                      className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all duration-200 transform hover:scale-110"
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
          <div className="p-12 text-center">
            <Users className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-500 mb-2">Aucun invité ajouté</h3>
            <p className="text-neutral-400">Commencez par ajouter vos premiers invités</p>
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
          <div className="animate-fade-in">
            <div className="text-center py-12">
              <MessageCircle className="h-16 w-16 text-amber-500 mx-auto mb-4 animate-glow" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Messages & Boissons</h3>
              <p className="text-slate-600 mb-6">Consultez les vœux et choix de vos invités</p>
              <div className="max-w-5xl mx-auto">
                <GuestMessagesViewer />
              </div>
            </div>
          </div>
        );
      case 'games':
        return renderGames();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-amber-50/30 to-purple-50/20 dark:from-slate-900 dark:via-slate-800/30 dark:to-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-neutral-50/95 via-amber-50/90 to-neutral-50/95 dark:from-slate-800/95 dark:via-slate-700/90 dark:to-slate-800/95 backdrop-blur-xl shadow-luxury border-b border-amber-200/30 dark:border-slate-600/30">
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
                  className="p-1.5 md:p-2 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 relative"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-800 animate-pulse"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-amber-200/30 dark:border-slate-600/30 z-50 overflow-hidden animate-fade-in">
                    <div className="p-3 md:p-4 border-b border-neutral-100 dark:border-slate-700 bg-gradient-to-r from-neutral-50 to-amber-50/30 dark:from-slate-800 dark:to-slate-700/50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">Notifications</h3>
                      <button 
                        onClick={() => notificationService.markAllAsRead(userData?.uid || '')}
                        className="text-[10px] md:text-xs text-amber-600 hover:text-amber-700 font-medium"
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
                            className={`p-3 md:p-4 border-b border-neutral-50 dark:border-slate-700 hover:bg-neutral-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors duration-200 ${!notification.read ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}`}
                          >
                            <div className="flex items-start">
                              <div className={`p-1.5 md:p-2 rounded-lg mr-2 md:mr-3 ${
                                notification.type === 'confirmation' ? 'bg-emerald-100 text-emerald-600' :
                                notification.type === 'message' ? 'bg-blue-100 text-blue-600' :
                                'bg-amber-100 text-amber-600'
                              }`}>
                                {notification.type === 'confirmation' ? <Check className="h-3 w-3 md:h-4 md:w-4" /> :
                                 notification.type === 'message' ? <MessageSquare className="h-3 w-3 md:h-4 md:w-4" /> :
                                 <Bell className="h-3 w-3 md:h-4 md:w-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white truncate">{notification.title}</p>
                                <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{notification.body}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 md:p-8 text-center">
                          <Bell className="h-6 w-6 md:h-8 md:w-8 text-neutral-300 mx-auto mb-2" />
                          <p className="text-xs md:text-sm text-neutral-500">Aucune notification</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowSettings(true)}
                className="hidden md:block p-2 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-700 rounded-lg transition-all duration-200"
              >
                <Settings className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center space-x-1.5 md:space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white p-1.5 md:px-4 md:py-2 rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 font-semibold shadow-glow-amber transform hover:scale-105"
              >
                {userData && (
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-slate-900 rounded-full flex items-center justify-center text-amber-400 font-bold text-[8px] md:text-xs">
                    {userData.firstName[0]}{userData.lastName[0]}
                  </div>
                )}
                <span className="hidden md:block text-xs md:text-sm">Profil</span>
              </button>
              
              <button
                onClick={onLogout}
                className="p-1.5 md:p-2 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition-all duration-200"
                title="Se déconnecter"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation - Desktop only (hidden on mobile) */}
      <nav className="hidden md:block bg-white dark:bg-slate-800 shadow-lg border-b border-neutral-200/50 dark:border-slate-600/50 sticky top-16 z-40">
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
                      ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg border-t border-amber-200/30 dark:border-slate-600/30 z-[60] pb-safe">
        <div className="flex justify-around items-center h-16">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${
                  isActive
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}>
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
        <div className={`fixed bottom-6 right-6 z-[1000] px-4 py-3 rounded-xl shadow-glow-amber border ${toast.type === 'success' ? 'bg-white/95 border-emerald-200 text-emerald-700 dark:bg-slate-800/95 dark:text-emerald-300' : toast.type === 'error' ? 'bg-white/95 border-rose-200 text-rose-700 dark:bg-slate-800/95 dark:text-rose-300' : 'bg-white/95 border-amber-200 text-amber-700 dark:bg-slate-800/95 dark:text-amber-300'}`}>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-luxury max-w-md w-full animate-slide-up">
            <div className="p-6 border-b border-neutral-200/50 bg-gradient-to-r from-neutral-50 to-amber-50/30">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">{editingGuestId ? 'Modifier l\'invité' : 'Ajouter un invité'}</h3>
                <button
                  onClick={() => setShowAddGuestModal(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-neutral-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={newGuest.nom}
                    onChange={(e) => setNewGuest({ ...newGuest, nom: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                    placeholder="Ex: Sophie Martin"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                      onFocus={() => setShowCategoryDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                      placeholder="Rechercher ou ajouter une catégorie..."
                    />
                    {showCategoryDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-neutral-200 max-h-60 overflow-y-auto">
                        <button
                          key="no-category"
                          onClick={() => {
                            setNewGuest({ ...newGuest, category: '' });
                            setCategorySearchInput('');
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-amber-50 transition-colors text-slate-600"
                        >
                          Aucune catégorie
                        </button>
                        {availableCategories
                          .filter(cat => cat.toLowerCase().includes(categorySearchInput.toLowerCase()))
                          .map((catName) => (
                            <button
                              key={catName}
                              onClick={() => {
                                setNewGuest({ ...newGuest, category: catName });
                                setCategorySearchInput(catName);
                                setShowCategoryDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2 transition-colors ${newGuest.category === catName ? 'bg-amber-100 text-amber-700' : 'hover:bg-amber-50 text-slate-700'}`}
                            >
                              {catName}
                            </button>
                          ))}
                        {categorySearchInput.trim() && !availableCategories.includes(categorySearchInput.trim()) && (
                          <button
                            key="add-category"
                            onClick={async () => {
                              const newCat = categorySearchInput.trim();
                              await createGuestCategory(newCat);
                              setNewGuest({ ...newGuest, category: newCat });
                              setCategorySearchInput(newCat);
                              setShowCategoryDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-amber-100 transition-colors text-amber-600 font-semibold"
                          >
                            + Ajouter "{categorySearchInput.trim()}"
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                      onFocus={() => setShowTableDropdown(true)}
                      onBlur={() => setTimeout(() => setShowTableDropdown(false), 200)}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                      placeholder="Rechercher ou ajouter une table..."
                    />
                    {showTableDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-neutral-200 max-h-60 overflow-y-auto">
                        <button
                          key="select-table"
                          onClick={() => {
                            setNewGuest({ ...newGuest, table: '' });
                            setTableSearchInput('');
                            setShowTableDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-amber-50 transition-colors text-slate-600"
                        >
                          Sélectionner une table
                        </button>
                        <button
                          key="no-table"
                          onClick={() => {
                            setNewGuest({ ...newGuest, table: 'Non assigné' });
                            setTableSearchInput('Non assigné');
                            setShowTableDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-amber-50 transition-colors text-slate-600"
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
                                onClick={() => {
                                  setNewGuest({ ...newGuest, table: table.name });
                                  setTableSearchInput(table.name);
                                  setShowTableDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2 transition-colors ${newGuest.table === table.name ? 'bg-amber-100 text-amber-700' : 'hover:bg-amber-50 text-slate-700'}`}
                              >
                                {table.name} {remainingSeats !== null ? `(${remainingSeats} restantes)` : ''}
                              </button>
                            );
                          })}
                        {tableSearchInput.trim() && !availableTables.find(t => t.name === tableSearchInput.trim()) && tableSearchInput.trim() !== 'Non assigné' && (
                          <button
                            key="add-table"
                            onClick={async () => {
                              const newTableName = tableSearchInput.trim();
                              await createTable({ name: newTableName, seats: 10 }); // Set default to 10 seats
                              setNewGuest({ ...newGuest, table: newTableName });
                              setTableSearchInput(newTableName);
                              setShowTableDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-amber-100 transition-colors text-amber-600 font-semibold"
                          >
                            + Ajouter "{tableSearchInput.trim()}"
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Statut
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewGuest({ ...newGuest, etat: 'simple' })}
                      className={`flex items-center justify-center px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                        newGuest.etat === 'simple'
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                          : 'border-neutral-200 hover:border-emerald-300 text-slate-600'
                      }`}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Simple
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setNewGuest({ ...newGuest, etat: 'couple' })}
                      className={`flex items-center justify-center px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                        newGuest.etat === 'couple'
                          ? 'border-rose-400 bg-rose-50 text-rose-700'
                          : 'border-neutral-200 hover:border-rose-300 text-slate-600'
                      }`}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Couple
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddGuestModal(false)}
                  className="flex-1 px-4 py-3 border border-neutral-300 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-all duration-200 font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddGuest}
                  disabled={isAddingGuest || !newGuest.nom.trim()}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-3 rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 font-semibold shadow-glow-amber transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isAddingGuest ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="bg-white rounded-2xl shadow-luxury max-w-sm w-full animate-slide-up">
            <div className="p-6 border-b border-neutral-200/50 bg-gradient-to-r from-neutral-50 to-amber-50/30">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">Gérer les catégories</h3>
                <button
                  onClick={() => setShowCategoryManager(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-neutral-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder={editingCategoryId ? "Modifier la catégorie..." : "Nouvelle catégorie..."}
                />
                <button
                  onClick={handleSaveCategory}
                  disabled={!newCategoryName.trim()}
                  className={`text-white px-4 py-2 rounded-xl transition-all duration-300 font-semibold disabled:opacity-50 ${editingCategoryId ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-600'}`}
                >
                  {editingCategoryId ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </button>
                {editingCategoryId && (
                  <button
                    onClick={() => {
                      setNewCategoryName('');
                      setEditingCategoryId(null);
                    }}
                    className="bg-neutral-200 text-neutral-600 px-4 py-2 rounded-xl hover:bg-neutral-300 transition-all duration-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {userCategories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                    <span className="font-medium text-slate-700">{cat.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setNewCategoryName(cat.name);
                          setEditingCategoryId(cat.id);
                        }}
                        className="text-amber-500 hover:text-amber-700 p-2 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategoryWrapper(cat.id)}
                        className="text-rose-500 hover:text-rose-700 p-2 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {userCategories.length === 0 && (
                  <p className="text-center text-neutral-400 py-4">Aucune catégorie personnalisée</p>
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
