import { create } from 'zustand';
import { Timestamp } from 'firebase/firestore';
import type { GamificationState } from '../types';
import { setDocument, getDocument } from '../services/firestore';

const ACHIEVEMENTS_DEF = [
  { id: 'first_appointment', label: 'Primera Cita', desc: 'Registraste tu primera cita', icon: '📅' },
  { id: 'first_med', label: 'Primer Medicamento', desc: 'Registraste tu primer medicamento', icon: '💊' },
  { id: 'first_symptom', label: 'Primer Registro', desc: 'Registraste tu primer síntoma', icon: '📝' },
  { id: 'streak_3', label: 'Racha de 3', desc: '3 días consecutivos activo', icon: '🔥' },
  { id: 'streak_7', label: 'Racha de 7', desc: '7 días consecutivos activo', icon: '⭐' },
  { id: 'streak_30', label: 'Racha de 30', desc: '30 días consecutivos activo', icon: '🏆' },
  { id: 'meds_10', label: '10 Medicamentos', desc: 'Tomaste 10 medicamentos a tiempo', icon: '💪' },
  { id: 'meds_50', label: '50 Medicamentos', desc: 'Tomaste 50 medicamentos a tiempo', icon: '🎯' },
  { id: 'breathing_5', label: 'Respirador', desc: '5 ejercicios de respiración', icon: '🧘' },
];

interface GamificationStore {
  state: GamificationState;
  achievementsDef: typeof ACHIEVEMENTS_DEF;
  loading: boolean;
  load: (userId: string) => Promise<void>;
  recordActivity: (userId: string) => Promise<void>;
  incrementMedsTaken: (userId: string) => Promise<void>;
  checkAndUnlock: (userId: string, achievementId: string) => Promise<void>;
}

const defaultState: GamificationState = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: '',
  totalMedsTaken: 0,
  totalAppointmentsKept: 0,
  totalSymptomsLogged: 0,
  achievements: [],
};

export const useGamificationStore = create<GamificationStore>((set, get) => ({
  state: defaultState,
  achievementsDef: ACHIEVEMENTS_DEF,
  loading: true,

  load: async (userId) => {
    const data = await getDocument(userId, 'gamification', 'state');
    if (data) {
      const { id: _, ...rest } = data;
      set({ state: { ...defaultState, ...rest } as GamificationState, loading: false });
    } else {
      await setDocument(userId, 'gamification', 'state', { ...defaultState });
      set({ state: defaultState, loading: false });
    }
  },

  recordActivity: async (userId) => {
    const { state } = get();
    const today = new Date().toISOString().split('T')[0];

    if (state.lastActiveDate === today) return;

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newStreak = state.lastActiveDate === yesterday ? state.currentStreak + 1 : 1;
    const longestStreak = Math.max(state.longestStreak, newStreak);

    const updated = {
      ...state,
      currentStreak: newStreak,
      longestStreak,
      lastActiveDate: today,
    };

    await setDocument(userId, 'gamification', 'state', updated);
    set({ state: updated });

    // Check streak achievements
    if (newStreak >= 3) await get().checkAndUnlock(userId, 'streak_3');
    if (newStreak >= 7) await get().checkAndUnlock(userId, 'streak_7');
    if (newStreak >= 30) await get().checkAndUnlock(userId, 'streak_30');
  },

  incrementMedsTaken: async (userId) => {
    const { state } = get();
    const updated = { ...state, totalMedsTaken: state.totalMedsTaken + 1 };
    await setDocument(userId, 'gamification', 'state', updated);
    set({ state: updated });

    if (updated.totalMedsTaken >= 10) await get().checkAndUnlock(userId, 'meds_10');
    if (updated.totalMedsTaken >= 50) await get().checkAndUnlock(userId, 'meds_50');
  },

  checkAndUnlock: async (userId, achievementId) => {
    const { state } = get();
    if (state.achievements.some((a) => a.id === achievementId)) return;

    const updated = {
      ...state,
      achievements: [
        ...state.achievements,
        { id: achievementId, unlockedAt: Timestamp.now(), seen: false },
      ],
    };

    await setDocument(userId, 'gamification', 'state', updated);
    set({ state: updated });
  },
}));
