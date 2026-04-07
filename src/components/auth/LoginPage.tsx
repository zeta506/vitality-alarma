import { useState } from 'react';
import { HeartPulse, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { signInWithGoogle, signInWithEmail, signUpWithEmail, loading, error, clearError } =
    useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (tab === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
    } catch {
      // Error is handled by the auth store's error state
    }
  };

  const switchTab = (t: 'login' | 'register') => {
    setTab(t);
    clearError();
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 px-4">
      {/* Animated background shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 animate-pulse rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-1/2 -right-32 h-80 w-80 animate-pulse rounded-full bg-purple-500/10 blur-3xl [animation-delay:1s]" />
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 animate-pulse rounded-full bg-teal-500/10 blur-3xl [animation-delay:2s]" />
        <div className="absolute top-1/4 left-1/2 h-64 w-64 animate-pulse rounded-full bg-blue-500/8 blur-3xl [animation-delay:1.5s]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 shadow-lg shadow-cyan-500/25">
            <HeartPulse className="h-9 w-9 text-white" />
          </div>
          <h1 className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            Vitality
          </h1>
          <p className="text-sm text-slate-400">Tu salud, bajo control</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          {/* Tabs */}
          <div className="mb-6 flex rounded-xl bg-white/5 p-1">
            <button
              type="button"
              onClick={() => switchTab('login')}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                tab === 'login'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Iniciar Sesion
            </button>
            <button
              type="button"
              onClick={() => switchTab('register')}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                tab === 'register'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                placeholder="Correo electronico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contrasena"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40 disabled:opacity-50"
            >
              {loading
                ? 'Cargando...'
                : tab === 'login'
                  ? 'Iniciar Sesion'
                  : 'Crear Cuenta'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-slate-500">o continuar con</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={() => { signInWithGoogle().catch(() => {}); }}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </button>
        </div>
      </div>
    </div>
  );
}
