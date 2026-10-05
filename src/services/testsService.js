import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Local storage key for fallback/offline persistence
const LOCAL_STORAGE_TESTS_KEY = 'preplab_local_test_history';

/**
 * Helper to store completed tests locally in browser storage
 * (Used when Supabase is not configured or offline)
 */
function saveToLocalStorage(testAttempt, questionAttempts) {
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_TESTS_KEY) || '[]');
    const record = {
      ...testAttempt,
      question_attempts: questionAttempts,
    };
    existing.unshift(record);
    // Keep last 50 local tests
    if (existing.length > 50) existing.length = 50;
    localStorage.setItem(LOCAL_STORAGE_TESTS_KEY, JSON.stringify(existing));
    return true;
  } catch (err) {
    console.error('Failed to save test to localStorage:', err);
    return false;
  }
}

/**
 * Retrieve test from localStorage by ID
 */
function getFromLocalStorage(testId) {
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_TESTS_KEY) || '[]');
    const found = existing.find((t) => t.id === testId);
    if (!found) return null;
    return {
      test: {
        id: found.id,
        topic_id: found.topic_id,
        question_count: found.question_count,
        correct_count: found.correct_count,
        accuracy: found.accuracy,
        total_time_ms: found.total_time_ms,
        average_time_ms: found.average_time_ms,
        created_at: found.created_at,
      },
      questions: found.question_attempts || [],
      isLocal: true,
    };
  } catch {
    return null;
  }
}

/**
 * Save a completed test attempt and all its question attempts.
 * Ensures data integrity:
 * - Calculates correct counts, accuracy, times
 * - Inserts test_attempt first
 * - Inserts question_attempts referencing test_id
 * - Cleans up orphaned test_attempt if question insert fails
 */
export async function saveTestAttempt({
  topicId,
  questionCount,
  correctCount,
  accuracy,
  totalTimeMs,
  averageTimeMs,
  questionAttempts = [],
}) {
  const generatedId = crypto.randomUUID ? crypto.randomUUID() : `test-${Date.now()}`;
  const now = new Date().toISOString();

  const testPayload = {
    id: generatedId,
    topic_id: topicId,
    question_count: parseInt(questionCount, 10),
    correct_count: parseInt(correctCount, 10),
    accuracy: parseFloat(accuracy),
    total_time_ms: parseInt(totalTimeMs, 10),
    average_time_ms: parseInt(averageTimeMs, 10),
    created_at: now,
  };

  const formattedQuestions = questionAttempts.map((q, idx) => ({
    id: crypto.randomUUID ? crypto.randomUUID() : `qa-${idx}-${Date.now()}`,
    test_id: generatedId,
    question_number: q.questionNumber || idx + 1,
    operation: q.operation,
    question: q.question,
    correct_answer: parseInt(q.correctAnswer, 10),
    user_answer: q.userAnswer !== null && q.userAnswer !== undefined && q.userAnswer !== ''
      ? parseInt(q.userAnswer, 10)
      : null,
    is_correct: Boolean(q.isCorrect),
    time_taken_ms: parseInt(q.timeTakenMs || 0, 10),
    created_at: now,
  }));

  // If Supabase is not configured, save locally
  if (!isSupabaseConfigured() || !supabase) {
    saveToLocalStorage(testPayload, formattedQuestions);
    return {
      data: {
        test: testPayload,
        questions: formattedQuestions,
      },
      error: null,
      savedToSupabase: false,
      message: 'Saved to local browser storage (Supabase connection unconfigured).',
    };
  }

  try {
    // 1. Insert test_attempt
    const { data: testResult, error: testError } = await supabase
      .from('test_attempts')
      .insert([testPayload])
      .select()
      .single();

    if (testError) {
      console.error('Error inserting test_attempt:', testError);
      // Fallback save locally so user does not lose their score
      saveToLocalStorage(testPayload, formattedQuestions);
      return {
        data: { test: testPayload, questions: formattedQuestions },
        error: new Error(`Database error saving test: ${testError.message}`),
        savedToSupabase: false,
      };
    }

    const testId = testResult.id;

    // 2. Insert question_attempts
    const { data: questionsResult, error: questionsError } = await supabase
      .from('question_attempts')
      .insert(
        formattedQuestions.map((q) => ({
          ...q,
          test_id: testId,
        }))
      )
      .select();

    if (questionsError) {
      console.error('Error inserting question_attempts:', questionsError);
      // Clean up orphaned test_attempt to maintain database integrity
      await supabase.from('test_attempts').delete().eq('id', testId);

      // Save locally as fallback
      saveToLocalStorage(testPayload, formattedQuestions);
      return {
        data: { test: testPayload, questions: formattedQuestions },
        error: new Error(`Database error saving questions: ${questionsError.message}. Test rolled back.`),
        savedToSupabase: false,
      };
    }

    return {
      data: {
        test: testResult,
        questions: questionsResult,
      },
      error: null,
      savedToSupabase: true,
    };
  } catch (err) {
    console.error('Exception during test save:', err);
    saveToLocalStorage(testPayload, formattedQuestions);
    return {
      data: { test: testPayload, questions: formattedQuestions },
      error: err,
      savedToSupabase: false,
    };
  }
}

/**
 * Fetch a completed test attempt and its questions by ID
 */
export async function getTestAttemptById(testId) {
  if (!testId) {
    return { data: null, error: new Error('Missing test ID') };
  }

  // Check Supabase if configured
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: test, error: testError } = await supabase
        .from('test_attempts')
        .select(`
          *,
          topics:topic_id (id, name, category)
        `)
        .eq('id', testId)
        .maybeSingle();

      if (testError) {
        console.warn('Supabase test fetch error:', testError.message);
      }

      if (test) {
        // Fetch question attempts
        const { data: questions, error: questionsError } = await supabase
          .from('question_attempts')
          .select('*')
          .eq('test_id', testId)
          .order('question_number', { ascending: true });

        if (questionsError) {
          console.warn('Supabase questions fetch error:', questionsError.message);
        }

        return {
          data: {
            test,
            questions: questions || [],
          },
          error: null,
          source: 'supabase',
        };
      }
    } catch (err) {
      console.error('Exception fetching test by ID:', err);
    }
  }

  // Fallback: check localStorage
  const localRecord = getFromLocalStorage(testId);
  if (localRecord) {
    return {
      data: localRecord,
      error: null,
      source: 'local',
    };
  }

  return {
    data: null,
    error: new Error('Test attempt not found.'),
  };
}

/**
 * Fetch recent test attempts
 */
export async function getRecentTests(limit = 10) {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('test_attempts')
        .select(`
          *,
          topics:topic_id (id, name, category)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { data: [], error };
      }
      return { data: data || [], error: null };
    } catch (err) {
      return { data: [], error: err };
    }
  }

  // Fallback to local storage
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_TESTS_KEY) || '[]');
    return {
      data: existing.slice(0, limit),
      error: null,
      isLocal: true,
    };
  } catch {
    return { data: [], error: null, isLocal: true };
  }
}
