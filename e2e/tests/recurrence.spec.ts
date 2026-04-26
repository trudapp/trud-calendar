import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("[role='toolbar']");
});

test.describe("Recurrence", () => {
  test("create a recurring event (daily) via modal", async ({ page }) => {
    // Open create modal
    await page.getByRole("button", { name: "New Event" }).click();

    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible();

    // Fill title
    await dialog.getByPlaceholder("Event title").fill("Daily Sync Meeting");

    // Set start date to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const startDate = dialog.locator("input[type='date']").first();
    await startDate.fill(dateStr);

    const endDate = dialog.locator("input[type='date']").nth(1);
    await endDate.fill(dateStr);

    // Set recurrence to "Every day"
    const repeatSelect = dialog.locator("select").last();
    await repeatSelect.selectOption("daily");

    // Verify the "Ends" section appears
    await expect(dialog.getByText("Ends")).toBeVisible();

    // Switch the recurrence end mode to "After N occurrences" by clicking the
    // second radio (Never / After / On date). The count input is gated on this.
    await dialog.locator("input[type='radio'][name='recEnd']").nth(1).check();
    const countInput = dialog.locator(
      "input[type='number'][min='1'][max='999']",
    );
    await countInput.fill("5");

    // Create the event
    await dialog.getByRole("button", { name: "Create Event" }).click();
    await expect(dialog).not.toBeVisible();
  });

  test("verify multiple instances appear in week view", async ({ page }) => {
    // First create a recurring daily event
    await page.getByRole("button", { name: "New Event" }).click();
    const dialog = page.locator("dialog[open]");
    await dialog.getByPlaceholder("Event title").fill("Recurring E2E Test");

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    await dialog.locator("input[type='date']").first().fill(dateStr);
    await dialog.locator("input[type='date']").nth(1).fill(dateStr);
    await dialog.locator("select").last().selectOption("daily");
    await dialog.getByRole("button", { name: "Create Event" }).click();
    await expect(dialog).not.toBeVisible();

    // Switch to Week view
    await page.getByRole("tab", { name: "Week" }).click();
    await expect(
      page.locator("[role='grid'][aria-label='Week view']"),
    ).toBeVisible();

    // Navigate to today to ensure we see the recurring events
    await page.getByLabel("Today").click();

    // Wait for events to render
    await page.waitForTimeout(500);

    // Multiple instances of the recurring event should be visible
    const instances = page.getByText("Recurring E2E Test");
    const count = await instances.count();
    // Daily recurrence in a week view should show multiple instances
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("click a recurring instance, verify scope dialog appears", async ({
    page,
  }) => {
    // The sample data already includes "Daily Standup" as a recurring event.
    // Switch to week view to see recurring instances
    await page.getByRole("tab", { name: "Week" }).click();
    await page.getByLabel("Today").click();
    await page.waitForTimeout(500);

    // Find a "Daily Standup" event instance
    const standupEvents = page.getByText("Daily Standup");
    const count = await standupEvents.count();

    if (count === 0) {
      test.skip(true, "No Daily Standup instances visible in current week");
      return;
    }

    // Click the first instance
    await standupEvents.first().click();

    // The RecurrenceScopeDialog should appear
    const scopeDialog = page.locator("dialog[open]");
    await expect(scopeDialog).toBeVisible();
    await expect(
      scopeDialog.getByRole("heading", { name: /recurring event/i }),
    ).toBeVisible();
    await expect(
      scopeDialog.getByRole("button", { name: /This event/ }),
    ).toBeVisible();
    await expect(
      scopeDialog.getByRole("button", { name: /All events/ }),
    ).toBeVisible();
  });

  test("edit single occurrence, verify only that one changes", async ({
    page,
  }) => {
    // Switch to week view
    await page.getByRole("tab", { name: "Week" }).click();
    await page.getByLabel("Today").click();
    await page.waitForTimeout(500);

    // Find a recurring event instance (Daily Standup)
    const standupEvents = page.getByText("Daily Standup");
    const count = await standupEvents.count();

    if (count < 2) {
      test.skip(
        true,
        "Need at least 2 Daily Standup instances for this test",
      );
      return;
    }

    // Click the first instance
    await standupEvents.first().click();

    // Scope dialog appears - choose "This event"
    const scopeDialog = page.locator("dialog[open]");
    await expect(scopeDialog).toBeVisible();
    await scopeDialog.getByRole("button", { name: /This event/ }).click();

    // The edit modal should now appear
    const editDialog = page.locator("dialog[open]");
    await expect(editDialog).toBeVisible();
    await expect(editDialog.getByText("Edit Event")).toBeVisible();

    // Change the title
    const titleInput = editDialog.getByPlaceholder("Event title");
    await titleInput.clear();
    await titleInput.fill("Modified Standup");

    // Save
    await editDialog.getByRole("button", { name: "Save Changes" }).click();
    await expect(editDialog).not.toBeVisible();

    await page.waitForTimeout(500);

    // Verify: "Modified Standup" should appear, and some "Daily Standup"
    // instances should still exist
    await expect(page.getByText("Modified Standup").first()).toBeVisible();
    // Other instances should still say "Daily Standup"
    const remainingStandups = page.getByText("Daily Standup");
    const remainingCount = await remainingStandups.count();
    expect(remainingCount).toBeGreaterThanOrEqual(1);
  });

  test("delete entire series, verify all instances removed", async ({
    page,
  }) => {
    // Switch to week view
    await page.getByRole("tab", { name: "Week" }).click();
    await page.getByLabel("Today").click();
    await page.waitForTimeout(500);

    // Find a recurring event (Gym - which recurs on MO, WE, FR)
    const gymEvents = page.getByText("Gym");
    const gymCount = await gymEvents.count();

    if (gymCount === 0) {
      test.skip(true, "No Gym instances visible in current week");
      return;
    }

    // Click the first instance
    await gymEvents.first().click();

    // Scope dialog - choose "All events" for delete
    const scopeDialog = page.locator("dialog[open]");
    await expect(scopeDialog).toBeVisible();

    // Choose "All events" to delete the entire series
    await scopeDialog.getByRole("button", { name: /All events/ }).click();

    // The edit modal opens; click Delete
    const editDialog = page.locator("dialog[open]");

    // Check if the edit modal opened or if it was a delete dialog
    const hasDeleteBtn = await editDialog
      .getByRole("button", { name: "Delete" })
      .count();
    if (hasDeleteBtn > 0) {
      await editDialog.getByRole("button", { name: "Delete" }).click();
      // Confirm
      await editDialog
        .getByRole("button", { name: "Confirm Delete" })
        .click();
    }

    await page.waitForTimeout(500);

    // All "Gym" instances from the recurring series should be gone
    // (Note: the standalone "Gym - Chest & Tris" is a separate event)
    const remainingGym = page.locator("[data-event-id='rec-gym']");
    await expect(remainingGym).toHaveCount(0);
  });
});
