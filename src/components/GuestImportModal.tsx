import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Check, AlertCircle, Info, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface GuestImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (guests: any[]) => Promise<void>;
  categories: { id: string; name: string }[];
  tables: { name: string; seats: number }[];
  existingGuests?: { nom: string }[];
}

const GuestImportModal = ({ isOpen, onClose, onImport, categories, tables, existingGuests = [] }: GuestImportModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importReport, setImportReport] = useState<{
    new: any[];
    duplicates: any[];
    overCapacity: any[];
    totalSeats: number;
  } | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (
        selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        selectedFile.type === 'application/vnd.ms-excel'
      ) {
        setFile(selectedFile);
        parseExcel(selectedFile);
        setError(null);
      } else {
        setError('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
        setFile(null);
        setPreviewData([]);
        setImportReport(null);
      }
    }
  };

  const parseExcel = (file: File) => {
    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const existingNames = new Set(existingGuests.map(g => g.nom.trim().toLowerCase()));
        
        const newGuests: any[] = [];
        const duplicates: any[] = [];
        const overCapacity: any[] = [];
        let totalSeats = 0;

        // Map and validate columns
        const formattedData = json.map((row: any) => {
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.toLowerCase().trim()] = row[key];
          });

          const typeVal = String(normalizedRow.type || '').toLowerCase();
          const etatVal = String(normalizedRow.etat || '').toLowerCase();
          const statutVal = String(normalizedRow.statut || '').toLowerCase();
          
          const isCouple = typeVal.includes('couple') || etatVal.includes('couple') || statutVal.includes('couple');
          const etat = isCouple ? 'couple' : 'simple';

          let finalStatut = normalizedRow.statut || normalizedRow.status || normalizedRow.confirmation || 'pending';
          if (String(finalStatut).toLowerCase().includes('couple') || String(finalStatut).toLowerCase().includes('simple')) {
            finalStatut = 'pending';
          }

          const guestName = normalizedRow.nom || normalizedRow.name || normalizedRow.invité || normalizedRow.invite || '';
          const guestTable = String(normalizedRow.table || normalizedRow.bureau || 'Non assigné');
          const guestCategory = normalizedRow.catégorie || normalizedRow.categorie || normalizedRow.category || normalizedRow.groupe || '';
          
          const guestObj = {
            nom: guestName,
            category: guestCategory,
            table: guestTable,
            statut: finalStatut,
            etat: etat
          };

          if (guestName.trim()) {
            if (existingNames.has(guestName.trim().toLowerCase())) {
              duplicates.push(guestObj);
            } else {
              newGuests.push(guestObj);
              totalSeats += (etat === 'couple' ? 2 : 1);
            }
          }

          return guestObj;
        }).filter(item => item.nom.trim() !== '');

        setPreviewData(formattedData);
        setImportReport({
          new: newGuests,
          duplicates,
          overCapacity,
          totalSeats
        });
      } catch (err) {
        console.error('Error parsing Excel:', err);
        setError('Erreur lors de la lecture du fichier Excel. Assurez-vous qu\'il est valide.');
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (!importReport || importReport.new.length === 0) return;
    
    setIsImporting(true);
    try {
      await onImport(importReport.new);
      onClose();
    } catch (err) {
      console.error('Import error:', err);
      setError('Une erreur est survenue lors de l\'importation. Veuillez réessayer.');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      { 'Nom': 'Jean Dupont', 'Catégorie': 'Famille', 'Table': 'Table 1', 'Statut': 'En attente', 'Type': 'simple' },
      { 'Nom': 'Marie & Paul', 'Catégorie': 'Amis', 'Table': 'Table 2', 'Statut': 'Confirmé', 'Type': 'couple' },
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invités');
    XLSX.writeFile(workbook, 'modele_import_invites.xlsx');
  };

  const goldRing = 'rgba(251,191,36,0.5)';
  const inputBg = 'rgba(255,255,255,0.03)';
  const inputBorder = 'rgba(255,255,255,0.08)';
  const textMuted = 'rgba(255,255,255,0.6)';
  const textSoft = 'rgba(255,255,255,0.8)';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[60] animate-fade-in">
      <div 
        className="rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-slide-up border"
        style={{
          background: 'linear-gradient(180deg, #111727 0%, #0d1220 100%)',
          borderColor: 'rgba(255,255,255,0.08)',
          boxShadow: '0 40px 120px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(251,191,36,0.06) inset',
        }}
      >
        {/* Header */}
        <div 
          className="px-4 sm:px-6 py-4 sm:py-5 border-b flex justify-between items-center flex-shrink-0"
          style={{
            borderColor: 'rgba(255,255,255,0.06)',
            background: 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(255,255,255,0) 70%)',
          }}
        >
          <div className="flex items-center min-w-0">
            <div className="relative mr-3 flex-shrink-0" style={{ color: '#fcd34d' }}>
              <FileSpreadsheet className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white truncate">
                Importer des Invités
              </h2>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: textMuted }}>
                Ajout massif via fichier Excel
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
          {!file ? (
            <div className="space-y-5 sm:space-y-6">
              {/* Zone de dépôt / sélection */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center cursor-pointer transition-all group text-center"
                style={{
                  borderColor: 'rgba(255,255,255,0.12)',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.015) 0%, rgba(0,0,0,0) 100%)',
                }}
                onMouseEnter={(e) => { 
                  e.currentTarget.style.borderColor = 'rgba(251,191,36,0.55)'; 
                  e.currentTarget.style.background = 'linear-gradient(180deg, rgba(251,191,36,0.06) 0%, rgba(0,0,0,0) 100%)'; 
                }}
                onMouseLeave={(e) => { 
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; 
                  e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.015) 0%, rgba(0,0,0,0) 100%)'; 
                }}
              >
                <div 
                  className="p-3 sm:p-4 rounded-full mb-3 sm:mb-4 group-hover:scale-110 transition-transform"
                  style={{ background: 'rgba(251,191,36,0.12)' }}
                >
                  <Upload className="h-7 w-7 sm:h-8 sm:w-8" style={{ color: '#fcd34d' }} />
                </div>
                <p className="text-white font-bold text-sm sm:text-base mb-1">Cliquez pour sélectionner un fichier</p>
                <p className="text-xs sm:text-sm" style={{ color: textMuted }}>Excel (.xlsx, .xls)</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".xlsx, .xls" 
                  className="hidden" 
                />
              </div>

              {/* Conseils */}
              <div 
                className="rounded-xl p-3 sm:p-4 border flex items-start"
                style={{
                  background: 'linear-gradient(180deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.02) 100%)',
                  borderColor: 'rgba(59,130,246,0.18)',
                }}
              >
                <Info className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" style={{ color: '#93c5fd' }} />
                <div className="text-xs sm:text-sm" style={{ color: textSoft }}>
                  <p className="font-bold mb-1 text-white">Conseils pour l'import :</p>
                  <ul className="list-disc ml-4 space-y-1" style={{ color: textSoft }}>
                    <li>Utilisez des colonnes nommées : <b className="text-white">Nom</b>, <b className="text-white">Catégorie</b>, <b className="text-white">Table</b>, <b className="text-white">Statut</b>.</li>
                    <li>Le statut peut être : "En attente", "Confirmé" ou "Décliné".</li>
                    <li>Pour les couples, ajoutez une colonne <b className="text-white">Type</b> avec la valeur "couple".</li>
                  </ul>
                  <button 
                    onClick={downloadTemplate}
                    className="mt-3 flex items-center font-semibold transition-colors"
                    style={{ color: '#fcd34d' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#fcd34d'; }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Télécharger un modèle Excel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {/* Fichier sélectionné */}
              <div 
                className="flex items-center justify-between p-3 rounded-xl border"
                style={{
                  background: 'linear-gradient(180deg, rgba(52,211,153,0.08) 0%, rgba(52,211,153,0.02) 100%)',
                  borderColor: 'rgba(52,211,153,0.22)',
                }}
              >
                <div className="flex items-center min-w-0">
                  <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" style={{ color: '#6ee7b7' }} />
                  <span className="text-xs sm:text-sm font-semibold text-white truncate">{file.name}</span>
                </div>
                <button 
                  onClick={() => { setFile(null); setPreviewData([]); setImportReport(null); setError(null); }}
                  className="text-xs font-bold transition-colors ml-2 flex-shrink-0"
                  style={{ color: '#fda4af' }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; e.currentTarget.style.color = '#fecdd3'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; e.currentTarget.style.color = '#fda4af'; }}
                >
                  Changer
                </button>
              </div>

              {isParsing ? (
                <div className="py-8 sm:py-10 text-center">
                  <div className="animate-spin h-8 w-8 border-4 rounded-full mx-auto mb-4"
                       style={{
                         borderColor: 'rgba(251,191,36,0.25)',
                         borderTopColor: '#fcd34d',
                       }}
                  ></div>
                  <p className="text-xs sm:text-sm" style={{ color: textSoft }}>Analyse du fichier...</p>
                </div>
              ) : error ? (
                <div 
                  className="p-3 sm:p-4 rounded-xl border flex items-center"
                  style={{
                    background: 'linear-gradient(180deg, rgba(244,63,94,0.08) 0%, rgba(244,63,94,0.02) 100%)',
                    borderColor: 'rgba(244,63,94,0.25)',
                    color: '#fecdd3',
                  }}
                >
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                  <p className="text-xs sm:text-sm">{error}</p>
                </div>
              ) : (
                <div className="space-y-5 sm:space-y-6">
                  {/* Rapport détaillé */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div 
                      className="p-3 sm:p-4 rounded-2xl border"
                      style={{
                        background: 'linear-gradient(180deg, rgba(52,211,153,0.1) 0%, rgba(52,211,153,0.025) 100%)',
                        borderColor: 'rgba(52,211,153,0.25)',
                      }}
                    >
                      <div className="font-black text-2xl sm:text-3xl mb-1" style={{ color: '#6ee7b7' }}>{importReport?.new.length}</div>
                      <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-300/90">Nouveaux</div>
                      <p className="text-[10px] sm:text-[11px] mt-1" style={{ color: 'rgba(110,231,183,0.6)' }}>Seront ajoutés à votre liste</p>
                    </div>
                    <div 
                      className="p-3 sm:p-4 rounded-2xl border"
                      style={{
                        background: 'linear-gradient(180deg, rgba(251,191,36,0.1) 0%, rgba(251,191,36,0.025) 100%)',
                        borderColor: 'rgba(251,191,36,0.25)',
                      }}
                    >
                      <div className="font-black text-2xl sm:text-3xl mb-1" style={{ color: '#fcd34d' }}>{importReport?.duplicates.length}</div>
                      <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-300/90">Doublons</div>
                      <p className="text-[10px] sm:text-[11px] mt-1" style={{ color: 'rgba(252,211,77,0.6)' }}>Déjà présents, seront ignorés</p>
                    </div>
                    <div 
                      className="p-3 sm:p-4 rounded-2xl border"
                      style={{
                        background: 'linear-gradient(180deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.025) 100%)',
                        borderColor: 'rgba(59,130,246,0.25)',
                      }}
                    >
                      <div className="font-black text-2xl sm:text-3xl mb-1" style={{ color: '#93c5fd' }}>{importReport?.totalSeats}</div>
                      <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-300/90">Places totales</div>
                      <p className="text-[10px] sm:text-[11px] mt-1" style={{ color: 'rgba(147,197,253,0.6)' }}>Incluant les doubles pour couples</p>
                    </div>
                  </div>

                  {/* Aperçu tableau */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="font-bold text-white text-sm sm:text-base">Aperçu des données</h3>
                      <div className="text-[11px] sm:text-xs italic" style={{ color: textMuted }}>Affichage des 10 premiers invités</div>
                    </div>
                    
                    <div 
                      className="rounded-xl overflow-hidden border"
                      style={{ borderColor: inputBorder, background: inputBg }}
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px] sm:text-sm text-left min-w-full">
                          <thead 
                            className="border-b"
                            style={{ 
                              borderColor: inputBorder, 
                              background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                            }}
                          >
                            <tr>
                              <th className="px-3 sm:px-4 py-2 sm:py-2.5 font-bold text-white whitespace-nowrap">Nom</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-2.5 font-bold text-white whitespace-nowrap">Catégorie</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-2.5 font-bold text-white whitespace-nowrap">Type</th>
                              <th className="px-3 sm:px-4 py-2 sm:py-2.5 font-bold text-white whitespace-nowrap">Statut</th>
                            </tr>
                          </thead>
                          <tbody style={{ color: textSoft }}>
                            {previewData.slice(0, 10).map((row, idx) => {
                              const isDuplicate = existingGuests.some(eg => eg.nom.trim().toLowerCase() === row.nom.trim().toLowerCase());
                              return (
                                <tr 
                                  key={idx} 
                                  className="border-t last:border-t-0"
                                  style={{
                                    borderColor: 'rgba(255,255,255,0.04)',
                                    background: isDuplicate ? 'rgba(251,191,36,0.05)' : 'transparent',
                                    opacity: isDuplicate ? 0.7 : 1,
                                  }}
                                >
                                  <td className="px-3 sm:px-4 py-2 text-white flex items-center gap-2 flex-wrap whitespace-nowrap">
                                    <span>{row.nom}</span>
                                    {isDuplicate && (
                                      <span 
                                        className="px-1.5 py-0.5 rounded uppercase font-black text-[9px] sm:text-[10px]"
                                        style={{ background: 'rgba(251,191,36,0.18)', color: '#fcd34d' }}
                                      >
                                        Doublon
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 sm:px-4 py-2 whitespace-nowrap" style={{ color: textSoft }}>{row.category || '—'}</td>
                                  <td className="px-3 sm:px-4 py-2 whitespace-nowrap">
                                    <span 
                                      className="px-2 py-0.5 rounded font-black uppercase text-[9px] sm:text-[10px]"
                                      style={row.etat === 'couple' ? { 
                                        background: 'rgba(244,63,94,0.15)', 
                                        color: '#fda4af' 
                                      } : { 
                                        background: 'rgba(255,255,255,0.06)', 
                                        color: textSoft 
                                      }}
                                    >
                                      {row.etat}
                                    </span>
                                  </td>
                                  <td className="px-3 sm:px-4 py-2 whitespace-nowrap">
                                    <span 
                                      className="px-2 py-0.5 rounded-full font-black uppercase text-[9px] sm:text-[10px]"
                                      style={
                                        String(row.statut || '').toLowerCase().includes('conf') 
                                          ? { background: 'rgba(52,211,153,0.15)', color: '#6ee7b7' }
                                          : String(row.statut || '').toLowerCase().includes('decl')
                                            ? { background: 'rgba(244,63,94,0.15)', color: '#fda4af' }
                                            : { background: 'rgba(251,191,36,0.15)', color: '#fcd34d' }
                                      }
                                    >
                                      {row.statut}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {previewData.length > 10 && (
                        <div 
                          className="p-2 text-center text-[11px] sm:text-xs border-t"
                          style={{ 
                            background: 'rgba(255,255,255,0.02)', 
                            borderColor: 'rgba(255,255,255,0.06)', 
                            color: textMuted 
                          }}
                        >
                          Et {previewData.length - 10} autres invités...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="px-4 sm:px-6 py-4 border-t flex-shrink-0"
          style={{
            borderColor: 'rgba(255,255,255,0.06)',
            background: 'linear-gradient(0deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 100%)',
          }}
        >
          <div className="flex flex-col-reverse sm:flex-row sm:space-x-3 gap-2 sm:gap-0">
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
              onClick={handleImport}
              disabled={!file || isParsing || isImporting || previewData.length === 0}
              className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm flex items-center justify-center"
              style={{
                background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                color: '#0b0f17',
                boxShadow: (!file || isParsing || isImporting || previewData.length === 0) 
                  ? 'none' 
                  : `0 1px 0 rgba(255,255,255,0.25) inset, 0 0 0 1px ${goldRing}, 0 10px 24px -10px rgba(251,191,36,0.65)`,
              }}
              onMouseEnter={(e) => { if (file && !isParsing && !isImporting && previewData.length > 0) { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.transform = 'scale(1.02)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {isImporting ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-[#0b0f17]/30 border-t-[#0b0f17] rounded-full animate-spin mr-2"></div>
                  <span className="text-xs sm:text-sm">Importation...</span>
                </div>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirmer l'import
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestImportModal;
