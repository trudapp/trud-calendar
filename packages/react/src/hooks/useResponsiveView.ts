import { useState, useEffect, useCallback, type RefObject } from "react";

export interface UseResponsiveViewReturn {
  /** Container width is below 640px */
  isMobile: boolean;
  /** Container width is between 640px and 1024px */
  isTablet: boolean;
  /** Current measured width of the container */
  containerWidth: number;
  /** Suggested number of visible day columns: 1 (mobile), 3 (tablet), 7 (desktop) */
  visibleDays: number;
}

export function useResponsiveView(
  containerRef: RefObject<HTMLElement | null>,
): UseResponsiveViewReturn {
  const [containerWidth, setContainerWidth] = useState(0);

  const computeValues = useCallback((width: number) => {
    const isMobile = width > 0 && width < 640;
    const isTablet = width >= 640 && width < 1024;
    let visibleDays: number;
    if (isMobile) {
      visibleDays = 1;
    } else if (isTablet) {
      visibleDays = 3;
    } else {
      visibleDays = 7;
    }
    return { isMobile, isTablet, visibleDays };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Set initial value
    setContainerWidth(el.clientWidth);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width =
          entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
        setContainerWidth(width);
      }
    });

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [containerRef]);

  const { isMobile, isTablet, visibleDays } = computeValues(containerWidth);

  return { isMobile, isTablet, containerWidth, visibleDays };
}
