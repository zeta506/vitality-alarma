import { useState, useMemo } from 'react';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useAuthStore } from '../../stores/authStore';
import { useSymptomStore } from '../../stores/symptomStore';
import { useGamificationStore } from '../../stores/gamificationStore';

const MOODS = [
  { value: 1, emoji: '\u{1F622}', label: 'Muy mal' },
  { value: 2, emoji: '\u{1F610}', label: 'Mal' },
  { value: 3, emoji: '\u{1F60A}', label: 'Normal' },
  { value: 4, emoji: '\u{1F604}', label: 'Bien' },
  { value: 5, emoji: '\u{1F929}', label: 'Excelente' },
];

const ENERGY_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

export default function SymptomsPage() {
  const user = useAuthStore((s) => s.user);
  const { symptoms, addSymptom } = useSymptomStore();
  const { recordActivity, checkAndUnlock } = useGamificationStore();

  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [pain, setPain] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const now = new Date();
      await addSymptom(user.uid, {
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        mood,
        energy,
        pain,
        ...(notes ? { notes } : {}),
      });
      await recordActivity(user.uid);
      await checkAndUnlock(user.uid, 'first_symptom');
      toast.success('Sintoma registrado');
      setNotes('');
    } catch {
      toast.error('Error al registrar');
    } finally {
      setSubmitting(false);
    }
  };

  // 7-day chart data
  const chartData = useMemo(() => {
    const days: { date: string; label: string; mood: number | null; energy: number | null; pain: number | null }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySymptoms = symptoms.filter((s) => s.date === dateStr);

      if (daySymptoms.length > 0) {
        const avgMood = Math.round(daySymptoms.reduce((s, x) => s + x.mood, 0) / daySymptoms.length);
        const avgEnergy = Math.round(daySymptoms.reduce((s, x) => s + x.energy, 0) / daySymptoms.length);
        const avgPain = Math.round(daySymptoms.reduce((s, x) => s + x.pain, 0) / daySymptoms.length);
        days.push({
          date: dateStr,
          label: d.toLocaleDateString('es-ES', { weekday: 'short' }),
          mood: avgMood,
          energy: avgEnergy,
          pain: avgPain,
        });
      } else {
        days.push({
          date: dateStr,
          label: d.toLocaleDateString('es-ES', { weekday: 'short' }),
          mood: null,
          energy: null,
          pain: null,
        });
      }
    }
    return days;
  }, [symptoms]);

  // Recent entries
  const recentEntries = useMemo(
    () => [...symptoms].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)).slice(0, 10),
    [symptoms],
  );

  return (
    <div className="page-content-narrow space-y-8 animate-[fadeIn_0.4s_ease] overflow-x-hidden">
      {/* Quick log form */}
      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
        {/* Mood */}
        <div>
          <label className="text-sm text-slate-400 block mb-3">Estado de animo</label>
          <div className="flex justify-between gap-1 sm:gap-3">
            {MOODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(m.value)}
                className={`flex flex-col items-center gap-1 p-2 sm:p-3 rounded-xl transition-all min-w-0 flex-1 ${
                  mood === m.value
                    ? 'bg-pink-500/20 ring-2 ring-pink-500 scale-105'
                    : 'hover:bg-slate-700/50'
                }`}
              >
                <span className="text-2xl sm:text-4xl leading-none">{m.emoji}</span>
                <span className="text-[10px] sm:text-xs text-slate-400 truncate">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Energy */}
        <div>
          <label className="text-sm text-slate-400 block mb-2">
            Energia: <span className="text-white font-semibold">{energy}/5</span>
          </label>
          <div className="my-4">
            <input
              type="range"
              min="1"
              max="5"
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="w-full accent-green-500 h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${ENERGY_COLORS[energy]} 0%, ${ENERGY_COLORS[energy]} ${((energy - 1) / 4) * 100}%, rgba(51,65,85,0.5) ${((energy - 1) / 4) * 100}%, rgba(51,65,85,0.5) 100%)`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Muy baja</span>
            <span>Muy alta</span>
          </div>
        </div>

        {/* Pain */}
        <div>
          <label className="text-sm text-slate-400 block mb-2">
            Dolor: <span className="text-white font-semibold">{pain}/10</span>
          </label>
          <div className="my-4">
            <input
              type="range"
              min="0"
              max="10"
              value={pain}
              onChange={(e) => setPain(Number(e.target.value))}
              className="w-full accent-red-500 h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(pain / 10) * 100}%, rgba(51,65,85,0.5) ${(pain / 10) * 100}%, rgba(51,65,85,0.5) 100%)`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Sin dolor</span>
            <span>Maximo</span>
          </div>
        </div>

        {/* Notes */}
        <textarea
          placeholder="Notas adicionales (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Registrando...' : 'Registrar sintoma'}
        </button>
      </form>

      {/* 7-day chart */}
      <div className="glass-card p-4 sm:p-6 mt-8 overflow-hidden">
        <h3 className="text-lg font-semibold text-white mb-4">Ultimos 7 dias</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 10]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#f8fafc',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="mood"
              name="Animo"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="energy"
              name="Energia"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="pain"
              name="Dolor"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* History */}
      {recentEntries.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Historial reciente</h3>
          <div className="space-y-3">
            {recentEntries.map((entry) => (
              <div key={entry.id} className="glass-card p-4 flex items-center gap-4">
                <span className="text-3xl">{MOODS.find((m) => m.value === entry.mood)?.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm">
                    {new Date(entry.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} &middot;{' '}
                    {entry.time}
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Energia: {entry.energy}/5 &middot; Dolor: {entry.pain}/10
                  </p>
                  {entry.notes && <p className="text-slate-500 text-xs mt-1 truncate">{entry.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
