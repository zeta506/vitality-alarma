import { addDays, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, nextSaturday, nextSunday } from 'date-fns';

interface ParsedVoiceInput {
  type: 'appointment' | 'medication' | 'symptom' | 'unknown';
  title?: string;
  date?: string;
  time?: string;
  mood?: number;
  energy?: number;
  pain?: number;
  raw: string;
}

const dayMap: Record<string, (date: Date) => Date> = {
  'lunes': nextMonday,
  'martes': nextTuesday,
  'miércoles': nextWednesday,
  'miercoles': nextWednesday,
  'jueves': nextThursday,
  'viernes': nextFriday,
  'sábado': nextSaturday,
  'sabado': nextSaturday,
  'domingo': nextSunday,
};

const hourWords: Record<string, number> = {
  'una': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
  'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
  'once': 11, 'doce': 12,
};

const moodWords: Record<string, number> = {
  'terrible': 1, 'muy mal': 1, 'pésimo': 1, 'pesimo': 1,
  'mal': 2, 'regular': 2,
  'normal': 3, 'bien': 3, 'ok': 3,
  'muy bien': 4, 'genial': 4, 'contento': 4,
  'excelente': 5, 'increíble': 5, 'increible': 5, 'perfecto': 5, 'feliz': 5,
};

export function parseVoiceInput(transcript: string): ParsedVoiceInput {
  const text = transcript.toLowerCase().trim();

  // Detect type
  if (text.includes('me siento') || text.includes('ánimo') || text.includes('animo') || text.includes('dolor') || text.includes('energía') || text.includes('energia')) {
    return parseSymptom(text);
  }

  if (text.includes('medicamento') || text.includes('medicina') || text.includes('tomar') || text.includes('pastilla')) {
    return parseMedication(text);
  }

  if (text.includes('cita') || text.includes('doctor') || text.includes('médico') || text.includes('medico') || text.includes('consulta')) {
    return parseAppointment(text);
  }

  // Default: try as appointment
  return parseAppointment(text);
}

function parseAppointment(text: string): ParsedVoiceInput {
  const result: ParsedVoiceInput = { type: 'appointment', raw: text };

  // Extract title: text before time/date keywords
  const titleMatch = text.match(/(?:cita\s+(?:con\s+)?(?:el\s+)?|consulta\s+(?:con\s+)?(?:el\s+)?|doctor\s+)(.+?)(?:\s+el\s+|\s+a\s+las?\s+|\s+mañana|\s+hoy|$)/i);
  if (titleMatch) {
    result.title = titleMatch[1].trim();
  }

  result.date = extractDate(text);
  result.time = extractTime(text);

  return result;
}

function parseMedication(text: string): ParsedVoiceInput {
  const result: ParsedVoiceInput = { type: 'medication', raw: text };

  const nameMatch = text.match(/(?:tomar|medicamento|medicina|pastilla)\s+(.+?)(?:\s+a\s+las?\s+|\s+cada\s+|$)/i);
  if (nameMatch) {
    result.title = nameMatch[1].trim();
  }

  result.time = extractTime(text);

  return result;
}

function parseSymptom(text: string): ParsedVoiceInput {
  const result: ParsedVoiceInput = { type: 'symptom', raw: text };

  // Check mood words
  for (const [word, value] of Object.entries(moodWords)) {
    if (text.includes(word)) {
      result.mood = value;
      break;
    }
  }

  // Check pain
  const painMatch = text.match(/dolor\s+(?:de\s+)?(\d+)/);
  if (painMatch) {
    result.pain = Math.min(10, parseInt(painMatch[1]));
  } else if (text.includes('sin dolor') || text.includes('no me duele')) {
    result.pain = 0;
  } else if (text.includes('mucho dolor')) {
    result.pain = 8;
  } else if (text.includes('poco dolor')) {
    result.pain = 3;
  }

  // Check energy
  if (text.includes('mucha energía') || text.includes('mucha energia')) result.energy = 5;
  else if (text.includes('buena energía') || text.includes('buena energia')) result.energy = 4;
  else if (text.includes('energía normal') || text.includes('energia normal')) result.energy = 3;
  else if (text.includes('poca energía') || text.includes('poca energia')) result.energy = 2;
  else if (text.includes('sin energía') || text.includes('sin energia') || text.includes('cansado')) result.energy = 1;

  return result;
}

function extractDate(text: string): string | undefined {
  const today = new Date();

  if (text.includes('hoy')) {
    return formatDate(today);
  }

  if (text.includes('mañana') || text.includes('manana')) {
    return formatDate(addDays(today, 1));
  }

  if (text.includes('pasado mañana') || text.includes('pasado manana')) {
    return formatDate(addDays(today, 2));
  }

  // Day of week
  for (const [day, nextFn] of Object.entries(dayMap)) {
    if (text.includes(day)) {
      return formatDate(nextFn(today));
    }
  }

  // Explicit date: "25 de marzo", "el 25"
  const dateMatch = text.match(/(?:el\s+)?(\d{1,2})\s+de\s+(\w+)/);
  if (dateMatch) {
    const dayNum = parseInt(dateMatch[1]);
    const monthName = dateMatch[2];
    const monthMap: Record<string, number> = {
      'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
      'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11,
    };
    const month = monthMap[monthName];
    if (month !== undefined) {
      const date = new Date(today.getFullYear(), month, dayNum);
      if (date < today) date.setFullYear(date.getFullYear() + 1);
      return formatDate(date);
    }
  }

  return undefined;
}

function extractTime(text: string): string | undefined {
  // "a las 3 de la tarde" / "a las 15" / "a las tres"
  const timeMatch = text.match(/a\s+las?\s+(\w+)(?:\s+y\s+(\w+))?(?:\s+de\s+la\s+(mañana|manana|tarde|noche))?/);
  if (timeMatch) {
    let hour = hourWords[timeMatch[1]] ?? parseInt(timeMatch[1]);
    if (isNaN(hour)) return undefined;

    const minutes = timeMatch[2] ? (hourWords[timeMatch[2]] ?? parseInt(timeMatch[2]) ?? 0) : 0;
    const period = timeMatch[3];

    if (period === 'tarde' && hour < 12) hour += 12;
    if (period === 'noche' && hour < 12) hour += 12;
    if ((period === 'mañana' || period === 'manana') && hour === 12) hour = 0;

    return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  // Direct time format "14:30"
  const directTime = text.match(/(\d{1,2}):(\d{2})/);
  if (directTime) {
    return `${directTime[1].padStart(2, '0')}:${directTime[2]}`;
  }

  return undefined;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
