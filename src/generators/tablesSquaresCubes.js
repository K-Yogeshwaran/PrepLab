/**
 * Question generator for "Tables, Squares & Cubes" (Module 02)
 *
 * Fully deterministic JavaScript generator supporting:
 * - Multiplication Tables (1-20): 20-Line Memorization (n × 1 ... n × 20) & Random Speed Drill
 * - Squares (1-50): 1² ... 50²
 * - Cubes (1-25): 1³ ... 25³
 * - Mixed Practice: Blend of tables, squares, and cubes
 */

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate multiplication question (tables 1-20)
 */
function generateMultiplicationQuestion(tableChoice = 17, subMode = 'memorization', step = 1) {
  let table = parseInt(tableChoice, 10) || 17;
  let multiplier;

  if (subMode === 'memorization') {
    // 20-Line Memorization: strictly step 1 to 20
    multiplier = Math.min(Math.max(step, 1), 20);
  } else {
    // Speed drill for selected table
    multiplier = randomInt(1, 20);
  }

  const num1 = table;
  const num2 = multiplier;
  const correctAnswer = table * multiplier;

  return {
    question: `${num1} × ${num2}`,
    num1,
    num2,
    operatorSymbol: '×',
    operation: 'multiplication',
    correctAnswer,
  };
}

/**
 * Generate square question (1-50)
 */
function generateSquareQuestion() {
  const num = randomInt(1, 50);
  const correctAnswer = num * num;

  return {
    question: `${num}²`,
    num1: num,
    num2: null,
    operatorSymbol: '²',
    operation: 'square',
    correctAnswer,
  };
}

/**
 * Generate cube question (1-25)
 */
function generateCubeQuestion() {
  const num = randomInt(1, 25);
  const correctAnswer = num * num * num;

  return {
    question: `${num}³`,
    num1: num,
    num2: null,
    operatorSymbol: '³',
    operation: 'cube',
    correctAnswer,
  };
}

/**
 * Single question factory
 */
function generateSingleQuestion(index, mode, table, subMode) {
  let item;

  if (mode === 'tables') {
    item = generateMultiplicationQuestion(table, subMode, index);
  } else if (mode === 'squares') {
    item = generateSquareQuestion();
  } else if (mode === 'cubes') {
    item = generateCubeQuestion();
  } else {
    // Mixed Mode: pick randomly among multiplication, square, cube
    const choices = ['multiplication', 'square', 'cube'];
    const selectedOp = choices[randomInt(0, choices.length - 1)];

    if (selectedOp === 'multiplication') {
      const randomTable = randomInt(1, 20);
      item = generateMultiplicationQuestion(randomTable, 'speed', index);
    } else if (selectedOp === 'square') {
      item = generateSquareQuestion();
    } else {
      item = generateCubeQuestion();
    }
  }

  return {
    id: `q-${index}-${Date.now()}-${randomInt(100, 999)}`,
    questionNumber: index,
    question: item.question,
    num1: item.num1,
    num2: item.num2,
    operatorSymbol: item.operatorSymbol,
    operation: item.operation,
    correctAnswer: item.correctAnswer,
    mode,
  };
}

export const tablesSquaresCubesTopic = {
  id: 'tables-squares-cubes',
  name: 'Tables, Squares & Cubes',
  category: 'Speed Math',
  description:
    'Master multiplication tables (1-20), squares (1-50), and cubes (1-25) through 20-line memorization, speed drills, and mixed practice.',

  config: {
    modes: [
      { id: 'tables', label: 'Tables', description: 'Multiplication tables 1–20' },
      { id: 'squares', label: 'Squares', description: 'Perfect squares 1–50' },
      { id: 'cubes', label: 'Cubes', description: 'Perfect cubes 1–25' },
      { id: 'mixed', label: 'Mixed', description: 'Blend of tables, squares, and cubes' },
    ],
    defaultMode: 'tables',

    tableSubModes: [
      { id: 'memorization', label: '20-Line Memorization', description: 'Sequential n × 1 through n × 20' },
      { id: 'speed', label: 'Random Speed Drill', description: 'Randomized multiplier drills for table n' },
    ],
    defaultTableSubMode: 'memorization',

    tables: Array.from({ length: 20 }, (_, i) => i + 1),
    defaultTable: 17,

    questionCounts: [5, 10, 15, 20, 25, 50],
    defaultCount: 20,
  },

  /**
   * Main question generation entry point
   */
  generateQuestions({
    count = 20,
    mode = 'tables',
    table = 17,
    subMode = 'memorization',
  } = {}) {
    const questions = [];
    const seenSignatures = new Set();

    // In 20-line memorization mode, count MUST be fixed at 20
    const isMemorization = mode === 'tables' && subMode === 'memorization';
    const targetCount = isMemorization ? 20 : Math.max(1, parseInt(count, 10) || 20);

    for (let i = 1; i <= targetCount; i++) {
      let candidate;
      let signature;
      let attempts = 0;

      do {
        candidate = generateSingleQuestion(i, mode, table, subMode);
        signature = candidate.question;
        attempts++;
      } while (!isMemorization && seenSignatures.has(signature) && attempts < 40);

      seenSignatures.add(signature);
      questions.push(candidate);
    }

    return questions;
  },
};

export default tablesSquaresCubesTopic;
