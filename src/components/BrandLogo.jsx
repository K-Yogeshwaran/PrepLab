import React from 'react';
import { Link } from 'react-router-dom';

export default function BrandLogo({ className = '', collapsed = false }) {
  return (
    <Link to="/" className={`inline-flex items-center space-x-2.5 group ${className}`}>
      {/* Brand Icon */}
      <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-mono font-bold text-xs tracking-wider shadow-xs group-hover:bg-brand-700 transition-colors flex-shrink-0">
        PL
      </div>

      {!collapsed && (
        <div className="flex flex-col">
          <span className="font-bold text-base tracking-tight text-slate-900 group-hover:text-brand-700 transition-colors leading-none">
            Prep<span className="text-brand-600">Lab</span>
          </span>
          <span className="text-[10px] font-medium text-slate-400 mt-0.5 leading-none">
            Study Workspace
          </span>
        </div>
      )}
    </Link>
  );
}
