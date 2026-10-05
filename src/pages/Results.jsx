import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  BarChart2,
  RotateCcw,
  Loader2,
  BookOpen,
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
          setError(fetchErr?.message || 'Could not load test attempt from Supabase.');
        } else {
          setTestData(data.test);
          setQuestions(data.questions || []);
        }
      } catch (err) {
        setError(err.message || 'Error retrieving test results from Supabase.');
      } finally {
        setLoading(false);
      }
    }

    loadTest();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-7 h-7 text-brand-600 animate-spin" />
        <p className="text-xs font-medium text-slate-500">Loading drill diagnostic from Supabase...</p>
      </div>
    );
  }

  if (error || !testData) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-4">
        <Alert variant="error" title="Diagnostic Record Not Found">
          {error || 'Unable to locate this drill record in the Supabase database.'}
        </Alert>
        <div className="text-center">
          <Link
            to="/practice"
            className="inline-flex items-center px-4 py-2 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
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
    <div className="space-y-6">
      {/* Header Diagnostic Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
          <div>
            <div className="flex items-center space-x-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Drill Diagnostic</span>
              <span>&middot;</span>
              <span>Supabase Persisted</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Performance Summary
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Completed on {formatDateTime(testData.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/practice"
              className="inline-flex items-center px-3.5 py-1.5 rounded-md bg-slate-900 text-white text-xs font-semibold hover:bg-brand-700 transition-colors shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Practice Again
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
            >
              <BarChart2 className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              My Progress
            </Link>
          </div>
        </div>

        {/* 4 Crisp Key Metric Panels */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-center">
            <span className="text-[11px] text-slate-400 block font-medium">Score</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-0.5">
              {correctCount} <span className="text-slate-400 text-sm font-normal">/ {questionCount}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {incorrectCount} incorrect
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-center">
            <span className="text-[11px] text-slate-400 block font-medium">Accuracy</span>
            <div
              className={`text-xl sm:text-2xl font-bold font-mono mt-0.5 ${
                accuracy >= 90
                  ? 'text-emerald-700'
                  : accuracy >= 70
                  ? 'text-brand-700'
                  : 'text-amber-700'
              }`}
            >
              {formatAccuracy(accuracy)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {accuracy >= 90 ? 'Target Met' : accuracy >= 70 ? 'Satisfactory' : 'Needs Practice'}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-center">
            <span className="text-[11px] text-slate-400 block font-medium">Total Duration</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-0.5">
              {formatDuration(totalTimeMs)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Session time</span>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-center">
            <span className="text-[11px] text-slate-400 block font-medium">Average Speed</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-0.5">
              {formatSeconds(averageTimeMs)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Per question</span>
          </div>
        </div>
      </div>

      {/* Detailed Question Review Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Question-by-Question Review ({questions.length})
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">Response Logs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-3 text-center w-12">#</th>
                <th className="py-2.5 px-3">Question</th>
                <th className="py-2.5 px-3">Your Answer</th>
                <th className="py-2.5 px-3">Correct Answer</th>
                <th className="py-2.5 px-3 text-center">Result</th>
                <th className="py-2.5 px-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {questions.map((q, idx) => {
                const isCorrect = Boolean(q.is_correct ?? q.isCorrect);
                const qNum = q.question_number || idx + 1;
                const timeMs = q.time_taken_ms || 0;
                const userAnswer = q.user_answer;
                const correctAnswer = q.correct_answer;

                return (
                  <tr
                    key={q.id || idx}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      !isCorrect ? 'bg-rose-50/40' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center text-slate-400 text-[11px]">
                      {qNum}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {q.question}
                    </td>
                    <td className="py-2.5 px-3">
                      {userAnswer !== null && userAnswer !== undefined ? (
                        <span
                          className={
                            isCorrect
                              ? 'text-emerald-700 font-bold'
                              : 'text-rose-600 font-bold line-through'
                          }
                        >
                          {userAnswer}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Skipped</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">
                      {correctAnswer}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {isCorrect ? (
                        <span className="inline-flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded text-[10px] font-medium">
                          <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                          Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded text-[10px] font-medium">
                          <XCircle className="w-3 h-3 mr-1 text-rose-600" />
                          Incorrect
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500 text-[11px]">
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
