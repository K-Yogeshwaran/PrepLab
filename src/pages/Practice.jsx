import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Play,
  Clock,
  ArrowRight,
  AlertTriangle,
  Loader2,
  RotateCcw,
  X,
} from 'lucide-react';
import { getTopicGenerator } from '../generators';
import { getTopics } from '../services/topicsService';
import { saveTestAttempt } from '../services/testsService';
import { useTimer } from '../hooks/useTimer';
import { formatDuration, formatSeconds, formatAccuracy } from '../utils/formatters';
import ConfirmModal from '../components/ConfirmModal';
import Alert from '../components/Alert';

export default function Practice() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const requestedTopicId = searchParams.get('topic') || 'fast-addition-subtraction';
  const [topicId, setTopicId] = useState(requestedTopicId);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(true);

  const generator = getTopicGenerator(topicId);
  const config = generator?.config;

  const [questionCount, setQuestionCount] = useState(10);
  const [operation, setOperation] = useState('both');
  const [difficulty, setDifficulty] = useState('mixed');
  const [style, setStyle] = useState('mixed');

  // Test Execution State: 'config' | 'in_progress' | 'saving' | 'save_error'
  const [testPhase, setTestPhase] = useState('config');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswerInput, setUserAnswerInput] = useState('');
  const [completedQuestions, setCompletedQuestions] = useState([]);
  const [completedStats, setCompletedStats] = useState(null);
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [isRetryingSave, setIsRetryingSave] = useState(false);

  // Abandon Confirmation Modal
  const [showQuitModal, setShowQuitModal] = useState(false);

  // Timers
  const totalTimer = useTimer(false);
  const questionStartTimeRef = useRef(0);
  const inputRef = useRef(null);

  useEffect(() => {
    async function loadTopics() {
      try {
        const { data } = await getTopics();
        if (data && data.length > 0) {
          setAvailableTopics(data);
          const found = data.some(
            (t) => String(t.id) === requestedTopicId || t.name === requestedTopicId
          );
          if (found) {
            setTopicId(requestedTopicId);
          } else {
            setTopicId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching topics in practice page:', err);
      } finally {
        setLoadingTopics(false);
      }
    }
    loadTopics();
  }, [requestedTopicId]);

  useEffect(() => {
    if (requestedTopicId) {
      setTopicId(requestedTopicId);
    }
  }, [requestedTopicId]);

  // Warn before unload during active drill
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (testPhase === 'in_progress' || testPhase === 'save_error') {
        e.preventDefault();
        e.returnValue = 'You have a drill in progress. Leaving will discard results.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [testPhase]);

  // Auto-focus input
  useEffect(() => {
    if (testPhase === 'in_progress' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, testPhase]);

  const handleStartTest = () => {
    if (!generator) return;

    const generated = generator.generateQuestions({
      count: questionCount,
      operation,
      difficulty,
      style,
    });

    if (!generated || generated.length === 0) {
      alert('Could not generate questions. Please adjust test options.');
      return;
    }

    setQuestions(generated);
    setCurrentIndex(0);
    setUserAnswerInput('');
    setCompletedQuestions([]);
    setCompletedStats(null);
    setSaveError(null);
    setTestPhase('in_progress');

    totalTimer.reset();
    totalTimer.start();
    questionStartTimeRef.current = performance.now();
  };

  const handleAnswerSubmit = (e) => {
    if (e) e.preventDefault();
    if (isSubmittingQuestion) return;

    setIsSubmittingQuestion(true);

    const now = performance.now();
    const timeTakenMs = Math.round(now - questionStartTimeRef.current);
    const currentQ = questions[currentIndex];

    const trimmed = userAnswerInput.trim();
    const parsedUserAnswer = trimmed === '' ? null : parseInt(trimmed, 10);
    const isCorrect = parsedUserAnswer !== null && parsedUserAnswer === currentQ.correctAnswer;

    const record = {
      ...currentQ,
      userAnswer: parsedUserAnswer,
      isCorrect,
      timeTakenMs,
    };

    const nextCompleted = [...completedQuestions, record];
    setCompletedQuestions(nextCompleted);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setUserAnswerInput('');
      questionStartTimeRef.current = performance.now();
      setIsSubmittingQuestion(false);
      setTimeout(() => inputRef.current?.focus(), 10);
    } else {
      finishAndSaveTest(nextCompleted);
    }
  };

  const finishAndSaveTest = async (allCompleted) => {
    totalTimer.pause();
    setTestPhase('saving');

    const totalTimeMs = totalTimer.getElapsedMs();
    const totalCount = allCompleted.length;
    const correctCount = allCompleted.filter((q) => q.isCorrect).length;
    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 1000) / 10 : 0;
    const averageTimeMs = totalCount > 0 ? Math.round(totalTimeMs / totalCount) : 0;

    const stats = {
      totalTimeMs,
      totalCount,
      correctCount,
      accuracy,
      averageTimeMs,
    };
    setCompletedStats(stats);

    try {
      const result = await saveTestAttempt({
        topicId,
        questionCount: totalCount,
        correctCount,
        accuracy,
        totalTimeMs,
        averageTimeMs,
        questionAttempts: allCompleted,
      });

      if (result.error || !result.data?.test?.id) {
        setSaveError(
          result.error?.message ||
            'Could not persist test results to Supabase. Check database policies and connection.'
        );
        setTestPhase('save_error');
        setIsSubmittingQuestion(false);
        return;
      }

      const persistedId = result.data.test.id;
      navigate(`/results/${persistedId}`);
    } catch (err) {
      console.error('Error completing test:', err);
      setSaveError(err.message || 'Failed to save test.');
      setTestPhase('save_error');
      setIsSubmittingQuestion(false);
    }
  };

  const handleRetrySave = async () => {
    if (!completedStats || completedQuestions.length === 0) return;
    setIsRetryingSave(true);
    setSaveError(null);

    try {
      const result = await saveTestAttempt({
        topicId,
        questionCount: completedStats.totalCount,
        correctCount: completedStats.correctCount,
        accuracy: completedStats.accuracy,
        totalTimeMs: completedStats.totalTimeMs,
        averageTimeMs: completedStats.averageTimeMs,
        questionAttempts: completedQuestions,
      });

      if (result.error || !result.data?.test?.id) {
        setSaveError(
          result.error?.message || 'Database insert failed. Please ensure RLS policies allow inserts.'
        );
        setIsRetryingSave(false);
        return;
      }

      const persistedId = result.data.test.id;
      navigate(`/results/${persistedId}`);
    } catch (err) {
      setSaveError(err.message || 'Retry failed.');
      setIsRetryingSave(false);
    }
  };

  const handleConfirmQuit = () => {
    setShowQuitModal(false);
    totalTimer.pause();
    totalTimer.reset();
    setTestPhase('config');
    setQuestions([]);
    setCurrentIndex(0);
    setUserAnswerInput('');
    setCompletedQuestions([]);
    setCompletedStats(null);
    setSaveError(null);
    setIsSubmittingQuestion(false);
  };

  if (!generator && !loadingTopics) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Alert variant="error" title="Topic Not Found">
          The selected topic generator is not registered.
        </Alert>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPercent = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* ======================================================== */}
      {/* 1. CONFIGURATION PHASE (Simple, focused choices)          */}
      {/* ======================================================== */}
      {testPhase === 'config' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Practice Drill
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Choose your practice settings and start.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
            {/* Topic Display */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Topic
              </label>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 font-semibold text-sm text-slate-900 flex items-center justify-between">
                <span>{generator?.name || 'Fast Addition & Subtraction'}</span>
                <span className="text-xs font-medium text-brand-600">Speed Math</span>
              </div>
            </div>

            {/* Question Count */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Question Count
              </label>
              <div className="grid grid-cols-5 gap-2">
                {config?.questionCounts.map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    className={`py-2.5 px-2 text-xs font-mono font-bold rounded-xl border transition-all ${
                      questionCount === count
                        ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Operation */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Operation
              </label>
              <div className="grid grid-cols-3 gap-2">
                {config?.operations.map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setOperation(op.id)}
                    className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                      operation === op.id
                        ? 'bg-brand-50 border-brand-600 text-brand-900 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs">{op.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Difficulty
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {config?.difficulties.map((diff) => (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => setDifficulty(diff.id)}
                    className={`py-2.5 px-2 rounded-xl border text-center text-xs transition-all ${
                      difficulty === diff.id
                        ? 'bg-brand-50 border-brand-600 text-brand-900 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    {diff.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {config?.styles.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStyle(st.id)}
                    className={`py-2.5 px-2 rounded-xl border text-center text-xs transition-all ${
                      style === st.id
                        ? 'bg-brand-50 border-brand-600 text-brand-900 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-3">
              <button
                type="button"
                onClick={handleStartTest}
                className="w-full inline-flex items-center justify-center min-h-[48px] py-3.5 px-6 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 shadow-xs hover:shadow transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 mr-2 fill-white" />
                Start Practice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SAVING STATE                                          */}
      {/* ======================================================== */}
      {testPhase === 'saving' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
          <h2 className="text-base font-bold text-slate-900">
            Saving results...
          </h2>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SAVE ERROR / RETRY SCREEN                             */}
      {/* ======================================================== */}
      {testPhase === 'save_error' && completedStats && (
        <div className="bg-white border border-rose-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-slate-900">
                Could Not Save to Database
              </h2>
              <p className="text-xs text-rose-600 mt-0.5">
                {saveError || 'Connection error while persisting drill.'}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 text-xs font-mono grid grid-cols-2 sm:grid-cols-4 gap-2 text-center border border-slate-200/60">
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Score</span>
              <span className="font-bold text-slate-900">{completedStats.correctCount} / {completedStats.totalCount}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Accuracy</span>
              <span className="font-bold text-emerald-600">{formatAccuracy(completedStats.accuracy)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Time</span>
              <span className="font-bold text-slate-900">{formatDuration(completedStats.totalTimeMs)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">Avg Speed</span>
              <span className="font-bold text-slate-900">{formatSeconds(completedStats.averageTimeMs)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleConfirmQuit}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
            >
              Discard
            </button>
            <button
              type="button"
              disabled={isRetryingSave}
              onClick={handleRetrySave}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors shadow-xs disabled:opacity-50"
            >
              {isRetryingSave ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Retry Saving
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. ACTIVE DRILL RUNNER (Dedicated Study Environment)     */}
      {/* ======================================================== */}
      {testPhase === 'in_progress' && currentQuestion && (
        <div className="space-y-4 sm:space-y-6 pt-2">
          {/* Top Bar: Question Counter, Timer, Quit */}
          <div className="flex items-center justify-between px-1">
            <div className="text-sm font-semibold text-slate-500">
              Question <span className="font-bold text-slate-900 font-mono text-base">{currentIndex + 1}</span> of <span className="font-mono">{questions.length}</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 text-slate-600 font-mono text-xs font-medium bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-xs">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatDuration(totalTimer.elapsedMs)}</span>
              </div>

              <button
                type="button"
                onClick={() => setShowQuitModal(true)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                title="Quit practice"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Smooth Progress Bar */}
          <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-brand-600 h-1.5 rounded-full transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Focused Equation Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 sm:p-14 text-center space-y-8 shadow-xs">
            {/* Dominant Monospace Equation */}
            <div className="text-5xl sm:text-7xl font-mono font-bold tracking-tight text-slate-900 select-none py-4">
              {currentQuestion.num1} {currentQuestion.operatorSymbol} {currentQuestion.num2}
            </div>

            {/* Large Comfortable Answer Input */}
            <form onSubmit={handleAnswerSubmit} className="max-w-xs mx-auto space-y-4">
              <div>
                <input
                  ref={inputRef}
                  type="text"
                  pattern="[0-9-]*"
                  inputMode="numeric"
                  autoComplete="off"
                  value={userAnswerInput}
                  disabled={isSubmittingQuestion}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^-?\d*$/.test(val)) {
                      setUserAnswerInput(val);
                    }
                  }}
                  placeholder="?"
                  className="w-full text-center text-4xl sm:text-5xl font-mono font-bold py-3.5 px-4 rounded-xl border-2 border-slate-200 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 outline-hidden transition-all text-slate-900 placeholder:text-slate-300 disabled:opacity-50 shadow-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingQuestion}
                className="w-full inline-flex items-center justify-center min-h-[48px] px-6 py-3.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-colors disabled:opacity-50 cursor-pointer shadow-xs hover:shadow"
              >
                {isSubmittingQuestion ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : currentIndex + 1 === questions.length ? (
                  'Complete'
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </button>

              <div className="text-xs text-slate-400">
                Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-500 font-mono text-[10px]">Enter ↵</kbd>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal when quitting */}
      <ConfirmModal
        isOpen={showQuitModal}
        title="Abandon Practice?"
        message="Are you sure you want to stop? Incomplete attempts are discarded."
        confirmText="Abandon"
        cancelText="Keep Going"
        variant="danger"
        onConfirm={handleConfirmQuit}
        onCancel={() => setShowQuitModal(false)}
      />
    </div>
  );
}
