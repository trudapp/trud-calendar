import { useState, useCallback, useRef, useEffect } from "react";
import {
  snapToIncrement,
  yPositionToFractionalHour,
  fractionalHourToDateTime,
  normalizeRange,
  type DateString,
  type DateTimeString,
} from "trud-calendar-core";

/** Drag threshold in px to distinguish click from drag */
const DRAG_THRESHOLD = 5;

export interface SlotSelection {
  isSelecting: boolean;
  day: DateString;
  /** Start percent from top of column */
  startPercent: number;
  /** End percent from top of column */
  endPercent: number;
  startTime: DateTimeString;
  endTime: DateTimeString;
}

export interface UseSlotSelectionOptions {
  dayStartHour: number;
  dayEndHour: number;
  onSlotClick?: (date: DateTimeString) => void;
  onSlotSelect?: (start: DateTimeString, end: DateTimeString) => void;
}

export interface UseSlotSelectionReturn {
  selection: SlotSelection | null;
  onSlotPointerDown: (
    e: React.PointerEvent,
    day: DateString,
    columnEl: HTMLDivElement,
  ) => void;
}

export function useSlotSelection({
  dayStartHour,
  dayEndHour,
  onSlotClick,
  onSlotSelect,
}: UseSlotSelectionOptions): UseSlotSelectionReturn {
  const [selection, setSelection] = useState<SlotSelection | null>(null);

  const activeRef = useRef<{
    day: DateString;
    columnEl: HTMLDivElement;
    startY: number;
    startFractionalHour: number;
    isDragging: boolean;
  } | null>(null);

  const totalHours = dayEndHour - dayStartHour;

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const active = activeRef.current;
      if (!active) return;

      const deltaY = Math.abs(e.clientY - active.startY);

      // Haven't passed drag threshold yet
      if (!active.isDragging && deltaY < DRAG_THRESHOLD) return;

      // Enter drag mode
      if (!active.isDragging) {
        active.isDragging = true;
        document.body.style.userSelect = "none";
      }

      const rect = active.columnEl.getBoundingClientRect();
      let currentHour = yPositionToFractionalHour(e.clientY, rect, dayStartHour, dayEndHour);
      currentHour = snapToIncrement(currentHour, 15);
      currentHour = Math.max(dayStartHour, Math.min(dayEndHour, currentHour));

      const { start, end } = normalizeRange(active.startFractionalHour, currentHour);
      // Ensure minimum 15 min selection
      const finalEnd = Math.max(start + 0.25, end);

      const startPercent = ((start - dayStartHour) / totalHours) * 100;
      const endPercent = ((finalEnd - dayStartHour) / totalHours) * 100;

      setSelection({
        isSelecting: true,
        day: active.day,
        startPercent,
        endPercent,
        startTime: fractionalHourToDateTime(active.day, start),
        endTime: fractionalHourToDateTime(active.day, finalEnd),
      });
    },
    [dayStartHour, dayEndHour, totalHours],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      const active = activeRef.current;
      if (!active) return;

      if (active.isDragging) {
        // Finalize selection
        const rect = active.columnEl.getBoundingClientRect();
        let currentHour = yPositionToFractionalHour(e.clientY, rect, dayStartHour, dayEndHour);
        currentHour = snapToIncrement(currentHour, 15);
        currentHour = Math.max(dayStartHour, Math.min(dayEndHour, currentHour));

        const { start, end } = normalizeRange(active.startFractionalHour, currentHour);
        const finalEnd = Math.max(start + 0.25, end);

        const startTime = fractionalHourToDateTime(active.day, start);
        const endTime = fractionalHourToDateTime(active.day, finalEnd);

        onSlotSelect?.(startTime, endTime);
      } else {
        // It was a click, not a drag — fire slot click
        const snapped = snapToIncrement(active.startFractionalHour, 15);
        const dateTime = fractionalHourToDateTime(active.day, snapped);
        onSlotClick?.(dateTime);
      }

      // Clean up
      activeRef.current = null;
      setSelection(null);
      document.body.style.userSelect = "";

      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    },
    [dayStartHour, dayEndHour, onSlotClick, onSlotSelect, handlePointerMove],
  );

  const onSlotPointerDown = useCallback(
    (e: React.PointerEvent, day: DateString, columnEl: HTMLDivElement) => {
      // Only handle primary button
      if (e.button !== 0) return;
      // Don't start selection if clicking on an event
      const target = e.target as HTMLElement;
      if (target.closest("[data-event-id]")) return;

      e.preventDefault();

      const rect = columnEl.getBoundingClientRect();
      let startHour = yPositionToFractionalHour(e.clientY, rect, dayStartHour, dayEndHour);
      startHour = snapToIncrement(startHour, 15);
      startHour = Math.max(dayStartHour, Math.min(dayEndHour, startHour));

      activeRef.current = {
        day,
        columnEl,
        startY: e.clientY,
        startFractionalHour: startHour,
        isDragging: false,
      };

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    },
    [dayStartHour, dayEndHour, handlePointerMove, handlePointerUp],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.body.style.userSelect = "";
    };
  }, [handlePointerMove, handlePointerUp]);

  return { selection, onSlotPointerDown };
}
