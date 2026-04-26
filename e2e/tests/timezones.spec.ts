import { test, expect } from "@playwright/test";

// Pin browser TZ so wall-clock-based assertions are deterministic across machines.
// Sample events use d(offset, hour, 0) which produces local wall-clock times.
test.use({ timezoneId: "America/New_York" });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("[role='toolbar']");
});

const anchorToggle = (page: import("@playwright/test").Page, state: "On" | "Off") =>
  page
    .locator("aside label", { hasText: "Anchor events to NY" })
    .locator("xpath=..")
    .getByRole("button", { name: state, exact: true });

test.describe("Timezones — display zone selector", () => {
  test("display timezone selector is present in General tab with all 8 zones", async ({ page }) => {
    const select = page.getByTestId("display-timezone");
    await expect(select).toBeVisible();
    const optionValues = await select.locator("option").evaluateAll((opts) =>
      opts.map((o) => (o as HTMLOptionElement).value),
    );
    expect(optionValues).toEqual([
      "browser",
      "UTC",
      "America/New_York",
      "America/Los_Angeles",
      "Europe/Berlin",
      "Asia/Tokyo",
      "Asia/Kolkata",
      "Australia/Sydney",
    ]);
  });

  test("changing display timezone persists to localStorage", async ({ page }) => {
    await page.getByTestId("display-timezone").selectOption("Asia/Tokyo");
    const stored = await page.evaluate(() => localStorage.getItem("trc-displayTz"));
    expect(stored).toBe('"Asia/Tokyo"');
  });

  test("display timezone preference survives reload", async ({ page }) => {
    await page.getByTestId("display-timezone").selectOption("Europe/Berlin");
    await page.reload();
    await page.waitForSelector("[role='toolbar']");
    await expect(page.getByTestId("display-timezone")).toHaveValue("Europe/Berlin");
  });

  test("floating events show literal wall-clock regardless of display zone", async ({
    page,
  }) => {
    // OKR event is a floating event at 9:00 (no timezone). It should display as
    // 9:00 AM in any display zone because anchor mode is off.
    await page.getByRole("tab", { name: "Week" }).click();
    const okr = page.locator('[data-event-id="evt-13"]');
    await expect(okr).toContainText("9:00 AM");

    await page.getByTestId("display-timezone").selectOption("Asia/Tokyo");
    await expect(okr).toContainText("9:00 AM");

    await page.getByTestId("display-timezone").selectOption("UTC");
    await expect(okr).toContainText("9:00 AM");
  });
});

test.describe("Timezones — anchored events", () => {
  test("anchor toggle persists to localStorage", async ({ page }) => {
    await page.getByRole("button", { name: "Resources" }).click();
    await anchorToggle(page, "On").click();
    const stored = await page.evaluate(() => localStorage.getItem("trc-anchor"));
    expect(stored).toBe("true");
  });

  test("anchored event in NY display zone shows its original wall-clock", async ({
    page,
  }) => {
    // OKR event was created at 9:00 wall-clock in browser TZ (= America/New_York).
    // After enabling anchor mode it gets timeZone: "America/New_York", so
    // displaying it in NY zone keeps the same 9:00 AM label.
    await page.getByRole("tab", { name: "Week" }).click();
    await page.getByRole("button", { name: "Resources" }).click();
    await anchorToggle(page, "On").click();

    await page.getByRole("button", { name: "General" }).click();
    await page.getByTestId("display-timezone").selectOption("America/New_York");

    const okr = page.locator('[data-event-id="evt-13"]');
    await expect(okr).toContainText("9:00 AM");
  });

  test("anchored event converts label when display zone changes (NY → UTC)", async ({
    page,
  }) => {
    await page.getByRole("tab", { name: "Week" }).click();
    await page.getByRole("button", { name: "Resources" }).click();
    await anchorToggle(page, "On").click();

    await page.getByRole("button", { name: "General" }).click();
    await page.getByTestId("display-timezone").selectOption("UTC");

    // NY 9:00 AM EDT (April, DST) = UTC 13:00 = 1:00 PM
    const okr = page.locator('[data-event-id="evt-13"]');
    await expect(okr).toContainText("1:00 PM");
  });

  test("anchored event converts label across half-hour offset zone (NY → Kolkata)", async ({
    page,
  }) => {
    await page.getByRole("tab", { name: "Week" }).click();
    await page.getByRole("button", { name: "Resources" }).click();
    await anchorToggle(page, "On").click();

    await page.getByRole("button", { name: "General" }).click();
    await page.getByTestId("display-timezone").selectOption("Asia/Kolkata");

    // NY 9:00 AM EDT = UTC 13:00 = Kolkata 18:30 = 6:30 PM
    const okr = page.locator('[data-event-id="evt-13"]');
    await expect(okr).toContainText("6:30 PM");
  });

  test("toggling anchor off restores wall-clock label", async ({ page }) => {
    await page.getByRole("tab", { name: "Week" }).click();
    await page.getByRole("button", { name: "Resources" }).click();
    await anchorToggle(page, "On").click();

    await page.getByRole("button", { name: "General" }).click();
    await page.getByTestId("display-timezone").selectOption("Asia/Tokyo");

    const okr = page.locator('[data-event-id="evt-13"]');
    await expect(okr).toContainText("10:00 PM");

    await page.getByRole("button", { name: "Resources" }).click();
    await anchorToggle(page, "Off").click();
    await expect(okr).toContainText("9:00 AM");
  });

  test("anchored event renders at the converted GEOMETRY position (Phase 6.7)", async ({
    page,
  }) => {
    // Capture the row geometry of "9 AM" and "10 PM" in week view's time
    // gutter, then assert the anchored event's top is closer to the converted
    // hour, not the literal one. NY 9:00 AM EDT → Tokyo 10:00 PM (22:00).
    await page.getByRole("tab", { name: "Week" }).click();
    await page.getByRole("button", { name: "Resources" }).click();
    await anchorToggle(page, "On").click();
    await page.getByRole("button", { name: "General" }).click();
    await page.getByTestId("display-timezone").selectOption("Asia/Tokyo");

    const okr = page.locator('[data-event-id="evt-13"]');
    await expect(okr).toBeVisible();

    const geometry = await page.evaluate(() => {
      const grid = document.querySelector(
        "[role='grid'][aria-label='Week view']",
      );
      if (!grid) return null;
      const labels = Array.from(grid.querySelectorAll("div")).filter((d) =>
        /^\d{1,2}\s*(AM|PM)$/.test(d.textContent?.trim() || ""),
      );
      const find = (text: string) =>
        labels.find((l) => l.textContent?.trim() === text)?.getBoundingClientRect();
      const okr = document.querySelector('[data-event-id="evt-13"]');
      return {
        nine: find("9 AM")?.top ?? null,
        twentyTwo: find("10 PM")?.top ?? null,
        okrTop: (okr as HTMLElement | null)?.getBoundingClientRect().top ?? null,
      };
    });

    expect(geometry).not.toBeNull();
    expect(geometry!.nine).not.toBeNull();
    expect(geometry!.twentyTwo).not.toBeNull();
    expect(geometry!.okrTop).not.toBeNull();

    // The event should sit close to the 10 PM row (within one row height ≈
    // 40px) and far from the literal 9 AM row.
    const distToTen = Math.abs(geometry!.okrTop! - geometry!.twentyTwo!);
    const distToNine = Math.abs(geometry!.okrTop! - geometry!.nine!);
    expect(distToTen).toBeLessThan(40);
    expect(distToNine).toBeGreaterThan(distToTen);
  });
});
