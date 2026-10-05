import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, TrendingUp, Zap } from 'lucide-react';

export default function MobileBottomNav() {
  const navItems = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/practice', label: 'Practice', icon: Zap },
    { to: '/topics', label: 'Topics', icon: BookOpen },
    { to: '/progress', label: 'Progress', icon: TrendingUp },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 safe-area-inset-bottom">
      <div className="grid grid-cols-4 h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-h-[48px] py-1 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-brand-600 font-semibold'
                    : 'text-slate-400 hover:text-slate-700'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 mb-0.5 transition-colors ${
                      isActive ? 'text-brand-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
