/**
 * Returns midnight UTC for today.
 */
export function startOfToday() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns a Date N days ago from now.
 */
export function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/**
 * Format a date as YYYY-MM-DD string.
 */
export function toDateString(date) {
  return date.toISOString().split('T')[0];
}