import type { DateString, DateTimeString } from "../types";

// ── Parsing helpers ──────────────────────────────────────────────

/** Parse an ISO string into a Date object (local time) */
export function parseDate(iso: DateString | DateTimeString): Date {
  // For date-only strings (YYYY-MM-DD), parse as local time
  if (iso.length === 10) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(iso);
}

/** Format a Date object as YYYY-MM-DD */
export function toDateString(date: Date): DateString {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Format a Date object as ISO datetime string */
export function toDateTimeString(date: Date): DateTimeString {
  const ds = toDateString(date);
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${ds}T${h}:${min}:${s}`;
}

// ── Date arithmetic ──────────────────────────────────────────────

/** Add N days to a date string, returns a DateString */
export function addDays(date: DateString | DateTimeString, days: number): DateString {
  const d = parseDate(date);
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

/** Add N months to a date string */
export function addMonths(date: DateString, months: number): DateString {
  const d = parseDate(date);
  d.setMonth(d.getMonth() + months);
  return toDateString(d);
}

/** Add N weeks to a date string */
export function addWeeks(date: DateString, weeks: number): DateString {
  return addDays(date, weeks * 7);
}

// ── Start-of helpers ─────────────────────────────────────────────

/** Get the start of the week for a given date */
export function startOfWeek(date: DateString, weekStartsOn: number = 0): DateString {
  const d = parseDate(date);
  const day = d.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  return toDateString(d);
}

/** Get the start of the month */
export function startOfMonth(date: DateString): DateString {
  const d = parseDate(date);
  return toDateString(new Date(d.getFullYear(), d.getMonth(), 1));
}

/** Get the end of the month */
export function endOfMonth(date: DateString): DateString {
  const d = parseDate(date);
  return toDateString(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

// ── Comparison helpers ───────────────────────────────────────────

/** Check if two date strings represent the same day */
export function isSameDay(a: DateString | DateTimeString, b: DateString | DateTimeString): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

/** Check if two date strings are in the same month */
export function isSameMonth(a: DateString, b: DateString): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

/** Check if a date is today */
export function isToday(date: DateString): boolean {
  return date.slice(0, 10) === toDateString(new Date());
}

/** Check if date a is before date b */
export function isBefore(a: DateString | DateTimeString, b: DateString | DateTimeString): boolean {
  return a < b;
}

/** Check if date a is after date b */
export function isAfter(a: DateString | DateTimeString, b: DateString | DateTimeString): boolean {
  return a > b;
}

// ── Range helpers ────────────────────────────────────────────────

/** Check if two date ranges overlap */
export function rangesOverlap(
  startA: DateTimeString,
  endA: DateTimeString,
  startB: DateTimeString,
  endB: DateTimeString,
): boolean {
  return startA < endB && startB < endA;
}

/** Check if a date falls within a range (inclusive start, exclusive end) */
export function dateInRange(
  date: DateString,
  rangeStart: DateString,
  rangeEnd: DateString,
): boolean {
  const d = date.slice(0, 10);
  return d >= rangeStart.slice(0, 10) && d <= rangeEnd.slice(0, 10);
}

/** Get the number of days between two dates */
export function daysBetween(a: DateString, b: DateString): number {
  const dateA = parseDate(a);
  const dateB = parseDate(b);
  const diffMs = dateB.getTime() - dateA.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/** Generate an array of DateStrings from start to end (inclusive) */
export function eachDayOfRange(start: DateString, end: DateString): DateString[] {
  const days: DateString[] = [];
  let current = start;
  while (current <= end) {
    days.push(current);
    current = addDays(current, 1);
  }
  return days;
}

/** Get the array of 7 day headers for a given week start */
export function getWeekDays(weekStart: DateString): DateString[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

// ── View range helpers ───────────────────────────────────────────

/** Get the visible date range for the month view (includes padding days) */
export function getMonthViewRange(
  date: DateString,
  weekStartsOn: number = 0,
): { start: DateString; end: DateString } {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const start = startOfWeek(monthStart, weekStartsOn);
  // Always show 6 weeks for consistent height
  const end = addDays(start, 41);
  return { start, end: end > monthEnd ? end : addDays(start, 41) };
}

/** Get the visible date range for the week view */
export function getWeekViewRange(
  date: DateString,
  weekStartsOn: number = 0,
): { start: DateString; end: DateString } {
  const start = startOfWeek(date, weekStartsOn);
  const end = addDays(start, 6);
  return { start, end };
}

/** Get the visible date range for a given view */
export function getVisibleRange(
  date: DateString,
  view: "month" | "week" | "day" | "agenda",
  weekStartsOn: number = 0,
): { start: DateString; end: DateString } {
  switch (view) {
    case "month":
      return getMonthViewRange(date, weekStartsOn);
    case "week":
      return getWeekViewRange(date, weekStartsOn);
    case "day":
      return { start: date, end: date };
    case "agenda":
      return { start: date, end: addDays(date, 30) };
  }
}

/**
 * Get the ISO 8601 week number for a date.
 * Week 1 is the week containing the first Thursday of the year.
 */
export function getISOWeekNumber(date: DateString): number {
  const d = parseDate(date);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // Set to nearest Thursday: current date + 4 - current day number (Monday=1, Sunday=7)
  const dayNum = target.getDay() || 7; // Convert Sunday from 0 to 7
  target.setDate(target.getDate() + 4 - dayNum);
  const yearStart = new Date(target.getFullYear(), 0, 1);
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Filter out dates that fall on hidden days of the week.
 * @param days Array of date strings
 * @param hiddenDays Array of day-of-week numbers to hide (0=Sunday, 6=Saturday)
 * @returns Filtered array with hidden days removed
 */
export function filterHiddenDays(days: DateString[], hiddenDays: number[]): DateString[] {
  if (hiddenDays.length === 0) return days;
  const hiddenSet = new Set(hiddenDays);
  return days.filter((d) => !hiddenSet.has(parseDate(d).getDay()));
}

// ── Time helpers ─────────────────────────────────────────────────

/** Get the fractional hour from a datetime string (e.g., "2024-01-01T14:30:00" -> 14.5) */
export function getTimeOfDay(datetime: DateTimeString): number {
  const d = parseDate(datetime);
  return d.getHours() + d.getMinutes() / 60;
}

/** Get the duration in hours between two datetime strings */
export function getDurationHours(start: DateTimeString, end: DateTimeString): number {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
}

/** Generate time slot labels for a day (e.g., ["12 AM", "1 AM", ...]) */
export function getHourLabels(
  startHour: number = 0,
  endHour: number = 24,
  locale: string = "en-US",
): string[] {
  const formatter = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    hour12: true,
  });
  const labels: string[] = [];
  const base = new Date(2024, 0, 1);
  for (let h = startHour; h < endHour; h++) {
    base.setHours(h, 0, 0, 0);
    labels.push(formatter.format(base));
  }
  return labels;
}
