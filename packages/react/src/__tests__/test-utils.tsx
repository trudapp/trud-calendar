import React from "react";
import { CalendarProvider } from "../context/CalendarContext";
import type { CalendarConfig, CalendarEvent } from "trud-calendar-core";

export const makeEvent = (
  id: string,
  start: string,
  end: string,
  allDay = false,
): CalendarEvent => ({
  id,
  title: `Event ${id}`,
  start,
  end,
  allDay,
});

export function createWrapper(configOverrides: Partial<CalendarConfig> = {}) {
  const defaultConfig: CalendarConfig = {
    events: [],
    defaultDate: "2024-06-15",
    defaultView: "month",
    ...configOverrides,
  };

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <CalendarProvider config={defaultConfig}>{children}</CalendarProvider>
    );
  };
}
