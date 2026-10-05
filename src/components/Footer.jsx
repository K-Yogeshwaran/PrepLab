import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/60 bg-white/60 py-6 text-xs text-slate-400 mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-700">PrepLab</span>
          <span>&middot;</span>
          <span>Personal Exam Workspace</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Fast calculation & quantitative aptitude
        </div>
      </div>
    </footer>
  );
}
