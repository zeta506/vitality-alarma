import type { Timestamp } from 'firebase/firestore';

export interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  notes?: string;
  advanceNotified: boolean;
  alarmNotified: boolean;
  dismissed: boolean;
  createdAt: Timestamp;
}

export interface Medication {
  id: string;
  name: string;
  dosage?: string;
  frequency: 'daily' | 'weekly' | 'as-needed' | 'custom';
  times: string[];
  startDate: string;
  endDate?: string;
  active: boolean;
  createdAt: Timestamp;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  scheduledTime: string;
  takenAt: Timestamp | null;
  skipped: boolean;
  date: string;
}

export interface RoutineAlarm {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  intervalHours: number;
  triggerTimes: string[];
  active: boolean;
  notifiedTimes: string[];
  lastNotifiedDate?: string;
  createdAt: Timestamp;
}

export interface SymptomLog {
  id: string;
  date: string;
  time: string;
  mood: number;
  energy: number;
  pain: number;
  notes?: string;
  createdAt: Timestamp;
}

export interface Achievement {
  id: string;
  unlockedAt: Timestamp;
  seen: boolean;
}

export interface GamificationState {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  totalMedsTaken: number;
  totalAppointmentsKept: number;
  totalSymptomsLogged: number;
  achievements: Achievement[];
}

export interface UserSettings {
  theme: 'dark' | 'light';
  notificationsEnabled: boolean;
  fcmToken?: string;
  advanceMinutes: number;
}

export interface MedicalHistoryEntry {
  id: string;
  type: 'appointment' | 'diagnosis' | 'prescription' | 'note';
  title: string;
  description?: string;
  date: string;
  doctor?: string;
  createdAt: Timestamp;
}
