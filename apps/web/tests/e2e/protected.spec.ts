import { test, expect } from "./fixtures";

test.describe("Protected routes", () => {
  const PROTECTED_ROUTES = [
    "/auth/home",
    "/auth/collections",
    "/auth/search",
    "/auth/settings",
    "/auth/want-to-watch",
    "/auth/movies?id=550&type=movie",
  ];

  for (const route of PROTECTED_ROUTES) {
    test(`redirects to /login when visiting ${route} unauthenticated`, async ({
      page,
    }) => {
      await page.goto(route);
      await page.waitForURL("/login");
      expect(page.url()).toContain("/login");
    });
  }

  test("redirects to /auth/home when visiting /login while authenticated", async ({
    page,
    mockAndLogin,
  }) => {
    await mockAndLogin();
    await page.goto("/auth/home");
    await page.waitForURL("/auth/home");
    await page.goto("/login");
    await page.waitForURL("/auth/home");
  });

  test("redirects to /auth/home when visiting /register while authenticated", async ({
    page,
    mockAndLogin,
  }) => {
    await mockAndLogin();
    await page.goto("/auth/home");
    await page.waitForURL("/auth/home");
    await page.goto("/register");
    await page.waitForURL("/auth/home");
  });
});
