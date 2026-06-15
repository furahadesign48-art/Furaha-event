import { collection, addDoc, doc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface PlanningTask {
  id: string;
  title: string;
  status: 'todo'|'doing'|'done';
  priority: 'low'|'medium'|'high';
  dueDate: string | null;
  notes?: string;
}

export interface Milestone {
  id: string;
  title: string;
  date: string;
  status: 'pending'|'in_progress'|'completed';
  dependsOn: string[];
}

export interface BudgetItem {
  id: string;
  label: string;
  category: string;
  plannedAmount: number;
  actualAmount: number;
  paidAmount: number;
  vendorId: string | null;
  dueDate: string | null;
}

export interface Vendor {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  booked?: boolean;
  notes?: string;
}

export interface GuestPlanning {
  id: string;
  name: string;
  rsvp?: 'yes'|'no'|'pending';
  seats?: number;
  notes?: string;
  category?: string;
  table?: string;
  statut?: 'pending' | 'confirmed' | 'declined';
}

export interface ScheduleItem {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  owner?: string;
  notes?: string;
}

export class PlanningService {
  private basePath(userId: string, eventId: string) {
    return collection(db, 'users', userId, 'events', eventId, 'planning');
  }
  private tasksPath(userId: string, eventId: string) {
    return collection(db, 'users', userId, 'events', eventId, 'planning_tasks');
  }
  private milestonesPath(userId: string, eventId: string) {
    return collection(db, 'users', userId, 'events', eventId, 'planning_milestones');
  }
  private budgetPath(userId: string, eventId: string) {
    return collection(db, 'users', userId, 'events', eventId, 'planning_budget');
  }
  private vendorsPath(userId: string, eventId: string) {
    return collection(db, 'users', userId, 'events', eventId, 'planning_vendors');
  }
  private guestsPath(userId: string, eventId: string) {
    return collection(db, 'users', userId, 'events', eventId, 'planning_guests');
  }
  private schedulePath(userId: string, eventId: string) {
    return collection(db, 'users', userId, 'events', eventId, 'planning_schedule');
  }
  private filesPath(userId: string, eventId: string) {
    return collection(db, 'users', userId, 'events', eventId, 'planning_files');
  }

  constructor(private userId: string, private eventId: string) {}

  async ensureEventDoc() {
    const path = doc(db, 'users', this.userId, 'events', this.eventId);
    await setDoc(path, { id: this.eventId }, { merge: true });
  }

  async listTasks(): Promise<PlanningTask[]> {
    const snap = await getDocs(this.tasksPath(this.userId, this.eventId));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PlanningTask,'id'>) }));
  }
  async addTask(t: Omit<PlanningTask,'id'>): Promise<PlanningTask> {
    await this.ensureEventDoc();
    const ref = await addDoc(this.tasksPath(this.userId, this.eventId), t);
    return { id: ref.id, ...t };
  }
  async updateTask(id: string, t: Partial<PlanningTask>) {
    const ref = doc(db, 'users', this.userId, 'events', this.eventId, 'planning_tasks', id);
    await updateDoc(ref, t as any);
  }
  async deleteTask(id: string) {
    const ref = doc(db, 'users', this.userId, 'events', this.eventId, 'planning_tasks', id);
    await deleteDoc(ref);
  }

  async listMilestones(): Promise<Milestone[]> {
    const snap = await getDocs(this.milestonesPath(this.userId, this.eventId));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Milestone,'id'>) }));
  }
  async addMilestone(m: Omit<Milestone,'id'>): Promise<Milestone> {
    await this.ensureEventDoc();
    const ref = await addDoc(this.milestonesPath(this.userId, this.eventId), m);
    return { id: ref.id, ...m };
  }
  async updateMilestone(id: string, m: Partial<Milestone>) {
    const ref = doc(db, 'users', this.userId, 'events', this.eventId, 'planning_milestones', id);
    await updateDoc(ref, m as any);
  }
  async deleteMilestone(id: string) {
    const ref = doc(db, 'users', this.userId, 'events', this.eventId, 'planning_milestones', id);
    await deleteDoc(ref);
  }

  async listBudget(): Promise<BudgetItem[]> {
    const snap = await getDocs(this.budgetPath(this.userId, this.eventId));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BudgetItem,'id'>) }));
  }
  async addBudget(b: Omit<BudgetItem,'id'>): Promise<BudgetItem> {
    await this.ensureEventDoc();
    const ref = await addDoc(this.budgetPath(this.userId, this.eventId), b);
    return { id: ref.id, ...b };
  }
  async updateBudget(id: string, b: Partial<BudgetItem>) {
    const ref = doc(db, 'users', this.userId, 'events', this.eventId, 'planning_budget', id);
    await updateDoc(ref, b as any);
  }
  async deleteBudget(id: string) {
    const ref = doc(db, 'users', this.userId, 'events', this.eventId, 'planning_budget', id);
    await deleteDoc(ref);
  }

  async listVendors(): Promise<Vendor[]> {
    const snap = await getDocs(this.vendorsPath(this.userId, this.eventId));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Vendor,'id'>) }));
  }
  async addVendor(v: Omit<Vendor,'id'>): Promise<Vendor> {
    await this.ensureEventDoc();
    const ref = await addDoc(this.vendorsPath(this.userId, this.eventId), v);
    return { id: ref.id, ...v };
  }
  async updateVendor(id: string, v: Partial<Vendor>) {
    const ref = doc(db, 'users', this.userId, 'events', this.eventId, 'planning_vendors', id);
    await updateDoc(ref, v as any);
  }
  async deleteVendor(id: string) {
    const ref = doc(db, 'users', this.userId, 'events', this.eventId, 'planning_vendors', id);
    await deleteDoc(ref);
  }

  async listGuests(): Promise<GuestPlanning[]> {
    const snap = await getDocs(this.guestsPath(this.userId, this.eventId));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GuestPlanning,'id'>) }));
  }
  async addGuest(g: Omit<GuestPlanning,'id'>): Promise<GuestPlanning> {
    await this.ensureEventDoc();
    const ref = await addDoc(this.guestsPath(this.userId, this.eventId), g);
    return { id: ref.id, ...g };
  }
  async bulkAddGuests(guests: Omit<GuestPlanning, 'id'>[]): Promise<void> {
    try {
      const promises = guests.map(g => this.addGuest(g));
      await Promise.all(promises);
    } catch (error) {
      console.error('Erreur lors de l\'ajout massif d\'invités:', error);
      throw new Error('Impossible d\'ajouter les invités en masse');
    }
  }
  async updateGuest(id: string, g: Partial<GuestPlanning>) {
    const ref = doc(db, 'users', this.userId, 'events', this.eventId, 'planning_guests', id);
    await updateDoc(ref, g as any);
  }
  async deleteGuest(id: string) {
    const ref = doc(db, 'users', this.userId, 'events', this.eventId, 'planning_guests', id);
    await deleteDoc(ref);
  }

  async listSchedule(): Promise<ScheduleItem[]> {
    const snap = await getDocs(this.schedulePath(this.userId, this.eventId));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ScheduleItem,'id'>) }));
  }
  async addSchedule(s: Omit<ScheduleItem,'id'>): Promise<ScheduleItem> {
    await this.ensureEventDoc();
    const ref = await addDoc(this.schedulePath(this.userId, this.eventId), s);
    return { id: ref.id, ...s };
  }
  async updateSchedule(id: string, s: Partial<ScheduleItem>) {
    const ref = doc(db, 'users', this.userId, 'events', this.eventId, 'planning_schedule', id);
    await updateDoc(ref, s as any);
  }
  async deleteSchedule(id: string) {
    const ref = doc(db, 'users', this.userId, 'events', this.eventId, 'planning_schedule', id);
    await deleteDoc(ref);
  }

  async listFiles(): Promise<{ id: string; url: string; name: string; type: string }[]> {
    const snap = await getDocs(this.filesPath(this.userId, this.eventId));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  }
  async addFile(f: { url: string; name: string; type: string }): Promise<{ id: string; url: string; name: string; type: string }>{
    await this.ensureEventDoc();
    const ref = await addDoc(this.filesPath(this.userId, this.eventId), f as any);
    return { id: ref.id, ...f };
  }
  async deleteFile(id: string) {
    const ref = doc(db, 'users', this.userId, 'events', this.eventId, 'planning_files', id);
    await deleteDoc(ref);
  }
}
