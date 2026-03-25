import { describe, it, expect } from "vitest";
import { flattenResources, getEventsForResource, groupEventsByResource } from "./resources";
import type { CalendarEvent, Resource } from "../types";

const makeEvent = (id: string, resourceId?: string): CalendarEvent => ({
  id,
  title: `Event ${id}`,
  start: "2026-03-25T09:00:00",
  end: "2026-03-25T10:00:00",
  resourceId,
});

describe("flattenResources", () => {
  it("returns flat resources as-is", () => {
    const resources: Resource[] = [
      { id: "a", title: "A" },
      { id: "b", title: "B" },
    ];
    expect(flattenResources(resources)).toEqual(resources);
  });

  it("flattens nested resources depth-first", () => {
    const resources: Resource[] = [
      {
        id: "floor-1",
        title: "Floor 1",
        children: [
          { id: "room-a", title: "Room A" },
          { id: "room-b", title: "Room B" },
        ],
      },
      { id: "floor-2", title: "Floor 2" },
    ];
    const flat = flattenResources(resources);
    expect(flat.map((r) => r.id)).toEqual(["floor-1", "room-a", "room-b", "floor-2"]);
  });

  it("returns empty array for empty input", () => {
    expect(flattenResources([])).toEqual([]);
  });

  it("flattens deeply nested resources (3 levels)", () => {
    const resources: Resource[] = [
      {
        id: "building",
        title: "Building",
        children: [
          {
            id: "floor-1",
            title: "Floor 1",
            children: [
              { id: "room-101", title: "Room 101" },
              { id: "room-102", title: "Room 102" },
            ],
          },
          { id: "floor-2", title: "Floor 2" },
        ],
      },
    ];
    const flat = flattenResources(resources);
    expect(flat.map((r) => r.id)).toEqual([
      "building",
      "floor-1",
      "room-101",
      "room-102",
      "floor-2",
    ]);
  });
});

describe("getEventsForResource", () => {
  const events = [
    makeEvent("1", "room-a"),
    makeEvent("2", "room-b"),
    makeEvent("3", "room-a"),
    makeEvent("4"),
  ];

  it("returns events matching the resource", () => {
    const result = getEventsForResource(events, "room-a");
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(["1", "3"]);
  });

  it("returns empty array for unknown resource", () => {
    expect(getEventsForResource(events, "unknown")).toEqual([]);
  });

  it("does not return events without resourceId", () => {
    expect(getEventsForResource(events, "room-a").every((e) => e.resourceId === "room-a")).toBe(true);
  });

  it("returns empty array for empty events array", () => {
    expect(getEventsForResource([], "room-a")).toEqual([]);
  });
});

describe("groupEventsByResource", () => {
  const resources: Resource[] = [
    { id: "room-a", title: "Room A" },
    { id: "room-b", title: "Room B" },
  ];

  it("groups events by resource", () => {
    const events = [
      makeEvent("1", "room-a"),
      makeEvent("2", "room-b"),
      makeEvent("3", "room-a"),
    ];
    const grouped = groupEventsByResource(events, resources);
    expect(grouped.get("room-a")!.map((e) => e.id)).toEqual(["1", "3"]);
    expect(grouped.get("room-b")!.map((e) => e.id)).toEqual(["2"]);
  });

  it("creates empty arrays for resources with no events", () => {
    const grouped = groupEventsByResource([], resources);
    expect(grouped.get("room-a")).toEqual([]);
    expect(grouped.get("room-b")).toEqual([]);
  });

  it("ignores events with unknown resourceId", () => {
    const events = [makeEvent("1", "unknown")];
    const grouped = groupEventsByResource(events, resources);
    expect(grouped.get("room-a")).toEqual([]);
    expect(grouped.get("room-b")).toEqual([]);
  });

  it("does not include events without resourceId in any group", () => {
    const events = [makeEvent("1"), makeEvent("2"), makeEvent("3", "room-a")];
    const grouped = groupEventsByResource(events, resources);
    expect(grouped.get("room-a")).toEqual([events[2]]);
    expect(grouped.get("room-b")).toEqual([]);
  });
});
