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
  ChevronRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
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
import EmptyState from '../components/EmptyState';
import Alert from '../components/Alert';

/**
 * Custom Tooltip for Accuracy Trend Line Chart
 */
function AccuracyTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white text-xs rounded p-2.5 shadow-lg border border-slate-800 font-mono space-y-1">
        <div className="font-bold text-slate-200">{data.label}</div>
        <div className="text-[11px] text-slate-400">{data.date}</div>
        <div className="text-brand-300 font-bold pt-1 border-t border-slate-800 flex items-center justify-between gap-3">
          <span>Accuracy:</span>
          <span>{data.accuracy}%</span>
        </div>
        <div className="text-[10px] text-slate-400 flex items-center justify-between gap-3">
          <span>Score:</span>
          <span>{data.correctCount} / {data.questionCount} correct</span>
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Custom Tooltip for Speed Trend Line Chart
 */
function SpeedTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white text-xs rounded p-2.5 shadow-lg border border-slate-800 font-mono space-y-1">
        <div className="font-bold text-slate-200">{data.label}</div>
        <div className="text-[11px] text-slate-400">{data.date}</div>
        <div className="text-emerald-300 font-bold pt-1 border-t border-slate-800 flex items-center justify-between gap-3">
          <span>Average Speed:</span>
          <span>{data.avgTimeSeconds}s / question</span>
        </div>
        <div className="text-[10px] text-slate-400 flex items-center justify-between gap-3">
          <span>Total Duration:</span>
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
      console.error('Failed to load dashboard statistics:', err);
      setError('Unable to load your progress data.');
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

  // Error State
  if (error) {
    return (
      <div className="space-y-6 py-4 max-w-2xl mx-auto">
        <Alert variant="error" title="Unable to load your progress data.">
          {error}. Please verify your Supabase database connection and try again.
        </Alert>
        <div className="text-center">
          <button
            type="button"
            onClick={loadStats}
            className="inline-flex items-center px-4 py-2 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Clean Empty State (0 tests completed)
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
            Personal performance metrics and accuracy trends computed from Supabase.
          </p>
        </div>

        <EmptyState
          icon={BarChart2}
          title="No practice history yet."
          description="Complete your first drill to start tracking your progress."
          actionText="Start Practice"
          actionLink="/practice"
        />
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
    bestAccuracy,
    recentTests,
    topicPerformance,
    charts,
  } = stats;

  const hasTrendData = totalTests >= 2;
  const correctPercent = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const incorrectPercent = Math.max(0, 100 - correctPercent);

  return (
    <div className="space-y-7 sm:space-y-9">
      {/* 1. Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          <span>Diagnostics</span>
          <span>&middot;</span>
          <span>Visual Analytics</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              My Progress
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Personal performance metrics, speed trajectories, and topic breakdowns computed from Supabase.
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

      {/* 2. Key Performance Indicators (KPI) Strip */}
      <section className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Key Performance Indicators
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">
            {totalTests} {totalTests === 1 ? 'drill' : 'drills'} recorded
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Drills Completed */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-[11px] text-slate-500 block font-medium">Drills Completed</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {totalTests}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Finished sessions</span>
          </div>

          {/* Questions Solved */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-[11px] text-slate-500 block font-medium">Questions Solved</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {totalQuestions}
            </div>
            <div className="flex items-center space-x-1 text-[10px] text-slate-400 mt-0.5">
              <span className="text-emerald-700 font-mono font-semibold">{totalCorrect} correct</span>
              <span>&middot;</span>
              <span className="text-slate-500 font-mono">{totalIncorrect} incorrect</span>
            </div>
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
            <span className="text-[10px] text-slate-400 mt-0.5 block">Weighted average</span>
          </div>

          {/* Average Speed */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-[11px] text-slate-500 block font-medium">Average Speed</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {formatSeconds(averageTimePerQuestionMs)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Per question</span>
          </div>

          {/* Best Accuracy */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-500 block font-medium">Best Accuracy</span>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
              {formatAccuracy(bestAccuracy)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Single drill record</span>
          </div>
        </div>

        {/* Visual Summary: Questions Solved Ratio Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
            <span>Question Volume Breakdown</span>
            <span className="font-mono text-[11px]">
              {totalCorrect} / {totalQuestions} Correct ({correctPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
            <div
              className="bg-emerald-600 h-2 transition-all duration-300"
              style={{ width: `${correctPercent}%` }}
              title={`${totalCorrect} correct questions (${correctPercent}%)`}
            />
            {totalIncorrect > 0 && (
              <div
                className="bg-rose-500 h-2 transition-all duration-300"
                style={{ width: `${incorrectPercent}%` }}
                title={`${totalIncorrect} incorrect questions (${incorrectPercent}%)`}
              />
            )}
          </div>
        </div>
      </section>

      {/* 3. Performance Trends (Accuracy & Speed Line Charts) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Performance Trends
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualizing accuracy and speed progression across completed practice drills.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* CHART 1 — ACCURACY TREND */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2 border-b border-slate-100 pb-2.5">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Accuracy Trend
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Your accuracy across completed practice drills.
                  </p>
                </div>
                {hasTrendData && (
                  <span className="text-[11px] font-mono font-bold text-brand-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    Y: % Accuracy
                  </span>
                )}
              </div>

              {hasTrendData ? (
                <div className="h-56 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.accuracyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" />
                      <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} unit="%" />
                      <Tooltip content={<AccuracyTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="accuracy"
                        stroke="#0284c7"
                        strokeWidth={2.5}
                        dot={{ fill: '#0284c7', r: 3.5 }}
                        activeDot={{ r: 5.5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-10 px-4 text-center bg-slate-50 rounded border border-slate-100 my-2 space-y-2">
                  <p className="text-xs font-semibold text-slate-700">
                    Complete one more drill to reveal your accuracy trend.
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    1 of 2 drills completed
                  </p>
                  <div className="max-w-xs mx-auto bg-slate-200 rounded-full h-1.5 overflow-hidden mt-2">
                    <div className="bg-brand-600 h-1.5 rounded-full w-1/2" />
                  </div>
                  {charts.accuracyTrend[0] && (
                    <div className="pt-2 text-[11px] text-slate-500 font-mono">
                      Current benchmark (Drill #1): <span className="font-bold text-slate-800">{charts.accuracyTrend[0].accuracy}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 flex items-center justify-between font-mono">
              <span>Order: Chronological</span>
              {hasTrendData && <span>{charts.accuracyTrend.length} data points</span>}
            </div>
          </div>

          {/* CHART 2 — SPEED TREND */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2 border-b border-slate-100 pb-2.5">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Average Speed
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Average time taken per question across completed drills.
                  </p>
                </div>
                {hasTrendData && (
                  <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    Y: Seconds/Q
                  </span>
                )}
              </div>

              {hasTrendData ? (
                <div className="h-56 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.timeTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" />
                      <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} unit="s" />
                      <Tooltip content={<SpeedTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="avgTimeSeconds"
                        stroke="#0f766e"
                        strokeWidth={2.5}
                        dot={{ fill: '#0f766e', r: 3.5 }}
                        activeDot={{ r: 5.5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-10 px-4 text-center bg-slate-50 rounded border border-slate-100 my-2 space-y-2">
                  <p className="text-xs font-semibold text-slate-700">
                    Complete one more drill to reveal your speed trend.
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    1 of 2 drills completed
                  </p>
                  <div className="max-w-xs mx-auto bg-slate-200 rounded-full h-1.5 overflow-hidden mt-2">
                    <div className="bg-emerald-600 h-1.5 rounded-full w-1/2" />
                  </div>
                  {charts.timeTrend[0] && (
                    <div className="pt-2 text-[11px] text-slate-500 font-mono">
                      Current benchmark (Drill #1): <span className="font-bold text-slate-800">{charts.timeTrend[0].avgTimeSeconds}s / question</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 flex items-center justify-between font-mono">
              <span>Goal: Lower is faster</span>
              {hasTrendData && <span>{charts.timeTrend.length} data points</span>}
            </div>
          </div>
        </div>
      </section>

      {/* 4. CHART 3 — TOPIC PERFORMANCE */}
      <section className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Topic Performance Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Accuracy and speed metrics across syllabus topics.
            </p>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {topicPerformance.length} {topicPerformance.length === 1 ? 'module active' : 'modules active'}
          </span>
        </div>

        <div className="space-y-3">
          {topicPerformance.map((topic) => (
            <div
              key={topic.id}
              className="bg-slate-50 border border-slate-200 rounded-md p-3.5 sm:p-4 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-900 text-sm">{topic.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono">
                      {topic.category}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/practice?topic=${encodeURIComponent(topic.id)}`}
                  className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-800 self-start sm:self-auto"
                >
                  <Play className="w-3 h-3 mr-1 fill-brand-600" />
                  Practice This Topic
                  <ChevronRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>

              {/* Horizontal Accuracy Meter Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Accuracy Meter</span>
                  <span className="font-bold text-slate-900">{formatAccuracy(topic.accuracy)}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      topic.accuracy >= 90
                        ? 'bg-emerald-600'
                        : topic.accuracy >= 70
                        ? 'bg-brand-600'
                        : 'bg-amber-600'
                    }`}
                    style={{ width: `${topic.accuracy}%` }}
                  />
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/80 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Completed Drills</span>
                  <span className="font-bold text-slate-800">{topic.testsCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Questions Solved</span>
                  <span className="font-bold text-slate-800">{topic.questionsCount}</span>
                  <span className="text-[10px] text-slate-400 block font-sans">({topic.correctCount} correct)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Accuracy</span>
                  <span className={`font-bold ${topic.accuracy >= 90 ? 'text-emerald-700' : 'text-brand-700'}`}>
                    {formatAccuracy(topic.accuracy)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Average Speed</span>
                  <span className="font-bold text-slate-800">{formatSeconds(topic.avgTimeMs)}</span>
                  <span className="text-[10px] text-slate-400 block font-sans">per question</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Recent Practice Attempts Table */}
      <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Recent Practice Attempts
            </h2>
            <p className="text-[11px] text-slate-500">
              Latest drill history from Supabase.
            </p>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {recentTests.length} {recentTests.length === 1 ? 'drill' : 'drills'}
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
