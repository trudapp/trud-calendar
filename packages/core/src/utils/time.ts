import type { DateString, DateTimeString } from "../types";
import { toDateString } from "./date";

/**
 * Snap a fractional hour to the nearest increment.
 * @param fractionalHour e.g. 9.73
 * @param minutes snap increment in minutes (default 15)
 * @returns snapped fractional hour e.g. 9.75
 */
export function snapToIncrement(fractionalHour: number, minutes: number = 15): number {
  const totalMinutes = fractionalHour * 60;
  const snapped = Math.round(totalMinutes / minutes) * minutes;
  return snapped / 60;
}

/**
 * Convert a fractional hour on a given day to a DateTimeString.
 * @param day date string (YYYY-MM-DD)
 * @param fractionalHour e.g. 14.5 → "14:30:00"
 */
export function fractionalHourToDateTime(day: DateString, fractionalHour: number): DateTimeString {
  const totalMinutes = Math.round(fractionalHour * 60);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const hh = String(Math.max(0, Math.min(23, hours))).padStart(2, "0");
  const mm = String(mins).padStart(2, "0");
  return `${day}T${hh}:${mm}:00`;
}

/**
 * Convert a mouse Y position relative to a column element to a fractional hour.
 * @param clientY mouse clientY
 * @param columnRect bounding rect of the day column
 * @param dayStart start hour of the grid (e.g. 0)
 * @param dayEnd end hour of the grid (e.g. 24)
 * @returns fractional hour (e.g. 14.5)
 */
export function yPositionToFractionalHour(
  clientY: number,
  columnRect: DOMRect,
  dayStart: number,
  dayEnd: number,
): number {
  const relativeY = clientY - columnRect.top;
  const totalHeight = columnRect.height;
  const totalHours = dayEnd - dayStart;
  const hoursFromTop = (relativeY / totalHeight) * totalHours;
  return dayStart + hoursFromTop;
}

/**
 * Normalize a range so start <= end (swap if dragged upward).
 */
export function normalizeRange(
  a: number,
  b: number,
): { start: number; end: number } {
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}

/**
 * Compute new start/end DateTimeStrings from a drop/resize based on mouse Y.
 * Extracted from WeekView's drop handler for shared use.
 */
export function computeDropPosition(
  day: DateString,
  clientY: number,
  columnRect: DOMRect,
  dayStartHour: number,
  dayEndHour: number,
  durationMs: number,
  snapMinutes: number = 15,
): { newStart: DateTimeString; newEnd: DateTimeString } {
  const fractionalHour = yPositionToFractionalHour(clientY, columnRect, dayStartHour, dayEndHour);
  const snapped = snapToIncrement(fractionalHour, snapMinutes);
  const clamped = Math.max(dayStartHour, Math.min(dayEndHour - (durationMs / 3600000), snapped));

  const newStart = fractionalHourToDateTime(day, clamped);
  const newStartMs = new Date(newStart).getTime();
  const newEndDate = new Date(newStartMs + durationMs);

  const pad = (n: number) => String(n).padStart(2, "0");
  const endDay = toDateString(newEndDate);
  const newEnd = `${endDay}T${pad(newEndDate.getHours())}:${pad(newEndDate.getMinutes())}:${pad(newEndDate.getSeconds())}`;

  return { newStart, newEnd };
}
