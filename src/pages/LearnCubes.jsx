import React from 'react';
import { Link } from 'react-router-dom';
import { Play, ArrowLeft, ChevronRight } from 'lucide-react';

export default function LearnCubes() {
  const cubes = Array.from({ length: 25 }, (_, i) => {
    const num = i + 1;
    return {
      num,
      cube: num * num * num,
    };
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            to="/learn"
            className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-slate-600 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Learn
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Cubes (1³ – 25³)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Reference table for perfect cubes from 1 to 25.
          </p>
        </div>

        <Link
          to="/practice?topic=tables-squares-cubes&mode=cubes"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-brand-600 text-white text-xs sm:text-sm font-semibold hover:bg-brand-700 transition-colors shadow-xs self-start sm:self-auto"
        >
          <Play className="w-3.5 h-3.5 mr-1.5 fill-white" />
          Practice Cubes →
        </Link>
      </div>

      {/* Multi-column Grid Display */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Cubes Table (1 to 25)
          </h2>
          <span className="text-xs font-mono text-slate-400">
            25 entries
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs font-mono">
          {cubes.map((item) => (
            <div
              key={item.num}
              className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-white hover:border-slate-300 transition-colors"
            >
              <span className="text-slate-500 font-semibold">{item.num}³</span>
              <span className="text-slate-900 font-bold text-sm">{item.cube}</span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <Link
            to="/practice?topic=tables-squares-cubes&mode=cubes"
            className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            <span>Start Cubes Practice Drill</span>
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
