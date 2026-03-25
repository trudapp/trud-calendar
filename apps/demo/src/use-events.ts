import { useState, useEffect, useCallback } from "react";
import type { CalendarEvent, DateString } from "trud-calendar-core";
import { generateSampleEvents } from "./sample-events";

const STORAGE_KEY = "trud-calendar-demo-events";

function loadEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CalendarEvent[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // corrupted data — regenerate
  }
  const fresh = generateSampleEvents();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}

function persist(events: CalendarEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>(loadEvents);

  // Keep localStorage in sync whenever events change
  useEffect(() => {
    persist(events);
  }, [events]);

  const addEvent = useCallback((event: CalendarEvent) => {
    setEvents((prev) => [...prev, event]);
  }, []);

  const updateEvent = useCallback((event: CalendarEvent) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? event : e)),
    );
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const upsertEvent = useCallback((event: CalendarEvent) => {
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === event.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = event;
        return next;
      }
      return [...prev, event];
    });
  }, []);

  const moveEvent = useCallback(
    (event: CalendarEvent, newStart: string, newEnd: string, resourceId?: string) => {
      // If this is a recurring instance, we need to create an exception
      if (event.recurringEventId) {
        const parentId = event.recurringEventId;
        const exDate = event.originalDate as DateString;
        if (!parentId || !exDate) return;

        setEvents((prev) => {
          // Add exDate to parent so this occurrence is skipped
          const next = prev.map((e) => {
            if (e.id === parentId) {
              return { ...e, exDates: [...(e.exDates ?? []), exDate] };
            }
            return e;
          });
          // Create standalone event with the new times
          const standalone: CalendarEvent = {
            ...event,
            id: `${parentId}::moved::${exDate}`,
            start: newStart,
            end: newEnd,
            recurringEventId: undefined,
            originalDate: undefined,
            recurrence: undefined,
            exDates: undefined,
          };
          if (resourceId !== undefined) standalone.resourceId = resourceId;
          return [...next, standalone];
        });
        return;
      }

      // Regular event — update in place
      setEvents((prev) =>
        prev.map((e) => {
          if (e.id !== event.id) return e;
          const updated = { ...e, start: newStart, end: newEnd };
          if (resourceId !== undefined) updated.resourceId = resourceId;
          return updated;
        }),
      );
    },
    [],
  );

  /**
   * Edit a single occurrence of a recurring event:
   * 1. Add exDate to the parent so this date is skipped
   * 2. Create a new standalone event for this occurrence with the edits
   */
  const editSingleOccurrence = useCallback(
    (instance: CalendarEvent, edited: CalendarEvent) => {
      const parentId = instance.recurringEventId;
      const exDate = instance.originalDate as DateString;
      if (!parentId || !exDate) return;

      setEvents((prev) => {
        // Add exDate to parent
        const next = prev.map((e) => {
          if (e.id === parentId) {
            const exDates = [...(e.exDates ?? []), exDate];
            return { ...e, exDates };
          }
          return e;
        });
        // Add the standalone edited event (no recurrence, new ID)
        const standalone: CalendarEvent = {
          ...edited,
          id: `${parentId}::exception::${exDate}`,
          recurringEventId: undefined,
          originalDate: undefined,
          recurrence: undefined,
          exDates: undefined,
        };
        return [...next, standalone];
      });
    },
    [],
  );

  /**
   * Edit all events in a recurring series (edit the parent).
   */
  const editSeries = useCallback(
    (instance: CalendarEvent, edited: CalendarEvent) => {
      const parentId = instance.recurringEventId;
      if (!parentId) return;

      setEvents((prev) =>
        prev.map((e) => {
          if (e.id === parentId) {
            // Apply edits to the parent, preserve recurrence & exDates
            return {
              ...e,
              title: edited.title,
              color: edited.color,
              allDay: edited.allDay,
              recurrence: edited.recurrence ?? e.recurrence,
              // Recompute start/end: keep original start date but use new time
              start: `${e.start.slice(0, 10)}T${edited.start.slice(11)}`,
              end: `${e.start.slice(0, 10)}T${edited.end.slice(11)}`,
            };
          }
          return e;
        }),
      );
    },
    [],
  );

  /**
   * Delete a single occurrence by adding an exDate to the parent.
   */
  const deleteSingleOccurrence = useCallback(
    (instance: CalendarEvent) => {
      const parentId = instance.recurringEventId;
      const exDate = instance.originalDate as DateString;
      if (!parentId || !exDate) return;

      setEvents((prev) =>
        prev.map((e) => {
          if (e.id === parentId) {
            const exDates = [...(e.exDates ?? []), exDate];
            return { ...e, exDates };
          }
          return e;
        }),
      );
    },
    [],
  );

  /**
   * Delete the entire recurring series (delete the parent).
   */
  const deleteSeries = useCallback(
    (instance: CalendarEvent) => {
      const parentId = instance.recurringEventId;
      if (!parentId) return;
      setEvents((prev) => prev.filter((e) => e.id !== parentId));
    },
    [],
  );

  return {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    upsertEvent,
    moveEvent,
    editSingleOccurrence,
    editSeries,
    deleteSingleOccurrence,
    deleteSeries,
  };
}
