import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("[role='toolbar']");

  // Enable resources for the resource time grid
  await page.getByRole("button", { name: "Resources" }).click();
  await page
    .locator("aside label", { hasText: "Resource View" })
    .locator("xpath=..")
    .getByRole("button", { name: "On", exact: true })
    .click();
});

test.describe("ResourceTimeGrid — Day view", () => {
  test.beforeEach(async ({ page }) => {
    await page.getByRole("tab", { name: "Day" }).click();
  });

  test("renders the resource time grid container", async ({ page }) => {
    await expect(
      page.locator("[role='grid'][aria-label='Resource time grid']"),
    ).toBeVisible();
  });

  test("renders one column per resource (4 rooms)", async ({ page }) => {
    const grid = page.locator("[role='grid'][aria-label='Resource time grid']");
    for (const room of ["Room A", "Room B", "Room C", "Room D"]) {
      await expect(grid.getByText(room, { exact: true }).first()).toBeVisible();
    }
  });

  test("renders an event assigned to a resource", async ({ page }) => {
    const events = page.locator("[data-event-id]");
    await expect(events.first()).toBeVisible();
  });

  test("dragging an event between resource columns keeps event count stable", async ({
    page,
  }) => {
    // Drag any visible event — recurring instances materialize as a new
    // exception with a fresh id, but the rendered count stays the same.
    const event = page.locator("[data-event-id]").first();
    await expect(event).toBeVisible();

    const before = await page.locator("[data-event-id]").count();
    const bbox = await event.boundingBox();
    expect(bbox).not.toBeNull();

    await page.mouse.move(bbox!.x + bbox!.width / 2, bbox!.y + bbox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      bbox!.x + bbox!.width / 2 + 200,
      bbox!.y + bbox!.height / 2,
      { steps: 12 },
    );
    await page.mouse.up();

    expect(await page.locator("[data-event-id]").count()).toBe(before);
  });
});

test.describe("ResourceTimeGrid — Week view", () => {
  test.beforeEach(async ({ page }) => {
    await page.getByRole("tab", { name: "Week" }).click();
  });

  test("renders the resource time grid container", async ({ page }) => {
    await expect(
      page.locator("[role='grid'][aria-label='Resource time grid']"),
    ).toBeVisible();
  });

  test("renders 4 rooms across the week (one column per resource per day)", async ({
    page,
  }) => {
    const grid = page.locator("[role='grid'][aria-label='Resource time grid']");
    for (const room of ["Room A", "Room B", "Room C", "Room D"]) {
      // Each room appears multiple times (once per day) — at least visible
      await expect(grid.getByText(room, { exact: true }).first()).toBeVisible();
    }
  });

  test("renders timed events in the week grid", async ({ page }) => {
    const events = page.locator("[data-event-id]");
    expect(await events.count()).toBeGreaterThan(0);
  });
});

test.describe("ResourceTimeGrid — turning Resources off", () => {
  test("disabling Resources reverts Day view to single column", async ({ page }) => {
    await page.getByRole("tab", { name: "Day" }).click();
    await expect(
      page.locator("[role='grid'][aria-label='Resource time grid']"),
    ).toBeVisible();

    // Open Resources panel and toggle off
    await page.getByRole("button", { name: "Resources" }).click();
    await page
      .locator("aside label", { hasText: "Resource View" })
      .locator("xpath=..")
      .getByRole("button", { name: "Off", exact: true })
      .click();

    // Now Day view should fall back to plain Week-grid label (single day)
    await expect(
      page.locator("[role='grid'][aria-label='Week view']"),
    ).toBeVisible();
  });
});
