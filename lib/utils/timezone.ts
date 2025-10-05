/**
 * Timezone Utilities for Ethiopian Time Zone (EAT)
 * UTC+3 (Africa/Addis_Ababa)
 */

import { format, formatInTimeZone } from 'date-fns-tz';
import { parseISO } from 'date-fns';

export const ETHIOPIAN_TIMEZONE = 'Africa/Addis_Ababa';

/**
 * Format a date in Ethiopian timezone
 */
export function formatEthiopianTime(
  date: Date | string,
  formatStr: string = 'PPpp'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, ETHIOPIAN_TIMEZONE, formatStr);
}

/**
 * Format date only (no time)
 */
export function formatEthiopianDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, ETHIOPIAN_TIMEZONE, 'PP');
}

/**
 * Format time only (no date)
 */
export function formatEthiopianTimeOnly(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, ETHIOPIAN_TIMEZONE, 'p');
}

/**
 * Format for appointment display
 */
export function formatAppointmentTime(startsAt: Date | string, endsAt: Date | string): string {
  const start = typeof startsAt === 'string' ? parseISO(startsAt) : startsAt;
  const end = typeof endsAt === 'string' ? parseISO(endsAt) : endsAt;
  
  const date = formatInTimeZone(start, ETHIOPIAN_TIMEZONE, 'EEEE, MMMM d, yyyy');
  const timeStart = formatInTimeZone(start, ETHIOPIAN_TIMEZONE, 'h:mm a');
  const timeEnd = formatInTimeZone(end, ETHIOPIAN_TIMEZONE, 'h:mm a');
  
  return `${date} • ${timeStart} - ${timeEnd}`;
}

/**
 * Get current time in Ethiopian timezone
 */
export function getNowInEthiopianTime(): Date {
  return new Date();
}

/**
 * Convert date to ISO string for database storage
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

