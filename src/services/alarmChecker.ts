import type { Appointment, Medication, MedicationLog, RoutineAlarm } from '../types';
import toast from 'react-hot-toast';
import { startLoopingSound, stopLoopingSound, playSoundOnce, type AlarmSoundId } from './alarmSounds';

let alarmTimeout: ReturnType<typeof setTimeout> | null = null;
let currentSoundId: AlarmSoundId = 'electronic';

/** Set the active alarm sound */
export function setAlarmSound(soundId: AlarmSoundId) {
  currentSoundId = soundId;
}

/** Get the active alarm sound */
export function getAlarmSound(): AlarmSoundId {
  return currentSoundId;
}

/** Preview a sound (single play, no loop) */
export function previewAlarmSound(soundId: AlarmSoundId) {
  playSoundOnce(soundId);
}

export function playAlarmSound(durationMs = 15000) {
  try {
    startLoopingSound(currentSoundId);

    if (alarmTimeout) clearTimeout(alarmTimeout);
    alarmTimeout = setTimeout(() => {
      stopAlarmSound();
    }, durationMs);
  } catch {
    // Fallback
    playSoundOnce(currentSoundId);
  }
}

export function stopAlarmSound() {
  stopLoopingSound();
  if (alarmTimeout) {
    clearTimeout(alarmTimeout);
    alarmTimeout = null;
  }
}

function showNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    });
  }
}

export function checkAppointmentAlarms(
  appointments: Appointment[],
  advanceMinutes: number,
  onMarkNotified: (id: string, field: 'advanceNotified' | 'alarmNotified') => void
) {
  const now = new Date();
  const currentTime = now.getTime();

  appointments.forEach((apt) => {
    if (apt.dismissed) return;

    const aptDate = new Date(`${apt.date}T${apt.time}`);
    const aptTime = aptDate.getTime();
    const advanceTime = aptTime - advanceMinutes * 60 * 1000;

    // Advance notification
    if (!apt.advanceNotified && currentTime >= advanceTime && currentTime < aptTime) {
      toast(`📅 ${apt.title} - en ${advanceMinutes} minutos`, {
        duration: 10000,
        style: { background: '#1e293b', color: '#f8fafc', border: '1px solid rgba(245,158,11,0.5)' },
      });
      showNotification('Recordatorio de Cita', `${apt.title} en ${advanceMinutes} minutos`);
      onMarkNotified(apt.id, 'advanceNotified');
    }

    // Alarm notification
    if (!apt.alarmNotified && currentTime >= aptTime && currentTime < aptTime + 60000) {
      toast(`🔔 ¡Es hora! ${apt.title}`, {
        duration: 30000,
        style: { background: '#1e293b', color: '#f8fafc', border: '1px solid rgba(239,68,68,0.5)' },
      });
      playAlarmSound();
      showNotification('¡Hora de tu cita!', apt.title);
      onMarkNotified(apt.id, 'alarmNotified');
    }
  });
}

export function checkMedicationAlarms(
  medications: Medication[],
  logs: MedicationLog[],
  _advanceMinutes: number,
  onNotify: (medName: string, time: string) => void
) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentHH = String(now.getHours()).padStart(2, '0');
  const currentMM = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHH}:${currentMM}`;

  medications.forEach((med) => {
    if (!med.active) return;

    med.times.forEach((time) => {
      // Check if already taken/logged today at this time
      const alreadyLogged = logs.some(
        (l) => l.medicationId === med.id && l.date === todayStr && l.scheduledTime === time
      );
      if (alreadyLogged) return;

      if (time === currentTime && now.getSeconds() < 5) {
        toast(`💊 ¡Hora de tomar ${med.name}!`, {
          duration: 30000,
          style: { background: '#1e293b', color: '#f8fafc', border: '1px solid rgba(168,85,247,0.5)' },
        });
        playAlarmSound();
        showNotification('Medicamento', `Hora de tomar ${med.name}`);
        onNotify(med.name, time);
      }
    });
  });
}

export function checkRoutineAlarms(
  routines: RoutineAlarm[],
  onMarkNotified: (id: string, time: string, date: string) => void
) {
  const now = new Date();
  const currentHH = String(now.getHours()).padStart(2, '0');
  const currentMM = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHH}:${currentMM}`;
  const todayStr = now.toISOString().split('T')[0];

  if (now.getSeconds() !== 0) return;

  routines.forEach((routine) => {
    if (!routine.active) return;

    const alreadyNotified = routine.lastNotifiedDate === todayStr &&
      routine.notifiedTimes.includes(currentTime);

    if (routine.triggerTimes.includes(currentTime) && !alreadyNotified) {
      toast(`🔔 ${routine.label}`, {
        duration: 15000,
        style: { background: '#1e293b', color: '#f8fafc', border: '1px solid rgba(59,130,246,0.5)' },
      });
      playAlarmSound();
      showNotification(routine.label, `Alarma rutinaria: ${currentTime}`);
      onMarkNotified(routine.id, currentTime, todayStr);
    }
  });
}

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
