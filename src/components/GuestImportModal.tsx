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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
      <div className="bg-white rounded-2xl shadow-luxury max-w-3xl w-full max-h-[90vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200/50 bg-gradient-to-r from-neutral-50 to-amber-50/30">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-amber-100 p-2 rounded-lg mr-3">
                <FileSpreadsheet className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Importer des Invités</h2>
                <p className="text-slate-600 text-sm">Ajout massif via fichier Excel</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
              <X className="h-5 w-5 text-neutral-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {!file ? (
            <div className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-300 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all group"
              >
                <div className="bg-amber-50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="h-8 w-8 text-amber-600" />
                </div>
                <p className="text-slate-900 font-semibold mb-1">Cliquez pour sélectionner un fichier</p>
                <p className="text-slate-500 text-sm">Excel (.xlsx, .xls)</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".xlsx, .xls" 
                  className="hidden" 
                />
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-start">
                <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Conseils pour l'import :</p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li>Utilisez des colonnes nommées : <b>Nom</b>, <b>Catégorie</b>, <b>Table</b>, <b>Statut</b>.</li>
                    <li>Le statut peut être : "En attente", "Confirmé" ou "Décliné".</li>
                    <li>Pour les couples, vous pouvez ajouter une colonne <b>Type</b> avec la valeur "couple".</li>
                  </ul>
                  <button 
                    onClick={downloadTemplate}
                    className="mt-3 flex items-center text-blue-700 hover:text-blue-900 font-medium"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Télécharger un modèle Excel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <div className="flex items-center">
                  <FileSpreadsheet className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-slate-700">{file.name}</span>
                </div>
                <button 
                  onClick={() => { setFile(null); setPreviewData([]); }}
                  className="text-xs text-rose-600 hover:underline font-medium"
                >
                  Changer de fichier
                </button>
              </div>

              {isParsing ? (
                <div className="py-10 text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-600">Analyse du fichier...</p>
                </div>
              ) : error ? (
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex items-center text-rose-800">
                  <AlertCircle className="h-5 w-5 mr-3" />
                  <p className="text-sm">{error}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Rapport détaillé */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      <div className="text-emerald-600 font-bold text-2xl mb-1">{importReport?.new.length}</div>
                      <div className="text-emerald-800 text-xs font-semibold uppercase tracking-wider">Nouveaux</div>
                      <p className="text-emerald-600/70 text-[10px] mt-1">Serront ajoutés à votre liste</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                      <div className="text-amber-600 font-bold text-2xl mb-1">{importReport?.duplicates.length}</div>
                      <div className="text-amber-800 text-xs font-semibold uppercase tracking-wider">Doublons</div>
                      <p className="text-amber-600/70 text-[10px] mt-1">Déjà présents, seront ignorés</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                      <div className="text-blue-600 font-bold text-2xl mb-1">{importReport?.totalSeats}</div>
                      <div className="text-blue-800 text-xs font-semibold uppercase tracking-wider">Places totales</div>
                      <p className="text-blue-600/70 text-[10px] mt-1">Incluant les doubles pour couples</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">Aperçu des données</h3>
                      <div className="text-xs text-slate-500 italic">Affichage des 10 premiers invités</div>
                    </div>
                    
                    <div className="border border-neutral-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-50 border-b border-neutral-200">
                          <tr>
                            <th className="px-4 py-2 font-semibold text-slate-700">Nom</th>
                            <th className="px-4 py-2 font-semibold text-slate-700">Catégorie</th>
                            <th className="px-4 py-2 font-semibold text-slate-700">Type</th>
                            <th className="px-4 py-2 font-semibold text-slate-700">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {previewData.slice(0, 10).map((row, idx) => {
                            const isDuplicate = existingGuests.some(eg => eg.nom.trim().toLowerCase() === row.nom.trim().toLowerCase());
                            return (
                              <tr key={idx} className={`hover:bg-neutral-50/50 ${isDuplicate ? 'opacity-50 bg-amber-50/30' : ''}`}>
                                <td className="px-4 py-2 text-slate-700 flex items-center">
                                  {row.nom}
                                  {isDuplicate && <span className="ml-2 text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase font-bold">Doublon</span>}
                                </td>
                                <td className="px-4 py-2 text-slate-600">{row.category || '—'}</td>
                                <td className="px-4 py-2 text-slate-600">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.etat === 'couple' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                                    {row.etat}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    String(row.statut || '').toLowerCase().includes('conf') ? 'bg-emerald-100 text-emerald-700' :
                                    String(row.statut || '').toLowerCase().includes('decl') ? 'bg-rose-100 text-rose-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                    {row.statut}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {previewData.length > 10 && (
                        <div className="p-2 bg-neutral-50 text-center text-xs text-slate-500 border-t border-neutral-200">
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
        <div className="p-6 border-t border-neutral-200/50 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-neutral-300 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-all font-medium"
          >
            Annuler
          </button>
          <button
            onClick={handleImport}
            disabled={!file || isParsing || isImporting || previewData.length === 0}
            className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-3 rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all font-semibold shadow-glow-amber disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isImporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Importation...
              </>
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
  );
};

export default GuestImportModal;
