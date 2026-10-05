import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Target,
  BarChart3,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { getTestAttemptById } from '../services/testsService';
import { formatDuration, formatSeconds, formatAccuracy, formatDateTime } from '../utils/formatters';
import Alert from '../components/Alert';

export default function Results() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Try to use navigation state if passed from test runner
  const initialData = location.state?.test ? location.state : null;

  const [testData, setTestData] = useState(initialData?.test || null);
  const [questions, setQuestions] = useState(initialData?.questions || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [savedToSupabase, setSavedToSupabase] = useState(initialData?.savedToSupabase ?? true);

  useEffect(() => {
    // If we already have the state from navigation, don't refetch unless missing
    if (initialData?.test && initialData?.questions?.length > 0) {
      setLoading(false);
      return;
    }

    async function loadTest() {
      if (!id) return;
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchErr } = await getTestAttemptById(id);
        if (fetchErr || !data) {
          setError(fetchErr?.message || 'Could not load test attempt.');
        } else {
          setTestData(data.test);
          setQuestions(data.questions || []);
          setSavedToSupabase(data.source === 'supabase');
        }
      } catch (err) {
        setError(err.message || 'Error retrieving test results.');
      } finally {
        setLoading(false);
      }
    }

    loadTest();
  }, [id, initialData]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading test results...</p>
      </div>
    );
  }

  if (error || !testData) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-4">
        <Alert variant="error" title="Test Not Found">
          {error || 'Unable to locate this test record. It may not exist or database access failed.'}
        </Alert>
        <div className="text-center">
          <Link
            to="/practice"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Start a New Practice Drill
          </Link>
        </div>
      </div>
    );
  }

  const questionCount = parseInt(testData.question_count, 10) || questions.length || 0;
  const correctCount = parseInt(testData.correct_count, 10) || 0;
  const incorrectCount = questionCount - correctCount;
  const accuracy = parseFloat(testData.accuracy) || 0;
  const totalTimeMs = parseInt(testData.total_time_ms, 10) || 0;
  const averageTimeMs = parseInt(testData.average_time_ms, 10) || 0;

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
          <div>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
              Practice Completed
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Test Results
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Completed on {formatDateTime(testData.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/practice"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Practice Again
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              <BarChart3 className="w-4 h-4 mr-1.5 text-slate-500" />
              Dashboard
            </Link>
          </div>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
            <span className="text-xs text-slate-500 font-medium block mb-1">Score</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
              {correctCount} <span className="text-slate-400 text-base font-normal">/ {questionCount}</span>
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              {incorrectCount} incorrect
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
            <span className="text-xs text-slate-500 font-medium block mb-1">Accuracy</span>
            <div className={`text-2xl sm:text-3xl font-bold font-mono ${
              accuracy >= 90 ? 'text-emerald-600' : accuracy >= 70 ? 'text-indigo-600' : 'text-amber-600'
            }`}>
              {formatAccuracy(accuracy)}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              {accuracy >= 90 ? 'Excellent' : accuracy >= 70 ? 'Good Pace' : 'Keep Drilling'}
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
            <span className="text-xs text-slate-500 font-medium block mb-1">Total Time</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
              {formatDuration(totalTimeMs)}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              Entire test
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
            <span className="text-xs text-slate-500 font-medium block mb-1">Avg Time / Q</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
              {formatSeconds(averageTimeMs)}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              Per calculation
            </span>
          </div>
        </div>
      </div>

      {/* Question-by-Question Review */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Question Review ({questions.length})
          </h2>
          <span className="text-xs text-slate-500">
            Real response breakdown
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 text-center w-14">#</th>
                <th className="py-3 px-4">Question</th>
                <th className="py-3 px-4">Your Answer</th>
                <th className="py-3 px-4">Correct Answer</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {questions.map((q, idx) => {
                const isCorrect = Boolean(q.is_correct ?? q.isCorrect);
                const qNum = q.question_number || q.questionNumber || idx + 1;
                const timeMs = q.time_taken_ms ?? q.timeTakenMs ?? 0;
                const userAnswer = q.user_answer ?? q.userAnswer;
                const correctAnswer = q.correct_answer ?? q.correctAnswer;

                return (
                  <tr
                    key={q.id || idx}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      !isCorrect ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center font-mono text-slate-400 text-xs">
                      {qNum}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {q.question}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {userAnswer !== null && userAnswer !== undefined ? (
                        <span className={isCorrect ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold line-through'}>
                          {userAnswer}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Skipped</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      {correctAnswer}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isCorrect ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                          Incorrect
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-500">
                      {formatSeconds(timeMs)}
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
