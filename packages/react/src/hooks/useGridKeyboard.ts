import { useState, useCallback, useRef } from "react";

export interface UseGridKeyboardOptions {
  /** Number of rows in the grid */
  rows: number;
  /** Number of columns in the grid */
  cols: number;
  /** Called when Enter/Space is pressed on a cell */
  onActivate?: (row: number, col: number) => void;
  /** Called when Escape is pressed */
  onEscape?: () => void;
}

export interface UseGridKeyboardReturn {
  /** Currently focused cell [row, col] */
  focusedCell: [number, number];
  /** Set focused cell programmatically */
  setFocusedCell: (cell: [number, number]) => void;
  /** Register a cell element ref for focus management */
  registerCell: (row: number, col: number, el: HTMLElement | null) => void;
  /** Key handler — attach to each cell's onKeyDown */
  handleKeyDown: (e: React.KeyboardEvent) => void;
  /** Get tabIndex for a cell (roving tabindex pattern) */
  getTabIndex: (row: number, col: number) => number;
  /** Focus handler — attach to each cell's onFocus to sync state */
  handleFocus: (row: number, col: number) => void;
}

export function useGridKeyboard({
  rows,
  cols,
  onActivate,
  onEscape,
}: UseGridKeyboardOptions): UseGridKeyboardReturn {
  const [focusedCell, setFocusedCell] = useState<[number, number]>([0, 0]);
  const cellRefs = useRef<Map<string, HTMLElement>>(new Map());

  const registerCell = useCallback(
    (row: number, col: number, el: HTMLElement | null) => {
      const key = `${row}-${col}`;
      if (el) cellRefs.current.set(key, el);
      else cellRefs.current.delete(key);
    },
    [],
  );

  const focusCell = useCallback(
    (row: number, col: number) => {
      setFocusedCell([row, col]);
      const key = `${row}-${col}`;
      cellRefs.current.get(key)?.focus();
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let [row, col] = focusedCell;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          row = Math.max(0, row - 1);
          break;
        case "ArrowDown":
          e.preventDefault();
          row = Math.min(rows - 1, row + 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          col = Math.max(0, col - 1);
          break;
        case "ArrowRight":
          e.preventDefault();
          col = Math.min(cols - 1, col + 1);
          break;
        case "Home":
          e.preventDefault();
          col = 0;
          break;
        case "End":
          e.preventDefault();
          col = cols - 1;
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          onActivate?.(row, col);
          return;
        case "Escape":
          e.preventDefault();
          onEscape?.();
          return;
        default:
          return;
      }

      focusCell(row, col);
    },
    [focusedCell, rows, cols, onActivate, onEscape, focusCell],
  );

  const getTabIndex = useCallback(
    (row: number, col: number) => {
      return focusedCell[0] === row && focusedCell[1] === col ? 0 : -1;
    },
    [focusedCell],
  );

  const handleFocus = useCallback(
    (row: number, col: number) => {
      setFocusedCell([row, col]);
    },
    [],
  );

  return {
    focusedCell,
    setFocusedCell,
    registerCell,
    handleKeyDown,
    getTabIndex,
    handleFocus,
  };
}
