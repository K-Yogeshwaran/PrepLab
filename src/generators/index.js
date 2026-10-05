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
 * Retrieve a topic generator by topic ID.
 */
export function getTopicGenerator(topicId) {
  if (!topicId) return null;
  return generatorRegistry[topicId] || null;
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
export function hasTopicGenerator(topicId) {
  return Boolean(generatorRegistry[topicId]);
}
