import { test, expect, mockAndLogin } from "./fixtures";

test.describe("Custom movie in collection", () => {
  test("creates a custom movie and sees it in collection", async ({ page }) => {
    await mockAndLogin(page);

    await page.route("**/tmdb/search/multi**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ results: [] }),
      }),
    );

    await page.goto("/auth/search");
    await page.getByRole("textbox", { name: "Search movies, series, genres" }).fill("xyznonexistent");
    await expect(page.getByText("No results found")).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "Add movie/series" }).click();

    const dialog = page.locator('[role="dialog"]');
    await dialog.getByPlaceholder("Movie name").fill("My Custom Movie");
    await dialog.getByRole("button", { name: "Add to collection" }).click();

    await page.goto("/auth/collections");
    await expect(page.getByText("My Custom Movie")).toBeVisible({ timeout: 5000 });
  });

  test("custom movie has negative ID and can be viewed", async ({ page }) => {
    await mockAndLogin(page);

    await page.route("**/tmdb/search/multi**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ results: [] }),
      }),
    );

    await page.goto("/auth/search");
    await page.getByRole("textbox", { name: "Search movies, series, genres" }).fill("xyznonexistent");
    await expect(page.getByText("No results found")).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "Add movie/series" }).click();

    const dialog = page.locator('[role="dialog"]');
    await dialog.getByPlaceholder("Movie name").fill("Test Custom Film");
    await dialog.getByRole("button", { name: "Add to collection" }).click();

    await page.goto("/auth/collections");
    await expect(page.getByText("Test Custom Film")).toBeVisible({ timeout: 5000 });
    await page.getByText("Test Custom Film").first().click();

    await expect(page).toHaveURL(/\/auth\/movies\?id=-\d+&type=movie/);
  });
});