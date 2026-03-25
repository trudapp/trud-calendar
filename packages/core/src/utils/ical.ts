import type { CalendarEvent } from "../types";

/**
 * Convert a DateTimeString (YYYY-MM-DDTHH:mm:ss) to iCal DTSTART/DTEND format.
 */
function toICalDate(dateTime: string): string {
  return dateTime.replace(/[-:]/g, "").replace("T", "T");
}

/**
 * Escape special characters in iCal text values.
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Export an array of CalendarEvent to an iCal (.ics) string.
 *
 * @param events Events to export
 * @param calendarName Optional calendar name (defaults to "trud-calendar")
 * @returns A valid .ics file content string
 */
export function eventsToICal(
  events: CalendarEvent[],
  calendarName: string = "trud-calendar",
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${calendarName}//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const event of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.id}`);

    if (event.allDay) {
      // All-day events use VALUE=DATE format (YYYYMMDD)
      lines.push(`DTSTART;VALUE=DATE:${event.start.slice(0, 10).replace(/-/g, "")}`);
      lines.push(`DTEND;VALUE=DATE:${event.end.slice(0, 10).replace(/-/g, "")}`);
    } else {
      lines.push(`DTSTART:${toICalDate(event.start)}`);
      lines.push(`DTEND:${toICalDate(event.end)}`);
    }

    lines.push(`SUMMARY:${escapeICalText(event.title)}`);

    if (event.recurrence) {
      const parts: string[] = [`FREQ=${event.recurrence.freq.toUpperCase()}`];
      if (event.recurrence.interval && event.recurrence.interval > 1) {
        parts.push(`INTERVAL=${event.recurrence.interval}`);
      }
      if (event.recurrence.count) {
        parts.push(`COUNT=${event.recurrence.count}`);
      }
      if (event.recurrence.until) {
        parts.push(`UNTIL=${event.recurrence.until.replace(/-/g, "")}T235959`);
      }
      if (event.recurrence.byDay && event.recurrence.byDay.length > 0) {
        parts.push(`BYDAY=${event.recurrence.byDay.join(",")}`);
      }
      if (event.recurrence.byMonthDay && event.recurrence.byMonthDay.length > 0) {
        parts.push(`BYMONTHDAY=${event.recurrence.byMonthDay.join(",")}`);
      }
      if (event.recurrence.bySetPos) {
        parts.push(`BYSETPOS=${event.recurrence.bySetPos}`);
      }
      lines.push(`RRULE:${parts.join(";")}`);
    }

    if (event.exDates && event.exDates.length > 0) {
      const exDateValues = event.exDates
        .map((d) => d.replace(/-/g, ""))
        .join(",");
      lines.push(`EXDATE;VALUE=DATE:${exDateValues}`);
    }

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/**
 * Trigger a download of events as an .ics file in the browser.
 */
export function downloadICal(
  events: CalendarEvent[],
  filename: string = "calendar.ics",
  calendarName?: string,
): void {
  const content = eventsToICal(events, calendarName);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
