import type { CalendarEvent, Resource } from "../types";

/**
 * Flatten a nested resource tree (depth-first) into a flat array.
 */
export function flattenResources(resources: Resource[]): Resource[] {
  const result: Resource[] = [];
  for (const resource of resources) {
    result.push(resource);
    if (resource.children && resource.children.length > 0) {
      result.push(...flattenResources(resource.children));
    }
  }
  return result;
}

/**
 * Get events assigned to a specific resource.
 */
export function getEventsForResource(
  events: CalendarEvent[],
  resourceId: string,
): CalendarEvent[] {
  return events.filter((e) => e.resourceId === resourceId);
}

/**
 * Group events by resource ID.
 * Returns a Map keyed by resource ID with the array of events for each.
 */
export function groupEventsByResource(
  events: CalendarEvent[],
  resources: Resource[],
): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const resource of resources) {
    map.set(resource.id, []);
  }
  for (const event of events) {
    if (event.resourceId && map.has(event.resourceId)) {
      map.get(event.resourceId)!.push(event);
    }
  }
  return map;
}
