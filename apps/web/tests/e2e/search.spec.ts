import { test, expect, mockAndLogin } from "./fixtures";

test.describe("Search movie", () => {
  test("shows results when searching for a movie", async ({ page }) => {
    await mockAndLogin(page);

    await page.goto("/auth/search");
    await page.getByRole("textbox", { name: "Search movies, series, genres" }).fill("Fight Club");

    // Wait for debounced results
    await expect(page.getByText("Fight Club")).toBeVisible({ timeout: 5000 });
  });

  test("navigates to details page when clicking a result", async ({ page }) => {
    await mockAndLogin(page);

    await page.goto("/auth/search");
    await page.getByRole("textbox", { name: "Search movies, series, genres" }).fill("Fight Club");
    await expect(page.getByText("Fight Club")).toBeVisible({ timeout: 5000 });

    await page.getByText("Fight Club").first().click();
    await expect(page).toHaveURL(/\/auth\/movies\?id=550&type=movie/);
  });

  test("shows no-results state for empty search", async ({ page }) => {
    await mockAndLogin(page);
    // Override search to return empty
    await page.route("**/tmdb/search/multi**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ results: [] }),
      }),
    );

    await page.goto("/auth/search");
    await page.getByRole("textbox", { name: "Search movies, series, genres" }).fill("xyznonexistent");

    await expect(page.getByText(/no results/i)).toBeVisible({ timeout: 5000 });
  });
});
