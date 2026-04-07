import { useState, useMemo } from 'react';
import { MapPin, Trash2, Plus, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { useAppointmentStore } from '../../stores/appointmentStore';

export default function AppointmentsPage() {
  const user = useAuthStore((s) => s.user);
  const { appointments, addAppointment, deleteAppointment } = useAppointmentStore();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sorted = useMemo(
    () =>
      [...appointments].sort((a, b) => {
        const da = new Date(`${a.date}T${a.time}`).getTime();
        const db = new Date(`${b.date}T${b.time}`).getTime();
        return da - db;
      }),
    [appointments],
  );

  const now = new Date();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !date || !time) return;

    setSubmitting(true);
    try {
      await addAppointment(user.uid, { title, date, time, ...(location ? { location } : {}), ...(notes ? { notes } : {}) });
      toast.success('Cita agregada');
      setTitle('');
      setDate('');
      setTime('');
      setLocation('');
      setNotes('');
    } catch {
      toast.error('Error al agregar cita');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteAppointment(user.uid, id);
      toast.success('Cita eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="page-content-narrow animate-[fadeIn_0.4s_ease]">
      {/* Form */}
      <form onSubmit={handleSubmit} className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5" /> Nueva cita
        </h3>

        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-400">Titulo de la cita</label>
            <input
              type="text"
              placeholder="Titulo de la cita"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-400">Fecha</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-400">Hora</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-400">Ubicacion (opcional)</label>
            <input
              type="text"
              placeholder="Ubicacion"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-400">Notas (opcional)</label>
            <textarea
              placeholder="Notas"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors disabled:opacity-50"
        >
          {submitting ? 'Guardando...' : 'Agregar cita'}
        </button>
      </form>

      {/* List */}
      <div className="mt-8">
        {sorted.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-12 text-slate-500">
            <Calendar className="w-12 h-12 mb-3 opacity-40" />
            <p>No tienes citas registradas</p>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-white mb-4">Tus citas</h3>
            <div className="space-y-3">
              {sorted.map((appt) => {
                const dt = new Date(`${appt.date}T${appt.time}`);
                const isPast = dt < now;

                return (
                  <div
                    key={appt.id}
                    className={`glass-card p-4 flex items-start justify-between gap-4 ${isPast ? 'opacity-50' : ''}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-semibold truncate">{appt.title}</p>
                      <p className="text-slate-400 text-sm mt-1">
                        {dt.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}{' '}
                        &middot;{' '}
                        {dt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {appt.location && (
                        <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {appt.location}
                        </p>
                      )}
                      {appt.notes && <p className="text-slate-500 text-xs mt-1">{appt.notes}</p>}
                    </div>

                    <button
                      onClick={() => handleDelete(appt.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors shrink-0 p-2"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
