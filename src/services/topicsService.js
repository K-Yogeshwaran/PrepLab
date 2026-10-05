import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getRegisteredTopicDefinitions } from '../generators';

/**
 * Fallback topic metadata matching generator registry
 * Used ONLY when database is offline or unconfigured
 */
const DEFAULT_TOPIC = {
  id: 'fast-addition-subtraction',
  name: 'Fast Addition & Subtraction',
  category: 'Speed Math',
};

/**
 * Fetch all available topics from the Supabase `topics` table.
 * Returns { data, error, isFallback }
 */
export async function getTopics() {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      data: [DEFAULT_TOPIC],
      error: new Error('Supabase is not configured. Displaying local topic registry.'),
      isFallback: true,
    };
  }

  try {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Failed to fetch topics from Supabase:', error.message);
      return {
        data: [DEFAULT_TOPIC],
        error,
        isFallback: true,
      };
    }

    // If table exists but is empty, try seeding the default topic
    if (!data || data.length === 0) {
      const seeded = await seedDefaultTopic();
      if (seeded) {
        return { data: [seeded], error: null, isFallback: false };
      }
      return {
        data: [],
        error: null,
        isFallback: false,
      };
    }

    return {
      data,
      error: null,
      isFallback: false,
    };
  } catch (err) {
    console.error('Exception fetching topics:', err);
    return {
      data: [DEFAULT_TOPIC],
      error: err,
      isFallback: true,
    };
  }
}

/**
 * Fetch a single topic by ID from Supabase
 */
export async function getTopicById(id) {
  if (!id) return { data: null, error: new Error('Topic ID required') };

  if (!isSupabaseConfigured() || !supabase) {
    const defaultDef = getRegisteredTopicDefinitions().find((t) => t.id === id);
    if (defaultDef) {
      return {
        data: { id: defaultDef.id, name: defaultDef.name, category: defaultDef.category },
        error: null,
        isFallback: true,
      };
    }
    return { data: null, error: new Error('Topic not found in local registry') };
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

    if (!data) {
      // Check local registry
      const local = getRegisteredTopicDefinitions().find((t) => t.id === id);
      if (local) {
        return { data: local, error: null, isFallback: true };
      }
    }

    return { data, error: null, isFallback: false };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Seeds the initial Fast Addition & Subtraction topic into Supabase
 */
export async function seedDefaultTopic() {
  if (!isSupabaseConfigured() || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('topics')
      .upsert(
        [
          {
            id: DEFAULT_TOPIC.id,
            name: DEFAULT_TOPIC.name,
            category: DEFAULT_TOPIC.category,
          },
        ],
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) {
      console.warn('Could not seed topic to Supabase:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Seed exception:', err);
    return null;
  }
}
