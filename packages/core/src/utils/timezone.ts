import type { DateTimeString } from "../types";

// ── Internal helpers ────────────────────────────────────────────

interface WallParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const WALL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/;
const UTC_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?Z$/;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function parseWall(wall: DateTimeString): WallParts {
  const m = WALL_RE.exec(wall);
  if (!m) throw new RangeError(`Invalid wall-clock DateTimeString: ${wall}`);
  return {
    year: +m[1],
    month: +m[2],
    day: +m[3],
    hour: +m[4],
    minute: +m[5],
    second: +m[6],
  };
}

function formatWall(p: WallParts): DateTimeString {
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}T${pad2(p.hour)}:${pad2(p.minute)}:${pad2(p.second)}`;
}

function parseUtcMs(utc: DateTimeString): number {
  // Accepts both "...Z" and bare wall-clock (treated as UTC for compute purposes)
  if (UTC_RE.test(utc)) return Date.parse(utc);
  if (WALL_RE.test(utc)) return Date.parse(`${utc}Z`);
  throw new RangeError(`Invalid datetime string: ${utc}`);
}

function utcMsToIso(ms: number): DateTimeString {
  // toISOString() always returns "...Z" with milliseconds; strip ms for consistency
  return new Date(ms).toISOString().replace(/\.\d+Z$/, "Z");
}

// ── DTF cache (perf) ────────────────────────────────────────────

const dtfCache = new Map<string, Intl.DateTimeFormat>();

function dtfFor(timeZone: string): Intl.DateTimeFormat {
  let dtf = dtfCache.get(timeZone);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      hourCycle: "h23",
    });
    dtfCache.set(timeZone, dtf);
  }
  return dtf;
}

function partsAt(timeZone: string, utcMs: number): WallParts {
  const parts = dtfFor(timeZone).formatToParts(new Date(utcMs));
  const result: Partial<WallParts> = {};
  for (const part of parts) {
    switch (part.type) {
      case "year":
        result.year = +part.value;
        break;
      case "month":
        result.month = +part.value;
        break;
      case "day":
        result.day = +part.value;
        break;
      case "hour":
        // h23 cycle returns "00"-"23". Some engines return "24" for midnight; coerce.
        result.hour = +part.value % 24;
        break;
      case "minute":
        result.minute = +part.value;
        break;
      case "second":
        result.second = +part.value;
        break;
    }
  }
  return result as WallParts;
}

// ── Validation ──────────────────────────────────────────────────

const validTzCache = new Map<string, boolean>();

/**
 * Returns true if the given string is a valid IANA timezone identifier
 * (e.g., "America/New_York", "Europe/Berlin", "UTC").
 */
export function isValidTimeZone(timeZone: string): boolean {
  if (typeof timeZone !== "string" || timeZone.length === 0) return false;
  const cached = validTzCache.get(timeZone);
  if (cached !== undefined) return cached;
  let ok: boolean;
  try {
    Intl.DateTimeFormat("en-US", { timeZone });
    ok = true;
  } catch {
    ok = false;
  }
  validTzCache.set(timeZone, ok);
  return ok;
}

// Fallback list for engines without Intl.supportedValuesOf (pre-2023 browsers).
// Covers the major IANA zones used in practice (~80 entries).
const FALLBACK_TIMEZONES: readonly string[] = Object.freeze([
  "UTC",
  "Africa/Cairo", "Africa/Johannesburg", "Africa/Lagos", "Africa/Nairobi",
  "America/Anchorage", "America/Argentina/Buenos_Aires", "America/Bogota",
  "America/Caracas", "America/Chicago", "America/Denver", "America/Halifax",
  "America/Lima", "America/Los_Angeles", "America/Mexico_City",
  "America/Montevideo", "America/New_York", "America/Phoenix",
  "America/Santiago", "America/Sao_Paulo", "America/St_Johns", "America/Toronto",
  "America/Vancouver",
  "Asia/Bangkok", "Asia/Dubai", "Asia/Hong_Kong", "Asia/Jakarta",
  "Asia/Jerusalem", "Asia/Karachi", "Asia/Kathmandu", "Asia/Kolkata",
  "Asia/Kuala_Lumpur", "Asia/Manila", "Asia/Riyadh", "Asia/Seoul",
  "Asia/Shanghai", "Asia/Singapore", "Asia/Taipei", "Asia/Tehran",
  "Asia/Tokyo",
  "Atlantic/Azores", "Atlantic/Cape_Verde", "Atlantic/Reykjavik",
  "Australia/Adelaide", "Australia/Brisbane", "Australia/Darwin",
  "Australia/Melbourne", "Australia/Perth", "Australia/Sydney",
  "Europe/Amsterdam", "Europe/Athens", "Europe/Berlin", "Europe/Brussels",
  "Europe/Bucharest", "Europe/Budapest", "Europe/Copenhagen", "Europe/Dublin",
  "Europe/Helsinki", "Europe/Istanbul", "Europe/Lisbon", "Europe/London",
  "Europe/Madrid", "Europe/Moscow", "Europe/Oslo", "Europe/Paris",
  "Europe/Prague", "Europe/Rome", "Europe/Stockholm", "Europe/Vienna",
  "Europe/Warsaw", "Europe/Zurich",
  "Pacific/Auckland", "Pacific/Fiji", "Pacific/Guam", "Pacific/Honolulu",
  "Pacific/Midway", "Pacific/Pago_Pago", "Pacific/Tongatapu",
]);

/**
 * Returns the list of supported IANA timezone identifiers.
 * Uses `Intl.supportedValuesOf` when available (Node 18+, browsers since 2023).
 * Falls back to a curated list of ~80 common zones on older runtimes.
 */
export function listTimeZones(): string[] {
  const fn = (Intl as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
  if (typeof fn === "function") {
    try {
      const values = fn("timeZone");
      // Intl.supportedValuesOf("timeZone") intentionally excludes "UTC" because
      // it is treated as a canonical alias rather than a regional zone. Always
      // include it so consumers can offer it as a picker option.
      return values.includes("UTC") ? values.slice() : ["UTC", ...values];
    } catch {
      /* fallthrough */
    }
  }
  return FALLBACK_TIMEZONES.slice();
}

// ── Offset ──────────────────────────────────────────────────────

/**
 * Returns the offset (in minutes) of the given timezone at the given UTC instant.
 * Positive values mean east of UTC; negative means west.
 *
 * Examples:
 *   getTimeZoneOffset("2026-01-15T12:00:00Z", "America/New_York") // -300 (EST)
 *   getTimeZoneOffset("2026-07-15T12:00:00Z", "America/New_York") //  -240 (EDT)
 *   getTimeZoneOffset("2026-01-15T12:00:00Z", "Asia/Kolkata")     //  330
 *   getTimeZoneOffset("2026-01-15T12:00:00Z", "Asia/Kathmandu")   //  345
 */
export function getTimeZoneOffset(utcInstant: DateTimeString, timeZone: string): number {
  const utcMs = parseUtcMs(utcInstant);
  const wall = partsAt(timeZone, utcMs);
  const wallAsUtcMs = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second);
  return Math.round((wallAsUtcMs - utcMs) / 60000);
}

// ── Wall ⇄ UTC conversions ──────────────────────────────────────

export interface WallToUtcOptions {
  /**
   * How to resolve ambiguous wall times during DST overlap (a wall time that
   * occurs twice — e.g. 2026-11-01T01:30:00 in America/New_York).
   * Default: "earlier" (the first occurrence, before the clock falls back).
   */
  ambiguous?: "earlier" | "later";
  /**
   * How to resolve invalid wall times during DST gap (a wall time that does
   * not exist — e.g. 2026-03-08T02:30:00 in America/New_York).
   * "shift" (default): shift forward to the next valid instant (3:30 AM EDT).
   * "throw": throw a RangeError.
   */
  invalid?: "shift" | "throw";
}

/**
 * Convert a wall-clock time in the given timezone to a UTC instant.
 *
 * Handles DST correctly:
 * - During DST gap (wall time doesn't exist), shifts forward by the gap (default)
 *   or throws if `invalid: "throw"`.
 * - During DST overlap (wall time happens twice), returns the earlier instant
 *   by default, or the later instant if `ambiguous: "later"`.
 *
 * @example
 *   wallTimeToUtc("2026-03-13T09:00:00", "America/New_York")
 *   // → "2026-03-13T13:00:00Z"
 */
export function wallTimeToUtc(
  wallTime: DateTimeString,
  timeZone: string,
  options: WallToUtcOptions = {},
): DateTimeString {
  const ambiguous = options.ambiguous ?? "earlier";
  const invalid = options.invalid ?? "shift";

  const w = parseWall(wallTime);
  // Treat the wall components as if they were UTC to get a starting point.
  const guessUtcMs = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);

  // The actual UTC instant is `guessUtcMs - offset(actualInstant)`. We need a
  // fixed point. Use two probes that bracket DST transitions: 12 hours before
  // and 12 hours after the guess. Both candidates may yield the same wall time
  // (overlap), different wall times (one is the gap-shifted side), or one may
  // round-trip exactly (the unambiguous case).
  const offsetBefore = getTimeZoneOffset(utcMsToIso(guessUtcMs - 12 * 3600_000), timeZone);
  const offsetAfter = getTimeZoneOffset(utcMsToIso(guessUtcMs + 12 * 3600_000), timeZone);

  const candidateBefore = guessUtcMs - offsetBefore * 60_000;
  const candidateAfter = guessUtcMs - offsetAfter * 60_000;

  const roundTripBefore = roundTripWall(candidateBefore, timeZone);
  const roundTripAfter = roundTripWall(candidateAfter, timeZone);

  const beforeMatches = wallEquals(roundTripBefore, w);
  const afterMatches = wallEquals(roundTripAfter, w);

  if (beforeMatches && afterMatches) {
    // Same UTC instant from both probes → unambiguous (no DST involved nearby)
    if (candidateBefore === candidateAfter) {
      return utcMsToIso(candidateBefore);
    }
    // DST overlap — wall time exists twice
    return utcMsToIso(ambiguous === "earlier" ? Math.min(candidateBefore, candidateAfter) : Math.max(candidateBefore, candidateAfter));
  }
  if (beforeMatches) return utcMsToIso(candidateBefore);
  if (afterMatches) return utcMsToIso(candidateAfter);

  // Neither matches → DST gap (wall time doesn't exist)
  if (invalid === "throw") {
    throw new RangeError(`Wall time ${wallTime} does not exist in ${timeZone} (DST gap)`);
  }
  // Shift forward to the first valid instant after the gap. The candidate
  // computed with the pre-gap offset (which is `candidateBefore` for the
  // common spring-forward jump) renders past the gap, so we want the larger
  // UTC value of the two candidates.
  return utcMsToIso(Math.max(candidateBefore, candidateAfter));
}

function roundTripWall(utcMs: number, timeZone: string): WallParts {
  return partsAt(timeZone, utcMs);
}

function wallEquals(a: WallParts, b: WallParts): boolean {
  return (
    a.year === b.year &&
    a.month === b.month &&
    a.day === b.day &&
    a.hour === b.hour &&
    a.minute === b.minute &&
    a.second === b.second
  );
}

/**
 * Convert a UTC instant to a wall-clock time in the given timezone.
 *
 * Always deterministic — every UTC instant has exactly one wall time per zone.
 *
 * @example
 *   utcToWallTime("2026-03-13T13:00:00Z", "America/New_York")
 *   // → "2026-03-13T09:00:00"
 */
export function utcToWallTime(utcInstant: DateTimeString, timeZone: string): DateTimeString {
  return formatWall(partsAt(timeZone, parseUtcMs(utcInstant)));
}

/**
 * Convert a wall-clock time from one timezone to another, preserving the
 * absolute instant in time.
 *
 * @example
 *   convertWallTime("2026-03-13T09:00:00", "America/New_York", "Europe/Berlin")
 *   // → "2026-03-13T14:00:00"
 */
export function convertWallTime(
  wallTime: DateTimeString,
  fromTimeZone: string,
  toTimeZone: string,
  options?: WallToUtcOptions,
): DateTimeString {
  if (fromTimeZone === toTimeZone) return wallTime;
  const utc = wallTimeToUtc(wallTime, fromTimeZone, options);
  return utcToWallTime(utc, toTimeZone);
}

// ── Abbreviation ────────────────────────────────────────────────

/**
 * Return the short timezone abbreviation at the given instant (defaults to now).
 *
 * @example
 *   getTimeZoneAbbreviation("America/New_York", "2026-01-15T12:00:00Z") // "EST"
 *   getTimeZoneAbbreviation("America/New_York", "2026-07-15T12:00:00Z") // "EDT"
 *   getTimeZoneAbbreviation("Asia/Kolkata")                              // "GMT+5:30"
 */
export function getTimeZoneAbbreviation(timeZone: string, atInstant?: DateTimeString): string {
  const utcMs = atInstant === undefined ? Date.now() : parseUtcMs(atInstant);
  const dtf = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" });
  const parts = dtf.formatToParts(new Date(utcMs));
  const tzPart = parts.find((p) => p.type === "timeZoneName");
  return tzPart?.value ?? timeZone;
}
