import { test, expect, mockTmdb } from "./fixtures";

async function continueAsGuest(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue as guest" }).click();
  await page.waitForURL("/auth/home");
}

test.describe("Guest mode", () => {
  test("enters the app without an account and shows the guest banner", async ({
    page,
  }) => {
    await mockTmdb(page);
    await continueAsGuest(page);

    await expect(page.getByText("You are using a guest account")).toBeVisible();
    await expect(page).toHaveURL("/auth/home");
  });

  test("keeps guest data while the session is active", async ({ page }) => {
    await mockTmdb(page);
    await continueAsGuest(page);

    await page.goto("/auth/movies?id=550&type=movie");
    await expect(page.getByText("Fight Club")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Add to watched" }).click();
    await expect(page.getByRole("button", { name: /watched/i })).toBeVisible({
      timeout: 5000,
    });

    await page.goto("/auth/collections");
    await expect(page.getByText("Fight Club")).toBeVisible({ timeout: 10000 });
  });

  test("banner links to the register page", async ({ page }) => {
    await mockTmdb(page);
    await continueAsGuest(page);

    await page
      .getByRole("button", { name: /create account/i })
      .last()
      .click();
    await page.waitForURL("/register");
  });

  test("removes guest data on logout", async ({ page }) => {
    await mockTmdb(page);
    await continueAsGuest(page);

    await page.goto("/auth/movies?id=550&type=movie");
    await expect(page.getByText("Fight Club")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Add to watched" }).click();
    await expect(page.getByRole("button", { name: /watched/i })).toBeVisible({
      timeout: 5000,
    });

    await page.getByRole("button", { name: /account menu/i }).click();
    await page.getByRole("menuitem", { name: /log out/i }).click();
    await page.waitForURL("/login");

    // A fresh guest session must not inherit the previous guest's data
    await continueAsGuest(page);
    await page.goto("/auth/collections");
    await expect(page.getByText("Fight Club")).not.toBeVisible({
      timeout: 10000,
    });
  });

  test("does not require login after closing the tab", async ({
    page,
    context,
  }) => {
    await mockTmdb(page);
    await continueAsGuest(page);

    await page.getByRole("button", { name: /account menu/i }).click();
    await page.getByRole("menuitem", { name: /log out/i }).click();
    await page.waitForURL("/login");

    await page.goto("/auth/collections");
    await page.waitForURL("/login");
    await context.close();
  });

  test("blocks account-only settings for guests", async ({ page }) => {
    await mockTmdb(page);
    await continueAsGuest(page);

    await page.goto("/auth/settings");
    await expect(page.getByText("Change Password")).toBeVisible();
    await expect(
      page.getByText(/Setting a password is not available/i)
    ).toBeVisible();
    await expect(
      page.getByText("Guest accounts cannot change the email address")
    ).toBeVisible();
    await expect(
      page.getByText(/This is a guest account/i)
    ).toBeVisible();
  });
});