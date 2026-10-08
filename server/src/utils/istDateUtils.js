// Indian Standard Time (IST - Asia/Kolkata, UTC+5:30) Date Utilities for Backend

export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns { year, month, day } of a date in Indian Standard Time (Asia/Kolkata)
 */
export function getISTDateParts(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return getISTDateParts(now);
  }
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const [year, month, day] = formatter.format(d).split('-').map(Number);
  return { year, month, day };
}

/**
 * Returns UTC timestamp representing midnight (00:00:00) of that date in IST
 */
export function getISTMidnightTimestamp(date = new Date()) {
  const { year, month, day } = getISTDateParts(date);
  return Date.UTC(year, month - 1, day);
}

/**
 * Computes remaining calendar days in Indian Standard Time.
 * Updates accurately at IST midnight (00:00:00 IST).
 */
export function calculateISTDaysRemaining(expiresAt, now = new Date()) {
  if (!expiresAt) return 0;
  const exp = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  const cur = now instanceof Date ? now : new Date(now);

  if (isNaN(exp.getTime()) || isNaN(cur.getTime())) return 0;
  if (exp.getTime() <= cur.getTime()) return 0;

  const curMidnight = getISTMidnightTimestamp(cur);
  const expMidnight = getISTMidnightTimestamp(exp);

  const diffDays = Math.round((expMidnight - curMidnight) / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * Format date strictly in Indian Standard Time (IST / en-IN)
 * Example: "14 Oct 2026"
 */
export function formatISTDate(date, options = {}) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    timeZone: IST_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options
  });
}

/**
 * Format date and time strictly in Indian Standard Time (IST / en-IN)
 * Example: "14 Oct 2026, 11:59 pm"
 */
export function formatISTDateTime(date, options = {}) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', {
    timeZone: IST_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...options
  });
}
