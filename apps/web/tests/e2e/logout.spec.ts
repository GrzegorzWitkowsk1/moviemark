import { test, expect, mockAndLogin } from "./fixtures";

test.describe("Logout", () => {
  test("logs out and redirects to /login", async ({ page }) => {
    await mockAndLogin(page);
    await expect(page).toHaveURL("/auth/home");

    // Open avatar menu
    await page.getByRole("button", { name: /account menu/i }).click();

    // Click logout
    await page.getByRole("menuitem", { name: /log out/i }).click();

    await page.waitForURL("/login");
  });

  test("after logout, protected routes redirect to /login", async ({ page }) => {
    await mockAndLogin(page);

    // Logout
    await page.getByRole("button", { name: /account menu/i }).click();
    await page.getByRole("menuitem", { name: /log out/i }).click();
    await page.waitForURL("/login");

    // Try to access protected route
    await page.goto("/auth/home");
    await page.waitForURL("/login");
  });
});
