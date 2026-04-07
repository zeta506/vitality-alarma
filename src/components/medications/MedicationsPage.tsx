import { useState, useMemo } from 'react';
import { Pill, Plus, Check, Clock, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { useMedicationStore } from '../../stores/medicationStore';
import { useGamificationStore } from '../../stores/gamificationStore';

export default function MedicationsPage() {
  const user = useAuthStore((s) => s.user);
  const {
    medications,
    logs,
    addMedication,
    deleteMedication,
    toggleMedication,
    logMedTaken,
  } = useMedicationStore();
  const { incrementMedsTaken, recordActivity } = useGamificationStore();

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'as-needed'>('daily');
  const [time, setTime] = useState('08:00');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Today schedule for daily meds
  const todaySchedule = useMemo(() => {
    const activeDailyMeds = medications.filter((m) => m.active && m.frequency === 'daily');
    const todayLogs = logs.filter((l) => l.date === today);

    const schedule: {
      medId: string;
      medName: string;
      dosage?: string;
      time: string;
      taken: boolean;
    }[] = [];

    activeDailyMeds.forEach((med) => {
      med.times.forEach((t) => {
        const taken = todayLogs.some(
          (l) => l.medicationId === med.id && l.scheduledTime === t && !l.skipped && l.takenAt !== null,
        );
        schedule.push({ medId: med.id, medName: med.name, dosage: med.dosage, time: t, taken });
      });
    });

    schedule.sort((a, b) => a.time.localeCompare(b.time));
    return schedule;
  }, [medications, logs, today]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name) return;

    setSubmitting(true);
    try {
      const times = frequency === 'daily' ? [time] : [];
      await addMedication(user.uid, {
        name,
        ...(dosage ? { dosage } : {}),
        frequency,
        times,
        startDate,
      });
      toast.success('Medicamento agregado');
      setName('');
      setDosage('');
      setTime('08:00');
    } catch (err) {
      console.error('[MedicationsPage] Error al agregar medicamento:', err);
      toast.error('Error al agregar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTaken = async (medId: string, scheduledTime: string) => {
    if (!user) return;
    try {
      await logMedTaken(user.uid, medId, scheduledTime, today);
      await incrementMedsTaken(user.uid);
      await recordActivity(user.uid);
      toast.success('Registrado como tomado');
    } catch (err) {
      console.error('[MedicationsPage] Error al registrar tomado:', err);
      toast.error('Error al registrar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteMedication(user.uid, id);
      toast.success('Medicamento eliminado');
    } catch (err) {
      console.error('[MedicationsPage] Error al eliminar:', err);
      toast.error('Error al eliminar');
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    if (!user) return;
    try {
      await toggleMedication(user.uid, id, !active);
      toast.success(active ? 'Medicamento pausado' : 'Medicamento activado');
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  return (
    <div className="page-content-narrow animate-[fadeIn_0.4s_ease]">
      {/* Form */}
      <form onSubmit={handleSubmit} className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5" /> Nuevo medicamento
        </h3>

        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-400">Nombre del medicamento</label>
            <input
              type="text"
              placeholder="Nombre del medicamento"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-400">Dosis (opcional)</label>
            <input
              type="text"
              placeholder="Ej. 500mg"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-400">Frecuencia</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value as typeof frequency)}>
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="as-needed">Segun necesidad</option>
              </select>
            </div>

            {frequency === 'daily' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-400">Hora</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-400">Fecha de inicio</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors disabled:opacity-50"
        >
          {submitting ? 'Guardando...' : 'Agregar medicamento'}
        </button>
      </form>

      {/* Today's schedule */}
      {todaySchedule.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">Horario de hoy</h3>
          <div className="space-y-3">
            {todaySchedule.map((item, i) => (
              <div
                key={`${item.medId}-${item.time}-${i}`}
                className={`glass-card p-4 flex items-center justify-between gap-4 ${item.taken ? 'border-green-500/30' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-400 text-sm w-12">{item.time}</span>
                  <div className="min-w-0">
                    <p className="text-white truncate">{item.medName}</p>
                    {item.dosage && <p className="text-slate-500 text-xs">{item.dosage}</p>}
                  </div>
                </div>

                {item.taken ? (
                  <span className="flex items-center gap-1 text-green-400 text-sm shrink-0">
                    <Check className="w-4 h-4" /> Tomado
                  </span>
                ) : (
                  <button
                    onClick={() => handleTaken(item.medId, item.time)}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-cyan-600/30 text-cyan-400 hover:bg-cyan-600/50 text-sm transition-colors"
                  >
                    Marcar tomado
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medications list */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-white mb-4">Todos los medicamentos</h3>
        {medications.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-12 text-slate-500">
            <Pill className="w-12 h-12 mb-3 opacity-40" />
            <p>No tienes medicamentos registrados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {medications.map((med) => (
              <div key={med.id} className={`glass-card p-4 flex items-center justify-between gap-4 ${!med.active ? 'opacity-50' : ''}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-semibold truncate">{med.name}</p>
                  <p className="text-slate-400 text-sm">
                    {med.dosage && `${med.dosage} · `}
                    {med.frequency === 'daily' ? 'Diario' : med.frequency === 'weekly' ? 'Semanal' : 'Segun necesidad'}
                    {med.times.length > 0 && ` · ${med.times.join(', ')}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(med.id, med.active)}
                    className="text-slate-400 hover:text-white transition-colors p-2"
                    title={med.active ? 'Pausar' : 'Activar'}
                  >
                    {med.active ? (
                      <ToggleRight className="w-6 h-6 text-cyan-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(med.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-2"
                    title="Eliminar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
