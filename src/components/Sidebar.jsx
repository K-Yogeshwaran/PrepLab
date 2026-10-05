import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Compass,
  Calculator,
  BookOpen,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Play,
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import { useSupabaseConnection } from '../hooks/useSupabaseConnection';

export default function Sidebar() {
  const { status, errorMessage, retry } = useSupabaseConnection();

  const navItems = [
    { to: '/', label: 'Home', icon: Compass, end: true },
    { to: '/practice', label: 'Practice Drills', icon: Calculator },
    { to: '/topics', label: 'Curriculum', icon: BookOpen },
    { to: '/dashboard', label: 'My Progress', icon: BarChart2 },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between h-screen sticky top-0 select-none z-30">
      <div>
        {/* Top Header / Branding */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
          <BrandLogo />
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-4">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Study Command
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-4 h-4 mr-2.5 ${
                          isActive ? 'text-brand-600' : 'text-slate-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Useful Area: Active Module & Live Connection Status */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        {/* Current Study Module Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Current Module</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
              01
            </span>
          </div>
          <p className="text-xs font-bold text-slate-800 leading-tight">
            Fast Addition & Subtraction
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Speed Math</span>
            <Link
              to="/practice?topic=fast-addition-subtraction"
              className="inline-flex items-center text-[11px] font-semibold text-brand-600 hover:text-brand-800"
            >
              <Play className="w-2.5 h-2.5 mr-1 fill-brand-600" />
              Drill
            </Link>
          </div>
        </div>

        {/* Database Connection Status */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-slate-400 font-medium">Database:</span>
          {status === 'Connected' && (
            <span
              title="Connected to Supabase PostgreSQL"
              className="inline-flex items-center text-emerald-700 font-medium font-mono text-[11px]"
            >
              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
              Connected
            </span>
          )}
          {status === 'Connecting' && (
            <span
              title="Verifying database connection..."
              className="inline-flex items-center text-amber-600 font-medium text-[11px]"
            >
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Connecting
            </span>
          )}
          {status === 'Connection Error' && (
            <button
              onClick={retry}
              type="button"
              title={errorMessage || 'Connection error. Click to retry.'}
              className="inline-flex items-center text-rose-600 hover:text-rose-700 font-medium text-[11px] cursor-pointer"
            >
              <AlertTriangle className="w-3 h-3 mr-1" />
              Error (Retry)
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
