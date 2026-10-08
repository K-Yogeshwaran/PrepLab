/**
 * Question generator for "Tables, Squares & Cubes" (Module 02)
 *
 * Fully deterministic JavaScript generator supporting:
 * - Multiplication Tables (1-20): 20-Line Memorization & Multi-Table Speed Drills
 * - Squares (1-50): Configurable range (1-20, 1-30, 1-40, 1-50)
 * - Cubes (1-25): Configurable range (1-10, 1-15, 1-20, 1-25)
 * - Mixed Practice: Blend of tables, squares, and cubes within configured study scopes
 */

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate multiplication question
 * @param {Array<number>|number} tables - Selected table or array of tables (e.g., [12, 13, 14])
 * @param {string} subMode - 'memorization' or 'speed'
 * @param {number} step - Step index (1..20) for 20-line memorization
 */
function generateMultiplicationQuestion(tables = [17], subMode = 'memorization', step = 1) {
  const tableList = Array.isArray(tables)
    ? tables.map((t) => parseInt(t, 10)).filter((t) => !isNaN(t) && t >= 1 && t <= 20)
    : [parseInt(tables, 10) || 17];

  const safeTableList = tableList.length > 0 ? tableList : [17];

  let selectedTable;
  let multiplier;

  if (subMode === 'memorization') {
    // 20-Line Memorization uses single selected table (first in list)
    selectedTable = safeTableList[0];
    multiplier = Math.min(Math.max(step, 1), 20);
  } else {
    // Random Speed Drill picks randomly ONLY from the selected tables list
    selectedTable = safeTableList[randomInt(0, safeTableList.length - 1)];
    multiplier = randomInt(1, 20);
  }

  const num1 = selectedTable;
  const num2 = multiplier;
  const correctAnswer = num1 * num2;

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
 * Generate square question within max range
 */
function generateSquareQuestion(maxRange = 50) {
  const max = Math.min(Math.max(parseInt(maxRange, 10) || 50, 1), 50);
  const num = randomInt(1, max);
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
 * Generate cube question within max range
 */
function generateCubeQuestion(maxRange = 25) {
  const max = Math.min(Math.max(parseInt(maxRange, 10) || 25, 1), 25);
  const num = randomInt(1, max);
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
 * Single question factory respecting configured study scopes
 */
function generateSingleQuestion(index, mode, tables, subMode, squareMax, cubeMax) {
  let item;

  if (mode === 'tables') {
    item = generateMultiplicationQuestion(tables, subMode, index);
  } else if (mode === 'squares') {
    item = generateSquareQuestion(squareMax);
  } else if (mode === 'cubes') {
    item = generateCubeQuestion(cubeMax);
  } else {
    // Mixed Mode: pick randomly among multiplication, square, cube
    const choices = ['multiplication', 'square', 'cube'];
    const selectedOp = choices[randomInt(0, choices.length - 1)];

    if (selectedOp === 'multiplication') {
      item = generateMultiplicationQuestion(tables, 'speed', index);
    } else if (selectedOp === 'square') {
      item = generateSquareQuestion(squareMax);
    } else {
      item = generateCubeQuestion(cubeMax);
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
    'Master multiplication tables (1-20), squares (1-50), and cubes (1-25) through 20-line memorization, multi-table speed drills, and configured study scopes.',

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
      { id: 'speed', label: 'Random Speed Drill', description: 'Multi-table random speed drills' },
    ],
    defaultTableSubMode: 'memorization',

    tables: Array.from({ length: 20 }, (_, i) => i + 1),
    defaultTable: 17,

    squareRanges: [
      { id: 20, label: '1–20' },
      { id: 30, label: '1–30' },
      { id: 40, label: '1–40' },
      { id: 50, label: '1–50' },
    ],
    defaultSquareMax: 50,

    cubeRanges: [
      { id: 10, label: '1–10' },
      { id: 15, label: '1–15' },
      { id: 20, label: '1–20' },
      { id: 25, label: '1–25' },
    ],
    defaultCubeMax: 25,

    questionCounts: [5, 10, 15, 20, 25, 50, 100],
    defaultCount: 20,
  },

  /**
   * Main question generation entry point
   */
  generateQuestions({
    count = 20,
    mode = 'tables',
    table = 17,
    tables = [17],
    subMode = 'memorization',
    squareMax = 50,
    cubeMax = 25,
  } = {}) {
    const questions = [];
    const seenSignatures = new Set();

    // In 20-line memorization mode, count MUST be fixed at 20
    const isMemorization = mode === 'tables' && subMode === 'memorization';
    const targetCount = isMemorization ? 20 : Math.max(1, parseInt(count, 10) || 20);

    // Resolve table list
    const targetTables = Array.isArray(tables) && tables.length > 0
      ? tables
      : [table || 17];

    for (let i = 1; i <= targetCount; i++) {
      let candidate;
      let signature;
      let attempts = 0;

      do {
        candidate = generateSingleQuestion(i, mode, targetTables, subMode, squareMax, cubeMax);
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
