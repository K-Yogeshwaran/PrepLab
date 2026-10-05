import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Target, Timer, BarChart2, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-6 pt-4 sm:pt-8">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold tracking-wide uppercase">
          <Zap className="w-3.5 h-3.5 fill-indigo-600" />
          <span>Aptitude & Speed Math Training Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Master fast calculations for <span className="text-indigo-600">banking exams</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
          PrepLab is your personal practice platform designed to build split-second calculation speed,
          mental math agility, and exam accuracy with zero fluff and real progress tracking.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/practice"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-indigo-600 text-white font-medium text-base hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Start Practice Test
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          <Link
            to="/topics"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white text-slate-700 font-medium text-base border border-slate-300 hover:bg-slate-50 transition-all focus:outline-hidden focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Explore Topics
          </Link>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white text-slate-700 font-medium text-base border border-slate-300 hover:bg-slate-50 transition-all focus:outline-hidden focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            <BarChart2 className="w-4 h-4 mr-2 text-slate-500" />
            View Dashboard
          </Link>
        </div>
      </section>

      {/* Primary Feature Spotlight: Fast Addition & Subtraction */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
              Ready to Practice
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Fast Addition & Subtraction
            </h2>
            <p className="text-slate-600 text-sm mt-1 max-w-xl">
              Deterministic question generator engineered for competitive banking patterns:
              near-base adjustment calculations, rapid regrouping, and timed drills.
            </p>
          </div>

          <Link
            to="/practice?topic=fast-addition-subtraction"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm self-start md:self-auto"
          >
            Practice This Topic
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Dynamic Generation</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pure JavaScript generator produces non-repeating arithmetic pairs on the fly.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Near-Base Adjustments</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Practice speed tricks like rounding (e.g. 483 + 297) to compute in seconds.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Millisecond Timing</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tracks exact per-question response times to measure cognitive speed improvements.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Persistent Analytics</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Attempts and question history save securely to your personal Supabase database.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Speed Math Principles Checklist */}
      <section className="bg-slate-100/70 rounded-2xl border border-slate-200 p-6 sm:p-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          Core Fast-Calculation Drills Supported
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm text-slate-700">
          <div className="flex items-center space-x-2.5 bg-white p-3 rounded-lg border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>Configurable test size (5 to 100 questions)</span>
          </div>
          <div className="flex items-center space-x-2.5 bg-white p-3 rounded-lg border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>Dedicated Addition, Subtraction, or Mixed</span>
          </div>
          <div className="flex items-center space-x-2.5 bg-white p-3 rounded-lg border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>Graded Difficulty (Easy, Medium, Hard, Mixed)</span>
          </div>
          <div className="flex items-center space-x-2.5 bg-white p-3 rounded-lg border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>Standard & Near-base calculation styles</span>
          </div>
          <div className="flex items-center space-x-2.5 bg-white p-3 rounded-lg border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>Instant keyboard submission via Enter</span>
          </div>
          <div className="flex items-center space-x-2.5 bg-white p-3 rounded-lg border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>Detailed review with correct answers</span>
          </div>
        </div>
      </section>
    </div>
  );
}
