import { create } from 'zustand';
import { Timestamp } from 'firebase/firestore';
import type { SymptomLog } from '../types';
import { addDocument, subscribeToCollection } from '../services/firestore';

interface SymptomState {
  symptoms: SymptomLog[];
  loading: boolean;
  subscribe: (userId: string) => () => void;
  addSymptom: (userId: string, data: Omit<SymptomLog, 'id' | 'createdAt'>) => Promise<void>;
}

export const useSymptomStore = create<SymptomState>((set) => ({
  symptoms: [],
  loading: true,

  subscribe: (userId) => {
    set({ loading: true });
    return subscribeToCollection<SymptomLog>(userId, 'symptoms', (items) => {
      set({ symptoms: items, loading: false });
    });
  },

  addSymptom: async (userId, data) => {
    await addDocument(userId, 'symptoms', {
      ...data,
      createdAt: Timestamp.now(),
    });
  },
}));
