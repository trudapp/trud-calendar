import type {
  CalendarEvent,
  DateString,
  EventSegment,
  PositionedEvent,
  TimedEventSegment,
} from "../types";
import {
  parseDate,
  eachDayOfRange,
  isSameDay,
  getTimeOfDay,
  rangesOverlap,
} from "./date";

// ── Sorting ──────────────────────────────────────────────────────

/** Sort events by start time, then by duration (longest first) */
export function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const startCmp = a.start.localeCompare(b.start);
    if (startCmp !== 0) return startCmp;
    // Longer events first (so they visually span properly)
    const durA = parseDate(a.end).getTime() - parseDate(a.start).getTime();
    const durB = parseDate(b.end).getTime() - parseDate(b.start).getTime();
    return durB - durA;
  });
}

// ── Filtering ────────────────────────────────────────────────────

/** Filter events that fall within a date range */
export function filterEventsInRange(
  events: CalendarEvent[],
  rangeStart: DateString,
  rangeEnd: DateString,
): CalendarEvent[] {
  const start = rangeStart + "T00:00:00";
  const end = rangeEnd + "T23:59:59";
  return events.filter((e) => rangesOverlap(e.start, e.end, start, end));
}

/** Get events for a specific day */
export function getEventsForDay(
  events: CalendarEvent[],
  date: DateString,
): CalendarEvent[] {
  return filterEventsInRange(events, date, date);
}

/** Check if an event spans multiple days */
export function isMultiDayEvent(event: CalendarEvent): boolean {
  return !isSameDay(event.start, event.end) || !!event.allDay;
}

/** Separate events into all-day and timed categories */
export function partitionEvents(
  events: CalendarEvent[],
): { allDay: CalendarEvent[]; timed: CalendarEvent[] } {
  const allDay: CalendarEvent[] = [];
  const timed: CalendarEvent[] = [];
  for (const event of events) {
    if (event.allDay || isMultiDayEvent(event)) {
      allDay.push(event);
    } else {
      timed.push(event);
    }
  }
  return { allDay, timed };
}

// ── Multi-day segmentation ───────────────────────────────────────

/** Break a multi-day event into per-day segments */
export function segmentMultiDayEvent(
  event: CalendarEvent,
  rangeStart: DateString,
  rangeEnd: DateString,
): EventSegment[] {
  const eventStartDate = event.start.slice(0, 10) as DateString;
  const eventEndDate = event.end.slice(0, 10) as DateString;

  // Clip to visible range
  const segStart = eventStartDate > rangeStart ? eventStartDate : rangeStart;
  const segEnd = eventEndDate < rangeEnd ? eventEndDate : rangeEnd;

  return eachDayOfRange(segStart, segEnd).map((date) => ({
    event,
    date,
    isStart: date === eventStartDate,
    isEnd: date === eventEndDate,
  }));
}

/** Get all event segments for a month view */
export function getEventSegments(
  events: CalendarEvent[],
  rangeStart: DateString,
  rangeEnd: DateString,
): EventSegment[] {
  const allDayEvents = events.filter((e) => e.allDay || isMultiDayEvent(e));
  const segments: EventSegment[] = [];
  for (const event of allDayEvents) {
    segments.push(...segmentMultiDayEvent(event, rangeStart, rangeEnd));
  }
  return segments;
}

// ── Timed multi-day segmentation ─────────────────────────────────

/**
 * Segment a timed multi-day event into per-day segments for week/day view.
 * Each segment has startHour/endHour appropriate for that day:
 * - First day: event start time → dayEndHour
 * - Middle days: dayStartHour → dayEndHour
 * - Last day: dayStartHour → event end time
 */
export function segmentTimedMultiDayEvent(
  event: CalendarEvent,
  days: DateString[],
  dayStartHour: number,
  dayEndHour: number,
): TimedEventSegment[] {
  const eventStartDate = event.start.slice(0, 10) as DateString;
  const eventEndDate = event.end.slice(0, 10) as DateString;
  const eventStartHour = getTimeOfDay(event.start);
  const eventEndHour = getTimeOfDay(event.end);

  const segments: TimedEventSegment[] = [];

  for (const day of days) {
    if (day < eventStartDate || day > eventEndDate) continue;

    const isStart = day === eventStartDate;
    const isEnd = day === eventEndDate;

    let startHour: number;
    let endHour: number;

    if (isStart && isEnd) {
      // Single day — shouldn't normally reach here for multi-day events
      startHour = eventStartHour;
      endHour = eventEndHour;
    } else if (isStart) {
      startHour = eventStartHour;
      endHour = dayEndHour;
    } else if (isEnd) {
      startHour = dayStartHour;
      endHour = eventEndHour;
    } else {
      // Middle day — full day
      startHour = dayStartHour;
      endHour = dayEndHour;
    }

    segments.push({ event, day, startHour, endHour, isStart, isEnd });
  }

  return segments;
}

// ── Layout Algorithm: Column-Packing ─────────────────────────────

interface OverlapGroup {
  events: CalendarEvent[];
}

/** Build overlap groups using a sweep-line approach */
export function buildOverlapGroups(events: CalendarEvent[]): OverlapGroup[] {
  if (events.length === 0) return [];

  const sorted = sortEvents(events);
  const groups: OverlapGroup[] = [];
  let currentGroup: CalendarEvent[] = [sorted[0]];
  let groupEnd = sorted[0].end;

  for (let i = 1; i < sorted.length; i++) {
    const event = sorted[i];
    if (event.start < groupEnd) {
      // Overlaps with current group
      currentGroup.push(event);
      if (event.end > groupEnd) {
        groupEnd = event.end;
      }
    } else {
      // Start a new group
      groups.push({ events: currentGroup });
      currentGroup = [event];
      groupEnd = event.end;
    }
  }
  groups.push({ events: currentGroup });

  return groups;
}

/** Assign columns to events within an overlap group (greedy leftmost available) */
export function assignColumns(
  group: OverlapGroup,
): { event: CalendarEvent; column: number; totalColumns: number }[] {
  const sorted = sortEvents(group.events);
  const columns: CalendarEvent[][] = [];

  const result: { event: CalendarEvent; column: number }[] = [];

  for (const event of sorted) {
    let placed = false;
    for (let col = 0; col < columns.length; col++) {
      const lastInCol = columns[col][columns[col].length - 1];
      if (lastInCol.end <= event.start) {
        columns[col].push(event);
        result.push({ event, column: col });
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([event]);
      result.push({ event, column: columns.length - 1 });
    }
  }

  const totalColumns = columns.length;
  return result.map((r) => ({ ...r, totalColumns }));
}

/** Compute positioned events for a single day in a time grid */
export function computeTimePositions(
  events: CalendarEvent[],
  dayStartHour: number = 0,
  dayEndHour: number = 24,
): PositionedEvent[] {
  const totalHours = dayEndHour - dayStartHour;
  const groups = buildOverlapGroups(events);
  const positioned: PositionedEvent[] = [];

  for (const group of groups) {
    const columns = assignColumns(group);
    for (const { event, column, totalColumns } of columns) {
      const startTime = Math.max(getTimeOfDay(event.start), dayStartHour);
      const endTime = Math.min(getTimeOfDay(event.end), dayEndHour);
      const top = ((startTime - dayStartHour) / totalHours) * 100;
      const height = Math.max(((endTime - startTime) / totalHours) * 100, 1); // min 1% height

      positioned.push({
        event,
        column,
        totalColumns,
        top,
        height,
      });
    }
  }

  return positioned;
}

/** Group events by date for agenda view */
export function groupEventsByDate(
  events: CalendarEvent[],
  rangeStart: DateString,
  rangeEnd: DateString,
): Map<DateString, CalendarEvent[]> {
  const filtered = filterEventsInRange(events, rangeStart, rangeEnd);
  const sorted = sortEvents(filtered);
  const groups = new Map<DateString, CalendarEvent[]>();

  for (const event of sorted) {
    const date = event.start.slice(0, 10) as DateString;
    const existing = groups.get(date);
    if (existing) {
      existing.push(event);
    } else {
      groups.set(date, [event]);
    }
  }

  return groups;
}
