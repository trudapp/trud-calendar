import { useState, useEffect, useCallback } from "react";
import type { CalendarEvent } from "trud-calendar-core";
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
    (event: CalendarEvent, newStart: string, newEnd: string) => {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id ? { ...e, start: newStart, end: newEnd } : e,
        ),
      );
    },
    [],
  );

  return { events, addEvent, updateEvent, deleteEvent, upsertEvent, moveEvent };
}
