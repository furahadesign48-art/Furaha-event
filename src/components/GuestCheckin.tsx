import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Check, X, ArrowLeft, Users, Wine, Table, Calendar, CheckCircle2, Clock, Lock } from 'lucide-react';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc, 
  Timestamp 
} from 'firebase/firestore';

interface Guest {
  id: string;
  nom: string;
  table: string;
  etat: 'simple' | 'couple';
  confirmed: boolean;
  category?: string;
  selectedDrink?: string;
  checkedIn?: boolean;
  checkedInAt?: Timestamp;
}

interface UserModel {
  title: string;
  eventDate: string;
  eventTime: string;
}

const GuestCheckin: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();
  
  // Security check: Verify authenticated user matches the userId in URL
  useEffect(() => {
    if (isAuthenticated && user && user.id !== userId) {
      setError("Accès non autorisé. Vous ne pouvez accéder qu'à vos propres événements.");
      setLoading(false);
      return;
    }
  }, [user, userId, isAuthenticated]);

  // Load guests and event data
  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;
      
      try {
        // Load event data
        const userModelQuery = query(
          collection(db, 'users', userId, 'UserModel')
        );
        const userModelSnapshot = await getDocs(userModelQuery);
        
        if (!userModelSnapshot.empty) {
          const userModelData = userModelSnapshot.docs[0].data() as UserModel;
          setEventTitle(userModelData.title || 'Événement');
          setEventDate(userModelData.eventDate || '');
        }
        
        // Load guests
        const invitesQuery = query(collection(db, 'users', userId, 'invites'));
        const invitesSnapshot = await getDocs(invitesQuery);
        
        const guestsList: Guest[] = invitesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Guest));
        
        setGuests(guestsList);
        setFilteredGuests(guestsList);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [userId]);

  // Filter guests based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredGuests(guests);
      return;
    }
    
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const filtered = guests.filter(guest => 
      guest.nom.toLowerCase().includes(normalizedQuery)
    );
    setFilteredGuests(filtered);
  }, [searchQuery, guests]);

  // Mark guest as checked in
  const handleCheckIn = async (guest: Guest) => {
    if (!userId) return;
    
    try {
      const guestDocRef = doc(db, 'users', userId, 'invites', guest.id);
      await updateDoc(guestDocRef, {
        checkedIn: true,
        checkedInAt: Timestamp.now()
      });
      
      // Update local state
      setGuests(prev => prev.map(g => 
        g.id === guest.id ? { ...g, checkedIn: true, checkedInAt: Timestamp.now() } : g
      ));
      
      setToast({ 
        message: `${guest.nom} a été marqué comme présent !`, 
        type: 'success' 
      });
      
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Error checking in:', err);
      setToast({ 
        message: 'Erreur lors du check-in', 
        type: 'error' 
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Undo check-in
  const handleUndoCheckIn = async (guest: Guest) => {
    if (!userId) return;
    
    try {
      const guestDocRef = doc(db, 'users', userId, 'invites', guest.id);
      await updateDoc(guestDocRef, {
        checkedIn: false,
        checkedInAt: null
      });
      
      // Update local state
      setGuests(prev => prev.map(g => 
        g.id === guest.id ? { ...g, checkedIn: false, checkedInAt: null } : g
      ));
      
      setToast({ 
        message: `Check-in annulé pour ${guest.nom}`, 
        type: 'success' 
      });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Error undoing check-in:', err);
      setToast({ 
        message: 'Erreur lors de l\'annulation', 
        type: 'error' 
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const checkedInCount = guests.filter(g => g.checkedIn).length;
  const totalGuests = guests.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-4">
            <Lock className="w-16 h-16 text-red-500 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès Refusé</h2>
          <p className="text-red-500 text-lg mb-6">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition font-semibold"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 pb-8 sm:pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-amber-100">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
            <button 
              onClick={() => navigate('/')}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg sm:rounded-xl transition"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-2xl font-bold text-gray-800 truncate">
                {eventTitle}
              </h1>
              {eventDate && (
                <p className="text-gray-500 text-[11px] sm:text-sm">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 inline mr-0.5 sm:mr-1" />
                  {eventDate}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-2 sm:mb-4">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-emerald-100">
              <p className="text-xl sm:text-3xl font-bold text-emerald-600 leading-none">{checkedInCount}</p>
              <p className="text-emerald-700 text-[10px] sm:text-sm font-medium mt-0.5 sm:mt-0">Présents</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-amber-100">
              <p className="text-xl sm:text-3xl font-bold text-amber-600 leading-none">{totalGuests}</p>
              <p className="text-amber-700 text-[10px] sm:text-sm font-medium mt-0.5 sm:mt-0">Total invités</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Rechercher un invité..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none text-sm sm:text-lg"
              autoFocus
            />
          </div>
        </div>
      </div>

      {/* Guest List */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-6">
        {filteredGuests.length === 0 ? (
          <div className="text-center py-10 sm:py-16">
            <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <p className="text-gray-500 text-sm sm:text-lg">
              {searchQuery ? 'Aucun invité trouvé' : 'Aucun invité pour le moment'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-4">
            {filteredGuests.map(guest => (
              <div 
                key={guest.id}
                className={`bg-white rounded-xl sm:rounded-2xl px-3 py-2 sm:p-6 shadow-sm border sm:border-2 transition-all ${
                  guest.checkedIn 
                    ? 'border-emerald-200 bg-emerald-50/30' 
                    : 'border-gray-100 hover:border-amber-200'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    guest.checkedIn ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {guest.checkedIn ? (
                      <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6" />
                    ) : (
                      <Users className="w-4 h-4 sm:w-6 sm:h-6" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-3 mb-0.5 sm:mb-2">
                      <h3 className="text-sm sm:text-xl font-bold text-gray-800 truncate">{guest.nom}</h3>
                      {guest.checkedIn && (
                        <span className="px-1.5 py-0.5 sm:px-3 sm:py-1 bg-emerald-100 text-emerald-700 text-[9px] sm:text-xs font-bold rounded-full flex-shrink-0">
                          ✓
                          <span className="hidden sm:inline ml-1">PRÉSENT</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1 sm:gap-4 text-[10px] sm:text-sm text-gray-600">
                      <div className="flex items-center gap-0.5 sm:gap-1.5">
                        <Table className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
                        <span>Table: <strong>{guest.table}</strong></span>
                      </div>
                      
                      {guest.etat === 'couple' && (
                        <span className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 bg-pink-100 text-pink-700 rounded-full text-[9px] sm:text-xs font-bold flex-shrink-0">
                          <span className="sm:hidden">👫C</span>
                          <span className="hidden sm:inline">👫 Couple</span>
                        </span>
                      )}
                      
                      {guest.selectedDrink && (
                        <div className="flex items-center gap-0.5 sm:gap-1.5">
                          <Wine className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                          <span className="truncate max-w-[80px] sm:max-w-none">Boisson: <strong>{guest.selectedDrink}</strong></span>
                        </div>
                      )}
                      
                      {guest.category && (
                        <span className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 bg-gray-100 rounded-full text-[9px] sm:text-xs flex-shrink-0 truncate max-w-[100px] sm:max-w-none">
                          {guest.category}
                        </span>
                      )}
                      
                      {guest.confirmed && (
                        <div className="flex items-center gap-0.5 sm:gap-1.5 text-blue-600">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Confirmé</span>
                        </div>
                      )}
                    </div>
                    
                    {guest.checkedInAt && (
                      <div className="mt-0.5 sm:mt-2 flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs text-gray-400">
                        <Clock className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                        <span className="truncate">{guest.checkedInAt.toDate().toLocaleString('fr-FR')}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1 sm:gap-2 flex-shrink-0">
                    {guest.checkedIn ? (
                      <button 
                        onClick={() => handleUndoCheckIn(guest)}
                        className="px-2 py-1.5 sm:px-4 sm:py-2 bg-gray-100 text-gray-600 rounded-lg sm:rounded-xl hover:bg-gray-200 transition font-medium text-[10px] sm:text-base"
                      >
                        <span className="sm:hidden">✕</span>
                        <span className="hidden sm:inline">Annuler</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleCheckIn(guest)}
                        className="px-2.5 py-1.5 sm:px-6 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg sm:rounded-xl hover:from-emerald-600 hover:to-teal-600 transition font-bold text-[10px] sm:text-base shadow-sm sm:shadow-md"
                      >
                        <span className="sm:hidden">✓</span>
                        <span className="hidden sm:inline">Check-in</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 sm:bottom-6 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 z-50 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-xl border-2 ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 sm:gap-3">
            {toast.type === 'success' ? (
              <CheckCircle2 className={`w-5 h-5 sm:w-6 sm:h-6 ${toast.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`} />
            ) : (
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
            )}
            <p className={`font-medium text-sm sm:text-base ${toast.type === 'success' ? 'text-emerald-800' : 'text-red-800'}`}>
              {toast.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestCheckin;