import { useMemo } from "react";
import { useCalendarContext } from "../context/CalendarContext";
import {
  computeTimePositions,
  type CalendarEvent,
  type PositionedEvent,
} from "trud-calendar-core";

export function useEventLayout(events: CalendarEvent[]): PositionedEvent[] {
  const { dayStartHour, dayEndHour, displayTimeZone } = useCalendarContext();

  return useMemo(
    () =>
      computeTimePositions(events, dayStartHour, dayEndHour, displayTimeZone),
    [events, dayStartHour, dayEndHour, displayTimeZone],
  );
}
