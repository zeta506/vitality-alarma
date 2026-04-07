import { create } from 'zustand';
import { Timestamp } from 'firebase/firestore';
import type { Medication, MedicationLog } from '../types';
import { addDocument, deleteDocument, updateDocument, subscribeToCollection } from '../services/firestore';

interface MedicationState {
  medications: Medication[];
  logs: MedicationLog[];
  loading: boolean;
  subscribeMedications: (userId: string) => () => void;
  subscribeLogs: (userId: string) => () => void;
  addMedication: (userId: string, data: Omit<Medication, 'id' | 'createdAt' | 'active'>) => Promise<void>;
  deleteMedication: (userId: string, id: string) => Promise<void>;
  toggleMedication: (userId: string, id: string, active: boolean) => Promise<void>;
  logMedTaken: (userId: string, medicationId: string, scheduledTime: string, date: string) => Promise<void>;
  logMedSkipped: (userId: string, medicationId: string, scheduledTime: string, date: string) => Promise<void>;
}

export const useMedicationStore = create<MedicationState>((set) => ({
  medications: [],
  logs: [],
  loading: true,

  subscribeMedications: (userId) => {
    set({ loading: true });
    return subscribeToCollection<Medication>(userId, 'medications', (items) => {
      set({ medications: items, loading: false });
    });
  },

  subscribeLogs: (userId) => {
    return subscribeToCollection<MedicationLog>(userId, 'medicationLogs', (items) => {
      set({ logs: items });
    });
  },

  addMedication: async (userId, data) => {
    console.log('[MedStore] addMedication called with:', JSON.stringify(data));
    await addDocument(userId, 'medications', {
      ...data,
      active: true,
      createdAt: Timestamp.now(),
    });
  },

  deleteMedication: async (userId, id) => {
    await deleteDocument(userId, 'medications', id);
  },

  toggleMedication: async (userId, id, active) => {
    await updateDocument(userId, 'medications', id, { active });
  },

  logMedTaken: async (userId, medicationId, scheduledTime, date) => {
    await addDocument(userId, 'medicationLogs', {
      medicationId,
      scheduledTime,
      date,
      takenAt: Timestamp.now(),
      skipped: false,
    });
  },

  logMedSkipped: async (userId, medicationId, scheduledTime, date) => {
    await addDocument(userId, 'medicationLogs', {
      medicationId,
      scheduledTime,
      date,
      takenAt: null,
      skipped: true,
    });
  },
}));
