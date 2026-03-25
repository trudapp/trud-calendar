import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEventDrag } from "../hooks/useEventDrag";
import type { CalendarEvent } from "trud-calendar-core";

// jsdom does not include PointerEvent, so polyfill it
if (typeof globalThis.PointerEvent === "undefined") {
  // @ts-expect-error minimal polyfill for tests
  globalThis.PointerEvent = class PointerEvent extends MouseEvent {
    constructor(type: string, init?: PointerEventInit) {
      super(type, init);
    }
  };
}

// jsdom does not include elementsFromPoint, so polyfill it
if (typeof document.elementsFromPoint !== "function") {
  document.elementsFromPoint = () => [];
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

function createPointerEvent(
  _type: string,
  overrides: Partial<PointerEvent> = {},
): React.PointerEvent {
  return {
    button: 0,
    clientX: 100,
    clientY: 200,
    stopPropagation: vi.fn(),
    preventDefault: vi.fn(),
    currentTarget: {
      getBoundingClientRect: () => ({
        left: 50,
        top: 100,
        right: 250,
        bottom: 500,
        width: 200,
        height: 400,
        x: 50,
        y: 100,
        toJSON: () => {},
      }),
    } as unknown as HTMLElement,
    ...overrides,
  } as unknown as React.PointerEvent;
}

describe("useEventDrag", () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(document, "addEventListener");
    removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  describe("initial state", () => {
    it("returns null dragState and isDragging=false", () => {
      const { result } = renderHook(() =>
        useEventDrag({ enabled: true, mode: "time", onEventDrop: vi.fn() }),
      );

      expect(result.current.dragState).toBeNull();
      expect(result.current.isDragging).toBe(false);
      expect(result.current.didDrag.current).toBe(false);
    });
  });

  describe("when disabled", () => {
    it("does nothing on pointerDown when enabled=false", () => {
      const onEventDrop = vi.fn();
      const { result } = renderHook(() =>
        useEventDrag({ enabled: false, mode: "time", onEventDrop }),
      );

      const event = makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T11:00:00");
      const pointerEvent = createPointerEvent("pointerdown");

      act(() => {
        result.current.onPointerDown(pointerEvent, event);
      });

      // Should not register any document listeners
      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        "pointermove",
        expect.any(Function),
      );
      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        "pointerup",
        expect.any(Function),
      );
    });

    it("does nothing when onEventDrop is not provided", () => {
      const { result } = renderHook(() =>
        useEventDrag({ enabled: true, mode: "time" }),
      );

      const event = makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T11:00:00");
      const pointerEvent = createPointerEvent("pointerdown");

      act(() => {
        result.current.onPointerDown(pointerEvent, event);
      });

      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        "pointermove",
        expect.any(Function),
      );
    });
  });

  describe("onPointerDown", () => {
    it("sets up document event listeners on pointerDown", () => {
      const onEventDrop = vi.fn();
      const { result } = renderHook(() =>
        useEventDrag({ enabled: true, mode: "time", onEventDrop }),
      );

      const event = makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T11:00:00");
      const pointerEvent = createPointerEvent("pointerdown");

      act(() => {
        result.current.onPointerDown(pointerEvent, event);
      });

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

    it("ignores non-primary mouse button", () => {
      const onEventDrop = vi.fn();
      const { result } = renderHook(() =>
        useEventDrag({ enabled: true, mode: "time", onEventDrop }),
      );

      const event = makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T11:00:00");
      const pointerEvent = createPointerEvent("pointerdown", { button: 2 } as any);

      act(() => {
        result.current.onPointerDown(pointerEvent, event);
      });

      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        "pointermove",
        expect.any(Function),
      );
    });
  });

  describe("drag threshold", () => {
    it("does not activate drag until movement exceeds 5px", () => {
      const onEventDrop = vi.fn();
      const { result } = renderHook(() =>
        useEventDrag({ enabled: true, mode: "time", onEventDrop }),
      );

      const event = makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T11:00:00");
      const pointerEvent = createPointerEvent("pointerdown", {
        clientX: 100,
        clientY: 200,
      } as any);

      act(() => {
        result.current.onPointerDown(pointerEvent, event);
      });

      // Get the registered pointermove handler
      const moveHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointermove",
      )?.[1] as EventListener;

      expect(moveHandler).toBeDefined();

      // Move only 3px - below threshold
      act(() => {
        moveHandler(new PointerEvent("pointermove", { clientX: 103, clientY: 200 }));
      });

      // Should NOT be dragging yet
      expect(result.current.isDragging).toBe(false);
      expect(result.current.dragState).toBeNull();
    });

    it("activates drag after movement exceeds 5px", () => {
      const onEventDrop = vi.fn();

      // Mock elementsFromPoint
      const mockEl = document.createElement("div");
      mockEl.dataset.day = "2024-06-16";
      vi.spyOn(document, "elementsFromPoint").mockReturnValue([mockEl]);

      const { result } = renderHook(() =>
        useEventDrag({ enabled: true, mode: "time", onEventDrop }),
      );

      const event = makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T11:00:00");
      const pointerEvent = createPointerEvent("pointerdown", {
        clientX: 100,
        clientY: 200,
      } as any);

      act(() => {
        result.current.onPointerDown(pointerEvent, event);
      });

      const moveHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointermove",
      )?.[1] as EventListener;

      // Move 10px - above threshold
      act(() => {
        moveHandler(new PointerEvent("pointermove", { clientX: 110, clientY: 200 }));
      });

      expect(result.current.isDragging).toBe(true);
      expect(result.current.dragState).not.toBeNull();
      expect(result.current.dragState?.event.id).toBe("1");

      vi.restoreAllMocks();
    });
  });

  describe("date mode", () => {
    it("preserves original time and changes date in date mode", () => {
      const onEventDrop = vi.fn();

      // Mock elementsFromPoint to return a day column
      const mockEl = document.createElement("div");
      mockEl.dataset.day = "2024-06-20";
      vi.spyOn(document, "elementsFromPoint").mockReturnValue([mockEl]);

      const { result } = renderHook(() =>
        useEventDrag({ enabled: true, mode: "date", onEventDrop }),
      );

      const event = makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T11:00:00");
      const pointerEvent = createPointerEvent("pointerdown", {
        clientX: 100,
        clientY: 200,
      } as any);

      act(() => {
        result.current.onPointerDown(pointerEvent, event);
      });

      const moveHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointermove",
      )?.[1] as EventListener;
      const upHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointerup",
      )?.[1] as EventListener;

      // Move past threshold
      act(() => {
        moveHandler(new PointerEvent("pointermove", { clientX: 110, clientY: 210 }));
      });

      // Pointer up to complete drag
      act(() => {
        upHandler(new PointerEvent("pointerup", { clientX: 110, clientY: 210 }));
      });

      expect(onEventDrop).toHaveBeenCalledWith(
        event,
        "2024-06-20T10:00:00",
        expect.stringContaining("2024-06-20T11:00:00"),
        undefined,
      );

      vi.restoreAllMocks();
    });
  });

  describe("snapDuration option", () => {
    it("initializes without error when snapDuration is provided", () => {
      const { result } = renderHook(() =>
        useEventDrag({ enabled: true, mode: "time", onEventDrop: vi.fn(), snapDuration: 30 }),
      );

      expect(result.current.dragState).toBeNull();
      expect(result.current.isDragging).toBe(false);
    });
  });

  describe("dragConstraint", () => {
    it("does not call onEventDrop when dragConstraint returns false", () => {
      const onEventDrop = vi.fn();

      // Mock elementsFromPoint to return an element with data-day
      const mockEl = document.createElement("div");
      mockEl.dataset.day = "2024-06-20";
      vi.spyOn(document, "elementsFromPoint").mockReturnValue([mockEl]);

      const { result } = renderHook(() =>
        useEventDrag({
          enabled: true,
          mode: "date",
          onEventDrop,
          dragConstraint: () => false,
        }),
      );

      const event = makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T11:00:00");
      const pointerEvent = createPointerEvent("pointerdown", {
        clientX: 100,
        clientY: 200,
      } as any);

      act(() => {
        result.current.onPointerDown(pointerEvent, event);
      });

      const moveHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointermove",
      )?.[1] as EventListener;
      const upHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointerup",
      )?.[1] as EventListener;

      // Move past threshold
      act(() => {
        moveHandler(new PointerEvent("pointermove", { clientX: 110, clientY: 210 }));
      });

      // Pointer up to complete drag
      act(() => {
        upHandler(new PointerEvent("pointerup", { clientX: 110, clientY: 210 }));
      });

      expect(onEventDrop).not.toHaveBeenCalled();

      vi.restoreAllMocks();
    });
  });

  describe("resource detection", () => {
    it("passes resourceId in extra argument when element has dataset.resourceId", () => {
      const onEventDrop = vi.fn();

      // Mock elementsFromPoint to return an element with both data-day and data-resource-id
      const mockEl = document.createElement("div");
      mockEl.dataset.day = "2024-06-20";
      mockEl.dataset.resourceId = "room-a";
      vi.spyOn(document, "elementsFromPoint").mockReturnValue([mockEl]);

      const { result } = renderHook(() =>
        useEventDrag({
          enabled: true,
          mode: "date",
          onEventDrop,
        }),
      );

      const event = makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T11:00:00");
      const pointerEvent = createPointerEvent("pointerdown", {
        clientX: 100,
        clientY: 200,
      } as any);

      act(() => {
        result.current.onPointerDown(pointerEvent, event);
      });

      const moveHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointermove",
      )?.[1] as EventListener;
      const upHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointerup",
      )?.[1] as EventListener;

      // Move past threshold
      act(() => {
        moveHandler(new PointerEvent("pointermove", { clientX: 110, clientY: 210 }));
      });

      // Pointer up to complete drag
      act(() => {
        upHandler(new PointerEvent("pointerup", { clientX: 110, clientY: 210 }));
      });

      expect(onEventDrop).toHaveBeenCalledWith(
        event,
        expect.stringContaining("2024-06-20T10:00:00"),
        expect.stringContaining("2024-06-20T11:00:00"),
        { resourceId: "room-a" },
      );

      vi.restoreAllMocks();
    });
  });

  describe("longPressDelay option", () => {
    it("initializes without error when longPressDelay is provided", () => {
      const { result } = renderHook(() =>
        useEventDrag({ enabled: true, mode: "time", onEventDrop: vi.fn(), longPressDelay: 300 }),
      );

      expect(result.current.dragState).toBeNull();
      expect(result.current.isDragging).toBe(false);
    });
  });

  describe("cleanup", () => {
    it("cleans up drag state on pointer up", () => {
      const onEventDrop = vi.fn();

      const mockEl = document.createElement("div");
      vi.spyOn(document, "elementsFromPoint").mockReturnValue([mockEl]);

      const { result } = renderHook(() =>
        useEventDrag({ enabled: true, mode: "time", onEventDrop }),
      );

      const event = makeEvent("1", "2024-06-15T10:00:00", "2024-06-15T11:00:00");
      const pointerEvent = createPointerEvent("pointerdown");

      act(() => {
        result.current.onPointerDown(pointerEvent, event);
      });

      const upHandler = addEventListenerSpy.mock.calls.find(
        (c) => c[0] === "pointerup",
      )?.[1] as EventListener;

      act(() => {
        upHandler(new PointerEvent("pointerup", { clientX: 100, clientY: 200 }));
      });

      expect(result.current.isDragging).toBe(false);
      expect(result.current.dragState).toBeNull();

      vi.restoreAllMocks();
    });

    it("removes event listeners on unmount", () => {
      const onEventDrop = vi.fn();

      const { unmount } = renderHook(() =>
        useEventDrag({ enabled: true, mode: "time", onEventDrop }),
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
