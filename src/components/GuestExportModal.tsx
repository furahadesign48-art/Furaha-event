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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-luxury max-w-md w-full max-h-[85vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200/50 bg-gradient-to-r from-neutral-50 to-amber-50/30">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="relative mr-3">
                <Download className="h-6 w-6 text-amber-500 animate-glow drop-shadow-lg" />
                <div className="absolute inset-0 animate-pulse">
                  <Download className="h-6 w-6 text-amber-300 opacity-30" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Exporter les Invités
                </h2>
                <p className="text-slate-600 text-sm">
                  Téléchargez la liste par table
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
            >
              <X className="h-5 w-5 text-neutral-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Sélection du format */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Format d'export
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedFormat('pdf')}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    selectedFormat === 'pdf'
                      ? 'border-amber-400 bg-amber-50 text-amber-700'
                      : 'border-neutral-200 hover:border-amber-300 text-slate-600'
                  }`}
                >
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">PDF</div>
                  <div className="text-xs opacity-75">Document imprimable</div>
                </button>

                <button
                  onClick={() => setSelectedFormat('excel')}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    selectedFormat === 'excel'
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                      : 'border-neutral-200 hover:border-emerald-300 text-slate-600'
                  }`}
                >
                  <FileSpreadsheet className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Excel</div>
                  <div className="text-xs opacity-75">Feuille de calcul</div>
                </button>
              </div>
            </div>

            {selectedFormat === 'pdf' && (
              <div>
                <button
                  onClick={() => setShowAdvancedOptions(v => !v)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 text-slate-700 hover:border-amber-300 transition-all duration-200 font-medium"
                >
                  {showAdvancedOptions ? 'Masquer les options PDF avancées' : 'Afficher les options PDF avancées'}
                </button>
                {showAdvancedOptions && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">Orientation</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setPdfOrientation('portrait')}
                          className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                            pdfOrientation === 'portrait'
                              ? 'border-amber-400 bg-amber-50 text-amber-700'
                              : 'border-neutral-200 hover:border-amber-300 text-slate-600'
                          }`}
                        >
                          <FileText className="h-8 w-8 mx-auto mb-2" />
                          <div className="text-sm font-medium">Portrait</div>
                          <div className="text-xs opacity-75">Page verticale</div>
                        </button>
                        <button
                          onClick={() => setPdfOrientation('landscape')}
                          className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                            pdfOrientation === 'landscape'
                              ? 'border-amber-400 bg-amber-50 text-amber-700'
                              : 'border-neutral-200 hover:border-amber-300 text-slate-600'
                          }`}
                        >
                          <FileText className="h-8 w-8 mx-auto mb-2" />
                          <div className="text-sm font-medium">Paysage</div>
                          <div className="text-xs opacity-75">Page horizontale</div>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">Densité du tableau</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setPdfDensity('normal')}
                          className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                            pdfDensity === 'normal'
                              ? 'border-amber-400 bg-amber-50 text-amber-700'
                              : 'border-neutral-200 hover:border-amber-300 text-slate-600'
                          }`}
                        >
                          <Table className="h-8 w-8 mx-auto mb-2" />
                          <div className="text-sm font-medium">Normal</div>
                          <div className="text-xs opacity-75">Lisible, espacement standard</div>
                        </button>
                        <button
                          onClick={() => setPdfDensity('compact')}
                          className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                            pdfDensity === 'compact'
                              ? 'border-amber-400 bg-amber-50 text-amber-700'
                              : 'border-neutral-200 hover:border-amber-300 text-slate-600'
                          }`}
                        >
                          <Table className="h-8 w-8 mx-auto mb-2" />
                          <div className="text-sm font-medium">Compact</div>
                          <div className="text-xs opacity-75">Plus d'invités par page</div>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">Taille de police</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={7}
                          max={12}
                          step={1}
                          value={pdfFontSize}
                          onChange={(e) => setPdfFontSize(Number(e.target.value))}
                          className="flex-1 accent-amber-500"
                        />
                        <span className="text-sm text-slate-700 w-10 text-right">{pdfFontSize}pt</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sélection de la catégorie */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center">
                <Tag className="h-4 w-4 mr-2 text-amber-500" />
                Filtrer par catégorie
              </label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-white border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 appearance-none transition-all duration-200"
                >
                  <option value="all">Toutes les catégories</option>
                  {availableCategories.map(catName => (
                    <option key={catName} value={catName}>{catName}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-neutral-500">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Sélection de la table */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Table à exporter
              </label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
              >
                <option value="all">Toutes les tables</option>
                {tablesWithGuests.map((table) => (
                  <option key={table.name} value={table.name}>
                    {table.name} ({table.guests.length} invité{table.guests.length > 1 ? 's' : ''})
                  </option>
                ))}
              </select>
            </div>

            {/* Aperçu des données */}
            <div className="bg-gradient-to-r from-neutral-50 to-amber-50/30 rounded-xl p-4 border border-neutral-200/50">
              <div className="flex items-center mb-3">
                <Users className="h-4 w-4 text-amber-600 mr-2" />
                <h3 className="text-sm font-semibold text-slate-900">Aperçu de l'export</h3>
              </div>
              
              {selectedTable === 'all' ? (
                <div className="space-y-2 text-sm text-slate-600">
                  <div>• {tablesWithGuests.length} table{tablesWithGuests.length > 1 ? 's' : ''}</div>
                  <div>• {guests.length} invité{guests.length > 1 ? 's' : ''} au total</div>
                  <div>• {guests.filter(g => g.confirmed).length} confirmé{guests.filter(g => g.confirmed).length > 1 ? 's' : ''}</div>
                </div>
              ) : (
                (() => {
                  const selectedTableData = tablesWithGuests.find(t => t.name === selectedTable);
                  return selectedTableData ? (
                    <div className="space-y-2 text-sm text-slate-600">
                      <div>• Table: {selectedTableData.name}</div>
                      <div>• {selectedTableData.guests.length} invité{selectedTableData.guests.length > 1 ? 's' : ''}</div>
                      <div>• {selectedTableData.guests.filter(g => g.confirmed).length} confirmé{selectedTableData.guests.filter(g => g.confirmed).length > 1 ? 's' : ''}</div>
                    </div>
                  ) : null;
                })()
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-neutral-300 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-all duration-200 font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || tablesWithGuests.length === 0}
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-3 rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 font-semibold shadow-glow-amber transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Export en cours...
                </>
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
  );
};

export default GuestExportModal;
