import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Checking existing topics in Supabase...');
  const { data: existing, error: selectErr } = await supabase.from('topics').select('*');
  if (selectErr) {
    console.error('Error fetching topics:', selectErr);
    return;
  }

  console.log('Current topics count:', existing.length);
  const hasModule2 = existing.some((t) => t.name === 'Tables, Squares & Cubes');

  if (hasModule2) {
    console.log('Topic "Tables, Squares & Cubes" already exists in database.');
    console.log(JSON.stringify(existing, null, 2));
    return;
  }

  console.log('Inserting topic "Tables, Squares & Cubes"...');
  const newTopic = {
    name: 'Tables, Squares & Cubes',
    category: 'Speed Math',
  };

  const { data: inserted, error: insertErr } = await supabase
    .from('topics')
    .insert([newTopic])
    .select();

  if (insertErr) {
    console.error('Failed to insert topic:', insertErr);
  } else {
    console.log('Successfully inserted topic into Supabase:');
    console.log(JSON.stringify(inserted, null, 2));
  }
}

seed().catch(console.error);
