import { useCalendarContext } from "../context/CalendarContext";
import { WeekView } from "./WeekView";

export function DayView() {
  const { state } = useCalendarContext();
  return <WeekView singleDay={state.currentDate} />;
}
