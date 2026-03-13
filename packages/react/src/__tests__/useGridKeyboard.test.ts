import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGridKeyboard } from "../hooks/useGridKeyboard";

function createKeyboardEvent(key: string): React.KeyboardEvent {
  return {
    key,
    preventDefault: vi.fn(),
  } as unknown as React.KeyboardEvent;
}

describe("useGridKeyboard", () => {
  const defaultOptions = { rows: 5, cols: 7 };

  describe("initial state", () => {
    it("starts with focusedCell at [0, 0]", () => {
      const { result } = renderHook(() => useGridKeyboard(defaultOptions));

      expect(result.current.focusedCell).toEqual([0, 0]);
    });
  });

  describe("registerCell and getTabIndex (roving tabindex)", () => {
    it("returns tabIndex 0 for the focused cell and -1 for others", () => {
      const { result } = renderHook(() => useGridKeyboard(defaultOptions));

      expect(result.current.getTabIndex(0, 0)).toBe(0);
      expect(result.current.getTabIndex(0, 1)).toBe(-1);
      expect(result.current.getTabIndex(1, 0)).toBe(-1);
      expect(result.current.getTabIndex(2, 3)).toBe(-1);
    });

    it("updates tabIndex when focusedCell changes", () => {
      const { result } = renderHook(() => useGridKeyboard(defaultOptions));

      act(() => {
        result.current.setFocusedCell([2, 3]);
      });

      expect(result.current.getTabIndex(0, 0)).toBe(-1);
      expect(result.current.getTabIndex(2, 3)).toBe(0);
    });

    it("registerCell stores and removes element refs", () => {
      const { result } = renderHook(() => useGridKeyboard(defaultOptions));
      const mockEl = document.createElement("div");

      act(() => {
        result.current.registerCell(0, 0, mockEl);
      });

      // Registering should work without error
      expect(() => {
        act(() => {
          result.current.registerCell(0, 0, null);
        });
      }).not.toThrow();
    });

    it("registerCell focuses element when cell becomes active", () => {
      const { result } = renderHook(() => useGridKeyboard(defaultOptions));
      const mockEl = document.createElement("div");
      mockEl.focus = vi.fn();

      act(() => {
        result.current.registerCell(0, 1, mockEl);
      });

      // Navigate right to focus [0,1]
      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowRight"));
      });

      expect(mockEl.focus).toHaveBeenCalled();
    });
  });

  describe("arrow key navigation", () => {
    it("ArrowRight moves to the next column", () => {
      const { result } = renderHook(() => useGridKeyboard(defaultOptions));

      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowRight"));
      });

      expect(result.current.focusedCell).toEqual([0, 1]);
    });

    it("ArrowLeft moves to the previous column", () => {
      const { result } = renderHook(() => useGridKeyboard(defaultOptions));

      // Start at [0, 2]
      act(() => {
        result.current.setFocusedCell([0, 2]);
      });

      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowLeft"));
      });

      expect(result.current.focusedCell).toEqual([0, 1]);
    });

    it("ArrowDown moves to the next row", () => {
      const { result } = renderHook(() => useGridKeyboard(defaultOptions));

      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowDown"));
      });

      expect(result.current.focusedCell).toEqual([1, 0]);
    });

    it("ArrowUp moves to the previous row", () => {
      const { result } = renderHook(() => useGridKeyboard(defaultOptions));

      act(() => {
        result.current.setFocusedCell([2, 3]);
      });

      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowUp"));
      });

      expect(result.current.focusedCell).toEqual([1, 3]);
    });

    it("ArrowLeft does not go below column 0", () => {
      const { result } = renderHook(() => useGridKeyboard(defaultOptions));

      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowLeft"));
      });

      expect(result.current.focusedCell).toEqual([0, 0]);
    });

    it("ArrowRight does not exceed last column", () => {
      const { result } = renderHook(() =>
        useGridKeyboard({ rows: 5, cols: 7 }),
      );

      act(() => {
        result.current.setFocusedCell([0, 6]);
      });

      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowRight"));
      });

      expect(result.current.focusedCell).toEqual([0, 6]);
    });

    it("ArrowUp does not go below row 0", () => {
      const { result } = renderHook(() => useGridKeyboard(defaultOptions));

      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowUp"));
      });

      expect(result.current.focusedCell).toEqual([0, 0]);
    });

    it("ArrowDown does not exceed last row", () => {
      const { result } = renderHook(() => useGridKeyboard(defaultOptions));

      act(() => {
        result.current.setFocusedCell([4, 0]);
      });

      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowDown"));
      });

      expect(result.current.focusedCell).toEqual([4, 0]);
    });

    it("prevents default on arrow keys", () => {
      const { result } = renderHook(() => useGridKeyboard(defaultOptions));
      const event = createKeyboardEvent("ArrowRight");

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe("Home / End", () => {
    it("Home jumps to first column in the current row", () => {
      const { result } = renderHook(() => useGridKeyboard(defaultOptions));

      act(() => {
        result.current.setFocusedCell([2, 5]);
      });

      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("Home"));
      });

      expect(result.current.focusedCell).toEqual([2, 0]);
    });

    it("End jumps to last column in the current row", () => {
      const { result } = renderHook(() => useGridKeyboard(defaultOptions));

      act(() => {
        result.current.setFocusedCell([2, 1]);
      });

      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("End"));
      });

      expect(result.current.focusedCell).toEqual([2, 6]);
    });
  });

  describe("Enter / Space", () => {
    it("Enter fires onActivate with current row and col", () => {
      const onActivate = vi.fn();
      const { result } = renderHook(() =>
        useGridKeyboard({ ...defaultOptions, onActivate }),
      );

      act(() => {
        result.current.setFocusedCell([1, 3]);
      });

      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("Enter"));
      });

      expect(onActivate).toHaveBeenCalledWith(1, 3);
    });

    it("Space fires onActivate with current row and col", () => {
      const onActivate = vi.fn();
      const { result } = renderHook(() =>
        useGridKeyboard({ ...defaultOptions, onActivate }),
      );

      act(() => {
        result.current.setFocusedCell([0, 2]);
      });

      act(() => {
        result.current.handleKeyDown(createKeyboardEvent(" "));
      });

      expect(onActivate).toHaveBeenCalledWith(0, 2);
    });

    it("Enter prevents default", () => {
      const onActivate = vi.fn();
      const { result } = renderHook(() =>
        useGridKeyboard({ ...defaultOptions, onActivate }),
      );
      const event = createKeyboardEvent("Enter");

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe("Escape", () => {
    it("fires onEscape callback", () => {
      const onEscape = vi.fn();
      const { result } = renderHook(() =>
        useGridKeyboard({ ...defaultOptions, onEscape }),
      );

      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("Escape"));
      });

      expect(onEscape).toHaveBeenCalled();
    });

    it("prevents default on Escape", () => {
      const onEscape = vi.fn();
      const { result } = renderHook(() =>
        useGridKeyboard({ ...defaultOptions, onEscape }),
      );
      const event = createKeyboardEvent("Escape");

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe("handleFocus", () => {
    it("syncs focusedCell when a cell receives focus", () => {
      const { result } = renderHook(() => useGridKeyboard(defaultOptions));

      act(() => {
        result.current.handleFocus(3, 4);
      });

      expect(result.current.focusedCell).toEqual([3, 4]);
    });
  });

  describe("unrecognized keys", () => {
    it("does nothing for unrecognized keys", () => {
      const { result } = renderHook(() => useGridKeyboard(defaultOptions));
      const event = createKeyboardEvent("a");

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(result.current.focusedCell).toEqual([0, 0]);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });
});
