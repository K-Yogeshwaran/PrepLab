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
      totalIncorrect: 0,
      overallAccuracy: 0,
      averageTimePerQuestionMs: 0,
      bestAccuracy: 0,
      recentTests: [],
      topicPerformance: [],
      charts: {
        accuracyTrend: [],
        timeTrend: [],
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
      .order('created_at', { ascending: true }); // Chronological order for accurate time-series

    if (error) {
      console.error('Supabase query error in dashboard:', error.message);
      return {
        hasData: false,
        error: error.message,
        totalTests: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        overallAccuracy: 0,
        averageTimePerQuestionMs: 0,
        bestAccuracy: 0,
        recentTests: [],
        topicPerformance: [],
        charts: {
          accuracyTrend: [],
          timeTrend: [],
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
      totalIncorrect: 0,
      overallAccuracy: 0,
      averageTimePerQuestionMs: 0,
      bestAccuracy: 0,
      recentTests: [],
      topicPerformance: [],
      charts: {
        accuracyTrend: [],
        timeTrend: [],
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
      totalIncorrect: 0,
      overallAccuracy: 0,
      averageTimePerQuestionMs: 0,
      bestAccuracy: 0,
      recentTests: [],
      topicPerformance: [],
      charts: {
        accuracyTrend: [],
        timeTrend: [],
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
  const topicMap = {};
  const dailyActivityMap = {};

  tests.forEach((test, index) => {
    const qCount = parseInt(test.question_count, 10) || 0;
    const cCount = parseInt(test.correct_count, 10) || 0;
    const accuracy = parseFloat(test.accuracy) || 0;
    const timeMs = parseInt(test.total_time_ms, 10) || 0;
    const avgTimeMs = parseInt(test.average_time_ms, 10) || (qCount > 0 ? timeMs / qCount : 0);

    totalQuestions += qCount;
    totalCorrect += cCount;
    totalTimeMs += timeMs;

    if (accuracy > bestAccuracy) {
      bestAccuracy = accuracy;
    }

    const testLabel = `Drill #${index + 1}`;
    const dateLabel = formatShortDate(test.created_at);

    // Daily activity aggregation for consistency heatmap & streaks
    const testDate = new Date(test.created_at);
    const dateKey = `${testDate.getFullYear()}-${String(testDate.getMonth() + 1).padStart(2, '0')}-${String(testDate.getDate()).padStart(2, '0')}`;

    if (!dailyActivityMap[dateKey]) {
      dailyActivityMap[dateKey] = {
        dateKey,
        formattedDate: testDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        drillsCount: 0,
        questionsCount: 0,
        correctCount: 0,
        totalTimeMs: 0,
      };
    }

    dailyActivityMap[dateKey].drillsCount += 1;
    dailyActivityMap[dateKey].questionsCount += qCount;
    dailyActivityMap[dateKey].correctCount += cCount;
    dailyActivityMap[dateKey].totalTimeMs += timeMs;

    // Chart 1 data point: Accuracy Trend
    accuracyTrend.push({
      testNumber: index + 1,
      label: testLabel,
      date: dateLabel,
      accuracy: Math.round(accuracy * 10) / 10,
      correctCount: cCount,
      questionCount: qCount,
      rawCreatedAt: test.created_at,
    });

    // Chart 2 data point: Average Speed Trend (seconds per question)
    timeTrend.push({
      testNumber: index + 1,
      label: testLabel,
      date: dateLabel,
      avgTimeSeconds: Math.round((avgTimeMs / 1000) * 10) / 10,
      totalDurationMs: timeMs,
      rawCreatedAt: test.created_at,
    });

    // Topic grouping
    const topicId = String(test.topic_id || 'unknown');
    const topicName =
      test.topics?.name ||
      (topicId === '3' || topicId === '2' || topicId === 'tables-squares-cubes'
        ? 'Tables, Squares & Cubes'
        : topicId === '1' || topicId === 'fast-addition-subtraction'
        ? 'Fast Addition & Subtraction'
        : `Topic #${topicId}`);

    if (!topicMap[topicId]) {
      topicMap[topicId] = {
        id: topicId,
        name: topicName,
        category: test.topics?.category || 'Speed Math',
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

  // Calculate day-level metrics and intensity
  Object.keys(dailyActivityMap).forEach((key) => {
    const day = dailyActivityMap[key];
    day.accuracy = day.questionsCount > 0 ? Math.round((day.correctCount / day.questionsCount) * 1000) / 10 : 0;
    day.avgTimeMs = day.questionsCount > 0 ? Math.round(day.totalTimeMs / day.questionsCount) : 0;
    day.avgTimeSeconds = Math.round((day.avgTimeMs / 1000) * 10) / 10;

    // Intensity: 0 = 0, 1-10 = 1, 11-25 = 2, 26-50 = 3, >50 = 4
    if (day.questionsCount > 50) {
      day.intensity = 4;
    } else if (day.questionsCount >= 26) {
      day.intensity = 3;
    } else if (day.questionsCount >= 11) {
      day.intensity = 2;
    } else if (day.questionsCount >= 1) {
      day.intensity = 1;
    } else {
      day.intensity = 0;
    }
  });

  // Streaks Calculation (Real Calendar Days)
  const sortedDates = Object.keys(dailyActivityMap).sort();
  const totalActiveDays = sortedDates.length;

  let currentStreak = 0;
  let longestStreak = 0;

  if (totalActiveDays > 0) {
    // 1. Longest streak
    let tempStreak = 1;
    longestStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak += 1;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }

    // 2. Current streak
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    let checkDate = new Date(now);
    if (!dailyActivityMap[todayKey]) {
      // If not practiced today, check if practiced yesterday to keep streak active
      if (dailyActivityMap[yesterdayKey]) {
        checkDate = new Date(yesterday);
      } else {
        checkDate = null;
      }
    }

    if (checkDate) {
      while (true) {
        const key = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        if (dailyActivityMap[key]) {
          currentStreak += 1;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
  }

  // Weekly consistency (Current calendar week Monday to Sunday)
  const today = new Date();
  const currentDayOfWeek = (today.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  const mondayThisWeek = new Date(today);
  mondayThisWeek.setDate(today.getDate() - currentDayOfWeek);

  const weekDays = [];
  let daysActiveThisWeek = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayThisWeek);
    d.setDate(mondayThisWeek.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayData = dailyActivityMap[key] || null;
    const isActive = Boolean(dayData && dayData.drillsCount > 0);
    if (isActive) daysActiveThisWeek += 1;

    const dayName = ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i];
    const isToday = key === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    weekDays.push({
      dateKey: key,
      dayName,
      isToday,
      isActive,
      data: dayData,
    });
  }

  const totalIncorrect = Math.max(0, totalQuestions - totalCorrect);
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 1000) / 10 : 0;
  const averageTimePerQuestionMs = totalQuestions > 0 ? Math.round(totalTimeMs / totalQuestions) : 0;

  const topicPerformance = Object.values(topicMap).map((t) => ({
    ...t,
    incorrectCount: Math.max(0, t.questionsCount - t.correctCount),
    accuracy:
      t.questionsCount > 0 ? Math.round((t.correctCount / t.questionsCount) * 1000) / 10 : 0,
    avgTimeMs: t.questionsCount > 0 ? Math.round(t.totalTimeMs / t.questionsCount) : 0,
    avgTimeSeconds:
      t.questionsCount > 0
        ? Math.round((t.totalTimeMs / t.questionsCount / 1000) * 10) / 10
        : 0,
  }));

  const recentTests = [...tests].reverse().slice(0, 10);

  return {
    hasData: true,
    error: null,
    totalTests,
    totalQuestions,
    totalCorrect,
    totalIncorrect,
    overallAccuracy,
    averageTimePerQuestionMs,
    bestAccuracy,
    recentTests,
    topicPerformance,
    charts: {
      accuracyTrend,
      timeTrend,
    },
    activity: {
      dailyMap: dailyActivityMap,
      totalActiveDays,
      currentStreak,
      longestStreak,
      daysActiveThisWeek,
      weekDays,
    },
  };
}
