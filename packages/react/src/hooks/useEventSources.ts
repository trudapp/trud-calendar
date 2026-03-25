import { useState, useEffect, useCallback, useRef } from "react";
import type { CalendarEvent, DateString } from "trud-calendar-core";

/** A source of events — either a URL to fetch JSON from, or an async function */
export interface EventSource {
  /** URL that returns a JSON array of CalendarEvent[]. Query params `start` and `end` are appended automatically. */
  url?: string;
  /** Async function that returns events for the given range */
  fetcher?: (start: DateString, end: DateString) => Promise<CalendarEvent[]>;
}

export interface UseEventSourcesOptions {
  /** One or more event sources */
  sources: EventSource[];
  /** Visible date range — events are fetched when this changes */
  start: DateString;
  /** Visible date range end */
  end: DateString;
  /** Called when loading state changes */
  onLoading?: (loading: boolean) => void;
}

export interface UseEventSourcesReturn {
  /** All events from all sources for the current range */
  events: CalendarEvent[];
  /** Whether any source is currently loading */
  isLoading: boolean;
  /** Force refetch all sources for the current range (clears cache) */
  refetch: () => void;
}

/** Cache key for a fetched range */
function cacheKey(sourceIdx: number, start: string, end: string): string {
  return `${sourceIdx}::${start}::${end}`;
}

/**
 * Fetches events from one or more sources based on the visible date range.
 * Caches results per range to minimize requests.
 */
export function useEventSources({
  sources,
  start,
  end,
  onLoading,
}: UseEventSourcesOptions): UseEventSourcesReturn {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const cacheRef = useRef(new Map<string, CalendarEvent[]>());
  const versionRef = useRef(0);

  const fetchAll = useCallback(
    async (rangeStart: DateString, rangeEnd: DateString, clearCache: boolean) => {
      if (clearCache) {
        cacheRef.current.clear();
      }

      const version = ++versionRef.current;
      setIsLoading(true);
      onLoading?.(true);

      try {
        const results = await Promise.all(
          sources.map(async (source, idx) => {
            const key = cacheKey(idx, rangeStart, rangeEnd);

            // Return cached result if available
            const cached = cacheRef.current.get(key);
            if (cached) return cached;

            let fetched: CalendarEvent[];

            if (source.fetcher) {
              fetched = await source.fetcher(rangeStart, rangeEnd);
            } else if (source.url) {
              const separator = source.url.includes("?") ? "&" : "?";
              const url = `${source.url}${separator}start=${encodeURIComponent(rangeStart)}&end=${encodeURIComponent(rangeEnd)}`;
              const response = await fetch(url);
              fetched = await response.json() as CalendarEvent[];
            } else {
              fetched = [];
            }

            // Store in cache
            cacheRef.current.set(key, fetched);
            return fetched;
          }),
        );

        // Only update state if this is still the latest request
        if (version === versionRef.current) {
          setEvents(results.flat());
        }
      } finally {
        if (version === versionRef.current) {
          setIsLoading(false);
          onLoading?.(false);
        }
      }
    },
    [sources, onLoading],
  );

  // Fetch when range changes
  useEffect(() => {
    fetchAll(start, end, false);
  }, [start, end, fetchAll]);

  const refetch = useCallback(() => {
    fetchAll(start, end, true);
  }, [start, end, fetchAll]);

  return { events, isLoading, refetch };
}
