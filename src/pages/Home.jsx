import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calculator,
  BookOpen,
  BarChart2,
  ArrowRight,
  Clock,
  Target,
  Play,
  Layers,
  ChevronRight,
  BookMarked,
  Sparkles,
} from 'lucide-react';
import { getRecentTests } from '../services/testsService';
import { formatDuration, formatSeconds, formatAccuracy, formatDateTime } from '../utils/formatters';

export default function Home() {
  const [recentTests, setRecentTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecent() {
      try {
        const { data } = await getRecentTests(4);
        setRecentTests(data || []);
      } catch (err) {
        console.warn('Could not load recent tests for study room:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRecent();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Study Room Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-600 inline-block"></span>
          <span>Study Room</span>
          <span>&middot;</span>
          <span>Quantitative Aptitude Preparation</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Exam Practice Workspace
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Targeted speed math drills designed to build split-second calculation reflexes and zero-error accuracy for competitive banking examinations.
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <Link
              to="/practice"
              className="inline-flex items-center px-4 py-2 rounded-md bg-slate-900 text-white text-xs sm:text-sm font-medium hover:bg-brand-700 transition-colors shadow-xs"
            >
              <Play className="w-3.5 h-3.5 mr-1.5 fill-white" />
              Start Practice
            </Link>
            <Link
              to="/topics"
              className="inline-flex items-center px-3.5 py-2 rounded-md bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Curriculum
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Active Module Highlight */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                Module 01
              </span>
              <span className="text-xs text-brand-700 font-medium">Speed Math</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Fast Addition & Subtraction
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Standard arithmetic and near-base adjustment drills (e.g. 483 + 297, 625 - 198) with millisecond response timing.
            </p>
          </div>

          <Link
            to="/practice?topic=fast-addition-subtraction"
            className="inline-flex items-center px-3.5 py-1.5 rounded-md bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors shadow-xs self-start"
          >
            Configure & Start
            <ArrowRight className="w-3 h-3 ml-1.5" />
          </Link>
        </div>

        {/* Quick Parameters Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
          <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
            <span className="text-[11px] text-slate-400 block font-medium">Operations</span>
            <span className="font-semibold text-slate-800">Addition, Subtraction, Both</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
            <span className="text-[11px] text-slate-400 block font-medium">Difficulty</span>
            <span className="font-semibold text-slate-800">Easy, Medium, Hard, Mixed</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
            <span className="text-[11px] text-slate-400 block font-medium">Techniques</span>
            <span className="font-semibold text-slate-800">Standard & Near-Base</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
            <span className="text-[11px] text-slate-400 block font-medium">Drill Sizes</span>
            <span className="font-semibold text-slate-800 font-mono">5 to 100 Questions</span>
          </div>
        </div>
      </section>

      {/* 3. Recent Practice History or Intentional Study Room State */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Recent Practice Sessions
            </h2>
            <p className="text-xs text-slate-500">
              Your recent attempts recorded in Supabase.
            </p>
          </div>
          {recentTests.length > 0 && (
            <Link
              to="/dashboard"
              className="text-xs font-medium text-brand-600 hover:text-brand-800 flex items-center"
            >
              <span>View All Diagnostics</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          )}
        </div>

        {/* Real test list if exists */}
        {!loading && recentTests.length > 0 && (
          <div className="overflow-x-auto border border-slate-200 rounded-md">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Topic</th>
                  <th className="py-2.5 px-3 text-center">Score</th>
                  <th className="py-2.5 px-3 text-center">Accuracy</th>
                  <th className="py-2.5 px-3 text-center">Avg Speed</th>
                  <th className="py-2.5 px-3 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTests.map((t) => {
                  const topicName =
                    t.topics?.name ||
                    (String(t.topic_id) === '1' || String(t.topic_id) === 'fast-addition-subtraction'
                      ? 'Fast Addition & Subtraction'
                      : `Topic #${t.topic_id}`);

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {formatDateTime(t.created_at)}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {topicName}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {t.correct_count} / {t.question_count}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold">
                        <span
                          className={
                            t.accuracy >= 90
                              ? 'text-emerald-700'
                              : t.accuracy >= 70
                              ? 'text-brand-700'
                              : 'text-amber-700'
                          }
                        >
                          {formatAccuracy(t.accuracy)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                        {formatSeconds(t.average_time_ms)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          to={`/results/${t.id}`}
                          className="font-semibold text-brand-600 hover:text-brand-800"
                        >
                          Review &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Intentional Empty State (No fake stats) */}
        {!loading && recentTests.length === 0 && (
          <div className="text-center py-8 px-4 bg-slate-50 rounded border border-dashed border-slate-200">
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Your study history will appear here after your first practice session.
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Launch a 10-question calculation drill to record your initial speed and accuracy benchmark.
            </p>
            <div className="mt-4">
              <Link
                to="/practice"
                className="inline-flex items-center px-3.5 py-1.5 rounded bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
              >
                <Play className="w-3 h-3 mr-1.5 fill-white" />
                Start Benchmark Drill
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 4. Speed Math Technique Reference (Real Practical Value) */}
      <section className="bg-slate-100/70 border border-slate-200/80 rounded-lg p-5">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          <BookMarked className="w-3.5 h-3.5 text-slate-600" />
          <span>Speed Math Reference &middot; Core Rules</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="font-semibold text-slate-900 block mb-1">
              1. Near-Base Rounding (Addition)
            </span>
            <p className="text-slate-600 leading-relaxed">
              When adding numbers ending in 8 or 9, round up to the nearest ten/hundred and subtract the difference:
            </p>
            <div className="font-mono text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-100 mt-1.5">
              483 + 297 = (483 + 300) - 3 = 783 - 3 = 780
            </div>
          </div>

          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="font-semibold text-slate-900 block mb-1">
              2. Near-Base Adjustment (Subtraction)
            </span>
            <p className="text-slate-600 leading-relaxed">
              When subtracting near-base numbers, subtract the rounded base and add back the difference:
            </p>
            <div className="font-mono text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-100 mt-1.5">
              625 - 198 = (625 - 200) + 2 = 425 + 2 = 427
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
