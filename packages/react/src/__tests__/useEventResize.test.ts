import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEventResize } from "../hooks/useEventResize";
import type { CalendarEvent, DateString } from "trud-calendar-core";

// jsdom does not include PointerEvent, so polyfill it
if (typeof globalThis.PointerEvent === "undefined") {
  // @ts-expect-error minimal polyfill for tests
  globalThis.PointerEvent = class PointerEvent extends MouseEvent {
    constructor(type: string, init?: PointerEventInit) {
      super(type, init);
    }
  };
}

const makeEvent = (
  id: string,
  start: string,
  end: string,
): CalendarEvent => ({
  id,
  title: `Event ${id}`,
  start,
  end,
});

function createMockColumnEl(): HTMLDivElement {
  const el = document.createElement("div");
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    top: 0,
    bottom: 960,
    left: 0,
    right: 200,
    width: 200,
    height: 960,
    x: 0,
    y: 0,
    toJSON: () => {},
  });
  return el;
}

function createPointerEvent(
  overrides: Partial<React.PointerEvent> = {},
): React.PointerEvent {
  return {
    button: 0,
    clientX: 100,
    clientY: 400,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...overrides,
  } as unknown as React.PointerEvent;
}

describe("useEventResize", () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(document, "addEventListener");
    removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  });

  describe("initial state", () => {
    it("returns null resizeState", () => {
      const { result } = renderHook(() =>
        useEventResize({
          dayStartHour: 0,
          dayEndHour: 24,
          enabled: true,
          onEventResize: vi.fn(),
        }),
      );

      expect(result.current.resizeState).toBeNull();
      expect(result.current.didResize.current).toBe(false);
    });
  });

  describe("when disabled", () => {
    it("does nothing on pointer down when enabled=false", () => {
      const onEventResize = vi.fn();
      const { result } = renderHook(() =>
        useEventResize({
          dayStartHour: 0,
          dayEndHour: 24,
          enabled: false,
          onEventResize,
        }),
      );

      const event = makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T11:00:00");
      const columnEl = createMockColumnEl();
      const pointerEvent = createPointerEvent();

      act(() => {
        result.current.onResizeHandlePointerDown(
          pointerEvent,
          event,
          "2024-06-15" as DateString,
          columnEl,
        );
      });

      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        "pointermove",
        expect.any(Function),
      );
    });

    it("does nothing when onEventResize is not provided", () => {
      const { result } = renderHook(() =>
        useEventResize({
          dayStartHour: 0,
          dayEndHour: 24,
          enabled: true,
        }),
      );

      const event = makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T11:00:00");
      const columnEl = createMockColumnEl();
      const pointerEvent = createPointerEvent();

      act(() => {
        result.current.onResizeHandlePointerDown(
          pointerEvent,
          event,
          "2024-06-15" as DateString,
          columnEl,
        );
      });

      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        "pointermove",
        expect.any(Function),
      );
    });
  });

  describe("onResizeHandlePointerDown", () => {
    it("sets up document event listeners", () => {
      const onEventResize = vi.fn();
      const { result } = renderHook(() =>
        useEventResize({
          dayStartHour: 0,
          dayEndHour: 24,
          enabled: true,
          onEventResize,
        }),
      );

      const event = makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T11:00:00");
      const columnEl = createMockColumnEl();
      const pointerEvent = createPointerEvent();

      act(() => {
        result.current.onResizeHandlePointerDown(
          pointerEvent,
          event,
          "2024-06-15" as DateString,
          columnEl,
        );
      });

      expect(pointerEvent.preventDefault).toHaveBeenCalled();
      expect(pointerEvent.stopPropagation).toHaveBeenCalled();
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "pointermove",
        expect.any(Function),
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "pointerup",
        expect.any(Function),
      );
    });

    it("sets cursor to s-resize during resize", () => {
      const onEventResize = vi.fn();
      const { result } = renderHook(() =>
        useEventResize({
          dayStartHour: 0,
          dayEndHour: 24,
          enabled: true,
          onEventResize,
        }),
      );

      const event = makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T11:00:00");
      const columnEl = createMockColumnEl();

      act(() => {
        result.current.onResizeHandlePointerDown(
          createPointerEvent(),
          event,
          "2024-06-15" as DateString,
          columnEl,
        );
      });

      expect(document.body.style.cursor).toBe("s-resize");
      expect(document.body.style.userSelect).toBe("none");
    });
  });

  describe("resize interaction", () => {
    it("updates resizeState during pointer move", () => {
      const onEventResize = vi.fn();
      const { result } = renderHook(() =>
        useEventResize({
          dayStartHour: 0,
          dayEndHour: 24,
          enabled: true,
          onEventResize,
        }),
      );

      const event = makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T11:00:00");
      const columnEl = createMockColumnEl();

      act(() => {
        result.current.onResizeHandlePointerDown(
          createPointerEvent(),
          event,
          "2024-06-15" as DateString,
          columnEl,
        );
      });

      const moveHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointermove",
      )?.[1] as EventListener;

      expect(moveHandler).toBeDefined();

      // Move the pointer to simulate resize
      // Column is 960px tall for 24 hours.
      // Moving to Y=600 -> fractional hour = (600/960)*24 = 15
      act(() => {
        moveHandler(new PointerEvent("pointermove", { clientX: 100, clientY: 600 }));
      });

      expect(result.current.resizeState).not.toBeNull();
      expect(result.current.resizeState?.eventId).toBe("1");
      expect(result.current.resizeState?.day).toBe("2024-06-15");
      expect(result.current.resizeState?.heightOverride).toBeGreaterThan(0);
    });

    it("fires onEventResize with snapped time on pointer up", () => {
      const onEventResize = vi.fn();
      const { result } = renderHook(() =>
        useEventResize({
          dayStartHour: 0,
          dayEndHour: 24,
          enabled: true,
          onEventResize,
        }),
      );

      // Event starts at 10:00
      const event = makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T11:00:00");
      const columnEl = createMockColumnEl();

      act(() => {
        result.current.onResizeHandlePointerDown(
          createPointerEvent(),
          event,
          "2024-06-15" as DateString,
          columnEl,
        );
      });

      const upHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointerup",
      )?.[1] as EventListener;

      // Pointer up at Y=600 -> fractional hour = (600/960)*24 = 15.0
      // Snapped to 15-min increments -> 15:00
      act(() => {
        upHandler(new PointerEvent("pointerup", { clientX: 100, clientY: 600 }));
      });

      expect(onEventResize).toHaveBeenCalledWith(
        event,
        "2024-06-15T10:00:00",
        "2024-06-15T15:00:00",
      );
    });

    it("enforces minimum 15-minute duration", () => {
      const onEventResize = vi.fn();
      const { result } = renderHook(() =>
        useEventResize({
          dayStartHour: 0,
          dayEndHour: 24,
          enabled: true,
          onEventResize,
        }),
      );

      // Event starts at 10:00
      const event = makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T11:00:00");
      const columnEl = createMockColumnEl();

      act(() => {
        result.current.onResizeHandlePointerDown(
          createPointerEvent(),
          event,
          "2024-06-15" as DateString,
          columnEl,
        );
      });

      const upHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointerup",
      )?.[1] as EventListener;

      // Pointer up at Y that is very close to event start (just 5px into it)
      // Y=400 -> fractionalHour = (400/960)*24 = 10.0 exactly at start
      // Minimum end should be 10.25 (10:15)
      act(() => {
        upHandler(new PointerEvent("pointerup", { clientX: 100, clientY: 400 }));
      });

      expect(onEventResize).toHaveBeenCalled();
      const newEnd = onEventResize.mock.calls[0][2];
      // Should be at least 10:15 (the minimum 15 min after 10:00)
      expect(newEnd).toBe("2024-06-15T10:15:00");
    });

    it("clamps to dayEndHour", () => {
      const onEventResize = vi.fn();
      const { result } = renderHook(() =>
        useEventResize({
          dayStartHour: 0,
          dayEndHour: 24,
          enabled: true,
          onEventResize,
        }),
      );

      const event = makeEvent("1", "2024-06-15T23:00:00", "2024-06-15T23:30:00");
      const columnEl = createMockColumnEl();

      act(() => {
        result.current.onResizeHandlePointerDown(
          createPointerEvent(),
          event,
          "2024-06-15" as DateString,
          columnEl,
        );
      });

      const upHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointerup",
      )?.[1] as EventListener;

      // Pointer up way below the column (past dayEnd)
      // fractionalHour will be clamped to dayEndHour (24),
      // but fractionalHourToDateTime clamps hours to 23 max,
      // so result is 2024-06-15T23:00:00.
      // However, minimum is eventStart + 0.25 = 23.25, so
      // the clamped value is min(24, max(23.25, 24)) = 24,
      // fractionalHourToDateTime(24) -> totalMinutes=1440, hours=24 clamped to 23, mins=0
      act(() => {
        upHandler(new PointerEvent("pointerup", { clientX: 100, clientY: 2000 }));
      });

      expect(onEventResize).toHaveBeenCalled();
      const newEnd = onEventResize.mock.calls[0][2];
      // fractionalHourToDateTime clamps hours to 0-23, so hour 24 becomes "23:00:00"
      expect(newEnd).toBe("2024-06-15T23:00:00");
    });
  });

  describe("snapDuration option", () => {
    it("accepts snapDuration option without error", () => {
      const { result } = renderHook(() =>
        useEventResize({
          dayStartHour: 0,
          dayEndHour: 24,
          enabled: true,
          onEventResize: vi.fn(),
          snapDuration: 30,
        }),
      );

      expect(result.current.resizeState).toBeNull();
    });
  });

  describe("resize from start edge", () => {
    it("exposes onResizeStartHandlePointerDown as a function", () => {
      const { result } = renderHook(() =>
        useEventResize({
          dayStartHour: 0,
          dayEndHour: 24,
          enabled: true,
          onEventResize: vi.fn(),
        }),
      );

      expect(typeof result.current.onResizeStartHandlePointerDown).toBe("function");
    });
  });

  describe("resizeConstraint", () => {
    it("does not call onEventResize when resizeConstraint returns false", () => {
      const onEventResize = vi.fn();
      const { result } = renderHook(() =>
        useEventResize({
          dayStartHour: 0,
          dayEndHour: 24,
          enabled: true,
          onEventResize,
          resizeConstraint: () => false,
        }),
      );

      const event = makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T11:00:00");
      const columnEl = createMockColumnEl();

      act(() => {
        result.current.onResizeHandlePointerDown(
          createPointerEvent(),
          event,
          "2024-06-15" as DateString,
          columnEl,
        );
      });

      const upHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointerup",
      )?.[1] as EventListener;

      // Pointer up at Y=600 -> fractional hour = (600/960)*24 = 15.0
      act(() => {
        upHandler(new PointerEvent("pointerup", { clientX: 100, clientY: 600 }));
      });

      expect(onEventResize).not.toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("cleans up after pointer up", () => {
      const onEventResize = vi.fn();
      const { result } = renderHook(() =>
        useEventResize({
          dayStartHour: 0,
          dayEndHour: 24,
          enabled: true,
          onEventResize,
        }),
      );

      const event = makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T11:00:00");
      const columnEl = createMockColumnEl();

      act(() => {
        result.current.onResizeHandlePointerDown(
          createPointerEvent(),
          event,
          "2024-06-15" as DateString,
          columnEl,
        );
      });

      const upHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointerup",
      )?.[1] as EventListener;

      act(() => {
        upHandler(new PointerEvent("pointerup", { clientX: 100, clientY: 600 }));
      });

      expect(result.current.resizeState).toBeNull();
      expect(document.body.style.cursor).toBe("");
      expect(document.body.style.userSelect).toBe("");
    });

    it("cleans up on unmount", () => {
      const onEventResize = vi.fn();

      const { unmount } = renderHook(() =>
        useEventResize({
          dayStartHour: 0,
          dayEndHour: 24,
          enabled: true,
          onEventResize,
        }),
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "pointermove",
        expect.any(Function),
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "pointerup",
        expect.any(Function),
      );
    });
  });
});
