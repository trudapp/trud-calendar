import type { CalendarEvent, DateString } from "../types";
import { getTimeOfDay } from "./date";
import { buildOverlapGroups, assignColumns } from "./events";

// ── Types ───────────────────────────────────────────────────────

/**
 * An event positioned for rendering inside a resource row of the
 * horizontal timeline view.
 *
 * Coordinates are expressed as percentages of the visible time range
 * (`dayEndHour - dayStartHour`) so consumers can apply them with any
 * unit (px, rem, container queries, …).
 *
 * Within a single resource row, events that overlap in time are stacked
 * into multiple sub-rows; `row` and `totalRows` describe that stacking
 * so consumers can size each sub-row to `100% / totalRows`.
 */
export interface TimelinePositionedEvent {
  event: CalendarEvent;
  /** Resource row this event belongs to. */
  resourceId: string;
  /** Left position as percentage of the visible time range (0–100). */
  leftPct: number;
  /** Width as percentage of the visible time range. Always ≥ 0.5 to keep tiny events tappable. */
  widthPct: number;
  /** Sub-row index within the resource row when events overlap (0-based). */
  row: number;
  /** Total sub-row count for the overlap group this event belongs to. */
  totalRows: number;
  /** True when the event starts on the visible day (not clipped at the left edge). */
  isSegmentStart: boolean;
  /** True when the event ends on the visible day (not clipped at the right edge). */
  isSegmentEnd: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────

const datePart = (s: string): DateString => s.slice(0, 10);

/**
 * Returns the fractional-hour [start, end] window for the portion of
 * `event` that falls within the visible day, or null if the event does
 * not intersect the day at all.
 *
 * - For events that started on a previous day, start = 0 (clipped left).
 * - For events that end on a later day, end = 24 (clipped right).
 */
function intersectDay(event: CalendarEvent, day: DateString): { start: number; end: number; isStart: boolean; isEnd: boolean } | null {
  const evStartDay = datePart(event.start);
  const evEndDay = datePart(event.end);
  if (day < evStartDay || day > evEndDay) return null;

  const startsToday = evStartDay === day;
  const endsToday = evEndDay === day;
  const start = startsToday ? getTimeOfDay(event.start) : 0;
  const end = endsToday ? getTimeOfDay(event.end) : 24;

  // Zero-length tail of a midnight-ending event: treat as "ends today" but with 0 width.
  if (end <= start) return null;

  return { start, end, isStart: startsToday, isEnd: endsToday };
}

// ── Public API ──────────────────────────────────────────────────

/**
 * Compute horizontal-timeline positions for events grouped by resource.
 *
 * Filters events to those whose `resourceId` matches one of `resourceIds`,
 * intersects each event with the visible day, then runs the same
 * column-packing algorithm used by the time-grid views — except the
 * "columns" become stacked sub-rows inside each resource row.
 *
 * Events without a `resourceId`, or whose `resourceId` is not in
 * `resourceIds`, are excluded. All-day events and `display: "background"`
 * events are also excluded — those are typically rendered separately by
 * the consumer.
 *
 * @returns A map keyed by `resourceId`. Resources with no events get an
 *   empty array so consumers can iterate `resourceIds` without missing
 *   keys.
 */
export function computeTimelinePositions(
  events: CalendarEvent[],
  resourceIds: string[],
  day: DateString,
  dayStartHour: number = 0,
  dayEndHour: number = 24,
): Map<string, TimelinePositionedEvent[]> {
  const totalHours = Math.max(0.0001, dayEndHour - dayStartHour);
  const result = new Map<string, TimelinePositionedEvent[]>();
  for (const id of resourceIds) result.set(id, []);

  // Bucket events by resource (skip ones we don't care about up front).
  const byResource = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    if (event.allDay) continue;
    if (event.display === "background") continue;
    const rid = event.resourceId;
    if (!rid || !result.has(rid)) continue;
    let bucket = byResource.get(rid);
    if (!bucket) {
      bucket = [];
      byResource.set(rid, bucket);
    }
    bucket.push(event);
  }

  for (const [resourceId, bucketEvents] of byResource) {
    // Pre-clip events to the visible window so the overlap algorithm
    // works on intersecting segments only. Track the original event
    // alongside the synthetic clipped range used for column packing.
    type Clipped = {
      original: CalendarEvent;
      clippedStart: number;
      clippedEnd: number;
      isSegmentStart: boolean;
      isSegmentEnd: boolean;
    };
    const clipped: Clipped[] = [];
    for (const event of bucketEvents) {
      const window = intersectDay(event, day);
      if (!window) continue;
      const start = Math.max(window.start, dayStartHour);
      const end = Math.min(window.end, dayEndHour);
      if (end <= start) continue;
      clipped.push({
        original: event,
        clippedStart: start,
        clippedEnd: end,
        isSegmentStart: window.isStart && window.start >= dayStartHour,
        isSegmentEnd: window.isEnd && window.end <= dayEndHour,
      });
    }

    if (clipped.length === 0) continue;

    // Build synthetic events the existing column-packer can consume.
    // The synthetic start/end use the visible day so string comparison
    // produces the correct order.
    const fakeIso = (h: number): string => {
      const hours = Math.floor(h);
      const minutes = Math.floor((h - hours) * 60);
      const seconds = Math.floor(((h - hours) * 60 - minutes) * 60);
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      return `${day}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    };
    const synthetic: CalendarEvent[] = clipped.map((c, idx) => ({
      ...c.original,
      // Keep the original id but tag the index so two clipped segments
      // of the same parent never collide in a Map lookup.
      id: `${c.original.id}::tl::${idx}`,
      start: fakeIso(c.clippedStart),
      end: fakeIso(c.clippedEnd),
    }));

    const groups = buildOverlapGroups(synthetic);
    const positioned: TimelinePositionedEvent[] = [];
    for (const group of groups) {
      const cols = assignColumns(group);
      for (const { event, column, totalColumns } of cols) {
        // Recover the original event + clip metadata via the index suffix.
        const idx = parseInt(event.id.split("::tl::")[1] ?? "0", 10);
        const meta = clipped[idx];
        const start = meta.clippedStart;
        const end = meta.clippedEnd;
        const leftPct = ((start - dayStartHour) / totalHours) * 100;
        const widthPct = Math.max(((end - start) / totalHours) * 100, 0.5);
        positioned.push({
          event: meta.original,
          resourceId,
          leftPct,
          widthPct,
          row: column,
          totalRows: totalColumns,
          isSegmentStart: meta.isSegmentStart,
          isSegmentEnd: meta.isSegmentEnd,
        });
      }
    }
    result.set(resourceId, positioned);
  }

  return result;
}
