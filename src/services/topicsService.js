import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Fetch all available topics from the Supabase `topics` table.
 * Returns { data, error }
 */
export async function getTopics() {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      data: [],
      error: new Error('Supabase is not configured in .env.local'),
    };
  }

  try {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch topics from Supabase:', error.message);
      return {
        data: [],
        error,
      };
    }

    // If topics table is currently empty, attempt to seed default row
    if (!data || data.length === 0) {
      const seeded = await seedDefaultTopic();
      if (seeded) {
        return { data: [seeded], error: null };
      }
      return { data: [], error: null };
    }

    return {
      data,
      error: null,
    };
  } catch (err) {
    console.error('Exception fetching topics:', err);
    return {
      data: [],
      error: err,
    };
  }
}

/**
 * Fetch a single topic by ID from Supabase
 */
export async function getTopicById(id) {
  if (!id) return { data: null, error: new Error('Topic ID required') };

  if (!isSupabaseConfigured() || !supabase) {
    return { data: null, error: new Error('Supabase is not configured') };
  }

  try {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Seeds the initial Fast Addition & Subtraction topic into Supabase
 * Adaptive to either BIGINT identity or TEXT id column.
 */
export async function seedDefaultTopic() {
  if (!isSupabaseConfigured() || !supabase) return null;

  try {
    // Attempt 1: Insert without ID (PostgreSQL generates identity)
    const { data, error } = await supabase
      .from('topics')
      .insert([
        {
          name: 'Fast Addition & Subtraction',
          category: 'Speed Math',
        },
      ])
      .select()
      .maybeSingle();

    if (!error && data) {
      return data;
    }

    // Attempt 2: If table requires explicit text id
    const { data: textData, error: textErr } = await supabase
      .from('topics')
      .insert([
        {
          id: 'fast-addition-subtraction',
          name: 'Fast Addition & Subtraction',
          category: 'Speed Math',
        },
      ])
      .select()
      .maybeSingle();

    if (!textErr && textData) {
      return textData;
    }

    return null;
  } catch (err) {
    console.warn('Seed exception:', err);
    return null;
  }
}
