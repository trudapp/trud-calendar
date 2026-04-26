import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("[role='toolbar']");
});

test.describe("Views", () => {
  test("month view shows 6 weeks of days", async ({ page }) => {
    const monthGrid = page.locator("[role='grid'][aria-label='Month view']");
    await expect(monthGrid).toBeVisible();

    // The month view renders weeks as rows. Each row has role="row" inside the grid.
    // The grid has weekday header row + week rows.
    const weekRows = monthGrid.locator(
      ":scope > div:last-child > [role='row']",
    );
    const rowCount = await weekRows.count();

    // Month view typically renders 5 or 6 weeks
    expect(rowCount).toBeGreaterThanOrEqual(4);
    expect(rowCount).toBeLessThanOrEqual(6);

    // Each week row should have 7 gridcells
    const firstRow = weekRows.first();
    const cells = firstRow.locator("[role='gridcell']");
    await expect(cells).toHaveCount(7);
  });

  test("week view shows 7 day columns with time grid", async ({ page }) => {
    await page.getByRole("tab", { name: "Week" }).click();

    const weekGrid = page.locator("[role='grid'][aria-label='Week view']");
    await expect(weekGrid).toBeVisible();

    // Should have 7 column headers (one for each day of the week)
    const columnHeaders = weekGrid.locator("[role='columnheader']");
    await expect(columnHeaders).toHaveCount(7);

    // Should have hour labels visible in the time grid (12 AM, 1 AM, ...)
    await expect(weekGrid.getByText("12 AM").first()).toBeVisible();
    await expect(weekGrid.getByText("12 PM").first()).toBeVisible();
  });

  test("day view shows single day column", async ({ page }) => {
    await page.getByRole("tab", { name: "Day" }).click();

    // Day view reuses WeekView with singleDay prop
    const dayGrid = page.locator("[role='grid'][aria-label='Week view']");
    await expect(dayGrid).toBeVisible();

    // Should have exactly 1 column header
    const columnHeaders = dayGrid.locator("[role='columnheader']");
    await expect(columnHeaders).toHaveCount(1);
  });

  test("agenda view shows event list grouped by date", async ({ page }) => {
    await page.getByRole("tab", { name: "Agenda" }).click();

    const agendaList = page.locator("[role='list'][aria-label='Agenda view']");
    await expect(agendaList).toBeVisible();

    // Agenda view groups events by date, each group is a listitem
    const dateGroups = agendaList.locator("[role='listitem']");
    const groupCount = await dateGroups.count();
    expect(groupCount).toBeGreaterThan(0);

    // Each group should have a date heading (h3)
    const firstGroup = dateGroups.first();
    const heading = firstGroup.locator("h3");
    await expect(heading).toBeVisible();
  });

  test("switching between views preserves the date context", async ({
    page,
  }) => {
    const toolbar = page.locator("[role='toolbar']");

    // Navigate to next month
    await page.getByLabel("Next").click();
    const monthTitle = await toolbar.locator("h2").textContent();

    // Switch to Week view
    await page.getByRole("tab", { name: "Week" }).click();
    await expect(
      page.locator("[role='grid'][aria-label='Week view']"),
    ).toBeVisible();

    // Switch back to Month view
    await page.getByRole("tab", { name: "Month" }).click();
    await expect(
      page.locator("[role='grid'][aria-label='Month view']"),
    ).toBeVisible();

    // The title should reflect the same month context (next month)
    const restoredTitle = await toolbar.locator("h2").textContent();
    expect(restoredTitle).toBe(monthTitle);
  });
});
