import { useState, useEffect } from "react";
import { toDateString, toDateTimeString } from "trud-calendar-core";

export interface UseCurrentTimeReturn {
  /** Current time as ISO datetime string */
  now: string;
  /** Current date as YYYY-MM-DD */
  today: string;
  /** Fractional hour for positioning (e.g., 14.5 = 2:30 PM) */
  timeOfDay: number;
}

export function useCurrentTime(intervalMs: number = 60_000): UseCurrentTimeReturn {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return {
    now: toDateTimeString(now),
    today: toDateString(now),
    timeOfDay: now.getHours() + now.getMinutes() / 60,
  };
}
