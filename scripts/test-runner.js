/**
 * Automated test suite for PrepLab generator logic, math accuracy, and formatters.
 */
import assert from 'node:assert/strict';
import { additionSubtractionTopic } from '../src/generators/additionSubtraction.js';
import { getTopicGenerator, hasTopicGenerator, getRegisteredTopicDefinitions } from '../src/generators/index.js';
import {
  formatDuration,
  formatSeconds,
  formatAccuracy,
  calculateAccuracy,
} from '../src/utils/formatters.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(err);
    failed++;
  }
}

console.log('\n========================================');
console.log('Running PrepLab Core Logic Test Suite');
console.log('========================================\n');

// 1. Generator Registry Tests
console.log('[Suite 1: Generator Registry]');
test('Registry contains fast-addition-subtraction', () => {
  assert.equal(hasTopicGenerator('fast-addition-subtraction'), true);
  const gen = getTopicGenerator('fast-addition-subtraction');
  assert.ok(gen);
  assert.equal(gen.id, 'fast-addition-subtraction');
  assert.equal(gen.name, 'Fast Addition & Subtraction');
});

test('Registry returns all registered definitions', () => {
  const defs = getRegisteredTopicDefinitions();
  assert.ok(Array.isArray(defs));
  assert.ok(defs.length >= 1);
  assert.equal(defs[0].id, 'fast-addition-subtraction');
});

// 2. Question Generator Mathematical Correctness Tests
console.log('\n[Suite 2: Question Generation & Math Accuracy]');
test('Generates requested question count', () => {
  const counts = [5, 10, 15, 20, 25, 50];
  for (const count of counts) {
    const questions = additionSubtractionTopic.generateQuestions({ count });
    assert.equal(questions.length, count);
  }
});

test('Every addition question is mathematically verified', () => {
  const questions = additionSubtractionTopic.generateQuestions({
    count: 30,
    operation: 'addition',
    difficulty: 'mixed',
    style: 'mixed',
  });

  for (const q of questions) {
    assert.equal(q.operation, 'addition');
    assert.equal(q.operatorSymbol, '+');
    assert.equal(q.num1 + q.num2, q.correctAnswer);
    assert.equal(q.question, `${q.num1} + ${q.num2}`);
  }
});

test('Every subtraction question is non-negative and mathematically verified', () => {
  const questions = additionSubtractionTopic.generateQuestions({
    count: 30,
    operation: 'subtraction',
    difficulty: 'hard',
    style: 'near-base',
  });

  for (const q of questions) {
    assert.equal(q.operation, 'subtraction');
    assert.equal(q.operatorSymbol, '-');
    assert.ok(q.num1 >= q.num2, `Expected num1 (${q.num1}) >= num2 (${q.num2})`);
    assert.ok(q.correctAnswer >= 0, `Expected non-negative result, got ${q.correctAnswer}`);
    assert.equal(q.num1 - q.num2, q.correctAnswer);
    assert.equal(q.question, `${q.num1} - ${q.num2}`);
  }
});

test('Both operation mode produces mix of addition and subtraction', () => {
  const questions = additionSubtractionTopic.generateQuestions({
    count: 40,
    operation: 'both',
    difficulty: 'medium',
    style: 'mixed',
  });

  const additions = questions.filter((q) => q.operation === 'addition');
  const subtractions = questions.filter((q) => q.operation === 'subtraction');

  assert.ok(additions.length > 0, 'Expected some additions in "both" mode');
  assert.ok(subtractions.length > 0, 'Expected some subtractions in "both" mode');
});

test('Questions within a test have no immediate duplicate question texts', () => {
  const questions = additionSubtractionTopic.generateQuestions({
    count: 25,
    operation: 'both',
    difficulty: 'mixed',
    style: 'mixed',
  });

  const texts = questions.map((q) => q.question);
  const uniqueTexts = new Set(texts);
  assert.equal(texts.length, uniqueTexts.size, 'All questions in test must be distinct');
});

// 3. Formatters Tests
console.log('\n[Suite 3: Utility & Formatter Functions]');
test('formatDuration formats milliseconds correctly', () => {
  assert.equal(formatDuration(4200), '4.2s');
  assert.equal(formatDuration(65000), '1m 05s');
  assert.equal(formatDuration(3660000), '1h 01m');
  assert.equal(formatDuration(0), '0.0s');
});

test('formatSeconds formats single decimal seconds', () => {
  assert.equal(formatSeconds(3450), '3.5s');
  assert.equal(formatSeconds(1000), '1.0s');
  assert.equal(formatSeconds(0), '0.0s');
});

test('calculateAccuracy and formatAccuracy', () => {
  assert.equal(calculateAccuracy(9, 10), 90);
  assert.equal(calculateAccuracy(1, 3), 33.3);
  assert.equal(calculateAccuracy(0, 10), 0);
  assert.equal(formatAccuracy(90), '90.0%');
  assert.equal(formatAccuracy(33.333), '33.3%');
});

console.log('\n========================================');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
}
