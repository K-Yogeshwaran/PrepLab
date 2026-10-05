/**
 * Format milliseconds into a human-readable duration string.
 * Examples:
 * - 4250ms -> "4.2s"
 * - 65200ms -> "1m 05s"
 * - 3600000ms -> "1h 00m"
 */
export function formatDuration(ms) {
  if (ms == null || isNaN(ms) || ms < 0) return '0.0s';
  const totalSeconds = ms / 1000;

  if (totalSeconds < 60) {
    return `${totalSeconds.toFixed(1)}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = Math.floor(totalSeconds % 60);

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes.toString().padStart(2, '0')}m`;
}

/**
 * Format milliseconds to a precise seconds representation with one decimal place.
 * Example: 3450 -> "3.5s"
 */
export function formatSeconds(ms) {
  if (ms == null || isNaN(ms) || ms < 0) return '0.0s';
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Format accuracy percentage with 1 decimal place.
 * Example: 85.714 -> "85.7%"
 */
export function formatAccuracy(val) {
  if (val == null || isNaN(val)) return '0.0%';
  return `${Number(val).toFixed(1)}%`;
}

/**
 * Format an ISO date string into readable date and time.
 * Example: "Oct 5, 2026, 10:30 PM"
 */
export function formatDateTime(dateString) {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format date in short form for charts and tables (e.g. "Oct 5, 22:30").
 */
export function formatShortDate(dateString) {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Calculate accuracy percentage given correct count and total count.
 */
export function calculateAccuracy(correctCount, totalCount) {
  if (!totalCount || totalCount <= 0) return 0;
  const acc = (correctCount / totalCount) * 100;
  return Math.round(acc * 10) / 10;
}
