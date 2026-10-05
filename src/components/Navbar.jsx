import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, BookOpen, BarChart3, Database, CheckCircle2, AlertTriangle } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export default function Navbar() {
  const location = useLocation();
  const configured = isSupabaseConfigured();

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/topics', label: 'Topics', icon: BookOpen },
    { to: '/practice', label: 'Practice', icon: Zap },
    { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 group-hover:bg-indigo-700 transition-colors">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                Prep<span className="text-indigo-600">Lab</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navLinks.map((link) => {
              const active = isActive(link.to);
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`inline-flex items-center px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {Icon && <Icon className={`w-4 h-4 mr-1.5 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Database Connection Status Pill */}
          <div className="hidden md:flex items-center">
            {configured ? (
              <span
                title="Connected to Supabase PostgreSQL"
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Supabase Connected
              </span>
            ) : (
              <span
                title="Supabase is not configured in .env.local. Tests will save to browser storage."
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                Local Storage Mode
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
