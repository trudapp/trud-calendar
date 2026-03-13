import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("[role='toolbar']");
});

test.describe("Keyboard Navigation", () => {
  test("tab into the calendar grid", async ({ page }) => {
    // The month grid has gridcells with tabIndex
    const grid = page.locator("[role='grid'][aria-label='Month view']");
    await expect(grid).toBeVisible();

    // Tab through the page until we reach a gridcell
    await page.keyboard.press("Tab");
    // Keep tabbing until we reach the grid (max 20 tabs to avoid infinite loop)
    for (let i = 0; i < 20; i++) {
      const activeEl = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? el.getAttribute("role") : null;
      });
      if (activeEl === "gridcell" || activeEl === "tab") break;
      await page.keyboard.press("Tab");
    }

    // Verify that focus is now within the calendar (on a tab or gridcell)
    const focusedRole = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.getAttribute("role") : null;
    });
    expect(["tab", "gridcell", "button"]).toContain(focusedRole);
  });

  test("arrow keys move focus between days in month view", async ({
    page,
  }) => {
    const grid = page.locator("[role='grid'][aria-label='Month view']");
    await expect(grid).toBeVisible();

    // Focus the first gridcell
    const firstCell = grid.locator("[role='gridcell']").first();
    await firstCell.focus();

    // Get the initially focused cell
    const initialLabel = await page.evaluate(
      () => document.activeElement?.getAttribute("aria-label") ?? "",
    );

    // Press ArrowRight to move to next day
    await page.keyboard.press("ArrowRight");
    const afterRight = await page.evaluate(
      () => document.activeElement?.getAttribute("aria-label") ?? "",
    );
    expect(afterRight).not.toBe(initialLabel);

    // Press ArrowLeft to go back
    await page.keyboard.press("ArrowLeft");
    const afterLeft = await page.evaluate(
      () => document.activeElement?.getAttribute("aria-label") ?? "",
    );
    expect(afterLeft).toBe(initialLabel);

    // Press ArrowDown to go to next week
    await page.keyboard.press("ArrowDown");
    const afterDown = await page.evaluate(
      () => document.activeElement?.getAttribute("aria-label") ?? "",
    );
    expect(afterDown).not.toBe(initialLabel);
  });

  test("enter on empty slot opens create modal", async ({ page }) => {
    const grid = page.locator("[role='grid'][aria-label='Month view']");
    await expect(grid).toBeVisible();

    // Focus a gridcell
    const cell = grid.locator("[role='gridcell']").first();
    await cell.focus();

    // Press Enter to activate
    await page.keyboard.press("Enter");

    // The "New Event" modal should open
    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("New Event")).toBeVisible();
  });

  test("escape closes any open modal", async ({ page }) => {
    // Open the create modal via sidebar button
    await page.getByRole("button", { name: "New Event" }).click();

    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible();

    // Press Escape to close
    await page.keyboard.press("Escape");

    await expect(dialog).not.toBeVisible();
  });

  test("arrow keys in toolbar switch between view tabs", async ({ page }) => {
    // Focus the currently active tab (Month)
    const monthTab = page.getByRole("tab", { name: "Month" });
    await monthTab.focus();
    await expect(monthTab).toHaveAttribute("aria-selected", "true");

    // Press ArrowRight to switch to Week
    await page.keyboard.press("ArrowRight");

    // The Week tab should now be selected
    const weekTab = page.getByRole("tab", { name: "Week" });
    await expect(weekTab).toHaveAttribute("aria-selected", "true");

    // The week view should be visible
    await expect(
      page.locator("[role='grid'][aria-label='Week view']"),
    ).toBeVisible();

    // Press ArrowRight again to switch to Day
    await page.keyboard.press("ArrowRight");
    const dayTab = page.getByRole("tab", { name: "Day" });
    await expect(dayTab).toHaveAttribute("aria-selected", "true");

    // Press ArrowLeft to go back to Week
    await page.keyboard.press("ArrowLeft");
    await expect(weekTab).toHaveAttribute("aria-selected", "true");
  });
});
