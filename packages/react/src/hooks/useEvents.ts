import { useMemo } from "react";
import { useCalendarContext } from "../context/CalendarContext";
import {
  getEventsForDay,
  partitionEvents,
  getEventSegments,
  groupEventsByDate,
  type CalendarEvent,
  type DateString,
  type EventSegment,
} from "trud-calendar-core";

export interface UseEventsReturn {
  /** All events visible in the current range */
  visibleEvents: CalendarEvent[];
  /** Get events for a specific day */
  getForDay: (date: DateString) => CalendarEvent[];
  /** All-day and timed events separated */
  partitioned: { allDay: CalendarEvent[]; timed: CalendarEvent[] };
  /** Multi-day event segments for month view */
  segments: EventSegment[];
  /** Events grouped by date for agenda view */
  groupedByDate: Map<DateString, CalendarEvent[]>;
}

export function useEvents(): UseEventsReturn {
  const { visibleEvents, visibleRange } = useCalendarContext();

  const partitioned = useMemo(
    () => partitionEvents(visibleEvents),
    [visibleEvents],
  );

  const segments = useMemo(
    () => getEventSegments(visibleEvents, visibleRange.start, visibleRange.end),
    [visibleEvents, visibleRange.start, visibleRange.end],
  );

  const groupedByDate = useMemo(
    () => groupEventsByDate(visibleEvents, visibleRange.start, visibleRange.end),
    [visibleEvents, visibleRange.start, visibleRange.end],
  );

  const getForDay = (date: DateString) =>
    getEventsForDay(visibleEvents, date);

  return {
    visibleEvents,
    getForDay,
    partitioned,
    segments,
    groupedByDate,
  };
}
