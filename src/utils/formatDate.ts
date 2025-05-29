/**
 * Formats a Date object to 'YYYY/MM/DD' string (Japanese locale default).
 */
export function formatDate(date: Date, locale = 'ja-JP'): string {
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}
