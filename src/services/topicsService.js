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

    // Ensure all default topics are seeded if missing
    const defaultNames = ['Fast Addition & Subtraction', 'Tables, Squares & Cubes'];
    const existingNames = new Set((data || []).map((t) => t.name));
    const isMissingTopics = defaultNames.some((n) => !existingNames.has(n));

    if (isMissingTopics) {
      await seedDefaultTopic();
      const { data: refreshedData } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: true });

      return {
        data: refreshedData || data || [],
        error: null,
      };
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
 * Seeds default topics (Fast Addition & Subtraction, Tables, Squares & Cubes) into Supabase
 */
export async function seedDefaultTopic() {
  if (!isSupabaseConfigured() || !supabase) return null;

  const defaultTopics = [
    {
      name: 'Fast Addition & Subtraction',
      category: 'Speed Math',
    },
    {
      name: 'Tables, Squares & Cubes',
      category: 'Speed Math',
    },
  ];

  try {
    // Check existing topics first
    const { data: existing } = await supabase.from('topics').select('name');
    const existingNames = new Set((existing || []).map((t) => t.name));

    const toInsert = defaultTopics.filter((t) => !existingNames.has(t.name));
    if (toInsert.length === 0) return true;

    // Insert missing topics without ID (let database generate identity or text)
    const { data, error } = await supabase
      .from('topics')
      .insert(toInsert)
      .select();

    if (!error && data) {
      return data;
    }

    // Fallback: If text id is required
    const textInsert = toInsert.map((t) => ({
      id: t.name === 'Tables, Squares & Cubes' ? 'tables-squares-cubes' : 'fast-addition-subtraction',
      name: t.name,
      category: t.category,
    }));

    const { data: textData } = await supabase
      .from('topics')
      .insert(textInsert)
      .select();

    return textData || null;
  } catch (err) {
    console.warn('Seed exception:', err);
    return null;
  }
}
