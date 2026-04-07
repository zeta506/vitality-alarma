import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Pill,
  Activity,
  MoreHorizontal,
} from 'lucide-react';

const tabs = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/appointments', label: 'Citas', icon: Calendar, end: false },
  { to: '/medications', label: 'Meds', icon: Pill, end: false },
  { to: '/symptoms', label: 'Síntomas', icon: Activity, end: false },
  { to: '/settings', label: 'Más', icon: MoreHorizontal, end: false },
];

export default function BottomNav() {
  return (
    <nav className="theme-sidebar fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-around pb-[env(safe-area-inset-bottom)] px-1">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                isActive ? 'text-cyan-400' : 'text-slate-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                    isActive ? 'bg-cyan-500/10' : ''
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
