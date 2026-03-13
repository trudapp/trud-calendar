import { describe, it, expect } from "vitest";
import {
  createUndoStack,
  pushState,
  undo,
  redo,
  canUndo,
  canRedo,
} from "./undo";

describe("createUndoStack", () => {
  it("creates a stack with empty past and future", () => {
    const stack = createUndoStack("a");
    expect(stack.present).toBe("a");
    expect(stack.past).toEqual([]);
    expect(stack.future).toEqual([]);
  });

  it("works with complex types", () => {
    const events = [{ id: "1", title: "Test" }];
    const stack = createUndoStack(events);
    expect(stack.present).toBe(events);
    expect(stack.past).toHaveLength(0);
    expect(stack.future).toHaveLength(0);
  });
});

describe("pushState", () => {
  it("moves present to past and sets new present", () => {
    const s0 = createUndoStack("a");
    const s1 = pushState(s0, "b");

    expect(s1.present).toBe("b");
    expect(s1.past).toEqual(["a"]);
    expect(s1.future).toEqual([]);
  });

  it("clears future when pushing new state", () => {
    let stack = createUndoStack("a");
    stack = pushState(stack, "b");
    stack = pushState(stack, "c");
    stack = undo(stack); // present = "b", future = ["c"]
    expect(stack.future).toEqual(["c"]);

    stack = pushState(stack, "d"); // should clear future
    expect(stack.present).toBe("d");
    expect(stack.past).toEqual(["a", "b"]);
    expect(stack.future).toEqual([]);
  });

  it("caps past at maxHistory", () => {
    let stack = createUndoStack(0);
    for (let i = 1; i <= 35; i++) {
      stack = pushState(stack, i, 30);
    }

    expect(stack.past).toHaveLength(30);
    expect(stack.present).toBe(35);
    // The oldest entries should have been dropped
    expect(stack.past[0]).toBe(5);
    expect(stack.past[29]).toBe(34);
  });

  it("uses default maxHistory of 30", () => {
    let stack = createUndoStack(0);
    for (let i = 1; i <= 40; i++) {
      stack = pushState(stack, i);
    }

    expect(stack.past).toHaveLength(30);
    expect(stack.present).toBe(40);
  });

  it("does not mutate the original stack", () => {
    const s0 = createUndoStack("a");
    const s1 = pushState(s0, "b");

    expect(s0.present).toBe("a");
    expect(s0.past).toEqual([]);
    expect(s1.present).toBe("b");
  });
});

describe("undo", () => {
  it("moves present to future and restores previous from past", () => {
    let stack = createUndoStack("a");
    stack = pushState(stack, "b");
    stack = pushState(stack, "c");

    const undone = undo(stack);
    expect(undone.present).toBe("b");
    expect(undone.past).toEqual(["a"]);
    expect(undone.future).toEqual(["c"]);
  });

  it("returns the same stack when past is empty", () => {
    const stack = createUndoStack("a");
    const result = undo(stack);

    expect(result).toBe(stack); // same reference
    expect(result.present).toBe("a");
  });

  it("supports multiple consecutive undos", () => {
    let stack = createUndoStack("a");
    stack = pushState(stack, "b");
    stack = pushState(stack, "c");
    stack = pushState(stack, "d");

    stack = undo(stack);
    expect(stack.present).toBe("c");

    stack = undo(stack);
    expect(stack.present).toBe("b");

    stack = undo(stack);
    expect(stack.present).toBe("a");

    // No more undo
    stack = undo(stack);
    expect(stack.present).toBe("a");
  });
});

describe("redo", () => {
  it("moves present to past and restores next from future", () => {
    let stack = createUndoStack("a");
    stack = pushState(stack, "b");
    stack = pushState(stack, "c");
    stack = undo(stack); // present = "b"

    const redone = redo(stack);
    expect(redone.present).toBe("c");
    expect(redone.past).toEqual(["a", "b"]);
    expect(redone.future).toEqual([]);
  });

  it("returns the same stack when future is empty", () => {
    const stack = createUndoStack("a");
    const result = redo(stack);

    expect(result).toBe(stack); // same reference
    expect(result.present).toBe("a");
  });

  it("supports multiple consecutive redos", () => {
    let stack = createUndoStack("a");
    stack = pushState(stack, "b");
    stack = pushState(stack, "c");
    stack = pushState(stack, "d");

    // Undo everything
    stack = undo(stack);
    stack = undo(stack);
    stack = undo(stack);
    expect(stack.present).toBe("a");

    // Redo everything
    stack = redo(stack);
    expect(stack.present).toBe("b");

    stack = redo(stack);
    expect(stack.present).toBe("c");

    stack = redo(stack);
    expect(stack.present).toBe("d");

    // No more redo
    stack = redo(stack);
    expect(stack.present).toBe("d");
  });
});

describe("canUndo", () => {
  it("returns false for fresh stack", () => {
    expect(canUndo(createUndoStack("a"))).toBe(false);
  });

  it("returns true after push", () => {
    const stack = pushState(createUndoStack("a"), "b");
    expect(canUndo(stack)).toBe(true);
  });

  it("returns false after undoing all states", () => {
    let stack = createUndoStack("a");
    stack = pushState(stack, "b");
    stack = undo(stack);
    expect(canUndo(stack)).toBe(false);
  });
});

describe("canRedo", () => {
  it("returns false for fresh stack", () => {
    expect(canRedo(createUndoStack("a"))).toBe(false);
  });

  it("returns false after push (future is cleared)", () => {
    const stack = pushState(createUndoStack("a"), "b");
    expect(canRedo(stack)).toBe(false);
  });

  it("returns true after undo", () => {
    let stack = createUndoStack("a");
    stack = pushState(stack, "b");
    stack = undo(stack);
    expect(canRedo(stack)).toBe(true);
  });

  it("returns false after redoing all states", () => {
    let stack = createUndoStack("a");
    stack = pushState(stack, "b");
    stack = undo(stack);
    stack = redo(stack);
    expect(canRedo(stack)).toBe(false);
  });
});

describe("undo/redo round-trip", () => {
  it("restores original state after undo then redo", () => {
    let stack = createUndoStack("a");
    stack = pushState(stack, "b");

    stack = undo(stack);
    expect(stack.present).toBe("a");

    stack = redo(stack);
    expect(stack.present).toBe("b");
  });

  it("handles interleaved undo/redo/push correctly", () => {
    let stack = createUndoStack("a");
    stack = pushState(stack, "b");
    stack = pushState(stack, "c");

    // Undo back to "b"
    stack = undo(stack);
    expect(stack.present).toBe("b");

    // Push "d" — this should clear future ("c")
    stack = pushState(stack, "d");
    expect(stack.present).toBe("d");
    expect(stack.future).toEqual([]);
    expect(canRedo(stack)).toBe(false);

    // Undo back to "b"
    stack = undo(stack);
    expect(stack.present).toBe("b");

    // Can still redo to "d"
    stack = redo(stack);
    expect(stack.present).toBe("d");
  });
});
