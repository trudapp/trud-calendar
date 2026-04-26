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
import { anchorWallToEventZone } from "../lib/anchorTimes";

/** Which edge of the event is being resized */
export type ResizeEdge = "start" | "end";

export interface ResizeState {
  eventId: string;
  day: DateString;
  /** Which edge is being resized */
  edge: ResizeEdge;
  /** Override top position as percentage of the day column (only for start-edge resize) */
  topOverride?: number;
  /** Override height as percentage of the day column */
  heightOverride: number;
}

export interface UseEventResizeOptions {
  dayStartHour: number;
  dayEndHour: number;
  /** Snap increment in minutes (default 15) */
  snapDuration?: number;
  enabled?: boolean;
  onEventResize?: (event: CalendarEvent, newStart: DateTimeString, newEnd: DateTimeString) => void;
  /** Constraint callback — return false to prevent the resize */
  resizeConstraint?: (event: CalendarEvent, newStart: DateTimeString, newEnd: DateTimeString) => boolean;
  /**
   * IANA zone in which the column position is interpreted. For events with
   * `event.timeZone`, the new edge is converted from this display zone back
   * to the event's anchored zone before `onEventResize` is called.
   */
  displayTimeZone?: string;
}

export interface UseEventResizeReturn {
  resizeState: ResizeState | null;
  /** Did a resize just finish? Used to suppress click. */
  didResize: React.MutableRefObject<boolean>;
  /** Start resizing from a handle pointerdown (bottom edge — changes end time) */
  onResizeHandlePointerDown: (
    e: React.PointerEvent,
    event: CalendarEvent,
    day: DateString,
    columnEl: HTMLDivElement,
  ) => void;
  /** Start resizing from the top handle pointerdown (top edge — changes start time) */
  onResizeStartHandlePointerDown: (
    e: React.PointerEvent,
    event: CalendarEvent,
    day: DateString,
    columnEl: HTMLDivElement,
  ) => void;
}

export function useEventResize({
  dayStartHour,
  dayEndHour,
  snapDuration = 15,
  enabled = false,
  onEventResize,
  resizeConstraint,
  displayTimeZone,
}: UseEventResizeOptions): UseEventResizeReturn {
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const didResize = useRef(false);

  const activeRef = useRef<{
    event: CalendarEvent;
    day: DateString;
    columnEl: HTMLDivElement;
    edge: ResizeEdge;
  } | null>(null);

  const minDurationHours = snapDuration / 60;

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const active = activeRef.current;
      if (!active) return;

      const rect = active.columnEl.getBoundingClientRect();
      const totalHours = dayEndHour - dayStartHour;

      let fractionalHour = yPositionToFractionalHour(e.clientY, rect, dayStartHour, dayEndHour);
      fractionalHour = snapToIncrement(fractionalHour, snapDuration);

      if (active.edge === "end") {
        const eventStart = getTimeOfDay(active.event.start);
        const minEnd = eventStart + minDurationHours;
        fractionalHour = Math.max(minEnd, Math.min(dayEndHour, fractionalHour));

        const newHeight = ((fractionalHour - eventStart) / totalHours) * 100;

        setResizeState({
          eventId: active.event.id,
          day: active.day,
          edge: "end",
          heightOverride: newHeight,
        });
      } else {
        // start edge
        const eventEnd = getTimeOfDay(active.event.end);
        const maxStart = eventEnd - minDurationHours;
        fractionalHour = Math.max(dayStartHour, Math.min(maxStart, fractionalHour));

        const newTop = ((fractionalHour - dayStartHour) / totalHours) * 100;
        const newHeight = ((eventEnd - fractionalHour) / totalHours) * 100;

        setResizeState({
          eventId: active.event.id,
          day: active.day,
          edge: "start",
          topOverride: newTop,
          heightOverride: newHeight,
        });
      }
    },
    [dayStartHour, dayEndHour, snapDuration, minDurationHours],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      const active = activeRef.current;
      if (!active) return;

      const rect = active.columnEl.getBoundingClientRect();

      let fractionalHour = yPositionToFractionalHour(e.clientY, rect, dayStartHour, dayEndHour);
      fractionalHour = snapToIncrement(fractionalHour, snapDuration);

      if (active.edge === "end") {
        const eventStart = getTimeOfDay(active.event.start);
        const minEnd = eventStart + minDurationHours;
        fractionalHour = Math.max(minEnd, Math.min(dayEndHour, fractionalHour));

        const displayNewEnd = fractionalHourToDateTime(active.day, fractionalHour);
        // Convert only the changed edge; event.start is unchanged.
        const newEnd = displayTimeZone
          ? anchorWallToEventZone(displayNewEnd, active.event.timeZone, displayTimeZone)
          : displayNewEnd;
        if (!resizeConstraint || resizeConstraint(active.event, active.event.start, newEnd)) {
          onEventResize?.(active.event, active.event.start, newEnd);
        }
      } else {
        // start edge
        const eventEnd = getTimeOfDay(active.event.end);
        const maxStart = eventEnd - minDurationHours;
        fractionalHour = Math.max(dayStartHour, Math.min(maxStart, fractionalHour));

        const displayNewStart = fractionalHourToDateTime(active.day, fractionalHour);
        const newStart = displayTimeZone
          ? anchorWallToEventZone(displayNewStart, active.event.timeZone, displayTimeZone)
          : displayNewStart;
        if (!resizeConstraint || resizeConstraint(active.event, newStart, active.event.end)) {
          onEventResize?.(active.event, newStart, active.event.end);
        }
      }

      // Clean up
      activeRef.current = null;
      setResizeState(null);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";

      didResize.current = true;
      requestAnimationFrame(() => {
        didResize.current = false;
      });

      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    },
    [dayStartHour, dayEndHour, snapDuration, minDurationHours, onEventResize, resizeConstraint, handlePointerMove],
  );

  const startResize = useCallback(
    (
      e: React.PointerEvent,
      event: CalendarEvent,
      day: DateString,
      columnEl: HTMLDivElement,
      edge: ResizeEdge,
    ) => {
      if (!enabled || !onEventResize) return;

      e.preventDefault();
      e.stopPropagation();

      activeRef.current = { event, day, columnEl, edge };

      document.body.style.userSelect = "none";
      document.body.style.cursor = edge === "end" ? "s-resize" : "n-resize";

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    },
    [enabled, onEventResize, handlePointerMove, handlePointerUp],
  );

  const onResizeHandlePointerDown = useCallback(
    (
      e: React.PointerEvent,
      event: CalendarEvent,
      day: DateString,
      columnEl: HTMLDivElement,
    ) => startResize(e, event, day, columnEl, "end"),
    [startResize],
  );

  const onResizeStartHandlePointerDown = useCallback(
    (
      e: React.PointerEvent,
      event: CalendarEvent,
      day: DateString,
      columnEl: HTMLDivElement,
    ) => startResize(e, event, day, columnEl, "start"),
    [startResize],
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
    onResizeStartHandlePointerDown,
  };
}
