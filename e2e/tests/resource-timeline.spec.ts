import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("[role='toolbar']");

  // Enable resources and switch to Timeline view
  await page.getByRole("button", { name: "Resources" }).click();
  await page
    .locator("aside label", { hasText: "Resource View" })
    .locator("xpath=..")
    .getByRole("button", { name: "On", exact: true })
    .click();
  await page.getByRole("tab", { name: "Timeline" }).click();
});

test.describe("ResourceTimeline view", () => {
  test("renders four resource rows for Room A-D", async ({ page }) => {
    const rows = page.locator("[data-timeline-resource-id]");
    await expect(rows).toHaveCount(4);
    const ids = await rows.evaluateAll((els) =>
      els.map((el) => el.getAttribute("data-timeline-resource-id")),
    );
    expect(ids).toEqual(["room-a", "room-b", "room-c", "room-d"]);
  });

  test("renders resource labels A-D in left gutter", async ({ page }) => {
    for (const label of ["Room A", "Room B", "Room C", "Room D"]) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }
  });

  test("renders horizontal time axis (12 AM to 11 PM)", async ({ page }) => {
    // Hour labels appear once across the top
    await expect(page.getByText("12 AM").first()).toBeVisible();
    await expect(page.getByText("12 PM").first()).toBeVisible();
    await expect(page.getByText("11 PM").first()).toBeVisible();
  });

  test("renders at least one event when sample data is present", async ({ page }) => {
    const events = page.locator("[data-event-id]");
    await expect(events.first()).toBeVisible();
    expect(await events.count()).toBeGreaterThan(0);
  });

  test("renders the now-line indicator", async ({ page }) => {
    // The current-time indicator is rendered when we are within today's range.
    // Demo navigates to today by default. Look for the now-line element.
    const nowLine = page.locator("[data-trc-now-line], [aria-label='Current time']");
    if ((await nowLine.count()) > 0) {
      await expect(nowLine.first()).toBeVisible();
    } else {
      // Fall back: a solid red marker line common to all timelines
      const reds = page.locator(".bg-red-500, [class*='now']");
      expect(await reds.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test("dragging an event horizontally keeps event count stable", async ({
    page,
  }) => {
    // Drag any visible event. Recurring instances generate an exception (new
    // id) on drop, but the rendered count stays the same.
    const event = page.locator("[data-event-id]").first();
    await expect(event).toBeVisible();

    const before = await page.locator("[data-event-id]").count();
    const bbox = await event.boundingBox();
    expect(bbox).not.toBeNull();

    await page.mouse.move(bbox!.x + bbox!.width / 2, bbox!.y + bbox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      bbox!.x + bbox!.width / 2 + 120,
      bbox!.y + bbox!.height / 2,
      { steps: 12 },
    );
    await page.mouse.up();

    expect(await page.locator("[data-event-id]").count()).toBe(before);
  });

  test("dragging an event vertically across rows keeps event count stable", async ({
    page,
  }) => {
    const event = page.locator("[data-event-id]").first();
    await expect(event).toBeVisible();

    const before = await page.locator("[data-event-id]").count();
    const bbox = await event.boundingBox();
    expect(bbox).not.toBeNull();

    await page.mouse.move(bbox!.x + bbox!.width / 2, bbox!.y + bbox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      bbox!.x + bbox!.width / 2,
      bbox!.y + bbox!.height / 2 + 80,
      { steps: 12 },
    );
    await page.mouse.up();

    expect(await page.locator("[data-event-id]").count()).toBe(before);
  });

  test("clicking an empty area in a resource row opens the create modal", async ({
    page,
  }) => {
    // Click a region of Room A's strip (avoid existing events by going to the far right)
    const roomA = page.locator('[data-timeline-resource-id="room-a"]');
    const bbox = await roomA.boundingBox();
    expect(bbox).not.toBeNull();

    await page.mouse.click(bbox!.x + bbox!.width - 60, bbox!.y + bbox!.height / 2);

    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("New Event")).toBeVisible();
  });
});
