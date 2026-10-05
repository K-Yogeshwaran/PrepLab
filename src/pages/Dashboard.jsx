import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  RotateCcw,
  Loader2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { getDashboardStats } from '../services/statsService';
import { formatDuration, formatSeconds, formatAccuracy, formatDateTime } from '../utils/formatters';
import Alert from '../components/Alert';

/**
 * Custom Tooltip for Accuracy Trend Line Chart
 */
function AccuracyTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white text-xs rounded-xl p-3 shadow-lg border border-slate-800 font-mono space-y-1">
        <div className="font-bold text-slate-200">{data.label}</div>
        <div className="text-[11px] text-slate-400">{data.date}</div>
        <div className="text-brand-300 font-bold pt-1 border-t border-slate-800 flex items-center justify-between gap-3">
          <span>Accuracy:</span>
          <span>{data.accuracy}%</span>
        </div>
        <div className="text-[10px] text-slate-400 flex items-center justify-between gap-3">
          <span>Score:</span>
          <span>{data.correctCount} / {data.questionCount}</span>
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Custom Tooltip for Speed Trend Line Chart
 */
function SpeedTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white text-xs rounded-xl p-3 shadow-lg border border-slate-800 font-mono space-y-1">
        <div className="font-bold text-slate-200">{data.label}</div>
        <div className="text-[11px] text-slate-400">{data.date}</div>
        <div className="text-emerald-300 font-bold pt-1 border-t border-slate-800 flex items-center justify-between gap-3">
          <span>Speed:</span>
          <span>{data.avgTimeSeconds}s / q</span>
        </div>
        <div className="text-[10px] text-slate-400 flex items-center justify-between gap-3">
          <span>Duration:</span>
          <span>{formatDuration(data.totalDurationMs)}</span>
        </div>
      </div>
    );
  }
  return null;
}

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
      console.error('Failed to load progress data:', err);
      setError('Unable to load progress data.');
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
        <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
        <p className="text-xs text-slate-400">Loading your progress...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 py-4 max-w-xl mx-auto">
        <Alert variant="error" title="Unable to load progress">
          {error}
        </Alert>
        <div className="text-center">
          <button
            type="button"
            onClick={loadStats}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats || !stats.hasData || stats.totalTests === 0) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Progress
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your accuracy and speed improvement over time.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-10 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              No practice history yet
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Complete your first drill to start tracking your accuracy and calculation speed.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/practice"
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs sm:text-sm font-semibold hover:bg-brand-700 transition-colors shadow-xs"
            >
              <Play className="w-3.5 h-3.5 mr-1.5 fill-white" />
              Start Practice
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const {
    totalTests,
    totalQuestions,
    totalCorrect,
    totalIncorrect,
    overallAccuracy,
    averageTimePerQuestionMs,
    recentTests,
    topicPerformance,
    charts,
  } = stats;

  const hasTrendData = totalTests >= 2;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-3xl mx-auto">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Progress
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visualizing your speed and accuracy trajectory.
          </p>
        </div>

        <Link
          to="/practice"
          className="inline-flex items-center px-4 py-2.5 rounded-xl bg-brand-600 text-white text-xs sm:text-sm font-semibold hover:bg-brand-700 transition-colors shadow-xs self-start sm:self-auto"
        >
          <Play className="w-3.5 h-3.5 mr-1.5 fill-white" />
          New Practice Drill
        </Link>
      </div>

      {/* 2. Primary 4 Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs text-center">
          <span className="text-xs text-slate-400 block font-medium">Drills</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 mt-1">
            {totalTests}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs text-center">
          <span className="text-xs text-slate-400 block font-medium">Questions</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 mt-1">
            {totalQuestions}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs text-center">
          <span className="text-xs text-slate-400 block font-medium">Accuracy</span>
          <div
            className={`text-2xl sm:text-3xl font-bold font-mono mt-1 ${
              overallAccuracy >= 90
                ? 'text-emerald-600'
                : overallAccuracy >= 70
                ? 'text-brand-600'
                : 'text-amber-600'
            }`}
          >
            {formatAccuracy(overallAccuracy)}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs text-center">
          <span className="text-xs text-slate-400 block font-medium">Avg Speed</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 mt-1">
            {formatSeconds(averageTimePerQuestionMs)}
          </div>
        </div>
      </div>

      {/* 3. Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CHART 1 — ACCURACY TREND */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Accuracy Trend
            </h2>
            <p className="text-xs text-slate-400">
              Accuracy % across completed drills.
            </p>
          </div>

          {hasTrendData ? (
            <div className="h-48 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.accuracyTrend} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} unit="%" />
                  <Tooltip content={<AccuracyTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    dot={{ fill: '#4f46e5', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-8 text-center bg-slate-50 rounded-xl space-y-1 my-2">
              <p className="text-xs font-semibold text-slate-700">
                Complete one more drill to see your trend line.
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                1 of 2 drills completed
              </p>
            </div>
          )}
        </div>

        {/* CHART 2 — SPEED TREND */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Speed Trend
            </h2>
            <p className="text-xs text-slate-400">
              Average seconds per question.
            </p>
          </div>

          {hasTrendData ? (
            <div className="h-48 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.timeTrend} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} unit="s" />
                  <Tooltip content={<SpeedTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="avgTimeSeconds"
                    stroke="#059669"
                    strokeWidth={2.5}
                    dot={{ fill: '#059669', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-8 text-center bg-slate-50 rounded-xl space-y-1 my-2">
              <p className="text-xs font-semibold text-slate-700">
                Complete one more drill to see your speed trend.
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                1 of 2 drills completed
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Topic Performance */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900">
          Topic Performance
        </h2>

        <div className="space-y-3">
          {topicPerformance.map((topic) => (
            <div
              key={topic.id}
              className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{topic.name}</span>
                <span className="font-mono font-bold text-sm text-brand-600">
                  {formatAccuracy(topic.accuracy)}
                </span>
              </div>

              {/* Accuracy Meter */}
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    topic.accuracy >= 90
                      ? 'bg-emerald-500'
                      : topic.accuracy >= 70
                      ? 'bg-brand-600'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${topic.accuracy}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-1">
                <span>{topic.testsCount} drills &middot; {topic.questionsCount} questions</span>
                <span>{formatSeconds(topic.avgTimeMs)} / q</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Recent Attempts */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide px-1">
          Recent Drills
        </h2>

        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden divide-y divide-slate-100">
          {recentTests.map((t) => (
            <div
              key={t.id}
              className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
            >
              <div className="space-y-0.5">
                <div className="text-xs font-medium text-slate-400">
                  {formatDateTime(t.created_at)}
                </div>
                <div className="text-sm font-bold text-slate-900">
                  Fast Addition & Subtraction
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
                    {formatSeconds(t.average_time_ms)}
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
      </div>
    </div>
  );
}
