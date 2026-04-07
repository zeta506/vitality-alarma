import type { ReactNode } from 'react';
import { useAuthStore } from '../../stores/authStore';
import LoginPage from './LoginPage';
import { HeartPulse } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, initialized } = useAuthStore();

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500">
            <HeartPulse className="h-9 w-9 text-white" />
          </div>
          <div className="h-1 w-32 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-[shimmer_1.5s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-cyan-500 to-teal-500" />
          </div>
          <p className="text-sm text-slate-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
