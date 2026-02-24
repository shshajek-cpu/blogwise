import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'
import { ko } from 'date-fns/locale'

function parseDate(date: string | Date): Date {
  if (typeof date === 'string') {
    const parsed = parseISO(date)
    return isValid(parsed) ? parsed : new Date(date)
  }
  return date
}

/**
 * Formats a date as a localized date string.
 * Example: "2024년 1월 15일"
 */
export function formatDate(date: string | Date): string {
  return format(parseDate(date), 'yyyy년 M월 d일', { locale: ko })
}

/**
 * Formats a date as relative time from now.
 * Example: "3일 전"
 */
export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(parseDate(date), { addSuffix: true, locale: ko })
}

/**
 * Formats a date as a full date-time string.
 * Example: "2024년 1월 15일 오후 3:30"
 */
export function formatDateTime(date: string | Date): string {
  return format(parseDate(date), 'yyyy년 M월 d일 a h:mm', { locale: ko })
}

/**
 * Formats a date for use in HTML datetime attributes (ISO 8601).
 * Example: "2024-01-15T15:30:00.000Z"
 */
export function formatISO(date: string | Date): string {
  return parseDate(date).toISOString()
}
