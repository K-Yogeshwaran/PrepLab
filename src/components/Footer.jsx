import React from 'react';
import { Database, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white py-6 text-xs text-slate-500 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-700">PrepLab</span>
          <span>&middot;</span>
          <span>Personal Exam Preparation Workspace</span>
        </div>

        <div className="flex items-center space-x-4 text-[11px] text-slate-400">
          <span className="inline-flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Deterministic JS Math
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
