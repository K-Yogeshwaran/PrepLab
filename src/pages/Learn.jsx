import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Hash, Box } from 'lucide-react';

export default function Learn() {
  const sections = [
    {
      id: 'tables',
      title: 'Multiplication Tables',
      range: 'Tables 1–50 (20 lines each)',
      description: 'Master 20-line multiplication recall for instant mental calculation.',
      icon: Hash,
      link: '/learn/tables',
      color: 'text-brand-600 bg-brand-50 border-brand-200',
    },
    {
      id: 'squares',
      title: 'Squares',
      range: '1² – 50²',
      description: 'Memorize squares up to 50 for rapid quantitative simplification.',
      icon: BookOpen,
      link: '/learn/squares',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      id: 'cubes',
      title: 'Cubes',
      range: '1³ – 25³',
      description: 'Memorize cubes up to 25 for fast cube root and power solving.',
      icon: Box,
      link: '/learn/cubes',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Learn
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Build your mental calculation memory.
        </p>
      </div>

      {/* 3 Reference Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <div
              key={sec.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
            >
              <div className="space-y-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${sec.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {sec.range}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                    {sec.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {sec.description}
                  </p>
                </div>
              </div>

              <Link
                to={sec.link}
                className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700 pt-2"
              >
                <span>View {sec.title.toLowerCase()}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
