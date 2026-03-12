import { createContext, useContext, type ReactNode } from "react";
import type { CalendarSlots } from "trud-calendar-core";

const SlotsContext = createContext<Partial<CalendarSlots>>({});

export function useCalendarSlots(): Partial<CalendarSlots> {
  return useContext(SlotsContext);
}

interface SlotsProviderProps {
  slots?: Partial<CalendarSlots>;
  children: ReactNode;
}

export function SlotsProvider({ slots = {}, children }: SlotsProviderProps) {
  return (
    <SlotsContext.Provider value={slots}>{children}</SlotsContext.Provider>
  );
}
