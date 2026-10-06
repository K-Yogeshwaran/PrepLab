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

async function testSave() {
  console.log('1. Fetching topic record for "Tables, Squares & Cubes"...');
  const { data: topic, error: topicErr } = await supabase
    .from('topics')
    .select('*')
    .eq('name', 'Tables, Squares & Cubes')
    .single();

  if (topicErr || !topic) {
    console.error('Topic lookup error:', topicErr);
    return;
  }
  console.log('Found Topic:', topic);

  console.log('2. Inserting test_attempt for topic_id:', topic.id);
  const testPayload = {
    topic_id: topic.id,
    question_count: 5,
    correct_count: 5,
    accuracy: 100,
    total_time_ms: 12500,
    average_time_ms: 2500,
  };

  const { data: insertedTest, error: insertTestErr } = await supabase
    .from('test_attempts')
    .insert([testPayload])
    .select('*, topics(*)')
    .single();

  if (insertTestErr) {
    console.error('Test attempt insert error:', insertTestErr);
    return;
  }

  console.log('Successfully inserted test_attempt with joined topic:');
  console.log(JSON.stringify(insertedTest, null, 2));

  console.log('3. Inserting question_attempts...');
  const questions = [
    {
      test_id: insertedTest.id,
      question_number: 1,
      operation: 'multiplication',
      question: '17 × 8',
      correct_answer: 136,
      user_answer: 136,
      is_correct: true,
      time_taken_ms: 2400,
    },
    {
      test_id: insertedTest.id,
      question_number: 2,
      operation: 'square',
      question: '37²',
      correct_answer: 1369,
      user_answer: 1369,
      is_correct: true,
      time_taken_ms: 2600,
    },
  ];

  const { data: insertedQuestions, error: insertQErr } = await supabase
    .from('question_attempts')
    .insert(questions)
    .select();

  if (insertQErr) {
    console.error('Question attempt insert error:', insertQErr);
  } else {
    console.log('Successfully inserted question_attempts:', insertedQuestions.length);
  }
}

testSave().catch(console.error);
