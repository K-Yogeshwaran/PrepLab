import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { formatShortDate } from '../utils/formatters';

const LOCAL_STORAGE_TESTS_KEY = 'preplab_local_test_history';

/**
 * Fetch and aggregate real dashboard statistics.
 * Strictly calculates from actual test attempts.
 * Returns { hasData: false } if no tests have been completed yet.
 */
export async function getDashboardStats() {
  let tests = [];
  let isLocalSource = false;

  // 1. Try fetching from Supabase if configured
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('test_attempts')
        .select(`
          *,
          topics:topic_id (id, name, category)
        `)
        .order('created_at', { ascending: true }); // Ascending for chronological charts

      if (!error && data) {
        tests = data;
      } else if (error) {
        console.warn('Supabase query error in dashboard:', error.message);
      }
    } catch (err) {
      console.warn('Supabase connection exception in dashboard:', err);
    }
  }

  // 2. If no tests from Supabase, check local storage fallback
  if (tests.length === 0) {
    try {
      const local = JSON.parse(localStorage.getItem(LOCAL_STORAGE_TESTS_KEY) || '[]');
      if (Array.isArray(local) && local.length > 0) {
        // Sort chronologically ascending
        tests = [...local].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        isLocalSource = true;
      }
    } catch (err) {
      console.warn('LocalStorage error:', err);
    }
  }

  // If no tests exist anywhere, return clean empty state
  if (tests.length === 0) {
    return {
      hasData: false,
      totalTests: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      overallAccuracy: 0,
      averageTimePerQuestionMs: 0,
      bestAccuracy: 0,
      recentTests: [],
      topicPerformance: [],
      charts: {
        accuracyTrend: [],
        timeTrend: [],
        cumulativeQuestionsTrend: [],
      },
      isLocalSource: false,
    };
  }

  // Calculate aggregates from real test records
  const totalTests = tests.length;
  let totalQuestions = 0;
  let totalCorrect = 0;
  let totalTimeMs = 0;
  let bestAccuracy = 0;

  // Chronological chart data
  const accuracyTrend = [];
  const timeTrend = [];
  const cumulativeQuestionsTrend = [];
  let cumulativeQuestions = 0;

  // Topic performance map
  const topicMap = {};

  tests.forEach((test, index) => {
    const qCount = parseInt(test.question_count, 10) || 0;
    const cCount = parseInt(test.correct_count, 10) || 0;
    const accuracy = parseFloat(test.accuracy) || 0;
    const timeMs = parseInt(test.total_time_ms, 10) || 0;
    const avgTimeMs = parseInt(test.average_time_ms, 10) || 0;

    totalQuestions += qCount;
    totalCorrect += cCount;
    totalTimeMs += timeMs;
    cumulativeQuestions += qCount;

    if (accuracy > bestAccuracy) {
      bestAccuracy = accuracy;
    }

    const testLabel = `Test #${index + 1}`;
    const dateLabel = formatShortDate(test.created_at);

    accuracyTrend.push({
      testNumber: index + 1,
      label: testLabel,
      date: dateLabel,
      accuracy: Math.round(accuracy * 10) / 10,
    });

    timeTrend.push({
      testNumber: index + 1,
      label: testLabel,
      date: dateLabel,
      avgTimeSeconds: Math.round((avgTimeMs / 1000) * 10) / 10,
    });

    cumulativeQuestionsTrend.push({
      testNumber: index + 1,
      label: testLabel,
      date: dateLabel,
      questions: cumulativeQuestions,
    });

    // Topic grouping
    const topicId = test.topic_id || 'unknown';
    const topicName = test.topics?.name || (topicId === 'fast-addition-subtraction' ? 'Fast Addition & Subtraction' : topicId);

    if (!topicMap[topicId]) {
      topicMap[topicId] = {
        id: topicId,
        name: topicName,
        testsCount: 0,
        questionsCount: 0,
        correctCount: 0,
        totalTimeMs: 0,
      };
    }

    topicMap[topicId].testsCount += 1;
    topicMap[topicId].questionsCount += qCount;
    topicMap[topicId].correctCount += cCount;
    topicMap[topicId].totalTimeMs += timeMs;
  });

  const overallAccuracy =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 1000) / 10 : 0;

  const averageTimePerQuestionMs =
    totalQuestions > 0 ? Math.round(totalTimeMs / totalQuestions) : 0;

  // Format topic performance array
  const topicPerformance = Object.values(topicMap).map((t) => ({
    ...t,
    accuracy: t.questionsCount > 0 ? Math.round((t.correctCount / t.questionsCount) * 1000) / 10 : 0,
    avgTimeMs: t.questionsCount > 0 ? Math.round(t.totalTimeMs / t.questionsCount) : 0,
  }));

  // Recent tests (newest first)
  const recentTests = [...tests].reverse().slice(0, 10);

  return {
    hasData: true,
    totalTests,
    totalQuestions,
    totalCorrect,
    overallAccuracy,
    averageTimePerQuestionMs,
    bestAccuracy,
    recentTests,
    topicPerformance,
    charts: {
      accuracyTrend,
      timeTrend,
      cumulativeQuestionsTrend,
    },
    isLocalSource,
  };
}
