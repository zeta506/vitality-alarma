import { useState, useEffect, useRef, useCallback } from 'react';
import { Wind, Dumbbell, Play, Square, RotateCcw, Timer } from 'lucide-react';

// ---------- Breathing Exercise ----------

type BreathPhase = 'idle' | 'inhale' | 'hold' | 'exhale';

const PHASE_CONFIG: Record<Exclude<BreathPhase, 'idle'>, { label: string; duration: number; color: string }> = {
  inhale: { label: 'Inhalar', duration: 4000, color: 'text-cyan-400' },
  hold: { label: 'Sostener', duration: 7000, color: 'text-purple-400' },
  exhale: { label: 'Exhalar', duration: 8000, color: 'text-blue-400' },
};

const PHASE_ORDER: Exclude<BreathPhase, 'idle'>[] = ['inhale', 'hold', 'exhale'];

function BreathingExercise() {
  const [phase, setPhase] = useState<BreathPhase>('idle');
  const [cycles, setCycles] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseIndexRef = useRef(0);
  const runningRef = useRef(false);

  const stopExercise = useCallback(() => {
    runningRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setPhase('idle');
    setSeconds(0);
  }, []);

  const advancePhase = useCallback(() => {
    if (!runningRef.current) return;

    const idx = phaseIndexRef.current;
    const currentPhase = PHASE_ORDER[idx];
    setPhase(currentPhase);

    const { duration } = PHASE_CONFIG[currentPhase];
    const totalSec = Math.round(duration / 1000);
    setSeconds(totalSec);

    // countdown
    let remaining = totalSec;
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      remaining--;
      if (remaining >= 0) setSeconds(remaining);
    }, 1000);

    timeoutRef.current = setTimeout(() => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      phaseIndexRef.current = (idx + 1) % PHASE_ORDER.length;
      if (idx === PHASE_ORDER.length - 1) {
        setCycles((c) => c + 1);
      }
      advancePhase();
    }, duration);
  }, []);

  const startExercise = useCallback(() => {
    runningRef.current = true;
    phaseIndexRef.current = 0;
    setCycles(0);
    advancePhase();
  }, [advancePhase]);

  useEffect(() => {
    return () => {
      runningRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const isRunning = phase !== 'idle';

  // Circle scale based on phase
  const scale = phase === 'inhale' ? 'scale-100' : phase === 'hold' ? 'scale-100' : phase === 'exhale' ? 'scale-[0.6]' : 'scale-[0.6]';

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
        <Wind className="w-5 h-5 text-cyan-400" /> Ejercicio de respiracion (4-7-8)
      </h3>

      <div className="flex flex-col items-center py-8 gap-6">
        {/* Animated circle */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border-2 border-cyan-400/40 transition-transform ${
              phase === 'inhale' ? 'duration-[4000ms]' : phase === 'exhale' ? 'duration-[8000ms]' : 'duration-300'
            } ease-in-out ${scale}`}
          />
          <div className="relative z-10 text-center px-8">
            {isRunning ? (
              <>
                <p className={`text-xl font-semibold ${PHASE_CONFIG[phase as Exclude<BreathPhase, 'idle'>]?.color ?? 'text-white'}`}>
                  {PHASE_CONFIG[phase as Exclude<BreathPhase, 'idle'>]?.label ?? ''}
                </p>
                <p className="text-5xl font-bold text-white mt-2">{seconds}</p>
              </>
            ) : (
              <p className="text-slate-400 text-lg">Listo para empezar</p>
            )}
          </div>
        </div>

        {/* Cycles counter */}
        <p className="text-slate-400 text-sm mt-4">
          Ciclos completados: <span className="text-white font-semibold">{cycles}</span>
        </p>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-4">
          {!isRunning ? (
            <button
              onClick={startExercise}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors"
            >
              <Play className="w-5 h-5" /> Iniciar
            </button>
          ) : (
            <button
              onClick={stopExercise}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
            >
              <Square className="w-5 h-5" /> Detener
            </button>
          )}
          {cycles > 0 && !isRunning && (
            <button
              onClick={() => setCycles(0)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Reiniciar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Active Breaks ----------

const EXERCISES = [
  { id: 'arms', label: 'Estira los brazos', desc: 'Levanta los brazos por encima de la cabeza y mantenlos estirados.', emoji: '\u{1F4AA}' },
  { id: 'neck', label: 'Rota el cuello', desc: 'Gira la cabeza lentamente en circulos para liberar tension.', emoji: '\u{1F9D8}' },
  { id: 'walk', label: 'Camina 1 minuto', desc: 'Levantate y camina por la habitacion o el pasillo.', emoji: '\u{1F6B6}' },
  { id: 'back', label: 'Estira la espalda', desc: 'Inclinate hacia adelante y toca las puntas de tus pies.', emoji: '\u{1F9CD}' },
];

function ActiveBreakCard({ exercise }: { exercise: (typeof EXERCISES)[number] }) {
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = (seconds: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimer(seconds);
    setRunning(true);

    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setTimer(0);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-start gap-3">
        <span className="text-3xl">{exercise.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold">{exercise.label}</p>
          <p className="text-slate-400 text-sm mt-1">{exercise.desc}</p>

          {running ? (
            <div className="mt-3 flex items-center gap-3">
              <span className="text-2xl font-bold text-white tabular-nums">{formatTime(timer)}</span>
              <button
                onClick={stop}
                className="px-3 py-1 rounded-lg bg-red-600/30 text-red-400 hover:bg-red-600/50 text-sm transition-colors"
              >
                Detener
              </button>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => start(30)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm text-slate-300 transition-colors"
              >
                <Timer className="w-3 h-3" /> 30s
              </button>
              <button
                onClick={() => start(60)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm text-slate-300 transition-colors"
              >
                <Timer className="w-3 h-3" /> 60s
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Main ----------

export default function WellnessPage() {
  return (
    <div className="page-content space-y-8 animate-[fadeIn_0.4s_ease]">
      <BreathingExercise />

      <div>
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Dumbbell className="w-5 h-5 text-green-400" /> Pausas activas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {EXERCISES.map((ex) => (
            <ActiveBreakCard key={ex.id} exercise={ex} />
          ))}
        </div>
      </div>
    </div>
  );
}
