import { test as base, expect, type Page } from "@playwright/test";
import { mockTmdb } from "./mocks/tmdb";

let userCounter = 0;

function uniqueEmail() {
  userCounter++;
  return `e2e-user${userCounter}-${Date.now()}@test.com`;
}

const DEFAULT_PASSWORD = "TestPass123";

export async function registerUser(
  page: Page,
  opts?: { email?: string; password?: string; name?: string; surname?: string },
) {
  const email = opts?.email ?? uniqueEmail();
  const password = opts?.password ?? DEFAULT_PASSWORD;
  const name = opts?.name ?? "Test";
  const surname = opts?.surname ?? "User";

  await page.goto("/register");
  await page.locator('input[name="name"]').fill(name);
  await page.locator('input[name="surname"]').fill(surname);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="confirmPassword"]').fill(password);
  await page.getByRole("button", { name: "Register" }).click();
  await page.waitForURL("/login");
  return { email, password };
}

export async function loginUser(
  page: Page,
  email: string,
  password: string = DEFAULT_PASSWORD,
) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/auth/home");
}

export async function registerAndLogin(page: Page) {
  const creds = await registerUser(page);
  await loginUser(page, creds.email, creds.password);
  return creds;
}

export async function mockAndLogin(page: Page) {
  await mockTmdb(page);
  return registerAndLogin(page);
}

type TestFixtures = {
  mockAndLogin: () => Promise<{ email: string; password: string }>;
};

export const test = base.extend<TestFixtures>({
  mockAndLogin: async ({ page }, use) => {
    const fn = async () => {
      await mockTmdb(page);
      return registerAndLogin(page);
    };
    await use(fn);
  },
});

export { mockTmdb } from "./mocks/tmdb";
export { expect };
