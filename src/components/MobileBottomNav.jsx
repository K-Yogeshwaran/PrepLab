import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, Calculator, BookOpen, BarChart2 } from 'lucide-react';

export default function MobileBottomNav() {
  const navItems = [
    { to: '/', label: 'Home', icon: Compass, end: true },
    { to: '/practice', label: 'Practice', icon: Calculator },
    { to: '/topics', label: 'Curriculum', icon: BookOpen },
    { to: '/dashboard', label: 'Progress', icon: BarChart2 },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-t border-slate-200 safe-area-inset-bottom">
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
                    : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 mb-0.5 ${
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
