import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Pill,
  Bell,
  Activity,
  Heart,
  Settings,
  LogOut,
  HeartPulse,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/appointments', label: 'Citas', icon: Calendar },
  { to: '/medications', label: 'Medicamentos', icon: Pill },
  { to: '/routines', label: 'Rutinas', icon: Bell },
  { to: '/symptoms', label: 'Síntomas', icon: Activity },
  { to: '/wellness', label: 'Bienestar', icon: Heart },
  { to: '/settings', label: 'Configuración', icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();

  return (
    <aside className="theme-sidebar fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r backdrop-blur-xl lg:flex">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500">
          <HeartPulse className="h-5 w-5 text-white" />
        </div>
        <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
          Vitality
        </span>
      </div>

      {/* User */}
      <div className="mx-4 mb-6 flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3.5">
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt=""
            className="h-10 w-10 rounded-full object-cover ring-2 ring-cyan-500/30"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-sm font-semibold text-white">
            {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {user?.displayName || 'Usuario'}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-400">{user?.email}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 shadow-lg shadow-cyan-500/5'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => { logout().catch(() => {}); }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-5 w-5" />
          <span>Cerrar sesion</span>
        </button>
      </div>
    </aside>
  );
}
