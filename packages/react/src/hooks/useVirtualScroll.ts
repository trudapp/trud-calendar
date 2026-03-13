import { useState, useEffect, useCallback, useRef } from "react";

export interface UseVirtualScrollOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  totalHours: number;
  enabled?: boolean;
  overscanHours?: number;
}

export interface UseVirtualScrollReturn {
  viewportTop: number;
  viewportBottom: number;
  isVirtualized: boolean;
}

/**
 * Hook that tracks scroll position of a container and returns
 * viewport bounds as percentages (0-100) for virtualizing events.
 *
 * When `enabled` is false (default), returns full range so all events render.
 */
export function useVirtualScroll({
  containerRef,
  totalHours: _totalHours,
  enabled = false,
  overscanHours: _overscanHours,
}: UseVirtualScrollOptions): UseVirtualScrollReturn {
  const [viewportTop, setViewportTop] = useState(0);
  const [viewportBottom, setViewportBottom] = useState(100);
  const rafId = useRef<number | null>(null);

  const computeViewport = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= 0) {
      setViewportTop(0);
      setViewportBottom(100);
      return;
    }

    const top = (scrollTop / scrollHeight) * 100;
    const bottom = ((scrollTop + clientHeight) / scrollHeight) * 100;

    setViewportTop(top);
    setViewportBottom(bottom);
  }, [containerRef]);

  useEffect(() => {
    if (!enabled) return;

    const el = containerRef.current;
    if (!el) return;

    // Compute initial viewport
    computeViewport();

    const handleScroll = () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
      rafId.current = requestAnimationFrame(() => {
        computeViewport();
        rafId.current = null;
      });
    };

    el.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      el.removeEventListener("scroll", handleScroll);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [enabled, containerRef, computeViewport]);

  if (!enabled) {
    return { viewportTop: 0, viewportBottom: 100, isVirtualized: false };
  }

  return { viewportTop, viewportBottom, isVirtualized: true };
}
