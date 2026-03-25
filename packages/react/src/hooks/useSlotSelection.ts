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
  /** Snap increment in minutes (default 15) */
  snapDuration?: number;
  onSlotClick?: (date: DateTimeString, extra?: { resourceId?: string }) => void;
  onSlotSelect?: (start: DateTimeString, end: DateTimeString, extra?: { resourceId?: string }) => void;
  /** Constraint callback — return false to prevent the selection */
  selectConstraint?: (start: DateTimeString, end: DateTimeString) => boolean;
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
  snapDuration = 15,
  onSlotClick,
  onSlotSelect,
  selectConstraint,
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
      currentHour = snapToIncrement(currentHour, snapDuration);
      currentHour = Math.max(dayStartHour, Math.min(dayEndHour, currentHour));

      const { start, end } = normalizeRange(active.startFractionalHour, currentHour);
      // Ensure minimum 15 min selection
      const finalEnd = Math.max(start + snapDuration / 60, end);

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
    [dayStartHour, dayEndHour, snapDuration, totalHours],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      const active = activeRef.current;
      if (!active) return;

      const resourceId = active.columnEl.dataset.resourceId;
      const extra = resourceId ? { resourceId } : undefined;

      if (active.isDragging) {
        // Finalize selection
        const rect = active.columnEl.getBoundingClientRect();
        let currentHour = yPositionToFractionalHour(e.clientY, rect, dayStartHour, dayEndHour);
        currentHour = snapToIncrement(currentHour, snapDuration);
        currentHour = Math.max(dayStartHour, Math.min(dayEndHour, currentHour));

        const { start, end } = normalizeRange(active.startFractionalHour, currentHour);
        const finalEnd = Math.max(start + snapDuration / 60, end);

        const startTime = fractionalHourToDateTime(active.day, start);
        const endTime = fractionalHourToDateTime(active.day, finalEnd);

        if (!selectConstraint || selectConstraint(startTime, endTime)) {
          onSlotSelect?.(startTime, endTime, extra);
        }
      } else {
        // It was a click, not a drag — fire slot click
        const snapped = snapToIncrement(active.startFractionalHour, snapDuration);
        const dateTime = fractionalHourToDateTime(active.day, snapped);
        onSlotClick?.(dateTime, extra);
      }

      // Clean up
      activeRef.current = null;
      setSelection(null);
      document.body.style.userSelect = "";

      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    },
    [dayStartHour, dayEndHour, snapDuration, onSlotClick, onSlotSelect, selectConstraint, handlePointerMove],
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
      startHour = snapToIncrement(startHour, snapDuration);
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
    [dayStartHour, dayEndHour, snapDuration, handlePointerMove, handlePointerUp],
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
