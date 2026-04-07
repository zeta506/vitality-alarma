import { useState } from 'react';
import { Bell, Plus, Trash2, Pause, Play, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { useRoutineStore } from '../../stores/routineStore';

function generateTriggerTimes(startTime: string, endTime: string, intervalHours: number): string[] {
  const times: string[] = [];
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);

  let currentMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  const intervalMinutes = intervalHours * 60;

  while (currentMinutes <= endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    currentMinutes += intervalMinutes;
  }

  return times;
}

export default function RoutinesPage() {
  const user = useAuthStore((s) => s.user);
  const { routines, addRoutine, deleteRoutine, toggleRoutine } = useRoutineStore();

  const [label, setLabel] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('22:00');
  const [interval, setInterval] = useState('2');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !label) return;

    const intervalHours = parseFloat(interval);
    if (isNaN(intervalHours) || intervalHours <= 0) {
      toast.error('Intervalo invalido');
      return;
    }

    const triggerTimes = generateTriggerTimes(startTime, endTime, intervalHours);
    if (triggerTimes.length === 0) {
      toast.error('No se generaron horarios con estos parametros');
      return;
    }

    setSubmitting(true);
    try {
      await addRoutine(user.uid, {
        label,
        startTime,
        endTime,
        intervalHours,
        triggerTimes,
      });
      toast.success('Rutina creada');
      setLabel('');
    } catch {
      toast.error('Error al crear rutina');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteRoutine(user.uid, id);
      toast.success('Rutina eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    if (!user) return;
    try {
      await toggleRoutine(user.uid, id, !active);
      toast.success(active ? 'Rutina pausada' : 'Rutina reanudada');
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  return (
    <div className="page-content-narrow animate-[fadeIn_0.4s_ease]">
      {/* Form */}
      <form onSubmit={handleSubmit} className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5" /> Nueva rutina
        </h3>

        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-400">Nombre de la rutina</label>
            <input
              type="text"
              placeholder="Ej. Tomar agua"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-400">Hora inicio</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-400">Hora fin</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-400">Intervalo (horas)</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Preview */}
          {label && (
            <div className="p-3 rounded-lg bg-slate-800/50 border border-white/5">
              <p className="text-xs text-slate-400 mb-1">Vista previa de horarios:</p>
              <p className="text-sm text-white">
                {generateTriggerTimes(startTime, endTime, parseFloat(interval) || 1).join(', ') || 'Sin horarios'}
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors disabled:opacity-50"
        >
          {submitting ? 'Guardando...' : 'Crear rutina'}
        </button>
      </form>

      {/* List */}
      <div className="mt-8">
        {routines.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-12 text-slate-500">
            <Bell className="w-12 h-12 mb-3 opacity-40" />
            <p>No tienes rutinas configuradas</p>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-white mb-4">Tus rutinas</h3>
            <div className="space-y-3">
              {routines.map((routine) => (
                <div
                  key={routine.id}
                  className={`glass-card p-4 ${!routine.active ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-semibold">{routine.label}</p>
                      <p className="text-slate-400 text-sm mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {routine.startTime} - {routine.endTime} &middot; cada {routine.intervalHours}h
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {routine.triggerTimes.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-md bg-amber-600/20 text-amber-400 text-xs"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggle(routine.id, routine.active)}
                        className="text-slate-400 hover:text-white transition-colors p-2"
                        title={routine.active ? 'Pausar' : 'Reanudar'}
                      >
                        {routine.active ? (
                          <Pause className="w-5 h-5 text-amber-400" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(routine.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-2"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
