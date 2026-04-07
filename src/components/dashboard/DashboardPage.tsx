import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  CalendarClock,
  Pill,
  Lightbulb,
  ArrowRight,
  Calendar,
  Bell,
  Activity,
  Heart,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useAppointmentStore } from '../../stores/appointmentStore';
import { useMedicationStore } from '../../stores/medicationStore';
import { useSymptomStore } from '../../stores/symptomStore';
import { useGamificationStore } from '../../stores/gamificationStore';

// ---------- helpers ----------
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos dias';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const MOOD_EMOJI = ['', '\u{1F622}', '\u{1F610}', '\u{1F60A}', '\u{1F604}', '\u{1F929}'];
const MOOD_LABEL = ['', 'Muy mal', 'Mal', 'Normal', 'Bien', 'Excelente'];

// ---------- sub-cards ----------

function WelcomeCard() {
  const user = useAuthStore((s) => s.user);
  const name = user?.displayName?.split(' ')[0] || 'usuario';

  return (
    <div className="glass-card col-span-full p-6 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug">
        {getGreeting()}, {name}
      </h1>
      <p className="text-slate-400 mt-2 capitalize text-sm md:text-base leading-relaxed tracking-wide">
        {formatDate(new Date())}
      </p>
    </div>
  );
}

function StreakCard() {
  const { currentStreak, longestStreak } = useGamificationStore((s) => s.state);
  const pct = longestStreak > 0 ? Math.min((currentStreak / longestStreak) * 100, 100) : 0;
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="glass-card p-6 flex items-center gap-5">
      {/* progress ring */}
      <svg width="100" height="100" className="shrink-0">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          className="transition-all duration-700"
        />
        <text x="50" y="46" textAnchor="middle" className="fill-white text-2xl font-bold" fontSize="22">
          {currentStreak}
        </text>
        <text x="50" y="64" textAnchor="middle" className="fill-slate-400" fontSize="10">
          dias
        </text>
      </svg>

      <div className="space-y-1">
        <p className="text-lg font-semibold text-white flex items-center gap-2.5 leading-snug tracking-tight">
          <Flame className="w-5 h-5 text-orange-400 shrink-0" /> Racha actual
        </p>
        <p className="text-slate-400 text-sm leading-relaxed">{currentStreak} dias consecutivos</p>
        <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">Record: {longestStreak} dias</p>
      </div>
    </div>
  );
}

function MedComplianceCard() {
  const medications = useMedicationStore((s) => s.medications);
  const logs = useMedicationStore((s) => s.logs);

  const today = new Date().toISOString().split('T')[0];
  const activeMeds = medications.filter((m) => m.active && m.frequency === 'daily');

  const totalScheduled = activeMeds.reduce((sum, m) => sum + m.times.length, 0);
  const takenToday = logs.filter(
    (l) => l.date === today && !l.skipped && l.takenAt !== null,
  ).length;

  const pct = totalScheduled > 0 ? Math.round((takenToday / totalScheduled) * 100) : 0;
  const isComplete = pct === 100 && totalScheduled > 0;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">💊</span>
        <h3 className="font-semibold text-white tracking-tight leading-snug">Medicamentos hoy</h3>
      </div>

      <div className="border-b border-white/5 pb-4 mb-4">
        <p className="text-3xl font-bold text-white leading-tight tracking-tight">
          {takenToday} <span className="text-lg text-slate-400 font-normal">/ {totalScheduled}</span>
        </p>
      </div>

      <div className="w-full h-2.5 bg-slate-700/60 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-cyan-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-400 mt-2 leading-relaxed">{pct}% completado</p>
    </div>
  );
}

function UpcomingCard() {
  const appointments = useAppointmentStore((s) => s.appointments);
  const medications = useMedicationStore((s) => s.medications);

  type UpcomingItem = { key: string; label: string; datetime: Date; type: 'appointment' | 'medication' };

  const items = useMemo<UpcomingItem[]>(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const list: UpcomingItem[] = [];

    appointments.forEach((a) => {
      const dt = new Date(`${a.date}T${a.time}`);
      if (dt >= now) {
        list.push({ key: `a-${a.id}`, label: a.title, datetime: dt, type: 'appointment' });
      }
    });

    medications
      .filter((m) => m.active && m.frequency === 'daily')
      .forEach((m) => {
        m.times.forEach((t) => {
          const dt = new Date(`${today}T${t}`);
          if (dt >= now) {
            list.push({ key: `m-${m.id}-${t}`, label: m.name, datetime: dt, type: 'medication' });
          }
        });
      });

    list.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
    return list.slice(0, 3);
  }, [appointments, medications]);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">📅</span>
        <h3 className="font-semibold text-white tracking-tight leading-snug">Proximos eventos</h3>
      </div>

      {items.length === 0 ? (
        <p className="text-slate-500 text-sm leading-relaxed">No hay eventos proximos</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.key} className="flex items-center gap-3 text-sm py-1">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.type === 'appointment' ? 'bg-purple-400' : 'bg-cyan-400'}`}
              />
              <span className="text-white truncate flex-1 leading-relaxed">{item.label}</span>
              <span className="text-slate-400 text-xs whitespace-nowrap tracking-wide">
                {item.datetime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MoodSummaryCard() {
  const symptoms = useSymptomStore((s) => s.symptoms);

  const stats = useMemo(() => {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const recent = symptoms.filter((s) => s.date >= weekAgo);
    if (recent.length === 0) return null;

    const avgMood = recent.reduce((sum, s) => sum + s.mood, 0) / recent.length;
    const avgEnergy = recent.reduce((sum, s) => sum + s.energy, 0) / recent.length;
    const avgPain = recent.reduce((sum, s) => sum + s.pain, 0) / recent.length;

    // Tendencia: comparar primera mitad vs segunda mitad
    const mid = Math.floor(recent.length / 2);
    const firstHalf = recent.slice(0, mid || 1);
    const secondHalf = recent.slice(mid || 1);
    const firstAvg = firstHalf.reduce((s, e) => s + e.mood, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, e) => s + e.mood, 0) / secondHalf.length;
    const trend = secondAvg > firstAvg + 0.3 ? 'up' : secondAvg < firstAvg - 0.3 ? 'down' : 'stable';

    const today = new Date().toISOString().split('T')[0];
    const todayEntry = [...symptoms].reverse().find((s) => s.date === today);

    return { avgMood, avgEnergy, avgPain, trend, count: recent.length, todayEntry };
  }, [symptoms]);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧠</span>
          <h3 className="font-semibold text-white tracking-tight leading-snug">Estado de ánimo</h3>
        </div>
        <Link to="/symptoms" className="text-cyan-400 hover:text-cyan-300 text-xs transition-colors">
          Ver todo →
        </Link>
      </div>

      {stats ? (
        <div className="space-y-3">
          {/* Hoy */}
          {stats.todayEntry && (
            <div className="flex items-center gap-3 pb-3 border-b border-white/5">
              <span className="text-3xl leading-none">{MOOD_EMOJI[stats.todayEntry.mood]}</span>
              <div>
                <p className="text-white text-sm font-medium">{MOOD_LABEL[stats.todayEntry.mood]}</p>
                <p className="text-slate-400 text-xs">Hoy</p>
              </div>
            </div>
          )}

          {/* Métricas 7 días */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-cyan-400">{stats.avgMood.toFixed(1)}</p>
              <p className="text-slate-400 text-xs mt-0.5">Ánimo</p>
              <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1.5">
                <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: `${(stats.avgMood / 5) * 100}%` }} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-400">{stats.avgEnergy.toFixed(1)}</p>
              <p className="text-slate-400 text-xs mt-0.5">Energía</p>
              <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1.5">
                <div className="bg-green-400 h-1.5 rounded-full" style={{ width: `${(stats.avgEnergy / 5) * 100}%` }} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-400">{stats.avgPain.toFixed(1)}</p>
              <p className="text-slate-400 text-xs mt-0.5">Dolor</p>
              <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1.5">
                <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${(stats.avgPain / 10) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Tendencia */}
          <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
            <span>{stats.trend === 'up' ? '📈' : stats.trend === 'down' ? '📉' : '➡️'}</span>
            <span>
              {stats.trend === 'up' ? 'Tu ánimo está mejorando' : stats.trend === 'down' ? 'Tu ánimo ha bajado' : 'Tu ánimo se mantiene estable'}
              {' · '}{stats.count} registro{stats.count !== 1 ? 's' : ''} esta semana
            </span>
          </div>
        </div>
      ) : (
        <Link
          to="/symptoms"
          className="flex items-center gap-2.5 text-cyan-400 hover:text-cyan-300 text-sm transition-colors leading-relaxed"
        >
          Registra cómo te sientes para ver métricas <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

function AISuggestionsCard() {
  const medications = useMedicationStore((s) => s.medications);
  const logs = useMedicationStore((s) => s.logs);
  const appointments = useAppointmentStore((s) => s.appointments);
  const { currentStreak } = useGamificationStore((s) => s.state);

  const tips = useMemo<{ icon: React.ReactNode; text: string }[]>(() => {
    const result: { icon: React.ReactNode; text: string }[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Check missed meds
    const activeDailyMeds = medications.filter((m) => m.active && m.frequency === 'daily');
    const todayLogs = logs.filter((l) => l.date === today && !l.skipped && l.takenAt !== null);
    const totalScheduled = activeDailyMeds.reduce((s, m) => s + m.times.length, 0);
    const pending = totalScheduled - todayLogs.length;

    if (pending > 0) {
      result.push({
        icon: <Pill className="w-4 h-4 text-cyan-400" />,
        text: `Tienes ${pending} medicamento${pending > 1 ? 's' : ''} pendiente${pending > 1 ? 's' : ''} hoy.`,
      });
    }

    // Upcoming appointments in next 24h
    const now = Date.now();
    const soonAppts = appointments.filter((a) => {
      const dt = new Date(`${a.date}T${a.time}`).getTime();
      return dt > now && dt - now < 86_400_000;
    });
    if (soonAppts.length > 0) {
      result.push({
        icon: <CalendarClock className="w-4 h-4 text-purple-400" />,
        text: `Tienes ${soonAppts.length} cita${soonAppts.length > 1 ? 's' : ''} en las proximas 24 horas.`,
      });
    }

    // Streak motivation
    if (currentStreak >= 7) {
      result.push({
        icon: <Flame className="w-4 h-4 text-orange-400" />,
        text: `Increible! Llevas ${currentStreak} dias seguidos. Sigue asi!`,
      });
    } else if (currentStreak >= 3) {
      result.push({
        icon: <Flame className="w-4 h-4 text-orange-400" />,
        text: `Buena racha de ${currentStreak} dias. No la rompas!`,
      });
    } else {
      result.push({
        icon: <Lightbulb className="w-4 h-4 text-yellow-400" />,
        text: 'Registra tu actividad diaria para construir una racha.',
      });
    }

    return result.slice(0, 3);
  }, [medications, logs, appointments, currentStreak]);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">💡</span>
        <h3 className="font-semibold text-white tracking-tight leading-snug">Sugerencias</h3>
      </div>
      <ul className="space-y-3.5">
        {tips.map((tip, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed">
            <span className="mt-0.5 shrink-0">{tip.icon}</span>
            <span>{tip.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const quickActions = [
  { to: '/appointments', label: 'Nueva cita', icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { to: '/medications', label: 'Medicamento', icon: Pill, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { to: '/routines', label: 'Rutina', icon: Bell, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { to: '/symptoms', label: 'Síntomas', icon: Activity, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  { to: '/wellness', label: 'Bienestar', icon: Heart, color: 'text-red-400', bg: 'bg-red-500/10' },
];

function QuickActionsCard() {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">⚡</span>
        <h3 className="font-semibold text-white tracking-tight leading-snug">Acceso rápido</h3>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {quickActions.map(({ to, label, icon: Icon, color, bg }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all hover:scale-[1.02] ${bg} ${color}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ---------- main ----------

export default function DashboardPage() {
  return (
    <div className="page-content grid grid-cols-1 md:grid-cols-2 gap-5 animate-[fadeIn_0.4s_ease]">
      <WelcomeCard />
      <StreakCard />
      <MedComplianceCard />
      <UpcomingCard />
      <MoodSummaryCard />
      <AISuggestionsCard />
      <QuickActionsCard />
    </div>
  );
}
