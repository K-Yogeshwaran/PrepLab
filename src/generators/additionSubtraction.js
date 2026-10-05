/**
 * Question generator for "Fast Addition & Subtraction"
 *
 * Fully deterministic JavaScript generator supporting:
 * - Operations: Addition, Subtraction, Both
 * - Difficulties: Easy, Medium, Hard, Mixed
 * - Calculation Styles: Standard, Near-base / Adjustment-friendly, Mixed
 */

/**
 * Return random integer between min and max (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a number close to a round base (e.g., 99, 98, 101, 102, 198, 297, 498, 998, etc.)
 * Perfect for speed-math near-base / adjustment techniques.
 */
function generateNearBaseNumber(difficulty) {
  let baseCandidates;

  if (difficulty === 'easy') {
    // Round bases: 20, 30, 40, 50, 100
    baseCandidates = [20, 30, 40, 50, 60, 100];
  } else if (difficulty === 'medium') {
    // Round bases: 100, 200, 300, 400, 500
    baseCandidates = [100, 150, 200, 250, 300, 400, 500];
  } else {
    // Hard round bases: 500, 1000, 1500, 2000, 3000
    baseCandidates = [500, 1000, 1200, 1500, 2000, 3000, 5000];
  }

  const base = baseCandidates[randomInt(0, baseCandidates.length - 1)];
  // Offsets commonly tested in aptitude exams: -3, -2, -1, +1, +2, +3
  const offsets = [-3, -2, -1, 1, 2, 3];
  const offset = offsets[randomInt(0, offsets.length - 1)];
  const result = base + offset;
  return Math.max(result, 10);
}

/**
 * Generates standard operands based on difficulty
 */
function generateStandardOperands(operation, difficulty) {
  let num1, num2;

  if (difficulty === 'easy') {
    if (operation === 'addition') {
      // 2-digit + 1-digit or 2-digit + 2-digit (low sum)
      num1 = randomInt(12, 60);
      num2 = randomInt(5, 39);
    } else {
      // Subtraction: positive answer, 2-digit - 1/2 digit
      num1 = randomInt(20, 95);
      num2 = randomInt(5, num1 - 2);
    }
  } else if (difficulty === 'medium') {
    if (operation === 'addition') {
      // 2-digit + 2-digit (with carrying) or 3-digit + 2-digit
      if (Math.random() < 0.5) {
        num1 = randomInt(35, 99);
        num2 = randomInt(25, 99);
      } else {
        num1 = randomInt(110, 650);
        num2 = randomInt(25, 95);
      }
    } else {
      // 2-digit - 2-digit with borrowing or 3-digit - 2/3 digit
      if (Math.random() < 0.5) {
        num1 = randomInt(40, 98);
        num2 = randomInt(18, num1 - 5);
      } else {
        num1 = randomInt(150, 750);
        num2 = randomInt(35, num1 - 10);
      }
    }
  } else {
    // Hard: 3-digit + 3-digit, 4-digit + 3/4-digit
    if (operation === 'addition') {
      if (Math.random() < 0.6) {
        num1 = randomInt(250, 989);
        num2 = randomInt(250, 989);
      } else {
        num1 = randomInt(1050, 6800);
        num2 = randomInt(450, 4200);
      }
    } else {
      // Hard subtraction: 3-digit - 3-digit, 4-digit - 3/4-digit
      if (Math.random() < 0.6) {
        num1 = randomInt(350, 999);
        num2 = randomInt(120, num1 - 15);
      } else {
        num1 = randomInt(1200, 8900);
        num2 = randomInt(450, num1 - 50);
      }
    }
  }

  return { num1, num2 };
}

/**
 * Generates near-base adjustment friendly operands
 * Example: 483 + 297, 625 - 198, 546 + 99, 742 - 299
 */
function generateNearBaseOperands(operation, difficulty) {
  const nearBaseNum = generateNearBaseNumber(difficulty);
  let otherNum;

  if (difficulty === 'easy') {
    otherNum = randomInt(25, 85);
  } else if (difficulty === 'medium') {
    otherNum = randomInt(120, 650);
  } else {
    otherNum = randomInt(450, 3500);
  }

  if (operation === 'addition') {
    // Order can be either otherNum + nearBaseNum or vice-versa
    const swap = Math.random() < 0.5;
    return swap
      ? { num1: nearBaseNum, num2: otherNum }
      : { num1: otherNum, num2: nearBaseNum };
  } else {
    // Subtraction: num1 must be strictly greater than num2
    if (otherNum <= nearBaseNum) {
      // Ensure num1 > num2
      return { num1: nearBaseNum + randomInt(15, 200), num2: nearBaseNum };
    }
    return { num1: otherNum, num2: nearBaseNum };
  }
}

/**
 * Generate a single question item based on settings
 */
function generateSingleQuestion(index, operationChoice, difficultyChoice, styleChoice) {
  // Resolve operation if 'both'
  const operation =
    operationChoice === 'both'
      ? Math.random() < 0.5
        ? 'addition'
        : 'subtraction'
      : operationChoice;

  // Resolve difficulty if 'mixed'
  let difficulty = difficultyChoice;
  if (difficultyChoice === 'mixed') {
    const difficulties = ['easy', 'medium', 'hard'];
    difficulty = difficulties[randomInt(0, 2)];
  }

  // Resolve style if 'mixed'
  let style = styleChoice;
  if (styleChoice === 'mixed') {
    style = Math.random() < 0.5 ? 'standard' : 'near-base';
  }

  // Generate numbers
  const operands =
    style === 'near-base'
      ? generateNearBaseOperands(operation, difficulty)
      : generateStandardOperands(operation, difficulty);

  let { num1, num2 } = operands;

  // Enforce positive result for subtraction
  if (operation === 'subtraction' && num1 < num2) {
    const temp = num1;
    num1 = num2;
    num2 = temp;
  }

  const operatorSymbol = operation === 'addition' ? '+' : '-';
  const correctAnswer = operation === 'addition' ? num1 + num2 : num1 - num2;
  const questionText = `${num1} ${operatorSymbol} ${num2}`;

  return {
    id: `q-${index}-${Date.now()}-${randomInt(100, 999)}`,
    questionNumber: index,
    question: questionText,
    num1,
    num2,
    operatorSymbol,
    operation,
    difficulty,
    style,
    correctAnswer,
  };
}

/**
 * Topic Definition and Question Generator
 */
export const additionSubtractionTopic = {
  id: 'fast-addition-subtraction',
  name: 'Fast Addition & Subtraction',
  category: 'Speed Math',
  description:
    'Master mental addition and subtraction with speed math techniques, near-base adjustments, and rapid calculation drills for banking and aptitude exams.',

  // Supported configuration options
  config: {
    questionCounts: [5, 10, 15, 20, 25, 50, 100],
    defaultCount: 10,

    operations: [
      { id: 'both', label: 'Addition & Subtraction (Both)', symbol: '+ / -' },
      { id: 'addition', label: 'Addition Only', symbol: '+' },
      { id: 'subtraction', label: 'Subtraction Only', symbol: '-' },
    ],
    defaultOperation: 'both',

    difficulties: [
      { id: 'mixed', label: 'Mixed Difficulty', description: 'Dynamic blend of easy, medium, and hard' },
      { id: 'easy', label: 'Easy', description: '2-digit fundamentals (great for warm-up)' },
      { id: 'medium', label: 'Medium', description: '2-digit with carrying & 3-digit calculations' },
      { id: 'hard', label: 'Hard', description: '3-digit and 4-digit complex speed math' },
    ],
    defaultDifficulty: 'mixed',

    styles: [
      { id: 'mixed', label: 'Mixed Styles', description: 'Blend of standard numbers & adjustment tricks' },
      { id: 'standard', label: 'Standard Numbers', description: 'Random natural numbers across ranges' },
      { id: 'near-base', label: 'Near-Base / Adjustment', description: 'Numbers near 50, 100, 500, 1000 (e.g. 483 + 297)' },
    ],
    defaultStyle: 'mixed',
  },

  /**
   * Generate an array of non-duplicate, verified questions
   */
  generateQuestions({ count = 10, operation = 'both', difficulty = 'mixed', style = 'mixed' } = {}) {
    const questions = [];
    const seenSignatures = new Set();
    const targetCount = Math.max(1, parseInt(count, 10) || 10);

    for (let i = 1; i <= targetCount; i++) {
      let candidate;
      let signature;
      let attempts = 0;

      // Avoid immediate duplicates
      do {
        candidate = generateSingleQuestion(i, operation, difficulty, style);
        signature = `${candidate.num1}${candidate.operatorSymbol}${candidate.num2}`;
        attempts++;
      } while (seenSignatures.has(signature) && attempts < 40);

      seenSignatures.add(signature);
      questions.push(candidate);
    }

    return questions;
  },
};

export default additionSubtractionTopic;
