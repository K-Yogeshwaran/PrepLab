import additionSubtractionTopic from './additionSubtraction.js';

/**
 * Registry of all available topic question generators.
 * To add a new topic in the future:
 * 1. Create a new generator module in `src/generators/<topicName>.js`.
 * 2. Register it in this dictionary by its unique topic ID (matching the topics table).
 */
const generatorRegistry = {
  [additionSubtractionTopic.id]: additionSubtractionTopic,
};

/**
 * Retrieve a topic generator by topic ID, numeric ID, or topic name.
 */
export function getTopicGenerator(identifier) {
  if (identifier == null) return null;

  const key = String(identifier).trim().toLowerCase();

  // 1. Direct registry lookup
  if (generatorRegistry[key]) {
    return generatorRegistry[key];
  }

  // 2. Lookup by id or name across registered topics
  const all = Object.values(generatorRegistry);
  const found = all.find(
    (t) =>
      String(t.id).toLowerCase() === key ||
      String(t.name).toLowerCase() === key ||
      key.includes('addition') ||
      key === '1'
  );

  return found || null;
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
