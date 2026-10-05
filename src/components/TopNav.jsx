import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  Calculator,
  BookOpen,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import { useSupabaseConnection } from '../hooks/useSupabaseConnection';

export default function TopNav() {
  const { status, errorMessage, retry } = useSupabaseConnection();

  const navItems = [
    { to: '/', label: 'Home', icon: Compass, end: true },
    { to: '/practice', label: 'Practice', icon: Calculator },
    { to: '/topics', label: 'Curriculum', icon: BookOpen },
    { to: '/dashboard', label: 'My Progress', icon: BarChart2 },
  ];

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Brand */}
        <BrandLogo />

        {/* Tablet Horizontal Tabs (768px to 1023px) */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Database Connection Status Pill */}
        <div className="flex items-center">
          {status === 'Connected' && (
            <span
              title="Connected to Supabase PostgreSQL"
              className="inline-flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-mono font-medium"
            >
              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
              <span className="hidden sm:inline">Supabase</span> Connected
            </span>
          )}
          {status === 'Connecting' && (
            <span
              title="Verifying database connection..."
              className="inline-flex items-center text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-medium"
            >
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Connecting
            </span>
          )}
          {status === 'Connection Error' && (
            <button
              onClick={retry}
              type="button"
              title={errorMessage || 'Connection error. Tap to retry.'}
              className="inline-flex items-center text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-medium hover:bg-rose-100 transition-colors"
            >
              <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
              Error (Retry)
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
