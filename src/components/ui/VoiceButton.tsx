import { useState, useRef } from 'react';
import { Mic, Square } from 'lucide-react';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
    SpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

interface VoiceButtonProps {
  onResult: (transcript: string) => void;
  disabled?: boolean;
}

export default function VoiceButton({ onResult, disabled = false }: VoiceButtonProps) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef('');
  const manualStopRef = useRef(false);

  function handleClick() {
    if (listening) {
      // Stop and process
      manualStopRef.current = true;
      recognitionRef.current?.stop();
      return;
    }

    // Start
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    transcriptRef.current = '';
    manualStopRef.current = false;

    const recognition = new SR();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.continuous = true;

    recognition.onstart = () => {
      // already set below
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let full = '';
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript + ' ';
      }
      transcriptRef.current = full.trim();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Permiso de micrófono denegado. Habilitalo en la configuración del navegador.');
        setListening(false);
        recognitionRef.current = null;
      } else if (event.error === 'aborted') {
        // User stopped manually, handled in onend
      } else if (event.error === 'network') {
        // Network error - speech API needs internet. Keep listening state, onend will handle
        console.warn('Speech API necesita conexión a internet');
      }
      // For other errors, let onend handle cleanup
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;

      if (transcriptRef.current) {
        onResult(transcriptRef.current);
        transcriptRef.current = '';
      }
    };

    recognitionRef.current = recognition;

    // Set listening immediately so UI responds
    setListening(true);

    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setListening(false);
    }
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 lg:bottom-6 lg:right-6 flex flex-col items-center gap-2">
      {listening && (
        <div className="whitespace-nowrap rounded-lg bg-red-500 px-4 py-1.5 text-xs font-semibold text-white shadow-lg animate-pulse">
          Escuchando... toca para enviar
        </div>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all disabled:opacity-50 ${
          listening
            ? 'bg-red-500 shadow-red-500/40 scale-110 animate-pulse'
            : 'bg-gradient-to-br from-cyan-500 to-teal-500 shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105'
        }`}
        aria-label={listening ? 'Detener y enviar' : 'Iniciar grabación de voz'}
      >
        {listening ? (
          <Square className="h-5 w-5 text-white" fill="white" />
        ) : (
          <Mic className="h-6 w-6 text-white" />
        )}
      </button>
    </div>
  );
}
