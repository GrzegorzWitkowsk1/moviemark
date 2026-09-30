import { test, expect } from "./fixtures";

const HEALTH = "**/health";

test.describe("Cold start", () => {
  test("waits on the loading screen while the API is waking up", async ({
    page,
  }) => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    await page.route(HEALTH, async (route) => {
      await gate;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ok" }),
      });
    });

    await page.goto("/login");

    const status = page.getByRole("status");
    await expect(status).toBeVisible();
    await expect(page.getByText("Checking connection...")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toHaveCount(0);

    release();

    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(status).toHaveCount(0);
  });

  test("keeps polling through 502s until the API answers", async ({ page }) => {
    let attempts = 0;

    await page.route(HEALTH, async (route) => {
      attempts += 1;
      if (attempts < 3) {
        await route.fulfill({
          status: 502,
          contentType: "text/html",
          body: "<html><body>502 Bad Gateway</body></html>",
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ok" }),
      });
    });

    await page.goto("/login");

    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    expect(attempts).toBe(3);
  });

  test("stays on the loading screen instead of dropping the user at /login", async ({
    page,
  }) => {
    let attempts = 0;

    await page.route(HEALTH, async (route) => {
      attempts += 1;
      await route.fulfill({
        status: 502,
        contentType: "text/html",
        body: "<html><body>502 Bad Gateway</body></html>",
      });
    });

    await page.goto("/login");

    await expect(page.getByRole("status")).toBeVisible();
    await page.waitForTimeout(6000);

    expect(attempts).toBeGreaterThan(1);
    await expect(page.getByRole("status")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveCount(0);
  });
});
