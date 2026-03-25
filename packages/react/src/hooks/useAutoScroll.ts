import { useCallback, useRef } from "react";

/** Edge threshold in px — when pointer is within this distance from edge, auto-scroll kicks in */
const EDGE_THRESHOLD = 40;
/** Max scroll speed in px per frame */
const MAX_SCROLL_SPEED = 8;

export interface UseAutoScrollOptions {
  /** Ref to the scrollable container element */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Whether auto-scroll is enabled (should be true during drag/resize) */
  enabled: boolean;
}

export interface UseAutoScrollReturn {
  /** Call this on every pointermove during drag/resize to trigger auto-scroll */
  handleAutoScroll: (clientY: number) => void;
  /** Call this on pointerup to stop auto-scrolling */
  stopAutoScroll: () => void;
}

export function useAutoScroll({
  containerRef,
  enabled,
}: UseAutoScrollOptions): UseAutoScrollReturn {
  const rafRef = useRef<number | null>(null);
  const speedRef = useRef(0);

  const tick = useCallback(() => {
    const el = containerRef.current;
    if (!el || speedRef.current === 0) {
      rafRef.current = null;
      return;
    }

    el.scrollTop += speedRef.current;
    rafRef.current = requestAnimationFrame(tick);
  }, [containerRef]);

  const handleAutoScroll = useCallback(
    (clientY: number) => {
      if (!enabled) return;

      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const distFromTop = clientY - rect.top;
      const distFromBottom = rect.bottom - clientY;

      if (distFromTop < EDGE_THRESHOLD && distFromTop > 0) {
        // Scroll up — speed proportional to proximity
        speedRef.current = -MAX_SCROLL_SPEED * (1 - distFromTop / EDGE_THRESHOLD);
      } else if (distFromBottom < EDGE_THRESHOLD && distFromBottom > 0) {
        // Scroll down
        speedRef.current = MAX_SCROLL_SPEED * (1 - distFromBottom / EDGE_THRESHOLD);
      } else {
        speedRef.current = 0;
      }

      // Start animation loop if not already running
      if (speedRef.current !== 0 && rafRef.current === null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    },
    [enabled, containerRef, tick],
  );

  const stopAutoScroll = useCallback(() => {
    speedRef.current = 0;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  return { handleAutoScroll, stopAutoScroll };
}
