import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Home,
  Play,
  BookOpen,
  TrendingUp,
  Zap,
  Book,
} from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function Sidebar() {
  const navItems = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/practice', label: 'Practice', icon: Zap },
    { to: '/learn', label: 'Learn', icon: Book },
    { to: '/topics', label: 'Topics', icon: BookOpen },
    { to: '/progress', label: 'Progress', icon: TrendingUp },
  ];

  return (
    <aside className="w-60 border-r border-slate-200/80 bg-white flex flex-col justify-between h-screen sticky top-0 select-none z-30">
      <div>
        {/* Top Header */}
        <div className="h-16 px-5 flex items-center border-b border-slate-100">
          <BrandLogo />
        </div>

        {/* Navigation Menu */}
        <div className="px-3 py-4">
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
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-4 h-4 mr-3 transition-colors ${
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

      {/* Bottom Quick Start CTA */}
      <div className="p-3 border-t border-slate-100">
        <Link
          to="/practice"
          className="flex items-center justify-center w-full py-2.5 px-3 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shadow-xs transition-colors"
        >
          <Play className="w-3.5 h-3.5 mr-1.5 fill-white" />
          Start Practice
        </Link>
      </div>
    </aside>
  );
}
