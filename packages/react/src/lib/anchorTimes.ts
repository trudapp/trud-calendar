import { utcToWallTime, wallTimeToUtc, type DateTimeString } from "trud-calendar-core";

/**
 * Translate a wall-clock the user produced by interacting with the grid
 * (which is in the calendar's display zone) into the equivalent wall-clock
 * in the event's anchored zone. Floating events (no `eventTimeZone`) and
 * same-zone events pass through unchanged.
 */
export function anchorWallToEventZone(
  displayWall: DateTimeString,
  eventTimeZone: string | undefined,
  displayTimeZone: string,
): DateTimeString {
  if (!eventTimeZone || eventTimeZone === displayTimeZone) return displayWall;
  return utcToWallTime(wallTimeToUtc(displayWall, displayTimeZone), eventTimeZone);
}

/**
 * Convenience: convert both endpoints of a drag result. Useful when an
 * interaction moves the whole event (drag) rather than a single edge
 * (resize).
 */
export function anchorTimesToEventZone(
  newStartDisplay: DateTimeString,
  newEndDisplay: DateTimeString,
  eventTimeZone: string | undefined,
  displayTimeZone: string,
): { newStart: DateTimeString; newEnd: DateTimeString } {
  return {
    newStart: anchorWallToEventZone(newStartDisplay, eventTimeZone, displayTimeZone),
    newEnd: anchorWallToEventZone(newEndDisplay, eventTimeZone, displayTimeZone),
  };
}
