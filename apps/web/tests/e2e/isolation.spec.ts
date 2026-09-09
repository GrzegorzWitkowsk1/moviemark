import { test, expect, registerUser, loginUser, mockTmdb } from "./fixtures";

test.describe("User data isolation", () => {
  test("user B cannot see user A's collection", async ({ page, browser }) => {
    await mockTmdb(page);

    // User A adds a movie
    const userA = await registerUser(page, { name: "Alice", surname: "A" });
    await loginUser(page, userA.email, userA.password);

    await page.goto("/auth/movies?id=550&type=movie");
    await expect(page.getByText("Fight Club")).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: "Add to watched" }).click();
    await expect(page.getByRole("button", { name: /watched/i })).toBeVisible();

    // User B in a separate context
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await mockTmdb(pageB);

    const userB = await registerUser(pageB, { name: "Bob", surname: "B" });
    await loginUser(pageB, userB.email, userB.password);

    // User B's collection should not contain Fight Club
    await pageB.goto("/auth/collections");
    await expect(pageB.getByText("Fight Club")).not.toBeVisible({ timeout: 5000 });

    await contextB.close();
  });

  test("user B can add the same movie independently", async ({ page, browser }) => {
    await mockTmdb(page);

    const userA = await registerUser(page, { name: "Alice", surname: "A" });
    await loginUser(page, userA.email, userA.password);

    await page.goto("/auth/movies?id=550&type=movie");
    await expect(page.getByText("Fight Club")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Add to watched" }).click();
    await expect(page.getByRole("button", { name: /watched/i })).toBeVisible({ timeout: 5000 });

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await mockTmdb(pageB);

    const userB = await registerUser(pageB, { name: "Bob", surname: "B" });
    await loginUser(pageB, userB.email, userB.password);

    await pageB.goto("/auth/movies?id=550&type=movie");
    await expect(pageB.getByText("Fight Club")).toBeVisible({ timeout: 10000 });
    await pageB.getByRole("button", { name: "Add to watched" }).click();
    await expect(pageB.getByRole("button", { name: /watched/i })).toBeVisible({ timeout: 5000 });

    await page.goto("/auth/movies?id=550&type=movie");
    await page.getByRole("button", { name: /watched/i }).click();

    await pageB.goto("/auth/movies?id=550&type=movie");
    await expect(pageB.getByRole("button", { name: /watched/i })).toBeVisible({ timeout: 5000 });

    await contextB.close();
  });
});
