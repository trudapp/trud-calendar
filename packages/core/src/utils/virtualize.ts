import type { PositionedEvent } from "../types";

export interface VirtualRange {
  startHour: number;
  endHour: number;
}

/**
 * Filter positioned events to only those visible in the viewport.
 * Includes events within the viewport plus an overscan buffer.
 *
 * @param positioned - Events with top/height as percentages (0-100)
 * @param viewportTop - Top edge of viewport as percentage (0-100)
 * @param viewportBottom - Bottom edge of viewport as percentage (0-100)
 * @param overscan - Extra percentage to render above/below (default 10)
 */
export function filterVisibleEvents(
  positioned: PositionedEvent[],
  viewportTop: number,
  viewportBottom: number,
  overscan: number = 10,
): PositionedEvent[] {
  const top = viewportTop - overscan;
  const bottom = viewportBottom + overscan;

  return positioned.filter(
    (p) => p.top + p.height > top && p.top < bottom,
  );
}

/**
 * Convert scroll position to viewport range in hours.
 *
 * @param scrollTop - Current scrollTop of the container
 * @param containerHeight - Visible height of the scroll container
 * @param totalHeight - Total scrollable height (scrollHeight)
 * @param dayStartHour - First hour of the day grid
 * @param dayEndHour - Last hour of the day grid
 */
export function scrollToViewportRange(
  scrollTop: number,
  containerHeight: number,
  totalHeight: number,
  dayStartHour: number,
  dayEndHour: number,
): VirtualRange {
  if (totalHeight <= 0) {
    return { startHour: dayStartHour, endHour: dayEndHour };
  }

  const totalHours = dayEndHour - dayStartHour;
  const topFraction = scrollTop / totalHeight;
  const bottomFraction = (scrollTop + containerHeight) / totalHeight;

  return {
    startHour: dayStartHour + topFraction * totalHours,
    endHour: dayStartHour + bottomFraction * totalHours,
  };
}
