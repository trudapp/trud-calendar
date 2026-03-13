import { useRef, useCallback } from "react";

export interface UseSwipeNavigationOptions {
  /** Callback when user swipes left (navigate next) */
  onSwipeLeft: () => void;
  /** Callback when user swipes right (navigate prev) */
  onSwipeRight: () => void;
  /** Minimum horizontal distance in px to trigger a swipe (default: 50) */
  threshold?: number;
  /** Maximum vertical distance in px to still count as a horizontal swipe (default: 30) */
  maxVertical?: number;
}

interface SwipeState {
  active: boolean;
  startX: number;
  startY: number;
  pointerId: number;
}

export function useSwipeNavigation(options: UseSwipeNavigationOptions) {
  const { onSwipeLeft, onSwipeRight, threshold = 50, maxVertical = 30 } = options;

  const stateRef = useRef<SwipeState>({
    active: false,
    startX: 0,
    startY: 0,
    pointerId: -1,
  });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only activate for touch interactions — mouse swipes conflict with drag
      if (e.pointerType !== "touch") return;

      stateRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        pointerId: e.pointerId,
      };
    },
    [],
  );

  const onPointerMove = useCallback(
    (_e: React.PointerEvent) => {
      // No-op: we track start/end only, no intermediate processing needed.
      // This handler is provided so the consumer can attach it if desired,
      // but we intentionally avoid any work here to keep scroll smooth.
    },
    [],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const state = stateRef.current;
      if (!state.active) return;
      if (e.pointerId !== state.pointerId) return;

      stateRef.current.active = false;

      const deltaX = e.clientX - state.startX;
      const deltaY = e.clientY - state.startY;

      // Check that the gesture is primarily horizontal
      if (Math.abs(deltaY) > maxVertical) return;
      if (Math.abs(deltaX) < threshold) return;

      if (deltaX < 0) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    },
    [onSwipeLeft, onSwipeRight, threshold, maxVertical],
  );

  return { onPointerDown, onPointerMove, onPointerUp };
}
