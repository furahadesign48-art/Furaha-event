import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckSquare, ClipboardList, FileText, MapPin, Users, Wallet, Plus, Save, Trash2, Edit, Upload, FileSpreadsheet } from 'lucide-react';
import { PlanningService, BudgetItem, Milestone, PlanningTask, ScheduleItem, Vendor, GuestPlanning } from '../services/planningService';
import GuestImportModal from './GuestImportModal';

declare global {
  interface Window {
    cloudinary: any;
  }
}

interface Props {
  userId: string;
  eventId: string;
  themePrimary: string;
  themeSecondary: string;
}

const EventPlanning = ({ userId, eventId, themePrimary, themeSecondary }: Props) => {
  const [tasks, setTasks] = useState<PlanningTask[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [budget, setBudget] = useState<BudgetItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [guests, setGuests] = useState<GuestPlanning[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [files, setFiles] = useState<{ id: string; url: string; name: string; type: string }[]>([]);
  const [active, setActive] = useState<'planning'|'tasks'|'budget'|'vendors'|'guests'|'agenda'|'files'>('planning');
  const [editedBudget, setEditedBudget] = useState<Record<string, { actual: number; paid: number }>>({});
  const [openMilestoneActionsId, setOpenMilestoneActionsId] = useState<string | null>(null);
  const [openTaskActionsId, setOpenTaskActionsId] = useState<string | null>(null);
  const [openBudgetActionsId, setOpenBudgetActionsId] = useState<string | null>(null);
  const [openVendorActionsId, setOpenVendorActionsId] = useState<string | null>(null);
  const [openPlanningGuestActionsId, setOpenPlanningGuestActionsId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const svc = useMemo(() => new PlanningService(userId, eventId), [userId, eventId]);

  useEffect(() => {
    if (!userId || !eventId) return;
    (async () => {
      const [t, m, b, v, g, s, f] = await Promise.all([
        svc.listTasks(),
        svc.listMilestones(),
        svc.listBudget(),
        svc.listVendors(),
        svc.listGuests(),
        svc.listSchedule(),
        svc.listFiles()
      ]);
      setTasks(t); setMilestones(m); setBudget(b); setVendors(v); setGuests(g); setSchedule(s); setFiles(f);
    })();
  }, [svc]);

  useEffect(() => {
    const m: Record<string, { actual: number; paid: number }> = {};
    budget.forEach((b) => { m[b.id] = { actual: b.actualAmount || 0, paid: b.paidAmount || 0 }; });
    setEditedBudget(m);
  }, [budget]);

  const totals = useMemo(() => {
    const planned = budget.reduce((sum, b) => sum + (b.plannedAmount || 0), 0);
    const actual = budget.reduce((sum, b) => sum + (b.actualAmount || 0), 0);
    const paid = budget.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
    const remaining = Math.max(0, planned - paid);
    return { planned, actual, paid, remaining };
  }, [budget]);

  const fmtUSD = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

  const addQuickMilestone = async () => {
    const m: Omit<Milestone, 'id'> = { title: 'Nouveau jalon', date: new Date().toISOString(), status: 'pending', dependsOn: [] };
    const created = await svc.addMilestone(m);
    setMilestones((prev) => [created, ...prev]);
  };

  const addQuickTask = async () => {
    const t: Omit<PlanningTask, 'id'> = { title: 'Nouvelle tâche', status: 'todo', priority: 'medium', dueDate: null, notes: '' };
    const created = await svc.addTask(t);
    setTasks((prev) => [created, ...prev]);
  };

  const addQuickBudget = async () => {
    const b: Omit<BudgetItem, 'id'> = { label: 'Nouvelle dépense', category: 'Divers', plannedAmount: 0, actualAmount: 0, paidAmount: 0, vendorId: null, dueDate: null };
    const created = await svc.addBudget(b);
    setBudget((prev) => [created, ...prev]);
  };

  const [newTask, setNewTask] = useState<{ title: string; dueDate: string; priority: 'low'|'medium'|'high' }>({ title: '', dueDate: '', priority: 'medium' });
  const [newMilestone, setNewMilestone] = useState<{ title: string; date: string }>({ title: '', date: '' });
  const [newBudget, setNewBudget] = useState<{ label: string; category: string; planned: number }>({ label: '', category: 'Divers', planned: 0 });
  const [newVendor, setNewVendor] = useState<{ name: string; phone: string; email: string }>({ name: '', phone: '', email: '' });
  const [newGuest, setNewGuest] = useState<{ name: string; rsvp: 'yes'|'no'|'pending'; seats: number }>({ name: '', rsvp: 'pending', seats: 1 });
  const [newSlot, setNewSlot] = useState<{ title: string; start: string; end: string; location: string }>({ title: '', start: '', end: '', location: '' });

  const createTask = async () => {
    if (!newTask.title.trim()) return;
    const t: Omit<PlanningTask,'id'> = { title: newTask.title, status: 'todo', priority: newTask.priority, dueDate: newTask.dueDate || null, notes: '' };
    const created = await svc.addTask(t);
    setTasks((p) => [created, ...p]);
    setNewTask({ title: '', dueDate: '', priority: 'medium' });
  };
  const createMilestone = async () => {
    if (!newMilestone.title.trim()) return;
    const m: Omit<Milestone,'id'> = { title: newMilestone.title, date: newMilestone.date || new Date().toISOString(), status: 'pending', dependsOn: [] };
    const created = await svc.addMilestone(m);
    setMilestones((p) => [created, ...p]);
    setNewMilestone({ title: '', date: '' });
  };
  const createBudget = async () => {
    if (!newBudget.label.trim()) return;
    const b: Omit<BudgetItem,'id'> = { label: newBudget.label, category: newBudget.category, plannedAmount: newBudget.planned, actualAmount: 0, paidAmount: 0, vendorId: null, dueDate: null };
    const created = await svc.addBudget(b);
    setBudget((p) => [created, ...p]);
    setNewBudget({ label: '', category: 'Divers', planned: 0 });
  };
  const createVendor = async () => {
    if (!newVendor.name.trim()) return;
    const v: Omit<Vendor,'id'> = { name: newVendor.name, phone: newVendor.phone, email: newVendor.email, booked: false };
    const created = await svc.addVendor(v);
    setVendors((p) => [created, ...p]);
    setNewVendor({ name: '', phone: '', email: '' });
  };
  const createGuest = async () => {
    if (!newGuest.name.trim()) return;
    const g: Omit<GuestPlanning,'id'> = { name: newGuest.name, rsvp: newGuest.rsvp, seats: newGuest.seats };
    const created = await svc.addGuest(g);
    setGuests((p) => [created, ...p]);
    setNewGuest({ name: '', rsvp: 'pending', seats: 1 });
  };

  const handleBulkImport = async (parsedGuests: any[]) => {
    try {
      // 1. Filter out duplicates (by name)
      const existingNames = new Set(guests.map(g => g.name.trim().toLowerCase()));
      const uniqueNewGuests = parsedGuests.filter(g => !existingNames.has(g.nom.trim().toLowerCase()));

      if (uniqueNewGuests.length === 0) {
        alert("Tous les invités du fichier existent déjà dans votre liste.");
        setShowImportModal(false);
        return;
      }

      // 2. Prepare data
      const guestsData = uniqueNewGuests.map(g => {
        const statusStr = String(g.statut || '').toLowerCase();
        return {
          name: g.nom,
          rsvp: (statusStr.includes('conf') ? 'yes' : 
                 statusStr.includes('decl') ? 'no' : 'pending') as 'yes' | 'no' | 'pending',
          seats: g.etat === 'couple' ? 2 : 1,
          category: g.category || '',
          table: g.table || 'Non assigné',
          statut: statusStr.includes('conf') ? 'confirmed' : 
                  statusStr.includes('decl') ? 'declined' : 'pending'
        };
      });

      // 3. Bulk add
      await svc.bulkAddGuests(guestsData);
      const updatedGuests = await svc.listGuests();
      setGuests(updatedGuests);
      setShowImportModal(false);
      
      const skippedCount = parsedGuests.length - uniqueNewGuests.length;
      const message = skippedCount > 0 
        ? `${uniqueNewGuests.length} invités importés (${skippedCount} doublons ignorés).`
        : `${parsedGuests.length} invités ont été importés avec succès !`;
      
      alert(message);
    } catch (err) {
      console.error('Bulk import error:', err);
      alert("Une erreur est survenue lors de l'importation.");
    }
  };
  const createSlot = async () => {
    if (!newSlot.title.trim() || !newSlot.start || !newSlot.end) return;
    const s: Omit<ScheduleItem,'id'> = { title: newSlot.title, start: newSlot.start, end: newSlot.end, location: newSlot.location };
    const created = await svc.addSchedule(s);
    setSchedule((p) => [created, ...p]);
    setNewSlot({ title: '', start: '', end: '', location: '' });
  };

  const handleCloudinaryUpload = () => {
    if (!window.cloudinary) {
      alert('Le service Cloudinary n\'est pas disponible');
      return;
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: 'dogokmf6m',
        uploadPreset: 'Wedding',
        sources: ['local', 'url', 'camera'],
        showAdvancedOptions: false,
        cropping: false,
        multiple: true,
        defaultSource: 'local',
        styles: {
          palette: {
            window: '#FFFFFF',
            windowBorder: '#90A0B3',
            tabIcon: '#F59E0B',
            menuIcons: '#5A616A',
            textDark: '#000000',
            textLight: '#FFFFFF',
            link: '#F59E0B',
            action: '#F59E0B',
            inactiveTabIcon: '#0E2F5A',
            error: '#F44235',
            inProgress: '#F59E0B',
            complete: '#20B832',
            sourceBg: '#E4EBF1'
          }
        }
      },
      async (error: any, result: any) => {
        if (!error && result && result.event === "success") {
          const url = result.info.secure_url;
          const name = result.info.original_filename || 'Fichier sans nom';
          const type = result.info.resource_type || 'image';
          const f = await svc.addFile({ name, url, type });
          setFiles((p) => [f, ...p]);
        }
      }
    );

    widget.open();
  };

  const blockCard = (children: React.ReactNode) => (
    <div className="bg-white rounded-2xl shadow-luxury border border-neutral-200/50 p-4">
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Planning de l\'événement</h3>
        <div className="mt-3 sm:mt-0 flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button onClick={addQuickMilestone} className="px-3 py-2 rounded-lg text-white font-medium" style={{ background: `linear-gradient(to right, ${themePrimary}, ${themeSecondary})` }}>
            <Calendar className="h-5 w-5 inline mr-2" /> Ajouter un jalon
          </button>
          <button onClick={addQuickTask} className="px-3 py-2 rounded-lg text-white font-medium" style={{ background: `linear-gradient(to right, ${themePrimary}, ${themeSecondary})` }}>
            <CheckSquare className="h-5 w-5 inline mr-2" /> Ajouter une tâche
          </button>
          <button onClick={addQuickBudget} className="px-3 py-2 rounded-lg text-white font-medium" style={{ background: `linear-gradient(to right, ${themePrimary}, ${themeSecondary})` }}>
            <Wallet className="h-5 w-5 inline mr-2" /> Ajouter une dépense
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto whitespace-nowrap space-x-2 sm:flex-wrap sm:space-x-0 sm:gap-2">
        {[
          { key: 'planning', label: 'Jalons', Icon: Calendar },
          { key: 'tasks', label: 'Tâches', Icon: ClipboardList },
          { key: 'budget', label: 'Budget', Icon: Wallet },
          { key: 'vendors', label: 'Prestataires', Icon: Users },
          { key: 'guests', label: 'Invités', Icon: Users },
          { key: 'agenda', label: 'Agenda Jour J', Icon: MapPin },
          { key: 'files', label: 'Fichiers & Notes', Icon: FileText }
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActive(key as any)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border flex-shrink-0 ${active === key ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-neutral-200 text-slate-700'}`}
          >
            <Icon className="h-5 w-5 inline mr-2" /> {label}
          </button>
        ))}
      </div>

      {active === 'planning' && blockCard(
        <div>
          <h4 className="text-lg font-semibold mb-3">Jalons</h4>
          <div className="flex flex-wrap gap-2 mb-3">
            <input value={newMilestone.title} onChange={(e)=>setNewMilestone({...newMilestone,title:e.target.value})} placeholder="Titre" className="px-3 py-2 border rounded-lg" />
            <input type="date" value={newMilestone.date} onChange={(e)=>setNewMilestone({...newMilestone,date:e.target.value})} className="px-3 py-2 border rounded-lg" />
            <button onClick={createMilestone} className="px-3 py-2 rounded-lg text-white" style={{ background: `linear-gradient(to right, ${themePrimary}, ${themeSecondary})` }}>
              <Plus className="h-4 w-4 inline mr-2" /> Ajouter
            </button>
          </div>
          <div className="space-y-3">
            {milestones.map((m) => (
              <div key={m.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-xl border border-neutral-200/50">
                <div>
                  <p className="font-medium text-slate-900">{m.title}</p>
                  <p className="text-sm text-slate-600">{new Date(m.date).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="mt-3 sm:mt-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : m.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{m.status}</span>
                    <button onClick={() => setOpenMilestoneActionsId(openMilestoneActionsId === m.id ? null : m.id)} className="sm:hidden px-3 py-2 bg-neutral-100 text-slate-700 rounded-lg hover:bg-neutral-200 transition-all duration-200 font-medium text-sm">Actions</button>
                    <div className="hidden sm:flex items-center gap-2">
                      <button onClick={async()=>{await svc.updateMilestone(m.id,{status: m.status==='pending'?'in_progress':m.status==='in_progress'?'completed':'pending'}); setMilestones(prev=>prev.map(x=>x.id===m.id?{...x,status: m.status==='pending'?'in_progress':m.status==='in_progress'?'completed':'pending'}:x));}} className="p-2 rounded-lg hover:bg-neutral-100"><Save className="h-5 w-5" /></button>
                      <button onClick={async()=>{await svc.deleteMilestone(m.id); setMilestones(prev=>prev.filter(x=>x.id!==m.id));}} className="p-2 rounded-lg hover:bg-rose-50 text-rose-600"><Trash2 className="h-5 w-5" /></button>
                    </div>
                  </div>
                  {openMilestoneActionsId === m.id && (
                    <div className="sm:hidden mt-2 grid grid-cols-2 gap-2">
                      <button onClick={async()=>{await svc.updateMilestone(m.id,{status: m.status==='pending'?'in_progress':m.status==='in_progress'?'completed':'pending'}); setMilestones(prev=>prev.map(x=>x.id===m.id?{...x,status: m.status==='pending'?'in_progress':m.status==='in_progress'?'completed':'pending'}:x));}} className="bg-amber-100 text-amber-700 px-3 py-2 rounded-lg hover:bg-amber-200 transition-all duration-200 font-medium text-sm">Enregistrer</button>
                      <button onClick={async()=>{await svc.deleteMilestone(m.id); setMilestones(prev=>prev.filter(x=>x.id!==m.id));}} className="bg-rose-100 text-rose-700 px-3 py-2 rounded-lg hover:bg-rose-200 transition-all duration-200 font-medium text-sm">Supprimer</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {milestones.length === 0 && <p className="text-sm text-slate-500">Aucun jalon pour le moment</p>}
          </div>
        </div>
      )}

      {active === 'tasks' && blockCard(
        <div>
          <h4 className="text-lg font-semibold mb-3">Tâches</h4>
          <div className="flex flex-wrap gap-2 mb-3">
            <input value={newTask.title} onChange={(e)=>setNewTask({...newTask,title:e.target.value})} placeholder="Titre" className="px-3 py-2 border rounded-lg" />
            <input type="date" value={newTask.dueDate} onChange={(e)=>setNewTask({...newTask,dueDate:e.target.value})} className="px-3 py-2 border rounded-lg" />
            <select value={newTask.priority} onChange={(e)=>setNewTask({...newTask,priority:e.target.value as any})} className="px-3 py-2 border rounded-lg"><option value="low">Faible</option><option value="medium">Moyenne</option><option value="high">Haute</option></select>
            <button onClick={createTask} className="px-3 py-2 rounded-lg text-white" style={{ background: `linear-gradient(to right, ${themePrimary}, ${themeSecondary})` }}>
              <Plus className="h-4 w-4 inline mr-2" /> Ajouter
            </button>
          </div>
          <div className="space-y-3">
            {tasks.map((t) => (
              <div key={t.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-xl border border-neutral-200/50">
                <div>
                  <p className="font-medium text-slate-900">{t.title}</p>
                  {t.dueDate && <p className="text-sm text-slate-600">Échéance: {new Date(t.dueDate).toLocaleDateString('fr-FR')}</p>}
                </div>
                <div className="mt-3 sm:mt-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.status === 'done' ? 'bg-emerald-100 text-emerald-700' : t.status === 'doing' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{t.status}</span>
                    <button onClick={() => setOpenTaskActionsId(openTaskActionsId === t.id ? null : t.id)} className="sm:hidden px-3 py-2 bg-neutral-100 text-slate-700 rounded-lg hover:bg-neutral-200 transition-all duration-200 font-medium text-sm">Actions</button>
                    <div className="hidden sm:flex items-center gap-2">
                      <button onClick={async()=>{const next=t.status==='todo'?'doing':t.status==='doing'?'done':'todo'; await svc.updateTask(t.id,{status:next}); setTasks(prev=>prev.map(x=>x.id===t.id?{...x,status:next}:x));}} className="p-2 rounded-lg hover:bg-neutral-100"><Save className="h-5 w-5" /></button>
                      <button onClick={async()=>{await svc.deleteTask(t.id); setTasks(prev=>prev.filter(x=>x.id!==t.id));}} className="p-2 rounded-lg hover:bg-rose-50 text-rose-600"><Trash2 className="h-5 w-5" /></button>
                    </div>
                  </div>
                  {openTaskActionsId === t.id && (
                    <div className="sm:hidden mt-2 grid grid-cols-2 gap-2">
                      <button onClick={async()=>{const next=t.status==='todo'?'doing':t.status==='doing'?'done':'todo'; await svc.updateTask(t.id,{status:next}); setTasks(prev=>prev.map(x=>x.id===t.id?{...x,status:next}:x));}} className="bg-amber-100 text-amber-700 px-3 py-2 rounded-lg hover:bg-amber-200 transition-all duration-200 font-medium text-sm">Enregistrer</button>
                      <button onClick={async()=>{await svc.deleteTask(t.id); setTasks(prev=>prev.filter(x=>x.id!==t.id));}} className="bg-rose-100 text-rose-700 px-3 py-2 rounded-lg hover:bg-rose-200 transition-all duration-200 font-medium text-sm">Supprimer</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {tasks.length === 0 && <p className="text-sm text-slate-500">Aucune tâche pour le moment</p>}
          </div>
        </div>
      )}

      {active === 'budget' && blockCard(
        <div>
          <h4 className="text-lg font-semibold mb-3">Budget</h4>
          <div className="flex flex-wrap gap-2 mb-3">
            <input value={newBudget.label} onChange={(e)=>setNewBudget({...newBudget,label:e.target.value})} placeholder="Libellé" className="px-3 py-2 border rounded-lg" />
            <input value={newBudget.category} onChange={(e)=>setNewBudget({...newBudget,category:e.target.value})} placeholder="Catégorie" className="px-3 py-2 border rounded-lg" />
            <input type="number" value={newBudget.planned} onChange={(e)=>setNewBudget({...newBudget,planned:Number(e.target.value)})} placeholder="$ prévu" className="px-3 py-2 border rounded-lg w-28" />
            <button onClick={createBudget} className="px-3 py-2 rounded-lg text-white" style={{ background: `linear-gradient(to right, ${themePrimary}, ${themeSecondary})` }}>
              <Plus className="h-4 w-4 inline mr-2" /> Ajouter
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200"><p className="text-xs text-amber-700">Prévu</p><p className="text-lg font-bold text-amber-900">{fmtUSD(totals.planned)}</p></div>
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200"><p className="text-xs text-purple-700">Réel</p><p className="text-lg font-bold text-purple-900">{fmtUSD(totals.actual)}</p></div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200"><p className="text-xs text-emerald-700">Payé</p><p className="text-lg font-bold text-emerald-900">{fmtUSD(totals.paid)}</p></div>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200"><p className="text-xs text-rose-700">Restant</p><p className="text-lg font-bold text-rose-900">{fmtUSD(totals.remaining)}</p></div>
          </div>
          <div className="space-y-3">
            {budget.map((b) => (
              <div key={b.id} className="p-3 rounded-xl border border-neutral-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{b.label}</p>
                    <p className="text-xs text-slate-600">Catégorie: {b.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-700">Prévu: {fmtUSD(b.plannedAmount)}</p>
                    <div className="mt-1 flex items-center justify-end gap-2">
                      <input type="number" value={(editedBudget[b.id]?.actual ?? 0)} onChange={(e)=>setEditedBudget((prev)=>({ ...prev, [b.id]: { ...(prev[b.id]||{actual:0,paid:0}), actual: Number(e.target.value) } }))} className="px-2 py-1 border rounded-lg w-24 text-sm" placeholder="$ réel" />
                      <input type="number" value={(editedBudget[b.id]?.paid ?? 0)} onChange={(e)=>setEditedBudget((prev)=>({ ...prev, [b.id]: { ...(prev[b.id]||{actual:0,paid:0}), paid: Number(e.target.value) } }))} className="px-2 py-1 border rounded-lg w-24 text-sm" placeholder="$ payé" />
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setOpenBudgetActionsId(openBudgetActionsId === b.id ? null : b.id)} className="sm:hidden px-3 py-2 bg-neutral-100 text-slate-700 rounded-lg hover:bg-neutral-200 transition-all duration-200 font-medium text-sm">Actions</button>
                    <div className="hidden sm:flex items-center gap-2">
                      <button onClick={async()=>{const vals=editedBudget[b.id]||{actual:0,paid:0}; await svc.updateBudget(b.id,{ actualAmount: vals.actual, paidAmount: vals.paid });}} className="px-3 py-1 rounded-lg text-white text-xs" style={{ background: `linear-gradient(to right, ${themePrimary}, ${themeSecondary})` }}>
                        <Edit className="h-3 w-3 inline mr-1" /> Enregistrer
                      </button>
                      <button onClick={async()=>{await svc.deleteBudget(b.id); setBudget(prev=>prev.filter(x=>x.id!==b.id));}} className="px-3 py-1 rounded-lg text-rose-600 text-xs border border-rose-300">Supprimer</button>
                    </div>
                  </div>
                  {openBudgetActionsId === b.id && (
                    <div className="sm:hidden mt-2 grid grid-cols-2 gap-2">
                      <button onClick={async()=>{const vals=editedBudget[b.id]||{actual:0,paid:0}; await svc.updateBudget(b.id,{ actualAmount: vals.actual, paidAmount: vals.paid });}} className="bg-amber-100 text-amber-700 px-3 py-2 rounded-lg hover:bg-amber-200 transition-all duration-200 font-medium text-sm">Enregistrer</button>
                      <button onClick={async()=>{await svc.deleteBudget(b.id); setBudget(prev=>prev.filter(x=>x.id!==b.id));}} className="bg-rose-100 text-rose-700 px-3 py-2 rounded-lg hover:bg-rose-200 transition-all duration-200 font-medium text-sm">Supprimer</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {budget.length === 0 && <p className="text-sm text-slate-500">Aucune ligne de budget</p>}
          </div>
        </div>
      )}

      {active === 'vendors' && blockCard(
        <div>
          <h4 className="text-lg font-semibold mb-3">Prestataires</h4>
          <div className="flex flex-wrap gap-2 mb-3">
            <input value={newVendor.name} onChange={(e)=>setNewVendor({...newVendor,name:e.target.value})} placeholder="Nom" className="px-3 py-2 border rounded-lg" />
            <input value={newVendor.phone} onChange={(e)=>setNewVendor({...newVendor,phone:e.target.value})} placeholder="Téléphone" className="px-3 py-2 border rounded-lg" />
            <input value={newVendor.email} onChange={(e)=>setNewVendor({...newVendor,email:e.target.value})} placeholder="Email" className="px-3 py-2 border rounded-lg" />
            <button onClick={createVendor} className="px-3 py-2 rounded-lg text-white" style={{ background: `linear-gradient(to right, ${themePrimary}, ${themeSecondary})` }}>
              <Plus className="h-4 w-4 inline mr-2" /> Ajouter
            </button>
          </div>
          <div className="space-y-3">
            {vendors.map((v) => (
              <div key={v.id} className="p-3 rounded-xl border border-neutral-200/50">
                <p className="font-medium text-slate-900">{v.name}</p>
                <p className="text-sm text-slate-600">{v.phone} · {v.email}</p>
                <p className="text-xs text-slate-500">Réservé: {v.booked ? 'Oui' : 'Non'}</p>
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setOpenVendorActionsId(openVendorActionsId === v.id ? null : v.id)} className="sm:hidden px-3 py-2 bg-neutral-100 text-slate-700 rounded-lg hover:bg-neutral-200 transition-all duration-200 font-medium text-sm">Actions</button>
                    <div className="hidden sm:flex items-center gap-2">
                      <button onClick={async()=>{await svc.updateVendor(v.id,{booked: !v.booked}); setVendors(prev=>prev.map(x=>x.id===v.id?{...x,booked:!v.booked}:x));}} className="px-3 py-1 rounded-lg text-white text-xs" style={{ background: `linear-gradient(to right, ${themePrimary}, ${themeSecondary})` }}>
                        Réserver
                      </button>
                      <button onClick={async()=>{await svc.deleteVendor(v.id); setVendors(prev=>prev.filter(x=>x.id!==v.id));}} className="px-3 py-1 rounded-lg text-rose-600 text-xs border border-rose-300">Supprimer</button>
                    </div>
                  </div>
                  {openVendorActionsId === v.id && (
                    <div className="sm:hidden mt-2 grid grid-cols-2 gap-2">
                      <button onClick={async()=>{await svc.updateVendor(v.id,{booked: !v.booked}); setVendors(prev=>prev.map(x=>x.id===v.id?{...x,booked:!v.booked}:x));}} className="bg-amber-100 text-amber-700 px-3 py-2 rounded-lg hover:bg-amber-200 transition-all duration-200 font-medium text-sm">Réserver</button>
                      <button onClick={async()=>{await svc.deleteVendor(v.id); setVendors(prev=>prev.filter(x=>x.id!==v.id));}} className="bg-rose-100 text-rose-700 px-3 py-2 rounded-lg hover:bg-rose-200 transition-all duration-200 font-medium text-sm">Supprimer</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {vendors.length === 0 && <p className="text-sm text-slate-500">Aucun prestataire</p>}
          </div>
        </div>
      )}

      {active === 'guests' && blockCard(
        <div>
          <h4 className="text-lg font-semibold mb-3">Invités (planning)</h4>
          <div className="flex flex-wrap gap-2 mb-3">
            <input value={newGuest.name} onChange={(e)=>setNewGuest({...newGuest,name:e.target.value})} placeholder="Nom" className="px-3 py-2 border rounded-lg" />
            <select value={newGuest.rsvp} onChange={(e)=>setNewGuest({...newGuest,rsvp:e.target.value as any})} className="px-3 py-2 border rounded-lg"><option value="pending">En attente</option><option value="yes">Oui</option><option value="no">Non</option></select>
            <input type="number" value={newGuest.seats} onChange={(e)=>setNewGuest({...newGuest,seats:Number(e.target.value)})} placeholder="Places" className="px-3 py-2 border rounded-lg w-24" />
            <button onClick={createGuest} className="px-3 py-2 rounded-lg text-white" style={{ background: `linear-gradient(to right, ${themePrimary}, ${themeSecondary})` }}>
              <Plus className="h-4 w-4 inline mr-2" /> Ajouter
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-white text-slate-700 border border-neutral-300 px-3 py-2 rounded-lg hover:bg-neutral-50 transition-all duration-300 font-medium flex items-center shadow-sm"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Importer
            </button>
          </div>
          <GuestImportModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onImport={handleBulkImport}
            categories={[]}
            tables={[]}
          />
          <div className="space-y-3">
            {guests.map((g) => (
              <div key={g.id} className="p-3 rounded-xl border border-neutral-200/50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-slate-900">{g.name}</p>
                    <p className="text-sm text-slate-600">
                      RSVP: {g.rsvp || '—'} · Places: {g.seats || 1}
                      {g.category && ` · Catégorie: ${g.category}`}
                      {g.table && ` · Table: ${g.table}`}
                    </p>
                    {g.statut && (
                      <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        g.statut === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                        g.statut === 'declined' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {g.statut === 'confirmed' ? 'Confirmé' : g.statut === 'declined' ? 'Décliné' : 'En attente'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setOpenPlanningGuestActionsId(openPlanningGuestActionsId === g.id ? null : g.id)} className="sm:hidden px-3 py-2 bg-neutral-100 text-slate-700 rounded-lg hover:bg-neutral-200 transition-all duration-200 font-medium text-sm">Actions</button>
                    <div className="hidden sm:flex items-center gap-2">
                      <button onClick={async()=>{const next=g.rsvp==='pending'?'yes':g.rsvp==='yes'?'no':'pending'; await svc.updateGuest(g.id,{rsvp: next}); setGuests(prev=>prev.map(x=>x.id===g.id?{...x,rsvp:next}:x));}} className="px-3 py-1 rounded-lg text-white text-xs" style={{ background: `linear-gradient(to right, ${themePrimary}, ${themeSecondary})` }}>
                        Modifier RSVP
                      </button>
                      <button onClick={async()=>{await svc.deleteGuest(g.id); setGuests(prev=>prev.filter(x=>x.id!==g.id));}} className="px-3 py-1 rounded-lg text-rose-600 text-xs border border-rose-300">Supprimer</button>
                    </div>
                  </div>
                  {openPlanningGuestActionsId === g.id && (
                    <div className="sm:hidden mt-2 grid grid-cols-2 gap-2">
                      <button onClick={async()=>{const next=g.rsvp==='pending'?'yes':g.rsvp==='yes'?'no':'pending'; await svc.updateGuest(g.id,{rsvp: next}); setGuests(prev=>prev.map(x=>x.id===g.id?{...x,rsvp:next}:x));}} className="bg-amber-100 text-amber-700 px-3 py-2 rounded-lg hover:bg-amber-200 transition-all duration-200 font-medium text-sm">Modifier RSVP</button>
                      <button onClick={async()=>{await svc.deleteGuest(g.id); setGuests(prev=>prev.filter(x=>x.id!==g.id));}} className="bg-rose-100 text-rose-700 px-3 py-2 rounded-lg hover:bg-rose-200 transition-all duration-200 font-medium text-sm">Supprimer</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {guests.length === 0 && <p className="text-sm text-slate-500">Aucun invité enregistré ici</p>}
          </div>
        </div>
      )}

      {active === 'agenda' && blockCard(
        <div>
          <h4 className="text-lg font-semibold mb-3">Agenda du Jour J</h4>
          <div className="flex flex-wrap gap-2 mb-3">
            <input value={newSlot.title} onChange={(e)=>setNewSlot({...newSlot,title:e.target.value})} placeholder="Titre" className="px-3 py-2 border rounded-lg" />
            <input type="datetime-local" value={newSlot.start} onChange={(e)=>setNewSlot({...newSlot,start:e.target.value})} className="px-3 py-2 border rounded-lg" />
            <input type="datetime-local" value={newSlot.end} onChange={(e)=>setNewSlot({...newSlot,end:e.target.value})} className="px-3 py-2 border rounded-lg" />
            <input value={newSlot.location} onChange={(e)=>setNewSlot({...newSlot,location:e.target.value})} placeholder="Lieu" className="px-3 py-2 border rounded-lg" />
            <button onClick={createSlot} className="px-3 py-2 rounded-lg text-white" style={{ background: `linear-gradient(to right, ${themePrimary}, ${themeSecondary})` }}>
              <Plus className="h-4 w-4 inline mr-2" /> Ajouter
            </button>
          </div>
          <div className="space-y-3">
            {schedule.map((s) => (
              <div key={s.id} className="p-3 rounded-xl border border-neutral-200/50">
                <p className="font-medium text-slate-900">{s.title}</p>
                <p className="text-sm text-slate-600">{new Date(s.start).toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'})} - {new Date(s.end).toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'})} · {s.location}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={async()=>{await svc.deleteSchedule(s.id); setSchedule(prev=>prev.filter(x=>x.id!==s.id));}} className="px-3 py-1 rounded-lg text-rose-600 text-xs border border-rose-300">Supprimer</button>
                </div>
              </div>
            ))}
            {schedule.length === 0 && <p className="text-sm text-slate-500">Aucun créneau dans l'agenda</p>}
          </div>
        </div>
      )}

      {active === 'files' && blockCard(
        <div>
          <h4 className="text-lg font-semibold mb-3">Fichiers & Notes</h4>
          <div className="mb-4">
            <button
              onClick={handleCloudinaryUpload}
              className="flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all duration-300 font-medium"
            >
              <Upload className="h-5 w-5 mr-2" />
              Ajouter des fichiers
            </button>
          </div>
          <div className="space-y-3">
            {files.map((f) => (
              <div key={f.id} className="p-3 rounded-xl border border-neutral-200/50">
                <a href={f.url} target="_blank" rel="noreferrer" className="text-amber-700 font-medium">{f.name}</a>
                <p className="text-xs text-slate-500">{f.type}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={async()=>{await svc.deleteFile(f.id); setFiles(prev=>prev.filter(x=>x.id!==f.id));}} className="px-3 py-1 rounded-lg text-rose-600 text-xs border border-rose-300">Supprimer</button>
                </div>
              </div>
            ))}
            {files.length === 0 && <p className="text-sm text-slate-500">Aucun fichier pour le moment</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventPlanning;
