import React, { useState, useEffect, useMemo } from 'react';
import { MessageCircle, Wine, User, Calendar, Filter, Search, FileText, Eye, X, Heart, Gift, GraduationCap, Table, Send } from 'lucide-react';
import { useTemplates } from '../hooks/useTemplates';
import { useAuth } from './AuthContext';
import { InviteService, UserModel } from '../services/templateService';
import jsPDF from 'jspdf';
import { notificationService } from '../services/notificationService';

interface GuestMessage {
  id: string;
  inviteId: string;
  guestName: string;
  table: string;
  message: string;
  selectedDrink?: string;
  confirmed: boolean;
  guestType: 'simple' | 'couple';
  timestamp: string;
  likes: string[];
}

const GuestMessagesViewer = () => {
  const { userInvites, userModels } = useTemplates();
  const { user } = useAuth();
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<GuestMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'pending'>('all');
  const [filterDrink, setFilterDrink] = useState<'all' | 'selected' | 'none'>('all');
  const [sortByDrink, setSortByDrink] = useState<string>('all');
  const [sortByTable, setSortByTable] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'date_desc' | 'date_asc' | 'name_asc'>('date_desc');
  const [selectedGroup, setSelectedGroup] = useState<GuestMessage[] | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pdfDensity, setPdfDensity] = useState<'normal' | 'compact'>('normal');
  const [pdfFontSize, setPdfFontSize] = useState<number>(9);
  const [showPdfOptions, setShowPdfOptions] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>('');
  const [isSendingReply, setIsSendingReply] = useState<boolean>(false);
  
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    const unsub = InviteService.subscribeAllGuestMessages(user.id, (all) => {
      const guestMessages: GuestMessage[] = all.map((m) => {
        const inv = userInvites.find((i) => i.id === m.inviteId) || null;
        const table = inv?.table || 'Non assigné';
        const confirmed = inv?.confirmed || false;
        const guestType = inv?.etat || m.guestType || 'simple';
        const selectedDrink = (inv as any)?.selectedDrink || '';
        return {
          id: m.id,
          inviteId: m.inviteId,
          guestName: m.nom || 'Invité',
          table,
          message: m.message || '',
          selectedDrink,
          confirmed,
          guestType,
          timestamp: m.timestamp,
          likes: Array.isArray(m.likes) ? m.likes : []
        };
      });
      setMessages(guestMessages);
      setFilteredMessages(guestMessages);
      setIsLoading(false);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [user, userInvites]);

  const loadGuestMessages = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const all = await InviteService.getAllGuestMessages(user.id);
      const guestMessages: GuestMessage[] = all.map((m) => {
        const inv = userInvites.find((i) => i.id === m.id || i.id === m.inviteId) || null;
        const table = inv?.table || 'Non assigné';
        const confirmed = inv?.confirmed || false;
        const guestType = inv?.etat || m.guestType || 'simple';
        const selectedDrink = (inv as any)?.selectedDrink || '';
        return {
          id: m.id,
          inviteId: m.inviteId,
          guestName: m.nom || 'Invité',
          table,
          message: m.message || '',
          selectedDrink,
          confirmed,
          guestType,
          timestamp: m.timestamp,
          likes: Array.isArray(m.likes) ? m.likes : []
        };
      });
      setMessages(guestMessages);
      setFilteredMessages(guestMessages);
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce du terme de recherche pour des filtres plus fluides
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearchTerm(searchTerm), 180);
    return () => window.clearTimeout(t);
  }, [searchTerm]);

  // Filtrer les messages
  useEffect(() => {
    let filtered = messages;

    // Filtre par terme de recherche
    if (debouncedSearchTerm) {
      const searchLower = String(debouncedSearchTerm).toLowerCase();
      filtered = filtered.filter(msg => 
        String(msg.guestName || '').toLowerCase().includes(searchLower) ||
        String(msg.table || '').toLowerCase().includes(searchLower) ||
        (msg.message && String(msg.message).toLowerCase().includes(searchLower))
      );
    }

    // Filtre par statut de confirmation
    if (filterStatus !== 'all') {
      filtered = filtered.filter(msg => 
        filterStatus === 'confirmed' ? msg.confirmed : !msg.confirmed
      );
    }

    // Filtre par choix de boisson
    if (filterDrink !== 'all') {
      filtered = filtered.filter(msg => 
        filterDrink === 'selected' ? msg.selectedDrink : !msg.selectedDrink
      );
    }

    // Tri par boisson spécifique
    if (sortByDrink !== 'all') {
      filtered = filtered.filter(msg => msg.selectedDrink === sortByDrink);
    }

    // Tri par table spécifique
    if (sortByTable !== 'all') {
      filtered = filtered.filter(msg => msg.table === sortByTable);
    }

    // Apply Sorting
    filtered.sort((a, b) => {
      if (sortOrder === 'date_desc') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortOrder === 'date_asc') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      if (sortOrder === 'name_asc') return a.guestName.localeCompare(b.guestName);
      return 0;
    });

    setFilteredMessages(filtered);
  }, [messages, debouncedSearchTerm, filterStatus, filterDrink, sortByDrink, sortByTable, sortOrder]);

  // Obtenir la liste unique des boissons sélectionnées
  const getUniqueDrinks = () => {
    const drinks = messages
      .filter(msg => msg.selectedDrink && msg.selectedDrink.trim())
      .map(msg => msg.selectedDrink as string)
      .filter((drink, index, array) => array.indexOf(drink) === index)
      .sort();
    return drinks;
  };

  // Obtenir la liste unique des tables
  const getUniqueTables = () => {
    const tables = messages
      .map(msg => msg.table)
      .filter((table, index, array) => array.indexOf(table) === index)
      .sort();
    return tables;
  };

  const getEventIcon = () => {
    if (userModels.length > 0) {
      const category = userModels[0].category;
      switch (category) {
        case 'wedding':
          return Heart;
        case 'birthday':
          return Gift;
        case 'graduation':
          return GraduationCap;
        default:
          return MessageCircle;
      }
    }
    return MessageCircle;
  };

  const getEventColors = () => {
    if (userModels.length > 0) {
      const category = userModels[0].category;
      switch (category) {
        case 'wedding':
          return {
            primary: 'from-rose-500 to-pink-500',
            bg: 'from-rose-50 to-pink-50',
            text: 'text-rose-600',
            border: 'border-rose-200'
          };
        case 'birthday':
          return {
            primary: 'from-purple-500 to-indigo-500',
            bg: 'from-purple-50 to-indigo-50',
            text: 'text-purple-600',
            border: 'border-purple-200'
          };
        case 'graduation':
          return {
            primary: 'from-emerald-500 to-teal-500',
            bg: 'from-emerald-50 to-teal-50',
            text: 'text-emerald-600',
            border: 'border-emerald-200'
          };
        default:
          return {
            primary: 'from-amber-500 to-orange-500',
            bg: 'from-amber-50 to-orange-50',
            text: 'text-amber-600',
            border: 'border-amber-200'
          };
      }
    }
    return {
      primary: 'from-amber-500 to-orange-500',
      bg: 'from-amber-50 to-orange-50',
      text: 'text-amber-600',
      border: 'border-amber-200'
    };
  };

  const openMessageModal = (message: GuestMessage) => {
    const group = filteredMessages.filter(m => m.inviteId === message.inviteId);
    setSelectedGroup(group);
    setShowMessageModal(true);
  };

  const closeMessageModal = () => {
    setSelectedGroup(null);
    setShowMessageModal(false);
    setReplyText('');
  };

  const handleSendReply = async (message: GuestMessage) => {
    if (!replyText.trim() || !user) return;
    
    setIsSendingReply(true);
    try {
      // Pour l'admin, on utilise son ID comme replierId
      await InviteService.replyToLegacyGuestMessage(
        user.id,
        message.inviteId,
        message.id,
        user.id, // L'admin répond
        replyText
      );
      
      // Notifier l'invité (si possible via le système de notification)
      await notificationService.sendNotification({
        type: 'message',
        recipientId: message.inviteId, // On utilise l'inviteId comme destinataire
        senderName: 'Organisateur',
        title: 'Réponse à votre message',
        body: `L'organisateur a répondu à votre message : "${replyText.substring(0, 50)}..."`,
        relatedId: message.id
      });

      showToast('success', 'Réponse envoyée');
      setReplyText('');
      // Rafraîchir les messages du groupe
      const updatedAll = await InviteService.getAllGuestMessages(user.id);
      const updatedGroup = updatedAll.filter(m => m.inviteId === message.inviteId).map(m => {
        const inv = userInvites.find((i) => i.id === m.inviteId) || null;
        return {
          id: m.id,
          inviteId: m.inviteId,
          guestName: m.nom || 'Invité',
          table: inv?.table || 'Non assigné',
          message: m.message || '',
          selectedDrink: (inv as any)?.selectedDrink || '',
          confirmed: inv?.confirmed || false,
          guestType: inv?.etat || 'simple',
          timestamp: m.timestamp,
          likes: Array.isArray(m.likes) ? m.likes : []
        };
      });
      setSelectedGroup(updatedGroup);
    } catch (error) {
      console.error('Erreur réponse:', error);
      showToast('error', 'Erreur lors de l\'envoi');
    } finally {
      setIsSendingReply(false);
    }
  };


  const exportMessagesToPDF = () => {
    const doc = new jsPDF(pdfOrientation === 'landscape' ? 'l' : 'p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 12;
    const base = pdfFontSize;
    const headerHeight = (pdfDensity === 'compact' ? 9 : 11) + (base - 9) * 0.3;
    const rowHeight = (pdfDensity === 'compact' ? 5.5 : 6.5) + (base - 9) * 0.3;
    let y = margin;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(base + (pdfDensity === 'compact' ? 5 : 7));
    doc.text('Messages & Boissons des Invités', pageWidth / 2, y, { align: 'center' });
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(base);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(base + (pdfDensity === 'compact' ? 1 : 2));
    doc.setTextColor(33, 37, 41);
    doc.text('Statistiques', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(base);
    doc.setTextColor(90, 90, 90);
    doc.text(`Messages: ${totalMessages}`, margin, y);
    doc.text(`Boissons: ${totalDrinkSelections}`, margin + 45, y);
    doc.text(`Confirmés: ${confirmedGuests}`, margin + 90, y);
    doc.text(`En attente: ${pendingGuests}`, margin + 135, y);
    y += 10;

    const nameW = pdfOrientation === 'landscape' ? 45 : 40;
    const tableW = pdfOrientation === 'landscape' ? 28 : 25;
    const typeW = pdfOrientation === 'landscape' ? 22 : 20;
    const drinkW = pdfOrientation === 'landscape' ? 35 : 30;
    const statusW = pdfOrientation === 'landscape' ? 28 : 25;
    const dateW = pdfOrientation === 'landscape' ? 28 : 25;
    const msgW = pageWidth - margin * 2 - (nameW + tableW + typeW + drinkW + statusW + dateW);
    const colX = [
      margin,
      margin + nameW,
      margin + nameW + tableW,
      margin + nameW + tableW + typeW,
      margin + nameW + tableW + typeW + drinkW,
      margin + nameW + tableW + typeW + drinkW + statusW
    ];

    if (y > pageHeight - margin - (headerHeight + rowHeight)) {
      doc.addPage();
      y = margin;
    }

    doc.setDrawColor(245, 158, 11);
    doc.setFillColor(255, 247, 236);
    doc.rect(margin, y, pageWidth - margin * 2, headerHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(base);
    doc.setTextColor(120, 72, 0);
    doc.text('Nom', colX[0] + 2, y + Math.min(headerHeight - 2, 8));
    doc.text('Table', colX[1] + 2, y + Math.min(headerHeight - 2, 8));
    doc.text('Type', colX[2] + 2, y + Math.min(headerHeight - 2, 8));
    doc.text('Boisson', colX[3] + 2, y + Math.min(headerHeight - 2, 8));
    doc.text('Statut', colX[4] + 2, y + Math.min(headerHeight - 2, 8));
    doc.text('Date', colX[5] + 2, y + Math.min(headerHeight - 2, 8));
    doc.text('Message', margin + nameW + tableW + typeW + drinkW + statusW + dateW + 2, y + Math.min(headerHeight - 2, 8));
    y += headerHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(base);
    doc.setTextColor(33, 37, 41);

    filteredMessages.forEach((m, idx) => {
      if (y > pageHeight - margin - rowHeight) {
        doc.addPage();
        y = margin;
        doc.setDrawColor(245, 158, 11);
        doc.setFillColor(255, 247, 236);
        doc.rect(margin, y, pageWidth - margin * 2, headerHeight, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(base);
        doc.setTextColor(120, 72, 0);
        doc.text('Nom', colX[0] + 2, y + Math.min(headerHeight - 2, 8));
        doc.text('Table', colX[1] + 2, y + Math.min(headerHeight - 2, 8));
        doc.text('Type', colX[2] + 2, y + Math.min(headerHeight - 2, 8));
        doc.text('Boisson', colX[3] + 2, y + Math.min(headerHeight - 2, 8));
        doc.text('Statut', colX[4] + 2, y + Math.min(headerHeight - 2, 8));
        doc.text('Date', colX[5] + 2, y + Math.min(headerHeight - 2, 8));
        doc.text('Message', margin + nameW + tableW + typeW + drinkW + statusW + dateW + 2, y + Math.min(headerHeight - 2, 8));
        y += headerHeight;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(base);
        doc.setTextColor(33, 37, 41);
      }

      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y - 0.5, pageWidth - margin * 2, rowHeight, 'F');
      }

      const maxChars = pdfOrientation === 'landscape' ? 80 : 60;
      const rawMsg = (m.message || '').replace(/\s+/g, ' ').trim();
      const displayMsg = rawMsg.length > maxChars ? rawMsg.slice(0, maxChars - 3) + '...' : rawMsg || '-';
      const dateStr = m.timestamp ? new Date(m.timestamp).toLocaleDateString('fr-FR') : '-';

      doc.text(m.guestName || 'Invité', colX[0] + 2, y + (rowHeight - 1));
      doc.text(m.table || 'Non assigné', colX[1] + 2, y + Math.min(rowHeight - 2, 5));
      doc.text(m.guestType === 'couple' ? 'Couple' : 'Simple', colX[2] + 2, y + Math.min(rowHeight - 2, 5));
      doc.text(m.selectedDrink ? m.selectedDrink : '-', colX[3] + 2, y + Math.min(rowHeight - 2, 5));
      doc.text(m.confirmed ? 'Confirmé' : 'En attente', colX[4] + 2, y + Math.min(rowHeight - 2, 5));
      doc.text(dateStr, colX[5] + 2, y + Math.min(rowHeight - 2, 5));
      doc.text(displayMsg, margin + nameW + tableW + typeW + drinkW + statusW + dateW + 2, y + Math.min(rowHeight - 2, 5));

      y += rowHeight;
    });

    doc.save('messages-invites.pdf');
  };

  

  const EventIcon = getEventIcon();
  const colors = getEventColors();

  // Statistiques
  const totalMessages = messages.filter(msg => msg.message && msg.message.trim()).length;
  const totalDrinkSelections = messages.filter(msg => msg.selectedDrink).length;
  const confirmedGuests = messages.filter(msg => msg.confirmed).length;
  const pendingGuests = messages.filter(msg => !msg.confirmed).length;

  const groupedMessages: Record<string, GuestMessage[]> = useMemo(() => {
    return filteredMessages.reduce((acc, msg) => {
      const key = msg.inviteId;
      acc[key] = acc[key] ? [...acc[key], msg] : [msg];
      return acc;
    }, {} as Record<string, GuestMessage[]>);
  }, [filteredMessages]);

  const filtersNode = (
    <div className="p-3 md:p-6 border-b border-neutral-200/50 bg-gradient-to-r from-neutral-50 to-amber-50/30">
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-9 pr-3 py-2 md:py-3 border border-neutral-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-xs md:text-sm"
            />
          </div>
        </div>
        
        {/* Filtres défilables sur mobile */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'confirmed' | 'pending')}
            className="flex-shrink-0 px-2.5 py-1.5 border border-neutral-300 rounded-full focus:ring-2 focus:ring-amber-500 bg-white text-[10px] font-medium"
          >
            <option value="all">Tous statuts</option>
            <option value="confirmed">Confirmés</option>
            <option value="pending">En attente</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="flex-shrink-0 px-2.5 py-1.5 border border-neutral-300 rounded-full focus:ring-2 focus:ring-amber-500 bg-white text-[10px] font-medium"
          >
            <option value="date_desc">Récents</option>
            <option value="date_asc">Anciens</option>
            <option value="name_asc">A-Z</option>
          </select>
          <select
            value={sortByDrink}
            onChange={(e) => setSortByDrink(e.target.value)}
            className="flex-shrink-0 px-2.5 py-1.5 border border-neutral-300 rounded-full focus:ring-2 focus:ring-amber-500 bg-white text-[10px] font-medium"
          >
            <option value="all">Toutes boissons</option>
            {getUniqueDrinks().map((drink) => (
              <option key={drink} value={drink}>{drink}</option>
            ))}
          </select>
          <select
            value={sortByTable}
            onChange={(e) => setSortByTable(e.target.value)}
            className="flex-shrink-0 px-2.5 py-1.5 border border-neutral-300 rounded-full focus:ring-2 focus:ring-amber-500 bg-white text-[10px] font-medium"
          >
            <option value="all">Toutes tables</option>
            {getUniqueTables().map((table) => (
              <option key={table} value={table}>{table}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3">
          <button
            onClick={() => setShowPdfOptions(v => !v)}
            className="flex-1 md:flex-none px-3 py-1.5 md:px-4 md:py-2.5 rounded-lg md:rounded-xl border-2 border-neutral-200 text-slate-700 hover:border-amber-300 transition-all duration-200 text-[10px] md:text-sm font-bold"
          >
            {showPdfOptions ? 'Masquer PDF' : 'Options PDF'}
          </button>
          <button
            onClick={exportMessagesToPDF}
            className="flex-1 md:flex-none bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-1.5 md:px-4 md:py-2.5 rounded-lg md:rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 font-bold flex items-center justify-center shadow-lg text-[10px] md:text-sm"
          >
            <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
            PDF
          </button>
        </div>
        {showPdfOptions ? (
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-xs md:text-sm font-medium text-slate-700 mb-2 md:mb-3">Orientation</label>
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <button
                  onClick={() => setPdfOrientation('portrait')}
                  className={`p-3 md:p-4 rounded-lg md:rounded-xl border-2 transition-all duration-300 ${
                    pdfOrientation === 'portrait'
                      ? 'border-amber-400 bg-amber-50 text-amber-700'
                      : 'border-neutral-200 hover:border-amber-300 text-slate-600'
                  }`}
                >
                  <FileText className="h-6 md:h-8 w-6 md:w-8 mx-auto mb-1.5 md:mb-2" />
                  <div className="text-xs md:text-sm font-medium">Portrait</div>
                  <div className="text-[10px] md:text-xs opacity-75">Page verticale</div>
                </button>
                <button
                  onClick={() => setPdfOrientation('landscape')}
                  className={`p-3 md:p-4 rounded-lg md:rounded-xl border-2 transition-all duration-300 ${
                    pdfOrientation === 'landscape'
                      ? 'border-amber-400 bg-amber-50 text-amber-700'
                      : 'border-neutral-200 hover:border-amber-300 text-slate-600'
                  }`}
                >
                  <FileText className="h-6 md:h-8 w-6 md:w-8 mx-auto mb-1.5 md:mb-2" />
                  <div className="text-xs md:text-sm font-medium">Paysage</div>
                  <div className="text-[10px] md:text-xs opacity-75">Page horizontale</div>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-slate-700 mb-2 md:mb-3">Densité du tableau</label>
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <button
                  onClick={() => setPdfDensity('normal')}
                  className={`p-3 md:p-4 rounded-lg md:rounded-xl border-2 transition-all duration-300 ${
                    pdfDensity === 'normal'
                      ? 'border-amber-400 bg-amber-50 text-amber-700'
                      : 'border-neutral-200 hover:border-amber-300 text-slate-600'
                  }`}
                >
                  <Table className="h-6 md:h-8 w-6 md:w-8 mx-auto mb-1.5 md:mb-2" />
                  <div className="text-xs md:text-sm font-medium">Normal</div>
                  <div className="text-[10px] md:text-xs opacity-75">Lisible, espacement standard</div>
                </button>
                <button
                  onClick={() => setPdfDensity('compact')}
                  className={`p-3 md:p-4 rounded-lg md:rounded-xl border-2 transition-all duration-300 ${
                    pdfDensity === 'compact'
                      ? 'border-amber-400 bg-amber-50 text-amber-700'
                      : 'border-neutral-200 hover:border-amber-300 text-slate-600'
                  }`}
                >
                  <Table className="h-6 md:h-8 w-6 md:w-8 mx-auto mb-1.5 md:mb-2" />
                  <div className="text-xs md:text-sm font-medium">Compact</div>
                  <div className="text-[10px] md:text-xs opacity-75">Plus d'invités par page</div>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-slate-700 mb-2 md:mb-3">Taille de police</label>
              <div className="flex items-center gap-2 md:gap-3">
                <input
                  type="range"
                  min={7}
                  max={12}
                  step={1}
                  value={pdfFontSize}
                  onChange={(e) => setPdfFontSize(Number(e.target.value))}
                  className="flex-1 accent-amber-500"
                />
                <span className="text-xs md:text-sm text-slate-700 w-8 md:w-10 text-right">{pdfFontSize}pt</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-luxury w-full overflow-hidden">
        <div className={`p-4 md:p-6 border-b border-neutral-200/50 bg-gradient-to-r ${colors.bg}`}>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center">
              <div className="relative mr-3 md:mr-4">
                <EventIcon className={`h-6 w-6 md:h-8 md:w-8 ${colors.text} animate-glow drop-shadow-lg`} />
                <div className="absolute inset-0 animate-pulse">
                  <EventIcon className={`h-6 w-6 md:h-8 md:w-8 ${colors.text} opacity-30`} />
                </div>
              </div>
              <div>
                <h2 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Messages & Boissons
                </h2>
                <p className="text-[10px] md:text-sm text-slate-600">
                  Vœux et choix de vos invités
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 border-b border-neutral-200/50">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className={`bg-gradient-to-br ${colors.bg} rounded-xl p-3 md:p-4 ${colors.border} border shadow-md md:shadow-lg`}>
              <div className="flex items-center">
                <div className={`p-1.5 md:p-2 bg-gradient-to-r ${colors.primary} rounded-lg shadow-lg`}>
                  <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                <div className="ml-2 md:ml-3">
                  <p className={`${colors.text} text-[10px] md:text-sm font-medium uppercase tracking-wider`}>Messages</p>
                  <p className="text-lg md:text-2xl font-bold text-slate-900">{totalMessages}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 md:p-4 border border-purple-200 shadow-md md:shadow-lg">
              <div className="flex items-center">
                <div className="p-1.5 md:p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg">
                  <Wine className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                <div className="ml-2 md:ml-3">
                  <p className="text-purple-600 text-[10px] md:text-sm font-medium uppercase tracking-wider">Boissons</p>
                  <p className="text-lg md:text-2xl font-bold text-slate-900">{totalDrinkSelections}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-3 md:p-4 border border-emerald-200 shadow-md md:shadow-lg">
              <div className="flex items-center">
                <div className="p-1.5 md:p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg shadow-lg">
                  <User className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                <div className="ml-2 md:ml-3">
                  <p className="text-emerald-600 text-[10px] md:text-sm font-medium uppercase tracking-wider">Confirmés</p>
                  <p className="text-lg md:text-2xl font-bold text-slate-900">{confirmedGuests}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-3 md:p-4 border border-amber-200 shadow-md md:shadow-lg">
              <div className="flex items-center">
                <div className="p-1.5 md:p-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg shadow-lg">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                <div className="ml-2 md:ml-3">
                  <p className="text-amber-600 text-[10px] md:text-sm font-medium uppercase tracking-wider">En attente</p>
                  <p className="text-lg md:text-2xl font-bold text-slate-900">{pendingGuests}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

          {filtersNode}
        <div className="p-3 md:p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="text-center py-8 md:py-12">
              <div className="flex items-center justify-center space-x-1.5 mb-3 md:mb-4">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-amber-500 rounded-full animate-bounce"></div>
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <p className="text-xs md:text-sm text-slate-600 font-medium">Chargement des messages...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <MessageCircle className="h-12 md:h-16 w-12 md:w-16 text-neutral-300 mx-auto mb-3 md:mb-4" />
              <h3 className="text-sm md:text-lg font-medium text-neutral-500 mb-1.5 md:mb-2">
                {messages.length === 0 ? 'Aucun message reçu' : 'Aucun résultat'}
              </h3>
              <p className="text-[10px] md:text-sm text-neutral-400">
                {messages.length === 0 
                  ? 'Vos invités n\'ont pas encore envoyé de messages'
                  : 'Essayez de modifier vos critères de recherche'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 md:space-y-4">
              {Object.values(groupedMessages).slice(0, visibleCount).map((group, index) => {
                const head = group[0];
                return (
                  <div
                    key={head.inviteId}
                    className="bg-gradient-to-r from-neutral-50 to-amber-50/30 rounded-lg md:rounded-xl p-3 md:p-6 border border-neutral-200/50 hover:shadow-lg transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2.5 md:gap-4">
                      <div className="flex items-start space-x-2.5 md:space-x-4 flex-1">
                        <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base shadow-lg flex-shrink-0 ${
                          head.guestType === 'couple' 
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500' 
                            : 'bg-gradient-to-r from-amber-500 to-orange-500'
                        }`}>
                          {head.guestName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                            <h3 className="font-semibold text-slate-900 text-sm md:text-base md:text-lg truncate">{head.guestName}</h3>
                            <div className="flex gap-1">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] md:text-[10px] font-medium ${
                                head.confirmed 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {head.confirmed ? '✓' : '…'}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] md:text-xs md:text-sm text-slate-600 mb-2 md:mb-3">
                            <div className="flex items-center">
                              <User className="h-3 w-3 md:h-3.5 md:w-3.5 mr-0.5 md:mr-1" />
                              <span>Table: {head.table}</span>
                            </div>
                            {head.selectedDrink && (
                              <div className="flex items-center">
                                <Wine className="h-3 w-3 md:h-3.5 md:w-3.5 mr-0.5 md:mr-1 text-purple-600" />
                                <span className="font-medium text-purple-700">{head.selectedDrink}</span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2 md:space-y-3">
                            {group.map((m) => (
                              <div key={m.id} className="bg-white rounded-lg p-2.5 md:p-3 md:p-4 border border-neutral-200/50 shadow-sm">
                                <div className="flex items-center justify-between mb-1.5 md:mb-2">
                                  <div className="flex items-center">
                                    <MessageCircle className={`h-3 w-3 md:h-3.5 md:w-3.5 mr-1 md:mr-1.5 ${colors.text}`} />
                                    <span className="text-[9px] md:text-[10px] text-slate-500">
                                      {new Date(m.timestamp).toLocaleDateString('fr-FR', {
                                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-rose-600">
                                    <Heart className="h-3 w-3 md:h-3.5 md:w-3.5 mr-0.5 md:mr-1" />
                                    <span className="text-[10px] md:text-xs font-medium">{m.likes.length}</span>
                                  </div>
                                </div>
                                <p className="text-xs md:text-sm text-slate-800 leading-relaxed line-clamp-2 md:line-clamp-3 md:line-clamp-none">
                                  {m.message}
                                </p>
                                <button
                                  onClick={() => openMessageModal(m)}
                                  className={`mt-1.5 md:mt-2 text-[10px] md:text-xs ${colors.text} hover:underline font-bold block`}
                                >
                                  Répondre / Voir tout
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-3 md:p-4 md:p-6 border-t border-neutral-200/50 bg-gradient-to-r from-neutral-50 to-amber-50/30">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2.5 md:gap-4">
            <div className="text-[10px] md:text-xs md:text-sm text-slate-600 order-2 sm:order-1">
              {filteredMessages.length} résultat{filteredMessages.length > 1 ? 's' : ''} 
              {filteredMessages.length !== messages.length && ` sur ${messages.length}`}
            </div>
            
            <div className="flex w-full sm:w-auto space-x-1.5 md:space-x-2 md:space-x-3 order-1 sm:order-2">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setSortByDrink('all');
                  setSortByTable('all');
                }}
                className="flex-1 sm:flex-none px-2.5 md:px-3 md:px-4 py-1.5 md:py-2 border border-neutral-300 text-neutral-700 rounded-lg md:rounded-xl hover:bg-neutral-50 transition-all duration-200 text-[10px] md:text-xs md:text-sm font-bold"
              >
                Réinitialiser
              </button>
              <button
                onClick={() => setVisibleCount((c) => c + 20)}
                className="flex-1 sm:flex-none px-2.5 md:px-3 md:px-4 py-1.5 md:py-2 border border-amber-300 text-amber-700 rounded-lg md:rounded-xl hover:bg-amber-50 transition-all duration-200 text-[10px] md:text-xs md:text-sm font-bold"
              >
                Charger plus
              </button>
            </div>
        </div>
      </div>
      {showMessageModal && selectedGroup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeMessageModal}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-[90%]">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-3">
                <MessageCircle className={`h-6 w-6 ${colors.text}`} />
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">{selectedGroup[0]?.guestName || 'Invité'}</h4>
                  <div className="text-sm text-slate-600 flex gap-3">
                    <span>Table: {selectedGroup[0]?.table || 'Non assigné'}</span>
                    <span>{selectedGroup[0]?.confirmed ? 'Confirmé' : 'En attente'}</span>
                    <span>{selectedGroup[0]?.guestType === 'couple' ? 'Couple' : 'Simple'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={closeMessageModal}
                className="p-2 rounded-full hover:bg-neutral-100 transition"
                aria-label="Fermer"
              >
                <X className="h-5 w-5 text-slate-700" />
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
              {selectedGroup.map((m) => (
                <div key={m.id} className="border rounded-xl p-4 bg-neutral-50/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500">
                      {new Date(m.timestamp).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                    <div className="flex items-center text-rose-600">
                      <Heart className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">{m.likes.length}</span>
                    </div>
                  </div>
                  <p className="text-slate-800 leading-relaxed">{m.message}</p>
                </div>
              ))}
              
              {/* Zone de réponse de l'admin */}
              <div className="mt-6 pt-4 border-t border-neutral-100">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Répondre à l'invité</label>
                <div className="flex gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Écrivez votre réponse ici..."
                    className="flex-1 px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 resize-none h-20 text-sm"
                  />
                  <button
                    onClick={() => handleSendReply(selectedGroup[0])}
                    disabled={!replyText.trim() || isSendingReply}
                    className={`px-4 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                      !replyText.trim() || isSendingReply
                        ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                        : `bg-gradient-to-r ${colors.primary} text-white hover:shadow-xl transform hover:scale-105`
                    }`}
                  >
                    {isSendingReply ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={closeMessageModal}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-all duration-200 font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default GuestMessagesViewer;
