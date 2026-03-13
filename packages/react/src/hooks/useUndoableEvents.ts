import { useState, useCallback, useEffect } from "react";
import type { CalendarEvent, DateTimeString } from "trud-calendar-core";
import {
  createUndoStack,
  pushState,
  undo as undoAction,
  redo as redoAction,
  canUndo,
  canRedo,
} from "trud-calendar-core";

export interface UseUndoableEventsOptions {
  /** Initial events array */
  initialEvents: CalendarEvent[];
  /** Maximum undo history size (default 30) */
  maxHistory?: number;
}

export interface UseUndoableEventsReturn {
  /** Current events array */
  events: CalendarEvent[];
  /** Replace the events array (pushes a snapshot first) */
  setEvents: (events: CalendarEvent[]) => void;

  /** Wrapped callback to pass directly to Calendar's onEventDrop */
  onEventDrop: (
    event: CalendarEvent,
    newStart: DateTimeString,
    newEnd: DateTimeString,
  ) => void;
  /** Wrapped callback to pass directly to Calendar's onEventResize */
  onEventResize: (
    event: CalendarEvent,
    newStart: DateTimeString,
    newEnd: DateTimeString,
  ) => void;

  /** Undo the last change */
  undo: () => void;
  /** Redo the last undone change */
  redo: () => void;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;

  /**
   * Capture a snapshot of the current state.
   * Call this before performing custom mutations (create, delete, etc.)
   * so they can be undone.
   */
  snapshot: () => void;
}

/**
 * React hook that wraps a CalendarEvent[] with undo/redo support.
 *
 * Provides wrapped `onEventDrop` and `onEventResize` callbacks that
 * automatically snapshot before mutation, plus `snapshot()` for custom
 * mutations. Keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y) are
 * registered on the document and only fire when no input/textarea is focused.
 */
export function useUndoableEvents(
  options: UseUndoableEventsOptions,
): UseUndoableEventsReturn {
  const { initialEvents, maxHistory = 30 } = options;

  const [stack, setStack] = useState(() => createUndoStack(initialEvents));

  const handleUndo = useCallback(() => {
    setStack((prev) => undoAction(prev));
  }, []);

  const handleRedo = useCallback(() => {
    setStack((prev) => redoAction(prev));
  }, []);

  const snapshot = useCallback(() => {
    setStack((prev) => pushState(prev, prev.present, maxHistory));
  }, [maxHistory]);

  const setEvents = useCallback(
    (events: CalendarEvent[]) => {
      setStack((prev) => pushState(prev, events, maxHistory));
    },
    [maxHistory],
  );

  const onEventDrop = useCallback(
    (
      event: CalendarEvent,
      newStart: DateTimeString,
      newEnd: DateTimeString,
    ) => {
      setStack((prev) => {
        const updated = prev.present.map((e) =>
          e.id === event.id ? { ...e, start: newStart, end: newEnd } : e,
        );
        return pushState(prev, updated, maxHistory);
      });
    },
    [maxHistory],
  );

  const onEventResize = useCallback(
    (
      event: CalendarEvent,
      newStart: DateTimeString,
      newEnd: DateTimeString,
    ) => {
      setStack((prev) => {
        const updated = prev.present.map((e) =>
          e.id === event.id ? { ...e, start: newStart, end: newEnd } : e,
        );
        return pushState(prev, updated, maxHistory);
      });
    },
    [maxHistory],
  );

  // Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Shift+Z / Ctrl+Y (redo)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip when an input or textarea is focused
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") {
        return;
      }

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      if (isCtrlOrMeta && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        (isCtrlOrMeta && e.key === "z" && e.shiftKey) ||
        (isCtrlOrMeta && e.key === "y")
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleUndo, handleRedo]);

  return {
    events: stack.present,
    setEvents,
    onEventDrop,
    onEventResize,
    undo: handleUndo,
    redo: handleRedo,
    canUndo: canUndo(stack),
    canRedo: canRedo(stack),
    snapshot,
  };
}
