import React, { useState, useEffect, useMemo } from 'react';
import { MessageCircle, Search, FileText, X, Heart, Gift, GraduationCap, Send, Clock, Trash2 } from 'lucide-react';
import { useTemplates } from '../hooks/useTemplates';
import { useAuth } from './AuthContext';
import { InviteService } from '../services/templateService';
import jsPDF from 'jspdf';
import { notificationService } from '../services/notificationService';

interface MessageReply {
  id: string;
  content: string;
  authorName: string;
  authorInviteId?: string;
  createdAt: string;
}

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
  source: 'legacy_field' | 'legacy_collection' | 'new_collection';
  replyCount: number;
  replies: MessageReply[];
}

const GuestMessagesViewer = () => {
  const { userInvites, userModels } = useTemplates();
  const { user } = useAuth();
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<GuestMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<GuestMessage[] | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [isSendingReply, setIsSendingReply] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<{ message: GuestMessage; allFromGuest: boolean } | { reply: MessageReply; sourceMessage: GuestMessage } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 2500);
  };

  const fetchRepliesForMessage = async (
    userId: string,
    inviteId: string,
    messageId: string
  ): Promise<MessageReply[]> => {
    try {
      const [legacy, modern] = await Promise.all([
        InviteService.getLegacyMessageReplies(userId, inviteId, messageId).catch(() => [] as MessageReply[]),
        InviteService.getMessageReplies(userId, inviteId, messageId).catch(() => [] as MessageReply[])
      ]);
      const seen = new Set<string>();
      const combined: MessageReply[] = [];
      [...legacy, ...modern].forEach((r) => {
        if (!r || !r.id) return;
        if (seen.has(r.id)) return;
        seen.add(r.id);
        combined.push(r);
      });
      combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return combined;
    } catch (err) {
      console.error('Erreur chargement réponses:', err);
      return [];
    }
  };

  const loadRepliesForMessages = async (
    userId: string,
    msgs: GuestMessage[]
  ): Promise<GuestMessage[]> => {
    const repliesMap: Record<string, MessageReply[]> = {};
    await Promise.all(
      msgs.map(async (m) => {
        const r = await fetchRepliesForMessage(userId, m.inviteId, m.id);
        repliesMap[`${m.inviteId}:${m.id}`] = r;
      })
    );

    return msgs.map(m => {
      const key = `${m.inviteId}:${m.id}`;
      if (repliesMap[key]) {
        return { ...m, replies: repliesMap[key] };
      }
      return m;
    });
  };

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    const unsub = InviteService.subscribeAllGuestMessages(user.id, async (all) => {
      let guestMessages: GuestMessage[] = all.map((m) => {
        const inv = userInvites.find((i) => i.id === m.inviteId) || null;
        return {
          id: m.id,
          inviteId: m.inviteId,
          guestName: m.nom || 'Invité',
          table: inv?.table || 'Non assigné',
          message: m.message || '',
          selectedDrink: (inv as any)?.selectedDrink || '',
          confirmed: inv?.confirmed || false,
          guestType: inv?.etat || m.guestType || 'simple',
          timestamp: m.timestamp,
          likes: Array.isArray(m.likes) ? m.likes : [],
          source: m.source,
          replyCount: m.replyCount,
          replies: []
        };
      });
      guestMessages = guestMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const withReplies = await loadRepliesForMessages(user.id, guestMessages);
      setMessages(withReplies);
      setFilteredMessages(withReplies);
      setIsLoading(false);

      if (showMessageModal && selectedGroup) {
        const updatedGroup = withReplies.filter(m => m.inviteId === selectedGroup[0]?.inviteId);
        if (updatedGroup.length > 0) setSelectedGroup(updatedGroup);
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userInvites]);

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearchTerm(searchTerm), 150);
    return () => window.clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    if (!debouncedSearchTerm) {
      setFilteredMessages(messages);
      return;
    }
    const searchLower = String(debouncedSearchTerm).toLowerCase();
    const filtered = messages.filter(msg => 
      String(msg.guestName || '').toLowerCase().includes(searchLower) ||
      (msg.message && String(msg.message).toLowerCase().includes(searchLower)) ||
      msg.replies.some(r => String(r.content || '').toLowerCase().includes(searchLower))
    );
    setFilteredMessages(filtered);
  }, [messages, debouncedSearchTerm]);

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
            accent: '#ec4899',
            secondary: '#a855f7',
            accentBg: 'rgba(236,72,153,0.15)',
            accentBorder: 'rgba(236,72,153,0.35)',
            accentGlow: 'rgba(236,72,153,0.35)',
          };
        case 'birthday':
          return {
            accent: '#a855f7',
            secondary: '#6366f1',
            accentBg: 'rgba(168,85,247,0.15)',
            accentBorder: 'rgba(168,85,247,0.35)',
            accentGlow: 'rgba(168,85,247,0.35)',
          };
        case 'graduation':
          return {
            accent: '#10b981',
            secondary: '#14b8a6',
            accentBg: 'rgba(16,185,129,0.15)',
            accentBorder: 'rgba(16,185,129,0.35)',
            accentGlow: 'rgba(16,185,129,0.35)',
          };
        default:
          return {
            accent: '#fbbf24',
            secondary: '#f59e0b',
            accentBg: 'rgba(251,191,36,0.15)',
            accentBorder: 'rgba(251,191,36,0.35)',
            accentGlow: 'rgba(251,191,36,0.35)',
          };
      }
    }
    return {
      accent: '#fbbf24',
      secondary: '#f59e0b',
      accentBg: 'rgba(251,191,36,0.15)',
      accentBorder: 'rgba(251,191,36,0.35)',
      accentGlow: 'rgba(251,191,36,0.35)',
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
      await InviteService.replyToLegacyGuestMessage(
        user.id,
        message.inviteId,
        message.id,
        user.id,
        replyText
      );
      
      await notificationService.sendNotification({
        type: 'message',
        recipientId: message.inviteId,
        senderName: 'Organisateur',
        title: 'Réponse à votre message',
        body: `L'organisateur a répondu à votre message : "${replyText.substring(0, 50)}..."`,
        relatedId: message.id
      });

      showToast('success', 'Réponse envoyée');
      setReplyText('');

      const freshReplies = await fetchRepliesForMessage(
        user.id,
        message.inviteId,
        message.id
      );

      const updater = (list: GuestMessage[]) => list.map(m => {
        if (m.inviteId === message.inviteId && m.id === message.id) {
          return { ...m, replies: freshReplies, replyCount: freshReplies.length };
        }
        return m;
      });

      setMessages(prev => updater(prev));
      setFilteredMessages(prev => updater(prev));
      if (selectedGroup) {
        setSelectedGroup(prev => prev ? prev.map(m => {
          if (m.inviteId === message.inviteId && m.id === message.id) {
            return { ...m, replies: freshReplies, replyCount: freshReplies.length };
          }
          return m;
        }) : null);
      }
    } catch (error) {
      console.error('Erreur réponse:', error);
      showToast('error', 'Erreur lors de l\'envoi');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleDeleteMessage = async () => {
    if (!deleteTarget || !user) return;
    setIsDeleting(true);
    try {
      if ('reply' in deleteTarget) {
        const { reply, sourceMessage } = deleteTarget;
        await Promise.all([
          InviteService.deleteLegacyMessageReply(user.id, sourceMessage.inviteId, sourceMessage.id, reply.id).catch(() => {}),
          InviteService.deleteMessageReply(user.id, sourceMessage.inviteId, sourceMessage.id, reply.id).catch(() => {})
        ]);
        const refreshReplies = await fetchRepliesForMessage(user.id, sourceMessage.inviteId, sourceMessage.id);
        const updater = (list: GuestMessage[]) => list.map(m => {
          if (m.inviteId === sourceMessage.inviteId && m.id === sourceMessage.id) {
            return { ...m, replies: refreshReplies, replyCount: refreshReplies.length };
          }
          return m;
        });
        setMessages(prev => updater(prev));
        setFilteredMessages(prev => updater(prev));
        if (selectedGroup) {
          setSelectedGroup(prev => prev ? updater(prev) : null);
        }
        showToast('success', 'Réponse supprimée');
      } else {
        const msgsToDelete: GuestMessage[] = deleteTarget.allFromGuest
          ? messages.filter(m => m.inviteId === deleteTarget.message.inviteId)
          : [deleteTarget.message];

        await Promise.all(
          msgsToDelete.map(m =>
            m.source === 'new_collection'
              ? InviteService.deleteGuestMessage(user.id, m.inviteId, m.id)
              : m.source === 'legacy_collection'
                ? InviteService.deleteLegacyGuestMessage(user.id, m.inviteId, m.id)
                : Promise.resolve()
          )
        );

        showToast('success', deleteTarget.allFromGuest ? 'Tous les messages de l\'invité ont été supprimés' : 'Message supprimé');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      showToast('error', 'Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const exportMessagesToPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 18;
    const fontSize = 11;
    const lineHeight = 7;
    const adminTitle = userModels.length > 0 && userModels[0].title ? userModels[0].title : 'Organisateur';
    let y = margin;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text('Messages des Invités', pageWidth / 2, y, { align: 'center' });
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, y, { align: 'center' });
    y += 12;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    const uniqueGroups: Record<string, GuestMessage[]> = {};
    filteredMessages.forEach(m => {
      if (!uniqueGroups[m.inviteId]) uniqueGroups[m.inviteId] = [];
      uniqueGroups[m.inviteId].push(m);
    });

    Object.values(uniqueGroups).forEach((group, groupIdx) => {
      const head = group[0];
      
      if (y > pageHeight - margin - 40) {
        doc.addPage();
        y = margin;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fontSize + 1);
      doc.setTextColor(15, 23, 42);
      doc.text(head.guestName || 'Invité', margin, y);
      y += lineHeight + 1;

      group.forEach((m) => {
        const dateStr = m.timestamp ? new Date(m.timestamp).toLocaleDateString('fr-FR', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : '';

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text(dateStr, margin + 2, y);
        y += lineHeight - 1;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(51, 65, 85);

        const msgText = (m.message || '').trim() || '(Pas de message)';
        const splitText = doc.splitTextToSize(msgText, pageWidth - margin * 2 - 4);
        
        splitText.forEach((line: string) => {
          if (y > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin + 2, y);
          y += lineHeight;
        });

        m.replies.forEach((r) => {
          y += 2;
          if (y > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
          const rDate = r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          }) : '';
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          const isAdmin = r.authorInviteId === user?.id;
          const authorName = isAdmin ? adminTitle : (r.authorName || 'Invité');
          const hex = colors.accent.replace('#', '');
          const rC = parseInt(hex.substring(0, 2), 16);
          const gC = parseInt(hex.substring(2, 4), 16);
          const bC = parseInt(hex.substring(4, 6), 16);
          const replyColor = [rC, gC, bC];
          doc.setTextColor(replyColor[0], replyColor[1], replyColor[2]);
          doc.text(`↳ ${authorName} - ${rDate}`, margin + 6, y);
          y += lineHeight - 1;
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(fontSize - 1);
          doc.setTextColor(71, 85, 105);
          const replySplit = doc.splitTextToSize(r.content || '', pageWidth - margin * 2 - 10);
          replySplit.forEach((line: string) => {
            if (y > pageHeight - margin) {
              doc.addPage();
              y = margin;
            }
            doc.text(line, margin + 8, y);
            y += lineHeight;
          });
        });

        y += 2;
      });

      if (groupIdx < Object.values(uniqueGroups).length - 1) {
        y += 2;
        if (y < pageHeight - margin) {
          doc.setDrawColor(241, 245, 249);
          doc.setLineDashPattern([1, 2], 0);
          doc.line(margin, y, pageWidth - margin, y);
          doc.setLineDashPattern([], 0);
          y += 5;
        }
      }
    });

    doc.save('messages-invites.pdf');
  };

  const EventIcon = getEventIcon();
  const colors = getEventColors();

  const groupedMessages: Record<string, GuestMessage[]> = useMemo(() => {
    return filteredMessages.reduce((acc, msg) => {
      const key = msg.inviteId;
      acc[key] = acc[key] ? [...acc[key], msg] : [msg];
      return acc;
    }, {} as Record<string, GuestMessage[]>);
  }, [filteredMessages]);

  const renderReplies = (replies: MessageReply[], isModal = false, sourceMessage?: GuestMessage) => {
    if (!replies || replies.length === 0) return null;
    const adminTitle = userModels.length > 0 && userModels[0].title ? userModels[0].title : 'Organisateur';
    return (
      <div className="mt-2.5 space-y-2">
        {replies.map((r) => {
          const isAdmin = r.authorInviteId === user?.id;
          const displayName = isAdmin ? adminTitle : r.authorName;
          return (
            <div
              key={r.id}
              className="relative ml-6 pl-3 py-1.5"
              style={{ borderLeft: `3px solid ${colors.accentBorder}` }}
            >
              <div className="flex items-center justify-between mb-1 gap-2">
                <span className={`inline-flex items-center gap-1 text-[10px] ${isModal ? 'md:text-xs' : ''} font-bold`} style={{ color: colors.accent }}>
                  <MessageCircle className="h-3 w-3" />
                  {displayName}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {new Date(r.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                  {isAdmin && sourceMessage && (
                    <button
                      onClick={() => setDeleteTarget({ reply: r, sourceMessage })}
                      className="p-1 rounded-md transition-all"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#fda4af'; e.currentTarget.style.background = 'rgba(244,63,94,0.15)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'transparent'; }}
                      title="Supprimer cette réponse"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
              <p className={`${isModal ? 'text-sm md:text-base' : 'text-xs md:text-sm'} leading-relaxed whitespace-pre-wrap`} style={{ color: 'rgba(255,255,255,0.7)', opacity: 0.95 }}>
                {r.content}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
    <div
      className="relative rounded-2xl overflow-hidden border w-full animate-fade-in"
      style={{
        background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
        borderColor: 'rgba(255,255,255,0.08)',
        boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(251,191,36,0.03) inset',
      }}
    >
      <div
        aria-hidden
        className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[92%] h-[40%] pointer-events-none blur-3xl opacity-50"
        style={{ background: `radial-gradient(ellipse at center, ${colors.accentGlow.replace('0.35', '0.2')} 0%, ${colors.accentGlow.replace('0.35', '0.04')} 38%, transparent 70%)` }}
      />
      {/* ===== Header ===== */}
      <div
        className="relative z-10 px-5 py-4 md:px-7 md:py-5 border-b"
        style={{
          borderColor: 'rgba(255,255,255,0.06)',
          background: `linear-gradient(180deg, ${colors.accentBg.replace('0.15', '0.10')} 0%, rgba(255,255,255,0.01) 100%)`,
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div
              className="p-2.5 md:p-3 rounded-xl"
              style={{
                background: `linear-gradient(180deg, ${colors.accent}30 0%, ${colors.accent}15 100%)`,
                border: `1px solid ${colors.accentBorder}`,
                boxShadow: `0 0 24px -6px ${colors.accentGlow}`,
              }}
            >
              <EventIcon className="h-5 w-5 md:h-6 md:w-6" style={{ color: colors.accent }} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-white">
                Messages
              </h2>
              <p className="text-xs md:text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Les vœux de vos invités
              </p>
            </div>
          </div>
          <button
            onClick={exportMessagesToPDF}
            disabled={filteredMessages.length === 0}
            className="flex items-center gap-2 transition-all duration-200 font-semibold text-xs md:text-sm whitespace-nowrap px-4 py-2 md:px-5 md:py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
              color: '#0b0f17',
              boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px rgba(251,191,36,0.5), 0 12px 30px -10px rgba(251,191,36,0.6)',
            }}
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Exporter</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </div>

      {/* ===== Barre de recherche ===== */}
      <div
        className="relative z-10 px-4 py-3 md:px-7 md:py-4 border-b"
        style={{
          borderColor: 'rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <div className="relative max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 pointer-events-none" style={{ color: 'rgba(255,255,255,0.4)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un invité ou un message..."
            className="w-full pl-10 pr-4 py-2.5 md:py-3 rounded-xl transition-all duration-200 text-xs md:text-sm outline-none"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#ffffff',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
      </div>

      {/* ===== Corps de liste ===== */}
      <div className="relative z-10 px-3 py-3 md:px-6 md:py-5 overflow-y-auto max-h-[65vh]">
        {isLoading ? (
          <div className="text-center py-14 md:py-20">
            <div className="flex items-center justify-center gap-1.5 mb-4">
              <div className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: '#fcd34d', animationDelay: '0ms' }}></div>
              <div className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: '#fbbf24', animationDelay: '120ms' }}></div>
              <div className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: '#f59e0b', animationDelay: '240ms' }}></div>
            </div>
            <p className="text-xs md:text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Chargement...</p>
          </div>
        ) : Object.keys(groupedMessages).length === 0 ? (
          <div
            className="text-center py-14 md:py-20"
            style={{ background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.06) 0%, transparent 70%)' }}
          >
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <MessageCircle className="h-8 w-8 md:h-10 md:w-10" style={{ color: 'rgba(255,255,255,0.3)' }} />
            </div>
            <h3 className="text-sm md:text-base font-bold text-white/80 mb-1.5">
              {messages.length === 0 ? 'Aucun message pour le moment' : 'Aucun résultat'}
            </h3>
            <p className="text-xs md:text-sm max-w-sm mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {messages.length === 0
                ? 'Vos invités n\'ont pas encore envoyé de messages. Revenez plus tard !'
                : 'Essayez avec d\'autres mots-clés.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {Object.values(groupedMessages).map((group, gIdx) => {
              const head = group[0];
              const initials = head.guestName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
              return (
                <div
                  key={head.inviteId}
                  className="relative rounded-xl overflow-hidden border transition-all duration-300 animate-slide-up"
                  style={{
                    animationDelay: `${gIdx * 0.05}s`,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
                    borderColor: 'rgba(255,255,255,0.06)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.05)'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.22)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                >
                  <div className="flex items-start gap-3 md:gap-4 p-4 md:p-5">
                    <div
                      className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm md:text-base shadow-sm flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.secondary} 100%)`,
                        boxShadow: `0 8px 22px -6px ${colors.accentGlow}`,
                      }}
                    >
                      {initials || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-bold text-white text-sm md:text-base truncate">
                          {head.guestName}
                        </h3>
                        <div className="inline-flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget({ message: group[0], allFromGuest: true });
                            }}
                            className="p-1.5 rounded-lg transition-all hover:scale-110"
                            style={{ background: 'rgba(244,63,94,0.12)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.3)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.22)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.12)'; }}
                            title="Supprimer tous les messages de cet invité"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <span className="inline-flex items-center gap-1 text-[10px] md:text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            <Clock className="h-3 w-3 md:h-4 md:w-4" />
                            {new Date(head.timestamp).toLocaleDateString('fr-FR', {
                              day: 'numeric', month: 'short'
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2.5 md:space-y-3 mt-3">
                        {group.map((m) => (
                          <div
                            key={m.id}
                            className="rounded-lg p-3 md:p-3.5 border"
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              borderColor: 'rgba(255,255,255,0.06)',
                            }}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] md:text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                {new Date(m.timestamp).toLocaleDateString('fr-FR', {
                                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </span>
                              <div className="flex items-center gap-2">
                                {m.likes.length > 0 && (
                                  <div className="flex items-center gap-1" style={{ color: '#fb7185' }}>
                                    <Heart className="h-3 w-3 fill-current" />
                                    <span className="text-[10px] md:text-xs font-semibold">{m.likes.length}</span>
                                  </div>
                                )}
                                <button
                                  onClick={() => setDeleteTarget({ message: m, allFromGuest: false })}
                                  className="p-1 rounded-md transition-all hover:scale-110"
                                  style={{ background: 'rgba(244,63,94,0.12)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.25)' }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.22)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.12)'; }}
                                  title="Supprimer ce message"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.82)' }}>
                              {m.message || <span className="italic" style={{ color: 'rgba(255,255,255,0.35)' }}>Pas de message</span>}
                            </p>
                            {renderReplies(m.replies, false, m)}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => openMessageModal(group[0])}
                        className="mt-3 text-xs md:text-sm font-bold transition-colors inline-flex items-center gap-1 hover:underline"
                        style={{ color: colors.accent }}
                      >
                        Répondre
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== Footer compteur ===== */}
      <div
        className="relative z-10 px-4 py-3 md:px-7 md:py-4 border-t flex items-center justify-between"
        style={{
          borderColor: 'rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <div className="text-[11px] md:text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {Object.keys(groupedMessages).length} invité{Object.keys(groupedMessages).length > 1 ? 's' : ''}
          {filteredMessages.length !== messages.length && ` · ${filteredMessages.length} message${filteredMessages.length > 1 ? 's' : ''}`}
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-[11px] md:text-xs font-bold transition-all px-3 py-1.5 rounded-lg"
            style={{
              color: 'rgba(255,255,255,0.7)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fcd34d'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.35)'; e.currentTarget.style.background = 'rgba(251,191,36,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          >
            Effacer
          </button>
        )}
      </div>
    </div>

      {showMessageModal && selectedGroup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
             style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}>
          <div
            className="relative max-w-2xl w-full max-h-[90vh] flex flex-col rounded-2xl overflow-hidden border animate-slide-up"
            style={{
              background: 'linear-gradient(180deg, #111727 0%, #0b0f17 100%)',
              borderColor: 'rgba(255,255,255,0.08)',
              boxShadow: '0 50px 120px -30px rgba(0,0,0,0.85), 0 0 0 1px rgba(251,191,36,0.06) inset',
            }}
          >
            <div
              aria-hidden
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-[80%] h-40 rounded-full blur-3xl pointer-events-none"
              style={{ background: `radial-gradient(circle, ${colors.accentGlow.replace('0.35', '0.22')} 0%, transparent 70%)` }}
            />
            <div
              className="flex items-center justify-between p-5 border-b flex-shrink-0 relative z-10"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.secondary} 100%)`,
                    boxShadow: `0 8px 22px -6px ${colors.accentGlow}`,
                  }}
                >
                  {selectedGroup[0]?.guestName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <h4 className="text-base md:text-lg font-extrabold tracking-tight text-white truncate">{selectedGroup[0]?.guestName || 'Invité'}</h4>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {new Date(selectedGroup[0]?.timestamp).toLocaleDateString('fr-FR', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={closeMessageModal}
                className="p-2 rounded-xl transition-all duration-200 hover:scale-110 flex-shrink-0"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.55)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.15)'; e.currentTarget.style.color = '#fda4af'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.35)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 flex-1 relative z-10">
              {selectedGroup.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl p-4 border"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderColor: 'rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {new Date(m.timestamp).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      {m.likes.length > 0 && (
                        <div className="flex items-center gap-1.5" style={{ color: '#fb7185' }}>
                          <Heart className="h-4 w-4 fill-current" />
                          <span className="text-xs font-semibold">{m.likes.length}</span>
                        </div>
                      )}
                      <button
                        onClick={() => setDeleteTarget({ message: m, allFromGuest: false })}
                        className="p-1.5 rounded-lg transition-all hover:scale-110"
                        style={{ background: 'rgba(244,63,94,0.12)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.3)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.22)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.12)'; }}
                        title="Supprimer ce message"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.88)' }}>
                    {m.message}
                  </p>
                  {renderReplies(m.replies, true, m)}
                </div>
              ))}
              
              <div
                className="pt-4 mt-2 border-t"
                style={{
                  borderColor: 'rgba(255,255,255,0.06)',
                  background: `linear-gradient(180deg, ${colors.accentBg.replace('0.15', '0.04')} 0%, transparent 100%)`,
                  margin: '0 -20px -20px -20px',
                  padding: '20px',
                }}
              >
                <label className="block text-xs md:text-sm font-black uppercase tracking-wider mb-2.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Répondre</label>
                <div className="flex gap-2.5">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Écrivez votre réponse..."
                    className="flex-1 px-4 py-3 rounded-xl transition-all duration-200 resize-none h-24 text-sm outline-none placeholder:text-white/25"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#ffffff',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  <button
                    onClick={() => handleSendReply(selectedGroup[0])}
                    disabled={!replyText.trim() || isSendingReply}
                    className="px-4 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transform hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: !replyText.trim() || isSendingReply
                        ? 'rgba(255,255,255,0.06)'
                        : `linear-gradient(135deg, ${colors.accent} 0%, ${colors.secondary} 100%)`,
                      color: !replyText.trim() || isSendingReply
                        ? 'rgba(255,255,255,0.4)'
                        : '#ffffff',
                      boxShadow: !replyText.trim() || isSendingReply
                        ? 'none'
                        : `0 1px 0 rgba(255,255,255,0.2) inset, 0 0 0 1px ${colors.accentBorder}, 0 12px 28px -10px ${colors.accentGlow}`,
                    }}
                  >
                    {isSendingReply ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div
              className="p-4 border-t flex justify-end flex-shrink-0 relative z-10"
              style={{
                borderColor: 'rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <button
                onClick={closeMessageModal}
                className="px-4 py-2 rounded-xl transition-all duration-200 font-bold text-sm transform hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.8)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl text-sm font-bold animate-slide-up border"
          style={{
            background: toast.type === 'success'
              ? 'linear-gradient(180deg, rgba(34,197,94,0.98) 0%, rgba(22,163,74,0.98) 100%)'
              : toast.type === 'error'
                ? 'linear-gradient(180deg, rgba(239,68,68,0.98) 0%, rgba(220,38,38,0.98) 100%)'
                : 'linear-gradient(180deg, rgba(251,191,36,0.98) 0%, rgba(245,158,11,0.98) 100%)',
            color: toast.type === 'info' ? '#0b0f17' : '#ffffff',
            borderColor: toast.type === 'success'
              ? 'rgba(74,222,128,0.5)'
              : toast.type === 'error'
                ? 'rgba(248,113,113,0.5)'
                : 'rgba(252,211,77,0.6)',
            boxShadow: toast.type === 'success'
              ? '0 20px 50px -10px rgba(22,163,74,0.6)'
              : toast.type === 'error'
                ? '0 20px 50px -10px rgba(220,38,38,0.6)'
                : '0 20px 50px -10px rgba(245,158,11,0.6)',
          }}
        >
          {toast.message}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div
            className="relative max-w-md w-full animate-slide-up overflow-hidden rounded-2xl border"
            style={{
              background: 'linear-gradient(180deg, #131a2b 0%, #0b0f17 100%)',
              borderColor: 'rgba(248,113,113,0.25)',
              boxShadow: '0 50px 120px -30px rgba(220,38,38,0.45), 0 0 0 1px rgba(255,255,255,0.04) inset',
            }}
          >
            <div
              aria-hidden
              className="absolute -top-10 -right-10 w-56 h-56 rounded-full blur-3xl pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.35) 0%, transparent 70%)' }}
            />
            <div
              className="p-6 border-b relative z-10"
              style={{
                borderColor: 'rgba(255,255,255,0.06)',
                background: 'linear-gradient(180deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.03) 100%)',
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(180deg, rgba(239,68,68,0.35) 0%, rgba(239,68,68,0.18) 100%)',
                    border: '1px solid rgba(248,113,113,0.45)',
                    boxShadow: '0 10px 24px -10px rgba(220,38,38,0.7)',
                  }}
                >
                  <Trash2 className="h-5 w-5" style={{ color: '#fca5a5' }} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight text-white">
                    {'reply' in deleteTarget
                      ? 'Supprimer la réponse'
                      : deleteTarget.allFromGuest
                        ? 'Supprimer tous les messages'
                        : 'Supprimer le message'}
                  </h3>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Action irréversible</p>
                </div>
              </div>
            </div>
            <div className="p-6 relative z-10">
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {'reply' in deleteTarget ? (
                  <>
                    Êtes-vous sûr de vouloir supprimer <span className="font-extrabold" style={{ color: '#f87171' }}>cette réponse</span> ?
                    Cette action est définitive.
                  </>
                ) : deleteTarget.allFromGuest ? (
                  <>
                    Êtes-vous sûr de vouloir supprimer <span className="font-extrabold" style={{ color: '#f87171' }}>tous les messages</span> de{' '}
                    <span className="font-bold text-white">{deleteTarget.message.guestName}</span> ?
                    Cette action est définitive.
                  </>
                ) : (
                  <>
                    Êtes-vous sûr de vouloir supprimer ce message de{' '}
                    <span className="font-bold text-white">{deleteTarget.message.guestName}</span> ?
                    Cette action est définitive.
                  </>
                )}
              </p>
              {('reply' in deleteTarget ? deleteTarget.reply.content : deleteTarget.message.message) && (
                <div
                  className="rounded-xl p-3 mb-4 border"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderColor: 'rgba(255,255,255,0.06)',
                  }}
                >
                  <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Contenu :</p>
                  <p className="text-sm italic line-clamp-3 whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    "{'reply' in deleteTarget ? deleteTarget.reply.content : deleteTarget.message.message}"
                  </p>
                </div>
              )}
              <div className="flex gap-2.5 justify-end">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="px-4 py-2.5 rounded-xl transition-all duration-200 font-bold text-sm disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    color: 'rgba(255,255,255,0.8)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteMessage}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-xl transition-all duration-200 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-2"
                  style={{
                    background: isDeleting
                      ? 'linear-gradient(180deg, rgba(220,38,38,0.6) 0%, rgba(185,28,28,0.6) 100%)'
                      : 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
                    color: '#ffffff',
                    border: '1px solid rgba(248,113,113,0.5)',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 16px 32px -12px rgba(220,38,38,0.7)',
                  }}
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {'reply' in deleteTarget
                    ? 'Supprimer la réponse'
                    : deleteTarget.allFromGuest
                      ? 'Tout supprimer'
                      : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GuestMessagesViewer;
