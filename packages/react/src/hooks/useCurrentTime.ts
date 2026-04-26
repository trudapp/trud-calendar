import { useState, useEffect } from "react";
import { getBrowserTimeZone, utcToWallTime } from "trud-calendar-core";

export interface UseCurrentTimeReturn {
  /** Current time as a wall-clock string in the resolved timezone */
  now: string;
  /** Current date as YYYY-MM-DD in the resolved timezone */
  today: string;
  /** Fractional hour in the resolved timezone (e.g., 14.5 = 2:30 PM) */
  timeOfDay: number;
}

export interface UseCurrentTimeOptions {
  /** How often to re-read the clock, in milliseconds. Default 60 seconds. */
  intervalMs?: number;
  /**
   * IANA timezone in which to resolve "now". Defaults to the runtime's local
   * zone so calling this hook outside a CalendarProvider keeps the same
   * pre-1.0 behavior.
   */
  timeZone?: string;
}

export function useCurrentTime(
  optionsOrInterval: UseCurrentTimeOptions | number = 60_000,
): UseCurrentTimeReturn {
  const options =
    typeof optionsOrInterval === "number" ? { intervalMs: optionsOrInterval } : optionsOrInterval;
  const intervalMs = options.intervalMs ?? 60_000;
  const timeZone = options.timeZone ?? getBrowserTimeZone();

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  const wallInDisplay = utcToWallTime(now.toISOString(), timeZone);
  const hour = parseInt(wallInDisplay.slice(11, 13), 10);
  const minute = parseInt(wallInDisplay.slice(14, 16), 10);

  return {
    now: wallInDisplay,
    today: wallInDisplay.slice(0, 10),
    timeOfDay: hour + minute / 60,
  };
}
