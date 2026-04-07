import { create } from 'zustand';
import { Timestamp } from 'firebase/firestore';
import type { RoutineAlarm } from '../types';
import { addDocument, deleteDocument, updateDocument, subscribeToCollection } from '../services/firestore';

interface RoutineState {
  routines: RoutineAlarm[];
  loading: boolean;
  subscribe: (userId: string) => () => void;
  addRoutine: (userId: string, data: Omit<RoutineAlarm, 'id' | 'createdAt' | 'active' | 'notifiedTimes'>) => Promise<void>;
  deleteRoutine: (userId: string, id: string) => Promise<void>;
  toggleRoutine: (userId: string, id: string, active: boolean) => Promise<void>;
  markNotified: (userId: string, id: string, time: string, date: string) => Promise<void>;
}

export const useRoutineStore = create<RoutineState>((set, get) => ({
  routines: [],
  loading: true,

  subscribe: (userId) => {
    set({ loading: true });
    return subscribeToCollection<RoutineAlarm>(userId, 'routines', (items) => {
      set({ routines: items, loading: false });
    });
  },

  addRoutine: async (userId, data) => {
    await addDocument(userId, 'routines', {
      ...data,
      active: true,
      notifiedTimes: [],
      createdAt: Timestamp.now(),
    });
  },

  deleteRoutine: async (userId, id) => {
    await deleteDocument(userId, 'routines', id);
  },

  toggleRoutine: async (userId, id, active) => {
    await updateDocument(userId, 'routines', id, { active });
  },

  markNotified: async (userId, id, time, date) => {
    const routine = get().routines.find((r) => r.id === id);
    if (!routine) return;

    const notifiedTimes = routine.lastNotifiedDate === date
      ? [...routine.notifiedTimes, time]
      : [time];

    await updateDocument(userId, 'routines', id, {
      notifiedTimes,
      lastNotifiedDate: date,
    });
  },
}));
