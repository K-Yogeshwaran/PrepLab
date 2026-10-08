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
  ChevronDown,
  Search,
  Check,
  Filter,
} from 'lucide-react';
import { getTopicGenerator } from '../generators';
import { getTopics } from '../services/topicsService';
import { saveTestAttempt } from '../services/testsService';
import { useTimer } from '../hooks/useTimer';
import { formatDuration, formatSeconds, formatAccuracy } from '../utils/formatters';
import ConfirmModal from '../components/ConfirmModal';
import Alert from '../components/Alert';

export default function Practice() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL Query Parameters Parsing & Validation
  const requestedTopicParam = searchParams.get('topic') || '1';
  const requestedMode = searchParams.get('mode') || 'tables';
  const requestedSubMode = searchParams.get('subMode') || searchParams.get('drill') || 'memorization';
  const requestedCount = searchParams.get('count') ? parseInt(searchParams.get('count'), 10) : 20;

  // Single table param
  const requestedSingleTable = searchParams.get('table') ? parseInt(searchParams.get('table'), 10) : 17;

  // Multi-tables param (e.g. tables=12,13,14)
  const requestedTablesParam = searchParams.get('tables');
  const initialTablesList = requestedTablesParam
    ? requestedTablesParam
        .split(',')
        .map((t) => parseInt(t.trim(), 10))
        .filter((t) => !isNaN(t) && t >= 1 && t <= 20)
    : [requestedSingleTable];

  const requestedSquareMax = searchParams.get('squareMax') ? parseInt(searchParams.get('squareMax'), 10) : 50;
  const requestedCubeMax = searchParams.get('cubeMax') ? parseInt(searchParams.get('cubeMax'), 10) : 25;

  // Topic & DB State
  const [topicId, setTopicId] = useState(requestedTopicParam);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(true);

  // Scalable Topic Selector State
  const [isTopicDropdownOpen, setIsTopicDropdownOpen] = useState(false);
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Module 01 State
  const [questionCount, setQuestionCount] = useState(requestedCount);
  const [operation, setOperation] = useState('both');
  const [difficulty, setDifficulty] = useState('mixed');
  const [style, setStyle] = useState('mixed');

  // Module 02 State
  const [tscMode, setTscMode] = useState(requestedMode);
  const [tscSubMode, setTscSubMode] = useState(requestedSubMode);
  const [tscSelectedTables, setTscSelectedTables] = useState(
    initialTablesList.length > 0 ? initialTablesList : [17]
  );
  const [tscSquareMax, setTscSquareMax] = useState(requestedSquareMax);
  const [tscCubeMax, setTscCubeMax] = useState(requestedCubeMax);

  // Generator & Config Resolution
  const generator = getTopicGenerator(topicId);
  const config = generator?.config;

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

  // Confirmation Modal
  const [showQuitModal, setShowQuitModal] = useState(false);

  // Timers & Input Refs
  const totalTimer = useTimer(false);
  const questionStartTimeRef = useRef(0);
  const inputRef = useRef(null);

  // Fetch topics from Supabase
  useEffect(() => {
    async function loadTopics() {
      try {
        const { data } = await getTopics();
        if (data && data.length > 0) {
          setAvailableTopics(data);
          const match = data.find(
            (t) =>
              String(t.id) === String(requestedTopicParam) ||
              t.name === requestedTopicParam ||
              (String(requestedTopicParam).includes('table') && t.name.includes('Table')) ||
              (String(requestedTopicParam).includes('addition') && t.name.includes('Addition'))
          );
          if (match) {
            setTopicId(match.id);
          } else {
            setTopicId(requestedTopicParam);
          }
        }
      } catch (err) {
        console.error('Error fetching topics in practice page:', err);
      } finally {
        setLoadingTopics(false);
      }
    }
    loadTopics();
  }, [requestedTopicParam]);

  // Sync state when URL params change
  useEffect(() => {
    if (requestedTopicParam) {
      setTopicId(requestedTopicParam);
    }
    if (searchParams.get('mode')) setTscMode(searchParams.get('mode'));
    if (searchParams.get('subMode')) setTscSubMode(searchParams.get('subMode'));
    if (searchParams.get('table')) {
      const single = parseInt(searchParams.get('table'), 10);
      if (!isNaN(single)) setTscSelectedTables([single]);
    }
    if (searchParams.get('tables')) {
      const list = searchParams
        .get('tables')
        .split(',')
        .map((t) => parseInt(t.trim(), 10))
        .filter((t) => !isNaN(t) && t >= 1 && t <= 20);
      if (list.length > 0) setTscSelectedTables(list);
    }
  }, [requestedTopicParam, searchParams]);

  // Close Topic Combobox when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsTopicDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Auto-focus input during drill
  useEffect(() => {
    if (testPhase === 'in_progress' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, testPhase]);

  // Table Selection Toggles
  const handleToggleTable = (tableNum) => {
    if (tscSubMode === 'memorization') {
      // 20-Line Memorization mode uses single selected table
      setTscSelectedTables([tableNum]);
    } else {
      // Random Speed Drill mode supports multi-table selection
      if (tscSelectedTables.includes(tableNum)) {
        // Prevent deselecting down to 0 tables
        if (tscSelectedTables.length > 1) {
          setTscSelectedTables(tscSelectedTables.filter((t) => t !== tableNum));
        }
      } else {
        setTscSelectedTables([...tscSelectedTables, tableNum].sort((a, b) => a - b));
      }
    }
  };

  const handleSelectAllTables = () => {
    setTscSelectedTables(Array.from({ length: 20 }, (_, i) => i + 1));
  };

  const handleClearTableSelection = () => {
    // Leave table 17 selected as default minimum
    setTscSelectedTables([17]);
  };

  const handleStartTest = () => {
    if (!generator) return;

    // Validation for Module 02 Tables mode
    if (generator.id === 'tables-squares-cubes' && tscMode === 'tables' && tscSelectedTables.length === 0) {
      alert('Select at least one table to practice.');
      return;
    }

    let generated;
    if (generator.id === 'tables-squares-cubes') {
      generated = generator.generateQuestions({
        count: tscMode === 'tables' && tscSubMode === 'memorization' ? 20 : questionCount,
        mode: tscMode,
        tables: tscSelectedTables,
        table: tscSelectedTables[0] || 17,
        subMode: tscSubMode,
        squareMax: tscSquareMax,
        cubeMax: tscCubeMax,
      });
    } else {
      generated = generator.generateQuestions({
        count: questionCount,
        operation,
        difficulty,
        style,
      });
    }

    if (!generated || generated.length === 0) {
      alert('Could not generate questions. Please adjust practice options.');
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
            'Could not persist test results to Supabase. Check database connection.'
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
        setSaveError(result.error?.message || 'Database insert failed.');
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

  const isTscModule = generator?.id === 'tables-squares-cubes';
  const isMemorizationActive = isTscModule && tscMode === 'tables' && tscSubMode === 'memorization';

  // Group available topics dynamically by Category for Combobox
  const currentTopicObj = availableTopics.find(
    (t) =>
      String(t.id) === String(topicId) ||
      t.name === generator?.name ||
      (isTscModule && t.name.includes('Table')) ||
      (!isTscModule && t.name.includes('Addition'))
  );

  const filteredTopics = availableTopics.filter((t) =>
    t.name.toLowerCase().includes(topicSearchQuery.toLowerCase())
  );

  const groupedTopicsMap = filteredTopics.reduce((acc, topic) => {
    const cat = topic.category || 'Quantitative Aptitude';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(topic);
    return acc;
  }, {});

  return (
    <div className="max-w-2xl mx-auto">
      {/* ======================================================== */}
      {/* 1. CONFIGURATION PHASE (Topic-Specific Options)          */}
      {/* ======================================================== */}
      {testPhase === 'config' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Practice Drill
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Configure your study scope and begin your practice session.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
            {/* SCALABLE TOPIC SELECTOR (Combobox / Dropdown) */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Topic
              </label>

              <button
                type="button"
                onClick={() => setIsTopicDropdownOpen(!isTopicDropdownOpen)}
                className="w-full flex items-center justify-between p-3.5 bg-white border border-slate-200/90 hover:border-brand-500 rounded-xl shadow-2xs text-left transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 font-bold text-xs flex-shrink-0">
                    {currentTopicObj?.name ? currentTopicObj.name.charAt(0) : 'T'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-900 truncate">
                      {currentTopicObj?.name || generator?.name || 'Select Topic'}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {currentTopicObj?.category || 'Speed Math'}
                    </div>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                    isTopicDropdownOpen ? 'rotate-180 text-brand-600' : ''
                  }`}
                />
              </button>

              {/* Combobox Dropdown Popover */}
              {isTopicDropdownOpen && (
                <div className="absolute z-30 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  {/* Filter Search Input */}
                  <div className="p-2.5 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-2">
                    <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={topicSearchQuery}
                      onChange={(e) => setTopicSearchQuery(e.target.value)}
                      placeholder="Search topics..."
                      className="w-full bg-transparent text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
                      autoFocus
                    />
                  </div>

                  {/* Dynamic Categories List */}
                  <div className="max-h-64 overflow-y-auto p-1.5 space-y-2">
                    {Object.keys(groupedTopicsMap).length > 0 ? (
                      Object.entries(groupedTopicsMap).map(([category, topicsList]) => (
                        <div key={category}>
                          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/80 rounded mb-1">
                            {category}
                          </div>
                          <div className="space-y-0.5">
                            {topicsList.map((t) => {
                              const isSelected =
                                String(topicId) === String(t.id) ||
                                generator?.name === t.name ||
                                (isTscModule && t.name.includes('Table')) ||
                                (!isTscModule && t.name.includes('Addition'));

                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => {
                                    setTopicId(t.id);
                                    setSearchParams({ topic: t.id });
                                    setIsTopicDropdownOpen(false);
                                    setTopicSearchQuery('');
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-brand-50 text-brand-900 font-bold'
                                      : 'hover:bg-slate-50 text-slate-700 font-medium'
                                  }`}
                                >
                                  <span>{t.name}</span>
                                  {isSelected && <Check className="w-4 h-4 text-brand-600 flex-shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-xs text-slate-400 text-center">
                        No matching topics found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* TOPIC-SPECIFIC CONFIGURATION UI */}
            {isTscModule ? (
              /* MODULE 02 CONFIGURATION */
              <>
                {/* Practice Mode */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Practice Mode
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {config?.modes?.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setTscMode(m.id)}
                        className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                          tscMode === m.id
                            ? 'bg-brand-50 border-brand-600 text-brand-900 font-semibold shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xs font-bold">{m.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* TABLES MODE CONTROLS */}
                {tscMode === 'tables' && (
                  <div className="space-y-4 pt-1 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Drill Type
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {config?.tableSubModes?.map((sm) => (
                          <button
                            key={sm.id}
                            type="button"
                            onClick={() => {
                              setTscSubMode(sm.id);
                              // When switching to memorization, restrict to single table
                              if (sm.id === 'memorization' && tscSelectedTables.length > 1) {
                                setTscSelectedTables([tscSelectedTables[0]]);
                              }
                            }}
                            className={`py-2.5 px-3 rounded-xl border text-center text-xs transition-all cursor-pointer ${
                              tscSubMode === sm.id
                                ? 'bg-brand-50 border-brand-600 text-brand-900 font-semibold'
                                : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
                            }`}
                          >
                            {sm.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* TABLE SELECTION GRID */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          {tscSubMode === 'memorization'
                            ? 'Select Table (1–20)'
                            : 'Select Tables to Practice'}
                        </label>

                        {/* Summary & Helper Actions for Multi-Select */}
                        {tscSubMode === 'speed' ? (
                          <div className="flex items-center space-x-2 text-xs font-mono">
                            <span className="font-semibold text-brand-600">
                              {tscSelectedTables.length === 20
                                ? 'All 20 Tables'
                                : `${tscSelectedTables.length} Selected`}
                            </span>
                            <span className="text-slate-300">&middot;</span>
                            <button
                              type="button"
                              onClick={handleSelectAllTables}
                              className="text-slate-500 hover:text-brand-600 font-sans text-[11px] underline cursor-pointer"
                            >
                              All
                            </button>
                            <button
                              type="button"
                              onClick={handleClearTableSelection}
                              className="text-slate-500 hover:text-brand-600 font-sans text-[11px] underline cursor-pointer"
                            >
                              Reset
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-brand-600 font-mono">
                            Table {tscSelectedTables[0] || 17}
                          </span>
                        )}
                      </div>

                      {/* Responsive Grid for Tables 1 to 20 */}
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                        {config?.tables?.map((num) => {
                          const isSelected = tscSelectedTables.includes(num);

                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => handleToggleTable(num)}
                              className={`py-2.5 text-xs font-mono font-bold rounded-lg border transition-all flex items-center justify-center space-x-0.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-brand-600 text-white border-brand-600 shadow-2xs ring-2 ring-brand-500/30'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 text-white flex-shrink-0" />}
                              <span>{num}</span>
                            </button>
                          );
                        })}
                      </div>

                      {tscSubMode === 'memorization' && (
                        <p className="text-[11px] text-slate-400 mt-2 italic">
                          Notice: 20-Line Memorization uses one table at a time.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* SQUARES MODE CONTROLS */}
                {tscMode === 'squares' && (
                  <div className="space-y-4 pt-1 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Square Range (Study Scope)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {config?.squareRanges?.map((rng) => (
                          <button
                            key={rng.id}
                            type="button"
                            onClick={() => setTscSquareMax(rng.id)}
                            className={`py-2.5 px-3 rounded-xl border text-center text-xs font-mono font-bold transition-all cursor-pointer ${
                              tscSquareMax === rng.id
                                ? 'bg-brand-50 border-brand-600 text-brand-900 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
                            }`}
                          >
                            {rng.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* CUBES MODE CONTROLS */}
                {tscMode === 'cubes' && (
                  <div className="space-y-4 pt-1 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Cube Range (Study Scope)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {config?.cubeRanges?.map((rng) => (
                          <button
                            key={rng.id}
                            type="button"
                            onClick={() => setTscCubeMax(rng.id)}
                            className={`py-2.5 px-3 rounded-xl border text-center text-xs font-mono font-bold transition-all cursor-pointer ${
                              tscCubeMax === rng.id
                                ? 'bg-brand-50 border-brand-600 text-brand-900 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
                            }`}
                          >
                            {rng.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* MIXED MODE CONTROLS */}
                {tscMode === 'mixed' && (
                  <div className="space-y-4 pt-1 border-t border-slate-100">
                    <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60 space-y-2 text-xs">
                      <div className="font-bold text-slate-800 flex items-center">
                        <Filter className="w-3.5 h-3.5 mr-1.5 text-brand-600" />
                        <span>Active Mixed Scopes</span>
                      </div>
                      <div className="text-slate-500 space-y-1 font-mono text-[11px]">
                        <div>
                          &bull; Tables:{' '}
                          <span className="font-semibold text-slate-800">
                            {tscSelectedTables.join(', ')}
                          </span>
                        </div>
                        <div>
                          &bull; Squares Range:{' '}
                          <span className="font-semibold text-slate-800">1–{tscSquareMax}</span>
                        </div>
                        <div>
                          &bull; Cubes Range:{' '}
                          <span className="font-semibold text-slate-800">1–{tscCubeMax}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Question Count Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Question Count
                    </label>
                    {isMemorizationActive && (
                      <span className="text-[11px] text-amber-600 font-medium">
                        Fixed at 20 lines ({tscSelectedTables[0] || 17} × 1 to {tscSelectedTables[0] || 17} × 20)
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {config?.questionCounts?.map((count) => (
                      <button
                        key={count}
                        type="button"
                        disabled={isMemorizationActive}
                        onClick={() => setQuestionCount(count)}
                        className={`py-2.5 px-2 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                          isMemorizationActive
                            ? count === 20
                              ? 'bg-slate-200 text-slate-700 border-slate-300 cursor-not-allowed font-bold'
                              : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                            : questionCount === count
                            ? 'bg-brand-600 text-white border-brand-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* MODULE 01 CONFIGURATION */
              <>
                {/* Question Count */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Question Count
                  </label>
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {config?.questionCounts?.map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setQuestionCount(count)}
                        className={`py-2.5 px-2 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                          questionCount === count
                            ? 'bg-brand-600 text-white border-brand-600 shadow-2xs'
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
                    {config?.operations?.map((op) => (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => setOperation(op.id)}
                        className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer ${
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
                    {config?.difficulties?.map((diff) => (
                      <button
                        key={diff.id}
                        type="button"
                        onClick={() => setDifficulty(diff.id)}
                        className={`py-2.5 px-2 rounded-xl border text-center text-xs transition-all cursor-pointer ${
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
                    {config?.styles?.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setStyle(st.id)}
                        className={`py-2.5 px-2 rounded-xl border text-center text-xs transition-all cursor-pointer ${
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
              </>
            )}

            {/* Zero Table Validation Warning */}
            {isTscModule && tscMode === 'tables' && tscSelectedTables.length === 0 && (
              <Alert variant="warning" title="Table Selection Required">
                Select at least one table to practice.
              </Alert>
            )}

            {/* Primary Action Button */}
            <div className="pt-3">
              <button
                type="button"
                disabled={isTscModule && tscMode === 'tables' && tscSelectedTables.length === 0}
                onClick={handleStartTest}
                className="w-full inline-flex items-center justify-center min-h-[48px] py-3.5 px-6 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 shadow-2xs hover:shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
              disabled={isRetryingSave}
              onClick={handleRetrySave}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
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
      {/* 4. ACTIVE DRILL RUNNER                                   */}
      {/* ======================================================== */}
      {testPhase === 'in_progress' && questions[currentIndex] && (
        <div className="space-y-4 sm:space-y-6 pt-2">
          {/* Top Bar: Question Counter, Timer, Quit */}
          <div className="flex items-center justify-between px-1">
            <div className="text-sm font-semibold text-slate-500">
              Question <span className="font-bold text-slate-900 font-mono text-base">{currentIndex + 1}</span> of <span className="font-mono">{questions.length}</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 text-slate-600 font-mono text-xs font-medium bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatDuration(totalTimer.elapsedMs)}</span>
              </div>

              <button
                type="button"
                onClick={() => setShowQuitModal(true)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
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
              style={{ width: `${(currentIndex / questions.length) * 100}%` }}
            />
          </div>

          {/* Focused Question Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 sm:p-14 text-center space-y-8 shadow-xs">
            {/* Dominant Question Display */}
            <div className="text-5xl sm:text-7xl font-mono font-bold tracking-tight text-slate-900 select-none py-4">
              {questions[currentIndex].question}
            </div>

            {/* Answer Input */}
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
                  className="w-full text-center text-4xl sm:text-5xl font-mono font-bold py-3.5 px-4 rounded-xl border-2 border-slate-200 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 outline-hidden transition-all text-slate-900 placeholder:text-slate-300 disabled:opacity-50 shadow-2xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingQuestion}
                className="w-full inline-flex items-center justify-center min-h-[48px] px-6 py-3.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs hover:shadow"
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
