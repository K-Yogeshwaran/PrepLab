import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home, BookOpen, TrendingUp, Zap, Play, Book } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function TopNav() {
  const navItems = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/practice', label: 'Practice', icon: Zap },
    { to: '/learn', label: 'Learn', icon: Book },
    { to: '/topics', label: 'Topics', icon: BookOpen },
    { to: '/progress', label: 'Progress', icon: TrendingUp },
  ];

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
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
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Action Button */}
        <div className="flex items-center">
          <Link
            to="/practice"
            className="inline-flex items-center px-3 py-1.5 rounded-md bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors shadow-xs"
          >
            <Play className="w-3 h-3 mr-1 fill-white" />
            <span>Practice</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
