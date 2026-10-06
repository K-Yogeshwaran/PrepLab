import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  ArrowRight,
  TrendingUp,
  ChevronRight,
  Flame,
  Trophy,
  CalendarCheck,
  Zap,
} from 'lucide-react';
import { getRecentTests } from '../services/testsService';
import { getDashboardStats } from '../services/statsService';
import { formatSeconds, formatAccuracy, formatDateTime } from '../utils/formatters';
import ActivityHeatmap from '../components/ActivityHeatmap';

export default function Home() {
  const [stats, setStats] = useState(null);
  const [recentTests, setRecentTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [recentRes, statsRes] = await Promise.all([
          getRecentTests(5),
          getDashboardStats(),
        ]);
        setRecentTests(recentRes?.data || []);
        if (statsRes && statsRes.hasData) {
          setStats(statsRes);
        }
      } catch (err) {
        console.warn('Could not load study room data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning, Yogesh 👋';
    if (hour < 17) return 'Good afternoon, Yogesh 👋';
    return 'Good evening, Yogesh 👋';
  };

  const hasHistory = stats && stats.totalTests > 0;
  const activity = stats?.activity || {
    dailyMap: {},
    totalActiveDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    daysActiveThisWeek: 0,
    weekDays: [],
  };

  return (
    <div className="space-y-6 w-full">
      {/* Workspace Grid Layout: 2-column desktop (minmax 1.65fr : 0.95fr), 1-column mobile/tablet */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.95fr)] xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,1fr)] gap-6 xl:gap-8 items-start">
        {/* ======================================================== */}
        {/* MAIN COLUMN                                              */}
        {/* ======================================================== */}
        <div className="space-y-6 min-w-0">
          {/* 1. Personal Greeting & Primary Start Practice Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
              Personal Study Workspace
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {getGreeting()}
              </h1>
              <p className="text-slate-600 mt-1.5 text-sm sm:text-base leading-relaxed max-w-2xl">
                Ready for a quick practice? Build calculation speed and accuracy with timed arithmetic drills.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/practice"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 shadow-xs hover:shadow transition-all"
              >
                <Play className="w-4 h-4 mr-2 fill-white" />
                Start Practice
              </Link>
              <Link
                to="/progress"
                className="inline-flex items-center justify-center px-4 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200/70 transition-colors"
              >
                View Analytics
              </Link>
            </div>
          </div>

          {/* 2. Today's Focus / Available Topic Cards */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-brand-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Practice Modules
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Module 01 */}
              <div className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-brand-600 tracking-wider block">Module 01</span>
                  <h3 className="text-base font-bold text-slate-900">
                    Fast Addition & Subtraction
                  </h3>
                  <p className="text-xs text-slate-500">
                    Speed math techniques, near-base adjustments, and rapid arithmetic.
                  </p>
                </div>

                <Link
                  to="/practice?topic=fast-addition-subtraction"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-brand-600 transition-colors shadow-xs self-start"
                >
                  <span>Practice Module</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </div>

              {/* Module 02 */}
              <div className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-brand-600 tracking-wider block">Module 02</span>
                  <h3 className="text-base font-bold text-slate-900">
                    Tables, Squares & Cubes
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tables 1-20 (memorization & speed), squares 1-50, cubes 1-25 & roots.
                  </p>
                </div>

                <Link
                  to="/practice?topic=tables-squares-cubes"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors shadow-xs self-start"
                >
                  <span>Practice Module</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* 3. Compact Performance Summary */}
          {hasHistory && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs text-center">
                <span className="text-xs font-medium text-slate-400 block">Total Drills</span>
                <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
                  {stats.totalTests}
                </span>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs text-center">
                <span className="text-xs font-medium text-slate-400 block">Accuracy</span>
                <span className="text-2xl font-bold font-mono text-emerald-600 mt-1 block">
                  {formatAccuracy(stats.overallAccuracy)}
                </span>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs text-center">
                <span className="text-xs font-medium text-slate-400 block">Avg Speed</span>
                <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
                  {formatSeconds(stats.averageTimePerQuestionMs)}
                </span>
              </div>
            </div>
          )}

          {/* 4. Recent Practice List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Recent Practice
              </h2>
              {hasHistory && (
                <Link
                  to="/progress"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center"
                >
                  See all analytics <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              )}
            </div>

            {hasHistory ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden divide-y divide-slate-100">
                {recentTests.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-slate-400">
                        {formatDateTime(t.created_at)}
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {t.topics?.name ||
                          (String(t.topic_id) === '2' ||
                          String(t.topic_id).includes('table') ||
                          String(t.topic_id) === 'tables-squares-cubes'
                            ? 'Tables, Squares & Cubes'
                            : 'Fast Addition & Subtraction')}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 sm:space-x-6">
                      <div className="text-right">
                        <span
                          className={`text-sm font-bold font-mono ${
                            t.accuracy >= 90
                              ? 'text-emerald-600'
                              : t.accuracy >= 70
                              ? 'text-brand-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {formatAccuracy(t.accuracy)}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          {t.correct_count}/{t.question_count} &middot; {formatSeconds(t.average_time_ms)}
                        </span>
                      </div>

                      <Link
                        to={`/results/${t.id}`}
                        className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        title="Review drill"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-100/60 border border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-1">
                <p className="text-xs sm:text-sm font-medium text-slate-600">
                  No practice history yet.
                </p>
                <p className="text-xs text-slate-400">
                  Complete your first drill to record your initial benchmark.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECONDARY COLUMN                                         */}
        {/* ======================================================== */}
        <div className="space-y-6 min-w-0">
          {/* 1. Streaks Summary Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Study Streaks
            </h2>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-amber-50/60 border border-amber-200/60 p-3.5 rounded-xl">
                <div className="flex items-center justify-center text-amber-500 mb-1">
                  <Flame className="w-4 h-4 fill-amber-500" />
                </div>
                <span className="text-xl font-bold font-mono text-amber-900 block leading-tight">
                  {activity.currentStreak}d
                </span>
                <span className="text-[11px] text-amber-700 font-medium block mt-1">
                  Current
                </span>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200/60 p-3.5 rounded-xl">
                <div className="flex items-center justify-center text-emerald-600 mb-1">
                  <Trophy className="w-4 h-4" />
                </div>
                <span className="text-xl font-bold font-mono text-emerald-900 block leading-tight">
                  {activity.longestStreak}d
                </span>
                <span className="text-[11px] text-emerald-700 font-medium block mt-1">
                  Best Streak
                </span>
              </div>

              <div className="bg-brand-50/60 border border-brand-200/60 p-3.5 rounded-xl">
                <div className="flex items-center justify-center text-brand-600 mb-1">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <span className="text-xl font-bold font-mono text-brand-900 block leading-tight">
                  {activity.totalActiveDays}
                </span>
                <span className="text-[11px] text-brand-700 font-medium block mt-1">
                  Active Days
                </span>
              </div>
            </div>
          </div>

          {/* 2. Weekly Consistency Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                This Week
              </h2>
              <span className="text-xs font-mono font-bold text-slate-800">
                {activity.daysActiveThisWeek} / 7 days active
              </span>
            </div>

            {/* 7-Day Dot Progress Bar */}
            <div className="grid grid-cols-7 gap-2 pt-1">
              {activity.weekDays && activity.weekDays.length > 0 ? (
                activity.weekDays.map((day) => (
                  <div key={day.dateKey} className="text-center space-y-1">
                    <div
                      className={`h-9 rounded-xl flex items-center justify-center font-mono text-xs font-bold transition-all ${
                        day.isActive
                          ? 'bg-brand-600 text-white shadow-xs'
                          : day.isToday
                          ? 'bg-slate-100 text-slate-900 ring-2 ring-brand-500'
                          : 'bg-slate-100/70 text-slate-400'
                      }`}
                      title={`${day.dateKey}: ${day.isActive ? 'Practiced' : 'No drills'}`}
                    >
                      {day.dayName}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-7 text-xs text-slate-400 text-center py-2">
                  No weekly activity recorded yet
                </div>
              )}
            </div>
          </div>

          {/* 3. Consistency Heatmap Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Practice Consistency
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                Last 16 weeks
              </span>
            </div>

            <ActivityHeatmap dailyMap={activity.dailyMap} weeksToShow={16} />
          </div>
        </div>
      </div>
    </div>
  );
}
