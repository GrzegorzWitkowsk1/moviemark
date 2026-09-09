import { test, expect } from "./fixtures";

test.describe("Register", () => {
  test("registers a new user and redirects to login", async ({ page }) => {
    await page.goto("/register");

    await page.locator('input[name="name"]').fill("John");
    await page.locator('input[name="surname"]').fill("Doe");
    await page.locator('input[name="email"]').fill(`register-${Date.now()}@test.com`);
    await page.locator('input[name="password"]').fill("StrongPass1");
    await page.locator('input[name="confirmPassword"]').fill("StrongPass1");

    await page.getByRole("button", { name: "Register" }).click();
    await page.waitForURL("/login");
  });

  test("shows error for duplicate email", async ({ page }) => {
    const email = `dup-${Date.now()}@test.com`;
    await page.goto("/register");

    await page.locator('input[name="name"]').fill("John");
    await page.locator('input[name="surname"]').fill("Doe");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill("StrongPass1");
    await page.locator('input[name="confirmPassword"]').fill("StrongPass1");
    await page.getByRole("button", { name: "Register" }).click();
    await page.waitForURL("/login");

    await page.goto("/register");
    await page.locator('input[name="name"]').fill("John");
    await page.locator('input[name="surname"]').fill("Doe");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill("StrongPass1");
    await page.locator('input[name="confirmPassword"]').fill("StrongPass1");
    await page.getByRole("button", { name: "Register" }).click();

    await expect(page.getByText("Email already registered")).toBeVisible();
  });

  test("shows validation error for short password", async ({ page }) => {
    await page.goto("/register");

    await page.locator('input[name="name"]').fill("John");
    await page.locator('input[name="surname"]').fill("Doe");
    await page.locator('input[name="email"]').fill(`short-${Date.now()}@test.com`);
    await page.locator('input[name="password"]').fill("abc");
    await page.locator('input[name="confirmPassword"]').fill("abc");

    const submitBtn = page.getByRole("button", { name: "Register" });
    await expect(submitBtn).toBeDisabled();
    await expect(page).not.toHaveURL("/login");
  });

  test("navigates to login via 'Already have account' link", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: "Already have an account?" }).click();
    await page.waitForURL("/login");
  });
});
