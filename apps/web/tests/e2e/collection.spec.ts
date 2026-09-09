import { test, expect, mockAndLogin } from "./fixtures";

test.describe("Collection - add and remove movie", () => {
  test("adds a movie to collection and sees it on collection page", async ({ page }) => {
    await mockAndLogin(page);

    // Navigate to movie details
    await page.goto("/auth/movies?id=550&type=movie");
    await expect(page.getByText("Fight Club")).toBeVisible({ timeout: 5000 });

    // Mark as watched
    await page.getByRole("button", { name: "Add to watched" }).click();
    await expect(page.getByRole("button", { name: /watched/i })).toBeVisible();

    // Navigate to collection
    await page.goto("/auth/collections");
    await expect(page.getByText("Fight Club")).toBeVisible({ timeout: 5000 });
  });

  test("removes a movie from collection", async ({ page }) => {
    await mockAndLogin(page);

    // Add movie
    await page.goto("/auth/movies?id=550&type=movie");
    await expect(page.getByText("Fight Club")).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: "Add to watched" }).click();
    await expect(page.getByRole("button", { name: /watched/i })).toBeVisible();

    // Remove movie
    await page.getByRole("button", { name: /watched/i }).click();
    await expect(page.getByRole("button", { name: /add to watched/i })).toBeVisible();

    // Verify it's gone from collection
    await page.goto("/auth/collections");
    await expect(page.getByText("Fight Club")).not.toBeVisible({ timeout: 5000 });
  });
});
