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
    // Get background color of the calendar in light mode
    // If the CSS variable selector doesn't work, use a more general approach
    const demoMain = page.locator(".demo-main");
    await expect(demoMain).toBeVisible();

    const lightBg = await demoMain.evaluate((el) => {
      return getComputedStyle(el).backgroundColor;
    });

    // Toggle dark mode
    await page.getByLabel("Toggle dark mode").click();

    // Wait for CSS transition
    await page.waitForTimeout(300);

    const darkBg = await demoMain.evaluate((el) => {
      return getComputedStyle(el).backgroundColor;
    });

    // The background colors should be different between light and dark modes
    // In some setups the demo-main itself may be transparent, so we also
    // check the overall shell background
    const shellLight = await page.evaluate(() => {
      return getComputedStyle(document.querySelector(".demo-shell")!).backgroundColor;
    });

    await page.getByLabel("Toggle dark mode").click();
    await page.waitForTimeout(300);

    await page.getByLabel("Toggle dark mode").click();
    await page.waitForTimeout(300);

    const shellDark = await page.evaluate(() => {
      return getComputedStyle(document.querySelector(".demo-shell")!).backgroundColor;
    });

    // At least one of the measured colors should differ
    const colorsChanged = lightBg !== darkBg || shellLight !== shellDark;
    expect(colorsChanged).toBe(true);
  });
});
