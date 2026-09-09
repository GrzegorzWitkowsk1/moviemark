import { test, expect, registerUser, loginUser } from "./fixtures";

test.describe("Login", () => {
  test("logs in with valid credentials and redirects to home", async ({ page }) => {
    const creds = await registerUser(page);
    await loginUser(page, creds.email, creds.password);
    await expect(page).toHaveURL("/auth/home");
  });

  test("shows error for wrong password", async ({ page }) => {
    const creds = await registerUser(page);
    await page.goto("/login");
    await page.locator('input[name="email"]').fill(creds.email);
    await page.locator('input[name="password"]').fill("WrongPassword1");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Invalid email or password")).toBeVisible();
  });

  test("shows error for non-existent email", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[name="email"]').fill("nonexistent@test.com");
    await page.locator('input[name="password"]').fill("SomePassword1");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Invalid email or password")).toBeVisible();
  });

  test("navigates to register via 'No account' link", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Don't have an account? Create it!" }).click();
    await page.waitForURL("/register");
  });
});
