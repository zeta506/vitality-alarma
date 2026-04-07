import type { Appointment, Medication, MedicationLog, SymptomLog, GamificationState } from '../types';

export interface Suggestion {
  icon: string;
  message: string;
  priority: number;
}

export function generateSuggestions(
  appointments: Appointment[],
  medications: Medication[],
  logs: MedicationLog[],
  symptoms: SymptomLog[],
  gamification: GamificationState
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Check upcoming appointments
  const tomorrowApts = appointments.filter((a) => a.date === tomorrowStr);
  if (tomorrowApts.length > 0) {
    suggestions.push({
      icon: '📅',
      message: `Mañana tienes ${tomorrowApts.length} cita(s). Sal con tiempo de anticipación.`,
      priority: 1,
    });
  }

  // Check today's appointments
  const todayApts = appointments.filter((a) => a.date === todayStr && !a.dismissed);
  if (todayApts.length > 0) {
    suggestions.push({
      icon: '⏰',
      message: `Tienes ${todayApts.length} cita(s) hoy. ¡No las olvides!`,
      priority: 1,
    });
  }

  // Check medication compliance this week
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const weekLogs = logs.filter((l) => l.date >= weekAgo);
  const activeMeds = medications.filter((m) => m.active);
  const expectedPerDay = activeMeds.reduce((sum, m) => sum + m.times.length, 0);
  const expectedWeek = expectedPerDay * 7;
  const takenThisWeek = weekLogs.filter((l) => l.takenAt !== null).length;
  const missedThisWeek = weekLogs.filter((l) => l.skipped).length;

  if (missedThisWeek > 0) {
    suggestions.push({
      icon: '💊',
      message: `Olvidaste ${missedThisWeek} medicamento(s) esta semana. Intenta poner alarmas adicionales.`,
      priority: 2,
    });
  } else if (expectedWeek > 0 && takenThisWeek === expectedWeek) {
    suggestions.push({
      icon: '🌟',
      message: '¡Semana perfecta con tus medicamentos! Sigue así.',
      priority: 3,
    });
  }

  // Check medication not taken today
  const todayLogs = logs.filter((l) => l.date === todayStr);
  const todayPending = activeMeds.filter((med) =>
    med.times.some((time) => {
      const [h, m] = time.split(':').map(Number);
      const medTime = new Date(today);
      medTime.setHours(h, m, 0, 0);
      return medTime < today && !todayLogs.some(
        (l) => l.medicationId === med.id && l.scheduledTime === time
      );
    })
  );

  if (todayPending.length > 0) {
    suggestions.push({
      icon: '⚠️',
      message: `Tienes ${todayPending.length} medicamento(s) pendiente(s) de hoy.`,
      priority: 1,
    });
  }

  // Symptom trends
  const recentSymptoms = symptoms
    .filter((s) => s.date >= weekAgo)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (recentSymptoms.length >= 3) {
    const lastThree = recentSymptoms.slice(-3);
    const moodTrend = lastThree[2].mood - lastThree[0].mood;

    if (moodTrend < -1) {
      suggestions.push({
        icon: '🧘',
        message: 'Tu ánimo ha bajado últimamente. Prueba un ejercicio de respiración.',
        priority: 2,
      });
    } else if (moodTrend > 1) {
      suggestions.push({
        icon: '😊',
        message: '¡Tu ánimo va mejorando! Sigue con tus buenos hábitos.',
        priority: 3,
      });
    }
  }

  if (symptoms.length === 0) {
    suggestions.push({
      icon: '📝',
      message: 'Registra cómo te sientes para hacer seguimiento de tu bienestar.',
      priority: 3,
    });
  }

  // Streak motivation
  if (gamification.currentStreak > 0) {
    const nextMilestone = [3, 7, 14, 30].find((m) => m > gamification.currentStreak);
    if (nextMilestone) {
      const remaining = nextMilestone - gamification.currentStreak;
      suggestions.push({
        icon: '🔥',
        message: `¡Racha de ${gamification.currentStreak} días! Solo ${remaining} más para el logro de ${nextMilestone} días.`,
        priority: 3,
      });
    }
  }

  // Sort by priority and return top 3
  return suggestions.sort((a, b) => a.priority - b.priority).slice(0, 3);
}
