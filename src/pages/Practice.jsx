import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Play,
  Clock,
  ArrowRight,
  AlertTriangle,
  Loader2,
  Sliders,
  RotateCcw,
  CheckCircle,
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

  // Selected topic ID from query params or default
  const requestedTopicId = searchParams.get('topic') || 'fast-addition-subtraction';
  const [topicId, setTopicId] = useState(requestedTopicId);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(true);

  // Configuration options state
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

  // Load topics from database
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

  // Sync state if query parameter changes
  useEffect(() => {
    if (requestedTopicId) {
      setTopicId(requestedTopicId);
    }
  }, [requestedTopicId]);

  // Warn user before refreshing or leaving during an active test
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (testPhase === 'in_progress' || testPhase === 'save_error') {
        e.preventDefault();
        e.returnValue = 'You have a test in progress or pending save. Leaving will discard results.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [testPhase]);

  // Focus input automatically whenever current question index changes
  useEffect(() => {
    if (testPhase === 'in_progress' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, testPhase]);

  /**
   * Start Test: Generates questions and kicks off the timer
   */
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

    // Start timers
    totalTimer.reset();
    totalTimer.start();
    questionStartTimeRef.current = performance.now();
  };

  /**
   * Submits current answer and advances to next question or completes test
   */
  const handleAnswerSubmit = (e) => {
    if (e) e.preventDefault();
    if (isSubmittingQuestion) return; // Prevent double submit

    setIsSubmittingQuestion(true);

    const now = performance.now();
    const timeTakenMs = Math.round(now - questionStartTimeRef.current);
    const currentQ = questions[currentIndex];

    // Parse user input (allow empty/skipped or numeric)
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
      // Advance to next question
      setCurrentIndex((prev) => prev + 1);
      setUserAnswerInput('');
      questionStartTimeRef.current = performance.now();
      setIsSubmittingQuestion(false);
      setTimeout(() => inputRef.current?.focus(), 10);
    } else {
      // Completed all questions -> proceed to persistence
      finishAndSaveTest(nextCompleted);
    }
  };

  /**
   * Finish and save completed test strictly to Supabase PostgreSQL
   */
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

      // Successful persistence: navigate to the persisted result URL
      const persistedId = result.data.test.id;
      navigate(`/results/${persistedId}`);
    } catch (err) {
      console.error('Error completing test:', err);
      setSaveError(err.message || 'Failed to save test.');
      setTestPhase('save_error');
      setIsSubmittingQuestion(false);
    }
  };

  /**
   * Retry saving the completed test preserved in memory
   */
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

  /**
   * Handle user abandoning the test
   */
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
      <div className="max-w-2xl mx-auto py-12">
        <Alert variant="error" title="Topic Not Supported">
          The selected topic generator "{topicId}" is not registered in the system.
        </Alert>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPercent = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto py-2">
      {/* ======================================================== */}
      {/* 1. CONFIGURATION PHASE (Distraction-free)                */}
      {/* ======================================================== */}
      {testPhase === 'config' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-7 shadow-xs space-y-7">
          {/* Header */}
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Drill Configuration</span>
              <span>&middot;</span>
              <span>Speed Math</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {generator?.name || 'Fast Addition & Subtraction'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Select your parameters. Non-repeating question pairs are generated instantly on launch.
            </p>
          </div>

          {/* Option: Number of Questions */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Drill Length
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {config?.questionCounts.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  className={`py-2 px-1 text-xs font-mono font-medium rounded border transition-colors ${
                    questionCount === count
                      ? 'bg-slate-900 text-white border-slate-900 font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {count} Qs
                </button>
              ))}
            </div>
          </div>

          {/* Option: Operation */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Operation
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {config?.operations.map((op) => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setOperation(op.id)}
                  className={`p-3 rounded border text-left transition-colors ${
                    operation === op.id
                      ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900 text-slate-950'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-xs">{op.label}</span>
                    <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                      {op.symbol}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {op.id === 'both' ? 'Mixed +/- challenges' : `${op.label} drills`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Option: Difficulty */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              3. Difficulty Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {config?.difficulties.map((diff) => (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => setDifficulty(diff.id)}
                  className={`p-3 rounded border text-left transition-colors ${
                    difficulty === diff.id
                      ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900 text-slate-950'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                  }`}
                >
                  <div className="font-semibold text-xs mb-0.5">{diff.label}</div>
                  <div className="text-[11px] text-slate-500">{diff.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Option: Calculation Style */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              4. Calculation Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {config?.styles.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStyle(st.id)}
                  className={`p-3 rounded border text-left transition-colors ${
                    style === st.id
                      ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900 text-slate-950'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                  }`}
                >
                  <div className="font-semibold text-xs mb-0.5">{st.label}</div>
                  <div className="text-[11px] text-slate-500 leading-tight">{st.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 self-start sm:self-auto font-mono">
              Est. time: ~{questionCount * 4}s &middot; {questionCount} questions
            </div>

            <button
              type="button"
              onClick={handleStartTest}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-md bg-slate-900 text-white font-semibold text-xs sm:text-sm hover:bg-brand-700 shadow-xs transition-colors"
            >
              <Play className="w-3.5 h-3.5 mr-2 fill-white" />
              Start Practice Drill
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SAVING / PERSISTENCE STATE                            */}
      {/* ======================================================== */}
      {testPhase === 'saving' && (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
          <h2 className="text-base font-bold text-slate-900">
            Saving Attempt to Supabase...
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Persisting test and question attempt records to your database.
          </p>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SAVE ERROR / RETRY SCREEN                             */}
      {/* ======================================================== */}
      {testPhase === 'save_error' && completedStats && (
        <div className="bg-white border border-rose-200 rounded-lg p-6 shadow-xs space-y-5">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-md bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-slate-900">
                Attempt Could Not Be Saved to Supabase
              </h2>
              <p className="text-xs text-rose-700 mt-0.5">
                {saveError || 'Database operation failed. Please ensure RLS policies have been executed.'}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-3.5 text-xs">
            <span className="font-semibold text-slate-700 block mb-1">
              Preserved in Memory
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center mt-2">
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Score</span>
                <span className="font-bold text-slate-800 font-mono">
                  {completedStats.correctCount} / {completedStats.totalCount}
                </span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Accuracy</span>
                <span className="font-bold text-brand-700 font-mono">
                  {formatAccuracy(completedStats.accuracy)}
                </span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Total Time</span>
                <span className="font-bold text-slate-800 font-mono">
                  {formatDuration(completedStats.totalTimeMs)}
                </span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Avg / Question</span>
                <span className="font-bold text-slate-800 font-mono">
                  {formatSeconds(completedStats.averageTimeMs)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleConfirmQuit}
              className="w-full sm:w-auto px-3.5 py-2 rounded border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
            >
              Discard and Start Over
            </button>
            <button
              type="button"
              disabled={isRetryingSave}
              onClick={handleRetrySave}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
            >
              {isRetryingSave ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Retry Saving to Supabase
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. ACTIVE DRILL RUNNER (Extreme Focus Mode)              */}
      {/* ======================================================== */}
      {testPhase === 'in_progress' && currentQuestion && (
        <div className="space-y-4 sm:space-y-6">
          {/* Focused Top Header */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Drill
              </span>
              <span className="text-base font-bold font-mono text-slate-900">
                {currentIndex + 1} <span className="text-slate-400 font-normal text-xs">/ {questions.length}</span>
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5 text-slate-700 font-mono text-xs bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{formatDuration(totalTimer.elapsedMs)}</span>
              </div>

              <button
                type="button"
                onClick={() => setShowQuitModal(true)}
                className="text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors px-1.5 py-0.5"
              >
                Quit
              </button>
            </div>
          </div>

          {/* Subtle Progress Bar */}
          <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
            <div
              className="bg-slate-900 h-1 rounded-full transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Focused Question Workspace Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-12 text-center space-y-6 shadow-xs">
            <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
              {currentQuestion.operation} &middot; {currentQuestion.style}
            </div>

            {/* Massive Monospace Equation */}
            <div className="text-4xl sm:text-6xl font-mono font-bold tracking-tight text-slate-900 select-none py-2">
              {currentQuestion.num1} {currentQuestion.operatorSymbol} {currentQuestion.num2}
            </div>

            {/* Large Keyboard/Touch Answer Input */}
            <form onSubmit={handleAnswerSubmit} className="max-w-xs mx-auto space-y-4">
              <div className="relative">
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
                  className="w-full text-center text-3xl sm:text-4xl font-mono font-bold py-3.5 px-4 rounded-md border-2 border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-hidden transition-all text-slate-900 placeholder:text-slate-300 disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingQuestion}
                className="w-full inline-flex items-center justify-center min-h-[48px] px-6 py-3 rounded-md bg-slate-900 text-white font-semibold text-sm hover:bg-brand-700 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isSubmittingQuestion ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : currentIndex + 1 === questions.length ? (
                  'Complete Drill'
                ) : (
                  <>
                    <span>Submit & Next</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-400">
                Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-600 font-mono text-[10px]">Enter ↵</kbd>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal when quitting an active test */}
      <ConfirmModal
        isOpen={showQuitModal}
        title="Quit Drill?"
        message="Are you sure you want to abandon this drill? Incomplete attempts are discarded and not saved."
        confirmText="Yes, Abandon"
        cancelText="Resume Drill"
        variant="danger"
        onConfirm={handleConfirmQuit}
        onCancel={() => setShowQuitModal(false)}
      />
    </div>
  );
}
