import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { formatShortDate } from '../utils/formatters';

/**
 * Fetch and aggregate dashboard statistics strictly from Supabase PostgreSQL.
 * Returns { hasData: false } if no tests have been completed yet in Supabase.
 */
export async function getDashboardStats() {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      hasData: false,
      error: 'Supabase is not configured in .env.local',
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
    };
  }

  let tests = [];

  try {
    const { data, error } = await supabase
      .from('test_attempts')
      .select(`
        *,
        topics:topic_id (id, name, category)
      `)
      .order('created_at', { ascending: true }); // Ascending for chronological trends

    if (error) {
      console.error('Supabase query error in dashboard:', error.message);
      return {
        hasData: false,
        error: error.message,
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
      };
    }

    if (data) {
      tests = data;
    }
  } catch (err) {
    console.error('Supabase connection exception in dashboard:', err);
    return {
      hasData: false,
      error: err.message,
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
    };
  }

  // If no tests exist in Supabase, return clean empty state
  if (tests.length === 0) {
    return {
      hasData: false,
      error: null,
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
    };
  }

  // Calculate aggregates strictly from real Supabase records
  const totalTests = tests.length;
  let totalQuestions = 0;
  let totalCorrect = 0;
  let totalTimeMs = 0;
  let bestAccuracy = 0;

  const accuracyTrend = [];
  const timeTrend = [];
  const cumulativeQuestionsTrend = [];
  let cumulativeQuestions = 0;

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
    const topicId = String(test.topic_id || 'unknown');
    const topicName =
      test.topics?.name ||
      (topicId === '1' || topicId === 'fast-addition-subtraction'
        ? 'Fast Addition & Subtraction'
        : `Topic #${topicId}`);

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

  const topicPerformance = Object.values(topicMap).map((t) => ({
    ...t,
    accuracy:
      t.questionsCount > 0 ? Math.round((t.correctCount / t.questionsCount) * 1000) / 10 : 0,
    avgTimeMs: t.questionsCount > 0 ? Math.round(t.totalTimeMs / t.questionsCount) : 0,
  }));

  // Recent tests (chronologically descending)
  const recentTests = [...tests].reverse().slice(0, 10);

  return {
    hasData: true,
    error: null,
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
  };
}
