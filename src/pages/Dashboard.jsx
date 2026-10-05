import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Zap,
  Clock,
  Target,
  Trophy,
  TrendingUp,
  RotateCcw,
  Layers,
  Loader2,
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
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">
          Loading your performance analytics from Supabase...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 py-4 max-w-2xl mx-auto">
        <Alert variant="error" title="Database Connection Notice">
          {error}. Please verify your Supabase database schema and RLS policies.
        </Alert>
        <div className="text-center">
          <button
            type="button"
            onClick={loadStats}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Retry Query
          </button>
        </div>
      </div>
    );
  }

  // Meaningful empty state when no attempts exist in Supabase
  if (!stats || !stats.hasData || stats.totalTests === 0) {
    return (
      <div className="space-y-6 py-4">
        <div className="border-b border-slate-200 pb-5">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Real performance tracking and calculation speed analytics.
          </p>
        </div>

        <EmptyState
          icon={BarChart3}
          title="No tests completed yet."
          description="Complete your first Fast Addition & Subtraction practice drill to see your accuracy, speed trends, and exam analytics."
          actionText="Take Your First Practice Test"
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

  return (
    <div className="space-y-8 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Personal aptitude practice analytics computed strictly from your Supabase test history.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/practice"
            className="inline-flex items-center px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-100"
          >
            <Zap className="w-4 h-4 mr-2" />
            Start Practice
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Metric 1: Tests Completed */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tests Done</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-slate-900">
            {totalTests}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Completed sessions</span>
        </div>

        {/* Metric 2: Questions Solved */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Questions</span>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-slate-900">
            {totalQuestions}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">{totalCorrect} correct</span>
        </div>

        {/* Metric 3: Overall Accuracy */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Accuracy</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-indigo-600">
            {formatAccuracy(overallAccuracy)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Overall rate</span>
        </div>

        {/* Metric 4: Avg Time Per Question */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Speed</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-slate-900">
            {formatSeconds(averageTimePerQuestionMs)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Per question</span>
        </div>

        {/* Metric 5: Best Accuracy */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Best Accuracy</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-600">
            {formatAccuracy(bestAccuracy)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Single test record</span>
        </div>
      </div>

      {/* Historical Trend Charts */}
      {charts.accuracyTrend.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Accuracy Over Time */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Accuracy Trend (%)</h3>
                <p className="text-xs text-slate-500">Historical accuracy per completed test</p>
              </div>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.accuracyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" />
                  <Tooltip
                    formatter={(value) => [`${value}%`, 'Accuracy']}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    dot={{ fill: '#4f46e5', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Average Time per Question Over Time */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Average Speed Trend (Seconds)</h3>
                <p className="text-xs text-slate-500">Average time taken per calculation</p>
              </div>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.timeTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="s" />
                  <Tooltip
                    formatter={(value) => [`${value}s`, 'Avg Time']}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgTimeSeconds"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ fill: '#f59e0b', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Cumulative Questions Solved */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Cumulative Questions Solved</h3>
                <p className="text-xs text-slate-500">Total calculation practice volume over time</p>
              </div>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.cumulativeQuestionsTrend}>
                  <defs>
                    <linearGradient id="qColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    formatter={(value) => [value, 'Total Questions']}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label}
                  />
                  <Area
                    type="monotone"
                    dataKey="questions"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#qColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Topic Performance Breakdown */}
      {topicPerformance.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Topic Performance Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topicPerformance.map((topic) => (
              <div
                key={topic.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{topic.name}</h3>
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-200">
                    <div>
                      <span className="text-slate-400 block">Tests</span>
                      <span className="font-bold text-slate-800 text-sm font-mono">{topic.testsCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Accuracy</span>
                      <span className="font-bold text-indigo-600 text-sm font-mono">{formatAccuracy(topic.accuracy)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Avg Speed</span>
                      <span className="font-bold text-slate-800 text-sm font-mono">{formatSeconds(topic.avgTimeMs)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200">
                  <Link
                    to={`/practice?topic=${encodeURIComponent(topic.id)}`}
                    className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Practice This Topic
                    <Zap className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Tests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Recent Practice Attempts
          </h2>
          <span className="text-xs text-slate-500">
            Latest {recentTests.length} tests from Supabase
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Topic</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4 text-center">Accuracy</th>
                <th className="py-3 px-4 text-center">Total Time</th>
                <th className="py-3 px-4 text-center">Avg/Q</th>
                <th className="py-3 px-4 text-right">Action</th>
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
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDateTime(test.created_at)}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {topicName}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs">
                      {test.correct_count} / {test.question_count}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-xs">
                      <span
                        className={
                          test.accuracy >= 90
                            ? 'text-emerald-600'
                            : test.accuracy >= 70
                            ? 'text-indigo-600'
                            : 'text-amber-600'
                        }
                      >
                        {formatAccuracy(test.accuracy)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs text-slate-600">
                      {formatDuration(test.total_time_ms)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs text-slate-600">
                      {formatSeconds(test.average_time_ms)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/results/${test.id}`}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        View Review &rarr;
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
