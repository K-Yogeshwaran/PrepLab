import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Save a completed test attempt and its questions to Supabase PostgreSQL.
 *
 * Strict requirements:
 * 1. Supabase is the PRIMARY and REQUIRED persistence layer.
 * 2. No silent localStorage fallback.
 * 3. Atomic cleanup if question insert fails.
 * 4. Database-generated IDs are used (supports bigint or UUID).
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
  if (!isSupabaseConfigured() || !supabase) {
    return {
      data: null,
      error: new Error(
        'Supabase is not configured. Please check your credentials in .env.local.'
      ),
    };
  }

  try {
    // Resolve topic_id to match database type if topics table uses numeric IDs
    let resolvedTopicId = topicId;
    if (typeof topicId === 'string' && isNaN(Number(topicId))) {
      const { data: idMatch } = await supabase
        .from('topics')
        .select('id')
        .eq('id', topicId)
        .maybeSingle();

      if (idMatch?.id) {
        resolvedTopicId = idMatch.id;
      } else {
        const isModule2 =
          topicId.includes('table') ||
          topicId.includes('square') ||
          topicId.includes('cube') ||
          topicId === '2';
        const targetName = isModule2
          ? 'Tables, Squares & Cubes'
          : 'Fast Addition & Subtraction';

        const { data: nameMatch } = await supabase
          .from('topics')
          .select('id')
          .ilike('name', `%${targetName.split(' ')[0]}%`)
          .maybeSingle();

        if (nameMatch?.id) {
          resolvedTopicId = nameMatch.id;
        }
      }
    }

    const testPayload = {
      topic_id: resolvedTopicId,
      question_count: parseInt(questionCount, 10),
      correct_count: parseInt(correctCount, 10),
      accuracy: parseFloat(accuracy),
      total_time_ms: parseInt(totalTimeMs, 10),
      average_time_ms: parseInt(averageTimeMs, 10),
    };

    // 1. Insert test_attempt record (Let PostgreSQL generate the ID)
    const { data: testResult, error: testError } = await supabase
      .from('test_attempts')
      .insert([testPayload])
      .select()
      .single();

    if (testError) {
      console.error('Error inserting test_attempt:', testError);
      return {
        data: null,
        error: new Error(
          `Your test result could not be saved: ${testError.message || testError.details || 'Database error'}. Please check your database connection or policies and try again.`
        ),
      };
    }

    const persistedTestId = testResult.id;

    // 2. Prepare question attempts referencing the persisted test ID
    const formattedQuestions = questionAttempts.map((q, idx) => ({
      test_id: persistedTestId,
      question_number: q.questionNumber || idx + 1,
      operation: q.operation,
      question: q.question,
      correct_answer: parseInt(q.correctAnswer, 10),
      user_answer:
        q.userAnswer !== null && q.userAnswer !== undefined && q.userAnswer !== ''
          ? parseInt(q.userAnswer, 10)
          : null,
      is_correct: Boolean(q.isCorrect),
      time_taken_ms: parseInt(q.timeTakenMs || 0, 10),
    }));

    // 3. Insert question_attempts records
    const { data: questionsResult, error: questionsError } = await supabase
      .from('question_attempts')
      .insert(formattedQuestions)
      .select();

    if (questionsError) {
      console.error('Error inserting question_attempts:', questionsError);
      // Clean up orphaned test_attempt to maintain data integrity
      await supabase.from('test_attempts').delete().eq('id', persistedTestId);

      return {
        data: null,
        error: new Error(
          `Failed to save question details: ${questionsError.message || 'Database error'}. The attempt was rolled back. Please retry.`
        ),
      };
    }

    return {
      data: {
        test: testResult,
        questions: questionsResult,
      },
      error: null,
    };
  } catch (err) {
    console.error('Exception during test save:', err);
    return {
      data: null,
      error: err,
    };
  }
}

/**
 * Fetch a completed test attempt and its questions strictly from Supabase
 */
export async function getTestAttemptById(testId) {
  if (!testId) {
    return { data: null, error: new Error('Missing test ID') };
  }

  if (!isSupabaseConfigured() || !supabase) {
    return {
      data: null,
      error: new Error('Supabase is not configured.'),
    };
  }

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
      return { data: null, error: testError };
    }

    if (!test) {
      return { data: null, error: new Error('Test attempt not found in Supabase database.') };
    }

    // Fetch question attempts
    const { data: questions, error: questionsError } = await supabase
      .from('question_attempts')
      .select('*')
      .eq('test_id', testId)
      .order('question_number', { ascending: true });

    if (questionsError) {
      console.warn('Failed to load question details:', questionsError.message);
    }

    return {
      data: {
        test,
        questions: questions || [],
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Fetch recent test attempts strictly from Supabase
 */
export async function getRecentTests(limit = 10) {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: [], error: new Error('Supabase is not configured.') };
  }

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
