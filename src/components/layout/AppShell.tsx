import { useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import Header from './Header';
import VoiceButton from '../ui/VoiceButton';
import { parseVoiceInput } from '../../services/voiceInput';
import toast from 'react-hot-toast';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { useAppointmentStore } from '../../stores/appointmentStore';
import { useMedicationStore } from '../../stores/medicationStore';
import { useSymptomStore } from '../../stores/symptomStore';
import { useRoutineStore } from '../../stores/routineStore';
import { useGamificationStore } from '../../stores/gamificationStore';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/appointments': 'Citas Médicas',
  '/medications': 'Medicamentos',
  '/routines': 'Rutinas',
  '/symptoms': 'Síntomas',
  '/wellness': 'Bienestar',
  '/settings': 'Configuración',
};

export default function AppShell() {
  const { user } = useAuthStore();
  const location = useLocation();

  const subscribeAppointments = useAppointmentStore((s) => s.subscribe);
  const subscribeMedications = useMedicationStore((s) => s.subscribeMedications);
  const subscribeMedLogs = useMedicationStore((s) => s.subscribeLogs);
  const subscribeSymptoms = useSymptomStore((s) => s.subscribe);
  const subscribeRoutines = useRoutineStore((s) => s.subscribe);
  const loadGamification = useGamificationStore((s) => s.load);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubs = [
      subscribeAppointments(user.uid),
      subscribeMedications(user.uid),
      subscribeMedLogs(user.uid),
      subscribeSymptoms(user.uid),
      subscribeRoutines(user.uid),
    ];

    loadGamification(user.uid);

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [user?.uid, subscribeAppointments, subscribeMedications, subscribeMedLogs, subscribeSymptoms, subscribeRoutines, loadGamification]);

  const title = pageTitles[location.pathname] || 'Vitality';
  const navigate = useNavigate();
  const initTheme = useThemeStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  const handleVoiceResult = useCallback((transcript: string) => {
    const parsed = parseVoiceInput(transcript);
    toast.success(`🎤 "${transcript}"`, { duration: 3000 });

    if (parsed.type === 'appointment') {
      navigate('/appointments', { state: { voice: parsed } });
    } else if (parsed.type === 'medication') {
      navigate('/medications', { state: { voice: parsed } });
    } else if (parsed.type === 'symptom') {
      navigate('/symptoms', { state: { voice: parsed } });
    }
  }, [navigate]);

  return (
    <div className="theme-surface flex min-h-screen">
      <Sidebar />

      <div className="app-main flex flex-1 flex-col">
        <Header title={title} />

        <main className="flex-1 overflow-y-auto p-5 pb-28 lg:p-8 lg:pb-8">
          <Outlet />
        </main>

        <BottomNav />
        <VoiceButton onResult={handleVoiceResult} />
      </div>
    </div>
  );
}
