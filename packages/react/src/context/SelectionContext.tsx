import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useEventSelection } from "../hooks/useEventSelection";
import { useCalendarContext } from "./CalendarContext";
import type { CalendarEvent } from "trud-calendar-core";

export interface SelectionContextValue {
  selectedIds: Set<string>;
  isSelected: (id: string) => boolean;
  handleEventClick: (
    event: CalendarEvent,
    e: React.MouseEvent | React.PointerEvent,
  ) => void;
  clearSelection: () => void;
  selectAll: (ids: string[]) => void;
}

const NOOP_SET = new Set<string>();

const noopContext: SelectionContextValue = {
  selectedIds: NOOP_SET,
  isSelected: () => false,
  handleEventClick: () => {},
  clearSelection: () => {},
  selectAll: () => {},
};

const SelectionContext = createContext<SelectionContextValue>(noopContext);

export function useSelectionContext(): SelectionContextValue {
  return useContext(SelectionContext);
}

interface SelectionProviderProps {
  enableMultiSelect: boolean;
  onEventClick?: (event: CalendarEvent) => void;
  onEventsDelete?: (events: CalendarEvent[]) => void;
  children: ReactNode;
}

export function SelectionProvider({
  enableMultiSelect,
  onEventClick,
  onEventsDelete,
  children,
}: SelectionProviderProps) {
  const { visibleEvents } = useCalendarContext();
  const selection = useEventSelection();

  // Build a sorted list of visible event IDs for range selection
  const sortedEventIds = useMemo(
    () => visibleEvents.map((e) => e.id),
    [visibleEvents],
  );

  // Build a map from id to event for quick lookup
  const eventMap = useMemo(() => {
    const map = new Map<string, CalendarEvent>();
    for (const ev of visibleEvents) {
      map.set(ev.id, ev);
    }
    return map;
  }, [visibleEvents]);

  const handleEventClick = useCallback(
    (event: CalendarEvent, e: React.MouseEvent | React.PointerEvent) => {
      if (!enableMultiSelect) {
        // Multi-select disabled — pass through to onEventClick directly
        onEventClick?.(event);
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      if (isCtrl) {
        selection.toggle(event.id);
        return;
      }

      if (isShift) {
        selection.rangeSelect(event.id, sortedEventIds);
        return;
      }

      // Plain click with multi-select enabled:
      // If the event is the only selected one, treat it as a regular click
      // (open popover, etc.)
      if (
        selection.selectedIds.size === 1 &&
        selection.selectedIds.has(event.id)
      ) {
        selection.clearSelection();
        onEventClick?.(event);
        return;
      }

      // If there's a selection (multiple or different event), just select this one
      if (selection.selectedIds.size > 0) {
        selection.select(event.id);
        return;
      }

      // No selection — normal click behavior
      onEventClick?.(event);
    },
    [enableMultiSelect, onEventClick, selection, sortedEventIds],
  );

  const selectAll = useCallback(
    (ids: string[]) => {
      selection.selectAll(ids);
    },
    [selection],
  );

  // Keyboard support: Delete, Escape, Ctrl+A
  useEffect(() => {
    if (!enableMultiSelect) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when focus is in an input/textarea/contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "Escape") {
        if (selection.selectedIds.size > 0) {
          selection.clearSelection();
          e.preventDefault();
        }
        return;
      }

      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selection.selectedIds.size > 0
      ) {
        if (onEventsDelete) {
          const selectedEvents: CalendarEvent[] = [];
          for (const id of selection.selectedIds) {
            const ev = eventMap.get(id);
            if (ev) selectedEvents.push(ev);
          }
          if (selectedEvents.length > 0) {
            onEventsDelete(selectedEvents);
            selection.clearSelection();
          }
        }
        e.preventDefault();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        // Only select all if the calendar container has focus (or a child does)
        const calendarEl = document.querySelector(
          "[data-trc-calendar]",
        );
        if (calendarEl?.contains(target)) {
          e.preventDefault();
          selection.selectAll(sortedEventIds);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    enableMultiSelect,
    selection,
    sortedEventIds,
    eventMap,
    onEventsDelete,
  ]);

  const value = useMemo<SelectionContextValue>(
    () => ({
      selectedIds: selection.selectedIds,
      isSelected: selection.isSelected,
      handleEventClick,
      clearSelection: selection.clearSelection,
      selectAll,
    }),
    [selection.selectedIds, selection.isSelected, handleEventClick, selection.clearSelection, selectAll],
  );

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}
