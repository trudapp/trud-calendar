import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("[role='toolbar']");
});

test.describe("Dark Mode", () => {
  test("toggle dark mode via the demo header button", async ({ page }) => {
    // Initially, the app should be in light mode (no "dark" class on root)
    const rootDiv = page.locator(".demo-shell").locator("xpath=..");
    const classBeforeToggle = await rootDiv.getAttribute("class");
    expect(classBeforeToggle).not.toContain("dark");

    // Click the dark mode toggle button in the header
    const darkModeBtn = page.getByLabel("Toggle dark mode");
    await darkModeBtn.click();

    // Now the root should have the "dark" class
    const classAfterToggle = await rootDiv.getAttribute("class");
    expect(classAfterToggle).toContain("dark");
  });

  test("verify dark class is applied", async ({ page }) => {
    // Enable dark mode
    const darkModeBtn = page.getByLabel("Toggle dark mode");
    await darkModeBtn.click();

    // Check that the wrapper div has "dark"
    const rootDiv = page.locator(".demo-shell").locator("xpath=..");
    await expect(rootDiv).toHaveClass(/dark/);

    // Toggle back to light mode
    await darkModeBtn.click();
    await expect(rootDiv).not.toHaveClass(/dark/);
  });

  test("calendar colors change appropriately in dark mode", async ({
    page,
  }) => {
    // Measure both demo-main and demo-shell backgrounds in light mode first.
    const measure = () =>
      page.evaluate(() => ({
        main: getComputedStyle(document.querySelector(".demo-main")!).backgroundColor,
        shell: getComputedStyle(document.querySelector(".demo-shell")!).backgroundColor,
      }));

    const light = await measure();

    await page.getByLabel("Toggle dark mode").click();
    await page.waitForTimeout(300);

    const dark = await measure();

    // At least one surface should change colors between light and dark.
    expect(light.main !== dark.main || light.shell !== dark.shell).toBe(true);
  });
});
