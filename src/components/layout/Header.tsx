import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { user } = useAuthStore();
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const formattedTime = time.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = time.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="theme-header flex items-center justify-between border-b px-5 py-4 backdrop-blur-xl lg:px-8">
      <h1 className="theme-text text-lg font-semibold tracking-tight">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Clock */}
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium tabular-nums text-white">{formattedTime}</p>
          <p className="text-xs capitalize text-slate-400">{formattedDate}</p>
        </div>

        {/* Avatar (mobile) */}
        <div className="lg:hidden">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              className="h-8 w-8 rounded-full object-cover ring-2 ring-cyan-500/30"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-xs font-semibold text-white">
              {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
