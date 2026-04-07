import { useState } from 'react';
import {
  BellRing,
  Clock,
  Volume2,
  Info,
  LogOut,
  Sun,
  Moon,
  Music,
  Play,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { playAlarmSound, stopAlarmSound, setAlarmSound, getAlarmSound, previewAlarmSound } from '../../services/alarmChecker';
import { ALARM_SOUNDS, type AlarmSoundId } from '../../services/alarmSounds';
import AchievementsPanel from '../gamification/AchievementsPanel';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [advanceMinutes, setAdvanceMinutes] = useState(60);
  const [testingAlarm, setTestingAlarm] = useState(false);
  const [selectedSound, setSelectedSound] = useState<AlarmSoundId>(getAlarmSound());

  const handleTestAlarm = () => {
    if (testingAlarm) {
      stopAlarmSound();
      setTestingAlarm(false);
      toast.success('Alarma detenida');
      return;
    }
    playAlarmSound(5000);
    setTestingAlarm(true);
    toast.success('Alarma de prueba sonando...');
    setTimeout(() => setTestingAlarm(false), 5000);
  };

  const handleNotificationToggle = () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    toast.success(next ? 'Notificaciones activadas' : 'Notificaciones desactivadas');
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sesion cerrada');
    } catch {
      toast.error('Error al cerrar sesion');
    }
  };

  return (
    <div className="page-content-narrow space-y-8 animate-[fadeIn_0.4s_ease]">
      {/* User info */}
      {user && (
        <div className="glass-card p-6 flex items-center gap-4">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt="avatar"
              className="w-14 h-14 rounded-full object-cover ring-2 ring-white/10"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-cyan-600 flex items-center justify-center text-white text-lg font-bold">
              {(user.displayName || user.email || 'U')[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white font-semibold truncate">{user.displayName || 'Usuario'}</p>
            <p className="text-slate-400 text-sm truncate mt-0.5">{user.email}</p>
          </div>
        </div>
      )}

      {/* Theme */}
      <div className="glass-card p-6">
        <h3 className="theme-text text-lg font-semibold flex items-center gap-2 mb-6">
          {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
          Apariencia
        </h3>
        <div className="flex items-center justify-between py-1">
          <span className="theme-text-muted text-sm">
            {theme === 'dark' ? 'Modo oscuro' : 'Modo claro'}
          </span>
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              theme === 'light' ? 'bg-amber-500' : 'bg-indigo-600'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                theme === 'light' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
          <BellRing className="w-5 h-5 text-amber-400" /> Notificaciones
        </h3>

        <div className="space-y-5">
          {/* Toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-300 text-sm">Habilitar notificaciones</span>
            <button
              onClick={handleNotificationToggle}
              aria-label={notificationsEnabled ? 'Desactivar notificaciones' : 'Activar notificaciones'}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                notificationsEnabled ? 'bg-cyan-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="border-t border-white/5" />

          {/* Advance reminder */}
          <div className="flex items-center justify-between gap-4 py-1">
            <div className="flex items-center gap-3 text-slate-300 text-sm">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Recordatorio previo</span>
            </div>
            <select
              value={advanceMinutes}
              onChange={(e) => {
                setAdvanceMinutes(Number(e.target.value));
                toast.success(`Recordatorio: ${e.target.value} minutos antes`);
              }}
              className="w-auto px-4 py-2.5 rounded-lg bg-slate-700 text-slate-200 border border-slate-600 text-sm"
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={60}>60 minutos</option>
            </select>
          </div>

          <div className="border-t border-white/5" />

          {/* Sound selector */}
          <div className="py-1">
            <div className="flex items-center gap-2 mb-3">
              <Music className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300 text-sm">Sonido de alarma</span>
            </div>
            <div className="grid gap-2">
              {ALARM_SOUNDS.map((sound) => (
                <div
                  key={sound.id}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    selectedSound === sound.id
                      ? 'bg-cyan-600/20 border border-cyan-500/40 ring-1 ring-cyan-500/20'
                      : 'bg-slate-700/50 border border-transparent hover:bg-slate-700'
                  }`}
                  onClick={() => {
                    setSelectedSound(sound.id);
                    setAlarmSound(sound.id);
                    toast.success(`Sonido: ${sound.name}`);
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg shrink-0">{sound.icon}</span>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium ${selectedSound === sound.id ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {sound.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{sound.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      previewAlarmSound(sound.id);
                    }}
                    className="shrink-0 p-2 rounded-lg bg-slate-600/50 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                    aria-label={`Escuchar ${sound.name}`}
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5" />

          {/* Test alarm */}
          <button
            onClick={handleTestAlarm}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium transition-colors ${
              testingAlarm
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            <Volume2 className="w-4 h-4" /> {testingAlarm ? 'Detener alarma' : 'Probar alarma'}
          </button>
        </div>
      </div>

      {/* Achievements */}
      <div className="glass-card p-6 mt-8">
        <AchievementsPanel />
      </div>

      {/* About */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-blue-400" /> Acerca de
        </h3>
        <p className="text-slate-400 text-sm">
          <span className="text-white font-semibold">Vitality</span> &mdash; Tu companero de salud integral.
        </p>
        <p className="text-slate-500 text-xs mt-2">Version 1.0.0</p>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full mt-8 py-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 font-semibold transition-colors flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" /> Cerrar sesion
      </button>

    </div>
  );
}
