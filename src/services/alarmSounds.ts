// Synthesized alarm sounds inspired by classic alarm clock tones
// All sounds generated with Web Audio API — no external dependencies

export type AlarmSoundId = 'electronic' | 'classic' | 'military' | 'guitar' | 'alien';

export interface AlarmSoundOption {
  id: AlarmSoundId;
  name: string;
  description: string;
  icon: string;
}

export const ALARM_SOUNDS: AlarmSoundOption[] = [
  { id: 'electronic', name: 'Electrónica', description: 'Beep digital intenso', icon: '⚡' },
  { id: 'classic', name: 'Clásica', description: 'Timbre de reloj clásico', icon: '⏰' },
  { id: 'military', name: 'Trompeta Militar', description: 'Toque de diana urgente', icon: '🎺' },
  { id: 'guitar', name: 'Guitarra Heavy', description: 'Riff de guitarra eléctrica', icon: '🎸' },
  { id: 'alien', name: 'Espacial', description: 'Sirena futurista intensa', icon: '👾' },
];

let audioCtx: AudioContext | null = null;
let activeNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
let loopInterval: ReturnType<typeof setInterval> | null = null;

function getCtx(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function stopAllNodes() {
  activeNodes.forEach(({ osc, gain }) => {
    try {
      osc.stop();
      osc.disconnect();
      gain.disconnect();
    } catch { /* already stopped */ }
  });
  activeNodes = [];
}

function playNote(ctx: AudioContext, freq: number, startTime: number, duration: number, type: OscillatorType = 'square', volume = 0.5, detune = 0) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.015);
  gain.gain.setValueAtTime(volume, startTime + duration - 0.05);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration);
  activeNodes.push({ osc, gain });
}

// ─── ELECTRONIC: rapid digital beeps, escalating pitch ───
function playElectronic() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  // 4 rapid beep groups, each with 3 ascending beeps
  for (let group = 0; group < 4; group++) {
    const gt = t + group * 0.6;
    playNote(ctx, 1200, gt, 0.1, 'square', 0.6);
    playNote(ctx, 1500, gt + 0.12, 0.1, 'square', 0.6);
    playNote(ctx, 1800, gt + 0.24, 0.15, 'square', 0.7);
  }
}

// ─── CLASSIC: ring-ring like a mechanical alarm clock ───
function playClassic() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  // Simulated bell strikes — alternating frequencies like a double-bell
  for (let i = 0; i < 12; i++) {
    const freq = i % 2 === 0 ? 2200 : 2600;
    const start = t + i * 0.08;
    playNote(ctx, freq, start, 0.06, 'triangle', 0.5);
    // Add harmonic for metallic bell quality
    playNote(ctx, freq * 2.5, start, 0.04, 'sine', 0.15);
  }
  // Short pause then repeat
  for (let i = 0; i < 12; i++) {
    const freq = i % 2 === 0 ? 2200 : 2600;
    const start = t + 1.2 + i * 0.08;
    playNote(ctx, freq, start, 0.06, 'triangle', 0.5);
    playNote(ctx, freq * 2.5, start, 0.04, 'sine', 0.15);
  }
}

// ─── MILITARY: reveille trumpet call ───
function playMilitary() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  // Reveille-style notes (C-E-G pattern)
  const notes = [
    { f: 523, d: 0.15 }, // C5
    { f: 523, d: 0.15 }, // C5
    { f: 659, d: 0.3 },  // E5
    { f: 523, d: 0.15 }, // C5
    { f: 659, d: 0.15 }, // E5
    { f: 784, d: 0.4 },  // G5
    { f: 784, d: 0.15 }, // G5
    { f: 659, d: 0.15 }, // E5
    { f: 523, d: 0.15 }, // C5
    { f: 659, d: 0.15 }, // E5
    { f: 523, d: 0.5 },  // C5 (held)
  ];
  let offset = 0;
  notes.forEach(({ f, d }) => {
    // Brass-like: sawtooth + slight detuned copy
    playNote(ctx, f, t + offset, d - 0.02, 'sawtooth', 0.35);
    playNote(ctx, f, t + offset, d - 0.02, 'sawtooth', 0.2, 5);
    offset += d;
  });
}

// ─── GUITAR: heavy metal power chord riff ───
function playGuitar() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  // Distorted power chords — E5, G5, A5 pattern
  const chords = [
    { freqs: [164.8, 246.9, 329.6], start: 0, dur: 0.3 },      // E power chord
    { freqs: [164.8, 246.9, 329.6], start: 0.35, dur: 0.15 },   // E staccato
    { freqs: [196, 293.7, 392], start: 0.55, dur: 0.3 },        // G power chord
    { freqs: [220, 330, 440], start: 0.9, dur: 0.5 },           // A power chord (sustained)
    { freqs: [164.8, 246.9, 329.6], start: 1.5, dur: 0.2 },     // E hit
    { freqs: [164.8, 246.9, 329.6], start: 1.75, dur: 0.2 },    // E hit
  ];
  chords.forEach(({ freqs, start, dur }) => {
    freqs.forEach(f => {
      // Layer sawtooth waves for distortion effect
      playNote(ctx, f, t + start, dur, 'sawtooth', 0.2);
      playNote(ctx, f * 1.005, t + start, dur, 'sawtooth', 0.15); // slight detune
      playNote(ctx, f * 2, t + start, dur, 'square', 0.08); // octave up for bite
    });
  });
}

// ─── ALIEN: sci-fi siren with frequency sweeps ───
function playAlien() {
  const ctx = getCtx();
  const t = ctx.currentTime;

  // Sweeping siren oscillators
  for (let sweep = 0; sweep < 3; sweep++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    const st = t + sweep * 0.8;
    // Frequency sweep up then down
    osc.frequency.setValueAtTime(300, st);
    osc.frequency.linearRampToValueAtTime(1800, st + 0.4);
    osc.frequency.linearRampToValueAtTime(300, st + 0.8);

    gain.gain.setValueAtTime(0, st);
    gain.gain.linearRampToValueAtTime(0.4, st + 0.05);
    gain.gain.setValueAtTime(0.4, st + 0.7);
    gain.gain.linearRampToValueAtTime(0, st + 0.8);

    osc.start(st);
    osc.stop(st + 0.8);
    activeNodes.push({ osc, gain });
  }

  // Add pulsing high-freq beep overlay
  for (let i = 0; i < 8; i++) {
    playNote(ctx, 1600 + i * 100, t + i * 0.3, 0.12, 'square', 0.25);
  }
}

const SOUND_PLAYERS: Record<AlarmSoundId, () => void> = {
  electronic: playElectronic,
  classic: playClassic,
  military: playMilitary,
  guitar: playGuitar,
  alien: playAlien,
};

/** Play a single cycle of the specified alarm sound */
export function playSoundOnce(soundId: AlarmSoundId) {
  try {
    stopAllNodes();
    SOUND_PLAYERS[soundId]();
  } catch {
    // Web Audio not supported
  }
}

/** Start looping the alarm sound until stopLoopingSound() is called */
export function startLoopingSound(soundId: AlarmSoundId) {
  stopLoopingSound();
  // Play immediately
  playSoundOnce(soundId);
  // Loop every ~2.5 seconds
  loopInterval = setInterval(() => {
    stopAllNodes();
    SOUND_PLAYERS[soundId]();
  }, 2500);
}

/** Stop the looping alarm */
export function stopLoopingSound() {
  if (loopInterval) {
    clearInterval(loopInterval);
    loopInterval = null;
  }
  stopAllNodes();
}
