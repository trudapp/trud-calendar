/** Maximum number of undo entries (default) */
const DEFAULT_MAX_HISTORY = 30;

/** Immutable undo/redo stack */
export interface UndoStack<T> {
  past: T[];
  present: T;
  future: T[];
}

/**
 * Create a new undo stack with an initial present state.
 */
export function createUndoStack<T>(initial: T): UndoStack<T> {
  return {
    past: [],
    present: initial,
    future: [],
  };
}

/**
 * Push a new state onto the stack.
 * - Moves current present to past
 * - Clears future (branching erases redo history)
 * - Caps past at `maxHistory` entries
 */
export function pushState<T>(
  stack: UndoStack<T>,
  state: T,
  maxHistory: number = DEFAULT_MAX_HISTORY,
): UndoStack<T> {
  const past = [...stack.past, stack.present];
  return {
    past: past.length > maxHistory ? past.slice(past.length - maxHistory) : past,
    present: state,
    future: [],
  };
}

/**
 * Undo: move present to future, restore most recent past as present.
 * Returns the same stack if there is nothing to undo.
 */
export function undo<T>(stack: UndoStack<T>): UndoStack<T> {
  if (stack.past.length === 0) {
    return stack;
  }

  const previous = stack.past[stack.past.length - 1];
  const newPast = stack.past.slice(0, -1);

  return {
    past: newPast,
    present: previous,
    future: [stack.present, ...stack.future],
  };
}

/**
 * Redo: move present to past, restore most recent future as present.
 * Returns the same stack if there is nothing to redo.
 */
export function redo<T>(stack: UndoStack<T>): UndoStack<T> {
  if (stack.future.length === 0) {
    return stack;
  }

  const next = stack.future[0];
  const newFuture = stack.future.slice(1);

  return {
    past: [...stack.past, stack.present],
    present: next,
    future: newFuture,
  };
}

/**
 * Whether the stack has past entries to undo.
 */
export function canUndo<T>(stack: UndoStack<T>): boolean {
  return stack.past.length > 0;
}

/**
 * Whether the stack has future entries to redo.
 */
export function canRedo<T>(stack: UndoStack<T>): boolean {
  return stack.future.length > 0;
}
