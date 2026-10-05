import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Zap,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  ArrowRight,
  AlertTriangle,
  Loader2,
  Sliders,
} from 'lucide-react';
import { getTopicGenerator } from '../generators';
import { getTopics } from '../services/topicsService';
import { saveTestAttempt } from '../services/testsService';
import { useTimer } from '../hooks/useTimer';
import { formatDuration, formatSeconds } from '../utils/formatters';
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

  // Test Execution State: 'config' | 'in_progress' | 'saving'
  const [testPhase, setTestPhase] = useState('config');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswerInput, setUserAnswerInput] = useState('');
  const [completedQuestions, setCompletedQuestions] = useState([]);
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [saveError, setSaveError] = useState(null);

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
          // If requested topic is available, keep it, else default to first
          const found = data.some((t) => t.id === requestedTopicId);
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
      if (testPhase === 'in_progress') {
        e.preventDefault();
        e.returnValue = 'You have a test in progress. Incomplete tests will not be saved.';
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
      // Refocus input
      setTimeout(() => inputRef.current?.focus(), 10);
    } else {
      // Completed all questions!
      finishTest(nextCompleted);
    }
  };

  /**
   * Finish and save the completed test attempt
   */
  const finishTest = async (allCompleted) => {
    totalTimer.pause();
    setTestPhase('saving');

    const totalTimeMs = totalTimer.getElapsedMs();
    const totalCount = allCompleted.length;
    const correctCount = allCompleted.filter((q) => q.isCorrect).length;
    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 1000) / 10 : 0;
    const averageTimeMs = totalCount > 0 ? Math.round(totalTimeMs / totalCount) : 0;

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

      if (result.error && !result.data) {
        setSaveError(result.error.message || 'Error saving test results.');
        setTestPhase('in_progress');
        setIsSubmittingQuestion(false);
        return;
      }

      // Navigate to results page
      const testId = result.data?.test?.id;
      if (testId) {
        navigate(`/results/${testId}`, {
          state: {
            test: result.data.test,
            questions: result.data.questions || allCompleted,
            savedToSupabase: result.savedToSupabase,
          },
        });
      } else {
        // Fallback navigation with in-memory state
        navigate(`/results/local`, {
          state: {
            test: {
              id: 'local',
              topic_id: topicId,
              question_count: totalCount,
              correct_count: correctCount,
              accuracy,
              total_time_ms: totalTimeMs,
              average_time_ms: averageTimeMs,
              created_at: new Date().toISOString(),
            },
            questions: allCompleted,
            savedToSupabase: false,
          },
        });
      }
    } catch (err) {
      console.error('Error completing test:', err);
      setSaveError(err.message || 'Failed to save test.');
      setTestPhase('in_progress');
      setIsSubmittingQuestion(false);
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
    setIsSubmittingQuestion(false);
  };

  // If topic generator not found
  if (!generator && !loadingTopics) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Alert variant="error" title="Topic Not Supported">
          The selected topic generator "{topicId}" is not registered in the system.
        </Alert>
      </div>
    );
  }

  // Current active question
  const currentQuestion = questions[currentIndex];
  const progressPercent = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto py-4">
      {/* ======================================================== */}
      {/* 1. CONFIGURATION PHASE                                   */}
      {/* ======================================================== */}
      {testPhase === 'config' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sliders className="w-3.5 h-3.5" />
              <span>Test Configuration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {generator?.name || 'Speed Math Practice'}
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Customize your calculation drill parameters. Questions are generated dynamically with zero repetition.
            </p>
          </div>

          {/* Option: Number of Questions */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-800">
              Number of Questions
            </label>
            <div className="flex flex-wrap gap-2">
              {config?.questionCounts.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    questionCount === count
                      ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600 ring-offset-2'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {count} Questions
                </button>
              ))}
            </div>
          </div>

          {/* Option: Operation */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-800">
              Operation Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {config?.operations.map((op) => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setOperation(op.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    operation === op.id
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/30 text-indigo-950'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{op.label}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {op.symbol}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {op.id === 'both' ? 'Mixed +/- challenges' : `${op.label} drills`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Option: Difficulty */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-800">
              Difficulty Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {config?.difficulties.map((diff) => (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => setDifficulty(diff.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    difficulty === diff.id
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/30 text-indigo-950'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                  }`}
                >
                  <div className="font-semibold text-sm mb-1">{diff.label}</div>
                  <div className="text-xs text-slate-500">{diff.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Option: Calculation Style */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-800">
              Calculation Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {config?.styles.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStyle(st.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    style === st.id
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/30 text-indigo-950'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                  }`}
                >
                  <div className="font-semibold text-sm mb-1">{st.label}</div>
                  <div className="text-xs text-slate-500">{st.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Est. time: <span className="font-semibold text-slate-700">~{questionCount * 4}s</span> ({questionCount} questions)
            </div>

            <button
              type="button"
              onClick={handleStartTest}
              className="inline-flex items-center px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Play className="w-4 h-4 mr-2 fill-white" />
              Start Practice Drill
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SAVING / PERSISTENCE STATE                            */}
      {/* ======================================================== */}
      {testPhase === 'saving' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-sm text-center space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">
            Saving Your Completed Test...
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Computing final accuracy, response times, and saving results to your database.
          </p>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. ACTIVE TEST TAKING PHASE                              */}
      {/* ======================================================== */}
      {testPhase === 'in_progress' && currentQuestion && (
        <div className="space-y-6">
          {saveError && (
            <Alert variant="error" title="Notice">
              {saveError}
            </Alert>
          )}

          {/* Top Bar: Progress & Timers */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Question
              </span>
              <span className="text-lg font-bold text-slate-900">
                {currentIndex + 1} <span className="text-slate-400 text-sm font-normal">/ {questions.length}</span>
              </span>
            </div>

            {/* Test Elapsed Timer */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5 text-slate-600 font-mono text-sm bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>{formatDuration(totalTimer.elapsedMs)}</span>
              </div>

              <button
                type="button"
                onClick={() => setShowQuitModal(true)}
                className="text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors px-2 py-1"
              >
                Quit
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm text-center space-y-8">
            <div className="text-xs font-medium uppercase tracking-widest text-indigo-600">
              {currentQuestion.operation.toUpperCase()} &middot; {currentQuestion.style}
            </div>

            {/* Large Equation Display */}
            <div className="text-5xl sm:text-6xl font-mono font-bold tracking-tight text-slate-900 select-none py-2">
              {currentQuestion.num1} {currentQuestion.operatorSymbol} {currentQuestion.num2}
            </div>

            {/* Answer Input Form */}
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
                    // Allow only digits and optional leading minus
                    const val = e.target.value;
                    if (val === '' || /^-?\d*$/.test(val)) {
                      setUserAnswerInput(val);
                    }
                  }}
                  placeholder="Your answer"
                  className="w-full text-center text-3xl font-mono font-semibold py-3 px-4 rounded-xl border-2 border-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-hidden transition-all text-slate-900 placeholder:text-slate-300 disabled:opacity-50"
                />
              </div>

              <div className="flex items-center justify-center space-x-3">
                <button
                  type="submit"
                  disabled={isSubmittingQuestion}
                  className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all disabled:opacity-50"
                >
                  {isSubmittingQuestion ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : currentIndex + 1 === questions.length ? (
                    'Finish Test'
                  ) : (
                    <>
                      <span>Next Question</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-600 font-mono">Enter ↵</kbd> to submit instantly
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal when quitting an active test */}
      <ConfirmModal
        isOpen={showQuitModal}
        title="Quit Test?"
        message="Are you sure you want to quit? Incomplete tests are not saved and your current score will be discarded."
        confirmText="Yes, Abandon Test"
        cancelText="Resume Practicing"
        variant="danger"
        onConfirm={handleConfirmQuit}
        onCancel={() => setShowQuitModal(false)}
      />
    </div>
  );
}
