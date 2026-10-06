import additionSubtractionTopic from './additionSubtraction.js';
import tablesSquaresCubesTopic from './tablesSquaresCubes.js';

/**
 * Registry of all available topic question generators.
 */
const generatorRegistry = {
  [additionSubtractionTopic.id]: additionSubtractionTopic,
  [tablesSquaresCubesTopic.id]: tablesSquaresCubesTopic,
};

/**
 * Retrieve a topic generator by topic ID (e.g. 1 or 3), slug, or name.
 */
export function getTopicGenerator(identifier) {
  if (identifier == null) return null;

  const key = String(identifier).trim().toLowerCase();

  // 1. Direct registry lookup
  if (generatorRegistry[key]) {
    return generatorRegistry[key];
  }

  // 2. ID / Slug / Keyword matching
  if (
    key.includes('table') ||
    key.includes('square') ||
    key.includes('cube') ||
    key === '3' ||
    key === '2'
  ) {
    return tablesSquaresCubesTopic;
  }

  if (
    key.includes('addition') ||
    key.includes('subtraction') ||
    key === '1'
  ) {
    return additionSubtractionTopic;
  }

  const all = Object.values(generatorRegistry);
  const found = all.find(
    (t) =>
      String(t.id).toLowerCase() === key ||
      String(t.name).toLowerCase() === key
  );

  return found || additionSubtractionTopic;
}

/**
 * List all locally registered topic generators.
 */
export function getRegisteredTopicDefinitions() {
  return Object.values(generatorRegistry);
}

/**
 * Check if a topic has a registered generator.
 */
export function hasTopicGenerator(identifier) {
  return Boolean(getTopicGenerator(identifier));
}
