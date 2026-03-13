import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("[role='toolbar']");
});

test.describe("Events", () => {
  test("events are visible in month view", async ({ page }) => {
    // The demo app loads sample events on startup. At minimum we should see
    // event buttons rendered inside the month grid.
    const monthGrid = page.locator("[role='grid'][aria-label='Month view']");
    await expect(monthGrid).toBeVisible();

    // There should be event pill buttons with data-event-id attributes
    const eventPills = monthGrid.locator("button[data-event-id]");
    const count = await eventPills.count();
    expect(count).toBeGreaterThan(0);
  });

  test("click an event opens the event modal", async ({ page }) => {
    // Find the first visible event in month view and click it
    const firstEvent = page
      .locator("[role='grid'][aria-label='Month view'] button[data-event-id]")
      .first();
    await expect(firstEvent).toBeVisible();
    await firstEvent.click();

    // The EventModal in the demo uses a <dialog> element
    // When opened for editing it shows "Edit Event" heading
    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Edit Event")).toBeVisible();
  });

  test("click empty slot opens create modal", async ({ page }) => {
    // Click on an empty day cell in the month grid. The gridcells have role="gridcell".
    // We target a cell that has no events, or just click any gridcell area.
    const gridCells = page.locator(
      "[role='grid'][aria-label='Month view'] [role='gridcell']",
    );

    // Click the first cell (it may or may not have events, but clicking the
    // cell background triggers onSlotClick -> "New Event" modal)
    const cell = gridCells.first();
    await cell.click();

    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("New Event")).toBeVisible();
  });

  test("create a new event via modal and verify it appears", async ({
    page,
  }) => {
    // Click the "New Event" button in the sidebar
    await page.getByRole("button", { name: "New Event" }).click();

    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible();

    // Fill in the event title
    const titleInput = dialog.getByPlaceholder("Event title");
    await titleInput.fill("E2E Test Event");

    // Set the date to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const startDateInput = dialog.locator("input[type='date']").first();
    await startDateInput.fill(dateStr);

    const endDateInput = dialog.locator("input[type='date']").nth(1);
    await endDateInput.fill(dateStr);

    // Click "Create Event"
    await dialog.getByRole("button", { name: "Create Event" }).click();

    // Modal should close
    await expect(dialog).not.toBeVisible();

    // Verify the event appears in the calendar. Navigate to today's month
    // to be sure we can see it.
    await page.getByLabel("Today").click();

    // The new event should be visible somewhere in the grid
    await expect(page.getByText("E2E Test Event").first()).toBeVisible();
  });

  test("delete an event and verify it is removed", async ({ page }) => {
    // First, find an event and remember its title
    const firstEvent = page
      .locator("[role='grid'][aria-label='Month view'] button[data-event-id]")
      .first();
    await expect(firstEvent).toBeVisible();
    const eventTitle = await firstEvent.textContent();

    // Click the event to open the modal
    await firstEvent.click();

    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible();

    // Click Delete (first click shows confirmation)
    await dialog.getByRole("button", { name: "Delete" }).click();

    // Confirm deletion
    await dialog.getByRole("button", { name: "Confirm Delete" }).click();

    // Modal should close
    await expect(dialog).not.toBeVisible();

    // The event with that exact title should have fewer occurrences
    // (it may still appear if there are other events with the same title from
    // sample data, but the specific event-id should be gone)
    // We check that the event-id is no longer present
    const eventId = await firstEvent.getAttribute("data-event-id");
    if (eventId) {
      await expect(
        page.locator(`button[data-event-id="${eventId}"]`),
      ).toHaveCount(0);
    }
  });
});
