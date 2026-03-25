import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useExternalDrag } from "../hooks/useExternalDrag";

// jsdom does not include elementsFromPoint, so polyfill it
if (typeof document.elementsFromPoint !== "function") {
  document.elementsFromPoint = () => [];
}

function createDragEvent(
  overrides: {
    types?: string[];
    getData?: (key: string) => string;
    setData?: (key: string, value: string) => void;
    effectAllowed?: string;
    dropEffect?: string;
    clientX?: number;
    clientY?: number;
    preventDefault?: () => void;
    currentTarget?: EventTarget | null;
    target?: EventTarget | null;
  } = {},
): React.DragEvent {
  return {
    dataTransfer: {
      types: overrides.types ?? [],
      getData: overrides.getData ?? vi.fn(() => ""),
      setData: overrides.setData ?? vi.fn(),
      effectAllowed: overrides.effectAllowed ?? "",
      dropEffect: overrides.dropEffect ?? "",
    },
    clientX: overrides.clientX ?? 200,
    clientY: overrides.clientY ?? 400,
    preventDefault: overrides.preventDefault ?? vi.fn(),
    currentTarget: overrides.currentTarget ?? null,
    target: overrides.target ?? null,
  } as unknown as React.DragEvent;
}

describe("useExternalDrag", () => {
  let elementsFromPointSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    elementsFromPointSpy = vi.spyOn(document, "elementsFromPoint").mockReturnValue([]);
  });

  afterEach(() => {
    elementsFromPointSpy.mockRestore();
  });

  describe("makeDraggable", () => {
    it("returns correct props with draggable true and onDragStart handler", () => {
      const { result } = renderHook(() => useExternalDrag({}));

      const props = result.current.makeDraggable({ taskId: "123" });

      expect(props.draggable).toBe(true);
      expect(typeof props.onDragStart).toBe("function");
    });
  });

  describe("dropTargetProps", () => {
    it("has onDragOver, onDrop, and onDragLeave handler functions", () => {
      const { result } = renderHook(() => useExternalDrag({}));

      const { dropTargetProps } = result.current;

      expect(typeof dropTargetProps.onDragOver).toBe("function");
      expect(typeof dropTargetProps.onDrop).toBe("function");
      expect(typeof dropTargetProps.onDragLeave).toBe("function");
    });
  });

  describe("onDragOver", () => {
    it("prevents default for valid trc-external-drag type", () => {
      const { result } = renderHook(() => useExternalDrag({}));

      const preventDefault = vi.fn();
      const event = createDragEvent({
        types: ["trc-external-drag"],
        preventDefault,
      });

      act(() => {
        result.current.dropTargetProps.onDragOver(event);
      });

      expect(preventDefault).toHaveBeenCalled();
    });

    it("does NOT prevent default for other drag types", () => {
      const { result } = renderHook(() => useExternalDrag({}));

      const preventDefault = vi.fn();
      const event = createDragEvent({
        types: ["text/plain", "Files"],
        preventDefault,
      });

      act(() => {
        result.current.dropTargetProps.onDragOver(event);
      });

      expect(preventDefault).not.toHaveBeenCalled();
    });
  });

  describe("onDrop", () => {
    it("calls onExternalDrop with correct day, start, resourceId, and data", () => {
      const onExternalDrop = vi.fn();

      // Mock elementsFromPoint to return element with day and resourceId
      const mockEl = document.createElement("div");
      mockEl.dataset.day = "2026-03-25";
      mockEl.dataset.resourceId = "room-a";
      // Mock getBoundingClientRect on the element
      mockEl.getBoundingClientRect = () => ({
        top: 0,
        left: 0,
        bottom: 960,
        right: 200,
        width: 200,
        height: 960,
        x: 0,
        y: 0,
        toJSON: () => {},
      });
      elementsFromPointSpy.mockReturnValue([mockEl]);

      const { result } = renderHook(() =>
        useExternalDrag({
          onExternalDrop,
          dayStartHour: 0,
          dayEndHour: 24,
          snapDuration: 15,
        }),
      );

      const dragData = { taskId: "task-1", name: "My Task" };
      const event = createDragEvent({
        types: ["trc-external-drag"],
        getData: vi.fn(() => JSON.stringify(dragData)),
        clientX: 100,
        clientY: 400,
        preventDefault: vi.fn(),
      });

      act(() => {
        result.current.dropTargetProps.onDrop(event);
      });

      expect(onExternalDrop).toHaveBeenCalledTimes(1);
      expect(onExternalDrop).toHaveBeenCalledWith({
        day: "2026-03-25",
        start: "2026-03-25T10:00:00",
        resourceId: "room-a",
        data: dragData,
      });
    });

    it("does not throw when onExternalDrop is not provided", () => {
      const mockEl = document.createElement("div");
      mockEl.dataset.day = "2026-03-25";
      mockEl.getBoundingClientRect = () => ({
        top: 0,
        left: 0,
        bottom: 960,
        right: 200,
        width: 200,
        height: 960,
        x: 0,
        y: 0,
        toJSON: () => {},
      });
      elementsFromPointSpy.mockReturnValue([mockEl]);

      const { result } = renderHook(() => useExternalDrag({}));

      const event = createDragEvent({
        types: ["trc-external-drag"],
        getData: vi.fn(() => JSON.stringify({ taskId: "123" })),
        preventDefault: vi.fn(),
      });

      expect(() => {
        act(() => {
          result.current.dropTargetProps.onDrop(event);
        });
      }).not.toThrow();
    });
  });
});
