import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  TrendingUp,
  Loader2,
  Home,
  Check,
  X,
} from 'lucide-react';
import { getTestAttemptById } from '../services/testsService';
import { formatDuration, formatSeconds, formatAccuracy, formatDateTime } from '../utils/formatters';
import Alert from '../components/Alert';

export default function Results() {
  const { id } = useParams();

  const [testData, setTestData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadTest() {
      if (!id) return;
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchErr } = await getTestAttemptById(id);
        if (fetchErr || !data) {
          setError(fetchErr?.message || 'Could not load results from database.');
        } else {
          setTestData(data.test);
          setQuestions(data.questions || []);
        }
      } catch (err) {
        setError(err.message || 'Error retrieving test results.');
      } finally {
        setLoading(false);
      }
    }

    loadTest();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
        <p className="text-xs text-slate-400">Loading results...</p>
      </div>
    );
  }

  if (error || !testData) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-4">
        <Alert variant="error" title="Result Not Found">
          {error || 'Unable to locate this result.'}
        </Alert>
        <div className="text-center">
          <Link
            to="/practice"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors"
          >
            Start Practice
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
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* 1. Results Summary Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
              Practice Summary
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Drill Results
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatDateTime(testData.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/practice"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-brand-600 text-white text-xs sm:text-sm font-semibold hover:bg-brand-700 transition-colors shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Practice Again
            </Link>
            <Link
              to="/progress"
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-200/70 transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Progress
            </Link>
          </div>
        </div>

        {/* 4 Primary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
            <span className="text-xs text-slate-400 block font-medium">Accuracy</span>
            <div
              className={`text-2xl sm:text-3xl font-bold font-mono mt-1 ${
                accuracy >= 90
                  ? 'text-emerald-600'
                  : accuracy >= 70
                  ? 'text-brand-600'
                  : 'text-amber-600'
              }`}
            >
              {formatAccuracy(accuracy)}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
            <span className="text-xs text-slate-400 block font-medium">Correct</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 mt-1">
              {correctCount} <span className="text-slate-400 text-xs font-normal">/ {questionCount}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
            <span className="text-xs text-slate-400 block font-medium">Incorrect</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-500 mt-1">
              {incorrectCount}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
            <span className="text-xs text-slate-400 block font-medium">Avg Speed</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 mt-1">
              {formatSeconds(averageTimeMs)}
            </div>
            <span className="text-[10px] text-slate-400 block">per question</span>
          </div>
        </div>
      </div>

      {/* 2. Question Review Section */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide px-1">
          Question Review ({questions.length})
        </h2>

        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden divide-y divide-slate-100">
          {questions.map((q, idx) => {
            const isCorrect = Boolean(q.is_correct ?? q.isCorrect);
            const qNum = q.question_number || idx + 1;
            const timeMs = q.time_taken_ms || 0;
            const userAnswer = q.user_answer;
            const correctAnswer = q.correct_answer;

            return (
              <div
                key={q.id || idx}
                className={`p-4 flex items-center justify-between transition-colors ${
                  !isCorrect ? 'bg-rose-50/30' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCorrect
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {isCorrect ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 mr-2 font-mono">#{qNum}</span>
                    <span className="font-mono font-bold text-slate-900 text-base">
                      {q.question}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-right">
                  <div className="font-mono text-sm">
                    {userAnswer !== null && userAnswer !== undefined ? (
                      <span
                        className={
                          isCorrect
                            ? 'text-emerald-600 font-bold'
                            : 'text-rose-500 font-bold line-through mr-2'
                        }
                      >
                        {userAnswer}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic mr-2">Skipped</span>
                    )}

                    {!isCorrect && (
                      <span className="text-slate-900 font-bold">
                        {correctAnswer}
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                    {formatSeconds(timeMs)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
