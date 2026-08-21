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

    const body = `Bonjour *${guest.nom}* !\n\n${messageBody}\n\nVotre invitation personnalisée :\n👉 ${invitationLink}\n\nNous avons hâte de célébrer avec vous !`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(body)}`;
    window.open(whatsappUrl, '_blank');
  };
  const copyInvitationMessage = async (guest: { id: string; nom: string; table: string }) => {
    const invitationLink = generateInvitationLink(String(guest.id));
    const messageBody = user?.invitationMessage || "Nous sommes heureux de vous inviter à célébrer ce moment avec nous.";
    const body = `Bonjour *${guest.nom}* 👋\n\n${messageBody}\n\nVotre invitation est prête ici 👉 ${invitationLink}`;
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
      const escHtml = (s: string) => String(s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#039;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const detectImgType = (s: string) => {
        const l = (s || '').toLowerCase();
        if (l.includes('.png') || l.includes('f_png')) return 'image/png';
        if (l.includes('.webp') || l.includes('f_webp')) return 'image/webp';
        if (l.includes('.gif') || l.includes('f_gif')) return 'image/gif';
        return 'image/jpeg';
      };
      const buildShareHtml = (img: string, title: string, desc: string, link: string) => {
        const eImg = escHtml(img); const eTitle = escHtml(title); const eLink = escHtml(link);
        const eImgType = escHtml(detectImgType(img));
        const blank = '\u00a0';
        return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${eTitle}</title><meta name="description" content="${blank}"><meta property="og:type" content="website"><meta property="og:site_name" content="Furaha Event"><meta property="og:locale" content="fr_FR"><meta property="og:title" content="${eTitle}"><meta property="og:description" content="${blank}"><meta property="og:image" content="${eImg}"><meta property="og:image:secure_url" content="${eImg}"><meta property="og:image:type" content="${eImgType}"><meta property="og:image:width" content="1600"><meta property="og:image:height" content="1200"><meta property="og:url" content="${eLink}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${eTitle}"><meta name="twitter:description" content="${blank}"><meta name="twitter:image" content="${eImg}"></head><body><a href="${eLink}" target="_blank" rel="noopener">Voir l'invitation</a><script>setTimeout(function(){window.location.href=${JSON.stringify(link)};},50);</script></body></html>`;
      };
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
      
      const body = `Bonjour *${guest.nom}* 👋\n\nVotre invitation est prête ici 👉 ${invitationLink}\n\nÀ très vite !`;
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

  const getStatusColorDark = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { bg: 'rgba(16,185,129,0.18)', color: '#6ee7b7', border: 'rgba(16,185,129,0.35)' };
      case 'pending':
        return { bg: 'rgba(251,191,36,0.16)', color: '#fcd34d', border: 'rgba(251,191,36,0.35)' };
      case 'declined':
        return { bg: 'rgba(244,63,94,0.18)', color: '#fda4af', border: 'rgba(244,63,94,0.35)' };
      default:
        return { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: 'rgba(255,255,255,0.1)' };
    }
  };

  const invTypesDark = {
    couple: { bg: 'rgba(236,72,153,0.18)', color: '#f9a8d4', border: 'rgba(236,72,153,0.35)' },
    simple: { bg: 'rgba(59,130,246,0.18)', color: '#93c5fd', border: 'rgba(59,130,246,0.35)' },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <style>{`
        .table-filter-select option,
        .table-sort-select option {
          background-color: #ffffff;
          color: #0b0f17;
        }
      `}</style>
      {/* ===== Header + Titre ===== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-extrabold tracking-tight text-white">
            Gestion des Tables
          </h3>
          <p className="text-white/55 mt-1">Organisez les places de vos invités</p>
        </div>
      </div>

      {/* ===== Statistiques (style Invites cards dark) ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Tables', value: totalTables, icon: Users, accent: '#fbbf24', glow: 'rgba(251,191,36,0.35)' },
          { label: 'Total Places', value: totalSeats, icon: Users, accent: '#a78bfa', glow: 'rgba(167,139,250,0.35)' },
          { label: 'Invités Assignés', value: totalAssignedGuests, icon: Users, accent: '#34d399', glow: 'rgba(52,211,153,0.35)' },
          { label: 'Places Occupées', value: totalOccupiedSeats, icon: Users, accent: '#fb7185', glow: 'rgba(251,113,133,0.35)' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="relative rounded-2xl p-3 sm:p-4 overflow-hidden border"
              style={{
                background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
                borderColor: 'rgba(255,255,255,0.08)',
                boxShadow: '0 20px 60px -30px rgba(0,0,0,0.6)',
              }}
            >
              <div
                aria-hidden
                className="absolute -top-10 -right-8 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-50"
                style={{ background: `radial-gradient(circle, ${s.glow} 0%, transparent 70%)` }}
              />
              <div className="relative z-10 flex items-center gap-3 sm:gap-4">
                <div
                  className="p-2 sm:p-3 rounded-xl shrink-0"
                  style={{
                    background: `linear-gradient(180deg, ${s.accent}30 0%, ${s.accent}15 100%)`,
                    border: `1px solid ${s.accent}50`,
                    boxShadow: `0 0 24px -6px ${s.glow}`,
                  }}
                >
                  <Icon className="h-4 sm:h-6 w-4 sm:w-6" style={{ color: s.accent }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider" style={{ color: `${s.accent}cc` }}>
                    {s.label}
                  </p>
                  <p className="text-xl sm:text-2xl font-black mt-0.5 leading-tight text-white tabular-nums">
                    {s.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== Barre de recherche / tri (style Invites dark) ===== */}
      <div
        className="relative rounded-2xl overflow-hidden border p-3 md:p-4"
        style={{
          background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
          borderColor: 'rgba(255,255,255,0.08)',
          boxShadow: '0 20px 60px -30px rgba(0,0,0,0.6)',
        }}
      >
        <div
          aria-hidden
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[92%] h-[55%] pointer-events-none blur-3xl opacity-50"
          style={{ background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.18) 0%, rgba(251,191,36,0.04) 38%, rgba(251,191,36,0) 70%)' }}
        />
        <div className="relative z-10 flex flex-col gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            />
            <input
              type="text"
              placeholder="Rechercher une table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              <Filter
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 pointer-events-none"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="pl-3 pr-8 py-2 rounded-full appearance-none text-xs font-semibold outline-none cursor-pointer table-sort-select"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                <option value="name">Trier par nom</option>
                <option value="seats">Trier par places</option>
                <option value="occupancy">Trier par occupation</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Boutons d'actions (style Invites dark) ===== */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 sm:gap-4">
        <div>
          <h4 className="text-base sm:text-lg font-semibold text-white">
            Liste des tables ({filteredTables.length} / {totalTables})
          </h4>
          <p className="text-white/55 text-xs sm:text-sm">Gérez vos tables et leurs invités assignés</p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap lg:flex-nowrap gap-1.5 sm:gap-2 md:gap-3 w-full lg:w-auto">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex-1 sm:flex-none px-2 sm:px-3 md:px-4 py-1.5 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl transition-all duration-300 font-semibold flex items-center justify-center text-[10px] sm:text-xs md:text-sm"
            style={{
              background: 'rgba(255,255,255,0.03)',
              color: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.25)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1 sm:mr-1.5 md:mr-2" style={{ color: '#34d399' }} />
            Exporter
          </button>
          <button
            onClick={() => openModal()}
            className="col-span-2 sm:col-span-1 flex-1 sm:flex-none px-3 sm:px-4 md:px-5 py-2.5 md:py-3 rounded-lg sm:rounded-xl transition-all duration-300 font-bold flex items-center justify-center text-xs md:text-sm whitespace-nowrap hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
              color: '#0b0f17',
              boxShadow: '0 1px 0 rgba(255,255,255,0.35) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 14px 36px -12px rgba(251,191,36,0.7), 0 0 48px rgba(251,191,36,0.22)',
            }}
          >
            <Plus className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-1.5 sm:mr-2" />
            Ajouter une table
          </button>
        </div>
      </div>

      {/* ===== Liste des tables (container + style Invites dark) ===== */}
      <div
        className="relative rounded-2xl sm:overflow-hidden border"
        style={{
          background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
          borderColor: 'rgba(255,255,255,0.08)',
          boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(251,191,36,0.03) inset',
        }}
      >
        {/* Header "Liste des tables" */}
        <div
          className="hidden md:grid md:grid-cols-12 gap-4 px-4 md:px-6 py-3 md:py-4 border-b items-center rounded-t-2xl"
          style={{
            borderColor: 'rgba(255,255,255,0.06)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
          }}
        >
          <div className="col-span-3 font-extrabold text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Nom de la table
          </div>
          <div className="col-span-2 font-extrabold text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Places
          </div>
          <div className="col-span-3 font-extrabold text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Invités assignés
          </div>
          <div className="col-span-2 font-extrabold text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Statut
          </div>
          <div className="col-span-2 font-extrabold text-xs uppercase tracking-wider text-right" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Actions
          </div>
        </div>

        {/* Corps de liste */}
        <div className="sm:overflow-hidden">
          {filteredTables.length > 0 ? (
            <div>
              {filteredTables.map((table, index) => {
                const tableGuests = getGuestsForTable(table.name);
                const occupiedSeats = getOccupiedSeats(table.name);
                const availableSeats = table.seats - occupiedSeats;
                const over = !(table as any).isImported && occupiedSeats > table.seats;
                return (
                  <div
                    key={(table as any).isImported ? `imported-${table.name}` : (table.docId || table.id)}
                    className={`animate-slide-up border-t transition-all duration-300 ${
                      (table as any).isImported ? '' : ''
                    } ${index === filteredTables.length - 1 ? 'sm:rounded-b-none rounded-b-2xl' : ''}`}
                    style={{
                      animationDelay: `${index * 0.05}s`,
                      borderColor: 'rgba(255,255,255,0.05)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 60%, rgba(255,255,255,0) 100%)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* ===== Version Desktop ===== */}
                    <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 md:px-6 py-3 md:py-4 items-center">
                      {/* Nom */}
                      <div className="col-span-3 min-w-0">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="font-bold text-white truncate">{table.name}</span>
                          {(table as any).isImported && (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase"
                              style={{
                                background: 'rgba(251,191,36,0.18)',
                                color: '#fcd34d',
                                border: '1px solid rgba(251,191,36,0.4)',
                              }}
                            >
                              Importée
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Places */}
                      <div className="col-span-2">
                        {(table as any).isImported ? (
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold italic"
                            style={{
                              background: 'rgba(251,191,36,0.12)',
                              color: '#fcd34d',
                              border: '1px dashed rgba(251,191,36,0.45)',
                            }}
                          >
                            Capacité non définie
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
                            style={{
                              background: 'rgba(251,191,36,0.15)',
                              color: '#fcd34d',
                              border: '1px solid rgba(251,191,36,0.3)',
                            }}
                          >
                            <Users className="h-4 w-4 mr-1.5" />
                            {table.seats} places
                          </span>
                        )}
                      </div>

                      {/* Invités assignés */}
                      <div className="col-span-3">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${''}`}
                          style={{
                            background: over ? 'rgba(244,63,94,0.18)' : 'rgba(167,139,250,0.18)',
                            color: over ? '#fda4af' : '#c4b5fd',
                            border: `1px solid ${over ? 'rgba(244,63,94,0.4)' : 'rgba(167,139,250,0.4)'}`,
                          }}
                        >
                          {occupiedSeats} {(table as any).isImported ? 'personnes' : `/ ${table.seats} places`}
                        </span>
                        {tableGuests.length > 0 && (
                          <div className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            {tableGuests.length} invité{tableGuests.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>

                      {/* Statut */}
                      <div className="col-span-2">
                        {(table as any).isImported ? (
                          <button
                            onClick={() => openModal({ ...table, seats: 8, isImported: false } as any)}
                            className="text-[10px] text-amber-300 hover:underline font-black uppercase tracking-wider"
                          >
                            Enregistrer la table
                          </button>
                        ) : (
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
                            style={
                              occupiedSeats >= table.seats
                                ? { background: 'rgba(16,185,129,0.18)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.4)' }
                                : occupiedSeats > 0
                                ? { background: 'rgba(251,191,36,0.16)', color: '#fcd34d', border: '1px solid rgba(251,191,36,0.35)' }
                                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }
                            }
                          >
                            {occupiedSeats >= table.seats
                              ? 'Complète'
                              : occupiedSeats > 0
                              ? `${availableSeats} libre${availableSeats > 1 ? 's' : ''}`
                              : 'Vide'}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex justify-end gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => openGuestModal(table)}
                          className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                          style={{
                            background: 'rgba(167,139,250,0.12)',
                            color: '#c4b5fd',
                            border: '1px solid rgba(167,139,250,0.25)',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(167,139,250,0.22)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(167,139,250,0.12)'; }}
                          title="Voir invités"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        {!(table as any).isImported && (
                          <>
                            <button
                              onClick={() => openModal(table)}
                              className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                              style={{
                                background: 'rgba(251,191,36,0.12)',
                                color: '#fcd34d',
                                border: '1px solid rgba(251,191,36,0.3)',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.22)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.12)'; }}
                              title="Modifier"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(table.id)}
                              className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                              style={{
                                background: 'rgba(244,63,94,0.12)',
                                color: '#fda4af',
                                border: '1px solid rgba(244,63,94,0.3)',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.22)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.12)'; }}
                              title="Supprimer"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* ===== Version Mobile ===== */}
                    <div className="md:hidden px-3 py-2">
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-black text-white text-sm flex items-center flex-wrap gap-1.5">
                            {table.name}
                            {(table as any).isImported && (
                              <span
                                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase"
                                style={{
                                  background: 'rgba(251,191,36,0.18)',
                                  color: '#fcd34d',
                                  border: '1px solid rgba(251,191,36,0.4)',
                                }}
                              >
                                Importée
                              </span>
                            )}
                          </h5>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {(table as any).isImported ? (
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold italic"
                                style={{
                                  background: 'rgba(251,191,36,0.12)',
                                  color: '#fcd34d',
                                  border: '1px dashed rgba(251,191,36,0.45)',
                                }}
                              >
                                Capacité inconnue
                              </span>
                            ) : (
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{
                                  background: 'rgba(251,191,36,0.15)',
                                  color: '#fcd34d',
                                  border: '1px solid rgba(251,191,36,0.3)',
                                }}
                              >
                                {table.seats} places
                              </span>
                            )}
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={{
                                background: over ? 'rgba(244,63,94,0.18)' : 'rgba(167,139,250,0.18)',
                                color: over ? '#fda4af' : '#c4b5fd',
                                border: `1px solid ${over ? 'rgba(244,63,94,0.4)' : 'rgba(167,139,250,0.4)'}`,
                              }}
                            >
                              {occupiedSeats} {(table as any).isImported ? 'pers.' : `/ ${table.seats}`}
                            </span>
                            {!(table as any).isImported && (
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={
                                  occupiedSeats >= table.seats
                                    ? { background: 'rgba(16,185,129,0.18)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.4)' }
                                    : occupiedSeats > 0
                                    ? { background: 'rgba(251,191,36,0.16)', color: '#fcd34d', border: '1px solid rgba(251,191,36,0.35)' }
                                    : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }
                                }
                              >
                                {occupiedSeats >= table.seats ? 'Complète' : occupiedSeats > 0 ? `${availableSeats} libres` : 'Vide'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start gap-1 shrink-0">
                          <button
                            onClick={() => openGuestModal(table)}
                            className="p-1.5 rounded-lg"
                            style={{
                              background: 'rgba(167,139,250,0.12)',
                              color: '#c4b5fd',
                              border: '1px solid rgba(167,139,250,0.25)',
                            }}
                            title="Voir invités"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {!(table as any).isImported && (
                            <>
                              <button
                                onClick={() => openModal(table)}
                                className="p-1.5 rounded-lg transition-all hover:scale-110"
                                style={{
                                  background: 'rgba(251,191,36,0.12)',
                                  color: '#fcd34d',
                                  border: '1px solid rgba(251,191,36,0.3)',
                                }}
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(table.id)}
                                className="p-1.5 rounded-lg transition-all hover:scale-110"
                                style={{
                                  background: 'rgba(244,63,94,0.12)',
                                  color: '#fda4af',
                                  border: '1px solid rgba(244,63,94,0.3)',
                                }}
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {(table as any).isImported && (
                        <button
                          onClick={() => openModal({ ...table, seats: 8, isImported: false } as any)}
                          className="w-full flex items-center justify-center p-2 rounded-lg font-black text-xs transition-all hover:scale-[1.02] mt-1"
                          style={{
                            background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                            color: '#0b0f17',
                            boxShadow: '0 1px 0 rgba(255,255,255,0.3) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 12px 28px -10px rgba(251,191,36,0.7)',
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Enregistrer la table
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="px-6 py-14 md:py-20 text-center"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.06) 0%, transparent 70%)',
              }}
            >
              <div
                className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <Users className="h-8 w-8 md:h-10 md:w-10" style={{ color: 'rgba(255,255,255,0.3)' }} />
              </div>
              <h3 className="text-base md:text-lg font-bold text-white/80 mb-1.5">
                Aucune table configurée
              </h3>
              <p className="text-white/45 mb-6 text-xs md:text-sm">
                Commencez par ajouter votre première table
              </p>
              <button
                onClick={() => openModal()}
                className="px-5 md:px-6 py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all duration-300 hover:scale-[1.04] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                  color: '#0b0f17',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.35) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 14px 36px -12px rgba(251,191,36,0.7)',
                }}
              >
                <Plus className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                Ajouter une table
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== Modal Ajouter/Modifier (style Invites dark premium) ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
             style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}>
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden border animate-slide-up"
            style={{
              background: 'linear-gradient(180deg, #111727 0%, #0b0f17 100%)',
              borderColor: 'rgba(255,255,255,0.08)',
              boxShadow: '0 50px 120px -30px rgba(0,0,0,0.85), 0 0 0 1px rgba(251,191,36,0.06) inset',
            }}
          >
            <div
              aria-hidden
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-[80%] h-40 rounded-full blur-3xl pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.25) 0%, transparent 70%)' }}
            />
            <div
              className="relative z-10 px-5 sm:px-6 py-4 sm:py-5 flex justify-between items-center border-b"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div>
                <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  {editingTable ? 'Modifier la table' : 'Ajouter une table'}
                </h3>
                <p className="text-[11px] sm:text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {editingTable ? 'Modifiez les informations de la table' : 'Créez une nouvelle table pour vos invités'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.55)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.15)'; e.currentTarget.style.color = '#fda4af'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.35)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="relative z-10 px-5 sm:px-6 py-5 sm:py-6 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Nom de la table
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Table des Mariés"
                  required
                  className="w-full px-4 py-3 rounded-xl transition-all duration-200 text-sm outline-none placeholder:text-white/25 text-white"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Nombre de places
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.seats}
                  onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) || 1 })}
                  required
                  className="w-full px-4 py-3 rounded-xl transition-all duration-200 text-sm outline-none text-white"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-xs sm:text-sm hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    color: 'rgba(255,255,255,0.75)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 rounded-xl transition-all duration-200 font-black text-xs sm:text-sm whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                    color: '#0b0f17',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.35) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 14px 36px -12px rgba(251,191,36,0.7)',
                  }}
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-black/25 border-t-black rounded-full animate-spin" />
                      Sauvegarde...
                    </span>
                  ) : editingTable ? (
                    'Modifier'
                  ) : (
                    'Ajouter'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Modal Voir invités d'une table (style dark premium) ===== */}
      {isGuestModalOpen && selectedTable && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl overflow-hidden border animate-slide-up flex flex-col"
            style={{
              maxHeight: '85vh',
              background: 'linear-gradient(180deg, #111727 0%, #0b0f17 100%)',
              borderColor: 'rgba(255,255,255,0.08)',
              boxShadow: '0 50px 120px -30px rgba(0,0,0,0.85), 0 0 0 1px rgba(251,191,36,0.06) inset',
            }}
          >
            <div
              aria-hidden
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-[80%] h-40 rounded-full blur-3xl pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.22) 0%, transparent 70%)' }}
            />
            <div
              className="relative z-10 px-5 sm:px-6 py-4 sm:py-5 flex justify-between items-center border-b"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="min-w-0 mr-2">
                <h3 className="text-lg sm:text-xl font-black tracking-tight text-white truncate">
                  Invités · {selectedTable.name}
                </h3>
                <p className="text-[11px] sm:text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {getGuestsForTable(selectedTable.name).length} invité(s) assigné(s) sur {selectedTable.seats} places
                </p>
              </div>
              <button
                onClick={closeGuestModal}
                className="p-2 rounded-lg transition-all duration-200 hover:scale-110 shrink-0"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.55)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.15)'; e.currentTarget.style.color = '#fda4af'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.35)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative z-10 flex-1 overflow-y-auto px-3 sm:px-5 py-4 sm:py-5">
              {getGuestsForTable(selectedTable.name).length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {getGuestsForTable(selectedTable.name).map((guest, index) => {
                    const statusStyle = guest.confirmed ? getStatusColorDark('confirmed') : getStatusColorDark('pending');
                    const typeStyle = invTypesDark[guest.etat || 'simple'];
                    return (
                      <React.Fragment key={guest.id}>
                        <div
                          className="relative rounded-xl sm:rounded-2xl overflow-hidden border p-2 sm:p-4 transition-all duration-200 animate-slide-up"
                          style={{
                            animationDelay: `${index * 0.05}s`,
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
                            borderColor: 'rgba(255,255,255,0.06)',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.05)'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.22)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                            <div className="flex items-center min-w-0">
                              <div
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-black text-[10px] sm:text-sm shrink-0"
                                style={{
                                  background: guest.etat === 'couple'
                                    ? 'linear-gradient(180deg, #ec4899 0%, #8b5cf6 100%)'
                                    : 'linear-gradient(180deg, #f59e0b 0%, #ea580c 100%)',
                                  boxShadow: '0 6px 18px -6px rgba(0,0,0,0.6)',
                                }}
                              >
                                {guest.nom.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </div>
                              <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                                <p className="font-bold text-white text-sm truncate">{guest.nom}</p>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black"
                                    style={{ background: typeStyle.bg, color: typeStyle.color, border: `1px solid ${typeStyle.border}` }}
                                  >
                                    {guest.etat === 'couple' ? 'Couple' : 'Simple'}
                                  </span>
                                  <span
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black"
                                    style={{ background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}
                                  >
                                    {guest.confirmed ? 'Confirmé' : 'En attente'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Action boutons Desktop */}
                            <div className="hidden sm:flex items-center gap-1 flex-shrink-0 flex-wrap">
                              <button
                                onClick={() => sendWhatsAppInvitation({ id: String(guest.id), nom: guest.nom, table: selectedTable!.name })}
                                className="p-2 rounded-lg transition-all hover:scale-110"
                                style={{ background: 'rgba(16,185,129,0.12)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' }}
                                title="WhatsApp"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => copyInvitationMessage({ id: String(guest.id), nom: guest.nom, table: selectedTable!.name })}
                                className="p-2 rounded-lg transition-all hover:scale-110"
                                style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
                                title="Copier"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => sendEmailInvitation({ id: String(guest.id), nom: guest.nom, table: selectedTable!.name })}
                                className="p-2 rounded-lg transition-all hover:scale-110"
                                style={{ background: 'rgba(59,130,246,0.12)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)' }}
                                title="Email"
                              >
                                <Mail className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Action bouton Mobile : ouvre le panel */}
                            <button
                              onClick={() => setOpenTableGuestActionsId(openTableGuestActionsId === String(guest.id) ? null : String(guest.id))}
                              className="sm:hidden self-end px-2.5 py-1.5 rounded-lg font-bold text-[10px]"
                              style={{
                                background: 'rgba(255,255,255,0.04)',
                                color: 'rgba(255,255,255,0.75)',
                                border: '1px solid rgba(255,255,255,0.08)',
                              }}
                            >
                              Actions
                            </button>
                          </div>

                          {openTableGuestActionsId === String(guest.id) && (
                            <div className="sm:hidden mt-2 grid grid-cols-2 gap-1.5">
                              <button
                                onClick={() => sendWhatsAppInvitation({ id: String(guest.id), nom: guest.nom, table: selectedTable!.name })}
                                className="px-2 py-1.5 rounded-lg font-bold text-[10px]"
                                style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.35)' }}
                              >
                                WhatsApp
                              </button>
                              <button
                                onClick={() => copyInvitationMessage({ id: String(guest.id), nom: guest.nom, table: selectedTable!.name })}
                                className="px-2 py-1.5 rounded-lg font-bold text-[10px]"
                                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)' }}
                              >
                                Copier
                              </button>
                              <button
                                onClick={() => sendEmailInvitation({ id: String(guest.id), nom: guest.nom, table: selectedTable!.name })}
                                className="px-2 py-1.5 rounded-lg font-bold text-[10px]"
                                style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.35)' }}
                              >
                                Email
                              </button>
                              <button
                                onClick={() => setOpenTableGuestActionsId(null)}
                                className="px-2 py-1.5 rounded-lg font-bold text-[10px]"
                                style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
                              >
                                Fermer
                              </button>
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              ) : (
                <div
                  className="text-center py-10 sm:py-14"
                  style={{ background: 'radial-gradient(ellipse at center, rgba(167,139,250,0.06) 0%, transparent 70%)' }}
                >
                  <div
                    className="w-14 h-14 mx-auto mb-3 sm:mb-4 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <Users className="h-6 w-6 sm:h-7 sm:w-7" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  </div>
                  <h4 className="font-bold text-white/75 mb-1">Aucun invité assigné</h4>
                  <p className="text-xs text-white/40">Cette table n'a pas encore d'invités assignés</p>
                </div>
              )}
            </div>

            {selectedTable && getGuestsForTable(selectedTable.name).length > 0 && (
              <div
                className="relative z-10 px-5 sm:px-6 py-4 sm:py-5 border-t"
                style={{
                  borderColor: 'rgba(255,255,255,0.06)',
                  background: 'linear-gradient(180deg, rgba(251,191,36,0.04) 0%, rgba(251,191,36,0.02) 100%)',
                }}
              >
                {(() => {
                  const tableGuests = getGuestsForTable(selectedTable.name);
                  const confirmedGuests = tableGuests.filter(g => g.confirmed);
                  const pendingGuests = tableGuests.filter(g => !g.confirmed);
                  const occupiedSeats = getOccupiedSeats(selectedTable.name);
                  return (
                    <>
                      <div className="mb-3 sm:mb-4 text-center">
                        <h4 className="font-black text-sm sm:text-base text-white mb-2">Résumé de la table</h4>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                          <div className="rounded-xl p-2 sm:p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>
                              Places occupées
                            </p>
                            <p className="text-lg sm:text-xl font-black mt-0.5 text-white tabular-nums">
                              {occupiedSeats}<span className="text-white/35"> / {selectedTable.seats}</span>
                            </p>
                          </div>
                          <div className="rounded-xl p-2 sm:p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>
                              Places libres
                            </p>
                            <p className="text-lg sm:text-xl font-black mt-0.5 text-white tabular-nums" style={{ color: '#6ee7b7' }}>
                              {Math.max(0, selectedTable.seats - occupiedSeats)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                        {[
                          { label: 'Confirmés', value: confirmedGuests.length, color: '#6ee7b7', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)' },
                          { label: 'En attente', value: pendingGuests.length, color: '#fcd34d', bg: 'rgba(251,191,36,0.14)', border: 'rgba(251,191,36,0.35)' },
                          { label: 'Total', value: tableGuests.length, color: '#fda4af', bg: 'rgba(244,63,94,0.15)', border: 'rgba(244,63,94,0.35)' },
                        ].map((c, i) => (
                          <div
                            key={i}
                            className="rounded-xl py-2 sm:py-3"
                            style={{ background: c.bg, border: `1px solid ${c.border}` }}
                          >
                            <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: c.color, opacity: 0.85 }}>
                              {c.label}
                            </p>
                            <p className="text-base sm:text-lg font-black mt-0.5 tabular-nums" style={{ color: c.color }}>
                              {c.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export modal — rendu par le composant dédié */}
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
