import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Clear localStorage to reset demo state, then navigate
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("[role='toolbar']");
});

test.describe("Navigation", () => {
  test("calendar renders with month view by default", async ({ page }) => {
    // The month view grid should be visible
    const monthGrid = page.locator("[role='grid'][aria-label='Month view']");
    await expect(monthGrid).toBeVisible();

    // The "Month" tab should be selected
    const monthTab = page.getByRole("tab", { name: "Month" });
    await expect(monthTab).toHaveAttribute("aria-selected", "true");
  });

  test("click Today button navigates to current month", async ({ page }) => {
    const toolbar = page.locator("[role='toolbar']");

    // Get the current displayed month title
    const titleBefore = await toolbar.locator("h2").textContent();

    // Navigate forward a month
    await page.getByLabel("Next").click();
    const titleAfterNext = await toolbar.locator("h2").textContent();
    expect(titleAfterNext).not.toBe(titleBefore);

    // Click "Today" to return
    await page.getByLabel("Today").click();
    const titleAfterToday = await toolbar.locator("h2").textContent();
    expect(titleAfterToday).toBe(titleBefore);
  });

  test("click prev/next arrows changes month", async ({ page }) => {
    const toolbar = page.locator("[role='toolbar']");
    const titleBefore = await toolbar.locator("h2").textContent();

    // Click next
    await page.getByLabel("Next").click();
    const titleAfterNext = await toolbar.locator("h2").textContent();
    expect(titleAfterNext).not.toBe(titleBefore);

    // Click prev twice to go before original
    await page.getByLabel("Previous").click();
    const titleAfterPrev1 = await toolbar.locator("h2").textContent();
    expect(titleAfterPrev1).toBe(titleBefore);

    await page.getByLabel("Previous").click();
    const titleAfterPrev2 = await toolbar.locator("h2").textContent();
    expect(titleAfterPrev2).not.toBe(titleBefore);
  });

  test("click Week/Day/Agenda tabs switches view", async ({ page }) => {
    // Switch to Week view
    await page.getByRole("tab", { name: "Week" }).click();
    await expect(
      page.locator("[role='grid'][aria-label='Week view']"),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Week" }),
    ).toHaveAttribute("aria-selected", "true");

    // Switch to Day view
    await page.getByRole("tab", { name: "Day" }).click();
    // Day view reuses WeekView with singleDay prop, still labeled "Week view"
    await expect(
      page.locator("[role='grid'][aria-label='Week view']"),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Day" }),
    ).toHaveAttribute("aria-selected", "true");

    // Switch to Agenda view
    await page.getByRole("tab", { name: "Agenda" }).click();
    await expect(
      page.locator("[role='list'][aria-label='Agenda view']"),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Agenda" }),
    ).toHaveAttribute("aria-selected", "true");

    // Switch back to Month view
    await page.getByRole("tab", { name: "Month" }).click();
    await expect(
      page.locator("[role='grid'][aria-label='Month view']"),
    ).toBeVisible();
  });

  test("calendar shows correct month title", async ({ page }) => {
    const toolbar = page.locator("[role='toolbar']");
    const title = await toolbar.locator("h2").textContent();

    // The title should contain the current month name (e.g., "March 2026")
    const now = new Date();
    const expectedMonth = now.toLocaleString("en-US", { month: "long" });
    const expectedYear = now.getFullYear().toString();

    expect(title).toContain(expectedMonth);
    expect(title).toContain(expectedYear);
  });
});
