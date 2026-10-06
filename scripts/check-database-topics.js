import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envText = fs.readFileSync('.env.local', 'utf8');
const env = {};
envText.split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = match[2].trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('Connecting to Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('\n--- 1. TOPICS TABLE ---');
  const { data: topics, error: topicsErr } = await supabase.from('topics').select('*');
  if (topicsErr) {
    console.error('Error selecting topics:', topicsErr);
  } else {
    console.log(JSON.stringify(topics, null, 2));
  }

  console.log('\n--- 2. SAMPLE TEST ATTEMPTS ---');
  const { data: tests, error: testErr } = await supabase.from('test_attempts').select('*, topics(*)').limit(5);
  if (testErr) {
    console.error('Error selecting test_attempts:', testErr);
  } else {
    console.log(JSON.stringify(tests, null, 2));
  }
}

main().catch(console.error);
