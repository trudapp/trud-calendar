import type {
  CalendarEvent,
  DateString,
  RecurrenceRule,
  RecurrenceDay,
  RecurrenceFrequency,
} from "../types";
import { parseDate, toDateString } from "./date";

// ── Day mapping ─────────────────────────────────────────────────

const DAY_MAP: Record<RecurrenceDay, number> = {
  SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
};

// DAY_REVERSE is used internally for future weekday name generation if needed
// Keeping as a comment for reference:
// const DAY_REVERSE = { 0: "SU", 1: "MO", 2: "TU", 3: "WE", 4: "TH", 5: "FR", 6: "SA" };

// ── Generate occurrences ────────────────────────────────────────

/** Max occurrences to generate for "forever" rules (safety limit) */
const MAX_OCCURRENCES = 730; // ~2 years of daily events

/**
 * Generate occurrence dates for a recurrence rule within a visible range.
 * Returns an array of DateStrings where the event occurs.
 */
export function generateOccurrences(
  rule: RecurrenceRule,
  eventStartDate: DateString,
  rangeStart: DateString,
  rangeEnd: DateString,
  exDates: DateString[] = [],
): DateString[] {
  const results: DateString[] = [];
  const exSet = new Set(exDates);

  const interval = rule.interval ?? 1;
  const start = parseDate(eventStartDate);
  const rEnd = parseDate(rangeEnd);
  const rStart = parseDate(rangeStart);

  // Until date: stop after this date
  const untilDate = rule.until ? parseDate(rule.until) : null;

  const maxCount = rule.count ?? MAX_OCCURRENCES;

  switch (rule.freq) {
    case "daily":
      generateDaily(start, interval, rStart, rEnd, untilDate, maxCount, exSet, results);
      break;
    case "weekly":
      generateWeekly(start, interval, rule.byDay, rStart, rEnd, untilDate, maxCount, exSet, results);
      break;
    case "monthly":
      generateMonthly(start, interval, rule, rStart, rEnd, untilDate, maxCount, exSet, results);
      break;
    case "yearly":
      generateYearly(start, interval, rStart, rEnd, untilDate, maxCount, exSet, results);
      break;
  }

  return results;
}

function generateDaily(
  start: Date,
  interval: number,
  rangeStart: Date,
  rangeEnd: Date,
  until: Date | null,
  maxCount: number,
  exSet: Set<string>,
  results: DateString[],
) {
  const cursor = new Date(start);
  let count = 0;

  // Skip ahead to near rangeStart if we're far behind (performance optimization)
  if (cursor < rangeStart && maxCount === MAX_OCCURRENCES) {
    const daysDiff = Math.floor((rangeStart.getTime() - cursor.getTime()) / (1000 * 60 * 60 * 24));
    const stepsToSkip = Math.floor(daysDiff / interval);
    if (stepsToSkip > 0) {
      cursor.setDate(cursor.getDate() + stepsToSkip * interval);
      // Step back one interval to be safe
      cursor.setDate(cursor.getDate() - interval);
    }
  }

  while (count < maxCount) {
    if (until && cursor > until) break;
    if (cursor > rangeEnd) break;

    const ds = toDateString(cursor);
    if (cursor >= rangeStart && !exSet.has(ds)) {
      results.push(ds);
    }

    count++;
    cursor.setDate(cursor.getDate() + interval);
  }
}

function generateWeekly(
  start: Date,
  interval: number,
  byDay: RecurrenceDay[] | undefined,
  rangeStart: Date,
  rangeEnd: Date,
  until: Date | null,
  maxCount: number,
  exSet: Set<string>,
  results: DateString[],
) {
  // If no byDay, use the day of the week of the start date
  const targetDays = byDay
    ? byDay.map((d) => DAY_MAP[d]).sort((a, b) => a - b)
    : [start.getDay()];

  // Start at the beginning of the event's week
  const cursor = new Date(start);
  cursor.setDate(cursor.getDate() - cursor.getDay()); // Go to Sunday of start week

  // Skip ahead to near rangeStart if we're far behind (performance optimization)
  if (cursor < rangeStart && maxCount === MAX_OCCURRENCES) {
    const daysDiff = Math.floor((rangeStart.getTime() - cursor.getTime()) / (1000 * 60 * 60 * 24));
    const weeksToSkip = Math.floor(daysDiff / (7 * interval));
    if (weeksToSkip > 1) {
      cursor.setDate(cursor.getDate() + (weeksToSkip - 1) * 7 * interval);
    }
  }

  let count = 0;

  while (count < maxCount) {
    if (until && cursor > until) break;
    if (cursor > rangeEnd && results.length > 0) break;
    // Safety: don't iterate forever past range
    if (cursor.getTime() > rangeEnd.getTime() + 7 * 24 * 60 * 60 * 1000) break;

    // Check if this is a valid week (respects interval)
    const weekStart = new Date(cursor);

    for (const dayNum of targetDays) {
      const candidate = new Date(weekStart);
      candidate.setDate(weekStart.getDate() + dayNum);

      if (candidate < start) continue;
      if (until && candidate > until) break;
      if (count >= maxCount) break;

      const ds = toDateString(candidate);
      if (candidate >= rangeStart && candidate <= rangeEnd && !exSet.has(ds)) {
        results.push(ds);
      }

      count++;
    }

    // Advance by interval weeks
    cursor.setDate(cursor.getDate() + 7 * interval);
  }
}

function generateMonthly(
  start: Date,
  interval: number,
  rule: RecurrenceRule,
  rangeStart: Date,
  rangeEnd: Date,
  until: Date | null,
  maxCount: number,
  exSet: Set<string>,
  results: DateString[],
) {
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  let count = 0;

  // Skip ahead to near rangeStart if we're far behind (performance optimization)
  if (cursor < rangeStart && maxCount === MAX_OCCURRENCES) {
    const monthsDiff = (rangeStart.getFullYear() - cursor.getFullYear()) * 12 +
      (rangeStart.getMonth() - cursor.getMonth());
    const monthsToSkip = Math.floor(monthsDiff / interval);
    if (monthsToSkip > 1) {
      cursor.setMonth(cursor.getMonth() + (monthsToSkip - 1) * interval);
    }
  }

  while (count < maxCount) {
    if (until && cursor > until) break;
    if (cursor.getTime() > rangeEnd.getTime() + 31 * 24 * 60 * 60 * 1000) break;

    const candidates: Date[] = [];

    if (rule.byDay && rule.bySetPos !== undefined) {
      // "Nth weekday of month" — e.g., first Monday, last Friday
      for (const dayStr of rule.byDay) {
        const dayNum = DAY_MAP[dayStr];
        const found = getNthWeekdayOfMonth(cursor.getFullYear(), cursor.getMonth(), dayNum, rule.bySetPos);
        if (found) candidates.push(found);
      }
    } else if (rule.byMonthDay && rule.byMonthDay.length > 0) {
      // Specific day(s) of month
      for (const md of rule.byMonthDay) {
        const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
        if (md <= daysInMonth) {
          candidates.push(new Date(cursor.getFullYear(), cursor.getMonth(), md));
        }
      }
    } else {
      // Same day of month as start date
      const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
      const dayOfMonth = Math.min(start.getDate(), daysInMonth);
      candidates.push(new Date(cursor.getFullYear(), cursor.getMonth(), dayOfMonth));
    }

    for (const candidate of candidates) {
      if (candidate < start) continue;
      if (until && candidate > until) break;
      if (count >= maxCount) break;

      const ds = toDateString(candidate);
      if (candidate >= rangeStart && candidate <= rangeEnd && !exSet.has(ds)) {
        results.push(ds);
      }

      count++;
    }

    // Advance by interval months
    cursor.setMonth(cursor.getMonth() + interval);
  }
}

function generateYearly(
  start: Date,
  interval: number,
  rangeStart: Date,
  rangeEnd: Date,
  until: Date | null,
  maxCount: number,
  exSet: Set<string>,
  results: DateString[],
) {
  const cursor = new Date(start);
  let count = 0;

  while (count < maxCount) {
    if (until && cursor > until) break;
    if (cursor > rangeEnd) break;

    const ds = toDateString(cursor);
    if (cursor >= rangeStart && !exSet.has(ds)) {
      results.push(ds);
    }

    count++;
    cursor.setFullYear(cursor.getFullYear() + interval);

    // Handle Feb 29 → Feb 28 for non-leap years
    if (start.getMonth() === 1 && start.getDate() === 29) {
      const daysInFeb = new Date(cursor.getFullYear(), 2, 0).getDate();
      cursor.setMonth(1, Math.min(29, daysInFeb));
    }
  }
}

function getNthWeekdayOfMonth(
  year: number,
  month: number,
  dayOfWeek: number,
  n: number,
): Date | null {
  if (n > 0) {
    // Find the nth occurrence
    const first = new Date(year, month, 1);
    const firstDayOfWeek = first.getDay();
    let dayOfMonth = 1 + ((dayOfWeek - firstDayOfWeek + 7) % 7) + (n - 1) * 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    if (dayOfMonth > daysInMonth) return null;
    return new Date(year, month, dayOfMonth);
  } else if (n === -1) {
    // Last occurrence
    const last = new Date(year, month + 1, 0);
    const lastDayOfWeek = last.getDay();
    const diff = (lastDayOfWeek - dayOfWeek + 7) % 7;
    return new Date(year, month, last.getDate() - diff);
  }
  return null;
}

// ── Expand recurring events ─────────────────────────────────────

/**
 * Expand recurring events into individual instances within a visible range.
 * Non-recurring events pass through unchanged.
 * Instance IDs follow the pattern: `${parentId}::${YYYY-MM-DD}`
 */
export function expandRecurringEvents(
  events: CalendarEvent[],
  rangeStart: DateString,
  rangeEnd: DateString,
): CalendarEvent[] {
  const result: CalendarEvent[] = [];

  for (const event of events) {
    // Skip instances that were already expanded (shouldn't happen, but be safe)
    if (event.recurringEventId) {
      result.push(event);
      continue;
    }

    if (!event.recurrence) {
      result.push(event);
      continue;
    }

    const eventStartDate = event.start.slice(0, 10);
    const eventStartTime = event.start.length > 10 ? event.start.slice(10) : "T00:00:00";
    const eventEndTime = event.end.length > 10 ? event.end.slice(10) : "T23:59:00";

    // Calculate duration in days (for multi-day recurring — rare but possible)
    const startD = parseDate(event.start);
    const endD = parseDate(event.end);
    const durationDays = Math.floor((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24));

    const occurrences = generateOccurrences(
      event.recurrence,
      eventStartDate,
      rangeStart,
      rangeEnd,
      event.exDates,
    );

    for (const occ of occurrences) {
      const instanceId = `${event.id}::${occ}`;
      let instanceEnd = `${occ}${eventEndTime}`;

      // If the original event spanned multiple days, offset the end
      if (durationDays > 0) {
        const occDate = parseDate(occ);
        occDate.setDate(occDate.getDate() + durationDays);
        instanceEnd = `${toDateString(occDate)}${eventEndTime}`;
      }

      result.push({
        ...event,
        id: instanceId,
        start: `${occ}${eventStartTime}`,
        end: instanceEnd,
        recurringEventId: event.id,
        originalDate: occ,
        // Don't carry over recurrence to instances
        recurrence: undefined,
        exDates: undefined,
      });
    }
  }

  return result;
}

// ── RFC 5545 parsing / serialization ────────────────────────────

const FREQ_MAP: Record<string, RecurrenceFrequency> = {
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
};

const FREQ_REVERSE: Record<RecurrenceFrequency, string> = {
  daily: "DAILY",
  weekly: "WEEKLY",
  monthly: "MONTHLY",
  yearly: "YEARLY",
};

/**
 * Parse an RFC 5545 RRULE string into a RecurrenceRule.
 * Supports: FREQ, INTERVAL, COUNT, UNTIL, BYDAY, BYMONTHDAY, BYSETPOS
 * @example parseRRule("FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR")
 */
export function parseRRule(rruleString: string): RecurrenceRule {
  const str = rruleString.replace(/^RRULE:/, "");
  const parts = str.split(";");
  const rule: RecurrenceRule = { freq: "daily" };

  for (const part of parts) {
    const [key, value] = part.split("=");
    switch (key) {
      case "FREQ":
        rule.freq = FREQ_MAP[value] ?? "daily";
        break;
      case "INTERVAL":
        rule.interval = parseInt(value, 10);
        break;
      case "COUNT":
        rule.count = parseInt(value, 10);
        break;
      case "UNTIL": {
        // UNTIL=20260315 or UNTIL=20260315T120000Z
        const dateStr = value.replace(/[TZ]/g, "").slice(0, 8);
        rule.until = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        break;
      }
      case "BYDAY":
        rule.byDay = value.split(",").map((d) => {
          // Strip numeric prefix if present (e.g., "1MO" → "MO")
          return d.replace(/^-?\d+/, "") as RecurrenceDay;
        });
        break;
      case "BYMONTHDAY":
        rule.byMonthDay = value.split(",").map(Number);
        break;
      case "BYSETPOS":
        rule.bySetPos = parseInt(value, 10);
        break;
    }
  }

  return rule;
}

/**
 * Serialize a RecurrenceRule to an RFC 5545 RRULE string.
 * @example toRRuleString({freq: "weekly", byDay: ["MO", "WE", "FR"]})
 * // → "FREQ=WEEKLY;BYDAY=MO,WE,FR"
 */
export function toRRuleString(rule: RecurrenceRule): string {
  const parts: string[] = [];

  parts.push(`FREQ=${FREQ_REVERSE[rule.freq]}`);

  if (rule.interval && rule.interval > 1) {
    parts.push(`INTERVAL=${rule.interval}`);
  }
  if (rule.count) {
    parts.push(`COUNT=${rule.count}`);
  }
  if (rule.until) {
    parts.push(`UNTIL=${rule.until.replace(/-/g, "")}`);
  }
  if (rule.byDay && rule.byDay.length > 0) {
    parts.push(`BYDAY=${rule.byDay.join(",")}`);
  }
  if (rule.byMonthDay && rule.byMonthDay.length > 0) {
    parts.push(`BYMONTHDAY=${rule.byMonthDay.join(",")}`);
  }
  if (rule.bySetPos !== undefined) {
    parts.push(`BYSETPOS=${rule.bySetPos}`);
  }

  return parts.join(";");
}
