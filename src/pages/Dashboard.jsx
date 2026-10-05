import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart2,
  Play,
  Clock,
  Target,
  Trophy,
  TrendingUp,
  RotateCcw,
  Layers,
  Loader2,
  Calendar,
  Activity,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { getDashboardStats } from '../services/statsService';
import { formatDuration, formatSeconds, formatAccuracy, formatDateTime } from '../utils/formatters';
import EmptyState from '../components/EmptyState';
import Alert from '../components/Alert';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardStats();
      if (data.error) {
        setError(data.error);
      } else {
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
      setError('Failed to fetch dashboard statistics from Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-7 h-7 text-brand-600 animate-spin" />
        <p className="text-xs font-medium text-slate-500">
          Loading progress analytics from Supabase...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 py-4 max-w-2xl mx-auto">
        <Alert variant="error" title="Database Notice">
          {error}. Please verify your database connection.
        </Alert>
        <div className="text-center">
          <button
            type="button"
            onClick={loadStats}
            className="inline-flex items-center px-4 py-2 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Retry Query
          </button>
        </div>
      </div>
    );
  }

  // Meaningful empty state when no attempts exist in Supabase
  if (!stats || !stats.hasData || stats.totalTests === 0) {
    return (
      <div className="space-y-6 py-2">
        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Diagnostics</span>
            <span>&middot;</span>
            <span>Progress Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            My Progress
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Real performance tracking and calculation speed diagnostics.
          </p>
        </div>

        <EmptyState
          icon={BarChart2}
          title="You haven't completed a practice session yet."
          description="Complete your first Fast Addition & Subtraction practice drill to record your accuracy and speed metrics."
          actionText="Take Your First Practice Drill"
          actionLink="/practice"
        />
      </div>
    );
  }

  const {
    totalTests,
    totalQuestions,
    totalCorrect,
    overallAccuracy,
    averageTimePerQuestionMs,
    bestAccuracy,
    recentTests,
    topicPerformance,
    charts,
  } = stats;

  const hasTrendData = totalTests >= 2;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          <span>Diagnostics</span>
          <span>&middot;</span>
          <span>Analytics</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              My Progress
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Performance metrics computed strictly from your Supabase attempt history.
            </p>
          </div>

          <Link
            to="/practice"
            className="inline-flex items-center px-4 py-2 rounded-md bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-brand-700 transition-colors shadow-xs self-start sm:self-auto"
          >
            <Play className="w-3.5 h-3.5 mr-1.5 fill-white" />
            New Practice Drill
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics Strip (5 Compact Panels) */}
      <section className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
          Key Performance Indicators
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Tests Done */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-[11px] text-slate-500 block font-medium">Drills Completed</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {totalTests}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Sessions</span>
          </div>

          {/* Questions Solved */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-[11px] text-slate-500 block font-medium">Questions Solved</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {totalQuestions}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">{totalCorrect} correct</span>
          </div>

          {/* Overall Accuracy */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-[11px] text-slate-500 block font-medium">Overall Accuracy</span>
            <div
              className={`text-2xl font-bold font-mono mt-1 ${
                overallAccuracy >= 90
                  ? 'text-emerald-700'
                  : overallAccuracy >= 70
                  ? 'text-brand-700'
                  : 'text-amber-700'
              }`}
            >
              {formatAccuracy(overallAccuracy)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">All-time average</span>
          </div>

          {/* Avg Response Speed */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-[11px] text-slate-500 block font-medium">Average Speed</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {formatSeconds(averageTimePerQuestionMs)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Per calculation</span>
          </div>

          {/* Best Accuracy Record */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-500 block font-medium">Best Accuracy</span>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
              {formatAccuracy(bestAccuracy)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Single drill record</span>
          </div>
        </div>
      </section>

      {/* 3. Performance Trends (Accuracy & Speed) */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Performance Trends Over Time
        </h2>

        {hasTrendData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Trend 1: Accuracy Over Time */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Accuracy Trajectory (%)
                  </h3>
                  <p className="text-[11px] text-slate-500">Per completed practice drill</p>
                </div>
                <span className="text-xs font-mono font-bold text-brand-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  Target: 90%+
                </span>
              </div>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.accuracyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} unit="%" />
                    <Tooltip
                      formatter={(value) => [`${value}%`, 'Accuracy']}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label}
                      contentStyle={{ fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#0284c7"
                      strokeWidth={2}
                      dot={{ fill: '#0284c7', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Trend 2: Average Speed Over Time */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Average Speed Trajectory (s)
                  </h3>
                  <p className="text-[11px] text-slate-500">Time per calculation (lower is faster)</p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  Target: &le; 3.0s
                </span>
              </div>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.timeTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} unit="s" />
                    <Tooltip
                      formatter={(value) => [`${value}s`, 'Avg Time']}
                      labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label}
                      contentStyle={{ fontSize: '11px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgTimeSeconds"
                      stroke="#0f766e"
                      strokeWidth={2}
                      dot={{ fill: '#0f766e', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center shadow-xs">
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Complete at least 2 practice drills to reveal your accuracy and speed trend lines.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Currently recording your second benchmark session.
            </p>
          </div>
        )}
      </section>

      {/* 4. Topic Performance Breakdown */}
      {topicPerformance.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Curriculum Topic Performance
          </h2>
          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Topic</th>
                  <th className="py-2.5 px-3 text-center">Drills</th>
                  <th className="py-2.5 px-3 text-center">Questions</th>
                  <th className="py-2.5 px-3 text-center">Accuracy</th>
                  <th className="py-2.5 px-3 text-center">Avg Speed</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {topicPerformance.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                      {t.name}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-700">
                      {t.testsCount}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-700">
                      {t.questionsCount}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      <span className={t.accuracy >= 90 ? 'text-emerald-700' : 'text-brand-700'}>
                        {formatAccuracy(t.accuracy)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-700">
                      {formatSeconds(t.avgTimeMs)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <Link
                        to={`/practice?topic=${encodeURIComponent(t.id)}`}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-800"
                      >
                        Drill &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 5. Recent Practice Attempts Log */}
      <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Recent Practice Attempts
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">
            Latest {recentTests.length} from Supabase
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Topic</th>
                <th className="py-2.5 px-3 text-center">Score</th>
                <th className="py-2.5 px-3 text-center">Accuracy</th>
                <th className="py-2.5 px-3 text-center">Duration</th>
                <th className="py-2.5 px-3 text-center">Avg/Q</th>
                <th className="py-2.5 px-3 text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTests.map((test) => {
                const topicName =
                  test.topics?.name ||
                  (String(test.topic_id) === '1' || String(test.topic_id) === 'fast-addition-subtraction'
                    ? 'Fast Addition & Subtraction'
                    : `Topic #${test.topic_id}`);

                return (
                  <tr key={test.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap text-[11px]">
                      {formatDateTime(test.created_at)}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {topicName}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {test.correct_count} / {test.question_count}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold">
                      <span
                        className={
                          test.accuracy >= 90
                            ? 'text-emerald-700'
                            : test.accuracy >= 70
                            ? 'text-brand-700'
                            : 'text-amber-700'
                        }
                      >
                        {formatAccuracy(test.accuracy)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                      {formatDuration(test.total_time_ms)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                      {formatSeconds(test.average_time_ms)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/results/${test.id}`}
                        className="font-semibold text-brand-600 hover:text-brand-800 text-xs"
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
      </section>
    </div>
  );
}
