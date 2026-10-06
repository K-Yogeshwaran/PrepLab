import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, ArrowLeft, ChevronRight } from 'lucide-react';

export default function LearnTables() {
  const [selectedTable, setSelectedTable] = useState(17);

  // Generate 20 lines for selected table
  const lines = Array.from({ length: 20 }, (_, i) => {
    const multiplier = i + 1;
    return {
      multiplier,
      result: selectedTable * multiplier,
    };
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with Back Navigation */}
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
            Multiplication Tables (1–50)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Select any table to view its full 20 lines.
          </p>
        </div>

        {/* Direct Practice Link */}
        <Link
          to={`/practice?topic=tables-squares-cubes&mode=tables&table=${selectedTable}&subMode=memorization`}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-brand-600 text-white text-xs sm:text-sm font-semibold hover:bg-brand-700 transition-colors shadow-xs self-start sm:self-auto"
        >
          <Play className="w-3.5 h-3.5 mr-1.5 fill-white" />
          Practice Table {selectedTable} →
        </Link>
      </div>

      {/* Responsive Table Selector Grid (1 to 50) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Select Table
        </label>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 max-h-48 overflow-y-auto p-1">
          {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setSelectedTable(num)}
              className={`py-2 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                selectedTable === num
                  ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Table Reference Card: 20 Lines Display */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
              20-Line Reference
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              TABLE OF {selectedTable}
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {selectedTable} × 1 to {selectedTable} × 20
          </span>
        </div>

        {/* 20 Lines in 2 Columns on Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 text-sm font-mono">
          {lines.map((line) => (
            <div
              key={line.multiplier}
              className="flex items-center justify-between py-1.5 px-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors"
            >
              <span className="text-slate-600 font-semibold">
                {selectedTable} × {line.multiplier}
              </span>
              <span className="text-slate-400 font-normal">=</span>
              <span className="text-slate-900 font-bold text-base">
                {line.result}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <Link
            to={`/practice?topic=tables-squares-cubes&mode=tables&table=${selectedTable}&subMode=memorization`}
            className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            <span>Launch 20-Line Memorization Drill for Table {selectedTable}</span>
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
