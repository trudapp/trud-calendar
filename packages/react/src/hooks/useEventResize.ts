import { useState, useCallback, useRef, useEffect } from "react";
import {
  snapToIncrement,
  yPositionToFractionalHour,
  fractionalHourToDateTime,
  type CalendarEvent,
  type DateString,
  type DateTimeString,
  getTimeOfDay,
} from "trud-calendar-core";

export interface ResizeState {
  eventId: string;
  day: DateString;
  /** Override height as percentage of the day column */
  heightOverride: number;
}

export interface UseEventResizeOptions {
  dayStartHour: number;
  dayEndHour: number;
  enabled?: boolean;
  onEventResize?: (event: CalendarEvent, newStart: DateTimeString, newEnd: DateTimeString) => void;
}

export interface UseEventResizeReturn {
  resizeState: ResizeState | null;
  /** Did a resize just finish? Used to suppress click. */
  didResize: React.MutableRefObject<boolean>;
  /** Start resizing from a handle pointerdown */
  onResizeHandlePointerDown: (
    e: React.PointerEvent,
    event: CalendarEvent,
    day: DateString,
    columnEl: HTMLDivElement,
  ) => void;
}

export function useEventResize({
  dayStartHour,
  dayEndHour,
  enabled = false,
  onEventResize,
}: UseEventResizeOptions): UseEventResizeReturn {
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const didResize = useRef(false);

  // Store mutable refs for the active resize
  const activeRef = useRef<{
    event: CalendarEvent;
    day: DateString;
    columnEl: HTMLDivElement;
    startTop: number; // top% of event (constant during resize)
  } | null>(null);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const active = activeRef.current;
      if (!active) return;

      const rect = active.columnEl.getBoundingClientRect();
      const totalHours = dayEndHour - dayStartHour;

      // Get the fractional hour at cursor Y
      let fractionalHour = yPositionToFractionalHour(e.clientY, rect, dayStartHour, dayEndHour);
      fractionalHour = snapToIncrement(fractionalHour, 15);

      // Clamp: min is event start + 15 min, max is dayEnd
      const eventStart = getTimeOfDay(active.event.start);
      const minEnd = eventStart + 0.25; // 15 min minimum
      fractionalHour = Math.max(minEnd, Math.min(dayEndHour, fractionalHour));

      // Compute new height as percentage
      const newHeight = ((fractionalHour - eventStart) / totalHours) * 100;

      setResizeState({
        eventId: active.event.id,
        day: active.day,
        heightOverride: newHeight,
      });
    },
    [dayStartHour, dayEndHour],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      const active = activeRef.current;
      if (!active) return;

      const rect = active.columnEl.getBoundingClientRect();

      // Final position
      let fractionalHour = yPositionToFractionalHour(e.clientY, rect, dayStartHour, dayEndHour);
      fractionalHour = snapToIncrement(fractionalHour, 15);

      const eventStart = getTimeOfDay(active.event.start);
      const minEnd = eventStart + 0.25;
      fractionalHour = Math.max(minEnd, Math.min(dayEndHour, fractionalHour));

      const newEnd = fractionalHourToDateTime(active.day, fractionalHour);

      // Fire callback
      onEventResize?.(active.event, active.event.start, newEnd);

      // Clean up
      activeRef.current = null;
      setResizeState(null);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";

      // Set didResize to prevent click, reset after a tick
      didResize.current = true;
      requestAnimationFrame(() => {
        didResize.current = false;
      });

      // Remove listeners
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    },
    [dayStartHour, dayEndHour, onEventResize, handlePointerMove],
  );

  const onResizeHandlePointerDown = useCallback(
    (
      e: React.PointerEvent,
      event: CalendarEvent,
      day: DateString,
      columnEl: HTMLDivElement,
    ) => {
      if (!enabled || !onEventResize) return;

      e.preventDefault();
      e.stopPropagation();

      const totalHours = dayEndHour - dayStartHour;
      const eventStart = getTimeOfDay(event.start);
      const startTop = ((eventStart - dayStartHour) / totalHours) * 100;

      activeRef.current = { event, day, columnEl, startTop };

      // Prevent text selection during resize
      document.body.style.userSelect = "none";
      document.body.style.cursor = "s-resize";

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    },
    [enabled, onEventResize, dayStartHour, dayEndHour, handlePointerMove, handlePointerUp],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [handlePointerMove, handlePointerUp]);

  return {
    resizeState,
    didResize,
    onResizeHandlePointerDown,
  };
}
