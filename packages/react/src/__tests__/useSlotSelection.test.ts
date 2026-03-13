import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSlotSelection } from "../hooks/useSlotSelection";
import type { DateString } from "trud-calendar-core";

// jsdom does not include PointerEvent, so polyfill it
if (typeof globalThis.PointerEvent === "undefined") {
  // @ts-expect-error minimal polyfill for tests
  globalThis.PointerEvent = class PointerEvent extends MouseEvent {
    constructor(type: string, init?: PointerEventInit) {
      super(type, init);
    }
  };
}

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
    target: document.createElement("div"),
    ...overrides,
  } as unknown as React.PointerEvent;
}

describe("useSlotSelection", () => {
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
  });

  describe("initial state", () => {
    it("returns null selection", () => {
      const { result } = renderHook(() =>
        useSlotSelection({ dayStartHour: 0, dayEndHour: 24 }),
      );

      expect(result.current.selection).toBeNull();
    });
  });

  describe("onSlotPointerDown", () => {
    it("sets up document listeners on pointer down", () => {
      const { result } = renderHook(() =>
        useSlotSelection({
          dayStartHour: 0,
          dayEndHour: 24,
          onSlotSelect: vi.fn(),
        }),
      );

      const columnEl = createMockColumnEl();

      act(() => {
        result.current.onSlotPointerDown(
          createPointerEvent(),
          "2024-06-15" as DateString,
          columnEl,
        );
      });

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "pointermove",
        expect.any(Function),
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "pointerup",
        expect.any(Function),
      );
    });

    it("ignores non-primary mouse button", () => {
      const { result } = renderHook(() =>
        useSlotSelection({
          dayStartHour: 0,
          dayEndHour: 24,
          onSlotSelect: vi.fn(),
        }),
      );

      const columnEl = createMockColumnEl();

      act(() => {
        result.current.onSlotPointerDown(
          createPointerEvent({ button: 2 } as any),
          "2024-06-15" as DateString,
          columnEl,
        );
      });

      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        "pointermove",
        expect.any(Function),
      );
    });

    it("ignores pointer down on an event element", () => {
      const eventEl = document.createElement("div");
      eventEl.setAttribute("data-event-id", "test-event");
      const targetEl = document.createElement("span");
      eventEl.appendChild(targetEl);

      const { result } = renderHook(() =>
        useSlotSelection({
          dayStartHour: 0,
          dayEndHour: 24,
          onSlotSelect: vi.fn(),
        }),
      );

      const columnEl = createMockColumnEl();

      act(() => {
        result.current.onSlotPointerDown(
          createPointerEvent({ target: targetEl } as any),
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

  describe("drag threshold (5px)", () => {
    it("does not create selection below 5px movement", () => {
      const onSlotSelect = vi.fn();
      const { result } = renderHook(() =>
        useSlotSelection({
          dayStartHour: 0,
          dayEndHour: 24,
          onSlotSelect,
        }),
      );

      const columnEl = createMockColumnEl();

      act(() => {
        result.current.onSlotPointerDown(
          createPointerEvent({ clientY: 400 } as any),
          "2024-06-15" as DateString,
          columnEl,
        );
      });

      const moveHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointermove",
      )?.[1] as EventListener;

      // Move only 3px vertically
      act(() => {
        moveHandler(new PointerEvent("pointermove", { clientX: 100, clientY: 403 }));
      });

      expect(result.current.selection).toBeNull();
    });

    it("creates selection after exceeding 5px threshold", () => {
      const onSlotSelect = vi.fn();
      const { result } = renderHook(() =>
        useSlotSelection({
          dayStartHour: 0,
          dayEndHour: 24,
          onSlotSelect,
        }),
      );

      const columnEl = createMockColumnEl();

      act(() => {
        result.current.onSlotPointerDown(
          createPointerEvent({ clientY: 400 } as any),
          "2024-06-15" as DateString,
          columnEl,
        );
      });

      const moveHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointermove",
      )?.[1] as EventListener;

      // Move 10px vertically - exceeds threshold
      act(() => {
        moveHandler(new PointerEvent("pointermove", { clientX: 100, clientY: 410 }));
      });

      expect(result.current.selection).not.toBeNull();
      expect(result.current.selection?.isSelecting).toBe(true);
      expect(result.current.selection?.day).toBe("2024-06-15");
    });
  });

  describe("selection expansion", () => {
    it("expands selection as pointer moves", () => {
      const onSlotSelect = vi.fn();
      const { result } = renderHook(() =>
        useSlotSelection({
          dayStartHour: 0,
          dayEndHour: 24,
          onSlotSelect,
        }),
      );

      const columnEl = createMockColumnEl();

      act(() => {
        result.current.onSlotPointerDown(
          createPointerEvent({ clientY: 400 } as any),
          "2024-06-15" as DateString,
          columnEl,
        );
      });

      const moveHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointermove",
      )?.[1] as EventListener;

      // Move past threshold
      act(() => {
        moveHandler(new PointerEvent("pointermove", { clientX: 100, clientY: 440 }));
      });

      const firstSelection = { ...result.current.selection };

      // Move further
      act(() => {
        moveHandler(new PointerEvent("pointermove", { clientX: 100, clientY: 520 }));
      });

      // Selection should have expanded (endPercent should be larger)
      expect(result.current.selection!.endPercent).toBeGreaterThan(
        firstSelection.endPercent!,
      );
    });

    it("includes startTime and endTime in selection", () => {
      const onSlotSelect = vi.fn();
      const { result } = renderHook(() =>
        useSlotSelection({
          dayStartHour: 0,
          dayEndHour: 24,
          onSlotSelect,
        }),
      );

      const columnEl = createMockColumnEl();

      // Click at Y=400 (10:00) and drag to Y=480 (12:00)
      act(() => {
        result.current.onSlotPointerDown(
          createPointerEvent({ clientY: 400 } as any),
          "2024-06-15" as DateString,
          columnEl,
        );
      });

      const moveHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointermove",
      )?.[1] as EventListener;

      act(() => {
        moveHandler(new PointerEvent("pointermove", { clientX: 100, clientY: 480 }));
      });

      expect(result.current.selection?.startTime).toMatch(
        /2024-06-15T\d{2}:\d{2}:\d{2}/,
      );
      expect(result.current.selection?.endTime).toMatch(
        /2024-06-15T\d{2}:\d{2}:\d{2}/,
      );
    });
  });

  describe("onSlotSelect callback", () => {
    it("fires onSlotSelect with start/end on pointer up after drag", () => {
      const onSlotSelect = vi.fn();
      const { result } = renderHook(() =>
        useSlotSelection({
          dayStartHour: 0,
          dayEndHour: 24,
          onSlotSelect,
        }),
      );

      const columnEl = createMockColumnEl();

      // Pointer down at Y=400 (10:00)
      act(() => {
        result.current.onSlotPointerDown(
          createPointerEvent({ clientY: 400 } as any),
          "2024-06-15" as DateString,
          columnEl,
        );
      });

      const moveHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointermove",
      )?.[1] as EventListener;
      const upHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointerup",
      )?.[1] as EventListener;

      // Move past threshold
      act(() => {
        moveHandler(new PointerEvent("pointermove", { clientX: 100, clientY: 480 }));
      });

      // Pointer up at Y=480 (12:00)
      act(() => {
        upHandler(new PointerEvent("pointerup", { clientX: 100, clientY: 480 }));
      });

      expect(onSlotSelect).toHaveBeenCalled();
      const [start, end] = onSlotSelect.mock.calls[0];
      expect(start).toMatch(/2024-06-15T/);
      expect(end).toMatch(/2024-06-15T/);
      // start should be before end
      expect(new Date(start).getTime()).toBeLessThan(new Date(end).getTime());
    });
  });

  describe("onSlotClick callback", () => {
    it("fires onSlotClick on pointer up without drag", () => {
      const onSlotClick = vi.fn();
      const { result } = renderHook(() =>
        useSlotSelection({
          dayStartHour: 0,
          dayEndHour: 24,
          onSlotClick,
        }),
      );

      const columnEl = createMockColumnEl();

      // Pointer down at Y=400 (10:00)
      act(() => {
        result.current.onSlotPointerDown(
          createPointerEvent({ clientY: 400 } as any),
          "2024-06-15" as DateString,
          columnEl,
        );
      });

      const upHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointerup",
      )?.[1] as EventListener;

      // Pointer up without moving (no drag) at same position
      act(() => {
        upHandler(new PointerEvent("pointerup", { clientX: 100, clientY: 400 }));
      });

      expect(onSlotClick).toHaveBeenCalled();
      const dateTime = onSlotClick.mock.calls[0][0];
      expect(dateTime).toMatch(/2024-06-15T/);
    });

    it("does not fire onSlotClick when drag occurred", () => {
      const onSlotClick = vi.fn();
      const onSlotSelect = vi.fn();
      const { result } = renderHook(() =>
        useSlotSelection({
          dayStartHour: 0,
          dayEndHour: 24,
          onSlotClick,
          onSlotSelect,
        }),
      );

      const columnEl = createMockColumnEl();

      act(() => {
        result.current.onSlotPointerDown(
          createPointerEvent({ clientY: 400 } as any),
          "2024-06-15" as DateString,
          columnEl,
        );
      });

      const moveHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointermove",
      )?.[1] as EventListener;
      const upHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointerup",
      )?.[1] as EventListener;

      // Move past threshold - this is a drag
      act(() => {
        moveHandler(new PointerEvent("pointermove", { clientX: 100, clientY: 480 }));
      });

      act(() => {
        upHandler(new PointerEvent("pointerup", { clientX: 100, clientY: 480 }));
      });

      expect(onSlotClick).not.toHaveBeenCalled();
      expect(onSlotSelect).toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("clears selection on pointer up", () => {
      const { result } = renderHook(() =>
        useSlotSelection({
          dayStartHour: 0,
          dayEndHour: 24,
          onSlotSelect: vi.fn(),
        }),
      );

      const columnEl = createMockColumnEl();

      act(() => {
        result.current.onSlotPointerDown(
          createPointerEvent({ clientY: 400 } as any),
          "2024-06-15" as DateString,
          columnEl,
        );
      });

      const moveHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointermove",
      )?.[1] as EventListener;
      const upHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointerup",
      )?.[1] as EventListener;

      act(() => {
        moveHandler(new PointerEvent("pointermove", { clientX: 100, clientY: 480 }));
      });

      expect(result.current.selection).not.toBeNull();

      act(() => {
        upHandler(new PointerEvent("pointerup", { clientX: 100, clientY: 480 }));
      });

      expect(result.current.selection).toBeNull();
    });

    it("cleans up on unmount", () => {
      const { unmount } = renderHook(() =>
        useSlotSelection({
          dayStartHour: 0,
          dayEndHour: 24,
          onSlotSelect: vi.fn(),
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
