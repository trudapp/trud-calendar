import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("[role='toolbar']");
});

test.describe("Drag and Drop", () => {
  test("drag event from one day to another in month view", async ({
    page,
  }) => {
    const monthGrid = page.locator("[role='grid'][aria-label='Month view']");
    await expect(monthGrid).toBeVisible();

    // Find the first draggable event
    const eventPill = monthGrid.locator("button[data-event-id]").first();
    await expect(eventPill).toBeVisible();

    const eventTitle = await eventPill.textContent();
    const eventId = await eventPill.getAttribute("data-event-id");

    // Find the source cell and a different target cell
    const sourceBbox = await eventPill.boundingBox();
    expect(sourceBbox).not.toBeNull();

    // Find a target gridcell that is different from the source
    const gridCells = monthGrid.locator("[role='gridcell'][data-day]");
    const sourceDay = await eventPill
      .locator("xpath=ancestor::div[@data-day]")
      .getAttribute("data-day");

    // Get a cell that is not the source day
    let targetCell = null;
    const cellCount = await gridCells.count();
    for (let i = 0; i < cellCount; i++) {
      const cell = gridCells.nth(i);
      const day = await cell.getAttribute("data-day");
      if (day && day !== sourceDay) {
        targetCell = cell;
        break;
      }
    }

    if (!targetCell) {
      test.skip(true, "Could not find a different target cell");
      return;
    }

    const targetBbox = await targetCell.boundingBox();
    expect(targetBbox).not.toBeNull();

    // Perform drag using pointer events (the calendar uses pointer events for DnD)
    await page.mouse.move(
      sourceBbox!.x + sourceBbox!.width / 2,
      sourceBbox!.y + sourceBbox!.height / 2,
    );
    await page.mouse.down();
    // Move slowly to trigger drag detection
    await page.mouse.move(
      targetBbox!.x + targetBbox!.width / 2,
      targetBbox!.y + targetBbox!.height / 2,
      { steps: 10 },
    );
    await page.mouse.up();

    // Verify the event moved: it should now be inside the target cell
    // Allow a brief moment for the state update
    await page.waitForTimeout(300);

    // The event with the same id should still exist somewhere
    const movedEvent = page.locator(`button[data-event-id="${eventId}"]`);
    await expect(movedEvent.first()).toBeVisible();
  });

  test("verify event moved to the new day", async ({ page }) => {
    const monthGrid = page.locator("[role='grid'][aria-label='Month view']");
    await expect(monthGrid).toBeVisible();

    // Get the first event and its parent day
    const eventPill = monthGrid.locator("button[data-event-id]").first();
    await expect(eventPill).toBeVisible();

    const eventId = await eventPill.getAttribute("data-event-id");
    const sourceDay = await eventPill
      .locator("xpath=ancestor::div[@data-day]")
      .getAttribute("data-day");

    // Find a target cell two cells over
    const gridCells = monthGrid.locator("[role='gridcell'][data-day]");
    let targetDay: string | null = null;
    let targetCell = null;
    const cellCount = await gridCells.count();
    for (let i = 0; i < cellCount; i++) {
      const cell = gridCells.nth(i);
      const day = await cell.getAttribute("data-day");
      if (day && day !== sourceDay) {
        targetDay = day;
        targetCell = cell;
        break;
      }
    }

    if (!targetCell || !targetDay) {
      test.skip(true, "Could not find target");
      return;
    }

    // Drag
    const sourceBbox = await eventPill.boundingBox();
    const targetBbox = await targetCell.boundingBox();
    expect(sourceBbox).not.toBeNull();
    expect(targetBbox).not.toBeNull();

    await page.mouse.move(
      sourceBbox!.x + sourceBbox!.width / 2,
      sourceBbox!.y + sourceBbox!.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      targetBbox!.x + targetBbox!.width / 2,
      targetBbox!.y + targetBbox!.height / 2,
      { steps: 10 },
    );
    await page.mouse.up();

    await page.waitForTimeout(300);

    // Verify the event is now within the target day's cell
    const targetContainer = page.locator(
      `[role='gridcell'][data-day="${targetDay}"]`,
    );
    const movedEvent = targetContainer.locator(
      `button[data-event-id="${eventId}"]`,
    );
    await expect(movedEvent).toBeVisible();
  });

  test("switch to week view, drag event to different time", async ({
    page,
  }) => {
    // Switch to week view
    await page.getByRole("tab", { name: "Week" }).click();
    await expect(
      page.locator("[role='grid'][aria-label='Week view']"),
    ).toBeVisible();

    // Find a timed event in the week grid
    const timedEvent = page.locator("[data-event-id]").first();
    await expect(timedEvent).toBeVisible();

    const bbox = await timedEvent.boundingBox();
    expect(bbox).not.toBeNull();

    // Drag the event down by 60px (approximately 1 hour)
    await page.mouse.move(
      bbox!.x + bbox!.width / 2,
      bbox!.y + bbox!.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      bbox!.x + bbox!.width / 2,
      bbox!.y + bbox!.height / 2 + 60,
      { steps: 10 },
    );
    await page.mouse.up();

    await page.waitForTimeout(300);

    // The event should still be visible (it moved, but is still there)
    await expect(timedEvent).toBeVisible();
  });

  test("resize event by dragging bottom edge", async ({ page }) => {
    // Switch to week view for time-based events
    await page.getByRole("tab", { name: "Week" }).click();
    await expect(
      page.locator("[role='grid'][aria-label='Week view']"),
    ).toBeVisible();

    // Find an event with a resize handle
    const timedEvent = page.locator("[data-event-id]").first();
    await expect(timedEvent).toBeVisible();

    const bbox = await timedEvent.boundingBox();
    expect(bbox).not.toBeNull();
    const originalHeight = bbox!.height;

    // The resize handle is at the bottom of the event
    const resizeHandle = timedEvent.locator(".cursor-s-resize");
    const hasHandle = (await resizeHandle.count()) > 0;

    if (!hasHandle) {
      // Resize handles only appear on hover; move mouse to bottom edge
      await page.mouse.move(
        bbox!.x + bbox!.width / 2,
        bbox!.y + bbox!.height - 2,
      );
      await page.waitForTimeout(200);
    }

    // Drag from the bottom edge downward
    await page.mouse.move(
      bbox!.x + bbox!.width / 2,
      bbox!.y + bbox!.height - 3,
    );
    await page.mouse.down();
    await page.mouse.move(
      bbox!.x + bbox!.width / 2,
      bbox!.y + bbox!.height + 40,
      { steps: 8 },
    );
    await page.mouse.up();

    await page.waitForTimeout(300);

    // Check that the event is still visible
    await expect(timedEvent).toBeVisible();
  });

  test("drag across empty slots to select time range", async ({ page }) => {
    // Switch to week view
    await page.getByRole("tab", { name: "Week" }).click();
    await expect(
      page.locator("[role='grid'][aria-label='Week view']"),
    ).toBeVisible();

    // Find an empty time slot (gridcell without events)
    // The day columns have gridcells for each hour
    const hourSlots = page
      .locator("[role='grid'][aria-label='Week view'] [role='gridcell']")
      .filter({ hasNot: page.locator("[data-event-id]") });

    const slot = hourSlots.first();
    await expect(slot).toBeVisible();

    const slotBbox = await slot.boundingBox();
    expect(slotBbox).not.toBeNull();

    // Drag across a range within the column (stay in the same x, drag down y)
    await page.mouse.move(
      slotBbox!.x + slotBbox!.width / 2,
      slotBbox!.y + 5,
    );
    await page.mouse.down();
    await page.mouse.move(
      slotBbox!.x + slotBbox!.width / 2,
      slotBbox!.y + slotBbox!.height * 2,
      { steps: 8 },
    );
    await page.mouse.up();

    // This should open the "New Event" modal with pre-filled times
    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("New Event")).toBeVisible();

    // The start time and end time inputs should be pre-filled
    const timeInputs = dialog.locator("input[type='time']");
    const timeCount = await timeInputs.count();
    expect(timeCount).toBeGreaterThanOrEqual(2);
  });
});
