import React, { useState } from 'react';
import { Plus, Edit, Trash2, Users, X, Eye, Download, MessageSquare, Mail, Send, Search, Filter } from 'lucide-react';
import { storage } from '../config/firebase';
import furahaLogo from '../images/FURAHA-GOLD.png';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useTemplates } from '../hooks/useTemplates';
import { useAuth } from './AuthContext';
import GuestExportModal from './GuestExportModal';

interface Guest {
  id: number;
  name: string;
  status: 'confirmed' | 'pending' | 'declined';
}

interface Table {
  id: number;
  docId?: string;
  name: string;
  seats: number;
  assignedGuests: Guest[];
}

interface TableFormData {
  name: string;
  seats: number;
}

interface TableManagementProps {
  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  guests?: Array<{
    id: string;
    nom: string;
    table: string;
    etat: 'simple' | 'couple';
    confirmed: boolean;
  }>;
  onSaveTable?: (table: Table) => Promise<void>;
  onDeleteTable?: (tableId: number) => Promise<void>;
  isLoading?: boolean;
}

const TableManagement = ({ tables, setTables, guests = [], onSaveTable, onDeleteTable, isLoading }: TableManagementProps) => {
  const { userModels, userInvites, createTable, updateTable, deleteTable, userCategories } = useTemplates();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState<TableFormData>({ name: '', seats: 8 });
  const [openTableGuestActionsId, setOpenTableGuestActionsId] = useState<string | null>(null);
  
  // Search and Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'seats' | 'occupancy'>('name');

  const generateInvitationLink = (guestId: string) => {
    const baseUrl = window.location.origin;
    const v = Math.floor(Date.now() / 60000) % 1000;
    return `${baseUrl}/v/${guestId}?v=${v}`;
  };
  const sendWhatsAppInvitation = (guest: { id: string; nom: string; table: string }) => {
    const invitationLink = generateInvitationLink(String(guest.id));
    const messageBody = user?.invitationMessage || "Nous sommes heureux de vous inviter à célébrer ce moment avec nous.";

    const body = `_Bonjour_ *${guest.nom}* !

_${messageBody}_

_Votre invitation personnalisée :_
👉 _${invitationLink}_

_Nous avons hâte de célébrer avec vous !_`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(body)}`;
    window.open(whatsappUrl, '_blank');
  };
  const copyInvitationMessage = async (guest: { id: string; nom: string; table: string }) => {
    const invitationLink = generateInvitationLink(String(guest.id));
    const messageBody = user?.invitationMessage || "Nous sommes heureux de vous inviter à célébrer ce moment avec nous.";
    const body = `_Bonjour_ *${guest.nom}* 👋\n\n_${messageBody}_\n\n_Votre invitation est prête ici_ 👉 _${invitationLink}_`;
    try { await navigator.clipboard.writeText(body); } catch {}
  };
  const sendEmailInvitation = (guest: { id: string; nom: string; table: string }) => {
    const invitationLink = generateInvitationLink(String(guest.id));
    const subject = `Invitation Spéciale`;
    const body = `Bonjour ${guest.nom},\n\nVotre invitation personnalisée :\n${invitationLink}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  // Utiliser les invités réels depuis le hook
  const realGuests = userInvites.length > 0 ? userInvites : guests;

  // Fonction pour obtenir les invités assignés à une table
  const getGuestsForTable = (tableName: string) => {
    return realGuests.filter(guest => guest.table === tableName);
  };

  // Fonction pour calculer les places occupées par table
  const getOccupiedSeats = (tableName: string) => {
    const tableGuests = getGuestsForTable(tableName);
    return tableGuests.reduce((total, guest) => {
      return total + (guest.etat === 'couple' ? 2 : 1);
    }, 0);
  };

  const openModal = (table?: Table) => {
    if (table) {
      setEditingTable(table);
      setFormData({ name: table.name, seats: table.seats });
    } else {
      setEditingTable(null);
      setFormData({ name: '', seats: 8 });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTable(null);
    setFormData({ name: '', seats: 8 });
  };

  const openGuestModal = (table: Table) => {
    // Mettre à jour la table avec les invités réels
    const realTableGuests = getGuestsForTable(table.name).map(guest => ({
      id: parseInt(guest.id.replace(/\D/g, '')) || Math.random(),
      name: guest.nom,
      status: guest.confirmed ? 'confirmed' : 'pending' as 'confirmed' | 'pending' | 'declined'
    }));
    
    const updatedTable = {
      ...table,
      assignedGuests: realTableGuests
    };
    
    setSelectedTable(updatedTable);
    setIsGuestModalOpen(true);
  };

  const closeGuestModal = () => {
    setIsGuestModalOpen(false);
    setSelectedTable(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Vous devez être connecté pour gérer les tables');
      return;
    }

    // Validation d'unicité du nom de la table
    const normalizedNewName = formData.name.trim().toLowerCase();
    const duplicateTable = tables.find(t => {
      const isSameName = t.name.trim().toLowerCase() === normalizedNewName;
      const isNotEditingTable = editingTable ? t.id !== editingTable.id : true;
      return isSameName && isNotEditingTable;
    });

    if (duplicateTable) {
      alert(`Une table nommée "${formData.name}" existe déjà.`);
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (editingTable) {
        // Modifier une table existante
        const updatedTable = { 
          ...editingTable, 
          name: formData.name, 
          seats: formData.seats,
          assignedGuests: editingTable.assignedGuests || []
        };
        
        // Utiliser la fonction onSaveTable si elle existe, sinon utiliser le hook
        if (onSaveTable) {
          await onSaveTable(updatedTable);
        } else {
          const updateId = editingTable.docId || editingTable.id.toString();
          const success = await updateTable(updateId, {
            name: formData.name,
            seats: formData.seats,
            assignedGuests: editingTable.assignedGuests || []
          });
        
          if (!success) {
            alert('Erreur lors de la modification de la table');
            return;
          }
        }
        
        // Optimistic update only if we are managing state locally or if onSaveTable didn't refresh
        setTables(prev => prev.map(table => {
          const match =
            (editingTable.docId && table.docId && table.docId === editingTable.docId) ||
            (!editingTable.docId && !table.docId && table.id === editingTable.id);
          return match ? updatedTable : table;
        }));
      } else {
        // Ajouter une nouvelle table
        const newTable: Table = {
          id: Date.now(),
          name: formData.name,
          seats: formData.seats,
          assignedGuests: []
        };
        
        // Utiliser la fonction onSaveTable si elle existe, sinon utiliser le hook
        if (onSaveTable) {
          await onSaveTable(newTable);
          // Mise à jour locale immédiate pour refléter les statistiques sans attendre le rafraîchissement
          setTables(prev => {
            const exists = prev.some(t => t.name.trim().toLowerCase() === newTable.name.trim().toLowerCase());
            return exists ? prev : [...prev, newTable];
          });
        } else {
          const tableId = await createTable({
            name: formData.name,
            seats: formData.seats,
            assignedGuests: []
          });
        
          if (!tableId) {
            alert('Erreur lors de la création de la table');
            return;
          }
          newTable.docId = tableId;
        }
        
        setTables(prev => [...prev, newTable]);
      }
      closeModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      if (!onSaveTable) {
        alert('Erreur lors de la sauvegarde de la table');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (onDeleteTable) {
      // Si la fonction est fournie (par le Dashboard), on l'utilise pour la modale de confirmation
      // On ne fait rien d'autre ici car le Dashboard gère tout (confirmation, suppression, toast, refresh)
      await onDeleteTable(id);
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette table ?')) {
      if (!user) {
        alert('Vous devez être connecté pour supprimer une table');
        return;
      }
      
      try {
        setIsSaving(true);
        
        const tableToDelete = tables.find(t => t.id === id);
        const deleteId = tableToDelete?.docId || id.toString();
        const success = await deleteTable(deleteId);
      
        if (!success) {
          alert('Erreur lors de la suppression de la table');
          return;
        }
        
        setTables(prev => prev.filter(table => {
          const deleteIdStr = deleteId;
          if (table.docId) return table.docId !== deleteIdStr;
          return table.id !== id;
        }));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la table');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const sendTableInvitations = (table: Table) => {
    const tableGuests = getGuestsForTable(table.name);
    
    if (tableGuests.length === 0) {
      alert('Aucun invité assigné à cette table');
      return;
    }
    
    tableGuests.forEach(async (guest) => {
      const v = Math.floor(Date.now() / 60000) % 1000;
      const invitationLink = `${window.location.origin}/v/${guest.id}?v=${v}`;
      const eventName = userModels[0]?.title || 'Notre Événement';
      const imageUrl = furahaLogo as unknown as string;
      const buildShareHtml = (img: string, title: string, desc: string, link: string) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><meta property=\"og:type\" content=\"website\"><meta property=\"og:title\" content=\"${title}\"><meta property=\"og:description\" content=\"${desc}\"><meta property=\"og:image\" content=\"${img}\"><meta property=\"og:image:type\" content=\"image/jpeg\"><meta property=\"og:image:width\" content=\"1200\"><meta property=\"og:image:height\" content=\"630\"><meta property=\"og:url\" content=\"${window.location.origin}/share/invite_${guest.id}.html\"></head><body><a href=\"${link}\" target=\"_blank\" rel=\"noopener\">Voir l'invitation</a></body></html>`;
      const createSharePage = async (): Promise<string> => {
        try {
          const html = buildShareHtml(imageUrl, 'Invitation Spéciale', `Bonjour ${guest.nom} – ${eventName}`, invitationLink);
          const objectRef = ref(storage, `share/invite_${guest.id}.html`);
          await uploadString(objectRef, html, 'raw', { contentType: 'text/html' });
          const url = await getDownloadURL(objectRef);
          return url;
        } catch {
          return `${window.location.origin}/share/index.html?url=${encodeURIComponent(invitationLink)}`;
        }
      };
      const previewUrl = `${window.location.origin}?v=${Date.now()}`;
      
      const body = `_Bonjour_ *${guest.nom}* 👋\n\n_Votre invitation est prête ici_ 👉 _${invitationLink}_\n\n_À très vite !_`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(body)}`;
      window.open(whatsappUrl, '_blank');
    });
  };

  const sendTableEmailInvitations = (table: Table) => {
    const tableGuests = getGuestsForTable(table.name);
    
    if (tableGuests.length === 0) {
      alert('Aucun invité assigné à cette table');
      return;
    }
    
    tableGuests.forEach(guest => {
      const v = Math.floor(Date.now() / 60000) % 1000;
      const invitationLink = `${window.location.origin}/v/${guest.id}?v=${v}`;
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
      window.open(mailtoUrl, '_blank');
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'declined':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmé';
      case 'pending':
        return 'En attente';
      case 'declined':
        return 'Décliné';
      default:
        return 'Inconnu';
    }
  };

  // Trouver toutes les tables uniques mentionnées dans les invités mais pas dans la liste officielle
  const importedTableNames = [...new Set(realGuests.map(g => g.table).filter(t => t && t !== 'Non assigné' && !tables.some(et => et.name === t)))];

  // Calculer les statistiques avec les données réelles
  const totalTables = tables.length + importedTableNames.length;
  const totalSeats = tables.reduce((sum, table) => sum + table.seats, 0);
  const totalAssignedGuests = realGuests.length;
  const totalOccupiedSeats = realGuests.reduce((total, guest) => {
    return total + (guest.etat === 'couple' ? 2 : 1);
  }, 0);

  // Filter and Sort Tables
  const allTables = [
    ...tables,
    ...importedTableNames.map(name => ({
      id: Math.random(), // ID temporaire
      name,
      seats: 0, // Inconnu
      assignedGuests: [],
      isImported: true // Marqueur pour les tables venant d'Excel
    }))
  ];

  const filteredTables = allTables.filter(table => 
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'seats') return b.seats - a.seats;
    if (sortBy === 'occupancy') {
      const occA = getOccupiedSeats(a.name);
      const occB = getOccupiedSeats(b.name);
      return occB - occA;
    }
    return 0;
  });

  return (
    <div className="animate-fade-in">
      {/* En-tête avec statistiques */}
      <div className="mb-6 sm:mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-3 sm:p-6 border border-amber-200/50 shadow-lg">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-amber-500 rounded-lg sm:rounded-xl shadow-glow-amber">
                <Users className="h-4 sm:h-6 w-4 sm:w-6 text-white" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-amber-700 text-xs sm:text-sm font-medium">Total Tables</p>
                <p className="text-xl sm:text-2xl font-bold text-amber-900">{totalTables}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-3 sm:p-6 border border-purple-200/50 shadow-lg">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-purple-500 rounded-lg sm:rounded-xl shadow-glow-purple">
                <Users className="h-4 sm:h-6 w-4 sm:w-6 text-white" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-purple-700 text-xs sm:text-sm font-medium">Total Places</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-900">{totalSeats}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-3 sm:p-6 border border-emerald-200/50 shadow-lg">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-emerald-500 rounded-lg sm:rounded-xl">
                <Users className="h-4 sm:h-6 w-4 sm:w-6 text-white" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-emerald-700 text-xs sm:text-sm font-medium">Invités Assignés</p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-900">{totalAssignedGuests}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl p-3 sm:p-6 border border-rose-200/50 shadow-lg">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-rose-500 rounded-lg sm:rounded-xl">
                <Users className="h-4 sm:h-6 w-4 sm:w-6 text-white" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-rose-700 text-xs sm:text-sm font-medium">Places Occupées</p>
                <p className="text-xl sm:text-2xl font-bold text-rose-900">{totalOccupiedSeats}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* En-tête avec bouton d'ajout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div>
          <h3 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Gestion des Tables
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">Organisez les places de vos invités</p>
        </div>
        
        <div className="flex flex-wrap gap-2 sm:gap-3">
        <button
          onClick={() => openModal()}
          className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 font-semibold flex items-center shadow-glow-amber hover:shadow-luxury transform hover:scale-105 text-xs sm:text-sm"
        >
          <Plus className="h-4 sm:h-5 w-4 sm:w-5 mr-1 sm:mr-2" />
          Ajouter une table
        </button>
        
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 font-semibold flex items-center shadow-lg hover:shadow-luxury transform hover:scale-105 text-xs sm:text-sm"
        >
          <Download className="h-4 sm:h-5 w-4 sm:w-5 mr-1 sm:mr-2" />
          Exporter
        </button>
        </div>
      </div>

      {/* Search and Sort Controls */}
      <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm border border-neutral-200/50 mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Rechercher une table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-sm"
          />
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Filter className="h-4 sm:h-5 w-4 sm:w-5 text-neutral-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 sm:px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-xs sm:text-sm"
          >
            <option value="name">Nom</option>
            <option value="seats">Places</option>
            <option value="occupancy">Occupation</option>
          </select>
        </div>
      </div>

      {/* Tableau des tables */}
      <div className="bg-white rounded-2xl shadow-luxury border border-neutral-200/50 overflow-hidden">
        {/* En-tête du tableau - Desktop */}
        <div className="hidden md:grid md:grid-cols-5 gap-4 p-6 bg-gradient-to-r from-neutral-50 to-amber-50/30 border-b border-neutral-200/50">
          <div className="font-semibold text-slate-700">Nom de la table</div>
          <div className="font-semibold text-slate-700">Nombre de places</div>
          <div className="font-semibold text-slate-700">Invités assignés</div>
          <div className="font-semibold text-slate-700">Statut</div>
          <div className="font-semibold text-slate-700 text-right">Actions</div>
        </div>

        {/* Corps du tableau */}
        <div className="divide-y divide-neutral-200/50">
          {filteredTables.map((table, index) => (
            (() => {
              const tableGuests = getGuestsForTable(table.name);
              const occupiedSeats = getOccupiedSeats(table.name);
              const availableSeats = table.seats - occupiedSeats;
              
              return (
            <div
              key={(table as any).isImported ? `imported-${table.name}` : (table.docId || table.id)}
              className={`animate-slide-up hover:bg-gradient-to-r hover:from-neutral-50/50 hover:to-amber-50/30 transition-all duration-300 ${(table as any).isImported ? 'border-l-4 border-amber-400' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Version Desktop */}
              <div className="hidden md:grid md:grid-cols-5 gap-4 p-6 items-center">
                <div className="font-medium text-slate-900">
                  {table.name}
                  {(table as any).isImported && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                      Importée
                    </span>
                  )}
                </div>
                <div className="text-slate-600">
                  {(table as any).isImported ? (
                    <span className="text-xs text-amber-600 italic">Capacité non définie</span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800">
                      <Users className="h-4 w-4 mr-1" />
                      {table.seats} places
                    </span>
                  )}
                </div>
                <div className="text-slate-600">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    !(table as any).isImported && occupiedSeats > table.seats 
                      ? 'bg-rose-100 text-rose-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {occupiedSeats} {(table as any).isImported ? 'personnes' : `/ ${table.seats} places`}
                  </span>
                  {tableGuests.length > 0 && (
                    <div className="text-xs text-slate-500 mt-1">
                      {tableGuests.length} invité{tableGuests.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <div>
                  {(table as any).isImported ? (
                    <button 
                      onClick={() => openModal({ ...table, seats: 8, isImported: false } as any)}
                      className="text-[10px] text-amber-700 hover:underline font-bold uppercase"
                    >
                      Enregistrer la table
                    </button>
                  ) : (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      occupiedSeats >= table.seats 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : occupiedSeats > 0 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-neutral-100 text-neutral-800'
                    }`}>
                      {occupiedSeats >= table.seats 
                        ? 'Complète'
                        : occupiedSeats > 0 
                          ? `${availableSeats} libre${availableSeats > 1 ? 's' : ''}` 
                          : 'Vide'}
                    </span>
                  )}
                </div>
                <div className="flex justify-end space-x-2 sm:flex-shrink-0">
                  <button
                    onClick={() => openGuestModal(table)}
                    className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                    title="Voir invités"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => sendTableInvitations(table)}
                    className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                    title="Envoyer invitations WhatsApp"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => sendTableEmailInvitations(table)}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                    title="Envoyer invitations Email"
                  >
                    <Mail className="h-5 w-5" />
                  </button>
                  {!(table as any).isImported && (
                    <>
                      <button
                        onClick={() => openModal(table)}
                        className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                        title="Modifier"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(table.id)}
                        className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                        title="Supprimer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Version Mobile */}
              <div className="md:hidden px-3 py-2">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h5 className="font-bold text-slate-900 text-sm flex items-center">
                      {table.name}
                      {(table as any).isImported && (
                        <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-800">
                          Importée
                        </span>
                      )}
                    </h5>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(table as any).isImported ? (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-700 border border-amber-100">
                          Capacité non définie
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800">
                          {table.seats} places
                        </span>
                      )}
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        !(table as any).isImported && occupiedSeats > table.seats 
                          ? 'bg-rose-100 text-rose-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {occupiedSeats} {(table as any).isImported ? 'personnes' : `/ ${table.seats}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => openGuestModal(table)}
                      className="p-1.5 bg-purple-100 text-purple-600 rounded-lg"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  <button
                    onClick={() => sendTableInvitations(table)}
                    className="flex items-center justify-center p-2 bg-green-50 text-green-700 rounded-lg border border-green-100 font-medium text-xs"
                  >
                    <MessageSquare className="h-3.5 w-3.5 mr-1" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => sendTableEmailInvitations(table)}
                    className="flex items-center justify-center p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 font-medium text-xs"
                  >
                    <Mail className="h-3.5 w-3.5 mr-1" />
                    Email
                  </button>
                  {!(table as any).isImported ? (
                    <>
                      <button
                        onClick={() => openModal(table)}
                        className="flex items-center justify-center p-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-100 font-medium text-xs"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(table.id)}
                        className="flex items-center justify-center p-2 bg-rose-50 text-rose-700 rounded-lg border border-rose-100 font-medium text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Supprimer
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => openModal({ ...table, seats: 8, isImported: false } as any)}
                      className="col-span-2 flex items-center justify-center p-2 bg-amber-500 text-white rounded-lg font-medium text-xs shadow-glow-amber"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Enregistrer la table
                    </button>
                  )}
                </div>
              </div>
            </div>
              );
            })()
          ))}
        </div>

        {tables.length === 0 && (
          <div className="p-12 text-center">
            <Users className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-500 mb-2">Aucune table configurée</h3>
            <p className="text-neutral-400 mb-6">Commencez par ajouter votre première table</p>
            <button
              onClick={() => openModal()}
              className="bg-amber-500 text-white px-6 py-3 rounded-xl hover:bg-amber-600 transition-all duration-300 font-semibold"
            >
              Ajouter une table
            </button>
          </div>
        )}
      </div>

      {/* Modal pour ajouter/modifier une table */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-luxury max-w-md w-full animate-slide-up">
            <div className="p-6 border-b border-neutral-200/50">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingTable ? 'Modifier la table' : 'Ajouter une table'}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-neutral-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nom de la table
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                    placeholder="Ex: Table des Mariés"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre de places
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.seats}
                    onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 border border-neutral-300 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-all duration-200 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-3 rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 font-semibold shadow-glow-amber transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSaving ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Sauvegarde...
                    </div>
                  ) : (
                    editingTable ? 'Modifier' : 'Ajouter'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal pour voir les invités d'une table */}
      {isGuestModalOpen && selectedTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-luxury max-w-lg w-full animate-slide-up max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-neutral-200/50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Invités - {selectedTable.name}
                  </h3>
                  <p className="text-slate-600 text-sm mt-1">
                    {selectedTable.assignedGuests.length} invité(s) assigné(s) sur {selectedTable.seats} places
                  </p>
                </div>
                <button
                  onClick={closeGuestModal}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-neutral-500" />
                </button>
              </div>
            </div>

            <div className="p-3 sm:p-6 overflow-y-auto max-h-96">
              {selectedTable && getGuestsForTable(selectedTable.name).length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {getGuestsForTable(selectedTable.name).map((guest, index) => (
                    <>
                    <div
                      key={guest.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-4 bg-gradient-to-r from-neutral-50 to-amber-50/30 rounded-lg sm:rounded-xl border border-neutral-200/50 hover:shadow-md transition-all duration-200 animate-slide-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-center">
                        <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-semibold text-[10px] sm:text-sm shadow-lg ${
                          guest.etat === 'couple' 
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500' 
                            : 'bg-gradient-to-r from-amber-500 to-orange-500'
                        }`}>
                          {guest.nom.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div className="ml-2 sm:ml-3">
                          <p className="font-medium text-slate-900 text-sm">{guest.nom}</p>
                          <div className="flex items-center space-x-1 sm:space-x-2">
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
                      <div className="mt-2 sm:mt-0 flex items-center sm:flex-shrink-0 flex-wrap gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-sm font-medium ${
                          guest.confirmed 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {guest.confirmed ? '✓' : '…'}
                        </span>
                        <button
                          onClick={() => setOpenTableGuestActionsId(openTableGuestActionsId === String(guest.id) ? null : String(guest.id))}
                          className="sm:hidden px-2 py-1.5 bg-neutral-100 text-slate-700 rounded-lg hover:bg-neutral-200 transition-all duration-200 font-medium ml-1 text-xs"
                        >
                          Actions
                        </button>
                        <button
                          onClick={() => sendWhatsAppInvitation({ id: String(guest.id), nom: guest.nom, table: selectedTable!.name })}
                          className="hidden sm:inline-flex p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                          aria-label="Envoyer par WhatsApp"
                          title="Envoyer par WhatsApp"
                        >
                          <MessageSquare className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => copyInvitationMessage({ id: String(guest.id), nom: guest.nom, table: selectedTable!.name })}
                          className="hidden sm:inline-flex p-2 text-slate-600 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                          aria-label="Copier le message"
                          title="Copier le message"
                        >
                          <Send className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => sendEmailInvitation({ id: String(guest.id), nom: guest.nom, table: selectedTable!.name })}
                          className="hidden sm:inline-flex p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                          aria-label="Envoyer par Email"
                          title="Envoyer par Email"
                        >
                          <Mail className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    {openTableGuestActionsId === String(guest.id) && (
                      <div className="sm:hidden mt-1 grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => sendWhatsAppInvitation({ id: String(guest.id), nom: guest.nom, table: selectedTable!.name })}
                          className="bg-green-100 text-green-700 px-2 py-1.5 rounded-lg hover:bg-green-200 transition-all duration-200 font-medium text-xs"
                        >
                          WhatsApp
                        </button>
                        <button
                          onClick={() => copyInvitationMessage({ id: String(guest.id), nom: guest.nom, table: selectedTable!.name })}
                          className="bg-slate-100 text-slate-700 px-2 py-1.5 rounded-lg hover:bg-slate-200 transition-all duration-200 font-medium text-xs"
                        >
                          Copier
                        </button>
                        <button
                          onClick={() => sendEmailInvitation({ id: String(guest.id), nom: guest.nom, table: selectedTable!.name })}
                          className="bg-blue-100 text-blue-700 px-2 py-1.5 rounded-lg hover:bg-blue-200 transition-all duration-200 font-medium text-xs"
                        >
                          Email
                        </button>
                        <button
                          onClick={() => {}}
                          className="bg-neutral-100 text-slate-700 px-2 py-1.5 rounded-lg hover:bg-neutral-200 transition-all duration-200 font-medium text-xs"
                        >
                          Fermer
                        </button>
                      </div>
                    )}
                    </>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-neutral-500 mb-2">Aucun invité assigné</h4>
                  <p className="text-neutral-400">Cette table n'a pas encore d'invités assignés</p>
                </div>
              )}
            </div>

            {selectedTable && getGuestsForTable(selectedTable.name).length > 0 && (
              <div className="p-6 border-t border-neutral-200/50 bg-gradient-to-r from-neutral-50 to-amber-50/30">
                {(() => {
                  const tableGuests = getGuestsForTable(selectedTable.name);
                  const confirmedGuests = tableGuests.filter(g => g.confirmed);
                  const pendingGuests = tableGuests.filter(g => !g.confirmed);
                  const occupiedSeats = getOccupiedSeats(selectedTable.name);
                  
                  return (
                    <>
                      <div className="mb-4 text-center">
                        <h4 className="font-semibold text-slate-900 mb-2">Résumé de la table</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-600">Places occupées</p>
                            <p className="text-lg font-bold text-slate-900">{occupiedSeats} / {selectedTable.seats}</p>
                          </div>
                          <div>
                            <p className="text-slate-600">Places libres</p>
                            <p className="text-lg font-bold text-slate-900">{selectedTable.seats - occupiedSeats}</p>
                          </div>
                        </div>
                      </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-emerald-700 font-medium">Confirmés</p>
                    <p className="text-lg font-bold text-emerald-900">
                        {confirmedGuests.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-amber-700 font-medium">En attente</p>
                    <p className="text-lg font-bold text-amber-900">
                        {pendingGuests.length}
                    </p>
                  </div>
                  <div>
                      <p className="text-sm text-slate-700 font-medium">Total invités</p>
                    <p className="text-lg font-bold text-rose-900">
                        {tableGuests.length}
                    </p>
                  </div>
                </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Modal d'export des invités */}
      <GuestExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        guests={realGuests as any}
        tables={tables}
        categories={userCategories}
      />
    </div>
  );
};

export default TableManagement;
