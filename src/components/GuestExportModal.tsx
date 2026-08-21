import React, { useState, useMemo } from 'react';
import { X, Download, FileText, FileSpreadsheet, Users, Table, Tag } from 'lucide-react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

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
  name: string;
  seats: number;
  assignedGuests: any[];
}

interface GuestCategory {
  id: string;
  name: string;
}

interface GuestExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  guests: Guest[];
  tables: Table[];
  categories?: GuestCategory[];
}

const GuestExportModal = ({ isOpen, onClose, guests, tables, categories = [] }: GuestExportModalProps) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel'>('pdf');
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pdfDensity, setPdfDensity] = useState<'normal' | 'compact'>('normal');
  const [pdfFontSize, setPdfFontSize] = useState<number>(9);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);

  // Extraire toutes les catégories uniques présentes dans la liste des invités
  const availableCategories = useMemo(() => {
    const guestCats = guests
      .map(g => g.category)
      .filter((cat): cat is string => !!cat && cat.trim() !== '');
    
    const uniqueGuestCats = Array.from(new Set(guestCats));
    
    // Fusionner avec les catégories passées en props pour être complet
    const combined = [...categories.map(c => c.name)];
    uniqueGuestCats.forEach(cat => {
      if (!combined.includes(cat)) {
        combined.push(cat);
      }
    });
    
    return combined.sort();
  }, [guests, categories]);

  if (!isOpen) return null;

  // Filtrer les invités par catégorie si nécessaire
  const getFilteredGuests = () => {
    if (selectedCategory === 'all') return guests;
    return guests.filter(g => g.category === selectedCategory);
  };

  // Fonction pour obtenir toutes les tables avec invités
  const getTablesWithGuests = () => {
    const currentGuests = getFilteredGuests();
    const tablesWithGuests = [];
    const processedGuestIds = new Set();
    
    // Ajouter les tables définies
    tables.forEach(table => {
      const tableGuests = currentGuests.filter(guest => guest.table === table.name);
      if (tableGuests.length > 0) {
        tablesWithGuests.push({
          name: table.name,
          guests: tableGuests,
          seats: table.seats
        });
        tableGuests.forEach(g => processedGuestIds.add(g.id));
      }
    });

    // Ajouter les invités dont la table n'existe pas ou n'est pas assignée
    const remainingGuests = currentGuests.filter(guest => !processedGuestIds.has(guest.id));
    
    if (remainingGuests.length > 0) {
      // Grouper par table pour les tables "inconnues"
      const unknownTables: Record<string, any[]> = {};
      remainingGuests.forEach(guest => {
        const tableName = (!guest.table || guest.table === '' || guest.table === 'Non assigné') 
          ? 'Non assignés' 
          : guest.table;
        
        if (!unknownTables[tableName]) {
          unknownTables[tableName] = [];
        }
        unknownTables[tableName].push(guest);
      });

      // Ajouter ces tables à la liste
      Object.keys(unknownTables).forEach(tableName => {
        tablesWithGuests.push({
          name: tableName,
          guests: unknownTables[tableName],
          seats: 0
        });
      });
    }

    return tablesWithGuests;
  };

  // Export PDF
  const exportToPDF = () => {
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
    doc.text('Liste des invités par table', pageWidth / 2, y, { align: 'center' });
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(base);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, y, { align: 'center' });
    y += 10;

    const tablesWithGuests = getTablesWithGuests();
    const tablesToExport = selectedTable === 'all' ? tablesWithGuests : tablesWithGuests.filter(t => t.name === selectedTable);
    
    const nameW = pdfOrientation === 'landscape' ? 70 : 60;
    const catW = pdfOrientation === 'landscape' ? 50 : 40;
    const typeW = pdfOrientation === 'landscape' ? 25 : 25;
    const placesW = pdfOrientation === 'landscape' ? 20 : 20;
    const statusW = pageWidth - margin * 2 - (nameW + catW + typeW + placesW);
    const colX = [
      margin, 
      margin + nameW, 
      margin + nameW + catW, 
      margin + nameW + catW + typeW, 
      margin + nameW + catW + typeW + placesW
    ];

    tablesToExport.forEach((table) => {
      if (y > pageHeight - margin - (headerHeight + rowHeight)) {
        doc.addPage();
        y = margin;
      }

      const occupiedSeats = table.guests.reduce((total, g) => total + (g.etat === 'couple' ? 2 : 1), 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(base + (pdfDensity === 'compact' ? 2 : 3));
      doc.setTextColor(33, 37, 41);
      doc.text(table.name, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(base);
      doc.setTextColor(90, 90, 90);
      doc.text(`${table.guests.length} invité(s) • ${occupiedSeats} place(s) occupée(s)${table.seats > 0 ? ` / ${table.seats}` : ''}`, margin, y + 5);
      y += 10;

      doc.setDrawColor(245, 158, 11);
      doc.setFillColor(255, 247, 236);
      doc.rect(margin, y, pageWidth - margin * 2, headerHeight, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(base);
      doc.setTextColor(120, 72, 0);
      doc.text('Nom', colX[0] + 2, y + Math.min(headerHeight - 2, 8));
      doc.text('Catégorie', colX[1] + 2, y + Math.min(headerHeight - 2, 8));
      doc.text('Type', colX[2] + 2, y + Math.min(headerHeight - 2, 8));
      doc.text('Places', colX[3] + 2, y + Math.min(headerHeight - 2, 8));
      doc.text('Statut', colX[4] + 2, y + Math.min(headerHeight - 2, 8));
      y += headerHeight;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(base);
      doc.setTextColor(33, 37, 41);

      table.guests.forEach((g, idx) => {
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
          doc.text('Catégorie', colX[1] + 2, y + Math.min(headerHeight - 2, 8));
          doc.text('Type', colX[2] + 2, y + Math.min(headerHeight - 2, 8));
          doc.text('Places', colX[3] + 2, y + Math.min(headerHeight - 2, 8));
          doc.text('Statut', colX[4] + 2, y + Math.min(headerHeight - 2, 8));
          y += headerHeight;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(base);
          doc.setTextColor(33, 37, 41);
        }

        if (idx % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, y - 0.5, pageWidth - margin * 2, rowHeight, 'F');
        }

        doc.text(g.nom, colX[0] + 2, y + (rowHeight - 1));
        doc.text(g.category || '—', colX[1] + 2, y + Math.min(rowHeight - 2, 5));
        doc.text(g.etat === 'couple' ? 'Couple' : 'Simple', colX[2] + 2, y + Math.min(rowHeight - 2, 5));
        doc.text(g.etat === 'couple' ? '2' : '1', colX[3] + 2, y + Math.min(rowHeight - 2, 5));
        doc.text(g.confirmed ? 'Confirmé' : 'En attente', colX[4] + 2, y + Math.min(rowHeight - 2, 5));

        y += rowHeight;
      });

      y += 6;
    });

    if (selectedTable === 'all') {
      if (y > pageHeight - margin - 24) {
        doc.addPage();
        y = margin;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(base + (pdfDensity === 'compact' ? 1 : 2));
      doc.setTextColor(33, 37, 41);
      doc.text('Résumé global', margin, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(base);
      doc.setTextColor(90, 90, 90);
      const totalGuests = guests.length;
      const confirmedGuests = guests.filter(g => g.confirmed).length;
      const totalSeats = guests.reduce((t, g) => t + (g.etat === 'couple' ? 2 : 1), 0);
      doc.text(`Invités: ${totalGuests}`, margin, y);
      doc.text(`Confirmés: ${confirmedGuests}`, margin + 45, y);
      doc.text(`Places occupées: ${totalSeats}`, margin + 90, y);
    }

    let fileName = 'liste-invites';
    if (selectedCategory !== 'all') {
      fileName += `-${selectedCategory.toLowerCase().replace(/\s+/g, '-')}`;
    }
    if (selectedTable !== 'all') {
      fileName += `-${selectedTable.toLowerCase().replace(/\s+/g, '-')}`;
    } else {
      fileName += '-toutes-tables';
    }
    fileName += '.pdf';
    doc.save(fileName);
  };

  // Export Excel
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    const tablesWithGuests = getTablesWithGuests();
    const tablesToExport = selectedTable === 'all' 
      ? tablesWithGuests 
      : tablesWithGuests.filter(table => table.name === selectedTable);

    if (selectedTable === 'all') {
      // Créer une feuille par table
      tablesToExport.forEach(table => {
        const worksheetData = [
          [`Table: ${table.name}`],
          [`Invités: ${table.guests.length} - Places occupées: ${table.guests.reduce((total, guest) => total + (guest.etat === 'couple' ? 2 : 1), 0)}${table.seats > 0 ? ` / ${table.seats}` : ''}`],
          [], // Ligne vide
          ['Nom', 'Catégorie', 'Type d\'invité', 'Places', 'Statut de confirmation'],
          ...table.guests.map(guest => [
            guest.nom,
            guest.category || '—',
            guest.etat === 'couple' ? 'Couple' : 'Simple',
            guest.etat === 'couple' ? 2 : 1,
            guest.confirmed ? 'Confirmé' : 'En attente'
          ])
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        
        // Ajuster la largeur des colonnes
        worksheet['!cols'] = [
          { width: 30 }, // Nom
          { width: 20 }, // Catégorie
          { width: 15 }, // Type
          { width: 10 }, // Places
          { width: 15 }  // Statut
        ];

        const sheetName = table.name.length > 31 ? table.name.substring(0, 31) : table.name;
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });

      // Ajouter une feuille de résumé
      const summaryData = [
        ['Résumé Global'],
        [],
        ['Statistiques Générales'],
        ['Total invités', guests.length],
        ['Invités confirmés', guests.filter(g => g.confirmed).length],
        ['Invités en attente', guests.filter(g => !g.confirmed).length],
        ['Total places occupées', guests.reduce((total, guest) => total + (guest.etat === 'couple' ? 2 : 1), 0)],
        [],
        ['Répartition par Table'],
        ['Nom de la table', 'Nombre d\'invités', 'Places occupées', 'Places disponibles'],
        ...tablesWithGuests.map(table => [
          table.name,
          table.guests.length,
          table.guests.reduce((total, guest) => total + (guest.etat === 'couple' ? 2 : 1), 0),
          table.seats > 0 ? table.seats - table.guests.reduce((total, guest) => total + (guest.etat === 'couple' ? 2 : 1), 0) : 'N/A'
        ])
      ];

      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
      summaryWorksheet['!cols'] = [
        { width: 25 },
        { width: 15 },
        { width: 15 },
        { width: 15 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Résumé');
    } else {
      // Une seule feuille pour la table sélectionnée
      const table = tablesToExport[0];
      const worksheetData = [
        [`Liste des Invités - ${table.name}`],
        [`Généré le ${new Date().toLocaleDateString('fr-FR')}`],
        [],
        [`Informations de la table:`],
        [`Nombre d'invités: ${table.guests.length}`],
        [`Places occupées: ${table.guests.reduce((total, guest) => total + (guest.etat === 'couple' ? 2 : 1), 0)}${table.seats > 0 ? ` / ${table.seats}` : ''}`],
        [],
        ['Nom', 'Catégorie', 'Type d\'invité', 'Places', 'Statut de confirmation'],
        ...table.guests.map(guest => [
          guest.nom,
          guest.category || '—',
          guest.etat === 'couple' ? 'Couple' : 'Simple',
          guest.etat === 'couple' ? 2 : 1,
          guest.confirmed ? 'Confirmé' : 'En attente'
        ])
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      worksheet['!cols'] = [
        { width: 30 },
        { width: 20 },
        { width: 15 },
        { width: 10 },
        { width: 15 }
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Invités');
    }

    // Télécharger le fichier Excel
    let fileName = 'liste-invites';
    if (selectedCategory !== 'all') {
      fileName += `-${selectedCategory.toLowerCase().replace(/\s+/g, '-')}`;
    }
    if (selectedTable !== 'all') {
      fileName += `-${selectedTable.toLowerCase().replace(/\s+/g, '-')}`;
    } else {
      fileName += '-toutes-tables';
    }
    fileName += '.xlsx';
    
    XLSX.writeFile(workbook, fileName);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      if (selectedFormat === 'pdf') {
        exportToPDF();
      } else {
        exportToExcel();
      }
      
      // Fermer le modal après un court délai
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export. Veuillez réessayer.');
    } finally {
      setIsExporting(false);
    }
  };

  const tablesWithGuests = getTablesWithGuests();

  const goldRing = 'rgba(251,191,36,0.5)';
  const goldSoft = 'rgba(251,191,36,0.45)';
  const inputBg = 'rgba(255,255,255,0.03)';
  const inputBorder = 'rgba(255,255,255,0.08)';
  const textMuted = 'rgba(255,255,255,0.6)';
  const textSoft = 'rgba(255,255,255,0.8)';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
      <div 
        className="rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden animate-slide-up border"
        style={{
          background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
          borderColor: 'rgba(255,255,255,0.08)',
          boxShadow: '0 40px 120px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(251,191,36,0.06) inset',
        }}
      >
        <div className="flex flex-col max-h-[85vh]">
          {/* Header */}
          <div 
            className="px-4 sm:px-6 py-4 sm:py-5 border-b flex justify-between items-center flex-shrink-0"
            style={{
              borderColor: 'rgba(255,255,255,0.06)',
              background: 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(255,255,255,0) 70%)',
            }}
          >
            <div className="flex items-center min-w-0">
              <div className="relative mr-3 flex-shrink-0">
                <Download className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: '#fcd34d' }} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white truncate">
                  Exporter les Invités
                </h2>
                <p className="text-xs sm:text-sm mt-0.5" style={{ color: textMuted }}>
                  Téléchargez la liste par table
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-all duration-200 flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.04)', color: textMuted }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = textMuted; }}
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content scrollable */}
          <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1">
            <div className="space-y-5 sm:space-y-6">
              {/* Sélection du format */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-white/80 mb-2 sm:mb-3">
                  Format d'export
                </label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    onClick={() => setSelectedFormat('pdf')}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 ${
                      selectedFormat === 'pdf' ? '' : ''
                    }`}
                    style={selectedFormat === 'pdf' ? {
                      background: 'linear-gradient(180deg, rgba(251,191,36,0.16) 0%, rgba(251,191,36,0.05) 100%)',
                      borderColor: 'rgba(251,191,36,0.5)',
                      color: '#fcd34d',
                      boxShadow: '0 0 0 1px rgba(251,191,36,0.18) inset',
                    } : {
                      background: inputBg,
                      borderColor: inputBorder,
                      color: textSoft,
                    }}
                    onMouseEnter={(e) => { if (selectedFormat !== 'pdf') { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.28)'; } }}
                    onMouseLeave={(e) => { if (selectedFormat !== 'pdf') { e.currentTarget.style.borderColor = inputBorder; } }}
                  >
                    <FileText className="h-7 w-7 sm:h-8 sm:w-8 mx-auto mb-1.5 sm:mb-2" />
                    <div className="text-xs sm:text-sm font-semibold">PDF</div>
                    <div className="text-[10px] sm:text-xs mt-0.5" style={{ color: textMuted }}>Document imprimable</div>
                  </button>

                  <button
                    onClick={() => setSelectedFormat('excel')}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-300`}
                    style={selectedFormat === 'excel' ? {
                      background: 'linear-gradient(180deg, rgba(52,211,153,0.14) 0%, rgba(52,211,153,0.04) 100%)',
                      borderColor: 'rgba(52,211,153,0.45)',
                      color: '#6ee7b7',
                      boxShadow: '0 0 0 1px rgba(52,211,153,0.16) inset',
                    } : {
                      background: inputBg,
                      borderColor: inputBorder,
                      color: textSoft,
                    }}
                    onMouseEnter={(e) => { if (selectedFormat !== 'excel') { e.currentTarget.style.borderColor = 'rgba(52,211,153,0.28)'; } }}
                    onMouseLeave={(e) => { if (selectedFormat !== 'excel') { e.currentTarget.style.borderColor = inputBorder; } }}
                  >
                    <FileSpreadsheet className="h-7 w-7 sm:h-8 sm:w-8 mx-auto mb-1.5 sm:mb-2" />
                    <div className="text-xs sm:text-sm font-semibold">Excel</div>
                    <div className="text-[10px] sm:text-xs mt-0.5" style={{ color: textMuted }}>Feuille de calcul</div>
                  </button>
                </div>
              </div>

              {selectedFormat === 'pdf' && (
                <div>
                  <button
                    onClick={() => setShowAdvancedOptions(v => !v)}
                    className="w-full px-4 py-2.5 sm:py-3 rounded-xl border transition-all duration-200 font-semibold text-left"
                    style={{
                      background: inputBg,
                      borderColor: inputBorder,
                      color: textSoft,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.28)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = inputBorder; }}
                  >
                    {showAdvancedOptions ? 'Masquer les options PDF avancées' : 'Afficher les options PDF avancées'}
                  </button>
                  {showAdvancedOptions && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-white/80 mb-2 sm:mb-3">Orientation</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          <button
                            onClick={() => setPdfOrientation('portrait')}
                            className="p-3 sm:p-4 rounded-xl border-2 transition-all duration-300"
                            style={pdfOrientation === 'portrait' ? {
                              background: 'linear-gradient(180deg, rgba(251,191,36,0.16) 0%, rgba(251,191,36,0.05) 100%)',
                              borderColor: 'rgba(251,191,36,0.5)',
                              color: '#fcd34d',
                              boxShadow: '0 0 0 1px rgba(251,191,36,0.18) inset',
                            } : {
                              background: inputBg,
                              borderColor: inputBorder,
                              color: textSoft,
                            }}
                            onMouseEnter={(e) => { if (pdfOrientation !== 'portrait') e.currentTarget.style.borderColor = 'rgba(251,191,36,0.28)'; }}
                            onMouseLeave={(e) => { if (pdfOrientation !== 'portrait') e.currentTarget.style.borderColor = inputBorder; }}
                          >
                            <FileText className="h-7 w-7 sm:h-8 sm:w-8 mx-auto mb-1.5 sm:mb-2" />
                            <div className="text-xs sm:text-sm font-semibold">Portrait</div>
                            <div className="text-[10px] sm:text-xs mt-0.5" style={{ color: textMuted }}>Page verticale</div>
                          </button>
                          <button
                            onClick={() => setPdfOrientation('landscape')}
                            className="p-3 sm:p-4 rounded-xl border-2 transition-all duration-300"
                            style={pdfOrientation === 'landscape' ? {
                              background: 'linear-gradient(180deg, rgba(251,191,36,0.16) 0%, rgba(251,191,36,0.05) 100%)',
                              borderColor: 'rgba(251,191,36,0.5)',
                              color: '#fcd34d',
                              boxShadow: '0 0 0 1px rgba(251,191,36,0.18) inset',
                            } : {
                              background: inputBg,
                              borderColor: inputBorder,
                              color: textSoft,
                            }}
                            onMouseEnter={(e) => { if (pdfOrientation !== 'landscape') e.currentTarget.style.borderColor = 'rgba(251,191,36,0.28)'; }}
                            onMouseLeave={(e) => { if (pdfOrientation !== 'landscape') e.currentTarget.style.borderColor = inputBorder; }}
                          >
                            <FileText className="h-7 w-7 sm:h-8 sm:w-8 mx-auto mb-1.5 sm:mb-2" />
                            <div className="text-xs sm:text-sm font-semibold">Paysage</div>
                            <div className="text-[10px] sm:text-xs mt-0.5" style={{ color: textMuted }}>Page horizontale</div>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-white/80 mb-2 sm:mb-3">Densité du tableau</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          <button
                            onClick={() => setPdfDensity('normal')}
                            className="p-3 sm:p-4 rounded-xl border-2 transition-all duration-300"
                            style={pdfDensity === 'normal' ? {
                              background: 'linear-gradient(180deg, rgba(251,191,36,0.16) 0%, rgba(251,191,36,0.05) 100%)',
                              borderColor: 'rgba(251,191,36,0.5)',
                              color: '#fcd34d',
                              boxShadow: '0 0 0 1px rgba(251,191,36,0.18) inset',
                            } : {
                              background: inputBg,
                              borderColor: inputBorder,
                              color: textSoft,
                            }}
                            onMouseEnter={(e) => { if (pdfDensity !== 'normal') e.currentTarget.style.borderColor = 'rgba(251,191,36,0.28)'; }}
                            onMouseLeave={(e) => { if (pdfDensity !== 'normal') e.currentTarget.style.borderColor = inputBorder; }}
                          >
                            <Table className="h-7 w-7 sm:h-8 sm:w-8 mx-auto mb-1.5 sm:mb-2" />
                            <div className="text-xs sm:text-sm font-semibold">Normal</div>
                            <div className="text-[10px] sm:text-xs mt-0.5" style={{ color: textMuted }}>Lisible, espacement standard</div>
                          </button>
                          <button
                            onClick={() => setPdfDensity('compact')}
                            className="p-3 sm:p-4 rounded-xl border-2 transition-all duration-300"
                            style={pdfDensity === 'compact' ? {
                              background: 'linear-gradient(180deg, rgba(251,191,36,0.16) 0%, rgba(251,191,36,0.05) 100%)',
                              borderColor: 'rgba(251,191,36,0.5)',
                              color: '#fcd34d',
                              boxShadow: '0 0 0 1px rgba(251,191,36,0.18) inset',
                            } : {
                              background: inputBg,
                              borderColor: inputBorder,
                              color: textSoft,
                            }}
                            onMouseEnter={(e) => { if (pdfDensity !== 'compact') e.currentTarget.style.borderColor = 'rgba(251,191,36,0.28)'; }}
                            onMouseLeave={(e) => { if (pdfDensity !== 'compact') e.currentTarget.style.borderColor = inputBorder; }}
                          >
                            <Table className="h-7 w-7 sm:h-8 sm:w-8 mx-auto mb-1.5 sm:mb-2" />
                            <div className="text-xs sm:text-sm font-semibold">Compact</div>
                            <div className="text-[10px] sm:text-xs mt-0.5" style={{ color: textMuted }}>Plus d'invités par page</div>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-white/80 mb-2 sm:mb-3">Taille de police</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={7}
                            max={12}
                            step={1}
                            value={pdfFontSize}
                            onChange={(e) => setPdfFontSize(Number(e.target.value))}
                            className="flex-1"
                            style={{ accentColor: '#f59e0b' }}
                          />
                          <span className="text-xs sm:text-sm w-10 sm:w-12 text-right" style={{ color: textSoft }}>{pdfFontSize}pt</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sélection de la catégorie */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-white/80 mb-2 sm:mb-3 flex items-center">
                  <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" style={{ color: '#fcd34d' }} />
                  Filtrer par catégorie
                </label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full pl-3 sm:pl-4 pr-10 py-2.5 sm:py-3 rounded-xl transition-all duration-200 outline-none appearance-none text-xs sm:text-sm"
                    style={{
                      background: inputBg,
                      border: `1px solid ${inputBorder}`,
                      color: '#ffffff',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = goldSoft; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <option value="all">Toutes les catégories</option>
                    {availableCategories.map(catName => (
                      <option key={catName} value={catName}>{catName}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none" style={{ color: textMuted }}>
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Sélection de la table */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-white/80 mb-2 sm:mb-3">
                  Table à exporter
                </label>
                <div className="relative">
                  <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 outline-none appearance-none text-xs sm:text-sm"
                    style={{
                      background: inputBg,
                      border: `1px solid ${inputBorder}`,
                      color: '#ffffff',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = goldSoft; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(251,191,36,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <option value="all">Toutes les tables</option>
                    {tablesWithGuests.map((table) => (
                      <option key={table.name} value={table.name}>
                        {table.name} ({table.guests.length} invité{table.guests.length > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none" style={{ color: textMuted }}>
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Aperçu des données */}
              <div 
                className="rounded-xl p-3 sm:p-4 border"
                style={{
                  background: 'linear-gradient(180deg, rgba(251,191,36,0.08) 0%, rgba(255,255,255,0.015) 100%)',
                  borderColor: 'rgba(251,191,36,0.12)',
                }}
              >
                <div className="flex items-center mb-2 sm:mb-3">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" style={{ color: '#fcd34d' }} />
                  <h3 className="text-xs sm:text-sm font-bold text-white">Aperçu de l'export</h3>
                </div>
                
                {selectedTable === 'all' ? (
                  <div className="space-y-1.5 text-xs sm:text-sm" style={{ color: textSoft }}>
                  <div>• {tablesWithGuests.length} table{tablesWithGuests.length > 1 ? 's' : ''}</div>
                  <div>• {guests.length} invité{guests.length > 1 ? 's' : ''} au total</div>
                  <div>• {guests.filter(g => g.confirmed).length} confirmé{guests.filter(g => g.confirmed).length > 1 ? 's' : ''}</div>
                </div>
              ) : (
                (() => {
                  const selectedTableData = tablesWithGuests.find(t => t.name === selectedTable);
                  return selectedTableData ? (
                    <div className="space-y-1.5 text-xs sm:text-sm" style={{ color: textSoft }}>
                      <div>• Table: {selectedTableData.name}</div>
                      <div>• {selectedTableData.guests.length} invité{selectedTableData.guests.length > 1 ? 's' : ''}</div>
                      <div>• {selectedTableData.guests.filter(g => g.confirmed).length} confirmé{selectedTableData.guests.filter(g => g.confirmed).length > 1 ? 's' : ''}</div>
                    </div>
                  ) : null;
                })()
              )}
              </div>
            </div>
          </div>

          {/* Actions footer */}
          <div 
            className="px-4 sm:px-6 py-4 border-t flex-shrink-0"
            style={{
              borderColor: 'rgba(255,255,255,0.06)',
              background: 'linear-gradient(0deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 100%)',
            }}
          >
            <div className="flex flex-col-reverse sm:flex-row sm:space-x-3 gap-2 sm:gap-0 mt-0">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-300 font-medium border text-xs sm:text-sm"
                style={{
                  background: inputBg,
                  borderColor: inputBorder,
                  color: 'rgba(255,255,255,0.75)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = inputBg; e.currentTarget.style.borderColor = inputBorder; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
              >
                Annuler
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting || tablesWithGuests.length === 0}
                className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm flex items-center justify-center"
                style={{
                  background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                  color: '#0b0f17',
                  boxShadow: (isExporting || tablesWithGuests.length === 0) 
                    ? 'none' 
                    : `0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px ${goldRing}, 0 10px 24px -10px rgba(251,191,36,0.65)`,
                }}
                onMouseEnter={(e) => { if (!isExporting && tablesWithGuests.length > 0) { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.transform = 'scale(1.02)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {isExporting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-[#0b0f17]/30 border-t-[#0b0f17] rounded-full animate-spin mr-2"></div>
                    <span className="text-xs sm:text-sm">Export en cours...</span>
                  </div>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestExportModal;
