import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useEventSources } from "../hooks/useEventSources";
import type {
  UseEventSourcesOptions,
  EventSource,
} from "../hooks/useEventSources";
import type { CalendarEvent, DateString } from "trud-calendar-core";

const makeEvent = (id: string, title: string): CalendarEvent => ({
  id,
  title,
  start: "2026-03-01T09:00:00",
  end: "2026-03-01T10:00:00",
});

const START: DateString = "2026-03-01";
const END: DateString = "2026-03-31";

/**
 * Helper that renders useEventSources with stable props references.
 * The `sources` array is kept in `initialProps` so it stays referentially
 * stable across re-renders (renderHook passes the same object unless
 * `rerender` is called with a new one).
 */
function renderEventSources(
  sources: EventSource[],
  start: DateString = START,
  end: DateString = END,
) {
  return renderHook(
    (props: UseEventSourcesOptions) => useEventSources(props),
    { initialProps: { sources, start, end } },
  );
}

describe("useEventSources", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty events initially when sources is empty", async () => {
    const { result } = renderEventSources([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.events).toEqual([]);
  });

  it("fetches from async fetcher function", async () => {
    const events = [makeEvent("1", "Meeting")];
    const fetcher = vi
      .fn<(start: DateString, end: DateString) => Promise<CalendarEvent[]>>()
      .mockResolvedValue(events);

    const { result } = renderEventSources([{ fetcher }]);

    await waitFor(() => {
      expect(result.current.events).toHaveLength(1);
    });

    expect(result.current.events[0].id).toBe("1");
    expect(result.current.events[0].title).toBe("Meeting");
    expect(fetcher).toHaveBeenCalledWith(START, END);
    expect(result.current.isLoading).toBe(false);
  });

  it("fetches from URL with start/end query params", async () => {
    const events = [makeEvent("2", "Workshop")];

    const mockFetch = vi
      .fn<
        (
          input: string | URL | Request,
          init?: RequestInit,
        ) => Promise<Response>
      >()
      .mockResolvedValue({
        json: () => Promise.resolve(events),
      } as Response);
    globalThis.fetch = mockFetch;

    const { result } = renderEventSources([{ url: "/api/events" }]);

    await waitFor(() => {
      expect(result.current.events).toHaveLength(1);
    });

    expect(result.current.events[0].id).toBe("2");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/api/events?");
    expect(calledUrl).toContain(`start=${encodeURIComponent(START)}`);
    expect(calledUrl).toContain(`end=${encodeURIComponent(END)}`);
  });

  it("merges multiple sources", async () => {
    const fetcher1 = vi
      .fn<(start: DateString, end: DateString) => Promise<CalendarEvent[]>>()
      .mockResolvedValue([makeEvent("a", "Event A")]);
    const fetcher2 = vi
      .fn<(start: DateString, end: DateString) => Promise<CalendarEvent[]>>()
      .mockResolvedValue([makeEvent("b", "Event B")]);

    const { result } = renderEventSources([
      { fetcher: fetcher1 },
      { fetcher: fetcher2 },
    ]);

    await waitFor(() => {
      expect(result.current.events).toHaveLength(2);
    });

    const ids = result.current.events.map((e) => e.id);
    expect(ids).toContain("a");
    expect(ids).toContain("b");
  });

  it("caches results for the same start/end range", async () => {
    const fetcher = vi
      .fn<(start: DateString, end: DateString) => Promise<CalendarEvent[]>>()
      .mockResolvedValue([makeEvent("1", "Cached")]);

    const sources: EventSource[] = [{ fetcher }];
    const { result, rerender } = renderEventSources(sources);

    await waitFor(() => {
      expect(result.current.events).toHaveLength(1);
    });

    expect(fetcher).toHaveBeenCalledTimes(1);

    // Rerender with the same start/end and same sources ref — should use cache
    rerender({ sources, start: START, end: END });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Fetcher should still only have been called once (cached)
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("refetch() clears cache and calls fetcher again", async () => {
    const fetcher = vi
      .fn<(start: DateString, end: DateString) => Promise<CalendarEvent[]>>()
      .mockResolvedValue([makeEvent("1", "Original")]);

    const { result } = renderEventSources([{ fetcher }]);

    await waitFor(() => {
      expect(result.current.events).toHaveLength(1);
    });

    expect(fetcher).toHaveBeenCalledTimes(1);

    // Now refetch — should clear cache and call fetcher again
    fetcher.mockResolvedValue([makeEvent("1", "Refreshed")]);

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.events[0].title).toBe("Refreshed");
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("isLoading transitions from false to true during fetch, then back to false", async () => {
    let resolveFetch!: (value: CalendarEvent[]) => void;
    const fetchPromise = new Promise<CalendarEvent[]>((resolve) => {
      resolveFetch = resolve;
    });

    const fetcher = vi
      .fn<(start: DateString, end: DateString) => Promise<CalendarEvent[]>>()
      .mockReturnValue(fetchPromise);

    const { result } = renderEventSources([{ fetcher }]);

    // isLoading should become true while fetching
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    // Resolve the fetch
    await act(async () => {
      resolveFetch([makeEvent("1", "Done")]);
    });

    // isLoading should return to false
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.events).toHaveLength(1);
  });

  it("handles URL with existing query params using & separator", async () => {
    const events = [makeEvent("3", "Existing QP")];

    const mockFetch = vi
      .fn<
        (
          input: string | URL | Request,
          init?: RequestInit,
        ) => Promise<Response>
      >()
      .mockResolvedValue({
        json: () => Promise.resolve(events),
      } as Response);
    globalThis.fetch = mockFetch;

    const { result } = renderEventSources([{ url: "/api/events?foo=bar" }]);

    await waitFor(() => {
      expect(result.current.events).toHaveLength(1);
    });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    // Should use & since URL already has ?foo=bar
    expect(calledUrl).toMatch(/\/api\/events\?foo=bar&start=/);
    expect(calledUrl).toContain(`start=${encodeURIComponent(START)}`);
    expect(calledUrl).toContain(`end=${encodeURIComponent(END)}`);
  });
});
