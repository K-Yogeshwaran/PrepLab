import React from 'react';
import { Database, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-8 text-sm text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-700">PrepLab</span>
          <span>&middot;</span>
          <span>Personal Banking & Aptitude Exam Practice</span>
        </div>

        <div className="flex items-center space-x-4 text-xs text-slate-400">
          <span className="inline-flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Deterministic JS Math (Zero AI)
          </span>
          <span>&middot;</span>
          <span className="inline-flex items-center">
            <Database className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Supabase PostgreSQL
          </span>
        </div>
      </div>
    </footer>
  );
}
