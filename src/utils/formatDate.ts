/**
 * Formats a Date object to 'YYYY/MM/DD' string.
 * @param date - The date to format
 * @param locale - The locale string (defaults to 'ja-JP')
 * @returns Formatted date string in YYYY/MM/DD format
 */
export function formatDate(date: Date, locale: string = 'ja-JP'): string {
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Formats a Date object to a readable date-time string.
 * @param date - The date to format
 * @param locale - The locale string (defaults to 'ja-JP')
 * @returns Formatted date-time string
 */
export function formatDateTime(date: Date, locale: string = 'ja-JP'): string {
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats a Date object to a short time string.
 * @param date - The date to format
 * @param locale - The locale string (defaults to 'ja-JP')
 * @returns Formatted time string in HH:MM format
 */
export function formatTime(date: Date, locale: string = 'ja-JP'): string {
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}
