/**
 * Automated test suite for PrepLab generator logic, math accuracy, and formatters.
 */
import assert from 'node:assert/strict';
import { additionSubtractionTopic } from '../src/generators/additionSubtraction.js';
import { tablesSquaresCubesTopic } from '../src/generators/tablesSquaresCubes.js';
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

test('Registry contains tables-squares-cubes', () => {
  assert.equal(hasTopicGenerator('tables-squares-cubes'), true);
  const gen = getTopicGenerator('tables-squares-cubes');
  assert.ok(gen);
  assert.equal(gen.id, 'tables-squares-cubes');
  assert.equal(gen.name, 'Tables, Squares & Cubes');
});

test('Registry maps DB ID 1 and 3 correctly', () => {
  const m1 = getTopicGenerator(1);
  const m2 = getTopicGenerator(3);
  assert.equal(m1.id, 'fast-addition-subtraction');
  assert.equal(m2.id, 'tables-squares-cubes');
});

test('Registry returns all registered definitions', () => {
  const defs = getRegisteredTopicDefinitions();
  assert.ok(Array.isArray(defs));
  assert.ok(defs.length >= 2);
});

// 2. Question Generator Mathematical Correctness Tests — Module 01
console.log('\n[Suite 2: Module 01 — Addition & Subtraction]');
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

// 3. Question Generator Mathematical Correctness Tests — Module 02
console.log('\n[Suite 3: Module 02 — Tables, Squares & Cubes]');
test('20-line memorization generates exactly 20 sequential questions', () => {
  const questions = tablesSquaresCubesTopic.generateQuestions({
    mode: 'tables',
    table: 17,
    subMode: 'memorization',
  });

  assert.equal(questions.length, 20);
  for (let i = 0; i < 20; i++) {
    const step = i + 1;
    const q = questions[i];
    assert.equal(q.operation, 'multiplication');
    assert.equal(q.question, `17 × ${step}`);
    assert.equal(q.correctAnswer, 17 * step);
  }
});

test('Multi-table speed drill generates ONLY from selected tables set [12, 13, 14]', () => {
  const selectedTables = [12, 13, 14];
  const questions = tablesSquaresCubesTopic.generateQuestions({
    mode: 'tables',
    tables: selectedTables,
    subMode: 'speed',
    count: 30,
  });

  assert.equal(questions.length, 30);
  for (const q of questions) {
    assert.equal(q.operation, 'multiplication');
    assert.ok(
      selectedTables.includes(q.num1),
      `Generated table ${q.num1} must be in selected set [12, 13, 14]`
    );
    assert.ok(q.num2 >= 1 && q.num2 <= 20, `Multiplier ${q.num2} must be in [1, 20]`);
    assert.equal(q.correctAnswer, q.num1 * q.num2);
  }
});

test('Square range restriction 1-30 generates numbers <= 30 strictly', () => {
  const questions = tablesSquaresCubesTopic.generateQuestions({
    mode: 'squares',
    squareMax: 30,
    count: 25,
  });

  assert.equal(questions.length, 25);
  for (const q of questions) {
    assert.equal(q.operation, 'square');
    assert.ok(q.num1 >= 1 && q.num1 <= 30, `Square base ${q.num1} must be in [1, 30]`);
    assert.equal(q.question, `${q.num1}²`);
    assert.equal(q.correctAnswer, q.num1 * q.num1);
  }
});

test('Cube range restriction 1-15 generates numbers <= 15 strictly', () => {
  const questions = tablesSquaresCubesTopic.generateQuestions({
    mode: 'cubes',
    cubeMax: 15,
    count: 25,
  });

  assert.equal(questions.length, 25);
  for (const q of questions) {
    assert.equal(q.operation, 'cube');
    assert.ok(q.num1 >= 1 && q.num1 <= 15, `Cube base ${q.num1} must be in [1, 15]`);
    assert.equal(q.question, `${q.num1}³`);
    assert.equal(q.correctAnswer, q.num1 * q.num1 * q.num1);
  }
});

test('Mixed mode respects configured scopes (tables=[12, 13], squareMax=30, cubeMax=15)', () => {
  const selectedTables = [12, 13];
  const questions = tablesSquaresCubesTopic.generateQuestions({
    mode: 'mixed',
    tables: selectedTables,
    squareMax: 30,
    cubeMax: 15,
    count: 50,
  });

  assert.equal(questions.length, 50);
  for (const q of questions) {
    if (q.operation === 'multiplication') {
      assert.ok(selectedTables.includes(q.num1), `Multiplication table ${q.num1} must be in [12, 13]`);
    } else if (q.operation === 'square') {
      assert.ok(q.num1 <= 30, `Square base ${q.num1} must be <= 30`);
    } else if (q.operation === 'cube') {
      assert.ok(q.num1 <= 15, `Cube base ${q.num1} must be <= 15`);
    } else {
      assert.fail(`Invalid operation: ${q.operation}`);
    }
  }
});

// 4. Formatters Tests
console.log('\n[Suite 4: Utility & Formatter Functions]');
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
