import { create } from 'zustand';
import { Timestamp } from 'firebase/firestore';
import type { Appointment } from '../types';
import { addDocument, deleteDocument, updateDocument, subscribeToCollection } from '../services/firestore';

interface AppointmentState {
  appointments: Appointment[];
  loading: boolean;
  subscribe: (userId: string) => () => void;
  addAppointment: (userId: string, data: Omit<Appointment, 'id' | 'createdAt' | 'advanceNotified' | 'alarmNotified' | 'dismissed'>) => Promise<void>;
  deleteAppointment: (userId: string, id: string) => Promise<void>;
  markNotified: (userId: string, id: string, field: 'advanceNotified' | 'alarmNotified' | 'dismissed') => Promise<void>;
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
  appointments: [],
  loading: true,

  subscribe: (userId: string) => {
    set({ loading: true });
    return subscribeToCollection<Appointment>(userId, 'appointments', (items) => {
      set({ appointments: items, loading: false });
    });
  },

  addAppointment: async (userId, data) => {
    await addDocument(userId, 'appointments', {
      ...data,
      advanceNotified: false,
      alarmNotified: false,
      dismissed: false,
      createdAt: Timestamp.now(),
    });
  },

  deleteAppointment: async (userId, id) => {
    await deleteDocument(userId, 'appointments', id);
  },

  markNotified: async (userId, id, field) => {
    await updateDocument(userId, 'appointments', id, { [field]: true });
  },
}));
